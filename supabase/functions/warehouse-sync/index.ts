import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ExcelRow {
  [key: string]: string | number | null;
}

interface SyncResult {
  success: boolean;
  syncId: string;
  recordsProcessed: number;
  recordsAdded: number;
  recordsUpdated: number;
  recordsSkipped: number;
  error?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // TODO: Re-enable when Egnyte integration is ready
    const egnyteToken = Deno.env.get("EGNYTE_ACCESS_TOKEN");
    const egnyteDomain = Deno.env.get("EGNYTE_DOMAIN");

    if (!egnyteToken || !egnyteDomain) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Egnyte integration not configured. Please set up Egnyte credentials in API Integrations."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const filePath = "/Shared/Warehouse/Warehouse Pull Spreadsheet V28.xlsm";

    const { data: syncRecord, error: syncError } = await supabase
      .from("warehouse_sync_history")
      .insert({
        status: "running",
        file_name: "Warehouse Pull Spreadsheet V28.xlsm",
        file_path: filePath,
        sync_mode: "full_replace",
        triggered_by: user.id,
      })
      .select()
      .single();

    if (syncError) {
      throw new Error(`Failed to create sync record: ${syncError.message}`);
    }

    const egnyteApiUrl = `https://${egnyteDomain}.egnyte.com/pubapi/v1/fs${filePath}`;

    const fileResponse = await fetch(egnyteApiUrl, {
      headers: {
        Authorization: `Bearer ${egnyteToken}`,
      },
    });

    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file from Egnyte: ${fileResponse.statusText}`);
    }

    const fileBlob = await fileResponse.blob();
    const arrayBuffer = await fileBlob.arrayBuffer();

    const XLSX = await import("npm:xlsx@0.18.5");
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: null
    });

    console.log(`Parsed ${jsonData.length} rows from Excel`);

    let recordsAdded = 0;
    let recordsUpdated = 0;
    let recordsSkipped = 0;

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const excelRowNumber = i + 2;

      try {
        const partNumber = row["Part Number"] || row["part_number"] || `AUTO-${Date.now()}-${i}`;
        const partName = row["Part Name"] || row["part_name"] || row["Description"] || "Unknown Part";
        const category = row["Category"] || row["category"] || "Other";
        const manufacturer = row["Manufacturer"] || row["manufacturer"] || null;
        const supplier = row["Supplier"] || row["supplier"] || null;
        const quantityOnHand = parseInt(String(row["Quantity"] || row["quantity_on_hand"] || row["Qty"] || 0));
        const unitCost = parseFloat(String(row["Unit Cost"] || row["unit_cost"] || row["Cost"] || 0));
        const location = row["Location"] || row["location"] || row["Warehouse Location"] || null;

        const { data: existing, error: checkError } = await supabase
          .from("service_parts")
          .select("id")
          .eq("excel_row_number", excelRowNumber)
          .eq("egnyte_source_file", filePath)
          .maybeSingle();

        if (checkError) {
          console.error(`Error checking existing record for row ${excelRowNumber}:`, checkError);
          recordsSkipped++;
          continue;
        }

        const partData = {
          part_number: String(partNumber),
          part_name: String(partName),
          category: String(category),
          manufacturer: manufacturer ? String(manufacturer) : null,
          supplier: supplier ? String(supplier) : null,
          quantity_on_hand: quantityOnHand,
          unit_cost: unitCost > 0 ? unitCost : null,
          unit_price: unitCost > 0 ? unitCost * 1.5 : null,
          location: location ? String(location) : null,
          status: "active",
          excel_row_number: excelRowNumber,
          last_synced_from_excel_at: new Date().toISOString(),
          egnyte_source_file: filePath,
          sync_source: "excel_sync",
          reorder_level: 10,
          reorder_quantity: 25,
        };

        if (existing) {
          const { error: updateError } = await supabase
            .from("service_parts")
            .update(partData)
            .eq("id", existing.id);

          if (updateError) {
            console.error(`Error updating row ${excelRowNumber}:`, updateError);
            recordsSkipped++;
          } else {
            recordsUpdated++;
          }
        } else {
          const { error: insertError } = await supabase
            .from("service_parts")
            .insert(partData);

          if (insertError) {
            console.error(`Error inserting row ${excelRowNumber}:`, insertError);
            recordsSkipped++;
          } else {
            recordsAdded++;
          }
        }
      } catch (rowError) {
        console.error(`Error processing row ${excelRowNumber}:`, rowError);
        recordsSkipped++;
      }
    }

    await supabase
      .from("warehouse_sync_history")
      .update({
        status: "completed",
        sync_completed_at: new Date().toISOString(),
        records_processed: jsonData.length,
        records_added: recordsAdded,
        records_updated: recordsUpdated,
        records_skipped: recordsSkipped,
      })
      .eq("id", syncRecord.id);

    const result: SyncResult = {
      success: true,
      syncId: syncRecord.id,
      recordsProcessed: jsonData.length,
      recordsAdded,
      recordsUpdated,
      recordsSkipped,
    };

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Warehouse sync error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Salesforce-Signature",
};

interface SalesforceWebhookPayload {
  event: {
    type: string;
    createdDate: string;
  };
  data: {
    schema: string;
    payload: any;
    event: {
      replayId: number;
    };
  };
}

interface OutboundMessagePayload {
  organizationId: string;
  actionId: string;
  sessionId: string;
  enterpriseUrl: string;
  partnerUrl: string;
  Notification: Array<{
    Id: string;
    sObject: any;
  }>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const url = new URL(req.url);
    const webhookType = url.searchParams.get("type") || "platform_event";

    // Get the raw body
    const body = await req.text();
    console.log("Received webhook:", body);

    // Handle different webhook types
    if (webhookType === "platform_event") {
      // Salesforce Platform Event
      const payload: SalesforceWebhookPayload = JSON.parse(body);
      const eventData = payload.data.payload;
      
      // Extract object type and data
      const objectType = eventData.ObjectType__c || "Unknown";
      const recordId = eventData.RecordId__c;
      const operationType = eventData.OperationType__c || "update"; // create, update, delete

      console.log(`Platform Event: ${operationType} on ${objectType} (${recordId})`);

      // Determine which table to update
      const tableMapping: Record<string, string> = {
        "Lead": "leads",
        "Account": "accounts",
        "Contact": "salesforce_contacts",
        "Opportunity": "opportunities",
        "Case": "cases",
      };

      const supabaseTable = tableMapping[objectType];
      if (!supabaseTable) {
        console.log(`No mapping found for object type: ${objectType}`);
        return new Response(
          JSON.stringify({ success: true, message: "No mapping configured" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Handle the operation
      if (operationType === "delete") {
        // Soft delete or mark as deleted
        await supabase
          .from(supabaseTable)
          .update({ 
            IsDeleted: true,
            updated_at: new Date().toISOString() 
          })
          .eq("Id", recordId);
      } else {
        // Create or update - the complete record should be in eventData.RecordData__c
        const recordData = eventData.RecordData__c ? JSON.parse(eventData.RecordData__c) : {};
        
        await supabase
          .from(supabaseTable)
          .upsert({
            ...recordData,
            Id: recordId,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "Id",
            ignoreDuplicates: false,
          });
      }

      // Log the sync
      await supabase.from("salesforce_sync_logs").insert({
        organization_id: eventData.OrganizationId__c,
        salesforce_object: objectType,
        log_level: "info",
        message: `Webhook ${operationType} for ${objectType} ${recordId}`,
        records_processed: 1,
        records_inserted: operationType !== "delete" ? 1 : 0,
      });

      return new Response(
        JSON.stringify({ success: true, message: "Event processed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (webhookType === "outbound_message") {
      // Salesforce Outbound Message (SOAP format)
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(body, "text/xml");
      
      // Extract notification elements
      const notifications = xmlDoc.getElementsByTagName("Notification");
      
      for (let i = 0; i < notifications.length; i++) {
        const notification = notifications[i];
        const sObject = notification.getElementsByTagName("sObject")[0];
        
        if (sObject) {
          const objectType = sObject.getElementsByTagName("type")[0]?.textContent || "Unknown";
          const id = sObject.getElementsByTagName("Id")[0]?.textContent;
          
          // Extract all fields from sObject
          const recordData: any = {};
          const fields = sObject.childNodes;
          
          for (let j = 0; j < fields.length; j++) {
            const field = fields[j] as Element;
            if (field.tagName && field.tagName !== "type") {
              recordData[field.tagName] = field.textContent;
            }
          }

          // Map to Supabase table
          const tableMapping: Record<string, string> = {
            "Lead": "leads",
            "Account": "accounts",
            "Contact": "salesforce_contacts",
            "Opportunity": "opportunities",
            "Case": "cases",
          };

          const supabaseTable = tableMapping[objectType];
          if (supabaseTable) {
            await supabase
              .from(supabaseTable)
              .upsert({
                ...recordData,
                updated_at: new Date().toISOString(),
              }, {
                onConflict: "Id",
                ignoreDuplicates: false,
              });

            console.log(`Outbound Message: Updated ${objectType} ${id}`);
          }
        }
      }

      // Return SOAP acknowledgment
      const soapResponse = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <notificationsResponse xmlns="http://soap.sforce.com/2005/09/outbound">
      <Ack>true</Ack>
    </notificationsResponse>
  </soapenv:Body>
</soapenv:Envelope>`;

      return new Response(soapResponse, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/xml",
        },
      });
    }

    if (webhookType === "change_data_capture") {
      // Salesforce Change Data Capture
      const payload = JSON.parse(body);
      const changeEvents = payload.changeEvents || [payload];

      for (const event of changeEvents) {
        const { entityName, changeType, changedFields } = event;
        const recordIds = event.recordIds || [];

        console.log(`CDC Event: ${changeType} on ${entityName}`);

        // Map entity to table
        const tableMapping: Record<string, string> = {
          "Lead": "leads",
          "Account": "accounts",
          "Contact": "salesforce_contacts",
          "Opportunity": "opportunities",
          "Case": "cases",
        };

        const supabaseTable = tableMapping[entityName];
        if (!supabaseTable) continue;

        if (changeType === "DELETE") {
          for (const recordId of recordIds) {
            await supabase
              .from(supabaseTable)
              .update({ 
                IsDeleted: true,
                updated_at: new Date().toISOString() 
              })
              .eq("Id", recordId);
          }
        } else {
          // For CREATE/UPDATE, we need to fetch the full record
          // This is typically done via a follow-up API call
          console.log(`Need to fetch full record for ${recordIds.join(", ")}`);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "CDC events processed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Unknown webhook type: ${webhookType}`);
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

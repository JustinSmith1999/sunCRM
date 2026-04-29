import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function soapLogin(username: string, password: string) {
  const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:enterprise.soap.sforce.com">
  <soapenv:Body>
    <urn:login>
      <urn:username>${username}</urn:username>
      <urn:password>${password}</urn:password>
    </urn:login>
  </soapenv:Body>
</soapenv:Envelope>`;

  const response = await fetch('https://login.salesforce.com/services/Soap/c/58.0', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml',
      'SOAPAction': 'login'
    },
    body: soapBody
  });

  if (!response.ok) {
    throw new Error(`SOAP login failed: ${await response.text()}`);
  }

  const xmlText = await response.text();
  const sessionIdMatch = xmlText.match(/<sessionId>([^<]+)<\/sessionId>/);
  const serverUrlMatch = xmlText.match(/<serverUrl>([^<]+)<\/serverUrl>/);

  if (!sessionIdMatch || !serverUrlMatch) {
    throw new Error('Failed to parse SOAP response');
  }

  const instanceUrl = serverUrlMatch[1].match(/https:\/\/[^\/]+/)?.[0];

  return {
    sessionId: sessionIdMatch[1],
    instanceUrl: instanceUrl || 'https://sunation.my.salesforce.com'
  };
}

async function fetchSalesforceReports(sessionId: string, instanceUrl: string) {
  console.log('Fetching reports list from Salesforce using SOQL...');

  let allReports: any[] = [];
  let nextRecordsUrl = null;

  // Use SOQL to query all reports
  const query = encodeURIComponent("SELECT Id, Name, Description, FolderName, OwnerId, CreatedDate, LastModifiedDate, DeveloperName FROM Report");
  let queryUrl = `${instanceUrl}/services/data/v58.0/query?q=${query}`;

  do {
    const url = nextRecordsUrl ? `${instanceUrl}${nextRecordsUrl}` : queryUrl;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${sessionId}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch reports: ${errorText}`);
    }

    const data = await response.json();

    if (data.records && data.records.length > 0) {
      // Transform SOQL results to match expected format
      const transformedReports = data.records.map((record: any) => ({
        id: record.Id,
        name: record.Name,
        description: record.Description,
        folderName: record.FolderName,
        ownerId: record.OwnerId,
        createdDate: record.CreatedDate,
        lastModifiedDate: record.LastModifiedDate,
        developerName: record.DeveloperName
      }));

      allReports = allReports.concat(transformedReports);
    }

    nextRecordsUrl = data.nextRecordsUrl || null;
    console.log(`Fetched ${allReports.length} reports so far...`);

  } while (nextRecordsUrl);

  console.log(`Found ${allReports.length} total reports`);
  return allReports;
}

async function fetchReportMetadata(sessionId: string, instanceUrl: string, reportId: string) {
  console.log(`Fetching metadata for report ${reportId}...`);

  const response = await fetch(`${instanceUrl}/services/data/v58.0/analytics/reports/${reportId}/describe`, {
    headers: {
      'Authorization': `Bearer ${sessionId}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.warn(`Could not fetch metadata for report ${reportId}: ${errorText}`);
    return null;
  }

  return await response.json();
}

function mapSalesforceReportType(sfFormat: string): string {
  const typeMap: Record<string, string> = {
    'TABULAR': 'tabular',
    'SUMMARY': 'summary',
    'MATRIX': 'summary',
    'JOINED': 'summary'
  };

  return typeMap[sfFormat] || 'tabular';
}

function extractReportColumns(metadata: any): string[] {
  const columns: string[] = [];

  if (metadata?.reportMetadata?.detailColumns) {
    columns.push(...metadata.reportMetadata.detailColumns);
  }

  if (metadata?.reportExtendedMetadata?.detailColumnInfo) {
    const columnInfo = metadata.reportExtendedMetadata.detailColumnInfo;
    Object.keys(columnInfo).forEach(key => {
      if (!columns.includes(key)) {
        columns.push(key);
      }
    });
  }

  return columns;
}

function extractReportFilters(metadata: any): any[] {
  const filters: any[] = [];

  if (metadata?.reportMetadata?.reportFilters) {
    metadata.reportMetadata.reportFilters.forEach((filter: any) => {
      filters.push({
        field: filter.column || filter.field,
        operator: filter.operator || '=',
        value: filter.value || ''
      });
    });
  }

  return filters;
}

function extractReportGrouping(metadata: any): any {
  const grouping: any = {
    groupBy: [],
    aggregations: []
  };

  if (metadata?.reportMetadata?.groupingsDown) {
    grouping.groupBy = metadata.reportMetadata.groupingsDown.map((g: any) => g.name || g);
  }

  if (metadata?.reportMetadata?.groupingsAcross) {
    const acrossGroups = metadata.reportMetadata.groupingsAcross.map((g: any) => g.name || g);
    grouping.groupBy.push(...acrossGroups);
  }

  if (metadata?.reportMetadata?.aggregates) {
    metadata.reportMetadata.aggregates.forEach((agg: any) => {
      grouping.aggregations.push({
        field: agg.column || agg.field || 'Id',
        function: agg.aggregateType?.toLowerCase() || 'count'
      });
    });
  }

  if (grouping.aggregations.length === 0 && grouping.groupBy.length > 0) {
    grouping.aggregations.push({
      field: 'Id',
      function: 'count'
    });
  }

  return grouping;
}

function extractSourceObject(metadata: any): string {
  if (metadata?.reportMetadata?.reportType?.type) {
    const reportType = metadata.reportMetadata.reportType.type;

    const objectMap: Record<string, string> = {
      'Opportunity': 'opportunities',
      'Lead': 'leads',
      'Account': 'accounts',
      'Contact': 'salesforce_contacts',
      'Case': 'salesforce_cases',
      'Campaign': 'salesforce_campaigns',
      'Task': 'salesforce_tasks',
      'Event': 'salesforce_events'
    };

    return objectMap[reportType] || 'leads';
  }

  return 'leads';
}

async function syncReports(supabase: any, sessionId: string, instanceUrl: string, userId: string) {
  const reports = await fetchSalesforceReports(sessionId, instanceUrl);

  let imported = 0;
  let failed = 0;
  const errors: any[] = [];

  console.log(`\nProcessing ${reports.length} reports (fast mode - no metadata fetch)...`);
  console.log('Report metadata will be populated when reports are first viewed.\n');

  // Process in large batches (no metadata fetching = much faster)
  const batchSize = 100;

  for (let i = 0; i < reports.length; i += batchSize) {
    const batch = reports.slice(i, Math.min(i + batchSize, reports.length));

    try {
      console.log(`[${i + 1}-${Math.min(i + batchSize, reports.length)}/${reports.length}] Processing batch...`);

      const reportDataBatch = batch.map((report: any) => ({
        salesforce_id: report.id,
        name: report.name,
        description: report.description || null,
        report_type: 'tabular',
        entity_type: 'leads',
        source_object: 'leads',
        columns: JSON.stringify([]),
        filters: JSON.stringify([]),
        grouping: null,
        groupings: JSON.stringify({ groupBy: [] }),
        aggregates: JSON.stringify([]),
        chart_config: null,
        folder: report.folderName || 'Imported from Salesforce',
        is_public: true,
        is_system: false,
        created_by: userId,
        salesforce_created_date: report.createdDate || null,
        salesforce_modified_date: report.lastModifiedDate || null,
        salesforce_owner_id: report.ownerId || null
      }));

      const { error } = await supabase
        .from('reports')
        .upsert(reportDataBatch, {
          onConflict: 'salesforce_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`Batch insert failed:`, error.message);
        failed += batch.length;
        errors.push({ batch: i, error: error.message });
      } else {
        imported += batch.length;
        console.log(`  ✓ Batch saved (${imported} total)\n`);
      }
    } catch (error: any) {
      console.error(`Failed to process batch:`, error.message);
      errors.push({ batch: i, error: error.message });
      failed += batch.length;
    }
  }

  return { imported, failed, total: reports.length, errors };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let userId: string | null = null;

    try {
      const body = await req.json();
      userId = body.userId || null;
    } catch (e) {
      console.log('No JSON body provided, will use default user');
    }

    if (!userId) {
      const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (!userError && users) {
        userId = users.id;
        console.log(`Using default user: ${userId}`);
      } else {
        console.log('No profiles found, checking auth users...');
        const { data: authData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
        if (authData && authData.users && authData.users.length > 0) {
          userId = authData.users[0].id;
          console.log(`Using auth user: ${userId}`);
        } else {
          throw new Error('No users found in system. Please create a user first.');
        }
      }
    }

    const username = 'developer@sunation.com';
    const password = 'Solar171!';

    console.log('Logging into Salesforce...');
    const sfAuth = await soapLogin(username, password);
    console.log('✓ Salesforce login successful');

    const result = await syncReports(supabase, sfAuth.sessionId, sfAuth.instanceUrl, userId);

    await supabase
      .from('salesforce_sync_logs')
      .insert({
        salesforce_object: 'Report',
        log_level: 'success',
        message: `Synced ${result.imported} reports from Salesforce`,
        records_processed: result.total,
        records_inserted: result.imported,
        records_updated: 0,
        records_failed: result.failed
      });

    console.log('\n=== SYNC COMPLETE ===');
    console.log(`Imported: ${result.imported}`);
    console.log(`Failed: ${result.failed}`);
    console.log(`Total: ${result.total}`);

    return new Response(JSON.stringify({
      success: true,
      imported: result.imported,
      failed: result.failed,
      total: result.total,
      errors: result.errors
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    });

  } catch (error: any) {
    console.error('Sync error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );
  }
});

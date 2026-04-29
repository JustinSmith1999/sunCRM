import { supabase } from './supabase';

// Map Salesforce field names to Supabase column names
const fieldMapping: Record<string, Record<string, string>> = {
  leads: {
    'Id': 'id',
    'Name': 'name',
    'FirstName': 'first_name',
    'LastName': 'last_name',
    'Company': 'company',
    'Email': 'email',
    'Phone': 'phone',
    'Status': 'status',
    'Rating': 'rating',
    'LeadSource': 'lead_source',
    'Industry': 'industry',
    'AnnualRevenue': 'annual_revenue',
    'NumberOfEmployees': 'number_of_employees',
    'Street': 'street',
    'City': 'city',
    'State': 'state',
    'PostalCode': 'postal_code',
    'Country': 'country',
    'Description': 'description',
    'OwnerId': 'owner_id',
    'CreatedDate': 'created_at',
    'LastModifiedDate': 'updated_at'
  },
  opportunities: {
    'Id': 'id',
    'Name': 'name',
    'AccountId': 'account_id',
    'Amount': 'amount',
    'CloseDate': 'close_date',
    'StageName': 'stage',
    'Probability': 'probability',
    'Type': 'type',
    'LeadSource': 'lead_source',
    'Description': 'description',
    'OwnerId': 'owner_id',
    'CreatedDate': 'created_at',
    'LastModifiedDate': 'updated_at'
  },
  accounts: {
    'Id': 'id',
    'Name': 'name',
    'Type': 'type',
    'Industry': 'industry',
    'AnnualRevenue': 'annual_revenue',
    'NumberOfEmployees': 'number_of_employees',
    'Phone': 'phone',
    'Website': 'website',
    'BillingStreet': 'billing_street',
    'BillingCity': 'billing_city',
    'BillingState': 'billing_state',
    'BillingPostalCode': 'billing_postal_code',
    'BillingCountry': 'billing_country',
    'OwnerId': 'owner_id',
    'CreatedDate': 'created_at',
    'LastModifiedDate': 'updated_at'
  },
  salesforce_contacts: {
    'Id': 'id',
    'FirstName': 'first_name',
    'LastName': 'last_name',
    'Email': 'email',
    'Phone': 'phone',
    'AccountId': 'account_id',
    'Title': 'title',
    'Department': 'department',
    'MailingStreet': 'mailing_street',
    'MailingCity': 'mailing_city',
    'MailingState': 'mailing_state',
    'MailingPostalCode': 'mailing_postal_code',
    'MailingCountry': 'mailing_country',
    'OwnerId': 'owner_id',
    'CreatedDate': 'created_at',
    'LastModifiedDate': 'updated_at'
  }
};

// Map Salesforce operators to Supabase operators
const operatorMapping: Record<string, string> = {
  'equals': 'eq',
  'notEqual': 'neq',
  'lessThan': 'lt',
  'lessOrEqual': 'lte',
  'greaterThan': 'gt',
  'greaterOrEqual': 'gte',
  'contains': 'ilike',
  'notContain': 'not.ilike',
  'startsWith': 'ilike',
  'includes': 'in',
  'excludes': 'not.in'
};

interface ReportColumn {
  field: string;
  label: string;
  type?: string;
}

interface ReportFilter {
  field: string;
  operator: string;
  value: any;
}

interface ReportGrouping {
  groupBy: string[];
}

interface ReportAggregate {
  field: string;
  function: string;
  label?: string;
}

interface ReportDefinition {
  source_object: string;
  columns: ReportColumn[] | string[];
  filters: ReportFilter[];
  groupings?: ReportGrouping;
  aggregates?: ReportAggregate[];
}

function mapFieldName(tableName: string, sfFieldName: string): string {
  // First, try to use the field name as-is (for Salesforce-style PascalCase columns)
  // Only fall back to snake_case mapping if explicitly defined
  const tableMap = fieldMapping[tableName];
  if (tableMap && tableMap[sfFieldName]) {
    return tableMap[sfFieldName];
  }
  // Return as-is to support PascalCase columns from Salesforce
  return sfFieldName;
}

function buildSelectClause(tableName: string, columns: ReportColumn[] | string[], aggregates?: ReportAggregate[]): string {
  const fields: string[] = [];

  if (aggregates && aggregates.length > 0) {
    aggregates.forEach(agg => {
      const field = mapFieldName(tableName, agg.field);
      const func = agg.function.toLowerCase();

      if (func === 'count') {
        fields.push(`${field}.count()`);
      } else {
        fields.push(`${field}.${func}()`);
      }
    });
  }

  if (columns && columns.length > 0) {
    columns.forEach(col => {
      // Handle both string arrays and ReportColumn objects
      const fieldName = typeof col === 'string' ? col : col.field;
      const field = mapFieldName(tableName, fieldName);
      if (!fields.includes(field)) {
        fields.push(field);
      }
    });
  }

  return fields.length > 0 ? fields.join(',') : '*';
}

function applyFilters(query: any, tableName: string, filters: ReportFilter[]) {
  if (!filters || filters.length === 0) return query;

  filters.forEach(filter => {
    const field = mapFieldName(tableName, filter.field);
    const operator = operatorMapping[filter.operator] || 'eq';

    if (operator === 'ilike') {
      if (filter.operator === 'contains') {
        query = query.ilike(field, `%${filter.value}%`);
      } else if (filter.operator === 'startsWith') {
        query = query.ilike(field, `${filter.value}%`);
      } else {
        query = query.ilike(field, filter.value);
      }
    } else if (operator === 'in') {
      query = query.in(field, filter.value);
    } else if (operator.startsWith('not.')) {
      const actualOp = operator.replace('not.', '');
      query = query.not(field, actualOp, filter.value);
    } else {
      query = query[operator](field, filter.value);
    }
  });

  return query;
}

export async function executeReport(reportDef: ReportDefinition): Promise<any> {
  try {
    const tableName = reportDef.source_object;

    console.log('Executing report for table:', tableName);
    console.log('Report definition:', reportDef);

    const selectClause = buildSelectClause(
      tableName,
      reportDef.columns || [],
      reportDef.aggregates || []
    );

    console.log('Select clause:', selectClause);

    let query = supabase
      .from(tableName)
      .select(selectClause)
      .limit(1000);

    query = applyFilters(query, tableName, reportDef.filters || []);

    if (reportDef.groupings && reportDef.groupings.groupBy && reportDef.groupings.groupBy.length > 0) {
      console.warn('Grouping is not fully supported in client-side queries');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Query execution error:', error);
      throw new Error(`Failed to execute report: ${error.message}`);
    }

    console.log('Query returned', data?.length || 0, 'rows');

    return {
      success: true,
      data: data || [],
      columns: reportDef.columns || [],
      totalRows: data?.length || 0
    };
  } catch (error: any) {
    console.error('Report execution error:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}

export async function executeReportById(reportId: string): Promise<any> {
  try {
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .maybeSingle();

    if (reportError) {
      throw new Error(`Failed to fetch report: ${reportError.message}`);
    }

    if (!report) {
      throw new Error('Report not found');
    }

    const reportDef: ReportDefinition = {
      source_object: report.source_object || report.entity_type || 'leads',
      columns: typeof report.columns === 'string' ? JSON.parse(report.columns || '[]') : (report.columns || []),
      filters: typeof report.filters === 'string' ? JSON.parse(report.filters || '[]') : (report.filters || []),
      groupings: typeof report.groupings === 'string' ? JSON.parse(report.groupings || '{}') : (report.groupings || {}),
      aggregates: typeof report.aggregates === 'string' ? JSON.parse(report.aggregates || '[]') : (report.aggregates || [])
    };

    return await executeReport(reportDef);
  } catch (error: any) {
    console.error('Error executing report by ID:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}

export async function getSalesforceDataStatus(): Promise<any> {
  const tables = ['leads', 'opportunities', 'accounts', 'salesforce_contacts', 'salesforce_cases'];
  const status: Record<string, number> = {};

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      status[table] = error ? 0 : (count || 0);
    } catch (error) {
      status[table] = 0;
    }
  }

  return status;
}

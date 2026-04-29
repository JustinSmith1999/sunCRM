import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function copyTable(sourceTable, destTable, fieldMapping) {
  console.log(`\nCopying from ${sourceTable} to ${destTable}...`);

  try {
    // Fetch all records from source
    const { data: records, error: fetchError } = await supabase
      .from(sourceTable)
      .select('*');

    if (fetchError) {
      console.error(`Error fetching from ${sourceTable}:`, fetchError.message);
      return;
    }

    if (!records || records.length === 0) {
      console.log(`No records found in ${sourceTable}`);
      return;
    }

    console.log(`Found ${records.length} records in ${sourceTable}`);

    // Map fields if mapping provided
    const mappedRecords = records.map(record => {
      const mapped = {};
      for (const [sourceField, destField] of Object.entries(fieldMapping)) {
        mapped[destField] = record[sourceField];
      }
      return mapped;
    });

    // Insert in batches
    const BATCH_SIZE = 1000;
    let inserted = 0;

    for (let i = 0; i < mappedRecords.length; i += BATCH_SIZE) {
      const batch = mappedRecords.slice(i, i + BATCH_SIZE);

      const { error: insertError } = await supabase
        .from(destTable)
        .upsert(batch, { onConflict: 'Id' });

      if (insertError) {
        console.error(`Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`, insertError.message);
      } else {
        inserted += batch.length;
        console.log(`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1} (${inserted}/${mappedRecords.length})`);
      }
    }

    console.log(`✓ Successfully copied ${inserted} records to ${destTable}`);
  } catch (err) {
    console.error(`Error copying ${sourceTable} to ${destTable}:`, err.message);
  }
}

async function combineTasksAndEventsToActivities() {
  console.log('\nCombining Tasks and Events into Activities...');

  try {
    // Fetch tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('salesforce_tasks')
      .select('*');

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError.message);
      return;
    }

    // Fetch events
    const { data: events, error: eventsError } = await supabase
      .from('salesforce_events')
      .select('*');

    if (eventsError) {
      console.error('Error fetching events:', eventsError.message);
      return;
    }

    const activities = [];

    // Convert tasks to activities
    if (tasks) {
      tasks.forEach(task => {
        activities.push({
          Id: task.Id,
          type: 'Task',
          subject: task.Subject,
          status: task.Status,
          priority: task.Priority,
          activity_date: task.ActivityDate,
          description: task.Description,
          who_id: task.WhoId,
          what_id: task.WhatId,
          created_date: task.CreatedDate,
          last_modified_date: task.LastModifiedDate
        });
      });
    }

    // Convert events to activities
    if (events) {
      events.forEach(event => {
        activities.push({
          Id: event.Id,
          type: 'Event',
          subject: event.Subject,
          status: 'Scheduled',
          activity_date: event.StartDateTime,
          description: event.Description,
          who_id: event.WhoId,
          what_id: event.WhatId,
          created_date: event.CreatedDate,
          last_modified_date: event.LastModifiedDate
        });
      });
    }

    console.log(`Combined ${tasks?.length || 0} tasks and ${events?.length || 0} events = ${activities.length} activities`);

    // Insert in batches
    const BATCH_SIZE = 1000;
    let inserted = 0;

    for (let i = 0; i < activities.length; i += BATCH_SIZE) {
      const batch = activities.slice(i, i + BATCH_SIZE);

      const { error: insertError } = await supabase
        .from('activities')
        .upsert(batch, { onConflict: 'Id' });

      if (insertError) {
        console.error(`Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`, insertError.message);
      } else {
        inserted += batch.length;
        console.log(`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1} (${inserted}/${activities.length})`);
      }
    }

    console.log(`✓ Successfully created ${inserted} activities`);
  } catch (err) {
    console.error('Error creating activities:', err.message);
  }
}

async function main() {
  console.log('=== Copying Salesforce Data to CRM Tables ===\n');

  // Copy campaigns
  await copyTable('salesforce_campaigns', 'campaigns', {
    'Id': 'Id',
    'Name': 'name',
    'Type': 'type',
    'Status': 'status',
    'StartDate': 'start_date',
    'EndDate': 'end_date',
    'BudgetedCost': 'budget',
    'ActualCost': 'actual_cost',
    'ExpectedRevenue': 'expected_revenue',
    'NumberOfLeads': 'num_leads',
    'CreatedDate': 'created_at',
    'LastModifiedDate': 'updated_at'
  });

  // Copy cases
  await copyTable('salesforce_cases', 'cases', {
    'Id': 'Id',
    'AccountId': 'account_id',
    'ContactId': 'contact_id',
    'Subject': 'subject',
    'Description': 'description',
    'Status': 'status',
    'Priority': 'priority',
    'Origin': 'origin',
    'Type': 'type',
    'IsClosed': 'is_closed',
    'CreatedDate': 'created_at',
    'LastModifiedDate': 'updated_at'
  });

  // Copy products
  await copyTable('salesforce_products', 'products', {
    'Id': 'Id',
    'Name': 'name',
    'ProductCode': 'code',
    'Description': 'description',
    'IsActive': 'is_active',
    'Family': 'category',
    'CreatedDate': 'created_at',
    'LastModifiedDate': 'updated_at'
  });

  // Combine tasks and events into activities
  await combineTasksAndEventsToActivities();

  console.log('\n=== Copy Complete ===');
}

main().catch(console.error);

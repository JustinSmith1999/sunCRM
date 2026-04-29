import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateAllData() {
  console.log('🚀 Starting comprehensive Salesforce data migration...\n');

  try {
    // 1. Migrate Contacts to the users table or create contacts
    console.log('1️⃣ Checking salesforce_contacts structure...');
    const { data: contacts, error: contactsError } = await supabase
      .from('salesforce_contacts')
      .select('*')
      .limit(1);

    if (contactsError) {
      console.log('⚠️  salesforce_contacts:', contactsError.message);
    } else {
      console.log(`✓ Found salesforce_contacts with ${contacts.length > 0 ? 'data' : 'no data'}`);
      if (contacts.length > 0) {
        console.log('Sample columns:', Object.keys(contacts[0]).slice(0, 10).join(', '));
      }
    }

    // 2. Migrate Cases
    console.log('\n2️⃣ Migrating Cases...');
    const { data: sfCases, error: sfCasesError } = await supabase
      .from('salesforce_cases')
      .select('*');

    if (sfCasesError) {
      console.log('⚠️  Error fetching salesforce_cases:', sfCasesError.message);
    } else {
      console.log(`Found ${sfCases.length} cases to migrate`);

      if (sfCases.length > 0) {
        // Map Salesforce cases to CRM cases structure
        const casesToInsert = sfCases.map(sfCase => ({
          salesforce_id: sfCase.id,
          account_id: sfCase.account_id,
          contact_id: sfCase.contact_id,
          subject: sfCase.subject,
          description: sfCase.description,
          status: sfCase.status || 'New',
          priority: sfCase.priority || 'Medium',
          origin: sfCase.origin,
          type: sfCase.type,
          reason: sfCase.reason,
          closed_date: sfCase.closed_date,
          owner_id: sfCase.owner_id,
          created_at: sfCase.created_date || new Date().toISOString(),
          updated_at: sfCase.last_modified_date || new Date().toISOString()
        }));

        const { data: insertedCases, error: casesInsertError } = await supabase
          .from('cases')
          .upsert(casesToInsert, { onConflict: 'salesforce_id', ignoreDuplicates: false });

        if (casesInsertError) {
          console.log('⚠️  Error inserting cases:', casesInsertError.message);
        } else {
          console.log(`✓ Migrated ${sfCases.length} cases`);
        }
      }
    }

    // 3. Migrate Events and Tasks to Activities
    console.log('\n3️⃣ Migrating Events to Activities...');
    const { data: sfEvents, error: sfEventsError } = await supabase
      .from('salesforce_events')
      .select('*');

    if (sfEventsError) {
      console.log('⚠️  Error fetching salesforce_events:', sfEventsError.message);
    } else {
      console.log(`Found ${sfEvents.length} events to migrate`);

      if (sfEvents.length > 0) {
        const eventsToInsert = sfEvents.map(event => ({
          salesforce_id: event.id,
          subject: event.subject || 'Event',
          type: 'Event',
          status: event.event_subtype || 'Scheduled',
          priority: 'Normal',
          due_date: event.activity_date,
          description: event.description,
          related_to_id: event.what_id,
          related_to_type: event.what_type,
          assigned_to_id: event.owner_id,
          account_id: event.account_id,
          contact_id: event.who_id,
          location: event.location,
          start_datetime: event.start_date_time,
          end_datetime: event.end_date_time,
          created_at: event.created_date || new Date().toISOString(),
          updated_at: event.last_modified_date || new Date().toISOString()
        }));

        const { error: eventsInsertError } = await supabase
          .from('activities')
          .upsert(eventsToInsert, { onConflict: 'salesforce_id', ignoreDuplicates: false });

        if (eventsInsertError) {
          console.log('⚠️  Error inserting events:', eventsInsertError.message);
        } else {
          console.log(`✓ Migrated ${sfEvents.length} events to activities`);
        }
      }
    }

    console.log('\n4️⃣ Migrating Tasks to Activities...');
    const { data: sfTasks, error: sfTasksError } = await supabase
      .from('salesforce_tasks')
      .select('*');

    if (sfTasksError) {
      console.log('⚠️  Error fetching salesforce_tasks:', sfTasksError.message);
    } else {
      console.log(`Found ${sfTasks.length} tasks to migrate`);

      if (sfTasks.length > 0) {
        const tasksToInsert = sfTasks.map(task => ({
          salesforce_id: task.id,
          subject: task.subject || 'Task',
          type: 'Task',
          status: task.status || 'Not Started',
          priority: task.priority || 'Normal',
          due_date: task.activity_date,
          description: task.description,
          related_to_id: task.what_id,
          related_to_type: task.what_type,
          assigned_to_id: task.owner_id,
          account_id: task.account_id,
          contact_id: task.who_id,
          created_at: task.created_date || new Date().toISOString(),
          updated_at: task.last_modified_date || new Date().toISOString()
        }));

        const { error: tasksInsertError } = await supabase
          .from('activities')
          .upsert(tasksToInsert, { onConflict: 'salesforce_id', ignoreDuplicates: false });

        if (tasksInsertError) {
          console.log('⚠️  Error inserting tasks:', tasksInsertError.message);
        } else {
          console.log(`✓ Migrated ${sfTasks.length} tasks to activities`);
        }
      }
    }

    // 5. Migrate Campaigns
    console.log('\n5️⃣ Migrating Campaigns...');
    const { data: sfCampaigns, error: sfCampaignsError } = await supabase
      .from('salesforce_campaigns')
      .select('*');

    if (sfCampaignsError) {
      console.log('⚠️  Error fetching salesforce_campaigns:', sfCampaignsError.message);
    } else {
      console.log(`Found ${sfCampaigns.length} campaigns to migrate`);

      if (sfCampaigns.length > 0) {
        const campaignsToInsert = sfCampaigns.map(campaign => ({
          salesforce_id: campaign.id,
          name: campaign.name,
          type: campaign.type,
          status: campaign.status || 'Planned',
          start_date: campaign.start_date,
          end_date: campaign.end_date,
          budget: campaign.budgeted_cost,
          actual_cost: campaign.actual_cost,
          expected_revenue: campaign.expected_revenue,
          expected_response: campaign.expected_response,
          num_sent: campaign.number_sent,
          description: campaign.description,
          parent_id: campaign.parent_id,
          owner_id: campaign.owner_id,
          created_at: campaign.created_date || new Date().toISOString(),
          updated_at: campaign.last_modified_date || new Date().toISOString()
        }));

        const { error: campaignsInsertError } = await supabase
          .from('campaigns')
          .upsert(campaignsToInsert, { onConflict: 'salesforce_id', ignoreDuplicates: false });

        if (campaignsInsertError) {
          console.log('⚠️  Error inserting campaigns:', campaignsInsertError.message);
        } else {
          console.log(`✓ Migrated ${sfCampaigns.length} campaigns`);
        }
      }
    }

    // 6. Migrate Products
    console.log('\n6️⃣ Migrating Products...');
    const { data: sfProducts, error: sfProductsError } = await supabase
      .from('salesforce_products')
      .select('*');

    if (sfProductsError) {
      console.log('⚠️  Error fetching salesforce_products:', sfProductsError.message);
    } else {
      console.log(`Found ${sfProducts.length} products to migrate`);

      if (sfProducts.length > 0) {
        const productsToInsert = sfProducts.map(product => ({
          salesforce_id: product.id,
          name: product.name,
          code: product.product_code,
          description: product.description,
          category: product.family,
          price: product.unit_price || 0,
          cost: 0,
          is_active: product.is_active !== false,
          created_at: product.created_date || new Date().toISOString(),
          updated_at: product.last_modified_date || new Date().toISOString()
        }));

        const { error: productsInsertError } = await supabase
          .from('products')
          .upsert(productsToInsert, { onConflict: 'salesforce_id', ignoreDuplicates: false });

        if (productsInsertError) {
          console.log('⚠️  Error inserting products:', productsInsertError.message);
        } else {
          console.log(`✓ Migrated ${sfProducts.length} products`);
        }
      }
    }

    // 7. Get final counts
    console.log('\n📊 Final Record Counts:');
    const tables = ['activities', 'cases', 'campaigns', 'products'];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (!error) {
        console.log(`  ${table}: ${count} rows`);
      }
    }

    console.log('\n✅ Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

migrateAllData().catch(console.error);

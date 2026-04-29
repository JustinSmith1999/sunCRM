import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const objects = ['Attachment', 'OpportunityContactRole', 'EmailMessage'];

for (const object of objects) {
  console.log(`\n=== Testing ${object} ===`);

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/salesforce-sync?object=${object}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`Failed: ${error}`);
      continue;
    }

    const result = await response.json();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Error:`, error.message);
  }
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://husbupeealwuxyopfwwb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1c2J1cGVlYWx3dXh5b3Bmd3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NTE3ODMsImV4cCI6MjA3NDUyNzc4M30.ERC3k2pHFZ0MOmrbcSAgS1FwTIMpMh0fKbgzLuMXP6s';

const supabase = createClient(supabaseUrl, supabaseKey);

const orgId = 'b024caf8-fabc-4c7e-967f-bac942a27be4';

const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: 'admin@example.com',
  password: 'admin123'
});

if (authError) {
  console.error('Auth error:', authError);
  process.exit(1);
}

console.log('Authenticated successfully');

const hrRecords = [
  "Caputo, Matthew|Matthew", "Scozzari, Michael|Michael", "Turner, Tyeesha|Tyeesha", 
  "Kase, Ryan|Ryan", "Todd, Vincent|Vincent", "Patrascu, Gabriel|Gabriel",
  "Morant, Kwamel|Kwamel", "Conahan, Paul|Paul", "Kerrison, Omar|Omar",
  "Mateo, Anthony|Anthony", "Adams, Todd|Todd", "Mejia, Kelvin|Kelvin",
  "Jones, Dimitri|Dimitri", "Vohs, William|William", "Desroches, Francois|Francois",
  "Vega, Andres|Andres", "Davenport, Jeremiah|Jeremiah", "Chinchilla, Esther|Esther",
  "Dominguez, Yulissa|Yulissa", "Cuffie-Rountree, Nakia|Nakia", "Konopski, Joseph|Joseph",
  "Fusaro, Colton|Colton", "Vasquez, Oswald|Oswald", "Gerdes, Raoul|Raoul",
  "Furfaro, Frank|Frank", "D'Angelo, Thomas|Thomas", "Munoz, Josue|Josh",
  "Joseph, Andy|Andy", "Turney, Jake|Jake", "Diaz|Carolin",
  "Anthony, Jones|Anthony", "Hudson, Calith|Calith", "Welsh, Timothy|Timothy",
  "Leighton, Amanda|Amanda", "Doberman, Rochelle|Rochelle", "Aiello, Joanne|Joanna",
  "Hitchcock, Melissa|Melissa", "Barron, Quaheem|Quaheem", "Brady, Renasia|Renasia",
  "Malave, Claribel|Claribel", "Scott, Antonio|Antonio", "Cosjay, Diana|Diana",
  "Kelly, Brittany|Brittany", "Iovino, Nicholas|Nicholas", "Maloney, James|James",
  "Fake, John|John", "Torres, George|George", "Lacey, Darrin|Darrin",
  "Trainor, Eamon|Eamon", "Louis, Jonathan|Jonathan", "Tobol, Jacob|Jacob",
  "Romeo, Louis|Louis", "Minovich, Jonathan|Jonathan", "Cerveny, Robert|Robert",
  "Gould, Lloyd|Lloyd", "Bernstein, Daniel|Daniel", "Mirro, Richard|Mirro",
  "Peacock, John|John", "Steeneck, MIchael|Michael", "Eisenberg, Mark|Mark",
  "Platt, Kevin|Kevin", "Haque, Aarish|Aarish", "Markowitz, Robert|Robert",
  "Wohfield, Robert|Robert", "Doherty, Michael|Michael", "Bellanca, Devin|Devin",
  "St. Hillien, Stanley|Stanley", "Filakovsky, John|John", "Hurst, Michael|Michael",
  "Coronado, Brandon|Brandon", "Cattell, Ronald|Ronald", "Vasquez, Erik|Erik",
  "Smith, Isiah|Isiah", "Coffey, Siah|Siah", "Luisi, Louis|Luisi",
  "Fuchs, Kevin|Kevin", "Reyes, Jenna|Jenna", "Solotti, Pauline|Pauline",
  "Perdomo, Michelle|Michelle", "D'Elio, Anthony|Anthony", "Duffoo, Christian|Christian",
  "Rivera, Joseph|Joseph", "Palma, Marisol|Marisol", "Buggenhagen, James|James",
  "Montoya, Jonathan|Jonathan", "Lankowicz, Thomas|Thomas", "Rawat, Nikhil|Nikhil",
  "Wood-Blanco, Arrion|Arrion (arri)", "Kase, James|James", "Serre, Maureen|Maureen",
  "Carlo, Jeffrey|Jeffrey", "Santulli, Diane|Diane", "Cole, Matthew|Matthew",
  "Lee, Tawana|Tawana", "Burkett, Jason|Jason", "Little, Amanada|Amanda",
  "Stockinger, Deborah|Deborah", "Reyes, Michelle|Michelle", "Morales, Jessica|Jessica",
  "Koehler, Daniel|Daniel", "Meigel, Kevin|Kevin", "Caputo, Lisa|Lisa",
  "Price, Melanie|Melanie", "Raggett, Jennifer|Jennifer", "Ullman, Elizabeth|Elizabeth"
];

const recordsToInsert = hrRecords.map((record, index) => {
  const [employee_name, first_name] = record.split('|');
  return {
    organization_id: orgId,
    employee_name,
    first_name,
    employment_status: 'Candidate',
    employee_number: `EMP-${Date.now()}-${index}`,
    department: 'Not Specified',
    position: 'Not Specified',
    job_title: 'Not Specified',
    personal_phone: '',
    license_plate: ''
  };
});

console.log(`Inserting ${recordsToInsert.length} records...`);

const { data, error } = await supabase
  .from('hr_records')
  .insert(recordsToInsert)
  .select();

if (error) {
  console.error('Insert error:', error);
} else {
  console.log(`Successfully inserted ${data.length} records!`);
}

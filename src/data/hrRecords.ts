export interface HRRecord {
  id: string;
  employee_name: string;
  first_name: string;
  employee_number: string;
  employment_status: string;
  department: string;
  position: string;
  job_title: string;
  personal_phone: string;
  license_plate: string;
  birthday: string | null;
  employee_start_date: string | null;
  termination_date: string | null;
  reports_to: string | null;
  created_at: string;
  updated_at: string;
}
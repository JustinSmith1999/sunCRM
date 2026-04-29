-- Insert 249 HR records directly
INSERT INTO hr_records (organization_id, employee_name, first_name, employment_status, employee_number, department, position, job_title, personal_phone, license_plate, birthday, employee_start_date, termination_date, reports_to) VALUES
('b024caf8-fabc-4c7e-967f-bac942a27be4', 'Caputo, Matthew', 'Matthew', 'Candidate', 'EMP-001', 'Not Specified', 'Not Specified', 'Not Specified', '', '', NULL, NULL, NULL, NULL),
('b024caf8-fabc-4c7e-967f-bac942a27be4', 'Scozzari, Michael', 'Michael', 'Candidate', 'EMP-002', 'Not Specified', 'Not Specified', 'Not Specified', '', '', NULL, NULL, NULL, NULL),
('b024caf8-fabc-4c7e-967f-bac942a27be4', 'Turner, Tyeesha', 'Tyeesha', 'Candidate', 'EMP-003', 'Not Specified', 'Not Specified', 'Not Specified', '', '', NULL, NULL, NULL, NULL),
('b024caf8-fabc-4c7e-967f-bac942a27be4', 'Kase, Ryan', 'Ryan', 'Candidate', 'EMP-004', 'Not Specified', 'Not Specified', 'Not Specified', '', '', NULL, NULL, NULL, NULL),
('b024caf8-fabc-4c7e-967f-bac942a27be4', 'Todd, Vincent', 'Vincent', 'Candidate', 'EMP-005', 'Not Specified', 'Not Specified', 'Not Specified', '', '', NULL, NULL, NULL, NULL),
('b024caf8-fabc-4c7e-967f-bac942a27be4', 'Patrascu, Gabriel', 'Gabriel', 'Candidate', 'EMP-006', 'Not Specified', 'Not Specified', 'Not Specified', '', '', NULL, NULL, NULL, NULL),
('b024caf8-fabc-4c7e-967f-bac942a27be4', 'Morant, Kwamel', 'Kwamel', 'Candidate', 'EMP-007', 'Not Specified', 'Not Specified', 'Not Specified', '', '', NULL, NULL, NULL, NULL),
('b024caf8-fabc-4c7e-967f-bac942a27be4', 'Conahan, Paul', 'Paul', 'Candidate', 'EMP-008', 'Not Specified', 'Not Specified', 'Not Specified', '', '', NULL, NULL, NULL, NULL),
('b024caf8-fabc-4c7e-967f-bac942a27be4', 'Kerrison, Omar', 'Omar', 'Candidate', 'EMP-009', 'Not Specified', 'Not Specified', 'Not Specified', '', '', NULL, NULL, NULL, NULL),
('b024caf8-fabc-4c7e-967f-bac942a27be4', 'Mateo, Anthony', 'Anthony', 'Candidate', 'EMP-010', 'Not Specified', 'Not Specified', 'Not Specified', '', '', NULL, NULL, NULL, NULL);

SELECT 'Successfully inserted 10 sample HR records. Run the full script to insert all 249 records.' AS status;

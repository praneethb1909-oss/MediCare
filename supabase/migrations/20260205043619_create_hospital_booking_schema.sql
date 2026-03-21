/*
  # Hospital Outpatient Booking System Schema

  1. New Tables
    - `departments`
      - `id` (uuid, primary key)
      - `name` (text, unique, not null)
      - `description` (text)
      - `created_at` (timestamptz)
    
    - `doctors`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `department_id` (uuid, foreign key to departments)
      - `specialization` (text)
      - `email` (text)
      - `phone` (text)
      - `available_days` (text array - stores days of week)
      - `available_hours_start` (time)
      - `available_hours_end` (time)
      - `created_at` (timestamptz)
    
    - `patients`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text, not null)
      - `email` (text, not null)
      - `phone` (text)
      - `date_of_birth` (date)
      - `created_at` (timestamptz)
    
    - `appointments`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, foreign key to patients)
      - `doctor_id` (uuid, foreign key to doctors)
      - `appointment_date` (date, not null)
      - `appointment_time` (time, not null)
      - `status` (text, default 'pending')
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Departments and doctors are publicly readable (for browsing)
    - Patients can only read/update their own profile
    - Appointments can only be created by authenticated users
    - Patients can only view/manage their own appointments
*/

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view departments"
  ON departments FOR SELECT
  USING (true);

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  specialization text,
  email text,
  phone text,
  available_days text[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  available_hours_start time DEFAULT '09:00:00',
  available_hours_end time DEFAULT '17:00:00',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view doctors"
  ON doctors FOR SELECT
  USING (true);

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  date_of_birth date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON patients FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON patients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON patients FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "Users can create own appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Users can update own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Users can delete own appointments"
  ON appointments FOR DELETE
  TO authenticated
  USING (auth.uid() = patient_id);

-- Insert sample departments
INSERT INTO departments (name, description) VALUES
  ('Cardiology', 'Heart and cardiovascular system care'),
  ('Dermatology', 'Skin, hair, and nail conditions'),
  ('Orthopedics', 'Bone, joint, and muscle treatment'),
  ('Pediatrics', 'Healthcare for children'),
  ('General Medicine', 'General health consultations')
ON CONFLICT (name) DO NOTHING;

-- Insert sample doctors
INSERT INTO doctors (name, department_id, specialization, email, phone) 
SELECT 
  'Dr. Sarah Johnson',
  (SELECT id FROM departments WHERE name = 'Cardiology'),
  'Interventional Cardiology',
  'sarah.johnson@hospital.com',
  '+1-555-0101'
WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE email = 'sarah.johnson@hospital.com');

INSERT INTO doctors (name, department_id, specialization, email, phone) 
SELECT 
  'Dr. Michael Chen',
  (SELECT id FROM departments WHERE name = 'Dermatology'),
  'Medical Dermatology',
  'michael.chen@hospital.com',
  '+1-555-0102'
WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE email = 'michael.chen@hospital.com');

INSERT INTO doctors (name, department_id, specialization, email, phone) 
SELECT 
  'Dr. Emily Rodriguez',
  (SELECT id FROM departments WHERE name = 'Orthopedics'),
  'Sports Medicine',
  'emily.rodriguez@hospital.com',
  '+1-555-0103'
WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE email = 'emily.rodriguez@hospital.com');

INSERT INTO doctors (name, department_id, specialization, email, phone) 
SELECT 
  'Dr. James Wilson',
  (SELECT id FROM departments WHERE name = 'Pediatrics'),
  'Child Development',
  'james.wilson@hospital.com',
  '+1-555-0104'
WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE email = 'james.wilson@hospital.com');

INSERT INTO doctors (name, department_id, specialization, email, phone) 
SELECT 
  'Dr. Lisa Anderson',
  (SELECT id FROM departments WHERE name = 'General Medicine'),
  'Family Medicine',
  'lisa.anderson@hospital.com',
  '+1-555-0105'
WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE email = 'lisa.anderson@hospital.com');
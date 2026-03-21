/*
  # Add Medical Reports and Prescriptions

  1. New Tables
    - `medical_reports`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references patients)
      - `title` (text, not null)
      - `file_url` (text, not null)
      - `report_type` (text)
      - `uploaded_at` (timestamptz, default now())
    
    - `prescriptions`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references patients)
      - `doctor_id` (uuid, references doctors)
      - `doctor_name` (text)
      - `medicines` (jsonb)
      - `notes` (text)
      - `issued_at` (timestamptz, default now())

  2. Security
    - Enable RLS on all tables
    - Patients can view their own reports/prescriptions
    - Admins can manage all reports
    - Doctors can view reports for patients
*/

-- Create medical_reports table
CREATE TABLE IF NOT EXISTS public.medical_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  file_url text NOT NULL,
  report_type text,
  uploaded_at timestamptz DEFAULT now()
);

-- Ensure table is visible to PostgREST
COMMENT ON TABLE public.medical_reports IS 'Table for storing patient medical reports';

ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid errors during re-run
DROP POLICY IF EXISTS "Users can view own reports" ON public.medical_reports;
DROP POLICY IF EXISTS "Patients can upload own reports" ON public.medical_reports;
DROP POLICY IF EXISTS "Admins can manage all reports" ON public.medical_reports;

CREATE POLICY "Users can view own reports"
  ON public.medical_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('doctor', 'admin')
  ));

CREATE POLICY "Patients can upload own reports"
  ON public.medical_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Admins can manage all reports"
  ON public.medical_reports FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Create prescriptions table
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doctor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  doctor_name text,
  medicines jsonb NOT NULL,
  notes text,
  issued_at timestamptz DEFAULT now()
);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Doctors can create prescriptions" ON public.prescriptions;

CREATE POLICY "Users can view own prescriptions"
  ON public.prescriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

CREATE POLICY "Doctors can create prescriptions"
  ON public.prescriptions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'doctor'
  ));

-- Force PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';

/*
  # Expand Hospital Booking System with Hospitals, Roles, and Chat

  1. New Tables
    - `hospitals`
      - `id` (uuid, primary key)
      - `name` (text, unique, not null)
      - `address` (text)
      - `city` (text)
      - `phone` (text)
      - `email` (text)
      - `description` (text)
      - `image_url` (text)
      - `created_at` (timestamptz)

    - `user_roles`
      - `user_id` (uuid, primary key, references auth.users)
      - `role` (text - 'patient', 'doctor', or 'admin')
      - `hospital_id` (uuid, references hospitals for doctors and admins)
      - `created_at` (timestamptz)

    - `medical_types`
      - `id` (uuid, primary key)
      - `name` (text, unique, not null)
      - `description` (text)
      - `icon` (text)
      - `created_at` (timestamptz)

    - `messages`
      - `id` (uuid, primary key)
      - `appointment_id` (uuid, references appointments)
      - `sender_id` (uuid, references auth.users)
      - `content` (text, not null)
      - `created_at` (timestamptz)
      - `read_at` (timestamptz)

  2. Modified Tables
    - `doctors`
      - Add `hospital_id` (uuid, references hospitals)
      - Add `medical_type_id` (uuid, references medical_types)
      - Add `status` (text, default 'active')

    - `appointments`
      - Add `medical_type_id` (uuid, references medical_types)
      - Add `hospital_id` (uuid, references hospitals)

  3. Security
    - Enable RLS on all new tables
    - Role-based access control
*/

-- Create hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  address text,
  city text,
  phone text,
  email text,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hospitals"
  ON hospitals FOR SELECT
  USING (true);

-- Create medical_types table
CREATE TABLE IF NOT EXISTS medical_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  icon text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medical_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view medical types"
  ON medical_types FOR SELECT
  USING (true);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'patient',
  hospital_id uuid REFERENCES hospitals(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Alter doctors table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctors' AND column_name = 'hospital_id'
  ) THEN
    ALTER TABLE doctors ADD COLUMN hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctors' AND column_name = 'medical_type_id'
  ) THEN
    ALTER TABLE doctors ADD COLUMN medical_type_id uuid REFERENCES medical_types(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctors' AND column_name = 'status'
  ) THEN
    ALTER TABLE doctors ADD COLUMN status text DEFAULT 'active';
  END IF;
END $$;

-- Update doctors policy
DROP POLICY IF EXISTS "Anyone can view doctors" ON doctors;

CREATE POLICY "Anyone can view active doctors"
  ON doctors FOR SELECT
  USING (status = 'active');

-- Alter appointments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'medical_type_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN medical_type_id uuid REFERENCES medical_types(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'hospital_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for their appointments"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = messages.appointment_id
      AND (appointments.patient_id = auth.uid() OR appointments.doctor_id = (SELECT doctor_id FROM appointments a WHERE a.id = messages.appointment_id))
    )
  );

CREATE POLICY "Users can insert messages for their appointments"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_id
      AND (appointments.patient_id = auth.uid() OR appointments.doctor_id = (SELECT doctor_id FROM appointments a WHERE a.id = appointment_id))
    )
  );

-- Insert sample hospitals
INSERT INTO hospitals (name, address, city, phone, email, description, image_url) VALUES
  ('City Medical Hospital', '123 Main St', 'New York', '+1-555-1000', 'info@citymedical.com', 'Leading healthcare provider with state-of-the-art facilities and experienced specialists.', 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
  ('Green Valley Hospital', '456 Oak Ave', 'Boston', '+1-555-2000', 'info@greenvalley.com', 'Comprehensive medical services with a focus on patient care and recovery.', 'https://images.pexels.com/photos/6529268/pexels-photo-6529268.jpeg'),
  ('Sunrise Healthcare Center', '789 Elm Road', 'Los Angeles', '+1-555-3000', 'info@sunrisehc.com', 'Advanced treatment facilities and compassionate healthcare professionals.', 'https://images.pexels.com/photos/7974355/pexels-photo-7974355.jpeg'),
  ('District Medical Center', '321 Pine Lane', 'Chicago', '+1-555-4000', 'info@districtmed.com', 'Multi-specialty hospital providing comprehensive medical care.', 'https://images.pexels.com/photos/3490367/pexels-photo-3490367.jpeg')
ON CONFLICT (name) DO NOTHING;

-- Insert sample medical types
INSERT INTO medical_types (name, description, icon) VALUES
  ('General Checkup', 'Routine health examination', 'Stethoscope'),
  ('Surgical Consultation', 'Pre-operative and surgical planning', 'Scalpel'),
  ('Emergency Care', 'Urgent medical attention', 'AlertTriangle'),
  ('Follow-up Visit', 'Post-treatment monitoring', 'CheckCircle'),
  ('Lab Work', 'Diagnostic tests and analysis', 'Activity')
ON CONFLICT (name) DO NOTHING;
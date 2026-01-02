/*
  # Create Core Tables for Multi-Vehicle Service Guide

  1. New Tables
    - `vehicles`: Stores vehicle information (make, model, year, engine, transmission, current mileage)
    - `parts`: Stores parts with supplier and pricing info, linked to vehicles
    - `inspection_templates`: Predefined inspection checklists for each vehicle
    - `service_history`: Tracks all service appointments with date, mileage, mechanic name, costs
    - `service_session_items`: Links completed inspections, used parts, and diagnostics to a service
    - `diagnostic_procedures`: Troubleshooting procedures organized by vehicle and system
    - `video_library`: Tutorial videos organized by maintenance type and vehicle compatibility
    - `service_reminders`: Mileage-based maintenance reminders per vehicle

  2. Security
    - Enable RLS on all tables
    - Add policies allowing anyone to read/write (open for personal use with one mechanic)
*/

CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  engine text NOT NULL,
  transmission text NOT NULL,
  current_mileage integer DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to vehicles"
  ON vehicles FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  name text NOT NULL,
  specifications text DEFAULT '',
  supplier_name text NOT NULL,
  purchase_link text DEFAULT '',
  price_eur numeric(10, 2) NOT NULL,
  compatibility_notes text DEFAULT '',
  category text DEFAULT 'Other',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to parts"
  ON parts FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS inspection_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  category text DEFAULT 'General',
  is_priority boolean DEFAULT false,
  specifications text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inspection_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to inspection_templates"
  ON inspection_templates FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS service_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  service_date date NOT NULL,
  mileage_at_service integer NOT NULL,
  mechanic_name text NOT NULL,
  notes text DEFAULT '',
  total_cost numeric(10, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to service_history"
  ON service_history FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS service_session_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES service_history(id) ON DELETE CASCADE,
  inspection_template_id uuid REFERENCES inspection_templates(id) ON DELETE SET NULL,
  part_id uuid REFERENCES parts(id) ON DELETE SET NULL,
  item_type text NOT NULL DEFAULT 'inspection',
  quantity integer DEFAULT 1,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE service_session_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to service_session_items"
  ON service_session_items FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS diagnostic_procedures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  title text NOT NULL,
  system text DEFAULT 'Engine',
  description text DEFAULT '',
  steps text DEFAULT '',
  warnings text DEFAULT '',
  related_part_ids text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE diagnostic_procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to diagnostic_procedures"
  ON diagnostic_procedures FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS video_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text DEFAULT 'General',
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  youtube_link text NOT NULL,
  description text DEFAULT '',
  difficulty_level text DEFAULT 'Intermediate',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE video_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to video_library"
  ON video_library FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS service_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  mileage_interval integer NOT NULL,
  last_service_mileage integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to service_reminders"
  ON service_reminders FOR ALL
  USING (true)
  WITH CHECK (true);
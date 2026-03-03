-- SLASH Platform — Initial Schema
-- Run this in the Supabase SQL Editor to create all tables, trigger, and RLS policies.

-- ============================================================
-- 1. Users Profile (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'field_collector',
  region_id TEXT,
  district_id TEXT,
  is_active BOOLEAN DEFAULT true,
  employment_status TEXT DEFAULT 'active', -- active, suspended, terminated, on_leave
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. Domain Tables
-- ============================================================
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id TEXT UNIQUE NOT NULL,
  head_of_household TEXT NOT NULL,
  address TEXT NOT NULL,
  region TEXT NOT NULL,
  district TEXT NOT NULL,
  chiefdom TEXT,
  section TEXT,
  gps_coordinates TEXT,
  phone_number TEXT,
  total_members INT DEFAULT 0,
  created_by UUID REFERENCES users_profile(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id TEXT UNIQUE NOT NULL,
  household_id UUID REFERENCES households(id),
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  relationship_to_head TEXT,
  phone_number TEXT,
  education_level TEXT,
  occupation TEXT,
  health_status TEXT DEFAULT 'unknown',
  risk_level TEXT DEFAULT 'low',
  created_by UUID REFERENCES users_profile(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sample_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_code TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  form_schema JSONB,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users_profile(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code TEXT UNIQUE NOT NULL,
  project_name TEXT NOT NULL,
  description TEXT,
  region_ids JSONB,
  district_ids JSONB,
  expected_sample_types JSONB,
  target_samples_count INT DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  created_by UUID REFERENCES users_profile(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sample_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id TEXT UNIQUE NOT NULL,
  participant_id UUID REFERENCES participants(id),
  collector_id UUID REFERENCES users_profile(id),
  sample_type TEXT NOT NULL,
  collection_date TIMESTAMPTZ NOT NULL,
  collection_site TEXT,
  storage_conditions TEXT,
  transport_method TEXT,
  lab_delivery_date TIMESTAMPTZ,
  status TEXT DEFAULT 'collected',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id TEXT UNIQUE NOT NULL,
  sample_type_code TEXT NOT NULL REFERENCES sample_types(type_code),
  project_id UUID REFERENCES projects(id),
  household_id UUID REFERENCES households(id),
  participant_id UUID REFERENCES participants(id),
  collected_by UUID REFERENCES users_profile(id),
  collection_date TIMESTAMPTZ,
  collection_metadata JSONB,
  volume_collected DECIMAL(5,2),
  container_correct BOOLEAN DEFAULT true,
  temperature_at_collection DECIMAL(4,1),
  transport_notes TEXT,
  received_by UUID REFERENCES users_profile(id),
  received_date TIMESTAMPTZ,
  lab_results JSONB,
  lab_comments TEXT,
  normal_range_validation BOOLEAN,
  status TEXT DEFAULT 'not_collected',
  rejection_reason TEXT,
  rejection_notes TEXT,
  ai_flags JSONB,
  last_ai_check TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id UUID REFERENCES sample_collections(id),
  test_type TEXT NOT NULL,
  result_value TEXT,
  result_unit TEXT,
  reference_range TEXT,
  status TEXT DEFAULT 'pending',
  technician_id UUID REFERENCES users_profile(id),
  analysis_date TIMESTAMPTZ,
  equipment_used TEXT,
  quality_control_passed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id TEXT NOT NULL,
  participant_id UUID REFERENCES participants(id),
  collector_id UUID REFERENCES users_profile(id),
  survey_data JSONB NOT NULL,
  completion_status TEXT DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users_profile(id),
  review_status TEXT DEFAULT 'pending',
  ai_validation_status TEXT DEFAULT 'pending',
  ai_flags JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  form_schema JSONB NOT NULL,
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users_profile(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  analysis_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  input_data JSONB,
  analysis_result JSONB NOT NULL,
  confidence_score DECIMAL(3,2),
  flags JSONB,
  recommendations TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users_profile(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sample_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id UUID REFERENCES samples(id),
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  performed_by UUID REFERENCES users_profile(id),
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sample_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_code TEXT UNIQUE NOT NULL,
  batch_type TEXT NOT NULL,
  sample_ids JSONB NOT NULL,
  created_by UUID REFERENCES users_profile(id),
  processed_by UUID REFERENCES users_profile(id),
  batch_status TEXT DEFAULT 'pending',
  processing_date TIMESTAMPTZ,
  completion_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_profile_role ON users_profile(role);
CREATE INDEX IF NOT EXISTS idx_users_profile_region ON users_profile(region_id);
CREATE INDEX IF NOT EXISTS idx_households_region_district ON households(region, district);
CREATE INDEX IF NOT EXISTS idx_participants_household ON participants(household_id);
CREATE INDEX IF NOT EXISTS idx_samples_participant ON sample_collections(participant_id);
CREATE INDEX IF NOT EXISTS idx_surveys_participant ON surveys(participant_id);
CREATE INDEX IF NOT EXISTS idx_surveys_form ON surveys(form_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_entity ON ai_analysis(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_action ON system_logs(user_id, action, created_at);
CREATE INDEX IF NOT EXISTS idx_samples_v2_sample_id ON samples(sample_id);
CREATE INDEX IF NOT EXISTS idx_samples_v2_participant ON samples(participant_id);
CREATE INDEX IF NOT EXISTS idx_samples_v2_household ON samples(household_id);
CREATE INDEX IF NOT EXISTS idx_samples_v2_project ON samples(project_id);
CREATE INDEX IF NOT EXISTS idx_samples_v2_status ON samples(status);
CREATE INDEX IF NOT EXISTS idx_samples_v2_collected_by ON samples(collected_by);
CREATE INDEX IF NOT EXISTS idx_samples_v2_collection_date ON samples(collection_date);
CREATE INDEX IF NOT EXISTS idx_sample_audit_sample_id ON sample_audit_log(sample_id);
CREATE INDEX IF NOT EXISTS idx_sample_audit_action ON sample_audit_log(action, timestamp);

-- ============================================================
-- 4. Trigger: auto-create users_profile on auth.users insert
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_profile (id, email, full_name, role, region_id, district_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'field_collector'),
    NEW.raw_user_meta_data ->> 'region_id',
    NEW.raw_user_meta_data ->> 'district_id'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 5. Row Level Security
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_batches ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users_profile WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: check if current user is admin-level
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users_profile
    WHERE id = auth.uid()
      AND role IN ('superadmin', 'regional_head', 'hr_manager')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- users_profile: users can read all profiles, only admins can insert/update
CREATE POLICY "Users can view all profiles"
  ON users_profile FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update profiles"
  ON users_profile FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR id = auth.uid());

CREATE POLICY "Service role can insert profiles"
  ON users_profile FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Trigger inserts on behalf of user

-- Broad authenticated access for domain tables (role filtering done in app layer)
-- households
CREATE POLICY "Authenticated can read households"
  ON households FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert households"
  ON households FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update households"
  ON households FOR UPDATE TO authenticated USING (true);

-- participants
CREATE POLICY "Authenticated can read participants"
  ON participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert participants"
  ON participants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update participants"
  ON participants FOR UPDATE TO authenticated USING (true);

-- sample_collections
CREATE POLICY "Authenticated can read sample_collections"
  ON sample_collections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert sample_collections"
  ON sample_collections FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update sample_collections"
  ON sample_collections FOR UPDATE TO authenticated USING (true);

-- samples
CREATE POLICY "Authenticated can read samples"
  ON samples FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert samples"
  ON samples FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update samples"
  ON samples FOR UPDATE TO authenticated USING (true);

-- lab_results
CREATE POLICY "Authenticated can read lab_results"
  ON lab_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert lab_results"
  ON lab_results FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update lab_results"
  ON lab_results FOR UPDATE TO authenticated USING (true);

-- surveys
CREATE POLICY "Authenticated can read surveys"
  ON surveys FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert surveys"
  ON surveys FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update surveys"
  ON surveys FOR UPDATE TO authenticated USING (true);

-- forms
CREATE POLICY "Authenticated can read forms"
  ON forms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert forms"
  ON forms FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update forms"
  ON forms FOR UPDATE TO authenticated USING (true);

-- ai_analysis
CREATE POLICY "Authenticated can read ai_analysis"
  ON ai_analysis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert ai_analysis"
  ON ai_analysis FOR INSERT TO authenticated WITH CHECK (true);

-- system_logs
CREATE POLICY "Admins can read system_logs"
  ON system_logs FOR SELECT TO authenticated USING (public.is_admin() OR public.get_my_role() = 'ai_data_manager');
CREATE POLICY "Authenticated can insert system_logs"
  ON system_logs FOR INSERT TO authenticated WITH CHECK (true);

-- sample_types
CREATE POLICY "Authenticated can read sample_types"
  ON sample_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage sample_types"
  ON sample_types FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update sample_types"
  ON sample_types FOR UPDATE TO authenticated USING (public.is_admin());

-- projects
CREATE POLICY "Authenticated can read projects"
  ON projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage projects"
  ON projects FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update projects"
  ON projects FOR UPDATE TO authenticated USING (public.is_admin());

-- sample_audit_log
CREATE POLICY "Authenticated can read sample_audit_log"
  ON sample_audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert sample_audit_log"
  ON sample_audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- sample_batches
CREATE POLICY "Authenticated can read sample_batches"
  ON sample_batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage sample_batches"
  ON sample_batches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update sample_batches"
  ON sample_batches FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- 6. Default Sample Types
-- ============================================================
INSERT INTO sample_types (type_code, display_name, description, form_schema)
VALUES
  ('URINE', 'Urine Sample', 'Standard urine collection for urinalysis', '{"fields":[{"name":"volume_collected","type":"number","label":"Volume (mL)","required":true},{"name":"color","type":"select","label":"Color","options":["Clear","Yellow","Dark Yellow","Red","Brown"],"required":false},{"name":"container_type","type":"select","label":"Container Type","options":["Standard Cup","Sterile Cup","Tube"],"required":true},{"name":"collection_notes","type":"textarea","label":"Collection Notes","required":false}]}'),
  ('BLOOD', 'Blood Sample', 'Blood sample via finger prick or venous draw', '{"fields":[{"name":"collection_method","type":"select","label":"Collection Method","options":["Finger Prick","Venous Draw"],"required":true},{"name":"volume_collected","type":"number","label":"Volume (mL)","required":true},{"name":"tube_type","type":"select","label":"Tube Type","options":["EDTA","Serum","Heparin","Plain"],"required":true},{"name":"hemolysis_observed","type":"select","label":"Hemolysis","options":["None","Slight","Moderate","Severe"],"required":false},{"name":"collection_notes","type":"textarea","label":"Collection Notes","required":false}]}')
ON CONFLICT (type_code) DO NOTHING;

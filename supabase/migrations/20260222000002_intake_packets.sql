-- Migration: Intake Packets
-- Consent documents + intake questionnaire workflow for new patients

-- ============================================================
-- Enums
-- ============================================================
CREATE TYPE public.intake_packet_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE public.intake_item_type AS ENUM ('consent_document', 'intake_questionnaire');
CREATE TYPE public.intake_item_status AS ENUM ('pending', 'in_progress', 'completed');

-- ============================================================
-- Intake Packets Table (one per patient send event)
-- ============================================================
CREATE TABLE public.intake_packets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  provider_id uuid NOT NULL REFERENCES public.providers(id),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  status public.intake_packet_status NOT NULL DEFAULT 'pending',
  provider_viewed_at timestamptz,
  requested_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Intake Packet Items Table (individual consent docs + questionnaire)
-- ============================================================
CREATE TABLE public.intake_packet_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid NOT NULL REFERENCES public.intake_packets(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  item_type public.intake_item_type NOT NULL,
  item_key text NOT NULL,          -- e.g. 'informed_consent', 'hipaa_notice', 'practice_policies', 'client_history'
  item_label text NOT NULL,        -- e.g. 'Informed Consent to Treatment'
  sort_order integer NOT NULL DEFAULT 0,
  status public.intake_item_status NOT NULL DEFAULT 'pending',
  responses jsonb,                 -- questionnaire answers (JSONB sections) or consent signature data
  signature_name text,             -- typed name for consent docs
  signed_at timestamptz,           -- when consent was signed
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_intake_packets_patient_status ON public.intake_packets(patient_id, status);
CREATE INDEX idx_intake_packets_provider_viewed ON public.intake_packets(provider_id, completed_at) WHERE provider_viewed_at IS NULL;
CREATE INDEX idx_intake_packets_org ON public.intake_packets(org_id);
CREATE INDEX idx_intake_packet_items_packet ON public.intake_packet_items(packet_id);
CREATE INDEX idx_intake_packet_items_patient ON public.intake_packet_items(patient_id, status);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.intake_packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_packet_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "intake_packets_select" ON public.intake_packets FOR SELECT TO authenticated
  USING (org_id = (select public.get_org_id()));
CREATE POLICY "intake_packets_insert" ON public.intake_packets FOR INSERT TO authenticated
  WITH CHECK (org_id = (select public.get_org_id()));
CREATE POLICY "intake_packets_update" ON public.intake_packets FOR UPDATE TO authenticated
  USING (org_id = (select public.get_org_id()));

CREATE POLICY "intake_packet_items_select" ON public.intake_packet_items FOR SELECT TO authenticated
  USING (org_id = (select public.get_org_id()));
CREATE POLICY "intake_packet_items_insert" ON public.intake_packet_items FOR INSERT TO authenticated
  WITH CHECK (org_id = (select public.get_org_id()));
CREATE POLICY "intake_packet_items_update" ON public.intake_packet_items FOR UPDATE TO authenticated
  USING (org_id = (select public.get_org_id()));

-- Service role has full access by default (bypasses RLS)
GRANT ALL ON public.intake_packets TO service_role;
GRANT ALL ON public.intake_packet_items TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.intake_packets TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.intake_packet_items TO authenticated;

-- ============================================================
-- Audit triggers
-- ============================================================
CREATE TRIGGER audit_intake_packets
  AFTER INSERT OR UPDATE OR DELETE ON public.intake_packets
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_intake_packet_items
  AFTER INSERT OR UPDATE OR DELETE ON public.intake_packet_items
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

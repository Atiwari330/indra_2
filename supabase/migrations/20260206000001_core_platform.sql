-- Migration 1: Core Platform Tables
-- Organizations, users, providers

-- Enums
CREATE TYPE public.user_role AS ENUM ('admin', 'provider', 'billing', 'staff');
CREATE TYPE public.note_format AS ENUM ('SOAP', 'DAP', 'BIRP');

-- Organizations
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Users (linked to Supabase auth)
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid UNIQUE REFERENCES auth.users(id),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  role public.user_role NOT NULL DEFAULT 'staff',
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_org_id ON public.users(org_id);
CREATE INDEX idx_users_auth_id ON public.users(auth_id);

-- Providers (clinical identity, separate from user auth identity)
CREATE TABLE public.providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  npi varchar(10),
  credentials text, -- e.g. "LCSW", "PhD", "MD"
  license_number text,
  license_state varchar(2),
  specialty text,
  preferred_note_format public.note_format NOT NULL DEFAULT 'SOAP',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_providers_org_id ON public.providers(org_id);
CREATE INDEX idx_providers_user_id ON public.providers(user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

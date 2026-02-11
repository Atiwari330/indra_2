-- Add create_treatment_plan to the ai_action_type enum
ALTER TYPE public.ai_action_type ADD VALUE IF NOT EXISTS 'create_treatment_plan';

-- Add ai_run_id reference to treatment_plans
ALTER TABLE public.treatment_plans
  ADD COLUMN IF NOT EXISTS ai_run_id uuid REFERENCES public.ai_runs(id);

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_clarifications: {
        Row: {
          answer: string | null
          answered_at: string | null
          answered_by: string | null
          context: Json | null
          created_at: string
          id: string
          options: Json | null
          org_id: string
          question: string
          run_id: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          context?: Json | null
          created_at?: string
          id?: string
          options?: Json | null
          org_id: string
          question: string
          run_id: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          context?: Json | null
          created_at?: string
          id?: string
          options?: Json | null
          org_id?: string
          question?: string
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_clarifications_answered_by_fkey"
            columns: ["answered_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_clarifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_clarifications_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "ai_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_proposed_actions: {
        Row: {
          action_group: string
          action_group_label: string | null
          action_order: number
          action_type: Database["public"]["Enums"]["ai_action_type"]
          assumptions: Json | null
          committed_at: string | null
          committed_by: string | null
          confidence_score: number | null
          created_at: string
          id: string
          org_id: string
          payload: Json
          provider_modified_payload: Json | null
          requires_review: boolean
          run_id: string
          status: Database["public"]["Enums"]["ai_action_status"]
          target_table: string
        }
        Insert: {
          action_group?: string
          action_group_label?: string | null
          action_order?: number
          action_type: Database["public"]["Enums"]["ai_action_type"]
          assumptions?: Json | null
          committed_at?: string | null
          committed_by?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          org_id: string
          payload: Json
          provider_modified_payload?: Json | null
          requires_review?: boolean
          run_id: string
          status?: Database["public"]["Enums"]["ai_action_status"]
          target_table: string
        }
        Update: {
          action_group?: string
          action_group_label?: string | null
          action_order?: number
          action_type?: Database["public"]["Enums"]["ai_action_type"]
          assumptions?: Json | null
          committed_at?: string | null
          committed_by?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          org_id?: string
          payload?: Json
          provider_modified_payload?: Json | null
          requires_review?: boolean
          run_id?: string
          status?: Database["public"]["Enums"]["ai_action_status"]
          target_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_proposed_actions_committed_by_fkey"
            columns: ["committed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_proposed_actions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_proposed_actions_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "ai_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          encounter_id: string | null
          error: string | null
          id: string
          idempotency_key: string | null
          input_text: string
          intent_type: string | null
          org_id: string
          patient_id: string | null
          result_summary: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["ai_run_status"]
          total_cost_cents: number | null
          total_tokens: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          encounter_id?: string | null
          error?: string | null
          id?: string
          idempotency_key?: string | null
          input_text: string
          intent_type?: string | null
          org_id: string
          patient_id?: string | null
          result_summary?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["ai_run_status"]
          total_cost_cents?: number | null
          total_tokens?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          encounter_id?: string | null
          error?: string | null
          id?: string
          idempotency_key?: string | null
          input_text?: string
          intent_type?: string | null
          org_id?: string
          patient_id?: string | null
          result_summary?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["ai_run_status"]
          total_cost_cents?: number | null
          total_tokens?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_runs_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_runs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_runs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_steps: {
        Row: {
          created_at: string
          duration_ms: number | null
          id: string
          input: Json | null
          messages: Json | null
          output: Json | null
          run_id: string
          step_number: number
          step_type: Database["public"]["Enums"]["ai_step_type"]
          tokens_input: number | null
          tokens_output: number | null
          tool_name: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          input?: Json | null
          messages?: Json | null
          output?: Json | null
          run_id: string
          step_number: number
          step_type: Database["public"]["Enums"]["ai_step_type"]
          tokens_input?: number | null
          tokens_output?: number | null
          tool_name?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          input?: Json | null
          messages?: Json | null
          output?: Json | null
          run_id?: string
          step_number?: number
          step_type?: Database["public"]["Enums"]["ai_step_type"]
          tokens_input?: number | null
          tokens_output?: number | null
          tool_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_steps_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "ai_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_type: string | null
          created_at: string
          end_time: string
          id: string
          notes: string | null
          org_id: string
          patient_id: string
          provider_id: string
          recurring_rule: Json | null
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"]
        }
        Insert: {
          appointment_type?: string | null
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          org_id: string
          patient_id: string
          provider_id: string
          recurring_rule?: Json | null
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
        }
        Update: {
          appointment_type?: string | null
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          org_id?: string
          patient_id?: string
          provider_id?: string
          recurring_rule?: Json | null
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "appointments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_scores: {
        Row: {
          administered_at: string
          created_at: string
          encounter_id: string | null
          id: string
          measure_type: Database["public"]["Enums"]["assessment_measure_type"]
          org_id: string
          patient_id: string
          score: number
          source: Database["public"]["Enums"]["assessment_score_source"]
        }
        Insert: {
          administered_at?: string
          created_at?: string
          encounter_id?: string | null
          id?: string
          measure_type: Database["public"]["Enums"]["assessment_measure_type"]
          org_id: string
          patient_id: string
          score: number
          source?: Database["public"]["Enums"]["assessment_score_source"]
        }
        Update: {
          administered_at?: string
          created_at?: string
          encounter_id?: string | null
          id?: string
          measure_type?: Database["public"]["Enums"]["assessment_measure_type"]
          org_id?: string
          patient_id?: string
          score?: number
          source?: Database["public"]["Enums"]["assessment_score_source"]
        }
        Relationships: [
          {
            foreignKeyName: "assessment_scores_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_scores_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_scores_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          ai_run_id: string | null
          changed_fields: string[] | null
          event_time: string
          id: number
          new_data: Json | null
          old_data: Json | null
          org_id: string | null
          patient_id: string | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          ai_run_id?: string | null
          changed_fields?: string[] | null
          event_time?: string
          id?: number
          new_data?: Json | null
          old_data?: Json | null
          org_id?: string | null
          patient_id?: string | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          ai_run_id?: string | null
          changed_fields?: string[] | null
          event_time?: string
          id?: number
          new_data?: Json | null
          old_data?: Json | null
          org_id?: string | null
          patient_id?: string | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      billing_claims: {
        Row: {
          amount_paid: number | null
          claim_number: string | null
          created_at: string
          date_of_service: string
          denial_reason: string | null
          encounter_id: string
          id: string
          org_id: string
          paid_at: string | null
          patient_id: string
          patient_insurance_id: string | null
          patient_responsibility: number | null
          place_of_service: string | null
          provider_id: string
          status: Database["public"]["Enums"]["claim_status"]
          submitted_at: string | null
          total_charge: number | null
          updated_at: string
        }
        Insert: {
          amount_paid?: number | null
          claim_number?: string | null
          created_at?: string
          date_of_service: string
          denial_reason?: string | null
          encounter_id: string
          id?: string
          org_id: string
          paid_at?: string | null
          patient_id: string
          patient_insurance_id?: string | null
          patient_responsibility?: number | null
          place_of_service?: string | null
          provider_id: string
          status?: Database["public"]["Enums"]["claim_status"]
          submitted_at?: string | null
          total_charge?: number | null
          updated_at?: string
        }
        Update: {
          amount_paid?: number | null
          claim_number?: string | null
          created_at?: string
          date_of_service?: string
          denial_reason?: string | null
          encounter_id?: string
          id?: string
          org_id?: string
          paid_at?: string | null
          patient_id?: string
          patient_insurance_id?: string | null
          patient_responsibility?: number | null
          place_of_service?: string | null
          provider_id?: string
          status?: Database["public"]["Enums"]["claim_status"]
          submitted_at?: string | null
          total_charge?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_claims_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_claims_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_claims_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_claims_patient_insurance_id_fkey"
            columns: ["patient_insurance_id"]
            isOneToOne: false
            referencedRelation: "patient_insurance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_claims_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_diagnoses: {
        Row: {
          claim_id: string
          icd10_code: string
          id: string
          sequence_number: number
        }
        Insert: {
          claim_id: string
          icd10_code: string
          id?: string
          sequence_number: number
        }
        Update: {
          claim_id?: string
          icd10_code?: string
          id?: string
          sequence_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "claim_diagnoses_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "billing_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_diagnoses_icd10_code_fkey"
            columns: ["icd10_code"]
            isOneToOne: false
            referencedRelation: "icd10_codes"
            referencedColumns: ["code"]
          },
        ]
      }
      claim_line_items: {
        Row: {
          charge_amount: number
          claim_id: string
          cpt_code: string
          diagnosis_pointers: number[]
          id: string
          line_number: number
          modifier_1: string | null
          modifier_2: string | null
          rendering_provider_npi: string | null
          service_date: string
          units: number
        }
        Insert: {
          charge_amount: number
          claim_id: string
          cpt_code: string
          diagnosis_pointers?: number[]
          id?: string
          line_number: number
          modifier_1?: string | null
          modifier_2?: string | null
          rendering_provider_npi?: string | null
          service_date: string
          units?: number
        }
        Update: {
          charge_amount?: number
          claim_id?: string
          cpt_code?: string
          diagnosis_pointers?: number[]
          id?: string
          line_number?: number
          modifier_1?: string | null
          modifier_2?: string | null
          rendering_provider_npi?: string | null
          service_date?: string
          units?: number
        }
        Relationships: [
          {
            foreignKeyName: "claim_line_items_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "billing_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_line_items_cpt_code_fkey"
            columns: ["cpt_code"]
            isOneToOne: false
            referencedRelation: "cpt_codes"
            referencedColumns: ["code"]
          },
        ]
      }
      clinical_notes: {
        Row: {
          amendment_reason: string | null
          content: Json
          created_at: string
          encounter_id: string
          id: string
          is_current: boolean
          note_type: Database["public"]["Enums"]["note_type"]
          org_id: string
          patient_id: string
          previous_version_id: string | null
          provider_id: string
          risk_assessment: Json | null
          signed_at: string | null
          signed_by: string | null
          status: Database["public"]["Enums"]["note_status"]
          version: number
        }
        Insert: {
          amendment_reason?: string | null
          content: Json
          created_at?: string
          encounter_id: string
          id?: string
          is_current?: boolean
          note_type: Database["public"]["Enums"]["note_type"]
          org_id: string
          patient_id: string
          previous_version_id?: string | null
          provider_id: string
          risk_assessment?: Json | null
          signed_at?: string | null
          signed_by?: string | null
          status?: Database["public"]["Enums"]["note_status"]
          version?: number
        }
        Update: {
          amendment_reason?: string | null
          content?: Json
          created_at?: string
          encounter_id?: string
          id?: string
          is_current?: boolean
          note_type?: Database["public"]["Enums"]["note_type"]
          org_id?: string
          patient_id?: string
          previous_version_id?: string | null
          provider_id?: string
          risk_assessment?: Json | null
          signed_at?: string | null
          signed_by?: string | null
          status?: Database["public"]["Enums"]["note_status"]
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinical_notes_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_notes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_notes_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "clinical_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_notes_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_notes_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      cpt_codes: {
        Row: {
          category: string | null
          code: string
          description: string
          effective_date: string | null
          is_addon: boolean
          termination_date: string | null
          time_range_minutes: unknown
        }
        Insert: {
          category?: string | null
          code: string
          description: string
          effective_date?: string | null
          is_addon?: boolean
          termination_date?: string | null
          time_range_minutes?: unknown
        }
        Update: {
          category?: string | null
          code?: string
          description?: string
          effective_date?: string | null
          is_addon?: boolean
          termination_date?: string | null
          time_range_minutes?: unknown
        }
        Relationships: []
      }
      encounters: {
        Row: {
          appointment_id: string | null
          created_at: string
          duration_minutes: number | null
          encounter_date: string
          encounter_type: Database["public"]["Enums"]["encounter_type"]
          id: string
          org_id: string
          patient_id: string
          place_of_service: string | null
          provider_id: string
          status: Database["public"]["Enums"]["encounter_status"]
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          encounter_date: string
          encounter_type: Database["public"]["Enums"]["encounter_type"]
          id?: string
          org_id: string
          patient_id: string
          place_of_service?: string | null
          provider_id: string
          status?: Database["public"]["Enums"]["encounter_status"]
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          encounter_date?: string
          encounter_type?: Database["public"]["Enums"]["encounter_type"]
          id?: string
          org_id?: string
          patient_id?: string
          place_of_service?: string | null
          provider_id?: string
          status?: Database["public"]["Enums"]["encounter_status"]
        }
        Relationships: [
          {
            foreignKeyName: "encounters_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      icd10_codes: {
        Row: {
          category: string | null
          chapter: string | null
          code: string
          description: string
          effective_date: string | null
          is_billable: boolean
        }
        Insert: {
          category?: string | null
          chapter?: string | null
          code: string
          description: string
          effective_date?: string | null
          is_billable?: boolean
        }
        Update: {
          category?: string | null
          chapter?: string | null
          code?: string
          description?: string
          effective_date?: string | null
          is_billable?: boolean
        }
        Relationships: []
      }
      insurance_payers: {
        Row: {
          address: Json | null
          created_at: string
          id: string
          name: string
          org_id: string
          payer_id_number: string | null
          phone: string | null
        }
        Insert: {
          address?: Json | null
          created_at?: string
          id?: string
          name: string
          org_id: string
          payer_id_number?: string | null
          phone?: string | null
        }
        Update: {
          address?: Json | null
          created_at?: string
          id?: string
          name?: string
          org_id?: string
          payer_id_number?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_payers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          change_reason: string | null
          created_at: string
          dosage: string
          end_date: string | null
          frequency: string
          id: string
          name: string
          org_id: string
          patient_id: string
          provider_id: string
          route: string | null
          start_date: string
          status: Database["public"]["Enums"]["medication_status"]
        }
        Insert: {
          change_reason?: string | null
          created_at?: string
          dosage: string
          end_date?: string | null
          frequency: string
          id?: string
          name: string
          org_id: string
          patient_id: string
          provider_id: string
          route?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["medication_status"]
        }
        Update: {
          change_reason?: string | null
          created_at?: string
          dosage?: string
          end_date?: string | null
          frequency?: string
          id?: string
          name?: string
          org_id?: string
          patient_id?: string
          provider_id?: string
          route?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["medication_status"]
        }
        Relationships: [
          {
            foreignKeyName: "medications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medications_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      note_drafts: {
        Row: {
          accepted_at: string | null
          ai_run_id: string | null
          created_at: string
          encounter_id: string | null
          generated_content: Json
          id: string
          note_type: Database["public"]["Enums"]["note_type"]
          org_id: string
          provider_edits: Json | null
          source_transcript: string | null
          status: Database["public"]["Enums"]["note_draft_status"]
        }
        Insert: {
          accepted_at?: string | null
          ai_run_id?: string | null
          created_at?: string
          encounter_id?: string | null
          generated_content: Json
          id?: string
          note_type: Database["public"]["Enums"]["note_type"]
          org_id: string
          provider_edits?: Json | null
          source_transcript?: string | null
          status?: Database["public"]["Enums"]["note_draft_status"]
        }
        Update: {
          accepted_at?: string | null
          ai_run_id?: string | null
          created_at?: string
          encounter_id?: string | null
          generated_content?: Json
          id?: string
          note_type?: Database["public"]["Enums"]["note_type"]
          org_id?: string
          provider_edits?: Json | null
          source_transcript?: string | null
          status?: Database["public"]["Enums"]["note_draft_status"]
        }
        Relationships: [
          {
            foreignKeyName: "note_drafts_ai_run_id_fkey"
            columns: ["ai_run_id"]
            isOneToOne: false
            referencedRelation: "ai_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_drafts_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_drafts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      note_signatures: {
        Row: {
          clinical_note_id: string
          content_hash: string
          id: string
          signature_type: Database["public"]["Enums"]["signature_type"]
          signed_at: string
          signer_id: string
        }
        Insert: {
          clinical_note_id: string
          content_hash: string
          id?: string
          signature_type?: Database["public"]["Enums"]["signature_type"]
          signed_at?: string
          signer_id: string
        }
        Update: {
          clinical_note_id?: string
          content_hash?: string
          id?: string
          signature_type?: Database["public"]["Enums"]["signature_type"]
          signed_at?: string
          signer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_signatures_clinical_note_id_fkey"
            columns: ["clinical_note_id"]
            isOneToOne: false
            referencedRelation: "clinical_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_signatures_signer_id_fkey"
            columns: ["signer_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          settings: Json
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          settings?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          settings?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      patient_diagnoses: {
        Row: {
          created_at: string
          description: string
          diagnosed_by: string | null
          icd10_code: string
          id: string
          is_primary: boolean
          onset_date: string | null
          org_id: string
          patient_id: string
          resolved_date: string | null
          status: Database["public"]["Enums"]["diagnosis_status"]
        }
        Insert: {
          created_at?: string
          description: string
          diagnosed_by?: string | null
          icd10_code: string
          id?: string
          is_primary?: boolean
          onset_date?: string | null
          org_id: string
          patient_id: string
          resolved_date?: string | null
          status?: Database["public"]["Enums"]["diagnosis_status"]
        }
        Update: {
          created_at?: string
          description?: string
          diagnosed_by?: string | null
          icd10_code?: string
          id?: string
          is_primary?: boolean
          onset_date?: string | null
          org_id?: string
          patient_id?: string
          resolved_date?: string | null
          status?: Database["public"]["Enums"]["diagnosis_status"]
        }
        Relationships: [
          {
            foreignKeyName: "patient_diagnoses_diagnosed_by_fkey"
            columns: ["diagnosed_by"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_diagnoses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_diagnoses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_insurance: {
        Row: {
          authorization_number: string | null
          authorized_sessions: number | null
          coinsurance_pct: number | null
          copay_amount: number | null
          created_at: string
          deductible_amount: number | null
          effective_date: string | null
          group_number: string | null
          id: string
          member_id: string | null
          org_id: string
          patient_id: string
          payer_id: string
          priority: Database["public"]["Enums"]["insurance_priority"]
          sessions_used: number | null
          subscriber_name: string | null
          termination_date: string | null
        }
        Insert: {
          authorization_number?: string | null
          authorized_sessions?: number | null
          coinsurance_pct?: number | null
          copay_amount?: number | null
          created_at?: string
          deductible_amount?: number | null
          effective_date?: string | null
          group_number?: string | null
          id?: string
          member_id?: string | null
          org_id: string
          patient_id: string
          payer_id: string
          priority?: Database["public"]["Enums"]["insurance_priority"]
          sessions_used?: number | null
          subscriber_name?: string | null
          termination_date?: string | null
        }
        Update: {
          authorization_number?: string | null
          authorized_sessions?: number | null
          coinsurance_pct?: number | null
          copay_amount?: number | null
          created_at?: string
          deductible_amount?: number | null
          effective_date?: string | null
          group_number?: string | null
          id?: string
          member_id?: string | null
          org_id?: string
          patient_id?: string
          payer_id?: string
          priority?: Database["public"]["Enums"]["insurance_priority"]
          sessions_used?: number | null
          subscriber_name?: string | null
          termination_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_insurance_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_insurance_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_insurance_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "insurance_payers"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: Json | null
          created_at: string
          dob: string
          email: string | null
          emergency_contact: Json | null
          first_name: string
          gender: string | null
          id: string
          last_name: string
          org_id: string
          phone: string | null
          status: Database["public"]["Enums"]["patient_status"]
          updated_at: string
        }
        Insert: {
          address?: Json | null
          created_at?: string
          dob: string
          email?: string | null
          emergency_contact?: Json | null
          first_name: string
          gender?: string | null
          id?: string
          last_name: string
          org_id: string
          phone?: string | null
          status?: Database["public"]["Enums"]["patient_status"]
          updated_at?: string
        }
        Update: {
          address?: Json | null
          created_at?: string
          dob?: string
          email?: string | null
          emergency_contact?: Json | null
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          org_id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["patient_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          created_at: string
          credentials: string | null
          id: string
          license_number: string | null
          license_state: string | null
          npi: string | null
          org_id: string
          preferred_note_format: Database["public"]["Enums"]["note_format"]
          specialty: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          credentials?: string | null
          id?: string
          license_number?: string | null
          license_state?: string | null
          npi?: string | null
          org_id: string
          preferred_note_format?: Database["public"]["Enums"]["note_format"]
          specialty?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          credentials?: string | null
          id?: string
          license_number?: string | null
          license_state?: string | null
          npi?: string | null
          org_id?: string
          preferred_note_format?: Database["public"]["Enums"]["note_format"]
          specialty?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "providers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "providers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_plans: {
        Row: {
          ai_run_id: string | null
          created_at: string
          diagnosis_codes: Json | null
          goals: Json | null
          id: string
          interventions: Json | null
          is_current: boolean
          objectives: Json | null
          org_id: string
          patient_id: string
          previous_version_id: string | null
          provider_id: string
          review_date: string | null
          signed_at: string | null
          status: Database["public"]["Enums"]["treatment_plan_status"]
          version: number
        }
        Insert: {
          ai_run_id?: string | null
          created_at?: string
          diagnosis_codes?: Json | null
          goals?: Json | null
          id?: string
          interventions?: Json | null
          is_current?: boolean
          objectives?: Json | null
          org_id: string
          patient_id: string
          previous_version_id?: string | null
          provider_id: string
          review_date?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["treatment_plan_status"]
          version?: number
        }
        Update: {
          ai_run_id?: string | null
          created_at?: string
          diagnosis_codes?: Json | null
          goals?: Json | null
          id?: string
          interventions?: Json | null
          is_current?: boolean
          objectives?: Json | null
          org_id?: string
          patient_id?: string
          previous_version_id?: string | null
          provider_id?: string
          review_date?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["treatment_plan_status"]
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plans_ai_run_id_fkey"
            columns: ["ai_run_id"]
            isOneToOne: false
            referencedRelation: "ai_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plans_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plans_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plans_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          org_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          auth_id?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          org_id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          auth_id?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          org_id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      utilization_reviews: {
        Row: {
          ai_run_id: string | null
          approved_at: string | null
          approved_by: string | null
          authorization_period_end: string | null
          authorization_period_start: string | null
          created_at: string
          generated_content: Json
          id: string
          org_id: string
          patient_id: string
          patient_insurance_id: string | null
          provider_edits: Json | null
          provider_id: string
          review_type: Database["public"]["Enums"]["ur_review_type"]
          sessions_authorized: number | null
          sessions_requested: number | null
          sessions_used: number | null
          status: Database["public"]["Enums"]["ur_status"]
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          ai_run_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          authorization_period_end?: string | null
          authorization_period_start?: string | null
          created_at?: string
          generated_content: Json
          id?: string
          org_id: string
          patient_id: string
          patient_insurance_id?: string | null
          provider_edits?: Json | null
          provider_id: string
          review_type?: Database["public"]["Enums"]["ur_review_type"]
          sessions_authorized?: number | null
          sessions_requested?: number | null
          sessions_used?: number | null
          status?: Database["public"]["Enums"]["ur_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          ai_run_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          authorization_period_end?: string | null
          authorization_period_start?: string | null
          created_at?: string
          generated_content?: Json
          id?: string
          org_id?: string
          patient_id?: string
          patient_insurance_id?: string | null
          provider_edits?: Json | null
          provider_id?: string
          review_type?: Database["public"]["Enums"]["ur_review_type"]
          sessions_authorized?: number | null
          sessions_requested?: number | null
          sessions_used?: number | null
          status?: Database["public"]["Enums"]["ur_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "utilization_reviews_ai_run_id_fkey"
            columns: ["ai_run_id"]
            isOneToOne: false
            referencedRelation: "ai_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utilization_reviews_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utilization_reviews_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utilization_reviews_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utilization_reviews_patient_insurance_id_fkey"
            columns: ["patient_insurance_id"]
            isOneToOne: false
            referencedRelation: "patient_insurance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utilization_reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_org_id: { Args: never; Returns: string }
      get_user_id: { Args: never; Returns: string }
    }
    Enums: {
      ai_action_status: "pending" | "committed" | "rejected" | "expired"
      ai_action_type:
        | "create_note_draft"
        | "create_encounter"
        | "suggest_billing"
        | "update_medication"
        | "create_appointment"
        | "generate_utilization_review"
        | "create_treatment_plan"
      ai_run_status:
        | "pending"
        | "running"
        | "needs_clarification"
        | "ready_to_commit"
        | "committed"
        | "failed"
      ai_step_type: "llm_call" | "tool_call" | "tool_result" | "error"
      appointment_status: "scheduled" | "completed" | "cancelled" | "no_show"
      assessment_measure_type: "PHQ-9" | "GAD-7" | "PCL-5" | "AUDIT-C" | "CSSRS"
      assessment_score_source: "ai_tool" | "manual_entry" | "client_portal"
      claim_status:
        | "draft"
        | "ready"
        | "submitted"
        | "accepted"
        | "rejected"
        | "denied"
        | "paid"
        | "appealed"
      diagnosis_status: "active" | "resolved" | "ruled_out"
      encounter_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      encounter_type:
        | "individual_therapy"
        | "group_therapy"
        | "family_therapy"
        | "intake"
        | "crisis"
        | "telehealth"
        | "medication_management"
      insurance_priority: "primary" | "secondary" | "tertiary"
      medication_status: "active" | "discontinued" | "changed"
      note_draft_status: "pending_review" | "accepted" | "rejected"
      note_format: "SOAP" | "DAP" | "BIRP"
      note_status: "draft" | "signed" | "amended" | "addended"
      note_type: "SOAP" | "DAP" | "BIRP" | "intake" | "discharge"
      patient_status: "active" | "inactive" | "discharged"
      signature_type: "author" | "cosigner" | "supervisor"
      treatment_plan_status: "draft" | "active" | "completed" | "discontinued"
      ur_review_type: "initial" | "concurrent" | "retrospective"
      ur_status:
        | "draft"
        | "pending_review"
        | "approved"
        | "submitted"
        | "denied"
        | "appealed"
      user_role: "admin" | "provider" | "billing" | "staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_action_status: ["pending", "committed", "rejected", "expired"],
      ai_action_type: [
        "create_note_draft",
        "create_encounter",
        "suggest_billing",
        "update_medication",
        "create_appointment",
        "generate_utilization_review",
        "create_treatment_plan",
      ],
      ai_run_status: [
        "pending",
        "running",
        "needs_clarification",
        "ready_to_commit",
        "committed",
        "failed",
      ],
      ai_step_type: ["llm_call", "tool_call", "tool_result", "error"],
      appointment_status: ["scheduled", "completed", "cancelled", "no_show"],
      assessment_measure_type: ["PHQ-9", "GAD-7", "PCL-5", "AUDIT-C", "CSSRS"],
      assessment_score_source: ["ai_tool", "manual_entry", "client_portal"],
      claim_status: [
        "draft",
        "ready",
        "submitted",
        "accepted",
        "rejected",
        "denied",
        "paid",
        "appealed",
      ],
      diagnosis_status: ["active", "resolved", "ruled_out"],
      encounter_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      encounter_type: [
        "individual_therapy",
        "group_therapy",
        "family_therapy",
        "intake",
        "crisis",
        "telehealth",
        "medication_management",
      ],
      insurance_priority: ["primary", "secondary", "tertiary"],
      medication_status: ["active", "discontinued", "changed"],
      note_draft_status: ["pending_review", "accepted", "rejected"],
      note_format: ["SOAP", "DAP", "BIRP"],
      note_status: ["draft", "signed", "amended", "addended"],
      note_type: ["SOAP", "DAP", "BIRP", "intake", "discharge"],
      patient_status: ["active", "inactive", "discharged"],
      signature_type: ["author", "cosigner", "supervisor"],
      treatment_plan_status: ["draft", "active", "completed", "discontinued"],
      ur_review_type: ["initial", "concurrent", "retrospective"],
      ur_status: [
        "draft",
        "pending_review",
        "approved",
        "submitted",
        "denied",
        "appealed",
      ],
      user_role: ["admin", "provider", "billing", "staff"],
    },
  },
} as const

'use client';

import { useState, useEffect, useCallback } from 'react';
import { PortalHeader } from './portal-header';
import { PortalTabBar } from './portal-tab-bar';
import { BreathingFab } from '../tools/breathing-fab';
import { BreathingWidget } from '../tools/breathing-widget';
import { AssessmentFlow } from '../assessments/assessment-flow';
import { IntakeFlow } from '../intake/intake-flow';
import type { ReactNode } from 'react';

interface PatientInfo {
  firstName: string;
  lastName: string;
}

interface AssessmentItem {
  id: string;
  measure_type: string;
  status: string;
  responses: Array<{ question_index: number; answer_value: number }> | null;
}

interface IntakePacketItem {
  id: string;
  item_key: string;
  item_label: string;
  item_type: string;
  status: string;
  sort_order: number;
  responses: Record<string, unknown> | null;
}

interface IntakePacket {
  id: string;
  status: string;
  items: IntakePacketItem[];
}

export function PortalShell({ children }: { children: ReactNode }) {
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [breathingOpen, setBreathingOpen] = useState(false);
  const [assessmentData, setAssessmentData] = useState<AssessmentItem[] | null>(null);
  const [intakeData, setIntakeData] = useState<IntakePacket | null>(null);

  useEffect(() => {
    fetch('/api/portal/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.patient) {
          setPatient({
            firstName: data.patient.first_name,
            lastName: data.patient.last_name,
          });
        }
      })
      .catch(console.error);
  }, []);

  // Listen for assessment start event from portal home page
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.assessments) {
        setAssessmentData(detail.assessments);
      }
    };
    window.addEventListener('indra:portal-assessment', handler);
    return () => window.removeEventListener('indra:portal-assessment', handler);
  }, []);

  // Listen for intake flow start event from portal home page
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.packet) {
        setIntakeData(detail.packet);
      }
    };
    window.addEventListener('indra:portal-intake', handler);
    return () => window.removeEventListener('indra:portal-intake', handler);
  }, []);

  const handleAssessmentClose = useCallback(() => {
    setAssessmentData(null);
  }, []);

  const handleIntakeClose = useCallback(() => {
    setIntakeData(null);
  }, []);

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <PortalHeader
        firstName={patient?.firstName ?? ''}
        lastName={patient?.lastName ?? ''}
      />
      <main style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div className="px-5 py-6 max-w-lg mx-auto">{children}</div>
      </main>
      <PortalTabBar />
      <BreathingFab onClick={() => setBreathingOpen(true)} />
      {breathingOpen && <BreathingWidget onClose={() => setBreathingOpen(false)} />}
      {assessmentData && (
        <AssessmentFlow
          assessments={assessmentData}
          onClose={handleAssessmentClose}
        />
      )}
      {intakeData && (
        <IntakeFlow
          packet={intakeData}
          onClose={handleIntakeClose}
        />
      )}
    </div>
  );
}

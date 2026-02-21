'use client';

import { useState, useEffect } from 'react';
import { Greeting } from '@/components/portal/home/greeting';
import { NextAppointment } from '@/components/portal/home/next-appointment';
import { PendingAssessmentCard } from '@/components/portal/home/pending-assessment';
import { MoodMoment } from '@/components/portal/home/mood-moment';
import { WellnessSnapshot } from '@/components/portal/home/wellness-snapshot';
import { QuickActions } from '@/components/portal/home/quick-actions';

interface PatientInfo {
  first_name: string;
  last_name: string;
}

interface PendingAssessment {
  id: string;
  measure_type: string;
  status: string;
  responses: Array<{ question_index: number; answer_value: number }> | null;
}

export default function PortalHomePage() {
  const [patient, setPatient] = useState<PatientInfo | null>(null);

  useEffect(() => {
    fetch('/api/portal/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.patient) setPatient(data.patient);
      })
      .catch(console.error);
  }, []);

  const handleBeginAssessment = (assessments: PendingAssessment[]) => {
    // Dispatch custom event for portal shell to open the assessment flow
    window.dispatchEvent(
      new CustomEvent('indra:portal-assessment', { detail: { assessments } })
    );
  };

  return (
    <>
      <Greeting
        firstName={patient?.first_name ?? ''}
      />
      <NextAppointment />
      <PendingAssessmentCard onBegin={handleBeginAssessment} />
      <MoodMoment />
      <WellnessSnapshot />
      <QuickActions />
    </>
  );
}

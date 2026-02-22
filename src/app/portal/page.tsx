'use client';

import { useState, useEffect } from 'react';
import { Greeting } from '@/components/portal/home/greeting';
import { NextAppointment } from '@/components/portal/home/next-appointment';
import { PendingIntakeCard } from '@/components/portal/home/pending-intake';
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

interface IntakePacketItem {
  id: string;
  item_key: string;
  item_label: string;
  item_type: string;
  status: string;
  sort_order: number;
}

interface IntakePacket {
  id: string;
  status: string;
  items: IntakePacketItem[];
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
    window.dispatchEvent(
      new CustomEvent('indra:portal-assessment', { detail: { assessments } })
    );
  };

  const handleBeginIntake = (packet: IntakePacket) => {
    window.dispatchEvent(
      new CustomEvent('indra:portal-intake', { detail: { packet } })
    );
  };

  return (
    <>
      <Greeting
        firstName={patient?.first_name ?? ''}
      />
      <NextAppointment />
      <PendingIntakeCard onBegin={handleBeginIntake} />
      <PendingAssessmentCard onBegin={handleBeginAssessment} />
      <MoodMoment />
      <WellnessSnapshot />
      <QuickActions />
    </>
  );
}

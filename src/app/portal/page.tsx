'use client';

import { useState, useEffect } from 'react';
import { Greeting } from '@/components/portal/home/greeting';
import { NextAppointment } from '@/components/portal/home/next-appointment';
import { MoodMoment } from '@/components/portal/home/mood-moment';
import { WellnessSnapshot } from '@/components/portal/home/wellness-snapshot';
import { QuickActions } from '@/components/portal/home/quick-actions';

interface PatientInfo {
  first_name: string;
  last_name: string;
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

  return (
    <>
      <Greeting
        firstName={patient?.first_name ?? ''}
      />
      <NextAppointment />
      <MoodMoment />
      <WellnessSnapshot />
      <QuickActions />
    </>
  );
}

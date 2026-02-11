'use client';

import { useState, useEffect } from 'react';
import { PortalHeader } from './portal-header';
import { PortalTabBar } from './portal-tab-bar';
import { BreathingFab } from '../tools/breathing-fab';
import { BreathingWidget } from '../tools/breathing-widget';
import type { ReactNode } from 'react';

interface PatientInfo {
  firstName: string;
  lastName: string;
}

export function PortalShell({ children }: { children: ReactNode }) {
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [breathingOpen, setBreathingOpen] = useState(false);

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
    </div>
  );
}

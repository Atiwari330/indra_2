'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { ClientCard } from '@/components/clients/client-card';
import { SearchInput } from '@/components/ui/search-input';
import { PageHeader } from '@/components/ui/page-header';
import { staggerContainer, cardItem } from '@/lib/animations';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  status: 'active' | 'inactive' | 'discharged';
}

interface ClientGridProps {
  patients: Patient[];
}

export function ClientGrid({ patients }: ClientGridProps) {
  const [search, setSearch] = useState('');

  const filtered = patients.filter((p) => {
    const term = search.toLowerCase();
    return (
      p.first_name.toLowerCase().includes(term) ||
      p.last_name.toLowerCase().includes(term)
    );
  });

  const activeCount = patients.filter((p) => p.status === 'active').length;

  return (
    <>
      <PageHeader
        title="Clients"
        subtitle={`${activeCount} active client${activeCount !== 1 ? 's' : ''}`}
        actions={
          <div className="w-64">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search clients..."
            />
          </div>
        }
      />

      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {filtered.map((patient) => (
          <motion.div key={patient.id} variants={cardItem}>
            <ClientCard
              id={patient.id}
              firstName={patient.first_name}
              lastName={patient.last_name}
              dob={patient.dob}
              status={patient.status}
            />
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && search && (
        <p className="mt-8 text-center text-footnote">
          No clients match &ldquo;{search}&rdquo;
        </p>
      )}
    </>
  );
}

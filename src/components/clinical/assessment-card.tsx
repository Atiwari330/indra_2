'use client';

import { useState, useEffect, useCallback } from 'react';
import { ClipboardCheck, Plus } from 'lucide-react';
import { SendAssessmentPopover } from './send-assessment-popover';
import { AssessmentResultsPanel } from './assessment-results-panel';
import { formatDate } from '@/lib/format';

interface AssessmentRequest {
  id: string;
  measure_type: string;
  status: string;
  total_score: number | null;
  severity: string | null;
  requested_at: string;
  completed_at: string | null;
  responses: Array<{ question_index: number; answer_value: number }> | null;
}

interface AssessmentCardProps {
  patientId: string;
  patientFirstName: string;
}

export function AssessmentCard({ patientId, patientFirstName }: AssessmentCardProps) {
  const [requests, setRequests] = useState<AssessmentRequest[]>([]);
  const [showPopover, setShowPopover] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchAssessments = useCallback(() => {
    fetch(`/api/patients/${patientId}/assessments`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRequests(data);
      })
      .catch(console.error);
  }, [patientId]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  // Poll for updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(fetchAssessments, 5000);
    return () => clearInterval(interval);
  }, [fetchAssessments]);

  const handleSent = useCallback(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const selectedRequest = requests.find((r) => r.id === selectedId) ?? null;

  const isEmpty = requests.length === 0;

  if (isEmpty) {
    return (
      <div className="relative">
        <div
          className="flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-3"
          style={{ border: '1px dashed var(--color-border)' }}
        >
          <span style={{ color: 'var(--color-text-tertiary)' }}>
            <ClipboardCheck size={18} strokeWidth={1.8} />
          </span>
          <span className="text-callout" style={{ color: 'var(--color-text-tertiary)' }}>
            Assessments
          </span>
          <span className="ml-auto flex items-center gap-2">
            <span className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
              No assessments sent
            </span>
            <button
              onClick={() => setShowPopover(true)}
              className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-bg-tertiary)]"
              style={{ color: 'var(--color-text-tertiary)' }}
              title="Send Assessment"
            >
              <Plus size={14} strokeWidth={2} />
            </button>
          </span>
        </div>
        {showPopover && (
          <SendAssessmentPopover
            patientId={patientId}
            patientFirstName={patientFirstName}
            onClose={() => setShowPopover(false)}
            onSent={handleSent}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className="rounded-[var(--radius-lg)] p-4"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="mb-3 flex items-center gap-2">
          <span style={{ color: 'var(--color-accent)' }}>
            <ClipboardCheck size={18} strokeWidth={1.8} />
          </span>
          <h3 className="text-callout font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Assessments
          </h3>
          <span className="ml-auto">
            <button
              onClick={() => setShowPopover(true)}
              className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-bg-tertiary)]"
              style={{ color: 'var(--color-text-tertiary)' }}
              title="Send Assessment"
            >
              <Plus size={14} strokeWidth={2} />
            </button>
          </span>
        </div>
        <div className="space-y-2">
          {requests.map((r) => (
            <button
              key={r.id}
              onClick={() => r.status === 'completed' ? setSelectedId(r.id) : undefined}
              className="flex w-full items-center justify-between rounded-[var(--radius-sm)] px-2 py-1.5 text-left transition-colors hover:bg-[var(--color-bg-tertiary)]"
              style={{ cursor: r.status === 'completed' ? 'pointer' : 'default' }}
            >
              <div>
                <p className="text-callout" style={{ color: 'var(--color-text-primary)' }}>
                  {r.measure_type}
                </p>
                <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
                  {formatDate((r.completed_at ?? r.requested_at).split('T')[0])}
                </p>
              </div>
              <StatusPill status={r.status} score={r.total_score} severity={r.severity} />
            </button>
          ))}
        </div>
      </div>

      {showPopover && (
        <SendAssessmentPopover
          patientId={patientId}
          patientFirstName={patientFirstName}
          onClose={() => setShowPopover(false)}
          onSent={handleSent}
        />
      )}

      <AssessmentResultsPanel
        request={selectedRequest}
        onClose={() => setSelectedId(null)}
        onReassess={() => {
          setSelectedId(null);
          setShowPopover(true);
        }}
      />
    </div>
  );
}

function StatusPill({
  status,
  score,
  severity,
}: {
  status: string;
  score: number | null;
  severity: string | null;
}) {
  if (status === 'completed') {
    return (
      <span
        className="rounded-full px-2 py-0.5 text-caption"
        style={{
          background: 'color-mix(in srgb, var(--color-success) 12%, transparent)',
          color: 'var(--color-success)',
        }}
      >
        {score !== null ? `${score}` : ''}{severity ? ` · ${severity}` : ''}
      </span>
    );
  }

  if (status === 'in_progress') {
    return (
      <span
        className="rounded-full px-2 py-0.5 text-caption"
        style={{
          background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
          color: 'var(--color-accent)',
        }}
      >
        in progress
      </span>
    );
  }

  return (
    <span
      className="rounded-full px-2 py-0.5 text-caption"
      style={{
        background: 'color-mix(in srgb, var(--color-warning) 12%, transparent)',
        color: 'var(--color-warning)',
      }}
    >
      pending
    </span>
  );
}

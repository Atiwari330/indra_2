'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileCheck, Plus } from 'lucide-react';
import { SendIntakePopover } from './send-intake-popover';
import { IntakeResponsesPanel } from './intake-responses-panel';
import { formatDate } from '@/lib/format';

interface IntakePacketItem {
  id: string;
  item_key: string;
  item_label: string;
  item_type: string;
  status: string;
  sort_order: number;
  signature_name: string | null;
  signed_at: string | null;
  completed_at: string | null;
  responses: Record<string, unknown> | null;
}

interface IntakePacket {
  id: string;
  status: string;
  requested_at: string;
  completed_at: string | null;
  items: IntakePacketItem[];
}

interface IntakePaperworkCardProps {
  patientId: string;
  patientFirstName: string;
}

export function IntakePaperworkCard({ patientId, patientFirstName }: IntakePaperworkCardProps) {
  const [packet, setPacket] = useState<IntakePacket | null>(null);
  const [showPopover, setShowPopover] = useState(false);
  const [showResponses, setShowResponses] = useState(false);

  const fetchPacket = useCallback(() => {
    fetch(`/api/patients/${patientId}/intake-packet`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.id) setPacket(data);
      })
      .catch(console.error);
  }, [patientId]);

  useEffect(() => {
    fetchPacket();
  }, [fetchPacket]);

  // Poll for updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(fetchPacket, 5000);
    return () => clearInterval(interval);
  }, [fetchPacket]);

  const handleSent = useCallback(() => {
    fetchPacket();
  }, [fetchPacket]);

  if (!packet) {
    return (
      <div className="relative">
        <div
          className="flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-3"
          style={{ border: '1px dashed var(--color-border)' }}
        >
          <span style={{ color: 'var(--color-text-tertiary)' }}>
            <FileCheck size={18} strokeWidth={1.8} />
          </span>
          <span className="text-callout" style={{ color: 'var(--color-text-tertiary)' }}>
            Intake Paperwork
          </span>
          <span className="ml-auto flex items-center gap-2">
            <span className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
              Not sent
            </span>
            <button
              onClick={() => setShowPopover(true)}
              className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-bg-tertiary)]"
              style={{ color: 'var(--color-text-tertiary)' }}
              title="Send Intake Paperwork"
            >
              <Plus size={14} strokeWidth={2} />
            </button>
          </span>
        </div>
        {showPopover && (
          <SendIntakePopover
            patientId={patientId}
            patientFirstName={patientFirstName}
            onClose={() => setShowPopover(false)}
            onSent={handleSent}
          />
        )}
      </div>
    );
  }

  const completedItems = packet.items.filter((i) => i.status === 'completed');
  const totalItems = packet.items.length;

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
            <FileCheck size={18} strokeWidth={1.8} />
          </span>
          <h3 className="text-callout font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Intake Paperwork
          </h3>
          {packet.status === 'completed' && (
            <span className="ml-auto text-caption" style={{ color: 'var(--color-success)' }}>
              {completedItems.length}/{totalItems} completed
            </span>
          )}
          {packet.status !== 'completed' && (
            <span className="ml-auto text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
              {completedItems.length}/{totalItems}
            </span>
          )}
        </div>
        <div className="space-y-2">
          {packet.items.map((item) => (
            <button
              key={item.id}
              onClick={() => item.status === 'completed' && item.item_type === 'intake_questionnaire' ? setShowResponses(true) : undefined}
              className="flex w-full items-center justify-between rounded-[var(--radius-sm)] px-2 py-1.5 text-left transition-colors hover:bg-[var(--color-bg-tertiary)]"
              style={{ cursor: item.status === 'completed' && item.item_type === 'intake_questionnaire' ? 'pointer' : 'default' }}
            >
              <div>
                <p className="text-callout" style={{ color: 'var(--color-text-primary)' }}>
                  {item.item_label}
                </p>
                {item.status === 'completed' && item.item_type === 'consent_document' && item.signed_at && (
                  <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
                    Signed {formatDate(item.signed_at.split('T')[0])}
                    {item.signature_name ? ` · ${item.signature_name}` : ''}
                  </p>
                )}
                {item.status === 'completed' && item.item_type === 'intake_questionnaire' && item.completed_at && (
                  <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
                    Completed {formatDate(item.completed_at.split('T')[0])}
                  </p>
                )}
              </div>
              <ItemStatusPill status={item.status} />
            </button>
          ))}
        </div>
      </div>

      <IntakeResponsesPanel
        isOpen={showResponses}
        onClose={() => setShowResponses(false)}
        items={packet.items}
        patientFirstName={patientFirstName}
      />
    </div>
  );
}

function ItemStatusPill({ status }: { status: string }) {
  if (status === 'completed') {
    return (
      <span
        className="rounded-full px-2 py-0.5 text-caption"
        style={{
          background: 'color-mix(in srgb, var(--color-success) 12%, transparent)',
          color: 'var(--color-success)',
        }}
      >
        completed
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

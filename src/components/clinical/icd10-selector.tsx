'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { ICD10_MENTAL_HEALTH, type ICD10Code } from '@/lib/data/icd10-mental-health';

interface ICD10SelectorProps {
  onSelect: (code: ICD10Code) => void;
  onClose: () => void;
  excludeCodes?: string[];
}

export function ICD10Selector({ onSelect, onClose, excludeCodes = [] }: ICD10SelectorProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    const available = ICD10_MENTAL_HEALTH.filter((c) => !excludeCodes.includes(c.code));
    if (!query.trim()) return available;
    const lower = query.toLowerCase();
    return available.filter(
      (c) => c.code.toLowerCase().includes(lower) || c.description.toLowerCase().includes(lower)
    );
  }, [query, excludeCodes]);

  const grouped = useMemo(() => {
    const groups: Record<string, ICD10Code[]> = {};
    for (const code of filtered) {
      if (!groups[code.category]) groups[code.category] = [];
      groups[code.category].push(code);
    }
    return groups;
  }, [filtered]);

  return (
    <div
      className="overflow-hidden rounded-[var(--radius-lg)]"
      style={{
        background: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-lg, 0 10px 25px rgba(0,0,0,0.1))',
      }}
    >
      {/* Search header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <Search size={16} strokeWidth={1.8} style={{ color: 'var(--color-text-tertiary)' }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ICD-10 codes..."
          className="flex-1 bg-transparent text-callout outline-none placeholder:text-[var(--color-text-tertiary)]"
          style={{ color: 'var(--color-text-primary)' }}
        />
        <button
          onClick={onClose}
          className="rounded-full p-1 transition-colors hover:bg-[var(--color-bg-tertiary)]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>

      {/* Results */}
      <div className="max-h-64 overflow-y-auto p-1">
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-center text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
            No matching codes
          </p>
        ) : (
          Object.entries(grouped).map(([category, codes]) => (
            <div key={category} className="mb-1">
              <p
                className="px-3 py-1.5 text-caption font-medium uppercase tracking-wider"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {category}
              </p>
              {codes.map((code) => (
                <button
                  key={code.code}
                  onClick={() => onSelect(code)}
                  className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-left transition-colors hover:bg-[var(--color-bg-tertiary)]"
                >
                  <span
                    className="inline-block shrink-0 rounded-[var(--radius-sm)] px-1.5 py-0.5 text-caption font-mono font-medium"
                    style={{
                      background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                      color: 'var(--color-accent)',
                    }}
                  >
                    {code.code}
                  </span>
                  <span className="text-callout" style={{ color: 'var(--color-text-primary)' }}>
                    {code.description}
                  </span>
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

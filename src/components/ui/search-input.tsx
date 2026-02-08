'use client';

import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Search...' }: SearchInputProps) {
  return (
    <div
      className="relative flex items-center rounded-[var(--radius-full)] px-3 py-2 transition-shadow focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-[var(--color-accent)]"
      style={{
        background: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border)',
      }}
    >
      <Search
        size={16}
        strokeWidth={1.8}
        style={{ color: 'var(--color-text-tertiary)' }}
        className="mr-2 flex-shrink-0"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-callout outline-none placeholder:text-[var(--color-text-tertiary)]"
        style={{ color: 'var(--color-text-primary)' }}
      />
    </div>
  );
}

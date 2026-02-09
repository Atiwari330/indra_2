import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

interface MarkdownProps {
  text: string;
}

const components: Components = {
  p: ({ children }) => (
    <p style={{ marginBottom: '0.5em', color: 'var(--color-text-secondary)' }}>
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
      {children}
    </strong>
  ),
  em: ({ children }) => <em>{children}</em>,
  ul: ({ children }) => (
    <ul style={{ paddingLeft: '1.25em', marginBottom: '0.5em', listStyleType: 'disc' }}>
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol style={{ paddingLeft: '1.25em', marginBottom: '0.5em', listStyleType: 'decimal' }}>
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li style={{ marginBottom: '0.2em', color: 'var(--color-text-secondary)' }}>
      {children}
    </li>
  ),
};

export function Markdown({ text }: MarkdownProps) {
  return <ReactMarkdown components={components}>{text}</ReactMarkdown>;
}

import React from 'react';

interface MarkdownTextProps {
  content: string;
  isRTL?: boolean;
  className?: string;
}

type BlockGroup =
  | { type: 'paragraph'; lines: string[] }
  | { type: 'heading'; level: number; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'code'; language?: string; lines: string[] };

const INLINE_RE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

function parseInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // eslint-disable-next-line no-cond-assign
  while ((match = INLINE_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <span key={`${keyPrefix}-text-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>
      );
    }

    const raw = match[0];
    const key = `${keyPrefix}-inline-${match.index}`;

    if (raw.startsWith('**') && raw.endsWith('**')) {
      nodes.push(<strong key={key}>{raw.slice(2, -2)}</strong>);
    } else if (raw.startsWith('*') && raw.endsWith('*')) {
      nodes.push(<em key={key}>{raw.slice(1, -1)}</em>);
    } else if (raw.startsWith('`') && raw.endsWith('`')) {
      nodes.push(
        <code
          key={key}
          className="rounded bg-slate-100 px-1 py-0.5 text-[11px] font-mono text-slate-700 dark:bg-slate-700 dark:text-slate-200"
        >
          {raw.slice(1, -1)}
        </code>
      );
    } else if (raw.startsWith('[')) {
      const linkMatch = raw.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        nodes.push(
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-teal-600 underline hover:text-teal-700 dark:text-teal-400"
          >
            {label}
          </a>
        );
      } else {
        nodes.push(<span key={key}>{raw}</span>);
      }
    } else {
      nodes.push(<span key={key}>{raw}</span>);
    }

    lastIndex = match.index + raw.length;
  }

  if (lastIndex < text.length) {
    nodes.push(<span key={`${keyPrefix}-text-end`}>{text.slice(lastIndex)}</span>);
  }

  return nodes;
}

function parseBlocks(content: string): BlockGroup[] {
  const lines = content.split('\n');
  const groups: BlockGroup[] = [];
  let codeGroup: BlockGroup | null = null;
  let listGroup: BlockGroup | null = null;

  const flushList = () => {
    if (listGroup) {
      groups.push(listGroup);
      listGroup = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (codeGroup) {
      if (line.trim().startsWith('```')) {
        groups.push(codeGroup);
        codeGroup = null;
      } else {
        codeGroup.lines.push(line);
      }
      continue;
    }

    if (line.trim().startsWith('```')) {
      flushList();
      const lang = line.trim().slice(3).trim() || undefined;
      codeGroup = { type: 'code', language: lang, lines: [] };
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      groups.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2].trim() });
      continue;
    }

    const ulMatch = line.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      if (listGroup && listGroup.type === 'ul') {
        listGroup.items.push(ulMatch[1].trim());
      } else {
        flushList();
        listGroup = { type: 'ul', items: [ulMatch[1].trim()] };
      }
      continue;
    }

    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      if (listGroup && listGroup.type === 'ol') {
        listGroup.items.push(olMatch[1].trim());
      } else {
        flushList();
        listGroup = { type: 'ol', items: [olMatch[1].trim()] };
      }
      continue;
    }

    // End of list region
    flushList();

    const trimmed = line.trim();
    if (trimmed === '') {
      // Paragraph break: push empty paragraph placeholder
      if (groups.length > 0 && groups[groups.length - 1].type === 'paragraph') {
        // separate paragraphs with blank line visually
        groups.push({ type: 'paragraph', lines: [] });
      }
      continue;
    }

    if (groups.length > 0 && groups[groups.length - 1].type === 'paragraph') {
      const last = groups[groups.length - 1] as { type: 'paragraph'; lines: string[] };
      if (last.lines.length === 0) {
        // previous was a blank-line separator; start a new paragraph
        groups.push({ type: 'paragraph', lines: [trimmed] });
      } else {
        last.lines.push(trimmed);
      }
    } else {
      groups.push({ type: 'paragraph', lines: [trimmed] });
    }
  }

  flushList();
  if (codeGroup) groups.push(codeGroup);

  return groups;
}

export const MarkdownText: React.FC<MarkdownTextProps> = ({ content, isRTL = false, className = '' }) => {
  const groups = parseBlocks(content);

  return (
    <div className={`prose prose-sm max-w-none ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {groups.map((group, idx) => {
        const key = `md-${idx}`;

        if (group.type === 'heading') {
          const Heading = (`h${group.level + 3}` as 'h4' | 'h5' | 'h6') || 'h4';
          return (
            <Heading key={key} className="font-semibold text-slate-900 dark:text-slate-100 mt-2 mb-1">
              {parseInline(group.text, `${key}-inline`)}
            </Heading>
          );
        }

        if (group.type === 'ul') {
          return (
            <ul key={key} className="list-disc pl-4 my-1.5 space-y-0.5 text-slate-700 dark:text-slate-200">
              {group.items.map((item, i) => (
                <li key={`${key}-li-${i}`}>{parseInline(item, `${key}-li-${i}-inline`)}</li>
              ))}
            </ul>
          );
        }

        if (group.type === 'ol') {
          return (
            <ol key={key} className="list-decimal pl-4 my-1.5 space-y-0.5 text-slate-700 dark:text-slate-200">
              {group.items.map((item, i) => (
                <li key={`${key}-li-${i}`}>{parseInline(item, `${key}-li-${i}-inline`)}</li>
              ))}
            </ol>
          );
        }

        if (group.type === 'code') {
          return (
            <pre
              key={key}
              className="my-2 rounded-lg bg-slate-900 p-3 overflow-x-auto"
            >
              <code className="block text-[11px] font-mono text-slate-100">
                {group.lines.join('\n')}
              </code>
            </pre>
          );
        }

        // paragraph
        if (group.lines.length === 0) {
          return <div key={key} className="h-2" />;
        }

        return (
          <p key={key} className="text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap my-1">
            {parseInline(group.lines.join(' '), `${key}-inline`)}
          </p>
        );
      })}
    </div>
  );
};

export default MarkdownText;

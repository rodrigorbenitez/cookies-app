import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router';
import { useMemo } from 'react';
import { linkifyTags } from '../lib/tags';

/** Renders recipe instructions (headings, lists, bold…) with clickable #tags. */
export function Markdown({ text }: { text: string }) {
  const source = useMemo(() => linkifyTags(text), [text]);
  return (
    <div className="prose-recipe">
      <ReactMarkdown
        skipHtml
        components={{
          a: ({ href, children }) =>
            href?.startsWith('/') ? (
              <Link to={href}>{children}</Link>
            ) : (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}

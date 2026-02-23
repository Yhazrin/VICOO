import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const inline = !match;

            if (inline) {
              return (
                <code
                  className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-sm font-mono text-pink-600 dark:text-pink-400"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                className="rounded-lg overflow-hidden my-3 text-sm"
                showLineNumbers={false}
                customStyle={{
                  margin: '1rem 0',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid var(--border-color, #1a1a1a)'
                }}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            );
          },
          a({ node, href, children, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300"
                {...props}
              >
                {children}
              </a>
            );
          },
          h1({ node, ...props }) {
            return (
              <h1
                className="text-2xl font-bold mt-6 mb-4 pb-2 border-b border-gray-300 dark:border-gray-600"
                {...props}
              />
            );
          },
          h2({ node, ...props }) {
            return (
              <h2
                className="text-xl font-bold mt-5 mb-3 pb-1 border-b border-gray-200 dark:border-gray-700"
                {...props}
              />
            );
          },
          h3({ node, ...props }) {
            return (
              <h3
                className="text-lg font-semibold mt-4 mb-2"
                {...props}
              />
            );
          },
          p({ node, ...props }) {
            return (
              <p
                className="my-3 leading-relaxed"
                {...props}
              />
            );
          },
          ul({ node, ...props }) {
            return (
              <ul
                className="my-3 ml-6 list-disc space-y-1"
                {...props}
              />
            );
          },
          ol({ node, ...props }) {
            return (
              <ol
                className="my-3 ml-6 list-decimal space-y-1"
                {...props}
              />
            );
          },
          li({ node, ...props }) {
            return (
              <li
                className="my-1"
                {...props}
              />
            );
          },
          blockquote({ node, ...props }) {
            return (
              <blockquote
                className="border-l-4 border-gray-400 dark:border-gray-500 pl-4 my-4 italic text-gray-600 dark:text-gray-400"
                {...props}
              />
            );
          },
          table({ node, ...props }) {
            return (
              <div className="overflow-x-auto my-4">
                <table
                  className="min-w-full border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden"
                  {...props}
                />
              </div>
            );
          },
          th({ node, ...props }) {
            return (
              <th
                className="bg-gray-100 dark:bg-gray-800 px-4 py-2 text-left font-semibold border-b border-gray-300 dark:border-gray-600"
                {...props}
              />
            );
          },
          td({ node, ...props }) {
            return (
              <td
                className="px-4 py-2 border-b border-gray-200 dark:border-gray-700"
                {...props}
              />
            );
          },
          hr({ node, ...props }) {
            return (
              <hr
                className="my-6 border-gray-300 dark:border-gray-600"
                {...props}
              />
            );
          },
          img({ node, ...props }) {
            return (
              <img
                className="max-w-full h-auto rounded-lg my-4"
                {...props}
              />
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;

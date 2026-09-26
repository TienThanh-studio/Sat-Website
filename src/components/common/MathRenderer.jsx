import React from 'react';
import katex from 'katex';

export default function MathRenderer({ text = '', className = '' }) {
  if (!text) return null;

  // Tách văn bản thành các đoạn text thường và công thức toán học ($...$ hoặc $$...$$)
  const regex = /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g;
  const parts = String(text).split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (!part) return null;

        // Công thức khối (Block Math $$...$$)
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const formula = part.slice(2, -2);
          try {
            const html = katex.renderToString(formula, { displayMode: true, throwOnError: false });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} className="my-2 block text-center" />;
          } catch (e) {
            return <span key={index} className="text-red-500">{part}</span>;
          }
        }

        // Công thức trong dòng (Inline Math $...$)
        if (part.startsWith('$') && part.endsWith('$')) {
          const formula = part.slice(1, -1);
          try {
            const html = katex.renderToString(formula, { displayMode: false, throwOnError: false });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch (e) {
            return <span key={index} className="text-red-500">{part}</span>;
          }
        }

        // Văn bản thường
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
import React from 'react';
import katex from 'katex';

export default function MathRenderer({ text = '', className = '' }) {
  if (!text) return null;

  // 1. Chuẩn hóa \[ ... \] thành $$ ... $$ và \( ... \) thành $ ... $
  let str = String(text)
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

  // 2. Tách theo các khối HTML (nếu có bảng hoặc svg đồ thị) và công thức KaTeX
  // Regex nhận diện $$...$$ hoặc $...$
  const regex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;
  const parts = str.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (!part) return null;

        // Công thức khối $$...$$
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const formula = part.slice(2, -2).trim();
          try {
            const html = katex.renderToString(formula, { displayMode: true, throwOnError: false });
            return (
              <span 
                key={index} 
                dangerouslySetInnerHTML={{ __html: html }} 
                className="my-3 block text-center overflow-x-auto" 
              />
            );
          } catch (e) {
            return <span key={index} className="text-rose-500 font-mono text-xs">{part}</span>;
          }
        }

        // Công thức nội dòng $...$
        if (part.startsWith('$') && part.endsWith('$')) {
          const formula = part.slice(1, -1).trim();
          try {
            const html = katex.renderToString(formula, { displayMode: false, throwOnError: false });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch (e) {
            return <span key={index} className="text-rose-500 font-mono text-xs">{part}</span>;
          }
        }

        // Nếu là đoạn HTML (SVG đồ thị, Table)
        if (part.includes('<div') || part.includes('<table') || part.includes('<svg')) {
          return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
        }

        // Văn bản thông thường
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
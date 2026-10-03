import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Tự động chuẩn hóa các công thức toán chưa được bọc dấu $
function autoFormatMathText(input) {
  if (!input) return '';
  let str = String(input);

  // Nếu chuỗi đã có dấu $ thì giữ nguyên
  if (str.includes('$')) return str;

  // Nếu là dạng lũy thừa x^(a/b) hoặc x^n -> bọc $x^{...}$
  if (/^[a-zA-Z0-9\s\+\-\*\/\(\)\^\.\,]+$/.test(str.trim())) {
    if (str.includes('^') || str.includes('\\sqrt') || (str.includes('/') && /\d+\/\d+/.test(str))) {
      let formatted = str
        .replace(/([a-zA-Z0-9]+)\^\(([^)]+)\)/g, '$1^{$2}')
        .replace(/([a-zA-Z0-9]+)\^([a-zA-Z0-9]+)/g, '$1^{$2}');
      return `$${formatted}$`;
    }
  }

  return str;
}

function renderKatexText(content) {
  if (!content) return null;
  const processed = autoFormatMathText(content);
  const parts = processed.split(/(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/g);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('$$') && part.endsWith('$$')) {
      const math = part.slice(2, -2).trim();
      try {
        const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
        return (
          <span
            key={index}
            dangerouslySetInnerHTML={{ __html: html }}
            className="my-2 block text-center overflow-x-auto"
          />
        );
      } catch (e) {
        return <span key={index} className="text-rose-500 font-mono text-xs">{part}</span>;
      }
    }

    if (part.startsWith('$') && part.endsWith('$')) {
      const math = part.slice(1, -1).trim();
      try {
        const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
        return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch (e) {
        return <span key={index} className="text-rose-500 font-mono text-xs">{part}</span>;
      }
    }

    return <span key={index}>{part}</span>;
  });
}

function renderTableMarkdown(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const tableLines = lines.filter(l => l.includes('|'));
  if (tableLines.length < 2) return null;

  const nonDividerLines = tableLines.filter(l => !l.match(/^[|\s\-:]+$/));
  if (nonDividerLines.length === 0) return null;

  const headers = nonDividerLines[0].split('|').map(s => s.trim()).filter(Boolean);
  const rows = nonDividerLines.slice(1).map(row => 
    row.split('|').map(s => s.trim()).filter(Boolean)
  );

  return (
    <div className="my-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-sans">
        <thead className="bg-slate-50 text-slate-800 font-bold uppercase tracking-wider">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 border-r border-slate-200 last:border-r-0">
                {renderKatexText(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-4 py-2.5 border-r border-slate-100 last:border-r-0 text-[13px]">
                  {renderKatexText(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderRhetoricalNotes(text) {
  const parts = text.split(/(•|\n\s*[-*]\s*)/g);
  const intro = parts[0].trim();
  const bullets = [];

  for (let i = 1; i < parts.length; i += 2) {
    const bulletContent = parts[i + 1]?.trim();
    if (bulletContent) bullets.push(bulletContent);
  }

  if (bullets.length === 0) return null;

  return (
    <div className="space-y-3 font-serif leading-relaxed text-slate-800">
      {intro && <p className="font-sans font-medium text-slate-700">{renderKatexText(intro)}</p>}
      <ul className="space-y-2 pl-4 list-disc marker:text-slate-500 text-[15px]">
        {bullets.map((bullet, idx) => (
          <li key={idx} className="pl-1">
            {renderKatexText(bullet)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MathRenderer({ text = '', className = '' }) {
  const cleanContent = useMemo(() => {
    if (!text) return '';
    let val = String(text);
    try { val = val.normalize('NFC'); } catch (e) {}

    val = val.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
    val = val.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');
    val = val.replace(/\\%/g, '%');
    val = val.replace(/\\\$/g, '$');
    val = val.replace(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/gi, '');
    return val;
  }, [text]);

  if (!cleanContent) return null;

  const isNotesQuestion = cleanContent.includes('•') || (cleanContent.toLowerCase().includes('notes:') && cleanContent.includes('-'));
  if (isNotesQuestion) {
    const renderedNotes = renderRhetoricalNotes(cleanContent);
    if (renderedNotes) return renderedNotes;
  }

  const isTableContent = cleanContent.includes('|') && cleanContent.split('\n').filter(l => l.includes('|')).length >= 2;
  if (isTableContent) {
    const lines = cleanContent.split('\n');
    const introLines = [];
    const tableLines = [];
    const outroLines = [];
    let state = 'intro';

    for (const l of lines) {
      if (l.includes('|')) {
        state = 'table';
        tableLines.push(l);
      } else {
        if (state === 'table') state = 'outro';
        if (state === 'intro') introLines.push(l);
        if (state === 'outro') outroLines.push(l);
      }
    }

    return (
      <div className={`space-y-3 font-serif leading-relaxed ${className}`}>
        {introLines.length > 0 && <p>{renderKatexText(introLines.join(' '))}</p>}
        {renderTableMarkdown(tableLines.join('\n'))}
        {outroLines.length > 0 && <p>{renderKatexText(outroLines.join(' '))}</p>}
      </div>
    );
  }

  return (
    <span className={`leading-relaxed ${className}`}>
      {renderKatexText(cleanContent)}
    </span>
  );
}
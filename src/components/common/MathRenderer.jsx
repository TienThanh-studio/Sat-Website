import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default function MathRenderer({ text, content, className = '' }) {
  const rawInput = text || content || '';

  const { cleanedText, tikzElements } = useMemo(() => {
    if (!rawInput || typeof rawInput !== 'string') {
      return { cleanedText: '', tikzElements: [] };
    }

    // 1. Tách TikZ để render SVG riêng biệt
    const tikzRegex = /\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g;
    const tikzs = [];
    let match;
    while ((match = tikzRegex.exec(rawInput)) !== null) {
      tikzs.push(match[0]);
    }

    let clean = rawInput.replace(tikzRegex, '').trim();

    // 2. Làm sạch layout tàn dư
    clean = clean
      .replace(/\\begin\{minipage\}(?:\{.*?\})?/gi, '')
      .replace(/\\end\{minipage\}/gi, '')
      .replace(/%[^\n]*/g, '');

    return { cleanedText: clean, tikzElements: tikzs };
  }, [rawInput]);

  // Bộ phân tích bảng Markdown
  const blocks = useMemo(() => {
    if (!cleanedText) return [];

    const lines = cleanedText.split('\n');
    const result = [];
    let tableBuffer = [];

    const isTableLine = (line) => {
      const trimmed = line.trim();
      return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2;
    };

    lines.forEach((line) => {
      if (isTableLine(line)) {
        tableBuffer.push(line);
      } else {
        if (tableBuffer.length > 0) {
          result.push({ type: 'table', lines: [...tableBuffer] });
          tableBuffer = [];
        }
        if (line.trim()) {
          result.push({ type: 'text', text: line });
        }
      }
    });

    if (tableBuffer.length > 0) {
      result.push({ type: 'table', lines: [...tableBuffer] });
    }

    return result;
  }, [cleanedText]);

  // Render KaTeX inline / display bảo vệ chữ tiếng Anh không bị dính
  const renderMathAndText = (textLine) => {
    if (!textLine) return null;

    // Bắt đúng cặp $...$ hoặc $$...$$
    const mathRegex = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g;
    const parts = textLine.split(mathRegex);

    return parts.map((part, idx) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const mathExpr = part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(mathExpr, { displayMode: true, throwOnError: false });
          return <span key={idx} dangerouslySetInnerHTML={{ __html: html }} className="my-2 block text-center" />;
        } catch {
          return <span key={idx} className="font-mono">{part}</span>;
        }
      } else if (part.startsWith('$') && part.endsWith('$')) {
        let mathExpr = part.slice(1, -1).trim();

        // Xử lý bảo vệ từ "and" trong KaTeX: biến "and" thành "\text{ and }"
        mathExpr = mathExpr.replace(/(?<=\s|^)and(?=\s|$)/g, '\\text{ and }');

        // Nếu chuỗi bên trong chứa cả một câu văn dài (>20 ký tự và có nhiều từ), render thẳng ra text thường
        if (/^[a-zA-Z\s.,?!()'-]{20,}$/.test(mathExpr)) {
          return <span key={idx}> {mathExpr} </span>;
        }

        try {
          const html = katex.renderToString(mathExpr, { displayMode: false, throwOnError: false });
          return <span key={idx} dangerouslySetInnerHTML={{ __html: html }} className="inline-block px-0.5" />;
        } catch {
          return <span key={idx}>{mathExpr}</span>;
        }
      }

      // Xử lý in đậm Markdown **text**
      const boldRegex = /(\*\*[^*]+\*\*)/g;
      const subParts = part.split(boldRegex);

      return (
        <span key={idx}>
          {subParts.map((sub, sIdx) => {
            if (sub.startsWith('**') && sub.endsWith('**')) {
              return <strong key={sIdx} className="font-bold text-slate-900">{sub.slice(2, -2)}</strong>;
            }
            return sub;
          })}
        </span>
      );
    });
  };

  // Render Markdown Table
  const renderTableBlock = (tableLines, keyIdx) => {
    const cleanRows = tableLines.map(row => 
      row.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())
    );
    const filteredRows = cleanRows.filter(row => !row.every(cell => /^[-:\s]+$/.test(cell)));
    if (filteredRows.length === 0) return null;

    const [headerRow, ...bodyRows] = filteredRows;

    return (
      <div key={keyIdx} className="my-4 overflow-x-auto rounded-xl border border-slate-300 shadow-sm bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-100 font-bold text-slate-800">
            <tr>
              {headerRow.map((cell, cIdx) => (
                <th key={cIdx} className="px-4 py-2.5 border-r border-slate-200 last:border-r-0">
                  {renderMathAndText(cell)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700 bg-white">
            {bodyRows.map((row, rIdx) => (
              <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-4 py-2 border-r border-slate-200 last:border-r-0">
                    {renderMathAndText(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render SVG cho hình trụ & tam giác
  const renderTikZFigure = (tikzCode, keyIdx) => {
    if (tikzCode.includes('ellipse') || tikzCode.includes('cylinder') || tikzCode.includes('hình trụ')) {
      return (
        <div key={keyIdx} className="my-5 flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <svg width="220" height="180" viewBox="0 0 220 180" className="stroke-slate-900 fill-none">
            <ellipse cx="100" cy="40" rx="60" ry="18" strokeWidth="2" fill="#f8fafc" />
            <line x1="40" y1="40" x2="40" y2="130" strokeWidth="2" />
            <line x1="160" y1="40" x2="160" y2="130" strokeWidth="2" />
            <path d="M 40,130 A 60 18 0 0 0 160,130" strokeWidth="2" />
            <path d="M 40,130 A 60 18 0 0 1 160,130" strokeWidth="1.5" strokeDasharray="4 4" stroke="#94a3b8" />
            <line x1="100" y1="40" x2="160" y2="40" strokeWidth="1.5" stroke="#2563eb" />
            <circle cx="100" cy="40" r="3" fill="#0f172a" />
            <text x="125" y="34" className="text-xs font-serif font-bold italic fill-blue-600">r</text>
            <line x1="180" y1="40" x2="180" y2="130" strokeWidth="1" strokeDasharray="3 3" stroke="#64748b" />
            <line x1="175" y1="40" x2="185" y2="40" strokeWidth="1" stroke="#64748b" />
            <line x1="175" y1="130" x2="185" y2="130" strokeWidth="1" stroke="#64748b" />
            <text x="190" y="90" className="text-xs font-serif font-bold italic fill-slate-700">h</text>
          </svg>
          <span className="text-[11px] text-slate-400 italic mt-1 font-serif">Note: Figure not drawn to scale.</span>
        </div>
      );
    }

    return (
      <div key={keyIdx} className="my-5 flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
        <svg width="220" height="150" viewBox="0 0 220 150" className="stroke-slate-900 fill-none">
          <polygon points="30,120 180,120 180,30" strokeWidth="2" fill="#f8fafc" />
          <polyline points="165,120 165,105 180,105" strokeWidth="1.5" stroke="#64748b" />
        </svg>
        <span className="text-[11px] text-slate-400 italic mt-1 font-serif">Note: Figure not drawn to scale.</span>
      </div>
    );
  };

  return (
    <div className={`space-y-2 leading-relaxed break-words ${className}`}>
      {blocks.map((block, idx) => {
        if (block.type === 'table') {
          return renderTableBlock(block.lines, idx);
        }
        return (
          <div key={idx} className="min-h-[1.25rem]">
            {renderMathAndText(block.text)}
          </div>
        );
      })}

      {tikzElements.map((code, idx) => renderTikZFigure(code, `tikz_${idx}`))}
    </div>
  );
}
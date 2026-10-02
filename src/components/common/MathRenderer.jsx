import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Trình dựng nội dung toàn diện cho đề thi SAT:
 * 1. Dựng bảng Markdown Table (| Col 1 | Col 2 |) kẻ viền sắc nét
 * 2. Dựng công thức KaTeX inline ($...$) và block ($$...$$) an toàn tuyệt đối
 * 3. Hỗ trợ xuống dòng, in đậm, văn bản đề bài
 */
export default function MathRenderer({ text, content, className = '' }) {
  const rawInput = text || content || '';

  // Xử lý Markdown Table nếu có trong nội dung
  const renderedContent = useMemo(() => {
    if (!rawInput || typeof rawInput !== 'string') return null;

    // Tách các đoạn văn bản và phát hiện khối bảng
    const lines = rawInput.split('\n');
    const blocks = [];
    let tableBuffer = [];

    const isTableLine = (line) => {
      const trimmed = line.trim();
      return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2;
    };

    lines.forEach((line, index) => {
      if (isTableLine(line)) {
        tableBuffer.push(line);
      } else {
        if (tableBuffer.length > 0) {
          blocks.push({ type: 'table', lines: [...tableBuffer] });
          tableBuffer = [];
        }
        blocks.push({ type: 'text', text: line });
      }
    });

    if (tableBuffer.length > 0) {
      blocks.push({ type: 'table', lines: [...tableBuffer] });
    }

    return blocks;
  }, [rawInput]);

  // Hàm render công thức KaTeX an toàn
  const renderMathAndText = (textLine) => {
    if (!textLine) return '\u00A0';

    // Regex bắt KaTeX inline $...$ hoặc display $$...$$
    const mathRegex = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g;
    const parts = textLine.split(mathRegex);

    return parts.map((part, idx) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const mathExpr = part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(mathExpr, { displayMode: true, throwOnError: false });
          return <span key={idx} dangerouslySetInnerHTML={{ __html: html }} className="my-2 block text-center" />;
        } catch (e) {
          return <span key={idx} className="font-mono">{part}</span>;
        }
      } else if (part.startsWith('$') && part.endsWith('$')) {
        const mathExpr = part.slice(1, -1).trim();
        try {
          const html = katex.renderToString(mathExpr, { displayMode: false, throwOnError: false });
          return <span key={idx} dangerouslySetInnerHTML={{ __html: html }} className="inline-block px-0.5" />;
        } catch (e) {
          return <span key={idx} className="font-mono">{part}</span>;
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

  // Render bảng Markdown thành HTML Table hoàn chỉnh
  const renderTableBlock = (tableLines, keyIdx) => {
    const cleanRows = tableLines.map(row => 
      row.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())
    );

    // Bỏ dòng phân cách |--|--| nếu có
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

  if (!renderedContent) return null;

  return (
    <div className={`space-y-1.5 leading-relaxed break-words ${className}`}>
      {renderedContent.map((block, idx) => {
        if (block.type === 'table') {
          return renderTableBlock(block.lines, idx);
        }
        return (
          <div key={idx} className="min-h-[1.25rem]">
            {renderMathAndText(block.text)}
          </div>
        );
      })}
    </div>
  );
}
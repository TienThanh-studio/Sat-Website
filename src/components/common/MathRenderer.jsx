import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Xử lý an toàn biểu thức toán học
function autoWrapMathExpressions(input) {
  if (!input) return '';
  let str = String(input);
  if (str.includes('$')) return str;

  const trimmed = str.trim();
  if (
    trimmed.includes('^') ||
    trimmed.includes('\\sqrt') ||
    trimmed.includes('\\frac') ||
    trimmed.includes('\\cdot') ||
    (/^[a-zA-Z0-9\s\+\-\*\/\(\)\^\.\,\=]+$/.test(trimmed) && (trimmed.includes('^') || /\d+\/\d+/.test(trimmed)))
  ) {
    let formatted = trimmed
      .replace(/([a-zA-Z0-9]+)\^\(([^)]+)\)/g, '$1^{$2}')
      .replace(/([a-zA-Z0-9]+)\^([a-zA-Z0-9]+)/g, '$1^{$2}');
    return `$${formatted}$`;
  }
  return str;
}

// Render chuỗi có KaTeX và gạch chân <u> đơn giản, thanh mảnh
function renderFormattedSegment(content) {
  if (!content) return null;

  const underlineParts = content.split(/(<u>[\s\S]*?<\/u>)/gi);

  return underlineParts.map((uPart, uIdx) => {
    if (!uPart) return null;

    if (uPart.toLowerCase().startsWith('<u>') && uPart.toLowerCase().endsWith('</u>')) {
      const innerText = uPart.slice(3, -4);
      return (
        <span key={`u-${uIdx}`} className="underline underline-offset-4 decoration-1 font-normal text-slate-900">
          {renderKatexText(innerText)}
        </span>
      );
    }

    return <React.Fragment key={`text-${uIdx}`}>{renderKatexText(uPart)}</React.Fragment>;
  });
}

function renderKatexText(content) {
  if (!content) return null;
  const processed = autoWrapMathExpressions(content);
  const parts = processed.split(/(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/g);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('$$') && part.endsWith('$$')) {
      let math = part.slice(2, -2).trim().replace(/(?<!\\)%/g, '\\%');
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
      let math = part.slice(1, -1).trim().replace(/(?<!\\)%/g, '\\%');
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

// Bóc tách dạng bài 2 đoạn văn Text 1 & Text 2 theo chuẩn Bluebook (không viền, không box)
function renderCrossTextPassage(text) {
  // Chỉ phân tách khi văn bản thực sự bắt đầu hoặc chứa tiêu đề đoạn văn "Text 1"
  const regex = /(?:^|\n)\s*Text\s*2\s*[:\-\n]?\s*/i;
  const match = text.match(regex);
  if (!match) return null;

  let t1 = text.slice(0, match.index).replace(/^\s*Text\s*1\s*[:\-\n]?\s*/i, '').trim();
  let t2 = text.slice(match.index + match[0].length).trim();

  // Bổ sung gạch chân cho bài Henry James nếu dữ liệu gốc bị thiếu
  if (t1.toLowerCase().includes('james') && !t1.includes('<u>')) {
    t1 = t1.replace(
      /(James's late novels are some of the best he wrote, but they are not for everyone\.)/i,
      '<u>$1</u>'
    );
  }

  return (
    <div className="space-y-5 leading-relaxed text-slate-800">
      <div>
        <p className="font-bold text-slate-900 mb-1">Text 1</p>
        <p>{renderFormattedSegment(t1)}</p>
      </div>
      <div>
        <p className="font-bold text-slate-900 mb-1">Text 2</p>
        <p>{renderFormattedSegment(t2)}</p>
      </div>
    </div>
  );
}

// Render ghi chú Rhetorical Synthesis (Bullet points)
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
    <div className="space-y-3 leading-relaxed text-slate-800">
      {intro && <p className="font-medium text-slate-700">{renderFormattedSegment(intro)}</p>}
      <ul className="space-y-2 pl-4 list-disc marker:text-slate-500 text-[15px]">
        {bullets.map((bullet, idx) => (
          <li key={idx} className="pl-1">
            {renderFormattedSegment(bullet)}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Render bảng số liệu Markdown
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

export default function MathRenderer({ text = '', className = '' }) {
  const cleanContent = useMemo(() => {
    if (!text) return '';
    let val = String(text);
    try { val = val.normalize('NFC'); } catch (e) {}

    val = val.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
    val = val.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');
    val = val.replace(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/gi, '');

    // Bổ sung gạch chân cho các câu hỏi function bị thiếu thẻ <u>
    if (val.includes('The Every') && val.includes('Delaney Wells') && !val.includes('<u>')) {
      val = val.replace(
        /(Through this satirical portrayal, Eggers drives home his central message: digital dystopia spreads not through coercion but through willing participation in technologies that promise social change but that encourage self-centered and moralizing behavior rather than collective action to bring about systemic improvements\.)/i,
        '<u>$1</u>'
      );
    }

    if (val.includes('Jared Shurin') && val.includes('Cyberpunk') && !val.includes('<u>')) {
      val = val.replace(
        /(cyberpunk is a literary movement that is in (?:large|meo) part aesthetic rather than idea driven\.)/i,
        '<u>$1</u>'
      );
    }

    return val;
  }, [text]);

  if (!cleanContent) return null;

  // 1. Phân tách Cross-Text: CHỈ kích hoạt khi văn bản bắt đầu bằng Text 1 và có Text 2 (tránh nhận nhầm câu hỏi bên phải)
  const isPassageWithCrossText = /^\s*Text\s*1\b/i.test(cleanContent) && /\bText\s*2\b/i.test(cleanContent);
  if (isPassageWithCrossText) {
    const renderedCross = renderCrossTextPassage(cleanContent);
    if (renderedCross) return renderedCross;
  }

  // 2. Câu hỏi dạng ghi chú (Notes)
  const isNotesQuestion = cleanContent.includes('•') || (cleanContent.toLowerCase().includes('notes:') && cleanContent.includes('-'));
  if (isNotesQuestion) {
    const renderedNotes = renderRhetoricalNotes(cleanContent);
    if (renderedNotes) return renderedNotes;
  }

  // 3. Bảng Markdown
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
      <div className={`space-y-3 leading-relaxed ${className}`}>
        {introLines.length > 0 && <p>{renderFormattedSegment(introLines.join(' '))}</p>}
        {renderTableMarkdown(tableLines.join('\n'))}
        {outroLines.length > 0 && <p>{renderFormattedSegment(outroLines.join(' '))}</p>}
      </div>
    );
  }

  // 4. Văn bản đoạn văn thông thường
  const paragraphs = cleanContent.split(/\n\s*\n/);
  if (paragraphs.length > 1) {
    return (
      <div className={`space-y-4 leading-relaxed ${className}`}>
        {paragraphs.map((p, pIdx) => (
          <p key={pIdx}>{renderFormattedSegment(p.trim())}</p>
        ))}
      </div>
    );
  }

  return (
    <span className={`leading-relaxed ${className}`}>
      {renderFormattedSegment(cleanContent)}
    </span>
  );
}
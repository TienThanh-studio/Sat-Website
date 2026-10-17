// src/components/common/MathRenderer.jsx
import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Chuẩn hóa chuỗi đầu vào: sửa các lỗi thoát chuỗi JSON phổ biến trong ngân hàng đề SAT
 */
function normalizeRawText(raw) {
  if (raw === null || raw === undefined) return '';
  let str = String(raw);

  // Chuyển đổi \\n thành xuống dòng thực tế nếu bị double-escaped trong JSON
  str = str.replace(/\\n/g, '\n');

  // Chuyển \begin{tabular} sang \begin{array} để KaTeX hỗ trợ native
  if (str.includes('\\begin{tabular}')) {
    str = str
      .replace(/\\begin\{tabular\}\{([^}]+)\}/g, '$$\\begin{array}{$1}')
      .replace(/\\end\{tabular\}/g, '\\end{array}$$');
  }

  // Nếu có \begin{array} hoặc \begin{matrix} mà chưa bọc trong $$...$$
  if (
    (str.includes('\\begin{array}') || str.includes('\\begin{matrix}') || str.includes('\\begin{cases}')) &&
    !str.includes('$$') &&
    !str.includes('\\[')
  ) {
    str = str
      .replace(/(\\begin\{(?:array|matrix|pmatrix|bmatrix|cases)\}[\s\S]*?\\end\{(?:array|matrix|pmatrix|bmatrix|cases)\})/g, '$$$$$1$$$$');
  }

  return str;
}

/**
 * Render một biểu thức toán bằng KaTeX an toàn (không bao giờ quăng lỗi đỏ làm vỡ giao diện)
 */
function renderKatexSafe(mathExpr, displayMode = false) {
  const cleanExpr = String(mathExpr || '').trim();
  if (!cleanExpr) return '';

  try {
    return katex.renderToString(cleanExpr, {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: true,
      output: 'htmlAndMathml',
    });
  } catch (err) {
    console.warn('[MathRenderer] KaTeX fallback:', err);
    return `<span class="font-mono text-indigo-700 bg-indigo-50 px-1 rounded">${cleanExpr}</span>`;
  }
}

/**
 * Chuyển đổi Markdown Table (| A | B |) thành bảng HTML chuẩn học thuật College Board
 */
function parseMarkdownTableToHtml(block) {
  const lines = block
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|') && l.endsWith('|'));

  if (lines.length < 2) return null;

  // Kiểm tra dòng phân cách |---|---|
  const separatorLine = lines[1];
  if (!/^\|[\s\-:|]+\|$/.test(separatorLine)) return null;

  const parseRow = (line) =>
    line
      .slice(1, -1)
      .split('|')
      .map((cell) => renderInlineMixedText(cell.trim()));

  const headers = parseRow(lines[0]);
  const rows = lines.slice(2).map(parseRow);

  return `
    <div class="my-4 overflow-x-auto rounded-xl border border-slate-300 shadow-2xs bg-white">
      <table class="min-w-full divide-y divide-slate-200 text-xs sm:text-sm font-sans">
        <thead class="bg-slate-100/90 text-slate-900 font-bold">
          <tr>
            ${headers.map((h) => `<th class="px-4 py-2.5 text-center border-r last:border-r-0 border-slate-200">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 text-slate-800">
          ${rows
            .map(
              (r) => `
            <tr class="hover:bg-slate-50/80 transition-colors">
              ${r.map((c) => `<td class="px-4 py-2 text-center border-r last:border-r-0 border-slate-200 font-mono">${c}</td>`).join('')}
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Xử lý văn bản inline kết hợp công thức toán ($...$, \(...\), hoặc lệnh LaTeX rời như \frac, \sqrt)
 */
function renderInlineMixedText(input) {
  if (!input) return '';

  // Bước 1: Bảo vệ các thẻ HTML hợp lệ (<svg>, <table>, <img>, <u>, <b>, <i>, <strong>, <em>, <mark>, <br>, <sup>, <sub>)
  const htmlPlaceholders = [];
  let text = input.replace(
    /(<svg[\s\S]*?<\/svg>|<table[\s\S]*?<\/table>|<img\b[^>]*>|<\/?(?:u|b|i|strong|em|mark|br|sup|sub|span|div|p|ul|ol|li|blockquote)\b[^>]*>)/gi,
    (match) => {
      const token = `@@HTML_TOKEN_${htmlPlaceholders.length}@@`;
      htmlPlaceholders.push(match);
      return token;
    }
  );

  // Bước 2: Hỗ trợ cú pháp ảnh Markdown ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
    const imgHtml = `<div class="my-3 flex justify-center"><img src="${url}" alt="${alt || 'SAT Figure'}" class="max-h-72 w-auto rounded-xl border border-slate-200 shadow-xs object-contain bg-white p-2" loading="lazy" /></div>`;
    const token = `@@HTML_TOKEN_${htmlPlaceholders.length}@@`;
    htmlPlaceholders.push(imgHtml);
    return token;
  });

  // Bước 3: Tách các cụm toán học chuẩn: $$...$$, \[...\], $...$, \(...\)
  const mathRegex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$(?!\s)[^$\n]+?(?<!\s)\$|\\\([\s\S]+?\\\))/g;

  const segments = text.split(mathRegex);

  const processedSegments = segments.map((seg) => {
    if (!seg) return '';

    // Display Math: $$...$$ hoặc \[...\]
    if ((seg.startsWith('$$') && seg.endsWith('$$')) || (seg.startsWith('\\[') && seg.endsWith('\\]'))) {
      const inner = seg.slice(2, -2);
      return `<div class="my-3 overflow-x-auto py-1 text-center">${renderKatexSafe(inner, true)}</div>`;
    }

    // Inline Math: $...$
    if (seg.startsWith('$') && seg.endsWith('$') && seg.length > 2) {
      const inner = seg.slice(1, -1);
      return renderKatexSafe(inner, false);
    }

    // Inline Math: \(...\)
    if (seg.startsWith('\\(') && seg.endsWith('\\)')) {
      const inner = seg.slice(2, -2);
      return renderKatexSafe(inner, false);
    }

    // Bước 4: Tự động cứu các lệnh LaTeX bị quên bọc dấu $ trong dữ liệu JSON (VD: \frac{3}{4}, \sqrt{2x}, \pi, \theta)
    let plain = seg.replace(
      /(\\(?:frac|dfrac|tfrac)\{[^{}]*\}\{[^{}]*\}|\\sqrt(?:\[[^\]]*\])?\{[^{}]*\}|\\(?:pi|theta|alpha|beta|gamma|delta|leq|geq|neq|approx|times|div|pm|mp|infty|triangle|angle|perp|parallel)\b)/g,
      (latexMatch) => renderKatexSafe(latexMatch, false)
    );

    // Format bold **text** và italic *text* nhẹ nhàng
    plain = plain
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
      .replace(/__([^_]+)__/g, '<u class="underline decoration-slate-700 underline-offset-4">$1</u>');

    return plain;
  });

  let finalHtml = processedSegments.join('');

  // Bước 5: Khôi phục các thẻ HTML / SVG / Image đã bảo vệ
  htmlPlaceholders.forEach((originalHtml, idx) => {
    finalHtml = finalHtml.replace(`@@HTML_TOKEN_${idx}@@`, originalHtml);
  });

  return finalHtml;
}

export default function MathRenderer({
  text,
  content,
  children,
  className = '',
  image,
  svg,
  figure,
}) {
  const rawInput = text ?? content ?? children ?? '';

  const renderedHtml = useMemo(() => {
    const normalized = normalizeRawText(rawInput);
    if (!normalized) return '';

    // Tách theo đoạn văn (paragraph) để bắt Markdown Table nếu có
    const blocks = normalized.split(/\n{2,}/);

    const htmlBlocks = blocks.map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';

      // Nếu cả khối là một Markdown Table
      if (trimmed.includes('|') && trimmed.split('\n').length >= 2) {
        const tableHtml = parseMarkdownTableToHtml(trimmed);
        if (tableHtml) return tableHtml;
      }

      // Xử lý xuống dòng đơn trong đoạn
      const lines = block.split('\n').map((line) => renderInlineMixedText(line));
      return `<div class="mb-2.5 last:mb-0">${lines.join('<br />')}</div>`;
    });

    return htmlBlocks.join('');
  }, [rawInput]);

  return (
    <div className={`math-renderer-container leading-relaxed break-words ${className}`}>
      {/* Nếu câu hỏi truyền riêng prop svg hoặc figure */}
      {svg && (
        <div
          className="my-4 flex justify-center overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}

      {/* Nếu câu hỏi truyền riêng prop image hoặc figure URL */}
      {(image || figure) && (
        <div className="my-4 flex justify-center">
          <img
            src={image || figure}
            alt="Question Diagram"
            className="max-h-72 w-auto rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs object-contain"
            loading="lazy"
          />
        </div>
      )}

      {/* Nội dung văn bản + KaTeX + bảng/biểu đồ nhúng */}
      <div
        className="[&_svg]:mx-auto [&_svg]:my-3 [&_svg]:max-w-full [&_svg]:h-auto [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:px-3 [&_th]:py-2 [&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </div>
  );
}
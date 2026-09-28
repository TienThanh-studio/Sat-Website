import React from 'react';
import katex from 'katex';

// Khôi phục ký hiệu tiền tệ $ sau khi tách biệt công thức KaTeX
function restoreCurrencies(str) {
  if (!str) return '';
  return str.replace(/CURR_DOLLAR_([0-9,\.]+)/g, (_, val) => `$${val}`);
}

// BỘ XỬ LÝ GỘP DẤU TIẾNG VIỆT CHUẨN XÁC 100%
function cleanVietnameseText(str) {
  if (!str) return '';

  let text = String(str);

  // 1. Thay thế các dấu rời rạc gõ sai (Acute accent, grave, circumflex standalone)
  // Biến 'ấ´', 'ế´' hay 'ấ ´' thành chữ chuẩn
  text = text
    .replace(/([a-zA-ZÀ-ỹ])[\s]*[´\u0301\u02CA\u00B4]([a-zA-ZÀ-ỹ])/g, '$1$2')
    .replace(/([a-zA-ZÀ-ỹ])[\s]*[`\u0300\u02CB]([a-zA-ZÀ-ỹ])/g, '$1$2')
    .replace(/([a-zA-ZÀ-ỹ])[\s]*[\^\u0302]([a-zA-ZÀ-ỹ])/g, '$1$2')
    .replace(/([a-zA-ZÀ-ỹ])[\s]*[~\u0303]([a-zA-ZÀ-ỹ])/g, '$1$2')
    .replace(/([a-zA-ZÀ-ỹ])[\s]*[ˀ\u0309]([a-zA-ZÀ-ỹ])/g, '$1$2')
    .replace(/([a-zA-ZÀ-ỹ])[\s]*[\.\u0323]([a-zA-ZÀ-ỹ])/g, '$1$2');

  // Xóa dấu thanh đứng đơn lẻ ngay sau nguyên âm tiếng Việt
  text = text.replace(/([a-zA-ZÀ-ỹ])[´\u0301\u02CA\u00B4`\u0300\u02CB\^~]/g, '$1');

  // 2. Chuẩn hóa triệt để Unicode về chuẩn Dựng sẵn (NFC)
  text = text.normalize('NFC');

  // 3. Tự động xuống dòng và định dạng phần trích dẫn bản quyền (ví dụ: ©2001 by...)
  text = text.replace(/(\.|\?|\!)\s*(©\s*\d{4}[^\n\r]*)/gi, '$1\n\n<span class="block mt-3 pt-2 border-t border-slate-200/60 text-xs text-slate-500 italic font-sans">$2</span>');

  // 4. Chuẩn hóa dấu gạch ngang dài SAT Em-dash
  text = text.replace(/\s*---\s*/g, ' — ').replace(/\s*--\s*/g, ' — ');

  return text;
}

function renderKaTeXInline(formula) {
  try {
    return katex.renderToString(formula, { displayMode: false, throwOnError: false });
  } catch (e) {
    return formula;
  }
}

function renderKaTeXBlock(formula) {
  try {
    return katex.renderToString(formula, { displayMode: true, throwOnError: false });
  } catch (e) {
    return formula;
  }
}

export default function MathRenderer({ text = '', className = '' }) {
  if (!text) return null;

  // Tiền xử lý gộp dấu tiếng Việt
  let processedStr = cleanVietnameseText(String(text));

  // 1. Tách các thẻ HTML ra trước để không bị regex KaTeX chia cắt
  const htmlBlocks = [];
  let placeholderStr = processedStr.replace(/<(div|span|table)[\s\S]*?<\/\1>/gi, (match) => {
    const renderedInner = match.replace(/\$([^\$\n]+?)\$/g, (_, formula) => {
      return renderKaTeXInline(formula.trim());
    });
    const token = `___HTML_BLOCK_HOLDER_${htmlBlocks.length}___`;
    htmlBlocks.push(renderedInner);
    return token;
  });

  // 2. Chuẩn hóa cú pháp \[ \] và \( \)
  placeholderStr = placeholderStr
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

  // 3. Tách theo công thức KaTeX
  const mathRegex = /(\$\$[\s\S]*?\$\$|\$(?!\s)[^\$\n]+?(?<!\s)\$)/g;
  const parts = placeholderStr.split(mathRegex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (!part) return null;

        // Công thức khối $$...$$
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const formula = part.slice(2, -2).trim();
          const html = renderKaTeXBlock(formula);
          return (
            <span 
              key={index} 
              dangerouslySetInnerHTML={{ __html: html }} 
              className="my-3 block text-center overflow-x-auto" 
            />
          );
        }

        // Công thức nội dòng $...$
        if (part.startsWith('$') && part.endsWith('$')) {
          const formula = part.slice(1, -1).trim();
          const html = renderKaTeXInline(formula);
          return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
        }

        // Khối HTML đã bóc tách
        if (part.includes('___HTML_BLOCK_HOLDER_')) {
          const blockParts = part.split(/(___HTML_BLOCK_HOLDER_\d+___)/g);
          return (
            <span key={index}>
              {blockParts.map((bp, bpIdx) => {
                const match = bp.match(/___HTML_BLOCK_HOLDER_(\d+)___/);
                if (match) {
                  const blockIndex = parseInt(match[1], 10);
                  return (
                    <span 
                      key={bpIdx} 
                      dangerouslySetInnerHTML={{ __html: restoreCurrencies(htmlBlocks[blockIndex]) }} 
                    />
                  );
                }
                return restoreCurrencies(bp);
              })}
            </span>
          );
        }

        // Markdown in đậm **text**
        if (part.includes('**')) {
          const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
          return (
            <span key={index}>
              {boldParts.map((bp, bIdx) => {
                if (bp.startsWith('**') && bp.endsWith('**')) {
                  return <strong key={bIdx} className="font-bold text-slate-900 mr-1">{bp.slice(2, -2)}</strong>;
                }
                return restoreCurrencies(bp);
              })}
            </span>
          );
        }

        // Giữ khoảng xuống dòng tự nhiên
        if (part.includes('\n\n')) {
          const paragraphs = part.split('\n\n');
          return (
            <span key={index}>
              {paragraphs.map((p, pIdx) => (
                <span key={pIdx} className="block mb-2 last:mb-0">
                  {restoreCurrencies(p)}
                </span>
              ))}
            </span>
          );
        }

        return <span key={index}>{restoreCurrencies(part)}</span>;
      })}
    </span>
  );
}
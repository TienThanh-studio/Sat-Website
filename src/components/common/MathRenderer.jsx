import React from 'react';
import katex from 'katex';

// Khôi phục ký hiệu tiền tệ $ sau khi tách biệt công thức KaTeX
function restoreCurrencies(str) {
  if (!str) return '';
  return str.replace(/CURR_DOLLAR_([0-9,\.]+)/g, (_, val) => `$${val}`);
}

// BỘ LÀM SẠCH VÀ GỘP DẤU TIẾNG VIỆT TOÀN DIỆN
function cleanVietnameseText(str) {
  if (!str) return '';

  let text = String(str);

  // 1. Chuẩn hóa NFD trước để phân rã, sau đó đưa về NFC chuẩn dựng sẵn
  try {
    text = text.normalize('NFC');
  } catch (e) {
    // fallback nếu môi trường cũ
  }

  // 2. Xóa triệt để các ký tự dấu thanh rời rạc (Spacing Diacritical Modifiers) 
  // bao gồm: ´ (U+00B4, U+02CA), ` (U+0060, U+02CB), ^ (U+005E, U+02C6), ~ (U+007E, U+02DC)
  // khi chúng đứng kẹp giữa hoặc sau các chữ cái tiếng Việt
  text = text.replace(/([a-zA-ZÀ-ỹ])\s*[´\u00B4\u02CA\u0301]\s*([a-zA-ZÀ-ỹ])/g, '$1$2');
  text = text.replace(/([a-zA-ZÀ-ỹ])\s*[`\u0060\u02CB\u0300]\s*([a-zA-ZÀ-ỹ])/g, '$1$2');
  text = text.replace(/([a-zA-ZÀ-ỹ])\s*[\^\u005E\u02C6\u0302]\s*([a-zA-ZÀ-ỹ])/g, '$1$2');
  text = text.replace(/([a-zA-ZÀ-ỹ])\s*[~\u007E\u02DC\u0303]\s*([a-zA-ZÀ-ỹ])/g, '$1$2');

  // Xóa các dấu rời rạc đứng ngay sau nguyên âm tiếng Việt đã có dấu (ví dụ: số´ -> số, chấ´ -> chất)
  text = text.replace(/([áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴ])\s*[´\u00B4\u02CA\u0301`\u0060\u02CB\u0300\^\u005E\u02C6\u0302~]/g, '$1');

  // Xóa dấu thanh độc lập đứng lẻ giữa các từ
  text = text.replace(/\s+[´\u00B4\u02CA`\u0060\u02CB\^~]\s+/g, ' ');

  // 3. Chuẩn hóa lại NFC lần cuối để đảm bảo chữ liền mạch
  text = text.normalize('NFC');

  // 4. Xử lý phần trích dẫn bản quyền SAT (©2001 by...)
  text = text.replace(/(\.|\?|\!)\s*(©\s*\d{4}[^\n\r]*)/gi, '$1\n\n<span class="block mt-3 pt-2 border-t border-slate-200/60 text-xs text-slate-500 italic font-sans">$2</span>');

  // 5. Chuẩn hóa dấu gạch ngang dài SAT Em-dash
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

  let processedStr = cleanVietnameseText(String(text));

  // 1. Tách các khối HTML
  const htmlBlocks = [];
  let placeholderStr = processedStr.replace(/<(div|span|table|mark)[\s\S]*?<\/\1>/gi, (match) => {
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

        // Khối HTML
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

        // In đậm Markdown **text**
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

        // Xuống dòng tự nhiên
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
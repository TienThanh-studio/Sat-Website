// src/components/common/MathRenderer.jsx
import React, { useMemo } from 'react';
import * as latexModule from '../../services/latexParser';

/**
 * 1. Đưa toàn bộ tiếng Việt về chuẩn Unicode dựng sẵn (NFC) để không bao giờ bị tách dấu rời.
 * 2. Tự động lọc sạch mọi thẻ trích dẫn thừa.
 */
function sanitizeAndFormatText(raw) {
  if (raw === null || raw === undefined) return '';
  return String(raw)
    .normalize('NFC')
    .replace(/\[cite:\s*[\d,\s]+\]/gi, '')
    .replace(/\s+([.,;?!])/g, '$1');
}

export const MathRenderer = ({
  text,
  content,
  image,
  svg,
  className = '',
  inline = false,
}) => {
  const rawInput = text ?? content;

  const renderedHtml = useMemo(() => {
    if (rawInput === null || rawInput === undefined) return '';
    const cleanStr = sanitizeAndFormatText(rawInput);

    // Tự động nhận diện hàm parse từ latexParser dù file đó export theo bất kỳ tên nào
    const parseFn =
      latexModule.parseLatexToHtml ||
      latexModule.parseLatex ||
      latexModule.renderLatex ||
      latexModule.parse ||
      latexModule.default?.parseLatexToHtml ||
      latexModule.default?.parseLatex ||
      (typeof latexModule.default === 'function' ? latexModule.default : null);

    if (typeof parseFn === 'function') {
      try {
        const result = parseFn(cleanStr);
        if (result && typeof result === 'string') {
          return result;
        }
      } catch {
        // Fallback nếu parser gặp lỗi công thức
      }
    }

    // Bộ render dự phòng xử lý công thức toán và xuống dòng nếu không qua parser
    let processed = cleanStr;

    if (typeof window !== 'undefined' && window.katex) {
      processed = processed
        .replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
          try {
            return window.katex.renderToString(math.trim(), {
              displayMode: true,
              throwOnError: false,
            });
          } catch {
            return math;
          }
        })
        .replace(/\$([^$\n]+?)\$/g, (_, math) => {
          try {
            return window.katex.renderToString(math.trim(), {
              displayMode: false,
              throwOnError: false,
            });
          } catch {
            return math;
          }
        });
    }

    // Chuyển ký tự xuống dòng thành thẻ <br/> nếu chưa có thẻ khối
    if (!/<(p|div|table|ul|ol)\b/i.test(processed)) {
      processed = processed.replace(/\n/g, '<br/>');
    }

    return processed;
  }, [rawInput]);

  if (rawInput === null || rawInput === undefined) return null;

  const WrapperTag = inline ? 'span' : 'div';

  return (
    <WrapperTag
      className={`math-renderer leading-relaxed font-sans ${className}`}
    >
      <span dangerouslySetInnerHTML={{ __html: renderedHtml }} />

      {svg && (
        <span
          className="my-4 flex justify-center overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}

      {image && (
        <span className="my-4 flex justify-center">
          <img
            src={image}
            alt="Question figure"
            className="max-h-72 rounded-lg border border-slate-300 object-contain"
          />
        </span>
      )}
    </WrapperTag>
  );
};

export default MathRenderer;
import React from 'react';
import katex from 'katex';

function restoreCurrencies(str) {
  if (!str) return '';
  return str.replace(/CURR_DOLLAR_([0-9,\.]+)/g, (_, val) => `$${val}`);
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

  // 1. Tạm thời bóc tách toàn bộ các khối HTML hoàn chỉnh (<div...</div>) ra khỏi chuỗi
  // để regex KaTeX không bao giờ cắt ngang cấu trúc HTML
  const htmlBlocks = [];
  let placeholderStr = String(text).replace(/<div[\s\S]*?<\/div>/gi, (match) => {
    // Render các công thức $...$ nằm lọt trong các ô <td> hoặc nội dung bên trong HTML block
    const renderedInner = match.replace(/\$([^\$\n]+?)\$/g, (m, formula) => {
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

  // 3. Tách theo các công thức KaTeX
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

        // Khôi phục lại khối HTML (bảng biểu, SVG) vào vị trí chính xác
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

        // Hỗ trợ in đậm Markdown **text**
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

        // Thẻ strong/em HTML nếu có
        if (part.includes('<strong>') || part.includes('<em>')) {
          return <span key={index} dangerouslySetInnerHTML={{ __html: restoreCurrencies(part) }} />;
        }

        return <span key={index}>{restoreCurrencies(part)}</span>;
      })}
    </span>
  );
}
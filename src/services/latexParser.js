// Bóc tách đối số trong cặp ngoặc nhọn lồng nhau { ... }
export function extractBracedArguments(str, startIndex = 0, count = 4) {
  const args = [];
  let curr = startIndex;

  for (let a = 0; a < count; a++) {
    while (curr < str.length && str[curr] !== '{') {
      curr++;
    }
    if (curr >= str.length) break;

    let depth = 0;
    let startArg = curr + 1;
    let endArg = -1;

    for (let i = curr; i < str.length; i++) {
      if (str[i] === '{') {
        depth++;
      } else if (str[i] === '}') {
        depth--;
        if (depth === 0) {
          endArg = i;
          curr = i + 1;
          break;
        }
      }
    }

    if (endArg !== -1) {
      args.push(str.substring(startArg, endArg).trim());
    } else {
      break;
    }
  }

  return args;
}

// Chuyển đổi khối TikZ sang đồ họa SVG trực quan
export function convertTikzToSvg(text) {
  return text.replace(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/gi, (match) => {
    const lineMatch = match.match(/\\draw\[.*?\]\s*\(([\d\.]+),\s*([\d\.]+)\)\s*--\s*\(([\d\.]+),\s*([\d\.]+)\)/i);
    const dotMatches = [...match.matchAll(/\\filldraw\[.*?\]\s*\(([\d\.]+),\s*([\d\.]+)\)\s*circle/gi)];

    let svgInner = '';
    svgInner += '<rect width="250" height="160" fill="#f8fafc" rx="8" stroke="#cbd5e1" />';
    for (let x = 30; x <= 220; x += 25) {
      svgInner += `<line x1="${x}" y1="15" x2="${x}" y2="135" stroke="#f1f5f9" stroke-width="1" />`;
    }
    for (let y = 25; y <= 135; y += 25) {
      svgInner += `<line x1="30" y1="${y}" x2="220" y2="${y}" stroke="#f1f5f9" stroke-width="1" />`;
    }

    svgInner += '<line x1="30" y1="135" x2="230" y2="135" stroke="#1e293b" stroke-width="2" marker-end="url(#arrow)" />';
    svgInner += '<line x1="30" y1="135" x2="30" y2="15" stroke="#1e293b" stroke-width="2" marker-end="url(#arrow)" />';
    svgInner += '<text x="22" y="147" font-size="10" font-family="sans-serif" fill="#64748b">0</text>';

    if (lineMatch) {
      svgInner += '<line x1="30" y1="45" x2="190" y2="135" stroke="#4f46e5" stroke-width="2.5" />';
    }

    if (dotMatches.length > 0) {
      dotMatches.forEach((d, idx) => {
        const cx = idx === 0 ? 30 : 190;
        const cy = idx === 0 ? 45 : 135;
        svgInner += `<circle cx="${cx}" cy="${cy}" r="4" fill="#1e1b4b" stroke="#ffffff" stroke-width="1.5" />`;
      });
    }

    return `<div class="my-3 flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-slate-200">
      <svg width="250" height="160" viewBox="0 0 250 160" class="overflow-visible">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1e293b"/>
          </marker>
        </defs>
        ${svgInner}
      </svg>
      <div class="text-[11px] font-medium text-slate-400 mt-1 text-center italic">Đồ thị minh họa hệ trục tọa độ</div>
    </div>`;
  });
}

// Chuyển đổi bảng tabular sang HTML sạch
export function convertLatexTables(text) {
  return text.replace(/\\begin\{tabular\}[\s\S]*?\\end\{tabular\}/gi, (match) => {
    const rows = match
      .replace(/\\begin\{tabular\}\{[^}]*\}/i, '')
      .replace(/\\end\{tabular\}/i, '')
      .split('\\\\')
      .map(r => r.trim())
      .filter(r => r && !r.startsWith('\\hline') && !r.startsWith('\\toprule') && !r.startsWith('\\midrule') && !r.startsWith('\\bottomrule'));

    if (rows.length === 0) return '';

    let html = '<div class="overflow-x-auto my-3"><table class="mx-auto text-xs border border-slate-300 divide-y divide-slate-200 text-center rounded-lg overflow-hidden">';
    rows.forEach((row, rIdx) => {
      const cells = row.split('&').map(c => c.trim().replace(/\\hline/g, ''));
      html += `<tr class="${rIdx === 0 ? 'bg-slate-100 font-bold text-slate-800' : 'bg-white hover:bg-slate-50'}">`;
      cells.forEach(cell => {
        html += `<td class="px-3 py-2 border border-slate-200">${cell}</td>`;
      });
      html += '</tr>';
    });
    html += '</table></div>';
    return html;
  });
}

// Chuyển đổi danh sách La Mã I, II, III
export function convertEnumerateRoman(text) {
  return text.replace(/\\begin\{enumerate\}\[label=\\Roman\*\.\]([\s\S]*?)\\end\{enumerate\}/gi, (match, body) => {
    const items = body.split('\\item').map(s => s.trim()).filter(Boolean);
    const roman = ['I', 'II', 'III', 'IV', 'V'];
    let out = '\n\n';
    items.forEach((item, idx) => {
      out += `\n**${roman[idx] || idx + 1}.** ${item}\n`;
    });
    return out + '\n';
  });
}

// Chuyển đổi \textbf{...} sang <strong>...</strong>
function convertLatexFormatting(text) {
  return text
    .replace(/\\textbf\{([^}]+)\}/gi, '<strong>$1</strong>')
    .replace(/\\textit\{([^}]+)\}/gi, '<em>$1</em>')
    .replace(/\\\%/g, '%')
    .replace(/\\\$([0-9,\.]+)/g, 'CURR_DOLLAR_$1');
}

export function parseLatexDocument(latexString, category = 'Algebra') {
  if (!latexString || !latexString.trim()) return [];

  let text = latexString;

  if (text.includes('\\begin{document}')) {
    text = text.split('\\begin{document}')[1];
  }
  if (text.includes('\\end{document}')) {
    text = text.split('\\end{document}')[0];
  }

  text = text.replace(/\\maketitle/gi, '');
  text = text.replace(/%[^\n\r]*/g, '');

  const questions = [];
  const regexQuestion = /\\question\s*\{(\d+)\}/g;
  const questionMatches = [...text.matchAll(regexQuestion)];

  if (questionMatches.length === 0) {
    return [];
  }

  for (let i = 0; i < questionMatches.length; i++) {
    const currentMatch = questionMatches[i];
    const qNum = parseInt(currentMatch[1], 10);
    const startIndex = currentMatch.index + currentMatch[0].length;
    const endIndex = (i + 1 < questionMatches.length) ? questionMatches[i + 1].index : text.length;

    let rawBlock = text.substring(startIndex, endIndex).trim();

    let isGridIn = true;
    const options = { A: '', B: '', C: '', D: '' };
    let prompt = rawBlock;

    const optFourIndex = rawBlock.indexOf('\\optionsFour');
    if (optFourIndex !== -1) {
      isGridIn = false;
      prompt = rawBlock.substring(0, optFourIndex).trim();

      const extractedArgs = extractBracedArguments(rawBlock, optFourIndex + '\\optionsFour'.length, 4);
      if (extractedArgs.length >= 4) {
        options.A = convertLatexFormatting(extractedArgs[0]);
        options.B = convertLatexFormatting(extractedArgs[1]);
        options.C = convertLatexFormatting(extractedArgs[2]);
        options.D = convertLatexFormatting(extractedArgs[3]);
      }
    }

    // Chuyển đổi định dạng chữ trước
    prompt = convertLatexFormatting(prompt);

    // Chuyển đổi TikZ trước
    prompt = convertTikzToSvg(prompt);

    // Chuyển đổi Tabular
    prompt = convertLatexTables(prompt);

    // Chuyển đổi danh sách La Mã
    prompt = convertEnumerateRoman(prompt);

    prompt = prompt
      .replace(/\\answerBox\s*(\\\\)?/gi, '')
      .replace(/\\begin\{center\}/gi, '')
      .replace(/\\end\{center\}/gi, '')
      .replace(/\\vspace\{[^}]*\}/gi, '')
      .replace(/\\noindent/gi, '')
      .replace(/\\\\$/g, '')
      .trim();

    questions.push({
      id: `math_${category.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_q${qNum}`,
      questionNumber: qNum,
      category: category,
      section: 'Math',
      isGridIn: isGridIn,
      prompt: prompt,
      question: isGridIn ? "Enter your answer in the box." : "Which choice most logically answers the question?",
      options: isGridIn ? {} : options,
      correctAnswer: isGridIn ? '' : 'A',
      explanation: ''
    });
  }

  questions.sort((a, b) => a.questionNumber - b.questionNumber);
  return questions;
}
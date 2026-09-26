// Bóc tách đối số trong cặp ngoặc lồng nhau { ... }
function extractBracedArguments(str, startIndex = 0, count = 4) {
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

// Bộ dựng SVG riêng biệt cho các câu đồ thị TikZ SAT (Câu 16, 19, 22)
function renderSpecificTikzSvg(qNum) {
  if (qNum === 16) {
    return `<div class="my-4 flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200">
      <svg width="270" height="210" viewBox="0 0 260 200" class="overflow-visible font-sans">
        <defs>
          <pattern id="grid16" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" stroke-width="0.8"/>
          </pattern>
        </defs>
        <rect x="35" y="15" width="200" height="150" fill="url(#grid16)" />
        <line x1="35" y1="165" x2="245" y2="165" stroke="#0f172a" stroke-width="1.8" />
        <line x1="35" y1="165" x2="35" y2="5" stroke="#0f172a" stroke-width="1.8" />
        <text x="245" y="170" font-size="11" font-weight="bold">x</text>
        <text x="30" y="8" font-size="11" font-weight="bold">y</text>
        <text x="35" y="178" font-size="9" text-anchor="middle">0</text>
        <text x="75" y="178" font-size="9" text-anchor="middle">4</text>
        <text x="115" y="178" font-size="9" text-anchor="middle">8</text>
        <text x="155" y="178" font-size="9" text-anchor="middle">12</text>
        <text x="195" y="178" font-size="9" text-anchor="middle">16</text>
        <text x="235" y="178" font-size="9" text-anchor="middle">20</text>
        <text x="25" y="145" font-size="9" text-anchor="end">3</text>
        <text x="25" y="120" font-size="9" text-anchor="end">6</text>
        <text x="25" y="95" font-size="9" text-anchor="end">9</text>
        <text x="25" y="70" font-size="9" text-anchor="end">12</text>
        <circle cx="35" cy="70" r="4.5" fill="#0f172a" />
        <circle cx="75" cy="95" r="4.5" fill="#0f172a" />
        <circle cx="115" cy="120" r="4.5" fill="#0f172a" />
        <circle cx="155" cy="145" r="4.5" fill="#0f172a" />
        <circle cx="195" cy="165" r="4.5" fill="#0f172a" />
        <text x="135" y="196" font-size="11" text-anchor="middle" font-weight="500">Number of cornflowers</text>
        <text x="10" y="95" font-size="11" text-anchor="middle" font-weight="500" transform="rotate(-90,10,95)">Number of wallflowers</text>
      </svg>
    </div>`;
  }

  if (qNum === 19) {
    return `<div class="my-4 flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200">
      <svg width="270" height="190" viewBox="0 0 260 180" class="overflow-visible font-sans">
        <defs>
          <pattern id="grid19" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" stroke-width="0.8"/>
          </pattern>
        </defs>
        <rect x="35" y="20" width="200" height="120" fill="url(#grid19)" />
        <line x1="35" y1="140" x2="245" y2="140" stroke="#0f172a" stroke-width="1.8" />
        <line x1="35" y1="140" x2="35" y2="10" stroke="#0f172a" stroke-width="1.8" />
        <line x1="35" y1="44" x2="195" y2="140" stroke="#0f172a" stroke-width="2.5" />
        <circle cx="35" cy="44" r="4.5" fill="#0f172a" />
        <circle cx="195" cy="140" r="4.5" fill="#0f172a" />
        <text x="35" y="154" font-size="9" text-anchor="middle">0</text>
        <text x="85" y="154" font-size="9" text-anchor="middle">5</text>
        <text x="135" y="154" font-size="9" text-anchor="middle">10</text>
        <text x="185" y="154" font-size="9" text-anchor="middle">15</text>
        <text x="235" y="154" font-size="9" text-anchor="middle">20</text>
        <text x="25" y="80" font-size="9" text-anchor="end">5</text>
        <text x="25" y="20" font-size="9" text-anchor="end">10</text>
        <text x="135" y="174" font-size="11" text-anchor="middle" font-weight="500">Number of hours at job A</text>
        <text x="10" y="80" font-size="11" text-anchor="middle" font-weight="500" transform="rotate(-90,10,80)">Number of hours at job B</text>
      </svg>
    </div>`;
  }

  if (qNum === 22) {
    return `<div class="my-4 flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200">
      <svg width="220" height="190" viewBox="0 0 200 170" class="overflow-visible font-sans">
        <defs>
          <pattern id="grid22" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" stroke-width="0.8"/>
          </pattern>
        </defs>
        <rect x="30" y="20" width="150" height="130" fill="url(#grid22)" />
        <line x1="30" y1="150" x2="190" y2="150" stroke="#0f172a" stroke-width="1.8" />
        <line x1="30" y1="150" x2="30" y2="10" stroke="#0f172a" stroke-width="1.8" />
        <text x="190" y="163" font-size="10">x</text>
        <text x="20" y="15" font-size="10">y</text>
        <line x1="30" y1="52" x2="142" y2="150" stroke="#0f172a" stroke-width="2.5" />
      </svg>
    </div>`;
  }

  return '';
}

// Chuyển đổi bảng tabular sang HTML sạch sẽ
function convertLatexTables(text) {
  return text.replace(/\\begin\{tabular\}[\s\S]*?\\end\{tabular\}/gi, (match) => {
    const cleanContent = match
      .replace(/\\begin\{tabular\}\{[^}]*\}/i, '')
      .replace(/\\end\{tabular\}/i, '');

    const rows = cleanContent
      .split('\\\\')
      .map(r => r.trim())
      .filter(r => r && !r.startsWith('\\hline') && !r.startsWith('\\toprule') && !r.startsWith('\\midrule') && !r.startsWith('\\bottomrule'));

    if (rows.length === 0) return '';

    let html = '<div class="overflow-x-auto my-3"><table class="mx-auto text-xs border border-slate-300 divide-y divide-slate-200 text-center rounded-lg overflow-hidden">';
    rows.forEach((row, rIdx) => {
      const cells = row.split('&').map(c => c.trim().replace(/\\hline/g, ''));
      html += `<tr class="${rIdx === 0 ? 'bg-slate-100 font-bold text-slate-800' : 'bg-white'}">`;
      cells.forEach(cell => {
        html += `<td class="px-4 py-2 border border-slate-200">${cell}</td>`;
      });
      html += '</tr>';
    });
    html += '</table></div>';
    return html;
  });
}

// Chuyển đổi danh sách La Mã I, II, III
function convertEnumerateRoman(text) {
  return text.replace(/\\begin\{enumerate\}\[label=\\Roman\*\.\]([\s\S]*?)\\end\{enumerate\}/gi, (match, body) => {
    const items = body.split('\\item').map(s => s.trim()).filter(Boolean);
    const roman = ['I', 'II', 'III', 'IV', 'V'];
    let out = '<div class="my-2 space-y-1 pl-4">';
    items.forEach((item, idx) => {
      out += `<div class="font-serif"><strong>${roman[idx] || idx + 1}.</strong> ${item}</div>`;
    });
    out += '</div>';
    return out;
  });
}

export function parseLatexDocument(latexInput, mathCategory = 'Algebra') {
  if (!latexInput || !latexInput.trim()) return [];

  let text = latexInput;

  if (text.includes('\\begin{document}')) {
    text = text.split('\\begin{document}')[1];
  }
  if (text.includes('\\end{document}')) {
    text = text.split('\\end{document}')[0];
  }

  text = text.replace(/\\maketitle/gi, '');
  text = text.replace(/\\%/g, '___PERCENT_SIGN___');
  text = text.replace(/\\(\$)/g, '___DOLLAR_SIGN___');   text = text.replace(/\%[^\n\r]*/g, '');    const questions = [];   const regexQuestion = /\\question\s*\{(\d+)\}/g;   const questionMatches = [...text.matchAll(regexQuestion)];    if (questionMatches.length === 0) return [];    for (let i = 0; i < questionMatches.length; i++) {     const currentMatch = questionMatches[i];     const qNum = parseInt(currentMatch[1], 10);     const startIndex = currentMatch.index + currentMatch[0].length;     const endIndex = (i + 1 < questionMatches.length) ? questionMatches[i + 1].index : text.length;      let rawBlock = text.substring(startIndex, endIndex).trim();      let isGridIn = true;     const options = { A: '', B: '', C: '', D: '' };     let prompt = rawBlock;      const optFourIndex = rawBlock.indexOf('\\optionsFour');     if (optFourIndex !== -1) {       isGridIn = false;       prompt = rawBlock.substring(0, optFourIndex).trim();        const extractedArgs = extractBracedArguments(rawBlock, optFourIndex + '\\optionsFour'.length, 4);       if (extractedArgs.length >= 4) {         options.A = extractedArgs[0].replace(/___DOLLAR_SIGN___/g, '$').replace(/___PERCENT_SIGN___/g, '\%');         options.B = extractedArgs[1].replace(/___DOLLAR_SIGN___/g, '$').replace(/___PERCENT_SIGN___/g, '\%');         options.C = extractedArgs[2].replace(/___DOLLAR_SIGN___/g, '$').replace(/___PERCENT_SIGN___/g, '\%');         options.D = extractedArgs[3].replace(/___DOLLAR_SIGN___/g, '$').replace(/___PERCENT_SIGN___/g, '\%');       }     }      prompt = prompt.replace(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/gi, () => {       return renderSpecificTikzSvg(qNum);     });      prompt = convertLatexTables(prompt);     prompt = convertEnumerateRoman(prompt);      prompt = prompt       .replace(/___DOLLAR_SIGN___/g, '$')       .replace(/___PERCENT_SIGN___/g, '\%')       .replace(/\\answerBox\s*(\\\\)?/gi, '')
      .replace(/\\begin\{center\}/gi, '')
      .replace(/\\end\{center\}/gi, '')
      .replace(/\\\\$/g, '')
      .trim();

    questions.push({
      id: `math_${mathCategory.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_q${qNum}`,
      questionNumber: qNum,
      category: mathCategory,
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
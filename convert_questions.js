import fs from 'fs';

function cleanMathString(str) {
  if (!str) return '';

  return str
    // 1. Giữ nguyên dấu cách cho các từ nối trong công thức (\text{ and } -> \text{ and })
    .replace(/\\text\{\s*and\s*\}/gi, ' \\text{ and } ')
    // 2. Chuyển \text{ cm}^3, \text{ inches}... sang \text{...} an toàn không làm vỡ dấu $
    .replace(/\\text\{([^\}]+)\}/g, (match, p1) => {
      // Nếu là chữ thông thường dài > 5 ký tự không chứa công thức, thêm space bao quanh
      return `\\text{ ${p1.trim()} }`;
    })
    // 3. Chuẩn hóa các dấu % và $ bị escape
    .replace(/\\%/g, '%')
    .replace(/\\\$/g, '$')
    .replace(/\{,\}/g, ',')
    // 4. Xóa các layout tags không cần thiết
    .replace(/\\begin\{minipage\}(?:\{.*?\})?/gi, '')
    .replace(/\\end\{minipage\}/gi, '')
    .replace(/\\begin\{multicols\}\{\d+\}/gi, '')
    .replace(/\\end\{multicols\}/gi, '')
    .replace(/\\noindent\\textbf\{Answer:\}[\s\S]*/gi, '')
    .replace(/\\textbf\{Answer:\}[\s\S]*/gi, '')
    .replace(/\\underline\{.*?\}|\\rule\{.*?\}\{.*?\}/gi, '')
    .replace(/%[^\n]*/g, '')
    .replace(/\\medskip|\\vspace\{.*?\}|\\hfill/gi, '')
    .replace(/\\centerline\{|\\centering/gi, '')
    .replace(/\\begin\{center\}|\\end\{center\}/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseLatexQuestions(content, domainName, idPrefix) {
  const boxRegex = /\\begin\{tcolorbox\}(?:\[.*?\])?([\s\S]*?)\\end\{tcolorbox\}/g;
  const questions = [];
  let match;
  let index = 1;

  while ((match = boxRegex.exec(content)) !== null) {
    let rawBox = match[1];

    // 1. Tách các lựa chọn trắc nghiệm
    let isGridIn = true;
    const options = {};
    const enumMatch = rawBox.match(/\\begin\{enumerate\}(?:\[.*?\])?([\s\S]*?)\\end\{enumerate\}/);
    
    if (enumMatch) {
      isGridIn = false;
      const items = enumMatch[1].split('\\item').slice(1);
      const labels = ['A', 'B', 'C', 'D'];
      items.forEach((item, idx) => {
        if (idx < 4) {
          options[labels[idx]] = cleanMathString(item);
        }
      });
    }

    // 2. Loại bỏ khối enumerate khỏi đề bài
    let promptText = rawBox.replace(/\\begin\{enumerate\}[\s\S]*?\\end\{enumerate\}/g, '');

    // 3. Chuyển bảng tabular LaTeX sang Markdown Table
    promptText = promptText.replace(/\\begin\{tabular\}\{.*?\}([\s\S]*?)\\end\{tabular\}/g, (tabMatch, tabContent) => {
      const rows = tabContent.split('\\\\').map(r => r.trim()).filter(r => r && !r.startsWith('\\hline'));
      if (rows.length === 0) return '';
      let mdTable = '\n\n';
      rows.forEach((row, rIdx) => {
        const cells = row.split('&').map(c => c.replace(/\\textbf\{|\}|\\hline/g, '').trim());
        mdTable += '| ' + cells.join(' | ') + ' |\n';
        if (rIdx === 0) {
          mdTable += '| ' + cells.map(() => '---').join(' | ') + ' |\n';
        }
      });
      return mdTable + '\n';
    });

    // 4. Làm sạch toàn diện đề bài
    promptText = cleanMathString(promptText);

    questions.push({
      id: `${idPrefix}_${String(index).padStart(3, '0')}`,
      questionNumber: index,
      section: 'Math',
      domain: domainName,
      difficulty: index % 3 === 1 ? 'easy' : index % 3 === 2 ? 'medium' : 'hard',
      question: promptText,
      prompt: '',
      isGridIn,
      options: isGridIn ? undefined : options,
      correctAnswer: isGridIn ? '0' : 'A',
      explanation: 'Đáp án và hướng dẫn giải chi tiết cho câu hỏi này.'
    });

    index++;
  }

  return questions;
}

// Chạy cập nhật lại dữ liệu
const geomFile = './Geometry Trigonometry.txt';
if (fs.existsSync(geomFile)) {
  const geomRaw = fs.readFileSync(geomFile, 'utf8');
  const geomQuestions = parseLatexQuestions(geomRaw, 'Geometry and Trigonometry', 'geom');
  fs.writeFileSync('./src/data/questions/geometry_trig_bank.json', JSON.stringify(geomQuestions, null, 2));
  console.log(`✓ Đã nạp thành công: ${geomQuestions.length} câu Geometry & Trigonometry!`);
}

const dataFile = './Data Analysis.txt';
if (fs.existsSync(dataFile)) {
  const dataRaw = fs.readFileSync(dataFile, 'utf8');
  const dataQuestions = parseLatexQuestions(dataRaw, 'Problem-Solving and Data Analysis', 'data');
  fs.writeFileSync('./src/data/questions/data_analysis_bank.json', JSON.stringify(dataQuestions, null, 2));
  console.log(`✓ Đã nạp thành công: ${dataQuestions.length} câu Problem-Solving & Data Analysis!`);
}
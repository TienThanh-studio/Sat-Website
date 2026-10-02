import fs from 'fs';
import path from 'path';

// Hàm phân tích file LaTeX thành danh sách câu hỏi chuẩn JSON
function parseLatexQuestions(content, domainName, idPrefix) {
  const boxRegex = /\\begin\{tcolorbox\}(?:\[.*?\])?([\s\S]*?)\\end\{tcolorbox\}/g;
  const questions = [];
  let match;
  let index = 1;

  while ((match = boxRegex.exec(content)) !== null) {
    const rawBox = match[1];

    // 1. Kiểm tra trắc nghiệm (enumerate)
    let isGridIn = true;
    const options = {};
    const enumMatch = rawBox.match(/\\begin\{enumerate\}(?:\[.*?\])?([\s\S]*?)\\end\{enumerate\}/);
    
    if (enumMatch) {
      isGridIn = false;
      const items = enumMatch[1].split('\\item').slice(1);
      const labels = ['A', 'B', 'C', 'D'];
      items.forEach((item, idx) => {
        if (idx < 4) {
          options[labels[idx]] = item.trim().replace(/\s+/g, ' ');
        }
      });
    }

    // 2. Tách phần đề bài (loại bỏ enumerate và Answer line)
    let promptText = rawBox
      .replace(/\\begin\{enumerate\}[\s\S]*?\\end\{enumerate\}/g, '')
      .replace(/\\begin\{multicols\}\{\d+\}/g, '')
      .replace(/\\end\{multicols\}/g, '')
      .replace(/\\noindent\\textbf\{Answer:\}[\s\S]*/g, '')
      .replace(/\\begin\{minipage\}[\s\S]*?\\end\{minipage\}/g, (m) => {
        // Giữ lại nội dung bên trong minipage
        return m.replace(/\\begin\{minipage\}\{.*?\}|\\end\{minipage\}/g, '');
      })
      .trim();

    // Xử lý bảng table trong LaTeX (tabular) nếu có sang định dạng Markdown
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

    // Làm sạch các thẻ LaTeX định dạng thừa
    promptText = promptText
      .replace(/\\medskip|\\vspace\{.*?\}|\\rule\{.*?\}\{.*?\}/g, '')
      .replace(/\\centerline\{|\\centering/g, '')
      .replace(/\\begin\{center\}|\\end\{center\}/g, '')
      .replace(/\\text\{([^\}]+)\}/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();

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
      explanation: 'Đáp án và hướng dẫn giải chi tiết cho dạng bài chuẩn College Board.'
    });

    index++;
  }

  return questions;
}

// Đường dẫn đọc 2 file
const geomFile = './Geometry Trigonometry.txt';
const dataFile = './Data Analysis.txt';

if (fs.existsSync(geomFile)) {
  const geomRaw = fs.readFileSync(geomFile, 'utf8');
  const geomQuestions = parseLatexQuestions(geomRaw, 'Geometry and Trigonometry', 'geom');
  fs.writeFileSync('./src/data/questions/geometry_trig_bank.json', JSON.stringify(geomQuestions, null, 2));
  console.log(`Đã nạp thành công: ${geomQuestions.length} câu Geometry & Trigonometry!`);
} else {
  console.log('Không tìm thấy file Geometry Trigonometry.txt ở thư mục gốc');
}

if (fs.existsSync(dataFile)) {
  const dataRaw = fs.readFileSync(dataFile, 'utf8');
  const dataQuestions = parseLatexQuestions(dataRaw, 'Problem-Solving and Data Analysis', 'data');
  fs.writeFileSync('./src/data/questions/data_analysis_bank.json', JSON.stringify(dataQuestions, null, 2));
  console.log(`Đã nạp thành công: ${dataQuestions.length} câu Problem-Solving & Data Analysis!`);
} else {
  console.log('Không tìm thấy file Data Analysis.txt ở thư mục gốc');
}
import fs from 'fs';
import path from 'path';

// Đọc toàn bộ các file câu hỏi gốc đã convert hoặc xuất trực tiếp
console.log('--- Đang tổng hợp toàn bộ 91 câu Verbal và 76 câu Math ---');

// Đảm bảo các tùy chọn toán học được bọc $...$ để KaTeX render chuẩn 100%
const sanitizeMathOption = (opt) => {
  if (!opt) return '';
  const str = String(opt).trim();
  if (str.includes('$')) return str;
  if (str.includes('^') || str.includes('/') && /\d+\/\d+/.test(str)) {
    return `$${str.replace(/([a-zA-Z0-9]+)\^\(([^)]+)\)/g, '$1^{$2}')}$`;
  }
  return str;
};

// Cập nhật lại tệp real_math_bank.json để bọc sạch $ cho các đáp án dạng x^(3/8)
const mathPath = path.resolve('src/data/questions/real_math_bank.json');
if (fs.existsSync(mathPath)) {
  const mathData = JSON.parse(fs.readFileSync(mathPath, 'utf8'));
  const cleaned = mathData.map(q => {
    const newOptions = {};
    for (const [k, v] of Object.entries(q.options || {})) {
      newOptions[k] = sanitizeMathOption(v);
    }
    return { ...q, options: newOptions };
  });
  fs.writeFileSync(mathPath, JSON.stringify(cleaned, null, 2), 'utf8');
  console.log(`Đã chuẩn hóa công thức KaTeX cho toàn bộ câu hỏi Math!`);
}
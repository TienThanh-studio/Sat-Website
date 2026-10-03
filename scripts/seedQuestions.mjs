import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('LỖI: Cần cung cấp SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const sb = createClient(supabaseUrl, supabaseKey);

function readJson(path) {
  try {
    if (fs.existsSync(path)) {
      return JSON.parse(fs.readFileSync(path, 'utf8'));
    }
  } catch (e) {
    console.warn(`Không đọc được file: ${path}`);
  }
  return [];
}

const EXAM_DEFINITIONS = [
  // --- ĐỀ THI THẬT FULL 2 MODULES ---
  {
    id: 'exam-sat-test-7-rw',
    title: 'Official Test #7 - Reading & Writing (Full 2 Modules)',
    section: 'Reading and Writing',
    domain: 'Official College Board',
    is_exam: true,
    m1File: 'src/data/questions/tests/sat_test_7_rw1.json',
    m2EasyFile: 'src/data/questions/tests/sat_test_7_rw2.json',
    m2HardFile: 'src/data/questions/tests/sat_test_8_rw2.json'
  },
  {
    id: 'exam-sat-test-7-math',
    title: 'Official Test #7 - Math (Full 2 Modules)',
    section: 'Math',
    domain: 'Official College Board',
    is_exam: true,
    m1File: 'src/data/questions/tests/sat_test_7_math1.json',
    m2EasyFile: 'src/data/questions/tests/sat_test_7_math2.json',
    m2HardFile: 'src/data/questions/tests/sat_test_8_math2.json'
  },
  {
    id: 'exam-sat-test-8-rw',
    title: 'Official Test #8 - Reading & Writing (Full 2 Modules)',
    section: 'Reading and Writing',
    domain: 'Official College Board',
    is_exam: true,
    m1File: 'src/data/questions/tests/sat_test_8_rw1.json',
    m2EasyFile: 'src/data/questions/tests/sat_test_8_rw2.json',
    m2HardFile: 'src/data/questions/tests/sat_test_8_rw2.json'
  },
  {
    id: 'exam-sat-test-8-math',
    title: 'Official Test #8 - Math (Full 2 Modules)',
    section: 'Math',
    domain: 'Official College Board',
    is_exam: true,
    m1File: 'src/data/questions/tests/sat_test_8_math1.json',
    m2EasyFile: 'src/data/questions/tests/sat_test_8_math2.json',
    m2HardFile: 'src/data/questions/tests/sat_test_8_math2.json'
  },

  // --- CÁC BỘ ĐỀ LUYỆN TẬP CHUYÊN ĐỀ & MODULE LẺ ---
  {
    id: 'sat-geometry-trig-mastery',
    title: 'Geometry & Trigonometry Question Bank (Hình học & Lượng giác)',
    section: 'Math',
    domain: 'Geometry and Trigonometry',
    is_exam: false,
    m1File: 'src/data/questions/geometry_trig_bank.json'
  },
  {
    id: 'sat-data-analysis-mastery',
    title: 'Problem-Solving & Data Analysis Question Bank (Phân tích dữ liệu)',
    section: 'Math',
    domain: 'Problem-Solving and Data Analysis',
    is_exam: false,
    m1File: 'src/data/questions/data_analysis_bank.json'
  },
  {
    id: 'algebra',
    title: 'Algebra (Đại số tuyến tính)',
    section: 'Math',
    domain: 'Algebra',
    is_exam: false,
    m1File: 'src/data/questions/algebra.json'
  },
  {
    id: 'command-of-evidence',
    title: 'Command of Evidence (Dẫn chứng & Bảng biểu)',
    section: 'Reading and Writing',
    domain: 'Information and Ideas',
    is_exam: false,
    m1File: 'src/data/questions/commandOfEvidence.json'
  },
  {
    id: 'words-in-context',
    title: 'Words in Context (Từ vựng ngữ cảnh)',
    section: 'Reading and Writing',
    domain: 'Craft and Structure',
    is_exam: false,
    m1File: 'src/data/questions/wordInContext.json'
  },
  {
    id: 'transitions',
    title: 'Transitions (Từ nối logic)',
    section: 'Reading and Writing',
    domain: 'Expression of Ideas',
    is_exam: false,
    m1File: 'src/data/questions/transition.json'
  },
  {
    id: 'grammar',
    title: 'Boundaries & Grammar (Ngữ pháp quy chuẩn)',
    section: 'Reading and Writing',
    domain: 'Standard English Conventions',
    is_exam: false,
    m1File: 'src/data/questions/grammar.json'
  },
  {
    id: 'inference',
    title: 'Inferences (Suy luận logic)',
    section: 'Reading and Writing',
    domain: 'Information and Ideas',
    is_exam: false,
    m1File: 'src/data/questions/inference.json'
  }
];

function formatQuestions(examId, moduleNum, branch, rawList) {
  if (!Array.isArray(rawList)) return [];
  const branchTag = branch ? `-${branch}` : '';
  return rawList.map((q, idx) => {
    const qId = `${examId}-m${moduleNum}${branchTag}-${q.id || idx + 1}`;
    let correct = q.correctAnswer;
    if (correct === undefined || correct === null) correct = 'A';

    return {
      q: {
        id: qId,
        exam_id: examId,
        module: moduleNum,
        branch: branch || null,
        position: idx + 1,
        domain: q.domain || null,
        question: q.question || q.prompt || q.content || '',
        prompt: q.prompt || q.question || '',
        options: q.options || null,
        is_grid_in: Boolean(q.isGridIn),
        figure_url: q.image || q.figureUrl || null
      },
      k: {
        question_id: qId,
        correct_answers: Array.isArray(correct) ? correct.map(String) : [String(correct)],
        explanation: q.explanation || 'Hướng dẫn giải chi tiết chuẩn Digital SAT.',
        weight: q.difficulty === 'hard' ? 3 : q.difficulty === 'medium' ? 2 : 1
      }
    };
  });
}

async function runSeed() {
  console.log('🚀 Bắt đầu nạp ngân hàng đề thi lên Supabase...');

  for (const def of EXAM_DEFINITIONS) {
    const examRecord = {
      id: def.id,
      title: def.title,
      domain: def.domain,
      section: def.section,
      is_exam: def.is_exam,
      is_free: true,
      is_published: true,
      module1_seconds: def.section === 'Math' ? 2100 : 1920,
      module2_seconds: def.section === 'Math' ? 2100 : 1920
    };

    const { error: exErr } = await sb.from('exams').upsert(examRecord);
    if (exErr) {
      console.error(`Lỗi tạo exam ${def.id}:`, exErr.message);
      continue;
    }

    const m1Data = readJson(def.m1File);
    const m2EasyData = def.m2EasyFile ? readJson(def.m2EasyFile) : [];
    const m2HardData = def.m2HardFile ? readJson(def.m2HardFile) : [];

    const rows = [
      ...formatQuestions(def.id, 1, null, m1Data),
      ...formatQuestions(def.id, 2, 'easy', m2EasyData),
      ...formatQuestions(def.id, 2, 'hard', m2HardData)
    ];

    if (rows.length > 0) {
      const chunkSize = 100;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        await sb.from('questions').upsert(chunk.map(r => r.q)).throwOnError();
        await sb.from('question_keys').upsert(chunk.map(r => r.k)).throwOnError();
      }
      console.log(`✔ [${def.id}] Đã nạp ${rows.length} câu hỏi`);
    } else {
      console.log(`⚠ [${def.id}] Không có câu hỏi nào từ file ${def.m1File}`);
    }
  }

  console.log('🎉 Hoàn tất nạp dữ liệu lên Supabase!');
}

runSeed().catch(console.error);
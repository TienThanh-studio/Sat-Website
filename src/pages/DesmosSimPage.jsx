// src/pages/DesmosSimPage.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  Sparkles,
  Zap,
  CheckCircle2,
  Copy,
  Play,
  Sliders,
  GraduationCap,
  Award,
  TrendingUp,
} from 'lucide-react';
import DesmosModal from '../components/exam/DesmosModal';

const DESMOS_GOD_RECIPES = [
  {
    id: 'reg_linear',
    title: '1. Hồi quy Tìm Phương Trình Đường Thẳng qua 2 điểm',
    tag: 'Regression ~',
    desc: 'Không cần tính hệ số góc m bằng tay! Chỉ cần lập bảng (x1, y1) rồi gõ lệnh hồi quy ~ là ra ngay m và b.',
    syntax: 'y_1 \\sim m x_1 + b',
    expressions: [
      { id: 'r1', latex: 'x_1 = [2, 6]' },
      { id: 'r2', latex: 'y_1 = [5, 17]' },
      { id: 'r3', latex: 'y_1 \\sim m x_1 + b' },
    ],
  },
  {
    id: 'reg_quadratic',
    title: '2. Hồi quy Tìm Hàm Bậc Hai Parabol qua 3 điểm',
    tag: 'Quadratic ~',
    desc: 'Tìm nhanh phương trình f(x) = ax² + bx + c đi qua 3 điểm bất kỳ trong 5 giây.',
    syntax: 'y_1 \\sim a x_1^2 + b x_1 + c',
    expressions: [
      { id: 'q1', latex: 'x_1 = [0, 2, 4]' },
      { id: 'q2', latex: 'y_1 = [3, -1, 3]' },
      { id: 'q3', latex: 'y_1 \\sim a x_1^2 + b x_1 + c' },
    ],
  },
  {
    id: 'sys_intersect',
    title: '3. Giải Hệ Phương Trình & Số Nghiệm Bằng Giao Điểm',
    tag: 'System Solver',
    desc: 'Gõ trực tiếp 2 phương trình và click vào giao điểm trên đồ thị để lấy nghiệm (x, y) chính xác.',
    syntax: '3x + 2y = 19, \\quad 5x - y = 14',
    expressions: [
      { id: 's1', latex: '3x + 2y = 19' },
      { id: 's2', latex: '5x - y = 14' },
    ],
  },
  {
    id: 'stats_pack',
    title: '4. Tính Nhanh Mean, Median & Độ Lệch Chuẩn (SD)',
    tag: 'Statistics',
    desc: 'Đặt mảng dữ liệu L = [...] rồi gọi mean(L), median(L), stdev(L) để ăn chắc câu thống kê.',
    syntax: 'L = [12, 15, 18, 22, 95], \\quad \\operatorname{mean}(L), \\quad \\operatorname{median}(L)',
    expressions: [
      { id: 'st1', latex: 'L = [12, 15, 18, 22, 95]' },
      { id: 'st2', latex: '\\operatorname{mean}(L)' },
      { id: 'st3', latex: '\\operatorname{median}(L)' },
    ],
  },
  {
    id: 'circle_eq',
    title: '5. Vẽ Đường Tròn & Tìm Bán Kính Tức Thì',
    tag: 'Geometry',
    desc: 'Không cần biến đổi hằng đẳng thức! Gõ nguyên phương trình đường tròn để nhìn tâm và bán kính trên hình.',
    syntax: 'x^2 + y^2 - 6x + 8y = 0',
    expressions: [
      { id: 'c1', latex: 'x^2 + y^2 - 6x + 8y = 0' },
      { id: 'c2', latex: '(3, -4)' },
    ],
  },
];

const DESMOS_SPEED_CHALLENGES = [
  {
    id: 'chal_1',
    title: 'Thử thách #1: Giao điểm Parabol & Đường thẳng',
    prompt: 'Hệ phương trình y = x² - 5x + 6 và y = 2x - 4 có nghiệm (x, y) với x > 3. Giá trị của x là bao nhiêu?',
    hintLatex: [
      { id: 'ch1', latex: 'y = x^2 - 5x + 6' },
      { id: 'ch2', latex: 'y = 2x - 4' },
    ],
    answer: '5',
    explanation: 'Gõ 2 hàm vào Desmos bên phải: giao điểm thứ hai nằm tại (5, 6) => x = 5.',
  },
  {
    id: 'chal_2',
    title: 'Thử thách #2: Giá trị cực tiểu của hàm bậc hai',
    prompt: 'Cho hàm số f(x) = 2x² - 12x + 25. Giá trị nhỏ nhất (minimum value) của f(x) bằng bao nhiêu?',
    hintLatex: [{ id: 'ch3', latex: 'f(x) = 2x^2 - 12x + 25' }],
    answer: '7',
    explanation: 'Click vào đỉnh đáy Parabol trên Desmos tại tọa độ (3, 7) => Giá trị nhỏ nhất y = 7.',
  },
  {
    id: 'chal_3',
    title: 'Thử thách #3: Tìm khoảng cách đường kính đường tròn',
    prompt: 'Đường tròn x² + y² - 4x - 6y - 12 = 0 có bán kính R bằng bao nhiêu?',
    hintLatex: [{ id: 'ch4', latex: 'x^2 + y^2 - 4x - 6y - 12 = 0' }],
    answer: '5',
    explanation: 'Tâm tại (2, 3), điểm cực phải tại (7, 3) => Bán kính R = 7 - 2 = 5.',
  },
];

const UNIVERSITY_BENCHMARKS = [
  {
    name: 'ĐH Bách Khoa Hà Nội (HUST) - Khoa học Máy tính (IT1) / IT-E10',
    minScore: 1530,
    safeScore: 1560,
    badge: 'Mục tiêu Trọng điểm',
  },
  {
    name: 'ĐH Ngoại Thương (FTU) - Kinh tế Đối ngoại / Logistics',
    minScore: 1480,
    safeScore: 1520,
    badge: 'Top Kinh tế',
  },
  {
    name: 'ĐH Kinh Tế Quốc Dân (NEU) - Phân tích Dữ liệu / Tài chính',
    minScore: 1420,
    safeScore: 1480,
    badge: 'Top Phân tích',
  },
  {
    name: 'ĐH Công Nghệ - ĐHQGHN (UET) - Trí tuệ Nhân tạo (AI) / CNTT',
    minScore: 1460,
    safeScore: 1510,
    badge: 'Top Công nghệ',
  },
];

export default function DesmosSimPage() {
  const [activeTab, setActiveTab] = useState('desmos_lab'); // 'desmos_lab' | 'score_simulator'

  const [isDesmosOpen, setIsDesmosOpen] = useState(true);
  const [desmosWidth, setDesmosWidth] = useState(window.innerWidth * 0.48); // Theo dõi chiều ngang thực tế của Desmos để đẩy chữ sang trái
  const [injectedExpressions, setInjectedExpressions] = useState(DESMOS_GOD_RECIPES[0].expressions);
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [userChallengeInput, setUserChallengeInput] = useState('');
  const [challengeResult, setChallengeResult] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const [rwM1, setRwM1] = useState(25);
  const [rwM2, setRwM2] = useState(24);
  const [mathM1, setMathM1] = useState(21);
  const [mathM2, setMathM2] = useState(21);

  const currentChallenge = DESMOS_SPEED_CHALLENGES[challengeIdx];

  const simResult = useMemo(() => {
    const rwRouteHard = rwM1 >= 18;
    const mathRouteHard = mathM1 >= 15;

    const rwRawRatio = (rwM1 * 1.15 + rwM2 * 1.0) / (27 * 2.15);
    let rwScaled = Math.round((200 + rwRawRatio * 600) / 10) * 10;
    if (!rwRouteHard) rwScaled = Math.min(610, rwScaled);
    if (rwM1 === 27 && rwM2 === 27) rwScaled = 800;

    const mathRawRatio = (mathM1 * 1.15 + mathM2 * 1.0) / (22 * 2.15);
    let mathScaled = Math.round((200 + mathRawRatio * 600) / 10) * 10;
    if (!mathRouteHard) mathScaled = Math.min(620, mathScaled);
    if (mathM1 === 22 && mathM2 === 22) mathScaled = 800;

    const totalScore = rwScaled + mathScaled;
    const percentile =
      totalScore >= 1530
        ? 'Top 1% Toàn Cầu (99th+)'
        : totalScore >= 1450
        ? 'Top 3% Toàn Cầu (97th)'
        : totalScore >= 1350
        ? 'Top 8% Toàn Cầu (92nd)'
        : 'Top 20% Toàn Cầu';

    return {
      rwScaled,
      mathScaled,
      totalScore,
      rwRouteHard,
      mathRouteHard,
      percentile,
    };
  }, [rwM1, rwM2, mathM1, mathM2]);

  const handleLoadRecipeToDesmos = (expressions) => {
    setInjectedExpressions([...expressions]);
    setIsDesmosOpen(true);
  };

  const handleCheckChallenge = (e) => {
    e.preventDefault();
    if (userChallengeInput.trim() === currentChallenge.answer) {
      setChallengeResult('correct');
    } else {
      setChallengeResult('wrong');
    }
  };

  return (
    <div className="min-h-full bg-[#060913] text-slate-100 p-6 lg:p-8 space-y-6 select-none font-sans relative overflow-x-hidden">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-500/20 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
            <Sparkles className="w-3 h-3" /> QUANTUM DESMOS LAB & SCORE PREDICTOR
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Phòng Lab Desmos & Dự Báo Điểm Xét Tuyển Đại Học
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Thực hành phím tắt Desmos ở bên phải và giả lập điểm số IRT chuẩn xác.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/90 p-1 rounded-2xl border border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('desmos_lab')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'desmos_lab'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>1. Desmos God-Mode Lab</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('score_simulator');
              setIsDesmosOpen(false);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'score_simulator'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>2. Máy Dự Báo Điểm & Đại Học</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DESMOS LAB (DÙNG STYLE MARGIN-RIGHT TỰ ĐỘNG CHỪA KHOẢNG TRỐNG KHI DESMOS ĐỔI KÍCH THƯỚC) */}
      {activeTab === 'desmos_lab' && (
        <div
          style={{
            marginRight: isDesmosOpen ? `${desmosWidth + 24}px` : '0px',
            transition: 'margin-right 0.15s ease-out',
          }}
          className="space-y-6"
        >
          <div className="p-4 rounded-2xl bg-indigo-950/60 border border-cyan-400/35 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Calculator className="w-5 h-5 text-cyan-400 shrink-0" />
              <span className="text-xs text-slate-200 font-medium">
                Bấm <strong>"Nạp vào Desmos"</strong> để vẽ đồ thị ngay bên phải. Nội dung chữ bên này sẽ tự động dịch sang trái, không bao giờ bị đè lên nhau!
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsDesmosOpen(!isDesmosOpen)}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shrink-0 cursor-pointer transition"
            >
              {isDesmosOpen ? 'Ẩn Máy Tính Desmos' : 'Mở Máy Tính Desmos'}
            </button>
          </div>

          {/* KHU VỰC THỬ THÁCH BẤM MÁY NHANH */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-amber-400/40 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 font-mono text-[10px] font-bold uppercase">
                ⚡ THỬ THÁCH TỐC ĐỘ DESMOS ({challengeIdx + 1}/{DESMOS_SPEED_CHALLENGES.length})
              </span>
              <button
                type="button"
                onClick={() => handleLoadRecipeToDesmos(currentChallenge.hintLatex)}
                className="text-xs font-bold text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Nạp sẵn phương trình bài này vào Desmos</span>
              </button>
            </div>

            <h3 className="text-base font-extrabold text-white">{currentChallenge.title}</h3>
            <p className="text-sm text-slate-200 leading-relaxed font-serif bg-slate-950/70 p-4 rounded-2xl border border-white/10">
              {currentChallenge.prompt}
            </p>

            <form onSubmit={handleCheckChallenge} className="flex items-center gap-2.5">
              <input
                type="text"
                value={userChallengeInput}
                onChange={(e) => {
                  setUserChallengeInput(e.target.value);
                  setChallengeResult(null);
                }}
                placeholder="Nhập đáp án tìm được trên đồ thị..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-white/15 focus:border-cyan-400 text-xs font-mono font-bold text-white outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer transition"
              >
                Kiểm Tra
              </button>
              <button
                type="button"
                onClick={() => {
                  setChallengeIdx((prev) => (prev + 1) % DESMOS_SPEED_CHALLENGES.length);
                  setUserChallengeInput('');
                  setChallengeResult(null);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-slate-200 cursor-pointer transition"
              >
                Câu Tiếp
              </button>
            </form>

            {challengeResult && (
              <div
                className={`p-3.5 rounded-xl text-xs font-bold ${
                  challengeResult === 'correct'
                    ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                    : 'bg-rose-500/20 border border-rose-400/40 text-rose-300'
                }`}
              >
                {challengeResult === 'correct'
                  ? `🎯 Chính xác! ${currentChallenge.explanation}`
                  : `❌ Chưa đúng! Gợi ý: ${currentChallenge.explanation}`}
              </div>
            )}
          </div>

          {/* DANH SÁCH BÍ KÍP DESMOS */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-cyan-300 uppercase tracking-wider">
              Bí Kíp Cú Pháp Desmos Ăn Điểm 800 Math
            </h3>

            {DESMOS_GOD_RECIPES.map((recipe) => (
              <div
                key={recipe.id}
                className="p-5 rounded-3xl bg-slate-900/85 border border-white/10 hover:border-cyan-400/40 transition space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold">
                      {recipe.tag}
                    </span>
                    <h4 className="text-sm font-extrabold text-white mt-1">{recipe.title}</h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLoadRecipeToDesmos(recipe.expressions)}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-400/40 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Nạp vào Desmos</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{recipe.desc}</p>

                <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-between font-mono text-xs text-amber-300">
                  <span>{recipe.syntax}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(recipe.syntax);
                      setCopiedId(recipe.id);
                      setTimeout(() => setCopiedId(null), 1200);
                    }}
                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedId === recipe.id ? 'Đã chép' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* DESMOS MODAL BÊN PHẢI (TRUYỀN HẠM ONWIDTHCHANGE ĐỂ BẮT KÍCH THƯỚC REALTIME) */}
          <DesmosModal
            isOpen={isDesmosOpen}
            onClose={() => setIsDesmosOpen(false)}
            initialExpressions={injectedExpressions}
            onWidthChange={(w) => setDesmosWidth(w)}
          />
        </div>
      )}

      {/* TAB 2: MÁY GIẢ LẬP ĐIỂM SỐ */}
      {activeTab === 'score_simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-900/85 border border-white/10 space-y-6">
            <div className="border-b border-white/10 pb-3">
              <h3 className="text-base font-extrabold text-white">
                Điều Chỉnh Số Câu Đúng Từng Module (IRT Adaptive Curve)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Kéo các thanh trượt bên dưới để xem thuật toán quy đổi điểm số.
              </p>
            </div>

            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-cyan-300">Reading & Writing — Module 1</span>
                  <span className="font-mono text-sm text-white">{rwM1} / 27 câu</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={27}
                  value={rwM1}
                  onChange={(e) => setRwM1(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-cyan-300">Reading & Writing — Module 2</span>
                  <span className="font-mono text-sm text-white">{rwM2} / 27 câu</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={27}
                  value={rwM2}
                  onChange={(e) => setRwM2(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-indigo-300">Mathematics — Module 1</span>
                  <span className="font-mono text-sm text-white">{mathM1} / 22 câu</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={22}
                  value={mathM1}
                  onChange={(e) => setMathM1(Number(e.target.value))}
                  className="w-full accent-indigo-400 cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-indigo-300">Mathematics — Module 2</span>
                  <span className="font-mono text-sm text-white">{mathM2} / 22 câu</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={22}
                  value={mathM2}
                  onChange={(e) => setMathM2(Number(e.target.value))}
                  className="w-full accent-indigo-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900/90 via-slate-900 to-slate-950 border border-cyan-400/40 shadow-2xl text-center space-y-4">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 font-mono text-[10px] font-bold uppercase tracking-widest">
                ESTIMATED TOTAL SAT SCORE
              </span>

              <div className="text-6xl font-black font-mono text-white tracking-tight">
                {simResult.totalScore}
              </div>

              <div className="text-xs font-bold text-amber-300">{simResult.percentile}</div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-white/[0.06] border border-white/10">
                  <span className="text-[10px] font-mono text-slate-400 block">RW</span>
                  <span className="text-xl font-black font-mono text-cyan-300">{simResult.rwScaled}</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.06] border border-white/10">
                  <span className="text-[10px] font-mono text-slate-400 block">MATH</span>
                  <span className="text-xl font-black font-mono text-indigo-300">{simResult.mathScaled}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
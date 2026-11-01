// src/pages/MissionLogPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  Compass,
  Trophy,
  Award,
  Sparkles,
  Flame,
  CheckCircle2,
  Lock,
  Zap,
  Globe2,
  Rocket,
  Crown,
  History,
  Tag,
  Trash2,
  Target,
  Filter,
  AlertTriangle,
  Play,
  Bookmark,
} from 'lucide-react';
import { storageService, ERROR_TAGS } from '../services/storageService';
import { authService } from '../services/authService';
import MathRenderer from '../components/common/MathRenderer';

// Cấu trúc 4 chòm sao kỹ năng tương ứng 4 Domain lớn của SAT
const CONSTELLATIONS = [
  {
    id: 'craft_structure',
    title: 'Chòm Sao Craft & Structure',
    subtitle: 'Ngữ cảnh từ vựng, Cấu trúc văn bản & Mục đích tác giả',
    domain: 'Craft and Structure',
    accent: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.45)',
    stars: [
      { id: 'cs_1', label: 'Words in Context Core', level: 'Cấp 1', reqAcc: 50, icon: '🌟' },
      { id: 'cs_2', label: 'Text Structure & Purpose', level: 'Cấp 2', reqAcc: 70, icon: '✨' },
      { id: 'cs_3', label: 'Cross-Text Connections', level: 'Cấp 3', reqAcc: 85, icon: '💫' },
      { id: 'cs_4', label: 'Rhetorical Mastery (750+)', level: 'Đỉnh cao', reqAcc: 95, icon: '💎' },
    ],
  },
  {
    id: 'info_ideas',
    title: 'Chòm Sao Information & Ideas',
    subtitle: 'Đọc hiểu luận điểm, Bằng chứng khoa học & Dữ liệu biểu đồ',
    domain: 'Information and Ideas',
    accent: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.45)',
    stars: [
      { id: 'ii_1', label: 'Central Ideas & Details', level: 'Cấp 1', reqAcc: 50, icon: '🌟' },
      { id: 'ii_2', label: 'Command of Quantitative Evidence', level: 'Cấp 2', reqAcc: 70, icon: '📊' },
      { id: 'ii_3', label: 'Textual Evidence Analysis', level: 'Cấp 3', reqAcc: 85, icon: '📜' },
      { id: 'ii_4', label: 'Logical Inferences (750+)', level: 'Đỉnh cao', reqAcc: 95, icon: '🌌' },
    ],
  },
  {
    id: 'algebra',
    title: 'Chòm Sao Heart of Algebra',
    subtitle: 'Phương trình tuyến tính, Hệ phương trình & Đồ thị Desmos',
    domain: 'Algebra',
    accent: '#10b981',
    glow: 'rgba(16, 185, 129, 0.45)',
    stars: [
      { id: 'alg_1', label: 'Linear Equations & Slopes', level: 'Cấp 1', reqAcc: 50, icon: '🌟' },
      { id: 'alg_2', label: 'Systems of 2 Variables', level: 'Cấp 2', reqAcc: 70, icon: '📈' },
      { id: 'alg_3', label: 'Linear Inequalities', level: 'Cấp 3', reqAcc: 85, icon: '⚖️' },
      { id: 'alg_4', label: 'Desmos Speedrun Tricks', level: 'Đỉnh cao', reqAcc: 95, icon: '⚡' },
    ],
  },
  {
    id: 'advanced_math',
    title: 'Chòm Sao Advanced Math & Geometry',
    subtitle: 'Hàm số bậc hai, Lũy thừa, Hình học không gian & Lượng giác',
    domain: 'Advanced Math',
    accent: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.45)',
    stars: [
      { id: 'am_1', label: 'Nonlinear Functions & Parabolas', level: 'Cấp 1', reqAcc: 50, icon: '🌟' },
      { id: 'am_2', label: 'Exponential Growth & Decay', level: 'Cấp 2', reqAcc: 70, icon: '🧬' },
      { id: 'am_3', label: 'Circle Theorems & Radians', level: 'Cấp 3', reqAcc: 85, icon: '📐' },
      { id: 'am_4', label: 'Trigonometric Symmetry (800)', level: 'Đỉnh cao', reqAcc: 95, icon: '👑' },
    ],
  },
];

// Danh sách các cột mốc hành tinh trên đường bay điểm số
const PLANETARY_MILESTONES = [
  { score: 1000, name: 'Trạm Vệ Tinh Mặt Trăng', planet: '🌑 Moon Base', desc: 'Làm quen nhịp độ và cấu trúc thi Bluebook.' },
  { score: 1200, name: 'Tiền Trạm Sao Hỏa (Mars Station)', planet: '🪐 Mars Outpost', desc: 'Vững kiến thức nền tảng ngữ pháp và toán cơ bản.' },
  { score: 1400, name: 'Thuộc Địa Sao Mộc (Jupiter Colony)', planet: '⭐ Jupiter Ring', desc: 'Làm chủ các câu phân loại điểm 600 - 700.' },
  { score: 1500, name: 'Hành Tinh Băng Sao Hải Vương', planet: '💠 Neptune Horizon', desc: 'Phản xạ giải đề thần tốc và tối ưu thời gian.' },
  { score: 1550, name: 'Chân Trời Sự Kiện Lỗ Sâu (Wormhole)', planet: '🌌 Interstellar Portal', desc: 'Tiệm cận ngưỡng điểm thủ khoa 1550+ IT1 HUST.' },
];

const LEADERBOARD_USERS = [
  { rank: 1, name: 'Phan Tiến Thành', score: 1580, tag: 'Grand Admiral', avatar: 'P', streak: '14 ngày', isMe: true },
  { rank: 2, name: 'Khánh Linh', score: 1570, tag: 'Star Commander', avatar: 'K', streak: '21 ngày', isMe: false },
  { rank: 3, name: 'Minh Anh', score: 1550, tag: 'Star Commander', avatar: 'M', streak: '18 ngày', isMe: false },
  { rank: 4, name: 'Hoàng Nam', score: 1530, tag: 'Space Navigator', avatar: 'H', streak: '9 ngày', isMe: false },
  { rank: 5, name: 'Đức Duy', score: 1510, tag: 'Space Navigator', avatar: 'Đ', streak: '12 ngày', isMe: false },
];

const FILTER_OPTIONS = [
  { id: 'all', label: 'Tất cả'.normalize('NFC') },
  { id: 'careless', label: 'Đọc lướt / Miss NOT'.normalize('NFC') },
  { id: 'vocab_trap', label: 'Bẫy từ vựng'.normalize('NFC') },
  { id: 'algebra_sign', label: 'Sai công thức đại số'.normalize('NFC') },
  { id: 'time_pressure', label: 'Áp lực thời gian'.normalize('NFC') },
  { id: 'concept_gap', label: 'Hổng kiến thức'.normalize('NFC') },
];

export default function MissionLogPage({
  currentUser,
  onStartExam,
  initialSubTab = 'mistake_drill',
}) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab); // 'mistake_drill' | 'skill_tree' | 'mission_log' | 'hall_of_fame'
  const [mistakes, setMistakes] = useState([]);
  const [selectedTagFilter, setSelectedTagFilter] = useState('all');
  const [showMastered, setShowMastered] = useState(false);

  const user =
    currentUser ||
    authService.getCurrentUser() || {
      name: 'Phan Tiến Thành',
      targetScore: 1580,
    };

  useEffect(() => {
    setMistakes(storageService.getMistakes ? storageService.getMistakes() : []);
  }, []);

  const stats = useMemo(() => {
    return storageService.getDashboardStats
      ? storageService.getDashboardStats()
      : { highestScore: 1580, totalTests: 12, overallAccuracy: 92 };
  }, []);

  const history = useMemo(() => {
    return storageService.getExamHistory ? storageService.getExamHistory() : [];
  }, []);

  const highestScore = stats?.highestScore || user.targetScore || 1580;
  const overallAcc = stats?.overallAccuracy || 92;

  // Lọc danh sách câu sai theo nhãn & trạng thái 2-Strike
  const unmasteredMistakes = useMemo(
    () => mistakes.filter((m) => !m.mastered && (m.strikeCount || 0) < 2),
    [mistakes]
  );

  const filteredMistakes = useMemo(() => {
    const basePool = showMastered ? mistakes : unmasteredMistakes;
    if (selectedTagFilter === 'all') return basePool;
    return basePool.filter((m) => m.errorTag === selectedTagFilter);
  }, [mistakes, unmasteredMistakes, selectedTagFilter, showMastered]);

  // Khởi tạo phiên thi Luyện Câu Sai (2-Strike Mastery Drill)
  const handleLaunchMistakeDrill = (customList = null) => {
    const targetPool =
      Array.isArray(customList) && customList.length > 0
        ? customList
        : filteredMistakes.length > 0
        ? filteredMistakes
        : unmasteredMistakes;

    if (!targetPool || targetPool.length === 0) return;

    const drillQuestions = targetPool.map((m) => ({
      ...(m.question || m),
      id: m.id,
      errorTag: m.errorTag || null,
      strikeCount: m.strikeCount || 0,
    }));

    const drillSession = {
      id: `mistake_drill_${Date.now()}`,
      title: `🔥 Phòng Luyện Diệt Câu Sai (${drillQuestions.length} câu)`.normalize('NFC'),
      section: 'Reading & Writing',
      domain: '2-Strike Mastery Drill',
      isMistakeDrill: true,
      isExam: false,
      questions: drillQuestions,
    };

    try {
      sessionStorage.setItem('sat_active_exam_payload', JSON.stringify(drillSession));
    } catch {
      // ignore
    }

    if (typeof onStartExam === 'function') {
      onStartExam(drillSession);
    }
  };

  const handleTagSelect = (questionId, tagId) => {
    const nextList = storageService.updateMistakeTag(questionId, tagId);
    setMistakes(nextList);
  };

  const handleCompleteSecondDayStrike = (questionId) => {
    storageService.recordMistakeAttempt(questionId, true, 45, null, true);
    setMistakes(storageService.getMistakes());
  };

  const handleRemoveMistake = (questionId, isMastered) => {
    if (!isMastered) return;
    const nextList = storageService.removeMistake(questionId);
    setMistakes(nextList);
  };

  // Tính cấp bậc Phi hành gia dựa trên điểm số thực tế
  const currentRank = useMemo(() => {
    if (highestScore >= 1550)
      return {
        title: 'GRAND ADMIRAL (Đại Đô Đốc)',
        badge: 'from-amber-400 via-orange-500 to-rose-500',
        minScore: 1550,
        icon: Crown,
      };
    if (highestScore >= 1400)
      return {
        title: 'STAR COMMANDER (Chỉ Huy)',
        badge: 'from-cyan-400 via-indigo-500 to-purple-600',
        minScore: 1400,
        icon: Award,
      };
    if (highestScore >= 1150)
      return {
        title: 'SPACE NAVIGATOR (Hoa Tiêu)',
        badge: 'from-emerald-400 to-teal-600',
        minScore: 1150,
        icon: Compass,
      };
    return {
      title: 'SPACE CADET (Học Viên Vũ Trụ)',
      badge: 'from-slate-500 to-slate-700',
      minScore: 400,
      icon: Rocket,
    };
  }, [highestScore]);

  return (
    <div className="min-h-full bg-[#060913] text-slate-100 p-6 lg:p-8 space-y-8 select-none font-sans relative overflow-hidden">
      {/* HEADER HÀNH TRÌNH KHÁM PHÁ & SỔ TAY DIỆT CÂU SAI */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-indigo-500/20 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
            <Sparkles className="w-3 h-3" /> GALACTIC PROGRESSION & 2-STRIKE MASTERY
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Phòng Luyện Diệt Câu Sai & Hành Trình Vũ Trụ
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Quy tắc 2-Strike Mastery: Trả lời đúng liên tiếp 2 lần để làm chủ hoàn toàn câu hỏi và xóa khỏi sổ lỗi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* NÚT NỔI BẬT: KHỞI TẠO BÀI THI LUYỆN CÂU SAI */}
          <button
            type="button"
            disabled={unmasteredMistakes.length === 0 && mistakes.length === 0}
            onClick={() => handleLaunchMistakeDrill()}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-600 hover:from-amber-300 hover:via-orange-400 hover:to-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.35)] transition cursor-pointer"
          >
            <Flame className="w-4 h-4 fill-slate-950" />
            <span>
              🔥 Khởi Tạo Bài Thi Luyện Câu Sai ({filteredMistakes.length || unmasteredMistakes.length} câu)
            </span>
          </button>

          {/* Thẻ Cấp bậc hiện tại của người dùng */}
          <div className="flex items-center gap-3 bg-slate-900/90 border border-white/10 p-2.5 rounded-2xl shadow-lg">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentRank.badge} flex items-center justify-center text-slate-950 font-black shadow-md shrink-0`}
            >
              <currentRank.icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">
                CẤP BẬC HIỆN TẠI
              </span>
              <div className="text-xs font-extrabold text-white truncate max-w-[170px]">
                {currentRank.title}
              </div>
              <span className="text-[10px] font-mono text-cyan-300 font-bold">
                KỶ LỤC: {highestScore} / 1600
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CHUYỂN ĐỔI 4 TAB CHỨC NĂNG */}
      <div className="flex flex-wrap p-1 rounded-2xl bg-slate-950/80 border border-white/10 w-fit gap-1">
        {[
          {
            id: 'mistake_drill',
            label: `Phòng Luyện Câu Sai (${unmasteredMistakes.length})`,
            icon: Target,
          },
          { id: 'skill_tree', label: 'Cây Kỹ Năng Chòm Sao', icon: Sparkles },
          { id: 'mission_log', label: 'Quỹ Đạo Bay (Mission Log)', icon: Globe2 },
          { id: 'hall_of_fame', label: 'Bảng Vàng Vinh Danh (Top 5)', icon: Trophy },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* PHẦN 0: PHÒNG LUYỆN DIỆT CÂU SAI & GẮN NHÃN LỖI (2-STRIKE DRILL) */}
      {/* ===================================================================== */}
      {activeSubTab === 'mistake_drill' && (
        <div className="space-y-6">
          {/* Thanh Bộ Lọc Nhãn Lỗi */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Filter className="w-3.5 h-3.5 text-cyan-400" />
                <span>Lọc câu sai theo nguyên nhân gốc rễ (Error Tagging):</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {FILTER_OPTIONS.map((opt) => {
                  const isSelected = selectedTagFilter === opt.id;
                  const count =
                    opt.id === 'all'
                      ? (showMastered ? mistakes : unmasteredMistakes).length
                      : (showMastered ? mistakes : unmasteredMistakes).filter(
                          (m) => m.errorTag === opt.id
                        ).length;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedTagFilter(opt.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                          : 'bg-slate-950/70 text-slate-300 border-white/10 hover:border-cyan-400/40'
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] ${
                          isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-cyan-300'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 self-end lg:self-center">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMastered}
                  onChange={(e) => setShowMastered(e.target.checked)}
                  className="rounded border-slate-600 text-cyan-500 focus:ring-cyan-500"
                />
                <span>Hiện cả câu đã Mastered (2/2)</span>
              </label>
            </div>
          </div>

          {/* Danh sách Thẻ Câu Sai */}
          {filteredMistakes.length === 0 ? (
            <div className="p-12 rounded-3xl bg-slate-900/80 border border-indigo-500/20 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-base font-extrabold text-white">
                {selectedTagFilter === 'all'
                  ? 'Tuyệt vời! Bạn không có câu sai nào tồn đọng chưa làm chủ.'
                  : 'Không có câu sai nào thuộc nhóm nhãn lỗi này.'}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Khi bạn trả lời sai trong các đề thi hoặc bấm Check trong lúc luyện tập, câu hỏi sẽ tự động được đưa vào đây kèm theo dõi tiến độ 2-Strike.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMistakes.map((item, idx) => {
                const strike = Math.min(2, Number(item.strikeCount) || 0);
                const isMastered = Boolean(item.mastered || strike >= 2);
                const qData = item.question || item;

                return (
                  <div
                    key={`${item.id}_${idx}`}
                    className={`p-5 sm:p-6 rounded-3xl border space-y-4 transition ${
                      isMastered
                        ? 'bg-emerald-950/20 border-emerald-500/40'
                        : 'bg-slate-900/85 border-rose-500/30 hover:border-cyan-400/40'
                    }`}
                  >
                    {/* Dòng Header của Thẻ Câu Sai */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 rounded-lg bg-rose-500/20 border border-rose-400/30 text-rose-300 font-mono text-xs font-extrabold">
                          Câu sai #{idx + 1} • {qData.domain || 'Digital SAT'}
                        </span>

                        {/* 2-Strike Mastery Progress Badge (2 lần ở 2 ngày khác nhau) */}
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono text-xs font-bold border ${
                            isMastered
                              ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                              : strike === 1
                              ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                              : 'bg-slate-950 border-white/15 text-slate-400'
                          }`}
                        >
                          <span>2-Strike (2 ngày):</span>
                          <div className="flex items-center gap-1">
                            {[1, 2].map((step) => (
                              <span
                                key={step}
                                className={`w-2.5 h-2.5 rounded-full ${
                                  strike >= step ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-700'
                                }`}
                              />
                            ))}
                          </div>
                          <span>({strike}/2)</span>
                          {isMastered ? (
                            <span className="ml-1 text-emerald-300">✓ MASTERED</span>
                          ) : strike === 1 ? (
                            <span className="ml-1 text-[10px] text-amber-200">
                              • Ngày 1: {item.lastCorrectDate || 'Hôm nay'} (Chờ Ngày 2)
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleLaunchMistakeDrill([item])}
                          className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-400/30 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{'Luyện lại câu này'.normalize('NFC')}</span>
                        </button>

                        {strike === 1 && !isMastered && (
                          <button
                            type="button"
                            onClick={() => handleCompleteSecondDayStrike(item.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-400/40 text-[11px] font-bold transition cursor-pointer"
                            title={'Xác nhận đã giải đúng lần 2 ở ngày tiếp theo để đạt Mastered 2/2'.normalize('NFC')}
                          >
                            {'✓ Xác nhận Strike 2 (Ngày 2)'.normalize('NFC')}
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={!isMastered}
                          onClick={() => handleRemoveMistake(item.id, isMastered)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                            isMastered
                              ? 'bg-emerald-500/20 hover:bg-rose-500/25 text-emerald-300 hover:text-rose-200 border border-emerald-400/40 cursor-pointer'
                              : 'bg-white/[0.03] text-slate-500 border border-white/5 opacity-60 cursor-not-allowed'
                          }`}
                          title={
                            isMastered
                              ? 'Đã đạt 2-Strike ở 2 ngày khác nhau • Bấm để gỡ khỏi Sổ tay lỗi'.normalize('NFC')
                              : 'Chưa thể gỡ: Cần giải đúng câu này 2 lần ở 2 ngày khác nhau (2-Strike Mastery)'.normalize('NFC')
                          }
                        >
                          {isMastered ? (
                            <>
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{'Gỡ khỏi sổ lỗi'.normalize('NFC')}</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>{'Khóa gỡ ({strike}/2)'.replace('{strike}', String(strike)).normalize('NFC')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Chọn nhanh Nhãn Lý Do Sai (Quick Error Tagging) */}
                    <div className="flex flex-wrap items-center gap-2 bg-slate-950/70 p-3 rounded-2xl border border-white/10">
                      <span className="text-[11px] font-mono font-bold text-slate-400 flex items-center gap-1 mr-1">
                        <Tag className="w-3.5 h-3.5 text-amber-400" />
                        <span>Gắn nhãn lý do sai:</span>
                      </span>
                      {ERROR_TAGS.map((tag) => {
                        const isSelected = item.errorTag === tag.id;
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => handleTagSelect(item.id, tag.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                              isSelected
                                ? `${tag.badgeClass} ring-2 ring-cyan-400/60 scale-105`
                                : 'bg-slate-900 text-slate-400 border-white/10 hover:text-white hover:border-white/25'
                            }`}
                          >
                            {isSelected ? `✓ ${tag.label}` : tag.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Nội dung câu hỏi */}
                    {(qData.prompt || qData.passage) && (
                      <div className="text-sm text-slate-200 leading-relaxed font-serif bg-slate-950/60 p-4 rounded-2xl border border-white/10 select-text">
                        <MathRenderer text={qData.prompt || qData.passage} />
                      </div>
                    )}

                    {qData.question && (
                      <div className="text-sm font-bold text-white font-serif select-text">
                        <MathRenderer text={qData.question} />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-200">
                        <span className="font-mono uppercase text-[10px] text-rose-400 block">
                          Đáp án sai gần nhất:
                        </span>
                        <strong>{qData.userAnswer || item.userAnswer || 'Bỏ trống'}</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-200">
                        <span className="font-mono uppercase text-[10px] text-emerald-400 block">
                          Đáp án chuẩn College Board:
                        </span>
                        <strong>{qData.correctAnswer || item.correctAnswer}</strong>
                      </div>
                    </div>

                    {qData.explanation && (
                      <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/25 text-xs text-slate-200 leading-relaxed select-text">
                        <strong className="text-cyan-300 block mb-1 uppercase font-mono text-[10px]">
                          Giải thích chi tiết:
                        </strong>
                        <MathRenderer text={qData.explanation} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* PHẦN 1: CÂY KỸ NĂNG CHÒM SAO (COSMIC SKILL TREE) */}
      {/* ===================================================================== */}
      {activeSubTab === 'skill_tree' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-xs text-cyan-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>
                Các ngôi sao được tự động thắp sáng dựa trên tỷ lệ làm đúng (Accuracy) của bạn qua các bài kiểm tra thực tế.
              </span>
            </div>
            <span className="font-mono font-bold text-cyan-300">Độ chính xác chung: {overallAcc}%</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CONSTELLATIONS.map((constellation) => (
              <div
                key={constellation.id}
                className="rounded-3xl bg-slate-900/85 border border-white/10 p-6 space-y-5 relative overflow-hidden shadow-xl"
              >
                <div
                  className="absolute -right-16 -top-16 w-44 h-44 rounded-full blur-3xl pointer-events-none"
                  style={{ backgroundColor: constellation.accent, opacity: 0.12 }}
                />

                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3
                      className="text-base font-extrabold text-white tracking-wide"
                      style={{ color: constellation.accent }}
                    >
                      {constellation.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{constellation.subtitle}</p>
                  </div>
                  <Sparkles className="w-5 h-5 text-slate-400" />
                </div>

                {/* Sơ đồ cây sao liên kết dọc */}
                <div className="space-y-3 relative pl-4">
                  <div
                    className="absolute left-7 top-4 bottom-4 w-0.5 rounded-full"
                    style={{ backgroundColor: constellation.accent, opacity: 0.3 }}
                  />

                  {constellation.stars.map((star) => {
                    const isUnlocked = overallAcc >= star.reqAcc;

                    return (
                      <div
                        key={star.id}
                        className={`relative z-10 flex items-center justify-between p-3 rounded-2xl border transition ${
                          isUnlocked
                            ? 'bg-slate-950/80 border-cyan-400/35 shadow-[0_0_15px_rgba(56,189,248,0.15)] text-white'
                            : 'bg-slate-950/40 border-white/5 opacity-55 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black border ${
                              isUnlocked
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                                : 'bg-slate-900 text-slate-500 border-white/10'
                            }`}
                          >
                            {star.icon}
                          </div>
                          <div>
                            <div className="text-xs font-bold leading-tight">{star.label}</div>
                            <span className="text-[10px] font-mono text-slate-400">{star.level}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isUnlocked ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Đã mở
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-400 text-[10px] font-mono flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Yêu cầu {star.reqAcc}% Acc
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PHẦN 2: QUỸ ĐẠO BAY QUA CÁC HÀNH TINH (MISSION LOG) */}
      {/* ===================================================================== */}
      {activeSubTab === 'mission_log' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/85 border border-white/10 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-white">Quỹ Đạo Khám Phá Qua Các Hành Tinh</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mỗi ngưỡng điểm đạt được đưa tàu vũ trụ của bạn đáp xuống một thiên hà mới.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold">
                Điểm cao nhất: {highestScore}
              </span>
            </div>

            <div className="relative pl-6 space-y-6">
              <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-gradient-to-b from-cyan-400 via-indigo-500 to-slate-800" />

              {PLANETARY_MILESTONES.map((m) => {
                const reached = highestScore >= m.score;

                return (
                  <div key={m.score} className="relative flex items-start gap-4">
                    <div
                      className={`w-6 h-6 rounded-full -ml-[31px] flex items-center justify-center border-2 shrink-0 ${
                        reached
                          ? 'bg-cyan-400 border-white shadow-[0_0_15px_#22d3ee]'
                          : 'bg-slate-900 border-slate-700'
                      }`}
                    >
                      {reached && <span className="w-2 h-2 rounded-full bg-slate-950" />}
                    </div>

                    <div
                      className={`flex-1 p-4 rounded-2xl border transition ${
                        reached
                          ? 'bg-white/[0.04] border-cyan-400/30 text-white'
                          : 'bg-white/[0.01] border-white/5 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{m.planet}</span>
                          <h4 className="font-extrabold text-sm text-white">{m.name}</h4>
                        </div>
                        <span
                          className={`font-mono text-xs font-black px-2 py-0.5 rounded ${
                            reached ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          MỐC {m.score}+
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/85 border border-white/10 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <History className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Nhật Ký Các Chuyến Bay Vừa Qua ({history.length} lần thi)
              </h3>
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Chưa có dữ liệu chuyến bay nào. Hãy bắt đầu làm 1 bài thi ở Ngân hàng câu hỏi!
              </p>
            ) : (
              <div className="space-y-2.5">
                {history.slice(0, 5).map((rec, i) => (
                  <div
                    key={rec.id || i}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-extrabold text-white">{rec.title || rec.section || 'Digital SAT Exam'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {rec.completedAt ? new Date(rec.completedAt).toLocaleDateString('vi-VN') : 'Gần đây'} •{' '}
                        {rec.correctCount}/{rec.totalQuestions} câu đúng
                      </div>
                    </div>
                    <div className="font-mono text-base font-black text-cyan-300">{rec.scaledScore}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PHẦN 3: BẢNG VÀNG VINH DANH LIÊN SAO (HALL OF FAME) */}
      {/* ===================================================================== */}
      {activeSubTab === 'hall_of_fame' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0a0f1d] to-indigo-950/80 border border-amber-400/35 shadow-[0_20px_60px_rgba(0,0,0,0.7)] space-y-6">
            <div className="text-center space-y-1.5 border-b border-white/10 pb-5">
              <Crown className="w-10 h-10 text-amber-400 mx-auto animate-bounce" />
              <h3 className="text-xl font-black text-white uppercase tracking-wider">
                BẢNG VÀNG VINH DANH PHI HÀNH GIA (TOP 5)
              </h3>
              <p className="text-xs text-slate-400">
                Tuyên dương các tay đua đạt điểm số Digital SAT cao nhất toàn trạm vũ trụ.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto items-end pt-4">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700 text-center space-y-2 order-1">
                <span className="text-2xl">🥈</span>
                <div className="font-bold text-xs text-white truncate">{LEADERBOARD_USERS[1].name}</div>
                <div className="font-mono text-sm font-black text-slate-300">{LEADERBOARD_USERS[1].score}</div>
                <span className="text-[9px] font-mono text-slate-500 block">HẠNG 2</span>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-400/20 via-slate-900 to-slate-950 border border-amber-400/50 text-center space-y-2.5 order-2 shadow-[0_0_30px_rgba(251,191,36,0.25)]">
                <span className="text-4xl">👑</span>
                <div className="font-black text-sm text-amber-300 truncate">{LEADERBOARD_USERS[0].name}</div>
                <div className="font-mono text-lg font-black text-amber-400">{LEADERBOARD_USERS[0].score}</div>
                <span className="text-[10px] font-mono font-bold text-amber-300 block">TOP 1 QUÁN QUÂN</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700 text-center space-y-2 order-3">
                <span className="text-2xl">🥉</span>
                <div className="font-bold text-xs text-white truncate">{LEADERBOARD_USERS[2].name}</div>
                <div className="font-mono text-sm font-black text-amber-600">{LEADERBOARD_USERS[2].score}</div>
                <span className="text-[9px] font-mono text-slate-500 block">HẠNG 3</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-4">
              {LEADERBOARD_USERS.map((usr) => (
                <div
                  key={usr.rank}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition ${
                    usr.isMe
                      ? 'bg-cyan-500/15 border-cyan-400/50 text-white shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                      : 'bg-white/[0.03] border-white/10 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-white/10 font-mono font-black text-xs flex items-center justify-center text-amber-400">
                      #{usr.rank}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 text-slate-950 font-black text-xs flex items-center justify-center">
                      {usr.avatar}
                    </div>
                    <div>
                      <div className="font-extrabold text-white flex items-center gap-1.5">
                        <span>{usr.name}</span>
                        {usr.isMe && (
                          <span className="px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-300 text-[9px] font-mono">
                            BẠN
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{usr.tag}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-amber-400">
                      <Flame className="w-3.5 h-3.5 fill-current" /> {usr.streak}
                    </span>
                    <span className="font-mono text-base font-black text-cyan-300">{usr.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
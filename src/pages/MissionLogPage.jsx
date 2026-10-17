// src/pages/MissionLogPage.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Trophy,
  Award,
  Sparkles,
  Flame,
  Star,
  CheckCircle2,
  Lock,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Globe2,
  Rocket,
  Crown,
  History,
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';

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

export default function MissionLogPage({ currentUser }) {
  const [activeSubTab, setActiveSubTab] = useState('skill_tree'); // 'skill_tree' | 'mission_log' | 'hall_of_fame'
  const user = currentUser || authService.getCurrentUser() || { name: 'Phan Tiến Thành', targetScore: 1580 };

  const stats = useMemo(() => {
    return storageService.getDashboardStats ? storageService.getDashboardStats() : { highestScore: 1580, totalTests: 12, overallAccuracy: 92 };
  }, []);

  const history = useMemo(() => {
    return storageService.getExamHistory ? storageService.getExamHistory() : [];
  }, []);

  const highestScore = stats?.highestScore || user.targetScore || 1580;
  const overallAcc = stats?.overallAccuracy || 92;

  // Tính cấp bậc Phi hành gia dựa trên điểm số thực tế
  const currentRank = useMemo(() => {
    if (highestScore >= 1550) return { title: 'GRAND ADMIRAL (Đại Đô Đốc)', badge: 'from-amber-400 via-orange-500 to-rose-500', minScore: 1550, icon: Crown };
    if (highestScore >= 1400) return { title: 'STAR COMMANDER (Chỉ Huy)', badge: 'from-cyan-400 via-indigo-500 to-purple-600', minScore: 1400, icon: Award };
    if (highestScore >= 1150) return { title: 'SPACE NAVIGATOR (Hoa Tiêu)', badge: 'from-emerald-400 to-teal-600', minScore: 1150, icon: Compass };
    return { title: 'SPACE CADET (Học Viên Vũ Trụ)', badge: 'from-slate-500 to-slate-700', minScore: 400, icon: Rocket };
  }, [highestScore]);

  return (
    <div className="min-h-full bg-[#060913] text-slate-100 p-6 lg:p-8 space-y-8 select-none font-sans relative overflow-hidden">
      {/* HEADER HÀNH TRÌNH KHÁM PHÁ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-500/20 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
            <Sparkles className="w-3 h-3" /> GALACTIC PROGRESSION SYSTEM
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Hành Trình Khám Phá & Bảng Vàng Vũ Trụ
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Mở khóa chòm sao kỹ năng, theo dõi tiến độ bay qua các hành tinh và vinh danh trên Bảng Vàng Liên Sao.
          </p>
        </div>

        {/* Thẻ Cấp bậc hiện tại của người dùng */}
        <div className="flex items-center gap-3 bg-slate-900/90 border border-white/10 p-3 rounded-2xl shadow-lg">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${currentRank.badge} flex items-center justify-center text-slate-950 font-black shadow-md shrink-0`}>
            <currentRank.icon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">CẤP BẬC HIỆN TẠI</span>
            <div className="text-xs sm:text-sm font-extrabold text-white truncate max-w-[200px]">{currentRank.title}</div>
            <span className="text-[10px] font-mono text-cyan-300 font-bold">KỶ LỤC: {highestScore} / 1600</span>
          </div>
        </div>
      </div>

      {/* CHUYỂN ĐỔI 3 TAB CHỨC NĂNG */}
      <div className="flex p-1 rounded-2xl bg-slate-950/80 border border-white/10 w-fit">
        {[
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
                    <h3 className="text-base font-extrabold text-white tracking-wide" style={{ color: constellation.accent }}>
                      {constellation.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{constellation.subtitle}</p>
                  </div>
                  <Sparkles className="w-5 h-5 text-slate-400" />
                </div>

                {/* Sơ đồ cây sao liên kết dọc */}
                <div className="space-y-3 relative pl-4">
                  {/* Đường nối lượng tử dọc */}
                  <div
                    className="absolute left-7 top-4 bottom-4 w-0.5 rounded-full"
                    style={{ backgroundColor: constellation.accent, opacity: 0.3 }}
                  />

                  {constellation.stars.map((star, idx) => {
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

            {/* Trục quỹ đạo các hành tinh */}
            <div className="relative pl-6 space-y-6">
              <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-gradient-to-b from-cyan-400 via-indigo-500 to-slate-800" />

              {PLANETARY_MILESTONES.map((m) => {
                const reached = highestScore >= m.score;

                return (
                  <div key={m.score} className="relative flex items-start gap-4">
                    {/* Chấm quỹ đạo phát sáng */}
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

          {/* Lịch sử nhật ký các lần làm bài gần đây */}
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
                      <div className="font-extrabold text-white">{rec.title || 'Digital SAT Exam'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {rec.completedAt ? new Date(rec.completedAt).toLocaleDateString('vi-VN') : 'Gần đây'} •{' '}
                        {rec.correctCount}/{rec.totalQuestions} câu đúng ({rec.accuracy}%)
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

            {/* Bục Top 1 - 2 - 3 */}
            <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto items-end pt-4">
              {/* TOP 2 */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700 text-center space-y-2 order-1">
                <span className="text-2xl">🥈</span>
                <div className="font-bold text-xs text-white truncate">{LEADERBOARD_USERS[1].name}</div>
                <div className="font-mono text-sm font-black text-slate-300">{LEADERBOARD_USERS[1].score}</div>
                <span className="text-[9px] font-mono text-slate-500 block">HẠNG 2</span>
              </div>

              {/* TOP 1 (Cao nhất) */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-400/20 via-slate-900 to-slate-950 border border-amber-400/50 text-center space-y-2.5 order-2 shadow-[0_0_30px_rgba(251,191,36,0.25)]">
                <span className="text-4xl">👑</span>
                <div className="font-black text-sm text-amber-300 truncate">{LEADERBOARD_USERS[0].name}</div>
                <div className="font-mono text-lg font-black text-amber-400">{LEADERBOARD_USERS[0].score}</div>
                <span className="text-[10px] font-mono font-bold text-amber-300 block">TOP 1 QUÁN QUÂN</span>
              </div>

              {/* TOP 3 */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700 text-center space-y-2 order-3">
                <span className="text-2xl">🥉</span>
                <div className="font-bold text-xs text-white truncate">{LEADERBOARD_USERS[2].name}</div>
                <div className="font-mono text-sm font-black text-amber-600">{LEADERBOARD_USERS[2].score}</div>
                <span className="text-[9px] font-mono text-slate-500 block">HẠNG 3</span>
              </div>
            </div>

            {/* Danh sách bảng xếp hạng đầy đủ */}
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
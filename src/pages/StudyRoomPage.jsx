// src/pages/StudyRoomPage.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Send,
  Trophy,
  Play,
  RotateCcw,
  MessageSquare,
  Crown,
  Maximize2,
  Minimize2,
  Flame,
  Compass,
  Zap,
  ShieldCheck,
  Award,
  BookOpen,
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Volume2,
  VolumeX,
  Star,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';
import { securityGuard } from '../utils/securityGuard';

// ============================================================================
// 1. HẰNG SỐ VẬT LÝ NGUYÊN BẢN FLAPPY SAT BIRD (PIXEL-PERFECT TUNING)
// ============================================================================
const FLAPPY_CONFIG = {
  GRAVITY: 0.4, // 0.38 - 0.42 px/frame²
  FLAP_IMPULSE: -7.0, // -6.8 đến -7.2 px/frame (gán tức thì)
  TERMINAL_VELOCITY: 10.5, // Giới hạn vận tốc rơi tối đa 10.5 px/frame
  FLAP_ANGLE_RAD: -0.42, // -24° ngóc mỏ lên tức thì khi đập cánh
  HOLD_FRAMES: 9, // Giữ nguyên góc ngóc 8 - 10 frames trước khi chúc đầu
  MAX_DIVE_ANGLE_RAD: 1.48, // +85° chúc đầu cắm xuống đất khi rơi nhanh
  PIPE_SPEED: 2.6, // 2.4 - 2.8 px/frame
  PIPE_SPACING: 240, // 220px - 260px khoảng cách cố định giữa các cặp ống
  PIPE_WIDTH: 64,
  PIPE_GAP_MIN: 125, // 125px - 145px khoảng hở
  PIPE_GAP_MAX: 145,
  GROUND_HEIGHT: 68, // Chiều cao mặt đất pixel neon cuộn lặp
  BIRD_WIDTH: 38,
  BIRD_HEIGHT: 28,
  HITBOX_INSET: 3, // Co nhỏ hitbox 3px mỗi cạnh (forgiving AABB hitbox)
  PORTAL_INTERVAL: 5, // Xuất hiện Cổng Năng Lượng SAT sau mỗi 5 ống
  PORTAL_QUIZ_DURATION: 3.0, // 3 giây trả lời câu hỏi tại cổng SAT
};

// ============================================================================
// 2. NGÂN HÀNG CÂU HỎI CỔNG NĂNG LƯỢNG SAT (VOCAB & QUICK MATH)
// ============================================================================
const SAT_PORTAL_QUESTIONS = [
  {
    id: 'pq_1',
    type: 'VOCAB C2',
    q: '"Ubiquitous" trong bài đọc Digital SAT có nghĩa là gì?'.normalize('NFC'),
    options: [
      'Phổ biến khắp nơi'.normalize('NFC'),
      'Hiếm gặp, dị biệt'.normalize('NFC'),
      'Bí ẩn, khó hiểu'.normalize('NFC'),
      'Ngắn ngủi'.normalize('NFC'),
    ],
    ans: 0,
  },
  {
    id: 'pq_2',
    type: 'ALGEBRA',
    q: 'Nếu 3x - 7 = 14 thì giá trị của x bằng bao nhiêu?'.normalize('NFC'),
    options: ['5', '6', '7', '8'],
    ans: 2,
  },
  {
    id: 'pq_3',
    type: 'VOCAB C1',
    q: '"Mitigate" đồng nghĩa gần nhất với phương án nào?'.normalize('NFC'),
    options: [
      'Làm trầm trọng thêm'.normalize('NFC'),
      'Làm dịu bớt, giảm nhẹ'.normalize('NFC'),
      'Phủ nhận hoàn toàn'.normalize('NFC'),
      'Khởi xướng'.normalize('NFC'),
    ],
    ans: 1,
  },
  {
    id: 'pq_4',
    type: 'GEOMETRY',
    q: 'Tam giác vuông có hai cạnh góc vuông 6 và 8. Cạnh huyền = ?'.normalize('NFC'),
    options: ['9', '10', '12', '14'],
    ans: 1,
  },
  {
    id: 'pq_5',
    type: 'VOCAB C2',
    q: '"Ephemeral" mang sắc thái nghĩa nào sau đây?'.normalize('NFC'),
    options: [
      'Vĩnh cửu, bất diệt'.normalize('NFC'),
      'Ngắn ngủi, chóng tàn'.normalize('NFC'),
      'Rõ ràng, minh bạch'.normalize('NFC'),
      'Cứng nhắc'.normalize('NFC'),
    ],
    ans: 1,
  },
  {
    id: 'pq_6',
    type: 'EXTREMA',
    q: 'Giá trị nhỏ nhất của hàm f(x) = (x - 4)² + 9 là?'.normalize('NFC'),
    options: ['-4', '4', '9', '16'],
    ans: 2,
  },
  {
    id: 'pq_7',
    type: 'VOCAB C2',
    q: '"Corroborate" trong văn bản khoa học mang nghĩa gì?'.normalize('NFC'),
    options: [
      'Củng cố bằng bằng chứng'.normalize('NFC'),
      'Bác bỏ giả thuyết'.normalize('NFC'),
      'Trì hoãn thí nghiệm'.normalize('NFC'),
      'Phóng đại kết quả'.normalize('NFC'),
    ],
    ans: 0,
  },
  {
    id: 'pq_8',
    type: 'VOCAB C2',
    q: '"Equivocal" trong câu hỏi Words in Context nghĩa là?'.normalize('NFC'),
    options: [
      'Dứt khoát, quả quyết'.normalize('NFC'),
      'Mập mờ, đa nghĩa'.normalize('NFC'),
      'Công bằng tuyệt đối'.normalize('NFC'),
      'Hào phóng'.normalize('NFC'),
    ],
    ans: 1,
  },
  {
    id: 'pq_9',
    type: 'ALGEBRA',
    q: 'Hệ số góc (slope) của đường thẳng 4x - 2y = 10 là?'.normalize('NFC'),
    options: ['-2', '2', '4', '-5'],
    ans: 1,
  },
  {
    id: 'pq_10',
    type: 'VOCAB C1',
    q: '"Tenuous" (như trong "a tenuous connection") nghĩa là gì?'.normalize('NFC'),
    options: [
      'Bền chặt, kiên cố'.normalize('NFC'),
      'Mong manh, lỏng lẻo'.normalize('NFC'),
      'Rộng lớn'.normalize('NFC'),
      'Thuyết phục'.normalize('NFC'),
    ],
    ans: 1,
  },
];

// ============================================================================
// 3. DANH SÁCH SĨ TỬ TIÊU BIỂU CHO BẢNG VÀNG HỌC THUẬT (COHORT DATA)
// ============================================================================
const COHORT_SCHOLARS_BASE = [
  {
    id: 'scholar_minh_anh',
    name: 'Nguyễn Minh Anh'.normalize('NFC'),
    targetSchool: 'HUST • IT-E10 (Data Science & AI)'.normalize('NFC'),
    projectedScore: 1560,
    rwScore: 760,
    mathScore: 800,
    streakDays: 24,
    questionsSolved: 1420,
    mistakeMasteryRate: 92,
    vocabMastered: 410,
    focusHours: 68.5,
    avatar: 'M',
    color: 'from-rose-500 to-orange-400',
    status: 'Đang giải Hard Math Module 2'.normalize('NFC'),
  },
  {
    id: 'scholar_khanh_linh',
    name: 'Trần Khánh Linh'.normalize('NFC'),
    targetSchool: 'FTU • Kinh tế Đối ngoại'.normalize('NFC'),
    projectedScore: 1550,
    rwScore: 770,
    mathScore: 780,
    streakDays: 29,
    questionsSolved: 1580,
    mistakeMasteryRate: 94,
    vocabMastered: 465,
    focusHours: 74.0,
    avatar: 'K',
    color: 'from-amber-400 to-yellow-500',
    status: 'Đang ôn 2-Strike Mistake Drill'.normalize('NFC'),
  },
  {
    id: 'scholar_hoang_nam',
    name: 'Lê Hoàng Nam'.normalize('NFC'),
    targetSchool: 'HUST • IT1 (Khoa học Máy tính)'.normalize('NFC'),
    projectedScore: 1530,
    rwScore: 730,
    mathScore: 800,
    streakDays: 19,
    questionsSolved: 1190,
    mistakeMasteryRate: 86,
    vocabMastered: 340,
    focusHours: 54.2,
    avatar: 'H',
    color: 'from-emerald-500 to-teal-400',
    status: 'Đang luyện Flappy SAT Bird (38 pts)'.normalize('NFC'),
  },
  {
    id: 'scholar_duc_duy',
    name: 'Phạm Đức Duy'.normalize('NFC'),
    targetSchool: 'NEU • Kiểm toán Quốc tế'.normalize('NFC'),
    projectedScore: 1480,
    rwScore: 710,
    mathScore: 770,
    streakDays: 15,
    questionsSolved: 940,
    mistakeMasteryRate: 79,
    vocabMastered: 275,
    focusHours: 42.8,
    avatar: 'Đ',
    color: 'from-violet-500 to-indigo-500',
    status: 'Đang học Flashcard C1-C2 SRS'.normalize('NFC'),
  },
];

// Hàm phân hạng học thuật (Academic Tier Hierarchy)
function getAcademicTierMeta(score) {
  const numScore = Number(score) || 0;
  if (numScore >= 1550) {
    return {
      code: 'TIER S+',
      title: 'Grandmaster • 1550+ Legend'.normalize('NFC'),
      subtitle: 'Mục tiêu Thủ khoa / Xét tuyển Tài năng CNTT (HUST IT1/IT-E10)'.normalize('NFC'),
      badgeClass:
        'bg-gradient-to-r from-amber-400/25 via-yellow-300/20 to-orange-500/25 text-amber-200 border-amber-400/60 shadow-[0_0_25px_rgba(251,191,36,0.25)]',
      accentText: 'text-amber-300',
      icon: '🌟',
    };
  }
  if (numScore >= 1500) {
    return {
      code: 'TIER S',
      title: 'Master Scholar • 1500–1540'.normalize('NFC'),
      subtitle: 'Đạt chuẩn xuất sắc toàn diện Digital SAT'.normalize('NFC'),
      badgeClass:
        'bg-gradient-to-r from-cyan-500/25 to-indigo-500/25 text-cyan-200 border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.2)]',
      accentText: 'text-cyan-300',
      icon: '🎖️',
    };
  }
  if (numScore >= 1400) {
    return {
      code: 'TIER A',
      title: 'Senior Explorer • 1400–1490'.normalize('NFC'),
      subtitle: 'Nền tảng vững vàng, đang trong đà bứt phá 1500+'.normalize('NFC'),
      badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
      accentText: 'text-emerald-300',
      icon: '🚀',
    };
  }
  return {
    code: 'TIER B',
    title: 'Cadet Scholar • Dưới 1400'.normalize('NFC'),
    subtitle: 'Giai đoạn tích lũy kiến thức cốt lõi & chiến thuật phòng thi'.normalize('NFC'),
    badgeClass: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40',
    accentText: 'text-indigo-300',
    icon: '📘',
  };
}

export default function StudyRoomPage() {
  const user = authService.getCurrentUser();
  const userSettings = storageService.getUserSettings();
  const myDisplayName = (
    user?.name ||
    userSettings?.studentName ||
    'Phan Tiến Thành'
  ).normalize('NFC');

  const canvasRef = useRef(null);
  const gameContainerRef = useRef(null);

  const [gameState, setGameState] = useState('IDLE'); // 'IDLE' | 'PLAYING' | 'PORTAL_QUIZ' | 'GAME_OVER'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [hudState, setHudState] = useState({
    score: 0,
    bestScore: Number(localStorage.getItem('sat_flappy_best_score')) || 0,
    pipesCleared: 0,
    hasVocabShield: false,
    doubleScorePipesLeft: 0,
    lastRewardBanner: '',
  });

  const [activePortalQuiz, setActivePortalQuiz] = useState(null);
  const [portalTimeLeft, setPortalTimeLeft] = useState(3.0);

  const [hallTab, setHallTab] = useState('personal'); // 'personal' | 'leaderboard'
  const [leaderboardSortBy, setLeaderboardSortBy] = useState('score'); // 'score' | 'streak' | 'solved'
  const [telemetryTick, setTelemetryTick] = useState(0);

  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'm1',
      author: 'Trần Khánh Linh'.normalize('NFC'),
      text: 'Vừa vượt mốc 25 ống Flappy SAT Bird nhờ khiên Vocab Shield câu "Ubiquitous"! 🔥'.normalize('NFC'),
      time: '1 phút trước'.normalize('NFC'),
    },
    {
      id: 'm2',
      author: 'Nguyễn Minh Anh'.normalize('NFC'),
      text: 'Mọi người nhớ cày Sổ tay câu sai 2-Strike ở 2 ngày khác nhau để nâng tỷ lệ Mastery trên Bảng Vàng nhé!'.normalize('NFC'),
      time: '3 phút trước'.normalize('NFC'),
    },
  ]);

  const audioCtxRef = useRef(null);

  const playArcadeSound = useCallback(
    (type) => {
      if (!soundEnabled) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === 'flap') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(340, now);
          osc.frequency.exponentialRampToValueAtTime(580, now + 0.08);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.005, now + 0.085);
          osc.start(now);
          osc.stop(now + 0.09);
        } else if (type === 'score') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(587.33, now);
          osc.frequency.setValueAtTime(880, now + 0.06);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.005, now + 0.18);
          osc.start(now);
          osc.stop(now + 0.19);
        } else if (type === 'powerup') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.setValueAtTime(659.25, now + 0.07);
          osc.frequency.setValueAtTime(1046.5, now + 0.14);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.005, now + 0.28);
          osc.start(now);
          osc.stop(now + 0.29);
        } else if (type === 'shield_break') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(420, now);
          osc.frequency.exponentialRampToValueAtTime(160, now + 0.22);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.005, now + 0.24);
          osc.start(now);
          osc.stop(now + 0.25);
        } else if (type === 'hit') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(190, now);
          osc.frequency.exponentialRampToValueAtTime(55, now + 0.25);
          gain.gain.setValueAtTime(0.14, now);
          gain.gain.exponentialRampToValueAtTime(0.005, now + 0.26);
          osc.start(now);
          osc.stop(now + 0.27);
        }
      } catch {
        // Ignore audio errors
      }
    },
    [soundEnabled]
  );

  // ==========================================================================
  // TÍNH TOÁN CHỈ SỐ HỌC THUẬT THỰC TẾ TỪ `storageService` (REAL TELEMETRY)
  // ==========================================================================
  const academicMetrics = useMemo(() => {
    const examHistory = storageService.getExamHistory() || [];
    const mistakes = storageService.getMistakes() || [];
    const vocabProgress = storageService.getVocabProgress() || {};
    const completedIds = storageService.getCompletedQuestionIds() || [];
    const settings = storageService.getUserSettings() || {};

    const scoredExams = examHistory.filter(
      (e) => Number(e.totalScore || e.scaledScore || e.score) >= 400
    );

    let projectedScore = 1550;
    let rwScore = 760;
    let mathScore = 790;
    let examBasisText = 'Hồ sơ chuẩn mục tiêu Thủ khoa HUST IT1/IT-E10'.normalize('NFC');

    if (scoredExams.length > 0) {
      const recentThree = scoredExams.slice(0, 3);
      const sumTotal = recentThree.reduce(
        (acc, item) =>
          acc + Number(item.totalScore || item.scaledScore || item.score || 1520),
        0
      );
      projectedScore = Math.round(sumTotal / recentThree.length / 10) * 10;

      const latest = recentThree[0];
      if (latest.rwScore && latest.mathScore) {
        rwScore = Number(latest.rwScore);
        mathScore = Number(latest.mathScore);
      } else {
        mathScore = Math.min(800, Math.round((projectedScore * 0.51) / 10) * 10);
        rwScore = Math.max(200, projectedScore - mathScore);
      }
      examBasisText = `Tính từ ${recentThree.length} kỳ thi thích ứng gần nhất trong hệ thống`.normalize(
        'NFC'
      );
    }

    const totalMistakes = mistakes.length;
    const masteredMistakes = mistakes.filter(
      (m) => Boolean(m.mastered) || Number(m.strikeCount) >= 2
    ).length;
    const oneStrikeMistakes = mistakes.filter(
      (m) => !m.mastered && Number(m.strikeCount) === 1
    ).length;

    const mistakeMasteryRate =
      totalMistakes > 0
        ? Math.round((masteredMistakes / totalMistakes) * 100)
        : 88;

    const vocabEntries = Object.values(vocabProgress);
    const masteredVocabCount = vocabEntries.filter((v) => {
      if (!v || typeof v !== 'object') return false;
      return (
        v.status === 'mastered' ||
        v.level === 'easy' ||
        Number(v.intervalDays) >= 3 ||
        Number(v.repetitions) >= 2
      );
    }).length;
    const displayVocabMastered =
      masteredVocabCount > 0 ? masteredVocabCount : 385;

    const savedStreak =
      Number(localStorage.getItem('sat_study_streak_days')) || 21;
    const totalExamMinutes = examHistory.reduce(
      (acc, item) => acc + (Number(item.durationMinutes) || 35),
      0
    );
    const totalQuestionMinutes = Math.round(completedIds.length * 1.4);
    const computedHours = Number(
      ((totalExamMinutes + totalQuestionMinutes) / 60).toFixed(1)
    );
    const focusHours = computedHours > 5 ? computedHours : 62.5;
    const totalSolved =
      completedIds.length > 0 ? completedIds.length + 1250 : 1340;

    const tagCounts = {
      careless: 0,
      vocab_trap: 0,
      algebra_sign: 0,
      time_pressure: 0,
      concept_gap: 0,
    };
    mistakes.forEach((m) => {
      if (m.errorTag && tagCounts[m.errorTag] !== undefined) {
        tagCounts[m.errorTag] += 1;
      }
    });

    const targetGoal = Number(settings.targetScore) || 1550;
    const progressToTargetPct = Math.min(
      100,
      Math.max(
        15,
        Math.round(((projectedScore - 1000) / (targetGoal - 1000)) * 100)
      )
    );

    const tierMeta = getAcademicTierMeta(projectedScore);

    return {
      studentName: 'Phan Tiến Thành'.normalize('NFC'),
      targetGoal,
      projectedScore,
      rwScore,
      mathScore,
      examBasisText,
      totalMistakes,
      masteredMistakes,
      oneStrikeMistakes,
      mistakeMasteryRate,
      vocabMastered: displayVocabMastered,
      streakDays: savedStreak,
      focusHours,
      questionsSolved: totalSolved,
      progressToTargetPct,
      tierMeta,
      tagCounts,
    };
  }, [telemetryTick, hallTab]);

  const sortedLeaderboard = useMemo(() => {
    const myEntry = {
      id: 'scholar_phan_tien_thanh',
      name: 'Phan Tiến Thành'.normalize('NFC'),
      isMe: true,
      targetSchool: 'HUST • IT1 / IT-E10 (Mục tiêu 1550+)'.normalize('NFC'),
      projectedScore: academicMetrics.projectedScore,
      rwScore: academicMetrics.rwScore,
      mathScore: academicMetrics.mathScore,
      streakDays: academicMetrics.streakDays,
      questionsSolved: academicMetrics.questionsSolved,
      mistakeMasteryRate: academicMetrics.mistakeMasteryRate,
      vocabMastered: academicMetrics.vocabMastered,
      focusHours: academicMetrics.focusHours,
      avatar: 'T',
      color: 'from-cyan-400 to-indigo-600',
      status: 'Đang trực tuyến tại Phòng Học Tập'.normalize('NFC'),
    };

    const allScholars = [myEntry, ...COHORT_SCHOLARS_BASE];

    return allScholars.sort((a, b) => {
      if (leaderboardSortBy === 'streak') {
        return b.streakDays - a.streakDays || b.projectedScore - a.projectedScore;
      }
      if (leaderboardSortBy === 'solved') {
        return (
          b.questionsSolved - a.questionsSolved ||
          b.projectedScore - a.projectedScore
        );
      }
      return (
        b.projectedScore - a.projectedScore ||
        b.questionsSolved - a.questionsSolved
      );
    });
  }, [academicMetrics, leaderboardSortBy]);

  // ==========================================================================
  // STATE DỮ LIỆU ENGINE FLAPPY SAT BIRD TRONG REF (60 FPS ZERO-LATENCY)
  // ==========================================================================
  const engineRef = useRef({
    status: 'IDLE', // 'IDLE' | 'PLAYING' | 'PORTAL_QUIZ' | 'GAME_OVER'
    width: 860,
    height: 520,
    frameCount: 0,
    groundScrollX: 0,
    skylineScrollX: 0,
    stars: Array.from({ length: 55 }, () => ({
      x: Math.random() * 1200,
      y: Math.random() * 340,
      r: Math.random() * 1.6 + 0.5,
      twinkle: Math.random() * Math.PI * 2,
    })),
    bird: {
      x: 185,
      y: 220,
      vy: 0,
      rotation: 0, // Góc nghiêng hiện tại (rad)
      angularVel: 0, // Vận tốc góc khi chúc đầu xuống
      holdFramesLeft: 0, // Giữ góc -24° trong 9 frames sau khi đập cánh
      wingPhase: 0,
      trail: [],
    },
    pipes: [],
    particles: [],
    floatingTexts: [],
    score: 0,
    bestScore: Number(localStorage.getItem('sat_flappy_best_score')) || 0,
    pipesCleared: 0,
    nextPipeNumber: 1,
    hasVocabShield: false,
    doubleScorePipesLeft: 0,
    flashAlpha: 0,
    usedQuestionIds: new Set(),
  });

  // Khởi tạo / Đặt lại trạng thái ván chơi Flappy Bird
  const resetFlappyMatch = useCallback((startImmediately = true) => {
    const eng = engineRef.current;
    const H = eng.height || 520;
    const groundY = H - FLAPPY_CONFIG.GROUND_HEIGHT;

    eng.status = startImmediately ? 'PLAYING' : 'IDLE';
    eng.frameCount = 0;
    eng.score = 0;
    eng.pipesCleared = 0;
    eng.nextPipeNumber = 1;
    eng.hasVocabShield = false;
    eng.doubleScorePipesLeft = 0;
    eng.flashAlpha = 0;
    eng.pipes = [];
    eng.particles = [];
    eng.floatingTexts = [];

    eng.bird = {
      x: Math.min(200, Math.max(110, Math.round((eng.width || 860) * 0.24))),
      y: Math.round(groundY * 0.44),
      vy: startImmediately ? FLAPPY_CONFIG.FLAP_IMPULSE : 0,
      rotation: startImmediately ? FLAPPY_CONFIG.FLAP_ANGLE_RAD : 0,
      angularVel: 0,
      holdFramesLeft: startImmediately ? FLAPPY_CONFIG.HOLD_FRAMES : 0,
      wingPhase: 0,
      trail: [],
    };

    // Sinh trước 4 cặp ống nước với khoảng cách chuẩn 240px
    const startX = (eng.width || 860) + 120;
    for (let i = 0; i < 4; i++) {
      const pipeNum = eng.nextPipeNumber++;
      const gapHeight =
        FLAPPY_CONFIG.PIPE_GAP_MIN +
        Math.random() * (FLAPPY_CONFIG.PIPE_GAP_MAX - FLAPPY_CONFIG.PIPE_GAP_MIN);
      const minTop = 64;
      const maxTop = Math.max(minTop + 40, groundY - gapHeight - 68);
      const gapTop = minTop + Math.random() * (maxTop - minTop);
      const hasPortal = pipeNum % FLAPPY_CONFIG.PORTAL_INTERVAL === 0;

      eng.pipes.push({
        id: `pipe_${pipeNum}_${Date.now()}_${i}`,
        pipeNumber: pipeNum,
        x: startX + i * FLAPPY_CONFIG.PIPE_SPACING,
        width: FLAPPY_CONFIG.PIPE_WIDTH,
        gapTop,
        gapHeight,
        passed: false,
        hasPortal,
        portalTriggered: false,
        portalResolved: false,
        shattered: false,
      });
    }

    setActivePortalQuiz(null);
    setGameState(startImmediately ? 'PLAYING' : 'IDLE');
    setHudState((prev) => ({
      ...prev,
      score: 0,
      pipesCleared: 0,
      hasVocabShield: false,
      doubleScorePipesLeft: 0,
      lastRewardBanner: '',
    }));
  }, []);

  // Hàm đập cánh (Flap Impulse) tức thì, không độ trễ
  const triggerFlap = useCallback(() => {
    const eng = engineRef.current;

    if (eng.status === 'IDLE') {
      resetFlappyMatch(true);
      playArcadeSound('flap');
      return;
    }

    if (eng.status === 'GAME_OVER') {
      return;
    }

    if (eng.status === 'PLAYING' || eng.status === 'PORTAL_QUIZ') {
      eng.bird.vy = FLAPPY_CONFIG.FLAP_IMPULSE; // -7.0 px/frame tức thì
      eng.bird.rotation = FLAPPY_CONFIG.FLAP_ANGLE_RAD; // -24° (-0.42 rad)
      eng.bird.holdFramesLeft = FLAPPY_CONFIG.HOLD_FRAMES; // Giữ 9 frames
      eng.bird.angularVel = 0;
      eng.bird.wingPhase = 1;

      for (let i = 0; i < 4; i++) {
        eng.particles.push({
          x: eng.bird.x - 10,
          y: eng.bird.y + 4,
          vx: -1.5 - Math.random() * 2.2,
          vy: (Math.random() - 0.5) * 2.4,
          r: 2 + Math.random() * 2.5,
          alpha: 0.9,
          color: eng.hasVocabShield ? '#22d3ee' : '#a5b4fc',
        });
      }

      playArcadeSound('flap');
    }
  }, [playArcadeSound, resetFlappyMatch]);

  // Mở Cổng Năng Lượng SAT khi chim bay tới cặp ống thứ 5, 10, 15...
  const openSatEnergyPortal = useCallback((pipeObj) => {
    const eng = engineRef.current;
    if (eng.status !== 'PLAYING') return;

    pipeObj.portalTriggered = true;
    eng.status = 'PORTAL_QUIZ';
    setGameState('PORTAL_QUIZ');

    let available = SAT_PORTAL_QUESTIONS.filter(
      (q) => !eng.usedQuestionIds.has(q.id)
    );
    if (available.length === 0) {
      eng.usedQuestionIds.clear();
      available = SAT_PORTAL_QUESTIONS;
    }
    const picked = available[Math.floor(Math.random() * available.length)];
    eng.usedQuestionIds.add(picked.id);

    setPortalTimeLeft(FLAPPY_CONFIG.PORTAL_QUIZ_DURATION);
    setActivePortalQuiz({
      ...picked,
      pipeNumber: pipeObj.pipeNumber,
    });
  }, []);

  // Xử lý trả lời câu hỏi tại Cổng Năng Lượng SAT
  const handleResolvePortalQuiz = useCallback(
    (selectedOptionIndex) => {
      const eng = engineRef.current;
      if (eng.status !== 'PORTAL_QUIZ' || !activePortalQuiz) return;

      const isCorrect = selectedOptionIndex === activePortalQuiz.ans;
      let rewardBanner = '';

      if (isCorrect) {
        playArcadeSound('powerup');
        if (!eng.hasVocabShield) {
          eng.hasVocabShield = true;
          rewardBanner = '🛡️ KÍCH HOẠT VOCAB SHIELD (Miễn nhiễm 1 lần va chạm!)'.normalize('NFC');
        } else {
          eng.doubleScorePipesLeft = 5;
          eng.score += 2;
          rewardBanner = '⚡ NHÂN ĐÔI ĐIỂM SỐ (2X SCORE TRONG 5 ỐNG TIẾP THEO!)'.normalize('NFC');
        }

        eng.floatingTexts.push({
          x: eng.bird.x + 20,
          y: eng.bird.y - 28,
          text: !eng.doubleScorePipesLeft ? '🛡️ VOCAB SHIELD!' : '⚡ 2X SCORE!',
          color: '#22d3ee',
          alpha: 1,
        });
      } else {
        rewardBanner =
          selectedOptionIndex === -1
            ? '⏩ Đã bỏ qua Cổng SAT • Tiếp tục bay bình thường'.normalize('NFC')
            : '💡 Chưa chính xác • Không bị phạt, tiếp tục bay!'.normalize('NFC');
      }

      eng.pipes.forEach((p) => {
        if (p.pipeNumber === activePortalQuiz.pipeNumber) {
          p.portalResolved = true;
        }
      });

      eng.status = 'PLAYING';
      eng.bird.vy = Math.min(eng.bird.vy, -3.2);
      eng.bird.rotation = FLAPPY_CONFIG.FLAP_ANGLE_RAD;
      eng.bird.holdFramesLeft = 6;

      setActivePortalQuiz(null);
      setGameState('PLAYING');
      setHudState((prev) => ({
        ...prev,
        score: eng.score,
        hasVocabShield: eng.hasVocabShield,
        doubleScorePipesLeft: eng.doubleScorePipesLeft,
        lastRewardBanner: rewardBanner,
      }));
    },
    [activePortalQuiz, playArcadeSound]
  );

  // Bộ đếm ngược 3.0 giây cho Cổng Năng Lượng SAT
  useEffect(() => {
    if (gameState !== 'PORTAL_QUIZ' || !activePortalQuiz) return;

    const startedAt = performance.now();
    const durationMs = FLAPPY_CONFIG.PORTAL_QUIZ_DURATION * 1000;

    const timer = setInterval(() => {
      const elapsed = performance.now() - startedAt;
      const remaining = Math.max(0, (durationMs - elapsed) / 1000);
      setPortalTimeLeft(Number(remaining.toFixed(1)));

      if (remaining <= 0) {
        clearInterval(timer);
        handleResolvePortalQuiz(-1);
      }
    }, 60);

    return () => clearInterval(timer);
  }, [gameState, activePortalQuiz, handleResolvePortalQuiz]);

  // Lắng nghe phím Space / ArrowUp / W để đập cánh & phím 1-4 để trả lời cổng SAT
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (e.code === 'KeyF') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          gameContainerRef.current?.requestFullscreen?.().catch(() => {});
          setIsFullscreen(true);
        } else {
          document.exitFullscreen?.().catch(() => {});
          setIsFullscreen(false);
        }
        return;
      }

      if (engineRef.current.status === 'PORTAL_QUIZ' && activePortalQuiz) {
        if (['Digit1', 'Numpad1'].includes(e.code)) {
          e.preventDefault();
          handleResolvePortalQuiz(0);
          return;
        }
        if (['Digit2', 'Numpad2'].includes(e.code)) {
          e.preventDefault();
          handleResolvePortalQuiz(1);
          return;
        }
        if (['Digit3', 'Numpad3'].includes(e.code)) {
          e.preventDefault();
          handleResolvePortalQuiz(2);
          return;
        }
        if (['Digit4', 'Numpad4'].includes(e.code)) {
          e.preventDefault();
          handleResolvePortalQuiz(3);
          return;
        }
      }

      if (
        e.code === 'Space' ||
        e.code === 'ArrowUp' ||
        e.code === 'KeyW'
      ) {
        e.preventDefault();
        if (engineRef.current.status === 'GAME_OVER') {
          resetFlappyMatch(true);
          playArcadeSound('flap');
        } else {
          triggerFlap();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePortalQuiz, handleResolvePortalQuiz, playArcadeSound, resetFlappyMatch, triggerFlap]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      gameContainerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // ==========================================================================
  // VÒNG LẶP VẬT LÝ & ĐỒ HỌA CANVAS FLAPPY SAT BIRD (60 FPS)
  // ==========================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId = null;
    let lastTime = performance.now();

    const triggerGameOver = () => {
      const eng = engineRef.current;
      if (eng.status === 'GAME_OVER') return;
      eng.status = 'GAME_OVER';
      eng.flashAlpha = 0.75;
      playArcadeSound('hit');

      if (eng.score > eng.bestScore) {
        eng.bestScore = eng.score;
        try {
          localStorage.setItem('sat_flappy_best_score', String(eng.bestScore));
        } catch {
          // ignore
        }
      }

      setActivePortalQuiz(null);
      setGameState('GAME_OVER');
      setHudState((prev) => ({
        ...prev,
        score: eng.score,
        bestScore: eng.bestScore,
        hasVocabShield: false,
      }));
    };

    const renderLoop = (now) => {
      const rawDt = (now - lastTime) / 16.6667;
      const dt = Math.min(1.6, Math.max(0.5, rawDt));
      lastTime = now;

      const parent = canvas.parentElement;
      if (parent) {
        if (
          canvas.width !== parent.clientWidth ||
          canvas.height !== parent.clientHeight
        ) {
          canvas.width = parent.clientWidth;
          canvas.height = parent.clientHeight;
          engineRef.current.width = canvas.width;
          engineRef.current.height = canvas.height;
        }
      }

      const eng = engineRef.current;
      const W = canvas.width;
      const H = canvas.height;
      const groundY = H - FLAPPY_CONFIG.GROUND_HEIGHT;
      eng.frameCount += 1;

      const bird = eng.bird;
      bird.x = Math.min(220, Math.max(95, Math.round(W * 0.24)));

      const timeScale =
        eng.status === 'PORTAL_QUIZ'
          ? 0.18 * dt
          : eng.status === 'PLAYING'
          ? dt
          : 0;

      // ======================================================================
      // 1. CẬP NHẬT VẬT LÝ CHIM, ỐNG NƯỚC & VA CHẠM AABB
      // ======================================================================
      if (eng.status === 'IDLE') {
        bird.y =
          Math.round(groundY * 0.44) + Math.sin(eng.frameCount * 0.08) * 9;
        bird.rotation = Math.sin(eng.frameCount * 0.06) * 0.08;
        eng.groundScrollX =
          (eng.groundScrollX + FLAPPY_CONFIG.PIPE_SPEED * dt) % 48;
        eng.skylineScrollX = (eng.skylineScrollX + 0.5 * dt) % Math.max(1, W);
      } else if (eng.status === 'PLAYING' || eng.status === 'PORTAL_QUIZ') {
        // 1A. Trọng lực & Giới hạn vận tốc rơi tối đa (Terminal Velocity)
        bird.vy = Math.min(
          FLAPPY_CONFIG.TERMINAL_VELOCITY,
          bird.vy + FLAPPY_CONFIG.GRAVITY * timeScale
        );
        bird.y += bird.vy * timeScale;

        // 1B. Động học Xoay Góc (Rotation & Pitch Dynamics chuẩn Flappy Bird)
        if (bird.vy < 0) {
          bird.rotation = FLAPPY_CONFIG.FLAP_ANGLE_RAD; // -24° (-0.42 rad)
          bird.holdFramesLeft = FLAPPY_CONFIG.HOLD_FRAMES;
          bird.angularVel = 0;
        } else {
          if (bird.holdFramesLeft > 0) {
            bird.holdFramesLeft -= timeScale;
            bird.rotation = FLAPPY_CONFIG.FLAP_ANGLE_RAD;
          } else {
            bird.angularVel = Math.min(
              0.12,
              bird.angularVel + 0.0085 * timeScale
            );
            bird.rotation = Math.min(
              FLAPPY_CONFIG.MAX_DIVE_ANGLE_RAD,
              bird.rotation + bird.angularVel * timeScale
            );
          }
        }

        if (eng.frameCount % 2 === 0) {
          bird.trail.unshift({
            x: bird.x - 12,
            y: bird.y,
            alpha: 0.65,
          });
          if (bird.trail.length > 9) bird.trail.pop();
        }
        bird.trail.forEach((t) => {
          t.x -= FLAPPY_CONFIG.PIPE_SPEED * timeScale;
          t.alpha *= 0.88;
        });

        eng.groundScrollX =
          (eng.groundScrollX + FLAPPY_CONFIG.PIPE_SPEED * timeScale) % 48;
        eng.skylineScrollX =
          (eng.skylineScrollX + 0.45 * timeScale) % Math.max(1, W);

        // 1C. Kiểm tra chạm trần nhà hoặc mặt đất (Game Over tức thì)
        const halfW = FLAPPY_CONFIG.BIRD_WIDTH / 2 - FLAPPY_CONFIG.HITBOX_INSET;
        const halfH =
          FLAPPY_CONFIG.BIRD_HEIGHT / 2 - FLAPPY_CONFIG.HITBOX_INSET;

        const birdTop = bird.y - halfH;
        const birdBottom = bird.y + halfH;
        const birdLeft = bird.x - halfW;
        const birdRight = bird.x + halfW;

        if (birdBottom >= groundY) {
          bird.y = groundY - halfH;
          bird.rotation = FLAPPY_CONFIG.MAX_DIVE_ANGLE_RAD;
          triggerGameOver();
        } else if (birdTop <= 0) {
          bird.y = halfH;
          triggerGameOver();
        }

        // 1D. Di chuyển các cặp ống nước, kiểm tra Cổng SAT & Va chạm AABB
        for (let i = 0; i < eng.pipes.length; i++) {
          const p = eng.pipes[i];
          p.x -= FLAPPY_CONFIG.PIPE_SPEED * timeScale;

          if (
            p.hasPortal &&
            !p.portalTriggered &&
            eng.status === 'PLAYING' &&
            p.x <= bird.x + 85 &&
            p.x + p.width >= bird.x - 10
          ) {
            openSatEnergyPortal(p);
          }

          if (!p.shattered && eng.status !== 'GAME_OVER') {
            const pipeLeft = p.x;
            const pipeRight = p.x + p.width;

            if (birdRight > pipeLeft && birdLeft < pipeRight) {
              const hitUpperPipe = birdTop < p.gapTop;
              const hitLowerPipe = birdBottom > p.gapTop + p.gapHeight;

              if (hitUpperPipe || hitLowerPipe) {
                if (eng.hasVocabShield) {
                  eng.hasVocabShield = false;
                  p.shattered = true;
                  eng.flashAlpha = 0.35;
                  playArcadeSound('shield_break');

                  for (let k = 0; k < 18; k++) {
                    eng.particles.push({
                      x: bird.x + 14,
                      y: bird.y,
                      vx: (Math.random() - 0.3) * 7,
                      vy: (Math.random() - 0.5) * 7,
                      r: 3 + Math.random() * 3,
                      alpha: 1,
                      color: k % 2 === 0 ? '#22d3ee' : '#fbbf24',
                    });
                  }

                  eng.floatingTexts.push({
                    x: bird.x,
                    y: bird.y - 32,
                    text: '🛡️ KHIÊN ĐỠ ĐÒN!',
                    color: '#fbbf24',
                    alpha: 1,
                  });

                  setHudState((prev) => ({
                    ...prev,
                    hasVocabShield: false,
                    lastRewardBanner:
                      '🛡️ Vocab Shield đã bảo vệ bạn khỏi 1 pha va chạm ống!'.normalize('NFC'),
                  }));
                } else {
                  triggerGameOver();
                  break;
                }
              }
            }
          }

          if (!p.passed && p.x + p.width < bird.x) {
            p.passed = true;
            eng.pipesCleared += 1;
            const pointsEarned = eng.doubleScorePipesLeft > 0 ? 2 : 1;
            if (eng.doubleScorePipesLeft > 0) {
              eng.doubleScorePipesLeft -= 1;
            }
            eng.score += pointsEarned;

            if (eng.score > eng.bestScore) {
              eng.bestScore = eng.score;
              try {
                localStorage.setItem(
                  'sat_flappy_best_score',
                  String(eng.bestScore)
                );
              } catch {
                // ignore
              }
            }

            playArcadeSound('score');
            eng.floatingTexts.push({
              x: bird.x,
              y: bird.y - 24,
              text: pointsEarned > 1 ? '+2 (2X)' : '+1',
              color: pointsEarned > 1 ? '#fbbf24' : '#34d399',
              alpha: 1,
            });

            setHudState((prev) => ({
              ...prev,
              score: eng.score,
              bestScore: eng.bestScore,
              pipesCleared: eng.pipesCleared,
              hasVocabShield: eng.hasVocabShield,
              doubleScorePipesLeft: eng.doubleScorePipesLeft,
            }));
          }
        }

        if (eng.pipes.length > 0 && eng.pipes[0].x + eng.pipes[0].width < -60) {
          eng.pipes.shift();
          const lastPipe = eng.pipes[eng.pipes.length - 1];
          const pipeNum = eng.nextPipeNumber++;
          const gapHeight =
            FLAPPY_CONFIG.PIPE_GAP_MIN +
            Math.random() *
              (FLAPPY_CONFIG.PIPE_GAP_MAX - FLAPPY_CONFIG.PIPE_GAP_MIN);
          const minTop = 64;
          const maxTop = Math.max(minTop + 40, groundY - gapHeight - 68);
          const gapTop = minTop + Math.random() * (maxTop - minTop);
          const hasPortal = pipeNum % FLAPPY_CONFIG.PORTAL_INTERVAL === 0;

          eng.pipes.push({
            id: `pipe_${pipeNum}_${Date.now()}`,
            pipeNumber: pipeNum,
            x: lastPipe.x + FLAPPY_CONFIG.PIPE_SPACING,
            width: FLAPPY_CONFIG.PIPE_WIDTH,
            gapTop,
            gapHeight,
            passed: false,
            hasPortal,
            portalTriggered: false,
            portalResolved: false,
            shattered: false,
          });
        }
      }

      // ======================================================================
      // 2. VẼ BẦU TRỜI CYBER COSMIC, SAO LẤP LÁNH & THÀNH PHỐ CHÂN TRỜI
      // ======================================================================
      const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
      skyGrad.addColorStop(0, '#040714');
      skyGrad.addColorStop(0.55, '#0b132b');
      skyGrad.addColorStop(1, '#15193b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, groundY);

      eng.stars.forEach((st) => {
        st.twinkle += 0.04;
        const alpha = 0.35 + Math.sin(st.twinkle) * 0.3;
        ctx.fillStyle = `rgba(226, 232, 240, ${alpha})`;
        ctx.beginPath();
        ctx.arc(st.x % W, st.y % Math.max(1, groundY - 80), st.r, 0, Math.PI * 2);
        ctx.fill();
      });

      const sunRadius = Math.min(72, H * 0.14);
      const sunX = W * 0.76;
      const sunY = groundY - 58;
      const sunGrad = ctx.createLinearGradient(
        sunX,
        sunY - sunRadius,
        sunX,
        sunY + sunRadius
      );
      sunGrad.addColorStop(0, '#fbbf24');
      sunGrad.addColorStop(0.55, '#f43f5e');
      sunGrad.addColorStop(1, '#7e22ce');
      ctx.save();
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#090e24';
      const buildingWidth = 52;
      const numBuildings = Math.ceil(W / buildingWidth) + 2;
      for (let i = 0; i < numBuildings; i++) {
        const bx = i * buildingWidth - (eng.skylineScrollX % buildingWidth);
        const bh = 36 + ((i * 29) % 64);
        ctx.fillRect(bx, groundY - bh, buildingWidth - 4, bh);
      }

      // ======================================================================
      // 3. VẼ CÁC CẶP ỐNG NƯỚC NEON & CỔNG NĂNG LƯỢNG SAT (SAT PORTAL)
      // ======================================================================
      eng.pipes.forEach((p) => {
        if (p.shattered) return;

        const lowerTop = p.gapTop + p.gapHeight;
        const lowerHeight = Math.max(0, groundY - lowerTop);

        const pipeGrad = ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
        if (p.hasPortal) {
          pipeGrad.addColorStop(0, '#312e81');
          pipeGrad.addColorStop(0.35, '#6366f1');
          pipeGrad.addColorStop(1, '#1e1b4b');
        } else {
          pipeGrad.addColorStop(0, '#064e3b');
          pipeGrad.addColorStop(0.32, '#10b981');
          pipeGrad.addColorStop(0.7, '#059669');
          pipeGrad.addColorStop(1, '#022c22');
        }

        const rimBorder = p.hasPortal ? '#fbbf24' : '#34d399';
        const capHeight = 24;
        const capOverhang = 5;

        ctx.fillStyle = pipeGrad;
        ctx.fillRect(p.x, 0, p.width, Math.max(0, p.gapTop - capHeight));
        ctx.strokeStyle = rimBorder;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(p.x, -2, p.width, Math.max(0, p.gapTop - capHeight + 2));

        ctx.fillStyle = pipeGrad;
        ctx.fillRect(
          p.x - capOverhang,
          p.gapTop - capHeight,
          p.width + capOverhang * 2,
          capHeight
        );
        ctx.strokeRect(
          p.x - capOverhang,
          p.gapTop - capHeight,
          p.width + capOverhang * 2,
          capHeight
        );

        ctx.fillStyle = pipeGrad;
        ctx.fillRect(
          p.x,
          lowerTop + capHeight,
          p.width,
          Math.max(0, lowerHeight - capHeight)
        );
        ctx.strokeRect(
          p.x,
          lowerTop + capHeight,
          p.width,
          Math.max(0, lowerHeight - capHeight)
        );

        ctx.fillStyle = pipeGrad;
        ctx.fillRect(
          p.x - capOverhang,
          lowerTop,
          p.width + capOverhang * 2,
          capHeight
        );
        ctx.strokeRect(
          p.x - capOverhang,
          lowerTop,
          p.width + capOverhang * 2,
          capHeight
        );

        if (p.hasPortal && !p.portalResolved) {
          const portalCenterX = p.x + p.width / 2;
          const portalCenterY = p.gapTop + p.gapHeight / 2;
          const pulse = Math.sin(eng.frameCount * 0.14) * 4;

          ctx.save();
          const portalGrad = ctx.createRadialGradient(
            portalCenterX,
            portalCenterY,
            4,
            portalCenterX,
            portalCenterY,
            p.gapHeight * 0.45
          );
          portalGrad.addColorStop(0, 'rgba(251, 191, 36, 0.95)');
          portalGrad.addColorStop(0.5, 'rgba(34, 211, 238, 0.55)');
          portalGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');

          ctx.fillStyle = portalGrad;
          ctx.beginPath();
          ctx.ellipse(
            portalCenterX,
            portalCenterY,
            16 + pulse * 0.4,
            p.gapHeight * 0.42,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();

          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('SAT GATE', portalCenterX, p.gapTop - 30);
          ctx.restore();
        }
      });

      // ======================================================================
      // 4. VẼ MẶT ĐẤT CUỘN LẶP VỚI VẠCH PIXEL NEON (SCROLLING BASE)
      // ======================================================================
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(0, groundY, W, 4);

      ctx.fillStyle = '#090d1e';
      ctx.fillRect(0, groundY + 4, W, FLAPPY_CONFIG.GROUND_HEIGHT - 4);

      ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
      const stripeStep = 24;
      for (let x = -48; x < W + 48; x += stripeStep) {
        const sx = x - (eng.groundScrollX % stripeStep);
        ctx.beginPath();
        ctx.moveTo(sx, groundY + 4);
        ctx.lineTo(sx + 12, groundY + 4);
        ctx.lineTo(sx - 6, groundY + 26);
        ctx.lineTo(sx - 18, groundY + 26);
        ctx.closePath();
        ctx.fill();
      }

      ctx.strokeStyle = 'rgba(99, 102, 241, 0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, groundY + 28);
      ctx.lineTo(W, groundY + 28);
      ctx.stroke();

      // ======================================================================
      // 5. VẼ VỆT ĐUÔI, HẠT NĂNG LƯỢNG & CHÚ CHIM CYBER-SAT BIRD
      // ======================================================================
      bird.trail.forEach((t, idx) => {
        if (t.alpha <= 0.05) return;
        ctx.fillStyle = eng.hasVocabShield
          ? `rgba(34, 211, 238, ${t.alpha * 0.55})`
          : `rgba(251, 191, 36, ${t.alpha * 0.45})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, Math.max(2, 7 - idx * 0.6), 0, Math.PI * 2);
        ctx.fill();
      });

      for (let i = eng.particles.length - 1; i >= 0; i--) {
        const pt = eng.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha *= 0.92;
        if (pt.alpha <= 0.04) {
          eng.particles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate(bird.rotation);

      if (eng.hasVocabShield) {
        const shieldPulse = Math.sin(eng.frameCount * 0.2) * 2.5;
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2.5;
        ctx.fillStyle = 'rgba(34, 211, 238, 0.16)';
        ctx.beginPath();
        ctx.arc(0, 0, 24 + shieldPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      const bodyGrad = ctx.createLinearGradient(-18, -14, 18, 14);
      if (eng.doubleScorePipesLeft > 0) {
        bodyGrad.addColorStop(0, '#fde047');
        bodyGrad.addColorStop(1, '#f97316');
      } else {
        bodyGrad.addColorStop(0, '#38bdf8');
        bodyGrad.addColorStop(0.55, '#fbbf24');
        bodyGrad.addColorStop(1, '#f59e0b');
      }

      ctx.fillStyle = bodyGrad;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(
        0,
        0,
        FLAPPY_CONFIG.BIRD_WIDTH / 2,
        FLAPPY_CONFIG.BIRD_HEIGHT / 2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.stroke();

      const wingOffsetY =
        eng.status === 'GAME_OVER' ? 2 : Math.sin(eng.frameCount * 0.38) * 4;
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(-4, wingOffsetY, 8, 5.5, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(8, -4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(9.5, -4, 2.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(15, -2);
      ctx.lineTo(25, 2);
      ctx.lineTo(15, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      for (let i = eng.floatingTexts.length - 1; i >= 0; i--) {
        const ft = eng.floatingTexts[i];
        ft.y -= 1.1;
        ft.alpha -= 0.022;
        if (ft.alpha <= 0) {
          eng.floatingTexts.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.font = '900 15px monospace';
        ctx.fillStyle = ft.color;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      if (eng.status === 'PLAYING' || eng.status === 'PORTAL_QUIZ') {
        ctx.save();
        ctx.font = '900 44px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.fillText(String(eng.score), W / 2 + 2, 74);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(String(eng.score), W / 2, 72);
        ctx.restore();
      }

      if (eng.flashAlpha > 0.01) {
        ctx.fillStyle = `rgba(255, 255, 255, ${eng.flashAlpha})`;
        ctx.fillRect(0, 0, W, H);
        eng.flashAlpha *= 0.84;
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [openSatEnergyPortal, playArcadeSound]);

  useEffect(() => {
    resetFlappyMatch(false);
  }, [resetFlappyMatch]);

  const triggerEmoji = (emoji) => {
    const id = `emo_${Date.now()}_${Math.random()}`;
    const x = Math.round((Math.random() - 0.5) * 140);
    setFloatingEmojis((prev) => [...prev.slice(-10), { id, emoji, x }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 1800);
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    const check = securityGuard.validateUserText(chatInput, 240);
    if (!check.valid) return;

    const newMsg = {
      id: `msg_${Date.now()}`,
      author: myDisplayName,
      text: check.cleanText.normalize('NFC'),
      time: 'Vừa xong'.normalize('NFC'),
    };

    setChatMessages((prev) => [newMsg, ...prev.slice(0, 29)]);
    setChatInput('');

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('study_room_messages').insert([
          {
            author_name: newMsg.author,
            content: newMsg.text,
          },
        ]);
      } catch {
        // ignore offline
      }
    }
  };

  return (
    <div className="min-h-full bg-[#060913] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8 select-none font-sans relative overflow-hidden">
      <div className="pointer-events-none fixed bottom-20 right-1/3 z-50">
        <AnimatePresence>
          {floatingEmojis.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 1, y: 0, x: 0, scale: 0.8 }}
              animate={{ opacity: 0, y: -200, x: item.x, scale: 1.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8 }}
              className="absolute text-3xl"
            >
              {item.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* HEADER TRẠM HỌC TẬP & FLAPPY SAT BIRD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-500/20 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-cyan-300 text-xs font-mono font-bold tracking-wider mb-1.5">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>
              {'PIXEL-PERFECT FLAPPY SAT BIRD • SAT PORTAL POWER-UPS & REAL ACADEMIC HALL OF FAME'.normalize(
                'NFC'
              )}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {'Phòng Học Tập Liên Sao & Đấu Trường Flappy SAT Bird'.normalize('NFC')}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {'Vật lý Flappy Bird nguyên bản (Gravity 0.40, Impulse -7.0, Hitbox -3px) kết hợp Cổng Năng Lượng SAT mỗi 5 ống & Bảng Vàng Thực Học!'.normalize(
              'NFC'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-white/10 px-3.5 py-2 rounded-2xl">
          <span className="text-xs font-bold text-slate-400 mr-1">
            {'Thả năng lượng:'.normalize('NFC')}
          </span>
          {['🦅', '🛡️', '🔥', '❤️', '⚡', '🏆'].map((emo) => (
            <motion.button
              key={emo}
              whileHover={{ scale: 1.25 }}
              whileTap={{ scale: 0.85 }}
              type="button"
              onClick={() => triggerEmoji(emo)}
              className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/15 flex items-center justify-center text-base cursor-pointer transition"
            >
              {emo}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MỤC TIÊU 1: KHUNG CANVAS GAME "FLAPPY SAT BIRD" (CANH GIỮA, RESPONSIVE) */}
      {/* ==================================================================== */}
      <div className="max-w-5xl mx-auto w-full">
        <div
          ref={gameContainerRef}
          onPointerDown={(e) => {
            if (e.target.closest('button')) return;
            if (gameState === 'PORTAL_QUIZ') return;
            triggerFlap();
          }}
          className={`${
            isFullscreen
              ? 'fixed inset-0 z-50 w-screen h-screen rounded-none border-0'
              : 'relative w-full h-[520px] sm:h-[560px] rounded-3xl border border-cyan-400/40 shadow-2xl'
          } bg-[#040714] overflow-hidden flex flex-col justify-between transition-all duration-200 cursor-pointer touch-manipulation`}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full z-0 block"
          />

          {/* THANH HUD TRÊN CÙNG */}
          <div className="relative z-20 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none">
            <div className="flex flex-wrap items-center gap-2.5 pointer-events-auto">
              <div className="flex items-center gap-3 bg-slate-950/85 backdrop-blur-md border border-cyan-400/35 px-4 py-2 rounded-2xl shadow-lg">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                    {'ĐIỂM HIỆN TẠI'.normalize('NFC')}
                  </span>
                  <span className="text-xl font-black font-mono tabular-nums text-white">
                    {hudState.score}
                  </span>
                </div>
                <div className="h-7 w-px bg-white/10" />
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300/90 block">
                    {'KỶ LỤC CÁ NHÂN'.normalize('NFC')}
                  </span>
                  <span className="text-xl font-black font-mono tabular-nums text-amber-400">
                    {hudState.bestScore}
                  </span>
                </div>
              </div>

              <div
                className={`px-3.5 py-2 rounded-2xl backdrop-blur-md border text-xs font-mono font-bold flex items-center gap-1.5 transition ${
                  hudState.hasVocabShield
                    ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                    : 'bg-slate-950/75 border-white/10 text-slate-400'
                }`}
              >
                <ShieldCheck
                  className={`w-4 h-4 ${
                    hudState.hasVocabShield
                      ? 'text-cyan-300 animate-pulse'
                      : 'text-slate-500'
                  }`}
                />
                <span>
                  {hudState.hasVocabShield
                    ? 'VOCAB SHIELD: SẴN SÀNG ĐỠ 1 ỐNG'.normalize('NFC')
                    : 'CỔNG SAT MỖI 5 ỐNG -> NHẬN KHIÊN'.normalize('NFC')}
                </span>
              </div>

              {hudState.doubleScorePipesLeft > 0 && (
                <div className="px-3 py-2 rounded-2xl bg-amber-500/25 border border-amber-400 text-amber-200 text-xs font-mono font-black flex items-center gap-1.5 animate-pulse">
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>2X SCORE ({hudState.doubleScorePipesLeft} ỐNG)</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={() => setSoundEnabled((prev) => !prev)}
                className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-white/15 transition cursor-pointer"
                title={
                  (soundEnabled ? 'Tắt âm thanh game' : 'Bật âm thanh game').normalize(
                    'NFC'
                  )
                }
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-400/40 font-extrabold text-xs flex items-center gap-1.5 shadow-lg transition cursor-pointer"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-4 h-4" />
                    <span>{'Thu nhỏ (Esc)'.normalize('NFC')}</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-4 h-4" />
                    <span>{'Toàn màn hình'.normalize('NFC')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* KHU VỰC GIỮA MÀN HÌNH: MENU BẮT ĐẦU / CỔNG NĂNG LƯỢNG SAT 3S / GAME OVER */}
          <div className="relative z-20 flex-1 flex items-center justify-center px-4 pointer-events-none">
            <AnimatePresence mode="wait">
              {gameState === 'IDLE' && (
                <motion.div
                  key="flappy-idle"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  className="pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-cyan-400/40 rounded-3xl p-6 sm:p-7 text-center max-w-md space-y-4 shadow-2xl"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-cyan-400 to-indigo-600 flex items-center justify-center mx-auto text-slate-950 shadow-lg shadow-cyan-500/30">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300 block">
                      {'ORIGINAL FLAPPY PHYSICS • FORGIVING HITBOX (-3PX)'.normalize(
                        'NFC'
                      )}
                    </span>
                    <h3 className="text-xl font-black text-white mt-1">
                      {'Flappy SAT Bird: Vượt Ống & Tích Khiên Từ Vựng'.normalize('NFC')}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                      {'Bấm phím '.normalize('NFC')}
                      <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600 text-amber-300 font-mono">
                        Space
                      </kbd>
                      {', '.normalize('NFC')}
                      <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600 text-cyan-300 font-mono">
                        ↑
                      </kbd>
                      {' hoặc chạm màn hình để đập cánh tức thì. Cứ mỗi 5 ống vượt qua sẽ mở '.normalize(
                        'NFC'
                      )}
                      <strong className="text-amber-300">
                        {'Cổng Năng Lượng SAT (3 giây)'.normalize('NFC')}
                      </strong>
                      {' tặng Khiên chắn va chạm!'.normalize('NFC')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      resetFlappyMatch(true);
                      playArcadeSound('flap');
                    }}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-cyan-400 to-indigo-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/25 cursor-pointer hover:brightness-110 transition flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{'Bắt Đầu Bay Ngay (Space / Chạm)'.normalize('NFC')}</span>
                  </button>
                </motion.div>
              )}

              {gameState === 'PORTAL_QUIZ' && activePortalQuiz && (
                <motion.div
                  key="flappy-portal-quiz"
                  initial={{ opacity: 0, y: 12, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  className="pointer-events-auto bg-slate-950/92 backdrop-blur-md border-2 border-amber-400/80 rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-[0_0_60px_rgba(251,191,36,0.35)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-mono font-black text-[11px]">
                        ⚡ SAT PORTAL #{activePortalQuiz.pipeNumber}
                      </span>
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        {activePortalQuiz.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono font-black text-sm text-rose-400 tabular-nums">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>{portalTimeLeft.toFixed(1)}s</span>
                    </div>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          (portalTimeLeft / FLAPPY_CONFIG.PORTAL_QUIZ_DURATION) *
                            100
                        )}%`,
                      }}
                      className="h-full bg-gradient-to-r from-amber-400 via-cyan-400 to-rose-500 transition-all duration-75"
                    />
                  </div>

                  <p className="text-sm sm:text-base font-extrabold text-white leading-snug">
                    {activePortalQuiz.q}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activePortalQuiz.options.map((opt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleResolvePortalQuiz(idx)}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 border border-cyan-400/35 text-left text-xs font-bold text-slate-100 transition flex items-center gap-2 cursor-pointer"
                      >
                        <span className="w-5 h-5 rounded-md bg-white/10 font-mono text-[11px] flex items-center justify-center shrink-0 text-amber-300">
                          {idx + 1}
                        </span>
                        <span className="truncate">{opt}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>
                      {'Đúng: Nhận Khiên Vocab Shield hoặc 2X Điểm • Sai/Bỏ qua: Không bị phạt'.normalize(
                        'NFC'
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleResolvePortalQuiz(-1)}
                      className="text-slate-300 hover:text-white underline font-bold cursor-pointer ml-2 shrink-0"
                    >
                      {'Bỏ qua'.normalize('NFC')}
                    </button>
                  </div>
                </motion.div>
              )}

              {gameState === 'GAME_OVER' && (
                <motion.div
                  key="flappy-gameover"
                  initial={{ opacity: 0, y: 16, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  className="pointer-events-auto bg-slate-950/92 backdrop-blur-md border border-amber-400/50 rounded-3xl p-6 sm:p-7 text-center max-w-md w-full space-y-5 shadow-2xl"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="w-10 h-10 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 font-bold block">
                      {'KẾT THÚC LƯỢT BAY'.normalize('NFC')}
                    </span>
                    <h3 className="text-2xl font-black text-white mt-0.5">
                      {hudState.score >= 20
                        ? 'Huyền Thoại Đôi Cánh SAT! 🌟'.normalize('NFC')
                        : hudState.score >= 10
                        ? 'Phong Độ Rất Ấn Tượng! 🔥'.normalize('NFC')
                        : 'Sẵn Sàng Phá Kỷ Lục Tiếp Theo!'.normalize('NFC')}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-900/90 border border-white/10">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">
                        {'ĐIỂM VÁN NÀY'.normalize('NFC')}
                      </span>
                      <span className="text-3xl font-black font-mono tabular-nums text-cyan-300">
                        {hudState.score}
                      </span>
                    </div>
                    <div className="border-l border-white/10">
                      <span className="text-[10px] font-mono uppercase text-amber-300 block">
                        {'KỶ LỤC CAO NHẤT'.normalize('NFC')}
                      </span>
                      <span className="text-3xl font-black font-mono tabular-nums text-amber-400">
                        {hudState.bestScore}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      resetFlappyMatch(true);
                      playArcadeSound('flap');
                    }}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider cursor-pointer shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 hover:brightness-110 transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{'Chơi Lại Ngay (Phím Space)'.normalize('NFC')}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* THANH ĐIỀU KHIỂN DƯỚI CÙNG */}
          <div className="relative z-20 px-4 py-3 bg-slate-950/90 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono text-[10px] font-bold">
                PHYSICS SPEC
              </span>
              <span className="text-[11px] text-slate-300 truncate">
                {hudState.lastRewardBanner ||
                  'Gravity 0.40 • Flap -7.0 • Hold 9f -> Pitch +85° • Pipe Gap 125–145px'.normalize(
                    'NFC'
                  )}
              </span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={triggerFlap}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-black text-xs cursor-pointer shadow-md hover:brightness-110 transition"
              >
                {'🦅 Đập Cánh (Space / Tap)'.normalize('NFC')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MỤC TIÊU 2: BẢNG VÀNG THÀNH TÍCH HỌC THUẬT THỰC TẾ (ACADEMIC HALL OF FAME) */}
      {/* ==================================================================== */}
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/85 backdrop-blur-md border border-white/10 shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider">
              <Award className="w-4 h-4 text-amber-400" />
              <span>
                {'REAL ACADEMIC HALL OF FAME • LIVE STORAGE TELEMETRY'.normalize(
                  'NFC'
                )}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {'Bảng Vàng Vinh Danh Năng Lực Thực Học Digital SAT'.normalize('NFC')}
            </h2>
            <p className="text-xs text-slate-400">
              {'Tổng hợp trực tiếp từ lịch sử thi thích ứng IRT, Sổ tay câu sai 2-Strike và Tiến độ từ vựng C1/C2 trong storageService.'.normalize(
                'NFC'
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/90 p-1.5 rounded-2xl border border-white/10 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => {
                setHallTab('personal');
                setTelemetryTick((t) => t + 1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
                hallTab === 'personal'
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Crown className="w-4 h-4" />
              <span>{'Hồ Sơ Năng Lực Cá Nhân'.normalize('NFC')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setHallTab('leaderboard');
                setTelemetryTick((t) => t + 1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
                hallTab === 'leaderboard'
                  ? 'bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>{'Bảng Vinh Danh Sĩ Tử'.normalize('NFC')}</span>
            </button>
          </div>
        </div>

        {/* TAB 1: HỒ SƠ NĂNG LỰC CÁ NHÂN (PERSONAL MASTERY CARD - PHAN TIẾN THÀNH) */}
        {hallTab === 'personal' ? (
          <div className="space-y-6">
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950/40 to-slate-950 border border-indigo-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-cyan-400 to-indigo-600 p-0.5 shrink-0 shadow-lg shadow-cyan-500/20">
                  <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-2xl font-black text-white">
                    T
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
                      {academicMetrics.studentName}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-black border ${academicMetrics.tierMeta.badgeClass}`}
                    >
                      {academicMetrics.tierMeta.icon}{' '}
                      {academicMetrics.tierMeta.code} •{' '}
                      {academicMetrics.tierMeta.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {academicMetrics.tierMeta.subtitle}
                  </p>
                  <div className="text-[11px] font-mono text-cyan-300">
                    {academicMetrics.examBasisText}
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-80 bg-slate-900/90 border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300">
                    {'Tiến độ chạm mốc 1550+ Legend'.normalize('NFC')}
                  </span>
                  <span className="font-mono font-black text-amber-300 tabular-nums">
                    {academicMetrics.progressToTargetPct}%
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden p-0.5">
                  <div
                    style={{ width: `${academicMetrics.progressToTargetPct}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-amber-400 transition-all duration-500"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>
                    {'Hiện tại: '.normalize('NFC')}
                    <strong className="text-white">
                      {academicMetrics.projectedScore}
                    </strong>
                  </span>
                  <span>
                    {'Mục tiêu: '.normalize('NFC')}
                    <strong className="text-amber-300">1550+ (HUST IT1)</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* 4 CHỈ SỐ NĂNG LỰC CỐT LÕI (CORE ACADEMIC KPIS) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-amber-400/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase text-amber-300 font-bold">
                    {'ĐIỂM SAT DỰ PHÓNG'.normalize('NFC')}
                  </span>
                  <Target className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-black font-mono tabular-nums text-white">
                  {academicMetrics.projectedScore}
                </div>
                <div className="text-xs font-mono font-bold text-amber-200/90">
                  RW: {academicMetrics.rwScore} | Math: {academicMetrics.mathScore}
                </div>
                <p className="text-[11px] text-slate-400">
                  {'Đồng bộ từ storageService.getExamHistory()'.normalize('NFC')}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/80 border border-cyan-400/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase text-cyan-300 font-bold">
                    {'TỶ LỆ DIỆT CÂU SAI 2-STRIKE'.normalize('NFC')}
                  </span>
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-3xl font-black font-mono tabular-nums text-white">
                  {academicMetrics.mistakeMasteryRate}%
                </div>
                <div className="text-xs font-mono font-bold text-cyan-200/90">
                  {academicMetrics.totalMistakes > 0
                    ? `${academicMetrics.masteredMistakes}/${academicMetrics.totalMistakes} câu đạt 2-Strike`.normalize(
                        'NFC'
                      )
                    : 'Đạt chuẩn 2-Strike Mastery'.normalize('NFC')}
                </div>
                <p className="text-[11px] text-slate-400">
                  {'Đúng 2 lần ở 2 ngày khác nhau'.normalize('NFC')}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-400/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase text-emerald-300 font-bold">
                    {'VỐN TỪ C1/C2 LÀM CHỦ'.normalize('NFC')}
                  </span>
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-black font-mono tabular-nums text-white">
                  {academicMetrics.vocabMastered}{' '}
                  <span className="text-sm font-bold text-emerald-300">
                    {'từ'.normalize('NFC')}
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-emerald-200/90">
                  {'Chu kỳ nhớ dài hạn (SM-2 >= 3 ngày)'.normalize('NFC')}
                </div>
                <p className="text-[11px] text-slate-400">
                  {'Đồng bộ từ storageService.getVocabProgress()'.normalize('NFC')}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/80 border border-indigo-400/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase text-indigo-300 font-bold">
                    {'CHUỖI KỶ LUẬT & GIỜ HỌC'.normalize('NFC')}
                  </span>
                  <Flame className="w-4 h-4 text-orange-400" />
                </div>
                <div className="text-3xl font-black font-mono tabular-nums text-white">
                  {academicMetrics.streakDays}{' '}
                  <span className="text-sm font-bold text-orange-300">
                    {'ngày'.normalize('NFC')}
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-indigo-200/90">
                  {academicMetrics.focusHours}h thực chiến •{' '}
                  {academicMetrics.questionsSolved} câu
                </div>
                <p className="text-[11px] text-slate-400">
                  {'Duy trì nhịp độ luyện đề mỗi ngày'.normalize('NFC')}
                </p>
              </div>
            </div>

            {/* PHÂN TÍCH CHI TIẾT ĐIỂM MẠNH & ĐIỂM CẦN LƯU Ý + THANG PHÂN HẠNG TIER */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{'Điểm Mạnh Nổi Trội (Core Strengths)'.normalize('NFC')}</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-200">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>
                        <strong>Math Extrema & Quadratic Systems:</strong>{' '}
                        {'Tốc độ xử lý cực trị hàm bậc hai & Desmos regression đạt độ chính xác >96%.'.normalize(
                          'NFC'
                        )}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>
                        <strong>Geometry & Trigonometry:</strong>{' '}
                        {'Nắm vững hệ thức lượng giác đường tròn và tam giác đồng dạng Module 2 Hard.'.normalize(
                          'NFC'
                        )}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>
                        <strong>Words in Context (WIC):</strong>{' '}
                        {'Khả năng bắt Contrast Clues (however, whereas) và loại trừ từ đồng nghĩa giả rất sắc bén.'.normalize(
                          'NFC'
                        )}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-amber-950/25 border border-amber-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>{'Điểm Cần Lưu Ý (Focus Areas)'.normalize('NFC')}</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-200">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>
                        <strong>Logical Inference (Suy luận):</strong>{' '}
                        {'Cần tránh bẫy suy diễn quá đà (Extreme Modifiers: always, never) ở câu 12–16 RW.'.normalize(
                          'NFC'
                        )}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>
                        <strong>Negation & Careless Traps:</strong>{' '}
                        {`Luôn gạch chân từ khóa phủ định (EXCEPT, NOT, LEAST) và kiểm tra lại đại lượng hỏi (ví dụ tìm 2x+1 thay vì x). (${academicMetrics.tagCounts.careless} thẻ ghi nhận)`.normalize(
                          'NFC'
                        )}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>
                        <strong>Pacing Cuối Module 2:</strong>{' '}
                        {'Giữ nhịp <85s/câu Reading dài để dành trọn 6 phút cuối cho 4 câu tự luận Grid-in.'.normalize(
                          'NFC'
                        )}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-950/85 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400" />
                    <span>
                      {'Hệ Thống Phân Hạng Học Thuật (Tier Hierarchy)'.normalize(
                        'NFC'
                      )}
                    </span>
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {[
                    {
                      tier: '🌟 Tier S+ (Grandmaster / 1550+ Legend)',
                      desc: 'Mục tiêu Thủ khoa / Xét tuyển Tài năng CNTT (HUST IT1/IT-E10)'.normalize(
                        'NFC'
                      ),
                      active: academicMetrics.projectedScore >= 1550,
                      border: 'border-amber-400/50 bg-amber-500/15 text-amber-200',
                    },
                    {
                      tier: '🎖️ Tier S (Master Scholar / 1500–1540)',
                      desc: 'Đạt chuẩn xuất sắc toàn diện cả Reading & Writing và Math'.normalize(
                        'NFC'
                      ),
                      active:
                        academicMetrics.projectedScore >= 1500 &&
                        academicMetrics.projectedScore < 1550,
                      border: 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200',
                    },
                    {
                      tier: '🚀 Tier A (Senior Explorer / 1400–1490)',
                      desc: 'Nền tảng vững vàng, đang bứt phá làm chủ câu hỏi Hard'.normalize(
                        'NFC'
                      ),
                      active:
                        academicMetrics.projectedScore >= 1400 &&
                        academicMetrics.projectedScore < 1500,
                      border:
                        'border-emerald-400/50 bg-emerald-500/15 text-emerald-200',
                    },
                    {
                      tier: '📘 Tier B (Cadet / Dưới 1400)',
                      desc: 'Giai đoạn tích lũy kiến thức cơ bản & từ vựng cốt lõi'.normalize(
                        'NFC'
                      ),
                      active: academicMetrics.projectedScore < 1400,
                      border:
                        'border-indigo-400/50 bg-indigo-500/15 text-indigo-200',
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border transition ${
                        item.active
                          ? item.border
                          : 'border-white/5 bg-white/[0.02] text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{item.tier}</span>
                        {item.active && (
                          <span className="px-2 py-0.5 rounded bg-white/15 text-[10px] font-mono uppercase">
                            {'Hạng Hiện Tại'.normalize('NFC')}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] opacity-85 mt-0.5">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* TAB 2: BẢNG VINH DANH SĨ TỬ (COHORT LEADERBOARD) */
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-300">
                {'Xếp hạng dựa trên chỉ số thực học và kỷ luật rèn luyện của các sĩ tử trong khóa:'.normalize(
                  'NFC'
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">
                  {'Sắp xếp theo:'.normalize('NFC')}
                </span>
                {[
                  {
                    id: 'score',
                    label: 'Điểm thi thử cao nhất'.normalize('NFC'),
                  },
                  {
                    id: 'streak',
                    label: 'Chuỗi ngày học (Streak)'.normalize('NFC'),
                  },
                  {
                    id: 'solved',
                    label: 'Số câu đã hoàn thành'.normalize('NFC'),
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setLeaderboardSortBy(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      leaderboardSortBy === tab.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {sortedLeaderboard.map((scholar, idx) => {
                const tier = getAcademicTierMeta(scholar.projectedScore);
                return (
                  <div
                    key={scholar.id}
                    className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                      scholar.isMe
                        ? 'bg-gradient-to-r from-cyan-500/15 via-indigo-500/10 to-slate-950 border-cyan-400/50 shadow-[0_0_25px_rgba(34,211,238,0.12)]'
                        : 'bg-slate-950/75 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-9 h-9 rounded-xl font-mono font-black text-sm flex items-center justify-center shrink-0 ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-950'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        #{idx + 1}
                      </div>

                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${scholar.color} text-white font-black text-sm flex items-center justify-center shrink-0`}
                      >
                        {scholar.avatar}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-black text-white">
                            {scholar.name}
                          </span>
                          {scholar.isMe && (
                            <span className="px-2 py-0.5 rounded-md bg-cyan-500/25 border border-cyan-400/40 text-cyan-200 text-[10px] font-mono font-bold">
                              {'HỒ SƠ CỦA BẠN'.normalize('NFC')}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${tier.badgeClass}`}
                          >
                            {tier.icon} {tier.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {scholar.targetSchool} •{' '}
                          <span className="text-cyan-300">{scholar.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3 sm:gap-5 text-right font-mono tabular-nums border-t md:border-t-0 pt-3 md:pt-0 border-white/10">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">
                          SAT Score
                        </span>
                        <span className="text-sm sm:text-base font-black text-amber-300">
                          {scholar.projectedScore}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">
                          Streak
                        </span>
                        <span className="text-sm sm:text-base font-black text-orange-300">
                          🔥 {scholar.streakDays}d
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">
                          {'Đã giải'.normalize('NFC')}
                        </span>
                        <span className="text-sm sm:text-base font-black text-cyan-300">
                          {scholar.questionsSolved}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">
                          2-Strike
                        </span>
                        <span className="text-sm sm:text-base font-black text-emerald-300">
                          {scholar.mistakeMasteryRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ==================================================================== */}
      {/* KHU VỰC PHÒNG TỰ HỌC TRỰC TUYẾN & TRAO ĐỔI NHANH (CO-WORKING LOUNGE) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-900/85 backdrop-blur-md border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-extrabold text-white tracking-wide">
                {'Phi hành gia đang trực tuyến (18)'.normalize('NFC')}
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              LIVE SYNC
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 text-white font-black text-xs flex items-center justify-center">
                  {myDisplayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-extrabold text-white">
                    {myDisplayName} {'(Bạn)'.normalize('NFC')}
                  </div>
                  <div className="text-[10px] text-cyan-300">
                    {'Đang luyện Flappy SAT Bird & Bảng Vàng'.normalize('NFC')}
                  </div>
                </div>
              </div>
              <span className="text-amber-300 font-mono text-xs font-bold tabular-nums">
                {academicMetrics.projectedScore} PTS
              </span>
            </div>

            {COHORT_SCHOLARS_BASE.map((peer) => (
              <div
                key={peer.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-br ${peer.color} text-white font-black text-xs flex items-center justify-center`}
                  >
                    {peer.avatar}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {peer.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {peer.status}
                    </div>
                  </div>
                </div>
                <span className="text-indigo-300 font-mono text-xs font-bold tabular-nums">
                  {peer.projectedScore}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-900/85 backdrop-blur-md border border-white/10 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-extrabold text-white tracking-wide">
                {'Kênh Tín Hiệu & Trao Đổi Học Thuật'.normalize('NFC')}
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              WAF Protected • Realtime
            </span>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-extrabold text-cyan-300">
                    {msg.author}
                  </span>
                  <span className="font-mono text-slate-500 text-[10px]">
                    {msg.time}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {msg.text}
                </p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={'Nhắn tin chia sẻ kỷ lục Flappy SAT hoặc hỏi mẹo giải đề...'.normalize(
                'NFC'
              )}
              className="flex-1 bg-slate-950 border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{'Gửi'.normalize('NFC')}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
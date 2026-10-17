// src/pages/StudyRoomPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Send,
  Trophy,
  Play,
  RotateCcw,
  Zap,
  MessageSquare,
  Crown,
  Gauge,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { authService } from '../services/authService';

// Câu hỏi Turbo nhanh hiện ngay trên HUD kính lái để kích hoạt Siêu Nitro
const QUICK_TURBO_QUESTIONS = [
  { q: '"Ubiquitous" = ?', options: ['Everywhere', 'Rare', 'Hidden', 'Weak'], ans: 0 },
  { q: '2x + 6 = 14 => x = ?', options: ['3', '4', '5', '6'], ans: 1 },
  { q: '"Mitigate" = ?', options: ['Làm nặng thêm', 'Làm giảm nhẹ', 'Bác bỏ', 'Thay thế'], ans: 1 },
  { q: '"Ephemeral" = ?', options: ['Vĩnh cửu', 'Ngắn ngủi', 'Rõ ràng', 'Cứng nhắc'], ans: 1 },
  { q: '3² + 4² = ?', options: ['14', '20', '25', '49'], ans: 2 },
  { q: '"Corroborate" = ?', options: ['Confirm', 'Deny', 'Ignore', 'Create'], ans: 0 },
  { q: '"Benevolent" = ?', options: ['Độc ác', 'Nhân từ', 'Thờ ơ', 'Bí ẩn'], ans: 1 },
  { q: '5y - 10 = 15 => y = ?', options: ['3', '5', '7', '1'], ans: 1 },
];

const INITIAL_ONLINE_STUDENTS = [
  { id: 'racer_2', name: 'Minh Anh', status: 'Đang đua 3D Cyber GP', target: 1560, avatar: 'M', color: 'from-rose-500 to-orange-400' },
  { id: 'racer_3', name: 'Hoàng Nam', status: 'Đang giải Math Module 2', target: 1540, avatar: 'H', color: 'from-emerald-500 to-teal-400' },
  { id: 'racer_4', name: 'Khánh Linh', status: 'Ôn Flashcard C1-C2', target: 1580, avatar: 'K', color: 'from-amber-400 to-yellow-500' },
  { id: 'racer_5', name: 'Đức Duy', status: 'Sẵn sàng vào chặng đua', target: 1520, avatar: 'Đ', color: 'from-purple-500 to-pink-500' },
];

const INITIAL_CHAT = [
  { id: 'c1', author: 'Khánh Linh', text: 'Bấm nút Phóng To Toàn Màn Hình ở góc phải game đua phê lắm mọi người ơi! 🏎️🔥', time: '1 phút trước' },
  { id: 'c2', author: 'Hoàng Nam', text: 'Lách trái/phải ăn vạch sáng xanh trên đường với bấm Space xả Nitro là lên Top 1 ngay!', time: 'Vừa xong' },
];

const TOTAL_RACE_DISTANCE = 4500; // Chiều dài chặng đua

export default function StudyRoomPage({ currentUser }) {
  const userProfile = currentUser || authService.getCurrentUser() || {
    id: 'racer_1',
    name: 'Capt. Commander',
    targetScore: 1580,
  };

  const myDisplayName =
    localStorage.getItem('sat_custom_display_name') || userProfile.name || 'Commander';

  // =========================================================================
  // 1. STATE CHẾ ĐỘ TOÀN MÀN HÌNH (FULLSCREEN MODE)
  // =========================================================================
  const [isFullscreen, setIsFullscreen] = useState(false);
  const gameContainerRef = useRef(null);
  const canvasRef = useRef(null);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev;
      if (next && gameContainerRef.current?.requestFullscreen) {
        gameContainerRef.current.requestFullscreen().catch(() => {});
      } else if (!next && document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        // Vẫn giữ chế độ phóng to khung cửa sổ nếu người dùng không bấm Esc
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [isFullscreen]);

  // =========================================================================
  // 2. STATE PHÒNG TỰ HỌC & CHAT
  // =========================================================================
  const [onlineMembers] = useState(INITIAL_ONLINE_STUDENTS);
  const [chatMessages, setChatMessages] = useState(INITIAL_CHAT);
  const [chatInput, setChatInput] = useState('');
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const channelRef = useRef(null);

  // =========================================================================
  // 3. STATE & REF CHO ENGINE ĐUA XE 3D 5 NGƯỜI CHƠI
  // =========================================================================
  const [raceStatus, setRaceStatus] = useState('idle'); // 'idle' | 'countdown' | 'racing' | 'finished'
  const [countdown, setCountdown] = useState(3);
  const [hudStats, setHudStats] = useState({
    speedKmh: 0,
    nitro: 100,
    myRank: 1,
    progressPct: 0,
    leaderboard: [],
  });
  const [quizIndex, setQuizIndex] = useState(0);
  const [turboToast, setTurboToast] = useState('');

  // Dữ liệu vật lý thời gian thực của 5 xe đua trong Canvas 60FPS
  const raceDataRef = useRef({
    roadOffset: 0,
    keys: { left: false, right: false, boost: false },
    boostPads: [
      { lane: 1, z: 400 },
      { lane: 3, z: 850 },
      { lane: 2, z: 1300 },
      { lane: 0, z: 1750 },
      { lane: 4, z: 2200 },
      { lane: 2, z: 2700 },
      { lane: 1, z: 3200 },
      { lane: 3, z: 3800 },
    ],
    finishOrder: [],
    cars: [
      { id: 'me', name: myDisplayName, isMe: true, lane: 2, targetLane: 2, z: 0, speed: 0, baseMaxSpeed: 10.5, nitro: 100, isBoosting: false, tilt: 0, color: '#06b6d4', glow: '#22d3ee', rank: null },
      { id: 'bot1', name: 'Minh Anh', isMe: false, lane: 0, targetLane: 0, z: 0, speed: 0, baseMaxSpeed: 10.1, nitro: 100, isBoosting: false, tilt: 0, color: '#f43f5e', glow: '#fb7185', rank: null },
      { id: 'bot2', name: 'Hoàng Nam', isMe: false, lane: 1, targetLane: 1, z: 0, speed: 0, baseMaxSpeed: 10.3, nitro: 100, isBoosting: false, tilt: 0, color: '#10b981', glow: '#34d399', rank: null },
      { id: 'bot3', name: 'Khánh Linh', isMe: false, lane: 3, targetLane: 3, z: 0, speed: 0, baseMaxSpeed: 10.4, nitro: 100, isBoosting: false, tilt: 0, color: '#f59e0b', glow: '#fbbf24', rank: null },
      { id: 'bot4', name: 'Đức Duy', isMe: false, lane: 4, targetLane: 4, z: 0, speed: 0, baseMaxSpeed: 9.9, nitro: 100, isBoosting: false, tilt: 0, color: '#a855f7', glow: '#c084fc', rank: null },
    ],
  });

  // Kết nối Supabase Realtime nếu có
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    const channel = supabase.channel('sat_study_room_race');
    channel
      .on('broadcast', { event: 'chat' }, ({ payload }) => {
        if (payload?.msg) setChatMessages((prev) => [payload.msg, ...prev.slice(0, 29)]);
      })
      .on('broadcast', { event: 'emoji' }, ({ payload }) => {
        if (payload?.emoji) triggerEmoji(payload.emoji);
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const triggerEmoji = (emoji) => {
    const id = `${Date.now()}_${Math.random()}`;
    const x = Math.floor(Math.random() * 240) - 120;
    setFloatingEmojis((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 2000);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMsg = {
      id: `msg_${Date.now()}`,
      author: myDisplayName,
      text: chatInput.trim(),
      time: 'Vừa xong',
    };
    setChatMessages((prev) => [newMsg, ...prev.slice(0, 29)]);
    setChatInput('');
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'chat', payload: { msg: newMsg } });
    }
  };

  // Khởi tạo chặng đua mới
  const handleStartRace = () => {
    const state = raceDataRef.current;
    state.finishOrder = [];
    state.roadOffset = 0;
    state.cars = [
      { id: 'me', name: myDisplayName, isMe: true, lane: 2, targetLane: 2, z: 0, speed: 0, baseMaxSpeed: 10.4, nitro: 100, isBoosting: false, tilt: 0, color: '#06b6d4', glow: '#22d3ee', rank: null },
      { id: 'bot1', name: 'Minh Anh', isMe: false, lane: 0, targetLane: 0, z: 0, speed: 0, baseMaxSpeed: 10.1, nitro: 100, isBoosting: false, tilt: 0, color: '#f43f5e', glow: '#fb7185', rank: null },
      { id: 'bot2', name: 'Hoàng Nam', isMe: false, lane: 1, targetLane: 1, z: 0, speed: 0, baseMaxSpeed: 10.35, nitro: 100, isBoosting: false, tilt: 0, color: '#10b981', glow: '#34d399', rank: null },
      { id: 'bot3', name: 'Khánh Linh', isMe: false, lane: 3, targetLane: 3, z: 0, speed: 0, baseMaxSpeed: 10.5, nitro: 100, isBoosting: false, tilt: 0, color: '#f59e0b', glow: '#fbbf24', rank: null },
      { id: 'bot4', name: 'Đức Duy', isMe: false, lane: 4, targetLane: 4, z: 0, speed: 0, baseMaxSpeed: 9.95, nitro: 100, isBoosting: false, tilt: 0, color: '#a855f7', glow: '#c084fc', rank: null },
    ];
    setCountdown(3);
    setRaceStatus('countdown');
    setTurboToast('');
  };

  // Đếm ngược 3 - 2 - 1
  useEffect(() => {
    if (raceStatus !== 'countdown') return;
    if (countdown <= 0) {
      setRaceStatus('racing');
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 850);
    return () => clearTimeout(t);
  }, [raceStatus, countdown]);

  // Chuyển làn xe của người chơi (5 làn: 0, 1, 2, 3, 4)
  const steerMyCar = useCallback((dir) => {
    const me = raceDataRef.current.cars[0];
    if (!me) return;
    const nextLane = Math.max(0, Math.min(4, Math.round(me.targetLane) + dir));
    me.targetLane = nextLane;
    me.tilt = dir * 12;
  }, []);

  // Kích hoạt xung lực Nitro tức thời
  const triggerManualNitro = useCallback((bonusNitro = 18, speedSurge = 5.5) => {
    const me = raceDataRef.current.cars[0];
    if (!me) return;
    me.nitro = Math.min(100, me.nitro + bonusNitro);
    me.speed = Math.min(18, me.speed + speedSurge);
    me.isBoosting = true;
    setTimeout(() => {
      if (raceDataRef.current.cars[0]) {
        raceDataRef.current.cars[0].isBoosting = false;
      }
    }, 650);
  }, []);

  // Lắng nghe bàn phím điều khiển xe (Trái/Phải/Space/W/F)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
        return;
      }
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        return;
      }

      if (raceStatus !== 'racing') return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        steerMyCar(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        steerMyCar(1);
      } else if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        raceDataRef.current.keys.boost = true;
        triggerManualNitro(5, 2.2);
      }
    };

    const onKeyUp = (e) => {
      if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        raceDataRef.current.keys.boost = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [raceStatus, isFullscreen, steerMyCar, triggerManualNitro, toggleFullscreen]);

  // Trả lời đúng câu hỏi Turbo trên kính lái => Phóng tên lửa Siêu Tốc
  const handleAnswerTurboQuiz = (idx) => {
    if (raceStatus !== 'racing') return;
    const q = QUICK_TURBO_QUESTIONS[quizIndex];
    if (idx === q.ans) {
      triggerManualNitro(45, 7.5);
      setTurboToast('🚀 HYPER TURBO +350 KM/H!');
      triggerEmoji('🔥');
    } else {
      setTurboToast('⚠️ Trượt nhịp Turbo!');
    }
    setQuizIndex((prev) => (prev + 1) % QUICK_TURBO_QUESTIONS.length);
    setTimeout(() => setTurboToast(''), 1200);
  };

  // =========================================================================
  // 4. VÒNG LẶP ĐỒ HỌA 3D PERSPECTIVE RACING CANVAS (60 FPS)
  // =========================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let frameCount = 0;

    // Hàm vẽ một chiếc siêu xe 3D góc nhìn từ phía sau đuôi xe
    const draw3DSportsCar = (x, y, scale, car, isPlayer) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((car.tilt * Math.PI) / 180);
      ctx.scale(scale, scale);

      const boosting = car.isBoosting || (isPlayer && raceDataRef.current.keys.boost && car.nitro > 2);

      // Bóng đổ gầm xe
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.beginPath();
      ctx.ellipse(0, 14, 46, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Luồng lửa Nitro đôi từ ống xả khi tăng tốc
      if (boosting && car.speed > 2) {
        const flameLen = 28 + Math.random() * 24;
        const flameGrad = ctx.createLinearGradient(0, 12, 0, 12 + flameLen);
        flameGrad.addColorStop(0, '#ffffff');
        flameGrad.addColorStop(0.35, '#38bdf8');
        flameGrad.addColorStop(0.75, '#6366f1');
        flameGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = flameGrad;
        // Pô trái
        ctx.beginPath();
        ctx.moveTo(-20, 10);
        ctx.lineTo(-10, 10);
        ctx.lineTo(-15, 12 + flameLen);
        ctx.closePath();
        ctx.fill();
        // Pô phải
        ctx.beginPath();
        ctx.moveTo(10, 10);
        ctx.lineTo(20, 10);
        ctx.lineTo(15, 12 + flameLen);
        ctx.closePath();
        ctx.fill();
      }

      // Bánh xe sau bản rộng (Trái & Phải)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-44, -6, 12, 20);
      ctx.fillRect(32, -6, 12, 20);

      // Thân dưới xe thể thao (Widebody Chassis)
      ctx.fillStyle = car.color;
      ctx.shadowColor = car.glow;
      ctx.shadowBlur = isPlayer ? 18 : 10;
      ctx.beginPath();
      ctx.moveTo(-40, 10);
      ctx.lineTo(40, 10);
      ctx.lineTo(34, -14);
      ctx.lineTo(-34, -14);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Kính sau & Nóc buồng lái khí động học
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = car.glow;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-26, -12);
      ctx.lineTo(26, -12);
      ctx.lineTo(18, -28);
      ctx.lineTo(-18, -28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cánh gió sau Carbon (GT Rear Wing)
      ctx.fillStyle = '#020617';
      ctx.fillRect(-38, -20, 76, 5);
      ctx.fillStyle = car.glow;
      ctx.fillRect(-38, -20, 6, 8);
      ctx.fillRect(32, -20, 6, 8);

      // Cụm đèn hậu LED Neon ngang chuẩn Cyberpunk
      ctx.fillStyle = boosting ? '#38bdf8' : '#ff1e56';
      ctx.shadowColor = boosting ? '#38bdf8' : '#ff1e56';
      ctx.shadowBlur = 12;
      ctx.fillRect(-32, -3, 22, 4);
      ctx.fillRect(10, -3, 22, 4);
      ctx.shadowBlur = 0;

      // Biển tên tay đua nổi phía trên nóc xe
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      const label = isPlayer ? `★ ${car.name} (Bạn)` : car.name;
      const textWidth = ctx.measureText(label).width + 14;
      ctx.fillStyle = isPlayer ? 'rgba(6, 182, 212, 0.9)' : 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(-textWidth / 2, -52, textWidth, 18, 6);
      ctx.fill();

      ctx.fillStyle = isPlayer ? '#020617' : '#f8fafc';
      ctx.fillText(label, 0, -39);

      ctx.restore();
    };

    const renderLoop = () => {
      frameCount++;
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect && (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height))) {
        canvas.width = Math.floor(rect.width);
        canvas.height = Math.floor(rect.height);
      }

      const W = canvas.width;
      const H = canvas.height;
      const horizonY = H * 0.36; // Đường chân trời
      const state = raceDataRef.current;
      const me = state.cars[0];

      // ---------------------------------------------------------------------
      // A. CẬP NHẬT VẬT LÝ CHẶNG ĐUA
      // ---------------------------------------------------------------------
      if (raceStatus === 'racing') {
        state.cars.forEach((car) => {
          if (car.z >= TOTAL_RACE_DISTANCE) {
            car.speed *= 0.95;
            return;
          }

          if (car.isMe) {
            const holdingBoost = state.keys.boost && car.nitro > 0;
            const targetSpd = holdingBoost ? car.baseMaxSpeed * 1.48 : car.baseMaxSpeed;
            car.speed += (targetSpd - car.speed) * 0.08;

            if (holdingBoost) {
              car.nitro = Math.max(0, car.nitro - 0.55);
              car.isBoosting = true;
            } else {
              car.nitro = Math.min(100, car.nitro + 0.22);
            }
          } else {
            // AI điều khiển 4 đối thủ tự động tăng tốc, chuyển làn và bật Nitro đầy kịch tính
            const rubberBand = me.z - car.z;
            let aiTarget = car.baseMaxSpeed + Math.sin(frameCount * 0.03 + car.lane) * 0.8;
            if (rubberBand > 180) aiTarget += 1.6; // Bám đuổi gay cấn
            if (rubberBand < -220) aiTarget -= 1.1;

            if (Math.random() < 0.012) {
              car.isBoosting = !car.isBoosting;
            }
            if (Math.random() < 0.008) {
              car.targetLane = Math.max(0, Math.min(4, car.targetLane + (Math.random() < 0.5 ? -1 : 1)));
            }
            car.speed += ((car.isBoosting ? aiTarget * 1.18 : aiTarget) - car.speed) * 0.06;
          }

          // Nội suy chuyển làn mượt
          const laneDiff = car.targetLane - car.lane;
          car.lane += laneDiff * 0.14;
          car.tilt = laneDiff * 22;

          // Kiểm tra ăn vạch tăng tốc (Boost Pads) trên đường
          state.boostPads.forEach((pad) => {
            if (Math.abs(car.z - pad.z) < 28 && Math.abs(car.lane - pad.lane) < 0.55) {
              car.speed = Math.min(18.5, car.speed + 4.5);
              car.nitro = Math.min(100, car.nitro + 25);
              car.isBoosting = true;
            }
          });

          car.z = Math.min(TOTAL_RACE_DISTANCE, car.z + car.speed);

          if (car.z >= TOTAL_RACE_DISTANCE && !car.rank) {
            state.finishOrder.push(car.id);
            car.rank = state.finishOrder.length;
          }
        });

        state.roadOffset += me.speed * 3.2;

        // Kiểm tra kết thúc khi cả 5 xe về đích hoặc người chơi đã về đích
        const allDone = state.cars.every((c) => c.z >= TOTAL_RACE_DISTANCE);
        if (allDone || (me.z >= TOTAL_RACE_DISTANCE && state.finishOrder.length >= 3)) {
          // Gán nốt thứ hạng cho các xe còn lại theo vị trí z
          const remaining = [...state.cars]
            .filter((c) => !c.rank)
            .sort((a, b) => b.z - a.z);
          remaining.forEach((c) => {
            state.finishOrder.push(c.id);
            c.rank = state.finishOrder.length;
          });
          setRaceStatus('finished');
        }
      } else {
        // Khi ở màn hình chờ (Idle), đường vẫn trôi nhẹ tạo hiệu ứng sống động
        state.roadOffset += 6;
        state.cars.forEach((c) => {
          c.tilt *= 0.9;
        });
      }

      // Cập nhật HUD mỗi 6 frames
      if (frameCount % 6 === 0) {
        const sorted = [...state.cars].sort((a, b) => {
          if (a.rank && b.rank) return a.rank - b.rank;
          if (a.rank) return -1;
          if (b.rank) return 1;
          return b.z - a.z;
        });
        const myRankIdx = sorted.findIndex((c) => c.isMe) + 1;
        setHudStats({
          speedKmh: Math.round(me.speed * 26),
          nitro: Math.round(me.nitro),
          myRank: myRankIdx,
          progressPct: Math.min(100, Math.round((me.z / TOTAL_RACE_DISTANCE) * 100)),
          leaderboard: sorted.map((c, idx) => ({
            id: c.id,
            name: c.name,
            isMe: c.isMe,
            rank: c.rank || idx + 1,
            pct: Math.min(100, Math.round((c.z / TOTAL_RACE_DISTANCE) * 100)),
            color: c.color,
          })),
        });
      }

      // ---------------------------------------------------------------------
      // B. VẼ BẦU TRỜI VŨ TRỤ SYNTHWAVE & CHÂN TRỜI NEON
      // ---------------------------------------------------------------------
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, '#030614');
      skyGrad.addColorStop(0.55, '#131138');
      skyGrad.addColorStop(1, '#3b0f54');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, horizonY);

      // Mặt trời Synthwave khổng lồ ở tâm chân trời
      const sunRadius = Math.min(W, H) * 0.14;
      const sunGrad = ctx.createLinearGradient(W / 2, horizonY - sunRadius * 1.4, W / 2, horizonY);
      sunGrad.addColorStop(0, '#fde047');
      sunGrad.addColorStop(0.5, '#f97316');
      sunGrad.addColorStop(1, '#ec4899');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(W / 2, horizonY - sunRadius * 0.15, sunRadius, Math.PI, 0, false);
      ctx.fill();

      // Dãy núi Cyberpunk ở đường chân trời
      ctx.fillStyle = '#090919';
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      for (let x = 0; x <= W; x += 45) {
        const peakH = Math.sin(x * 0.02) * 18 + Math.cos(x * 0.05) * 12 + 20;
        ctx.lineTo(x, horizonY - Math.abs(peakH));
      }
      ctx.lineTo(W, horizonY);
      ctx.closePath();
      ctx.fill();

      // ---------------------------------------------------------------------
      // C. VẼ CAO TỐC 3D 5 LÀN ĐUA (3D PERSPECTIVE HIGHWAY)
      // ---------------------------------------------------------------------
      ctx.fillStyle = '#060814';
      ctx.fillRect(0, horizonY, W, H - horizonY);

      const roadTopWidth = W * 0.14;
      const roadBottomWidth = W * 0.92;
      const centerX = W / 2;

      // Mặt nhựa đường 3D hình thang
      const roadGrad = ctx.createLinearGradient(0, horizonY, 0, H);
      roadGrad.addColorStop(0, '#0f172a');
      roadGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = roadGrad;
      ctx.beginPath();
      ctx.moveTo(centerX - roadTopWidth / 2, horizonY);
      ctx.lineTo(centerX + roadTopWidth / 2, horizonY);
      ctx.lineTo(centerX + roadBottomWidth / 2, H);
      ctx.lineTo(centerX - roadBottomWidth / 2, H);
      ctx.closePath();
      ctx.fill();

      // Vạch kẻ ngang mặt đường tạo cảm giác lao về phía trước với tốc độ cao
      const numStripes = 16;
      for (let i = 0; i < numStripes; i++) {
        const rawProgress = ((i / numStripes) + (state.roadOffset % 120) / (120 * numStripes)) % 1;
        // Hàm mũ tạo độ sâu phối cảnh 3D chuẩn xác
        const p = Math.pow(rawProgress, 2.4);
        const y = horizonY + p * (H - horizonY);
        const currentRoadW = roadTopWidth + p * (roadBottomWidth - roadTopWidth);

        // Đèn viền lề đường (Curb Lights) đổi màu Đỏ - Cyan
        const curbW = Math.max(3, p * 18);
        const curbH = Math.max(2, p * 12);
        ctx.fillStyle = i % 2 === 0 ? '#22d3ee' : '#f43f5e';
        ctx.fillRect(centerX - currentRoadW / 2 - curbW, y, curbW, curbH);
        ctx.fillRect(centerX + currentRoadW / 2, y, curbW, curbH);

        // Vạch đứt phân 5 làn đường
        if (i % 2 === 0) {
          ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
          for (let laneDiv = 1; laneDiv < 5; laneDiv++) {
            const laneRatio = laneDiv / 5 - 0.5;
            const lx = centerX + laneRatio * currentRoadW;
            const lineW = Math.max(1, p * 4);
            ctx.fillRect(lx - lineW / 2, y, lineW, curbH * 1.4);
          }
        }
      }

      // ---------------------------------------------------------------------
      // D. VẼ CÁC TẤM TĂNG TỐC (BOOST PADS) & VẠCH ĐÍCH TRÊN ĐƯỜNG
      // ---------------------------------------------------------------------
      state.boostPads.forEach((pad) => {
        const relZ = pad.z - me.z;
        if (relZ > -40 && relZ < 450) {
          // Chuyển đổi khoảng cách Z thành tọa độ màn hình Y theo phối cảnh
          const depthNorm = 1 - Math.max(0, Math.min(1, relZ / 450));
          const p = Math.pow(depthNorm, 1.8);
          const padY = horizonY + p * (H * 0.82 - horizonY);
          const roadWAtY = roadTopWidth + p * (roadBottomWidth - roadTopWidth);
          const laneOffset = (pad.lane + 0.5) / 5 - 0.5;
          const padX = centerX + laneOffset * roadWAtY;
          const padScale = 0.25 + p * 0.85;

          ctx.save();
          ctx.translate(padX, padY);
          ctx.scale(padScale, padScale * 0.45);
          ctx.fillStyle = 'rgba(34, 211, 238, 0.75)';
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.moveTo(0, -24);
          ctx.lineTo(28, 16);
          ctx.lineTo(0, 4);
          ctx.lineTo(-28, 16);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      });

      // Vẽ Cổng Đích (Finish Arch) khi gần về đích
      const distToFinish = TOTAL_RACE_DISTANCE - me.z;
      if (distToFinish > -60 && distToFinish < 500) {
        const depthNorm = 1 - Math.max(0, Math.min(1, distToFinish / 500));
        const p = Math.pow(depthNorm, 1.8);
        const finY = horizonY + p * (H * 0.82 - horizonY);
        const roadWAtY = roadTopWidth + p * (roadBottomWidth - roadTopWidth);

        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(centerX - roadWAtY / 2, finY - 8 * p, roadWAtY, Math.max(4, 14 * p));
      }

      // ---------------------------------------------------------------------
      // E. VẼ CẢ 5 XE ĐUA TRÊN CAO TỐC 3D (SẮP XẾP THEO ĐỘ SÂU Z-ORDER)
      // ---------------------------------------------------------------------
      const drawableCars = state.cars
        .map((car) => {
          const relZ = car.z - me.z; // Khoảng cách tương đối so với xe của bạn
          return { car, relZ };
        })
        .filter(({ car, relZ }) => car.isMe || (relZ > -140 && relZ < 460))
        .sort((a, b) => b.relZ - a.relZ); // Vẽ xe ở xa trước, xe ở gần sau

      drawableCars.forEach(({ car, relZ }) => {
        let p;
        if (car.isMe) {
          p = 0.76; // Xe của bạn luôn ở vị trí camera lý tưởng phía dưới màn hình
        } else {
          const clampedRel = Math.max(-120, Math.min(440, relZ));
          const norm = 1 - (clampedRel + 120) / 560;
          p = Math.pow(Math.max(0.06, Math.min(0.95, norm)), 1.55);
        }

        const carY = horizonY + p * (H - horizonY);
        const roadWAtY = roadTopWidth + p * (roadBottomWidth - roadTopWidth);
        const laneCenterRatio = (car.lane + 0.5) / 5 - 0.5;
        const carX = centerX + laneCenterRatio * roadWAtY;
        const scale = Math.max(0.22, p * 1.15);

        draw3DSportsCar(carX, carY, scale, car, car.isMe);
      });

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [raceStatus]);

  const currentQuiz = QUICK_TURBO_QUESTIONS[quizIndex];

  return (
    <div className="min-h-full bg-[#060913] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8 select-none font-sans relative overflow-hidden">
      {/* Pháo hoa Emoji bay */}
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

      {/* HEADER PHÒNG HỌC TẬP */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-500/20 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>3D CYBER GRAND PRIX • 18 ONLINE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Phòng Học Tập Liên Sao & Đua Xe 3D (5 Người/Hiệp)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Bấm nút <strong>Phóng to toàn màn hình</strong> ở góc phải đường đua để trải nghiệm không cần cuộn trang!
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/90 border border-white/10 px-3.5 py-2 rounded-2xl">
          <span className="text-xs font-bold text-slate-400 mr-1">Thả năng lượng:</span>
          {['🏎️', '🚀', '🔥', '❤️', '⚡', '🏆'].map((emo) => (
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

      {/* ===================================================================== */}
      {/* KHUNG GAME ĐUA XE 3D (HỖ TRỢ FULLSCREEN FIT 100% MÀN HÌNH) */}
      {/* ===================================================================== */}
      <div
        ref={gameContainerRef}
        className={`${
          isFullscreen
            ? 'fixed inset-0 z-50 w-screen h-screen rounded-none border-0'
            : 'relative w-full h-[540px] sm:h-[600px] rounded-3xl border border-cyan-400/40 shadow-[0_20px_60px_rgba(0,0,0,0.85)]'
        } bg-[#040611] overflow-hidden flex flex-col justify-between transition-all duration-200`}
      >
        {/* CANVAS 3D HIGHWAY */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />

        {/* TOP HUD OVERLAY: ĐỒNG HỒ TỐC ĐỘ, XẾP HẠNG 5 XE & NÚT PHÓNG TO TOÀN MÀN HÌNH */}
        <div className="relative z-20 p-4 sm:p-5 flex flex-wrap items-start justify-between gap-3 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent">
          {/* Cụm Đồng hồ Công-tơ-mét & Thanh Nitro */}
          <div className="flex items-center gap-3 bg-slate-950/85 backdrop-blur-md border border-cyan-400/35 px-4 py-2.5 rounded-2xl shadow-lg">
            <Gauge className="w-7 h-7 text-cyan-400 shrink-0" />
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono text-white">
                  {hudStats.speedKmh}
                </span>
                <span className="text-[10px] font-mono font-bold text-cyan-300">KM/H</span>
                <span className="ml-2 px-2 py-0.5 rounded bg-amber-400/20 border border-amber-300/40 text-amber-300 text-[10px] font-mono font-black">
                  HẠNG {hudStats.myRank}/5
                </span>
              </div>
              {/* Thanh năng lượng Nitro */}
              <div className="w-36 h-2 rounded-full bg-slate-800 overflow-hidden mt-1 border border-white/10">
                <div
                  style={{ width: `${hudStats.nitro}%` }}
                  className="h-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-500 transition-all duration-100"
                />
              </div>
            </div>
          </div>

          {/* Bảng xếp hạng trực tiếp 5 tay đua (Live Mini Leaderboard) */}
          <div className="hidden md:flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-white/15 px-3.5 py-2 rounded-2xl">
            {hudStats.leaderboard.map((r, i) => (
              <div
                key={r.id}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-mono flex items-center gap-1.5 border ${
                  r.isMe
                    ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200 font-black'
                    : 'bg-white/[0.04] border-white/10 text-slate-300'
                }`}
              >
                <span className="text-amber-300 font-black">#{i + 1}</span>
                <span className="truncate max-w-[75px]">{r.name}</span>
                <span className="text-[10px] opacity-75">{r.pct}%</span>
              </div>
            ))}
          </div>

          {/* Cụm Nút Bắt Đầu & Nút PHÓNG TO TOÀN MÀN HÌNH */}
          <div className="flex items-center gap-2">
            {(raceStatus === 'idle' || raceStatus === 'finished') && (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={handleStartRace}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/30 cursor-pointer border border-cyan-300/40"
              >
                {raceStatus === 'finished' ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{raceStatus === 'finished' ? 'Đua Lại Hiệp Mới' : 'Bắt Đầu Đua (5 Xe)'}</span>
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={toggleFullscreen}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-400/40 font-extrabold text-xs flex items-center gap-1.5 shadow-lg transition cursor-pointer"
              title="Phóng to hoặc thu nhỏ toàn màn hình (Phím F)"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4" />
                  <span>Thu nhỏ (Esc)</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4" />
                  <span>Phóng to toàn màn hình</span>
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* GIỮA MÀN HÌNH: ĐẾM NGƯỢC 3 - 2 - 1 HOẶC BẢNG TRAO GIẢI PODIUM */}
        <div className="relative z-20 flex-1 flex items-center justify-center pointer-events-none px-4">
          <AnimatePresence mode="wait">
            {raceStatus === 'idle' && (
              <motion.div
                key="idle-banner"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="pointer-events-auto bg-slate-950/85 backdrop-blur-xl border border-cyan-400/40 rounded-3xl p-6 sm:p-8 text-center max-w-md space-y-4 shadow-[0_0_60px_rgba(6,182,212,0.25)]"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center mx-auto text-slate-950 shadow-lg shadow-cyan-500/30">
                  <Trophy className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-wide">
                    Sẵn sàng xuất phát chặng 5 người!
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Dùng phím mũi tên <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600 text-cyan-300 font-mono">←</kbd>{' '}
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600 text-cyan-300 font-mono">→</kbd> để lách làn ăn mũi tên xanh và nhấn giữ{' '}
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600 text-amber-300 font-mono">Space</kbd> để bật lửa Nitro!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleStartRace}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-600 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/30 cursor-pointer hover:brightness-110 transition"
                >
                  🚀 Xuất Phát Ngay (Start 5P Race)
                </button>
              </motion.div>
            )}

            {raceStatus === 'countdown' && (
              <motion.div
                key={`cd-${countdown}`}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1.15 }}
                exit={{ opacity: 0, scale: 1.8 }}
                transition={{ duration: 0.35 }}
                className="text-7xl sm:text-8xl font-black font-mono text-amber-400 drop-shadow-[0_0_35px_rgba(251,191,36,0.95)]"
              >
                {countdown > 0 ? countdown : 'GO! 🔥'}
              </motion.div>
            )}

            {raceStatus === 'finished' && (
              <motion.div
                key="finished-modal"
                initial={{ opacity: 0, y: 20, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="pointer-events-auto bg-slate-950/90 backdrop-blur-2xl border border-amber-400/50 rounded-3xl p-6 sm:p-8 text-center max-w-lg w-full space-y-5 shadow-[0_0_80px_rgba(251,191,36,0.3)]"
              >
                <Crown className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 block">
                    CHẶNG ĐUA KẾT THÚC
                  </span>
                  <h3 className="text-2xl font-black text-white mt-0.5">
                    Quán Quân: {hudStats.leaderboard[0]?.name}! 🏆
                  </h3>
                </div>

                <div className="space-y-2 text-left">
                  {hudStats.leaderboard.map((r, idx) => (
                    <div
                      key={r.id}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold border ${
                        r.isMe
                          ? 'bg-cyan-500/20 border-cyan-400 text-white'
                          : 'bg-white/[0.04] border-white/10 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-white/10 font-mono flex items-center justify-center text-amber-300">
                          #{idx + 1}
                        </span>
                        <span>{r.name} {r.isMe ? '(Bạn)' : ''}</span>
                      </div>
                      <span className="font-mono text-emerald-400">HOÀN THÀNH</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleStartRace}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider cursor-pointer shadow-lg shadow-amber-500/30"
                >
                  Đua Tiếp Hiệp Mới
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM HUD: CÂU HỎI TURBO NHANH & NÚT ĐIỀU KHIỂN TRÁI / NITRO / PHẢI TRÊN MÀN HÌNH */}
        <div className="relative z-20 p-4 sm:p-5 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Hộp câu hỏi Turbo nạp đầy bình Nitro */}
          <div className="w-full lg:w-auto flex-1 bg-slate-900/90 backdrop-blur-md border border-indigo-400/30 rounded-2xl px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-[10px] font-mono font-bold uppercase text-cyan-300">
                  ⚡ TRẢ LỜI NHANH NẠP SIÊU NITRO:
                </span>
                {turboToast && (
                  <span className="text-xs font-black text-amber-300">{turboToast}</span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-extrabold text-white">{currentQuiz.q}</p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {currentQuiz.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAnswerTurboQuiz(i)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-cyan-500 hover:text-slate-950 border border-cyan-400/30 text-xs font-bold text-cyan-200 transition cursor-pointer"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Cụm vô-lăng nút bấm trực tiếp trên màn hình (Dành cho cả chuột & cảm ứng) */}
          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => steerMyCar(-1)}
              className="px-4 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-cyan-400" />
              <span>Làn Trái (A)</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.92 }}
              type="button"
              onMouseDown={() => {
                raceDataRef.current.keys.boost = true;
                triggerManualNitro(12, 3.5);
              }}
              onMouseUp={() => {
                raceDataRef.current.keys.boost = false;
              }}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.5)] cursor-pointer"
            >
              <Flame className="w-4 h-4 fill-current" />
              <span>NITRO (SPACE)</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => steerMyCar(1)}
              className="px-4 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <span>Làn Phải (D)</span>
              <ChevronRight className="w-4 h-4 text-cyan-400" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* KHU VỰC PHÒNG TỰ HỌC & KÊNH CHAT BÊN DƯỚI */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-900/85 border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Phi hành gia đang trực tuyến (18)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">● LIVE SYNC</span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 text-white font-black text-xs flex items-center justify-center">
                  {myDisplayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-extrabold text-white">{myDisplayName} (Bạn)</div>
                  <div className="text-[10px] text-cyan-300">Đang ở Đường Đua Vũ Trụ 3D</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">
                Aim 1580
              </span>
            </div>

            {onlineMembers.map((peer) => (
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
                    <div className="text-xs font-bold text-white">{peer.name}</div>
                    <div className="text-[10px] text-slate-400">{peer.status}</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-mono text-[10px] font-bold">
                  Aim {peer.target}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-900/85 border border-white/10 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Kênh Tín Hiệu & Trao Đổi Nhanh
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Realtime Broadcast</span>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <strong className="text-cyan-300">@{msg.author}</strong>
                  <span className="text-slate-500 font-mono text-[10px]">{msg.time}</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{msg.text}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Gửi lời nhắn rủ đua xe hoặc trao đổi bài tập..."
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-950 border border-white/15 focus:border-cyan-400 text-xs text-white outline-none"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
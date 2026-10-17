// src/components/common/CosmicHubDock.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import {
  Radio,
  Users,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  Send,
  ShieldCheck,
  QrCode,
  X,
  Disc,
  CreditCard,
  Compass
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { authService } from '../../services/authService';
import { storageService } from '../../services/storageService';

// Danh sách các kênh âm thanh Vũ trụ (Kết hợp Stream Lofi & WebAudio Procedural Synth)
const RADIO_STATIONS = [
  {
    id: 'lofi_girl',
    name: 'Lofi Hip Hop Beats',
    subtitle: '24/7 Chill Study Frequency',
    freq: '88.5 FM',
    type: 'stream',
    url: 'https://streams.fluxfm.de/Chillhop/mp3-128/streams.fluxfm.de/',
    accent: 'from-indigo-500 to-cyan-400',
  },
  {
    id: 'deep_space',
    name: 'Deep Space Drone (Synth)',
    subtitle: 'WebAudio Ambient Generator',
    freq: '104.2 FM',
    type: 'synth_drone',
    accent: 'from-violet-500 to-fuchsia-400',
  },
  {
    id: 'cosmic_rain',
    name: 'Starship Rain & Pink Noise',
    subtitle: 'Deep Focus Acoustic Shield',
    freq: '96.8 FM',
    type: 'synth_rain',
    accent: 'from-emerald-500 to-teal-400',
  },
];

const INITIAL_BOT_PEERS = [
  { id: 'bot_1', name: 'Minh Anh', status: 'Đang giải Math Module 2', target: 1560, avatar: 'M' },
  { id: 'bot_2', name: 'Hoàng Nam', status: 'Ôn Flashcard C1-C2', target: 1540, avatar: 'H' },
  { id: 'bot_3', name: 'Khánh Linh', status: 'Luyện Reading Inference', target: 1580, avatar: 'K' },
  { id: 'bot_4', name: 'Đức Duy', status: 'Đang nghe Lofi 88.5 FM', target: 1520, avatar: 'Đ' },
];

const INITIAL_NOTES = [
  { id: 'n1', author: 'Khánh Linh', text: 'Chúc mọi người đạt aim 1550+ kỳ thi tới nhé! 🚀', time: '2 phút trước' },
  { id: 'n2', author: 'Hoàng Nam', text: 'Mẹo: Câu hệ phương trình nhớ bật Desmos gõ 2 hàm là ra giao điểm ngay!', time: '5 phút trước' },
];

export default function CosmicHubDock({ currentUser }) {
  // Tab đang mở: null | 'radio' | 'lounge' | 'idcard'
  const [activePanel, setActivePanel] = useState(null);

  // =========================================================================
  // 1. STATE & LOGIC CHO TRẠM PHÁT THANH LOFI (WEB AUDIO API + STREAM)
  // =========================================================================
  const [isPlaying, setIsPlaying] = useState(false);
  const [stationIdx, setStationIdx] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [bars, setBars] = useState([20, 35, 50, 30, 60, 40, 25, 45, 70, 30, 50, 25]);

  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const synthNodesRef = useRef([]);
  const gainNodeRef = useRef(null);

  const currentStation = RADIO_STATIONS[stationIdx];

  const stopSynth = () => {
    synthNodesRef.current.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch {
        // ignore
      }
    });
    synthNodesRef.current = [];
  };

  const startProceduralSynth = (mode) => {
    stopSynth();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioCtx();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const masterGain = ctx.createGain();
    masterGain.gain.value = isMuted ? 0 : volume * 0.35;
    masterGain.connect(ctx.destination);
    gainNodeRef.current = masterGain;

    if (mode === 'synth_drone') {
      const freqs = [130.81, 196.0, 329.63];
      freqs.forEach((f) => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        osc.type = 'sine';
        osc.frequency.value = f;
        filter.type = 'lowpass';
        filter.frequency.value = 420;
        osc.connect(filter);
        filter.connect(masterGain);
        osc.start();
        synthNodesRef.current.push(osc, filter);
      });
    } else if (mode === 'synth_rain') {
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 850;

      whiteNoise.connect(filter);
      filter.connect(masterGain);
      whiteNoise.start();
      synthNodesRef.current.push(whiteNoise, filter);
    }
  };

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = 'anonymous';
    }
    const audio = audioRef.current;

    if (!isPlaying) {
      audio.pause();
      stopSynth();
      return;
    }

    if (currentStation.type === 'stream') {
      stopSynth();
      audio.src = currentStation.url;
      audio.volume = isMuted ? 0 : volume;
      audio.play().catch(() => {
        startProceduralSynth('synth_drone');
      });
    } else {
      audio.pause();
      startProceduralSynth(currentStation.type);
    }

    return () => {
      audio.pause();
      stopSynth();
    };
  }, [isPlaying, stationIdx]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume * 0.35;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (!isPlaying) {
      setBars([18, 22, 18, 25, 20, 18, 24, 18, 22, 20, 18, 20]);
      return;
    }
    const interval = setInterval(() => {
      setBars((prev) => prev.map(() => Math.floor(Math.random() * 75) + 20));
    }, 140);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleNextStation = () => {
    setStationIdx((prev) => (prev + 1) % RADIO_STATIONS.length);
    if (!isPlaying) setIsPlaying(true);
  };

  // =========================================================================
  // 2. STATE & LOGIC PHÒNG TỰ HỌC REALTIME (CO-WORKING LOUNGE)
  // =========================================================================
  const [onlinePeers, setOnlinePeers] = useState(INITIAL_BOT_PEERS);
  const [cosmicNotes, setCosmicNotes] = useState(INITIAL_NOTES);
  const [noteInput, setNoteInput] = useState('');
  const [floatingReactions, setFloatingReactions] = useState([]);
  const channelRef = useRef(null);

  const userProfile = currentUser || authService.getCurrentUser() || {
    id: 'guest_astronaut',
    name: 'Phan Tiến Thành',
    email: 'astronaut@sat.space',
    targetScore: 1580,
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase.channel('sat_cosmic_lounge', {
      config: { presence: { key: userProfile.id || 'user' } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const liveUsers = Object.values(state)
          .flat()
          .map((u) => ({
            id: u.user_id || Math.random().toString(),
            name: u.name || 'Phi hành gia SAT',
            status: u.status || 'Đang luyện đề Digital SAT',
            target: u.target || 1550,
            avatar: (u.name || 'S').charAt(0).toUpperCase(),
          }));
        if (liveUsers.length > 0) {
          setOnlinePeers([...liveUsers, ...INITIAL_BOT_PEERS.slice(0, 3)]);
        }
      })
      .on('broadcast', { event: 'reaction' }, ({ payload }) => {
        if (payload?.emoji) spawnReaction(payload.emoji);
      })
      .on('broadcast', { event: 'note' }, ({ payload }) => {
        if (payload?.note) {
          setCosmicNotes((prev) => [payload.note, ...prev.slice(0, 19)]);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userProfile.id,
            name: userProfile.name,
            status: 'Đang trực tuyến trên trạm SAT',
            target: userProfile.targetScore || 1580,
          });
        }
      });

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile.id, userProfile.name]);

  const spawnReaction = (emoji) => {
    const id = `${Date.now()}_${Math.random()}`;
    const randomX = Math.floor(Math.random() * 160) - 80;
    setFloatingReactions((prev) => [...prev, { id, emoji, x: randomX }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2200);
  };

  const handleSendReaction = (emoji) => {
    spawnReaction(emoji);
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'reaction',
        payload: { emoji },
      });
    }
  };

  const handleSendCosmicNote = (e) => {
    e.preventDefault();
    const clean = noteInput.trim();
    if (!clean) return;
    const newNote = {
      id: `note_${Date.now()}`,
      author: userProfile.name || 'Phi hành gia',
      text: clean,
      time: 'Vừa xong',
    };
    setCosmicNotes((prev) => [newNote, ...prev.slice(0, 19)]);
    setNoteInput('');
    handleSendReaction('🚀');

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'note',
        payload: { note: newNote },
      });
    }
  };

  // =========================================================================
  // 3. STATE & LOGIC THẺ CĂN CƯỚC PHI HÀNH GIA 3D HOLOGRAM (3D TILT CARD)
  // =========================================================================
  const cardRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 260, damping: 22 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [16, -16]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-16, 16]), springConfig);
  const glareX = useTransform(mouseX, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(mouseY, [-0.5, 0.5], ['0%', '100%']);

  const handleCardMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleCardMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const stats = storageService.getDashboardStats ? storageService.getDashboardStats() : {};
  const highestSatScore = stats?.highestScore || userProfile?.targetScore || 1580;
  const astronautRank =
    highestSatScore >= 1550
      ? 'GRAND ADMIRAL (1550+)'
      : highestSatScore >= 1450
      ? 'STAR COMMANDER (1450+)'
      : 'GALACTIC CADET';

  return (
    <div className="fixed bottom-4 left-4 z-40 font-sans select-none">
      {/* CÁC EMOJI BAY LÊN TỪ TRẠM KẾT NỐI REALTIME */}
      <div className="pointer-events-none fixed bottom-20 left-16 z-50">
        <AnimatePresence>
          {floatingReactions.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 1, y: 0, x: 0, scale: 0.7 }}
              animate={{ opacity: 0, y: -180, x: item.x, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: 'easeOut' }}
              className="absolute text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]"
            >
              {item.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* POPUP PANELS */}
      <AnimatePresence mode="wait">
        {/* PANEL 1: TRẠM PHÁT THANH LOFI VŨ TRỤ */}
        {activePanel === 'radio' && (
          <motion.div
            key="panel-radio"
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.94 }}
            transition={{ duration: 0.2 }}
            className="mb-3 w-80 rounded-3xl bg-slate-950/90 backdrop-blur-2xl border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.75)] p-5 text-white overflow-hidden relative"
          >
            <div className={`absolute -top-20 -right-20 w-44 h-44 rounded-full bg-gradient-to-br ${currentStation.accent} opacity-20 blur-3xl pointer-events-none`} />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Disc className={`w-5 h-5 text-cyan-400 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 block">
                    COSMIC AUDIO DECK • {currentStation.freq}
                  </span>
                  <h4 className="text-xs font-extrabold text-white">{currentStation.name}</h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="h-14 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-2 flex items-end justify-between gap-1.5 mb-4">
              {bars.map((heightPct, idx) => (
                <motion.div
                  key={idx}
                  animate={{ height: `${isPlaying ? heightPct : 18}%` }}
                  transition={{ duration: 0.12 }}
                  className={`flex-1 rounded-full bg-gradient-to-t ${currentStation.accent}`}
                />
              ))}
            </div>

            <div className="space-y-1.5 mb-4">
              {RADIO_STATIONS.map((st, idx) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setStationIdx(idx);
                    setIsPlaying(true);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between transition cursor-pointer border ${
                    stationIdx === idx
                      ? 'bg-white/15 border-cyan-400/40 text-white font-bold'
                      : 'bg-white/[0.03] border-transparent text-slate-400 hover:bg-white/[0.07] hover:text-slate-200'
                  }`}
                >
                  <div>
                    <div className="text-[11px]">{st.name}</div>
                    <div className="text-[9px] text-slate-400">{st.subtitle}</div>
                  </div>
                  <span className="font-mono text-[10px] text-cyan-300">{st.freq}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-9 h-9 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/30 transition cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleNextStation}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                  title="Đổi tần số phát"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 flex-1 max-w-[130px]">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-300" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setIsMuted(false);
                    setVolume(Number(e.target.value));
                  }}
                  className="w-full accent-cyan-400 cursor-pointer h-1"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* PANEL 2: PHÒNG TỰ HỌC THỜI GIAN THỰC */}
        {activePanel === 'lounge' && (
          <motion.div
            key="panel-lounge"
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.94 }}
            transition={{ duration: 0.2 }}
            className="mb-3 w-80 sm:w-96 rounded-3xl bg-slate-950/90 backdrop-blur-2xl border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.75)] p-5 text-white space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">
                    Trạm Tự Học Liên Sao ({onlinePeers.length + 14} Online)
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Kết nối thời gian thực cùng các phi hành gia SAT
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
              {onlinePeers.map((peer) => (
                <div
                  key={peer.id}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                      {peer.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-white text-[11px]">{peer.name}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[155px]">{peer.status}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-[10px] font-mono font-bold text-indigo-300">
                    Aim {peer.target}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                Tín hiệu truyền về từ Vũ trụ
              </span>
              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                {cosmicNotes.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-[11px]">
                    <div className="flex items-center justify-between text-[10px] text-cyan-300 font-bold mb-0.5">
                      <span>@{n.author}</span>
                      <span className="text-slate-500 font-normal">{n.time}</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed">{n.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendCosmicNote} className="flex items-center gap-2">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Gửi thông điệp cổ vũ vào vũ trụ..."
                className="flex-1 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 focus:border-cyan-400 text-xs text-white placeholder:text-slate-500 outline-none"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-[10px] text-slate-400 font-medium">Thả năng lượng:</span>
              <div className="flex items-center gap-2">
                {['🚀', '🔥', '❤️', '⚡', '🎯', '🌟'].map((emo) => (
                  <motion.button
                    key={emo}
                    whileHover={{ scale: 1.25 }}
                    whileTap={{ scale: 0.85 }}
                    type="button"
                    onClick={() => handleSendReaction(emo)}
                    className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/15 flex items-center justify-center text-sm cursor-pointer transition"
                  >
                    {emo}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* PANEL 3: THẺ CĂN CƯỚC PHI HÀNH GIA 3D HOLOGRAM */}
        {activePanel === 'idcard' && (
          <motion.div
            key="panel-idcard"
            initial={{ opacity: 0, y: 18, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.92 }}
            transition={{ duration: 0.22 }}
            style={{ perspective: 1200 }}
            className="mb-3"
          >
            <motion.div
              ref={cardRef}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              style={{
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
              }}
              className="w-80 sm:w-96 rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border border-cyan-400/40 shadow-[0_25px_70px_rgba(14,165,233,0.3)] text-white relative overflow-hidden cursor-grab active:cursor-grabbing"
            >
              <motion.div
                style={{
                  background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(56,189,248,0.28), rgba(168,85,247,0.18), transparent 70%)`,
                }}
                className="absolute inset-0 pointer-events-none z-10 mix-blend-screen"
              />

              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
                  backgroundSize: '24px 24px',
                }}
              />

              <div className="relative z-20 flex items-center justify-between border-b border-white/15 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-cyan-400 animate-spin" style={{ animationDuration: '12s' }} />
                  <div>
                    <span className="text-[9px] font-mono tracking-[0.25em] text-cyan-300 block">
                      INTERGALACTIC SAT CORPS
                    </span>
                    <h4 className="text-xs font-black tracking-wider text-white uppercase">
                      ASTRONAUT HOLOGRAPHIC PASS
                    </h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePanel(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative z-20 flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-cyan-500/30 shrink-0">
                  <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center font-black text-2xl text-cyan-300">
                    {(userProfile.name || 'P').charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-300/30 text-amber-300 text-[9px] font-mono font-bold mb-1">
                    <Sparkles className="w-2.5 h-2.5" /> {astronautRank}
                  </div>
                  <h3 className="text-base font-black text-white truncate">
                    {userProfile.name || 'Phan Tiến Thành'}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400 truncate">
                    ID: #SAT-{String(userProfile.id || '2027').slice(-4).toUpperCase()}-VN
                  </p>
                </div>
              </div>

              <div className="relative z-20 grid grid-cols-3 gap-2.5 mb-4">
                <div className="p-2.5 rounded-2xl bg-white/[0.06] border border-white/10 text-center">
                  <span className="text-[9px] font-mono uppercase text-slate-400 block">MAX RECORD</span>
                  <span className="text-sm font-black font-mono text-cyan-300">{highestSatScore}</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-white/[0.06] border border-white/10 text-center">
                  <span className="text-[9px] font-mono uppercase text-slate-400 block">MISSIONS</span>
                  <span className="text-sm font-black font-mono text-indigo-300">
                    {stats?.totalTests || 12} Đề
                  </span>
                </div>
                <div className="p-2.5 rounded-2xl bg-white/[0.06] border border-white/10 text-center">
                  <span className="text-[9px] font-mono uppercase text-slate-400 block">ACCURACY</span>
                  <span className="text-sm font-black font-mono text-emerald-300">
                    {stats?.overallAccuracy || 96}%
                  </span>
                </div>
              </div>

              <div className="relative z-20 flex items-center justify-between pt-3 border-t border-white/15 text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-1.5 text-emerald-300">
                  <ShieldCheck className="w-4 h-4" />
                  <span>CLEARANCE: LEVEL 5 (IT1-HUST)</span>
                </div>
                <QrCode className="w-5 h-5 text-cyan-300/80" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* THANH DOCK ĐIỀU KHIỂN CHÍNH */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-white/15 shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => setActivePanel(activePanel === 'radio' ? null : 'radio')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activePanel === 'radio'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
              : isPlaying
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
          title="Trạm phát thanh Lofi Vũ trụ"
        >
          <Radio className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
          <span className="hidden sm:inline">Cosmic FM</span>
          {isPlaying && (
            <span className="flex items-end gap-0.5 h-3">
              <span className="w-0.5 h-full bg-current animate-bounce" />
              <span className="w-0.5 h-2/3 bg-current animate-bounce" style={{ animationDelay: '0.15s' }} />
              <span className="w-0.5 h-4/5 bg-current animate-bounce" style={{ animationDelay: '0.3s' }} />
            </span>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => setActivePanel(activePanel === 'lounge' ? null : 'lounge')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activePanel === 'lounge'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
          title="Phòng tự học thời gian thực"
        >
          <div className="relative">
            <Users className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
          </div>
          <span className="hidden sm:inline">{onlinePeers.length + 14} Online</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => setActivePanel(activePanel === 'idcard' ? null : 'idcard')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activePanel === 'idcard'
              ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md shadow-amber-500/30'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
          title="Thẻ căn cước Phi hành gia Hologram 3D"
        >
          <CreditCard className="w-4 h-4" />
          <span className="hidden sm:inline">3D Holo ID</span>
        </motion.button>
      </div>
    </div>
  );
}
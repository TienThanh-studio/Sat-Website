// src/pages/CosmicLandingPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Rocket,
  Radio,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  QrCode,
  X,
  Disc,
  CreditCard,
  Compass,
  Link2,
  Wifi,
  ChevronUp,
} from 'lucide-react';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';

const CUSTOM_NEBULA_BG_URL =
  'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=2048&q=85';

const DEFAULT_RADIO_STATIONS = [
  {
    id: 'custom_1',
    name: 'Bài hát yêu thích của tôi #1',
    subtitle: 'Dán link .mp3 của bạn vào code hoặc ô bên dưới',
    freq: '99.9 FM',
    type: 'stream',
    url: 'https://streams.fluxfm.de/Chillhop/mp3-128/streams.fluxfm.de/',
    accent: 'from-cyan-400 to-indigo-500',
  },
  {
    id: 'lofi_chill',
    name: 'Cosmic Lofi Study Beats',
    subtitle: '24/7 Chillhop Radio Stream',
    freq: '88.5 FM',
    type: 'stream',
    url: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    accent: 'from-amber-400 to-purple-500',
  },
  {
    id: 'deep_space',
    name: 'Deep Space Drone (Offline Synth)',
    subtitle: 'Tự sinh âm thanh vũ trụ không cần mạng',
    freq: '104.2 FM',
    type: 'synth_drone',
    url: '',
    accent: 'from-violet-500 to-fuchsia-400',
  },
  {
    id: 'cosmic_rain',
    name: 'Starship Rain & Pink Noise',
    subtitle: 'Tiếng mưa rơi trên kính tàu vũ trụ',
    freq: '96.8 FM',
    type: 'synth_rain',
    url: '',
    accent: 'from-emerald-400 to-teal-500',
  },
];

// ============================================================================
// MINI FLOATING ORB DOCK Ở GÓC PHẢI DƯỚI (SIÊU GỌN, KHÔNG CHE GIAO DIỆN)
// ============================================================================
export function CosmicHubDock({ currentUser }) {
  const [isDockExpanded, setIsDockExpanded] = useState(false);
  const [activePanel, setActivePanel] = useState(null); // null | 'radio' | 'idcard'

  const [stations, setStations] = useState(() => {
    try {
      const saved = localStorage.getItem('sat_custom_stations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_RADIO_STATIONS;
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [stationIdx, setStationIdx] = useState(0);
  const [volume, setVolume] = useState(0.6);
  const [isMuted, setIsMuted] = useState(false);
  const [bars, setBars] = useState([20, 35, 50, 30, 60, 40, 25, 45, 70, 30, 50, 25]);

  const [customSongTitle, setCustomSongTitle] = useState('');
  const [customSongUrl, setCustomSongUrl] = useState('');
  const [showAddTrack, setShowAddTrack] = useState(false);

  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const synthNodesRef = useRef([]);
  const gainNodeRef = useRef(null);

  const currentStation = stations[stationIdx] || stations[0];

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
      audioRef.current.loop = true;
    }
    const audio = audioRef.current;

    if (!isPlaying) {
      audio.pause();
      stopSynth();
      return;
    }

    if (currentStation.type === 'stream' && currentStation.url) {
      stopSynth();
      audio.src = currentStation.url;
      audio.volume = isMuted ? 0 : volume;
      audio.play().catch(() => {
        startProceduralSynth('synth_drone');
      });
    } else {
      audio.pause();
      startProceduralSynth(currentStation.type || 'synth_drone');
    }

    return () => {
      audio.pause();
      stopSynth();
    };
  }, [isPlaying, stationIdx, stations]);

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
    setStationIdx((prev) => (prev + 1) % stations.length);
    if (!isPlaying) setIsPlaying(true);
  };

  const handleAddCustomTrack = (e) => {
    e.preventDefault();
    const cleanUrl = customSongUrl.trim();
    if (!cleanUrl) return;
    const newStation = {
      id: `user_track_${Date.now()}`,
      name: customSongTitle.trim() || 'Giai điệu Vũ trụ của tôi',
      subtitle: 'Custom Audio Link',
      freq: '108.0 FM',
      type: 'stream',
      url: cleanUrl,
      accent: 'from-pink-500 to-amber-400',
    };
    const updated = [newStation, ...stations];
    setStations(updated);
    try {
      localStorage.setItem('sat_custom_stations', JSON.stringify(updated));
    } catch {
      // ignore
    }
    setStationIdx(0);
    setIsPlaying(true);
    setCustomSongTitle('');
    setCustomSongUrl('');
    setShowAddTrack(false);
  };

  const userProfile = currentUser || (authService.getCurrentUser && authService.getCurrentUser()) || {
    id: '20091112',
    name: 'Phan Tiến Thành',
    email: 'astronaut@sat.space',
    targetScore: 1580,
  };

  const cardRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 260, damping: 22 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), springConfig);
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

  return (
    <div className="fixed bottom-4 right-4 z-40 font-sans select-none flex flex-col items-end">
      <AnimatePresence mode="wait">
        {/* PANEL 1: RADIO LOFI */}
        {activePanel === 'radio' && (
          <motion.div
            key="panel-radio"
            initial={{ opacity: 0, y: 14, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.94 }}
            transition={{ duration: 0.18 }}
            className="mb-3 w-80 rounded-3xl bg-slate-950/95 backdrop-blur-2xl border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.85)] p-5 text-white overflow-hidden relative"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Disc className={`w-5 h-5 text-cyan-400 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 block">
                    COSMIC AUDIO • {currentStation.freq}
                  </span>
                  <h4 className="text-xs font-extrabold text-white truncate max-w-[160px]">{currentStation.name}</h4>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowAddTrack(!showAddTrack)}
                  className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-300 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <Link2 className="w-3 h-3" />
                  <span>Gắn Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePanel(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showAddTrack && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddCustomTrack}
                  className="mb-3 p-3 rounded-2xl bg-white/[0.06] border border-cyan-400/30 space-y-2 overflow-hidden"
                >
                  <input
                    type="text"
                    value={customSongTitle}
                    onChange={(e) => setCustomSongTitle(e.target.value)}
                    placeholder="Tên bài hát..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-white/15 text-[11px] text-white outline-none"
                  />
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      required
                      value={customSongUrl}
                      onChange={(e) => setCustomSongUrl(e.target.value)}
                      placeholder="https://.../music.mp3"
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-white/15 text-[11px] text-white outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-extrabold text-[11px] cursor-pointer"
                    >
                      Phát
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="h-11 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-2 flex items-end justify-between gap-1.5 mb-3">
              {bars.map((heightPct, idx) => (
                <motion.div
                  key={idx}
                  animate={{ height: `${isPlaying ? heightPct : 18}%` }}
                  transition={{ duration: 0.12 }}
                  className={`flex-1 rounded-full bg-gradient-to-t ${currentStation.accent}`}
                />
              ))}
            </div>

            <div className="space-y-1.5 mb-4 max-h-32 overflow-y-auto pr-1">
              {stations.map((st, idx) => (
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
                      : 'bg-white/[0.03] border-transparent text-slate-400 hover:bg-white/[0.07]'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="text-[11px] truncate">{st.name}</div>
                  </div>
                  <span className="font-mono text-[10px] text-cyan-300 shrink-0">{st.freq}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-9 h-9 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleNextStation}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 flex-1 max-w-[120px]">
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

        {/* PANEL 2: THẺ THÔNG HÀNH VẬT LÝ */}
        {activePanel === 'idcard' && (
          <motion.div
            key="panel-idcard"
            initial={{ opacity: 0, y: 18, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.92 }}
            transition={{ duration: 0.22 }}
            style={{ perspective: 1400 }}
            className="mb-3"
          >
            <motion.div
              ref={cardRef}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
              className="w-[340px] sm:w-[380px] rounded-[22px] bg-gradient-to-br from-[#0e1726] via-[#090d16] to-[#111c35] border border-white/25 shadow-[0_30px_80px_rgba(0,0,0,0.9)] text-white relative overflow-hidden cursor-grab"
            >
              <div className="flex justify-center pt-2.5 pb-1 relative z-20">
                <div className="w-16 h-2.5 rounded-full bg-[#030611] border border-white/20 flex items-center justify-center">
                  <div className="w-8 h-1 rounded-full bg-slate-700/60" />
                </div>
              </div>

              <motion.div
                style={{
                  background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(56,189,248,0.32), rgba(232,121,249,0.22), transparent 68%)`,
                }}
                className="absolute inset-0 pointer-events-none z-10 mix-blend-color-dodge"
              />

              <div className="relative z-20 px-5 py-2.5 bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 border-y border-white/15 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-300" />
                  <div>
                    <div className="text-[8px] font-mono tracking-[0.25em] text-cyan-300 uppercase font-bold">
                      UNITED GALACTIC EXAM AUTHORITY
                    </div>
                    <div className="text-[11px] font-black tracking-wider text-white uppercase">
                      DIPLOMATIC & ASTRONAUT PASS
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePanel(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative z-20 p-5 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-2.5 shrink-0">
                    <div className="w-20 h-24 rounded-xl bg-gradient-to-b from-slate-800 to-slate-950 border-2 border-cyan-400/50 relative overflow-hidden flex flex-col items-center justify-end">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-400 flex items-center justify-center text-slate-950 font-black text-xl mb-1">
                        {(userProfile.name || 'P').charAt(0).toUpperCase()}
                      </div>
                      <div className="w-16 h-7 rounded-t-2xl bg-gradient-to-r from-indigo-600 to-cyan-600" />
                      <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[7px] font-mono text-center py-0.5 text-cyan-300">
                        VERIFIED
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 border border-amber-100/80 p-1 grid grid-cols-3 gap-0.5">
                        <div className="border border-amber-900/40 rounded-[1px]" />
                        <div className="border border-amber-900/40 rounded-[1px]" />
                        <div className="border border-amber-900/40 rounded-[1px]" />
                        <div className="border border-amber-900/40 rounded-[1px]" />
                        <div className="bg-amber-900/20 rounded-[1px]" />
                        <div className="border border-amber-900/40 rounded-[1px]" />
                      </div>
                      <Wifi className="w-3.5 h-3.5 text-slate-400 rotate-90" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <span className="text-[8px] font-mono uppercase text-slate-400 block">
                        FULL NAME / HỌ VÀ TÊN
                      </span>
                      <div className="text-sm font-black tracking-wide text-white uppercase truncate">
                        {localStorage.getItem('sat_custom_display_name') || userProfile.name || 'PHAN TIẾN THÀNH'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[8px] font-mono uppercase text-slate-400 block">PASS NO.</span>
                        <span className="text-[11px] font-mono font-bold text-cyan-300">VN-2009-1580</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-mono uppercase text-slate-400 block">CLEARANCE</span>
                        <span className="text-[11px] font-mono font-bold text-amber-300">CLASS-S (VIP)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[8px] font-mono uppercase text-slate-400 block">SAT RECORD</span>
                        <span className="text-xs font-mono font-black text-emerald-400">{highestSatScore} / 1600</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-mono uppercase text-slate-400 block">DESTINATION</span>
                        <span className="text-[11px] font-mono font-bold text-indigo-300">HUST • IT1/E10</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/15 bg-slate-950/70 -mx-5 -mb-5 px-5 py-2 font-mono text-[8px] text-cyan-400/80 flex items-center justify-between">
                  <span className="tracking-[0.2em] truncate">
                    SAT1580VNM0911128M2706015HUSTIT1&lt;&lt;&lt;&lt;08
                  </span>
                  <QrCode className="w-4 h-4 text-cyan-400 shrink-0" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NÚT MINI TRÒN GỌN GÀNG Ở GÓC PHẢI DƯỚI (KHÔNG CHE GIAO DIỆN) */}
      {!isDockExpanded && !activePanel ? (
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          type="button"
          onClick={() => setIsDockExpanded(true)}
          title="Mở Trạm Âm Nhạc Cosmic FM & Thẻ Thông Hành"
          className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg border transition cursor-pointer ${
            isPlaying
              ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-cyan-500/40'
              : 'bg-slate-900/85 hover:bg-slate-800 text-cyan-300 border-cyan-400/35 shadow-black/60'
          }`}
        >
          <Radio className={`w-5 h-5 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
        </motion.button>
      ) : (
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-white/20 shadow-2xl">
          <button
            type="button"
            onClick={() => setActivePanel(activePanel === 'radio' ? null : 'radio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activePanel === 'radio'
                ? 'bg-cyan-500 text-slate-950'
                : isPlaying
                ? 'bg-cyan-500/20 text-cyan-300'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Cosmic FM</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePanel(activePanel === 'idcard' ? null : 'idcard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activePanel === 'idcard'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Thẻ Thông Hành</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePanel(null);
              setIsDockExpanded(false);
            }}
            title="Thu nhỏ thành nút tròn"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TRANG SẢNH VŨ TRỤ NEBULA + SAO BAY + TÀU CHIẾN HẠM SAT
// ============================================================================
export default function CosmicLandingPage({
  onLoginSuccess,
  onStartGuest,
  onEnterApp,
}) {
  const canvasRef = useRef(null);
  const [authMode, setAuthMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warpSpeed, setWarpSpeed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let centerX = width / 2;
    let centerY = height / 2;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      centerX = width / 2;
      centerY = height / 2;
    };
    window.addEventListener('resize', handleResize);

    const NUM_STARS = 450;
    const stars = Array.from({ length: NUM_STARS }, () => ({
      x: (Math.random() - 0.5) * width * 2.2,
      y: (Math.random() - 0.5) * height * 2.2,
      z: Math.random() * width,
      size: Math.random() * 2 + 0.5,
      color: ['#ffffff', '#7dd3fc', '#f0abfc', '#fde68a', '#bae6fd'][
        Math.floor(Math.random() * 5)
      ],
      twinkleSpeed: Math.random() * 0.04 + 0.01,
      twinklePhase: Math.random() * Math.PI * 2,
    }));

    let shootingStar = null;
    const spawnShootingStar = () => {
      if (Math.random() < 0.015 && !shootingStar) {
        shootingStar = {
          x: Math.random() * width,
          y: Math.random() * (height * 0.55),
          vx: -(Math.random() * 11 + 8),
          vy: Math.random() * 6 + 4,
          len: Math.random() * 95 + 65,
          alpha: 1,
        };
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const speed = warpSpeed ? 28 : 2.0;
      const rotationAngle = warpSpeed ? 0.006 : 0.0015;
      const cosA = Math.cos(rotationAngle);
      const sinA = Math.sin(rotationAngle);

      for (let i = 0; i < NUM_STARS; i++) {
        const star = stars[i];
        const rx = star.x * cosA - star.y * sinA;
        const ry = star.x * sinA + star.y * cosA;
        star.x = rx;
        star.y = ry;

        const prevZ = star.z;
        star.z -= speed;

        if (star.z <= 1) {
          star.z = width;
          star.x = (Math.random() - 0.5) * width * 2.2;
          star.y = (Math.random() - 0.5) * height * 2.2;
          continue;
        }

        const sx = (star.x / star.z) * (width * 0.65) + centerX;
        const sy = (star.y / star.z) * (width * 0.65) + centerY;
        const px = (star.x / prevZ) * (width * 0.65) + centerX;
        const py = (star.y / prevZ) * (width * 0.65) + centerY;

        if (sx < 0 || sx > width || sy < 0 || sy > height) continue;

        const depthRatio = 1 - star.z / width;
        const radius = Math.max(0.5, depthRatio * star.size * 2.2);

        star.twinklePhase += star.twinkleSpeed;
        const twinkle = 0.65 + 0.35 * Math.sin(star.twinklePhase);

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = star.color;
        ctx.globalAlpha = Math.min(1, depthRatio * twinkle);
        ctx.lineWidth = warpSpeed ? radius * 1.4 : radius * 0.9;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.fill();
      }

      spawnShootingStar();
      if (shootingStar) {
        ctx.save();
        ctx.globalAlpha = shootingStar.alpha;
        const grad = ctx.createLinearGradient(
          shootingStar.x,
          shootingStar.y,
          shootingStar.x - shootingStar.vx * 4,
          shootingStar.y - shootingStar.vy * 4
        );
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(shootingStar.x, shootingStar.y);
        ctx.lineTo(
          shootingStar.x + (shootingStar.len * -shootingStar.vx) / 12,
          shootingStar.y + (shootingStar.len * -shootingStar.vy) / 12
        );
        ctx.stroke();
        ctx.restore();

        shootingStar.x += shootingStar.vx;
        shootingStar.y += shootingStar.vy;
        shootingStar.alpha -= 0.022;
        if (shootingStar.alpha <= 0) shootingStar = null;
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [warpSpeed]);

  const notifyAuthComplete = (user) => {
    setWarpSpeed(true);
    setTimeout(() => {
      if (typeof onLoginSuccess === 'function') onLoginSuccess(user);
      else if (typeof onEnterApp === 'function') onEnterApp(user);
      else if (typeof onStartGuest === 'function') onStartGuest(user);
      else window.location.reload();
    }, 380);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      if (authMode === 'register') {
        const { user } = await authService.register({ name, email, password, targetScore: 1580 });
        notifyAuthComplete(user);
      } else {
        const { user } = await authService.login(email, password);
        notifyAuthComplete(user);
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Vui lòng kiểm tra lại thông tin.');
      setIsSubmitting(false);
    }
  };

  const handleQuickEnter = () => {
    const guest = authService.loginAsGuest();
    notifyAuthComplete(guest);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#04060e] select-none font-sans flex items-center justify-center">
      <motion.div
        animate={{ scale: [1, 1.08, 1], rotate: [0, 1.2, 0] }}
        transition={{ duration: 35, repeat: Infinity, ease: 'easeInOut' }}
        className="fixed inset-0 z-0 pointer-events-none"
      >
        <div
          className="absolute inset-0 bg-cover bg-center opacity-75"
          style={{ backgroundImage: `url('${CUSTOM_NEBULA_BG_URL}')` }}
        />
        <div
          className="absolute inset-0 mix-blend-color-dodge opacity-85"
          style={{
            background: `
              radial-gradient(circle at 60% 25%, rgba(232, 121, 249, 0.55) 0%, rgba(168, 85, 247, 0.25) 25%, transparent 55%),
              radial-gradient(circle at 28% 48%, rgba(244, 114, 182, 0.45) 0%, rgba(217, 119, 6, 0.35) 30%, transparent 60%),
              radial-gradient(circle at 38% 78%, rgba(56, 189, 248, 0.5) 0%, rgba(232, 121, 249, 0.3) 25%, transparent 55%),
              radial-gradient(ellipse at 75% 65%, rgba(217, 119, 6, 0.45) 0%, rgba(180, 83, 9, 0.25) 35%, transparent 65%),
              radial-gradient(ellipse at 20% 20%, rgba(14, 165, 233, 0.4) 0%, transparent 50%)
            `,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(4,6,14,0.15)_0%,rgba(4,6,14,0.72)_100%)]" />
      </motion.div>

      <canvas ref={canvasRef} className="fixed inset-0 z-10 pointer-events-none" />

      <motion.div
        animate={{
          x: ['-38vw', '38vw', '-38vw'],
          y: ['-24vh', '20vh', '-24vh'],
          rotate: [8, -12, 8],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
        className="fixed z-10 pointer-events-none opacity-95"
      >
        <div className="relative flex items-center">
          <motion.div
            animate={{ scaleX: [0.85, 1.4, 0.85], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 0.35, repeat: Infinity }}
            className="w-28 h-3.5 rounded-full bg-gradient-to-l from-cyan-300 via-fuchsia-500 to-transparent blur-[3px] -mr-3"
          />
          <svg
            width="175"
            height="78"
            viewBox="0 0 170 76"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_0_24px_rgba(56,189,248,0.75)]"
          >
            <polygon points="25,14 95,28 70,6" fill="url(#wingGrad)" stroke="#38bdf8" strokeWidth="1.2" />
            <polygon points="25,62 95,48 70,70" fill="url(#wingGrad)" stroke="#38bdf8" strokeWidth="1.2" />
            <polygon points="10,38 45,22 158,38 45,54" fill="url(#hullGrad)" stroke="#7dd3fc" strokeWidth="1.5" />
            <ellipse cx="92" cy="38" rx="18" ry="6" fill="#0284c7" fillOpacity="0.55" stroke="#bae6fd" strokeWidth="1.2" />
            <text x="60" y="42" fill="#ffffff" fontSize="12" fontWeight="900" letterSpacing="3" fontFamily="monospace">
              SAT
            </text>
            <circle cx="154" cy="38" r="2.8" fill="#fde047" />
            <defs>
              <linearGradient id="hullGrad" x1="10" y1="38" x2="158" y2="38" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0f172a" />
                <stop offset="0.5" stopColor="#1e293b" />
                <stop offset="1" stopColor="#475569" />
              </linearGradient>
              <linearGradient id="wingGrad" x1="25" y1="10" x2="95" y2="65" gradientUnits="userSpaceOnUse">
                <stop stopColor="#311042" />
                <stop offset="1" stopColor="#0f172a" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-20 w-full max-w-[330px] mx-4 rounded-3xl bg-slate-950/45 hover:bg-slate-950/65 backdrop-blur-md border border-white/15 hover:border-cyan-400/40 shadow-[0_0_60px_rgba(0,0,0,0.65)] p-6 transition-all duration-300"
      >
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.25em] text-amber-300 mb-1">
            <Sparkles className="w-3 h-3" /> SAT GALAXY
          </div>
          <h1 className="text-base font-extrabold text-white tracking-wide">
            {authMode === 'login' ? 'Cổng Không Gian SAT' : 'Gia Nhập Phi Đội SAT'}
          </h1>
        </div>

        <div className="flex p-0.5 rounded-xl bg-white/[0.06] border border-white/[0.1] mb-4 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              authMode === 'login'
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setErrorMsg('');
            }}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              authMode === 'register'
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Tạo tài khoản
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-[11px] text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {authMode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative overflow-hidden"
              >
                <User className="w-3.5 h-3.5 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required={authMode === 'register'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tên phi hành gia..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.07] border border-white/15 focus:border-cyan-400/70 text-xs text-white placeholder:text-slate-300/70 outline-none transition"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="w-3.5 h-3.5 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.07] border border-white/15 focus:border-cyan-400/70 text-xs text-white placeholder:text-slate-300/70 outline-none transition"
            />
          </div>

          <div className="relative">
            <Lock className="w-3.5 h-3.5 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu..."
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-white/[0.07] border border-white/15 focus:border-cyan-400/70 text-xs text-white placeholder:text-slate-300/70 outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/25 border border-cyan-300/40 transition cursor-pointer mt-1"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Đang khởi hành...' : authMode === 'login' ? 'Khởi Hành (Login)' : 'Đăng Ký'}</span>
          </motion.button>
        </form>

        <button
          type="button"
          onClick={handleQuickEnter}
          className="mt-3 w-full py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/15 text-[11px] font-semibold text-slate-200 hover:text-white flex items-center justify-center gap-1 transition cursor-pointer"
        >
          <span>Bay thẳng vào Phòng Thi</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </motion.div>

      <CosmicHubDock />
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { KeyRound, ArrowRight, Play, Terminal, Sparkles } from 'lucide-react';
import ActivationCodeModal from '../components/auth/ActivationCodeModal';

export default function DashboardPage({ onNavigate }) {
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [isActivated, setIsActivated] = useState(() => Boolean(localStorage.getItem('sat_activated_key')));

  // Hiệu ứng chữ Typewriter
  const fullWelcomeText = "WELCOME TO OUR SAT SYSTEM";
  const [displayedText, setDisplayedText] = useState("");
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (charIndex < fullWelcomeText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + fullWelcomeText[charIndex]);
        setCharIndex(c => c + 1);
      }, 70);
      return () => clearTimeout(timeout);
    }
  }, [charIndex]);

  // Canvas nền sao Pixel phủ kín trang chủ
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    let width = (canvas.width = canvas.parentElement.offsetWidth);
    let height = (canvas.height = canvas.parentElement.offsetHeight);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    const stars = Array.from({ length: 140 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.floor(Math.random() * 3) + 2,
      speedY: Math.random() * 0.5 + 0.2,
      opacity: Math.random(),
      blinkSpeed: Math.random() * 0.03 + 0.01,
      color: ['#ffffff', '#60a5fa', '#a78bfa', '#fde047', '#34d399'][Math.floor(Math.random() * 5)]
    }));

    const render = () => {
      ctx.fillStyle = '#060814';
      ctx.fillRect(0, 0, width, height);

      // Lưới pixel scanline
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
      ctx.lineWidth = 1;
      const gridSize = 36;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      stars.forEach(s => {
        s.y += s.speedY;
        if (s.y > height) s.y = 0;

        s.opacity += s.blinkSpeed;
        if (s.opacity > 1 || s.opacity < 0.2) s.blinkSpeed = -s.blinkSpeed;

        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0.2, Math.min(1, s.opacity));
        ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
      });
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="relative w-full min-h-[calc(100vh-4rem)] p-6 md:p-10 flex flex-col justify-between font-mono select-none overflow-hidden">
      {/* Nền Pixel Canvas phủ toàn bộ màn hình trang chủ */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Nội dung chính Pixel */}
      <div className="relative z-10 max-w-4xl space-y-6">
        
        {/* Terminal Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-950/80 border-2 border-indigo-400 text-indigo-300 text-xs font-bold tracking-widest uppercase shadow-[3px_3px_0px_0px_rgba(129,140,248,0.5)]">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>[ DIGITAL_SAT_SYSTEM // v2.6 ]</span>
        </div>

        {/* Dòng chữ WELCOME TO OUR SAT SYSTEM */}
        <div className="min-h-[50px] flex items-center">
          <h1 className="text-2xl sm:text-4xl font-black text-emerald-400 tracking-wider drop-shadow-[0_0_15px_rgba(52,211,153,0.7)]">
            {displayedText}
            <span className="inline-block w-3 h-7 bg-emerald-400 ml-1.5 animate-pulse align-middle" />
          </h1>
        </div>

        <p className="text-xs sm:text-sm text-indigo-200/80 max-w-2xl leading-relaxed">
          Hệ sinh thái luyện thi SAT đa tầng thích ứng. Thuật toán phân nhánh câu hỏi bám sát ma trận College Board với công nghệ chấm điểm IRT.
        </p>

        {/* Ô VUÔNG PIXEL: NHẬP MÃ KÍCH HOẠT */}
        <div className="pt-4 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => setShowCodeModal(true)}
            className="p-4 px-6 bg-amber-500/15 hover:bg-amber-500/25 border-2 border-dashed border-amber-400 text-amber-300 hover:text-amber-200 text-xs sm:text-sm font-bold tracking-wider uppercase transition shadow-[4px_4px_0px_0px_rgba(245,158,11,0.6)] flex items-center gap-3 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
          >
            <KeyRound className="w-5 h-5 text-amber-400 animate-bounce" />
            <span>{isActivated ? '[ ĐÃ KÍCH HOẠT BẢN QUYỀN ]' : '▶ NHẬP MÃ KÍCH HOẠT ◀'}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate && onNavigate('bank')}
            className="p-4 px-6 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold tracking-wider uppercase transition border-2 border-blue-400 shadow-[4px_4px_0px_0px_rgba(59,130,246,0.6)] flex items-center gap-2 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
          >
            <span>VÀO NGÂN HÀNG ĐỀ</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2 Khối Lối vào Pixel dưới đáy */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        <div 
          onClick={() => onNavigate && onNavigate('bank')}
          className="p-6 bg-slate-950/80 border-2 border-indigo-500/80 hover:border-blue-400 transition cursor-pointer shadow-[4px_4px_0px_0px_rgba(99,102,241,0.5)] flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">[ READING & WRITING ]</span>
            <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition">
              Real-test Verbal Database
            </h3>
            <p className="text-xs text-slate-400">164 câu hỏi thực tế bám sát ma trận.</p>
          </div>
          <div className="w-10 h-10 border border-blue-400 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition">
            <Play className="w-4 h-4 fill-current" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate && onNavigate('bank')}
          className="p-6 bg-slate-950/80 border-2 border-indigo-500/80 hover:border-emerald-400 transition cursor-pointer shadow-[4px_4px_0px_0px_rgba(99,102,241,0.5)] flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">[ MATHEMATICS ]</span>
            <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
              Real-test Math Database
            </h3>
            <p className="text-xs text-slate-400">133 câu hỏi kèm hình học SVG & KaTeX.</p>
          </div>
          <div className="w-10 h-10 border border-emerald-400 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition">
            <Play className="w-4 h-4 fill-current" />
          </div>
        </div>
      </div>

      {/* Modal Kích Hoạt Mã */}
      <ActivationCodeModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        onSuccess={() => setIsActivated(true)}
      />
    </div>
  );
}
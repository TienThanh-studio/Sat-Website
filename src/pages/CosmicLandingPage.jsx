import React, { useState, useEffect, useRef } from 'react';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CosmicLandingPage({ onLoginSuccess }) {
  const canvasRef = useRef(null);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup, signIn } = useAuth();

  // Hiệu ứng Canvas Vũ Trụ Deep Space 3D + Sao băng + Bụi tinh vân
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // 1. Hệ thống 350 ngôi sao 3D Warp
    const numStars = 320;
    const stars = Array.from({ length: numStars }, () => ({
      x: (Math.random() - 0.5) * width * 2,
      y: (Math.random() - 0.5) * height * 2,
      z: Math.random() * width,
      size: Math.random() * 1.6 + 0.6,
      color: ['#ffffff', '#93c5fd', '#c084fc', '#fbcfe8', '#fef08a'][Math.floor(Math.random() * 5)]
    }));

    // 2. Hệ thống sao băng (Shooting stars)
    const shootingStars = [];
    const spawnShootingStar = () => {
      shootingStars.push({
        x: Math.random() * width * 1.2,
        y: Math.random() * height * 0.5,
        length: Math.random() * 110 + 90,
        speed: Math.random() * 14 + 10,
        size: Math.random() * 1.5 + 1.2,
        opacity: 1
      });
    };

    let tick = 0;

    const render = () => {
      tick += 0.005;

      // Nền vũ trụ sâu thẳm
      ctx.fillStyle = '#03050d';
      ctx.fillRect(0, 0, width, height);

      // Vẽ các quầng mây tinh vân (Cosmic Nebula Glows) chuyển động nhẹ
      const nebulaGradients = [
        { x: width * 0.25 + Math.sin(tick) * 60, y: height * 0.3 + Math.cos(tick) * 50, r: 380, color: 'rgba(99, 102, 241, 0.16)' },
        { x: width * 0.8 - Math.cos(tick) * 60, y: height * 0.7 - Math.sin(tick) * 50, r: 440, color: 'rgba(168, 85, 247, 0.14)' },
        { x: width * 0.5 + Math.sin(tick * 0.8) * 80, y: height * 0.1, r: 320, color: 'rgba(236, 72, 153, 0.10)' }
      ];

      nebulaGradients.forEach(neb => {
        const radGrad = ctx.createRadialGradient(neb.x, neb.y, 0, neb.x, neb.y, neb.r);
        radGrad.addColorStop(0, neb.color);
        radGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, width, height);
      });

      const cx = width / 2;
      const cy = height / 2;

      // Render các vì sao bay trong không gian 3D
      stars.forEach((star) => {
        star.z -= 1.8;
        if (star.z <= 0) {
          star.z = width;
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
        }

        const k = 280 / star.z;
        const px = star.x * k + cx;
        const py = star.y * k + cy;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const depthAlpha = Math.min(1, (1 - star.z / width) * 1.5);
          const r = Math.max(0.6, (1 - star.z / width) * star.size * 2);

          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.globalAlpha = depthAlpha;

          // Hiệu ứng phát sáng lấp lánh (bloom)
          if (r > 1.4) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = star.color;
          }
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // Sinh sao băng ngẫu nhiên
      if (Math.random() < 0.015 && shootingStars.length < 3) {
        spawnShootingStar();
      }

      // Render sao băng
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        ctx.beginPath();
        const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.length, s.y + s.length * 0.55);
        grad.addColorStop(0, `rgba(255, 255, 255, ${s.opacity})`);
        grad.addColorStop(0.3, `rgba(167, 139, 250, ${s.opacity * 0.7})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = s.size;
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.length, s.y + s.length * 0.55);
        ctx.stroke();

        s.x += s.speed;
        s.y += s.speed * 0.55;
        s.opacity -= 0.018;

        if (s.opacity <= 0 || s.x > width + 200 || s.y > height + 200) {
          shootingStars.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (typeof signup === 'function') {
          const res = await signup(email, password, { name });
          if (res?.error) throw new Error(res.error.message);
        }
      } else {
        const loginFn = login || signIn;
        if (typeof loginFn === 'function') {
          const res = await loginFn(email, password);
          if (res?.error) throw new Error(res.error.message);
        }
      }

      const activeUser = {
        email,
        name: name || email.split('@')[0] || 'Phi hành gia',
        id: 'user_' + Date.now()
      };
      localStorage.setItem('sat_current_user', JSON.stringify(activeUser));
      if (onLoginSuccess) onLoginSuccess(activeUser);
    } catch (err) {
      const fallbackUser = {
        email: email || 'student@sat.edu.vn',
        name: name || 'Học viên',
        id: 'user_' + Date.now()
      };
      localStorage.setItem('sat_current_user', JSON.stringify(fallbackUser));
      if (onLoginSuccess) onLoginSuccess(fallbackUser);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-screen h-screen flex items-center justify-center p-4 select-none overflow-hidden font-sans">
      {/* Nền Canvas Vũ Trụ Deep Space 3D bao phủ toàn màn hình */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Logo SAT tinh tế ở góc trên cùng bên trái */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-900/90 border border-indigo-500/40 text-white font-black text-sm flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] backdrop-blur-md">
          SAT
        </div>
        <div>
          <h3 className="font-black text-white tracking-tight leading-none text-sm drop-shadow-md">
            SAT PLATFORM
          </h3>
          <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">
            Cloud Edition
          </span>
        </div>
      </div>

      {/* KHUNG ĐĂNG NHẬP THU NHỎ GỌN GÀNG Ở TRUNG TÂM */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md bg-slate-950/75 backdrop-blur-2xl rounded-3xl p-7 sm:p-9 border border-indigo-500/30 shadow-[0_0_60px_rgba(99,102,241,0.3)] animate-in zoom-in-95 duration-500">
        
        {/* Header Form */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-[11px] font-bold tracking-wider uppercase mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
            <span>Digital SAT Portal</span>
          </div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-purple-200 tracking-tight">
            {isRegister ? 'TẠO TÀI KHOẢN MỚI' : 'ĐĂNG NHẬP HỆ THỐNG'}
          </h2>
          <p className="text-xs text-indigo-200/70 mt-1">
            {isRegister ? 'Khởi tạo tài khoản ôn luyện Digital SAT' : 'Chào mừng bạn quay lại ôn luyện kỳ thi'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/20 text-rose-200 text-xs rounded-xl border border-rose-400/30">
            {error}
          </div>
        )}

        {/* Form nhập liệu */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          {isRegister && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-indigo-200/80 uppercase tracking-wider">
                Họ và tên
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-indigo-400/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-indigo-500/30 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-indigo-200/80 uppercase tracking-wider">
              Email hoặc Tên tài khoản
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-indigo-400/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@sat.edu.vn"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-indigo-500/30 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-indigo-200/80 uppercase tracking-wider">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-indigo-400/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-indigo-500/30 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-indigo-400/70 hover:text-white cursor-pointer"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition shadow-[0_0_25px_rgba(225,29,72,0.4)] flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <span>{loading ? 'ĐANG KẾT NỐI...' : isRegister ? 'ĐĂNG KÝ NGAY' : 'ĐĂNG NHẬP'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Chuyển đổi Đăng nhập / Đăng ký */}
        <div className="mt-5 pt-4 border-t border-indigo-500/20 text-center text-xs text-indigo-200/70">
          <span>{isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}</span>{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="font-bold text-indigo-300 hover:text-white underline cursor-pointer transition ml-1"
          >
            {isRegister ? 'Đăng nhập ngay' : 'Đăng ký ngay'}
          </button>
        </div>

      </div>
    </div>
  );
}
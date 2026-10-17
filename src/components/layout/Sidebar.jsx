// src/components/layout/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import {
  Home,
  BookOpen,
  HelpCircle,
  MessageSquare,
  Bookmark,
  FolderOpen,
  ShieldAlert,
  Settings,
  LogOut,
  Sparkles,
  Rocket,
  Trophy,
  Plus,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  Compass,
} from 'lucide-react';

export default function Sidebar(props) {
  const {
    activeTab,
    activeView,
    currentView,
    currentTab,
    setActiveTab,
    setActiveView,
    onChangeView,
    onSelectTab,
    onNavigate,
    setView,
    onLogout,
  } = props;

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sat_sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sat_sidebar_collapsed', String(next));
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeKey = activeTab || activeView || currentView || currentTab || 'dashboard';

  const handleNavigate = (item) => {
    const callbacks = [
      setActiveTab,
      setActiveView,
      onChangeView,
      onSelectTab,
      onNavigate,
      setView,
    ].filter((fn) => typeof fn === 'function');

    callbacks.forEach((fn) => {
      fn(item.id);
    });
  };

  const [mistakeCount, setMistakeCount] = useState(0);
  const [dailyQuestDone, setDailyQuestDone] = useState(() => {
    return Number(localStorage.getItem('sat_daily_quest_progress')) || 2;
  });
  const dailyQuestTotal = 3;

  useEffect(() => {
    try {
      const mistakes = JSON.parse(localStorage.getItem('sat_mistakes') || '[]');
      setMistakeCount(Array.isArray(mistakes) ? mistakes.length : 0);
    } catch {
      setMistakeCount(0);
    }
  }, [activeKey]);

  const handleIncrementQuest = () => {
    const next = dailyQuestDone >= dailyQuestTotal ? 1 : dailyQuestDone + 1;
    setDailyQuestDone(next);
    localStorage.setItem('sat_daily_quest_progress', String(next));
  };

  const mainNavItems = [
    {
      id: 'dashboard',
      aliases: ['dashboard', 'home'],
      label: 'Trang chủ',
      sub: 'Command Center',
      icon: Home,
      badge: 'LIVE',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
    },
    {
      id: 'mission-log',
      aliases: ['mission-log', 'skill-tree', 'hall-of-fame', 'progression'],
      label: 'Hành trình & Bảng Vàng',
      sub: 'Skill Tree & Top 5',
      icon: Compass,
      badge: 'HOT',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    },
    {
      id: 'study-room',
      aliases: ['study-room', 'lounge', 'coworking'],
      label: 'Phòng học tập',
      sub: 'Co-working & 5P Race',
      icon: Users,
      badge: '18 Online',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    },
    {
      id: 'desmos-sim',
      aliases: ['desmos-sim', 'desmos-lab', 'simulator'],
      label: 'Desmos Lab & Dự báo',
      sub: 'God-Mode & Score Sim',
      icon: Rocket,
      badge: 'LAB',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
    },
    {
      id: 'vocabulary',
      aliases: ['vocabulary', 'vocab'],
      label: 'Kho từ vựng',
      sub: '3D Flashcards SRS',
      icon: BookOpen,
      badge: '500+',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
    },
    {
      id: 'question-bank',
      aliases: ['question-bank', 'questions', 'bank', 'questionBank'],
      label: 'Ngân hàng câu hỏi',
      sub: 'Official & Prediction',
      icon: HelpCircle,
      badge: 'NEW',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
    },
    {
      id: 'forum',
      aliases: ['forum', 'community'],
      label: 'Diễn đàn hỏi đáp',
      sub: 'Astronaut Community',
      icon: MessageSquare,
      badge: '24/7',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
    },
    {
      id: 'mistakes',
      aliases: ['mistakes', 'error-log', 'notebook'],
      label: 'Sổ tay câu sai',
      sub: 'Error Analytics Log',
      icon: Bookmark,
      badge: mistakeCount > 0 ? `${mistakeCount}` : '0',
      badgeColor:
        mistakeCount > 0
          ? 'bg-rose-500/25 text-rose-300 border-rose-400/40'
          : 'bg-slate-800 text-slate-400 border-slate-700',
    },
    {
      id: 'documents',
      aliases: ['documents', 'docs'],
      label: 'Kho tài liệu',
      sub: 'PDF & Bluebook Guides',
      icon: FolderOpen,
      badge: 'PRO',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    },
  ];

  const questPercent = Math.round((dailyQuestDone / dailyQuestTotal) * 100);

  return (
    <aside
      className={`${
        isCollapsed ? 'w-[76px]' : 'w-64'
      } h-screen bg-[#070B14] border-r border-indigo-500/20 flex flex-col justify-between shrink-0 select-none font-sans text-slate-200 relative transition-all duration-300 ease-in-out z-30`}
    >
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#818cf8 1px, #070B14 1px)',
          backgroundSize: '28px 28px',
          backgroundPosition: '0 0, 14px 14px',
        }}
      />

      <button
        type="button"
        onClick={toggleCollapse}
        title={isCollapsed ? 'Mở rộng thanh công cụ (Ctrl+B)' : 'Thu gọn thanh công cụ (Ctrl+B)'}
        className="absolute -right-3 top-5 z-50 w-6 h-6 rounded-full bg-slate-900 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_12px_rgba(34,211,238,0.3)] transition cursor-pointer"
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      <div className={`${isCollapsed ? 'p-2.5' : 'p-4'} space-y-5 overflow-y-auto overflow-x-hidden relative z-10`}>
        <div className="flex items-center justify-between">
          <div
            onClick={() => handleNavigate({ id: 'dashboard' })}
            className={`flex items-center ${
              isCollapsed ? 'justify-center w-full' : 'gap-3 px-1'
            } py-1 rounded-2xl cursor-pointer group`}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform shrink-0">
              <div className="w-full h-full rounded-[14px] bg-[#070B14] flex items-center justify-center font-black text-white text-base">
                S
              </div>
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-black text-sm tracking-wider text-white truncate">
                    SAT PLATFORM
                  </h1>
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400/80 block">
                  COSMIC EDITION
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              type="button"
              onClick={toggleCollapse}
              className="p-1.5 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition cursor-pointer"
              title="Thu gọn Sidebar (Ctrl+B)"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          {!isCollapsed ? (
            <div className="px-3 pb-1 flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
              <span>CHỨC NĂNG TRẠM</span>
              <Rocket className="w-3 h-3 text-indigo-400" />
            </div>
          ) : (
            <div className="flex justify-center pb-1">
              <button
                type="button"
                onClick={toggleCollapse}
                className="p-1.5 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition cursor-pointer"
                title="Mở rộng Sidebar (Ctrl+B)"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </div>
          )}

          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.aliases.includes(activeKey);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item)}
                title={isCollapsed ? `${item.label} (${item.sub})` : ''}
                className={`w-full ${
                  isCollapsed ? 'p-2.5 justify-center' : 'px-3 py-2.5 justify-between'
                } rounded-2xl flex items-center transition-all duration-150 cursor-pointer group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/30 via-cyan-500/15 to-transparent text-white border border-cyan-400/40 shadow-[0_0_20px_rgba(56,189,248,0.15)]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                )}

                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors relative ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                        : 'bg-slate-900/90 text-slate-400 group-hover:text-cyan-300 border border-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.id === 'study-room' && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#070B14]" />
                    )}
                  </div>

                  {!isCollapsed && (
                    <div className="text-left truncate">
                      <div className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-slate-200'}`}>
                        {item.label}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">{item.sub}</div>
                    </div>
                  )}
                </div>

                {!isCollapsed && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold border shrink-0 ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {!isCollapsed ? (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/70 via-slate-900/90 to-slate-950 border border-indigo-500/30 shadow-inner space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Daily Mission</span>
              </div>
              <button
                type="button"
                onClick={handleIncrementQuest}
                className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[9px] font-mono text-cyan-300 flex items-center gap-0.5 cursor-pointer transition"
                title="Đánh dấu hoàn thành 1 nhiệm vụ"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>{dailyQuestDone}/{dailyQuestTotal}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-300 leading-snug">
              Hoàn thành <strong>1 đề Verbal</strong> & ôn <strong>20 từ vựng</strong> hôm nay.
            </p>

            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${questPercent}%` }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-emerald-400 transition-all duration-300"
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleIncrementQuest}
              title={`Daily Mission: ${dailyQuestDone}/${dailyQuestTotal} (${questPercent}%)`}
              className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-amber-400 hover:scale-105 transition cursor-pointer relative"
            >
              <Trophy className="w-4 h-4" />
              <span className="absolute -bottom-1 px-1 rounded bg-emerald-500 text-slate-950 text-[8px] font-mono font-black">
                {dailyQuestDone}/{dailyQuestTotal}
              </span>
            </button>
          </div>
        )}

        <div className="space-y-1 pt-2 border-t border-white/10">
          {!isCollapsed && (
            <div className="px-3 pb-1 text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400/90">
              QUẢN TRỊ & HỆ THỐNG
            </div>
          )}
          <button
            type="button"
            onClick={() => handleNavigate({ id: 'admin' })}
            title={isCollapsed ? 'Quản trị đề & Mã mới' : ''}
            className={`w-full ${
              isCollapsed ? 'p-2.5 justify-center' : 'px-3 py-2'
            } rounded-xl flex items-center gap-3 text-xs font-bold transition cursor-pointer ${
              activeKey === 'admin'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                : 'text-slate-400 hover:text-amber-300 hover:bg-white/[0.04]'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            {!isCollapsed && <span>Quản trị đề & Mã mới</span>}
          </button>

          <button
            type="button"
            onClick={() => handleNavigate({ id: 'settings' })}
            title={isCollapsed ? 'Cài đặt hệ thống' : ''}
            className={`w-full ${
              isCollapsed ? 'p-2.5 justify-center' : 'px-3 py-2'
            } rounded-xl flex items-center gap-3 text-xs font-bold transition cursor-pointer ${
              activeKey === 'settings'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400 shrink-0" />
            {!isCollapsed && <span>Cài đặt hệ thống</span>}
          </button>
        </div>
      </div>

      <div className={`${isCollapsed ? 'p-2.5' : 'p-4'} border-t border-indigo-500/20 bg-[#050811]/90 relative z-10`}>
        <button
          type="button"
          onClick={onLogout}
          title={isCollapsed ? 'Đăng xuất trạm' : ''}
          className={`w-full ${
            isCollapsed ? 'py-2.5 px-2' : 'py-2.5 px-4'
          } rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950/80 hover:from-rose-950/80 hover:to-rose-900/60 text-slate-200 hover:text-rose-200 border border-white/10 hover:border-rose-500/40 text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition cursor-pointer`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Đăng xuất trạm</span>}
        </button>
      </div>
    </aside>
  );
}
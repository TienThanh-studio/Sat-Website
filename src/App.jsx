// src/App.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import CosmicLandingPage, { CosmicHubDock } from './pages/CosmicLandingPage';
import DashboardPage from './pages/DashboardPage';
import MissionLogPage from './pages/MissionLogPage';
import StudyRoomPage from './pages/StudyRoomPage';
import VocabularyPage from './pages/VocabularyPage';
import QuestionBankPage from './pages/QuestionBankPage';
import ForumPage from './pages/ForumPage';
import DocumentsPage from './pages/DocumentsPage';
import SettingsPage from './pages/SettingsPage';
import ExamWorkspacePage from './pages/ExamWorkspacePage';

import LoginModal from './components/auth/LoginModal';
import RegisterModal from './components/auth/RegisterModal';
import ActivationCodeModal from './components/auth/ActivationCodeModal';
import CodeGenerator from './components/admin/CodeGenerator';
import QuestionManager from './components/admin/QuestionManager';
import MathRenderer from './components/common/MathRenderer';
import DesmosSimPage from './pages/DesmosSimPage';

import { authService } from './services/authService';
import { storageService } from './services/storageService';
import { DEFAULT_CATEGORIES } from './services/questionService';
import { Bookmark, Trash2, Play, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    return authService.getCurrentUser();
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeExamSession, setActiveExamSession] = useState(null);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isActivationOpen, setIsActivationOpen] = useState(false);

  const [mistakesList, setMistakesList] = useState([]);

  useEffect(() => {
    if (activeTab === 'mistakes' || activeTab === 'error-log' || activeTab === 'notebook') {
      setMistakesList(storageService.getMistakes ? storageService.getMistakes() : []);
    }
  }, [activeTab]);

  const normalizeTab = (rawTab) => {
    const t = String(rawTab || 'dashboard').toLowerCase().trim();
    if (['dashboard', 'home'].includes(t)) return 'dashboard';
    if (['mission-log', 'skill-tree', 'hall-of-fame', 'progression', 'missionlog'].includes(t)) return 'mission-log';
    if (['study-room', 'lounge', 'coworking', 'studyroom'].includes(t)) return 'study-room';
    if (['vocabulary', 'vocab', 'words'].includes(t)) return 'vocabulary';
    if (['question-bank', 'bank', 'questions', 'questionbank', 'practice'].includes(t)) return 'question-bank';
    if (['forum', 'community'].includes(t)) return 'forum';
    if (['mistakes', 'error-log', 'notebook'].includes(t)) return 'mistakes';
    if (['documents', 'docs'].includes(t)) return 'documents';
    if (['admin', 'manager'].includes(t)) return 'admin';
    if (['desmos-sim', 'desmos-lab', 'simulator'].includes(t)) return 'desmos-sim';
    if (['settings', 'config'].includes(t)) return 'settings';
    return 'dashboard';
  };

  const handleSelectTab = (tabName) => {
    setActiveExamSession(null);
    setActiveTab(normalizeTab(tabName));
  };

  const handleStartExam = (examConfig) => {
    if (!examConfig) return;

    if (typeof examConfig === 'string') {
      const found = (DEFAULT_CATEGORIES || []).find(
        (c) =>
          c.id === examConfig ||
          c.section?.toLowerCase().includes(examConfig.toLowerCase())
      );
      if (found) {
        setActiveExamSession(found);
        return;
      }
    }

    if (Array.isArray(examConfig.questions) && examConfig.questions.length > 0) {
      setActiveExamSession(examConfig);
      return;
    }

    const fallbackCat =
      (DEFAULT_CATEGORIES || []).find((c) => c.id === examConfig.id) ||
      (DEFAULT_CATEGORIES || [])[0];
    if (fallbackCat) {
      setActiveExamSession({
        ...fallbackCat,
        ...examConfig,
        questions: fallbackCat.questions || [],
      });
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setActiveExamSession(null);
    setActiveTab('dashboard');
  };

  if (!currentUser) {
    return (
      <CosmicLandingPage
        onLoginSuccess={(user) => setCurrentUser(user || authService.loginAsGuest())}
        onStartGuest={(user) => setCurrentUser(user || authService.loginAsGuest())}
        onEnterApp={(user) => setCurrentUser(user || authService.loginAsGuest())}
      />
    );
  }

  if (activeExamSession) {
    return (
      <ExamWorkspacePage
        sessionConfig={activeExamSession}
        currentExam={activeExamSession}
        currentUser={currentUser}
        onExit={() => setActiveExamSession(null)}
      />
    );
  }

  const currentNormalizedTab = normalizeTab(activeTab);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#060913] text-slate-100 font-sans">
      <Sidebar
        activeTab={currentNormalizedTab}
        activeView={currentNormalizedTab}
        setActiveTab={handleSelectTab}
        setActiveView={handleSelectTab}
        onChangeView={handleSelectTab}
        onSelectTab={handleSelectTab}
        onNavigate={handleSelectTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#060913]">
        <Header
          currentUser={currentUser}
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenRegister={() => setIsRegisterOpen(true)}
          onOpenActivation={() => setIsActivationOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto cosmic-workspace relative">
          {/* 1. TRANG CHỦ */}
          {currentNormalizedTab === 'dashboard' && (
            <DashboardPage
              currentUser={currentUser}
              user={currentUser}
              onStartExam={handleStartExam}
              onSelectCategory={handleStartExam}
              onNavigate={handleSelectTab}
              onChangeView={handleSelectTab}
              setActiveTab={handleSelectTab}
              onOpenActivation={() => setIsActivationOpen(true)}
            />
          )}

          {/* 2. HÀNH TRÌNH KHÁM PHÁ & BẢNG VÀNG (CÂY KỸ NĂNG + TOP 5) */}
          {currentNormalizedTab === 'mission-log' && (
            <MissionLogPage currentUser={currentUser} />
          )}

          {/* 3. PHÒNG HỌC TẬP (18 ONLINE) + GAME ĐUA XE 3D */}
          {currentNormalizedTab === 'study-room' && (
            <StudyRoomPage currentUser={currentUser} />
          )}

          {/* 4. KHO TỪ VỰNG */}
          {currentNormalizedTab === 'vocabulary' && (
            <VocabularyPage currentUser={currentUser} />
          )}

          {/* 5. NGÂN HÀNG CÂU HỎI */}
          {currentNormalizedTab === 'question-bank' && (
            <QuestionBankPage
              currentUser={currentUser}
              categories={DEFAULT_CATEGORIES}
              onStartExam={handleStartExam}
              onSelectCategory={handleStartExam}
              onStartPractice={handleStartExam}
            />
          )}

          {/* 6. DIỄN ĐÀN */}
          {currentNormalizedTab === 'forum' && (
            <ForumPage currentUser={currentUser} user={currentUser} />
          )}

          {/* 7. SỔ TAY CÂU SAI */}
          {currentNormalizedTab === 'mistakes' && (
            <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/20 pb-5">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-400/30 text-rose-300 text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
                    <Bookmark className="w-3 h-3" /> ERROR ANALYTICS LOG
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">
                    Sổ Tay Câu Sai ({mistakesList.length} câu)
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Tự động lưu trữ các câu bạn làm sai trong quá trình luyện đề để ôn tập lại.
                  </p>
                </div>

                {mistakesList.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      handleStartExam({
                        id: 'mistake_review_session',
                        title: 'Ôn tập Sổ tay câu sai',
                        section: 'Reading & Writing',
                        mode: 'practice',
                        isExam: false,
                        questions: mistakesList,
                      })
                    }
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer transition"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Làm lại toàn bộ {mistakesList.length} câu sai</span>
                  </button>
                )}
              </div>

              {mistakesList.length === 0 ? (
                <div className="p-12 rounded-3xl bg-slate-900/80 border border-indigo-500/20 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h3 className="text-base font-extrabold text-white">
                    Sổ tay câu sai đang trống!
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Khi bạn làm đề trong Ngân hàng câu hỏi và nộp bài, hệ thống sẽ tự động lọc các câu trả lời sai vào đây kèm lời giải chi tiết.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSelectTab('question-bank')}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition"
                  >
                    Vào Ngân hàng đề ngay
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {mistakesList.map((item, idx) => (
                    <div
                      key={`${item.id}_${idx}`}
                      className="p-6 rounded-3xl bg-slate-900/85 border border-rose-500/25 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-mono text-xs font-bold">
                          Câu sai #{idx + 1} • {item.domain || 'SAT Question'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = storageService.removeMistake(item.id);
                            setMistakesList(next);
                          }}
                          className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                          title="Xóa khỏi sổ tay"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {item.prompt && (
                        <div className="text-sm text-slate-200 leading-relaxed font-serif bg-slate-950/60 p-4 rounded-2xl border border-white/10">
                          <MathRenderer text={item.prompt} />
                        </div>
                      )}

                      {item.question && (
                        <div className="text-sm font-bold text-white">
                          <MathRenderer text={item.question} />
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-200">
                          <span className="font-mono uppercase text-[10px] text-rose-400 block">
                            Đáp án bạn đã chọn:
                          </span>
                          <strong>{item.userAnswer || 'Bỏ trống'}</strong>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-200">
                          <span className="font-mono uppercase text-[10px] text-emerald-400 block">
                            Đáp án chuẩn College Board:
                          </span>
                          <strong>{item.correctAnswer}</strong>
                        </div>
                      </div>

                      {item.explanation && (
                        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/25 text-xs text-slate-200 leading-relaxed">
                          <strong className="text-cyan-300 block mb-1 uppercase font-mono text-[10px]">
                            Giải thích chi tiết:
                          </strong>
                          <MathRenderer text={item.explanation} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 8. KHO TÀI LIỆU */}
          {currentNormalizedTab === 'documents' && (
            <DocumentsPage currentUser={currentUser} />
          )}

          {/* 9. QUẢN TRỊ ADMIN */}
          {currentNormalizedTab === 'admin' && (
            <div className="p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">
              <div className="border-b border-indigo-500/20 pb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
                  <ShieldAlert className="w-3 h-3" /> COMMANDER ADMIN PANEL
                </span>
                <h1 className="text-2xl font-black text-white">
                  Quản Trị Hệ Thống & Mã Kích Hoạt
                </h1>
              </div>
              <CodeGenerator />
              <QuestionManager />
            </div>
          )}

          {/* 10. CÀI ĐẶT */}
          {currentNormalizedTab === 'settings' && (
            <SettingsPage currentUser={currentUser} user={currentUser} />
          )}

          {currentNormalizedTab === 'desmos-sim' && (
          <DesmosSimPage currentUser={currentUser} />
          )}
        </main>
      </div>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(u) => setCurrentUser(u)}
        onSwitchToRegister={() => {
          setIsLoginOpen(false);
          setIsRegisterOpen(true);
        }}
      />
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegisterSuccess={(u) => setCurrentUser(u)}
      />
      <ActivationCodeModal
        isOpen={isActivationOpen}
        onClose={() => setIsActivationOpen(false)}
        onSuccess={(u) => setCurrentUser(u)}
      />

      <CosmicHubDock currentUser={currentUser} />
    </div>
  );
}
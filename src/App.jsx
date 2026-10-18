// src/App.jsx
import React, { useState, useEffect, Suspense, lazy } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import CosmicLandingPage, { CosmicHubDock } from './pages/CosmicLandingPage';
import DashboardPage from './pages/DashboardPage';

// LAZY LOAD CÁC TRANG NẶNG ĐỂ TĂNG TỐC ĐỘ KHỞI ĐỘNG GẤP 3 LẦN
const MissionLogPage = lazy(() => import('./pages/MissionLogPage'));
const StudyRoomPage = lazy(() => import('./pages/StudyRoomPage'));
const DesmosSimPage = lazy(() => import('./pages/DesmosSimPage'));
const VocabularyPage = lazy(() => import('./pages/VocabularyPage'));
const QuestionBankPage = lazy(() => import('./pages/QuestionBankPage'));
const ForumPage = lazy(() => import('./pages/ForumPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ExamWorkspacePage = lazy(() => import('./pages/ExamWorkspacePage'));

import LoginModal from './components/auth/LoginModal';
import RegisterModal from './components/auth/RegisterModal';
import ActivationCodeModal from './components/auth/ActivationCodeModal';
import ScoreReportModal from './components/exam/ScoreReportModal';
import CodeGenerator from './components/admin/CodeGenerator';
import QuestionManager from './components/admin/QuestionManager';
import MathRenderer from './components/common/MathRenderer';

import { authService } from './services/authService';
import { storageService } from './services/storageService';
import { DEFAULT_CATEGORIES } from './services/questionService';
import {
  Bookmark,
  Trash2,
  Play,
  CheckCircle2,
  ShieldAlert,
  History,
  Eye,
  Clock,
  Award,
  Sparkles,
} from 'lucide-react';

// Màn hình đệm tốc độ cao khi chuyển sang các phân khu lớn
function CosmicModuleLoader() {
  return (
    <div className="h-full w-full min-h-[420px] flex flex-col items-center justify-center gap-3 text-cyan-300 font-mono select-none">
      <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center animate-pulse shadow-[0_0_25px_rgba(34,211,238,0.25)]">
        <Sparkles className="w-5 h-5 text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />
      </div>
      <span className="text-xs tracking-widest uppercase text-slate-300">
        Đang nạp mô-đun trạm vũ trụ...
      </span>
    </div>
  );
}

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
  const [examHistoryList, setExamHistoryList] = useState([]);
  const [selectedHistoryReport, setSelectedHistoryReport] = useState(null);

  useEffect(() => {
    setMistakesList(storageService.getMistakes ? storageService.getMistakes() : []);
    setExamHistoryList(storageService.getExamHistory ? storageService.getExamHistory() : []);
  }, [activeTab, activeExamSession]);

  const normalizeTab = (rawTab) => {
    const t = String(rawTab || 'dashboard').toLowerCase().trim();
    if (['dashboard', 'home'].includes(t)) return 'dashboard';
    if (['mission-log', 'skill-tree', 'hall-of-fame', 'progression', 'missionlog'].includes(t)) return 'mission-log';
    if (['study-room', 'lounge', 'coworking', 'studyroom'].includes(t)) return 'study-room';
    if (['desmos-sim', 'desmos-lab', 'simulator'].includes(t)) return 'desmos-sim';
    if (['vocabulary', 'vocab', 'words'].includes(t)) return 'vocabulary';
    if (['question-bank', 'bank', 'questions', 'questionbank', 'practice'].includes(t)) return 'question-bank';
    if (['forum', 'community'].includes(t)) return 'forum';
    if (['mistakes', 'error-log', 'notebook', 'history'].includes(t)) return 'mistakes';
    if (['documents', 'docs'].includes(t)) return 'documents';
    if (['admin', 'manager'].includes(t)) return 'admin';
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
      <Suspense fallback={<CosmicModuleLoader />}>
        <ExamWorkspacePage
          sessionConfig={activeExamSession}
          currentExam={activeExamSession}
          currentUser={currentUser}
          onExit={() => setActiveExamSession(null)}
        />
      </Suspense>
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
        {/* Thanh Header chỉ xuất hiện ở Trang chủ Dashboard */}
        {currentNormalizedTab === 'dashboard' && (
          <Header
            currentUser={currentUser}
            onOpenLogin={() => setIsLoginOpen(true)}
            onOpenRegister={() => setIsRegisterOpen(true)}
            onOpenActivation={() => setIsActivationOpen(true)}
            onLogout={handleLogout}
          />
        )}

        <main className="flex-1 overflow-y-auto cosmic-workspace relative">
          <Suspense fallback={<CosmicModuleLoader />}>
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

            {/* 2. HÀNH TRÌNH & BẢNG VÀNG */}
            {currentNormalizedTab === 'mission-log' && (
              <MissionLogPage currentUser={currentUser} />
            )}

            {/* 3. PHÒNG HỌC TẬP & ĐUA XE 3D */}
            {currentNormalizedTab === 'study-room' && (
              <StudyRoomPage currentUser={currentUser} />
            )}

            {/* 4. DESMOS LAB & DỰ BÁO ĐIỂM */}
            {currentNormalizedTab === 'desmos-sim' && (
              <DesmosSimPage currentUser={currentUser} />
            )}

            {/* 5. KHO TỪ VỰNG */}
            {currentNormalizedTab === 'vocabulary' && (
              <VocabularyPage currentUser={currentUser} />
            )}

            {/* 6. NGÂN HÀNG CÂU HỎI */}
            {currentNormalizedTab === 'question-bank' && (
              <QuestionBankPage
                currentUser={currentUser}
                categories={DEFAULT_CATEGORIES}
                onStartExam={handleStartExam}
                onSelectCategory={handleStartExam}
                onStartPractice={handleStartExam}
              />
            )}

            {/* 7. DIỄN ĐÀN */}
            {currentNormalizedTab === 'forum' && (
              <ForumPage currentUser={currentUser} user={currentUser} />
            )}

            {/* 8. SỔ TAY CÂU SAI & LỊCH SỬ LÀM BÀI */}
            {currentNormalizedTab === 'mistakes' && (
              <div className="p-6 lg:p-8 space-y-10 max-w-6xl mx-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-indigo-500/20 pb-4">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5">
                        <History className="w-3 h-3" /> EXAM HISTORY ARCHIVE
                      </span>
                      <h2 className="text-2xl font-black text-white">
                        Lịch Sử Làm Bài ({examHistoryList.length} bài thi)
                      </h2>
                    </div>
                  </div>

                  {examHistoryList.length === 0 ? (
                    <div className="p-8 rounded-3xl bg-slate-900/80 border border-indigo-500/20 text-center space-y-2">
                      <History className="w-10 h-10 text-cyan-400 mx-auto" />
                      <p className="text-xs text-slate-300 font-bold">
                        Bạn chưa nộp bài thi nào. Hãy làm 1 bài trong Ngân hàng đề để lưu lịch sử tại đây!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {examHistoryList.map((rec, idx) => (
                        <div
                          key={rec.id || idx}
                          className="p-5 rounded-3xl bg-slate-900/85 border border-indigo-500/25 flex flex-col justify-between gap-4 hover:border-cyan-400/40 transition shadow-lg"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-3 py-1 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 font-mono text-xs font-black">
                                {rec.scaledScore} / 800
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                {rec.completedAt ? new Date(rec.completedAt).toLocaleString('vi-VN') : 'Gần đây'}
                              </span>
                            </div>
                            <h4 className="font-extrabold text-sm sm:text-base text-white">
                              {rec.title || rec.section || 'Digital SAT Practice Test'}
                            </h4>
                            <div className="flex items-center gap-4 text-xs text-slate-300 font-mono">
                              <span className="flex items-center gap-1">
                                <Award className="w-3.5 h-3.5 text-emerald-400" />
                                Đúng: <strong className="text-emerald-300">{rec.correctCount}/{rec.totalQuestions}</strong> ({rec.accuracy}%)
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-amber-400" />
                                {Math.floor((rec.timeSpent || 0) / 60)}p {(rec.timeSpent || 0) % 60}s
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedHistoryReport({
                                scaledScore: rec.scaledScore,
                                section: rec.title || rec.section,
                                module2Path: rec.module2Path || 'Hard',
                                totalQuestions: rec.totalQuestions,
                                correctCount: rec.correctCount,
                                timeSpent: rec.timeSpent,
                                domainPerformance: rec.domainBreakdown || {},
                                questions: rec.questions || [],
                              })
                            }
                            className="w-full py-2.5 px-4 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-400/40 font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Xem lại chi tiết đề & Các câu sai</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SỔ TAY CÁC CÂU LÀM SAI */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/20 pb-4">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-400/30 text-rose-300 text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5">
                        <Bookmark className="w-3 h-3" /> MISTAKE NOTEBOOK
                      </span>
                      <h2 className="text-2xl font-black text-white">
                        Sổ Tay Các Câu Làm Sai ({mistakesList.length} câu)
                      </h2>
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
                        className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg cursor-pointer transition"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Làm lại toàn bộ {mistakesList.length} câu sai</span>
                      </button>
                    )}
                  </div>

                  {mistakesList.length === 0 ? (
                    <div className="p-10 rounded-3xl bg-slate-900/80 border border-indigo-500/20 text-center space-y-3">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                      <h3 className="text-sm font-extrabold text-white">
                        Sổ tay câu sai đang trống!
                      </h3>
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
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {(item.prompt || item.passage) && (
                            <div className="text-sm text-slate-200 leading-relaxed font-serif bg-slate-950/60 p-4 rounded-2xl border border-white/10">
                              <MathRenderer text={item.prompt || item.passage} />
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
              </div>
            )}

            {/* 9. KHO TÀI LIỆU */}
            {currentNormalizedTab === 'documents' && (
              <DocumentsPage currentUser={currentUser} />
            )}

            {/* 10. QUẢN TRỊ ADMIN */}
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

            {/* 11. CÀI ĐẶT */}
            {currentNormalizedTab === 'settings' && (
              <SettingsPage currentUser={currentUser} user={currentUser} />
            )}
          </Suspense>
        </main>
      </div>

      {selectedHistoryReport && (
        <ScoreReportModal
          isOpen={Boolean(selectedHistoryReport)}
          onClose={() => setSelectedHistoryReport(null)}
          onRetry={() => {
            const qs = selectedHistoryReport.questions || [];
            setSelectedHistoryReport(null);
            if (qs.length > 0) {
              handleStartExam({
                id: `retry_${Date.now()}`,
                title: selectedHistoryReport.section,
                questions: qs,
              });
            }
          }}
          onHome={() => setSelectedHistoryReport(null)}
          reportData={selectedHistoryReport}
        />
      )}

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
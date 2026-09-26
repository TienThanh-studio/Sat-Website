import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import DashboardPage from './pages/DashboardPage';
import VocabularyPage from './pages/VocabularyPage';
import QuestionBankPage from './pages/QuestionBankPage';
import DocumentsPage from './pages/DocumentsPage';
import SettingsPage from './pages/SettingsPage';
import ExamWorkspacePage from './pages/ExamWorkspacePage';
import QuestionManager from './components/admin/QuestionManager';
import LoginModal from './components/auth/LoginModal';
import RegisterModal from './components/auth/RegisterModal';
import { authService } from './services/authService';
import { CheckCircle2, RotateCcw } from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [activeExamSession, setActiveExamSession] = useState(null);

  useEffect(() => {
    const user = authService.getCurrentUser() || JSON.parse(localStorage.getItem('sat_user') || 'null');
    if (user) {
      setCurrentUser(user);
    } else {
      const defaultUser = {
        name: 'Học viên SAT',
        email: 'nguyenan20062000@gmail.com',
        avatar: '',
        bio: 'Mục tiêu Digital SAT 1500+'
      };
      setCurrentUser(defaultUser);
      localStorage.setItem('sat_user', JSON.stringify(defaultUser));
    }
  }, []);

  const handleLogout = () => {
    authService.logout();
    localStorage.removeItem('sat_user');
    setCurrentUser(null);
    setActivePage('dashboard');
  };

  const handleStartExam = (sessionConfig) => {
    setActiveExamSession(sessionConfig);
  };

  const handleExitExam = () => {
    setActiveExamSession(null);
  };

  if (activeExamSession) {
    return (
      <ExamWorkspacePage
        sessionConfig={activeExamSession}
        onExit={handleExitExam}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          currentUser={currentUser}
          onOpenLogin={() => setShowLoginModal(true)}
          onOpenRegister={() => setShowRegisterModal(true)}
        />

        <main className="flex-1 overflow-y-auto">
          {activePage === 'dashboard' && (
            <DashboardPage
              setActivePage={setActivePage}
              onStartExam={handleStartExam}
            />
          )}

          {activePage === 'vocab' && (
            <VocabularyPage />
          )}

          {/* Hỗ trợ cả 2 tên prop để không bao giờ bị lỗi undefined */}
          {activePage === 'question-bank' && (
            <QuestionBankPage 
              onStartExam={handleStartExam} 
              onStartSession={handleStartExam} 
            />
          )}

          {/* Sổ tay câu sai */}
          {activePage === 'mistakes' && (
            <div className="p-8 max-w-5xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Sổ tay câu sai (Error Notebook)</h2>
                  <p className="text-xs text-slate-500 mt-1">Tổng hợp tự động tất cả các câu bạn đã trả lời chưa đúng trong các đề thi.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('sat_mistakes');
                    window.location.reload();
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition"
                >
                  Xóa lịch sử câu sai
                </button>
              </div>

              {(() => {
                const mistakes = JSON.parse(localStorage.getItem('sat_mistakes') || '[]');
                if (mistakes.length === 0) {
                  return (
                    <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700">Tuyệt vời! Bạn không có câu sai nào cần ôn tập.</p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleStartExam({
                          sessionId: 'practice-mistakes-' + Date.now(),
                          title: 'Luyện lại câu sai trong sổ tay',
                          questions: mistakes,
                          duration: mistakes.length * 90
                        })}
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Luyện lại toàn bộ {mistakes.length} câu sai này ngay
                      </button>
                    </div>

                    <div className="space-y-3">
                      {mistakes.map((q, idx) => (
                        <div key={q.id || idx} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                            <span>Câu {idx + 1} • {q.category || 'Reading & Writing'}</span>
                            <span className="text-rose-500 font-bold">Bạn đã chọn: ({q.userAnswer})</span>
                          </div>
                          <p className="text-sm text-slate-800 font-serif whitespace-pre-line">{q.prompt || q.passage}</p>
                          <p className="text-xs font-bold text-slate-900">{q.question}</p>
                          <div className="p-3 bg-emerald-50 text-emerald-900 text-xs rounded-xl border border-emerald-200 font-medium">
                            Đáp án chuẩn: <span className="font-bold font-mono">({q.correctAnswer})</span> {q.options ? `- ${q.options[q.correctAnswer]}` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {activePage === 'documents' && (
            <DocumentsPage />
          )}

          {activePage === 'settings' && (
            <SettingsPage
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
            />
          )}

          {activePage === 'admin-tools' && (
            <div className="p-8 max-w-6xl mx-auto">
              <QuestionManager />
            </div>
          )}
        </main>
      </div>

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={(user) => {
            setCurrentUser(user);
            setShowLoginModal(false);
          }}
          onSwitchToRegister={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
        />
      )}

      {showRegisterModal && (
        <RegisterModal
          onClose={() => setShowRegisterModal(false)}
          onSuccess={(user) => {
            setCurrentUser(user);
            setShowRegisterModal(false);
          }}
          onSwitchToLogin={() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
        />
      )}
    </div>
  );
}
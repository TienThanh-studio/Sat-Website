import React, { useState, useEffect } from 'react';

// Layout Components
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';

// Pages
import DashboardPage from './pages/DashboardPage';
import QuestionBankPage from './pages/QuestionBankPage';
import DocumentsPage from './pages/DocumentsPage';
import VocabularyPage from './pages/VocabularyPage';
import SettingsPage from './pages/SettingsPage';
import ExamWorkspacePage from './pages/ExamWorkspacePage';
import ForumPage from './pages/ForumPage';

// Admin & Exam Components
import QuestionManager from './components/admin/QuestionManager';
import AiTutorModal from './components/exam/AiTutorModal';
import { CheckCircle2, Sparkles } from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [activeSession, setActiveSession] = useState(null);
  const [selectedMistakeForAi, setSelectedMistakeForAi] = useState(null);

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sat_user');
      return saved ? JSON.parse(saved) : {
        name: 'Doraemon',
        email: 'meoconhuhong@gmail.com',
        role: 'ADMIN',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Doraemon',
        targetScore: '1550+'
      };
    } catch {
      return {
        name: 'Doraemon',
        email: 'meoconhuhong@gmail.com',
        role: 'ADMIN',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Doraemon',
        targetScore: '1550+'
      };
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('sat_user', JSON.stringify(user));
    }
  }, [user]);

  const handleStartExam = (sessionConfig) => {
    setActiveSession(sessionConfig);
  };

  const handleExitExam = () => {
    setActiveSession(null);
  };

  if (activeSession) {
    return (
      <ExamWorkspacePage
        sessionConfig={activeSession}
        onExit={handleExitExam}
        currentUser={user}
      />
    );
  }

  const isAdminTab =
    activePage === 'admin-tools' ||
    activePage === 'admin-panel' ||
    activePage === 'admin' ||
    activePage === 'admin-questions';

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* 1. SIDEBAR */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        activeTab={activePage}
        setActiveTab={setActivePage}
        user={user}
        currentUser={user}
        userRole={user?.role}
        onLogout={() => {
          if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
            localStorage.removeItem('sat_user');
            window.location.reload();
          }
        }}
      />

      {/* 2. MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          user={user}
          currentUser={user}
          onOpenSettings={() => setActivePage('settings')}
          onNavigate={(page) => setActivePage(page)}
        />

        <main className="flex-1 overflow-y-auto">
          {/* 1. Trang chủ */}
          {activePage === 'dashboard' && (
            <DashboardPage
              user={user}
              currentUser={user}
              onNavigate={(page) => setActivePage(page)}
              onStartSession={handleStartExam}
              onStartExam={handleStartExam}
            />
          )}

          {/* 2. Kho từ vựng */}
          {(activePage === 'vocabulary' || activePage === 'vocab' || activePage === 'flashcards') && (
            <VocabularyPage />
          )}

          {/* 3. Ngân hàng câu hỏi */}
          {(activePage === 'question-bank' || activePage === 'questions') && (
            <QuestionBankPage
              onStartExam={handleStartExam}
              onStartSession={handleStartExam}
            />
          )}

          {/* 4. Diễn đàn hỏi đáp */}
          {(activePage === 'forum' || activePage === 'discussion') && (
            <div className="p-6 md:p-8">
              <ForumPage currentUser={user} />
            </div>
          )}

          {/* 5. Sổ tay câu sai */}
          {activePage === 'mistakes' && (
            <div className="p-8 max-w-5xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Sổ tay câu sai (Error Notebook)</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Tổng hợp tất cả các câu bạn đã trả lời chưa chính xác.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử câu sai?')) {
                      localStorage.removeItem('sat_mistakes');
                      window.location.reload();
                    }
                  }}
                  className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition cursor-pointer"
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
                          id: 'practice-mistakes-' + Date.now(),
                          title: 'Luyện lại câu sai trong sổ tay',
                          questions: mistakes,
                          duration: 0,
                          isRealExam: false
                        })}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
                      >
                        Luyện lại toàn bộ {mistakes.length} câu sai này ngay
                      </button>
                    </div>

                    <div className="space-y-3">
                      {mistakes.map((q, idx) => (
                        <div key={q.id || idx} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                            <span>Câu {idx + 1} • {q.domain || q.category || 'Reading & Writing'}</span>
                            <span className="text-rose-500 font-bold">Bạn đã chọn: {q.userAnswer || '(Bỏ trống)'}</span>
                          </div>
                          <p className="text-sm text-slate-800 font-serif whitespace-pre-line leading-relaxed">
                            {q.prompt || q.content}
                          </p>
                          {q.question && <p className="text-xs font-bold text-slate-900">{q.question}</p>}
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                            <div className="p-2.5 bg-emerald-50 text-emerald-900 text-xs rounded-xl border border-emerald-200 font-medium">
                              Đáp án chuẩn: <span className="font-bold font-mono">({q.correctAnswer})</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedMistakeForAi(q)}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-50 to-violet-50 hover:from-indigo-100 hover:to-violet-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Gia sư AI giải mã bẫy</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* 6. Kho tài liệu */}
          {(activePage === 'documents' || activePage === 'docs') && (
            <DocumentsPage user={user} />
          )}

          {/* 7. Quản trị đề */}
          {isAdminTab && (
            <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
              <QuestionManager />
            </div>
          )}

          {/* 8. Cài đặt */}
          {activePage === 'settings' && (
            <SettingsPage
              user={user}
              currentUser={user}
              setCurrentUser={setUser}
              onUpdateUser={(updated) => {
                setUser(updated);
                localStorage.setItem('sat_user', JSON.stringify(updated));
              }}
            />
          )}
        </main>
      </div>

      {/* AI TUTOR MODAL CHO SỔ TAY CÂU SAI */}
      {selectedMistakeForAi && (
        <AiTutorModal
          isOpen={Boolean(selectedMistakeForAi)}
          onClose={() => setSelectedMistakeForAi(null)}
          question={selectedMistakeForAi}
        />
      )}
    </div>
  );
}
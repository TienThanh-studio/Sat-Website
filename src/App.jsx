import React, { useState } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import DashboardPage from './pages/DashboardPage';
import QuestionBankPage from './pages/QuestionBankPage';
import ExamWorkspacePage from './pages/ExamWorkspacePage';
import VocabularyPage from './pages/VocabularyPage';
import DocumentsPage from './pages/DocumentsPage';
import ForumPage from './pages/ForumPage';
import SettingsPage from './pages/SettingsPage';
import CosmicLandingPage from './pages/CosmicLandingPage';
import CodeGenerator from './components/admin/CodeGenerator';
import QuestionManager from './components/admin/QuestionManager';
import ActivationCodeModal from './components/auth/ActivationCodeModal';
import MathRenderer from './components/common/MathRenderer';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ShieldCheck, BookOpen, Trash2 } from 'lucide-react';

function MistakesNotebookView({ onStartExam }) {
  const [mistakes, setMistakes] = useState(() => {
    try {
      const data = localStorage.getItem('sat_mistakes');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  });

  const handleDeleteMistake = (id) => {
    const updated = mistakes.filter((item) => (item.id || item.questionId) !== id);
    setMistakes(updated);
    try {
      localStorage.setItem('sat_mistakes', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ câu hỏi trong sổ tay câu sai?')) {
      setMistakes([]);
      try {
        localStorage.removeItem('sat_mistakes');
      } catch (e) {}
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Sổ tay câu sai</h1>
            <p className="text-xs text-slate-500">
              Tổng hợp {mistakes.length} câu hỏi bạn đã làm sai hoặc đánh dấu lưu lại để ôn tập.
            </p>
          </div>
        </div>

        {mistakes.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition cursor-pointer"
            >
              Xóa tất cả
            </button>
            {onStartExam && (
              <button
                type="button"
                onClick={() =>
                  onStartExam({
                    title: 'Luyện tập lại Sổ tay câu sai',
                    questions: mistakes,
                    isExam: false
                  })
                }
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
              >
                Luyện lại ngay ({mistakes.length} câu)
              </button>
            )}
          </div>
        )}
      </div>

      {mistakes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-xs">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Sổ tay đang trống</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Khi bạn hoàn thành các bài thi hoặc luyện tập, các câu hỏi chưa chính xác sẽ được lưu vào đây để bạn tiện xem lại.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {mistakes.map((q, idx) => {
            const qId = q.id || q.questionId || idx;
            return (
              <div
                key={qId}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2.5 py-1 rounded-md">
                      Câu {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {q.domain || q.category || 'Digital SAT Practice'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteMistake(qId)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Xóa câu hỏi khỏi sổ tay"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-sm font-medium text-slate-800 leading-relaxed font-serif">
                  <MathRenderer text={q.prompt || q.passage || q.content || q.question || ''} />
                </div>

                {q.question && (q.prompt || q.passage || q.content) && (
                  <div className="text-xs font-semibold text-slate-900 font-sans">
                    <MathRenderer text={q.question} />
                  </div>
                )}

                {q.options && typeof q.options === 'object' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {Object.entries(q.options).map(([k, text]) => {
                      const isCorrect = String(q.correctAnswer || '').trim().toUpperCase() === k.toUpperCase();
                      const isUserAns = String(q.userAnswer || '').trim().toUpperCase() === k.toUpperCase();

                      let optStyle = 'border-slate-200 bg-slate-50 text-slate-700';
                      if (isCorrect) {
                        optStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-500';
                      } else if (isUserAns && !isCorrect) {
                        optStyle = 'border-rose-400 bg-rose-50 text-rose-900 font-medium';
                      }

                      return (
                        <div
                          key={k}
                          className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-xs ${optStyle}`}
                        >
                          <span className="font-bold shrink-0">{k}.</span>
                          <span className="flex-1 font-serif">
                            <MathRenderer text={typeof text === 'object' ? text.text : text} />
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AdminDashboardView() {
  const [activeAdminTab, setActiveAdminTab] = useState('codes');

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Khu vực Quản trị & Kích hoạt</h1>
            <p className="text-xs text-slate-500">Quản lý ngân hàng đề thi và mã bản quyền học viên.</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveAdminTab('codes')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeAdminTab === 'codes' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Mã kích hoạt
          </button>
          <button
            type="button"
            onClick={() => setActiveAdminTab('questions')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeAdminTab === 'questions' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Quản lý câu hỏi
          </button>
        </div>
      </div>

      {activeAdminTab === 'codes' && <CodeGenerator />}
      {activeAdminTab === 'questions' && <QuestionManager />}
    </div>
  );
}

function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentSession, setCurrentSession] = useState(null);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [isActivated, setIsActivated] = useState(() => {
    return Boolean(localStorage.getItem('sat_activated_key'));
  });

  const { user, logout } = useAuth();
  const [localUser, setLocalUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sat_current_user')) || null;
    } catch (e) {
      return null;
    }
  });

  const currentUser = user || localUser;

  const handleLogout = () => {
    localStorage.removeItem('sat_current_user');
    setLocalUser(null);
    setCurrentSession(null);
    if (typeof logout === 'function') {
      logout();
    }
  };

  const handleStartExam = (sessionData) => {
    if (!sessionData) return;
    if (!isActivated) {
      setShowActivationModal(true);
      return;
    }
    setCurrentSession(sessionData);
  };

  const handleExitExam = () => {
    setCurrentSession(null);
  };

  if (!currentUser) {
    return (
      <CosmicLandingPage
        onLoginSuccess={(loggedInUser) => {
          setLocalUser(loggedInUser);
        }}
      />
    );
  }

  if (currentSession) {
    return (
      <ExamWorkspacePage
        sessionConfig={currentSession}
        currentExam={currentSession}
        onExit={handleExitExam}
        currentUser={currentUser}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 font-sans overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          user={currentUser}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 overflow-y-auto">
          {(activeTab === 'dashboard' || activeTab === 'home') && (
            <DashboardPage 
              onNavigate={setActiveTab}
              onStartExam={handleStartExam}
            />
          )}

          {(activeTab === 'bank' || activeTab === 'practice' || activeTab === 'questions') && (
            <QuestionBankPage 
              onNavigate={setActiveTab}
              onStartExam={handleStartExam}
            />
          )}

          {activeTab === 'vocab' && <VocabularyPage />}
          {activeTab === 'documents' && <DocumentsPage />}
          {activeTab === 'forum' && <ForumPage />}
          {activeTab === 'mistakes' && <MistakesNotebookView onStartExam={handleStartExam} />}
          {activeTab === 'admin' && <AdminDashboardView />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {showActivationModal && (
        <ActivationCodeModal
          isOpen={showActivationModal}
          onClose={() => setShowActivationModal(false)}
          onSuccess={() => setIsActivated(true)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
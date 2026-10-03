import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import DashboardPage from './pages/DashboardPage';
import QuestionBankPage from './pages/QuestionBankPage';
import ExamWorkspacePage from './pages/ExamWorkspacePage';
import VocabularyPage from './pages/VocabularyPage';
import DocumentsPage from './pages/DocumentsPage';
import ForumPage from './pages/ForumPage';
import SettingsPage from './pages/SettingsPage';
import CodeGenerator from './components/admin/CodeGenerator';
import QuestionManager from './components/admin/QuestionManager';
import LoginModal from './components/auth/LoginModal';
import RegisterModal from './components/auth/RegisterModal';
import MathRenderer from './components/common/MathRenderer';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ShieldCheck, BookOpen, Trash2, CheckCircle2, XCircle } from 'lucide-react';

// Component Sổ tay câu sai (Mistakes Notebook View)
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
            Khi bạn hoàn thành các bài thi hoặc luyện tập, các câu hỏi chưa chính xác sẽ được tự động hoặc thủ công lưu vào đây để bạn tiện xem lại.
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

                {/* Các phương án nếu có */}
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
                          {isUserAns && (
                            <span className="text-[10px] uppercase font-bold text-rose-600 ml-auto shrink-0">
                              Đã chọn
                            </span>
                          )}
                          {isCorrect && (
                            <span className="text-[10px] uppercase font-bold text-emerald-700 ml-auto shrink-0">
                              Đáp án đúng
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Giải thích chi tiết */}
                {q.explanation && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed font-sans">
                    <span className="font-bold text-slate-800 block mb-1">Giải thích chi tiết:</span>
                    <MathRenderer text={q.explanation} />
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

// Component Quản trị đề & mã
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
  
  // Trạng thái modal Auth (Đăng nhập / Đăng ký)
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  
  const { user } = useAuth();

  const handleStartExam = (sessionData) => {
    if (sessionData) {
      setCurrentSession(sessionData);
    }
  };

  const handleExitExam = () => {
    setCurrentSession(null);
  };

  if (currentSession) {
    return (
      <ExamWorkspacePage
        sessionConfig={currentSession}
        currentExam={currentSession}
        onExit={handleExitExam}
        currentUser={user}
      />
    );
  }

  // Khớp hàm mở đăng nhập cho Sidebar và Header
  const handleOpenLogin = () => {
    setShowLoginModal(true);
    setShowRegisterModal(false);
  };

  const handleOpenRegister = () => {
    setShowRegisterModal(true);
    setShowLoginModal(false);
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 font-sans overflow-hidden">
      {/* Sidebar có đầy đủ activeTab, setActiveTab và hàm xử lý nút Đăng nhập */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        currentTab={activeTab}
        setCurrentTab={setActiveTab}
        onLoginClick={handleOpenLogin}
        onOpenLogin={handleOpenLogin}
        onOpenRegister={handleOpenRegister}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          currentTab={activeTab}
          setCurrentTab={setActiveTab}
          user={user}
          onOpenLogin={handleOpenLogin}
          onOpenRegister={handleOpenRegister}
        />
        
        <main className="flex-1 overflow-y-auto">
          {(activeTab === 'dashboard' || activeTab === 'home') && (
            <DashboardPage 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onNavigate={setActiveTab}
              onStartExam={handleStartExam}
              onSelectExam={handleStartExam}
            />
          )}

          {(activeTab === 'bank' || activeTab === 'practice' || activeTab === 'questions') && (
            <QuestionBankPage 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onNavigate={setActiveTab}
              onStartExam={handleStartExam}
              onSelectExam={handleStartExam}
            />
          )}

          {activeTab === 'vocab' && <VocabularyPage activeTab={activeTab} setActiveTab={setActiveTab} />}
          {activeTab === 'documents' && <DocumentsPage activeTab={activeTab} setActiveTab={setActiveTab} />}
          {activeTab === 'forum' && <ForumPage activeTab={activeTab} setActiveTab={setActiveTab} />}

          {/* SỔ TAY CÂU SAI: Hỗ trợ cả key 'mistakes' lẫn 'notebook' */}
          {(activeTab === 'mistakes' || activeTab === 'notebook' || activeTab === 'wrong_answers') && (
            <MistakesNotebookView onStartExam={handleStartExam} />
          )}

          {activeTab === 'admin' && <AdminDashboardView />}
          {activeTab === 'settings' && <SettingsPage activeTab={activeTab} setActiveTab={setActiveTab} />}
        </main>
      </div>

      {/* Modal Đăng nhập / Đăng ký */}
      {showLoginModal && (
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)}
          onSwitchToRegister={handleOpenRegister}
        />
      )}

      {showRegisterModal && (
        <RegisterModal 
          isOpen={showRegisterModal} 
          onClose={() => setShowRegisterModal(false)}
          onSwitchToLogin={handleOpenLogin}
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
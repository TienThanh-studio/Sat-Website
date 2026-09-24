import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import DashboardPage from './pages/DashboardPage';
import QuestionBankPage from './pages/QuestionBankPage';
import VocabularyPage from './pages/VocabularyPage';
import DocumentsPage from './pages/DocumentsPage';
import ExamWorkspacePage from './pages/ExamWorkspacePage';
import CodeGenerator from './components/admin/CodeGenerator';
import QuestionManager from './components/admin/QuestionManager';
import LoginModal from './components/auth/LoginModal';
import RegisterModal from './components/auth/RegisterModal';
import { authService } from './services/authService';
import { storageService } from './services/storageService';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState('question-bank'); // Khởi đầu tại trang Question Bank
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [activeSession, setActiveSession] = useState(null);

  // Khởi tạo người dùng
  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);

    // Kiểm tra xem có phiên thi dở dang không
    const savedSession = storageService.getExamSession();
    if (savedSession) {
      setActiveSession(savedSession);
    }
  }, []);

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const handleStartExamSession = (config) => {
    const newSession = {
      ...config,
      sessionId: 'session_' + Date.now(),
      duration: config.mode === 'REAL_EXAM' ? 1800 : 3600 // 30p hoặc 60p
    };
    setActiveSession(newSession);
  };

  // NẾU ĐANG TRONG PHÒNG THI / LUYỆN TẬP: Chiếm trọn màn hình không sidebar
  if (activeSession) {
    return (
      <ExamWorkspacePage
        sessionConfig={activeSession}
        onExit={() => {
          storageService.clearExamSession();
          setActiveSession(null);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar cố định bên trái */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header trên cùng */}
        <Header
          currentUser={currentUser}
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenRegister={() => setIsRegisterOpen(true)}
        />

        {/* Nội dung Page động */}
        <main className="flex-1 overflow-y-auto">
          {activePage === 'dashboard' && (
            <DashboardPage onNavigateToQuestionBank={() => setActivePage('question-bank')} />
          )}
          {activePage === 'question-bank' && (
            <QuestionBankPage onStartSession={handleStartExamSession} />
          )}
          {activePage === 'vocab' && <VocabularyPage />}
          {activePage === 'documents' && <DocumentsPage />}
          {activePage === 'admin-tools' && (
            <div className="p-8 max-w-5xl mx-auto space-y-6">
              <CodeGenerator />
              <QuestionManager />
            </div>
          )}
        </main>
      </div>

      {/* Modals xác thực */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onAuthSuccess={user => setCurrentUser(user)}
      />
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onAuthSuccess={user => setCurrentUser(user)}
      />
    </div>
  );
}
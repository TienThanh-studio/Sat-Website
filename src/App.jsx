import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import DashboardPage from './pages/DashboardPage';
import QuestionBankPage from './pages/QuestionBankPage';
import ExamWorkspacePage from './pages/ExamWorkspacePage';
import VocabularyPage from './pages/VocabularyPage';
import ForumPage from './pages/ForumPage';
import DocumentsPage from './pages/DocumentsPage';
import SettingsPage from './pages/SettingsPage';
import CustomQuizModal from './components/exam/CustomQuizModal';
import * as CodeGenModule from './components/admin/CodeGenerator';
import * as QuestionMgrModule from './components/admin/QuestionManager';
import * as DocUploaderModule from './components/admin/DocumentUploader';
import LoginModal from './components/auth/LoginModal';
import RegisterModal from './components/auth/RegisterModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { storageService } from './services/storageService';
import { BookMarked, ShieldCheck, Key, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

// Nhận diện component linh hoạt dù file con dùng export default hay named export
const CodeGenerator = CodeGenModule.default || CodeGenModule.CodeGenerator || (() => null);
const QuestionManager = QuestionMgrModule.default || QuestionMgrModule.QuestionManager || (() => null);
const DocumentUploader = DocUploaderModule.default || DocUploaderModule.DocumentUploader || (() => null);

// Giao diện Sổ tay câu sai (Wrong Book)
function WrongBookView() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
          <BookMarked className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">Sổ tay câu sai (Review Mistakes)</h1>
          <p className="text-xs text-slate-500">Tự động tổng hợp các câu hỏi làm sai từ phòng thi để ôn tập trọng tâm.</p>
        </div>
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center space-y-3">
        <p className="text-sm font-bold text-slate-600">Hiện tại chưa có câu hỏi sai nào trong lịch sử.</p>
        <p className="text-xs text-slate-400">Hệ thống sẽ tự động cập nhật vào đây sau mỗi bài thi bạn hoàn thành trên nền tảng.</p>
      </div>
    </div>
  );
}

// Giao diện Quản trị đề & Mã kích hoạt (Admin Dashboard)
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
            <p className="text-xs text-slate-500">Quản lý ngân hàng đề thi, tài liệu học tập và mã bản quyền.</p>
          </div>
        </div>

        {/* Thanh tab quản trị chính duy nhất */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveAdminTab('codes')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeAdminTab === 'codes' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Mã kích hoạt
          </button>
          <button
            onClick={() => setActiveAdminTab('questions')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeAdminTab === 'questions' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Quản lý câu hỏi
          </button>
          <button
            onClick={() => setActiveAdminTab('docs')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeAdminTab === 'docs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Đăng tài liệu
          </button>
        </div>
      </div>

      {activeAdminTab === 'codes' && <CodeGenerator />}
      {activeAdminTab === 'questions' && <QuestionManager />}
      {activeAdminTab === 'docs' && <DocumentUploader />}
    </div>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('bank');
  const [currentExam, setCurrentExam] = useState(null);
  const [isExamActive, setIsExamActive] = useState(false);
  const [isCustomQuizOpen, setIsCustomQuizOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const { currentUser, profile, isAuthenticated, signOut } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    const sync = () => {
      if (storageService && typeof storageService.flushPending === 'function') {
        storageService.flushPending().then((synced) => {
          if (synced?.length > 0) {
            console.info(`Đã tự động đồng bộ ${synced.length} bài thi lên hệ thống.`);
          }
        });
      }
    };
    sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [isAuthenticated]);

  const handleStartExam = (examConfig) => {
    setCurrentExam(examConfig);
    setIsExamActive(true);
  };

  const handleExitExam = () => {
    setIsExamActive(false);
    setCurrentExam(null);
  };

  if (isExamActive && currentExam) {
    return (
      <ExamWorkspacePage
        examId={currentExam.id}
        sessionConfig={currentExam}
        onExit={handleExitExam}
        currentUser={profile || currentUser}
      />
    );
  }

  const renderMainContent = () => {
    switch (activeTab) {
      case 'dashboard':
      case 'trang-chu':
        return <DashboardPage onStartPractice={handleStartExam} />;

      case 'bank':
      case 'questions':
      case 'ngan-hang':
        return (
          <QuestionBankPage
            onStartExam={handleStartExam}
            onStartPractice={handleStartExam}
            currentUser={profile || currentUser}
          />
        );

      case 'vocab':
      case 'vocabulary':
      case 'tu-vung':
        return <VocabularyPage />;

      case 'forum':
      case 'dien-dan':
        return <ForumPage />;

      case 'notebook':
      case 'so-cau-sai':
      case 'wrong-book':
        return <WrongBookView onStartExam={handleStartExam} />;

      case 'documents':
      case 'docs':
      case 'kho-tai-lieu':
        return <DocumentsPage />;

      case 'admin':
      case 'quan-tri':
      case 'manage-codes':
        return <AdminDashboardView currentUser={profile || currentUser} />;

      case 'settings':
      case 'cai-dat':
        return <SettingsPage currentUser={profile || currentUser} />;

      default:
        return (
          <QuestionBankPage
            onStartExam={handleStartExam}
            onStartPractice={handleStartExam}
            currentUser={profile || currentUser}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 font-sans overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={profile || currentUser}
        onSignOut={signOut}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          currentUser={profile || currentUser}
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenRegister={() => setIsRegisterOpen(true)}
          onOpenCustomQuiz={() => setIsCustomQuizOpen(true)}
        />

        <main className="flex-1 overflow-y-auto flex flex-col bg-white">
          {renderMainContent()}
        </main>
      </div>

      <CustomQuizModal
        isOpen={isCustomQuizOpen}
        onClose={() => setIsCustomQuizOpen(false)}
        onStartQuiz={handleStartExam}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchRegister={() => {
          setIsLoginOpen(false);
          setIsRegisterOpen(true);
        }}
      />
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchLogin={() => {
          setIsRegisterOpen(false);
          setIsLoginOpen(true);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
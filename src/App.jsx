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
import LoginModal from './components/auth/LoginModal';
import RegisterModal from './components/auth/RegisterModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { storageService } from './services/storageService';
import { BookMarked, ShieldCheck, Key, RefreshCw, CheckCircle, AlertCircle, PlusCircle, Sparkles } from 'lucide-react';

// Giao diện Sổ tay câu sai
function WrongBookView() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
          <BookMarked className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">Sổ tay câu sai (Notebook)</h1>
          <p className="text-xs text-slate-500">Tự động tổng hợp các câu hỏi làm sai từ các bài thi để rèn luyện lại.</p>
        </div>
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center space-y-3">
        <p className="text-sm font-bold text-slate-600">Hiện tại chưa có câu hỏi sai nào được ghi nhận.</p>
        <p className="text-xs text-slate-400">Khi bạn hoàn thành các đề thi hoặc bài luyện tập, hệ thống sẽ tự động lưu lại những câu cần cải thiện vào đây.</p>
      </div>
    </div>
  );
}

// Giao diện Quản trị đề & Mã kích hoạt Supabase
function AdminView() {
  const { redeemCode } = useAuth();
  const [inputCode, setInputCode] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await redeemCode(inputCode.trim());
      if (res?.ok) {
        setStatus({ ok: true, msg: `Kích hoạt thành công gói ${res.tier.toUpperCase()}!` });
        setInputCode('');
      } else {
        const errMap = {
          invalid_code: 'Mã kích hoạt không tồn tại.',
          code_already_used: 'Mã này đã được sử dụng.',
          code_expired: 'Mã kích hoạt đã hết hạn.',
          too_many_attempts: 'Nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.'
        };
        setStatus({ ok: false, msg: errMap[res?.error] || 'Kích hoạt không thành công.' });
      }
    } catch (err) {
      setStatus({ ok: false, msg: err.message || 'Lỗi kết nối máy chủ.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Tiêu đề */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">Quản trị đề & Mã kích hoạt</h1>
          <p className="text-xs text-slate-500">Quản lý kích hoạt tài khoản Premium và cấu hình bài thi Digital SAT.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Khối kích hoạt mã */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600" />
            Kích hoạt mã bản quyền Premium
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Nhập mã kích hoạt (gồm 16 ký tự phân tách bằng dấu gạch ngang) để mở khóa toàn bộ kho đề thi VIP.
          </p>
          <form onSubmit={handleRedeem} className="space-y-3">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="VD: SAT-XXXX-XXXX-XXXX"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-mono text-sm tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="submit"
              disabled={loading || !inputCode.trim()}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Kích hoạt gói</span>
            </button>
          </form>

          {status && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              status.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {status.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{status.msg}</span>
            </div>
          )}
        </div>

        {/* Khối tạo đề / Quản lý đề thi */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              Công cụ tạo đề tùy chỉnh
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tạo đề thi thích ứng (Adaptive Module 1 & 2) hoặc bài luyện tập chuyên sâu theo số lượng câu hỏi và thời gian mong muốn.
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Tính năng đang kết nối dữ liệu Supabase</span>
              </div>
              <p className="text-slate-400">
                Toàn bộ ngân hàng câu hỏi vừa nạp (Hình học, Phân tích dữ liệu, Đại số, Đề thi thật) đã sẵn sàng phục vụ tạo đề tự động.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition shadow-xs"
          >
            Tạo đề thi mới
          </button>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('ngan-hang');
  const [currentExam, setCurrentExam] = useState(null);
  const [isExamActive, setIsExamActive] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const { currentUser, profile, isAuthenticated, signOut } = useAuth();

  // In ra console mã tab mỗi khi bấm sidebar để kiểm tra định danh
  const handleTabChange = (tabId) => {
    console.log('Sidebar clicked tab id:', tabId);
    setActiveTab(tabId);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const sync = () => {
      if (storageService && typeof storageService.flushPending === 'function') {
        storageService.flushPending().then((synced) => {
          if (synced?.length > 0) {
            console.info(`Đã đồng bộ ${synced.length} bài thi lên hệ thống.`);
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
      case 'trang-chu':
      case 'dashboard':
        return <DashboardPage onStartPractice={handleStartExam} />;

      case 'tu-vung':
      case 'vocab':
      case 'vocabulary':
        return typeof VocabularyPage !== 'undefined' ? <VocabularyPage /> : null;

      case 'ngan-hang':
      case 'bank':
      case 'questions':
        return (
          <QuestionBankPage
            onStartExam={handleStartExam}
            onStartPractice={handleStartExam}
            currentUser={profile || currentUser}
          />
        );

      case 'dien-dan':
      case 'forum':
        return typeof ForumPage !== 'undefined' ? (
          <ForumPage />
        ) : (
          <div className="p-8 text-slate-500">Đang cập nhật diễn đàn...</div>
        );

      case 'so-cau-sai':
      case 'so-tay-cau-sai':
      case 'wrong-book':
      case 'mistakes':
      case 'wrong':
        return <WrongBookView />;

      case 'kho-tai-lieu':
      case 'docs':
      case 'documents':
        return typeof DocumentsPage !== 'undefined' ? (
          <DocumentsPage />
        ) : (
          <div className="p-8 text-slate-500">Đang cập nhật kho tài liệu...</div>
        );

      // Bắt toàn bộ các định danh có thể có của phần Quản trị / Tạo đề
      case 'quan-tri':
      case 'admin':
      case 'manage-codes':
      case 'admin-codes':
      case 'quan-tri-de':
      case 'quan-tri-de-ma-moi':
      case 'tao-de':
      case 'create-exam':
      case 'custom-exam':
      case 'exam-creator':
        return <AdminView />;

      case 'cai-dat':
      case 'settings':
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
        setActiveTab={handleTabChange}
        currentUser={profile || currentUser}
        onSignOut={signOut}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          currentUser={profile || currentUser}
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenRegister={() => setIsRegisterOpen(true)}
        />

        <main className="flex-1 overflow-y-auto flex flex-col bg-white">
          {renderMainContent()}
        </main>
      </div>

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
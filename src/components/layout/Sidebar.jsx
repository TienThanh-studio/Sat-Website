import React from 'react';
import { 
  Home, 
  BookOpen, 
  Layers, 
  MessageSquare, 
  BookmarkCheck, 
  FolderDown, 
  Settings, 
  ShieldCheck, 
  LogOut, 
  LogIn 
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, currentUser, onSignOut, onOpenLogin }) {
  const mainNavItems = [
    { id: 'dashboard', label: 'Trang chủ', icon: Home },
    { id: 'vocab', label: 'Kho từ vựng', icon: BookOpen },
    { id: 'bank', label: 'Ngân hàng câu hỏi', icon: Layers },
    { id: 'forum', label: 'Diễn đàn hỏi đáp', icon: MessageSquare },
    { id: 'notebook', label: 'Sổ tay câu sai', icon: BookmarkCheck },
    { id: 'documents', label: 'Kho tài liệu', icon: FolderDown },
  ];

  const adminNavItems = [
    { id: 'admin', label: 'Quản trị đề & Mã mới', icon: ShieldCheck },
  ];

  const bottomNavItems = [
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 select-none z-10">
      {/* Logo */}
      <div className="h-16 px-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-base shadow-xs">
          S
        </div>
        <div>
          <span className="font-extrabold text-slate-900 tracking-tight text-sm block">SAT PLATFORM</span>
          <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Cloud Edition</span>
        </div>
      </div>

      {/* Menu danh mục */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {/* Chức năng chính */}
        <div>
          <span className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Chức năng
          </span>
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Dành cho Quản trị viên */}
        <div>
          <span className="px-3 text-[11px] font-bold text-amber-500 uppercase tracking-wider block mb-2">
            Dành cho Admin
          </span>
          <nav className="space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-amber-50 text-amber-700 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Cài đặt */}
        <div>
          <span className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Cài đặt
          </span>
          <nav className="space-y-1">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Chân sidebar: Đăng nhập / Đăng xuất */}
      <div className="p-4 border-t border-slate-100">
        {currentUser ? (
          <button
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        ) : (
          <button
            onClick={onOpenLogin}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition"
          >
            <LogIn className="w-4 h-4" />
            <span>Đăng nhập</span>
          </button>
        )}
      </div>
    </aside>
  );
}
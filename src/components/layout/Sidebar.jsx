import React from 'react';
import { 
  Home, 
  BookOpen, 
  HelpCircle, 
  MessageSquare, 
  Bookmark, 
  Folder, 
  Settings, 
  ShieldCheck, 
  LogOut 
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Trang chủ', icon: Home },
    { id: 'vocab', label: 'Kho từ vựng', icon: BookOpen },
    { id: 'bank', label: 'Ngân hàng câu hỏi', icon: HelpCircle },
    { id: 'forum', label: 'Diễn đàn hỏi đáp', icon: MessageSquare },
    { id: 'mistakes', label: 'Sổ tay câu sai', icon: Bookmark },
    { id: 'documents', label: 'Kho tài liệu', icon: Folder },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 font-sans select-none z-20">
      <div className="p-5 space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shadow-xs">
            S
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-900">SAT PLATFORM</h1>
            <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block">
              CLOUD EDITION
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 block mb-2">
            Chức năng
          </span>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === 'dashboard' && activeTab === 'home');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-1 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider px-3 block mb-2">
            Dành cho Admin
          </span>
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-amber-50 text-amber-700 shadow-xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>Quản trị đề & Mã mới</span>
          </button>
        </div>

        <div className="space-y-1 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 block mb-2">
            Cài đặt
          </span>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-blue-50 text-blue-600 shadow-xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Cài đặt</span>
          </button>
        </div>
      </div>

      {/* Đáy Sidebar: NÚT ĐĂNG XUẤT */}
      <div className="p-5 border-t border-slate-100">
        <button
          type="button"
          onClick={onLogout}
          className="w-full py-2.5 px-4 bg-slate-900 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs group"
        >
          <LogOut className="w-4 h-4 text-slate-400 group-hover:text-white transition" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
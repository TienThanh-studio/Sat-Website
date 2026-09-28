import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Plus, FileText, Image as ImageIcon, Send, 
  ThumbsUp, ShieldCheck, User, Filter, Paperclip, CheckCircle, 
  ExternalLink, Trash2, MessageCircle
} from 'lucide-react';
import MathRenderer from '../components/common/MathRenderer';

// Dữ liệu ban đầu đã được chuẩn hóa chữ tiếng Việt chuẩn xác
const INITIAL_POSTS = [
  {
    id: 'post_1',
    authorName: 'Admin Doraemon',
    authorRole: 'ADMIN',
    authorAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Doraemon',
    category: 'DOCUMENTS',
    title: 'Tổng hợp tài liệu Digital SAT Math Master Cheat Sheet 2026 (PDF)',
    content: 'Quản trị viên gửi các bạn bộ công thức và dạng bài đại số / hình học trọng tâm cho kỳ thi đợt tới. Các bạn click vào link tài liệu đính kèm bên dưới để tải bản PDF chất lượng cao nhé!',
    attachmentUrl: 'https://drive.google.com',
    attachmentName: 'SAT_Math_Master_2026.pdf',
    imageUrl: '',
    likes: 18,
    createdAt: 'Hôm nay lúc 08:30',
    comments: [
      {
        id: 'c_1',
        authorName: 'Minh Hoàng',
        authorRole: 'STUDENT',
        authorAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Minh',
        content: 'Tài liệu chi tiết và hay quá, em cảm ơn admin nhiều ạ!',
        createdAt: 'Hôm nay lúc 09:15'
      }
    ]
  },
  {
    id: 'post_2',
    authorName: 'Phan Tiến Thành',
    authorRole: 'STUDENT',
    authorAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Thanh',
    category: 'MATH',
    title: 'Nhờ mọi người giải giúp câu Hệ phương trình phi tuyến tính này với!',
    content: 'Cho hệ phương trình: $2x^2 - 4x + c = 0$ và $y = 3x - 5$. Biết hệ có đúng 1 nghiệm thực duy nhất $(x, y)$. Tìm giá trị của $c$?',
    attachmentUrl: '',
    attachmentName: '',
    imageUrl: '',
    likes: 7,
    createdAt: 'Hôm qua lúc 19:40',
    comments: [
      {
        id: 'c_2',
        authorName: 'Trần Nam',
        authorRole: 'STUDENT',
        authorAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Nam',
        content: 'Bạn thế $y$ hoặc rút điều kiện $\\Delta = 0$ của phương trình bậc hai là ra ngay $c = 2$ nhé!',
        createdAt: 'Hôm qua lúc 20:05'
      }
    ]
  }
];

export default function ForumPage({ currentUser }) {
  const [posts, setPosts] = useState(() => {
    try {
      const saved = localStorage.getItem('sat_forum_posts');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Tự động làm sạch dữ liệu cũ nếu bị dính ký tự `´`
        return parsed.map(p => ({
          ...p,
          content: String(p.content || '').replace(/([a-zA-ZÀ-ỹ])\s*[´\u00B4\u02CA\u0301]/g, '$1')
        }));
      }
      return INITIAL_POSTS;
    } catch {
      return INITIAL_POSTS;
    }
  });

  const [filterCategory, setFilterCategory] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('MATH');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    localStorage.setItem('sat_forum_posts', JSON.stringify(posts));
  }, [posts]);

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newPost = {
      id: 'post_' + Date.now(),
      authorName: currentUser?.name || 'Học viên',
      authorRole: currentUser?.role || 'STUDENT',
      authorAvatar: currentUser?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Student',
      category: newCategory,
      title: newTitle.trim(),
      content: newContent.trim(),
      attachmentUrl: newAttachmentUrl.trim(),
      attachmentName: newAttachmentName.trim() || (newAttachmentUrl ? 'Tài liệu đính kèm' : ''),
      imageUrl: newImageUrl.trim(),
      likes: 0,
      createdAt: 'Vừa xong',
      comments: []
    };

    setPosts([newPost, ...posts]);
    setNewTitle('');
    setNewContent('');
    setNewAttachmentUrl('');
    setNewAttachmentName('');
    setNewImageUrl('');
    setShowCreateModal(false);
  };

  const handleLikePost = (postId) => {
    setPosts(posts.map(p => (p.id === postId ? { ...p, likes: p.likes + 1 } : p)));
  };

  const handleDeletePost = (postId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài thảo luận này?')) return;
    setPosts(posts.filter(p => p.id !== postId));
  };

  const handleAddComment = (postId) => {
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;

    const newComment = {
      id: 'comment_' + Date.now(),
      authorName: currentUser?.name || 'Học viên',
      authorRole: currentUser?.role || 'STUDENT',
      authorAvatar: currentUser?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=User',
      content: text,
      createdAt: 'Vừa xong'
    };

    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...(p.comments || []), newComment]
        };
      }
      return p;
    }));

    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const filteredPosts = posts.filter(post => {
    if (filterCategory === 'ALL') return true;
    return post.category === filterCategory;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-sans select-none">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <span>Diễn đàn Thảo luận & Hỏi đáp SAT</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Giao lưu hỏi bài tập khó, thảo luận đề thi và chia sẻ tài liệu ôn luyện độc quyền.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Đăng bài viết mới</span>
        </button>
      </div>

      {/* BỘ LỌC */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setFilterCategory('ALL')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 ${
            filterCategory === 'ALL' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Tất cả bài viết ({posts.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterCategory('DOCUMENTS')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
            filterCategory === 'DOCUMENTS' ? 'bg-amber-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-amber-500" />
          <span>Tài liệu từ Admin</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterCategory('MATH')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 ${
            filterCategory === 'MATH' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Hỏi đáp Math
        </button>
        <button
          type="button"
          onClick={() => setFilterCategory('VERBAL')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 ${
            filterCategory === 'VERBAL' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Hỏi đáp Reading & Writing
        </button>
      </div>

      {/* DANH SÁCH BÀI VIẾT */}
      <div className="space-y-5">
        {filteredPosts.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-300 text-slate-400 text-xs">
            Chưa có bài thảo luận nào trong danh mục này. Hãy là người đầu tiên đặt câu hỏi!
          </div>
        ) : (
          filteredPosts.map(post => {
            const isAdmin = post.authorRole === 'ADMIN';
            const isAuthorOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.name === post.authorName;
            const isCommentsOpen = activeCommentPostId === post.id;

            return (
              <div key={post.id} className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={post.authorAvatar} 
                      alt={post.authorName} 
                      className="w-10 h-10 rounded-full border border-slate-200 bg-slate-50"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{post.authorName}</span>
                        {isAdmin && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                            <ShieldCheck className="w-3 h-3 text-amber-600" /> QTV
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          post.category === 'DOCUMENTS' 
                            ? 'bg-amber-100/70 text-amber-900' 
                            : post.category === 'MATH'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {post.category === 'DOCUMENTS' ? 'Tài liệu' : post.category === 'MATH' ? 'Math' : 'Verbal'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">{post.createdAt}</span>
                    </div>
                  </div>

                  {isAuthorOrAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Xóa bài viết"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-extrabold text-base text-slate-900 leading-snug">{post.title}</h3>
                  <div className="text-sm text-slate-700 leading-relaxed select-text">
                    <MathRenderer text={post.content} />
                  </div>
                </div>

                {post.imageUrl && (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-96 max-w-xl">
                    <img 
                      src={post.imageUrl} 
                      alt="Ảnh đính kèm" 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}

                {post.attachmentUrl && (
                  <a
                    href={post.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl border border-slate-200 text-xs font-semibold transition"
                  >
                    <FileText className="w-4 h-4 text-rose-600" />
                    <span className="truncate max-w-xs">{post.attachmentName || 'Tải file đính kèm'}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 ml-1" />
                  </a>
                )}

                <div className="flex items-center gap-4 pt-2 border-t border-slate-100 text-xs text-slate-500 font-semibold">
                  <button
                    type="button"
                    onClick={() => handleLikePost(post.id)}
                    className="flex items-center gap-1.5 hover:text-indigo-600 transition cursor-pointer"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>{post.likes} Hữu ích</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveCommentPostId(isCommentsOpen ? null : post.id)}
                    className="flex items-center gap-1.5 hover:text-indigo-600 transition cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.comments?.length || 0} Bình luận</span>
                  </button>
                </div>

                {isCommentsOpen && (
                  <div className="space-y-3 pt-3 border-t border-slate-100 animate-in fade-in duration-150">
                    {post.comments?.length > 0 && (
                      <div className="space-y-2.5 pl-2">
                        {post.comments.map((cm) => (
                          <div key={cm.id} className="flex items-start gap-2.5 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <img src={cm.authorAvatar} alt="" className="w-7 h-7 rounded-full shrink-0" />
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-800">{cm.authorName}</span>
                                  {cm.authorRole === 'ADMIN' && (
                                    <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">QTV</span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400">{cm.createdAt}</span>
                              </div>
                              <div className="text-slate-700 leading-relaxed">
                                <MathRenderer text={cm.content} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Viết câu trả lời hoặc thảo luận (hỗ trợ KaTeX $...$)..."
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(post.id); }}
                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddComment(post.id)}
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition cursor-pointer"
                        title="Gửi bình luận"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL TẠO BÀI ĐĂNG */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">
                {currentUser?.role === 'ADMIN' ? 'Đăng bài viết hoặc tài liệu mới' : 'Đặt câu hỏi / bài tập khó'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chủ đề bài đăng</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white outline-none"
                >
                  <option value="MATH">Hỏi đáp Math (Toán học)</option>
                  <option value="VERBAL">Hỏi đáp Reading & Writing</option>
                  {currentUser?.role === 'ADMIN' && (
                    <option value="DOCUMENTS">Tài liệu ôn luyện độc quyền (QTV)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề bài viết</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giúp mình câu Đại số phương trình bậc 2 này với..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nội dung chi tiết (hỗ trợ công thức $x^2 + y^2 = r^2$)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Mô tả câu hỏi, bài toán hoặc chia sẻ của bạn..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-500" /> Link ảnh chụp đề (URL)
                  </label>
                  <input
                    type="text"
                    placeholder="https://imgur.com/... hoặc link ảnh"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <Paperclip className="w-3.5 h-3.5 text-amber-500" /> Link tài liệu Drive / PDF
                  </label>
                  <input
                    type="text"
                    placeholder="https://drive.google.com/..."
                    value={newAttachmentUrl}
                    onChange={(e) => setNewAttachmentUrl(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  Đăng bài ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
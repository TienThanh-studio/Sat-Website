// src/pages/ForumPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  ThumbsUp,
  MessageCircle,
  Search,
  Plus,
  Send,
  Tag,
  Clock,
  Sparkles,
  CheckCircle2,
  X,
  CornerDownRight,
  Image as ImageIcon,
  Paperclip,
  FileText,
  Trash2,
} from 'lucide-react';
import MathRenderer from '../components/common/MathRenderer';
import { storageService } from '../services/storageService';
import { securityGuard } from '../utils/securityGuard';

const FORUM_STORAGE_KEY = 'sat_forum_posts_v1';

const DEFAULT_FORUM_POSTS = [
  {
    id: 'post-101',
    author: 'Minh Anh (Target 1550+)',
    avatar: 'M',
    avatarColor: 'bg-indigo-600',
    category: 'Math',
    title: 'Mẹo giải nhanh hệ phương trình phi tuyến bằng Desmos trong 10 giây!',
    content:
      'Chào mọi người, hôm nay làm đề Practice Test 6 gặp câu hệ phương trình $y = x^2 - 4x + 3$ và $y = 2x - 2$. Thay vì thế vào giải phương trình bậc hai dễ nhầm dấu, mọi người chỉ cần gõ thẳng cả 2 hàm vào Desmos rồi click vào giao điểm là ra nghiệm nguyên ngay lập tức nhé!',
    createdAt: '2 giờ trước',
    likes: 24,
    isLiked: false,
    attachments: [],
    replies: [
      {
        id: 'rep-1',
        author: 'Hoàng Nam',
        avatar: 'H',
        content:
          'Chuẩn luôn, nhất là mấy bài hỏi số nghiệm (number of solutions) thì nhìn đồ thị cắt nhau mấy điểm là khoanh được ngay.',
        createdAt: '1 giờ trước',
      },
      {
        id: 'rep-2',
        author: 'Thảo Vy',
        avatar: 'T',
        content: 'Cảm ơn bạn nhiều nha! Mình toàn giải tay mất gần 2 phút câu này.',
        createdAt: '30 phút trước',
      },
    ],
  },
  {
    id: 'post-102',
    author: 'Đức Duy',
    avatar: 'Đ',
    avatarColor: 'bg-emerald-600',
    category: 'Reading & Writing',
    title: 'Cách phân biệt dấu chấm phẩy (;) và dấu gạch ngang (—) trong câu Boundaries?',
    content:
      'Mình hay bị phân vân giữa lựa chọn có dấu `;` và một dấu `—` đơn lẻ khi nối 2 mệnh đề độc lập (Independent Clauses). Có quy tắc nào để loại nhanh đáp án bẫy của College Board không ạ?',
    createdAt: '5 giờ trước',
    likes: 18,
    isLiked: false,
    attachments: [],
    replies: [
      {
        id: 'rep-3',
        author: 'SAT Master Tutor',
        avatar: 'S',
        isVerified: true,
        content:
          'Chào Duy! Về mặt ngữ pháp chuẩn SAT: nếu 2 lựa chọn có cấu trúc y hệt nhau mà một câu dùng dấu chấm (`.`) và một câu dùng chấm phẩy (`;`) nối 2 mệnh đề độc lập thì cả 2 câu đó đều SAI (vì tương đương nhau). Còn dấu gạch ngang đơn (`—`) thường dùng khi vế sau giải thích, nhấn mạnh hoặc tạo sự ngắt nhịp bất ngờ cho vế trước nhé!',
        createdAt: '4 giờ trước',
      },
    ],
  },
  {
    id: 'post-103',
    author: 'Khánh Linh',
    avatar: 'K',
    avatarColor: 'bg-amber-600',
    category: 'Kinh nghiệm thi',
    title: 'Review trải nghiệm thi thật Digital SAT tháng vừa rồi (1540: 750 RW - 790 Math)',
    content:
      'Mình vừa nhận điểm sáng nay nên viết bài chia sẻ nóng cho các bạn sắp thi. Phần Reading Module 2 khá dài ở các câu Command of Evidence (khoảng câu 11-16). Lời khuyên của mình là làm hết phần Standard English Conventions + Rhetorical Synthesis (từ câu 15 đến 27) trước để ăn chắc điểm ngữ pháp, sau đó quay lại đọc kỹ các đoạn văn dài!',
    createdAt: '1 ngày trước',
    likes: 42,
    isLiked: true,
    attachments: [],
    replies: [],
  },
];

const CATEGORIES = ['Tất cả', 'Reading & Writing', 'Math', 'Kinh nghiệm thi', 'Hỏi đáp đề khó'];

function loadForumPostsSafely() {
  try {
    if (storageService && typeof storageService.getForumPosts === 'function') {
      return storageService.getForumPosts();
    }
    const raw = localStorage.getItem(FORUM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveForumPostsSafely(posts) {
  try {
    if (storageService && typeof storageService.saveForumPosts === 'function') {
      storageService.saveForumPosts(posts);
    }
    localStorage.setItem(FORUM_STORAGE_KEY, JSON.stringify(posts));
  } catch {
    // ignore
  }
}

export default function ForumPage({ currentUser }) {
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPostId, setExpandedPostId] = useState('post-101');
  const [replyInputs, setReplyInputs] = useState({});
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);

  const [newPost, setNewPost] = useState({
    title: '',
    category: 'Reading & Writing',
    content: '',
    attachments: [],
  });

  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const saved = loadForumPostsSafely();
    if (Array.isArray(saved) && saved.length > 0 && (saved[0]?.title || saved[0]?.content)) {
      setPosts(saved);
    } else {
      setPosts(DEFAULT_FORUM_POSTS);
      saveForumPostsSafely(DEFAULT_FORUM_POSTS);
    }
  }, []);

  const updatePosts = (nextPosts) => {
    setPosts(nextPosts);
    saveForumPostsSafely(nextPosts);
  };

  const handleToggleLike = (postId) => {
    const check = securityGuard.checkRateLimit(`forum_like_${postId}`, 500);
    if (!check.allowed) return;

    const next = posts.map((p) => {
      if (p.id !== postId) return p;
      const liked = !p.isLiked;
      return {
        ...p,
        isLiked: liked,
        likes: liked ? (p.likes || 0) + 1 : Math.max(0, (p.likes || 1) - 1),
      };
    });
    updatePosts(next);
  };

  const handleDeletePost = (e, postId) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này khỏi diễn đàn?')) {
      return;
    }
    const next = posts.filter((p) => p.id !== postId);
    updatePosts(next);
  };

  const handleDeleteReply = (postId, replyId) => {
    const next = posts.map((p) => {
      if (p.id !== postId) return p;
      return {
        ...p,
        replies: (p.replies || []).filter((r) => r.id !== replyId),
      };
    });
    updatePosts(next);
  };

  const handleAddReply = (postId) => {
    const rawText = replyInputs[postId] || '';
    const text = securityGuard.sanitizeInput(rawText, 1200);
    if (!text) return;

    const check = securityGuard.checkRateLimit('forum_reply');
    if (!check.allowed) {
      alert(check.reason);
      return;
    }

    const userName =
      localStorage.getItem('sat_custom_display_name') ||
      currentUser?.name ||
      'Học viên SAT';
    const newReply = {
      id: `rep-${Date.now()}`,
      author: securityGuard.sanitizeInput(userName, 60),
      avatar: userName.charAt(0).toUpperCase(),
      content: text,
      createdAt: 'Vừa xong',
    };

    const next = posts.map((p) => {
      if (p.id !== postId) return p;
      return {
        ...p,
        replies: [...(p.replies || []), newReply],
      };
    });

    updatePosts(next);
    setReplyInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  const handleSelectFiles = (e, fileType) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const validation = securityGuard.validateAttachment(file, 4);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const attachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          type: fileType === 'image' || file.type.startsWith('image/') ? 'image' : 'file',
          dataUrl: reader.result,
        };
        setNewPost((prev) => ({
          ...prev,
          attachments: [...(prev.attachments || []), attachment],
        }));
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveAttachment = (attId) => {
    setNewPost((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((a) => a.id !== attId),
    }));
  };

  const handleCreatePost = (e) => {
    e.preventDefault();
    const cleanTitle = securityGuard.sanitizeInput(newPost.title, 180);
    const cleanContent = securityGuard.sanitizeInput(newPost.content, 4000);
    if (!cleanTitle || !cleanContent) return;

    const check = securityGuard.checkRateLimit('forum_post');
    if (!check.allowed) {
      alert(check.reason);
      return;
    }

    const userName =
      localStorage.getItem('sat_custom_display_name') ||
      currentUser?.name ||
      'Học viên SAT';
    const created = {
      id: `post-${Date.now()}`,
      author: securityGuard.sanitizeInput(userName, 60),
      avatar: userName.charAt(0).toUpperCase(),
      avatarColor: 'bg-blue-600',
      category: newPost.category,
      title: cleanTitle,
      content: cleanContent,
      attachments: newPost.attachments || [],
      createdAt: 'Vừa xong',
      likes: 0,
      isLiked: false,
      replies: [],
    };

    const next = [created, ...posts];
    updatePosts(next);
    setExpandedPostId(created.id);
    setNewPost({ title: '', category: 'Reading & Writing', content: '', attachments: [] });
    setIsNewPostOpen(false);
  };

  const handleResetDefaultForum = () => {
    updatePosts(DEFAULT_FORUM_POSTS);
  };

  const filteredPosts = posts.filter((p) => {
    const matchCat = selectedCategory === 'Tất cả' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      (p.title || '').toLowerCase().includes(q) ||
      (p.content || '').toLowerCase().includes(q) ||
      (p.author || '').toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6 select-none font-sans">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 lg:p-8 text-white shadow-lg border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold text-indigo-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cộng đồng học thuật Digital SAT</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
            Diễn Đàn Hỏi Đáp & Chia Sẻ Kinh Nghiệm
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl">
            Cùng thảo luận các câu hỏi khó, chia sẻ mẹo bấm máy Desmos và chiến thuật phân bổ thời gian đạt 1500+ SAT.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewPostOpen(true)}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold px-5 py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Đặt câu hỏi / Viết bài mới</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-slate-900/90 p-4 rounded-xl border border-indigo-500/20 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm chủ đề, từ khóa..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-400 bg-slate-950 text-white"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="bg-slate-900/85 rounded-2xl border border-white/10 p-12 text-center space-y-3">
            <MessageSquare className="w-10 h-10 text-slate-500 mx-auto" />
            <p className="text-slate-300 font-semibold">Không tìm thấy bài thảo luận nào phù hợp.</p>
            <button
              type="button"
              onClick={handleResetDefaultForum}
              className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-bold cursor-pointer hover:bg-cyan-500/30 transition"
            >
              Khôi phục các bài thảo luận mẫu
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isExpanded = expandedPostId === post.id;
            return (
              <div
                key={post.id}
                className="bg-slate-900/85 rounded-2xl border border-indigo-500/20 shadow-sm hover:border-cyan-400/40 transition overflow-hidden"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full ${
                          post.avatarColor || 'bg-indigo-600'
                        } text-white font-bold flex items-center justify-center shadow-sm shrink-0`}
                      >
                        {(post.author || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{post.author}</span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-cyan-300 border border-indigo-400/30">
                            <Tag className="w-3 h-3" />
                            {post.category || 'Thảo luận'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{post.createdAt || post.time || 'Gần đây'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeletePost(e, post.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/30 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                      title="Xóa bài đăng này"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Xóa bài</span>
                    </button>
                  </div>

                  <div>
                    <h3
                      onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                      className="text-lg font-bold text-white hover:text-cyan-300 cursor-pointer transition"
                    >
                      {post.title || 'Thảo luận chiến thuật luyện thi Digital SAT'}
                    </h3>
                    <div className="mt-2 text-sm text-slate-200 leading-relaxed">
                      <MathRenderer text={post.content || post.text || ''} />
                    </div>

                    {Array.isArray(post.attachments) && post.attachments.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {post.attachments
                            .filter((att) => att.type === 'image')
                            .map((img) => (
                              <div
                                key={img.id}
                                className="rounded-xl overflow-hidden border border-white/10 bg-slate-950"
                              >
                                <img
                                  src={img.dataUrl}
                                  alt={img.name}
                                  className="w-full max-h-80 object-contain mx-auto"
                                />
                              </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {post.attachments
                            .filter((att) => att.type !== 'image')
                            .map((doc) => (
                              <a
                                key={doc.id}
                                href={doc.dataUrl}
                                download={doc.name}
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-white/10 text-xs font-semibold text-cyan-300 transition"
                              >
                                <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                                <span className="truncate max-w-[220px]">{doc.name}</span>
                                <span className="text-[10px] text-slate-400">({doc.size})</span>
                              </a>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center gap-6 text-xs font-semibold text-slate-400">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center gap-1.5 transition cursor-pointer ${
                        post.isLiked ? 'text-cyan-300 font-bold' : 'hover:text-white'
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${post.isLiked ? 'fill-cyan-400 text-cyan-400' : ''}`} />
                      <span>{post.likes || 0} Hữu ích</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                      className="flex items-center gap-1.5 hover:text-white transition cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{(post.replies || []).length} Phản hồi</span>
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-slate-950/80 border-t border-white/10 p-5 space-y-4">
                    {(post.replies || []).length > 0 && (
                      <div className="space-y-3">
                        {post.replies.map((rep) => (
                          <div
                            key={rep.id}
                            className="flex items-start justify-between gap-3 bg-slate-900/90 p-3.5 rounded-xl border border-white/10"
                          >
                            <div className="flex items-start gap-3">
                              <CornerDownRight className="w-4 h-4 text-slate-500 mt-1 shrink-0" />
                              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {rep.avatar || 'U'}
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-white">{rep.author}</span>
                                  {rep.isVerified && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                                      <CheckCircle2 className="w-3 h-3" /> Giảng viên
                                    </span>
                                  )}
                                  <span className="text-[11px] text-slate-500">{rep.createdAt}</span>
                                </div>
                                <div className="text-xs text-slate-200 leading-relaxed">
                                  <MathRenderer text={rep.content} />
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteReply(post.id, rep.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                              title="Xóa phản hồi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={replyInputs[post.id] || ''}
                        onChange={(e) =>
                          setReplyInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddReply(post.id);
                        }}
                        placeholder="Viết câu trả lời hoặc thảo luận của bạn (hỗ trợ gõ công thức $...$)..."
                        className="flex-1 px-4 py-2.5 text-xs bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-400 text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddReply(post.id)}
                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Gửi</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {isNewPostOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-indigo-500/30 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-extrabold text-white">Tạo bài thảo luận mới</h3>
              <button
                type="button"
                onClick={() => setIsNewPostOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Chuyên mục
                </label>
                <select
                  value={newPost.category}
                  onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-700 rounded-xl bg-slate-950 text-white focus:outline-none focus:border-cyan-400"
                >
                  {CATEGORIES.filter((c) => c !== 'Tất cả').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Tiêu đề câu hỏi / Bài viết
                </label>
                <input
                  type="text"
                  required
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="VD: Cách giải nhanh câu hàm số bậc hai Module 2..."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-700 rounded-xl bg-slate-950 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Nội dung chi tiết (Hỗ trợ LaTeX $...$)
                </label>
                <textarea
                  rows={4}
                  required
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Nhập nội dung câu hỏi hoặc chia sẻ của bạn..."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-700 rounded-xl bg-slate-950 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleSelectFiles(e, 'image')}
                    className="hidden"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                    multiple
                    onChange={(e) => handleSelectFiles(e, 'file')}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    <span>Thêm ảnh chụp đề</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition cursor-pointer"
                  >
                    <Paperclip className="w-4 h-4 text-amber-400" />
                    <span>Đính kèm tài liệu</span>
                  </button>
                </div>

                {Array.isArray(newPost.attachments) && newPost.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {newPost.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-xs font-semibold text-slate-200"
                      >
                        <span className="truncate max-w-[160px]">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="text-slate-400 hover:text-rose-400 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewPostOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-slate-950 bg-cyan-500 hover:bg-cyan-400 cursor-pointer shadow-md"
                >
                  Đăng bài viết
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
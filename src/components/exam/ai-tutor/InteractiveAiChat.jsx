// src/components/exam/ai-tutor/InteractiveAiChat.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  HelpCircle,
  Lightbulb,
  CheckCircle,
  Key,
  KeyRound,
  RotateCcw,
  Zap,
} from 'lucide-react';
import MathRenderer from '../../common/MathRenderer';

export default function InteractiveAiChat({
  question = {},
  analysis = {},
}) {
  const [mode, setMode] = useState('socratic'); // 'socratic' | 'detailed'
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(() => {
    try {
      return localStorage.getItem('sat_gemini_api_key') || '';
    } catch {
      return '';
    }
  });

  const abortControllerRef = useRef(null);
  const chatEndRef = useRef(null);

  // Cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  // Tạo tin nhắn chào mở đầu ban đầu phù hợp với câu hỏi và mode
  useEffect(() => {
    const qSubject = analysis?.subject || 'verbal';
    const initialGreeting =
      mode === 'socratic'
        ? `Chào bạn! Tôi là SAT AI Tutor. Ở chế độ **Gợi ý Socratic**, tôi sẽ **không tiết lộ ngay đáp án**, mà đặt câu hỏi gợi mở giúp bạn tự nhận diện manh mối chính và loại trừ các phương án bẫy. Bạn đang băn khoăn ở bước nào trong câu này?`
        : `Chào bạn! Tôi là SAT AI Tutor. Ở chế độ **Giải thích Chi tiết**, tôi sẽ phân tích cặn kẽ lập luận chọn đáp án đúng **${
            analysis?.correct?.label || question?.correctAnswer || ''
          }**, giải mã bẫy tâm lý của người ra đề và hướng dẫn phương pháp giải nhanh. Hãy đặt bất kỳ câu hỏi nào bạn muốn!`;

    setMessages([
      {
        id: 'initial_msg',
        sender: 'tutor',
        text: initialGreeting.normalize('NFC'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [question?.id, mode]);

  // Sinh câu trả lời dự phòng chất lượng cao từ Local Heuristic Engine
  const generateLocalResponse = (userQuery) => {
    const query = String(userQuery || '').toLowerCase();
    const correctLetter = analysis?.correct?.label || question?.correctAnswer || 'A';
    const explanation = question?.explanation || analysis?.explanationText || '';
    const passage = question?.passage || question?.prompt || '';
    const trap = analysis?.trapTag || 'Bẫy đánh lạc hướng trong phương án nhiễu';
    const steps = analysis?.steps || [];
    const takeaway = analysis?.takeaway || 'Bám sát dữ kiện cốt lõi của đề bài';

    if (mode === 'socratic') {
      if (query.includes('loại trừ') || query.includes('đáp án sai') || query.includes('bẫy')) {
        return `🎯 **Hướng dẫn Loại Trừ Socratic**:
Để loại bỏ 2 phương án sai rõ nhất trước:
1. Hãy tìm xem phương án nào chứa các từ cực đoan (như *always, completely, never*) hoặc khẳng định điều **ngoài phạm vi** mà đoạn văn không đề cập.
2. Kiểm tra lại dấu hiệu: ${analysis?.trapTag ? `Câu này có bẫy **${analysis.trapTag}**` : 'Cẩn thận với phương án chỉ đúng một nửa'}.
👉 *Câu hỏi cho bạn:* Khi đọc 4 phương án, bạn thấy phương án nào hoàn toàn không tìm được bằng chứng trong đoạn trích?`;
      }

      if (query.includes('manh mối') || query.includes('clue') || query.includes('từ khóa')) {
        return `🔍 **Manh mối then chốt (Context Clue)**:
Hãy tập trung sự chú ý vào:
- Các từ nối chuyển hướng (như *however, although, whereas*) hoặc từ bổ sung (*furthermore, therefore*).
- Dấu câu đặc biệt (như dấu hai chấm \`:\` hoặc gạch ngang \`—\`) giải thích cho vế trước.
👉 *Gợi ý cho bạn:* Câu hỏi này kiểm tra mục tiêu gì (ngữ nghĩa từ trong văn cảnh, suy luận hay đại số)? Bạn hãy thử chỉ ra một câu chứa tiền đề quan trọng nhất trong đoạn văn xem sao!`;
      }

      return `💡 **Gợi ý tư duy từng bước**:
Đừng vội nhìn vào 4 phương án ngay! Bạn hãy:
1. Đọc kỹ câu hỏi cuối cùng để xác định chính xác đề bài yêu cầu tìm đại lượng hoặc mục tiêu gì.
2. Che các đáp án lại và tự đưa ra một phán đoán sơ bộ bằng từ ngữ của chính mình.
👉 Bạn nghĩ gì về sự tương phản hoặc liên kết logic giữa các vế trong câu này?`;
    }

    // Detailed Mode
    if (query.includes('manh mối') || query.includes('tại sao') || query.includes('giải thích')) {
      return `📚 **Phân tích Toàn diện**:
- **Đáp án đúng:** **${correctLetter}**
- **Lập luận chọn:** ${explanation || 'Đáp án này khớp chính xác với dấu hiệu ngữ cảnh và cấu trúc logic đề bài đặt ra.'}
- **Bẫy cần tránh:** ${trap}
- **Chiến thuật:** ${analysis?.strategy?.headline || 'Loại bỏ phương án sai phạm vi trước khi chọn.'}`;
    }

    return `📖 **Phân tích Chi tiết từ AI Co-Pilot**:
- **Đáp án chuẩn College Board:** **${correctLetter}**
${explanation ? `\n> ${explanation}\n` : ''}
${steps.length > 0 ? `\n**Quy trình giải quyết:**\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n` : ''}
**Bài học then chốt:** ${takeaway}`;
  };

  // Gọi Gemini Streaming API với graceful fallback
  const handleSendMessage = async (textToSend) => {
    const query = String(textToSend || inputText).trim();
    if (!query || isStreaming) return;

    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query.normalize('NFC'),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsStreaming(true);
    setStreamingText('');

    const apiKey = (customApiKey || localStorage.getItem('sat_gemini_api_key') || '').trim();

    // 1. Nếu KHÔNG có API Key -> Dùng Local Engine mượt mà với hiệu ứng gõ chữ
    if (!apiKey) {
      setTimeout(() => {
        const localReply = generateLocalResponse(query);
        let currentIdx = 0;
        const speed = 12; // ms mỗi ký tự
        const interval = setInterval(() => {
          currentIdx += 3;
          if (currentIdx >= localReply.length) {
            clearInterval(interval);
            setStreamingText('');
            setMessages((prev) => [
              ...prev,
              {
                id: `bot_${Date.now()}`,
                sender: 'tutor',
                text: localReply.normalize('NFC'),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
            setIsStreaming(false);
          } else {
            setStreamingText(localReply.slice(0, currentIdx));
          }
        }, speed);
      }, 250);
      return;
    }

    // 2. Nếu CÓ API Key -> Gọi Streaming qua Gemini 2.5 Flash
    try {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const systemPrompt = `You are an elite Digital SAT 1600 Master Tutor.
Exam Mode: ${mode === 'socratic' ? 'SOCRATIC HINTING (DO NOT reveal the final correct letter A/B/C/D under any circumstance! Guide the student step-by-step with inquisitive questions, clue-finding hints, or elimination strategies)' : 'DETAILED EXPLANATION (Provide comprehensive logic breakdown, why correct is right, why distractors fail, traps and 30s strategy)'}.
Always respond in fluent Vietnamese, polite, pedagogic, using LaTeX math formatted with single dollar signs like $x^2 + 2x$ where applicable.
Current Question Context:
- Domain: ${question?.domain || 'Reading & Writing'}
- Passage: "${question?.passage || question?.prompt || ''}"
- Question: "${question?.question || ''}"
- Correct Answer: "${question?.correctAnswer || ''}"
- Options: ${JSON.stringify(question?.options || {})}
- Explanation: "${question?.explanation || ''}"`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${encodeURIComponent(
          apiKey
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nStudent question: ${query}` }],
              },
            ],
            generationConfig: {
              temperature: mode === 'socratic' ? 0.4 : 0.2,
              maxOutputTokens: 1024,
            },
          }),
          signal: abortController.signal,
        }
      );

      if (!response.ok || !response.body) {
        throw new Error(`Gemini API HTTP Error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const chunk =
                parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (chunk) {
                accumulated += chunk;
                setStreamingText(accumulated);
              }
            } catch {
              // ignore json parse chunk errors
            }
          }
        }
      }

      const finalContent = accumulated.trim() || generateLocalResponse(query);
      setStreamingText('');
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: 'tutor',
          text: finalContent.normalize('NFC'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      // Fallback êm dịu không bao giờ để giao diện bị crash
      console.warn('Gemini stream failed or cancelled, using local fallback engine:', err);
      const fallbackReply = generateLocalResponse(query);
      setStreamingText('');
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: 'tutor',
          text: fallbackReply.normalize('NFC'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleSaveApiKey = (key) => {
    const clean = String(key || '').trim();
    setCustomApiKey(clean);
    try {
      if (clean) {
        localStorage.setItem('sat_gemini_api_key', clean);
      } else {
        localStorage.removeItem('sat_gemini_api_key');
      }
    } catch {
      // ignore
    }
    setShowKeyModal(false);
  };

  return (
    <div className="flex flex-col h-[520px] rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] overflow-hidden">
      {/* 1. Header & Mode Switcher */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500 text-slate-950 font-black shadow-xs">
            <Bot className="w-5 h-5" />
          </span>
          <div>
            <h4 className="text-sm font-extrabold flex items-center gap-1.5 text-white">
              <span>SAT AI Co-Pilot Chat</span>
              <span className="px-1.5 py-0.2 rounded-md bg-cyan-400/20 text-cyan-300 text-[10px] font-mono border border-cyan-400/30">
                gemini-2.5-flash
              </span>
            </h4>
            <p className="text-[11px] text-slate-300">
              {customApiKey ? '🟢 Đã kết nối Live Gemini' : '⚡ Local Heuristic Expert'}
            </p>
          </div>
        </div>

        {/* Nút chuyển đổi Socratic vs Detailed */}
        <div className="flex items-center gap-1.5">
          <div className="bg-slate-950/80 p-0.5 rounded-xl border border-white/15 flex text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode('socratic')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                mode === 'socratic'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Gợi ý từng bước, không tiết lộ đáp án trực tiếp"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Gợi Ý Socratic</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('detailed')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                mode === 'detailed'
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-black shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Giải thích toàn diện đáp án và các phương án"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chi Tiết</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowKeyModal(true)}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition cursor-pointer"
            title="Cài đặt Gemini API Key riêng"
          >
            <KeyRound className="w-4 h-4 text-amber-300" />
          </button>
        </div>
      </div>

      {/* 2. Messages Log */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/50">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isUser
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 shadow-xs'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </span>

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-[13px] leading-relaxed select-text font-serif ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm font-sans'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs'
                }`}
              >
                <MathRenderer text={m.text} />
                <span
                  className={`block text-[9px] font-mono mt-1 ${
                    isUser ? 'text-indigo-200 text-right' : 'text-slate-400'
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isStreaming && (
          <div className="flex items-start gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-slate-950 text-xs font-bold shadow-xs">
              <Bot className="w-3.5 h-3.5" />
            </span>
            <div className="max-w-[85%] rounded-2xl rounded-tl-none p-3.5 text-xs sm:text-[13px] leading-relaxed bg-white border border-cyan-200 shadow-sm text-slate-800 font-serif">
              {streamingText ? (
                <MathRenderer text={streamingText} />
              ) : (
                <div className="flex items-center gap-1.5 py-1 text-cyan-600 font-mono text-xs">
                  <span className="animate-spin">⚡</span>
                  <span>Đang suy luận logic câu hỏi…</span>
                </div>
              )}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 3. Quick Prompt Pills */}
      <div className="px-4 py-2 bg-slate-100/70 border-t border-slate-200/80 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar shrink-0">
        <span className="text-[11px] font-bold text-slate-500 shrink-0">Gợi ý nhanh:</span>
        {[
          { label: '💡 Manh mối quan trọng nhất?', query: 'Chỉ ra cho tôi từ khóa hoặc manh mối quan trọng nhất trong đoạn văn là gì?' },
          { label: '❌ Loại trừ 2 đáp án sai?', query: 'Hãy giúp tôi loại trừ 2 phương án sai rõ ràng nhất trước và giải thích tại sao.' },
          { label: '🎯 Gợi ý bước giải tiếp theo', query: 'Tôi nên tư duy bước tiếp theo như thế nào để đến được đáp án đúng?' },
        ].map((pill, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isStreaming}
            onClick={() => handleSendMessage(pill.query)}
            className="px-2.5 py-1 rounded-full bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 text-[11px] font-medium whitespace-nowrap transition cursor-pointer disabled:opacity-50"
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* 4. Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            mode === 'socratic'
              ? 'Hỏi gợi ý Socratic (VD: Manh mối ở câu nào, tại sao B sai)...'
              : 'Đặt câu hỏi phân tích chi tiết cho AI Tutor...'
          }
          disabled={isStreaming}
          className="flex-1 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isStreaming}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Gửi</span>
        </button>
      </form>

      {/* 5. Modal Cài đặt API Key */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
                <Key className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-base font-bold text-slate-900">Gemini API Key</h4>
                <p className="text-xs text-slate-500">Kích hoạt Streaming thời gian thực</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Nếu bạn có Google Gemini API Key riêng, hãy dán vào đây để mở khóa phản hồi trực tiếp từ model <strong>gemini-2.5-flash</strong>. Nếu để trống, hệ thống sẽ tự động dùng <strong>Bộ phân tích chuyên gia nội bộ</strong> 100% miễn phí và hoạt động cả khi offline.
            </p>

            <input
              type="password"
              defaultValue={customApiKey}
              id="apiKeyInput"
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = document.getElementById('apiKeyInput')?.value;
                  handleSaveApiKey(val);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-xs"
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

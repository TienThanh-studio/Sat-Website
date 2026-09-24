import React, { useState } from 'react';
import { questionService } from '../../services/questionService';
import { PlusCircle, Trash2, CheckCircle2 } from 'lucide-react';

export default function QuestionManager() {
  const [questions, setQuestions] = useState(questionService.getAllQuestions());
  const [topic, setTopic] = useState('Word in Context');
  const [difficulty, setDifficulty] = useState('Medium');
  const [passage, setPassage] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [explanation, setExplanation] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    const newQ = questionService.addQuestion({
      topic,
      difficulty,
      passage,
      question: questionText,
      options: [
        { key: 'A', text: optA },
        { key: 'B', text: optB },
        { key: 'C', text: optC },
        { key: 'D', text: optD }
      ],
      correctAnswer,
      explanation
    });

    setQuestions(questionService.getAllQuestions());
    setSuccessMsg('Đã thêm câu hỏi vào ngân hàng đề thành công!');
    setTimeout(() => setSuccessMsg(''), 3000);

    // Reset form
    setPassage('');
    setQuestionText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setExplanation('');
  };

  const handleDelete = (id) => {
    if (confirm('Bạn có chắc muốn xóa câu hỏi này?')) {
      questionService.deleteQuestion(id);
      setQuestions(questionService.getAllQuestions());
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
      <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
        <PlusCircle className="w-5 h-5 text-brand-800" />
        <span>Thêm câu hỏi mới vào Ngân hàng đề</span>
      </div>
      <p className="text-xs text-slate-500 mb-6">Câu hỏi thêm tại đây sẽ được tự động đưa vào thuật toán sinh đề ma trận và hệ thống chấm điểm tự động.</p>

      {successMsg && (
        <div className="p-3 mb-4 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      <form onSubmit={handleCreate} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Chủ đề (Topic)</label>
            <select
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold"
            >
              <option value="Word in Context">Word in Context</option>
              <option value="Main Idea">Main Idea</option>
              <option value="Text Structure">Text Structure</option>
              <option value="Command of Evidence">Command of Evidence</option>
              <option value="Grammar">Grammar</option>
              <option value="Inference">Inference</option>
              <option value="Transition">Transition</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Độ khó</label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold"
            >
              <option value="Easy">Dễ (Easy)</option>
              <option value="Medium">Trung bình (Medium)</option>
              <option value="Hard">Khó (Hard)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Đoạn văn đọc hiểu (Passage)</label>
          <textarea
            rows="4"
            required
            placeholder="Dán đoạn văn tiếng Anh vào đây..."
            value={passage}
            onChange={e => setPassage(e.target.value)}
            className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-serif leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Câu hỏi (Question)</label>
          <input
            type="text"
            required
            placeholder="Nhập nội dung câu hỏi..."
            value={questionText}
            onChange={e => setQuestionText(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold"
          />
        </div>

        {/* 4 Đáp án A B C D */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            required
            placeholder="Đáp án A"
            value={optA}
            onChange={e => setOptA(e.target.value)}
            className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
          />
          <input
            type="text"
            required
            placeholder="Đáp án B"
            value={optB}
            onChange={e => setOptB(e.target.value)}
            className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
          />
          <input
            type="text"
            required
            placeholder="Đáp án C"
            value={optC}
            onChange={e => setOptC(e.target.value)}
            className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
          />
          <input
            type="text"
            required
            placeholder="Đáp án D"
            value={optD}
            onChange={e => setOptD(e.target.value)}
            className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Đáp án đúng để chấm</label>
            <select
              value={correctAnswer}
              onChange={e => setCorrectAnswer(e.target.value)}
              className="w-full text-xs p-2.5 bg-brand-50 border-2 border-brand-800 text-brand-900 font-bold rounded-xl outline-none"
            >
              <option value="A">Đáp án A</option>
              <option value="B">Đáp án B</option>
              <option value="C">Đáp án C</option>
              <option value="D">Đáp án D</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Lời giải thích chi tiết</label>
            <input
              type="text"
              required
              placeholder="Giải thích tại sao đáp án này đúng..."
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-brand-800 hover:bg-brand-900 text-white font-bold text-xs rounded-xl shadow transition"
        >
          Lưu câu hỏi vào hệ thống
        </button>
      </form>

      {/* Danh sách câu hỏi hiện có trong kho */}
      <div className="mt-8 border-t border-slate-100 pt-6">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
          Tổng số câu hỏi trong ngân hàng: {questions.length}
        </h4>
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {questions.map((q, idx) => (
            <div key={q.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div className="max-w-[80%]">
                <span className="font-bold text-slate-800 mr-2">#{idx + 1}. [{q.topic} - {q.difficulty}]</span>
                <span className="text-slate-600 line-clamp-1">{q.question}</span>
                <span className="text-emerald-700 font-bold ml-1">(Đáp án đúng: {q.correctAnswer})</span>
              </div>
              {q.id.startsWith('q_custom') && (
                <button
                  onClick={() => handleDelete(q.id)}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
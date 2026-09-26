import React, { useState, useMemo } from 'react';
import CategoryCard from '../components/exam/CategoryCard';
import QuestionBankFilters from '../components/exam/QuestionBankFilters';
import MatrixModal from '../components/exam/MatrixModal';
import { questionService } from '../services/questionService';
import { HelpCircle } from 'lucide-react';

export default function QuestionBankPage({ onStartSession, onStartExam }) {
  const [selectedPhase, setSelectedPhase] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [matrixTopic, setMatrixTopic] = useState(null);

  // Fallback linh hoạt cho cả 2 tên prop
  const startHandler = onStartExam || onStartSession;

  // Lấy danh sách thống kê câu hỏi an toàn
  const stats = useMemo(() => {
    if (questionService && typeof questionService.getCategoryStats === 'function') {
      return questionService.getCategoryStats();
    }
    return [];
  }, []);

  // Bắt đầu làm bài khi click "Luyện tập" trực tiếp trên CategoryCard
  const handleSelectSingleTopic = (topicKey) => {
    let questions = [];
    if (questionService && typeof questionService.getQuestionsByCategory === 'function') {
      questions = questionService.getQuestionsByCategory(topicKey);
    }

    if (!questions || questions.length === 0) {
      alert('Chủ đề này hiện đang được chuẩn bị câu hỏi!');
      return;
    }

    if (typeof startHandler === 'function') {
      startHandler({
        sessionId: `practice-${topicKey}-${Date.now()}`,
        title: `Luyện tập: ${topicKey.toUpperCase()}`,
        mode: 'PRACTICE',
        questions: questions,
        duration: Math.max(questions.length * 90, 600)
      });
    }
  };

  // Lọc theo Category và từ khóa tìm kiếm
  const filteredStats = stats.filter(item => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (searchQuery && !item.label.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-700" />
            <span>Ngân hàng câu hỏi Reading & Writing</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Hệ thống câu hỏi luyện tập phân loại theo từng dạng bài chuẩn SAT.
          </p>
        </div>
      </div>

      <QuestionBankFilters
        selectedPhase={selectedPhase}
        setSelectedPhase={setSelectedPhase}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedDifficulty={selectedDifficulty}
        setSelectedDifficulty={setSelectedDifficulty}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStats.map(item => (
          <CategoryCard
            key={item.id}
            topic={item}
            onSelect={() => handleSelectSingleTopic(item.id)}
            onOpenMatrix={() => setMatrixTopic(item)}
          />
        ))}
      </div>

      {/* Modal chọn ma trận câu hỏi */}
      {matrixTopic && (
        <MatrixModal
          topic={matrixTopic}
          onClose={() => setMatrixTopic(null)}
          onStartExam={(config) => {
            setMatrixTopic(null);
            if (typeof startHandler === 'function') {
              startHandler(config);
            }
          }}
        />
      )}
    </div>
  );
}
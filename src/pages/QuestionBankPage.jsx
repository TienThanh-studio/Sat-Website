import React, { useState } from 'react';
import QuestionBankFilters from '../components/exam/QuestionBankFilters';
import CategoryCard from '../components/exam/CategoryCard';
import MatrixModal from '../components/exam/MatrixModal';
import { questionService } from '../services/questionService';

export default function QuestionBankPage({ onStartSession }) {
  const [isMultiTopic, setIsMultiTopic] = useState(false);
  const [difficulty, setDifficulty] = useState('All');
  const [status, setStatus] = useState('All');
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);

  // Lấy thống kê số câu hỏi và số câu làm đúng thực tế từ questionService
  const allQuestions = questionService.getAllQuestions();
  const stats = questionService.getTopicStats();

  // Danh mục các Topic chính trong đề thi
  const standardTopics = [
    'Details',
    'Cross Text',
    'Inference',
    'Grammar',
    'Transition',
    'Command of evidence',
    'Word in context',
    'Vocabulary'
  ];

  // Tính tổng số lượng và số câu đúng cho từng Topic theo dữ liệu thật
  const topicsList = standardTopics.map(name => {
    // Tìm key tương ứng không phân biệt hoa thường
    const matchedKey = Object.keys(stats).find(k => k.toLowerCase() === name.toLowerCase());
    return {
      name,
      total: matchedKey ? stats[matchedKey].total : 0,
      correct: matchedKey ? stats[matchedKey].correct : 0
    };
  });

  const totalAllQuestions = allQuestions.length;

  const handleStartExam = (matrixConfig) => {
    const questions = questionService.generateMatrixExam(matrixConfig);
    onStartSession({
      questions,
      mode: matrixConfig.mode,
      title: 'Question Bank Phase 2'
    });
  };

  const handleSelectSingleTopic = (topicName) => {
    const questions = questionService.generateMatrixExam({
      topic: topicName,
      difficulty: difficulty !== 'All' ? difficulty : undefined,
      count: 20
    });
    onStartSession({
      questions,
      mode: 'PRACTICE',
      title: `${topicName} Practice`
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Thanh bộ lọc */}
      <QuestionBankFilters
        isMultiTopic={isMultiTopic}
        setIsMultiTopic={setIsMultiTopic}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        status={status}
        setStatus={setStatus}
        onReset={() => {
          setIsMultiTopic(false);
          setDifficulty('All');
          setStatus('All');
        }}
      />

      {/* Grid danh mục câu hỏi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CategoryCard
          title="Question Bank Phase 2"
          totalCount={totalAllQuestions}
          topics={topicsList}
          onOpenMatrix={() => setIsMatrixOpen(true)}
          onSelectTopic={handleSelectSingleTopic}
        />
      </div>

      {/* Popup Ma Trận Đề */}
      <MatrixModal
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
        topicsList={topicsList}
        onStartExam={handleStartExam}
      />
    </div>
  );
}
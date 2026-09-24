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

  // Lấy thống kê số câu đúng thực tế từ questionService
  const stats = questionService.getTopicStats();

  const topicsList = [
    { name: 'Word in Context', total: 170, correct: stats['Word in Context']?.correct || 30 },
    { name: 'Main Idea', total: 35, correct: stats['Main Idea']?.correct || 0 },
    { name: 'Text Structure', total: 37, correct: stats['Text Structure']?.correct || 0 },
    { name: 'Command of Evidence', total: 44, correct: stats['Command of Evidence']?.correct || 1 },
    { name: 'Inference', total: 58, correct: stats['Inference']?.correct || 0 },
    { name: 'Cross Text', total: 19, correct: stats['Cross Text']?.correct || 0 },
    { name: 'Grammar', total: 294, correct: stats['Grammar']?.correct || 95 },
    { name: 'Transition', total: 102, correct: stats['Transition']?.correct || 0 },
    { name: 'Rhetorical Synthesis', total: 42, correct: stats['Rhetorical Synthesis']?.correct || 0 },
    { name: 'Details', total: 33, correct: stats['Details']?.correct || 0 },
  ];

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
      count: 10
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

      {/* Grid chứa Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CategoryCard
          title="Question Bank Phase 2"
          totalCount={1413}
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
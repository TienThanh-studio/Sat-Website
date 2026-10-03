import { supabase } from '../lib/supabaseClient';

export function isNetworkError(err) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  return /failed to fetch|networkerror|load failed|network request failed/i.test(err?.message || '');
}

async function rpc(fn, args) {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) {
    const e = new Error(error.message);
    e.code = error.code;
    e.isNetwork = isNetworkError(error);
    throw e;
  }
  return data;
}

export const examService = {
  startExamSession: (examId) => rpc('start_exam_session', { p_exam_id: examId }),

  submitModule1: (sessionId, answers, times = {}) =>
    rpc('submit_module1', { p_session_id: sessionId, p_answers: answers, p_times: times }),

  submitExam: (sessionId, answers, times = {}) =>
    rpc('submit_exam', { p_session_id: sessionId, p_answers: answers, p_times: times }),

  getAttemptResult: (attemptId) => rpc('get_attempt_result', { p_attempt_id: attemptId }),

  async listExams() {
    const { data, error } = await supabase
      .from('exams')
      .select('id,title,section,is_free,module1_seconds,module2_seconds')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async listAttempts(limit = 50) {
    const { data, error } = await supabase
      .from('exam_attempts')
      .select('id,exam_id,exam_title,section,total_score,correct_count,total_questions,time_spent,module2_branch,created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      const e = new Error(error.message);
      e.isNetwork = isNetworkError(error);
      throw e;
    }
    return data;
  },
};

export default examService;
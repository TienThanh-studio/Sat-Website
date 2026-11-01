// src/hooks/usePacingTracker.js
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Ngưỡng nhịp độ theo từng section chuẩn Digital SAT (đơn vị: giây).
 * - standard: mức trung bình danh định
 * - warning : ngưỡng dừng quá lâu -> Cảnh báo OVERTIME_WARNING
 *   + Reading & Writing: Dừng > 85 giây/câu -> OVERTIME_WARNING
 *   + Math: Dừng > 105 giây/câu -> OVERTIME_WARNING
 */
export const PACING_CONFIG = Object.freeze({
  'Reading & Writing': Object.freeze({ standard: 71, warning: 85 }),
  Math: Object.freeze({ standard: 95, warning: 105 }),
});

/** Dưới ngưỡng này (giây) được xem là làm quá vội (Rushing). */
export const FAST_QUESTION_THRESHOLD = 20;

/** Trả về cấu hình ngưỡng cho section; giá trị khác sẽ rơi về Reading & Writing. */
export const getPacingConfig = (section) => {
  const isMath = String(section || '').toLowerCase().includes('math');
  return isMath ? PACING_CONFIG.Math : PACING_CONFIG['Reading & Writing'];
};

const isValidIndex = (value) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

const nowMs = () =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();

const TICK_INTERVAL_MS = 250;

/**
 * Hook theo dõi nhịp độ làm bài và phát hiện quá thời gian (Pacing Tracker)
 */
export const usePacingTracker = ({ currentIndex, isExamRunning, section } = {}) => {
  const totalsMsRef = useRef({});
  const visitMsRef = useRef(0);
  const segmentStartRef = useRef(null);
  const trackedIndexRef = useRef(null);
  const versionRef = useRef(0);
  const [snapshot, setSnapshot] = useState({ visitSec: 0, version: 0, times: {} });

  const getCurrentVisitMs = useCallback(() => {
    const running = segmentStartRef.current !== null ? nowMs() - segmentStartRef.current : 0;
    return visitMsRef.current + Math.max(0, running);
  }, []);

  const buildTimes = useCallback(() => {
    const result = {};
    Object.keys(totalsMsRef.current).forEach((key) => {
      result[key] = Math.round(totalsMsRef.current[key] / 1000);
    });
    const tracked = trackedIndexRef.current;
    if (tracked !== null) {
      const ms = (totalsMsRef.current[tracked] || 0) + getCurrentVisitMs();
      if (ms > 0) result[tracked] = Math.round(ms / 1000);
    }
    return result;
  }, [getCurrentVisitMs]);

  const sync = useCallback(() => {
    const visitSec = Math.floor(getCurrentVisitMs() / 1000);
    const version = versionRef.current;
    setSnapshot((prev) =>
      prev.visitSec === visitSec && prev.version === version
        ? prev
        : { visitSec, version, times: buildTimes() }
    );
  }, [buildTimes, getCurrentVisitMs]);

  // 1) Đổi câu: chốt thời gian câu cũ, reset đồng hồ cho câu mới
  useEffect(() => {
    const next = isValidIndex(currentIndex) ? currentIndex : null;
    if (next === trackedIndexRef.current) return;
    const prev = trackedIndexRef.current;
    if (prev !== null) {
      const ms = getCurrentVisitMs();
      if (ms > 0) {
        totalsMsRef.current[prev] = (totalsMsRef.current[prev] || 0) + ms;
      }
    }
    visitMsRef.current = 0;
    segmentStartRef.current = next !== null && isExamRunning ? nowMs() : null;
    trackedIndexRef.current = next;
    versionRef.current += 1;
    sync();
  }, [currentIndex, isExamRunning, getCurrentVisitMs, sync]);

  // 2) Tạm dừng / tiếp tục
  useEffect(() => {
    if (isExamRunning && trackedIndexRef.current !== null) {
      if (segmentStartRef.current === null) segmentStartRef.current = nowMs();
    } else if (segmentStartRef.current !== null) {
      visitMsRef.current += Math.max(0, nowMs() - segmentStartRef.current);
      segmentStartRef.current = null;
    }
    versionRef.current += 1;
    sync();
  }, [isExamRunning, sync]);

  // 3) Nhịp cập nhật UI
  useEffect(() => {
    if (!isExamRunning) return undefined;
    const id = setInterval(sync, TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isExamRunning, sync]);

  // 4) Đồng bộ khi chuyển tab trình duyệt
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') sync();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [sync]);

  const { warning, standard } = getPacingConfig(section);
  const timeOnCurrentQuestion = snapshot.visitSec;
  const isOvertimeWarning = Boolean(isExamRunning) && timeOnCurrentQuestion > warning;
  const isTimeWarning = isOvertimeWarning; // Tương thích ngược

  const pacingStatus = isOvertimeWarning
    ? 'OVERTIME_WARNING'
    : timeOnCurrentQuestion < FAST_QUESTION_THRESHOLD
    ? 'RUSHING'
    : 'ON_PACE';

  const getPacingSummary = useCallback(() => {
    const config = getPacingConfig(section);
    const times = buildTimes();
    const entries = Object.entries(times)
      .map(([key, seconds]) => [Number(key), Number(seconds)])
      .filter(([index, seconds]) => Number.isFinite(index) && Number.isFinite(seconds))
      .sort((a, b) => a[0] - b[0]);
    const totalTime = entries.reduce((sum, [, seconds]) => sum + seconds, 0);
    const questionCount = entries.length;

    const slowQuestions = entries.filter(([, s]) => s > config.warning).map(([i]) => i);
    const fastQuestions = entries.filter(([, s]) => s < FAST_QUESTION_THRESHOLD).map(([i]) => i);

    return {
      avgTimePerQuestion: questionCount > 0 ? Math.round((totalTime / questionCount) * 10) / 10 : 0,
      totalTime,
      questionCount,
      slowQuestions,
      overtimeQuestions: slowQuestions,
      fastQuestions,
      thresholds: {
        standard: config.standard,
        warning: config.warning,
        fast: FAST_QUESTION_THRESHOLD,
      },
      hasOvertimeWarning: slowQuestions.length > 0,
      questionTimes: times,
    };
  }, [section, buildTimes]);

  const resetPacing = useCallback(() => {
    totalsMsRef.current = {};
    visitMsRef.current = 0;
    segmentStartRef.current = isValidIndex(trackedIndexRef.current) && isExamRunning ? nowMs() : null;
    versionRef.current += 1;
    sync();
  }, [isExamRunning, sync]);

  return {
    timeOnCurrentQuestion,
    isTimeWarning,
    isOvertimeWarning,
    pacingStatus,
    questionTimes: snapshot.times,
    getPacingSummary,
    resetPacing,
  };
};

export default usePacingTracker;
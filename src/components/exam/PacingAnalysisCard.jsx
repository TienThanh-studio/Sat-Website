import React, { useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flag,
  Gauge,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';

const SECTION_CONFIG = {
  'Reading & Writing': { official: 71, standard: 75, warning: 90 },
  Math: { official: 95, standard: 95, warning: 120 },
};

const RUSHING_THRESHOLD = 25; // giây
const ON_PACE_TOLERANCE = 3; // giây

const getConfig = (section) => (section === 'Math' ? SECTION_CONFIG.Math : SECTION_CONFIG['Reading & Writing']);

const toSeconds = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const formatSeconds = (value) => `${Math.round(toSeconds(value))}s`;

const formatClock = (value) => {
  const total = Math.round(toSeconds(value));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const IssueChip = ({ number, seconds, tone }) => {
  const toneClass =
    tone === 'red'
      ? 'border-red-200 text-red-700'
      : 'border-amber-200 text-amber-700';
  return (
    <li className={`flex items-center gap-2 rounded-lg border bg-white px-2.5 py-1.5 text-xs ${toneClass}`}>
      <span className="font-semibold text-slate-900">Câu {number}</span>
      <span className="tabular-nums font-medium font-mono">{formatSeconds(seconds)}</span>
      <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">Sai</span>
    </li>
  );
};

const InsightPanel = ({ icon: Icon, title, subtitle, tone, items, tip, emptyText, hasCorrectness }) => {
  const shell =
    tone === 'red'
      ? 'border-red-200 bg-red-50/60'
      : 'border-amber-200 bg-amber-50/60';
  const iconWrap = tone === 'red' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600';
  return (
    <section className={`rounded-xl border p-4 ${shell}`}>
      <div className="flex items-start gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconWrap}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
          <p className="text-xs text-slate-600">{subtitle}</p>
        </div>
        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-700 ring-1 ring-slate-200">
          {items.length}
        </span>
      </div>
      {!hasCorrectness ? (
        <p className="mt-3 text-xs text-slate-500">
          Chưa có dữ liệu đúng/sai của từng câu để phân tích bẫy nhịp độ.
        </p>
      ) : items.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {emptyText}
        </p>
      ) : (
        <>
          <ul className="mt-3 flex flex-wrap gap-2">
            {items.map((item) => (
              <IssueChip key={item.index} number={item.index + 1} seconds={item.seconds} tone={tone} />
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-slate-700">{tip}</p>
        </>
      )}
    </section>
  );
};

export const PacingAnalysisCard = ({ questionTimes, questions, section }) => {
  const config = getConfig(section);
  const sectionLabel = section === 'Math' ? 'Math' : 'Reading & Writing';

  const rows = useMemo(() => {
    const times = questionTimes && typeof questionTimes === 'object' ? questionTimes : {};
    const list = Array.isArray(questions) ? questions : [];
    const keys = Object.keys(times)
      .map(Number)
      .filter((k) => Number.isInteger(k) && k >= 0);
    const total = Math.max(list.length, keys.length > 0 ? Math.max(...keys) + 1 : 0);
    return Array.from({ length: total }, (_, index) => {
      const raw = times[index];
      const question = list[index];
      return {
        index,
        seconds: toSeconds(raw),
        tracked: raw !== undefined && raw !== null,
        isCorrect: question && typeof question.isCorrect === 'boolean' ? question.isCorrect : null,
      };
    });
  }, [questionTimes, questions]);

  const analysis = useMemo(() => {
    const tracked = rows.filter((r) => r.tracked);
    const totalSeconds = tracked.reduce((sum, r) => sum + r.seconds, 0);
    const avg = tracked.length > 0 ? totalSeconds / tracked.length : 0;
    return {
      trackedCount: tracked.length,
      totalSeconds,
      avg,
      maxSeconds: rows.reduce((max, r) => Math.max(max, r.seconds), 0),
      overWarningCount: tracked.filter((r) => r.seconds > config.warning).length,
      hasCorrectness: rows.some((r) => r.isCorrect !== null),
      timeSinks: tracked.filter((r) => r.seconds > config.warning && r.isCorrect === false),
      rushing: tracked.filter((r) => r.seconds < RUSHING_THRESHOLD && r.isCorrect === false),
    };
  }, [rows, config.warning]);

  if (analysis.trackedCount === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <Gauge className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Phân tích nhịp độ làm bài</h3>
            <p className="text-xs text-slate-500">
              Chưa có dữ liệu thời gian ghi nhận cho bài thi này.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const diff = analysis.avg - config.official;
  const onPace = Math.abs(diff) <= ON_PACE_TOLERANCE;
  const slower = diff > ON_PACE_TOLERANCE;
  const verdict = onPace
    ? { text: 'Sát nhịp chuẩn', badge: 'bg-emerald-100 text-emerald-700', Icon: CheckCircle2 }
    : slower
    ? { text: `Chậm hơn ${Math.round(diff)}s/câu`, badge: 'bg-orange-100 text-orange-700', Icon: TrendingUp }
    : { text: `Nhanh hơn ${Math.round(Math.abs(diff))}s/câu`, badge: 'bg-sky-100 text-sky-700', Icon: TrendingDown };

  const compareMax = Math.max(analysis.avg, config.official, 1) * 1.08;
  const userBarWidth = Math.min(100, (analysis.avg / compareMax) * 100);
  const officialBarWidth = Math.min(100, (config.official / compareMax) * 100);
  const userBarColor = onPace ? 'bg-emerald-500' : slower ? 'bg-orange-500' : 'bg-sky-500';

  const chartMax = Math.max(config.warning * 1.15, analysis.maxSeconds, 1);
  const labelEvery = rows.length > 30 ? 5 : rows.length > 15 ? 2 : 1;

  const barTone = (row) => {
    if (!row.tracked) return 'bg-slate-200';
    if (row.seconds > config.warning) return 'bg-red-500';
    if (row.seconds > config.standard) return 'bg-orange-400';
    return 'bg-sky-500';
  };

  const dotTone = (row) =>
    row.isCorrect === true ? 'bg-emerald-500' : row.isCorrect === false ? 'bg-rose-500' : 'bg-slate-300';

  const standardLine = (config.standard / chartMax) * 100;
  const warningLine = (config.warning / chartMax) * 100;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
          <Gauge className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Phân tích nhịp độ làm bài (Pacing Insights)</h3>
          <p className="text-xs text-slate-500">
            {sectionLabel} • {analysis.trackedCount} câu được ghi nhận thời gian
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 p-4 md:col-span-2 bg-slate-50/50">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-600">Thời gian trung bình mỗi câu</p>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${verdict.badge}`}>
              <verdict.Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {verdict.text}
            </span>
          </div>
          <div className="mt-3 space-y-2.5">
            <div>
              <div className="mb-1 flex items-baseline justify-between text-xs">
                <span className="font-bold text-slate-900">Bạn</span>
                <span className="text-base font-extrabold tabular-nums font-mono text-slate-900">
                  {analysis.avg.toFixed(1)}s
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div className={`h-full rounded-full ${userBarColor}`} style={{ width: `${userBarWidth}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-baseline justify-between text-xs">
                <span className="text-slate-500">Chuẩn College Board</span>
                <span className="font-semibold tabular-nums font-mono text-slate-500">{config.official}s</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-slate-400" style={{ width: `${officialBarWidth}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
          <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              Tổng thời gian
            </div>
            <p className="mt-1 text-lg font-black tabular-nums font-mono text-slate-900">
              {formatClock(analysis.totalSeconds)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
              Câu quá {config.warning}s
            </div>
            <p className="mt-1 text-lg font-black tabular-nums font-mono text-slate-900">
              {analysis.overWarningCount}
              <span className="ml-1 text-xs font-normal text-slate-400">/ {analysis.trackedCount}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2 bẫy nhịp độ */}
      <div className="grid gap-3 md:grid-cols-2">
        <InsightPanel
          icon={Flag}
          tone="red"
          title="Bẫy sa lầy thời gian (Time Sink)"
          subtitle={`Mất hơn ${config.warning}s nhưng vẫn trả lời sai`}
          items={analysis.timeSinks}
          hasCorrectness={analysis.hasCorrectness}
          emptyText="Không có câu nào vừa chậm vừa sai. Bạn phân bổ nhịp rất tốt!"
          tip={`Khi một câu chạm khoảng ${config.standard}s mà chưa tìm được hướng giải quyết, hãy bấm Bookmark (Flag) và Next ngay sang câu tiếp theo để tránh bị thiếu giờ.`}
        />
        <InsightPanel
          icon={Zap}
          tone="amber"
          title="Lỗi vội vàng (Rushing Error)"
          subtitle={`Làm dưới ${RUSHING_THRESHOLD}s và trả lời sai`}
          items={analysis.rushing}
          hasCorrectness={analysis.hasCorrectness}
          emptyText="Không có câu nào làm quá vội mà bị sai."
          tip="Những câu này thường bị mất điểm oan do đọc ẩu hoặc dính bẫy từ khóa (như NOT, EXCEPT, least). Hãy gạch bỏ ít nhất 2 phương án sai trước khi chọn."
        />
      </div>

      {/* Biểu đồ thời gian từng câu */}
      <div className="pt-2">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Thời gian từng câu</h4>
          <ul className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-500">
            <li className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-xs bg-sky-500" /> Chuẩn
            </li>
            <li className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-xs bg-orange-400" /> &gt; {config.standard}s
            </li>
            <li className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-xs bg-red-500" /> &gt; {config.warning}s
            </li>
          </ul>
        </div>
        <div className="overflow-x-auto pb-1">
          <div style={{ minWidth: `${Math.max(rows.length * 16, 240)}px` }}>
            <div className="relative h-28 border-b border-slate-200">
              <div className="absolute inset-x-0 border-t border-dashed border-orange-300" style={{ bottom: `${standardLine}%` }} />
              <div className="absolute inset-x-0 border-t border-dashed border-red-300" style={{ bottom: `${warningLine}%` }} />
              <div className="absolute inset-0 flex items-end gap-1">
                {rows.map((row) => {
                  const height = row.tracked ? Math.max((row.seconds / chartMax) * 100, 3) : 3;
                  return (
                    <div
                      key={row.index}
                      className="flex h-full min-w-0 flex-1 items-end"
                      title={`Câu ${row.index + 1}: ${row.tracked ? formatSeconds(row.seconds) : 'chưa có dữ liệu'}${row.isCorrect === null ? '' : row.isCorrect ? ' (Đúng)' : ' (Sai)'}`}
                    >
                      <div className={`w-full rounded-t ${barTone(row)} transition-all`} style={{ height: `${height}%` }} />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-1 flex gap-1">
              {rows.map((row) => (
                <div key={row.index} className="flex min-w-0 flex-1 flex-col items-center">
                  <span className={`h-1.5 w-1.5 rounded-full ${dotTone(row)} mb-0.5`} />
                  <span className="text-[9px] font-mono text-slate-400">
                    {(row.index === 0 || (row.index + 1) % labelEvery === 0) ? row.index + 1 : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PacingAnalysisCard;
import React, { useState, useEffect } from 'react';
import { ProcessAnalytics, TraceVariant } from '../types.js';
import {
  GitBranch,
  Clock,
  RotateCcw,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Award,
  Layers,
  Sparkles,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

interface ProcessMiningViewProps {
  lang: 'en' | 'ar';
}

export const ProcessMiningView: React.FC<ProcessMiningViewProps> = ({ lang }) => {
  const isAr = lang === 'ar';

  const [analytics, setAnalytics] = useState<ProcessAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<TraceVariant | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const res = await fetch('/api/process-analytics');
        if (res.ok) {
          const data: ProcessAnalytics = await res.json();
          setAnalytics(data);
          if (data.traceVariants.length > 0) {
            setSelectedVariant(data.traceVariants[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load process analytics', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading || !analytics) {
    return (
      <div className="p-12 text-center rounded-xl border border-slate-200 bg-white">
        <GitBranch className="w-8 h-8 text-[#D71921] animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Mining 5,453 synthetic process events across 820 cases...</p>
      </div>
    );
  }

  const { summary, traceVariants, transitionLatencies, pingPongByDepartment, quantifiedRecommendations } = analytics;

  // Latency chart data for top transition pairs
  const latencyChartData = transitionLatencies.slice(0, 6).map(t => ({
    name: `${t.fromActivity.slice(0, 14)}.. → ${t.toActivity.slice(0, 14)}..`,
    fullFrom: t.fromActivity,
    fullTo: t.toActivity,
    hours: t.avgDurationHours,
    isBottleneck: t.isBottleneck,
    driver: t.delayDriver
  }));

  // Ping-pong chart data by department
  const deptChartData = pingPongByDepartment.map(d => ({
    department: d.department,
    returnRate: d.returnRate,
    returnsCount: d.returnsCount,
    topReason: d.topReturnReason
  }));

  return (
    <div className="space-y-6">
      {/* Top Header & Executive Summary KPI Strip */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D71921]">
              {isAr ? 'الوحدة الثالثة: تعدين العمليات وتحسين التدفق' : 'Module 3: Process Mining & Optimization'}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-medium">
              {isAr ? 'تحليل سجل الأحداث (٥،٤٥٣ حدثاً عبر ٨٢٠ معاملة)' : 'Event Log Analysis (p2p_event_log.csv · 5,453 Events)'}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">
            {isAr ? 'محرك تعدين العمليات واكتشاف الاختناقات' : 'Process Mining & Bottleneck Discovery Engine'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            {isAr
              ? 'تحليل تسلسل العمليات واكتشاف الاختناقات وحلقات الإرجاع المكررة بين المدراء والموارد البشرية، مع احتساب العائد الكمي من التدقيق المسبق.'
              : 'Automated event correlation across 820 historical cases. Discovers process trace variants, ping-pong return loops between Line Managers and HR, and calculates quantified ROI interventions.'}
          </p>
        </div>

        {/* 4 Core KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm pt-2 border-t border-slate-100">
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
            <div className="text-xs text-slate-500 font-medium">
              {isAr ? 'سجل الأحداث المحلل' : 'Analyzed Event Corpus'}
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {summary.totalEvents.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-500">
                {isAr ? `حدث (${summary.totalCases} معاملة)` : `events (${summary.totalCases} cases)`}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              {isAr ? 'بيانات ١٢ شهراً لمجموعة الإمارات' : '12-month Emirates dataset'}
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
            <div className="text-xs text-slate-500 font-medium">
              {isAr ? 'صحيح من المرة الأولى (FTR)' : 'First Time Right (FTR)'}
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {summary.firstTimeRightRate}%
              </span>
              <span className="text-[11px] text-emerald-600 font-medium">+18.2% YoY</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-emerald-600" style={{ width: `${summary.firstTimeRightRate}%` }} />
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
            <div className="text-xs text-slate-500 font-medium">
              {isAr ? 'نسبة حلقات الإرجاع المكررة' : 'Ping-Pong Return Loop Rate'}
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono tabular-nums text-red-700">
                {summary.returnLoopRate}%
              </span>
              <span className="text-[11px] text-slate-500">{isAr ? 'إرجاع للمدير' : 'bounce to manager'}</span>
            </div>
            <p className="text-[11px] text-red-600 font-medium mt-1">
              {isAr ? 'يتم استئصالها بقواعد التحقق المسبق' : 'Eliminated by pre-submission rules'}
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
            <div className="text-xs text-slate-500 font-medium">
              {isAr ? 'متوسط زمن المعاملة' : 'Avg End-to-End Cycle'}
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {summary.avgCycleTimeDays}
              </span>
              <span className="text-[11px] text-slate-500">{isAr ? 'أيام عمل' : 'working days'}</span>
            </div>
            <p className="text-[11px] text-[#BA9653] font-medium mt-1">
              {isAr ? 'المسار السريع يقلصها إلى ٠.٩ يوم' : 'Express Lane reduces to 0.9 days'}
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Quantified Recommendations Table */}
      <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#D71921] flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              <span>
                {isAr ? 'جدول التوصيات الكمية لتحسين دورة المعاملات' : 'Quantified Optimization Recommendations (SLA Interventions)'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAr
                ? 'إجراءات هندسة العمليات المركزة لمعالجة أهم ثلاثة اختناقات أظهرها تعدين الأحداث.'
                : 'Targeted process re-engineering based on the top 3 process mining bottlenecks.'}
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {isAr ? 'الأثر التراكمي: توفير ~٧.٥ أيام عمل / طلب' : 'Cumulative Impact: ~7.5 Days Saved / Request'}
            </span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse" dir={isAr ? 'rtl' : 'ltr'}>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">{isAr ? 'الاختناق المرصود' : 'Identified Bottleneck'}</th>
                <th className="py-2.5 px-3">{isAr ? 'السبب الجذري في السجل' : 'Root Cause In Event Log'}</th>
                <th className="py-2.5 px-3">{isAr ? 'الإجراء التحسيني' : 'Process Intervention'}</th>
                <th className="py-2.5 px-3 text-right">{isAr ? 'الوفر الزمني' : 'Est. Days Saved'}</th>
                <th className="py-2.5 px-3 text-right">{isAr ? 'الأثر السنوي' : 'Annual Impact'}</th>
                <th className="py-2.5 px-3">{isAr ? 'حالة النظام' : 'System Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {quantifiedRecommendations.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                    {isAr
                      ? rec.issue === 'Grade Mismatch Returns'
                        ? 'إرجاعات عدم تطابق الدرجات'
                        : rec.issue === 'Missing Attachments & Budget Codes'
                        ? 'نقص المستندات ورموز الميزانية'
                        : 'أعباء مراجعة النقل الجانبي'
                      : rec.issue}
                  </td>
                  <td className="py-3 px-3 text-slate-600 max-w-xs">{rec.rootCause}</td>
                  <td className="py-3 px-3 text-slate-800 max-w-xs font-medium">
                    {rec.intervention}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 tabular-nums whitespace-nowrap">
                    -{rec.estimatedDaysSaved} {isAr ? 'أيام' : 'days'}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600 font-mono tabular-nums whitespace-nowrap">
                    {rec.roiImpact}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        rec.status === 'Active Rule Deployed'
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : 'text-blue-700 bg-blue-50 border-blue-200'
                      }`}
                    >
                      {isAr
                        ? rec.status === 'Active Rule Deployed'
                          ? 'قاعدة نشطة ومفعلة'
                          : 'أتمتة موصى بها'
                        : rec.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Process Trace Variants Explorer */}
      <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#BA9653]" />
            <span>
              {isAr ? 'مستكشف مسارات تنفيذ العمليات (Trace Variants)' : 'Process Trace Variant Explorer'}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAr
              ? 'حدد نمط مسار منفذ لفحص مخطط انتقال الأنشطة وتوزيع أزمنة الاستجابة بين المراحل.'
              : 'Select an executed trace pattern to inspect the activity transition graph and latency distribution.'}
          </p>
        </div>

        {/* Variant Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {traceVariants.map(v => {
            const isSelected = selectedVariant?.id === v.id;
            return (
              <div
                key={v.id}
                onClick={() => setSelectedVariant(v)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#D71921] bg-red-50/40 ring-1 ring-[#D71921] shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-800">{v.id}</span>
                  <span className="font-mono font-semibold text-slate-600">
                    {v.casePercentage}% {isAr ? 'من الحالات' : 'of cases'}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-900 line-clamp-1">{v.name}</h4>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{v.caseCount} {isAr ? 'معاملة' : 'cases'}</span>
                  <span className="font-mono font-bold text-slate-700">
                    ~{v.avgDurationDays} {isAr ? 'أيام كمتوسط' : 'days avg'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Variant Flow Visualizer */}
        {selectedVariant && (
          <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-bold text-slate-900">
                  {selectedVariant.name}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">{selectedVariant.description}</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {selectedVariant.hasReturnLoop ? (
                  <span className="inline-flex items-center gap-1 text-red-700 font-semibold bg-red-100 px-2 py-0.5 rounded">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تم رصد حلقة إرجاع مكررة (Ping-Pong Loop)' : 'Ping-Pong Loop Detected'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isAr ? 'مسار مباشر وسلس من المرة الأولى' : 'Clean Straight-Through Path'}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Visual Step Sequence Chain */}
            <div className="flex flex-wrap items-center gap-2 py-2">
              {selectedVariant.steps.map((step, idx) => {
                const isReturn = step.includes('Returned');
                const isFinish = step.includes('ERP') || step.includes('Cancelled');

                return (
                  <React.Fragment key={idx}>
                    <div
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 shadow-xs ${
                        isReturn
                          ? 'border-red-300 bg-red-50 text-red-900 font-bold'
                          : isFinish
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-800'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-[10px] flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>

                    {idx < selectedVariant.steps.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Transition Latencies & Department Ping-Pong Analysis Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step Transition Latency Chart */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#D71921]" />
                <span>{isAr ? 'أزمنة الانتقال بين المراحل (بالساعات)' : 'Step Transition Latencies (Hours)'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? 'الأعمدة الحمراء تشير إلى الاختناقات التنظيمية الرئيسية وأوقات الانتظار الحرجة.'
                  : 'Red bars denote major organizational bottlenecks.'}
              </p>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {isAr ? 'متوسط الزمن (ساعة)' : 'Avg Duration (h)'}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={latencyChartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fontSize: 11 }} unit="h" />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} ${isAr ? 'ساعات' : 'hours'}`, isAr ? 'متوسط زمن الانتظار' : 'Avg Latency']}
                  labelFormatter={(_: any, payload: any) => {
                    if (payload && payload[0]) {
                      const d = payload[0].payload;
                      return `${d.fullFrom} → ${d.fullTo}`;
                    }
                    return '';
                  }}
                  contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                />
                <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
                  {latencyChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isBottleneck ? '#D71921' : '#64748B'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              <strong>{isAr ? 'الاختناق الرئيسي:' : 'Primary Bottleneck:'}</strong>{' '}
              {isAr
                ? 'فترة انتظار الإرجاع لمدير الخط تستهلك ٤٢.٠ ساعة (٣.٥ أيام عمل مهدرة) قبل إعادة التقديم.'
                : 'Returned to Manager queue accounts for 42.0 hours (3.5 days idle waiting time) before resubmission.'}
            </span>
          </div>
        </div>

        {/* Ping-Pong Loop Analysis by Department */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-[#BA9653]" />
                <span>{isAr ? 'تكرار إرجاع المعاملات حسب الإدارة (٪)' : 'Department Ping-Pong Return Frequency (%)'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? 'نسبة المعاملات المرتجعة من الموارد البشرية موزعة حسب قطاعات الأعمال.'
                  : 'Percentage of requests bounced back by HR Ops by business unit.'}
              </p>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {isAr ? 'نسبة الإرجاع ٪' : 'Return Rate %'}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={deptChartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="department" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis unit="%" tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any, _: any, entry: any) => [
                    `${val}% ${isAr ? 'نسبة إرجاع' : 'return rate'} (${entry.payload.returnsCount} ${isAr ? 'حالات' : 'cases'})`,
                    `${isAr ? 'السبب الأبرز:' : 'Top Cause:'} ${entry.payload.topReason}`
                  ]}
                  contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                />
                <Bar dataKey="returnRate" fill="#0F172A" radius={[4, 4, 0, 0]}>
                  {deptChartData.map((_, index) => (
                    <Cell
                      key={`dept-cell-${index}`}
                      fill={index === 0 ? '#D71921' : index === 1 ? '#BA9653' : '#334155'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-xs text-slate-500 flex items-center justify-between pt-1">
            <span>
              {isAr ? 'السبب الأكثر شيوعاً لإرجاع الطلبات عبر كافة الإدارات:' : 'Highest return driver across all depts:'}{' '}
              <strong>{isAr ? 'عدم تطابق الدرجات في النقل الجانبي' : 'Grade Discrepancy on Lateral Transfers'}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

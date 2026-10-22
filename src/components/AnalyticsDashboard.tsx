import React, { useState, useEffect, useMemo } from 'react';
import { AnalyticsOverview } from '../types.js';
import { translations } from '../utils/i18n.js';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Award,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Download,
  RefreshCw,
  Sliders,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building,
  Info,
  ChevronDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  ReferenceLine
} from 'recharts';

interface AnalyticsDashboardProps {
  lang: 'en' | 'ar';
  role: 'manager' | 'hr';
  onNavigateToTracker?: () => void;
}

const RISK_COLORS = {
  low: '#10B981', // Emerald
  med: '#F59E0B', // Amber
  high: '#EF4444' // Rose / Red
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  lang,
  role,
  onNavigateToTracker
}) => {
  const isAr = lang === 'ar';
  const t = isAr ? translations.ar : translations.en;

  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [timeRange, setTimeRange] = useState<'30d' | 'q3' | 'q4' | 'ytd'>('ytd');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // ROI Simulator interactive state
  const [simVolume, setSimVolume] = useState<number>(3500);
  const [simHourlyCost, setSimHourlyCost] = useState<number>(275);
  const [simTargetRft, setSimTargetRft] = useState<number>(90);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/analytics/overview');
      if (res.ok) {
        const json: AnalyticsOverview = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load analytics overview:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Filtered department efficiency based on dropdown
  const filteredDepartments = useMemo(() => {
    if (!data) return [];
    if (selectedDept === 'all') return data.departmentEfficiency;
    return data.departmentEfficiency.filter(d => d.department === selectedDept);
  }, [data, selectedDept]);

  // Dynamic calculations for the ROI Simulator
  const simulatedSavings = useMemo(() => {
    // Baseline rework rate was ~42%, current target reduces it to (100 - simTargetRft)%
    const baselineReworkRate = 0.42;
    const targetReworkRate = Math.max(0.02, (100 - simTargetRft) / 100);
    const avoidedReworkCases = Math.round(simVolume * (baselineReworkRate - targetReworkRate));

    // Each rework case previously required ~11.5 specialist & manager hours across cycles
    const hoursPerReworkCase = 11.5;
    const totalHoursSaved = Math.round(avoidedReworkCases * hoursPerReworkCase);
    const totalAedSaved = Math.round(totalHoursSaved * simHourlyCost);

    // Days saved: baseline cycle ~14.6 days, target cycle ~3.1 days
    const averageDaysSavedPerCase = 11.5;

    return {
      avoidedReworkCases,
      totalHoursSaved,
      totalAedSaved,
      averageDaysSavedPerCase
    };
  }, [simVolume, simHourlyCost, simTargetRft]);

  const handleExportReport = () => {
    if (!data) return;
    const reportData = {
      reportTitle: 'Emirates Group Right First Time (RFT) - P2P Analytics Brief',
      generatedAt: new Date().toISOString(),
      timeRange,
      selectedDepartment: selectedDept,
      summaryKPIs: data.summary,
      roiSimulation: {
        inputs: { simVolume, simHourlyCost, simTargetRft },
        projectedSavings: simulatedSavings
      },
      departmentEfficiency: data.departmentEfficiency,
      tatComparison: data.tatComparison,
      rejectionRootCauses: data.rejectionRootCauses
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Emirates_P2P_RFT_Analytics_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !data) {
    return (
      <div className="p-16 text-center rounded-xl border border-slate-200 bg-white">
        <RefreshCw className="w-8 h-8 text-[#D71921] animate-spin mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-800">
          {isAr ? 'جاري تجميع تحليلات العمليات ومؤشرات الأداء...' : 'Synthesizing P2P Operations Analytics & Graphs...'}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {isAr ? 'معالجة ٨٢٠ معاملة سابقة وسجلات الربط مع نظام ERP' : 'Correlating 820 historical cases & live in-flight transaction metrics'}
        </p>
      </div>
    );
  }

  const { summary, monthlyTrend, tatComparison, rejectionRootCauses, riskDistribution } = data;

  const pieData = [
    { name: isAr ? 'منخفض المخاطر (مؤهل للمسار السريع)' : 'Low Risk (Express Eligible)', value: riskDistribution.lowRisk.percentage, count: riskDistribution.lowRisk.count, color: RISK_COLORS.low },
    { name: isAr ? 'متوسط المخاطر (مراجعة معيارية)' : 'Medium Risk (Standard Review)', value: riskDistribution.mediumRisk.percentage, count: riskDistribution.mediumRisk.count, color: RISK_COLORS.med },
    { name: isAr ? 'عالي المخاطر (تدقيق تخصصي ولجنة)' : 'High Risk (Committee Review)', value: riskDistribution.highRisk.percentage, count: riskDistribution.highRisk.count, color: RISK_COLORS.high }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Strip */}
      <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D71921]">
                {isAr ? 'قطاع التحليلات الذكية وعمليات الموارد البشرية' : 'HR Operations Intelligence & Performance Analytics'}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-medium">
                {isAr ? 'البيانات الحية المجمعة من نظام ERP ومصنفات الذكاء الاصطناعي' : 'Live Emirates ERP & AI Inference Telemetry'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#D71921]" />
              <span>{t.analyticsTitle}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              {t.analyticsSubtitle}
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Timeframe Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  timeRange === '30d' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isAr ? 'آخر ٣٠ يوماً' : 'Last 30 Days'}
              </button>
              <button
                onClick={() => setTimeRange('q3')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  timeRange === 'q3' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isAr ? 'الربع الثالث' : 'Q3 2026'}
              </button>
              <button
                onClick={() => setTimeRange('q4')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  timeRange === 'q4' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isAr ? 'الربع الرابع' : 'Q4 2026'}
              </button>
              <button
                onClick={() => setTimeRange('ytd')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  timeRange === 'ytd' ? 'bg-[#0F172A] text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isAr ? 'منذ بداية العام (YTD)' : 'YTD 2026'}
              </button>
            </div>

            {/* Department Filter */}
            <div className="relative">
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 font-medium focus:ring-1 focus:ring-[#D71921] focus:outline-hidden"
              >
                <option value="all">{isAr ? 'كافة إدارات المجموعة' : 'All Business Units'}</option>
                <option value="Flight Operations">{isAr ? 'عمليات الطيران' : 'Flight Operations'}</option>
                <option value="Engineering">{isAr ? 'الهندسة والصيانة' : 'Emirates Engineering'}</option>
                <option value="Airport Operations">{isAr ? 'عمليات المطار و dnata' : 'Airport Operations / dnata'}</option>
                <option value="Commercial">{isAr ? 'القطاع التجاري' : 'Commercial'}</option>
                <option value="Emirates SkyCargo">{isAr ? 'الإمارات للشحن الجوي' : 'Emirates SkyCargo'}</option>
                <option value="Group IT">{isAr ? 'تقنية المعلومات' : 'Group IT'}</option>
                <option value="HR & Corporate">{isAr ? 'الموارد البشرية والإدارة' : 'HR & Corporate'}</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchAnalytics}
              disabled={refreshing}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all cursor-pointer"
              title={isAr ? 'تحديث البيانات' : 'Refresh Metrics'}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#D71921]' : ''}`} />
            </button>

            {/* Export Report */}
            <button
              onClick={handleExportReport}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.exportAnalytics}</span>
            </button>
          </div>
        </div>

        {/* 5 Core Executive KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-5 mt-4 border-t border-slate-100">
          {/* KPI 1: RFT Rate */}
          <div className="p-3.5 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>{t.kpiRftRate}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
                {summary.rftRate}%
              </span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                +{summary.rftGainPercentagePoints}%
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {isAr ? 'الأساس السابق: ٤١٫٢٪' : 'Baseline: 41.2% pre-AI'}
            </div>
          </div>

          {/* KPI 2: Average Turnaround Time */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>{t.kpiAvgCycle}</span>
              <Clock className="w-4 h-4 text-slate-600" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {summary.avgCycleDays} <span className="text-xs font-sans font-normal text-slate-500">{isAr ? 'أيام' : 'days'}</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                -{summary.cycleReductionPercentage}%
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {isAr ? 'الأساس السابق: ١٤٫٦ يوماً' : 'Baseline: 14.6 days'}
            </div>
          </div>

          {/* KPI 3: Express Lane Adoption */}
          <div className="p-3.5 rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50/40 to-white">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>{t.kpiExpressRate}</span>
              <Zap className="w-4 h-4 text-[#BA9653]" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono tabular-nums text-[#BA9653]">
                {summary.expressLaneShare}%
              </span>
              <span className="text-[11px] font-medium text-amber-700 bg-amber-100/60 px-1.5 py-0.2 rounded">
                {isAr ? 'مباشر إلى ERP' : 'Zero-touch'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {isAr ? 'تجاوز الفحص اليدوي تماماً' : 'Bypassed manual review'}
            </div>
          </div>

          {/* KPI 4: Financial Savings in AED */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>{t.kpiAedSavings}</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {(summary.annualAedSavings / 1000000).toFixed(2)}M
              </span>
              <span className="text-xs font-bold text-[#BA9653] font-mono">AED</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {isAr ? 'وفر تكاليف الإعادة والتأخير' : 'Eliminated rework waste'}
            </div>
          </div>

          {/* KPI 5: Man-Hours Saved */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>{t.kpiManHours}</span>
              <Award className="w-4 h-4 text-[#D71921]" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {summary.manHoursSaved.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">{isAr ? 'ساعة' : 'hrs'}</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">
              {isAr ? 'انخفاض عيوب الإرجاع: ٨٣٫٩٪' : 'Rework defect drop: 83.9%'}
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: Graph 1 (RFT Quality Trajectory) + Graph 5 (Risk Tier Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graph 1: Composed Area & Line Chart for RFT Trajectory */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D71921]">
                  {isAr ? 'تطور جودة المعاملات' : 'Process Quality Evolution'}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500 font-medium">
                  {isAr ? 'مقارنة الصواب من المرة الأولى بنسب الإرجاع' : 'RFT Rate vs Return Rework Loop'}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {t.graphRftTrend}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.graphRftTrendSubtitle}
              </p>
            </div>

            {/* Quick badges */}
            <div className="flex items-center gap-2 text-xs shrink-0">
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>RFT %</span>
              </span>
              <span className="flex items-center gap-1 text-[#D71921] font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D71921] inline-block" />
                <span>{isAr ? 'نسبة الإرجاع' : 'Return %'}</span>
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyTrend} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="rftGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey={isAr ? 'monthAr' : 'month'}
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#64748B"
                  fontSize={11}
                  domain={[0, 100]}
                  tickFormatter={val => `${val}%`}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#BA9653"
                  fontSize={11}
                  domain={[0, 600]}
                  tickFormatter={val => `${val}`}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="p-3 bg-slate-900 text-white rounded-lg shadow-xl border border-slate-800 text-xs space-y-1.5 font-sans">
                          <div className="font-bold text-[#BA9653] border-b border-slate-800 pb-1">
                            {isAr ? item.monthAr : item.month} 2026
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">{isAr ? 'معدل الصواب من أول مرة:' : 'Right First Time:'}</span>
                            <span className="font-mono font-bold text-emerald-400">{item.rftRate}%</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">{isAr ? 'نسبة الإرجاع للمدير:' : 'Return Defect Rate:'}</span>
                            <span className="font-mono font-bold text-rose-400">{item.returnRate}%</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">{isAr ? 'متوسط زمن الإنجاز:' : 'Avg Cycle Days:'}</span>
                            <span className="font-mono font-bold text-slate-200">{item.avgCycleDays} days</span>
                          </div>
                          <div className="flex justify-between gap-4 pt-1 border-t border-slate-800">
                            <span className="text-slate-400">{isAr ? 'حجم المعاملات الشهري:' : 'Monthly Volume:'}</span>
                            <span className="font-mono font-bold text-amber-300">{item.totalVolume} cases</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="rftRate"
                  name={isAr ? 'معدل RFT' : 'RFT Rate'}
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#rftGradient)"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="returnRate"
                  name={isAr ? 'نسبة الإرجاع' : 'Return Defect Rate'}
                  stroke="#D71921"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#D71921' }}
                />
                <Bar
                  yAxisId="right"
                  dataKey="expressVolume"
                  name={isAr ? 'معاملات المسار السريع' : 'Express Lane Cases'}
                  fill="#BA9653"
                  opacity={0.35}
                  barSize={16}
                  radius={[4, 4, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 5: Donut Chart for Predictive Risk Tier */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D71921]">
                {isAr ? 'توزيع المخاطر' : 'Risk Profiling'}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-medium">
                {isAr ? 'تصنيف الذكاء الاصطناعي' : 'Inference Tiers'}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              {t.graphRiskDistribution}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.graphRiskDistributionSubtitle}
            </p>
          </div>

          <div className="h-52 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const p = payload[0].payload;
                      return (
                        <div className="p-2.5 bg-slate-900 text-white rounded-lg shadow-lg text-xs space-y-1 font-sans">
                          <div className="font-bold" style={{ color: p.color }}>{p.name}</div>
                          <div>{p.value}% ({p.count} cases)</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Callout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold font-mono text-slate-900">
                {riskDistribution.lowRisk.percentage}%
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                {isAr ? 'مؤهل للأتمتة' : 'Express Pool'}
              </span>
            </div>
          </div>

          {/* Breakdown legend */}
          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            {pieData.map((tier, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tier.color }} />
                  <span className="text-slate-600 truncate max-w-[160px]">{tier.name}</span>
                </div>
                <div className="font-mono font-bold text-slate-800">
                  {tier.value}% <span className="text-[11px] font-normal text-slate-400">({tier.count})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Graph 2 (Departmental Breakdown) & Graph 3 (Turnaround Time vs SLA) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 2: Stacked Bar for Departmental Efficiency */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D71921]">
                  {isAr ? 'إنتاجية الإدارات' : 'Business Unit Yield'}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500 font-medium">
                  {isAr ? 'حالات المعالجة وتوزيع التدفق' : 'Status Distribution'}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {t.graphDeptEfficiency}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.graphDeptEfficiencySubtitle}
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredDepartments}
                margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey={isAr ? 'deptAr' : 'department'}
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  angle={-18}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="p-3 bg-slate-900 text-white rounded-lg shadow-xl text-xs space-y-1.5 font-sans">
                          <div className="font-bold text-[#BA9653] border-b border-slate-800 pb-1">
                            {isAr ? d.deptAr : d.department}
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-amber-400">{isAr ? 'المسار السريع (أتمتة):' : 'Express Lane:'}</span>
                            <span className="font-mono font-bold">{d.expressSynced}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-emerald-400">{isAr ? 'اعتماد من أول محاولة:' : 'HR Approved (1st Pass):'}</span>
                            <span className="font-mono font-bold">{d.hrApproved}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-sky-400">{isAr ? 'قيد المراجعة:' : 'In Review:'}</span>
                            <span className="font-mono font-bold">{d.inReview}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-rose-400">{isAr ? 'إرجاع وتصحيح:' : 'Rework / Returned:'}</span>
                            <span className="font-mono font-bold">{d.returnedCount}</span>
                          </div>
                          <div className="flex justify-between gap-4 pt-1 border-t border-slate-800 font-bold">
                            <span className="text-slate-300">{isAr ? 'معدل الصواب من أول مرة:' : 'FTR Rate:'}</span>
                            <span className="text-emerald-400">{d.ftrRate}%</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-300">{isAr ? 'الالتزام باتفاقية الخدمة:' : 'SLA Compliance:'}</span>
                            <span className="text-sky-300">{d.slaCompliance}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  iconSize={10}
                />
                <Bar dataKey="expressSynced" name={isAr ? 'المسار السريع (أتمتة)' : 'Express Lane'} fill="#BA9653" stackId="a" />
                <Bar dataKey="hrApproved" name={isAr ? 'معتمد من أول مرة' : 'Approved (1st Pass)'} fill="#10B981" stackId="a" />
                <Bar dataKey="inReview" name={isAr ? 'قيد المراجعة' : 'In Review'} fill="#0284C7" stackId="a" />
                <Bar dataKey="returnedCount" name={isAr ? 'إرجاع وتصحيح' : 'Rework / Returned'} fill="#F43F5E" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 3: Turnaround Time (Days) vs Emirates SLA */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D71921]">
                {isAr ? 'سرعة الإنجاز والامتثال' : 'Velocity & SLA Benchmarks'}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-medium">
                {isAr ? 'مقارنة الأيام السابقة بالمعجلة' : 'Baseline vs AI-Accelerated Cycle'}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              {t.graphTatComparison}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.graphTatComparisonSubtitle}
            </p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={tatComparison}
                margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey={isAr ? 'typeAr' : 'type'}
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  label={{
                    value: isAr ? 'الأيام' : 'Days',
                    angle: -90,
                    position: 'insideLeft',
                    fontSize: 10,
                    fill: '#64748B'
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="p-3 bg-slate-900 text-white rounded-lg shadow-xl text-xs space-y-1.5 font-sans">
                          <div className="font-bold text-[#BA9653] border-b border-slate-800 pb-1">
                            {isAr ? item.typeAr : item.type}
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">{isAr ? 'المدة السابقة (قبل التدقيق):' : 'Pre-AI Baseline:'}</span>
                            <span className="font-mono font-bold text-slate-200">{item.baselineDays} days</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-emerald-400">{isAr ? 'المدة الحالية بالذكاء الاصطناعي:' : 'Current AI-Assisted:'}</span>
                            <span className="font-mono font-bold text-emerald-400">{item.currentDays} days</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-amber-300">{isAr ? 'هدف اتفاقية الخدمة (SLA):' : 'Emirates SLA Target:'}</span>
                            <span className="font-mono font-bold text-amber-300">{item.slaTargetDays} days</span>
                          </div>
                          <div className="flex justify-between gap-4 pt-1 border-t border-slate-800 text-emerald-400 font-bold">
                            <span>{isAr ? 'نسبة تسريع الإنجاز:' : 'Turnaround Speedup:'}</span>
                            <span>+{item.speedupPct}% faster</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  iconSize={10}
                />
                <Bar dataKey="baselineDays" name={isAr ? 'المدة السابقة (أيام)' : 'Pre-AI Baseline (Days)'} fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="currentDays" name={isAr ? 'المدة الحالية بالذكاء الاصطناعي' : 'AI-Accelerated (Days)'} fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="slaTargetDays" name={isAr ? 'هدف SLA المحدد' : 'Emirates SLA Target'} fill="#BA9653" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Graph 4 (Pareto Root Causes of Historical Rejections) */}
      <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D71921]">
                {isAr ? 'تحليل الأسباب الجذرية' : 'Root Cause Elimination'}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-medium">
                {isAr ? 'العيوب التشغيلية التي تم منعها مسبقاً' : 'Historical Defect Distribution (Pre-Submission Prevented)'}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              {t.graphRootCauses}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.graphRootCausesSubtitle}
            </p>
          </div>

          <div className="text-xs text-slate-500 font-medium bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              {isAr ? 'تم منع ٨٢٠ حالة خطأ من الوصول لصندوق الوارد' : '820 Defects Prevented at Draft Stage'}
            </span>
          </div>
        </div>

        {/* Horizontal Visual Pareto Bars */}
        <div className="space-y-3 pt-2">
          {rejectionRootCauses.map((rc, idx) => (
            <div key={idx} className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">#0{idx + 1}</span>
                  <span className="font-semibold text-slate-800">
                    {isAr ? rc.reasonAr : rc.reason}
                  </span>
                  <span className="px-2 py-0.2 rounded text-[10px] font-medium bg-slate-200/70 text-slate-700">
                    {rc.category}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-slate-500">{rc.count} cases</span>
                  <span className="font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded">
                    {rc.percentage}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${rc.percentage}%`,
                    backgroundColor:
                      idx === 0
                        ? '#D71921' // Emirates Red for #1
                        : idx === 1
                        ? '#BA9653' // Gold for #2
                        : idx === 2
                        ? '#F59E0B'
                        : '#64748B'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 4: Interactive ROI & Capacity Simulator */}
      <div className="p-6 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-700 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#BA9653]">
                {isAr ? 'محاكي العائد المالي والاستثماري' : 'Interactive ROI & Capacity Engine'}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs text-slate-300 font-medium">
                {isAr ? 'نمذجة التوفير بحسب إحصاءات طيران الإمارات' : 'Emirates Group Operational Model'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#BA9653]" />
              <span>{t.roiSimulatorTitle}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              {t.roiSimulatorSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'نموذج موثق من قسم الكفاءة المؤسسية' : 'Verified OE Model'}</span>
            </span>
          </div>
        </div>

        {/* Simulator Controls & Output Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls (Left 6 cols) */}
          <div className="lg:col-span-6 space-y-5 bg-slate-800/60 p-5 rounded-xl border border-slate-700">
            {/* Slider 1: Annual P2P Volume */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">{t.annualVolumeSlider}</span>
                <span className="font-mono font-bold text-[#BA9653] text-sm">{simVolume.toLocaleString()} cases</span>
              </div>
              <input
                type="range"
                min="500"
                max="10000"
                step="250"
                value={simVolume}
                onChange={e => setSimVolume(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#D71921]"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>500</span>
                <span>5,000</span>
                <span>10,000 cases</span>
              </div>
            </div>

            {/* Slider 2: Specialist & Manager Hourly Cost */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">{t.hourlyCostSlider}</span>
                <span className="font-mono font-bold text-[#BA9653] text-sm">{simHourlyCost} AED/hr</span>
              </div>
              <input
                type="range"
                min="120"
                max="600"
                step="15"
                value={simHourlyCost}
                onChange={e => setSimHourlyCost(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#D71921]"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>120 AED</span>
                <span>350 AED</span>
                <span>600 AED/hr</span>
              </div>
            </div>

            {/* Slider 3: Target First-Pass RFT Rate */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">{t.targetRftSlider}</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{simTargetRft}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="98"
                step="1"
                value={simTargetRft}
                onChange={e => setSimTargetRft(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>50%</span>
                <span>75%</span>
                <span>98% RFT</span>
              </div>
            </div>
          </div>

          {/* Dynamic Calculated Cards (Right 6 cols) */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            {/* Output 1: Projected Financial Savings */}
            <div className="p-4 rounded-xl bg-slate-800/90 border border-emerald-500/30 flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium">
                  {isAr ? 'إجمالي الوفر المالي السنوي المتوقع' : 'Projected Annual Financial Savings'}
                </span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-black font-mono text-emerald-400">
                    {(simulatedSavings.totalAedSaved / 1000000).toFixed(2)}M
                  </span>
                  <span className="text-xs font-bold text-[#BA9653] font-mono">AED</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-700/60">
                {isAr
                  ? `بناءً على تفادي ${simulatedSavings.avoidedReworkCases.toLocaleString()} دورة إرجاع مكررة`
                  : `Based on avoiding ${simulatedSavings.avoidedReworkCases.toLocaleString()} rework cycles`}
              </div>
            </div>

            {/* Output 2: Total Hours Saved */}
            <div className="p-4 rounded-xl bg-slate-800/90 border border-amber-500/30 flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium">
                  {isAr ? 'ساعات العمل المستردة للإدارة' : 'Total Man-Hours Reclaimed'}
                </span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-black font-mono text-[#BA9653]">
                    {simulatedSavings.totalHoursSaved.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400 font-sans">{isAr ? 'ساعة' : 'hours'}</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-700/60">
                {isAr
                  ? 'تعادل طاقة استيعابية لـ ٧ موظفي موارد بشرية بدوام كامل'
                  : 'Equivalent to ~7 full-time HR specialists redirected to strategic advisory'}
              </div>
            </div>

            {/* Output 3: Days Saved per Candidate */}
            <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium">
                  {isAr ? 'متوسط الأيام الموفرة لكل مرشح' : 'Avg Calendar Days Saved / Case'}
                </span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-black font-mono text-white">
                    {simulatedSavings.averageDaysSavedPerCase}
                  </span>
                  <span className="text-xs text-slate-400">{isAr ? 'يوماً تقويمياً' : 'calendar days'}</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-700/60">
                {isAr ? 'تسريع التحاق الكوادر بالطائرات والعمليات' : 'Accelerates cockpit and ground staffing'}
              </div>
            </div>

            {/* Output 4: Express Lane Potential */}
            <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium">
                  {isAr ? 'طاقة أتمتة المسار السريع' : 'Express Lane Automation Capacity'}
                </span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-black font-mono text-sky-400">
                    {Math.round(simVolume * 0.315).toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400">{isAr ? 'معاملة/سنة' : 'cases/yr'}</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-700/60">
                {isAr ? 'معالجة فورية ومزامنة تلقائية مع ERP' : 'Zero manual touchpoints directly synced'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 5: Actionable Operational Insights & Fast Navigation */}
      <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-[#D71921] flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {isAr ? 'التوصية التنفيذية التالية' : 'Next Recommended Operational Action'}
              </h4>
              <p className="text-xs text-slate-500">
                {isAr
                  ? `توجد ${summary.activePending} معاملات قيد المعالجة حالياً. يمكنك الانتقال إلى رادار المخاطر لتطبيق الإجراءات الجماعية أو مراجعة الحالات.`
                  : `Currently ${summary.activePending} in-flight P2P requests active. Use the In-Flight Risk Radar to execute batch actions or review SHAP attributions.`}
              </p>
            </div>
          </div>

          {onNavigateToTracker && (
            <button
              onClick={onNavigateToTracker}
              className="px-4 py-2 rounded-lg bg-[#D71921] hover:bg-[#b5141b] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs shrink-0"
            >
              <span>{isAr ? 'فتح رادار المخاطر قيد التنفيذ' : 'Open In-Flight Radar'}</span>
              <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

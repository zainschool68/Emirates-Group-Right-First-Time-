import React, { useState, useEffect } from 'react';
import { DepartmentRiskSummary } from '../types.js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Building2,
  TrendingUp,
  Filter,
  Info
} from 'lucide-react';

interface PredictiveRiskHeatmapProps {
  lang: 'en' | 'ar';
  onSelectDepartmentFilter?: (dept: string) => void;
  selectedDepartment?: string;
}

export const PredictiveRiskHeatmap: React.FC<PredictiveRiskHeatmapProps> = ({
  lang,
  onSelectDepartmentFilter,
  selectedDepartment = 'all'
}) => {
  const isAr = lang === 'ar';
  const [data, setData] = useState<DepartmentRiskSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHeatmap = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/risk-heatmap');
      if (res.ok) {
        const heatmapData: DepartmentRiskSummary[] = await res.json();
        setData(heatmapData);
      }
    } catch (err) {
      console.error('Failed to load risk heatmap', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeatmap();
  }, []);

  // Format data for Recharts stacked bar
  const chartData = data.map(d => ({
    department: d.department,
    deptShort:
      d.department === 'Flight Operations'
        ? isAr ? 'عمليات الطيران' : 'Flight Ops'
        : d.department === 'Airport Operations'
        ? isAr ? 'عمليات المطار' : 'Airport Ops'
        : d.department === 'Commercial'
        ? isAr ? 'القطاع التجاري' : 'Commercial'
        : d.department === 'Engineering'
        ? isAr ? 'الهندسة والصيانة' : 'Engineering'
        : isAr ? 'الموارد البشرية' : 'HR',
    low: d.lowRiskCount,
    med: d.medRiskCount,
    high: d.highRiskCount,
    total: d.totalPending,
    avgReturn: d.avgReturnRisk,
    avgDelay: d.avgDelayRisk,
    highRiskPct: d.highRiskPercentage,
    alert: d.riskPocketAlert
  }));

  const totalHighRiskCases = data.reduce((acc, curr) => acc + curr.highRiskCount, 0);
  const totalCases = data.reduce((acc, curr) => acc + curr.totalPending, 0);

  return (
    <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D71921]">
              {isAr ? 'ذكاء المخاطر المؤسسية' : 'Organizational Risk Intelligence'}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-medium">
              {isAr ? 'خريطة توزيع المخاطر حسب الإدارة' : 'Department vs. Severity Distribution'}
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-0.5 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#D71921]" />
            <span>{isAr ? 'خريطة المخاطر التنبؤية (Predictive Risk Heatmap)' : 'Predictive Risk Heatmap'}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {isAr
              ? 'تحليل تركز المخاطر التنبؤية لطلبات النقل والتعيين المعلقة عبر إدارات مجموعة الإمارات لتحديد بؤر الخطر التنظيمية واتخاذ قرارات التدخل الاستباقي.'
              : 'Real-time severity distribution of active P2P requests across Emirates business units. Pinpoints high-risk organizational pockets for targeted human review.'}
          </p>
        </div>

        {/* Quick Summary Pill */}
        <div className="flex items-center gap-2 text-xs shrink-0 self-start sm:self-auto">
          <span className="px-3 py-1.5 rounded-lg bg-red-50 text-red-800 border border-red-200 font-medium flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span>
              {isAr
                ? `${totalHighRiskCases} حالات عالية الخطورة من أصل ${totalCases}`
                : `${totalHighRiskCases} High-Risk Pockets (${totalCases} Pending)`}
            </span>
          </span>
        </div>
      </div>

      {/* Main Stacked Bar Chart */}
      <div className="h-64 w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            {isAr ? 'جاري تحميل خريطة المخاطر...' : 'Loading risk distribution...'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload[0] && onSelectDepartmentFilter) {
                  const dept = e.activePayload[0].payload.department;
                  onSelectDepartmentFilter(dept);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="deptShort"
                tick={{ fontSize: 11 }}
                interval={0}
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1.5 border border-slate-700 max-w-xs">
                        <div className="font-bold text-[#BA9653] border-b border-slate-800 pb-1">
                          {d.department}
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-emerald-400">● {isAr ? 'منخفض الخطورة' : 'Low Risk (Express)'}:</span>
                          <span className="font-mono font-bold">{d.low}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-amber-400">● {isAr ? 'متوسط الخطورة' : 'Medium Risk'}:</span>
                          <span className="font-mono font-bold">{d.med}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-red-400">● {isAr ? 'عالي الخطورة' : 'High Risk'}:</span>
                          <span className="font-mono font-bold">{d.high}</span>
                        </div>
                        <div className="pt-1.5 border-t border-slate-800 text-[11px] text-slate-300">
                          <div>
                            {isAr ? 'متوسط خطر الإرجاع' : 'Avg Return Risk'}: <strong className="text-white font-mono">{d.avgReturn}%</strong>
                          </div>
                          <div>
                            {isAr ? 'متوسط خطر التأخير' : 'Avg Delay Risk'}: <strong className="text-white font-mono">{d.avgDelay}%</strong>
                          </div>
                          <div className="text-[#BA9653] font-semibold mt-1">
                            {d.alert}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                formatter={value => {
                  if (value === 'low') return isAr ? 'منخفض المخاطر (مؤهل للمسار السريع)' : 'Low Risk (Express Eligible)';
                  if (value === 'med') return isAr ? 'متوسط المخاطر (متابعة قياسية)' : 'Medium Risk (Standard Review)';
                  return isAr ? 'عالي المخاطر (بؤرة تدقيق عاجلة)' : 'High Risk (Audit Pocket)';
                }}
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              />
              <Bar dataKey="low" stackId="a" fill="#16A34A" radius={[0, 0, 0, 0]} cursor="pointer" />
              <Bar dataKey="med" stackId="a" fill="#D97706" radius={[0, 0, 0, 0]} cursor="pointer" />
              <Bar dataKey="high" stackId="a" fill="#DC2626" radius={[4, 4, 0, 0]} cursor="pointer" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Organizational Risk Pockets Table & Action Drilldown */}
      <div className="pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {isAr ? 'مؤشر بؤر المخاطر التنظيمية (Organizational Risk Index)' : 'Organizational Risk Pocket Index'}
          </span>
          <span className="text-[11px] text-slate-500">
            {isAr ? 'انقر على أي إدارة لتصفية الطلبات المعلقة فوراً' : 'Click any row to filter In-Flight requests'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {data.map(item => {
            const isCritical = item.highRiskPercentage >= 50;
            const isModerate = item.highRiskPercentage > 20 || item.medRiskCount >= 2;
            const isSelected = selectedDepartment === item.department;

            return (
              <div
                key={item.department}
                onClick={() => {
                  if (onSelectDepartmentFilter) {
                    onSelectDepartmentFilter(isSelected ? 'all' : item.department);
                  }
                }}
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#D71921] bg-red-50/50 ring-1 ring-[#D71921] shadow-xs'
                    : isCritical
                    ? 'border-red-200 bg-red-50/20 hover:border-red-300'
                    : isModerate
                    ? 'border-amber-200 bg-amber-50/20 hover:border-amber-300'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 line-clamp-1">{item.department}</span>
                  <span
                    className={`font-mono text-[11px] font-bold px-1.5 py-0.2 rounded ${
                      isCritical
                        ? 'bg-red-100 text-red-700'
                        : isModerate
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {item.highRiskPercentage}% {isAr ? 'عالي' : 'High'}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>{item.totalPending} {isAr ? 'طلبات' : 'cases'}</span>
                  <span>Ret: {item.avgReturnRisk}% / Del: {item.avgDelayRisk}%</span>
                </div>

                <p className="mt-1 text-[10px] text-slate-500 line-clamp-1 leading-tight">
                  {item.riskPocketAlert}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

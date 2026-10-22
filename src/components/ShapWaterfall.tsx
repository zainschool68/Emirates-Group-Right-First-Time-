import React from 'react';
import { ShapAttribution, RiskTier } from '../types.js';
import { AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Info } from 'lucide-react';

interface ShapWaterfallProps {
  shapValues: ShapAttribution[];
  returnRisk: number;
  delayRisk: number;
  riskTier: RiskTier;
  recommendedAction?: string;
  autoExpressLaneEligible?: boolean;
  predictedCycleDays?: number;
  compact?: boolean;
  lang?: 'en' | 'ar';
}

export const ShapWaterfall: React.FC<ShapWaterfallProps> = ({
  shapValues,
  returnRisk,
  delayRisk,
  riskTier,
  recommendedAction,
  autoExpressLaneEligible,
  predictedCycleDays,
  compact = false,
  lang = 'en'
}) => {
  const isAr = lang === 'ar';
  const tierColor =
    riskTier === 'High'
      ? 'text-red-700 bg-red-50 border-red-200'
      : riskTier === 'Medium'
      ? 'text-amber-800 bg-amber-50 border-amber-200'
      : 'text-emerald-700 bg-emerald-50 border-emerald-200';

  const tierText =
    riskTier === 'High'
      ? isAr ? 'عالي الخطورة' : 'High Risk'
      : riskTier === 'Medium'
      ? isAr ? 'متوسط الخطورة' : 'Medium Risk'
      : isAr ? 'منخفض الخطورة' : 'Low Risk';

  return (
    <div className="space-y-4">
      {/* Top Gauge Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
          <div className="text-xs text-slate-500 font-medium">{isAr ? 'خطر الإرجاع' : 'Return Risk'}</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {returnRisk}%
            </span>
            <span className="text-[11px] text-slate-500">{isAr ? 'احتمالية الإرجاع للمدير' : 'P(Bounce to Mgr)'}</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full ${
                returnRisk > 60 ? 'bg-red-600' : returnRisk > 30 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${returnRisk}%` }}
            />
          </div>
        </div>

        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
          <div className="text-xs text-slate-500 font-medium">{isAr ? 'خطر التأخير' : 'Delay Risk'}</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {delayRisk}%
            </span>
            <span className="text-[11px] text-slate-500">{isAr ? 'احتمالية تجاوز SLA' : 'P(SLA Breach)'}</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full ${
                delayRisk > 60 ? 'bg-red-600' : delayRisk > 30 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${delayRisk}%` }}
            />
          </div>
        </div>

        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
          <div className="text-xs text-slate-500 font-medium">{isAr ? 'المستوى العام للمخاطر' : 'Composite Tier'}</div>
          <div className="mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${tierColor}`}>
              {tierText}
            </span>
          </div>
          {predictedCycleDays && (
            <p className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
              {isAr ? `دورة متوقعة: ~${predictedCycleDays} أيام` : `Est. cycle: ~${predictedCycleDays} days`}
            </p>
          )}
        </div>

        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
          <div className="text-xs text-slate-500 font-medium">{isAr ? 'توجيه المسار' : 'Express Routing'}</div>
          <div className="mt-1">
            {autoExpressLaneEligible ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> {isAr ? 'مؤهل للمسار السريع' : 'Express Eligible'}
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-600">{isAr ? 'حوكمة قياسية' : 'Standard Governance'}</span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">XGBoost LightGBM v3.4</p>
        </div>
      </div>

      {/* Recommended Action */}
      {recommendedAction && (
        <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-blue-950">
              {isAr ? 'الإجراء الذكي الموصى به: ' : 'AI Recommended Next Action: '}
            </span>
            <span>{recommendedAction}</span>
          </div>
        </div>
      )}

      {/* SHAP Feature Attribution Table / Waterfall */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {isAr ? 'أوزان شجرة SHAP التفسيرية (محددات مؤشر الخطر)' : 'Tree SHAP Feature Attributions (Classifier Weights)'}
          </h4>
          <span className="text-[11px] text-slate-400 font-mono">
            {isAr ? 'معادلات شابلي اللوغاريتمية' : 'Additive Shapley Log-Odds'}
          </span>
        </div>

        <div className="space-y-2">
          {shapValues.map((item, idx) => {
            const isIncrease = item.impact > 0;
            const absImpact = Math.abs(item.impact);
            const barWidth = Math.min(100, (absImpact / 45) * 100);

            // Arabic translation helpers
            let displayName = item.displayName;
            let explanation = item.explanation;

            if (isAr) {
              if (item.displayName.includes('Cross-Department')) {
                displayName = 'نقل بين الإدارات المختلفة';
                explanation = '+٣٢٪ زيادة خطر: النقل بين الإدارات يتطلب مواءمة الهياكل التنظيمية واعتماد الإدارتين.';
              } else if (item.displayName.includes('Intra-Department')) {
                displayName = 'تنقل داخلي بنفس الإدارة';
                explanation = '-٣٠٪ انخفاض خطر: الحركة الداخلية بنفس الإدارة تحظى بموافقة مسبقة ومسار اعتماد مسرع.';
              } else if (item.displayName.includes('Missing Budget')) {
                displayName = 'غياب اعتماد ميزانية الشاغر';
                explanation = '+٢٥٪ زيادة خطر: الطلب يفتقر لرمز ميزانية معتمد من الإدارة المالية للمجموعة.';
              } else if (item.displayName.includes('Headcount Budget')) {
                displayName = 'اعتماد ميزانية الشواغر المالية';
                explanation = '-١٥٪ انخفاض خطر: رمز الميزانية مدقق ومطابق لقاعدة بيانات الإدارة المالية.';
              } else if (item.displayName.includes('Substantial Grade')) {
                displayName = 'قفزة استثنائية في الدرجات الوظيفية (> +٢)';
                explanation = '+٢٨٪ زيادة خطر: الترقية لأكثر من درجتين تتطلب حوكمة لجنة الموارد والتعويضات العليا.';
              } else if (item.displayName.includes('Standard Grade')) {
                displayName = 'تدرج وظيفي قياسي (+١)';
                explanation = '-٨٪ انخفاض خطر: درجة واحدة تتوافق بدقة مع مسار التطور الوظيفي المعتمد في طيران الإمارات.';
              } else if (item.displayName.includes('Lateral Grade Discrepancy')) {
                displayName = 'عدم تطابق درجة النقل الجانبي';
                explanation = '+٤٥٪ زيادة خطر: النقل الجانبي بدرجات مختلفة يُرفض فوراً في فحص الموارد البشرية الأولي.';
              } else if (item.displayName.includes('Brief Business Justification')) {
                displayName = 'مبرر أعمال مقتضب جداً';
                explanation = '+١٦٪ زيادة خطر: المبررات المقتضبة تفتقر للتفاصيل التشغيلية المطلوبة للاعتماد.';
              } else if (item.displayName.includes('Robust Business Justification')) {
                displayName = 'مبرر أعمال متكامل ومستوف للشروط';
                explanation = '-١٠٪ انخفاض خطر: الشرح التفصيلي للحاجة التشغيلية يسرع موافقة الموارد البشرية.';
              } else if (item.displayName.includes('Missing Support Attachments')) {
                displayName = 'نقص المستندات والشهادات الداعمة';
                explanation = '+٢٠٪ زيادة خطر: عدم إرفاق الوصف الوظيفي وساعات المحاكاة يؤدي لإرجاع الطلب.';
              } else if (item.displayName.includes('Required Documentation Attached')) {
                displayName = 'كافة الوثائق والمستندات مرفقة';
                explanation = '-١٢٪ انخفاض خطر: اكتمال الوثائق يسرع الانتقال المباشر لمرحلة التدقيق النهائي.';
              }
            }

            return (
              <div
                key={idx}
                className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    {isIncrease ? (
                      <TrendingUp className="w-3.5 h-3.5 text-red-600" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <span className="font-semibold text-slate-800">{displayName}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 font-mono text-[11px] truncate max-w-[140px] sm:max-w-[220px]">
                      {String(item.value)}
                    </span>
                  </div>

                  <span
                    className={`font-mono font-bold text-xs tabular-nums ${
                      isIncrease ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  >
                    {isIncrease ? `+${item.impact}%` : `${item.impact}%`}
                  </span>
                </div>

                {/* Relative impact bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden my-1">
                  <div
                    className={`h-full ${isIncrease ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                {!compact && (
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

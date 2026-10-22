import React, { useState, useEffect } from 'react';
import { AuditLogEntry } from '../types.js';
import {
  FileText,
  Search,
  Filter,
  Download,
  ShieldCheck,
  ShieldAlert,
  Activity,
  UserCheck,
  RefreshCw,
  Cpu
} from 'lucide-react';

interface AuditTrailViewProps {
  lang: 'en' | 'ar';
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ lang }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/audit-log');
      if (res.ok) {
        const data: AuditLogEntry[] = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (actionFilter !== 'all' && log.actionType !== actionFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        log.caseId.toLowerCase().includes(q) ||
        log.trackingNumber.toLowerCase().includes(q) ||
        log.actor.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `emirates_p2p_audit_trail_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const isAr = lang === 'ar';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D71921]">
                {isAr ? 'الوحدة الرابعة: الامتثال والذكاء الاصطناعي المسؤول' : 'Module 4: Responsible AI & Compliance'}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-medium">
                {isAr ? 'سجل غير قابل للتعديل (Immutable Ledger)' : 'Immutable Ledger'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              {isAr ? 'سجل التدقيق الشامل للنظام والذكاء الاصطناعي' : 'Comprehensive System & AI Audit Trail'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              {isAr
                ? 'سجل تدقيق زمني مشفر لكل فحص لقواعد ما قبل الإرسال، واستنتاج لتسجيل درجات SHAP، وتجاوز قرارات الحوكمة البشرية.'
                : 'Cryptographically timestamped audit log of every pre-submission rule check, XGBoost SHAP scoring inference, and Human-in-the-Loop decision override.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <button
              onClick={fetchLogs}
              className="p-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              title={isAr ? 'تحديث السجل' : 'Refresh log'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? 'تصدير سجل التدقيق (JSON)' : 'Export Audit JSON'}</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isAr ? 'ابحث برقم المعاملة، المشغل، أو الكلمات المفتاحية...' : 'Search by Case ID, Actor, or keywords...'}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-[#D71921] focus:ring-[#D71921]"
              dir={isAr ? 'rtl' : 'ltr'}
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
            >
              <option value="all">{isAr ? 'كافة أنواع العمليات' : 'All Action Types'}</option>
              <option value="PRE_VALIDATION_PASSED">{isAr ? 'اجتياز التحقق المسبق' : 'Pre-Validation Passed'}</option>
              <option value="PRE_VALIDATION_BLOCKED">{isAr ? 'حظر التحقق المسبق' : 'Pre-Validation Blocked'}</option>
              <option value="RISK_SCORING_COMPUTED">{isAr ? 'حساب مؤشر المخاطر' : 'Risk Scoring Computed'}</option>
              <option value="REQUEST_SUBMITTED">{isAr ? 'إرسال طلب جديد' : 'Request Submitted'}</option>
              <option value="HITL_ACCEPTED_RECOMMENDATION">{isAr ? 'قبول بشري لتوصية AI' : 'HITL: Accepted AI'}</option>
              <option value="HITL_OVERRIDE_FLAGGED">{isAr ? 'تجاوز المشغل البشري' : 'HITL: Operator Override'}</option>
              <option value="HR_OPS_APPROVED">{isAr ? 'اعتماد عمليات الموارد البشرية' : 'HR Ops Approved'}</option>
              <option value="RETURNED_TO_MANAGER">{isAr ? 'إرجاع لمدير الخط' : 'Returned to Manager'}</option>
              <option value="EXPRESS_LANE_ROUTED">{isAr ? 'توجيه للمسار السريع' : 'Express Lane Routed'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>{isAr ? `عرض ${filteredLogs.length} حدث مسجل` : `Displaying ${filteredLogs.length} recorded events`}</span>
          <span>{isAr ? 'معيار الأمان: متوافق مع ISO 27001 و GDPR' : 'Security Standard: ISO 27001 / GDPR Compliant'}</span>
        </div>

        <div className="space-y-3">
          {filteredLogs.map(log => {
            const isBlocked = log.actionType === 'PRE_VALIDATION_BLOCKED' || log.actionType === 'RETURNED_TO_MANAGER';
            const isOverride = log.actionType === 'HITL_OVERRIDE_FLAGGED';
            const isAI = log.actorRole === 'AI Risk Engine' || log.actorRole === 'System Rule Engine';

            return (
              <div
                key={log.id}
                className="p-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50/70 transition-colors text-xs space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isBlocked ? (
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                    ) : isOverride ? (
                      <Cpu className="w-4 h-4 text-[#BA9653] shrink-0" />
                    ) : isAI ? (
                      <Activity className="w-4 h-4 text-blue-600 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}

                    <span className="font-mono font-bold text-slate-900">
                      {log.trackingNumber}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[10px] border ${
                        isBlocked
                          ? 'text-red-700 bg-red-50 border-red-200'
                          : isOverride
                          ? 'text-amber-800 bg-amber-50 border-amber-200'
                          : 'text-slate-700 bg-slate-100 border-slate-200'
                      }`}
                    >
                      {log.actionType}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                    <span>{isAr ? 'المشغل:' : 'Actor:'} <strong className="text-slate-700">{log.actor}</strong></span>
                    <span>·</span>
                    <span>{new Date(log.timestamp).toLocaleString(isAr ? 'ar-AE' : 'en-US')}</span>
                  </div>
                </div>

                <p className="text-slate-700 leading-relaxed font-sans pl-6">
                  {log.details}
                </p>

                {/* Metadata badges if present */}
                {log.metadata && (
                  <div className="pl-6 flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
                    {log.metadata.returnRisk != null && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        ReturnRisk: {log.metadata.returnRisk}%
                      </span>
                    )}
                    {log.metadata.delayRisk != null && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        DelayRisk: {log.metadata.delayRisk}%
                      </span>
                    )}
                    {log.metadata.rulesTriggered && (
                      <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                        Rules: {log.metadata.rulesTriggered.join(', ')}
                      </span>
                    )}
                    {log.metadata.shapSummary && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        SHAP: {log.metadata.shapSummary}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

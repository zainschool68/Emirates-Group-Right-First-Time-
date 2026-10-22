import React, { useState, useEffect } from 'react';
import { P2PRequest, RiskTier } from '../types.js';
import { ShapWaterfall } from './ShapWaterfall.js';
import { PredictiveRiskHeatmap } from './PredictiveRiskHeatmap.js';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  User,
  Building,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Check,
  RotateCcw,
  Zap,
  Info,
  CheckSquare,
  Square,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface InFlightTrackerProps {
  role: 'manager' | 'hr';
  lang: 'en' | 'ar';
  selectedRequestId?: string | null;
  onSelectRequest?: (reqId: string | null) => void;
  onRefreshNeeded?: () => void;
}

export const InFlightTracker: React.FC<InFlightTrackerProps> = ({
  role,
  lang,
  selectedRequestId,
  onSelectRequest,
  onRefreshNeeded
}) => {
  const isAr = lang === 'ar';

  const [requests, setRequests] = useState<P2PRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeReqId, setActiveReqId] = useState<string | null>(selectedRequestId || null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState<string>('all');

  // Multi-Selection State for Bulk Actions (HR Mode)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkModal, setBulkModal] = useState<{
    isOpen: boolean;
    action: 'Batch Approve' | 'Flag for Review';
  }>({
    isOpen: false,
    action: 'Batch Approve'
  });
  const [bulkReason, setBulkReason] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Single HITL Action Dialog State
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    req: P2PRequest | null;
    actionType: 'Accept' | 'Override' | 'Approve' | 'Return';
  }>({
    isOpen: false,
    req: null,
    actionType: 'Accept'
  });
  const [actionReason, setActionReason] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  useEffect(() => {
    if (selectedRequestId) {
      setActiveReqId(selectedRequestId);
    }
  }, [selectedRequestId]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (deptFilter !== 'all') params.append('department', deptFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`/api/requests?${params.toString()}`);
      if (res.ok) {
        const data: P2PRequest[] = await res.json();
        setRequests(data);
        if (!activeReqId && data.length > 0) {
          setActiveReqId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, deptFilter, search]);

  // Bulk Selection Helpers
  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedIds.length === filteredRequests.length && filteredRequests.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRequests.map(r => r.id));
    }
  };

  const handleSelectAllLowRisk = () => {
    const lowRiskIds = filteredRequests
      .filter(r => r.riskPrediction?.riskTier === 'Low' && r.status !== 'Approved')
      .map(r => r.id);
    setSelectedIds(lowRiskIds);
  };

  const handleOpenBulkModal = (action: 'Batch Approve' | 'Flag for Review') => {
    if (selectedIds.length === 0) return;
    setBulkReason(
      action === 'Batch Approve'
        ? isAr
          ? 'اعتماد جماعي للطلبات منخفضة المخاطر المتوافقة مع معايير المسار السريع والتحقق المسبق'
          : 'Batch approval of verified low-risk requests meeting all pre-submission and grade parity criteria.'
        : isAr
          ? 'تحويل جماعي لجدول المراجعة اليدوية المتخصصة لتدقيق تفاصيل الدرجة والميزانية'
          : 'Batch triage into specialized HR review docket for detailed compensation and budgetary analysis.'
    );
    setBulkModal({ isOpen: true, action });
  };

  const handleExecuteBulkAction = async () => {
    if (selectedIds.length === 0) return;
    setBulkSubmitting(true);
    try {
      const res = await fetch('/api/requests/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedIds,
          action: bulkModal.action,
          actor: role === 'hr' ? 'Fatima Al-Suwaidi (HR Ops Bulk Lead)' : 'HR Operations Specialist',
          reason: bulkReason
        })
      });

      if (res.ok) {
        setBulkModal({ isOpen: false, action: 'Batch Approve' });
        setSelectedIds([]);
        await fetchRequests();
        if (onRefreshNeeded) onRefreshNeeded();
      }
    } catch (err) {
      console.error('Error executing bulk action', err);
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleOpenHitlModal = (req: P2PRequest, actionType: 'Accept' | 'Override' | 'Approve' | 'Return') => {
    let defaultReason = '';
    if (actionType === 'Accept') {
      defaultReason = isAr
        ? `قبول توصية الذكاء الاصطناعي: ${req.riskPrediction?.recommendedAction || 'المتابعة وفق معايير التدقيق'}`
        : `Accepted AI recommendation: ${req.riskPrediction?.recommendedAction || 'Proceed under fast-track criteria'}`;
    } else if (actionType === 'Override') {
      defaultReason = isAr
        ? 'تجاوز مشغل بشري معتمد: تم تدقيق العوامل التشغيلية وتخفيف المخاطر بتفويض من نائب الرئيس'
        : 'Human Operator Override: Mitigating operational factors reviewed; risk flags bypassed under VP delegated authority.';
    } else if (actionType === 'Approve') {
      defaultReason = isAr
        ? 'موافقة نهائية مباشرة: تم تدقيق المنصب والشخص لمزامنة تخطيط الموارد البشرية ERP'
        : 'Direct Human Approval: Position and person attributes validated for ERP master synchronization.';
    } else if (actionType === 'Return') {
      defaultReason = isAr
        ? 'إرجاع للتعديل: متطلبات الدرجة الوظيفية أو الميزانية تستوجب تصحيح مدير الخط المباشر'
        : 'Returned for revision: Grade or budget requirements require line manager correction.';
    }

    setActionReason(defaultReason);
    setActionModal({
      isOpen: true,
      req,
      actionType
    });
  };

  const handleExecuteHitlAction = async () => {
    if (!actionModal.req) return;
    setActionSubmitting(true);
    try {
      const res = await fetch(`/api/requests/${actionModal.req.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionModal.actionType,
          actor: role === 'hr' ? 'Fatima Al-Suwaidi (HR Ops Lead)' : 'Line Manager (Originator)',
          reason: actionReason
        })
      });

      if (res.ok) {
        setActionModal({ isOpen: false, req: null, actionType: 'Accept' });
        await fetchRequests();
        if (onRefreshNeeded) onRefreshNeeded();
      }
    } catch (err) {
      console.error('Error executing HITL action', err);
    } finally {
      setActionSubmitting(false);
    }
  };

  // Filter by tier locally
  const filteredRequests = requests.filter(r => {
    if (tierFilter !== 'all' && r.riskPrediction?.riskTier !== tierFilter) {
      return false;
    }
    return true;
  });

  const activeRequest = requests.find(r => r.id === activeReqId) || filteredRequests[0] || null;

  return (
    <div className="space-y-6">
      {/* HR Mode Predictive Risk Heatmap Component */}
      {role === 'hr' && (
        <PredictiveRiskHeatmap
          lang={lang}
          selectedDepartment={deptFilter}
          onSelectDepartmentFilter={dept => setDeptFilter(dept)}
        />
      )}

      {/* Top Header & Metrics Strip */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D71921]">
                {isAr ? 'الوحدة الثانية والرابعة' : 'Module 2 & 4'}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-medium">
                {isAr
                  ? 'رادار المخاطر التنبؤي وحوكمة القرار البشري والإجراءات الجماعية'
                  : 'XGBoost/LightGBM Risk Radar & High-Throughput Bulk Operations'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              {isAr ? 'متتبع المخاطر التنبؤية للطلبات قيد التنفيذ' : 'In-Flight Predictive Risk Tracker'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              {isAr
                ? 'مراقبة حية ودقيقة لطلبات تعيين ونقل الأشخاص والمناصب. يقوم مصنفان بتحديد احتمالية الإرجاع وخطر التأخير مع تفكيك أسباب الخطر (SHAP).'
                : 'Continuous monitoring of active Position-to-Person requests. ML classifiers calculate Return Risk and Delay Risk with additive SHAP explanations and high-throughput bulk actions.'}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 self-start md:self-auto text-xs">
            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
              <span className="text-[11px] text-slate-500 block">
                {isAr ? 'الطلبات قيد التنفيذ' : 'In-Flight Cases'}
              </span>
              <span className="text-lg font-bold font-mono text-slate-900">{requests.length}</span>
            </div>
            <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50">
              <span className="text-[11px] text-emerald-700 block">
                {isAr ? 'المسار السريع' : 'Express Lane Synced'}
              </span>
              <span className="text-lg font-bold font-mono text-emerald-800">
                {requests.filter(r => r.status === 'Express Lane Synced' || r.status === 'Approved').length}
              </span>
            </div>
            <div className="p-2.5 rounded-lg border border-red-200 bg-red-50/50">
              <span className="text-[11px] text-red-700 block">
                {isAr ? 'عالي الخطورة / مرتجع' : 'High Risk / Returned'}
              </span>
              <span className="text-lg font-bold font-mono text-red-800">
                {requests.filter(r => r.riskPrediction?.riskTier === 'High' || r.status.includes('Returned')).length}
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isAr ? 'ابحث برقم المعاملة، اسم الموظف، المسمى...' : 'Search case #, employee name, title...'}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-[#D71921] focus:ring-[#D71921]"
              dir={isAr ? 'rtl' : 'ltr'}
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="px-2 py-1.5 text-xs rounded border border-slate-300 bg-white"
            >
              <option value="all">{isAr ? 'كافة الإدارات' : 'All Departments'}</option>
              <option value="Flight Operations">{isAr ? 'عمليات الطيران' : 'Flight Operations'}</option>
              <option value="Airport Operations">{isAr ? 'عمليات المطار' : 'Airport Operations'}</option>
              <option value="Commercial">{isAr ? 'القطاع التجاري' : 'Commercial'}</option>
              <option value="Engineering">{isAr ? 'الهندسة والصيانة' : 'Engineering'}</option>
              <option value="HR">{isAr ? 'الموارد البشرية' : 'HR'}</option>
            </select>

            <select
              value={tierFilter}
              onChange={e => setTierFilter(e.target.value)}
              className="px-2 py-1.5 text-xs rounded border border-slate-300 bg-white"
            >
              <option value="all">{isAr ? 'كافة مستويات الخطورة' : 'All Risk Tiers'}</option>
              <option value="Low">{isAr ? 'منخفض الخطورة (< 30%)' : 'Low Risk (< 30%)'}</option>
              <option value="Medium">{isAr ? 'متوسط الخطورة (30-65%)' : 'Medium Risk (30-65%)'}</option>
              <option value="High">{isAr ? 'عالي الخطورة (> 65%)' : 'High Risk (> 65%)'}</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2 py-1.5 text-xs rounded border border-slate-300 bg-white"
            >
              <option value="all">{isAr ? 'كافة الحالات' : 'All Statuses'}</option>
              <option value="In HR Ops Review">{isAr ? 'قيد مراجعة الموارد البشرية' : 'In HR Ops Review'}</option>
              <option value="Finance Budget Review">{isAr ? 'قيد مراجعة الميزانية' : 'Finance Budget Review'}</option>
              <option value="Returned to Manager">{isAr ? 'مرتجع للمدير' : 'Returned to Manager'}</option>
              <option value="Express Lane Synced">{isAr ? 'تمت مزامنة المسار السريع' : 'Express Lane Synced'}</option>
              <option value="Approved">{isAr ? 'معتمد' : 'Approved'}</option>
            </select>

            {/* Quick Refresh */}
            <button
              onClick={fetchRequests}
              className="p-1.5 text-slate-500 hover:text-slate-800 border border-slate-200 rounded hover:bg-slate-50"
              title="Refresh request list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* BULK ACTION BAR (HR Operations Mode) */}
        {role === 'hr' && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
              >
                {selectedIds.length === filteredRequests.length && filteredRequests.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-[#D71921]" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>
                  {isAr ? 'تحديد الكل' : 'Select All'} ({filteredRequests.length})
                </span>
              </button>

              <span className="text-slate-300">·</span>

              <button
                type="button"
                onClick={handleSelectAllLowRisk}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {isAr ? 'تحديد كافة الحالات منخفضة المخاطر' : 'Select All Low-Risk (Express)'}
                </span>
              </button>

              {selectedIds.length > 0 && (
                <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-300">
                  {selectedIds.length} {isAr ? 'محدد' : 'selected'}
                </span>
              )}
            </div>

            {/* Bulk Execution Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={selectedIds.length === 0}
                onClick={() => handleOpenBulkModal('Batch Approve')}
                className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'اعتماد جماعي (ERP Sync)' : 'Batch Approve'}</span>
              </button>

              <button
                type="button"
                disabled={selectedIds.length === 0}
                onClick={() => handleOpenBulkModal('Flag for Review')}
                className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>{isAr ? 'إحالة جماعية للمراجعة' : 'Flag for Review'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main 2-Column Split: Case List (5 cols) & Deep Dive + SHAP (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Case List Column */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
            <span>
              {isAr ? 'الطلبات النشطة' : 'Active Requests'} ({filteredRequests.length})
            </span>
            <span className="text-slate-400">
              {isAr ? 'مرتبة حسب اتفاقية مستوى الخدمة' : 'Sorted by SLA Recency'}
            </span>
          </div>

          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredRequests.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-slate-200 bg-white text-xs text-slate-500">
                {isAr ? 'لا توجد طلبات تطابق معايير التصفية المحددة.' : 'No active requests match the selected filters.'}
              </div>
            ) : (
              filteredRequests.map(req => {
                const isSelected = req.id === activeReqId;
                const isChecked = selectedIds.includes(req.id);
                const risk = req.riskPrediction;
                const tier = risk?.riskTier || 'Low';

                return (
                  <div
                    key={req.id}
                    onClick={() => {
                      setActiveReqId(req.id);
                      if (onSelectRequest) onSelectRequest(req.id);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-[#D71921] bg-red-50/30 ring-1 ring-[#D71921] shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        {role === 'hr' && (
                          <button
                            type="button"
                            onClick={e => toggleSelectOne(req.id, e)}
                            className="mt-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-[#D71921]" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {req.trackingNumber}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {req.requestType}
                            </span>
                          </div>
                          <h4 className="text-xs font-semibold text-slate-800 mt-1 line-clamp-1">
                            {req.title}
                          </h4>
                        </div>
                      </div>

                      {/* Risk Badge */}
                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold font-mono tabular-nums border ${
                            tier === 'High'
                              ? 'text-red-700 bg-red-50 border-red-200'
                              : tier === 'Medium'
                              ? 'text-amber-800 bg-amber-50 border-amber-200'
                              : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          }`}
                        >
                          {risk?.returnRisk}% {isAr ? 'إرجاع' : 'Ret'} / {risk?.delayRisk}% {isAr ? 'تأخير' : 'Del'}
                        </span>
                      </div>
                    </div>

                    {/* Step owner and status */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="truncate max-w-[200px]">
                        {isAr ? 'المسؤول الحالي:' : 'Owner:'}{' '}
                        <strong className="text-slate-700">{req.currentStepOwner}</strong>
                      </span>
                      <span
                        className={`font-medium ${
                          req.status === 'Express Lane Synced' || req.status === 'Approved'
                            ? 'text-emerald-600 font-semibold'
                            : req.status === 'Returned to Manager'
                            ? 'text-red-600 font-bold'
                            : 'text-slate-700'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Case Deep Dive & Tree SHAP Inspection & HITL Actions */}
        <div className="lg:col-span-7 space-y-4">
          {activeRequest ? (
            <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-5">
              {/* Case Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      {activeRequest.trackingNumber}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs font-semibold text-[#BA9653]">
                      {activeRequest.requestType}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(activeRequest.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {activeRequest.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isAr ? 'مقدم الطلب:' : 'Submitted by:'}{' '}
                    <strong>{activeRequest.submittedBy}</strong> · {isAr ? 'الإدارة:' : 'Department:'}{' '}
                    {activeRequest.department}
                  </p>
                </div>

                {/* HITL Action Buttons (Human in the Loop) */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
                  {role === 'hr' ? (
                    <>
                      <button
                        onClick={() => handleOpenHitlModal(activeRequest, 'Accept')}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                        title={isAr ? 'قبول توصية الذكاء الاصطناعي وتمرير المعاملة' : 'Accept AI risk recommendation and route forward'}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isAr ? 'قبول التوصية' : 'Accept AI'}</span>
                      </button>

                      <button
                        onClick={() => handleOpenHitlModal(activeRequest, 'Override')}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                        title={isAr ? 'تجاوز مؤشر الخطر بقرار بشري' : 'Override AI risk flag with operator justification'}
                      >
                        <Zap className="w-3.5 h-3.5 text-[#BA9653]" />
                        <span>{isAr ? 'تجاوز بشري' : 'Override AI'}</span>
                      </button>

                      <button
                        onClick={() => handleOpenHitlModal(activeRequest, 'Approve')}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#D71921] hover:bg-[#b5141b] text-white transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                        title={isAr ? 'اعتماد نهائي وتحديث نظام ERP' : 'Direct final ERP sync approval'}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isAr ? 'اعتماد نهائي' : 'Approve'}</span>
                      </button>

                      <button
                        onClick={() => handleOpenHitlModal(activeRequest, 'Return')}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-red-300 text-red-700 hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer"
                        title={isAr ? 'إرجاع الطلب لمدير الخط للتعديل' : 'Return request to Line Manager for correction'}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{isAr ? 'إرجاع' : 'Return'}</span>
                      </button>
                    </>
                  ) : (
                    <div className="text-right">
                      <span className="text-xs font-medium text-slate-500 block">
                        {isAr ? 'المرحلة الحالية:' : 'Current Stage:'}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{activeRequest.status}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Position & Person Spec Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs">
                <div>
                  <div className="text-[11px] text-slate-500 font-semibold mb-1 uppercase tracking-wider">
                    {isAr ? 'شاغل الوظيفة والمنصب الحالي' : 'ORIGIN OCCUPANT & ROLE'}
                  </div>
                  <div className="space-y-0.5">
                    <div>
                      <span className="text-slate-500">{isAr ? 'الموظف: ' : 'Employee: '}</span>
                      <strong className="text-slate-900">
                        {activeRequest.employeeName || activeRequest.employeeId || (isAr ? 'شاغر / جديد' : 'Vacant / New')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">{isAr ? 'المسمى الحالي: ' : 'Current Title: '}</span>
                      <span className="text-slate-800">{activeRequest.currentPositionTitle || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">{isAr ? 'الدرجة الحالية: ' : 'Grade: '}</span>
                      <span className="font-mono font-bold text-slate-900">
                        {isAr ? 'الدرجة' : 'Grade'} {activeRequest.currentGrade ?? 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-500 font-semibold mb-1 uppercase tracking-wider">
                    {isAr ? 'المنصب والتعيين المستهدف' : 'TARGET ASSIGNMENT'}
                  </div>
                  <div className="space-y-0.5">
                    <div>
                      <span className="text-slate-500">{isAr ? 'المنصب المستهدف: ' : 'Target Role: '}</span>
                      <strong className="text-slate-900">
                        {activeRequest.targetPositionTitle || (isAr ? 'منصب جديد' : 'New Role')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">{isAr ? 'الإدارة المستهدفة: ' : 'Target Dept: '}</span>
                      <span className="text-slate-800">{activeRequest.targetDepartment}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">{isAr ? 'الدرجة المستهدفة: ' : 'Target Grade: '}</span>
                      <span className="font-mono font-bold text-slate-900">
                        {isAr ? 'الدرجة' : 'Grade'} {activeRequest.targetGrade ?? 'N/A'}
                      </span>
                      {activeRequest.currentGrade != null && activeRequest.targetGrade != null && (
                        <span className="ml-1 text-[11px] text-slate-500 font-mono">
                          (Δ {activeRequest.targetGrade - activeRequest.currentGrade})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Justification Block */}
              <div className="text-xs space-y-1">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  {isAr ? 'مبرر الأعمال التشغيلي (تم التحقق من القاعدة RULE-01)' : 'Business Justification (Rule-01 Verified)'}
                </span>
                <p className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed font-sans">
                  "{activeRequest.businessJustification}"
                </p>
              </div>

              {/* SHAP Waterfall Explainability Section */}
              {activeRequest.riskPrediction && (
                <div className="pt-2 border-t border-slate-200">
                  <div className="mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-[#D71921]" />
                      <span>
                        {isAr
                          ? 'استنتاج مصنف XGBoost وتحليل أوزان SHAP التفصيلية'
                          : 'XGBoost Classifier Risk Inference & SHAP Decomposition'}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {isAr
                        ? 'تفكيك العوامل الرياضية المؤثرة في درجات خطر الإرجاع وخطر التأخير الزمني.'
                        : 'Additive feature impacts explain why this request received its Return Risk and Delay Risk scores.'}
                    </p>
                  </div>

                  <ShapWaterfall
                    shapValues={activeRequest.riskPrediction.shapValues}
                    returnRisk={activeRequest.riskPrediction.returnRisk}
                    delayRisk={activeRequest.riskPrediction.delayRisk}
                    riskTier={activeRequest.riskPrediction.riskTier}
                    recommendedAction={activeRequest.riskPrediction.recommendedAction}
                    autoExpressLaneEligible={activeRequest.riskPrediction.autoExpressLaneEligible}
                    predictedCycleDays={activeRequest.riskPrediction.predictedCycleDays}
                    compact={false}
                  />
                </div>
              )}

              {/* Recorded Human-in-the-Loop Decision if one exists */}
              {activeRequest.hitlActionTaken && (
                <div className="p-3 rounded-lg bg-slate-900 text-white text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#BA9653] flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" />
                      {isAr ? 'القرار البشري المسجل:' : 'Recorded Human Decision:'} [{activeRequest.hitlActionTaken.action}]
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(activeRequest.hitlActionTaken.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-300">
                    {isAr ? 'بواسطة المشغل ' : 'Decision by '}<strong>{activeRequest.hitlActionTaken.actor}</strong>: "{activeRequest.hitlActionTaken.reason}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center rounded-xl border border-slate-200 bg-white text-xs text-slate-500">
              {isAr ? 'حدد طلباً من القائمة لعرض مؤشرات الخطر وتفاصيل SHAP' : 'Select an in-flight request to inspect its risk scores and SHAP explainability.'}
            </div>
          )}
        </div>
      </div>

      {/* BULK ACTION CONFIRMATION MODAL */}
      {bulkModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#D71921]" />
                <h3 className="text-sm font-bold text-slate-900">
                  {isAr ? 'تأكيد العملية الجماعية' : 'Confirm Bulk Action'}: {bulkModal.action}
                </h3>
              </div>
              <button
                onClick={() => setBulkModal({ isOpen: false, action: 'Batch Approve' })}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                {isAr
                  ? `أنت على وشك تنفيذ إجراء [${bulkModal.action}] على ${selectedIds.length} معاملة دفعة واحدة:`
                  : `You are about to execute [${bulkModal.action}] on ${selectedIds.length} selected request(s):`}
              </p>
              <div className="max-h-32 overflow-y-auto p-2 bg-slate-50 rounded border border-slate-200 font-mono text-[11px] space-y-1">
                {selectedIds.map(id => {
                  const reqItem = requests.find(r => r.id === id);
                  return (
                    <div key={id} className="flex items-center justify-between">
                      <span className="font-bold">{reqItem?.trackingNumber || id}</span>
                      <span className="text-slate-500">{reqItem?.title}</span>
                      <span className="text-emerald-700 font-bold">{reqItem?.riskPrediction?.riskTier} Risk</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {isAr ? 'مبرر وتأكيد الاعتماد الجماعي لسجل التدقيق *' : 'Audit Rationale & Operator Justification *'}
              </label>
              <textarea
                rows={3}
                value={bulkReason}
                onChange={e => setBulkReason(e.target.value)}
                placeholder={isAr ? 'اكتب مبرر القرار الجماعي...' : 'State reason for executing bulk batch action...'}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:border-[#D71921] focus:ring-[#D71921]"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {isAr
                  ? 'سيتم تسجيل هذه العملية كمدخل منفصل في سجل التدقيق غير القابل للتعديل لكل معاملة على حدة.'
                  : 'An immutable compliance audit record will be registered for every individual request in this batch.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBulkModal({ isOpen: false, action: 'Batch Approve' })}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={bulkSubmitting || !bulkReason.trim()}
                onClick={handleExecuteBulkAction}
                className="px-4 py-2 text-xs font-bold text-white bg-[#D71921] hover:bg-[#b5141b] rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {bulkSubmitting
                  ? isAr ? 'جاري تنفيذ العملية الجماعية...' : 'Executing Batch Action...'
                  : isAr
                  ? `تأكيد [${bulkModal.action}] لـ (${selectedIds.length}) طلبات`
                  : `Confirm [${bulkModal.action}] (${selectedIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Human-in-the-Loop Single Confirmation Modal */}
      {actionModal.isOpen && actionModal.req && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#D71921]" />
                <h3 className="text-sm font-bold text-slate-900">
                  {isAr ? 'قرار بشري معتمد:' : 'Human-in-the-Loop Decision:'} {actionModal.actionType}
                </h3>
              </div>
              <button
                onClick={() => setActionModal({ isOpen: false, req: null, actionType: 'Accept' })}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                {isAr
                  ? `أنت بصدد اتخاذ قرار حوكمة ملزم للمعاملة: `
                  : `You are executing a binding human governance action on `}
                <strong className="text-slate-900">{actionModal.req.trackingNumber}</strong> (
                {actionModal.req.title}).
              </p>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 font-mono text-[11px]">
                {isAr ? 'مؤشر الخطر: ' : 'Current Risk: '}{actionModal.req.riskPrediction?.returnRisk}% {isAr ? 'إرجاع' : 'Return'} /{' '}
                {actionModal.req.riskPrediction?.delayRisk}% {isAr ? 'تأخير' : 'Delay'} ({actionModal.req.riskPrediction?.riskTier} Tier)
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {isAr ? 'مبرر المشغل البشري وتوثيق التدقيق *' : 'Operator Rationale & Audit Justification *'}
              </label>
              <textarea
                rows={3}
                value={actionReason}
                onChange={e => setActionReason(e.target.value)}
                placeholder={isAr ? 'اكتب سبب القبول أو التجاوز أو الإرجاع...' : 'State reason for accepting, overriding or returning this request...'}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:border-[#D71921] focus:ring-[#D71921]"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {isAr
                  ? 'يتم توثيق هذا القرار في سجل تدقيق مجموعة الإمارات مع الطابع الزمني واسم المشغل.'
                  : 'This decision is logged to the immutable Emirates Group audit ledger with timestamp and identity.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActionModal({ isOpen: false, req: null, actionType: 'Accept' })}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={actionSubmitting || !actionReason.trim()}
                onClick={handleExecuteHitlAction}
                className="px-4 py-2 text-xs font-bold text-white bg-[#D71921] hover:bg-[#b5141b] rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {actionSubmitting
                  ? isAr ? 'جاري تسجيل القرار...' : 'Recording Action...'
                  : isAr
                  ? `تأكيد [${actionModal.actionType}]`
                  : `Confirm [${actionModal.actionType}]`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

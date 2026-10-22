import React, { useState, useEffect } from 'react';
import {
  RequestType,
  OrgPosition,
  PreValidationResponse,
  RiskPrediction
} from '../types.js';
import { ShapWaterfall } from './ShapWaterfall.js';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  Info,
  Building,
  User,
  DollarSign,
  FileText,
  Sparkles,
  RefreshCw,
  Send
} from 'lucide-react';
import { translations } from '../utils/i18n.js';

interface RequestWizardProps {
  onSubmitted: (newReqId: string) => void;
  lang: 'en' | 'ar';
}

export const RequestWizard: React.FC<RequestWizardProps> = ({ onSubmitted, lang }) => {
  const isAr = lang === 'ar';

  // Form state
  const [requestType, setRequestType] = useState<RequestType>('Lateral Transfer');
  const [employeeId, setEmployeeId] = useState('EK-77341');
  const [employeeName, setEmployeeName] = useState('Sarah Jenkins');
  const [department, setDepartment] = useState('Flight Operations');
  const [currentPositionId, setCurrentPositionId] = useState('POS-EK-102');
  const [currentPositionTitle, setCurrentPositionTitle] = useState('Senior First Officer B777');
  const [currentGrade, setCurrentGrade] = useState<number>(9);

  const [targetDepartment, setTargetDepartment] = useState('Flight Operations');
  const [targetPositionId, setTargetPositionId] = useState('POS-EK-102');
  const [targetPositionTitle, setTargetPositionTitle] = useState('Senior First Officer B777');
  const [targetGrade, setTargetGrade] = useState<number>(9);

  const [hasBudgetApproval, setHasBudgetApproval] = useState<boolean>(true);
  const [budgetRefCode, setBudgetRefCode] = useState('BUD-FLT-2026-Q1');
  const [businessJustification, setBusinessJustification] = useState(
    'Operational reallocation to align with seasonal schedule adjustments and command staffing requirements.'
  );
  const [attachments, setAttachments] = useState<string[]>([
    'Internal_Movement_Clearance.pdf'
  ]);

  // Async data
  const [positions, setPositions] = useState<OrgPosition[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(false);

  // Validation state
  const [validation, setValidation] = useState<PreValidationResponse | null>(null);
  const [validating, setValidating] = useState(false);

  // Live Risk Preview state
  const [riskPreview, setRiskPreview] = useState<RiskPrediction | null>(null);
  const [loadingRisk, setLoadingRisk] = useState(false);

  // Submitting
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load org positions on mount
  useEffect(() => {
    async function loadPositions() {
      try {
        setLoadingPositions(true);
        const res = await fetch('/api/positions');
        if (res.ok) {
          const data = await res.json();
          setPositions(data);
        }
      } catch (err) {
        console.error('Failed to load positions', err);
      } finally {
        setLoadingPositions(false);
      }
    }
    loadPositions();
  }, []);

  // Synchronous + Asynchronous real-time validation check
  useEffect(() => {
    let active = true;

    async function checkValidation() {
      setValidating(true);
      try {
        const payload = {
          requestType,
          businessJustification,
          currentGrade,
          targetGrade,
          hasBudgetApproval,
          employeeId,
          originDepartment: department,
          targetDepartment
        };

        const valRes = await fetch('/api/pre-validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (valRes.ok && active) {
          const valData: PreValidationResponse = await valRes.json();
          setValidation(valData);
        }

        // Run live risk inference preview
        setLoadingRisk(true);
        const riskRes = await fetch('/api/predict-risk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (riskRes.ok && active) {
          const riskData: RiskPrediction = await riskRes.json();
          setRiskPreview(riskData);
        }
      } catch (err) {
        console.error('Error in live validation', err);
      } finally {
        if (active) {
          setValidating(false);
          setLoadingRisk(false);
        }
      }
    }

    const timer = setTimeout(checkValidation, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    requestType,
    businessJustification,
    currentGrade,
    targetGrade,
    hasBudgetApproval,
    employeeId,
    department,
    targetDepartment
  ]);

  // Helper when user selects a target position from org_positions
  const handleSelectTargetPosition = (posId: string) => {
    const pos = positions.find(p => p.id === posId);
    if (pos) {
      setTargetPositionId(pos.id);
      setTargetPositionTitle(pos.title);
      setTargetGrade(pos.grade);
      setTargetDepartment(pos.department);
    }
  };

  // Helper when user selects current position
  const handleSelectCurrentPosition = (posId: string) => {
    const pos = positions.find(p => p.id === posId);
    if (pos) {
      setCurrentPositionId(pos.id);
      setCurrentPositionTitle(pos.title);
      setCurrentGrade(pos.grade);
      setDepartment(pos.department);
      if (pos.currentOccupantId) {
        setEmployeeId(pos.currentOccupantId);
      }
      if (pos.currentOccupantName) {
        setEmployeeName(pos.currentOccupantName);
      }
    }
  };

  // Quick preset triggers to test edge cases
  const applyPreset = (presetType: 'validLateral' | 'invalidLateral' | 'validPromo' | 'noBudgetPromo') => {
    if (presetType === 'validLateral') {
      setRequestType('Lateral Transfer');
      setDepartment('Flight Operations');
      setTargetDepartment('Flight Operations');
      setCurrentPositionId('POS-EK-102');
      setCurrentPositionTitle('Senior First Officer B777');
      setCurrentGrade(9);
      setTargetPositionId('POS-EK-102');
      setTargetPositionTitle('Senior First Officer B777 (Fleet Shift)');
      setTargetGrade(9);
      setEmployeeId('EK-77341');
      setEmployeeName('Sarah Jenkins');
      setHasBudgetApproval(true);
      setBusinessJustification('Seasonal fleet rotation between long-haul routes. Grade parity verified.');
    } else if (presetType === 'invalidLateral') {
      setRequestType('Lateral Transfer');
      setDepartment('Airport Operations');
      setTargetDepartment('Commercial');
      setCurrentPositionId('POS-EK-201');
      setCurrentPositionTitle('Airport Services Duty Manager');
      setCurrentGrade(7);
      setTargetPositionId('POS-EK-303');
      setTargetPositionTitle('Global Key Account Manager');
      setTargetGrade(9); // Mismatch!
      setEmployeeId('EK-62914');
      setEmployeeName('Farhan Saeed');
      setHasBudgetApproval(true);
      setBusinessJustification('Transfer to commercial team.');
    } else if (presetType === 'validPromo') {
      setRequestType('Promotion');
      setDepartment('Flight Operations');
      setTargetDepartment('Flight Operations');
      setCurrentPositionId('POS-EK-102');
      setCurrentPositionTitle('Senior First Officer B777');
      setCurrentGrade(9);
      setTargetPositionId('POS-EK-103');
      setTargetPositionTitle('Captain B777 (Command)');
      setTargetGrade(11);
      setEmployeeId('EK-77341');
      setEmployeeName('Sarah Jenkins');
      setHasBudgetApproval(true);
      setBudgetRefCode('BUD-FLT-2026-CMD');
      setBusinessJustification('Sarah completed 5,000+ flight command hours and passed simulator check ride with high score.');
    } else if (presetType === 'noBudgetPromo') {
      setRequestType('Promotion');
      setDepartment('Engineering');
      setTargetDepartment('Engineering');
      setCurrentGrade(8);
      setTargetGrade(10);
      setEmployeeId('EK-33419');
      setEmployeeName('Rashid Al-Blooshi');
      setHasBudgetApproval(false); // Violation!
      setBusinessJustification('Promotion to heavy maintenance dock manager.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation?.isValid) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        requestType,
        title: `${requestType}: ${employeeName || employeeId || 'Employee'} → ${targetPositionTitle || 'New Position'}`,
        department,
        targetDepartment,
        employeeId,
        employeeName,
        currentPositionId,
        currentPositionTitle,
        currentGrade,
        targetPositionId,
        targetPositionTitle,
        targetGrade,
        hasBudgetApproval,
        budgetRefCode,
        businessJustification,
        attachments,
        submittedBy: 'Capt. Tariq Al-Maktoum (Line Manager)'
      };

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit request');
      }

      const created = await res.json();
      onSubmitted(created.id);
    } catch (err: any) {
      console.error('Submission failed', err);
      setSubmitError(err.message || 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = validation?.isValid ?? false;
  const gradeDifference = Number(targetGrade) - Number(currentGrade);

  const t = isAr ? translations.ar : translations.en;

  return (
    <div className="space-y-6">
      {/* Top Banner: Right First Time Engine Promise */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D71921]">
                {isAr ? 'محرك قواعد التدقيق المسبق لمجموعة الإمارات' : 'Emirates Group RFT Rule Engine'}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-medium">
                {isAr ? 'التحقق المسبق الفوري نشط' : 'Pre-Submission Validation Active'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              {t.wizardTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              {t.wizardSubtitle}
            </p>
          </div>

          {/* Test Presets for Quick Demo */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-start sm:self-auto">
            <span className="text-[11px] font-medium text-slate-400 mr-1">{t.presets}:</span>
            <button
              type="button"
              onClick={() => applyPreset('validLateral')}
              className="px-2 py-1 text-xs font-medium rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              {t.expressLateral}
            </button>
            <button
              type="button"
              onClick={() => applyPreset('invalidLateral')}
              className="px-2 py-1 text-xs font-medium rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors cursor-pointer"
              title="Test Grade Mismatch Failure"
            >
              {t.gradeMismatch}
            </button>
            <button
              type="button"
              onClick={() => applyPreset('validPromo')}
              className="px-2 py-1 text-xs font-medium rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
            >
              {t.standardPromo}
            </button>
            <button
              type="button"
              onClick={() => applyPreset('noBudgetPromo')}
              className="px-2 py-1 text-xs font-medium rounded bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors cursor-pointer"
              title="Test Missing Budget Failure"
            >
              {t.missingBudget}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: The Guided Form (7 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-5">
          <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-5">
            {/* Step 1: Request Type Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                {t.step1Title}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(
                  [
                    'Lateral Transfer',
                    'Promotion',
                    'New Position',
                    'End of Service',
                    'Position Deletion'
                  ] as RequestType[]
                ).map(itemType => {
                  const typeLabel =
                    itemType === 'Lateral Transfer'
                      ? isAr ? 'نقل جانبي' : 'Lateral Transfer'
                      : itemType === 'Promotion'
                      ? isAr ? 'ترقية وظيفية' : 'Promotion'
                      : itemType === 'New Position'
                      ? isAr ? 'منصب جديد' : 'New Position'
                      : itemType === 'End of Service'
                      ? isAr ? 'إنهاء خدمة' : 'End of Service'
                      : isAr ? 'إلغاء منصب' : 'Position Deletion';

                  const typeDesc =
                    itemType === 'Lateral Transfer'
                      ? isAr ? 'تطابق تام في الدرجة' : 'Same grade parity'
                      : itemType === 'Promotion'
                      ? isAr ? 'درجة تصاعدية' : 'Ascending grade'
                      : itemType === 'New Position'
                      ? isAr ? 'اعتماد ميزانية ملزم' : 'Budget clearance req.'
                      : isAr ? 'إجراءات مغادرة' : 'Staffing offboarding';

                  return (
                    <button
                      key={itemType}
                      type="button"
                      onClick={() => setRequestType(itemType)}
                      className={`px-3 py-2.5 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer ${
                        requestType === itemType
                          ? 'border-[#D71921] bg-red-50/50 text-[#D71921] font-semibold ring-1 ring-[#D71921]'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                      dir={isAr ? 'rtl' : 'ltr'}
                    >
                      <div>{typeLabel}</div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {typeDesc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Employee Identification (if applicable) */}
            {(requestType === 'Lateral Transfer' ||
              requestType === 'Promotion' ||
              requestType === 'End of Service') && (
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {t.step2Title}
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">Rule-04: EK-XXXXX</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">
                      {isAr ? 'رقم الموظف في طيران الإمارات *' : 'Employee ID *'}
                    </label>
                    <input
                      type="text"
                      value={employeeId}
                      onChange={e => setEmployeeId(e.target.value)}
                      placeholder="e.g. EK-77341"
                      className={`w-full px-3 py-2 text-xs rounded-lg border font-mono ${
                        validation?.errors?.['employeeId']
                          ? 'border-red-500 bg-red-50/40 text-red-900 focus:ring-red-500'
                          : 'border-slate-300 focus:border-[#D71921] focus:ring-[#D71921]'
                      }`}
                      dir="ltr"
                    />
                    {validation?.errors?.['employeeId'] && (
                      <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                        <AlertOctagon className="w-3.5 h-3.5" />
                        {isAr ? 'رقم الموظف إلزامي ويبدأ بـ EK' : validation.errors['employeeId']}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1">
                      {isAr ? 'الاسم الكامل للموظف' : 'Employee Full Name'}
                    </label>
                    <input
                      type="text"
                      value={employeeName}
                      onChange={e => setEmployeeName(e.target.value)}
                      placeholder={isAr ? 'الاسم بالكامل' : 'Full Name'}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-[#D71921] focus:ring-[#D71921]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Current vs Target Position & Grade Comparison */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t.step3Title}
                </label>
                <span className="text-[11px] text-slate-400">Rule-02A / Rule-02B</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Current Role Box */}
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t.currentPosGrade}</span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">{t.selectOccupiedPos}</label>
                    <select
                      value={currentPositionId}
                      onChange={e => handleSelectCurrentPosition(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
                    >
                      {positions.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.id} · {p.title} (G{p.grade} - {p.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 block">{isAr ? 'الإدارة الحالية' : 'Department'}</span>
                      <span className="font-medium text-slate-800">{department}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">{t.currentGrade}</span>
                      <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {isAr ? `الدرجة ${currentGrade}` : `Grade ${currentGrade}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Target Role Box */}
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t.targetPosGrade}</span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">{t.selectTargetPos}</label>
                    <select
                      value={targetPositionId}
                      onChange={e => handleSelectTargetPosition(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
                    >
                      {positions.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.id} · {p.title} (G{p.grade} - {p.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 block">{isAr ? 'الإدارة المستهدفة' : 'Target Dept'}</span>
                      <span className="font-medium text-slate-800">{targetDepartment}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">{t.targetGrade}</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          max="15"
                          value={targetGrade}
                          onChange={e => setTargetGrade(Number(e.target.value))}
                          className="w-14 px-1.5 py-0.5 text-xs font-mono font-bold border rounded bg-white"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">(1-15)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Grade Comparison Delta Strip */}
              <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-600">{t.gradeDeltaCheck}:</span>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-800 font-bold">
                      G{currentGrade}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-800 font-bold">
                      G{targetGrade}
                    </span>
                  </div>
                </div>

                <div>
                  {requestType === 'Lateral Transfer' ? (
                    currentGrade === targetGrade ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isAr ? 'تطابق تام (Δ = 0)' : 'Exact Match (Δ = 0)'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded border border-red-300">
                        <AlertOctagon className="w-3.5 h-3.5" />
                        {isAr ? `اختلاف بالدرجة: Δ ${gradeDifference > 0 ? `+${gradeDifference}` : gradeDifference}` : `Discrepancy: Δ ${gradeDifference > 0 ? `+${gradeDifference}` : gradeDifference}`}
                      </span>
                    )
                  ) : requestType === 'Promotion' ? (
                    targetGrade > currentGrade ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isAr ? `ترقية صحيحة (+${gradeDifference})` : `Valid Ascension (+${gradeDifference})`}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded border border-red-300">
                        <AlertOctagon className="w-3.5 h-3.5" />
                        {isAr ? 'مخالفة: الدرجة المستهدفة ≤ الحالية' : 'Invalid: Target ≤ Current'}
                      </span>
                    )
                  ) : (
                    <span className="text-xs text-slate-500 font-mono">G{targetGrade} Targeted</span>
                  )}
                </div>
              </div>

              {/* Exact Field Error Badge if Target Grade violation */}
              {validation?.errors?.['targetGrade'] && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                  <AlertOctagon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{isAr ? 'حظر القاعدة RULE-02: ' : 'Rule-02 Blocked: '}</span>
                    <span>{validation.errors['targetGrade']}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 4: Budget Authorization & Headcount Signoff */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t.step4Title}
                </label>
                <span className="text-[11px] text-slate-400">Rule-03: Mandatory for New & Promo</span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      id="budgetApprovalCheckbox"
                      type="checkbox"
                      checked={hasBudgetApproval}
                      onChange={e => setHasBudgetApproval(e.target.checked)}
                      className="w-4 h-4 text-[#D71921] rounded border-slate-300 focus:ring-[#D71921]"
                    />
                    <label htmlFor="budgetApprovalCheckbox" className="text-xs font-medium text-slate-800 cursor-pointer">
                      {t.budgetCheckboxLabel}
                    </label>
                  </div>

                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                      hasBudgetApproval
                        ? 'text-emerald-700 bg-emerald-100'
                        : 'text-amber-700 bg-amber-100'
                    }`}
                  >
                    {hasBudgetApproval ? t.budgetVerified : t.budgetUnverified}
                  </span>
                </div>

                {hasBudgetApproval && (
                  <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={budgetRefCode}
                      onChange={e => setBudgetRefCode(e.target.value)}
                      placeholder={t.budgetPlaceholder}
                      className="px-2 py-1 text-xs font-mono rounded border border-slate-300 bg-white w-56"
                    />
                    <span className="text-[11px] text-slate-500">
                      {isAr ? 'سجل شواغر الميزانية المعتمدة' : 'Corporate Finance Headcount Ledger'}
                    </span>
                  </div>
                )}
              </div>

              {validation?.errors?.['hasBudgetApproval'] && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                  <AlertOctagon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{isAr ? 'حظر القاعدة RULE-03: ' : 'Rule-03 Blocked: '}</span>
                    <span>{validation.errors['hasBudgetApproval']}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 5: Business Justification */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t.step5Title}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Rule-01: Min 15 chars</span>
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      businessJustification.trim().length >= 15
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                        : 'text-red-700 bg-red-50 border border-red-200'
                    }`}
                  >
                    {businessJustification.trim().length} / 15 chars
                  </span>
                </div>
              </div>

              <textarea
                rows={3}
                value={businessJustification}
                onChange={e => setBusinessJustification(e.target.value)}
                placeholder={t.justificationPlaceholder}
                className={`w-full p-3 text-xs rounded-lg border leading-relaxed ${
                  validation?.errors?.['businessJustification']
                    ? 'border-red-500 bg-red-50/30 text-red-900 focus:ring-red-500'
                    : 'border-slate-300 focus:border-[#D71921] focus:ring-[#D71921]'
                }`}
              />

              {validation?.errors?.['businessJustification'] && (
                <p className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                  <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                  {validation.errors['businessJustification']}
                </p>
              )}
            </div>

            {/* Step 6: Supporting Documentation */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t.step6Title}
                </label>
                <span className="text-[11px] text-slate-400">
                  {isAr ? 'يقلل خطر التأخير بنسبة -20%' : 'Mitigates +20% Delay Risk'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                {attachments.map((file, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded border border-slate-200"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>{file}</span>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => setAttachments([...attachments, `Endorsement_Doc_${attachments.length + 1}.pdf`])}
                  className="px-2 py-1 text-xs text-[#D71921] hover:bg-red-50 rounded border border-dashed border-[#D71921]/40 transition-colors cursor-pointer"
                >
                  {t.addAttachment}
                </button>
              </div>
            </div>

            {/* Submit Block & Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                {isFormValid ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>{t.validationPassedTitle}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-red-700 font-medium">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span>{t.validationBlockedTitle}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="submit"
                  disabled={!isFormValid || submitting}
                  className={`w-full sm:w-auto px-6 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    isFormValid && !submitting
                      ? 'bg-[#D71921] hover:bg-[#b5141b] text-white shadow-sm cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  }`}
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t.dispatching}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{t.submitButton}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {submitError && (
              <p className="text-xs text-red-600 font-medium mt-2">{submitError}</p>
            )}
          </div>
        </form>

        {/* Right Column: Real-Time Rule Auditor & In-Flight Risk Simulation (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Real-time Rule Check Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#D71921]" />
                <span>{t.ruleAuditorTitle}</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">{t.liveValidation}</span>
            </div>

            <div className="space-y-2">
              {(validation?.ruleResults || []).map((rule, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border text-xs transition-colors ${
                    rule.passed
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                      : rule.severity === 'CRITICAL_BLOCKER'
                      ? 'bg-red-50/60 border-red-300 text-red-950 font-medium'
                      : 'bg-amber-50/60 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {rule.passed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertOctagon className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      )}
                      <span className="font-semibold">{rule.name}</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase text-slate-500">
                      {rule.code}
                    </span>
                  </div>
                  <p className="text-[11px] mt-1 text-slate-600 leading-snug">
                    {rule.message}
                  </p>
                </div>
              ))}
            </div>

            {validation?.warnings && validation.warnings.length > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <div className="font-semibold flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>Advisory Notice:</span>
                </div>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
                  {validation.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Real-time In-Flight Risk Classifier & SHAP Simulation Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#BA9653]" />
                  <span>In-Flight Risk Classifier Preview</span>
                </h3>
                <p className="text-[11px] text-slate-400">XGBoost / LightGBM Predictive Inference</p>
              </div>
              {loadingRisk && (
                <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
              )}
            </div>

            {riskPreview && (
              <ShapWaterfall
                shapValues={riskPreview.shapValues}
                returnRisk={riskPreview.returnRisk}
                delayRisk={riskPreview.delayRisk}
                riskTier={riskPreview.riskTier}
                recommendedAction={riskPreview.recommendedAction}
                autoExpressLaneEligible={riskPreview.autoExpressLaneEligible}
                predictedCycleDays={riskPreview.predictedCycleDays}
                compact={false}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

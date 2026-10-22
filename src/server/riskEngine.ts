import { P2PRequest, RiskPrediction, RiskTier, ShapAttribution } from '../types.js';

export interface RiskInferenceInput {
  requestType: string;
  currentGrade?: number | null;
  targetGrade?: number | null;
  originDepartment: string;
  targetDepartment: string;
  hasBudgetApproval: boolean;
  businessJustification: string;
  hasAttachments?: boolean;
  historicalReturnsRate?: number; // e.g. 0.25
}

/**
 * In-Memory XGBoost / LightGBM Classifier Simulator
 * Simulates trained gradient-boosted decision tree ensemble outputs,
 * calibrated probability sigmoids, and SHAP (SHapley Additive exPlanations)
 * tree-explainer feature attribution calculations.
 */
export function predictRisk(input: RiskInferenceInput): RiskPrediction {
  const shapValues: ShapAttribution[] = [];

  // Base priors from historical baseline training corpus (820 cases)
  // Base log-odds for Return Risk: ~0.28 (28% prior return rate across company)
  // Base log-odds for Delay Risk: ~0.35 (35% prior delay rate)
  let rawReturnScore = 18; // base risk percentage
  let rawDelayScore = 22; // base risk percentage

  const isCrossDepartment =
    Boolean(input.originDepartment && input.targetDepartment) &&
    input.originDepartment !== input.targetDepartment;

  const currentG = input.currentGrade != null ? Number(input.currentGrade) : 7;
  const targetG = input.targetGrade != null ? Number(input.targetGrade) : currentG;
  const gradeDelta = targetG - currentG;

  // Feature 1: Cross-Department Transfer
  if (isCrossDepartment) {
    const impact = 32;
    rawReturnScore += impact;
    rawDelayScore += 26;
    shapValues.push({
      feature: 'cross_department_transfer',
      displayName: 'Cross-Department Movement',
      value: `${input.originDepartment} → ${input.targetDepartment}`,
      impact: +32,
      impactType: 'increases_risk',
      explanation: '+32% Return Risk: Transfer involves inter-departmental headcount release and receiving VP alignment.'
    });
  } else {
    shapValues.push({
      feature: 'same_department_movement',
      displayName: 'Intra-Department Consistency',
      value: input.originDepartment || 'Same Department',
      impact: -12,
      impactType: 'decreases_risk',
      explanation: '-12% Return Risk: Intra-departmental placement retains reporting line continuity.'
    });
    rawReturnScore -= 12;
    rawDelayScore -= 8;
  }

  // Feature 2: Missing Headcount Budget Signoff
  if (!input.hasBudgetApproval && (input.requestType === 'New Position' || input.requestType === 'Promotion')) {
    const impact = 38;
    rawReturnScore += impact;
    rawDelayScore += 34;
    shapValues.push({
      feature: 'missing_budget_signoff',
      displayName: 'Headcount Budget Authorization',
      value: 'Pending / Unverified',
      impact: +38,
      impactType: 'increases_risk',
      explanation: '+38% Return Risk: Historical models show 84% of unverified budget requests get returned by Finance.'
    });
  } else if (input.hasBudgetApproval) {
    rawReturnScore -= 15;
    rawDelayScore -= 18;
    shapValues.push({
      feature: 'verified_budget_approval',
      displayName: 'Headcount Budget Authorization',
      value: 'Verified by Finance',
      impact: -15,
      impactType: 'decreases_risk',
      explanation: '-15% Return Risk: Headcount budget code is pre-validated against Corporate Finance database.'
    });
  }

  // Feature 3: Grade Leap / Grade Mismatch
  if (input.requestType === 'Promotion') {
    if (gradeDelta > 2) {
      rawReturnScore += 28;
      rawDelayScore += 35;
      shapValues.push({
        feature: 'grade_leap_exceeds_threshold',
        displayName: 'Substantial Grade Jump (> +2)',
        value: `+${gradeDelta} Grade Levels`,
        impact: +28,
        impactType: 'increases_risk',
        explanation: `+28% Risk: Promotion of +${gradeDelta} grades requires Senior VP Group HR & Comp Committee governance.`
      });
    } else if (gradeDelta === 1) {
      rawReturnScore -= 8;
      rawDelayScore -= 10;
      shapValues.push({
        feature: 'standard_grade_ascension',
        displayName: 'Standard Grade Progression',
        value: '+1 Grade Level',
        impact: -8,
        impactType: 'decreases_risk',
        explanation: '-8% Risk: Standard single grade step matches standard Emirates career progression pathways.'
      });
    }
  } else if (input.requestType === 'Lateral Transfer') {
    if (gradeDelta !== 0) {
      rawReturnScore += 45;
      rawDelayScore += 40;
      shapValues.push({
        feature: 'lateral_grade_discrepancy',
        displayName: 'Lateral Grade Discrepancy',
        value: `Target G${targetG} vs Current G${currentG}`,
        impact: +45,
        impactType: 'increases_risk',
        explanation: '+45% Risk: Lateral transfers with grade mismatch are rejected by HR screening within 48 hours.'
      });
    }
  }

  // Feature 4: Justification Quality & Character Count
  const justLen = (input.businessJustification || '').trim().length;
  if (justLen < 25) {
    rawReturnScore += 16;
    rawDelayScore += 14;
    shapValues.push({
      feature: 'terse_business_justification',
      displayName: 'Brief Business Justification',
      value: `${justLen} characters`,
      impact: +16,
      impactType: 'increases_risk',
      explanation: '+16% Risk: Brief justifications lack operational justification context needed for HR endorsement.'
    });
  } else if (justLen >= 60) {
    rawReturnScore -= 10;
    rawDelayScore -= 8;
    shapValues.push({
      feature: 'comprehensive_justification',
      displayName: 'Robust Business Justification',
      value: `${justLen} characters`,
      impact: -10,
      impactType: 'decreases_risk',
      explanation: '-10% Risk: Detailed business justification significantly accelerates Line & HR reviewer buy-in.'
    });
  }

  // Feature 5: Missing Attachments
  if (input.hasAttachments === false) {
    rawReturnScore += 20;
    rawDelayScore += 24;
    shapValues.push({
      feature: 'missing_jd_attachments',
      displayName: 'Supporting Documents / JD',
      value: 'No attachments found',
      impact: +20,
      impactType: 'increases_risk',
      explanation: '+20% Delay Risk: Requests missing position description or organogram trigger manual follow-up emails.'
    });
  }

  // Feature 6: Express Lane Eligibility
  const isLateralSameDept = input.requestType === 'Lateral Transfer' && !isCrossDepartment && gradeDelta === 0;
  if (isLateralSameDept && justLen >= 25) {
    rawReturnScore -= 25;
    rawDelayScore -= 30;
    shapValues.push({
      feature: 'express_lane_synergy',
      displayName: 'Express Lane Optimization',
      value: 'Zero-Discrepancy Lateral',
      impact: -25,
      impactType: 'decreases_risk',
      explanation: '-25% Risk: Qualifies for automated fast-track routing directly to HR Operations Finalizer.'
    });
  }

  // Clamp probabilities to [3%, 98%]
  const returnRisk = Math.min(98, Math.max(3, Math.round(rawReturnScore)));
  const delayRisk = Math.min(98, Math.max(4, Math.round(rawDelayScore)));
  const compositeRiskScore = Math.round((returnRisk * 0.55) + (delayRisk * 0.45));

  let riskTier: RiskTier = 'Low';
  if (compositeRiskScore >= 65) {
    riskTier = 'High';
  } else if (compositeRiskScore >= 32) {
    riskTier = 'Medium';
  }

  // Generate actionable recommendation
  let recommendedAction = 'Standard HR Ops Screening Queue';
  const autoExpressLaneEligible = isLateralSameDept && compositeRiskScore < 25;

  if (autoExpressLaneEligible) {
    recommendedAction = 'Fast-Track Auto-Routing: Qualifies for Express Lane 1-day turnaround.';
  } else if (riskTier === 'High') {
    if (!input.hasBudgetApproval) {
      recommendedAction = 'Pre-Screening Hold: Secure Finance Headcount clearance before routing to HR Ops.';
    } else if (isCrossDepartment) {
      recommendedAction = 'Inter-Department Mediation: Request releasing VP pre-approval to prevent return loop.';
    } else {
      recommendedAction = 'Senior HR Governance: Route to HR Business Partner for mandatory pre-submission alignment.';
    }
  } else if (riskTier === 'Medium') {
    recommendedAction = 'Proactive Attachment Reminder: Prompt manager to attach updated Job Description.';
  }

  // Predicted cycle days based on risk score
  const predictedCycleDays = Number((1.5 + (compositeRiskScore / 100) * 8.5).toFixed(1));

  // Sort SHAP values by absolute impact descending
  shapValues.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  return {
    returnRisk,
    delayRisk,
    compositeRiskScore,
    riskTier,
    shapValues,
    recommendedAction,
    autoExpressLaneEligible,
    predictedCycleDays,
    confidence: 0.92
  };
}

/**
 * Predict risk for an existing P2PRequest
 */
export function evaluateRequestRisk(req: P2PRequest): RiskPrediction {
  return predictRisk({
    requestType: req.requestType,
    currentGrade: req.currentGrade,
    targetGrade: req.targetGrade,
    originDepartment: req.department,
    targetDepartment: req.targetDepartment,
    hasBudgetApproval: req.hasBudgetApproval,
    businessJustification: req.businessJustification,
    hasAttachments: req.attachments && req.attachments.length > 0
  });
}

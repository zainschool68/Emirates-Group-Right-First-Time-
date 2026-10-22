import { PreValidationResponse, RequestType, RuleValidationResult } from '../types.js';

export interface PreValidationInput {
  requestType: RequestType;
  businessJustification?: string;
  currentGrade?: number | null;
  targetGrade?: number | null;
  hasBudgetApproval?: boolean;
  employeeId?: string | null;
  originDepartment?: string;
  targetDepartment?: string;
}

export function runPreValidation(input: PreValidationInput): PreValidationResponse {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];
  const ruleResults: RuleValidationResult[] = [];

  const {
    requestType,
    businessJustification = '',
    currentGrade,
    targetGrade,
    hasBudgetApproval = false,
    employeeId,
    originDepartment,
    targetDepartment
  } = input;

  // Rule 1: Business justification >= 15 characters
  const trimmedJustification = (businessJustification || '').trim();
  const justificationPassed = trimmedJustification.length >= 15;
  ruleResults.push({
    ruleId: 'RULE-01',
    code: 'JUSTIFICATION_LENGTH',
    name: 'Minimum Justification Rigor',
    passed: justificationPassed,
    severity: 'CRITICAL_BLOCKER',
    field: 'businessJustification',
    message: justificationPassed
      ? `Valid justification length (${trimmedJustification.length} characters). Meets 15 character threshold.`
      : `Business justification must be at least 15 characters (currently ${trimmedJustification.length}). Articulate operational requirement.`
  });
  if (!justificationPassed) {
    errors['businessJustification'] = `Justification is too brief (${trimmedJustification.length}/15 chars required).`;
  }

  // Rule 2A: Lateral Transfer must have target grade equal to current grade
  if (requestType === 'Lateral Transfer') {
    const gradesDefined = currentGrade != null && targetGrade != null;
    const lateralGradePassed = gradesDefined && Number(currentGrade) === Number(targetGrade);
    ruleResults.push({
      ruleId: 'RULE-02A',
      code: 'LATERAL_GRADE_EQUALITY',
      name: 'Lateral Transfer Grade Parity',
      passed: lateralGradePassed,
      severity: 'CRITICAL_BLOCKER',
      field: 'targetGrade',
      message: lateralGradePassed
        ? `Target grade (${targetGrade}) matches current grade (${currentGrade}). Grade parity verified.`
        : !gradesDefined
        ? 'Both current and target grades must be selected.'
        : `Lateral Transfer violation: Target Grade (${targetGrade}) does not match Current Grade (${currentGrade}). For grade changes, submit a Promotion request.`
    });
    if (!lateralGradePassed) {
      errors['targetGrade'] = `Lateral Transfer requires Target Grade (${targetGrade ?? '?'}) to equal Current Grade (${currentGrade ?? '?'}).`;
    }
  }

  // Rule 2B: Promotion must have target grade > current grade
  if (requestType === 'Promotion') {
    const gradesDefined = currentGrade != null && targetGrade != null;
    const promotionGradePassed = gradesDefined && Number(targetGrade) > Number(currentGrade);
    ruleResults.push({
      ruleId: 'RULE-02B',
      code: 'PROMOTION_GRADE_INCREASE',
      name: 'Promotion Grade Ascension',
      passed: promotionGradePassed,
      severity: 'CRITICAL_BLOCKER',
      field: 'targetGrade',
      message: promotionGradePassed
        ? `Promotion grade ascension verified: Grade ${currentGrade} -> Grade ${targetGrade} (+${Number(targetGrade) - Number(currentGrade)}).`
        : !gradesDefined
        ? 'Both current and target grades must be selected.'
        : `Promotion violation: Target Grade (${targetGrade}) must be strictly higher than Current Grade (${currentGrade}).`
    });
    if (!promotionGradePassed) {
      errors['targetGrade'] = `Promotion requires Target Grade (${targetGrade ?? '?'}) > Current Grade (${currentGrade ?? '?'}).`;
    }

    // Secondary Warning: Grade Leap > 2 grades requires VP signoff
    if (gradesDefined && Number(targetGrade) - Number(currentGrade) > 2) {
      warnings.push(`Grade jump of +${Number(targetGrade) - Number(currentGrade)} levels requires Senior VP Human Resources endorsement and compensation band committee review.`);
      ruleResults.push({
        ruleId: 'RULE-05',
        code: 'GRADE_LEAP_GOVERNANCE',
        name: 'Executive Grade Leap Governance',
        passed: false,
        severity: 'WARNING',
        field: 'targetGrade',
        message: `Grade leap > 2 levels (+${Number(targetGrade) - Number(currentGrade)}). Will require Senior VP HR executive escalation.`
      });
    }
  }

  // Rule 3: New Position and Promotion strictly require has_budget_approval = true
  if (requestType === 'New Position' || requestType === 'Promotion') {
    const budgetPassed = Boolean(hasBudgetApproval);
    ruleResults.push({
      ruleId: 'RULE-03',
      code: 'BUDGET_APPROVAL_REQUIRED',
      name: 'Budgetary Authorization Enforcement',
      passed: budgetPassed,
      severity: 'CRITICAL_BLOCKER',
      field: 'hasBudgetApproval',
      message: budgetPassed
        ? 'Approved headcount budget reference verified.'
        : `Requests for "${requestType}" require verified Finance Headcount Budget authorization before submission.`
    });
    if (!budgetPassed) {
      errors['hasBudgetApproval'] = `Finance budget authorization is mandatory for "${requestType}".`;
    }
  }

  // Rule 4: Require valid employee_id for transfers/promotions
  if (requestType === 'Lateral Transfer' || requestType === 'Promotion' || requestType === 'End of Service') {
    const validId = typeof employeeId === 'string' && employeeId.trim().length >= 4;
    ruleResults.push({
      ruleId: 'RULE-04',
      code: 'EMPLOYEE_IDENTIFIER_REQUIRED',
      name: 'Emirates Employee ID Verification',
      passed: validId,
      severity: 'CRITICAL_BLOCKER',
      field: 'employeeId',
      message: validId
        ? `Valid employee identifier confirmed (${employeeId}).`
        : `A valid Emirates employee ID (e.g. EK-12345) is mandatory for ${requestType}.`
    });
    if (!validId) {
      errors['employeeId'] = `Valid employee ID is mandatory for ${requestType}.`;
    }
  }

  // Inter-department warning
  if (originDepartment && targetDepartment && originDepartment !== targetDepartment) {
    warnings.push(`Cross-department movement (${originDepartment} → ${targetDepartment}) will route to both releasing and receiving department Heads.`);
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    warnings,
    ruleResults
  };
}

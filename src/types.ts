export type RequestType =
  | 'Lateral Transfer'
  | 'Promotion'
  | 'New Position'
  | 'End of Service'
  | 'Position Deletion';

export type RequestStatus =
  | 'Draft'
  | 'Pre-Validated'
  | 'In HR Ops Review'
  | 'Finance Budget Review'
  | 'Returned to Manager'
  | 'Approved'
  | 'Express Lane Synced'
  | 'Rejected'
  | 'Cancelled';

export type RiskTier = 'Low' | 'Medium' | 'High';

export interface OrgPosition {
  id: string;
  title: string;
  grade: number;
  department: string;
  division: string;
  reportsTo: string;
  reportsToTitle: string;
  currentOccupantId: string | null;
  currentOccupantName: string | null;
  location: string;
  status: 'Occupied' | 'Vacant';
  budgetedFTE: number;
}

export interface ValidationRule {
  id: string;
  code: string;
  name: string;
  description: string;
  severity: 'CRITICAL_BLOCKER' | 'WARNING';
  applicableRequestTypes: RequestType[];
  field: string;
  minChars?: number;
  condition?: string;
}

export interface RuleValidationResult {
  ruleId: string;
  code: string;
  name: string;
  passed: boolean;
  severity: 'CRITICAL_BLOCKER' | 'WARNING';
  field: string;
  message: string;
}

export interface PreValidationResponse {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: string[];
  ruleResults: RuleValidationResult[];
}

export interface ShapAttribution {
  feature: string;
  displayName: string;
  value: string | number | boolean;
  impact: number; // e.g. +32% or -25%
  impactType: 'increases_risk' | 'decreases_risk' | 'neutral';
  explanation: string;
}

export interface RiskPrediction {
  returnRisk: number; // 0 to 100
  delayRisk: number; // 0 to 100
  compositeRiskScore: number; // 0 to 100
  riskTier: RiskTier;
  shapValues: ShapAttribution[];
  recommendedAction: string;
  autoExpressLaneEligible: boolean;
  predictedCycleDays: number;
  confidence: number;
}

export interface P2PRequest {
  id: string;
  trackingNumber: string;
  requestType: RequestType;
  title: string;
  status: RequestStatus;
  currentStepOwner: string;
  department: string;
  targetDepartment: string;
  employeeId?: string;
  employeeName?: string;
  currentPositionId?: string;
  currentPositionTitle?: string;
  currentGrade?: number;
  targetPositionId?: string;
  targetPositionTitle?: string;
  targetGrade?: number;
  hasBudgetApproval: boolean;
  budgetRefCode?: string;
  businessJustification: string;
  attachments: string[];
  submittedBy: string;
  submittedAt: string;
  lastUpdatedAt: string;
  riskPrediction?: RiskPrediction;
  auditTrailCount: number;
  hitlActionTaken?: {
    action: 'Accept' | 'Override' | 'Approve' | 'Return';
    actor: string;
    reason: string;
    timestamp: string;
  };
}

export interface ProcessEvent {
  eventId: string;
  caseId: string;
  activity: string;
  timestamp: string;
  actor: string;
  outcome: string;
  department: string;
  requestType: string;
  durationHours: number;
}

export interface TraceVariant {
  id: string;
  name: string;
  description: string;
  caseCount: number;
  casePercentage: number;
  avgDurationDays: number;
  steps: string[];
  isHappyPath: boolean;
  hasReturnLoop: boolean;
}

export interface TransitionLatency {
  fromActivity: string;
  toActivity: string;
  avgDurationHours: number;
  medianDurationHours: number;
  caseCount: number;
  isBottleneck: boolean;
  delayDriver: string;
}

export interface QuantifiedRecommendation {
  id: string;
  issue: string;
  rootCause: string;
  intervention: string;
  estimatedDaysSaved: number;
  affectedAnnualVolume: number;
  roiImpact: string;
  status: 'Active Rule Deployed' | 'Recommended Automation' | 'Policy Review Needed';
}

export interface ProcessAnalytics {
  summary: {
    totalCases: number;
    totalEvents: number;
    firstTimeRightRate: number; // % (e.g. 58.4%)
    returnLoopRate: number; // % (e.g. 41.6%)
    avgCycleTimeDays: number; // e.g. 5.4 days
    potentialTimeSavedDays: number; // aggregate per case
    expressLaneAdoptionRate: number;
  };
  traceVariants: TraceVariant[];
  transitionLatencies: TransitionLatency[];
  pingPongByDepartment: {
    department: string;
    totalCases: number;
    returnsCount: number;
    returnRate: number;
    topReturnReason: string;
  }[];
  quantifiedRecommendations: QuantifiedRecommendation[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  caseId: string;
  trackingNumber: string;
  actor: string;
  actorRole: 'Line Manager' | 'HR Operations' | 'Finance Controller' | 'AI Risk Engine' | 'System Rule Engine' | 'Executive VP';
  actionType:
    | 'PRE_VALIDATION_PASSED'
    | 'PRE_VALIDATION_BLOCKED'
    | 'RISK_SCORING_COMPUTED'
    | 'REQUEST_SUBMITTED'
    | 'HITL_ACCEPTED_RECOMMENDATION'
    | 'HITL_OVERRIDE_FLAGGED'
    | 'HR_OPS_APPROVED'
    | 'RETURNED_TO_MANAGER'
    | 'EXPRESS_LANE_ROUTED'
    | 'ERP_PERSON_SYNCED';
  details: string;
  metadata?: {
    returnRisk?: number;
    delayRisk?: number;
    rulesTriggered?: string[];
    overrideReason?: string;
    shapSummary?: string;
  };
}

export interface DepartmentRiskSummary {
  department: string;
  totalPending: number;
  lowRiskCount: number;
  medRiskCount: number;
  highRiskCount: number;
  avgReturnRisk: number;
  avgDelayRisk: number;
  highRiskPercentage: number;
  riskPocketAlert?: string;
}

export interface BulkActionPayload {
  ids: string[];
  action: 'Batch Approve' | 'Flag for Review';
  actor: string;
  reason?: string;
}

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  language: 'en' | 'ar';
  timestamp: string;
  relatedCaseId?: string;
  actionLinks?: { label: string; action: string; targetId?: string }[];
}

export interface MonthlyTrendData {
  month: string;
  monthAr: string;
  rftRate: number;
  returnRate: number;
  avgCycleDays: number;
  expressVolume: number;
  totalVolume: number;
  volumeSavedAed: number;
}

export interface DepartmentEfficiencyData {
  department: string;
  deptAr: string;
  totalCases: number;
  expressSynced: number;
  hrApproved: number;
  inReview: number;
  returnedCount: number;
  ftrRate: number;
  avgDays: number;
  slaCompliance: number;
}

export interface TatComparisonData {
  type: string;
  typeAr: string;
  baselineDays: number;
  currentDays: number;
  slaTargetDays: number;
  speedupPct: number;
  volume: number;
}

export interface RejectionRootCause {
  reason: string;
  reasonAr: string;
  percentage: number;
  count: number;
  category: string;
}

export interface AnalyticsOverview {
  summary: {
    totalRequestsCorpus: number;
    rftRate: number;
    baselineRftRate: number;
    rftGainPercentagePoints: number;
    avgCycleDays: number;
    baselineCycleDays: number;
    cycleReductionPercentage: number;
    expressLaneShare: number;
    annualAedSavings: number;
    manHoursSaved: number;
    reworkReductionRate: number;
    activePending: number;
    lowRiskActive: number;
    expressActive: number;
  };
  monthlyTrend: MonthlyTrendData[];
  departmentEfficiency: DepartmentEfficiencyData[];
  tatComparison: TatComparisonData[];
  rejectionRootCauses: RejectionRootCause[];
  riskDistribution: {
    lowRisk: { count: number; percentage: number; avgTatDays: number; autoExpressEligible: boolean };
    mediumRisk: { count: number; percentage: number; avgTatDays: number; autoExpressEligible: boolean };
    highRisk: { count: number; percentage: number; avgTatDays: number; autoExpressEligible: boolean };
  };
}


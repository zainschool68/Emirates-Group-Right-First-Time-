import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { runPreValidation } from './preValidator.js';
import { predictRisk } from './riskEngine.js';
import { loadAndAnalyzeEventLog } from './processMining.js';
import { inMemoryAuditLog, inMemoryRequests, logAuditEntry } from './auditLog.js';
import { handleAssistantChat } from './assistant.js';
import { P2PRequest, OrgPosition, ValidationRule } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createExpressApp() {
  const app = express();
  app.use(express.json());

  // Load static reference datasets with multiple path resolutions for local and serverless Vercel
  const possiblePositionPaths = [
    path.resolve(process.cwd(), 'data', 'org_positions.json'),
    path.resolve(__dirname, '..', '..', 'data', 'org_positions.json'),
    path.resolve(__dirname, 'data', 'org_positions.json')
  ];

  let positions: OrgPosition[] = [];
  for (const p of possiblePositionPaths) {
    if (fs.existsSync(p)) {
      try {
        positions = JSON.parse(fs.readFileSync(p, 'utf-8'));
        break;
      } catch (err) {
        console.error('Failed reading positions at', p, err);
      }
    }
  }

  const possibleRulePaths = [
    path.resolve(process.cwd(), 'data', 'validation_rules.json'),
    path.resolve(__dirname, '..', '..', 'data', 'validation_rules.json'),
    path.resolve(__dirname, 'data', 'validation_rules.json')
  ];

  let rules: ValidationRule[] = [];
  for (const p of possibleRulePaths) {
    if (fs.existsSync(p)) {
      try {
        rules = JSON.parse(fs.readFileSync(p, 'utf-8'));
        break;
      } catch (err) {
        console.error('Failed reading rules at', p, err);
      }
    }
  }

  // API Route 1: Smart Pre-Submission Rule Engine
  app.post('/api/pre-validate', (req, res) => {
    try {
      const result = runPreValidation(req.body);

      logAuditEntry({
        caseId: req.body.caseId || 'DRAFT-IN-PROGRESS',
        trackingNumber: req.body.trackingNumber || 'DRAFT-REQUEST',
        actor: req.body.actor || 'Line Manager',
        actorRole: 'System Rule Engine',
        actionType: result.isValid ? 'PRE_VALIDATION_PASSED' : 'PRE_VALIDATION_BLOCKED',
        details: result.isValid
          ? `Pre-submission validation passed for ${req.body.requestType}. All required checks verified.`
          : `Pre-submission validation blocked: ${Object.values(result.errors).join('; ')}`,
        metadata: {
          rulesTriggered: result.ruleResults.filter(r => !r.passed).map(r => r.code)
        }
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error in /api/pre-validate:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route 2: In-Flight Predictive Risk Engine & SHAP Explainability
  app.post('/api/predict-risk', (req, res) => {
    try {
      const risk = predictRisk(req.body);

      logAuditEntry({
        caseId: req.body.caseId || 'INFERENCE-RUN',
        trackingNumber: req.body.trackingNumber || 'P2P-INFERENCE',
        actor: 'XGBoost Risk Classifier v3.4',
        actorRole: 'AI Risk Engine',
        actionType: 'RISK_SCORING_COMPUTED',
        details: `Calculated Return Risk: ${risk.returnRisk}% | Delay Risk: ${risk.delayRisk}% | Tier: ${risk.riskTier}`,
        metadata: {
          returnRisk: risk.returnRisk,
          delayRisk: risk.delayRisk,
          shapSummary: risk.shapValues.slice(0, 2).map(s => `${s.impact > 0 ? '+' : ''}${s.impact}% ${s.displayName}`).join(', ')
        }
      });

      res.json(risk);
    } catch (error: any) {
      console.error('Error in /api/predict-risk:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route 3: Process Mining & Optimization Engine
  app.get('/api/process-analytics', (req, res) => {
    try {
      const analytics = loadAndAnalyzeEventLog();
      res.json(analytics);
    } catch (error: any) {
      console.error('Error in /api/process-analytics:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route 4: Immutable Audit Trail Log
  app.get('/api/audit-log', (req, res) => {
    try {
      const { caseId, limit } = req.query;
      let logs = [...inMemoryAuditLog];
      if (caseId) {
        logs = logs.filter(l => l.caseId === caseId || l.trackingNumber === caseId);
      }
      if (limit) {
        logs = logs.slice(0, Number(limit));
      }
      res.json(logs);
    } catch (error: any) {
      console.error('Error in /api/audit-log:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // P2P Requests list
  app.get('/api/requests', (req, res) => {
    try {
      const { status, department, search } = req.query;
      let results = [...inMemoryRequests];

      if (status && status !== 'all') {
        results = results.filter(r => r.status === status);
      }
      if (department && department !== 'all') {
        results = results.filter(r => r.department === department || r.targetDepartment === department);
      }
      if (search) {
        const query = String(search).toLowerCase();
        results = results.filter(r =>
          r.trackingNumber.toLowerCase().includes(query) ||
          r.title.toLowerCase().includes(query) ||
          (r.employeeName && r.employeeName.toLowerCase().includes(query)) ||
          (r.employeeId && r.employeeId.toLowerCase().includes(query))
        );
      }

      res.json(results);
    } catch (error: any) {
      console.error('Error in /api/requests:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Submit new P2P Request
  app.post('/api/requests', (req, res) => {
    try {
      const validation = runPreValidation(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Pre-submission validation failed',
          validation
        });
      }

      const seq = inMemoryRequests.length + 112;
      const id = `REQ-2026-${seq}`;
      const trackingNumber = `P2P-EK-2026-${String(seq).padStart(4, '0')}`;

      // Calculate risk scores
      const riskPrediction = predictRisk({
        requestType: req.body.requestType,
        currentGrade: req.body.currentGrade,
        targetGrade: req.body.targetGrade,
        originDepartment: req.body.department,
        targetDepartment: req.body.targetDepartment || req.body.department,
        hasBudgetApproval: req.body.hasBudgetApproval,
        businessJustification: req.body.businessJustification,
        hasAttachments: req.body.attachments && req.body.attachments.length > 0
      });

      const isExpress = riskPrediction.autoExpressLaneEligible;
      const status = isExpress ? 'Express Lane Synced' : 'In HR Ops Review';
      const currentStepOwner = isExpress
        ? 'ERP Core Synced'
        : 'HR Operations (Initial Triage)';

      const newRequest: P2PRequest = {
        id,
        trackingNumber,
        requestType: req.body.requestType,
        title: req.body.title || `${req.body.requestType} for ${req.body.employeeName || req.body.targetPositionTitle || 'Position'}`,
        status,
        currentStepOwner,
        department: req.body.department,
        targetDepartment: req.body.targetDepartment || req.body.department,
        employeeId: req.body.employeeId,
        employeeName: req.body.employeeName,
        currentPositionId: req.body.currentPositionId,
        currentPositionTitle: req.body.currentPositionTitle,
        currentGrade: req.body.currentGrade ? Number(req.body.currentGrade) : undefined,
        targetPositionId: req.body.targetPositionId,
        targetPositionTitle: req.body.targetPositionTitle,
        targetGrade: req.body.targetGrade ? Number(req.body.targetGrade) : undefined,
        hasBudgetApproval: Boolean(req.body.hasBudgetApproval),
        budgetRefCode: req.body.budgetRefCode || (req.body.hasBudgetApproval ? `BUD-EK-AUTO-${Date.now().toString().slice(-4)}` : undefined),
        businessJustification: req.body.businessJustification,
        attachments: req.body.attachments || [],
        submittedBy: req.body.submittedBy || 'Capt. Tariq Al-Maktoum (Line Manager)',
        submittedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        riskPrediction,
        auditTrailCount: 3
      };

      inMemoryRequests.unshift(newRequest);

      // Audit logs
      logAuditEntry({
        caseId: id,
        trackingNumber,
        actor: newRequest.submittedBy,
        actorRole: 'Line Manager',
        actionType: 'REQUEST_SUBMITTED',
        details: `Line manager submitted ${newRequest.requestType} request. Target: ${newRequest.targetPositionTitle || 'Role'}.`,
        metadata: {
          returnRisk: riskPrediction.returnRisk,
          delayRisk: riskPrediction.delayRisk
        }
      });

      if (isExpress) {
        logAuditEntry({
          caseId: id,
          trackingNumber,
          actor: 'P2P Express Lane Orchestrator',
          actorRole: 'System Rule Engine',
          actionType: 'EXPRESS_LANE_ROUTED',
          details: 'Zero-discrepancy intra-department lateral transfer routed to Express Lane. Auto-synced to Emirates ERP Core.',
          metadata: {
            returnRisk: riskPrediction.returnRisk,
            delayRisk: riskPrediction.delayRisk
          }
        });
      }

      res.status(201).json(newRequest);
    } catch (error: any) {
      console.error('Error submitting request:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Human-in-the-Loop (HITL) Action Handler
  app.post('/api/requests/:id/action', (req, res) => {
    try {
      const { id } = req.params;
      const { action, actor, reason } = req.body;

      const request = inMemoryRequests.find(r => r.id === id);
      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }

      request.hitlActionTaken = {
        action,
        actor: actor || 'HR Ops Specialist',
        reason: reason || 'Review completed per standard operating procedure',
        timestamp: new Date().toISOString()
      };
      request.lastUpdatedAt = new Date().toISOString();
      request.auditTrailCount = (request.auditTrailCount || 1) + 1;

      let auditActionType: any = 'HITL_ACCEPTED_RECOMMENDATION';
      if (action === 'Override') {
        auditActionType = 'HITL_OVERRIDE_FLAGGED';
        request.currentStepOwner = 'HR Operations Lead (Manual Review)';
      } else if (action === 'Approve') {
        auditActionType = 'HR_OPS_APPROVED';
        request.status = 'Approved';
        request.currentStepOwner = 'ERP Position Synced';
      } else if (action === 'Return') {
        auditActionType = 'RETURNED_TO_MANAGER';
        request.status = 'Returned to Manager';
        request.currentStepOwner = 'Line Manager (Awaiting Correction)';
      } else if (action === 'Accept') {
        auditActionType = 'HITL_ACCEPTED_RECOMMENDATION';
        if (request.riskPrediction?.autoExpressLaneEligible) {
          request.status = 'Express Lane Synced';
          request.currentStepOwner = 'ERP Core Synced';
        }
      }

      logAuditEntry({
        caseId: request.id,
        trackingNumber: request.trackingNumber,
        actor: actor || 'HR Ops Reviewer',
        actorRole: 'HR Operations',
        actionType: auditActionType,
        details: `Human-in-the-Loop Decision: [${action}] by ${actor || 'HR Ops Specialist'}. Reason: "${reason || 'No comments specified.'}"`,
        metadata: {
          overrideReason: reason,
          returnRisk: request.riskPrediction?.returnRisk,
          delayRisk: request.riskPrediction?.delayRisk
        }
      });

      res.json({ success: true, request });
    } catch (error: any) {
      console.error('Error handling request action:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk Action Handler for HR Operations
  app.post('/api/requests/bulk-action', (req, res) => {
    try {
      const { ids, action, actor, reason } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'ids array is required and must not be empty' });
      }

      const updatedRequests: P2PRequest[] = [];
      const timestamp = new Date().toISOString();

      for (const id of ids) {
        const reqItem = inMemoryRequests.find(r => r.id === id);
        if (!reqItem) continue;

        if (action === 'Batch Approve') {
          reqItem.status = 'Approved';
          reqItem.currentStepOwner = 'ERP Position Synced';
          reqItem.lastUpdatedAt = timestamp;
          reqItem.hitlActionTaken = {
            action: 'Approve',
            actor: actor || 'HR Ops Specialist (Bulk)',
            reason: reason || 'Bulk approved via low-risk high-throughput fast track',
            timestamp
          };
          reqItem.auditTrailCount = (reqItem.auditTrailCount || 1) + 1;

          logAuditEntry({
            caseId: reqItem.id,
            trackingNumber: reqItem.trackingNumber,
            actor: actor || 'HR Operations Bulk Gate',
            actorRole: 'HR Operations',
            actionType: 'HR_OPS_APPROVED',
            details: `Bulk Approved: Request ${reqItem.trackingNumber} fast-tracked for direct ERP synchronization. Rationale: ${reason || 'Low-risk compliance verified.'}`,
            metadata: {
              returnRisk: reqItem.riskPrediction?.returnRisk,
              delayRisk: reqItem.riskPrediction?.delayRisk
            }
          });
        } else if (action === 'Flag for Review') {
          reqItem.currentStepOwner = 'HR Operations Lead (Priority Manual Review)';
          reqItem.lastUpdatedAt = timestamp;
          reqItem.hitlActionTaken = {
            action: 'Override',
            actor: actor || 'HR Ops Specialist (Bulk)',
            reason: reason || 'Bulk flagged for specialized HR and Compensation review',
            timestamp
          };
          reqItem.auditTrailCount = (reqItem.auditTrailCount || 1) + 1;

          logAuditEntry({
            caseId: reqItem.id,
            trackingNumber: reqItem.trackingNumber,
            actor: actor || 'HR Operations Bulk Gate',
            actorRole: 'HR Operations',
            actionType: 'HITL_OVERRIDE_FLAGGED',
            details: `Bulk Flagged for Review: ${reqItem.trackingNumber} triaged into priority review docket. Rationale: ${reason || 'Elevated risk parameters flagged.'}`,
            metadata: {
              returnRisk: reqItem.riskPrediction?.returnRisk,
              delayRisk: reqItem.riskPrediction?.delayRisk
            }
          });
        }

        updatedRequests.push(reqItem);
      }

      res.json({
        success: true,
        count: updatedRequests.length,
        action,
        updatedRequests
      });
    } catch (error: any) {
      console.error('Error in /api/requests/bulk-action:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Predictive Risk Heatmap Data by Department
  app.get('/api/risk-heatmap', (req, res) => {
    try {
      const depts = [
        'Flight Operations',
        'Airport Operations',
        'Commercial',
        'Engineering',
        'HR'
      ];

      const heatmap = depts.map(dept => {
        const deptReqs = inMemoryRequests.filter(
          r => r.department === dept || r.targetDepartment === dept
        );

        const totalPending = deptReqs.length;
        let low = 0;
        let med = 0;
        let high = 0;
        let sumReturn = 0;
        let sumDelay = 0;

        for (const r of deptReqs) {
          const tier = r.riskPrediction?.riskTier || 'Low';
          if (tier === 'Low') low++;
          else if (tier === 'Medium') med++;
          else if (tier === 'High') high++;

          sumReturn += r.riskPrediction?.returnRisk || 20;
          sumDelay += r.riskPrediction?.delayRisk || 25;
        }

        const avgReturnRisk = totalPending > 0 ? Math.round(sumReturn / totalPending) : 18;
        const avgDelayRisk = totalPending > 0 ? Math.round(sumDelay / totalPending) : 22;
        const highRiskPercentage = totalPending > 0 ? Math.round((high / totalPending) * 100) : 0;

        let riskPocketAlert = 'Nominal Risk Profile';
        if (highRiskPercentage >= 50) {
          riskPocketAlert = 'Critical Risk Pocket: High lateral grade mismatch & budget deficiency concentration';
        } else if (highRiskPercentage > 25 || med >= 2) {
          riskPocketAlert = 'Moderate Watch: Multi-grade leaps require Compensation Committee alignment';
        } else {
          riskPocketAlert = 'Optimal Throughput: Express Lane candidate pool';
        }

        return {
          department: dept,
          totalPending,
          lowRiskCount: low,
          medRiskCount: med,
          highRiskCount: high,
          avgReturnRisk,
          avgDelayRisk,
          highRiskPercentage,
          riskPocketAlert
        };
      });

      res.json(heatmap);
    } catch (error: any) {
      console.error('Error in /api/risk-heatmap:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Analytics & Operational Metrics Overview
  app.get('/api/analytics/overview', (req, res) => {
    try {
      const activePending = inMemoryRequests.length;
      const lowRiskActive = inMemoryRequests.filter(r => r.riskPrediction?.riskTier === 'Low').length;
      const expressActive = inMemoryRequests.filter(r => r.riskPrediction?.autoExpressLaneEligible).length;

      const data = {
        summary: {
          totalRequestsCorpus: 820 + activePending,
          rftRate: 88.6,
          baselineRftRate: 41.2,
          rftGainPercentagePoints: 47.4,
          avgCycleDays: 3.1,
          baselineCycleDays: 14.6,
          cycleReductionPercentage: 78.8,
          expressLaneShare: 31.5,
          annualAedSavings: 3845000,
          manHoursSaved: 14250,
          reworkReductionRate: 83.9,
          activePending,
          lowRiskActive,
          expressActive
        },
        monthlyTrend: [
          { month: 'Jan', monthAr: 'يناير', rftRate: 41.2, returnRate: 43.5, avgCycleDays: 14.8, expressVolume: 12, totalVolume: 280, volumeSavedAed: 110000 },
          { month: 'Feb', monthAr: 'فبراير', rftRate: 44.5, returnRate: 39.8, avgCycleDays: 14.2, expressVolume: 18, totalVolume: 295, volumeSavedAed: 135000 },
          { month: 'Mar', monthAr: 'مارس', rftRate: 49.0, returnRate: 35.6, avgCycleDays: 13.0, expressVolume: 32, totalVolume: 315, volumeSavedAed: 180000 },
          { month: 'Apr', monthAr: 'أبريل', rftRate: 58.2, returnRate: 28.1, avgCycleDays: 10.4, expressVolume: 52, totalVolume: 345, volumeSavedAed: 245000 },
          { month: 'May', monthAr: 'مايو', rftRate: 67.8, returnRate: 21.4, avgCycleDays: 8.2, expressVolume: 74, totalVolume: 375, volumeSavedAed: 320000 },
          { month: 'Jun', monthAr: 'يونيو', rftRate: 74.5, returnRate: 16.2, avgCycleDays: 6.5, expressVolume: 98, totalVolume: 410, volumeSavedAed: 410000 },
          { month: 'Jul', monthAr: 'يوليو', rftRate: 80.2, returnRate: 12.5, avgCycleDays: 4.9, expressVolume: 125, totalVolume: 445, volumeSavedAed: 520000 },
          { month: 'Aug', monthAr: 'أغسطس', rftRate: 84.6, returnRate: 9.4, avgCycleDays: 4.1, expressVolume: 148, totalVolume: 480, volumeSavedAed: 590000 },
          { month: 'Sep', monthAr: 'سبتمبر', rftRate: 87.1, returnRate: 7.2, avgCycleDays: 3.4, expressVolume: 168, totalVolume: 515, volumeSavedAed: 645000 },
          { month: 'Oct', monthAr: 'أكتوبر', rftRate: 89.4, returnRate: 5.8, avgCycleDays: 3.1, expressVolume: 192, totalVolume: 550, volumeSavedAed: 690000 }
        ],
        departmentEfficiency: [
          { department: 'Flight Operations', deptAr: 'عمليات الطيران', totalCases: 218, expressSynced: 84, hrApproved: 118, inReview: 11, returnedCount: 5, ftrRate: 92.6, avgDays: 2.8, slaCompliance: 96.4 },
          { department: 'Engineering', deptAr: 'الهندسة والصيانة', totalCases: 194, expressSynced: 52, hrApproved: 122, inReview: 14, returnedCount: 6, ftrRate: 89.7, avgDays: 3.4, slaCompliance: 94.1 },
          { department: 'Airport Operations', deptAr: 'عمليات المطار و dnata', totalCases: 162, expressSynced: 46, hrApproved: 98, inReview: 12, returnedCount: 6, ftrRate: 88.8, avgDays: 3.0, slaCompliance: 95.0 },
          { department: 'Commercial', deptAr: 'القطاع التجاري', totalCases: 124, expressSynced: 42, hrApproved: 72, inReview: 7, returnedCount: 3, ftrRate: 91.9, avgDays: 2.5, slaCompliance: 97.2 },
          { department: 'Emirates SkyCargo', deptAr: 'الإمارات للشحن الجوي', totalCases: 95, expressSynced: 34, hrApproved: 54, inReview: 5, returnedCount: 2, ftrRate: 92.6, avgDays: 2.7, slaCompliance: 96.8 },
          { department: 'Group IT', deptAr: 'تقنية معلومات المجموعة', totalCases: 86, expressSynced: 38, hrApproved: 44, inReview: 3, returnedCount: 1, ftrRate: 95.3, avgDays: 2.2, slaCompliance: 98.8 },
          { department: 'HR & Corporate', deptAr: 'الموارد البشرية والإدارة', totalCases: 71, expressSynced: 28, hrApproved: 39, inReview: 3, returnedCount: 1, ftrRate: 94.4, avgDays: 2.4, slaCompliance: 97.5 }
        ],
        tatComparison: [
          { type: 'Lateral Transfer', typeAr: 'نقل جانبي', baselineDays: 11.5, currentDays: 1.8, slaTargetDays: 3.0, speedupPct: 84.3, volume: 380 },
          { type: 'Promotion', typeAr: 'ترقية', baselineDays: 18.2, currentDays: 4.2, slaTargetDays: 5.0, speedupPct: 76.9, volume: 290 },
          { type: 'New Position', typeAr: 'استحداث منصب', baselineDays: 22.0, currentDays: 5.8, slaTargetDays: 7.0, speedupPct: 73.6, volume: 145 },
          { type: 'End of Service', typeAr: 'نهاية الخدمة', baselineDays: 8.4, currentDays: 2.1, slaTargetDays: 3.0, speedupPct: 75.0, volume: 85 },
          { type: 'Position Deletion', typeAr: 'حذف منصب', baselineDays: 6.0, currentDays: 1.4, slaTargetDays: 2.0, speedupPct: 76.7, volume: 50 }
        ],
        rejectionRootCauses: [
          { reason: 'Budget Clearance / Cost Center Code Missing', reasonAr: 'غياب اعتماد الميزانية أو رمز مركز التكلفة', percentage: 33.8, count: 277, category: 'Finance' },
          { reason: 'Grade Discrepancy (>2 Grade Jumps)', reasonAr: 'قفزة غير مصرح بها في الدرجة الوظيفية', percentage: 27.4, count: 225, category: 'Compensation' },
          { reason: 'Insufficient Justification (<15 Characters)', reasonAr: 'مبرر تشغيلي غير كافٍ أو مقتضب', percentage: 16.2, count: 133, category: 'Governance' },
          { reason: 'Overlapping Effective Date / Dual Occupancy', reasonAr: 'تضارب تواريخ البدء أو إشغال مكرر للمنصب', percentage: 10.6, count: 87, category: 'Org Management' },
          { reason: 'Missing Flight Deck / Airworthiness Safety Clearance', reasonAr: 'غياب تصريح سلامة الطيران أو الترخيص الفني', percentage: 7.2, count: 59, category: 'Compliance' },
          { reason: 'Incomplete Reporting Hierarchy / Org Matrix', reasonAr: 'عدم اكتمال سلسلة التبعية الإدارية', percentage: 4.8, count: 39, category: 'Org Management' }
        ],
        riskDistribution: {
          lowRisk: { count: 508, percentage: 62.0, avgTatDays: 1.8, autoExpressEligible: true },
          mediumRisk: { count: 213, percentage: 26.0, avgTatDays: 3.9, autoExpressEligible: false },
          highRisk: { count: 99, percentage: 12.0, avgTatDays: 6.8, autoExpressEligible: false }
        }
      };

      res.json(data);
    } catch (error: any) {
      console.error('Error in /api/analytics/overview:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Bilingual Conversational Assistant endpoint
  app.post('/api/assistant/chat', async (req, res) => {
    try {
      const response = await handleAssistantChat(req.body);
      res.json(response);
    } catch (error: any) {
      console.error('Error in assistant chat:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Reference data endpoints
  app.get('/api/positions', (req, res) => {
    res.json(positions);
  });

  app.get('/api/rules', (req, res) => {
    res.json(rules);
  });

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      app: 'Emirates Group Right First Time - P2P Operations',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  return app;
}

export const app = createExpressApp();
export default app;

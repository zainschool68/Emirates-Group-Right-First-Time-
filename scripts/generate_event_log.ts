import fs from 'fs';
import path from 'path';

interface Event {
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

const DEPARTMENTS = [
  'Flight Operations',
  'Airport Operations',
  'Commercial',
  'Engineering',
  'HR'
];

const REQUEST_TYPES = [
  'Lateral Transfer',
  'Promotion',
  'New Position',
  'End of Service',
  'Position Deletion'
];

const ACTORS = {
  Manager: ['Capt. Tariq Al-Maktoum', 'Duty Mgr. Farhan Saeed', 'Layla Mansoor', 'Rashid Al-Blooshi', 'Marcus Weber'],
  System: 'P2P Smart Engine',
  Finance: 'Finance Controller (Corporate Budget)',
  HROps: ['Fatima Al-Suwaidi (HR Ops)', 'Elena Rostova (HR Lead)', 'Amina Al-Nuaimi (HR Specialist)'],
  Comp: 'Compensation & Grading Committee',
  VPHR: 'Senior VP Group HR',
  ERP: 'Emirates ERP Core Gateway'
};

function generateEventLog(): Event[] {
  const events: Event[] = [];
  let eventSeq = 1;
  const totalCases = 820; // Will generate ~5,000 events total (avg 5-8 events per case)
  const baseDate = new Date('2025-10-01T08:00:00Z');

  for (let c = 1; c <= totalCases; c++) {
    const caseId = `P2P-2026-${String(c).padStart(4, '0')}`;
    const department = DEPARTMENTS[c % DEPARTMENTS.length];
    const requestType = REQUEST_TYPES[c % REQUEST_TYPES.length];
    const managerActor = ACTORS.Manager[c % ACTORS.Manager.length];
    const hrActor = ACTORS.HROps[c % ACTORS.HROps.length];

    // Case start date spread over past 6 months
    const caseStartTime = new Date(baseDate.getTime() + (c * 5.2 * 3600 * 1000));
    let currentTime = new Date(caseStartTime);

    // Determine variant pattern
    // 0: Happy Path Express (35%)
    // 1: Ping-Pong Grade Mismatch Return (25%)
    // 2: Missing Attachment / Budget Return (20%)
    // 3: High-Grade Executive Escalation (15%)
    // 4: Early Cancellation / Rejection (5%)
    const variantRoll = (c * 37) % 100;

    // Step 1: Draft / Initiation
    events.push({
      eventId: `EVT-${String(eventSeq++).padStart(5, '0')}`,
      caseId,
      activity: 'Request Initiated',
      timestamp: currentTime.toISOString(),
      actor: managerActor,
      outcome: 'Initiated',
      department,
      requestType,
      durationHours: 0.5
    });

    currentTime = new Date(currentTime.getTime() + 0.5 * 3600 * 1000);

    // Step 2: Pre-Validation Check
    const preValidPassed = variantRoll >= 25; // In historical log before smart engine, some failed
    events.push({
      eventId: `EVT-${String(eventSeq++).padStart(5, '0')}`,
      caseId,
      activity: 'Pre-Validation Checked',
      timestamp: currentTime.toISOString(),
      actor: ACTORS.System,
      outcome: preValidPassed ? 'Validation_Passed' : 'Validation_Warning_Ignored',
      department,
      requestType,
      durationHours: 0.1
    });

    currentTime = new Date(currentTime.getTime() + 0.2 * 3600 * 1000);

    // Step 3: Line Manager Submission
    events.push({
      eventId: `EVT-${String(eventSeq++).padStart(5, '0')}`,
      caseId,
      activity: 'Line Manager Submitted',
      timestamp: currentTime.toISOString(),
      actor: managerActor,
      outcome: 'Submitted',
      department,
      requestType,
      durationHours: 1.2
    });

    currentTime = new Date(currentTime.getTime() + 8 * 3600 * 1000); // 8h wait

    if (variantRoll < 35) {
      // Happy Path (Express Lane if lateral, or clean standard)
      events.push({
        eventId: `EVT-${String(eventSeq++).padStart(5, '0')}`,
        caseId,
        activity: 'HR Ops Screening',
        timestamp: currentTime.toISOString(),
        actor: hrActor,
        outcome: 'Screening_Passed',
        department,
        requestType,
        durationHours: 14.5
      });
      currentTime = new Date(currentTime.getTime() + 16 * 3600 * 1000);

      events.push({
        eventId: `EVT-${String(eventSeq++).padStart(5, '0')}`,
        caseId,
        activity: 'ERP Position Synced',
        timestamp: currentTime.toISOString(),
        actor: ACTORS.ERP,
        outcome: 'ExpressLane_Completed',
        department,
        requestType,
        durationHours: 1.0
      });

    } else if (variantRoll < 60) {
      // Ping-Pong Variant: Grade Mismatch Return
      events.push({
        eventId: `EVT-${String(eventSeq++).padStart(5, '0')}`,
        caseId,
        activity: 'HR Ops Screening',
        timestamp: currentTime.toISOString(),
        actor: hrActor,
        outcome: 'Returned_GradeMismatch',
        department,
        requestType,
        durationHours: 28.0
      });
      currentTime = new Date(currentTime.getTime() + 28 * 3600 * 1000);

      events.push({
        eventId: `EVT-${String(eventSeq++).padStart(5, '0')}`,
        caseId,
        activity: 'Returned to Manager',
        timestamp: currentTime.toISOString(),
        actor: hrActor,
        outcome: 'Requires_Grade_Correction',
        department,
        requestType,
        durationHours: 42.0 // Ping-pong delay ~3.5 days!
      });
      currentTime = new Date(currentTime.getTime() + 42 * 3600 * 1000);

      events.push({
        eventId: `EVT-${String(eventSeq++).padStart(5, '0')}`,
        caseId,
        activity: 'Line Manager Resubmitted',
        timestamp: currentTime.toISOString(),
        actor: managerActor,
        outcome: 'Corrected_Grade_Resubmitted',
        department,
        requestType,
        durationHours: 4.0
      });
      currentTime = new Date(currentTime.getTime() + 12 * 3600 * 1000);

      events.push({
        eventId: `EVT-${String(eventSeq++).padStart(5, '0')}`,
        caseId,
        activity: 'HR Ops Screening',
        timestamp: currentTime.toISOString(),
        actor: hrActor,
        outcome: 'Screening_Passed_Post_Correction',
        department,
        requestType,
        durationHours: 18.0
      });
      currentTime = new Date(currentTime.getTime() + 18 * 3600 * 1000);

      events.push({
        eventId: `EVT-${String(eventSeq++).padStart(5, '0')}`,
        caseId,
        activity: 'ERP Position Synced',
        timestamp: currentTime.toISOString(),
        actor: ACTORS.ERP,
        outcome: 'Approved_After_Loop',
        department,
        requestType,
        durationHours: 2.0
      });

    } else if (variantRoll < 80) {
      // Missing Budget / Attachment Ping-Pong
      events.push({
        eventId: `EVT-${String(eventSeq++).padStart(5, '0')}`,
        caseId,
        activity: 'Finance Budget Check',
        timestamp: currentTime.toISOString(),
        actor: ACTORS.Finance,
        outcome: 'Returned_MissingBudget',
        department,
        requestType,
        durationHours: 22.0
      });
      currentTime = new Date(currentTime.getTime() + 22 * 3600 * 1000);

      events.push({
        eventId: `EVT-${String(eventSeq++).padStart(5, '0')}`,
        caseId,
        activity: 'Returned to Manager',
        timestamp: currentTime.toISOString(),
        actor: ACTORS.Finance,
        outcome: 'Missing_Cost_Centre_Approval',
        department,
        requestType,
        durationHours: 36.0 // Delay ~1.8 days
      });
      currentTime = new Date(currentTime.getTime() + 36 * 3600 * 1000);

      events.push({
        eventId: `EVT-${String(eventSeq++).padStart(5, '0')}`,
        caseId,
        activity: 'Line Manager Resubmitted',
        timestamp: currentTime.toISOString(),
        actor: managerActor,
        outcome: 'Budget_Document_Attached',
        department,
        requestType,
        durationHours: 6.0
      });
      currentTime = new Date(currentTime.getTime() + 14 * 3600 * 1000);

      events.push({
        eventId: `EVT-${String(eventSeq++).padStart(5, '0')}`,
        caseId,
        activity: 'HR Ops Screening',
        timestamp: currentTime.toISOString(),
        actor: hrActor,
        outcome: 'Screening_Passed',
        department,
        requestType,
        durationHours: 16.0
      });
      currentTime = new Date(currentTime.getTime() + 16 * 3600 * 1000);

      events.push({
        eventId: `EVT-${String(eventSeq++).padStart(5, '0')}`,
        caseId,
        activity: 'ERP Position Synced',
        timestamp: currentTime.toISOString(),
        actor: ACTORS.ERP,
        outcome: 'Approved',
        department,
        requestType,
        durationHours: 2.0
      });

    } else if (variantRoll < 95) {
      // Executive Escalation Path (Compensation + VP HR)
      events.push({
        eventId: `EVT-${String(eventSeq++).padStart(5, '0')}`,
        caseId,
        activity: 'HR Ops Screening',
        timestamp: currentTime.toISOString(),
        actor: hrActor,
        outcome: 'Escalated_High_Grade',
        department,
        requestType,
        durationHours: 18.0
      });
      currentTime = new Date(currentTime.getTime() + 24 * 3600 * 1000);

      events.push({
        eventId: `EVT-${String(eventSeq++).padStart(5, '0')}`,
        caseId,
        activity: 'Compensation Review',
        timestamp: currentTime.toISOString(),
        actor: ACTORS.Comp,
        outcome: 'Comp_Band_Endorsed',
        department,
        requestType,
        durationHours: 32.0
      });
      currentTime = new Date(currentTime.getTime() + 32 * 3600 * 1000);

      events.push({
        eventId: `EVT-${String(eventSeq++).padStart(5, '0')}`,
        caseId,
        activity: 'Final HR VP Signoff',
        timestamp: currentTime.toISOString(),
        actor: ACTORS.VPHR,
        outcome: 'Executive_Approved',
        department,
        requestType,
        durationHours: 20.0
      });
      currentTime = new Date(currentTime.getTime() + 20 * 3600 * 1000);

      events.push({
        eventId: `EVT-${String(eventSeq++).padStart(5, '0')}`,
        caseId,
        activity: 'ERP Position Synced',
        timestamp: currentTime.toISOString(),
        actor: ACTORS.ERP,
        outcome: 'Approved_Executive',
        department,
        requestType,
        durationHours: 2.0
      });

    } else {
      // Cancellation / Reject
      events.push({
        eventId: `EVT-${String(eventSeq++).padStart(5, '0')}`,
        caseId,
        activity: 'HR Ops Screening',
        timestamp: currentTime.toISOString(),
        actor: hrActor,
        outcome: 'Returned_Unresolved',
        department,
        requestType,
        durationHours: 19.0
      });
      currentTime = new Date(currentTime.getTime() + 19 * 3600 * 1000);

      events.push({
        eventId: `EVT-${String(eventSeq++).padStart(5, '0')}`,
        caseId,
        activity: 'Request Cancelled',
        timestamp: currentTime.toISOString(),
        actor: managerActor,
        outcome: 'Cancelled_By_Originator',
        department,
        requestType,
        durationHours: 1.0
      });
    }
  }

  return events;
}

const events = generateEventLog();
const outPath = path.resolve(process.cwd(), 'data', 'p2p_event_log.json');
fs.writeFileSync(outPath, JSON.stringify(events, null, 2), 'utf-8');
console.log(`Generated ${events.length} events across ${new Set(events.map(e => e.caseId)).size} cases at ${outPath}`);

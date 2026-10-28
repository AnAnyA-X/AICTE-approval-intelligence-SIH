/**
 * AICTE APPROVAL INTELLIGENCE (SIH26262)
 * Rule-Based Blocker & Dependency Engine
 * 
 * CORE RESPONSIBILITIES:
 * 1. Deterministic dependency and prerequisite evaluation based on APH statutory rules.
 * 2. Dynamic blocker recalculation on evidence updates, uploads, audits, or deficiencies.
 * 3. Enforces hard guardrails preventing invalid stage transitions when prerequisites are unmet.
 * 4. Differentiates hard blockers from operational warnings.
 */

const ENGINE = {
  // Current simulated system evaluation date
  SYSTEM_DATE: '2026-10-28',

  // Workflow Stage Progression Rules (Directed Acyclic Graph)
  stageTransitions: {
    submitted: ['scrutiny'],
    scrutiny: ['deficiency', 'expert_visit', 'rejected'],
    deficiency: ['scrutiny', 'expert_visit', 'rejected'],
    expert_visit: ['deficiency', 'final_review', 'rejected'],
    final_review: ['approved', 'rejected'],
    approved: [],
    rejected: []
  },

  /**
   * Recalculates all blockers for an application deterministically based on
   * current compliance items, evidence validity dates, and deficiencies.
   */
  evaluateApplicationPrerequisites(app) {
    if (!app) return [];

    const blockers = [];
    const today = this.SYSTEM_DATE;

    // 1. Check State Government NOC (RULE-STATE-NOC)
    const stateNocItem = app.complianceItems.find(c => c.ruleId === 'RULE-STATE-NOC' || c.ruleCode === 'APH-1.3');
    if (stateNocItem && stateNocItem.mandatory) {
      if (stateNocItem.status === 'missing' || stateNocItem.status === 'rejected') {
        blockers.push({
          id: `BLK-${app.id}-STATE-NOC`,
          code: 'BLOCK-NOC-STATE',
          title: 'State Government NOC Missing or Deficient',
          severity: 'critical',
          sourceType: 'Requirement',
          sourceRef: 'RULE-STATE-NOC',
          stageBlocked: 'expert_visit',
          stageBlockedLabel: 'Expert Visit Committee (EVC)',
          prerequisite: 'Valid statutory No-Objection Certificate from State Technical Education Department',
          responsibleRole: 'Institution Coordinator',
          responsibleParty: app.coordinator || 'Institution Head',
          dueDate: this.addDays(app.lastActionDate || today, 14),
          rootCause: stateNocItem.remarks || 'Statutory State Government concurrence under APH Clause 1.3 is not verified.',
          impactDescription: 'Physical EVC inspection panel cannot be appointed until statutory State concurrence is verified.',
          nextRecommendedAction: 'Upload the formal Government Resolution / DTE NOC certificate or verified extension memo.',
          status: 'open',
          isWarning: false
        });
      }
    }

    // 2. Check Joint Bank FDR (RULE-FDR)
    const fdrItem = app.complianceItems.find(c => c.ruleId === 'RULE-FDR' || c.ruleCode === 'APH-3.1');
    if (fdrItem && fdrItem.mandatory) {
      if (fdrItem.status === 'rejected' || fdrItem.status === 'missing') {
        blockers.push({
          id: `BLK-${app.id}-FDR`,
          code: 'BLOCK-FDR-JOINT',
          title: 'Fixed Deposit (FDR) Non-Compliant or Deficient Amount',
          severity: 'high',
          sourceType: 'Evidence',
          sourceRef: 'RULE-FDR',
          stageBlocked: 'final_review',
          stageBlockedLabel: 'Regional Committee Review',
          prerequisite: 'INR 50 Lakhs Fixed Deposit in joint lien with Member Secretary AICTE for 10 years',
          responsibleRole: 'Institution Coordinator',
          responsibleParty: `${app.institutionName} & Scheduled Bank Branch Manager`,
          dueDate: this.addDays(app.lastActionDate || today, 15),
          rootCause: fdrItem.remarks || 'Joint Bank FDR has shortfall in normative amount or lacks authorized tripartite lien letter.',
          impactDescription: 'Financial viability criterion fails; Regional Committee cannot recommend Letter of Approval (LoA).',
          nextRecommendedAction: 'Deposit supplemental FDR funds and obtain signed tripartite lien confirmation letter (Form-B).',
          status: 'open',
          isWarning: false
        });
      }
    }

    // 3. Check Fire & Life Safety NOC (RULE-FIRE)
    const fireItem = app.complianceItems.find(c => c.ruleId === 'RULE-FIRE' || c.ruleCode === 'APH-2.8');
    if (fireItem && fireItem.mandatory) {
      const isExpired = fireItem.expiryDate && fireItem.expiryDate !== 'Perpetual' && fireItem.expiryDate !== 'N/A' && fireItem.expiryDate < today;
      if (isExpired || fireItem.status === 'expired') {
        fireItem.status = 'expired';
        blockers.push({
          id: `BLK-${app.id}-FIRE`,
          code: 'BLOCK-FIRE-EXP',
          title: 'Fire Safety Certificate Has Expired',
          severity: 'critical',
          sourceType: 'Evidence',
          sourceRef: 'RULE-FIRE',
          stageBlocked: 'expert_visit',
          stageBlockedLabel: 'Expert Visit Committee (EVC)',
          prerequisite: 'Valid Fire NOC in force on date of physical inspection',
          responsibleRole: 'Institution Coordinator',
          responsibleParty: app.coordinator || 'Institution Head',
          dueDate: this.addDays(today, 7),
          rootCause: `Submitted State Disaster & Fire Services NOC lapsed on ${fireItem.expiryDate}.`,
          impactDescription: 'Statutory compliance failure. AICTE norms strictly prohibit physical inspection with lapsed fire NOC.',
          nextRecommendedAction: 'Upload the renewed Fire Safety Compliance Certificate issued by District Fire Officer.',
          status: 'open',
          isWarning: false
        });
      } else if (fireItem.status === 'missing' || fireItem.status === 'rejected') {
        blockers.push({
          id: `BLK-${app.id}-FIRE-MISSING`,
          code: 'BLOCK-FIRE-MISSING',
          title: 'Fire Safety NOC Not Submitted',
          severity: 'critical',
          sourceType: 'Requirement',
          sourceRef: 'RULE-FIRE',
          stageBlocked: 'expert_visit',
          stageBlockedLabel: 'Expert Visit Committee (EVC)',
          prerequisite: 'Valid Fire Safety NOC from municipal/state fire authority',
          responsibleRole: 'Institution Coordinator',
          responsibleParty: app.coordinator || 'Institution Head',
          dueDate: this.addDays(today, 10),
          rootCause: 'Building fire and life safety certificate is mandatory prior to physical campus inspection.',
          impactDescription: 'Campus cannot be scheduled for EVC panel visit.',
          nextRecommendedAction: 'Obtain and upload certified copy of Fire Safety NOC.',
          status: 'open',
          isWarning: false
        });
      }
    }

    // 4. Check Open Deficiencies
    const openDeficiencies = (app.deficiencies || []).filter(d => d.status === 'open');
    if (openDeficiencies.length > 0 && app.currentStage === 'deficiency') {
      blockers.push({
        id: `BLK-${app.id}-DEF-ACTIVE`,
        code: 'BLOCK-DEF-LOOP',
        title: `${openDeficiencies.length} Formal Deficiency Notice(s) Pending Rectification`,
        severity: 'high',
        sourceType: 'Deficiency',
        sourceRef: openDeficiencies[0].id,
        stageBlocked: 'expert_visit',
        stageBlockedLabel: 'Expert Visit Committee (EVC)',
        prerequisite: 'All communicated deficiency memos must be rectified and verified during re-scrutiny',
        responsibleRole: 'Institution Coordinator',
        responsibleParty: app.coordinator || 'Institution Coordinator',
        dueDate: openDeficiencies[0].dueDate || this.addDays(today, 12),
        rootCause: `Active deficiencies: ${openDeficiencies.map(d => d.title).join('; ')}`,
        impactDescription: 'Application is held in deficiency loop and cannot proceed to committee evaluation.',
        nextRecommendedAction: 'Upload compliant evidence resolving each cited deficiency in the Compliance Register.',
        status: 'open',
        isWarning: false
      });
    }

    // 5. Check Land Documents (RULE-LAND)
    const landItem = app.complianceItems.find(c => c.ruleId === 'RULE-LAND' || c.ruleCode === 'APH-2.1');
    if (landItem && landItem.mandatory && (landItem.status === 'missing' || landItem.status === 'rejected')) {
      blockers.push({
        id: `BLK-${app.id}-LAND`,
        code: 'BLOCK-LAND-TITLE',
        title: 'Land Title & Possession Documents Missing',
        severity: 'critical',
        sourceType: 'Requirement',
        sourceRef: 'RULE-LAND',
        stageBlocked: 'scrutiny',
        stageBlockedLabel: 'Scrutiny of Documents',
        prerequisite: 'Registered Sale Deed / Lease Deed for minimum land acreage',
        responsibleRole: 'Institution Coordinator',
        responsibleParty: app.coordinator,
        dueDate: this.addDays(today, 7),
        rootCause: 'Land ownership / registered 30-year lease documents not provided.',
        impactDescription: 'Scrutiny committee cannot authenticate site title.',
        nextRecommendedAction: 'Upload certified registered land deeds with mutation extract.',
        status: 'open',
        isWarning: false
      });
    }

    // Preserve previously resolved blockers for audit history tracking
    const existingResolved = (app.blockers || []).filter(b => b.status === 'resolved');
    const mergedBlockers = [...blockers];

    existingResolved.forEach(oldB => {
      // If it is not active anymore, keep it as resolved record
      if (!mergedBlockers.some(newB => newB.code === oldB.code)) {
        mergedBlockers.push(oldB);
      }
    });

    app.blockers = mergedBlockers;
    return app.blockers;
  },

  /**
   * Validates whether an application can transition to the target stage.
   * Enforces statutory guardrails. Returns { allowed: boolean, blockers: [], reason: string }
   */
  validateStageTransition(app, targetStage) {
    if (!app) return { allowed: false, reason: 'Invalid application record' };

    const current = app.currentStage;

    // 1. Check graph transition legality
    const allowedTargets = this.stageTransitions[current] || [];
    if (!allowedTargets.includes(targetStage)) {
      return {
        allowed: false,
        reason: `Invalid workflow transition. Cannot move directly from "${current}" to "${targetStage}". Allowed targets: ${allowedTargets.join(', ') || 'None'}.`,
        blockers: []
      };
    }

    // 2. Re-evaluate blockers to ensure fresh state
    this.evaluateApplicationPrerequisites(app);
    const openBlockers = (app.blockers || []).filter(b => b.status === 'open');

    // 3. Stage-specific prerequisite checks
    if (targetStage === 'expert_visit') {
      const stageBlockers = openBlockers.filter(b => b.stageBlocked === 'expert_visit' || b.stageBlocked === 'all');
      if (stageBlockers.length > 0) {
        return {
          allowed: false,
          reason: `Transition to Expert Visit Committee (EVC) is blocked by ${stageBlockers.length} statutory prerequisite(s).`,
          blockers: stageBlockers
        };
      }

      // Check for unverified items
      const unverifiedStateNoc = app.complianceItems.find(c => (c.ruleId === 'RULE-STATE-NOC' || c.ruleCode === 'APH-1.3') && c.status !== 'verified');
      if (unverifiedStateNoc) {
        return {
          allowed: false,
          reason: 'State Government NOC must be formally verified before EVC panel inspection can be ordered.',
          blockers: [{
            title: 'Unverified State NOC',
            prerequisite: 'Scrutiny Officer must formally verify State Government NOC',
            responsibleParty: 'Scrutiny Officer'
          }]
        };
      }
    }

    if (targetStage === 'final_review') {
      const stageBlockers = openBlockers.filter(b => b.stageBlocked === 'final_review' || b.stageBlocked === 'all');
      if (stageBlockers.length > 0) {
        return {
          allowed: false,
          reason: `Regional Committee Review is blocked by ${stageBlockers.length} unresolved financial or structural requirement(s).`,
          blockers: stageBlockers
        };
      }
    }

    if (targetStage === 'approved') {
      if (openBlockers.length > 0) {
        return {
          allowed: false,
          reason: `Cannot grant Approval Letter (LoA) while ${openBlockers.length} active blocker(s) remain open.`,
          blockers: openBlockers
        };
      }
      const unverifiedItems = app.complianceItems.filter(c => c.mandatory && c.status !== 'verified');
      if (unverifiedItems.length > 0) {
        return {
          allowed: false,
          reason: `Cannot issue approval: ${unverifiedItems.length} mandatory statutory requirement(s) are not verified.`,
          blockers: unverifiedItems.map(u => ({
            title: u.requirementName,
            prerequisite: `${u.ruleCode}: Must be audited & marked Verified by committee`,
            responsibleParty: 'Scrutiny Officer'
          }))
        };
      }
    }

    return { allowed: true };
  },

  /**
   * Helper: Add days to date string (YYYY-MM-DD)
   */
  addDays(dateStr, days) {
    try {
      const d = new Date(dateStr);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    } catch(e) {
      return dateStr;
    }
  }
};

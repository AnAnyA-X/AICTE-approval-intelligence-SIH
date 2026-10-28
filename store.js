/**
 * AICTE APPROVAL INTELLIGENCE (SIH26262)
 * Data Access Layer & State Store (STORE)
 * 
 * Persistent browser storage (localStorage) with transaction methods.
 * Architecture separates data operations from UI, allowing seamless future
 * migration to a FastAPI / PostgreSQL backend.
 */

const STORE = {
  STORAGE_KEY: 'AICTE_APPROVAL_INTELLIGENCE_STORAGE_V1',
  data: null,

  init() {
    try {
      const serialized = localStorage.getItem(this.STORAGE_KEY);
      if (serialized) {
        this.data = JSON.parse(serialized);
        // Ensure engine re-evaluates all applications upon reload
        if (this.data && Array.isArray(this.data.applications)) {
          this.data.applications.forEach(app => {
            ENGINE.evaluateApplicationPrerequisites(app);
          });
        }
        window.DB = this.data;
      } else {
        this.resetToDefaults();
      }
    } catch(err) {
      console.warn('Failed to load from localStorage. Falling back to default seed data:', err);
      this.resetToDefaults();
    }
  },

  save() {
    try {
      if (this.data) {
        window.DB = this.data;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
      }
    } catch(err) {
      console.error('Failed to persist to localStorage:', err);
    }
  },

  resetToDefaults() {
    // Deep clone initial seed data from DB in data.js
    if (typeof DB !== 'undefined') {
      this.data = JSON.parse(JSON.stringify(DB));
      // Run engine evaluation
      this.data.applications.forEach(app => {
        ENGINE.evaluateApplicationPrerequisites(app);
      });
      window.DB = this.data;
      this.save();
    }
  },

  // ── USER CONTEXT ──────────────────────────────────────────────
  getCurrentUser() {
    return this.data.currentUser;
  },

  setCurrentRole(roleKey) {
    const config = this.data.rolesConfig[roleKey];
    if (config) {
      this.data.currentUser.role = roleKey;
      this.data.currentUser.name = config.name;
      this.data.currentUser.title = config.title;
      this.save();
    }
  },

  // ── APPLICATION OPERATIONS ────────────────────────────────────
  getApplications() {
    return this.data.applications || [];
  },

  getApplicationById(id) {
    return (this.data.applications || []).find(a => a.id === id);
  },

  createApplication(payload) {
    const newId = `APP-2026-${Math.floor(100 + Math.random() * 900)}`;
    const regionCode = payload.region ? payload.region.substring(0, 2).toUpperCase() : 'WR';
    const refNum = `AICTE/${regionCode}/2026/${payload.institutionCode || '1-NEW'}`;
    const today = ENGINE.SYSTEM_DATE;

    // Build standard compliance checklist based on catalog
    const standardRules = [
      { id: 'RULE-LAND', code: 'APH-2.1', name: 'Land Title & Possession Deed', category: 'Land & Infrastructure', mandatory: true },
      { id: 'RULE-BLDG', code: 'APH-2.4', name: 'Approved Building Plan & Built-up Area', category: 'Land & Infrastructure', mandatory: true },
      { id: 'RULE-FIRE', code: 'APH-2.8', name: 'Fire & Life Safety NOC', category: 'Safety & Environmental', mandatory: true },
      { id: 'RULE-STATE-NOC', code: 'APH-1.3', name: 'State Government NOC / Recommendation', category: 'Statutory', mandatory: payload.applicationType === 'New Technical Institution' },
      { id: 'RULE-AFFIL-NOC', code: 'APH-1.4', name: 'Affiliating University NOC', category: 'Statutory', mandatory: true },
      { id: 'RULE-FDR', code: 'APH-3.1', name: 'Joint Bank FDR (INR 50 Lakhs)', category: 'Financial Security', mandatory: payload.applicationType === 'New Technical Institution' },
      { id: 'RULE-FACULTY', code: 'APH-4.2', name: 'Cadre Ratio & Qualified Faculty Roster', category: 'Faculty & Cadre', mandatory: true },
      { id: 'RULE-ANTIRAG', code: 'APH-6.1', name: 'Anti-Ragging Committee & Undertakings', category: 'Student Welfare', mandatory: true }
    ];

    const complianceItems = standardRules.map((rule, idx) => ({
      id: `CMP-${newId}-${(idx + 1).toString().padStart(2, '0')}`,
      ruleId: rule.id,
      ruleCode: rule.code,
      requirementName: rule.name,
      category: rule.category,
      mandatory: rule.mandatory,
      evidenceFile: null,
      fileSize: null,
      uploadDate: null,
      expiryDate: rule.id === 'RULE-FIRE' ? '2027-04-30' : 'Perpetual',
      verifiedBy: null,
      verifiedAt: null,
      status: 'missing',
      remarks: 'Pending upload by institution coordinator.'
    }));

    const newApp = {
      id: newId,
      refNumber: refNum,
      institutionName: payload.institutionName,
      institutionCode: payload.institutionCode || '1-42981042',
      applicationType: payload.applicationType || 'New Technical Institution',
      program: payload.program || 'Undergraduate Engineering',
      course: payload.course,
      intake: parseInt(payload.intake, 10) || 60,
      academicYear: '2026-27',
      region: payload.region || 'Western',
      state: payload.state || 'Maharashtra',
      currentStage: 'submitted',
      status: 'Application Submitted Online - Initial Pre-Checks Active',
      priority: 'medium',
      submittedDate: today,
      lastActionDate: today,
      stageEnteredDate: today,
      assignedOfficer: 'Unassigned (Scrutiny Allocation Pending)',
      coordinator: payload.coordinator || this.data.currentUser.name,
      summary: payload.summary || `Online submission for ${payload.course} (${payload.intake} seats).`,
      stageAgeing: {
        submitted: { days: 1, sla: 3, status: 'ok' },
        scrutiny: { days: 0, sla: 10, status: 'pending' },
        deficiency: { days: 0, sla: 15, status: 'pending' },
        expert_visit: { days: 0, sla: 15, status: 'pending' },
        final_review: { days: 0, sla: 7, status: 'pending' },
        totalDays: 1,
        totalSla: 50
      },
      blockers: [],
      complianceItems: complianceItems,
      deficiencies: [],
      auditTrail: [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          actor: this.data.currentUser.name,
          role: this.data.currentUser.title,
          action: 'APPLICATION_SUBMITTED',
          summary: `Application ${refNum} submitted online`,
          details: `Application initiated for ${payload.course} (${payload.intake} intake). Requisite statutory checklist generated.`
        }
      ]
    };

    // Evaluate initial blockers
    ENGINE.evaluateApplicationPrerequisites(newApp);

    // Add alert for admin/reviewer
    this.createAlert({
      appId: newApp.id,
      appRef: newApp.refNumber,
      institution: newApp.institutionName,
      title: `New Application Submitted (${newApp.refNumber})`,
      severity: 'medium',
      category: 'workflow',
      message: `Application submitted for ${newApp.course}. Allocate Scrutiny Committee evaluator.`,
      dueDate: ENGINE.addDays(today, 3),
      assignedRole: 'reviewer',
      assignedPerson: 'Scrutiny Committee Head'
    });

    this.data.applications.unshift(newApp);
    this.save();
    return newApp;
  },

  moveApplicationStage(appId, targetStage, note, actor, force = false) {
    const app = this.getApplicationById(appId);
    if (!app) throw new Error('Application not found');

    // Perform rule engine validation
    if (!force) {
      const check = ENGINE.validateStageTransition(app, targetStage);
      if (!check.allowed) {
        return {
          success: false,
          reason: check.reason,
          blockers: check.blockers || []
        };
      }
    }

    const prevStage = app.currentStage;
    app.currentStage = targetStage;
    app.lastActionDate = ENGINE.SYSTEM_DATE;

    // Update status text
    const stageTitles = {
      submitted: 'Submitted - Verification Pre-Checks',
      scrutiny: 'Under Technical Scrutiny',
      deficiency: 'Deficiency Communicated - Rectification Pending',
      expert_visit: 'Expert Visit Committee (EVC) Scheduled',
      final_review: 'Regional Committee Final Determination',
      approved: 'Letter of Approval (LoA) Issued',
      rejected: 'Application Rejected'
    };
    app.status = stageTitles[targetStage] || targetStage;

    // Audit trail
    app.auditTrail.unshift({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      actor: actor.name,
      role: actor.title,
      action: 'STAGE_TRANSITION',
      summary: `Transitioned from ${prevStage} to ${targetStage}`,
      details: note || `Approved stage advancement by ${actor.name}`
    });

    // Re-evaluate blockers
    ENGINE.evaluateApplicationPrerequisites(app);
    this.save();

    return { success: true, app };
  },

  returnForCorrection(appId, deficiencyData, actor) {
    const app = this.getApplicationById(appId);
    if (!app) throw new Error('Application not found');

    const newDef = {
      id: `DEF-${Date.now().toString().slice(-4)}`,
      itemCode: deficiencyData.itemCode || 'GENERAL',
      title: deficiencyData.title,
      raisedBy: actor.name,
      raisedDate: ENGINE.SYSTEM_DATE,
      dueDate: deficiencyData.dueDate || ENGINE.addDays(ENGINE.SYSTEM_DATE, 15),
      status: 'open',
      severity: deficiencyData.severity || 'high',
      description: deficiencyData.description,
      remedyRequired: deficiencyData.remedyRequired
    };

    app.deficiencies.unshift(newDef);
    app.currentStage = 'deficiency';
    app.status = 'Deficiency Communicated - Resubmission Window Open';
    app.lastActionDate = ENGINE.SYSTEM_DATE;

    // Mark corresponding compliance item as rejected if specified
    if (deficiencyData.itemCode) {
      const ci = app.complianceItems.find(c => c.id === deficiencyData.itemCode);
      if (ci) {
        ci.status = 'rejected';
        ci.remarks = `DEFICIENCY: ${deficiencyData.description}`;
      }
    }

    app.auditTrail.unshift({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      actor: actor.name,
      role: actor.title,
      action: 'DEFICIENCY_RAISED',
      summary: `Deficiency Raised: ${deficiencyData.title}`,
      details: deficiencyData.description
    });

    // Create high-severity alert for Institution
    this.createAlert({
      appId: app.id,
      appRef: app.refNumber,
      institution: app.institutionName,
      title: `Deficiency Notice: ${deficiencyData.title}`,
      severity: deficiencyData.severity || 'critical',
      category: 'deficiency',
      message: `${deficiencyData.description} Rectify before ${newDef.dueDate}.`,
      dueDate: newDef.dueDate,
      assignedRole: 'institution',
      assignedPerson: app.coordinator
    });

    // Re-evaluate blockers
    ENGINE.evaluateApplicationPrerequisites(app);
    this.save();
    return newDef;
  },

  resubmitApplication(appId, note, actor) {
    const app = this.getApplicationById(appId);
    if (!app) throw new Error('Application not found');

    app.currentStage = 'scrutiny';
    app.status = 'Resubmitted - Pending Scrutiny Officer Verification';
    app.lastActionDate = ENGINE.SYSTEM_DATE;

    app.auditTrail.unshift({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      actor: actor.name,
      role: actor.title,
      action: 'APPLICATION_RESUBMITTED',
      summary: 'Institution resubmitted corrected evidence',
      details: note || 'All required remedies uploaded. Ready for re-scrutiny.'
    });

    // Alert Reviewer
    this.createAlert({
      appId: app.id,
      appRef: app.refNumber,
      institution: app.institutionName,
      title: `Corrected Evidence Resubmitted (${app.refNumber})`,
      severity: 'medium',
      category: 'task',
      message: 'Institution has addressed deficiency notice. Conduct re-scrutiny.',
      dueDate: ENGINE.addDays(ENGINE.SYSTEM_DATE, 7),
      assignedRole: 'reviewer',
      assignedPerson: app.assignedOfficer || 'Scrutiny Officer'
    });

    ENGINE.evaluateApplicationPrerequisites(app);
    this.save();
    return app;
  },

  updateEvidence(appId, itemId, payload, actor) {
    const app = this.getApplicationById(appId);
    if (!app) throw new Error('Application not found');

    const item = app.complianceItems.find(c => c.id === itemId);
    if (!item) throw new Error('Compliance item not found');

    item.evidenceFile = payload.evidenceFile || item.evidenceFile;
    item.fileSize = payload.fileSize || '2.5 MB';
    item.uploadDate = ENGINE.SYSTEM_DATE;
    item.expiryDate = payload.expiryDate || item.expiryDate;
    item.status = 'pending_verification';
    if (payload.remarks) item.remarks = payload.remarks;

    app.auditTrail.unshift({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      actor: actor.name,
      role: actor.title,
      action: 'EVIDENCE_UPLOADED',
      summary: `Uploaded ${item.evidenceFile} for ${item.ruleCode}`,
      details: `File size: ${item.fileSize}. Validity recorded: ${item.expiryDate}. Queued for scrutiny.`
    });

    ENGINE.evaluateApplicationPrerequisites(app);
    this.save();
    return item;
  },

  verifyEvidence(appId, itemId, decision, remarks, actor) {
    const app = this.getApplicationById(appId);
    if (!app) throw new Error('Application not found');

    const item = app.complianceItems.find(c => c.id === itemId);
    if (!item) throw new Error('Compliance item not found');

    item.status = decision; // 'verified' | 'rejected' | 'expired'
    item.remarks = remarks;
    item.verifiedBy = actor.name;
    item.verifiedAt = ENGINE.SYSTEM_DATE;

    app.auditTrail.unshift({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      actor: actor.name,
      role: actor.title,
      action: 'EVIDENCE_AUDITED',
      summary: `Evidence ${item.ruleCode} determined as ${decision.toUpperCase()}`,
      details: remarks
    });

    // Check if this resolved an open deficiency
    if (decision === 'verified') {
      const relatedDef = (app.deficiencies || []).find(d => d.itemCode === itemId && d.status === 'open');
      if (relatedDef) {
        relatedDef.status = 'resolved';
      }
    }

    ENGINE.evaluateApplicationPrerequisites(app);
    this.save();
    return item;
  },

  assignOfficer(appId, officerName, roleTitle, actor) {
    const app = this.getApplicationById(appId);
    if (!app) throw new Error('Application not found');

    const prev = app.assignedOfficer;
    app.assignedOfficer = officerName;

    app.auditTrail.unshift({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      actor: actor.name,
      role: actor.title,
      action: 'OFFICER_REASSIGNED',
      summary: `Assigned evaluator updated to ${officerName}`,
      details: `Reassigned from ${prev || 'Unassigned'} to ${officerName} (${roleTitle})`
    });

    this.save();
    return app;
  },

  resolveBlocker(appId, blockerId, actor, reason) {
    const app = this.getApplicationById(appId);
    if (!app) throw new Error('Application not found');

    const blocker = (app.blockers || []).find(b => b.id === blockerId);
    if (!blocker) throw new Error('Blocker not found');

    blocker.status = 'resolved';

    app.auditTrail.unshift({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      actor: actor.name,
      role: actor.title,
      action: 'BLOCKER_RESOLVED',
      summary: `Prerequisite "${blocker.title}" satisfied`,
      details: reason || `Manual resolution confirmed by ${actor.name}`
    });

    this.save();
    return blocker;
  },

  // ── ALERTS & TASK OPERATIONS ─────────────────────────────────
  getAlerts() {
    return this.data.alerts || [];
  },

  createAlert(alertData) {
    const newAlert = {
      id: `ALT-${Math.floor(100 + Math.random() * 900)}`,
      appId: alertData.appId || null,
      appRef: alertData.appRef || '',
      institution: alertData.institution || 'Institutional Alert',
      title: alertData.title,
      severity: alertData.severity || 'medium',
      category: alertData.category || 'task',
      message: alertData.message,
      dueDate: alertData.dueDate || ENGINE.addDays(ENGINE.SYSTEM_DATE, 7),
      assignedRole: alertData.assignedRole || 'institution',
      assignedPerson: alertData.assignedPerson || 'Coordinator',
      status: 'unread',
      createdAt: `${ENGINE.SYSTEM_DATE} 10:00:00`,
      actionableLink: alertData.actionableLink || null
    };

    this.data.alerts.unshift(newAlert);
    this.save();
    return newAlert;
  },

  acknowledgeAlert(alertId) {
    const alert = (this.data.alerts || []).find(a => a.id === alertId);
    if (alert) {
      alert.status = 'acknowledged';
      this.save();
    }
    return alert;
  },

  resolveAlert(alertId) {
    const alert = (this.data.alerts || []).find(a => a.id === alertId);
    if (alert) {
      alert.status = 'resolved';
      this.save();
    }
    return alert;
  },

  reassignTask(alertId, newAssignee, reason, actor) {
    const alert = (this.data.alerts || []).find(a => a.id === alertId);
    if (!alert) throw new Error('Alert not found');

    const prev = alert.assignedPerson;
    alert.assignedPerson = newAssignee;
    alert.status = 'acknowledged';

    if (alert.appId) {
      const app = this.getApplicationById(alert.appId);
      if (app) {
        app.auditTrail.unshift({
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          actor: actor.name,
          role: actor.title,
          action: 'TASK_REASSIGNED',
          summary: `Follow-up task reassigned to ${newAssignee}`,
          details: `Task: ${alert.title}. Reason: ${reason}`
        });
      }
    }

    this.save();
    return alert;
  }
};

// Initialize state store
STORE.init();

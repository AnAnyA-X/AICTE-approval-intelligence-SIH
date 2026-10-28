/**
 * AICTE APPROVAL INTELLIGENCE (SIH26262)
 * Reusable Components & Modals
 * Interacts directly with STORE and ENGINE
 */

const COMPONENTS = {

  // Generate Stat / KPI Card
  kpiCard({ label, value, sub, color = 'blue', icon = 'fa-chart-simple', trend = null }) {
    const trendHtml = trend
      ? `<span class="kpi-trend ${trend.type === 'up' ? 'trend-up' : trend.type === 'down' ? 'trend-down' : 'trend-flat'}">
          <i class="fa-solid ${trend.type === 'up' ? 'fa-arrow-trend-up' : trend.type === 'down' ? 'fa-arrow-trend-down' : 'fa-minus'}"></i>
          ${trend.label}
        </span>`
      : '';

    return `
      <div class="kpi-card kpi-${color}">
        <div class="kpi-label">${label}</div>
        <div class="kpi-value">${value}</div>
        <div class="flex items-center justify-between">
          <span class="kpi-sub">${sub}</span>
          ${trendHtml}
        </div>
        <i class="kpi-icon fa-solid ${icon}"></i>
      </div>
    `;
  },

  // Full Application Detail Slide-in View
  renderApplicationDetail(appId, activeTab = 'overview') {
    const app = STORE.getApplicationById(appId);
    if (!app) {
      UTILS.toast('Application not found', 'error');
      return;
    }

    const openBlockers = (app.blockers || []).filter(b => b.status === 'open');
    const openDefs = (app.deficiencies || []).filter(d => d.status === 'open');

    // Header Actions based on role & stage
    let actionButtons = '';
    const userRole = STORE.getCurrentUser().role;

    if (userRole === 'reviewer' || userRole === 'admin') {
      if (app.currentStage === 'scrutiny') {
        actionButtons += `
          <button class="btn btn-warn btn-sm" onclick="COMPONENTS.openDeficiencyDialog('${app.id}')">
            <i class="fa-solid fa-triangle-exclamation"></i> Raise Deficiency
          </button>
          <button class="btn btn-primary btn-sm" onclick="COMPONENTS.openTransitionDialog('${app.id}')">
            <i class="fa-solid fa-arrow-right"></i> Advance Stage
          </button>
        `;
      } else if (app.currentStage === 'deficiency') {
        actionButtons += `
          <button class="btn btn-secondary btn-sm" onclick="COMPONENTS.openTransitionDialog('${app.id}')">
            <i class="fa-solid fa-arrow-right-arrow-left"></i> Change Stage
          </button>
        `;
      } else if (app.currentStage !== 'approved' && app.currentStage !== 'rejected') {
        actionButtons += `
          <button class="btn btn-primary btn-sm" onclick="COMPONENTS.openTransitionDialog('${app.id}')">
            <i class="fa-solid fa-arrow-right"></i> Advance Stage
          </button>
        `;
      }
    }

    if (userRole === 'institution') {
      if (app.currentStage === 'deficiency') {
        actionButtons += `
          <button class="btn btn-success btn-sm" onclick="COMPONENTS.openResubmitDialog('${app.id}')">
            <i class="fa-solid fa-paper-plane"></i> Resubmit Application
          </button>
        `;
      }
    }

    // Modal Header Title
    const titleHtml = `
      <div class="flex items-center gap-2">
        <span class="mono text-xs text-muted">${app.refNumber}</span>
        <span class="divider-v" style="height:14px;"></span>
        <span class="truncate" style="max-width:360px;">${app.institutionName}</span>
      </div>
    `;

    // Modal Body Content
    const bodyHtml = `
      <div class="mb-4">
        ${UTILS.renderPipeline(app.currentStage)}
      </div>

      <!-- Tab Navigation -->
      <div class="tabs">
        <button class="tab-btn ${activeTab === 'overview' ? 'active' : ''}" onclick="COMPONENTS.switchDetailTab('${app.id}', 'overview', this)">
          <i class="fa-solid fa-circle-info"></i> Overview
        </button>
        <button class="tab-btn ${activeTab === 'compliance' ? 'active' : ''}" onclick="COMPONENTS.switchDetailTab('${app.id}', 'compliance', this)">
          <i class="fa-solid fa-list-check"></i> Evidence Register
          <span class="tab-badge">${(app.complianceItems || []).filter(c => c.status === 'verified').length}/${(app.complianceItems || []).length}</span>
        </button>
        <button class="tab-btn ${activeTab === 'blockers' ? 'active' : ''}" onclick="COMPONENTS.switchDetailTab('${app.id}', 'blockers', this)">
          <i class="fa-solid fa-diagram-project"></i> Blockers
          ${openBlockers.length > 0 ? `<span class="nav-badge" style="background:var(--clr-danger)">${openBlockers.length}</span>` : ''}
        </button>
        <button class="tab-btn ${activeTab === 'deficiencies' ? 'active' : ''}" onclick="COMPONENTS.switchDetailTab('${app.id}', 'deficiencies', this)">
          <i class="fa-solid fa-triangle-exclamation"></i> Deficiencies
          ${openDefs.length > 0 ? `<span class="nav-badge warn">${openDefs.length}</span>` : ''}
        </button>
        <button class="tab-btn ${activeTab === 'audit' ? 'active' : ''}" onclick="COMPONENTS.switchDetailTab('${app.id}', 'audit', this)">
          <i class="fa-solid fa-clock-rotate-left"></i> Audit History
        </button>
      </div>

      <!-- Tab Contents -->
      <div id="detailTabContainer">
        ${COMPONENTS.getTabContent(app, activeTab)}
      </div>
    `;

    UTILS.openModal(titleHtml, bodyHtml, actionButtons);
  },

  switchDetailTab(appId, tabName, btnElement) {
    const app = STORE.getApplicationById(appId);
    if (!app) return;
    if (btnElement && btnElement.parentElement) {
      btnElement.parentElement.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      btnElement.classList.add('active');
    }
    const container = document.getElementById('detailTabContainer');
    if (container) {
      container.innerHTML = COMPONENTS.getTabContent(app, tabName);
    }
  },

  getTabContent(app, tab) {
    const openBlockers = (app.blockers || []).filter(b => b.status === 'open');

    if (tab === 'overview') {
      return `
        <!-- High-priority Blocker Warning if present -->
        ${openBlockers.length > 0 ? `
          <div class="blocker-panel mb-4">
            <div class="blocker-panel-title">
              <i class="fa-solid fa-shield-halved text-danger"></i>
              Active Workflow Blockers (${openBlockers.length})
            </div>
            <div class="blocker-chain">
              ${openBlockers.map(b => `
                <div class="blocker-item">
                  <i class="fa-solid fa-circle-exclamation blocker-item-icon danger"></i>
                  <div class="blocker-item-body flex-1">
                    <div class="blocker-title">${b.title}</div>
                    <div class="blocker-desc">${b.rootCause}</div>
                    <div class="blocker-meta">
                      <span><strong>Stage Blocked:</strong> ${b.stageBlockedLabel}</span>
                      <span><strong>Responsible:</strong> ${b.responsibleParty}</span>
                      <span><strong>Due:</strong> ${UTILS.formatDate(b.dueDate)}</span>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : app.currentStage === 'approved' ? `
          <div class="alert alert-success mb-4">
            <i class="fa-solid fa-circle-check"></i>
            <div><strong>Approval Letter (LoA) Issued:</strong> All statutory norms verified. Decision recorded in audit registry.</div>
          </div>
        ` : `
          <div class="alert alert-success mb-4">
            <i class="fa-solid fa-circle-check"></i>
            <div><strong>Clean Workflow State:</strong> No gatekeeper blockers detected for current stage. Ready for scheduled review.</div>
          </div>
        `}

        <div class="card mb-4">
          <div class="card-header">
            <span class="card-title"><i class="fa-solid fa-building-columns"></i> Institutional Profile</span>
            ${UTILS.stageBadge(app.currentStage)}
          </div>
          <div class="card-body">
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Institution Name</div>
                <div class="info-value">${app.institutionName}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Permanent Institute Code</div>
                <div class="info-value mono">${app.institutionCode}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Application Type</div>
                <div class="info-value">${app.applicationType}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Academic Programme & Intake</div>
                <div class="info-value">${app.course} (${app.intake} Seats)</div>
              </div>
              <div class="info-item">
                <div class="info-label">Jurisdictional Region</div>
                <div class="info-value">${app.region} Region (${app.state})</div>
              </div>
              <div class="info-item">
                <div class="info-label">Assigned Evaluation Officer</div>
                <div class="info-value flex items-center gap-2">
                  <span>${app.assignedOfficer || 'Unassigned'}</span>
                  ${STORE.getCurrentUser().role !== 'institution' ? `
                    <button class="btn btn-ghost btn-xs" onclick="COMPONENTS.openReassignOfficerModal('${app.id}')" title="Reassign Evaluator">
                      <i class="fa-solid fa-user-pen"></i> Change
                    </button>
                  ` : ''}
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">Date of Online Submission</div>
                <div class="info-value">${UTILS.formatDate(app.submittedDate)}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Institutional Coordinator</div>
                <div class="info-value">${app.coordinator}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Stage-wise Processing Ageing -->
        <div class="card mb-4">
          <div class="card-header">
            <span class="card-title"><i class="fa-solid fa-hourglass-half"></i> Stage Ageing & SLA Tracking</span>
            <span class="text-xs text-muted">Cumulative Processing Days: <strong>${app.stageAgeing?.totalDays || 0}d</strong></span>
          </div>
          <div class="card-body">
            <div class="grid-3">
              <div>
                <div class="text-xs text-muted mb-1">Submission Pre-Check</div>
                ${UTILS.ageingBar(app.stageAgeing?.submitted?.days || 0, app.stageAgeing?.submitted?.sla || 3)}
              </div>
              <div>
                <div class="text-xs text-muted mb-1">Scrutiny of Evidence</div>
                ${UTILS.ageingBar(app.stageAgeing?.scrutiny?.days || 0, app.stageAgeing?.scrutiny?.sla || 10)}
              </div>
              <div>
                <div class="text-xs text-muted mb-1">Deficiency Correction</div>
                ${UTILS.ageingBar(app.stageAgeing?.deficiency?.days || 0, app.stageAgeing?.deficiency?.sla || 15)}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (tab === 'compliance') {
      const items = app.complianceItems || [];
      return `
        <div class="flex items-center justify-between mb-3">
          <div class="text-xs text-muted">Statutory verification matrix under AICTE Approval Process Handbook (APH)</div>
          ${STORE.getCurrentUser().role === 'institution' ? `
            <button class="btn btn-outline btn-xs" onclick="COMPONENTS.openUploadAllPrompt('${app.id}')">
              <i class="fa-solid fa-cloud-arrow-up"></i> Upload Checklist
            </button>
          ` : ''}
        </div>

        <div class="card">
          <div class="req-row req-row-header">
            <span>#</span>
            <span>Requirement & Clause</span>
            <span>Category</span>
            <span>Evidence Document</span>
            <span>Status</span>
            <span class="text-right">Action</span>
          </div>
          ${items.map((item, idx) => `
            <div class="req-row">
              <span class="req-num">${idx + 1}</span>
              <div>
                <div class="req-name">${item.requirementName}</div>
                <span class="req-reg">${item.ruleCode}</span>
                ${item.mandatory ? '<span class="text-danger text-xs font-bold" title="Mandatory">*</span>' : ''}
              </div>
              <span class="text-xs text-muted">${item.category}</span>
              <div>
                ${item.evidenceFile ? `
                  <a href="javascript:void(0)" onclick="COMPONENTS.previewDoc('${item.evidenceFile}')" class="text-sm text-primary flex items-center gap-1">
                    <i class="fa-solid fa-file-pdf"></i>
                    <span class="truncate" style="max-width:140px;" title="${item.evidenceFile}">${item.evidenceFile}</span>
                  </a>
                  <div class="text-xs text-subtle">${item.fileSize || ''} · ${UTILS.formatDate(item.uploadDate)}</div>
                ` : `<span class="text-xs text-danger font-medium"><i class="fa-solid fa-circle-xmark"></i> Not Uploaded</span>`}
              </div>
              <div>
                ${UTILS.complianceBadge(item.status)}
                ${item.expiryDate && item.expiryDate !== 'Perpetual' && item.expiryDate !== 'N/A' ? `
                  <div class="text-xs ${item.status === 'expired' ? 'text-danger font-bold' : 'text-muted'} mt-1">
                    <i class="fa-regular fa-calendar-xmark"></i> Exp: ${UTILS.formatDate(item.expiryDate)}
                  </div>
                ` : ''}
              </div>
              <div class="text-right">
                ${STORE.getCurrentUser().role === 'institution' ? `
                  <button class="btn btn-primary btn-xs" onclick="COMPONENTS.openUploadItemDialog('${app.id}', '${item.id}')">
                    <i class="fa-solid fa-upload"></i> ${item.evidenceFile ? 'Replace' : 'Upload'}
                  </button>
                ` : `
                  <button class="btn btn-outline btn-xs" onclick="COMPONENTS.openVerifyItemDialog('${app.id}', '${item.id}')">
                    <i class="fa-solid fa-signature"></i> Audit
                  </button>
                `}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (tab === 'blockers') {
      const blockers = app.blockers || [];
      if (!blockers.length) {
        return `
          <div class="empty-state">
            <i class="empty-state-icon fa-solid fa-circle-check text-success"></i>
            <div class="empty-state-title">No Active Blockers</div>
            <div class="empty-state-desc">All regulatory prerequisites for the current workflow stage have been satisfied.</div>
          </div>
        `;
      }
      return `
        <div class="flex flex-col gap-4">
          ${blockers.map(b => `
            <div class="card" style="border-left: 4px solid ${b.status === 'open' ? (b.severity === 'critical' ? 'var(--clr-danger)' : 'var(--clr-warn)') : 'var(--clr-success)'}">
              <div class="card-header">
                <div class="flex items-center gap-2">
                  <span class="mono text-xs font-semibold">${b.code}</span>
                  <span class="card-title text-sm">${b.title}</span>
                </div>
                <div class="flex items-center gap-2">
                  ${UTILS.severityBadge(b.severity)}
                  <span class="badge ${b.status === 'open' ? 'badge-open' : 'badge-resolved'}">
                    ${b.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div class="card-body">
                <div class="grid-2 mb-3">
                  <div class="info-item">
                    <div class="info-label">Workflow Stage Blocked</div>
                    <div class="info-value text-danger font-semibold"><i class="fa-solid fa-lock"></i> ${b.stageBlockedLabel}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Actionable Due Date</div>
                    <div class="info-value mono text-danger">${UTILS.formatDate(b.dueDate)}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Prerequisite Condition</div>
                    <div class="info-value">${b.prerequisite}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Accountable Role / Party</div>
                    <div class="info-value font-medium">${b.responsibleParty} (${b.responsibleRole})</div>
                  </div>
                </div>

                <div class="alert alert-danger mb-3">
                  <i class="fa-solid fa-triangle-exclamation"></i>
                  <div>
                    <strong>Why Is This Blocked? (Root Cause):</strong> ${b.rootCause}
                  </div>
                </div>

                <div class="alert alert-info">
                  <i class="fa-solid fa-compass"></i>
                  <div>
                    <strong>Next Action Required to Unblock:</strong> ${b.nextRecommendedAction}
                  </div>
                </div>
              </div>
              <div class="card-footer flex justify-between items-center">
                <span class="text-xs text-muted">Statutory Reference: <code>${b.sourceRef}</code></span>
                ${b.status === 'open' && STORE.getCurrentUser().role !== 'institution' ? `
                  <button class="btn btn-success btn-xs" onclick="COMPONENTS.resolveBlocker('${app.id}', '${b.id}')">
                    <i class="fa-solid fa-check"></i> Mark Overcome / Resolved
                  </button>
                ` : b.status === 'open' ? `
                  <button class="btn btn-primary btn-xs" onclick="COMPONENTS.switchDetailTab('${app.id}', 'compliance')">
                    <i class="fa-solid fa-upload"></i> Upload Prerequisite Evidence
                  </button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (tab === 'deficiencies') {
      const defs = app.deficiencies || [];
      if (!defs.length) {
        return `
          <div class="empty-state">
            <i class="empty-state-icon fa-solid fa-circle-check text-success"></i>
            <div class="empty-state-title">Zero Deficiencies Communicated</div>
            <div class="empty-state-desc">This application has not received any deficiency notices during technical scrutiny.</div>
          </div>
        `;
      }
      return `
        <div class="flex flex-col gap-3">
          ${defs.map(d => `
            <div class="card" style="border-left: 4px solid ${d.status === 'open' ? 'var(--clr-warn)' : 'var(--clr-success)'}">
              <div class="card-body">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="mono text-xs text-muted">${d.id}</span>
                    <span class="font-bold text-sm">${d.title}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    ${UTILS.severityBadge(d.severity)}
                    <span class="badge ${d.status === 'open' ? 'badge-open' : 'badge-resolved'}">${d.status.toUpperCase()}</span>
                  </div>
                </div>
                <p class="text-sm text-muted mb-2">${d.description}</p>
                <div class="alert alert-warn mb-2">
                  <i class="fa-solid fa-wrench"></i>
                  <div><strong>Remedy Required:</strong> ${d.remedyRequired}</div>
                </div>
                <div class="flex items-center justify-between text-xs text-muted mt-2">
                  <span>Issued By: <strong>${d.raisedBy}</strong> on ${UTILS.formatDate(d.raisedDate)}</span>
                  <span>Rectification Deadline: <strong class="text-danger">${UTILS.formatDate(d.dueDate)}</strong></span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (tab === 'audit') {
      const trail = app.auditTrail || [];
      return `
        <div class="audit-timeline">
          ${trail.map(event => `
            <div class="audit-entry">
              <div class="audit-line">
                <div class="audit-dot ${
                  event.action.includes('REJECT') ? 'rejected' :
                  event.action.includes('DEFICIENCY') ? 'deficiency' :
                  event.action.includes('APPROVAL') ? 'approved' :
                  event.action.includes('SUBMIT') ? 'submitted' :
                  event.action.includes('EVIDENCE') ? 'document' : 'moved'
                }"></div>
                <div class="audit-connector"></div>
              </div>
              <div class="audit-entry-body">
                <div class="audit-action">${event.summary}</div>
                <div class="audit-meta">
                  <span><i class="fa-regular fa-user"></i> ${event.actor} (${event.role})</span>
                  <span><i class="fa-regular fa-clock"></i> ${event.timestamp}</span>
                  <span class="tag mono text-xs">${event.action}</span>
                </div>
                <div class="audit-note">${event.details}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    return '';
  },

  // Document Preview Simulation
  previewDoc(fileName) {
    UTILS.toast(`Opening preview for ${fileName} in simulated secure document viewer`, 'info');
  },

  // Deficiency Dialog
  openDeficiencyDialog(appId) {
    const app = STORE.getApplicationById(appId);
    if (!app) return;

    const items = app.complianceItems || [];

    const bodyHtml = `
      <form id="raiseDeficiencyForm" onsubmit="COMPONENTS.submitDeficiency(event, '${app.id}')">
        <div class="alert alert-warn mb-3">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <div>Raising a deficiency notice halts the scrutiny calendar, returns the application to the institution, and starts a 15-day statutory rectification window.</div>
        </div>

        <div class="form-group">
          <label class="form-label">Flagged Statutory Clause / Evidence Item <span class="req">*</span></label>
          <select class="form-control" id="defRuleSelect" required>
            ${items.map(c => `
              <option value="${c.id}">${c.ruleCode} - ${c.requirementName} (Current: ${c.status})</option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Deficiency Finding Title <span class="req">*</span></label>
          <input type="text" class="form-control" id="defTitle" placeholder="e.g. Incomplete Cadre Ratio in Mechanical Dept" required />
        </div>

        <div class="form-group">
          <label class="form-label">Statutory Non-Compliance Description <span class="req">*</span></label>
          <textarea class="form-control" id="defDesc" rows="3" placeholder="Specify exact non-compliance under AICTE Approval Process Handbook..." required></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Severity Level</label>
            <select class="form-control" id="defSeverity">
              <option value="critical">Critical (Blocks Physical EVC)</option>
              <option value="high" selected>High (Blocks Final Decision)</option>
              <option value="medium">Medium (Procedural Rectification)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Remedy Cut-off Date</label>
            <input type="date" class="form-control" id="defDueDate" value="${ENGINE.addDays(ENGINE.SYSTEM_DATE, 15)}" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Mandatory Remedy Prescribed <span class="req">*</span></label>
          <textarea class="form-control" id="defRemedy" rows="2" placeholder="e.g. Upload registered deed / rectified bank lien letter..." required></textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="UTILS.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-danger"><i class="fa-solid fa-triangle-exclamation"></i> Issue Deficiency Notice</button>
        </div>
      </form>
    `;

    UTILS.openModal(`Issue Deficiency Notice · ${app.refNumber}`, bodyHtml);
  },

  submitDeficiency(e, appId) {
    e.preventDefault();
    const app = STORE.getApplicationById(appId);
    if (!app) return;

    const itemCode = document.getElementById('defRuleSelect').value;
    const title = document.getElementById('defTitle').value.trim();
    const desc = document.getElementById('defDesc').value.trim();
    const severity = document.getElementById('defSeverity').value;
    const dueDate = document.getElementById('defDueDate').value;
    const remedy = document.getElementById('defRemedy').value.trim();

    if (!title || !desc || !remedy) {
      UTILS.toast('Please fill in all mandatory deficiency fields', 'error');
      return;
    }

    STORE.returnForCorrection(appId, {
      itemCode,
      title,
      description: desc,
      severity,
      dueDate,
      remedyRequired: remedy
    }, STORE.getCurrentUser());

    UTILS.closeModal();
    UTILS.toast(`Deficiency notice issued and recorded. Case moved to Deficiency stage.`, 'warn');
    APP.renderCurrentView();
  },

  // Resubmit Application from Deficiency (Institution action)
  openResubmitDialog(appId) {
    const app = STORE.getApplicationById(appId);
    if (!app) return;

    const bodyHtml = `
      <form onsubmit="COMPONENTS.submitResubmission(event, '${app.id}')">
        <div class="alert alert-info mb-3">
          <i class="fa-solid fa-circle-info"></i>
          <div>Resubmitting returns this application to Scrutiny of Documents stage for re-evaluation by the assigned scrutiny committee.</div>
        </div>

        <div class="form-group">
          <label class="form-label">Summary of Rectifications Made <span class="req">*</span></label>
          <textarea class="form-control" id="resubmitNotes" rows="3" placeholder="Describe the updated documents and remedies uploaded to satisfy deficiency notice..." required></textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="UTILS.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-success"><i class="fa-solid fa-paper-plane"></i> Confirm & Resubmit to Scrutiny</button>
        </div>
      </form>
    `;

    UTILS.openModal(`Resubmit for Re-Scrutiny · ${app.refNumber}`, bodyHtml);
  },

  submitResubmission(e, appId) {
    e.preventDefault();
    const notes = document.getElementById('resubmitNotes').value.trim();
    if (!notes) {
      UTILS.toast('Please provide a summary of rectifications', 'error');
      return;
    }

    STORE.resubmitApplication(appId, notes, STORE.getCurrentUser());
    UTILS.closeModal();
    UTILS.toast('Application resubmitted successfully! Scrutiny committee notified.', 'success');
    APP.renderCurrentView();
  },

  // Stage Transition Dialog with Guardrail Prevention
  openTransitionDialog(appId) {
    const app = STORE.getApplicationById(appId);
    if (!app) return;

    const allStages = [
      { id: 'submitted', label: 'Submitted (Pre-Checks)' },
      { id: 'scrutiny', label: 'Scrutiny of Documents' },
      { id: 'deficiency', label: 'Deficiency & Resubmission' },
      { id: 'expert_visit', label: 'Expert Visit Committee (EVC)' },
      { id: 'final_review', label: 'Regional Review Committee' },
      { id: 'approved', label: 'Approval Letter Issued (LoA)' },
      { id: 'rejected', label: 'Application Rejected' }
    ];

    const nextStages = allStages.filter(s => s.id !== app.currentStage);
    const openBlockers = (app.blockers || []).filter(b => b.status === 'open');

    const bodyHtml = `
      <form id="stageTransitionForm" onsubmit="COMPONENTS.submitTransition(event, '${app.id}')">
        <div class="mb-3">
          <div class="text-xs text-muted mb-1">Current Active Stage</div>
          <div>${UTILS.stageBadge(app.currentStage)}</div>
        </div>

        <!-- Blocker gatekeeper warning -->
        ${openBlockers.length > 0 ? `
          <div class="alert alert-danger mb-3">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <div>
              <strong>Active Statutory Blockers (${openBlockers.length}):</strong>
              Deterministic rules will prevent progression to dependent stages until prerequisites are resolved.
              <ul class="text-xs mt-1" style="padding-left:16px;">
                ${openBlockers.map(b => `<li><strong>${b.title}</strong> (Blocks: ${b.stageBlockedLabel})</li>`).join('')}
              </ul>
            </div>
          </div>
        ` : `
          <div class="alert alert-success mb-3">
            <i class="fa-solid fa-circle-check"></i>
            <div>All gatekeeper compliance prerequisites are satisfied for standard stage progression.</div>
          </div>
        `}

        <div class="form-group">
          <label class="form-label">Target Stage to Advance / Move <span class="req">*</span></label>
          <select class="form-control" id="targetStageSelect" required>
            ${nextStages.map(s => `<option value="${s.id}">${s.label}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Statutory Authority / Decision Note <span class="req">*</span></label>
          <textarea class="form-control" id="transitionNote" rows="3" placeholder="Enter scrutiny committee finding or authority resolution note..." required></textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="UTILS.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="fa-solid fa-arrow-right"></i> Advance Application</button>
        </div>
      </form>
    `;

    UTILS.openModal(`Stage Advancement Engine · ${app.refNumber}`, bodyHtml);
  },

  submitTransition(e, appId) {
    e.preventDefault();
    const target = document.getElementById('targetStageSelect').value;
    const note = document.getElementById('transitionNote').value.trim();

    if (!note) {
      UTILS.toast('Please provide a decision note', 'error');
      return;
    }

    const result = STORE.moveApplicationStage(appId, target, note, STORE.getCurrentUser());

    if (!result.success) {
      // PREVENT INVALID TRANSITION!
      const blockerListHtml = (result.blockers || []).map(b => `
        <li style="margin-bottom:6px;">
          <strong>${b.title}</strong>: ${b.prerequisite || b.rootCause}
          <div class="text-xs text-subtle">Responsible: ${b.responsibleParty || 'Evaluation Authority'}</div>
        </li>
      `).join('');

      const blockedModalHtml = `
        <div class="alert alert-danger mb-4">
          <i class="fa-solid fa-ban" style="font-size:20px;"></i>
          <div>
            <strong>STAGE ADVANCEMENT PREVENTED BY RULE ENGINE:</strong><br/>
            ${result.reason}
          </div>
        </div>

        <div class="card mb-4" style="border-color:var(--clr-danger-bd)">
          <div class="card-header" style="background:var(--clr-danger-lt)">
            <span class="card-title text-danger"><i class="fa-solid fa-lock"></i> Unresolved Statutory Prerequisites</span>
          </div>
          <div class="card-body">
            <ul style="padding-left:18px; font-size:0.82rem; line-height:1.5;">
              ${blockerListHtml || '<li>Mandatory compliance items remain unverified or in deficiency status.</li>'}
            </ul>
          </div>
        </div>

        <div class="alert alert-info">
          <i class="fa-solid fa-circle-question"></i>
          <div>
            <strong>Remedial Step:</strong> Audit and verify the required evidence in the Evidence Register or upload the missing documents before attempting to advance the application.
          </div>
        </div>

        <div class="form-actions mt-4">
          <button class="btn btn-secondary" onclick="UTILS.closeModal()">Close</button>
          <button class="btn btn-primary" onclick="COMPONENTS.renderApplicationDetail('${appId}', 'compliance')">
            <i class="fa-solid fa-list-check"></i> Go to Evidence Register
          </button>
        </div>
      `;

      UTILS.openModal(`Transition Blocked · Statutory Guardrail`, blockedModalHtml);
      return;
    }

    UTILS.closeModal();
    UTILS.toast(`Application successfully advanced to ${target}`, 'success');
    APP.renderCurrentView();
  },

  // Evidence Verification Modal
  openVerifyItemDialog(appId, itemId) {
    const app = STORE.getApplicationById(appId);
    if (!app) return;
    const item = (app.complianceItems || []).find(c => c.id === itemId);
    if (!item) return;

    const bodyHtml = `
      <form onsubmit="COMPONENTS.submitItemVerification(event, '${app.id}', '${item.id}')">
        <div class="mb-3">
          <div class="text-xs text-muted mb-1">Requirement Clause & Standard</div>
          <div class="font-bold text-sm text-primary">${item.ruleCode} - ${item.requirementName}</div>
          <div class="text-xs text-muted mt-1">
            Submitted File: <code>${item.evidenceFile || 'No file attached'}</code>
            ${item.expiryDate ? `· Expiry: <strong>${item.expiryDate}</strong>` : ''}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Audit Determination <span class="req">*</span></label>
          <select class="form-control" id="auditDecisionSelect">
            <option value="verified" ${item.status === 'verified' ? 'selected' : ''}>Verified & Compliant (Meets Norms)</option>
            <option value="rejected" ${item.status === 'rejected' ? 'selected' : ''}>Deficient / Rejected (Requires Remedy)</option>
            <option value="expired" ${item.status === 'expired' ? 'selected' : ''}>Mark as Expired Evidence</option>
            <option value="pending_verification" ${item.status === 'pending_verification' ? 'selected' : ''}>Keep as Pending Review</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Verification Observations & Audit Note <span class="req">*</span></label>
          <textarea class="form-control" id="auditNotes" rows="3" placeholder="Enter specific evaluation remarks..." required>${item.remarks || ''}</textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="UTILS.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Record Audit Determination</button>
        </div>
      </form>
    `;

    UTILS.openModal(`Evidence Audit · ${item.ruleCode}`, bodyHtml);
  },

  submitItemVerification(e, appId, itemId) {
    e.preventDefault();
    const decision = document.getElementById('auditDecisionSelect').value;
    const notes = document.getElementById('auditNotes').value.trim();

    if (!notes) {
      UTILS.toast('Please provide audit remarks', 'error');
      return;
    }

    STORE.verifyEvidence(appId, itemId, decision, notes, STORE.getCurrentUser());

    UTILS.closeModal();
    UTILS.toast(`Evidence status updated to ${decision.toUpperCase()}. Dependent blockers recalculated.`, 'success');
    APP.renderCurrentView();
  },

  // Upload Evidence Simulation Modal
  openUploadItemDialog(appId, itemId) {
    const app = STORE.getApplicationById(appId);
    if (!app) return;
    const item = (app.complianceItems || []).find(c => c.id === itemId);
    if (!item) return;

    const bodyHtml = `
      <form onsubmit="COMPONENTS.submitUploadItem(event, '${app.id}', '${item.id}')">
        <div class="mb-3">
          <div class="text-xs text-muted mb-1">Upload Evidence For</div>
          <div class="font-bold text-sm text-primary">${item.ruleCode} - ${item.requirementName}</div>
          <div class="text-xs text-subtle mt-1">${item.category}</div>
        </div>

        <div class="dropzone mb-3" id="dropzoneBox" onclick="document.getElementById('fakeFileInput').click()">
          <i class="fa-solid fa-cloud-arrow-up"></i>
          <div><strong>Choose file</strong> or drag and drop here</div>
          <div class="dz-sub text-muted">PDF or scanned gazette notification, max 15MB.</div>
          <input type="file" id="fakeFileInput" style="display:none" onchange="COMPONENTS.fileChosen(this)" />
        </div>

        <div id="selectedFilePreview" class="mb-3" style="display:none">
          <div class="file-row">
            <i class="fa-solid fa-file-pdf"></i>
            <span class="file-row-name" id="selectedFileName">filename.pdf</span>
            <span class="file-row-date">Ready to attach</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Document Name / Ref (if not choosing file)</label>
          <input type="text" class="form-control" id="customFileName" value="${item.evidenceFile || ''}" placeholder="e.g. DTE_Maharashtra_Final_GR_NOC.pdf" />
        </div>

        <div class="form-group">
          <label class="form-label">Statutory Certificate Expiry Date (if applicable)</label>
          <input type="date" class="form-control" id="uploadExpiry" value="${item.expiryDate && item.expiryDate !== 'Perpetual' ? item.expiryDate : '2028-06-30'}" />
        </div>

        <div class="form-group">
          <label class="form-label">Notes for Scrutiny Committee</label>
          <textarea class="form-control" id="uploadNotes" rows="2" placeholder="Explain how this document satisfies the APH criterion..."></textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="UTILS.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" id="uploadSubmitBtn">
            <i class="fa-solid fa-upload"></i> Submit Document for Scrutiny
          </button>
        </div>
      </form>
    `;

    UTILS.openModal(`Upload Evidence · ${item.ruleCode}`, bodyHtml);
  },

  fileChosen(input) {
    if (input.files && input.files[0]) {
      document.getElementById('selectedFilePreview').style.display = 'block';
      document.getElementById('selectedFileName').textContent = input.files[0].name;
      document.getElementById('customFileName').value = input.files[0].name;
    }
  },

  submitUploadItem(e, appId, itemId) {
    e.preventDefault();
    const fileName = document.getElementById('customFileName').value.trim() || 'Attested_Statutory_Evidence.pdf';
    const expiry = document.getElementById('uploadExpiry').value || '2028-06-30';
    const notes = document.getElementById('uploadNotes').value.trim();

    STORE.updateEvidence(appId, itemId, {
      evidenceFile: fileName,
      fileSize: '3.2 MB',
      expiryDate: expiry,
      remarks: notes ? `Institution upload note: ${notes}` : null
    }, STORE.getCurrentUser());

    UTILS.closeModal();
    UTILS.toast(`Document "${fileName}" attached and queued for committee review`, 'success');
    APP.renderCurrentView();
  },

  // Reassign Officer Modal
  openReassignOfficerModal(appId) {
    const app = STORE.getApplicationById(appId);
    if (!app) return;

    const officers = [
      { name: 'Prof. Rajiv Sharma', title: 'Senior Scrutiny Officer (Western Region)' },
      { name: 'Dr. P. R. Menon', title: 'Scrutiny Officer (Southern Region)' },
      { name: 'Dr. S. K. Reddy', title: 'Scrutiny Committee (South-Central)' },
      { name: 'Dr. Anand Verma', title: 'Regional Officer (North-Western)' },
      { name: 'Dr. Meenakshi Sundaram', title: 'Chief Regional Officer (HQ)' }
    ];

    const bodyHtml = `
      <form onsubmit="COMPONENTS.submitReassignOfficer(event, '${app.id}')">
        <div class="mb-3">
          <div class="text-xs text-muted mb-1">Application Reference</div>
          <div class="font-bold text-sm text-primary">${app.refNumber} · ${app.institutionName}</div>
          <div class="text-xs text-muted mt-1">Currently assigned to: <strong>${app.assignedOfficer || 'Unassigned'}</strong></div>
        </div>

        <div class="form-group">
          <label class="form-label">Select Designated Evaluation Officer <span class="req">*</span></label>
          <select class="form-control" id="officerSelect" required>
            ${officers.map(o => `
              <option value="${o.name}|${o.title}" ${app.assignedOfficer && app.assignedOfficer.includes(o.name) ? 'selected' : ''}>
                ${o.name} — ${o.title}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="UTILS.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="fa-solid fa-user-check"></i> Confirm Assignment</button>
        </div>
      </form>
    `;

    UTILS.openModal(`Assign Evaluation Officer`, bodyHtml);
  },

  submitReassignOfficer(e, appId) {
    e.preventDefault();
    const [name, title] = document.getElementById('officerSelect').value.split('|');
    STORE.assignOfficer(appId, name, title, STORE.getCurrentUser());
    UTILS.closeModal();
    UTILS.toast(`Evaluation officer updated to ${name}`, 'success');
    APP.renderCurrentView();
  },

  // Manual Blocker Resolution
  resolveBlocker(appId, blockerId) {
    const app = STORE.getApplicationById(appId);
    if (!app) return;
    const blocker = (app.blockers || []).find(b => b.id === blockerId);
    if (!blocker) return;

    UTILS.confirm(
      'Resolve Blocker',
      `Are you sure prerequisite <strong>"${blocker.title}"</strong> has been satisfied? This will record a verified resolution and unblock downstream workflow stages.`,
      () => {
        STORE.resolveBlocker(appId, blockerId, STORE.getCurrentUser(), 'Manually confirmed and verified by committee officer');
        UTILS.toast(`Blocker ${blocker.code} resolved successfully`, 'success');
        COMPONENTS.renderApplicationDetail(appId, 'blockers');
      }
    );
  }
};

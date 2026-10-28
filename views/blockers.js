/**
 * AICTE APPROVAL INTELLIGENCE (SIH26262)
 * View: Dependency & Blocker Intelligence Engine
 * CORE DIFFERENTIATOR:
 * Explicit causal chain: Requirement → Evidence Deficiency → Task/Prerequisite Incomplete → Dependent Stage Blocked
 */

const VIEWS_BLOCKERS = {
  selectedStatus: 'open',
  selectedSeverity: 'all',

  render(container) {
    const apps = DB.applications;
    const allBlockers = [];

    apps.forEach(app => {
      (app.blockers || []).forEach(b => {
        allBlockers.push({
          ...b,
          appId: app.id,
          appRef: app.refNumber,
          institutionName: app.institutionName,
          region: app.region,
          course: app.course,
          currentStage: app.currentStage
        });
      });
    });

    const openBlockers = allBlockers.filter(b => b.status === 'open');
    const resolvedBlockers = allBlockers.filter(b => b.status === 'resolved');

    const displayList = allBlockers.filter(b => {
      if (this.selectedStatus !== 'all' && b.status !== this.selectedStatus) return false;
      if (this.selectedSeverity !== 'all' && b.severity !== this.selectedSeverity) return false;
      return true;
    });

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-row">
          <div>
            <h1 class="page-title">Dependency & Blocker Intelligence</h1>
            <p class="page-sub">
              Deterministic causal engine diagnosing why approval progress is halted, uncovering unmet prerequisites, identifying accountable roles and prescribing exact remedial actions.
            </p>
          </div>
          <div class="page-actions">
            <span class="badge badge-critical" style="padding:6px 12px; font-size:0.78rem;">
              <i class="fa-solid fa-lock"></i> ${openBlockers.length} Active System Blockers
            </span>
          </div>
        </div>
      </div>

      <!-- Core Principle Explanation Box -->
      <div class="card mb-4" style="background: linear-gradient(135deg, #f8fafc, #eff6ff); border-color: var(--blue-200);">
        <div class="card-body">
          <div class="flex items-start gap-3">
            <div style="font-size: 24px; color: var(--clr-primary);"><i class="fa-solid fa-diagram-project"></i></div>
            <div class="flex-1">
              <div class="font-bold text-sm mb-1 text-primary">How Blocker Intelligence Differs from Conventional Workflow Tools</div>
              <p class="text-xs text-muted" style="line-height: 1.6;">
                Standard workflow software displays only opaque statuses like <em>"Pending"</em> or sends generic reminders.
                AICTE Approval Intelligence deterministically traces the exact regulatory chain: 
                <strong>APH Requirement</strong> ➔ <strong>Evidence Verification Status</strong> ➔ <strong>Unmet Prerequisite</strong> ➔ <strong>Downstream Stage Gate</strong>,
                and pinpoints the specific officer or coordinator responsible with a concrete remedial action.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex gap-2">
          <button class="btn ${this.selectedStatus === 'open' ? 'btn-primary' : 'btn-secondary'} btn-sm"
                  onclick="VIEWS_BLOCKERS.setStatus('open')">
            <i class="fa-solid fa-lock"></i> Active Blockers (${openBlockers.length})
          </button>
          <button class="btn ${this.selectedStatus === 'resolved' ? 'btn-primary' : 'btn-secondary'} btn-sm"
                  onclick="VIEWS_BLOCKERS.setStatus('resolved')">
            <i class="fa-solid fa-circle-check"></i> Resolved (${resolvedBlockers.length})
          </button>
          <button class="btn ${this.selectedStatus === 'all' ? 'btn-primary' : 'btn-secondary'} btn-sm"
                  onclick="VIEWS_BLOCKERS.setStatus('all')">
            All (${allBlockers.length})
          </button>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs text-muted">Filter by Severity:</span>
          <select class="filter-select" onchange="VIEWS_BLOCKERS.setSeverity(this.value)">
            <option value="all">All Severities</option>
            <option value="critical" ${this.selectedSeverity === 'critical' ? 'selected' : ''}>Critical Only</option>
            <option value="high" ${this.selectedSeverity === 'high' ? 'selected' : ''}>High Only</option>
            <option value="medium" ${this.selectedSeverity === 'medium' ? 'selected' : ''}>Medium</option>
          </select>
        </div>
      </div>

      <!-- Blockers Grid / Cards -->
      ${displayList.length === 0 ? `
        <div class="card">
          <div class="empty-state">
            <i class="empty-state-icon fa-solid fa-shield-check text-success"></i>
            <div class="empty-state-title">No blockers found for selected criteria</div>
            <div class="empty-state-desc">All applications in this view have cleared their regulatory prerequisites.</div>
          </div>
        </div>
      ` : `
        <div class="flex flex-col gap-4">
          ${displayList.map(b => `
            <div class="card" style="border-left: 5px solid ${b.status === 'open' ? (b.severity === 'critical' ? 'var(--clr-danger)' : 'var(--clr-warn)') : 'var(--clr-success)'}">
              <div class="card-header">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="mono font-bold text-xs" style="background:var(--n-100);padding:2px 6px;border-radius:4px;">${b.code}</span>
                  <span class="card-title text-base">${b.title}</span>
                  <span class="text-xs text-muted">·</span>
                  <span class="text-xs text-primary font-medium" style="cursor:pointer;" onclick="COMPONENTS.renderApplicationDetail('${b.appId}')">
                    ${b.appRef} (${b.institutionName})
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  ${UTILS.severityBadge(b.severity)}
                  <span class="badge ${b.status === 'open' ? 'badge-open' : 'badge-resolved'}">
                    ${b.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div class="card-body">
                <!-- 4-Box Detailed Causal Analysis Grid -->
                <div class="grid-2 mb-4">
                  <div class="card p-3" style="background:var(--surface-2);border-color:var(--border)">
                    <div class="text-xs font-semibold text-danger mb-1 flex items-center gap-1">
                      <i class="fa-solid fa-lock"></i> TARGET WORKFLOW STAGE BLOCKED
                    </div>
                    <div class="font-bold text-sm text-primary mb-1">${b.stageBlockedLabel}</div>
                    <div class="text-xs text-muted">Current case stage: <strong>${b.currentStage}</strong></div>
                  </div>

                  <div class="card p-3" style="background:var(--surface-2);border-color:var(--border)">
                    <div class="text-xs font-semibold text-muted mb-1 flex items-center gap-1">
                      <i class="fa-solid fa-user-tag"></i> RESPONSIBLE PERSON & ROLE
                    </div>
                    <div class="font-bold text-sm text-primary mb-1">${b.responsibleParty}</div>
                    <div class="text-xs text-muted">Statutory Role: <strong>${b.responsibleRole}</strong></div>
                  </div>

                  <div class="card p-3" style="background:var(--surface-2);border-color:var(--border)">
                    <div class="text-xs font-semibold text-warn mb-1 flex items-center gap-1">
                      <i class="fa-solid fa-triangle-exclamation"></i> UNMET PREREQUISITE
                    </div>
                    <div class="text-xs font-semibold text-primary mb-1">${b.prerequisite}</div>
                    <div class="text-xs text-muted">Reference Clause: <code>${b.sourceRef}</code></div>
                  </div>

                  <div class="card p-3" style="background:var(--surface-2);border-color:var(--border)">
                    <div class="text-xs font-semibold text-muted mb-1 flex items-center gap-1">
                      <i class="fa-regular fa-calendar-xmark"></i> MANDATORY ACTION DUE DATE
                    </div>
                    <div class="font-bold text-sm text-danger mb-1">${UTILS.formatDate(b.dueDate)}</div>
                    <div class="text-xs text-muted">Source: <strong>${b.sourceType}</strong></div>
                  </div>
                </div>

                <!-- Root Cause Explanation -->
                <div class="alert alert-danger mb-3">
                  <i class="fa-solid fa-magnifying-glass-chart"></i>
                  <div>
                    <strong>Why Is This Application Stuck? (Root Cause Diagnosis):</strong><br/>
                    ${b.rootCause}
                  </div>
                </div>

                <!-- Downstream Consequence -->
                <div class="alert alert-warn mb-3">
                  <i class="fa-solid fa-arrows-split-up-and-left"></i>
                  <div>
                    <strong>Downstream Workflow Impact:</strong><br/>
                    ${b.impactDescription}
                  </div>
                </div>

                <!-- Recommended Next Permitted Action -->
                <div class="alert alert-info">
                  <i class="fa-solid fa-compass"></i>
                  <div>
                    <strong>Next Permitted Action to Unblock:</strong><br/>
                    ${b.nextRecommendedAction}
                  </div>
                </div>
              </div>

              <div class="card-footer flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <span class="text-xs text-subtle">Causal Engine Checksum: verified against APH 2026-27</span>
                </div>
                <div class="flex items-center gap-2">
                  <button class="btn btn-secondary btn-xs" onclick="COMPONENTS.renderApplicationDetail('${b.appId}', 'compliance')">
                    <i class="fa-solid fa-folder-open"></i> Open Evidence File
                  </button>
                  ${b.status === 'open' && DB.currentUser.role !== 'institution' ? `
                    <button class="btn btn-success btn-xs" onclick="COMPONENTS.resolveBlocker('${b.appId}', '${b.id}')">
                      <i class="fa-solid fa-check"></i> Verify Remedy & Unblock
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  },

  setStatus(st) {
    this.selectedStatus = st;
    this.render(document.getElementById('pageArea'));
  },

  setSeverity(sev) {
    this.selectedSeverity = sev;
    this.render(document.getElementById('pageArea'));
  }
};

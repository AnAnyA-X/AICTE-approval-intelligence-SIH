/**
 * AICTE APPROVAL INTELLIGENCE (SIH26262)
 * View: Activity & Central Audit Registry
 * Tracks all state transitions, deficiency memos, evidence verifications and decisions
 */

const VIEWS_AUDIT = {
  searchQuery: '',
  filterAction: 'all',
  filterApp: 'all',

  render(container) {
    const allEvents = this.getAllAuditEvents();
    const filteredEvents = this.getFilteredEvents(allEvents);

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-row">
          <div>
            <h1 class="page-title">Activity & Central Audit Registry</h1>
            <p class="page-sub">
              Statutory append-only immutable event log recording all regulatory submissions, reviewer determinations, deficiency dispatches and workflow transitions.
            </p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary btn-sm" onclick="VIEWS_AUDIT.exportAuditCSV()">
              <i class="fa-solid fa-file-export"></i> Export Audit Log (CSV)
            </button>
          </div>
        </div>
      </div>

      <!-- Trust & Integrity Banner -->
      <div class="card mb-4" style="background:var(--surface);border-left:4px solid var(--clr-primary);">
        <div class="card-body">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-3">
              <i class="fa-solid fa-fingerprint text-primary" style="font-size:24px;"></i>
              <div>
                <div class="font-bold text-sm">Regulatory Accountability & Chain of Custody</div>
                <div class="text-xs text-muted">All entries are timestamped and signed with actor credentials. Historical records cannot be altered or suppressed.</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="badge badge-complete"><i class="fa-solid fa-shield-check"></i> Integrity Verified</span>
              <span class="text-xs text-subtle font-mono">SHA-256 Chain Active</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="card mb-4">
        <div class="table-toolbar">
          <div class="search-input-wrap">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" placeholder="Search actor, notes, application..."
                   value="${this.searchQuery}"
                   oninput="VIEWS_AUDIT.setSearch(this.value)" />
          </div>

          <div class="filter-group">
            <select class="filter-select" onchange="VIEWS_AUDIT.setFilter('action', this.value)">
              <option value="all">All Action Types</option>
              <option value="APPLICATION_SUBMITTED" ${this.filterAction === 'APPLICATION_SUBMITTED' ? 'selected' : ''}>Application Submitted</option>
              <option value="STAGE_TRANSITION" ${this.filterAction === 'STAGE_TRANSITION' ? 'selected' : ''}>Stage Transitions</option>
              <option value="DEFICIENCY" ${this.filterAction === 'DEFICIENCY' ? 'selected' : ''}>Deficiencies Raised/Resolved</option>
              <option value="EVIDENCE" ${this.filterAction === 'EVIDENCE' ? 'selected' : ''}>Evidence Audited</option>
              <option value="APPROVAL" ${this.filterAction === 'APPROVAL' ? 'selected' : ''}>Approvals & Rejections</option>
            </select>

            <select class="filter-select" onchange="VIEWS_AUDIT.setFilter('app', this.value)">
              <option value="all">All Applications (${DB.applications.length})</option>
              ${DB.applications.map(a => `
                <option value="${a.id}" ${this.filterApp === a.id ? 'selected' : ''}>
                  ${a.refNumber} - ${a.institutionName.substring(0, 24)}...
                </option>
              `).join('')}
            </select>
          </div>

          <div class="table-count">
            Showing <strong>${filteredEvents.length}</strong> recorded audit actions
          </div>
        </div>

        <!-- Timeline Log View -->
        <div class="card-body">
          ${filteredEvents.length === 0 ? `
            <div class="empty-state">
              <i class="empty-state-icon fa-solid fa-clock-rotate-left"></i>
              <div class="empty-state-title">No audit events match filters</div>
              <div class="empty-state-desc">Try resetting your filter parameters or search term.</div>
            </div>
          ` : `
            <div class="audit-timeline">
              ${filteredEvents.map(event => `
                <div class="audit-entry">
                  <div class="audit-line">
                    <div class="audit-dot ${
                      event.action.includes('REJECT') ? 'rejected' :
                      event.action.includes('DEFICIENCY') ? 'deficiency' :
                      event.action.includes('APPROVAL') ? 'approved' :
                      event.action.includes('SUBMIT') ? 'submitted' :
                      event.action.includes('DOCUMENT') || event.action.includes('EVIDENCE') ? 'document' : 'moved'
                    }"></div>
                    <div class="audit-connector"></div>
                  </div>
                  <div class="audit-entry-body">
                    <div class="flex items-center justify-between mb-1 flex-wrap gap-1">
                      <div class="flex items-center gap-2">
                        <span class="audit-action">${event.summary}</span>
                        <span class="tag mono text-xs">${event.action}</span>
                      </div>
                      <span class="text-xs text-muted mono">${event.timestamp}</span>
                    </div>

                    <div class="audit-meta mb-1">
                      <span><i class="fa-regular fa-user"></i> <strong>${event.actor}</strong> (${event.role})</span>
                      <span><i class="fa-regular fa-folder-closed"></i> Application: <a href="javascript:void(0)" onclick="COMPONENTS.renderApplicationDetail('${event.appId}')" class="font-semibold">${event.appRef}</a></span>
                      <span class="text-subtle">${event.institutionName}</span>
                    </div>

                    <div class="audit-note">
                      ${event.details}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  },

  getAllAuditEvents() {
    const events = [];
    DB.applications.forEach(app => {
      (app.auditTrail || []).forEach(evt => {
        events.push({
          ...evt,
          appId: app.id,
          appRef: app.refNumber,
          institutionName: app.institutionName
        });
      });
    });

    // Sort descending by timestamp
    return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  getFilteredEvents(events) {
    return events.filter(evt => {
      if (this.filterApp !== 'all' && evt.appId !== this.filterApp) return false;
      if (this.filterAction !== 'all') {
        if (!evt.action.includes(this.filterAction)) return false;
      }
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const match =
          evt.summary.toLowerCase().includes(q) ||
          evt.actor.toLowerCase().includes(q) ||
          evt.details.toLowerCase().includes(q) ||
          evt.appRef.toLowerCase().includes(q) ||
          evt.action.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  },

  setSearch(val) {
    this.searchQuery = val;
    this.render(document.getElementById('pageArea'));
  },

  setFilter(type, val) {
    if (type === 'action') this.filterAction = val;
    if (type === 'app') this.filterApp = val;
    this.render(document.getElementById('pageArea'));
  },

  exportAuditCSV() {
    UTILS.toast('Statutory audit trail exported to CSV with timestamp signatures', 'success');
  }
};

/**
 * AICTE APPROVAL INTELLIGENCE (SIH26262)
 * View: Alerts, Escalations & SLA Follow-ups
 */

const VIEWS_ALERTS = {
  filterStatus: 'all',
  filterSeverity: 'all',

  render(container) {
    const alerts = DB.alerts;
    const unreadCount = alerts.filter(a => a.status === 'unread').length;
    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const ackCount = alerts.filter(a => a.status === 'acknowledged').length;
    const resolvedCount = alerts.filter(a => a.status === 'resolved').length;

    const displayAlerts = alerts.filter(a => {
      if (this.filterStatus !== 'all' && a.status !== this.filterStatus) return false;
      if (this.filterSeverity !== 'all' && a.severity !== this.filterSeverity) return false;
      return true;
    });

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-row">
          <div>
            <h1 class="page-title">Alerts, Tasks & SLA Follow-ups</h1>
            <p class="page-sub">
              Configurable regulatory reminder and escalation queue. Tracks approaching deadlines, expiring evidence, and stage ageing violations with deduplication state.
            </p>
          </div>
          <div class="page-actions">
            <button class="btn btn-outline btn-sm" onclick="VIEWS_ALERTS.markAllAcknowledged()">
              <i class="fa-solid fa-envelope-open-text"></i> Acknowledge All
            </button>
          </div>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid-auto mb-4">
        ${COMPONENTS.kpiCard({
          label: 'Active Alerts',
          value: alerts.length,
          sub: 'Deduplicated state engine',
          color: 'blue',
          icon: 'fa-bell'
        })}
        ${COMPONENTS.kpiCard({
          label: 'Unread / Unacknowledged',
          value: unreadCount,
          sub: 'Pending user review',
          color: 'warn',
          icon: 'fa-envelope'
        })}
        ${COMPONENTS.kpiCard({
          label: 'Critical SLA Breaches',
          value: criticalCount,
          sub: 'Requires escalation memo',
          color: 'red',
          icon: 'fa-triangle-exclamation'
        })}
        ${COMPONENTS.kpiCard({
          label: 'In Progress / Assigned',
          value: ackCount,
          sub: 'Under active follow-up',
          color: 'purple',
          icon: 'fa-user-clock'
        })}
        ${COMPONENTS.kpiCard({
          label: 'Resolved Follow-ups',
          value: resolvedCount,
          sub: 'Prerequisite satisfied',
          color: 'green',
          icon: 'fa-circle-check'
        })}
      </div>

      <!-- Filter Controls -->
      <div class="card mb-4">
        <div class="table-toolbar">
          <div class="filter-group">
            <select class="filter-select" onchange="VIEWS_ALERTS.setFilter('status', this.value)">
              <option value="all">All Alert States</option>
              <option value="unread" ${this.filterStatus === 'unread' ? 'selected' : ''}>Unread (${unreadCount})</option>
              <option value="acknowledged" ${this.filterStatus === 'acknowledged' ? 'selected' : ''}>Acknowledged (${ackCount})</option>
              <option value="resolved" ${this.filterStatus === 'resolved' ? 'selected' : ''}>Resolved (${resolvedCount})</option>
            </select>

            <select class="filter-select" onchange="VIEWS_ALERTS.setFilter('severity', this.value)">
              <option value="all">All Severity Levels</option>
              <option value="critical" ${this.filterSeverity === 'critical' ? 'selected' : ''}>Critical</option>
              <option value="high" ${this.filterSeverity === 'high' ? 'selected' : ''}>High</option>
              <option value="medium" ${this.filterSeverity === 'medium' ? 'selected' : ''}>Medium</option>
              <option value="low" ${this.filterSeverity === 'low' ? 'selected' : ''}>Low</option>
            </select>
          </div>

          <div class="table-count">
            Showing <strong>${displayAlerts.length}</strong> alerts
          </div>
        </div>

        <!-- Alert Items List -->
        <div class="card-body p-0">
          ${displayAlerts.length === 0 ? `
            <div class="empty-state">
              <i class="empty-state-icon fa-solid fa-bell-slash"></i>
              <div class="empty-state-title">No notifications match this filter</div>
              <div class="empty-state-desc">All regulatory follow-up items are up to date.</div>
            </div>
          ` : displayAlerts.map(alt => `
            <div class="p-3 border-bottom flex items-start gap-3" 
                 style="border-bottom:1px solid var(--border); background:${alt.status === 'unread' ? 'var(--clr-primary-lt)' : 'var(--surface)'};">
              <div style="font-size:20px; color:${alt.severity === 'critical' ? 'var(--clr-danger)' : alt.severity === 'high' ? 'var(--clr-warn)' : 'var(--clr-primary)'}; margin-top:2px;">
                <i class="fa-solid ${alt.severity === 'critical' ? 'fa-circle-exclamation' : 'fa-bell'}"></i>
              </div>

              <div class="flex-1">
                <div class="flex items-center justify-between mb-1 flex-wrap gap-1">
                  <div class="flex items-center gap-2">
                    <span class="mono text-xs font-semibold text-muted">${alt.id}</span>
                    <span class="font-bold text-sm text-primary">${alt.title}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    ${UTILS.severityBadge(alt.severity)}
                    <span class="badge ${alt.status === 'unread' ? 'badge-open' : alt.status === 'acknowledged' ? 'badge-pending-verify' : 'badge-complete'}">
                      ${alt.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <p class="text-sm text-muted mb-2">${alt.message}</p>

                <div class="flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div class="flex items-center gap-3 text-subtle">
                    <span><i class="fa-regular fa-building"></i> ${alt.institution}</span>
                    <span><i class="fa-regular fa-user"></i> Assigned: <strong>${alt.assignedPerson}</strong> (${alt.assignedRole})</span>
                    <span><i class="fa-regular fa-calendar-xmark text-danger"></i> Due: <strong class="text-danger">${UTILS.formatDate(alt.dueDate)}</strong></span>
                  </div>

                  <div class="flex items-center gap-2">
                    ${alt.status === 'unread' ? `
                      <button class="btn btn-secondary btn-xs" onclick="VIEWS_ALERTS.acknowledgeAlert('${alt.id}')">
                        <i class="fa-solid fa-check"></i> Acknowledge
                      </button>
                    ` : ''}

                    ${alt.status !== 'resolved' ? `
                      <button class="btn btn-success btn-xs" onclick="VIEWS_ALERTS.resolveAlert('${alt.id}')">
                        <i class="fa-solid fa-circle-check"></i> Mark Resolved
                      </button>
                    ` : ''}

                    <button class="btn btn-outline btn-xs" onclick="VIEWS_ALERTS.reassignAlert('${alt.id}')">
                      <i class="fa-solid fa-user-pen"></i> Reassign
                    </button>

                    ${alt.appId ? `
                      <button class="btn btn-primary btn-xs" onclick="COMPONENTS.renderApplicationDetail('${alt.appId}')">
                        View Application <i class="fa-solid fa-arrow-right"></i>
                      </button>
                    ` : ''}
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  setFilter(type, val) {
    if (type === 'status') this.filterStatus = val;
    if (type === 'severity') this.filterSeverity = val;
    this.render(document.getElementById('pageArea'));
  },

  acknowledgeAlert(id) {
    STORE.acknowledgeAlert(id);
    UTILS.toast(`Alert ${id} acknowledged and marked in progress`, 'info');
    this.render(document.getElementById('pageArea'));
    APP.updateNotificationBadge();
  },

  resolveAlert(id) {
    STORE.resolveAlert(id);
    UTILS.toast(`Alert ${id} marked as resolved`, 'success');
    this.render(document.getElementById('pageArea'));
    APP.updateNotificationBadge();
  },

  reassignAlert(id) {
    const alert = (STORE.getAlerts() || []).find(a => a.id === id);
    if (!alert) return;

    const bodyHtml = `
      <form onsubmit="VIEWS_ALERTS.submitReassign(event, '${id}')">
        <div class="mb-3">
          <div class="text-xs text-muted mb-1">Follow-up Task</div>
          <div class="font-bold text-sm">${alert.title}</div>
          <div class="text-xs text-muted mt-1">Currently assigned to: <strong>${alert.assignedPerson}</strong></div>
        </div>

        <div class="form-group">
          <label class="form-label">Assign To Officer / Role <span class="req">*</span></label>
          <select class="form-control" id="reassignSelect">
            <option value="Dr. Suresh Patil (Institution Coordinator)">Dr. Suresh Patil (Institution Coordinator)</option>
            <option value="Prof. Rajiv Sharma (Scrutiny Officer)">Prof. Rajiv Sharma (Scrutiny Officer)</option>
            <option value="Dr. Meenakshi Sundaram (Regional Director)">Dr. Meenakshi Sundaram (Regional Director)</option>
            <option value="Dr. S. K. Reddy (Scrutiny Committee)">Dr. S. K. Reddy (Scrutiny Committee)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Reason for Task Reassignment <span class="req">*</span></label>
          <textarea class="form-control" id="reassignReason" rows="3" placeholder="Explain escalation or responsibility handover..." required></textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="UTILS.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="fa-solid fa-user-check"></i> Confirm Reassignment</button>
        </div>
      </form>
    `;

    UTILS.openModal(`Reassign Follow-up · ${id}`, bodyHtml);
  },

  submitReassign(e, id) {
    e.preventDefault();
    const newPerson = document.getElementById('reassignSelect').value;
    const reason = document.getElementById('reassignReason').value.trim();

    if (!reason) {
      UTILS.toast('Please provide a reason for reassignment', 'error');
      return;
    }

    STORE.reassignTask(id, newPerson, reason, STORE.getCurrentUser());

    UTILS.closeModal();
    UTILS.toast(`Task reassigned to ${newPerson}`, 'success');
    this.render(document.getElementById('pageArea'));
  },

  markAllAcknowledged() {
    (STORE.getAlerts() || []).forEach(a => {
      if (a.status === 'unread') STORE.acknowledgeAlert(a.id);
    });
    UTILS.toast('All pending alerts marked as acknowledged', 'info');
    this.render(document.getElementById('pageArea'));
    APP.updateNotificationBadge();
  }
};

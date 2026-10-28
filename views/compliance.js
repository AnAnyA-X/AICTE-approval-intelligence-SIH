/**
 * AICTE APPROVAL INTELLIGENCE (SIH26262)
 * View: Compliance & Evidence Register
 */

const VIEWS_COMPLIANCE = {
  selectedAppId: 'all',
  filterStatus: 'all',
  filterCategory: 'all',
  searchQuery: '',

  render(container) {
    const apps = DB.applications;
    const allItems = this.getAllComplianceItems();

    // Summary stats
    const totalCount = allItems.length;
    const verifiedCount = allItems.filter(i => i.status === 'verified').length;
    const pendingCount = allItems.filter(i => i.status === 'pending_verification' || i.status === 'pending_verify').length;
    const missingCount = allItems.filter(i => i.status === 'missing' || i.status === 'rejected').length;
    const expiredCount = allItems.filter(i => i.status === 'expired').length;

    const filteredItems = this.getFilteredItems(allItems);

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-row">
          <div>
            <h1 class="page-title">Compliance & Evidence Register</h1>
            <p class="page-sub">
              Document verification matrix linking institutional evidentiary uploads to statutory APH criteria, validity dates & reviewer determinations.
            </p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary btn-sm" onclick="VIEWS_COMPLIANCE.downloadComplianceMatrix()">
              <i class="fa-solid fa-file-csv"></i> Download CSV Matrix
            </button>
          </div>
        </div>
      </div>

      <!-- Compliance Metrics Strip -->
      <div class="grid-auto mb-4">
        ${COMPONENTS.kpiCard({
          label: 'Total Required Evidence',
          value: totalCount,
          sub: 'Across active applications',
          color: 'blue',
          icon: 'fa-file-lines'
        })}
        ${COMPONENTS.kpiCard({
          label: 'Verified Compliant',
          value: verifiedCount,
          sub: `${Math.round((verifiedCount / (totalCount || 1)) * 100)}% verified`,
          color: 'green',
          icon: 'fa-circle-check'
        })}
        ${COMPONENTS.kpiCard({
          label: 'Awaiting Scrutiny',
          value: pendingCount,
          sub: 'Uploaded by institutions',
          color: 'warn',
          icon: 'fa-clock'
        })}
        ${COMPONENTS.kpiCard({
          label: 'Missing / Rejected',
          value: missingCount,
          sub: 'Creates stage blockers',
          color: 'red',
          icon: 'fa-circle-xmark'
        })}
        ${COMPONENTS.kpiCard({
          label: 'Expired / Lapsed NOCs',
          value: expiredCount,
          sub: 'Requires immediate renewal',
          color: 'purple',
          icon: 'fa-hourglass-end'
        })}
      </div>

      <!-- Filter & Search Toolbar -->
      <div class="card mb-4">
        <div class="table-toolbar">
          <div class="search-input-wrap">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" placeholder="Search requirement, clause, doc name..."
                   value="${this.searchQuery}"
                   oninput="VIEWS_COMPLIANCE.setSearch(this.value)" />
          </div>

          <div class="filter-group">
            <!-- Filter by Application -->
            <select class="filter-select" onchange="VIEWS_COMPLIANCE.setFilter('app', this.value)">
              <option value="all">All Applications (${apps.length})</option>
              ${apps.map(a => `
                <option value="${a.id}" ${this.selectedAppId === a.id ? 'selected' : ''}>
                  ${a.refNumber} - ${a.institutionName.substring(0, 28)}...
                </option>
              `).join('')}
            </select>

            <!-- Filter by Status -->
            <select class="filter-select" onchange="VIEWS_COMPLIANCE.setFilter('status', this.value)">
              <option value="all">All Verification Statuses</option>
              <option value="verified" ${this.filterStatus === 'verified' ? 'selected' : ''}>Verified Compliant</option>
              <option value="pending" ${this.filterStatus === 'pending' ? 'selected' : ''}>Pending Scrutiny Review</option>
              <option value="missing" ${this.filterStatus === 'missing' ? 'selected' : ''}>Missing / Not Uploaded</option>
              <option value="rejected" ${this.filterStatus === 'rejected' ? 'selected' : ''}>Deficient / Rejected</option>
              <option value="expired" ${this.filterStatus === 'expired' ? 'selected' : ''}>Expired Evidence</option>
            </select>

            <!-- Filter by Category -->
            <select class="filter-select" onchange="VIEWS_COMPLIANCE.setFilter('category', this.value)">
              <option value="all">All Regulatory Categories</option>
              <option value="Land & Infrastructure" ${this.filterCategory === 'Land & Infrastructure' ? 'selected' : ''}>Land & Infrastructure</option>
              <option value="Safety & Environmental" ${this.filterCategory === 'Safety & Environmental' ? 'selected' : ''}>Safety & Environmental</option>
              <option value="Statutory" ${this.filterCategory === 'Statutory' ? 'selected' : ''}>Statutory State/University</option>
              <option value="Financial Security" ${this.filterCategory === 'Financial Security' ? 'selected' : ''}>Financial Security (FDR)</option>
              <option value="Faculty & Cadre" ${this.filterCategory === 'Faculty & Cadre' ? 'selected' : ''}>Faculty & Cadre</option>
              <option value="Academic & Laboratory" ${this.filterCategory === 'Academic & Laboratory' ? 'selected' : ''}>Academic & Laboratory</option>
              <option value="Student Welfare" ${this.filterCategory === 'Student Welfare' ? 'selected' : ''}>Student Welfare & Anti-Ragging</option>
            </select>
          </div>

          <div class="table-count">
            Showing <strong>${filteredItems.length}</strong> of ${allItems.length} compliance items
          </div>
        </div>

        <!-- Compliance Table -->
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Clause Code</th>
                <th>Requirement & Standard</th>
                <th>Application Reference</th>
                <th>Submitted Evidence</th>
                <th>Validity / Expiry</th>
                <th>Compliance Status</th>
                <th>Audit Observations</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              ${filteredItems.length === 0 ? `
                <tr>
                  <td colspan="8">
                    <div class="empty-state">
                      <i class="empty-state-icon fa-solid fa-list-check"></i>
                      <div class="empty-state-title">No compliance items match filters</div>
                      <div class="empty-state-desc">Try resetting your filters or selecting a different application.</div>
                    </div>
                  </td>
                </tr>
              ` : filteredItems.map(item => `
                <tr>
                  <td class="td-mono font-bold text-primary">${item.ruleCode}</td>
                  <td>
                    <div class="font-semibold text-sm">${item.requirementName}</div>
                    <div class="text-xs text-subtle">${item.category}</div>
                  </td>
                  <td>
                    <div class="text-xs font-semibold mono" style="cursor:pointer" onclick="COMPONENTS.renderApplicationDetail('${item.appId}')">
                      ${item.appRef}
                    </div>
                    <div class="text-xs text-muted truncate" style="max-width:180px;">${item.institutionName}</div>
                  </td>
                  <td>
                    ${item.evidenceFile ? `
                      <a href="javascript:void(0)" onclick="COMPONENTS.previewDoc('${item.evidenceFile}')" class="text-sm text-primary flex items-center gap-1">
                        <i class="fa-solid fa-file-pdf"></i>
                        <span class="truncate" style="max-width:150px;" title="${item.evidenceFile}">${item.evidenceFile}</span>
                      </a>
                      <div class="text-xs text-subtle">${item.fileSize || ''} · ${UTILS.formatDate(item.uploadDate)}</div>
                    ` : `
                      <span class="badge badge-missing"><i class="fa-solid fa-xmark"></i> Not Uploaded</span>
                    `}
                  </td>
                  <td>
                    ${item.status === 'expired' ? `
                      <span class="badge badge-expired"><i class="fa-solid fa-triangle-exclamation"></i> Lapsed: ${UTILS.formatDate(item.expiryDate)}</span>
                    ` : item.expiryDate === 'Perpetual' || item.expiryDate === 'N/A' ? `
                      <span class="text-xs text-muted">${item.expiryDate}</span>
                    ` : `
                      <span class="text-xs text-muted">${UTILS.formatDate(item.expiryDate)}</span>
                    `}
                  </td>
                  <td>${UTILS.complianceBadge(item.status)}</td>
                  <td>
                    <div class="text-xs text-muted" style="max-width: 220px; line-height: 1.4;" title="${item.remarks || ''}">
                      ${item.remarks ? (item.remarks.length > 70 ? item.remarks.substring(0, 70) + '...' : item.remarks) : '<span class="text-subtle">No notes recorded</span>'}
                    </div>
                  </td>
                  <td class="text-right">
                    <div class="table-action-cell justify-end">
                      ${DB.currentUser.role === 'institution' && item.status !== 'verified' ? `
                        <button class="btn btn-primary btn-xs" onclick="COMPONENTS.openUploadItemDialog('${item.appId}', '${item.id}')">
                          <i class="fa-solid fa-upload"></i> Upload
                        </button>
                      ` : DB.currentUser.role !== 'institution' ? `
                        <button class="btn btn-outline btn-xs" onclick="COMPONENTS.openVerifyItemDialog('${item.appId}', '${item.id}')">
                          <i class="fa-solid fa-check"></i> Audit
                        </button>
                      ` : `
                        <span class="text-xs text-success"><i class="fa-solid fa-shield-check"></i> Compliant</span>
                      `}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  getAllComplianceItems() {
    const list = [];
    DB.applications.forEach(app => {
      (app.complianceItems || []).forEach(ci => {
        list.push({
          ...ci,
          appId: app.id,
          appRef: app.refNumber,
          institutionName: app.institutionName,
          appStage: app.currentStage
        });
      });
    });
    return list;
  },

  getFilteredItems(items) {
    return items.filter(item => {
      if (this.selectedAppId !== 'all' && item.appId !== this.selectedAppId) {
        return false;
      }
      if (this.filterStatus !== 'all') {
        if (this.filterStatus === 'pending' && !(item.status === 'pending_verification' || item.status === 'pending_verify')) return false;
        if (this.filterStatus === 'missing' && item.status !== 'missing') return false;
        if (this.filterStatus === 'rejected' && item.status !== 'rejected') return false;
        if (this.filterStatus === 'verified' && item.status !== 'verified') return false;
        if (this.filterStatus === 'expired' && item.status !== 'expired') return false;
      }
      if (this.filterCategory !== 'all' && item.category !== this.filterCategory) {
        return false;
      }
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const match =
          item.ruleCode.toLowerCase().includes(q) ||
          item.requirementName.toLowerCase().includes(q) ||
          item.institutionName.toLowerCase().includes(q) ||
          item.appRef.toLowerCase().includes(q) ||
          (item.evidenceFile && item.evidenceFile.toLowerCase().includes(q));
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
    if (type === 'app') this.selectedAppId = val;
    if (type === 'status') this.filterStatus = val;
    if (type === 'category') this.filterCategory = val;
    this.render(document.getElementById('pageArea'));
  },

  downloadComplianceMatrix() {
    UTILS.toast('Compliance register exported to CSV', 'success');
  }
};

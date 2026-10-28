/**
 * AICTE APPROVAL INTELLIGENCE (SIH26262)
 * View: Applications Management Console
 */

const VIEWS_APPLICATIONS = {
  searchQuery: '',
  filterStage: 'all',
  filterRegion: 'all',
  filterType: 'all',
  sortBy: 'submittedDate',
  sortOrder: 'desc',

  render(container) {
    const apps = this.getFilteredApplications();

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-row">
          <div>
            <h1 class="page-title">Application Management Console</h1>
            <p class="page-sub">
              Monitor, evaluate, reassign and advance institutional approval applications through statutory stages.
            </p>
          </div>
          <div class="page-actions">
            ${DB.currentUser.role === 'institution' ? `
              <button class="btn btn-primary" onclick="COMPONENTS.openNewApplicationWizard()">
                <i class="fa-solid fa-plus"></i> Submit New Application
              </button>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="COMPONENTS.openNewApplicationWizard()">
                <i class="fa-solid fa-file-circle-plus"></i> Intake / Extension Wizard
              </button>
            `}
          </div>
        </div>
      </div>

      <!-- Application Table Toolbar with Search & Dynamic Filters -->
      <div class="card mb-4">
        <div class="table-toolbar">
          <div class="search-input-wrap">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" placeholder="Search by Institute, Course, Ref..." 
                   value="${this.searchQuery}" 
                   oninput="VIEWS_APPLICATIONS.setSearch(this.value)" />
          </div>

          <div class="filter-group">
            <select class="filter-select" onchange="VIEWS_APPLICATIONS.setFilter('stage', this.value)">
              <option value="all">All Stages</option>
              <option value="submitted" ${this.filterStage === 'submitted' ? 'selected' : ''}>Submitted</option>
              <option value="scrutiny" ${this.filterStage === 'scrutiny' ? 'selected' : ''}>In Scrutiny</option>
              <option value="deficiency" ${this.filterStage === 'deficiency' ? 'selected' : ''}>Deficiency</option>
              <option value="approved" ${this.filterStage === 'approved' ? 'selected' : ''}>Approved (LoA)</option>
              <option value="rejected" ${this.filterStage === 'rejected' ? 'selected' : ''}>Rejected</option>
            </select>

            <select class="filter-select" onchange="VIEWS_APPLICATIONS.setFilter('region', this.value)">
              <option value="all">All Regions</option>
              <option value="Western" ${this.filterRegion === 'Western' ? 'selected' : ''}>Western Region</option>
              <option value="Southern" ${this.filterRegion === 'Southern' ? 'selected' : ''}>Southern Region</option>
              <option value="South-Central" ${this.filterRegion === 'South-Central' ? 'selected' : ''}>South-Central Region</option>
              <option value="South-Western" ${this.filterRegion === 'South-Western' ? 'selected' : ''}>South-Western Region</option>
              <option value="North-Western" ${this.filterRegion === 'North-Western' ? 'selected' : ''}>North-Western Region</option>
            </select>

            <select class="filter-select" onchange="VIEWS_APPLICATIONS.setFilter('type', this.value)">
              <option value="all">All Categories</option>
              <option value="New Technical Institution" ${this.filterType === 'New Technical Institution' ? 'selected' : ''}>New Technical Institution</option>
              <option value="Increase in Intake" ${this.filterType === 'Increase in Intake' ? 'selected' : ''}>Increase in Intake</option>
              <option value="Introduction of New Course" ${this.filterType === 'Introduction of New Course' ? 'selected' : ''}>Introduction of New Course</option>
            </select>
          </div>

          <div class="table-count">
            Showing <strong>${apps.length}</strong> of ${DB.applications.length} records
          </div>
        </div>

        <!-- Table View -->
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th onclick="VIEWS_APPLICATIONS.toggleSort('refNumber')" class="${this.sortBy === 'refNumber' ? 'sort-' + this.sortOrder : ''}">Application Ref</th>
                <th onclick="VIEWS_APPLICATIONS.toggleSort('institutionName')" class="${this.sortBy === 'institutionName' ? 'sort-' + this.sortOrder : ''}">Institution & Course</th>
                <th>Category</th>
                <th onclick="VIEWS_APPLICATIONS.toggleSort('currentStage')" class="${this.sortBy === 'currentStage' ? 'sort-' + this.sortOrder : ''}">Current Stage</th>
                <th onclick="VIEWS_APPLICATIONS.toggleSort('submittedDate')" class="${this.sortBy === 'submittedDate' ? 'sort-' + this.sortOrder : ''}">Submitted</th>
                <th>Ageing / SLA</th>
                <th>Blockers</th>
                <th class="text-right no-sort">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${apps.length === 0 ? `
                <tr>
                  <td colspan="8">
                    <div class="empty-state">
                      <i class="empty-state-icon fa-solid fa-filter-circle-xmark"></i>
                      <div class="empty-state-title">No matching applications</div>
                      <div class="empty-state-desc">Try clearing your search query or stage filters.</div>
                      <button class="btn btn-secondary btn-sm" onclick="VIEWS_APPLICATIONS.resetFilters()">Reset Filters</button>
                    </div>
                  </td>
                </tr>
              ` : apps.map(app => {
                const bCount = (app.blockers || []).filter(b => b.status === 'open').length;
                return `
                  <tr>
                    <td class="td-mono font-semibold">${app.refNumber}</td>
                    <td>
                      <div class="font-bold text-sm text-primary" style="cursor:pointer" onclick="COMPONENTS.renderApplicationDetail('${app.id}')">
                        ${app.institutionName}
                      </div>
                      <div class="text-xs text-muted">
                        ${app.course} · <strong>${app.intake} seats</strong> (${app.region} Region)
                      </div>
                    </td>
                    <td><span class="tag text-xs">${app.applicationType}</span></td>
                    <td>${UTILS.stageBadge(app.currentStage)}</td>
                    <td class="text-xs text-muted">${UTILS.formatDate(app.submittedDate)}</td>
                    <td>${UTILS.ageingBar(app.stageAgeing.totalDays, app.stageAgeing.totalSla)}</td>
                    <td>
                      ${bCount > 0 ? `
                        <span class="badge badge-open" style="cursor:pointer" onclick="COMPONENTS.renderApplicationDetail('${app.id}', 'blockers')">
                          <i class="fa-solid fa-lock"></i> ${bCount} Blocked
                        </span>
                      ` : `
                        <span class="badge badge-complete">
                          <i class="fa-solid fa-check"></i> Clean
                        </span>
                      `}
                    </td>
                    <td class="text-right">
                      <div class="table-action-cell justify-end">
                        <button class="row-action-btn primary" title="View Full File & Compliance" onclick="COMPONENTS.renderApplicationDetail('${app.id}')">
                          <i class="fa-regular fa-folder-open"></i> Detail
                        </button>
                        ${DB.currentUser.role !== 'institution' ? `
                          <button class="row-action-btn" title="Stage Transition" onclick="COMPONENTS.openTransitionDialog('${app.id}')">
                            <i class="fa-solid fa-arrow-right-arrow-left"></i>
                          </button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  getFilteredApplications() {
    return DB.applications.filter(app => {
      // Search
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const match =
          app.refNumber.toLowerCase().includes(q) ||
          app.institutionName.toLowerCase().includes(q) ||
          app.course.toLowerCase().includes(q) ||
          app.coordinator.toLowerCase().includes(q);
        if (!match) return false;
      }
      // Stage filter
      if (this.filterStage !== 'all' && app.currentStage !== this.filterStage) {
        return false;
      }
      // Region filter
      if (this.filterRegion !== 'all' && app.region !== this.filterRegion) {
        return false;
      }
      // Type filter
      if (this.filterType !== 'all' && app.applicationType !== this.filterType) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      let valA = a[this.sortBy];
      let valB = b[this.sortBy];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return this.sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  },

  setSearch(val) {
    this.searchQuery = val;
    this.render(document.getElementById('pageArea'));
  },

  setFilter(field, val) {
    if (field === 'stage') this.filterStage = val;
    if (field === 'region') this.filterRegion = val;
    if (field === 'type') this.filterType = val;
    this.render(document.getElementById('pageArea'));
  },

  toggleSort(field) {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'asc';
    }
    this.render(document.getElementById('pageArea'));
  },

  resetFilters() {
    this.searchQuery = '';
    this.filterStage = 'all';
    this.filterRegion = 'all';
    this.filterType = 'all';
    this.render(document.getElementById('pageArea'));
  }
};

// Wizard for creating new application
COMPONENTS.openNewApplicationWizard = function() {
  const bodyHtml = `
    <form id="newAppForm" onsubmit="COMPONENTS.submitNewApplication(event)">
      <div class="alert alert-info mb-4">
        <i class="fa-solid fa-circle-info"></i>
        <div>
          <strong>AICTE Approval Process Handbook (APH) Intake Submission:</strong>
          Please verify institutional and statutory requirements prior to initiating online scrutiny.
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-title">1. Institutional & Regional Details</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Institution Name <span class="req">*</span></label>
            <input type="text" class="form-control" id="newInstName" value="Shreya Institute of Technology, Pune" required />
          </div>
          <div class="form-group">
            <label class="form-label">Permanent Institute Code <span class="req">*</span></label>
            <input type="text" class="form-control" id="newInstCode" value="1-42981042" required />
          </div>
        </div>

        <div class="form-row-3">
          <div class="form-group">
            <label class="form-label">Jurisdictional Region <span class="req">*</span></label>
            <select class="form-control" id="newRegion">
              <option value="Western">Western Region (Mumbai/Pune)</option>
              <option value="Southern">Southern Region (Chennai)</option>
              <option value="South-Central">South-Central (Hyderabad)</option>
              <option value="North-Western">North-Western (Chandigarh)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">State <span class="req">*</span></label>
            <input type="text" class="form-control" id="newState" value="Maharashtra" required />
          </div>
          <div class="form-group">
            <label class="form-label">Academic Year <span class="req">*</span></label>
            <input type="text" class="form-control" id="newAcademicYear" value="2026-27" readonly />
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-title">2. Programme Proposal</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Application Category <span class="req">*</span></label>
            <select class="form-control" id="newAppType">
              <option value="New Technical Institution">New Technical Institution</option>
              <option value="Increase in Intake">Increase in Intake</option>
              <option value="Introduction of New Course">Introduction of New Course</option>
              <option value="Extension of Approval (EoA)">Extension of Approval (EoA)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Proposed Discipline / Course <span class="req">*</span></label>
            <input type="text" class="form-control" id="newCourse" placeholder="e.g. B.Tech - Cyber Security" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Approved / Proposed Intake <span class="req">*</span></label>
            <select class="form-control" id="newIntake">
              <option value="30">30 Seats</option>
              <option value="60" selected>60 Seats</option>
              <option value="120">120 Seats</option>
              <option value="180">180 Seats</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Institutional Coordinator <span class="req">*</span></label>
            <input type="text" class="form-control" id="newCoord" value="Dr. Suresh Patil" required />
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-title">3. Statutory Undertaking</div>
        <label class="form-check">
          <input type="checkbox" required />
          <span>I certify that all infrastructural, financial, and faculty norms conform to AICTE Regulations 2026.</span>
        </label>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="UTILS.closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary"><i class="fa-solid fa-paper-plane"></i> Submit Application & Generate Ref</button>
      </div>
    </form>
  `;

  UTILS.openModal('Initiate New Approval Application', bodyHtml);
};

COMPONENTS.submitNewApplication = function(e) {
  e.preventDefault();

  const name = document.getElementById('newInstName').value.trim();
  const code = document.getElementById('newInstCode').value.trim();
  const region = document.getElementById('newRegion').value;
  const state = document.getElementById('newState').value.trim();
  const appType = document.getElementById('newAppType').value;
  const course = document.getElementById('newCourse').value.trim();
  const intake = parseInt(document.getElementById('newIntake').value, 10);
  const coord = document.getElementById('newCoord').value.trim();

  if (!name || !code || !course) {
    UTILS.toast('Please fill in all mandatory application details', 'error');
    return;
  }

  const newApp = STORE.createApplication({
    institutionName: name,
    institutionCode: code,
    region: region,
    state: state,
    applicationType: appType,
    course: course,
    intake: intake,
    coordinator: coord
  });

  UTILS.closeModal();
  UTILS.toast(`Application ${newApp.refNumber} created & statutory checklist generated!`, 'success');
  APP.navigate('applications');
};

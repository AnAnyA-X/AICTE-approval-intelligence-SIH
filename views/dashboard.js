/**
 * AICTE APPROVAL INTELLIGENCE (SIH26262)
 * View: Unified Dashboard
 */

const VIEWS_DASHBOARD = {
  render(container) {
    const apps = DB.applications;
    const totalApps = apps.length;
    const pendingApps = apps.filter(a => a.currentStage !== 'approved' && a.currentStage !== 'rejected').length;
    const deficiencyApps = apps.filter(a => a.currentStage === 'deficiency').length;
    const approvedApps = apps.filter(a => a.currentStage === 'approved').length;

    // Collect all blockers
    const allBlockers = apps.flatMap(a => (a.blockers || []).map(b => ({ ...b, appId: a.id, appRef: a.refNumber, instName: a.institutionName })));
    const openBlockers = allBlockers.filter(b => b.status === 'open');
    const criticalBlockers = openBlockers.filter(b => b.severity === 'critical');

    // Collect all unread/open alerts
    const alerts = DB.alerts;
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');

    // Calculate Stage Ageing averages
    const avgAgeing = Math.round(apps.reduce((sum, a) => sum + (a.stageAgeing?.totalDays || 0), 0) / (apps.length || 1));

    container.innerHTML = `
      <!-- Page Header -->
      <div class="page-header">
        <div class="page-header-row">
          <div>
            <h1 class="page-title">Executive Approval Dashboard</h1>
            <p class="page-sub">
              National Institutional Compliance & Approval Process Monitoring · Synthetic Demonstration Model
            </p>
          </div>
          <div class="page-actions">
            ${DB.currentUser.role === 'institution' ? `
              <button class="btn btn-primary" onclick="COMPONENTS.openNewApplicationWizard()">
                <i class="fa-solid fa-plus"></i> New Application
              </button>
            ` : `
              <button class="btn btn-secondary btn-sm" onclick="VIEWS_DASHBOARD.exportSummaryReport()">
                <i class="fa-solid fa-download"></i> Export Analytics
              </button>
            `}
          </div>
        </div>
      </div>

      <!-- Critical Escalation Warning Strip if open blockers exist -->
      ${criticalBlockers.length > 0 ? `
        <div class="notice-strip danger">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <div>
            <strong>Action Required:</strong> ${criticalBlockers.length} critical gatekeeper blockers detected across pending cases.
            Progress to physical EVC visits is halted until compliance prerequisites are resolved.
          </div>
        </div>
      ` : ''}

      <!-- Top KPI Row -->
      <div class="grid-auto mb-5">
        ${COMPONENTS.kpiCard({
          label: 'Total Applications',
          value: totalApps,
          sub: '2026-27 Academic Cycle',
          color: 'blue',
          icon: 'fa-folder-tree',
          trend: { type: 'up', label: '+12% vs LY' }
        })}
        ${COMPONENTS.kpiCard({
          label: 'Active Scrutiny & Review',
          value: pendingApps,
          sub: 'Under active evaluation',
          color: 'warn',
          icon: 'fa-hourglass-half',
          trend: { type: 'flat', label: '14d Avg Time' }
        })}
        ${COMPONENTS.kpiCard({
          label: 'Deficiency Loop',
          value: deficiencyApps,
          sub: 'Awaiting institution resubmission',
          color: 'red',
          icon: 'fa-arrow-rotate-left',
          trend: { type: 'down', label: '-4% from peak' }
        })}
        ${COMPONENTS.kpiCard({
          label: 'Active Gatekeeper Blockers',
          value: openBlockers.length,
          sub: `${criticalBlockers.length} critical severity`,
          color: 'purple',
          icon: 'fa-lock',
          trend: { type: 'down', label: 'Explained by logic' }
        })}
        ${COMPONENTS.kpiCard({
          label: 'Approvals Issued (LoA)',
          value: approvedApps,
          sub: 'Meets 100% norms',
          color: 'green',
          icon: 'fa-circle-check',
          trend: { type: 'up', label: 'Fast-tracked' }
        })}
      </div>

      <!-- Charts & Visual Matrix -->
      <div class="grid-sidebar mb-5">
        <!-- Left: Stage Ageing Chart & Active Blockers -->
        <div class="flex flex-col gap-4">
          <!-- Stage Ageing Bar Chart -->
          <div class="card">
            <div class="card-header">
              <span class="card-title"><i class="fa-solid fa-chart-column"></i> Stage Ageing vs. Prescribed SLAs</span>
              <span class="text-xs text-muted">Normative APH Timeline Benchmarks</span>
            </div>
            <div class="card-body">
              <div class="chart-wrap" style="height: 220px;">
                <canvas id="stageAgeingChart"></canvas>
              </div>
            </div>
          </div>

          <!-- Active Blocker Intelligence Summary -->
          <div class="card">
            <div class="card-header">
              <span class="card-title"><i class="fa-solid fa-diagram-project"></i> Root-Cause Blocker Explanations</span>
              <button class="link-btn" onclick="APP.navigate('blockers')">View All (${openBlockers.length})</button>
            </div>
            <div class="card-body p-0">
              ${openBlockers.slice(0, 3).map(b => `
                <div class="p-3 border-bottom flex items-start gap-3" style="border-bottom:1px solid var(--border)">
                  <i class="fa-solid fa-circle-exclamation text-danger mt-1"></i>
                  <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                      <span class="font-bold text-sm">${b.title}</span>
                      <span class="badge badge-critical">${b.code}</span>
                    </div>
                    <p class="text-xs text-muted mb-2">${b.rootCause}</p>
                    <div class="flex items-center justify-between text-xs">
                      <span class="text-subtle"><i class="fa-regular fa-building"></i> ${b.instName}</span>
                      <span class="text-primary font-medium">Due: ${UTILS.formatDate(b.dueDate)}</span>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Right: Stage Breakdown Doughnut & Urgent Follow-ups -->
        <div class="flex flex-col gap-4">
          <!-- Stage Distribution Doughnut -->
          <div class="card">
            <div class="card-header">
              <span class="card-title"><i class="fa-solid fa-chart-pie"></i> Application Distribution</span>
            </div>
            <div class="card-body">
              <div class="chart-wrap" style="height: 180px;">
                <canvas id="stageDoughnutChart"></canvas>
              </div>
            </div>
          </div>

          <!-- Urgent Tasks / Deadlines -->
          <div class="card">
            <div class="card-header">
              <span class="card-title"><i class="fa-solid fa-calendar-check"></i> Actionable Follow-ups</span>
              <span class="badge badge-critical">${criticalAlerts.length} Critical</span>
            </div>
            <div class="card-body p-0">
              ${alerts.slice(0, 3).map(alt => `
                <div class="p-3" style="border-bottom:1px solid var(--border)">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-semibold text-xs text-danger">${alt.title}</span>
                    <span class="badge ${alt.severity === 'critical' ? 'badge-critical' : 'badge-high'}">${alt.category}</span>
                  </div>
                  <p class="text-xs text-muted mb-1">${alt.message}</p>
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-subtle">Assigned: ${alt.assignedPerson}</span>
                    <a href="javascript:void(0)" onclick="APP.navigate('alerts')" class="link-btn font-semibold">Take Action</a>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Applications Table Section -->
      <div class="card">
        <div class="card-header">
          <div class="flex items-center gap-2">
            <span class="card-title"><i class="fa-solid fa-list-ol"></i> Application Pipeline Overview</span>
            <span class="text-xs text-muted">(${apps.length} active records)</span>
          </div>
          <button class="link-btn" onclick="APP.navigate('applications')">Open Management Console →</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>App Reference</th>
                <th>Institution Name</th>
                <th>Category</th>
                <th>Current Stage</th>
                <th>Ageing / SLA</th>
                <th>Blocker Status</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              ${apps.map(a => {
                const bCount = (a.blockers || []).filter(b => b.status === 'open').length;
                return `
                  <tr>
                    <td class="td-mono">${a.refNumber}</td>
                    <td>
                      <div class="font-semibold text-sm">${a.institutionName}</div>
                      <div class="text-xs text-subtle">${a.course} (${a.intake} seats)</div>
                    </td>
                    <td><span class="tag">${a.applicationType}</span></td>
                    <td>${UTILS.stageBadge(a.currentStage)}</td>
                    <td>${UTILS.ageingBar(a.stageAgeing.totalDays, a.stageAgeing.totalSla)}</td>
                    <td>
                      ${bCount > 0 ? `
                        <span class="badge badge-open">
                          <i class="fa-solid fa-lock"></i> ${bCount} Blocker${bCount > 1 ? 's' : ''}
                        </span>
                      ` : `
                        <span class="badge badge-complete">
                          <i class="fa-solid fa-check"></i> Clean
                        </span>
                      `}
                    </td>
                    <td class="text-right">
                      <button class="btn btn-outline btn-xs" onclick="COMPONENTS.renderApplicationDetail('${a.id}')">
                        Inspect
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Initialize Chart.js visualizations
    setTimeout(() => {
      VIEWS_DASHBOARD.initCharts(apps);
    }, 50);
  },

  initCharts(apps) {
    // 1. Stage Ageing Bar Chart
    const ctxBar = document.getElementById('stageAgeingChart');
    if (ctxBar) {
      new Chart(ctxBar, {
        type: 'bar',
        data: {
          labels: ['Pre-Check', 'Scrutiny', 'Deficiency', 'EVC Visit', 'Regional Review'],
          datasets: [
            {
              label: 'Average Days Spent',
              data: [2, 16, 8, 11, 5],
              backgroundColor: '#2563eb',
              borderRadius: 4
            },
            {
              label: 'Prescribed SLA Ceiling',
              data: [3, 10, 15, 15, 7],
              type: 'line',
              borderColor: '#dc2626',
              borderWidth: 2,
              borderDash: [5, 5],
              pointRadius: 4,
              backgroundColor: 'rgba(220, 38, 38, 0.1)'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
            tooltip: { mode: 'index', intersect: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Processing Days', font: { size: 11 } }
            }
          }
        }
      });
    }

    // 2. Stage Distribution Doughnut
    const ctxDoughnut = document.getElementById('stageDoughnutChart');
    if (ctxDoughnut) {
      new Chart(ctxDoughnut, {
        type: 'doughnut',
        data: {
          labels: ['Submitted', 'Scrutiny', 'Deficiency', 'Approved', 'Rejected'],
          datasets: [{
            data: [1, 1, 1, 1, 1],
            backgroundColor: [
              '#8b5cf6', // Submitted
              '#2563eb', // Scrutiny
              '#dc2626', // Deficiency
              '#16a34a', // Approved
              '#64748b'  // Rejected
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } }
          },
          cutout: '65%'
        }
      });
    }
  },

  exportSummaryReport() {
    UTILS.toast('Generating executive compliance and ageing report PDF...', 'info');
  }
};

/**
 * AICTE APPROVAL INTELLIGENCE (SIH26262)
 * Utility Functions & Shared Helpers
 */

const UTILS = {
  // Format Date to Indian Standard format (e.g. 24-Oct-2026)
  formatDate(dateStr) {
    if (!dateStr || dateStr === 'N/A' || dateStr === 'Perpetual') return dateStr || '—';
    try {
      const parts = dateStr.split(/[- :]/);
      if (parts.length >= 3) {
        const year = parts[0];
        const monthIdx = parseInt(parts[1], 10) - 1;
        const day = parts[2].substring(0, 2);
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return `${day}-${months[monthIdx] || parts[1]}-${year}`;
      }
      return dateStr;
    } catch(e) {
      return dateStr;
    }
  },

  // Stage Badge with icon
  stageBadge(stageId) {
    const stageMap = {
      submitted: { cls: 'badge-submitted', label: 'Submitted', icon: 'fa-file-import' },
      scrutiny: { cls: 'badge-scrutiny', label: 'In Scrutiny', icon: 'fa-magnifying-glass' },
      deficiency: { cls: 'badge-deficiency', label: 'Deficiency / Resubmit', icon: 'fa-triangle-exclamation' },
      expert_visit: { cls: 'badge-expert', label: 'Expert Visit (EVC)', icon: 'fa-building-circle-check' },
      final_review: { cls: 'badge-final-review', label: 'Regional Review', icon: 'fa-scale-balanced' },
      approved: { cls: 'badge-approved', label: 'Approved (LoA)', icon: 'fa-circle-check' },
      rejected: { cls: 'badge-rejected', label: 'Rejected', icon: 'fa-circle-xmark' },
      withdrawn: { cls: 'badge-withdrawn', label: 'Withdrawn', icon: 'fa-ban' }
    };
    const s = stageMap[stageId] || { cls: 'badge-draft', label: stageId || 'Draft', icon: 'fa-circle-dot' };
    return `<span class="badge ${s.cls}"><i class="fa-solid ${s.icon}"></i> ${s.label}</span>`;
  },

  // Compliance Status Badge
  complianceBadge(status) {
    const map = {
      verified: { cls: 'badge-complete', label: 'Verified & Compliant', icon: 'fa-circle-check' },
      pending_verification: { cls: 'badge-pending-verify', label: 'Pending Verification', icon: 'fa-clock' },
      pending_verify: { cls: 'badge-pending-verify', label: 'Pending Verification', icon: 'fa-clock' },
      missing: { cls: 'badge-missing', label: 'Missing / Required', icon: 'fa-circle-xmark' },
      rejected: { cls: 'badge-missing', label: 'Deficient / Rejected', icon: 'fa-triangle-exclamation' },
      expired: { cls: 'badge-expired', label: 'Expired Evidence', icon: 'fa-hourglass-end' },
      expiring: { cls: 'badge-expiring', label: 'Expiring Soon', icon: 'fa-hourglass-half' },
      partial: { cls: 'badge-partial', label: 'Partially Submitted', icon: 'fa-circle-half-stroke' }
    };
    const c = map[status] || { cls: 'badge-draft', label: status || 'Pending', icon: 'fa-clock' };
    return `<span class="badge ${c.cls}"><i class="fa-solid ${c.icon}"></i> ${c.label}</span>`;
  },

  // Severity Badge
  severityBadge(sev) {
    const map = {
      critical: { cls: 'badge-critical', label: 'Critical Priority', icon: 'fa-circle-exclamation' },
      high: { cls: 'badge-high', label: 'High Priority', icon: 'fa-triangle-exclamation' },
      medium: { cls: 'badge-medium', label: 'Medium Priority', icon: 'fa-circle-dot' },
      low: { cls: 'badge-low', label: 'Low Priority', icon: 'fa-circle-info' }
    };
    const s = map[sev] || { cls: 'badge-info', label: sev || 'Info', icon: 'fa-bell' };
    return `<span class="badge ${s.cls}"><i class="fa-solid ${s.icon}"></i> ${s.label}</span>`;
  },

  // Stage Ageing Progress Bar
  ageingBar(days, sla) {
    if (!sla || sla === 0) {
      return `<div class="age-bar-wrap"><span class="text-xs text-muted">Final stage (N/A)</span></div>`;
    }
    const pct = Math.min(Math.round((days / (sla * 1.5)) * 100), 100);
    let colorCls = 'age-ok';
    let statusLabel = 'On Track';

    if (days > sla) {
      colorCls = 'age-over';
      statusLabel = `Breached (+${days - sla}d)`;
    } else if (days >= sla * 0.75) {
      colorCls = 'age-warn';
      statusLabel = 'Approaching SLA';
    }

    return `
      <div class="age-bar-wrap" title="${days} days elapsed out of ${sla}-day SLA">
        <div class="flex items-center justify-between mb-1">
          <span class="age-label font-medium">${days} / ${sla}d</span>
          <span class="text-xs ${days > sla ? 'text-danger font-semibold' : 'text-muted'}">${statusLabel}</span>
        </div>
        <div class="age-bar-track">
          <div class="age-bar-fill ${colorCls}" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  },

  // Interactive Stage Pipeline Diagram
  renderPipeline(currentStage, onNodeClickFn = null) {
    const stages = [
      { id: 'submitted', label: 'Submission', num: 1 },
      { id: 'scrutiny', label: 'Scrutiny', num: 2 },
      { id: 'deficiency', label: 'Deficiency', num: 3 },
      { id: 'expert_visit', label: 'EVC Visit', num: 4 },
      { id: 'final_review', label: 'Committee', num: 5 },
      { id: 'approved', label: 'LoA Issued', num: 6 }
    ];

    const stageOrder = ['submitted', 'scrutiny', 'deficiency', 'expert_visit', 'final_review', 'approved'];
    const currentIdx = stageOrder.indexOf(currentStage);
    const isRejected = currentStage === 'rejected';

    let html = '<div class="stage-pipeline">';

    stages.forEach((st, idx) => {
      let nodeState = '';
      let isDone = false;
      let isCurrent = false;
      let isBlocked = false;

      if (isRejected) {
        nodeState = 'skipped';
      } else if (currentStage === 'deficiency' && st.id === 'deficiency') {
        isCurrent = true;
        isBlocked = true;
        nodeState = 'blocked';
      } else if (idx < currentIdx) {
        isDone = true;
        nodeState = 'done';
      } else if (idx === currentIdx) {
        isCurrent = true;
        nodeState = 'active';
      } else {
        nodeState = '';
      }

      const iconContent = isDone
        ? '<i class="fa-solid fa-check"></i>'
        : isBlocked
        ? '<i class="fa-solid fa-triangle-exclamation"></i>'
        : st.num;

      const clickAttr = onNodeClickFn ? `onclick="${onNodeClickFn}('${st.id}')" style="cursor:pointer;"` : '';

      html += `
        <div class="pipeline-step" ${clickAttr}>
          <div class="pipeline-node ${nodeState}">${iconContent}</div>
          <div class="pipeline-label ${isCurrent ? 'active' : ''} ${isBlocked ? 'blocked' : ''}">${st.label}</div>
        </div>
      `;

      if (idx < stages.length - 1) {
        const connDone = idx < currentIdx && !isRejected;
        html += `<div class="pipeline-connector ${connDone ? 'done' : ''}"></div>`;
      }
    });

    if (isRejected) {
      html += `
        <div class="pipeline-step">
          <div class="pipeline-node blocked"><i class="fa-solid fa-xmark"></i></div>
          <div class="pipeline-label blocked">Rejected</div>
        </div>
      `;
    }

    html += '</div>';
    return html;
  },

  // Toast notifications
  toast(message, type = 'info', duration = 3500) {
    const area = document.getElementById('toastArea');
    if (!area) return;

    const toastEl = document.createElement('div');
    toastEl.className = `toast ${type}`;

    const iconMap = {
      success: 'fa-circle-check',
      error: 'fa-circle-xmark',
      warn: 'fa-triangle-exclamation',
      info: 'fa-circle-info'
    };

    toastEl.innerHTML = `
      <i class="fa-solid ${iconMap[type] || 'fa-bell'}"></i>
      <div class="toast-msg">${message}</div>
      <button class="toast-close" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>
    `;

    area.appendChild(toastEl);

    setTimeout(() => {
      toastEl.classList.add('exiting');
      setTimeout(() => toastEl.remove(), 250);
    }, duration);
  },

  // Confirm dialog
  confirm(title, description, onConfirmCallback, isDanger = false) {
    const dialog = document.getElementById('confirmDialog');
    const backdrop = document.getElementById('overlayBackdrop');
    const titleEl = document.getElementById('confirmTitle');
    const descEl = document.getElementById('confirmDesc');
    const okBtn = document.getElementById('confirmOkBtn');
    const iconEl = document.getElementById('confirmIcon');

    if (!dialog) return;

    titleEl.textContent = title;
    descEl.innerHTML = description;

    if (isDanger) {
      iconEl.className = 'confirm-icon danger';
      iconEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
      okBtn.className = 'btn btn-danger';
    } else {
      iconEl.className = 'confirm-icon';
      iconEl.innerHTML = '<i class="fa-solid fa-circle-question" style="color:var(--clr-primary)"></i>';
      okBtn.className = 'btn btn-primary';
    }

    APP._pendingConfirm = onConfirmCallback;

    dialog.classList.add('visible');
    backdrop.classList.add('visible');
  },

  // Modal Panel
  openModal(title, bodyHtml, actionsHtml = '') {
    const panel = document.getElementById('modalPanel');
    const backdrop = document.getElementById('overlayBackdrop');
    document.getElementById('modalPanelTitle').innerHTML = title;
    document.getElementById('modalPanelBody').innerHTML = bodyHtml;
    document.getElementById('modalPanelActions').innerHTML = actionsHtml;

    panel.classList.add('open');
    backdrop.classList.add('visible');
  },

  closeModal() {
    const panel = document.getElementById('modalPanel');
    const backdrop = document.getElementById('overlayBackdrop');
    if (panel) panel.classList.remove('open');
    if (backdrop) backdrop.classList.remove('visible');
  }
};

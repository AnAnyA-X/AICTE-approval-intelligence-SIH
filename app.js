/**
 * AICTE APPROVAL INTELLIGENCE (SIH26262)
 * Main Application Orchestrator & Router
 */

const APP = {
  currentView: 'dashboard',
  isSidebarCollapsed: false,
  isNotifOpen: false,
  _pendingConfirm: null,

  init() {
    // Check if user session exists or default to login screen
    if (!DB.currentUser || !DB.currentUser.role) {
      this.showScreen('loginScreen');
    } else {
      this.login(DB.currentUser.role);
    }
  },

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');
  },

  login(roleKey) {
    const roleConfig = DB.rolesConfig[roleKey];
    if (!roleConfig) return;

    STORE.setCurrentRole(roleKey);

    // Update Topbar & Sidebar User Info
    document.getElementById('sbAvatar').textContent = roleConfig.avatar;
    document.getElementById('sbUserName').textContent = roleConfig.name;
    document.getElementById('sbUserRole').textContent = roleConfig.badge;
    document.getElementById('topbarAvatar').textContent = roleConfig.avatar;
    document.getElementById('topbarUserLabel').textContent = roleConfig.title;

    // Render Sidebar Navigation based on role
    this.renderSidebarNav(roleConfig.nav);

    // Update unread notification count
    this.updateNotificationBadge();

    // Show Main App Shell
    this.showScreen('mainApp');

    // Default route to dashboard
    this.navigate('dashboard');

    UTILS.toast(`Signed in as ${roleConfig.name} (${roleConfig.title})`, 'info');
  },

  resetDemoData() {
    UTILS.confirm(
      'Reset Demo Environment',
      'This will reset all synthetic applications, blockers, compliance records, and alerts back to the original clean seed state. Any newly created test records will be refreshed.',
      () => {
        STORE.resetToDefaults();
        window.DB = STORE.data;
        APP.updateNotificationBadge();
        APP.renderCurrentView();
        UTILS.toast('Demo environment reset to initial clean state', 'success');
      }
    );
  },

  logout() {
    this.showScreen('loginScreen');
    UTILS.toast('Signed out from approval intelligence system', 'info');
  },

  renderSidebarNav(navItems) {
    const sbNav = document.getElementById('sbNav');
    if (!sbNav) return;

    let html = '<div class="sb-section-label">Navigation & Workflow</div>';

    navItems.forEach(item => {
      html += `
        <button class="nav-item ${this.currentView === item.id ? 'active' : ''}" 
                id="nav-${item.id}" 
                onclick="APP.navigate('${item.id}')">
          <i class="nav-item-icon fa-solid ${item.icon}"></i>
          <span class="nav-item-label">${item.label}</span>
          ${item.badge ? `<span class="nav-badge ${item.badge === '!' ? 'warn' : ''}">${item.badge}</span>` : ''}
        </button>
      `;
    });

    sbNav.innerHTML = html;
  },

  navigate(viewId) {
    this.currentView = viewId;

    // Update Active Nav Item in Sidebar
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const activeBtn = document.getElementById(`nav-${viewId}`);
    if (activeBtn) activeBtn.classList.add('active');

    // Update Breadcrumb
    const roleConfig = DB.rolesConfig[DB.currentUser.role];
    const navItem = roleConfig?.nav.find(n => n.id === viewId);
    const viewTitle = navItem ? navItem.label : viewId.charAt(0).toUpperCase() + viewId.slice(1);

    document.getElementById('breadcrumb').innerHTML = `
      <span>AICTE Intelligence</span>
      <span class="bc-sep">/</span>
      <span class="bc-current">${viewTitle}</span>
    `;

    // Render corresponding view
    this.renderCurrentView();

    // Auto-close notifications if open
    if (this.isNotifOpen) this.toggleNotifications();
  },

  renderCurrentView() {
    const container = document.getElementById('pageArea');
    if (!container) return;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    switch (this.currentView) {
      case 'dashboard':
        VIEWS_DASHBOARD.render(container);
        break;
      case 'applications':
        VIEWS_APPLICATIONS.render(container);
        break;
      case 'compliance':
        VIEWS_COMPLIANCE.render(container);
        break;
      case 'blockers':
        VIEWS_BLOCKERS.render(container);
        break;
      case 'alerts':
        VIEWS_ALERTS.render(container);
        break;
      case 'audit':
        VIEWS_AUDIT.render(container);
        break;
      default:
        VIEWS_DASHBOARD.render(container);
    }
  },

  toggleSidebar() {
    const sb = document.getElementById('sidebar');
    if (!sb) return;

    if (window.innerWidth <= 640) {
      sb.classList.toggle('mobile-open');
    } else {
      sb.classList.toggle('collapsed');
      this.isSidebarCollapsed = sb.classList.contains('collapsed');
    }
  },

  toggleNotifications() {
    const drawer = document.getElementById('notifDrawer');
    if (!drawer) return;

    this.isNotifOpen = !this.isNotifOpen;
    drawer.classList.toggle('open', this.isNotifOpen);

    if (this.isNotifOpen) {
      this.renderNotificationDrawer();
    }
  },

  updateNotificationBadge() {
    const unread = DB.alerts.filter(a => a.status === 'unread').length;
    const badge = document.getElementById('notifBadge');
    if (badge) {
      badge.textContent = unread;
      badge.style.display = unread > 0 ? 'flex' : 'none';
    }
  },

  renderNotificationDrawer() {
    const body = document.getElementById('notifDrawerBody');
    if (!body) return;

    const alerts = DB.alerts;
    if (alerts.length === 0) {
      body.innerHTML = `
        <div class="empty-state">
          <i class="empty-state-icon fa-regular fa-bell"></i>
          <div class="empty-state-title">No notifications</div>
          <div class="empty-state-desc">You're all caught up.</div>
        </div>
      `;
      return;
    }

    body.innerHTML = alerts.map(a => `
      <div class="notif-item ${a.status === 'unread' ? 'unread' : ''}" onclick="APP.handleNotificationClick('${a.id}')">
        <div class="notif-item-dot" style="background:${a.severity === 'critical' ? 'var(--clr-danger)' : a.severity === 'high' ? 'var(--clr-warn)' : 'var(--clr-primary)'}"></div>
        <div class="notif-item-body">
          <div class="notif-item-title">${a.title}</div>
          <div class="notif-item-desc">${a.message}</div>
          <div class="notif-item-time">
            <span><i class="fa-regular fa-clock"></i> Due: ${UTILS.formatDate(a.dueDate)}</span> · 
            <span class="text-primary font-medium">${a.institution}</span>
          </div>
        </div>
      </div>
    `).join('');
  },

  handleNotificationClick(alertId) {
    const alert = DB.alerts.find(a => a.id === alertId);
    if (!alert) return;
    alert.status = 'acknowledged';
    this.updateNotificationBadge();
    this.toggleNotifications();

    if (alert.appId) {
      COMPONENTS.renderApplicationDetail(alert.appId, alert.actionableLink?.view === 'blockers' ? 'blockers' : 'overview');
    } else {
      this.navigate('alerts');
    }
  },

  markAllRead() {
    DB.alerts.forEach(a => a.status = 'acknowledged');
    this.updateNotificationBadge();
    this.renderNotificationDrawer();
    UTILS.toast('All notifications marked as read', 'info');
  },

  globalSearch(query) {
    const resultsEl = document.getElementById('globalSearchResults');
    if (!query || query.trim().length < 2) {
      resultsEl.classList.remove('visible');
      return;
    }

    const q = query.toLowerCase();
    const matches = [];

    // Search applications
    DB.applications.forEach(a => {
      if (a.refNumber.toLowerCase().includes(q) || a.institutionName.toLowerCase().includes(q) || a.course.toLowerCase().includes(q)) {
        matches.push({
          type: 'Application',
          title: a.institutionName,
          sub: `${a.refNumber} · ${a.course}`,
          action: () => COMPONENTS.renderApplicationDetail(a.id)
        });
      }
    });

    // Search blockers
    DB.applications.forEach(a => {
      (a.blockers || []).forEach(b => {
        if (b.title.toLowerCase().includes(q) || b.rootCause.toLowerCase().includes(q)) {
          matches.push({
            type: 'Blocker',
            title: b.title,
            sub: `${a.refNumber} · Prerequisite: ${b.prerequisite}`,
            action: () => COMPONENTS.renderApplicationDetail(a.id, 'blockers')
          });
        }
      });
    });

    if (matches.length === 0) {
      resultsEl.innerHTML = `<div class="p-3 text-xs text-muted">No matching applications or blockers found</div>`;
    } else {
      resultsEl.innerHTML = matches.slice(0, 6).map((m, idx) => `
        <div class="gsr-item" onclick="APP.triggerSearchMatch(${idx})">
          <div class="flex-1">
            <div class="font-semibold text-xs text-primary">${m.title}</div>
            <div class="text-xs text-subtle">${m.sub}</div>
          </div>
          <span class="badge ${m.type === 'Blocker' ? 'badge-critical' : 'badge-draft'}">${m.type}</span>
        </div>
      `).join('');
      this._searchMatches = matches;
    }

    resultsEl.classList.add('visible');
  },

  triggerSearchMatch(idx) {
    if (this._searchMatches && this._searchMatches[idx]) {
      this._searchMatches[idx].action();
      document.getElementById('globalSearchResults').classList.remove('visible');
      document.getElementById('globalSearch').value = '';
    }
  },

  closeOverlay() {
    UTILS.closeModal();
    const dialog = document.getElementById('confirmDialog');
    if (dialog) dialog.classList.remove('visible');
    this._pendingConfirm = null;
  },

  cancelConfirm() {
    this.closeOverlay();
  },

  doConfirm() {
    if (typeof this._pendingConfirm === 'function') {
      const cb = this._pendingConfirm;
      this._pendingConfirm = null;
      this.closeOverlay();
      cb();
    } else {
      this.closeOverlay();
    }
  }
};

// Global click handler to close search results dropdown when clicking outside
document.addEventListener('click', (e) => {
  const searchWrap = document.getElementById('globalSearchWrap');
  const resultsEl = document.getElementById('globalSearchResults');
  if (searchWrap && !searchWrap.contains(e.target) && resultsEl) {
    resultsEl.classList.remove('visible');
  }
});

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  APP.init();
});

/**
 * VIBE TRIBE ORGANISATION (VTO) - ADMIN CONTROLLER
 * Full management suite for dynamic services, bookings CRM, site settings, and backup.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // State
  let currentTab = 'services';
  let activeEditingServiceId = null;
  let activeViewingBookingId = null;

  // DOM Elements
  const authOverlay = document.getElementById('auth-overlay');
  const pinInput = document.getElementById('admin-pin-input');
  const pinSubmitBtn = document.getElementById('admin-pin-submit');
  const lockBtn = document.getElementById('btn-lock-session');
  const sidebar = document.getElementById('admin-sidebar');
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const pageTitle = document.getElementById('page-header-title');

  // Modals
  const serviceModal = document.getElementById('service-modal');
  const bookingDetailModal = document.getElementById('booking-detail-modal');
  const manualBookingModal = document.getElementById('manual-booking-modal');
  const pinChangeModal = document.getElementById('pin-change-modal');
  const bundleModal = document.getElementById('bundle-modal');
  const bundleForm = document.getElementById('bundle-form');

  // =========================================================================
  // 1. AUTHENTICATION & SESSION
  // =========================================================================
  function checkAuth() {
    const isAuthed = sessionStorage.getItem('vto_admin_session') === 'active';
    if (isAuthed) {
      authOverlay.classList.add('hidden');
      initDashboard();
    } else {
      authOverlay.classList.remove('hidden');
      if (pinInput) pinInput.focus();
    }
  }

  function handleLogin() {
    const entered = pinInput.value.trim();
    if (VTOData.verifyAdminPin(entered)) {
      sessionStorage.setItem('vto_admin_session', 'active');
      authOverlay.classList.add('hidden');
      pinInput.value = '';
      showToast('Admin access granted. Welcome to VTO Control Hub.', 'success');
      initDashboard();
    } else {
      showToast('Incorrect PIN. Default is 1234.', 'error');
      pinInput.value = '';
      pinInput.focus();
    }
  }

  if (pinSubmitBtn) pinSubmitBtn.addEventListener('click', handleLogin);
  if (pinInput) {
    pinInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleLogin();
    });
  }

  if (lockBtn) {
    lockBtn.addEventListener('click', () => {
      sessionStorage.removeItem('vto_admin_session');
      checkAuth();
      showToast('Portal locked securely.', 'info');
    });
  }

  // =========================================================================
  // 2. TAB ROUTING & NAVIGATION
  // =========================================================================
  function switchTab(tabId) {
    currentTab = tabId;
    
    // Update sidebar links
    sidebarLinks.forEach(link => {
      if (link.getAttribute('data-tab') === tabId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update tab panes
    tabPanes.forEach(pane => {
      if (pane.id === `tab-${tabId}`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    // Update title
    const titles = {
      dashboard: 'Dashboard & Overview',
      services: 'Services Hub & Offerings',
      bookings: 'Inquiries & Bookings CRM',
      portfolio: 'Portfolio Showcase Manager',
      'data-bundles': 'Data Bundles Reseller & Pricing',
      settings: 'Site Settings & Contact Info',
      backup: 'Data Management & Backup'
    };
    if (pageTitle) pageTitle.textContent = titles[tabId] || 'Admin Dashboard';

    // Close mobile menu if open
    if (sidebar) sidebar.classList.remove('open');

    // Refresh tab content
    renderTabContent(tabId);
  }

  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = link.getAttribute('data-tab');
      if (tabId) switchTab(tabId);
    });
  });

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  function renderTabContent(tabId) {
    if (tabId === 'dashboard') renderDashboardOverview();
    if (tabId === 'services') renderServicesList();
    if (tabId === 'bookings') renderBookingsTable();
    if (tabId === 'portfolio') renderPortfolioList();
    if (tabId === 'data-bundles') renderDataBundlesTab();
    if (tabId === 'settings') loadSettingsForm();
    updateBadges();
  }

  function updateBadges() {
    const metrics = VTOData.getMetrics();
    const serviceBadge = document.getElementById('badge-services-count');
    const bookingsBadge = document.getElementById('badge-bookings-count');
    const bundlesBadge = document.getElementById('badge-bundles-count');

    if (serviceBadge) serviceBadge.textContent = metrics.activeServices;
    if (bundlesBadge && VTOData.getDataBundles) {
      bundlesBadge.textContent = VTOData.getDataBundles(true).length;
    }
    if (bookingsBadge) {
      bookingsBadge.textContent = metrics.newBookings;
      if (metrics.newBookings > 0) {
        bookingsBadge.classList.add('alert');
      } else {
        bookingsBadge.classList.remove('alert');
      }
    }
  }

  // =========================================================================
  // 3. DASHBOARD OVERVIEW TAB
  // =========================================================================
  function renderDashboardOverview() {
    const metrics = VTOData.getMetrics();
    
    const elTotal = document.getElementById('stat-total-services');
    const elActive = document.getElementById('stat-active-services');
    const elCustom = document.getElementById('stat-custom-services');
    const elLeads = document.getElementById('stat-total-leads');
    const elNewLeads = document.getElementById('stat-new-leads');
    const elConversion = document.getElementById('stat-conversion-rate');

    if (elTotal) elTotal.textContent = metrics.totalServices;
    if (elActive) elActive.textContent = metrics.activeServices;
    if (elCustom) elCustom.textContent = metrics.customServices;
    if (elLeads) elLeads.textContent = metrics.totalBookings;
    if (elNewLeads) elNewLeads.textContent = metrics.newBookings;
    if (elConversion) elConversion.textContent = `${metrics.conversionRate}%`;

    // Render Recent Bookings in Dashboard
    const recentList = document.getElementById('dashboard-recent-bookings');
    if (recentList) {
      const bookings = VTOData.getBookings().slice(0, 5);
      if (bookings.length === 0) {
        recentList.innerHTML = `<div style="text-align:center; padding: 24px; color: var(--text-muted);">No client inquiries logged yet.</div>`;
      } else {
        recentList.innerHTML = bookings.map(b => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <div>
              <div style="font-weight: 600; color: #fff;">${escapeHtml(b.name)} <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-muted);">(${escapeHtml(b.phone)})</span></div>
              <div style="font-size: 0.8rem; color: var(--gold-glow);">${escapeHtml(b.serviceTitle)}</div>
            </div>
            <div style="text-align: right;">
              <span class="badge-status ${b.status}">${b.status.replace('_', ' ')}</span>
              <div style="font-size: 0.72rem; color: var(--text-sub); margin-top: 4px;">${formatTimeAgo(b.date)}</div>
            </div>
          </div>
        `).join('');
      }
    }

    // Render Services Popularity Distribution
    const distContainer = document.getElementById('dashboard-services-distribution');
    if (distContainer) {
      const keys = Object.keys(metrics.distribution);
      if (keys.length === 0) {
        distContainer.innerHTML = `<div style="text-align:center; padding: 24px; color: var(--text-muted);">No booking requests recorded yet.</div>`;
      } else {
        distContainer.innerHTML = keys.map(k => {
          const count = metrics.distribution[k];
          const pct = Math.round((count / metrics.totalBookings) * 100) || 0;
          return `
            <div style="margin-bottom: 14px;">
              <div style="display: flex; justify-content: space-between; font-size: 0.84rem; margin-bottom: 4px;">
                <span style="color: #fff; font-weight: 500;">${escapeHtml(k)}</span>
                <span style="color: var(--gold-primary); font-weight: 600;">${count} inquiries (${pct}%)</span>
              </div>
              <div style="background: rgba(255,255,255,0.06); height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="background: linear-gradient(90deg, var(--gold-primary), var(--indigo-primary)); height: 100%; width: ${pct}%;"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  }

  // =========================================================================
  // 4. SERVICES HUB & OFFERING MANAGER (CORE FEATURE)
  // =========================================================================
  const servicesGrid = document.getElementById('admin-services-grid');
  const serviceSearchInput = document.getElementById('service-search-input');
  const serviceFilterSelect = document.getElementById('service-filter-select');
  const btnAddNewService = document.getElementById('btn-add-new-service');
  const btnSaveService = document.getElementById('btn-save-service');
  const btnAddBullet = document.getElementById('btn-add-bullet-field');
  const bulletsContainer = document.getElementById('service-bullets-container');
  const btnAddCustomField = document.getElementById('btn-add-custom-field');
  const customFieldsContainer = document.getElementById('service-custom-fields-container');

  function renderServicesList() {
    if (!servicesGrid) return;
    const services = VTOData.getServices();
    const query = (serviceSearchInput ? serviceSearchInput.value : '').toLowerCase().trim();
    const filterCat = serviceFilterSelect ? serviceFilterSelect.value : 'all';

    let filtered = services.filter(s => {
      const matchQuery = s.title.toLowerCase().includes(query) || 
                         s.category.toLowerCase().includes(query) || 
                         s.summary.toLowerCase().includes(query);
      const matchFilter = filterCat === 'all' || 
                          (filterCat === 'active' && s.active !== false) ||
                          (filterCat === 'inactive' && s.active === false) ||
                          (filterCat === 'custom' && !s.isCore) ||
                          (filterCat === 'core' && s.isCore);
      return matchQuery && matchFilter;
    });

    if (filtered.length === 0) {
      servicesGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: var(--admin-surface-2); border-radius: var(--radius-lg); border: 1px dashed var(--admin-card-border);">
          <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
          <h4 style="color: #fff; margin-bottom: 6px;">No services matching your criteria</h4>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 16px;">Try adjusting your search terms or add a brand new service.</p>
          <button class="btn-primary-action" id="empty-state-add-btn">+ Add New Service</button>
        </div>
      `;
      const emptyAdd = document.getElementById('empty-state-add-btn');
      if (emptyAdd) emptyAdd.addEventListener('click', () => openServiceModal());
      return;
    }

    servicesGrid.innerHTML = filtered.map(s => {
      const iconSvg = VTOData.getIcon(s.iconKey || 'briefcase');
      const bulletsList = (s.bullets || []).slice(0, 4).map(b => `
        <li>
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
          <span>${escapeHtml(b)}</span>
        </li>
      `).join('');

      return `
        <div class="service-admin-card ${s.active === false ? 'inactive' : ''}" data-service-id="${s.id}">
          <div class="service-card-top">
            <div class="service-icon-badge">
              ${iconSvg}
            </div>
            <div class="service-status-toggle">
              ${s.isCore ? '<span class="badge-core-service">Core</span>' : '<span class="badge-custom-service">Custom</span>'}
              <span class="badge-status ${s.active !== false ? 'completed' : 'cancelled'}">
                ${s.active !== false ? 'Active' : 'Disabled'}
              </span>
            </div>
          </div>

          <div class="service-title-text">${escapeHtml(s.title)}</div>
          <div class="service-category-tag">${escapeHtml(s.category)} · <span style="color: var(--gold-primary);">${escapeHtml(s.badge || 'Active')}</span></div>
          
          <div class="service-desc-text">${escapeHtml(s.summary)}</div>

          <div class="service-rate-badge">💳 Rate: ${escapeHtml(s.price || 'Contact')}</div>

          <ul class="service-features-list">
            ${bulletsList || '<li style="color: var(--text-sub);">No features configured</li>'}
          </ul>

          <div class="service-card-actions">
            <button class="btn-sm-action" onclick="toggleServiceActive('${s.id}')">
              ${s.active !== false ? '⏸ Disable' : '▶ Enable'}
            </button>
            <div class="service-action-btns">
              <button class="btn-sm-action primary" onclick="editService('${s.id}')">
                ✏️ Edit
              </button>
              ${!s.isCore ? `
                <button class="btn-sm-action danger" onclick="deleteServicePrompt('${s.id}')">
                  🗑️ Delete
                </button>
              ` : `
                <button class="btn-sm-action" onclick="resetCoreServicePrompt('${s.id}')" title="Reset defaults">
                  ↺ Reset
                </button>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  if (serviceSearchInput) serviceSearchInput.addEventListener('input', renderServicesList);
  if (serviceFilterSelect) serviceFilterSelect.addEventListener('change', renderServicesList);
  if (btnAddNewService) btnAddNewService.addEventListener('click', () => openServiceModal());

  // Bullets row builder in modal
  function addBulletInputRow(value = '') {
    if (!bulletsContainer) return;
    const row = document.createElement('div');
    row.className = 'dynamic-item-row';
    row.innerHTML = `
      <input type="text" class="form-control bullet-item-input" placeholder="e.g. Free diagnostic verification & PDF report" value="${escapeHtml(value)}" required/>
      <button type="button" class="btn-icon-del" onclick="this.parentElement.remove()" title="Remove item">&times;</button>
    `;
    bulletsContainer.appendChild(row);
  }

  if (btnAddBullet) {
    btnAddBullet.addEventListener('click', () => addBulletInputRow());
  }

  // Custom Booking Form Field builder
  function addCustomFieldRow(field = { label: '', name: '', type: 'text', placeholder: '', required: true, options: [] }) {
    if (!customFieldsContainer) return;
    const row = document.createElement('div');
    row.className = 'admin-card';
    row.style.padding = '14px';
    row.style.marginBottom = '12px';
    row.style.background = 'rgba(0,0,0,0.25)';

    const optStr = (field.options || []).join(', ');

    row.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 0.8rem; font-weight: 600; color: var(--gold-primary);">Form Input Field</span>
        <button type="button" class="btn-sm-action danger" onclick="this.closest('.admin-card').remove()">&times; Remove Field</button>
      </div>
      <div class="form-grid-2">
        <div class="form-group" style="margin-bottom: 8px;">
          <label class="form-label">Client Prompt Label <span class="req">*</span></label>
          <input type="text" class="form-control field-label-input" placeholder="e.g. Student Index Number or Car Model" value="${escapeHtml(field.label)}" required/>
        </div>
        <div class="form-group" style="margin-bottom: 8px;">
          <label class="form-label">Input Type</label>
          <select class="form-control field-type-input">
            <option value="text" ${field.type === 'text' ? 'selected' : ''}>Single-line Text</option>
            <option value="select" ${field.type === 'select' ? 'selected' : ''}>Dropdown Select List</option>
            <option value="textarea" ${field.type === 'textarea' ? 'selected' : ''}>Multi-line Paragraph</option>
            <option value="date" ${field.type === 'date' ? 'selected' : ''}>Date Picker</option>
            <option value="number" ${field.type === 'number' ? 'selected' : ''}>Number / Amount</option>
          </select>
        </div>
      </div>
      <div class="form-group" style="margin-bottom: 8px;">
        <label class="form-label">Dropdown Options (Comma-separated, only if select)</label>
        <input type="text" class="form-control field-options-input" placeholder="Option 1, Option 2, Option 3" value="${escapeHtml(optStr)}"/>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <input type="checkbox" class="field-required-input" ${field.required !== false ? 'checked' : ''} id="req-${Math.random()}"/>
        <label style="font-size: 0.8rem; color: var(--text-muted);">Required field for submission</label>
      </div>
    `;
    customFieldsContainer.appendChild(row);
  }

  if (btnAddCustomField) {
    btnAddCustomField.addEventListener('click', () => addCustomFieldRow());
  }

  // Open Service Modal
  function openServiceModal(serviceId = null) {
    activeEditingServiceId = serviceId;
    const modalTitle = document.getElementById('service-modal-title');
    const form = document.getElementById('service-form');
    if (!serviceModal || !form) return;

    // Reset fields
    form.reset();
    if (bulletsContainer) bulletsContainer.innerHTML = '';
    if (customFieldsContainer) customFieldsContainer.innerHTML = '';

    if (serviceId) {
      const s = VTOData.getServiceById(serviceId);
      if (!s) return;
      if (modalTitle) modalTitle.textContent = `Edit Service: ${s.title}`;
      
      document.getElementById('service-title-input').value = s.title || '';
      document.getElementById('service-short-input').value = s.shortName || '';
      document.getElementById('service-category-input').value = s.category || '';
      document.getElementById('service-badge-input').value = s.badge || '';
      document.getElementById('service-icon-input').value = s.iconKey || 'briefcase';
      document.getElementById('service-price-input').value = s.price || '';
      document.getElementById('service-summary-input').value = s.summary || '';
      document.getElementById('service-active-input').checked = s.active !== false;

      // Populate bullets
      (s.bullets || []).forEach(b => addBulletInputRow(b));
      
      // Populate custom form fields
      (s.customFields || []).forEach(f => addCustomFieldRow(f));
    } else {
      if (modalTitle) modalTitle.textContent = 'Add New Service / Offering';
      // Add default bullets and custom field rows
      addBulletInputRow('100% Reliable & Swift Turnaround');
      addBulletInputRow('Comprehensive Consultation Included');
      addBulletInputRow('Confidential & Safe Process');

      addCustomFieldRow({
        label: 'Specific Request Details',
        name: 'details',
        type: 'textarea',
        placeholder: 'Specify key requirements or symptoms',
        required: true
      });
    }

    serviceModal.classList.add('active');
  }

  // Save Service handler
  if (btnSaveService) {
    btnSaveService.addEventListener('click', () => {
      const title = document.getElementById('service-title-input').value.trim();
      const shortName = document.getElementById('service-short-input').value.trim();
      const category = document.getElementById('service-category-input').value.trim();
      const badge = document.getElementById('service-badge-input').value.trim();
      const iconKey = document.getElementById('service-icon-input').value;
      const price = document.getElementById('service-price-input').value.trim();
      const summary = document.getElementById('service-summary-input').value.trim();
      const active = document.getElementById('service-active-input').checked;

      if (!title) {
        showToast('Please enter a service title.', 'error');
        return;
      }
      if (!summary) {
        showToast('Please provide a brief description.', 'error');
        return;
      }

      // Collect bullets
      const bulletInputs = document.querySelectorAll('.bullet-item-input');
      const bullets = [];
      bulletInputs.forEach(inp => {
        const val = inp.value.trim();
        if (val) bullets.push(val);
      });

      // Collect custom fields
      const customFieldRows = customFieldsContainer.querySelectorAll('.admin-card');
      const customFields = [];
      customFieldRows.forEach(card => {
        const label = card.querySelector('.field-label-input').value.trim();
        const type = card.querySelector('.field-type-input').value;
        const optRaw = card.querySelector('.field-options-input').value.trim();
        const req = card.querySelector('.field-required-input').checked;
        
        if (label) {
          const fieldObj = {
            label,
            name: label.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
            type,
            required: req
          };
          if (type === 'select' && optRaw) {
            fieldObj.options = optRaw.split(',').map(o => o.trim()).filter(Boolean);
          }
          customFields.push(fieldObj);
        }
      });

      const payload = {
        title,
        shortName: shortName || title.split(' ')[0],
        category: category || 'Specialized Service',
        badge: badge || 'New Offering',
        iconKey: iconKey || 'briefcase',
        price: price || 'Contact for Quote',
        summary,
        bullets,
        customFields,
        active
      };

      if (activeEditingServiceId) {
        VTOData.updateService(activeEditingServiceId, payload);
        showToast(`Service "${title}" updated successfully!`, 'success');
      } else {
        VTOData.addService(payload);
        showToast(`New service "${title}" added to site!`, 'success');
      }

      serviceModal.classList.remove('active');
      renderServicesList();
      updateBadges();
    });
  }

  // Global window functions for service actions
  window.editService = function(id) {
    openServiceModal(id);
  };

  window.toggleServiceActive = function(id) {
    const newState = VTOData.toggleServiceStatus(id);
    showToast(`Service is now ${newState ? 'Active' : 'Disabled'}.`, 'info');
    renderServicesList();
    updateBadges();
  };

  window.deleteServicePrompt = function(id) {
    const s = VTOData.getServiceById(id);
    if (!s) return;
    if (confirm(`Are you sure you want to delete the service "${s.title}"? This cannot be undone.`)) {
      VTOData.deleteService(id);
      showToast(`Service "${s.title}" deleted.`, 'success');
      renderServicesList();
      updateBadges();
    }
  };

  window.resetCoreServicePrompt = function(id) {
    if (confirm('Reset this core service to factory default specifications?')) {
      VTOData.resetToFactoryDefaults();
      showToast('Core service reset.', 'info');
      renderServicesList();
    }
  };

  // Close modals
  document.querySelectorAll('.modal-close-btn, .btn-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-modal-overlay').forEach(m => m.classList.remove('active'));
    });
  });

  // =========================================================================
  // 5. BOOKINGS & INQUIRIES CRM
  // =========================================================================
  const bookingsTableBody = document.getElementById('bookings-table-body');
  const bookingSearchInput = document.getElementById('booking-search-input');
  const bookingFilterSelect = document.getElementById('booking-filter-select');
  const btnAddManualBooking = document.getElementById('btn-add-manual-booking');
  const btnExportBookingsCsv = document.getElementById('btn-export-bookings-csv');

  function renderBookingsTable() {
    if (!bookingsTableBody) return;
    const bookings = VTOData.getBookings();
    const query = (bookingSearchInput ? bookingSearchInput.value : '').toLowerCase().trim();
    const statusFilter = bookingFilterSelect ? bookingFilterSelect.value : 'all';

    const filtered = bookings.filter(b => {
      const matchQuery = b.name.toLowerCase().includes(query) ||
                         b.phone.toLowerCase().includes(query) ||
                         b.serviceTitle.toLowerCase().includes(query) ||
                         (b.notes && b.notes.toLowerCase().includes(query));
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      return matchQuery && matchStatus;
    });

    if (filtered.length === 0) {
      bookingsTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 36px 20px; color: var(--text-muted);">
            No bookings or leads found matching the filter.
          </td>
        </tr>
      `;
      return;
    }

    bookingsTableBody.innerHTML = filtered.map(b => {
      // Format sanitized phone for WhatsApp
      const cleanPhone = b.phone.replace(/[^0-9]/g, '');
      const waMsg = encodeURIComponent(`Hello ${b.name}, thank you for reaching out to Vibe Tribe Organisation regarding "${b.serviceTitle}". We are ready to assist you!`);
      const waLink = `https://wa.me/${cleanPhone}?text=${waMsg}`;

      return `
        <tr data-booking-id="${b.id}">
          <td>
            <div class="client-name">${escapeHtml(b.name)}</div>
            <div class="client-phone">${escapeHtml(b.phone)}</div>
          </td>
          <td>
            <div style="font-weight: 500; color: #fff;">${escapeHtml(b.serviceTitle)}</div>
            <div style="font-size: 0.75rem; color: var(--text-sub);">${escapeHtml(b.source || 'Website')}</div>
          </td>
          <td>
            <span class="badge-status ${b.status}">${b.status.replace('_', ' ')}</span>
          </td>
          <td style="font-size: 0.8rem; color: var(--text-muted);">
            ${formatDateTime(b.date)}
          </td>
          <td style="max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.8rem; color: var(--text-muted);">
            ${escapeHtml(b.notes || (typeof b.details === 'object' ? JSON.stringify(b.details).substring(0, 40) + '...' : b.details || ''))}
          </td>
          <td>
            <div class="table-action-group">
              <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn-table-action whatsapp" title="Chat on WhatsApp">
                💬 WhatsApp
              </a>
              <button class="btn-table-action" onclick="viewBookingDetail('${b.id}')" title="View Full Details">
                👁️ View
              </button>
              <button class="btn-table-action" onclick="deleteBookingPrompt('${b.id}')" title="Delete Inquiry" style="color: var(--danger);">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  if (bookingSearchInput) bookingSearchInput.addEventListener('input', renderBookingsTable);
  if (bookingFilterSelect) bookingFilterSelect.addEventListener('change', renderBookingsTable);

  // View Booking Details Modal
  window.viewBookingDetail = function(id) {
    activeViewingBookingId = id;
    const bookings = VTOData.getBookings();
    const b = bookings.find(item => item.id === id);
    if (!b || !bookingDetailModal) return;

    document.getElementById('modal-client-name').textContent = b.name;
    document.getElementById('modal-client-phone').textContent = b.phone;
    document.getElementById('modal-client-service').textContent = b.serviceTitle;
    document.getElementById('modal-client-date').textContent = formatDateTime(b.date);
    document.getElementById('modal-booking-status-select').value = b.status;
    document.getElementById('modal-booking-notes').value = b.notes || '';

    // Render custom fields details
    const detailsContainer = document.getElementById('modal-booking-details-content');
    if (detailsContainer) {
      if (b.details && typeof b.details === 'object' && Object.keys(b.details).length > 0) {
        detailsContainer.innerHTML = Object.entries(b.details).map(([k, v]) => `
          <div style="margin-bottom: 10px; background: rgba(0,0,0,0.2); padding: 8px 12px; border-radius: var(--radius-sm);">
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--gold-primary); font-weight: 600;">${escapeHtml(k.replace(/_/g, ' '))}</div>
            <div style="font-size: 0.88rem; color: #fff; margin-top: 2px;">${escapeHtml(String(v))}</div>
          </div>
        `).join('');
      } else {
        detailsContainer.innerHTML = `<div style="color: var(--text-sub); font-size: 0.85rem;">No extended custom fields submitted.</div>`;
      }
    }

    // Direct WhatsApp Link inside Modal
    const cleanPhone = b.phone.replace(/[^0-9]/g, '');
    const waBtn = document.getElementById('modal-btn-whatsapp');
    if (waBtn) {
      const waMsg = encodeURIComponent(`Hello ${b.name}, thank you for reaching out to VTO regarding your request for "${b.serviceTitle}".`);
      waBtn.href = `https://wa.me/${cleanPhone}?text=${waMsg}`;
    }

    bookingDetailModal.classList.add('active');
  };

  // Save Booking Status & Notes
  const btnSaveBookingUpdate = document.getElementById('btn-save-booking-update');
  if (btnSaveBookingUpdate) {
    btnSaveBookingUpdate.addEventListener('click', () => {
      if (!activeViewingBookingId) return;
      const status = document.getElementById('modal-booking-status-select').value;
      const notes = document.getElementById('modal-booking-notes').value.trim();

      VTOData.updateBookingStatus(activeViewingBookingId, status);
      VTOData.updateBookingNotes(activeViewingBookingId, notes);

      showToast('Lead details updated successfully!', 'success');
      bookingDetailModal.classList.remove('active');
      renderBookingsTable();
      updateBadges();
    });
  }

  window.deleteBookingPrompt = function(id) {
    if (confirm('Delete this inquiry from CRM?')) {
      VTOData.deleteBooking(id);
      showToast('Inquiry removed.', 'info');
      renderBookingsTable();
      updateBadges();
    }
  };

  // Export Bookings to CSV
  if (btnExportBookingsCsv) {
    btnExportBookingsCsv.addEventListener('click', () => {
      const bookings = VTOData.getBookings();
      if (bookings.length === 0) {
        showToast('No inquiries to export.', 'info');
        return;
      }

      const headers = ['ID', 'Name', 'Phone', 'Service', 'Status', 'Date', 'Notes', 'Details'];
      const rows = bookings.map(b => [
        `"${b.id}"`,
        `"${(b.name || '').replace(/"/g, '""')}"`,
        `"${(b.phone || '').replace(/"/g, '""')}"`,
        `"${(b.serviceTitle || '').replace(/"/g, '""')}"`,
        `"${b.status}"`,
        `"${b.date}"`,
        `"${(b.notes || '').replace(/"/g, '""')}"`,
        `"${JSON.stringify(b.details || {}).replace(/"/g, '""')}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `vto_leads_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('CSV export downloaded!', 'success');
    });
  }

  // Manual Offline Lead Form
  if (btnAddManualBooking) {
    btnAddManualBooking.addEventListener('click', () => {
      if (manualBookingModal) {
        // Populate services dropdown
        const serviceSelect = document.getElementById('manual-service-select');
        if (serviceSelect) {
          const services = VTOData.getServices();
          serviceSelect.innerHTML = services.map(s => `<option value="${s.id}">${escapeHtml(s.title)}</option>`).join('');
        }
        manualBookingModal.classList.add('active');
      }
    });
  }

  const btnSaveManualBooking = document.getElementById('btn-save-manual-booking');
  if (btnSaveManualBooking) {
    btnSaveManualBooking.addEventListener('click', () => {
      const name = document.getElementById('manual-name').value.trim();
      const phone = document.getElementById('manual-phone').value.trim();
      const serviceSelect = document.getElementById('manual-service-select');
      const serviceId = serviceSelect ? serviceSelect.value : 'general';
      const serviceTitle = serviceSelect ? serviceSelect.options[serviceSelect.selectedIndex].text : 'General';
      const notes = document.getElementById('manual-notes').value.trim();

      if (!name || !phone) {
        showToast('Please provide client name and phone number.', 'error');
        return;
      }

      VTOData.addBooking({
        name,
        phone,
        serviceId,
        serviceTitle,
        status: 'new',
        source: 'Manual Admin Entry',
        notes
      });

      showToast('New booking added to CRM!', 'success');
      manualBookingModal.classList.remove('active');
      renderBookingsTable();
      updateBadges();
    });
  }

  // =========================================================================
  // 6. PORTFOLIO SHOWCASE MANAGER
  // =========================================================================
  const portfolioGrid = document.getElementById('admin-portfolio-grid');
  const btnAddPortfolio = document.getElementById('btn-add-portfolio-item');

  function renderPortfolioList() {
    if (!portfolioGrid) return;
    const items = VTOData.getPortfolio();
    if (items.length === 0) {
      portfolioGrid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color: var(--text-muted); padding: 36px;">No showcase projects added.</div>`;
      return;
    }

    portfolioGrid.innerHTML = items.map(p => `
      <div class="admin-card" style="padding: 18px; margin-bottom: 0;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <span class="badge-custom-service">${escapeHtml(p.category)}</span>
          <button class="btn-sm-action danger" onclick="deletePortfolioPrompt('${p.id}')">🗑️</button>
        </div>
        <h4 style="color: #fff; margin-bottom: 6px;">${escapeHtml(p.title)}</h4>
        <p style="font-size: 0.84rem; color: var(--text-muted); line-height: 1.4;">${escapeHtml(p.description)}</p>
      </div>
    `).join('');
  }

  window.deletePortfolioPrompt = function(id) {
    if (confirm('Delete this showcase deliverable?')) {
      VTOData.deletePortfolioItem(id);
      showToast('Showcase item removed.', 'info');
      renderPortfolioList();
    }
  };

  if (btnAddPortfolio) {
    btnAddPortfolio.addEventListener('click', () => {
      const title = prompt('Enter Project Title:');
      if (!title) return;
      const category = prompt('Enter Category (e.g. Graphics, Websites, CV Expert, Auto, Tech):', 'Graphics');
      const description = prompt('Enter Short Project Description:');

      VTOData.addPortfolioItem({
        title,
        category: category || 'Creative',
        description: description || 'High quality project delivery by VTO.'
      });

      showToast('Showcase item added!', 'success');
      renderPortfolioList();
    });
  }

  // =========================================================================
  // 6B. DATA BUNDLES RESELLER & PRICING
  // =========================================================================
  let activeBundleFilter = 'all';
  let activeEditingBundleId = null;

  const btnAddBundle = document.getElementById('btn-add-bundle');
  const btnCloseBundleModal = document.getElementById('btn-close-bundle-modal');
  const btnCancelBundle = document.getElementById('btn-cancel-bundle');
  const bundleModalTitle = document.getElementById('bundle-modal-title');
  const bundleNetworkInput = document.getElementById('bundle-network-input');
  const bundleSizeInput = document.getElementById('bundle-size-input');
  const bundlePriceInput = document.getElementById('bundle-price-input');
  const bundleValidityInput = document.getElementById('bundle-validity-input');
  const bundleTitleInput = document.getElementById('bundle-title-input');
  const bundleBadgeInput = document.getElementById('bundle-badge-input');
  const bundleDescInput = document.getElementById('bundle-desc-input');
  const bundleActiveInput = document.getElementById('bundle-active-input');
  const bundleIdInput = document.getElementById('bundle-id-input');

  function renderDataBundlesTab() {
    if (!VTOData.getDataBundles) return;
    const bundles = VTOData.getDataBundles();
    const tbody = document.getElementById('admin-bundles-table-body');
    const summaryEl = document.getElementById('admin-bundles-summary-text');
    if (!tbody) return;

    const filtered = activeBundleFilter === 'all'
      ? bundles
      : bundles.filter(b => b.network.toLowerCase() === activeBundleFilter.toLowerCase());

    if (summaryEl) {
      const activeCount = bundles.filter(b => b.active !== false).length;
      summaryEl.textContent = `Showing ${filtered.length} of ${bundles.length} plans (${activeCount} active)`;
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 32px; color: var(--text-muted);">
            No data bundles found for filter '${escapeHtml(activeBundleFilter)}'. Click '+ Add New Bundle' to create one.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(b => {
      const netLower = (b.network || 'mtn').toLowerCase();
      const statusBadge = b.active !== false
        ? `<span class="badge-status-pill success" style="cursor: pointer;" title="Click to disable" data-toggle-id="${b.id}">● Active</span>`
        : `<span class="badge-status-pill danger" style="cursor: pointer;" title="Click to enable" data-toggle-id="${b.id}">○ Disabled</span>`;

      return `
        <tr style="border-bottom: 1px solid var(--admin-card-border);">
          <td style="padding: 12px 14px;">
            <span class="net-badge badge-${netLower}">
              <span class="net-dot net-dot-${netLower}"></span>
              ${escapeHtml(b.network)}
            </span>
          </td>
          <td style="padding: 12px 14px; font-weight: 700; color: #fff;">
            ${escapeHtml(b.title || b.dataSize)}
            <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 400;">${escapeHtml(b.dataSize)}</div>
          </td>
          <td style="padding: 12px 14px; font-size: 0.84rem; color: var(--text-muted);">
            ${escapeHtml(b.validity || 'Non-Expiry')}
          </td>
          <td style="padding: 12px 14px; font-weight: 800; color: var(--gold-primary); font-size: 0.95rem;">
            GH₵ ${parseFloat(b.price || 0).toFixed(2)}
          </td>
          <td style="padding: 12px 14px;">
            ${b.badge ? `<span style="font-size: 0.7rem; background: rgba(212,168,67,0.15); border: 1px solid rgba(212,168,67,0.3); color: var(--gold-glow); padding: 2px 8px; border-radius: 4px; font-weight: 700;">${escapeHtml(b.badge)}</span>` : '<span style="color: var(--text-dim); font-size: 0.75rem;">—</span>'}
          </td>
          <td style="padding: 12px 14px;">
            ${statusBadge}
          </td>
          <td style="padding: 12px 14px; text-align: right;">
            <div style="display: inline-flex; gap: 6px;">
              <button type="button" class="btn-sm-action btn-edit-bundle" data-id="${b.id}" title="Edit pricing or details">Edit</button>
              <button type="button" class="btn-sm-action danger btn-delete-bundle" data-id="${b.id}" title="Delete bundle">✕</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row events
    tbody.querySelectorAll('[data-toggle-id]').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-toggle-id');
        VTOData.toggleBundleStatus(id);
        renderDataBundlesTab();
        updateBadges();
        showToast('Bundle status updated!', 'info');
      });
    });

    tbody.querySelectorAll('.btn-edit-bundle').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openBundleModal(id);
      });
    });

    tbody.querySelectorAll('.btn-delete-bundle').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const b = VTOData.getDataBundleById(id);
        if (confirm(`Delete bundle '${b ? b.title : id}'?`)) {
          VTOData.deleteDataBundle(id);
          renderDataBundlesTab();
          updateBadges();
          showToast('Bundle deleted successfully.', 'info');
        }
      });
    });
  }

  // Filter button handlers
  const bundleFilterButtons = document.querySelectorAll('#admin-bundle-filter-buttons button');
  bundleFilterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      bundleFilterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeBundleFilter = btn.getAttribute('data-bundle-filter') || 'all';
      renderDataBundlesTab();
    });
  });

  // Modal open / close
  function openBundleModal(bundleId = null) {
    activeEditingBundleId = bundleId;
    if (bundleId) {
      const b = VTOData.getDataBundleById(bundleId);
      if (!b) return;
      if (bundleModalTitle) bundleModalTitle.textContent = `Edit Data Bundle: ${b.network} ${b.dataSize}`;
      if (bundleIdInput) bundleIdInput.value = b.id;
      if (bundleNetworkInput) bundleNetworkInput.value = b.network || 'MTN';
      if (bundleSizeInput) bundleSizeInput.value = b.dataSize || '';
      if (bundlePriceInput) bundlePriceInput.value = b.price || '';
      if (bundleValidityInput) bundleValidityInput.value = b.validity || 'Non-Expiry';
      if (bundleTitleInput) bundleTitleInput.value = b.title || '';
      if (bundleBadgeInput) bundleBadgeInput.value = b.badge || '';
      if (bundleDescInput) bundleDescInput.value = b.description || '';
      if (bundleActiveInput) bundleActiveInput.checked = b.active !== false;
    } else {
      if (bundleModalTitle) bundleModalTitle.textContent = 'Add New Data Bundle';
      if (bundleForm) bundleForm.reset();
      if (bundleIdInput) bundleIdInput.value = '';
      if (bundleValidityInput) bundleValidityInput.value = 'Non-Expiry';
      if (bundleActiveInput) bundleActiveInput.checked = true;
    }
    if (bundleModal) bundleModal.classList.add('active');
  }

  function closeBundleModal() {
    if (bundleModal) bundleModal.classList.remove('active');
    activeEditingBundleId = null;
  }

  if (btnAddBundle) btnAddBundle.addEventListener('click', () => openBundleModal());
  if (btnCloseBundleModal) btnCloseBundleModal.addEventListener('click', closeBundleModal);
  if (btnCancelBundle) btnCancelBundle.addEventListener('click', closeBundleModal);
  if (bundleModal) {
    bundleModal.addEventListener('click', (e) => {
      if (e.target === bundleModal) closeBundleModal();
    });
  }

  // Save bundle form submit
  if (bundleForm) {
    bundleForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const network = bundleNetworkInput ? bundleNetworkInput.value : 'MTN';
      const dataSize = bundleSizeInput ? bundleSizeInput.value.trim() : '1 GB';
      const price = bundlePriceInput ? parseFloat(bundlePriceInput.value) : 5.0;
      const validity = bundleValidityInput ? bundleValidityInput.value.trim() : 'Non-Expiry';
      const title = bundleTitleInput && bundleTitleInput.value.trim() ? bundleTitleInput.value.trim() : `${network} ${dataSize}`;
      const badge = bundleBadgeInput ? bundleBadgeInput.value.trim() : '';
      const description = bundleDescInput ? bundleDescInput.value.trim() : `Instant ${network} data crediting.`;
      const active = bundleActiveInput ? bundleActiveInput.checked : true;

      if (activeEditingBundleId) {
        VTOData.updateDataBundle(activeEditingBundleId, {
          network,
          dataSize,
          price,
          validity,
          title,
          badge,
          description,
          active
        });
        showToast(`Bundle '${title}' updated successfully!`, 'success');
      } else {
        VTOData.addDataBundle({
          network,
          dataSize,
          price,
          validity,
          title,
          badge,
          description,
          active
        });
        showToast(`New bundle '${title}' added to live store!`, 'success');
      }

      closeBundleModal();
      renderDataBundlesTab();
      updateBadges();
    });
  }

  // =========================================================================
  // 7. SITE SETTINGS & CONTACT
  // =========================================================================
  function loadSettingsForm() {
    const s = VTOData.getSettings();
    const elWa = document.getElementById('setting-whatsapp');
    const elVoice = document.getElementById('setting-voice');
    const elLoc = document.getElementById('setting-location');
    const elTag = document.getElementById('setting-tagline');
    const elAnnounce = document.getElementById('setting-announcement');
    const elAnnounceActive = document.getElementById('setting-announcement-active');
    const elPaystackKey = document.getElementById('setting-paystack-key');
    const elPaystackEnabled = document.getElementById('setting-paystack-enabled');

    if (elWa) elWa.value = s.whatsappNumber || '';
    if (elVoice) elVoice.value = s.voiceNumber || '';
    if (elLoc) elLoc.value = s.location || '';
    if (elTag) elTag.value = s.tagline || '';
    if (elAnnounce) elAnnounce.value = s.announcementText || '';
    if (elAnnounceActive) elAnnounceActive.checked = s.announcementActive !== false;
    if (elPaystackKey) elPaystackKey.value = s.paystackPublicKey || '';
    if (elPaystackEnabled) elPaystackEnabled.checked = s.paystackEnabled !== false;
  }

  const btnSaveSettings = document.getElementById('btn-save-site-settings');
  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', () => {
      const elPaystackKey = document.getElementById('setting-paystack-key');
      const elPaystackEnabled = document.getElementById('setting-paystack-enabled');

      const settings = {
        whatsappNumber: document.getElementById('setting-whatsapp').value.trim(),
        whatsappDisplay: '+233 ' + document.getElementById('setting-whatsapp').value.trim().slice(-9),
        voiceNumber: document.getElementById('setting-voice').value.trim(),
        voiceDisplay: '+233 ' + document.getElementById('setting-voice').value.trim().slice(-9),
        location: document.getElementById('setting-location').value.trim(),
        tagline: document.getElementById('setting-tagline').value.trim(),
        announcementText: document.getElementById('setting-announcement').value.trim(),
        announcementActive: document.getElementById('setting-announcement-active').checked,
        paystackPublicKey: elPaystackKey ? elPaystackKey.value.trim() : '',
        paystackEnabled: elPaystackEnabled ? elPaystackEnabled.checked : true
      };

      VTOData.saveSettings(settings);
      showToast('Site settings and Paystack configuration saved!', 'success');
    });
  }

  // =========================================================================
  // 8. DATA BACKUP & RESTORE
  // =========================================================================
  const btnExportJson = document.getElementById('btn-export-full-backup');
  const btnImportJson = document.getElementById('btn-import-full-backup');
  const importFileInput = document.getElementById('import-file-input');
  const btnResetFactory = document.getElementById('btn-reset-factory-data');
  const btnChangePin = document.getElementById('btn-open-pin-change');

  if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
      const dataStr = VTOData.exportFullBackup();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vto_system_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('System JSON backup downloaded!', 'success');
    });
  }

  if (btnImportJson && importFileInput) {
    btnImportJson.addEventListener('click', () => {
      importFileInput.click();
    });

    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const res = VTOData.importFullBackup(event.target.result);
        if (res.success) {
          showToast('Data imported successfully!', 'success');
          renderTabContent(currentTab);
        } else {
          showToast('Invalid backup file: ' + res.error, 'error');
        }
      };
      reader.readAsText(file);
      importFileInput.value = '';
    });
  }

  if (btnResetFactory) {
    btnResetFactory.addEventListener('click', () => {
      if (confirm('WARNING: Reset all services, bookings, and settings to factory defaults?')) {
        VTOData.resetToFactoryDefaults();
        showToast('System reset to original factory state.', 'info');
        renderTabContent(currentTab);
        updateBadges();
      }
    });
  }

  // Change PIN modal
  if (btnChangePin && pinChangeModal) {
    btnChangePin.addEventListener('click', () => {
      pinChangeModal.classList.add('active');
    });
  }

  const btnSaveNewPin = document.getElementById('btn-save-new-pin');
  if (btnSaveNewPin) {
    btnSaveNewPin.addEventListener('click', () => {
      const current = document.getElementById('pin-current-input').value.trim();
      const newPin = document.getElementById('pin-new-input').value.trim();
      const confirmPin = document.getElementById('pin-confirm-input').value.trim();

      if (!VTOData.verifyAdminPin(current)) {
        showToast('Current PIN is incorrect.', 'error');
        return;
      }
      if (newPin.length < 4) {
        showToast('New PIN must be at least 4 characters.', 'error');
        return;
      }
      if (newPin !== confirmPin) {
        showToast('New PINs do not match.', 'error');
        return;
      }

      VTOData.setAdminPin(newPin);
      showToast('Admin Passcode successfully updated!', 'success');
      pinChangeModal.classList.remove('active');
    });
  }

  // =========================================================================
  // 9. TOAST SYSTEM & UTILITIES
  // =========================================================================
  function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;
    const icon = type === 'success' ? '✅' : (type === 'error' ? '⚠️' : 'ℹ️');
    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
    
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDateTime(isoStr) {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch(e) {
      return isoStr;
    }
  }

  function formatTimeAgo(isoStr) {
    if (!isoStr) return '';
    try {
      const diff = Date.now() - new Date(isoStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      return `${days}d ago`;
    } catch(e) {
      return '';
    }
  }

  function initDashboard() {
    switchTab('services');
  }

  // Start Auth Check
  checkAuth();
});

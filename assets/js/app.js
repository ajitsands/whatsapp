/**
 * WhatsApp Integration Platform - React 18 Application
 * Engineered by SaNDS Lab Middle East W.L.L.
 */

const { useState, useEffect, useMemo, useRef } = React;

// -----------------------------------------------------------------------------
// REUSABLE ENTERPRISE DATATABLE COMPONENT
// Supports Search, Sorting (Asc/Desc), Pagination, Page-Size, and CSV Export
// -----------------------------------------------------------------------------
function DataTable({
  columns,
  data = [],
  searchable = true,
  searchPlaceholder = 'Search records...',
  pageSizeOptions = [5, 10, 25, 50],
  defaultPageSize = 10,
  defaultSortKey = '',
  defaultSortDir = 'desc',
  title = 'export',
  actions = null,
  emptyMessage = 'No matching records found.'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [currentPage, setCurrentPage] = useState(1);
  const initialSortKey = defaultSortKey !== undefined && defaultSortKey !== ''
    ? defaultSortKey
    : (columns.find(c => c.key === 'created_at' || c.key === 'id')?.key || (columns[0]?.key || ''));
  const [sortKey, setSortKey] = useState(initialSortKey);
  const [sortDir, setSortDir] = useState(defaultSortDir);

  // Filter rows across all fields
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(row => {
      return columns.some(col => {
        const val = row[col.key];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm, columns]);

  // Sort rows (Default Descending: latest/newest first)
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const numA = Number(aVal);
      const numB = Number(bVal);
      if (!isNaN(numA) && !isNaN(numB) && typeof aVal !== 'boolean' && typeof bVal !== 'boolean' && aVal !== '' && bVal !== '') {
        return sortDir === 'asc' ? numA - numB : numB - numA;
      }

      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' })
        : String(bVal).localeCompare(String(aVal), undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [filteredData, sortKey, sortDir]);

  // Pagination calculations
  const totalEntries = sortedData.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedData = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, safeCurrentPage, pageSize]);

  const handleSort = (key, sortable = true) => {
    if (!sortable) return;
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  // CSV Export Utility
  const exportCSV = () => {
    const headerRow = columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');
    const bodyRows = sortedData.map(row => {
      return columns.map(c => {
        let val = row[c.key];
        if (val === null || val === undefined) val = '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headerRow, ...bodyRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startIdx = totalEntries === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endIdx = Math.min(safeCurrentPage * pageSize, totalEntries);

  return (
    <div className="datatable-container">
      {/* DataTable Top Controls */}
      <div className="datatable-header">
        <div className="datatable-length">
          <span>Show</span>
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
            {pageSizeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <span>entries</span>
        </div>

        <div className="datatable-tools">
          {actions}
          <button className="btn-export" onClick={exportCSV} title="Export table data to CSV file">
            <span>📥</span> Export CSV
          </button>
          {searchable && (
            <div className="datatable-search">
              <span className="datatable-search-icon">🔍</span>
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Table Canvas */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => {
                const isSorted = sortKey === col.key;
                const isSortable = col.sortable !== false;
                return (
                  <th
                    key={col.key}
                    className={`${isSortable ? 'sortable' : ''} ${isSorted ? 'sorted' : ''}`}
                    onClick={() => handleSort(col.key, isSortable)}
                    style={col.width ? { width: col.width } : {}}
                  >
                    {col.label}
                    {isSortable && (
                      <span className="sort-indicator">
                        {isSorted ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr key={row.id || rowIdx}>
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.render ? col.render(row) : (row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* DataTable Bottom Pagination */}
      <div className="datatable-footer">
        <div className="datatable-info">
          Showing {startIdx} to {endIdx} of {totalEntries} entries
          {searchTerm && ` (filtered from ${data.length} total entries)`}
        </div>

        <div className="datatable-pagination">
          <button className="page-btn" disabled={safeCurrentPage <= 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>
            ‹ Prev
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum = safeCurrentPage <= 3 ? i + 1 : safeCurrentPage + i - 2;
            if (pageNum > totalPages) pageNum = totalPages - (4 - i);
            if (pageNum < 1) pageNum = i + 1;
            if (pageNum > totalPages) return null;
            return (
              <button
                key={pageNum}
                className={`page-btn ${safeCurrentPage === pageNum ? 'active' : ''}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
          <button className="page-btn" disabled={safeCurrentPage >= totalPages} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>
            Next ›
          </button>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// BEAUTIFUL CONFIRMATION DIALOG MODAL (REPLACES BROWSER CONFIRM/ALERT POPUPS)
// -----------------------------------------------------------------------------
function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  icon = '🔄',
  badgeClass = 'primary',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isProcessing = false
}) {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={onClose} style={{ zIndex: 12000 }}>
      <div className="confirm-modal-card" onClick={e => e.stopPropagation()}>
        <div className="confirm-modal-body">
          <div className={`confirm-modal-icon-badge ${badgeClass}`}>
            <span>{icon}</span>
          </div>
          <div className="confirm-modal-title">{title}</div>
          {subtitle && (
            <div className="confirm-modal-subtitle" style={{ fontSize: '13.5px', color: '#64748B', lineHeight: '1.55', marginTop: '6px' }}>
              {subtitle}
            </div>
          )}
        </div>
        <div className="confirm-modal-actions">
          <button
            type="button"
            className="btn-confirm-cancel"
            onClick={onClose}
            disabled={isProcessing}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={badgeClass === 'danger' ? 'btn-confirm-delete' : 'btn-confirm-primary'}
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// VERSION & ARCHITECTURE INSPECTOR MODAL (V2.0 ACTIVE & V1.0 LOCKED BASELINE)
// -----------------------------------------------------------------------------
function VersionArchitectureModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="version-modal-overlay" onClick={onClose}>
      <div className="version-modal-card" onClick={e => e.stopPropagation()}>
        <div className="version-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '26px' }}>🚀</span>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: '#FFFFFF' }}>
                WhatsApp Integration Platform — Version Architecture
              </h2>
              <p style={{ fontSize: '12px', margin: '2px 0 0 0', opacity: 0.9, color: '#E8F8F5' }}>
                Engineered by SaNDS Lab Middle East W.L.L. • Enterprise Release Registry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#FFFFFF',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="version-modal-body">
          {/* Card 1: Active Version 2.1 */}
          <div className="version-card-block" style={{ borderLeft: '4px solid #3B82F6', background: '#F0F9FF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>⚡</span>
                <strong style={{ fontSize: '15px', color: '#1E3A8A' }}>Active Release: Version 2.1.0</strong>
              </div>
              <span className="version-chip" style={{ background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0' }}>
                🟢 v2.1.0 INBOUND LIVE CHAT ACTIVE
              </span>
            </div>
            <p style={{ fontSize: '12.5px', color: '#1E40AF', margin: 0, lineHeight: '1.5' }}>
              Inbound Live Chat & Two-Way Agent Inbox with 24-hour Meta Customer Care session window tracking is officially released. All upcoming modules adhere to minor versioning (<code style={{ background: '#E0F2FE', padding: '1px 5px', borderRadius: '4px', fontWeight: '600' }}>v2.x.x</code>).
            </p>
          </div>

          {/* Card 2: Locked Baseline Version 1.0 */}
          <div className="version-card-block" style={{ borderLeft: '4px solid #10B981', background: '#F0FDF4' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🔒</span>
                <strong style={{ fontSize: '15px', color: '#065F46' }}>Baseline Milestone: Version 1.0.0 (LOCKED)</strong>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span className="version-chip" style={{ background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0' }}>
                  GIT TAG: v1.0.0
                </span>
                <span className="version-chip" style={{ background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0' }}>
                  GIT TAG: v1.0
                </span>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#047857', marginBottom: '10px', lineHeight: '1.4' }}>
              <strong>Commit Hash:</strong> <code style={{ background: '#E2E8F0', padding: '1px 5px', borderRadius: '4px', color: '#0F172A' }}>9dd6ebc</code> | Production verified & deployed on <code style={{ background: '#E2E8F0', padding: '1px 5px', borderRadius: '4px', color: '#0F172A' }}>https://whatsapp.sandslab.com</code>.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', fontSize: '11.5px', color: '#065F46' }}>
              <div>✓ Superadmin RBAC Security Restrictions</div>
              <div>✓ Dual Charging Engine (Option A vs B)</div>
              <div>✓ Meta WhatsApp Cloud API v19.0 Dispatch</div>
              <div>✓ Multi-Language Odoo API Hub</div>
              <div>✓ Prepaid Wallet & BHD 3-Dec Audit Ledger</div>
              <div>✓ Enterprise DataTables (DESC Sort)</div>
            </div>
          </div>

          {/* Card 3: Minor Version Management Protocol */}
          <div className="version-card-block" style={{ background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '18px' }}>📐</span>
              <strong style={{ fontSize: '14px', color: '#0F172A' }}>Minor Version Management Protocol (SemVer 2.0.0)</strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Starting from Version 2.0, all ongoing changes are version-controlled using structured semantic numbering:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px' }}>
                <strong style={{ color: '#2563EB', fontSize: '12px' }}>v2.0.0 (MAJOR)</strong>
                <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0 0' }}>Major generation architecture shift & foundational framework upgrades.</p>
              </div>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px' }}>
                <strong style={{ color: '#059669', fontSize: '12px' }}>v2.x.0 (MINOR)</strong>
                <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0 0' }}>Scheduled roadmap feature milestones (e.g. v2.1 for Odoo Webhooks, v2.2 for Campaigns, v2.3 for Live Chat).</p>
              </div>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px' }}>
                <strong style={{ color: '#D97706', fontSize: '12px' }}>v2.x.y (PATCH)</strong>
                <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0 0' }}>Targeted bug fixes, security patches, styling polish, and maintenance hotfixes.</p>
              </div>
            </div>
          </div>

          {/* Card 4: Scheduled Version 2.0 Roadmap Checklist */}
          <div className="version-card-block" style={{ background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '18px' }}>📋</span>
              <strong style={{ fontSize: '14px', color: '#0F172A' }}>Version 2.0 Execution Roadmap (Next Development Steps)</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px' }}>
                <span className="version-chip" style={{ background: '#16A34A', color: '#FFFFFF', marginTop: '2px' }}>v2.1.0</span>
                <div>
                  <strong style={{ fontSize: '12.5px', color: '#15803D' }}>Inbound Live Chat & Two-Way Agent Inbox (Completed & Released ✅)</strong>
                  <p style={{ fontSize: '11.5px', color: '#166534', margin: '2px 0 0 0' }}>
                    Two-way conversational workspace, Meta 24-hour customer care session window tracking, canned replies, free-text replies, and simulated inbound testing.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 12px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '8px' }}>
                <span className="version-chip" style={{ background: '#0284C7', color: '#FFFFFF', marginTop: '2px' }}>v2.2.0</span>
                <div>
                  <strong style={{ fontSize: '12.5px', color: '#0369A1' }}>Odoo ERP Automated Action Webhook & Model Sync (Phase 2 — Next Priority)</strong>
                  <p style={{ fontSize: '11.5px', color: '#0C4A6E', margin: '2px 0 0 0' }}>
                    Inbound triggers for automated invoice generation, payment receipt dispatch, and real-time delivery status synchronization with Odoo ERP.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <span className="version-chip" style={{ background: '#64748B', color: '#FFFFFF', marginTop: '2px' }}>v2.3.0</span>
                <div>
                  <strong style={{ fontSize: '12.5px', color: '#334155' }}>Bulk Campaign Broadcasts & Queue Pacing (Phase 3 — Scheduled)</strong>
                  <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                    CSV contact list upload with dynamic variable mapping, segmentation, and throttled queue pacing (50 msgs/min).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            style={{ padding: '8px 20px', fontSize: '13px', fontWeight: '700' }}
          >
            Close Version Inspector
          </button>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// MAIN APP CONTAINER
// -----------------------------------------------------------------------------
function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('wa_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [loading, setLoading] = useState(!currentUser);
  const [showVersionModal, setShowVersionModal] = useState(false);

  const [globalSettings, setGlobalSettings] = useState({
    system_currency: 'BHD',
    currency_decimals: '3',
    system_date_format: 'YYYY-MM-DD HH:mm:ss',
    system_timezone: 'Asia/Bahrain',
    tariff_utility_meta: '0.0140',
    tariff_utility_platform: '0.0045',
    tariff_auth_meta: '0.0110',
    tariff_auth_platform: '0.0035',
    tariff_marketing_meta: '0.0270',
    tariff_marketing_platform: '0.0070',
    tariff_service_meta: '0.0075',
    tariff_service_platform: '0.0025',
    wallet_enforcement: '1'
  });

  const [walletBalance, setWalletBalance] = useState(0.0000);

  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '').trim();
    const saved = localStorage.getItem('wa_tab');
    const validTabs = ['dashboard', 'inbox', 'composer', 'logs', 'templates', 'api_hub', 'api_keys', 'users', 'wallet', 'settings'];
    if (hash && validTabs.includes(hash)) return hash;
    if (saved && validTabs.includes(saved)) return saved;
    return 'dashboard';
  });

  const [toast, setToast] = useState(null);
  const [inboxUnreadTotal, setInboxUnreadTotal] = useState(0);

  const navigateToTab = (tab) => {
    setActiveTab(tab);
    try {
      window.location.hash = tab;
      localStorage.setItem('wa_tab', tab);
    } catch (e) {}
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      const validTabs = ['dashboard', 'inbox', 'composer', 'logs', 'templates', 'api_hub', 'api_keys', 'users', 'wallet', 'settings'];
      if (hash && validTabs.includes(hash)) {
        setActiveTab(hash);
        localStorage.setItem('wa_tab', hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const loadGlobalSettings = async () => {
    try {
      const res = await fetch('./api/settings.php');
      const data = await res.json();
      if (data.success && data.settings) {
        setGlobalSettings(prev => ({ ...prev, ...data.settings }));
      }
    } catch (e) {}
  };

  const loadWalletBalance = async () => {
    try {
      const res = await fetch('./api/wallet.php?limit=1');
      const data = await res.json();
      if (data.success && data.wallet_balance !== undefined) {
        setWalletBalance(parseFloat(data.wallet_balance));
      }
    } catch (e) {}
  };

  useEffect(() => {
    checkAuth();
    loadGlobalSettings();
    loadWalletBalance();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const checkAuth = async () => {
    try {
      const res = await fetch('./api/auth.php?action=check', {
        headers: currentUser ? { 'X-User-Id': String(currentUser.id), 'X-User-Email': currentUser.email } : {}
      });
      const data = await res.json();
      if (data.success && data.authenticated && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('wa_user', JSON.stringify(data.user));
        loadWalletBalance();
      } else if (!currentUser) {
        setCurrentUser(null);
        localStorage.removeItem('wa_user');
      }
    } catch (e) {
      console.error('Auth check error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('wa_user', JSON.stringify(user));
    } catch (e) {}
    showToast(`Welcome back, ${user.name}!`);
    loadGlobalSettings();
    loadWalletBalance();
  };

  const handleLogout = async () => {
    try {
      await fetch('./api/auth.php?action=logout');
      setCurrentUser(null);
      localStorage.removeItem('wa_user');
      localStorage.removeItem('wa_tab');
      window.location.hash = '';
      showToast('You have been logged out.');
    } catch (e) {
      console.error(e);
    }
  };

  const switchDemoRole = async (role) => {
    try {
      const res = await fetch('./api/auth.php?action=switch_demo_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        try {
          localStorage.setItem('wa_user', JSON.stringify(data.user));
        } catch (e) {}
        showToast(`Switched to ${data.user.name} (${role.toUpperCase()})`);
        loadWalletBalance();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && !currentUser) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '12px' }}>
        <div className="brand-badge"><span className="dot"></span> Loading SaNDS Platform...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} onSwitchDemo={switchDemoRole} />;
  }

  const curr = globalSettings?.system_currency || 'BHD';
  const dec = parseInt(globalSettings?.currency_decimals || '3', 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Toast Notification Banner */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 9999,
          background: toast.type === 'error' ? '#EF4444' : '#075E54',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
          fontSize: '13px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          {toast.message}
        </div>
      )}

      {/* 2-Tier Header: Top Brand/Profile Bar + Dedicated Bottom Menu Bar */}
      <header className="app-header">
        {/* Tier 1: Brand Logo & User Profile & Live Wallet Pill */}
        <div className="header-top-bar">
          <div className="header-top-inner">
            <div className="header-brand">
              <img src="./assets/logos/SaNDSLab-LogoNewUpdated.png" alt="SaNDS Lab Middle East" className="brand-logo" />
              <div className="brand-badge">
                <span className="dot"></span> WhatsApp Gateway
              </div>
              <button
                type="button"
                className="version-pill-btn"
                onClick={() => setShowVersionModal(true)}
                title="Click to view Version Architecture, Git Tags & Future Roadmap"
              >
                <span className="version-pill-dot"></span>
                <span>v2.1.0</span>
              </button>
            </div>

            {/* Header Right Actions: Live Wallet Balance Pill & User Profile */}
            <div className="header-actions">
              {/* Clickable Wallet Balance Pill */}
              <div
                className="wallet-header-pill"
                onClick={() => navigateToTab('wallet')}
                title="Click to manage Wallet & view Billing Statement"
              >
                <span>💳</span>
                <span>Wallet: <strong>{formatCurrency(walletBalance, curr, dec)}</strong></span>
              </div>

              <div className="user-profile-pill" title={`Logged in as ${currentUser.email}`}>
                <div className="avatar" style={{ background: currentUser.avatar_color || '#128C7E' }}>
                  {currentUser.name.charAt(0)}
                </div>
                <div className="user-details">
                  <span className="user-name">{currentUser.name}</span>
                  <span className="user-role-badge">{currentUser.role}</span>
                </div>
              </div>

              <button className="btn-logout" onClick={handleLogout} title="Sign Out">
                <span>🚪</span> Logout
              </button>
            </div>
          </div>
        </div>

        {/* Tier 2: Dedicated Horizontal Menu */}
        <div className="header-nav-bar">
          <div className="header-nav-inner">
            <nav className="horizontal-nav">
              <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => navigateToTab('dashboard')}>
                <span>📊</span> Dashboard
              </button>
              <button className={`nav-item ${activeTab === 'inbox' ? 'active' : ''}`} onClick={() => navigateToTab('inbox')}>
                <span>💬</span> Live Agent Inbox
                {inboxUnreadTotal > 0 && (
                  <span style={{
                    background: '#25D366',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: '800',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    marginLeft: '6px'
                  }}>
                    {inboxUnreadTotal}
                  </span>
                )}
              </button>
              <button className={`nav-item ${activeTab === 'campaigns' ? 'active' : ''}`} onClick={() => navigateToTab('campaigns')}>
                <span>📢</span> Bulk Broadcasts
              </button>
              <button className={`nav-item ${activeTab === 'composer' ? 'active' : ''}`} onClick={() => navigateToTab('composer')}>
                <span>📤</span> Send Message
              </button>
              <button className={`nav-item ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => navigateToTab('logs')}>
                <span>📜</span> Message Logs
              </button>
              <button className={`nav-item ${activeTab === 'templates' ? 'active' : ''}`} onClick={() => navigateToTab('templates')}>
                <span>📋</span> Templates & Tariffs
              </button>
              <button className={`nav-item ${activeTab === 'wallet' ? 'active' : ''}`} onClick={() => navigateToTab('wallet')}>
                <span>💳</span> Wallet & Billing
              </button>
              <button className={`nav-item ${activeTab === 'api_hub' ? 'active' : ''}`} onClick={() => navigateToTab('api_hub')}>
                <span>⚡</span> Odoo API Hub
              </button>
              
              {/* Superadmin & Admin Only Navigation Items */}
              {['superadmin', 'admin'].includes(currentUser.role) && (
                <>
                  <button className={`nav-item ${activeTab === 'api_keys' ? 'active' : ''}`} onClick={() => navigateToTab('api_keys')}>
                    <span>🔑</span> API Keys
                  </button>
                  <button className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => navigateToTab('users')}>
                    <span>👥</span> Users
                  </button>
                  <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => navigateToTab('settings')}>
                    <span>⚙️</span> Engine Settings
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main App Body */}
      <main className="app-body">
        {activeTab === 'dashboard' && <DashboardView onNavigate={navigateToTab} globalSettings={globalSettings} />}
        {activeTab === 'inbox' && <LiveAgentInboxView currentUser={currentUser} showToast={showToast} globalSettings={globalSettings} onUnreadCountChange={setInboxUnreadTotal} onNavigate={navigateToTab} />}
        {activeTab === 'campaigns' && <CampaignsView currentUser={currentUser} showToast={showToast} globalSettings={globalSettings} onNavigate={navigateToTab} loadWalletBalance={loadWalletBalance} />}
        {activeTab === 'composer' && <ComposerView showToast={showToast} onSent={() => { navigateToTab('inbox'); loadWalletBalance(); }} globalSettings={globalSettings} />}
        {activeTab === 'logs' && <MessageLogsView showToast={showToast} globalSettings={globalSettings} onOpenInbox={(phone) => { navigateToTab('inbox'); }} />}
        {activeTab === 'templates' && <TemplatesView showToast={showToast} globalSettings={globalSettings} />}
        {activeTab === 'wallet' && <WalletView currentUser={currentUser} showToast={showToast} globalSettings={globalSettings} onBalanceChange={setWalletBalance} />}
        {activeTab === 'api_hub' && <OdooApiHubView showToast={showToast} globalSettings={globalSettings} />}
        {activeTab === 'api_keys' && <ApiKeysView showToast={showToast} />}
        {activeTab === 'users' && <UsersView currentUser={currentUser} showToast={showToast} />}
        {activeTab === 'settings' && <SettingsView currentUser={currentUser} showToast={showToast} onSettingsChange={(s) => { setGlobalSettings(prev => ({ ...prev, ...s })); loadWalletBalance(); }} />}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-left">
            All Rights Reserved | Engineered By SaNDS Lab Middle East W.L.L.
          </div>
          <div className="footer-right">
            <span
              className="footer-badge version-footer-clickable"
              onClick={() => setShowVersionModal(true)}
              title="Click to inspect Version 2.1.0 Architecture & Locked v1.0.0 Baseline"
            >
              Platform v2.1.0 (v1.0.0 Locked 🔒)
            </span>
            <span className="footer-badge">WhatsApp Cloud API v19.0</span>
            <span className="footer-badge">Odoo ERP Connector Active</span>
            <span>Bahrain (BHD) Tariff Active</span>
          </div>
        </div>
      </footer>

      {/* Interactive Version Architecture & Roadmap Modal */}
      <VersionArchitectureModal isOpen={showVersionModal} onClose={() => setShowVersionModal(false)} />
    </div>
  );
}

// -----------------------------------------------------------------------------
// 1. LOGIN VIEW
// -----------------------------------------------------------------------------
function LoginView({ onLogin, onSwitchDemo }) {
  const [email, setEmail] = useState('superadmin@sandslab.com');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submitLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('./api/auth.php?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pickPreset = (presetEmail, role) => {
    setEmail(presetEmail);
    setPassword('Password@123');
    onSwitchDemo(role);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="./assets/logos/SaNDSLab-LogoNewUpdated.png" alt="SaNDS Lab" className="login-logo" />
          <h2>WhatsApp Integration Platform</h2>
          <p>Sign in to manage messaging, templates, and Odoo ERP webhooks</p>
        </div>

        {/* 1-Click Role Presets */}
        <div className="preset-roles-box">
          <div className="preset-roles-title">⚡ Quick Sign-In by Role:</div>
          <div className="preset-buttons-row">
            <button type="button" className="btn-preset" onClick={() => pickPreset('superadmin@sandslab.com', 'superadmin')}>
              👑 Superadmin
            </button>
            <button type="button" className="btn-preset" onClick={() => pickPreset('admin@uniglobal.bh', 'admin')}>
              🛡️ Admin
            </button>
            <button type="button" className="btn-preset" onClick={() => pickPreset('user@uniglobal.bh', 'user')}>
              👤 User
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', marginBottom: '16px', fontWeight: '600' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={submitLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px', marginTop: '6px' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In to Gateway'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
          All Rights Reserved | Engineered By SaNDS Lab Middle East W.L.L.
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 2. DASHBOARD VIEW (WITH DATATABLE)
// -----------------------------------------------------------------------------
function DashboardView({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = () => {
      fetch('./api/analytics.php')
        .then(res => res.json())
        .then(res => {
          if (res.success) setData(res);
        })
        .finally(() => setLoading(false));
    };

    loadAnalytics();
    const interval = setInterval(loadAnalytics, 4000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return <div className="card">Loading real-time analytics...</div>;
  }

  if (!data) return null;

  const { kpis, categories, daily_volume, integrations } = data;

  // Integrations DataTable Columns
  const integrationColumns = [
    {
      key: 'source_system',
      label: 'Source Integration',
      render: (row) => <strong>{row.source_system}</strong>
    },
    {
      key: 'volume',
      label: 'Message Volume',
      render: (row) => <span className="badge status-read">{row.volume} msgs</span>
    },
    {
      key: 'last_activity',
      label: 'Last Activity',
      render: (row) => <span style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>{row.last_activity}</span>
    }
  ];

  return (
    <div>
      <div className="page-header-row">
        <div className="page-title-group">
          <h1><span>📊</span> Operational Dashboard & Metrics</h1>
          <p>Real-time telemetry of WhatsApp Business API throughput, delivery reliability, and billing tariffs.</p>
        </div>
        <button className="btn btn-success" onClick={() => onNavigate('composer')}>
          <span>💬</span> Send New Message
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card accent-green">
          <span className="kpi-label">Total Volume</span>
          <span className="kpi-value">{kpis.total_messages.toLocaleString()}</span>
          <span className="kpi-sub positive">
            <span>↑</span> {kpis.outbound_count} Outbound | {kpis.inbound_count} Inbound
          </span>
        </div>

        <div className="kpi-card accent-blue">
          <span className="kpi-label">Delivery Reliability</span>
          <span className="kpi-value">{kpis.delivery_rate}%</span>
          <span className="kpi-sub positive">
            <span>✓✓</span> {kpis.read_rate}% Read Rate
          </span>
        </div>

        <div className="kpi-card accent-purple">
          <span className="kpi-label">Total Billed (BHD)</span>
          <span className="kpi-value">BHD {kpis.total_client_bhd}</span>
          <span className="kpi-sub">
            Bahrain Market Official Schedule
          </span>
        </div>

        <div className="kpi-card accent-amber">
          <span className="kpi-label">Cost Breakdown</span>
          <span className="kpi-value">BHD {kpis.total_platform_bhd}</span>
          <span className="kpi-sub">
            Platform Margin | Meta Cost: BHD {kpis.total_meta_cost_bhd}
          </span>
        </div>
      </div>

      {/* Grid: Category Breakdown & Integrations DataTable */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Category Breakdown Card */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <span className="card-title"><span>🏷️</span> Message Volume by Meta Category</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {categories.map((cat, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: '700' }}>
                  <span className={`badge cat-${cat.category.toLowerCase().substring(0, 4)}`}>
                    {cat.category}
                  </span>
                  <span>{cat.message_count} msgs ({parseFloat(cat.category_billed_bhd).toFixed(4)} BHD)</span>
                </div>
                <div style={{ height: '7px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, (cat.message_count / (kpis.total_messages || 1)) * 100)}%`,
                    height: '100%',
                    background: cat.category === 'UTILITY' ? '#10B981' : cat.category === 'AUTHENTICATION' ? '#3B82F6' : cat.category === 'MARKETING' ? '#8B5CF6' : '#06B6D4'
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Integration Hub Sources DataTable */}
        <div>
          <div style={{ marginBottom: '10px', fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>
            <span>🔗</span> Active System Connectors
          </div>
          <DataTable
            columns={integrationColumns}
            data={integrations}
            title="active_integrations"
            searchPlaceholder="Search connectors..."
            defaultPageSize={5}
            pageSizeOptions={[5, 10, 20]}
          />
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 3. COMPOSER VIEW WITH REALTIME WHATSAPP PHONE PREVIEW
// -----------------------------------------------------------------------------
function ComposerView({ showToast, onSent }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [toPhone, setToPhone] = useState('+97339000000');
  const [category, setCategory] = useState('UTILITY');
  const [mediaUrl, setMediaUrl] = useState('https://erp.uniglobal.bh/INV_9941.pdf');
  const [mediaName, setMediaName] = useState('INV_9941.pdf');
  const [params, setParams] = useState(['Ahmed Al-Khalifa', 'INV/2026/0142', 'BHD 345.500', '15-Oct-2026']);
  const [customText, setCustomText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch('./api/templates.php')
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setTemplates(res.data);
          if (res.data.length > 0) {
            pickTemplate(res.data[0]);
          }
        }
      });
  }, []);

  const pickTemplate = (tmpl) => {
    setSelectedTemplate(tmpl.template_name);
    setCategory(tmpl.category);

    // Extract all variable identifiers (supports {{customer_name}}, {{1}}, etc.)
    const varMatches = tmpl.body_text ? tmpl.body_text.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) : null;
    let detectedVarNames = varMatches ? varMatches.map(m => m.replace(/[\{\}]/g, '').trim()) : [];
    if (detectedVarNames.length === 0) {
      const numMatches = tmpl.body_text ? tmpl.body_text.match(/\{+[\(\[]?\s*(\d+)\s*[\)\]]?\}+/g) : null;
      if (numMatches) {
        detectedVarNames = numMatches.map(m => m.replace(/\D/g, '').trim());
      }
    }
    const totalVars = Math.max(detectedVarNames.length, parseInt(tmpl.variable_count) || 0);

    // Parse existing sample parameters if available
    let existingParams = [];
    if (tmpl.sample_params_json) {
      try {
        const parsed = typeof tmpl.sample_params_json === 'string' ? JSON.parse(tmpl.sample_params_json) : tmpl.sample_params_json;
        if (Array.isArray(parsed)) existingParams = parsed;
      } catch (e) {}
    }

    // Build parameter input list for all detected placeholders
    const finalParams = [];
    for (let i = 0; i < totalVars; i++) {
      if (existingParams[i] !== undefined && existingParams[i] !== null && existingParams[i] !== '') {
        finalParams.push(existingParams[i]);
      } else {
        const vName = detectedVarNames[i] || `Param ${i + 1}`;
        finalParams.push(vName.includes('_') ? vName.replace(/_/g, ' ') : `Value ${i + 1}`);
      }
    }
    setParams(finalParams);

    if (tmpl.header_sample) {
      setMediaUrl(tmpl.header_sample);
      setMediaName(tmpl.header_sample.split('/').pop() || 'document.pdf');
    } else {
      setMediaUrl('');
      setMediaName('');
    }
  };

  const renderedText = useMemo(() => {
    if (!selectedTemplate) return customText || 'Type your message...';
    const tmpl = templates.find(t => t.template_name === selectedTemplate);
    if (!tmpl) return '';
    let body = tmpl.body_text;
    
    // Extract all variable names
    const varMatches = tmpl.body_text ? tmpl.body_text.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) : null;
    const detectedVarNames = varMatches ? varMatches.map(m => m.replace(/[\{\}]/g, '').trim()) : [];
    
    params.forEach((val, idx) => {
      const varName = detectedVarNames[idx] || String(idx + 1);
      const valText = val || `[${varName}]`;
      body = body.split(`{{${varName}}}`).join(valText);
      const pattern = new RegExp(`\\{+[\\(\\[]?\\s*${varName}\\s*[\\)\\]]?\\}+`, 'g');
      body = body.replace(pattern, valText);
    });
    return body;
  }, [selectedTemplate, templates, params, customText]);

  const currentTemplateObj = templates.find(t => t.template_name === selectedTemplate);

  const tariffEstimate = useMemo(() => {
    const rates = {
      'AUTHENTICATION': { meta: 0.0110, platform: 0.0035, client: 0.0145 },
      'UTILITY': { meta: 0.0140, platform: 0.0045, client: 0.0185 },
      'MARKETING': { meta: 0.0270, platform: 0.0070, client: 0.0340 },
      'SERVICE': { meta: 0.0075, platform: 0.0025, client: 0.0100 }
    };
    return rates[category] || rates['UTILITY'];
  }, [category]);

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const payload = {
        to_phone: toPhone,
        template_name: selectedTemplate || null,
        category: category,
        message: customText,
        body_parameters: params,
        header_media: mediaUrl ? { url: mediaUrl, filename: mediaName } : null,
        source_system: 'Manual Web Console'
      };

      const res = await fetch('./api/messages.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => null);
      if (data && data.success) {
        if (data.status === 'failed' && data.meta_error) {
          showToast(`Meta Error: ${data.meta_error}`, 'error');
        } else if (data.status === 'simulated') {
          showToast(`Dispatched in Simulation Mode (Enter Meta Token in Settings for Live)`, 'success');
        } else {
          showToast(`WhatsApp Message Dispatched to ${toPhone}! (Rate: ${data.tariff?.client_rate})`);
        }
        onSent();
      } else {
        showToast((data && data.error) || `Server Error (HTTP ${res.status})`, 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="page-header-row">
        <div className="page-title-group">
          <h1><span>💬</span> Interactive Message Composer</h1>
          <p>Compose pre-approved WhatsApp templates or direct customer notifications with real-time phone preview.</p>
        </div>
      </div>

      <div className="composer-layout">
        {/* Left Column: Form Controls */}
        <div className="card">
          <form onSubmit={handleSend}>
            <div className="form-group">
              <label className="form-label">Recipient Phone Number (E.164 Format)</label>
              <input
                type="text"
                className="form-input"
                value={toPhone}
                onChange={(e) => setToPhone(e.target.value)}
                placeholder="+97339000000"
                required
              />
              <span className="form-hint">Includes Bahrain country code (+973) or international destination</span>
            </div>

            <div className="form-group">
              <label className="form-label">WhatsApp Meta Template</label>
              <select
                className="form-select"
                value={selectedTemplate}
                onChange={(e) => {
                  const tmpl = templates.find(t => t.template_name === e.target.value);
                  if (tmpl) pickTemplate(tmpl);
                  else setSelectedTemplate('');
                }}
              >
                {templates.map(t => (
                  <option key={t.id} value={t.template_name}>
                    {t.display_title} [{t.category}]
                  </option>
                ))}
                <option value="">-- Custom Direct Text Message --</option>
              </select>
            </div>

            {selectedTemplate && currentTemplateObj && (
              <div className="form-group">
                <label className="form-label">Template Dynamic Parameters ({params.length} Variables)</label>
                <div className="param-grid">
                  {params.map((val, idx) => {
                    const varMatches = (currentTemplateObj.body_text || '').match(/\{\{([a-zA-Z0-9_]+)\}\}/g);
                    const detectedVarNames = varMatches ? varMatches.map(m => m.replace(/[\{\}]/g, '').trim()) : [];
                    const varName = detectedVarNames[idx] || String(idx + 1);
                    return (
                      <div key={idx}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--wa-dark-teal)' }}>
                          {varName.includes('_') ? `{{${varName}}}` : `Variable #${idx + 1}`}
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={val}
                          onChange={(e) => {
                            const newParams = [...params];
                            newParams[idx] = e.target.value;
                            setParams(newParams);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {currentTemplateObj?.header_type === 'DOCUMENT' && (
              <div className="form-group">
                <label className="form-label">PDF Invoice Attachment URL</label>
                <input
                  type="text"
                  className="form-input"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://erp.uniglobal.bh/INV_9941.pdf"
                />
              </div>
            )}

            {!selectedTemplate && (
              <div className="form-group">
                <label className="form-label">Custom Message Content</label>
                <textarea
                  className="form-textarea"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Type direct WhatsApp message here..."
                ></textarea>
              </div>
            )}

            {/* Tariff Pricing Banner */}
            <div className="tariff-estimate-banner">
              <div className="tariff-info">
                <span className="title">Category: {category}</span>
                <span className="breakdown">
                  Meta Cost: {tariffEstimate.meta.toFixed(4)} BHD | Platform Charges: +{tariffEstimate.platform.toFixed(4)} BHD
                </span>
              </div>
              <div className="tariff-rate-badge">
                BHD {tariffEstimate.client.toFixed(4)} / msg
              </div>
            </div>

            <button type="submit" className="btn btn-success" style={{ width: '100%', marginTop: '20px', padding: '12px' }} disabled={sending}>
              {sending ? 'Dispatching via Meta API...' : '🚀 Send WhatsApp Notification Now'}
            </button>
          </form>
        </div>

        {/* Right Column: Realistic WhatsApp Phone Mockup */}
        <div className="phone-mockup-wrapper">
          <div className="phone-device">
            <div className="phone-notch">
              <div className="phone-speaker"></div>
            </div>

            <div className="phone-screen">
              {/* WhatsApp Chat Header */}
              <div className="wa-chat-header">
                <div className="wa-avatar">UG</div>
                <div className="wa-user-info">
                  <div className="wa-contact-name">
                    UniGlobal Consultancy <span className="wa-verified-icon">✓</span>
                  </div>
                  <div className="wa-status-text">Official Business Account</div>
                </div>
              </div>

              {/* Chat Canvas */}
              <div className="wa-chat-body">
                <div className="wa-date-pill">TODAY</div>

                <div className="wa-bubble">
                  {currentTemplateObj?.header_type === 'DOCUMENT' && (
                    <div className="wa-bubble-doc">
                      <span>📄</span>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {mediaName || 'INV_9941.pdf'}
                        <div style={{ fontSize: '9px', color: '#4B5563' }}>PDF Document • 345 KB</div>
                      </div>
                    </div>
                  )}

                  <div style={{ whiteSpace: 'pre-line' }}>
                    {renderedText}
                  </div>

                  {currentTemplateObj?.footer_text && (
                    <div className="wa-bubble-footer">
                      {currentTemplateObj.footer_text}
                    </div>
                  )}

                  <div className="wa-bubble-meta">
                    <span>10:42 AM</span>
                    <span className="wa-ticks">✓✓</span>
                  </div>
                </div>
              </div>

              {/* Chat Dummy Input Bar */}
              <div className="wa-chat-input-bar">
                <div className="wa-dummy-input">Message</div>
                <span style={{ color: '#075E54', fontSize: '14px' }}>🎤</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 4. MESSAGE LO// -----------------------------------------------------------------------------
// 3.5. INTERACTIVE LIVE WHATSAPP CONVERSATION CHAT CONSOLE
// -----------------------------------------------------------------------------
function ConversationChatModal({ phone, onClose, showToast, globalSettings }) {
  const [thread, setThread] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const cleanPhone = phone ? phone.replace(/[^0-9\+]/g, '') : '';

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fetchThread = async (silent = false) => {
    if (!phone) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`./api/messages.php?phone=${encodeURIComponent(cleanPhone)}&order=asc&limit=100`);
      const data = await res.json();
      if (data.success) {
        setThread(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchThread(false);
  }, [phone]);

  // Real-time polling every 2 seconds while chat modal is open
  useEffect(() => {
    const interval = setInterval(() => {
      fetchThread(true);
    }, 2000);
    return () => clearInterval(interval);
  }, [phone]);

  useEffect(() => {
    scrollToBottom();
  }, [thread]);

  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch('./api/messages.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_phone: cleanPhone,
          message: replyText.trim(),
          category: 'SERVICE',
          source_system: 'Live Chat Console'
        })
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');
        fetchThread(true);
        showToast(`WhatsApp message sent to ${cleanPhone}`);
      } else {
        showToast(data.error || 'Failed to send WhatsApp message', 'error');
      }
    } catch (err) {
      showToast('Network error sending message', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  // Check if customer replied within the last 24 hours
  const hasRecentInbound = useMemo(() => {
    const inboundMsgs = thread.filter(m => m.direction === 'inbound');
    if (inboundMsgs.length === 0) return false;
    const lastInbound = inboundMsgs[inboundMsgs.length - 1];
    const diffHours = (Date.now() - new Date(lastInbound.created_at).getTime()) / (1000 * 60 * 60);
    return diffHours <= 24;
  }, [thread]);

  return (
    <div className="chat-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="chat-modal-box">
        {/* Chat Header */}
        <div className="chat-modal-header">
          <div className="chat-header-user">
            <div className="chat-avatar">
              {cleanPhone.slice(-2)}
              <span className="chat-avatar-online" title="WhatsApp Connected"></span>
            </div>
            <div className="chat-user-meta">
              <span className="chat-user-phone">{cleanPhone}</span>
              <span className="chat-user-sub">
                Official WhatsApp Gateway • {hasRecentInbound ? <span className="chat-window-pill">🟢 24h Window Active</span> : <span className="chat-window-pill" style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#FEF08A' }}>🟡 Outbound Session</span>}
              </span>
            </div>
          </div>

          <div className="chat-header-actions">
            <button className="btn-chat-close" onClick={onClose} title="Close Chat">✕</button>
          </div>
        </div>

        {/* Chat Messages Canvas */}
        <div className="chat-messages-canvas">
          <div className="chat-date-separator">
            🔒 WhatsApp Cloud API Live Conversation Thread
          </div>

          {loading && thread.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748B', padding: '30px' }}>Loading conversation history...</div>
          ) : thread.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748B', padding: '30px' }}>No messages exchanged with {cleanPhone} yet.</div>
          ) : (
            thread.map((msg, idx) => {
              const isOutbound = msg.direction === 'outbound';
              return (
                <div key={msg.id || idx} className={`chat-bubble-row ${isOutbound ? 'outbound' : 'inbound'}`}>
                  <div className="chat-bubble">
                    {msg.template_name && (
                      <span className="chat-bubble-template-tag">
                        📋 {msg.template_name} [{msg.category}]
                      </span>
                    )}

                    {msg.header_media_name && (
                      <div className="chat-bubble-media">
                        <span>📎</span>
                        <span>{msg.header_media_name}</span>
                      </div>
                    )}

                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.message_body}</div>

                    <div className="chat-bubble-footer">
                      <span>{formatDateTime(msg.created_at, globalSettings?.system_date_format)}</span>
                      {isOutbound && (
                        <span>
                          {msg.status === 'read' ? (
                            <span className="chat-tick-read" title="Read">✓✓</span>
                          ) : msg.status === 'delivered' ? (
                            <span className="chat-tick-delivered" title="Delivered">✓✓</span>
                          ) : msg.status === 'sent' ? (
                            <span title="Sent">✓</span>
                          ) : msg.status === 'failed' ? (
                            <span style={{ color: '#EF4444' }} title={msg.error_message || 'Failed'}>⚠️</span>
                          ) : (
                            <span style={{ color: '#94A3B8' }} title="Queued">⏱️</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <form onSubmit={handleSendReply} className="chat-input-bar">
          <textarea
            className="chat-textarea"
            placeholder={hasRecentInbound ? "Type a direct WhatsApp message... (Press Enter to send)" : "Type a WhatsApp reply... (Press Enter to send)"}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows="1"
          />
          <button type="submit" className="btn-chat-send" disabled={sending || !replyText.trim()} title="Send WhatsApp Message">
            {sending ? '⏳' : '➤'}
          </button>
        </form>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// SIMULATE INBOUND MESSAGE MODAL (TESTING & VERIFICATION)
// -----------------------------------------------------------------------------
function SimulateInboundModal({ isOpen, onClose, onSimulated, showToast }) {
  const [phone, setPhone] = useState('+97335078079');
  const [message, setMessage] = useState('Hello UniGlobal Support! I received my invoice and need to confirm my payment details.');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSimulate = async (e) => {
    e.preventDefault();
    if (!phone || !message.trim()) {
      showToast('Phone and message text are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('./api/inbox.php?action=simulate_inbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message: message.trim() })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Simulated customer inbound message from ${phone}! 24h window active.`);
        if (onSimulated) onSimulated(phone);
        onClose();
      } else {
        showToast(data.error || 'Failed to simulate message', 'error');
      }
    } catch (err) {
      showToast('Network error simulating message', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="version-modal-overlay" onClick={onClose}>
      <div className="version-modal-card" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
        <div className="version-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>🧪</span>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: '#FFFFFF' }}>Simulate Inbound WhatsApp Message</h3>
              <p style={{ fontSize: '11.5px', margin: '2px 0 0 0', opacity: 0.9, color: '#E8F8F5' }}>Test customer inbound reply & trigger 24h session window</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#FFFFFF', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={handleSimulate} style={{ padding: '20px' }}>
          <div className="form-group">
            <label className="form-label">Customer Mobile Phone</label>
            <input type="text" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+97335078079" required />
            <span className="form-hint">E.164 formatted international WhatsApp number.</span>
          </div>
          <div className="form-group">
            <label className="form-label">Customer Message Text</label>
            <textarea className="form-input" rows="3" value={message} onChange={e => setMessage(e.target.value)} placeholder="Type customer reply here..." required />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
              {submitting ? 'Simulating...' : '📥 Ingest Inbound Message'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 3.5 LIVE AGENT INBOX & TWO-WAY CHAT WORKSPACE (PHASE 3 / VERSION 2.1.0)
// -----------------------------------------------------------------------------
function LiveAgentInboxView({ currentUser, showToast, globalSettings, onUnreadCountChange, onNavigate }) {
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [activeThreadData, setActiveThreadData] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'active_24h'
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [cannedReplies, setCannedReplies] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [useTemplateMode, setUseTemplateMode] = useState(false);
  const [selectedTemplateName, setSelectedTemplateName] = useState('');
  const [templateParams, setTemplateParams] = useState({});
  const messagesEndRef = useRef(null);

  // Fetch threads
  const fetchThreads = async (silent = false) => {
    if (!silent) setLoadingThreads(true);
    try {
      const res = await fetch(`./api/inbox.php?action=threads&search=${encodeURIComponent(search)}&filter=${filter}`);
      const data = await res.json();
      if (data.success && data.threads) {
        setThreads(data.threads);
        const totalUnread = data.threads.reduce((acc, t) => acc + (t.unread_inbound || 0), 0);
        if (onUnreadCountChange) onUnreadCountChange(totalUnread);

        // Auto select first thread if none selected
        if (!selectedPhone && data.threads.length > 0) {
          setSelectedPhone(data.threads[0].contact_phone);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoadingThreads(false);
    }
  };

  // Fetch thread messages
  const fetchThreadMessages = async (phone, silent = false) => {
    if (!phone) return;
    if (!silent) setLoadingMessages(true);
    try {
      const res = await fetch(`./api/inbox.php?action=messages&phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (data.success) {
        setActiveThreadData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchThreads(false);
    fetch('./api/inbox.php?action=canned_replies')
      .then(res => res.json())
      .then(data => { if (data.success && data.canned_replies) setCannedReplies(data.canned_replies); });
    fetch('./api/templates.php')
      .then(res => res.json())
      .then(data => { if (data.success && data.data) setTemplates(data.data); });
  }, []);

  // When search or filter changes
  useEffect(() => {
    fetchThreads(false);
  }, [search, filter]);

  // When selected phone changes
  useEffect(() => {
    if (selectedPhone) {
      fetchThreadMessages(selectedPhone, false);
      setUseTemplateMode(false);
      setReplyText('');
    }
  }, [selectedPhone]);

  // Auto polling every 2.5 seconds
  useEffect(() => {
    if (!autoSync) return;
    const timer = setInterval(() => {
      fetchThreads(true);
      if (selectedPhone) {
        fetchThreadMessages(selectedPhone, true);
      }
    }, 2500);
    return () => clearInterval(timer);
  }, [autoSync, selectedPhone, search, filter]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThreadData?.messages]);

  // Send reply
  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    if (!selectedPhone) return;

    if (useTemplateMode) {
      if (!selectedTemplateName) {
        showToast('Please select an approved template', 'error');
        return;
      }
    } else if (!replyText.trim()) {
      return;
    }

    setSending(true);
    try {
      const payload = {
        to_phone: selectedPhone,
        phone: selectedPhone,
        recipient: selectedPhone,
        message: useTemplateMode ? '' : replyText.trim(),
        template_name: useTemplateMode ? selectedTemplateName : '',
        params: useTemplateMode ? templateParams : []
      };

      const res = await fetch('./api/inbox.php?action=send_reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');
        setUseTemplateMode(false);
        showToast(`Reply sent to ${selectedPhone}`);
        fetchThreadMessages(selectedPhone, true);
        fetchThreads(true);
      } else {
        showToast(data.error || 'Failed to dispatch reply', 'error');
      }
    } catch (err) {
      showToast('Network error sending reply', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const handleMarkRead = async () => {
    if (!selectedPhone) return;
    try {
      await fetch('./api/inbox.php?action=mark_read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: selectedPhone })
      });
      showToast('Marked thread as read');
      fetchThreads(true);
      fetchThreadMessages(selectedPhone, true);
    } catch (e) {}
  };

  const selectedThread = threads.find(t => t.contact_phone === selectedPhone);
  const is24hActive = activeThreadData?.is_24h_active ?? selectedThread?.is_24h_active ?? false;
  const hoursLeft = activeThreadData?.hours_remaining ?? selectedThread?.hours_remaining ?? 0;
  const contactName = activeThreadData?.contact_name ?? selectedThread?.contact_name ?? selectedPhone ?? 'Customer';

  return (
    <div>
      {/* Top Header Bar */}
      <div className="page-header-row" style={{ marginBottom: '16px' }}>
        <div className="page-title-group">
          <h1><span>💬</span> Inbound Live Chat & Two-Way Agent Inbox</h1>
          <p>Real-time customer care console with official Meta 24-hour conversational session window tracking and instant replies.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className={`btn ${autoSync ? 'btn-success' : 'btn-secondary'}`}
            style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setAutoSync(!autoSync)}
            title={autoSync ? 'Live Sync Active (2.5s)' : 'Live Sync Paused'}
          >
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: autoSync ? '#22C55E' : '#9CA3AF', boxShadow: autoSync ? '0 0 8px #22C55E' : 'none' }}></span>
            {autoSync ? '🟢 Live Auto-Sync Active' : '⏸️ Paused'}
          </button>
          <button
            className="btn btn-primary"
            style={{ fontSize: '12.5px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setShowSimulateModal(true)}
          >
            <span>🧪</span> Simulate Inbound
          </button>
          <button className="btn btn-secondary" onClick={() => { fetchThreads(false); if (selectedPhone) fetchThreadMessages(selectedPhone, false); }}>
            <span>🔄</span> Refresh
          </button>
        </div>
      </div>

      {/* Main 2-Panel Workspace */}
      <div className="inbox-wrapper">
        {/* Left Sidebar: Threads List */}
        <div className="inbox-sidebar">
          <div className="inbox-sidebar-header">
            <input
              type="text"
              className="inbox-search-input"
              placeholder="Search contacts, phone, text..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="inbox-filters-bar">
              <button className={`inbox-filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                All ({threads.length})
              </button>
              <button className={`inbox-filter-btn ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>
                Unread
              </button>
              <button className={`inbox-filter-btn ${filter === 'active_24h' ? 'active' : ''}`} onClick={() => setFilter('active_24h')}>
                24h Active 🟢
              </button>
            </div>
          </div>

          <div className="inbox-threads-list">
            {loadingThreads && threads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748B', fontSize: '12.5px' }}>
                Loading conversations...
              </div>
            ) : threads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748B', fontSize: '12.5px' }}>
                No conversations match this filter.
              </div>
            ) : (
              threads.map(t => {
                const isSelected = t.contact_phone === selectedPhone;
                return (
                  <div
                    key={t.contact_phone}
                    className={`inbox-thread-item ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedPhone(t.contact_phone)}
                  >
                    <div className={`inbox-thread-avatar ${t.is_24h_active ? 'online' : ''}`}>
                      {t.avatar_letter}
                    </div>
                    <div className="inbox-thread-info">
                      <div className="inbox-thread-top">
                        <span className="inbox-thread-name">{t.contact_name}</span>
                        <span className="inbox-thread-time">
                          {formatDateTime(t.latest_message?.created_at, 'HH:mm')}
                        </span>
                      </div>
                      <div className="inbox-thread-bottom">
                        <span className="inbox-thread-snippet">
                          {t.latest_message?.direction === 'inbound' ? '📥 ' : '📤 '}
                          {t.latest_message?.message_body || 'Attachment'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {t.is_24h_active ? (
                            <span style={{ fontSize: '10px', background: '#DCFCE7', color: '#166534', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }} title={`24h Window: ${t.hours_remaining}h left`}>
                              {t.hours_remaining}h
                            </span>
                          ) : (
                            <span style={{ fontSize: '10px', background: '#F1F5F9', color: '#64748B', padding: '1px 5px', borderRadius: '4px' }} title="Session Expired">
                              ⏱️
                            </span>
                          )}
                          {t.unread_inbound > 0 && (
                            <span className="inbox-unread-badge">{t.unread_inbound}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Main Pane: Conversation Chat Window */}
        <div className="inbox-main-pane">
          {!selectedPhone ? (
            <div className="inbox-pane-empty">
              <span style={{ fontSize: '48px', marginBottom: '12px' }}>💬</span>
              <strong style={{ fontSize: '16px', color: '#0F172A', marginBottom: '4px' }}>No Conversation Selected</strong>
              <p style={{ fontSize: '12.5px', maxWidth: '340px' }}>
                Select a customer conversation from the left to read live messages, or click "Simulate Inbound" to test two-way communication.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Chat Top Header */}
              <div className="inbox-chat-header">
                <div className="inbox-chat-user">
                  <div className="inbox-thread-avatar" style={{ width: '40px', height: '40px', fontSize: '13px' }}>
                    {selectedThread?.avatar_letter || 'WA'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '14.5px', color: '#0F172A' }}>{contactName}</strong>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>({selectedPhone})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                      {is24hActive ? (
                        <span className="inbox-session-pill active">
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16A34A' }}></span>
                          🟢 24h Customer Care Window Active ({hoursLeft}h left) • Free-Text Allowed (Meta Fee Waived)
                        </span>
                      ) : (
                        <span className="inbox-session-pill expired">
                          ⚠️ 24h Session Closed • Pre-Approved Template Required by Meta
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button className="btn btn-secondary btn-sm" onClick={handleMarkRead} title="Mark All Read">
                    ✓ Read
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowSimulateModal(true)} title="Simulate reply from this customer">
                    🧪 Simulate Reply
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => onNavigate && onNavigate('logs')} title="View In Message Telemetry">
                    📜 Telemetry
                  </button>
                </div>
              </div>

              {/* Chat Messages Canvas */}
              <div className="inbox-chat-canvas">
                <div style={{ textAlign: 'center', margin: '6px 0' }}>
                  <span style={{ background: '#FFFFFF', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', color: '#64748B', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                    🔒 Official WhatsApp Cloud API End-to-End Encrypted Session
                  </span>
                </div>

                {loadingMessages && (!activeThreadData || activeThreadData.messages?.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>Loading messages...</div>
                ) : activeThreadData?.messages?.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>No messages exchanged yet. Send a greeting to start!</div>
                ) : (
                  activeThreadData?.messages?.map((msg, idx) => {
                    const isOutbound = msg.direction === 'outbound';
                    return (
                      <div key={msg.id || idx} className={`inbox-bubble-row ${isOutbound ? 'outbound' : 'inbound'}`}>
                        <div className={`inbox-bubble ${isOutbound ? 'outbound' : 'inbound'}`}>
                          {msg.template_name && (
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#0369A1', marginBottom: '3px' }}>
                              📋 {msg.template_name} [{msg.category}]
                            </div>
                          )}
                          {msg.header_media_name && (
                            <div style={{ fontSize: '11.5px', fontWeight: '600', color: '#059669', marginBottom: '4px' }}>
                              📎 [{msg.header_media_name}]
                            </div>
                          )}
                          <div style={{ whiteSpace: 'pre-wrap' }}>{msg.message_body}</div>
                          <div className="inbox-bubble-footer">
                            <span>{formatDateTime(msg.created_at, globalSettings?.system_date_format || 'HH:mm')}</span>
                            {isOutbound && (
                              <span>
                                {msg.status === 'read' ? (
                                  <span style={{ color: '#0284C7', fontWeight: '800' }}>✓✓</span>
                                ) : msg.status === 'delivered' ? (
                                  <span style={{ color: '#64748B', fontWeight: '800' }}>✓✓</span>
                                ) : msg.status === 'sent' ? (
                                  <span>✓</span>
                                ) : msg.status === 'failed' ? (
                                  <span style={{ color: '#EF4444' }} title={msg.error_message || 'Failed'}>⚠️</span>
                                ) : (
                                  <span>⏱️</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Canned Replies Bar */}
              <div className="inbox-canned-bar">
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', alignSelf: 'center', marginRight: '4px' }}>
                  ⚡ Quick:
                </span>
                {cannedReplies.map(cr => (
                  <button
                    key={cr.id}
                    type="button"
                    className="inbox-canned-chip"
                    onClick={() => {
                      setReplyText(cr.text);
                      setUseTemplateMode(false);
                    }}
                    title={cr.text}
                  >
                    {cr.title}
                  </button>
                ))}
              </div>

              {/* Bottom Composer Area */}
              <div className="inbox-composer-area">
                {!is24hActive && !useTemplateMode ? (
                  <div style={{ flex: 1, background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#92400E' }}>
                      ⚠️ <strong>24h Customer Service Window Closed.</strong> Meta requires an approved template to re-engage this contact.
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setUseTemplateMode(true)}
                    >
                      📋 Select Approved Template
                    </button>
                  </div>
                ) : useTemplateMode ? (
                  <div style={{ flex: 1, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '12.5px', color: '#0F172A' }}>📋 Dispatch Approved WhatsApp Template</strong>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setUseTemplateMode(false)}>✕ Switch to Free Text</button>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <select
                        className="form-input"
                        style={{ flex: 1, padding: '7px 10px', fontSize: '12.5px' }}
                        value={selectedTemplateName}
                        onChange={e => setSelectedTemplateName(e.target.value)}
                      >
                        <option value="">-- Choose Template --</option>
                        {templates.map(t => (
                          <option key={t.template_name} value={t.template_name}>
                            {t.display_title || t.template_name} ({t.category})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: '8px 18px', fontSize: '12.5px', fontWeight: '700' }}
                        disabled={sending || !selectedTemplateName}
                        onClick={handleSendReply}
                      >
                        {sending ? 'Sending...' : '🚀 Send Template'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <textarea
                      className="inbox-textarea"
                      placeholder="Type a direct WhatsApp message... (Press Enter to send, Shift+Enter for new line)"
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows="1"
                    />
                    <button
                      type="button"
                      className="inbox-btn-send"
                      disabled={sending || !replyText.trim()}
                      onClick={handleSendReply}
                      title="Send WhatsApp Message"
                    >
                      {sending ? '⏳' : '➤'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simulate Inbound Modal */}
      <SimulateInboundModal
        isOpen={showSimulateModal}
        onClose={() => setShowSimulateModal(false)}
        onSimulated={(phone) => {
          setSelectedPhone(phone);
          fetchThreads(true);
          fetchThreadMessages(phone, true);
        }}
        showToast={showToast}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// 3.5 BROADCAST CAMPAIGNS & QUEUE PACING VIEW (v2.2.0)
// -----------------------------------------------------------------------------
function CampaignsView({ currentUser, showToast, globalSettings, onNavigate, loadWalletBalance }) {
  const [campaigns, setCampaigns] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [inspectCampaignId, setInspectCampaignId] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const fetchCampaigns = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('./api/campaigns.php?action=list');
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('./api/templates.php');
      const data = await res.json();
      if (data.success && data.data) {
        setTemplates(data.data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchCampaigns(false);
    fetchTemplates();
  }, []);

  // Check if any campaign is currently running
  const runningCampaign = useMemo(() => {
    return campaigns.find(c => c.status === 'running') || null;
  }, [campaigns]);

  // Active Queue Processor loop
  useEffect(() => {
    if (!runningCampaign) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('./api/campaigns.php?action=process_batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaign_id: runningCampaign.id, batch_size: 5 })
        });
        const data = await res.json();
        if (data.success) {
          fetchCampaigns(true);
          if (loadWalletBalance) loadWalletBalance();
          if (data.status === 'completed') {
            showToast(`Campaign "${runningCampaign.name}" broadcast completed!`, 'success');
          }
        }
      } catch (err) {}
    }, 2500);

    return () => clearInterval(interval);
  }, [runningCampaign]);

  const handleStartCampaign = async (id) => {
    setProcessingId(id);
    try {
      const res = await fetch('./api/campaigns.php?action=process_batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: id, batch_size: 5 })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Campaign queue started! Processing recipients...', 'success');
        fetchCampaigns(true);
      } else {
        showToast(data.error || 'Failed to start campaign', 'error');
      }
    } catch (e) {
      showToast('Network error', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handlePauseCampaign = async (id) => {
    try {
      const res = await fetch('./api/campaigns.php?action=pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: id })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Campaign paused');
        fetchCampaigns(true);
      }
    } catch (e) {}
  };

  const handleCancelCampaign = (id) => {
    setConfirmDialog({
      title: 'Cancel Broadcast Campaign?',
      subtitle: 'Are you sure you want to cancel this broadcast? Any unsent recipients remaining in the queue will be halted.',
      icon: '🛑',
      badgeClass: 'danger',
      confirmText: 'Yes, Cancel Broadcast',
      cancelText: 'Keep Running',
      onConfirm: async () => {
        try {
          const res = await fetch('./api/campaigns.php?action=cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ campaign_id: id })
          });
          const data = await res.json();
          if (data.success) {
            showToast('Campaign cancelled');
            fetchCampaigns(true);
          }
        } catch (e) {
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleRerunCampaign = (id) => {
    const targetCamp = campaigns.find(c => c.id === id);
    const campName = targetCamp ? `"${targetCamp.name}"` : 'this campaign';
    const recCount = targetCamp?.total_recipients || 'all';

    setConfirmDialog({
      title: 'Re-run Broadcast Campaign?',
      subtitle: `Reset the broadcast queue for ${campName} and re-dispatch official template messages to ${recCount} recipients via Meta Cloud API?`,
      icon: '🔄',
      badgeClass: 'primary',
      confirmText: 'Yes, Re-broadcast Now',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const res = await fetch('./api/campaigns.php?action=rerun', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ campaign_id: id })
          });
          const data = await res.json();
          if (data.success) {
            showToast('Campaign queue reset. Starting Meta broadcast...', 'success');
            await fetchCampaigns(true);
            handleStartCampaign(id);
          } else {
            showToast(data.error || 'Failed to re-run campaign', 'error');
          }
        } catch (e) {
          showToast('Error re-running campaign', 'error');
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  };

  const columns = [
    {
      key: 'name',
      label: 'Campaign Details',
      sortable: true,
      render: (c) => (
        <div>
          <div style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--text-color)' }}>{c.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            <span>📋 {c.template_title || c.template_name}</span> • <span className={`badge category-${c.category?.toLowerCase()}`}>{c.category}</span>
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Created: {formatDateTime(c.created_at, globalSettings?.system_date_format)}
          </div>
        </div>
      )
    },
    {
      key: 'pace_per_minute',
      label: 'Queue Pacing',
      sortable: true,
      render: (c) => (
        <div>
          <span style={{ fontWeight: '700', color: '#0369A1' }}>⏱️ {c.pace_per_minute} msgs/min</span>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Anti-spam rate</div>
        </div>
      )
    },
    {
      key: 'progress_percent',
      label: 'Broadcast Progress',
      sortable: true,
      render: (c) => (
        <div style={{ minWidth: '140px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: '700', marginBottom: '3px' }}>
            <span>{c.sent_count + c.failed_count} / {c.total_recipients}</span>
            <span>{c.progress_percent}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${c.progress_percent}%`,
              height: '100%',
              background: c.status === 'completed' ? '#10B981' : c.status === 'running' ? 'linear-gradient(90deg, #10B981, #0284C7)' : '#94A3B8',
              borderRadius: '4px',
              transition: 'width 0.3s ease'
            }} />
          </div>
          {c.failed_count > 0 && (
            <div style={{ fontSize: '10px', color: '#EF4444', marginTop: '2px' }}>⚠️ {c.failed_count} failed</div>
          )}
        </div>
      )
    },
    {
      key: 'delivery_rate',
      label: 'Delivery & Reads',
      sortable: true,
      render: (c) => (
        <div>
          <div style={{ fontSize: '12px' }}><strong>✓✓ {c.delivery_rate}%</strong> Delivered ({c.delivered_count})</div>
          <div style={{ fontSize: '11.5px', color: '#0284C7', marginTop: '2px' }}><strong>✓✓ {c.read_rate}%</strong> Read ({c.read_count})</div>
        </div>
      )
    },
    {
      key: 'actual_cost',
      label: 'Total Spend',
      sortable: true,
      render: (c) => (
        <div>
          <strong style={{ color: 'var(--text-color)' }}>{formatCurrency(c.actual_cost, globalSettings?.system_currency, globalSettings?.currency_decimals)}</strong>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Est: {formatCurrency(c.estimated_cost, globalSettings?.system_currency, globalSettings?.currency_decimals)}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (c) => {
        const statusMap = {
          completed: { label: '✓ Completed', cls: 'status-read', bg: '#DCFCE7', color: '#166534' },
          running: { label: '● Running', cls: 'status-sent', bg: '#DBEAFE', color: '#1E40AF' },
          paused: { label: '⏸ Paused', cls: 'status-queued', bg: '#FEF3C7', color: '#92400E' },
          draft: { label: '📝 Draft', cls: 'status-queued', bg: '#F1F5F9', color: '#475569' },
          cancelled: { label: '✕ Cancelled', cls: 'status-failed', bg: '#FEE2E2', color: '#991B1B' }
        };
        const s = statusMap[c.status] || statusMap.draft;
        return (
          <span style={{
            background: s.bg,
            color: s.color,
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '700',
            textTransform: 'uppercase'
          }}>
            {s.label}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (c) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setInspectCampaignId(c.id)}
            title="Inspect Recipients Log"
          >
            👁️ Inspect
          </button>
          {c.status === 'draft' && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={processingId === c.id}
              onClick={() => handleStartCampaign(c.id)}
              title="Start Broadcast"
            >
              🚀 Launch
            </button>
          )}
          {c.status === 'running' && (
            <button
              type="button"
              className="btn btn-warning btn-sm"
              onClick={() => handlePauseCampaign(c.id)}
              title="Pause Queue"
            >
              ⏸ Pause
            </button>
          )}
          {c.status === 'paused' && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => handleStartCampaign(c.id)}
              title="Resume Queue"
            >
              ▶ Resume
            </button>
          )}
          {c.status === 'completed' && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={processingId === c.id}
              onClick={() => handleRerunCampaign(c.id)}
              title="Re-run broadcast to all recipients via Meta Cloud API"
            >
              🔄 Re-run
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="campaigns-view-container">
      {/* Top Header & Launch Button */}
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📢</span> Bulk Broadcast Campaigns
          </h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            Schedule mass WhatsApp campaigns with CSV contact mapping and anti-spam queue pacing.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fetchCampaigns(false)}
            title="Refresh List"
          >
            🔄 Refresh
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowWizard(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>🚀</span> Create Broadcast Campaign
          </button>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="campaigns-stats-grid">
        <div className="campaign-stat-card">
          <div className="campaign-stat-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>📢</div>
          <div className="campaign-stat-info">
            <span className="campaign-stat-label">Total Campaigns</span>
            <span className="campaign-stat-val">{summary?.total_campaigns || 0}</span>
            <span className="campaign-stat-sub">Active broadcast programs</span>
          </div>
        </div>

        <div className="campaign-stat-card">
          <div className="campaign-stat-icon" style={{ background: '#F0FDF4', color: '#16A34A' }}>👥</div>
          <div className="campaign-stat-info">
            <span className="campaign-stat-label">Total Audience</span>
            <span className="campaign-stat-val">{summary?.total_recipients || 0}</span>
            <span className="campaign-stat-sub">{summary?.total_sent || 0} dispatched</span>
          </div>
        </div>

        <div className="campaign-stat-card">
          <div className="campaign-stat-icon" style={{ background: '#ECFDF5', color: '#059669' }}>✓✓</div>
          <div className="campaign-stat-info">
            <span className="campaign-stat-label">Delivery Success</span>
            <span className="campaign-stat-val">{summary?.overall_delivery_rate || 0}%</span>
            <span className="campaign-stat-sub">{summary?.total_delivered || 0} verified delivered</span>
          </div>
        </div>

        <div className="campaign-stat-card">
          <div className="campaign-stat-icon" style={{ background: '#F5F3FF', color: '#7C3AED' }}>👁️</div>
          <div className="campaign-stat-info">
            <span className="campaign-stat-label">Average Read Rate</span>
            <span className="campaign-stat-val">{summary?.overall_read_rate || 0}%</span>
            <span className="campaign-stat-sub">{summary?.total_read || 0} customer reads</span>
          </div>
        </div>
      </div>

      {/* Live Broadcast Monitor (If a campaign is actively running) */}
      {runningCampaign && (
        <div className="campaign-live-monitor">
          <div className="monitor-header">
            <div className="monitor-title">
              <span className="monitor-pulse-dot" />
              <span>Broadcasting: {runningCampaign.name}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-warning btn-sm"
                onClick={() => handlePauseCampaign(runningCampaign.id)}
              >
                ⏸ Pause Queue
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => handleCancelCampaign(runningCampaign.id)}
              >
                ✕ Cancel
              </button>
            </div>
          </div>

          <div className="campaign-progress-bar-wrap">
            <div
              className="campaign-progress-bar-fill"
              style={{ width: `${runningCampaign.progress_percent}%` }}
            />
          </div>

          <div className="monitor-meta-grid">
            <div>📈 Progress: <strong>{runningCampaign.sent_count + runningCampaign.failed_count} / {runningCampaign.total_recipients} ({runningCampaign.progress_percent}%)</strong></div>
            <div>⏱️ Pacing Rate: <strong>{runningCampaign.pace_per_minute} messages/min</strong></div>
            <div>📋 Template: <strong>{runningCampaign.template_title || runningCampaign.template_name}</strong></div>
            <div>💳 Total Spent: <strong>{formatCurrency(runningCampaign.actual_cost, globalSettings?.system_currency, globalSettings?.currency_decimals)}</strong></div>
          </div>
        </div>
      )}

      {/* Main Campaigns DataTable */}
      <div className="card">
        <DataTable
          columns={columns}
          data={campaigns}
          searchPlaceholder="Search campaigns by name, template, status..."
          defaultSortKey="id"
          defaultSortDir="desc"
          emptyMessage="No broadcast campaigns created yet. Click 'Create Broadcast Campaign' to launch your first mass WhatsApp announcement."
        />
      </div>

      {/* Create Campaign Wizard Modal */}
      {showWizard && (
        <NewCampaignWizardModal
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          templates={templates}
          globalSettings={globalSettings}
          currentUser={currentUser}
          showToast={showToast}
          onCampaignCreated={(newId) => {
            setShowWizard(false);
            fetchCampaigns(false);
            handleStartCampaign(newId);
          }}
        />
      )}

      {/* Inspect Campaign Report Modal */}
      {inspectCampaignId && (
        <CampaignReportModal
          campaignId={inspectCampaignId}
          onClose={() => setInspectCampaignId(null)}
          globalSettings={globalSettings}
          showToast={showToast}
          onRerun={handleRerunCampaign}
        />
      )}

      {/* Attractive Modern Confirmation Popup Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={!!confirmDialog}
          title={confirmDialog.title}
          subtitle={confirmDialog.subtitle}
          icon={confirmDialog.icon}
          badgeClass={confirmDialog.badgeClass}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          onClose={() => setConfirmDialog(null)}
          onConfirm={confirmDialog.onConfirm}
        />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// NEW CAMPAIGN WIZARD MODAL
// -----------------------------------------------------------------------------
function NewCampaignWizardModal({ isOpen, onClose, templates, globalSettings, currentUser, showToast, onCampaignCreated }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedTemplateName, setSelectedTemplateName] = useState(templates[0]?.template_name || 'offer_sandslab');
  const [headerMediaUrl, setHeaderMediaUrl] = useState('');
  const [headerMediaName, setHeaderMediaName] = useState('');
  const [pacePerMinute, setPacePerMinute] = useState(50);
  const [rawText, setRawText] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [csvColumns, setCsvColumns] = useState([]);
  const [creating, setCreating] = useState(false);

  const selectedTemplate = useMemo(() => {
    return templates.find(t => t.template_name === selectedTemplateName) || templates[0] || null;
  }, [templates, selectedTemplateName]);

  useEffect(() => {
    if (selectedTemplate && selectedTemplate.header_sample) {
      setHeaderMediaUrl(selectedTemplate.header_sample);
      setHeaderMediaName(selectedTemplate.header_sample.split('/').pop() || 'header_image.jpg');
    }
  }, [selectedTemplate]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        processCsvText(text);
      }
    };
    reader.readAsText(file);
  };

  const processCsvText = (text) => {
    setRawText(text);
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;

    const firstLineCols = lines[0].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
    setCsvColumns(firstLineCols);

    const startIdx = firstLineCols[0].toLowerCase().includes('phone') ? 1 : 0;
    const parsed = [];

    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (!parts[0]) continue;
      parsed.push({
        phone: parts[0],
        name: parts[1] || '',
        variables: parts.slice(2)
      });
    }

    setRecipients(parsed);
    if (parsed.length > 0) {
      setStep(3);
    }
  };

  const handleManualParse = () => {
    if (!rawText.trim()) {
      showToast('Please paste recipient records or upload a CSV file', 'error');
      return;
    }
    processCsvText(rawText);
  };

  const handleLaunch = async () => {
    if (!name.trim()) {
      showToast('Please enter a campaign name', 'error');
      setStep(1);
      return;
    }
    if (recipients.length === 0) {
      showToast('Please provide at least one valid recipient', 'error');
      setStep(2);
      return;
    }

    setCreating(true);
    try {
      const payload = {
        name: name.trim(),
        template_name: selectedTemplateName,
        pace_per_minute: pacePerMinute,
        header_media_url: headerMediaUrl || null,
        header_media_name: headerMediaName || null,
        recipients: recipients
      };

      const res = await fetch('./api/campaigns.php?action=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Broadcast campaign "${name}" created with ${data.total_recipients} recipients!`, 'success');
        onCampaignCreated(data.campaign_id);
      } else {
        showToast(data.error || 'Failed to create campaign', 'error');
      }
    } catch (err) {
      showToast('Network error creating campaign', 'error');
    } finally {
      setCreating(false);
    }
  };

  const clientRate = parseFloat(selectedTemplate?.client_rate_bhd || 0.0340);
  const estimatedTotalCost = recipients.length * clientRate;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '780px', width: '95%' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📢</span> Create Broadcast Campaign
          </h3>
          <button type="button" className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Wizard Steps Indicator */}
        <div className="wizard-steps-indicator" style={{ padding: '0 24px 16px 24px', margin: '16px 0' }}>
          <div className={`wizard-step-node ${step === 1 ? 'active' : ''}`} onClick={() => setStep(1)} style={{ cursor: 'pointer' }}>
            <span className="step-num">1</span> Template & Info
          </div>
          <div className={`wizard-step-node ${step === 2 ? 'active' : ''}`} onClick={() => setStep(2)} style={{ cursor: 'pointer' }}>
            <span className="step-num">2</span> Upload Recipients
          </div>
          <div className={`wizard-step-node ${step === 3 ? 'active' : ''}`} onClick={() => setStep(3)} style={{ cursor: 'pointer' }}>
            <span className="step-num">3</span> Column Mapping & Preview
          </div>
          <div className={`wizard-step-node ${step === 4 ? 'active' : ''}`} onClick={() => setStep(4)} style={{ cursor: 'pointer' }}>
            <span className="step-num">4</span> Pacing & Launch
          </div>
        </div>

        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto', padding: '0 24px' }}>
          {/* STEP 1: CAMPAIGN DETAILS & TEMPLATE */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Campaign Title <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. October Partner Special Promo Blast"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Select Approved WhatsApp Template <span style={{ color: '#EF4444' }}>*</span></label>
                <select
                  className="form-select"
                  value={selectedTemplateName}
                  onChange={e => setSelectedTemplateName(e.target.value)}
                >
                  {templates.map(t => (
                    <option key={t.template_name} value={t.template_name}>
                      {t.display_title || t.template_name} [{t.category}] • Rate: {t.client_rate_bhd} BHD ({t.variable_count} variables)
                    </option>
                  ))}
                </select>
              </div>

              {/* Template Live Preview Card */}
              {selectedTemplate && (
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '13px', color: '#0369A1' }}>
                      📋 Template Preview: {selectedTemplate.display_title}
                    </span>
                    <span className={`badge category-${selectedTemplate.category?.toLowerCase()}`}>
                      {selectedTemplate.category}
                    </span>
                  </div>

                  {selectedTemplate.header_sample && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#059669', background: '#ECFDF5', padding: '6px 10px', borderRadius: '6px' }}>
                      <span>🖼️ Header Media:</span>
                      <a href={selectedTemplate.header_sample} target="_blank" rel="noreferrer" style={{ color: '#059669', textDecoration: 'underline' }}>
                        {selectedTemplate.header_sample.split('/').pop()}
                      </a>
                    </div>
                  )}

                  <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: '12px',
                    whiteSpace: 'pre-wrap',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    fontFamily: 'inherit'
                  }}>
                    {selectedTemplate.body_text}
                  </div>

                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Requires <strong>{selectedTemplate.variable_count} dynamic variable(s)</strong> per contact row.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: CSV UPLOAD / RECIPIENTS */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '13.5px' }}>Upload Contact Audience</span>
                <a
                  href={`./api/campaigns.php?action=sample_csv&template_name=${encodeURIComponent(selectedTemplateName)}`}
                  className="btn btn-secondary btn-sm"
                  download
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  📥 Download Sample CSV
                </a>
              </div>

              {/* Drag and Drop Zone */}
              <label className="csv-upload-dropzone">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>📂</div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-color)' }}>
                  Click to select CSV File or Drag & Drop here
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Supports CSV with international phone numbers and parameters
                </div>
              </label>

              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700' }}>
                — OR PASTE RECIPIENT DATA BELOW —
              </div>

              <div className="form-group">
                <textarea
                  className="form-textarea"
                  rows="4"
                  placeholder={`phone,name,param_1,param_2\n+97335078079,Ali Al-Hassan,Valued Partner,+97317008899\n+97339000001,Ahmed Al-Khalifa,Executive,+97317008899`}
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '12.5px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    One contact per line (Comma separated)
                  </span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleManualParse}>
                    ⚡ Parse Records
                  </button>
                </div>
              </div>

              {recipients.length > 0 && (
                <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>✓</span> Successfully parsed <strong>{recipients.length} recipients</strong> ready for broadcast!
                </div>
              )}
            </div>
          )}

          {/* STEP 3: COLUMN MAPPING & PREVIEW */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: '700', fontSize: '14px' }}>Audience Dynamic Preview</span>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Found <strong>{recipients.length} recipients</strong>. Previewing first 3 rows with template parameters:
                  </div>
                </div>
              </div>

              {/* Sample Previews */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recipients.slice(0, 3).map((r, idx) => (
                  <div key={idx} style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: '12px 14px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12.5px' }}>
                      <span><strong>Recipient #{idx + 1}:</strong> <code style={{ color: '#0369A1' }}>{r.phone}</code> {r.name && `(${r.name})`}</span>
                      <span className="badge badge-success" style={{ fontSize: '10px' }}>Valid</span>
                    </div>
                    <div style={{ background: '#F8FAFC', padding: '8px 10px', borderRadius: '6px', fontSize: '12px', color: '#334155' }}>
                      <strong>Substituted Variables:</strong> {r.variables && r.variables.length > 0 ? r.variables.map((v, i) => `{{${i+1}}}: "${v}"`).join(', ') : 'None'}
                    </div>
                  </div>
                ))}
              </div>

              {recipients.length > 3 && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  ... and {recipients.length - 3} more recipients queued.
                </div>
              )}
            </div>
          )}

          {/* STEP 4: PACING & BUDGET REVIEW */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ fontWeight: '700', fontSize: '13.5px', marginBottom: '8px', display: 'block' }}>
                  Anti-Spam Dispatch Queue Pacing
                </label>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
                  Throttle broadcast dispatch rate to stay within Meta Cloud API tier limits and protect your phone number reputation.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div
                    className={`pace-option-card ${pacePerMinute === 20 ? 'selected' : ''}`}
                    onClick={() => setPacePerMinute(20)}
                  >
                    <div style={{ fontWeight: '700', color: '#047857', fontSize: '14px' }}>🐢 Conservative</div>
                    <div style={{ fontSize: '12px', fontWeight: '800', margin: '4px 0' }}>20 msgs / min</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Safe for new numbers</div>
                  </div>

                  <div
                    className={`pace-option-card ${pacePerMinute === 50 ? 'selected' : ''}`}
                    onClick={() => setPacePerMinute(50)}
                  >
                    <div style={{ fontWeight: '700', color: '#0369A1', fontSize: '14px' }}>⚡ Standard</div>
                    <div style={{ fontSize: '12px', fontWeight: '800', margin: '4px 0' }}>50 msgs / min</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Meta Tier 1 recommended</div>
                  </div>

                  <div
                    className={`pace-option-card ${pacePerMinute === 100 ? 'selected' : ''}`}
                    onClick={() => setPacePerMinute(100)}
                  >
                    <div style={{ fontWeight: '700', color: '#7C3AED', fontSize: '14px' }}>🚀 Turbo</div>
                    <div style={{ fontSize: '12px', fontWeight: '800', margin: '4px 0' }}>100 msgs / min</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Meta Tier 2+ high volume</div>
                  </div>
                </div>
              </div>

              {/* Budget Calculation Summary Card */}
              <div style={{
                background: '#F0FDF4',
                border: '1px solid #86EFAC',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#166534', borderBottom: '1px solid #BBF7D0', paddingBottom: '6px' }}>
                  💳 Financial Budget Breakdown
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Total Recipients:</span>
                  <strong>{recipients.length} contacts</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Template Client Rate ({selectedTemplate?.category}):</span>
                  <strong>{formatCurrency(clientRate, globalSettings?.system_currency, globalSettings?.currency_decimals)} / msg</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '800', color: '#166534', borderTop: '1px solid #BBF7D0', paddingTop: '6px' }}>
                  <span>Estimated Total Budget:</span>
                  <span>{formatCurrency(estimatedTotalCost, globalSettings?.system_currency, globalSettings?.currency_decimals)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px' }}>
          <div>
            {step > 1 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(step - 1)}
                disabled={creating}
              >
                ← Back
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={creating}>
              Cancel
            </button>
            {step < 4 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (step === 1 && !name.trim()) {
                    showToast('Please enter a campaign name', 'error');
                    return;
                  }
                  if (step === 2 && recipients.length === 0) {
                    showToast('Please upload or paste recipient contacts', 'error');
                    return;
                  }
                  setStep(step + 1);
                }}
              >
                Next Step →
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleLaunch}
                disabled={creating}
                style={{ background: '#059669', borderColor: '#059669' }}
              >
                {creating ? 'Creating Broadcast...' : '🚀 Launch Broadcast Now'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// CAMPAIGN REPORT MODAL
// -----------------------------------------------------------------------------
function CampaignReportModal({ campaignId, onClose, globalSettings, showToast, onRerun }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`./api/campaigns.php?action=details&id=${campaignId}`)
      .then(res => res.json())
      .then(d => {
        if (d.success) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [campaignId]);

  const campaign = data?.campaign;
  const recipients = data?.recipients || [];

  const recipientColumns = [
    { key: 'recipient_phone', label: 'Recipient Phone', sortable: true, render: r => <strong>{r.recipient_phone}</strong> },
    { key: 'contact_name', label: 'Contact Name', sortable: true, render: r => r.contact_name || '-' },
    {
      key: 'status',
      label: 'Dispatch Status',
      sortable: true,
      render: r => (
        <div>
          <span className={`badge status-${r.status}`}>
            {r.status === 'read' ? '✓✓ Read' : r.status === 'delivered' ? '✓✓ Delivered' : r.status === 'sent' ? '✓ Dispatched' : r.status === 'failed' ? '⚠️ Failed' : r.status}
          </span>
          {r.error_message && (
            <div style={{ fontSize: '10px', color: '#EF4444', marginTop: '2px', wordBreak: 'break-word', maxWidth: '280px' }}>
              {r.error_message}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'cost_deducted',
      label: 'Debited Tariff',
      sortable: true,
      render: r => formatCurrency(r.cost_deducted, globalSettings?.system_currency, globalSettings?.currency_decimals)
    },
    {
      key: 'sent_at',
      label: 'Sent Timestamp',
      sortable: true,
      render: r => formatDateTime(r.sent_at || r.created_at, globalSettings?.system_date_format)
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '850px', width: '95%' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📊</span> Campaign Report: {campaign?.name || 'Loading...'}
          </h3>
          <button type="button" className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>Loading campaign report...</div>
          ) : campaign ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Campaign summary card */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '14px 18px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Template</div>
                  <strong style={{ fontSize: '13px' }}>{campaign.template_title || campaign.template_name}</strong>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Audience</div>
                  <strong style={{ fontSize: '13px' }}>{campaign.total_recipients} recipients</strong>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sent / Failed</div>
                  <strong style={{ fontSize: '13px', color: '#16A34A' }}>{campaign.sent_count} sent</strong> • <span style={{ color: '#EF4444' }}>{campaign.failed_count} failed</span>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Actual Spend</div>
                  <strong style={{ fontSize: '13px' }}>{formatCurrency(campaign.actual_cost, globalSettings?.system_currency, globalSettings?.currency_decimals)}</strong>
                </div>
              </div>

              {/* Recipients DataTable */}
              <DataTable
                columns={recipientColumns}
                data={recipients}
                searchPlaceholder="Search recipient phone, contact name, status..."
                defaultSortKey="id"
                defaultSortDir="asc"
                title={`campaign_${campaign.id}_recipients`}
                emptyMessage="No recipients found for this campaign."
              />
            </div>
          ) : null}
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {campaign?.status === 'completed' && onRerun && (
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  onClose();
                  onRerun(campaign.id);
                }}
              >
                <span>🔄</span> Re-broadcast Campaign
              </button>
            )}
          </div>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 4. MESSAGE LOGS VIEW (WITH DATATABLE & LIVE CONVERSATIONS)
// -----------------------------------------------------------------------------
function MessageLogsView({ showToast, globalSettings, onOpenInbox }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  const [activeChatPhone, setActiveChatPhone] = useState(null);
  const [autoSync, setAutoSync] = useState(true);
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' (Inbox/Threads) or 'raw' (Full Telemetry Log)

  const fetchLogs = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const url = `./api/messages.php?status=${statusFilter}&category=${categoryFilter}&limit=100`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(false);
  }, [statusFilter, categoryFilter]);

  // Real-time automatic polling every 2.5 seconds
  useEffect(() => {
    if (!autoSync) return;
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 2500);
    return () => clearInterval(interval);
  }, [autoSync, statusFilter, categoryFilter]);

  const simulateStatus = async (msgId, newStatus) => {
    try {
      const res = await fetch('./api/messages.php', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: msgId, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Message status updated to ${newStatus.toUpperCase()}`);
        fetchLogs(true);
      }
    } catch (e) {
      showToast('Error updating status', 'error');
    }
  };

  // Group messages by contact phone number (Latest message per conversation)
  const groupedConversations = useMemo(() => {
    const map = new Map();
    for (const m of messages) {
      const contactPhone = (m.direction === 'inbound' ? m.from_phone : m.to_phone) || m.to_phone || m.from_phone;
      if (!contactPhone) continue;

      if (!map.has(contactPhone)) {
        map.set(contactPhone, {
          ...m,
          contact_phone: contactPhone,
          total_count: 1,
          has_inbound: m.direction === 'inbound',
          unread_inbound: (m.direction === 'inbound' && m.status !== 'read') ? 1 : 0
        });
      } else {
        const entry = map.get(contactPhone);
        entry.total_count += 1;
        if (m.direction === 'inbound') {
          entry.has_inbound = true;
          if (m.status !== 'read') entry.unread_inbound += 1;
        }
      }
    }
    return Array.from(map.values());
  }, [messages]);

  // Column definitions for Grouped Conversations (Latest message per phone)
  const conversationColumns = [
    {
      key: 'contact_phone',
      label: 'Contact / Recipient',
      render: (c) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '700', fontSize: '13.5px', color: '#0F172A' }}>{c.contact_phone}</span>
            <span className="badge" style={{ background: '#E0F2FE', color: '#0369A1', fontSize: '11px', padding: '2px 7px', fontWeight: '600' }}>
              {c.total_count} {c.total_count === 1 ? 'msg' : 'msgs'}
            </span>
            {c.has_inbound && (
              <span className="badge" style={{ background: '#DCFCE7', color: '#15803D', fontSize: '10.5px', padding: '2px 6px' }}>
                🟢 2-Way Active
              </span>
            )}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {c.source_system} • {c.direction === 'inbound' ? '📥 Last Inbound' : '📤 Last Outbound'}
          </div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (c) => (
        <span className={`badge cat-${(c.category || 'SERVICE').toLowerCase().substring(0, 4)}`}>
          {c.category}
        </span>
      )
    },
    {
      key: 'message_body',
      label: 'Latest Message Preview',
      render: (c) => (
        <div style={{ maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.message_body}>
          <span style={{ marginRight: '6px', opacity: 0.85 }}>
            {c.direction === 'inbound' ? '📥' : '📤'}
          </span>
          {c.header_media_name && <span style={{ marginRight: '4px', fontWeight: '600' }}>📎 [{c.header_media_name}]</span>}
          <span>{c.message_body}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Latest Status',
      render: (c) => (
        <div>
          <span className={`badge status-${c.status}`} style={{ transition: 'all 0.3s ease' }}>
            {c.status === 'read' ? '✓✓ Read' : c.status === 'delivered' ? '✓✓ Delivered' : c.status === 'sent' ? '✓ Sent' : c.status.toUpperCase()}
          </span>
          {c.status === 'failed' && c.error_message && (
            <div style={{ fontSize: '10px', color: '#EF4444', marginTop: '3px', maxWidth: '200px', whiteSpace: 'normal', lineHeight: '1.2' }}>
              ⚠️ {c.error_message}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'client_rate_bhd',
      label: 'Latest Rate (BHD)',
      render: (c) => (
        <div>
          <strong>{parseFloat(c.client_rate_bhd || 0).toFixed(4)} BHD</strong>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            Meta: {parseFloat(c.meta_cost_bhd || 0).toFixed(4)}
          </div>
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Last Message Time',
      render: (c) => (
        <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
          {formatDateTime(c.created_at, globalSettings?.system_date_format)}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (c) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="btn btn-success btn-sm"
            style={{ padding: '5px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '700' }}
            onClick={() => setActiveChatPhone(c.contact_phone)}
            title={`Open Full WhatsApp Chat History with ${c.contact_phone}`}
          >
            <span>💬</span> Open Chat ({c.total_count})
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setSelectedLog(c)} title="Inspect Latest Payload">
            Inspect
          </button>
        </div>
      )
    }
  ];

  // DataTable Column Definitions for Raw Individual Logs
  const logColumns = [
    {
      key: 'to_phone',
      label: 'Recipient / Source',
      render: (m) => (
        <div>
          <div><strong>{m.direction === 'inbound' ? m.from_phone : m.to_phone}</strong></div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {m.direction === 'inbound' ? '📥 WhatsApp Inbound' : `📤 ${m.source_system}`}
          </div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (m) => (
        <span className={`badge cat-${m.category.toLowerCase().substring(0, 4)}`}>
          {m.category}
        </span>
      )
    },
    {
      key: 'message_body',
      label: 'Message Content',
      render: (m) => (
        <div style={{ maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {m.header_media_name && <span style={{ marginRight: '4px' }}>📎 [{m.header_media_name}]</span>}
          {m.message_body}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (m) => (
        <div>
          <span className={`badge status-${m.status}`} style={{ transition: 'all 0.3s ease' }}>
            {m.status === 'read' ? '✓✓ Read' : m.status === 'delivered' ? '✓✓ Delivered' : m.status === 'sent' ? '✓ Sent' : m.status.toUpperCase()}
          </span>
          {m.status === 'failed' && m.error_message && (
            <div style={{ fontSize: '10px', color: '#EF4444', marginTop: '3px', maxWidth: '220px', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.2' }}>
              ⚠️ {m.error_message}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'client_rate_bhd',
      label: 'Client Rate (BHD)',
      render: (m) => (
        <div>
          <strong>{parseFloat(m.client_rate_bhd).toFixed(4)} BHD</strong>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            Meta: {parseFloat(m.meta_cost_bhd).toFixed(4)} | Platform: +{parseFloat(m.platform_charge_bhd).toFixed(4)}
          </div>
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Timestamp',
      render: (m) => (
        <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
          {formatDateTime(m.created_at, globalSettings?.system_date_format)}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (m) => {
        const chatPhone = m.direction === 'inbound' ? m.from_phone : m.to_phone;
        return (
          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              className="btn btn-success btn-sm"
              style={{ padding: '4px 9px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => setActiveChatPhone(chatPhone)}
              title={`Open Live WhatsApp Chat with ${chatPhone}`}
            >
              <span>💬</span> Chat
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedLog(m)} title="Inspect Payload">
              Inspect
            </button>
            {m.status !== 'read' && (
              <button className="btn btn-primary btn-sm" onClick={() => simulateStatus(m.message_id, 'read')} title="Mark Read">
                ✓ Read
              </button>
            )}
          </div>
        );
      }
    }
  ];

  const customFilterBar = (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
      {/* View Mode Toggle */}
      <div className="view-mode-toggle">
        <button
          type="button"
          className={`view-mode-btn ${viewMode === 'grouped' ? 'active' : ''}`}
          onClick={() => setViewMode('grouped')}
          title="Group conversations by Phone Number (Shows latest message with full chat history on click)"
        >
          <span>💬 Conversations</span>
          <span className="count-badge">{groupedConversations.length}</span>
        </button>
        <button
          type="button"
          className={`view-mode-btn ${viewMode === 'raw' ? 'active' : ''}`}
          onClick={() => setViewMode('raw')}
          title="Show raw individual message logs and telemetry audit trail"
        >
          <span>📜 Raw Logs</span>
          <span className="count-badge">{messages.length}</span>
        </button>
      </div>

      <select className="form-select" style={{ width: '135px', padding: '5px 8px', fontSize: '12px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
        <option value="all">All Statuses</option>
        <option value="read">Read (✓✓ Blue)</option>
        <option value="delivered">Delivered (✓✓ Grey)</option>
        <option value="sent">Sent (✓ Single)</option>
        <option value="queued">Queued</option>
        <option value="failed">Failed</option>
      </select>
      <select className="form-select" style={{ width: '145px', padding: '5px 8px', fontSize: '12px' }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
        <option value="all">All Categories</option>
        <option value="UTILITY">Utility (Invoices)</option>
        <option value="AUTHENTICATION">Authentication (OTP)</option>
        <option value="MARKETING">Marketing (Promo)</option>
        <option value="SERVICE">Service (Support)</option>
      </select>
    </div>
  );

  return (
    <div>
      <div className="page-header-row">
        <div className="page-title-group">
          <h1><span>📜</span> Message Telemetry & Conversations</h1>
          <p>
            {viewMode === 'grouped'
              ? 'Grouped active WhatsApp conversations with latest message previews and instant chat consoles.'
              : 'Audit trail of all individual inbound and outbound WhatsApp messages, lifecycle, and billing tariffs.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className={`btn ${autoSync ? 'btn-success' : 'btn-secondary'}`}
            style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setAutoSync(!autoSync)}
            title={autoSync ? 'Live Sync Active (Polling every 2.5s)' : 'Click to enable Auto Sync'}
          >
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: autoSync ? '#22C55E' : '#9CA3AF', boxShadow: autoSync ? '0 0 8px #22C55E' : 'none' }}></span>
            {autoSync ? '🟢 Live Auto-Sync Active' : '⏸️ Live Sync Paused'}
          </button>
          <button className="btn btn-secondary" onClick={() => fetchLogs(false)}>
            <span>🔄</span> Refresh Now
          </button>
        </div>
      </div>

      {/* Main DataTable */}
      {viewMode === 'grouped' ? (
        <DataTable
          columns={conversationColumns}
          data={groupedConversations}
          title="whatsapp_conversations"
          searchPlaceholder="Search phone or latest message..."
          defaultPageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
          defaultSortKey="created_at"
          defaultSortDir="desc"
          actions={customFilterBar}
          emptyMessage={loading ? 'Loading conversations...' : 'No conversations found matching criteria.'}
        />
      ) : (
        <DataTable
          columns={logColumns}
          data={messages}
          title="whatsapp_messages_log"
          searchPlaceholder="Search phone, wamid, content..."
          defaultPageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
          defaultSortKey="created_at"
          defaultSortDir="desc"
          actions={customFilterBar}
          emptyMessage={loading ? 'Loading telemetry logs...' : 'No messages found matching criteria.'}
        />
      )}

      {/* Live Conversation Chat Modal */}
      {activeChatPhone && (
        <ConversationChatModal
          phone={activeChatPhone}
          onClose={() => {
            setActiveChatPhone(null);
            fetchLogs(true);
          }}
          showToast={showToast}
          globalSettings={globalSettings}
        />
      )}

      {/* Inspect Modal */}
      {selectedLog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div className="card" style={{ width: '600px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                <span>🔍</span> Message Payload Inspection
              </span>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedLog(null)}>✕ Close</button>
            </div>
            <div className="code-box">
              <pre>{JSON.stringify(selectedLog, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 5. TEMPLATES & TARIFFS VIEW (WITH DATATABLE)
// -----------------------------------------------------------------------------
function TemplatesView({ showToast }) {
  const [templates, setTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const loadTemplates = () => {
    fetch('./api/templates.php')
      .then(res => res.json())
      .then(res => { if (res.success) setTemplates(res.data); });
  };

  useEffect(() => { loadTemplates(); }, []);

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!editingTemplate.template_name || !editingTemplate.body_text) {
      showToast('Template Key and Body Text are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('./api/templates.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTemplate)
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Template saved successfully!');
        setEditingTemplate(null);
        loadTemplates();
      } else {
        showToast(data.error || 'Failed to save template', 'error');
      }
    } catch (err) {
      showToast('Network error saving template', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = (id, name) => {
    setConfirmDialog({
      title: 'Delete WhatsApp Template?',
      subtitle: `Are you sure you want to permanently remove template "${name}" from your catalog?`,
      icon: '🗑️',
      badgeClass: 'danger',
      confirmText: 'Yes, Delete Template',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const res = await fetch(`./api/templates.php?id=${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            showToast('Template deleted successfully');
            loadTemplates();
          } else {
            showToast(data.error || 'Failed to delete template', 'error');
          }
        } catch (err) {
          showToast('Error deleting template', 'error');
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  };

  // Tariff calculation for modal preview
  const modalTariffs = {
    AUTHENTICATION: { meta: 0.0110, platform: 0.0035, client: 0.0145 },
    UTILITY:        { meta: 0.0140, platform: 0.0045, client: 0.0185 },
    MARKETING:      { meta: 0.0270, platform: 0.0070, client: 0.0340 },
    SERVICE:        { meta: 0.0075, platform: 0.0025, client: 0.0100 }
  };
  const activeTariff = editingTemplate ? (modalTariffs[editingTemplate.category] || modalTariffs.UTILITY) : modalTariffs.UTILITY;

  // Variable counter for preview (supports {{customer_name}}, {{1}}, {(1)}, {1}, etc.)
  const varCount = editingTemplate && editingTemplate.body_text
    ? (editingTemplate.body_text.match(/\{\{([a-zA-Z0-9_]+)\}\}/g)
        ? new Set(editingTemplate.body_text.match(/\{\{([a-zA-Z0-9_]+)\}\}/g).map(s => s.replace(/[\{\}]/g, '').trim())).size
        : (editingTemplate.body_text.match(/\{+[\(\[]?\s*(\d+)\s*[\)\]]?\}+/g)
            ? new Set(editingTemplate.body_text.match(/\{+[\(\[]?\s*(\d+)\s*[\)\]]?\}+/g).map(s => parseInt(s.replace(/\D/g, ''), 10))).size
            : 0))
    : 0;

  const templateColumns = [
    {
      key: 'display_title',
      label: 'Template Title & Key',
      render: (t) => (
        <div>
          <div><strong>{t.display_title}</strong></div>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--wa-teal)' }}>{t.template_name}</div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (t) => <span className={`badge cat-${t.category.toLowerCase().substring(0, 4)}`}>{t.category}</span>
    },
    {
      key: 'header_type',
      label: 'Header Type',
      render: (t) => <span style={{ fontSize: '11px', fontWeight: '700' }}>{t.header_type}</span>
    },
    {
      key: 'body_text',
      label: 'Body Format',
      render: (t) => <div style={{ maxWidth: '280px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>{t.body_text}</div>
    },
    {
      key: 'meta_cost_bhd',
      label: 'Meta Cost',
      render: (t) => <span>{parseFloat(t.meta_cost_bhd).toFixed(4)} BHD</span>
    },
    {
      key: 'platform_charge_bhd',
      label: 'Platform Charges',
      render: (t) => <span style={{ color: 'var(--wa-dark-teal)', fontWeight: '700' }}>+{parseFloat(t.platform_charge_bhd).toFixed(4)} BHD</span>
    },
    {
      key: 'client_rate_bhd',
      label: 'Client Rate',
      render: (t) => (
        <strong style={{ color: 'var(--wa-teal)', fontSize: '13px' }}>
          {parseFloat(t.client_rate_bhd).toFixed(4)} BHD
        </strong>
      )
    },
    {
      key: 'meta_status',
      label: 'Meta Status',
      render: (t) => <span className="badge status-read">APPROVED</span>
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (t) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setEditingTemplate({ ...t })}
            title="Edit Template"
          >
            ✏️ Edit
          </button>
          <button
            className="btn btn-secondary btn-sm"
            style={{ color: '#EF4444' }}
            onClick={() => handleDeleteTemplate(t.id, t.template_name)}
            title="Delete Template"
          >
            🗑️
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="page-header-row">
        <div className="page-title-group">
          <h1><span>📋</span> WhatsApp Templates & Tariff Schedule</h1>
          <p>Meta-registered message templates, variable placeholders, and official Bahrain Market rates.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditingTemplate({
          template_name: '', display_title: '', category: 'UTILITY', language: 'en_US',
          header_type: 'NONE', header_sample: '', body_text: '', footer_text: ''
        })}>
          <span>➕</span> Register New Template
        </button>
      </div>

      <DataTable
        columns={templateColumns}
        data={templates}
        title="whatsapp_templates"
        searchPlaceholder="Search template title, category..."
        defaultPageSize={10}
        pageSizeOptions={[5, 10, 20]}
        defaultSortKey="id"
        defaultSortDir="desc"
      />

      {/* Register & Edit Template Modal */}
      {editingTemplate && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <span className="card-title">
                <span>{editingTemplate.id ? '✏️ Edit Template' : '➕ Register New WhatsApp Template'}</span>
              </span>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingTemplate(null)}>✕ Close</button>
            </div>

            <form onSubmit={handleSaveTemplate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Meta Template Key *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. uniglobal_invoice_alert"
                    value={editingTemplate.template_name}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      template_name: e.target.value.toLowerCase().replace(/\s+/g, '_')
                    })}
                    required
                  />
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Lowercase & underscores only</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Display Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Invoice Notification with PDF"
                    value={editingTemplate.display_title}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, display_title: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '6px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={editingTemplate.category}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value })}
                  >
                    <option value="UTILITY">Utility (Invoices, Notifications)</option>
                    <option value="AUTHENTICATION">Authentication (OTP Verification)</option>
                    <option value="MARKETING">Marketing (Offers & Promotions)</option>
                    <option value="SERVICE">Service (Customer Support)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Language Code *</label>
                  <select
                    className="form-select"
                    value={editingTemplate.language || 'en_US'}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, language: e.target.value })}
                  >
                    <option value="en_US">English (US) — en_US (Most Common)</option>
                    <option value="en">English — en</option>
                    <option value="en_GB">English (UK) — en_GB</option>
                    <option value="ar">Arabic — ar</option>
                    <option value="hi">Hindi — hi</option>
                  </select>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    Must match the Language set in Meta (e.g. English (US) is <code>en_US</code>).
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '6px' }}>
                <div className="form-group">
                  <label className="form-label">Header Media Type</label>
                  <select
                    className="form-select"
                    value={editingTemplate.header_type}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, header_type: e.target.value })}
                  >
                    <option value="NONE">None (Plain Message)</option>
                    <option value="DOCUMENT">Document (PDF Invoice/Report)</option>
                    <option value="IMAGE">Image (Banner / JPG / PNG)</option>
                    <option value="TEXT">Text Header</option>
                    <option value="VIDEO">Video</option>
                  </select>
                </div>

                {editingTemplate.header_type !== 'NONE' && (
                  <div className="form-group">
                    <label className="form-label">Header Sample / URL</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="https://... or header text"
                      value={editingTemplate.header_sample || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, header_sample: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginTop: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Body Text (Message Format) *</label>
                  <span className="badge cat-auth" style={{ fontSize: '10px' }}>
                    {varCount} variable{varCount !== 1 ? 's' : ''} detected
                  </span>
                </div>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '110px' }}
                  placeholder="Dear {{1}}, your invoice {{2}} for BHD {{3}} has been generated on {{4}}."
                  value={editingTemplate.body_text}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, body_text: e.target.value })}
                  required
                />
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                  Use placeholders like <code>&#123;&#123;1&#125;&#125;</code>, <code>&#123;&#123;2&#125;&#125;</code> for dynamic ERP variables.
                </span>
              </div>

              <div className="form-group" style={{ marginTop: '6px' }}>
                <label className="form-label">Footer Tagline (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. UniGlobal Accounts | Powered by SaNDS Lab"
                  value={editingTemplate.footer_text || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, footer_text: e.target.value })}
                />
              </div>

              {/* Live Tariff Calculation Banner */}
              <div className="tariff-estimate-banner" style={{ margin: '14px 0' }}>
                <div className="tariff-info">
                  <span className="title">Bahrain Tariff ({editingTemplate.category})</span>
                  <span className="breakdown">
                    Meta Cost: {activeTariff.meta.toFixed(4)} BHD | Platform Fee: +{activeTariff.platform.toFixed(4)} BHD
                  </span>
                </div>
                <div className="tariff-rate-badge">
                  BHD {activeTariff.client.toFixed(4)} / msg
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingTemplate(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (editingTemplate.id ? '💾 Update Template' : '🚀 Register Template')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={!!confirmDialog}
          title={confirmDialog.title}
          subtitle={confirmDialog.subtitle}
          icon={confirmDialog.icon}
          badgeClass={confirmDialog.badgeClass}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          onClose={() => setConfirmDialog(null)}
          onConfirm={confirmDialog.onConfirm}
        />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 6. ODOO API HUB & LIVE DEVELOPER CONSOLE
// -----------------------------------------------------------------------------
function OdooApiHubView({ showToast }) {
  const [responseOutput, setResponseOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('sk_live_odoo_uniglobal_98741362');
  const [endpoint, setEndpoint] = useState('/api/messages.php');

  const [requestPayload, setRequestPayload] = useState(JSON.stringify({
    "to_phone": "+97339000000",
    "template_name": "uniglobal_invoice_notification",
    "category": "UTILITY",
    "header_media": {
      "type": "document",
      "url": "https://erp.uniglobal.bh/INV_9941.pdf",
      "filename": "INV.pdf"
    },
    "body_parameters": ["Ahmed Al-Khalifa", "INV/2026/0142", "BHD 345.500", "15-Oct-2026"],
    "source_system": "Odoo ERP (Direct API)"
  }, null, 2));

  const runLiveTest = async () => {
    setLoading(true);
    setResponseOutput('Sending request to WhatsApp Gateway...');
    try {
      const res = await fetch(`.${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: requestPayload
      });
      const data = await res.json();
      setResponseOutput(JSON.stringify(data, null, 2));
      showToast('API Executed successfully!');
    } catch (err) {
      setResponseOutput(JSON.stringify({ error: err.message }, null, 2));
      showToast('API execution error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const [activeSnippetLang, setActiveSnippetLang] = useState('python');

  const snippets = {
    python: {
      title: 'Python 3 (Odoo ERP Action / Requests)',
      filename: 'odoo_whatsapp_connector.py',
      code: `import requests

API_URL = "https://whatsapp.sandslab.com/api/messages.php"
API_KEY = "sk_live_odoo_uniglobal_98741362"

def send_odoo_invoice_whatsapp(partner_phone, partner_name, invoice_num, amount_bhd, date_str, pdf_url):
    payload = {
        "to_phone": partner_phone,
        "template_name": "uniglobal_invoice_notification",
        "category": "UTILITY",
        "header_media": {
            "type": "document",
            "url": pdf_url,
            "filename": f"{invoice_num}.pdf"
        },
        "body_parameters": [partner_name, invoice_num, amount_bhd, date_str],
        "source_system": "Odoo ERP Automated Action"
    }
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY
    }
    response = requests.post(API_URL, json=payload, headers=headers, timeout=10)
    return response.json()`
    },
    php: {
      title: 'PHP 7.4+ / 8.x (cURL Native)',
      filename: 'whatsapp_sender.php',
      code: `<?php
/**
 * WhatsApp Gateway - PHP Integration Example
 * Send Automated WhatsApp Template Notifications
 */

function sendWhatsAppNotification($toPhone, $customerName, $invoiceNum, $amountBhd, $dateStr, $pdfUrl) {
    $apiUrl = 'https://whatsapp.sandslab.com/api/messages.php';
    $apiKey = 'sk_live_odoo_uniglobal_98741362';

    $payload = [
        'to_phone'        => $toPhone,
        'template_name'   => 'uniglobal_invoice_notification',
        'category'        => 'UTILITY',
        'header_media'    => [
            'type'     => 'document',
            'url'      => $pdfUrl,
            'filename' => $invoiceNum . '.pdf'
        ],
        'body_parameters' => [$customerName, $invoiceNum, $amountBhd, $dateStr],
        'source_system'   => 'PHP ERP Application'
    ];

    $ch = curl_init($apiUrl);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'X-API-Key: ' . $apiKey
        ],
        CURLOPT_TIMEOUT        => 15
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return json_decode($response, true);
}

// Example Execution
$result = sendWhatsAppNotification(
    '+97339000000',
    'Ahmed Al-Khalifa',
    'INV/2026/0142',
    'BHD 345.500',
    '15-Oct-2026',
    'https://erp.uniglobal.bh/INV_9941.pdf'
);
print_r($result);`
    },
    curl: {
      title: 'cURL (Bash / Terminal CLI)',
      filename: 'send_invoice.sh',
      code: `#!/bin/bash

# WhatsApp Gateway - cURL Integration Example
API_URL="https://whatsapp.sandslab.com/api/messages.php"
API_KEY="sk_live_odoo_uniglobal_98741362"

curl -X POST "$API_URL" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: $API_KEY" \\
  -d '{
    "to_phone": "+97339000000",
    "template_name": "uniglobal_invoice_notification",
    "category": "UTILITY",
    "header_media": {
      "type": "document",
      "url": "https://erp.uniglobal.bh/INV_9941.pdf",
      "filename": "INV_2026_0142.pdf"
    },
    "body_parameters": [
      "Ahmed Al-Khalifa",
      "INV/2026/0142",
      "BHD 345.500",
      "15-Oct-2026"
    ],
    "source_system": "cURL CLI Script"
  }'`
    },
    dotnet: {
      title: '.NET 6/7/8 C# (HttpClient)',
      filename: 'WhatsAppService.cs',
      code: `using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace UniGlobal.Integrations
{
    public class WhatsAppSender
    {
        private static readonly HttpClient _httpClient = new HttpClient();
        private const string ApiUrl = "https://whatsapp.sandslab.com/api/messages.php";
        private const string ApiKey = "sk_live_odoo_uniglobal_98741362";

        public static async Task<string> SendInvoiceNotificationAsync(
            string recipientPhone,
            string customerName,
            string invoiceNumber,
            string amountFormatted,
            string issueDate,
            string invoicePdfUrl)
        {
            var payload = new
            {
                to_phone = recipientPhone,
                template_name = "uniglobal_invoice_notification",
                category = "UTILITY",
                header_media = new
                {
                    type = "document",
                    url = invoicePdfUrl,
                    filename = $"{invoiceNumber}.pdf"
                },
                body_parameters = new[] { customerName, invoiceNumber, amountFormatted, issueDate },
                source_system = ".NET ERP Connector"
            };

            var request = new HttpRequestMessage(HttpMethod.Post, ApiUrl);
            request.Headers.Add("X-API-Key", ApiKey);
            request.Content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.SendAsync(request);
            return await response.Content.ReadAsStringAsync();
        }
    }
}`
    },
    node: {
      title: 'Node.js / Express (Fetch API)',
      filename: 'send_whatsapp.js',
      code: `/**
 * WhatsApp Gateway - Node.js Integration Example
 */
const API_URL = 'https://whatsapp.sandslab.com/api/messages.php';
const API_KEY = 'sk_live_odoo_uniglobal_98741362';

async function sendWhatsAppInvoice({ toPhone, customerName, invoiceNumber, amount, date, pdfUrl }) {
  const payload = {
    to_phone: toPhone,
    template_name: 'uniglobal_invoice_notification',
    category: 'UTILITY',
    header_media: {
      type: 'document',
      url: pdfUrl,
      filename: \`\${invoiceNumber}.pdf\`
    },
    body_parameters: [customerName, invoiceNumber, amount, date],
    source_system: 'Node.js Microservice'
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify(payload)
  });

  return await response.json();
}

// Example Execution
// sendWhatsAppInvoice({
//   toPhone: '+97339000000',
//   customerName: 'Ahmed Al-Khalifa',
//   invoiceNumber: 'INV/2026/0142',
//   amount: 'BHD 345.500',
//   date: '15-Oct-2026',
//   pdfUrl: 'https://erp.uniglobal.bh/INV_9941.pdf'
// }).then(console.log);`
    }
  };

  const currentSnippet = snippets[activeSnippetLang] || snippets.python;

  return (
    <div>
      <div className="page-header-row">
        <div className="page-title-group">
          <h1><span>⚡</span> Odoo & Multi-Platform Integration API Hub</h1>
          <p>REST API documentation, live testing console, and copyable integration snippets for Python, PHP, cURL, .NET (C#), and Node.js.</p>
        </div>
      </div>

      <div className="api-hub-grid">
        {/* Left: Interactive API Request Runner */}
        <div className="card" style={{ minWidth: 0, margin: 0 }}>
          <div className="card-header">
            <span className="card-title"><span>🧪</span> Live API Tester</span>
          </div>

          <div className="form-group">
            <label className="form-label">API Key Header (X-API-Key)</label>
            <input type="text" className="form-input" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">HTTP Method & Endpoint</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span className="badge cat-utility" style={{ padding: '8px 12px', fontSize: '12px' }}>POST</span>
              <input type="text" className="form-input" value={endpoint} readOnly />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Request Body (JSON)</label>
            <textarea
              className="form-textarea"
              style={{ minHeight: '180px', fontFamily: 'monospace', fontSize: '11.5px' }}
              value={requestPayload}
              onChange={(e) => setRequestPayload(e.target.value)}
            />
          </div>

          <button className="btn btn-success" style={{ width: '100%' }} onClick={runLiveTest} disabled={loading}>
            {loading ? 'Executing...' : '▶ Execute API Call'}
          </button>

          {responseOutput && (
            <div style={{ marginTop: '16px' }}>
              <label className="form-label">Response Body (HTTP 200/201)</label>
              <div className="code-box" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{responseOutput}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Right: Multi-Language Code Snippets */}
        <div className="card" style={{ minWidth: 0, margin: 0 }}>
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '8px' }}>
            <span className="card-title"><span>🔌</span> Multi-Platform Connector Snippets</span>
            <button className="btn-copy-code" onClick={() => {
              navigator.clipboard.writeText(currentSnippet.code);
              showToast(`${currentSnippet.filename} copied to clipboard!`);
            }}>
              <span>📋</span> Copy Code
            </button>
          </div>

          {/* Language Selector Tabs */}
          <div className="code-tabs-header">
            <button
              type="button"
              className={`code-tab-btn ${activeSnippetLang === 'python' ? 'active' : ''}`}
              onClick={() => setActiveSnippetLang('python')}
            >
              <span>🐍</span> Python (Odoo)
            </button>
            <button
              type="button"
              className={`code-tab-btn ${activeSnippetLang === 'php' ? 'active' : ''}`}
              onClick={() => setActiveSnippetLang('php')}
            >
              <span>🐘</span> PHP
            </button>
            <button
              type="button"
              className={`code-tab-btn ${activeSnippetLang === 'curl' ? 'active' : ''}`}
              onClick={() => setActiveSnippetLang('curl')}
            >
              <span>💻</span> cURL
            </button>
            <button
              type="button"
              className={`code-tab-btn ${activeSnippetLang === 'dotnet' ? 'active' : ''}`}
              onClick={() => setActiveSnippetLang('dotnet')}
            >
              <span>🔷</span> .NET (C#)
            </button>
            <button
              type="button"
              className={`code-tab-btn ${activeSnippetLang === 'node' ? 'active' : ''}`}
              onClick={() => setActiveSnippetLang('node')}
            >
              <span>🟨</span> Node.js
            </button>
          </div>

          <div className="code-box" style={{ minHeight: '380px', maxHeight: '560px', overflowY: 'auto' }}>
            <div className="code-box-header">
              <span>{currentSnippet.filename}</span>
              <span style={{ fontSize: '10.5px', color: '#64748B' }}>{currentSnippet.title}</span>
            </div>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{currentSnippet.code}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 7. API KEYS VIEW (WITH DATATABLE)
// -----------------------------------------------------------------------------
function ApiKeysView({ showToast }) {
  const [keys, setKeys] = useState([]);
  const [newSystemName, setNewSystemName] = useState('');
  const [loading, setLoading] = useState(false);

  const loadKeys = () => {
    fetch('./api/api_keys.php')
      .then(res => res.json())
      .then(res => { if (res.success) setKeys(res.data); });
  };

  useEffect(() => { loadKeys(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newSystemName) return;
    setLoading(true);
    try {
      const res = await fetch('./api/api_keys.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_name: newSystemName })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Generated API key for ${newSystemName}`);
        setNewSystemName('');
        loadKeys();
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    await fetch('./api/api_keys.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: currentStatus ? 0 : 1 })
    });
    showToast('API Key status updated');
    loadKeys();
  };

  const keyColumns = [
    {
      key: 'system_name',
      label: 'Integration System',
      render: (k) => <strong>{k.system_name}</strong>
    },
    {
      key: 'api_key',
      label: 'Secret API Key Token',
      render: (k) => (
        <code style={{ background: '#F1F5F9', padding: '4px 8px', borderRadius: '4px', color: '#0F172A' }}>
          {k.api_key}
        </code>
      )
    },
    {
      key: 'rate_limit_per_minute',
      label: 'Rate Limit',
      render: (k) => <span>{k.rate_limit_per_minute} req/min</span>
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (k) => (
        <span className={`badge ${k.is_active ? 'status-read' : 'status-failed'}`}>
          {k.is_active ? 'ACTIVE' : 'REVOKED'}
        </span>
      )
    },
    {
      key: 'last_used_at',
      label: 'Last Used',
      render: (k) => <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{k.last_used_at || 'Never'}</span>
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (k) => (
        <button className="btn btn-secondary btn-sm" onClick={() => toggleStatus(k.id, k.is_active)}>
          {k.is_active ? 'Revoke' : 'Activate'}
        </button>
      )
    }
  ];

  return (
    <div>
      <div className="page-header-row">
        <div className="page-title-group">
          <h1><span>🔑</span> External API Keys Management</h1>
          <p>Manage authentication tokens for Odoo ERP, POS terminal middleware, and third-party systems.</p>
        </div>
      </div>

      {/* Create New Key Box */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '16px' }}>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            className="form-input"
            placeholder="System / Application Name (e.g. Odoo ERP Production)"
            value={newSystemName}
            onChange={(e) => setNewSystemName(e.target.value)}
            style={{ flex: 1 }}
            required
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <span>➕</span> Generate New API Key
          </button>
        </form>
      </div>

      <DataTable
        columns={keyColumns}
        data={keys}
        title="api_keys"
        searchPlaceholder="Search system name, token..."
        defaultPageSize={10}
        pageSizeOptions={[5, 10, 20]}
        defaultSortKey="id"
        defaultSortDir="desc"
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// 8. USER MANAGEMENT VIEW (WITH DATATABLE)
// -----------------------------------------------------------------------------
function UsersView({ currentUser, showToast }) {
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: 'Password@123', role: 'user', status: 'active' });
  const [confirmDialog, setConfirmDialog] = useState(null);

  const loadUsers = () => {
    fetch('./api/users.php')
      .then(res => res.json())
      .then(res => { if (res.success) setUsers(res.data); });
  };

  useEffect(() => { loadUsers(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('./api/users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        showToast('User created successfully');
        setShowAddModal(false);
        setForm({ name: '', email: '', password: 'Password@123', role: 'user', status: 'active' });
        loadUsers();
      } else {
        showToast(data.error || 'Failed to create user', 'error');
      }
    } catch (err) {
      showToast('Error creating user', 'error');
    }
  };

  const handleDelete = (id) => {
    const targetUser = users.find(u => u.id === id);
    const userName = targetUser ? `"${targetUser.name}"` : 'this user';

    setConfirmDialog({
      title: 'Delete User Account?',
      subtitle: `Are you sure you want to permanently delete user account ${userName}? They will no longer be able to log in.`,
      icon: '👤',
      badgeClass: 'danger',
      confirmText: 'Yes, Delete User',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const res = await fetch(`./api/users.php?id=${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            showToast('User deleted');
            loadUsers();
          } else {
            showToast(data.error, 'error');
          }
        } catch (e) {
          showToast('Error deleting user', 'error');
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  };

  const userColumns = [
    {
      key: 'name',
      label: 'User Name',
      render: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="avatar" style={{ background: u.avatar_color || '#128C7E' }}>
            {u.name.charAt(0)}
          </div>
          <strong>{u.name}</strong>
        </div>
      )
    },
    {
      key: 'email',
      label: 'Email Address'
    },
    {
      key: 'role',
      label: 'Assigned Role',
      render: (u) => (
        <span className={`badge ${u.role === 'superadmin' ? 'cat-marketing' : u.role === 'admin' ? 'cat-auth' : 'cat-utility'}`}>
          {u.role.toUpperCase()}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Account Status',
      render: (u) => (
        <span className={`badge ${u.status === 'active' ? 'status-read' : 'status-failed'}`}>
          {u.status.toUpperCase()}
        </span>
      )
    },
    {
      key: 'last_login',
      label: 'Last Active',
      render: (u) => <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{u.last_login || 'Never'}</span>
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (u) => (
        <>
          {currentUser.id !== u.id && (
            <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(u.id)}>
              Delete
            </button>
          )}
        </>
      )
    }
  ];

  return (
    <div>
      <div className="page-header-row">
        <div className="page-title-group">
          <h1><span>👥</span> User Accounts & Role Permissions</h1>
          <p>Manage Superadmin, Admin, and Operations User accounts for platform access.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <span>➕</span> Add New User
        </button>
      </div>

      <DataTable
        columns={userColumns}
        data={users}
        title="platform_users"
        searchPlaceholder="Search users by name, email, role..."
        defaultPageSize={10}
        pageSizeOptions={[5, 10, 20]}
        defaultSortKey="id"
        defaultSortDir="desc"
      />

      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div className="card" style={{ width: '480px' }}>
            <div className="card-header">
              <span className="card-title">Create New User</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="user">User (Standard Access)</option>
                  <option value="admin">Admin (Full Client Access)</option>
                  <option value="superadmin">Superadmin (SaNDS Lab Platform)</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>Save User</button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={!!confirmDialog}
          title={confirmDialog.title}
          subtitle={confirmDialog.subtitle}
          icon={confirmDialog.icon}
          badgeClass={confirmDialog.badgeClass}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          onClose={() => setConfirmDialog(null)}
          onConfirm={confirmDialog.onConfirm}
        />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// HELPER FORMATTING FUNCTIONS (MULTI-CURRENCY & DATE-TIME)
// -----------------------------------------------------------------------------
function formatCurrency(amount, currency = 'BHD', decimals = 3) {
  const num = parseFloat(amount || 0);
  const dec = typeof decimals === 'number' ? decimals : (['BHD', 'KWD', 'OMR'].includes(currency) ? 3 : 2);
  const formatted = num.toFixed(dec);
  if (currency === 'INR') return `₹ ${formatted}`;
  if (currency === 'USD') return `$ ${formatted}`;
  return `${formatted} ${currency}`;
}

function formatDateTime(dateStr, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!dateStr) return '';
  try {
    let cleanStr = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(cleanStr)) {
      cleanStr = cleanStr.replace(' ', 'T');
    }
    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) return dateStr;
    const YYYY = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const DD = String(d.getDate()).padStart(2, '0');
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hh12 = String(hours % 12 || 12).padStart(2, '0');
    const HH24 = String(hours).padStart(2, '0');

    if (format === 'DD/MM/YYYY hh:mm:ss A') return `${DD}/${MM}/${YYYY} ${hh12}:${minutes}:${seconds} ${ampm}`;
    if (format === 'DD-MM-YYYY HH:mm') return `${DD}-${MM}-${YYYY} ${HH24}:${minutes}`;
    if (format === 'MM/DD/YYYY hh:mm A') return `${MM}/${DD}/${YYYY} ${hh12}:${minutes} ${ampm}`;
    if (format === 'YYYY-MM-DD hh:mm A') return `${YYYY}-${MM}-${DD} ${hh12}:${minutes} ${ampm}`;
    return `${YYYY}-${MM}-${DD} ${HH24}:${minutes}:${seconds}`;
  } catch (e) {
    return dateStr;
  }
}

// -----------------------------------------------------------------------------
// 8. WALLET & BILLING VIEW (SUPERADMIN TOP-UPS & TRANSACTION LEDGER)
// -----------------------------------------------------------------------------
function WalletView({ currentUser, showToast, globalSettings, onBalanceChange }) {
  const [walletData, setWalletData] = useState({
    wallet_balance: 0.0000,
    currency: 'BHD',
    currency_decimals: 3,
    users: [],
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [selectedUserForTopUp, setSelectedUserForTopUp] = useState(null);
  const [topUpForm, setTopUpForm] = useState({
    user_id: '',
    amount: '',
    transaction_type: 'credit',
    reference_id: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [deleteTargetTx, setDeleteTargetTx] = useState(null);
  const [deletingTx, setDeletingTx] = useState(false);

  const isSuperadmin = currentUser?.role === 'superadmin';

  const loadWallet = async () => {
    setLoading(true);
    try {
      const res = await fetch(`./api/wallet.php?type=${typeFilter === 'all' ? '' : typeFilter}&limit=100`);
      const data = await res.json();
      if (data.success) {
        setWalletData(data);
        if (onBalanceChange) onBalanceChange(data.wallet_balance);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, [typeFilter]);

  const handleOpenTopUp = (user = null) => {
    const targetId = user ? user.id : (walletData.users[0]?.id || '');
    setTopUpForm({
      user_id: targetId,
      amount: '',
      transaction_type: 'credit',
      reference_id: '',
      notes: ''
    });
    setSelectedUserForTopUp(user);
    setShowTopUpModal(true);
  };

  const handleSaveTopUp = async (e) => {
    e.preventDefault();
    if (!topUpForm.user_id || parseFloat(topUpForm.amount) <= 0) {
      showToast('Please enter a valid amount and target account', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('./api/wallet.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topUpForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Wallet balance updated successfully!');
        setShowTopUpModal(false);
        loadWallet();
      } else {
        showToast(data.error || 'Failed to update wallet balance', 'error');
      }
    } catch (err) {
      showToast('Network error processing recharge', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmExecuteDelete = async () => {
    if (!deleteTargetTx) return;
    setDeletingTx(true);
    try {
      const res = await fetch(`./api/wallet.php?id=${deleteTargetTx.id}&revert=1`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Transaction record deleted & balance adjusted successfully');
        setDeleteTargetTx(null);
        loadWallet();
      } else {
        showToast(data.error || 'Failed to delete transaction', 'error');
      }
    } catch (e) {
      showToast('Network error deleting transaction', 'error');
    } finally {
      setDeletingTx(false);
    }
  };

  const curr = walletData.currency || globalSettings?.system_currency || 'BHD';
  const dec = walletData.currency_decimals ?? globalSettings?.currency_decimals ?? 3;

  // Columns for Transaction Statement / Ledger
  const ledgerColumns = [
    {
      key: 'created_at',
      label: 'Date & Time',
      render: (t) => (
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {formatDateTime(t.created_at, globalSettings?.system_date_format)}
        </span>
      )
    },
    {
      key: 'user_name',
      label: 'Account / User',
      render: (t) => (
        <div>
          <strong>{t.user_name || 'Client Account'}</strong>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{t.user_email}</div>
        </div>
      )
    },
    {
      key: 'transaction_type',
      label: 'Type',
      render: (t) => (
        <span className={`tx-type-badge tx-${t.transaction_type}`}>
          {t.transaction_type === 'credit' ? '🟢 Credit (+)' : t.transaction_type === 'debit' ? '🔴 Debit (-)' : '🟡 Adjustment'}
        </span>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (t) => {
        const isCredit = t.transaction_type === 'credit';
        return (
          <span style={{ fontWeight: '800', fontSize: '13px', color: isCredit ? '#15803D' : '#B91C1C' }}>
            {isCredit ? '+' : '-'}{formatCurrency(t.amount, t.currency || curr, dec)}
          </span>
        );
      }
    },
    {
      key: 'balance_after',
      label: 'Balance After',
      render: (t) => (
        <div>
          <strong>{formatCurrency(t.balance_after, t.currency || curr, dec)}</strong>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            Before: {formatCurrency(t.balance_before, t.currency || curr, dec)}
          </div>
        </div>
      )
    },
    {
      key: 'reference_id',
      label: 'Reference / Ref ID',
      render: (t) => (
        <div style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.reference_id}>
          <span className="badge badge-subtle" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
            {t.reference_id || 'N/A'}
          </span>
        </div>
      )
    },
    {
      key: 'description',
      label: 'Description / Notes',
      render: (t) => (
        <div style={{ fontSize: '12px', maxWidth: '240px' }} title={t.description}>
          {t.description || (t.reference_type === 'superadmin_topup' ? 'Recharge added by Superadmin' : 'WhatsApp Dispatch')}
        </div>
      )
    },
    {
      key: 'performed_by_name',
      label: 'Processed By',
      render: (t) => (
        <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
          {t.performed_by_name || 'System / Auto'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (t) => (
        <div>
          {isSuperadmin && (
            <button
              className="btn btn-secondary btn-sm"
              style={{ padding: '3px 8px', fontSize: '11px', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '3px' }}
              onClick={() => setDeleteTargetTx(t)}
              title="Delete this transaction record and adjust user balance"
            >
              <span>🗑️</span> Delete
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="page-header-row">
        <div className="page-title-group">
          <h1><span>💳</span> Prepaid Wallet & Financial Statement</h1>
          <p>Superadmin balance management, automatic transaction debit ledger, and multi-currency billing statement.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isSuperadmin && (
            <button className="btn btn-primary" onClick={() => handleOpenTopUp(null)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>➕</span> Add Wallet Balance
            </button>
          )}
          <button className="btn btn-secondary" onClick={loadWallet}>
            <span>🔄</span> Refresh Statement
          </button>
        </div>
      </div>

      {/* Hero Stats Section */}
      <div className="wallet-hero-grid">
        <div className="wallet-balance-card">
          <div className="wallet-balance-label">Available Prepaid Wallet Balance</div>
          <div className="wallet-balance-amount">
            {formatCurrency(walletData.wallet_balance, curr, dec)}
          </div>
          <div className="wallet-quick-actions">
            {isSuperadmin && (
              <button className="btn-recharge" onClick={() => handleOpenTopUp(null)}>
                <span>➕</span> Top-Up / Add Credit
              </button>
            )}
            <span style={{ fontSize: '12px', opacity: 0.9, alignSelf: 'center' }}>
              Base Currency: <strong>{curr}</strong>
            </span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
            Total Credits / Recharges
          </span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#15803D', marginTop: '6px' }}>
            {formatCurrency(
              walletData.transactions.filter(t => t.transaction_type === 'credit').reduce((acc, t) => acc + parseFloat(t.amount || 0), 0),
              curr, dec
            )}
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {walletData.transactions.filter(t => t.transaction_type === 'credit').length} credit events
          </span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
            Total Dispatches / Debits
          </span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#B91C1C', marginTop: '6px' }}>
            {formatCurrency(
              walletData.transactions.filter(t => t.transaction_type === 'debit').reduce((acc, t) => acc + parseFloat(t.amount || 0), 0),
              curr, dec
            )}
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {walletData.transactions.filter(t => t.transaction_type === 'debit').length} message dispatches
          </span>
        </div>
      </div>

      {/* Superadmin Client Balances Overview */}
      {isSuperadmin && walletData.users && walletData.users.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title" style={{ fontSize: '15px' }}>👥 Client Account Balances Overview</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Superadmin Quick Balance Management</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User / Company</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Current Balance</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {walletData.users.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'superadmin' ? 'cat-marketing' : u.role === 'admin' ? 'cat-auth' : 'cat-utility'}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '14px', color: parseFloat(u.wallet_balance) > 0 ? '#15803D' : '#94A3B8' }}>
                        {formatCurrency(u.wallet_balance, curr, dec)}
                      </strong>
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'active' ? 'status-read' : 'status-failed'}`}>
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ padding: '4px 10px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handleOpenTopUp(u)}
                      >
                        <span>➕</span> Top-Up
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction Statement / Audit Ledger */}
      <DataTable
        columns={ledgerColumns}
        data={walletData.transactions}
        title="wallet_transactions_statement"
        searchPlaceholder="Search reference ID, description, user..."
        defaultPageSize={10}
        pageSizeOptions={[10, 25, 50, 100]}
        defaultSortKey="created_at"
        defaultSortDir="desc"
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              className="form-select"
              style={{ width: '150px', padding: '5px 8px', fontSize: '12px' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Transactions</option>
              <option value="credit">Credits (Top-Ups)</option>
              <option value="debit">Debits (Dispatches)</option>
            </select>
          </div>
        }
        emptyMessage={loading ? 'Loading wallet transactions...' : 'No transaction history records found.'}
      />

      {/* Superadmin Top-Up Modal */}
      {showTopUpModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div className="card" style={{ width: '520px', maxWidth: '95vw' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="card-title" style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💳</span> Add Wallet Balance / Payment Credit
              </span>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowTopUpModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveTopUp} style={{ marginTop: '14px' }}>
              <div className="form-group">
                <label className="form-label">Select Client / Admin Account</label>
                <select
                  className="form-select"
                  value={topUpForm.user_id}
                  onChange={(e) => setTopUpForm({ ...topUpForm, user_id: e.target.value })}
                  required
                >
                  <option value="">-- Choose Account --</option>
                  {walletData.users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) - Current Balance: {formatCurrency(u.wallet_balance, curr, dec)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Top-Up Amount ({curr})</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    placeholder="e.g. 50.000"
                    className="form-input"
                    value={topUpForm.amount}
                    onChange={(e) => setTopUpForm({ ...topUpForm, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Transaction Type</label>
                  <select
                    className="form-select"
                    value={topUpForm.transaction_type}
                    onChange={(e) => setTopUpForm({ ...topUpForm, transaction_type: e.target.value })}
                  >
                    <option value="credit">Credit (Top-Up / Payment Made)</option>
                    <option value="debit">Debit (Deduction)</option>
                    <option value="adjustment">Manual Set (Override)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Reference / Receipt ID</label>
                <input
                  type="text"
                  placeholder="e.g. BENEFIT-849201, Bank Transfer #9912, Cash Receipt"
                  className="form-input"
                  value={topUpForm.reference_id}
                  onChange={(e) => setTopUpForm({ ...topUpForm, reference_id: e.target.value })}
                />
                <span className="form-hint">Reference number to match with client invoice or bank statement.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Notes & Description</label>
                <textarea
                  rows="2"
                  placeholder="e.g. 50 BHD Recharge via BenefitPay on 05-Oct-2026"
                  className="form-input"
                  value={topUpForm.notes}
                  onChange={(e) => setTopUpForm({ ...topUpForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowTopUpModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? 'Processing...' : '💳 Credit Wallet Balance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attractive Custom Delete Confirmation Modal */}
      {deleteTargetTx && (
        <div className="confirm-modal-overlay" onClick={() => !deletingTx && setDeleteTargetTx(null)}>
          <div className="confirm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-body">
              <div className="confirm-modal-icon-badge">
                <span>🗑️</span>
              </div>
              <div className="confirm-modal-title">Delete Transaction Record</div>
              <div className="confirm-modal-subtitle">
                Are you sure you want to permanently remove this transaction from the ledger?
              </div>

              <div className="confirm-modal-info-box">
                <div className="confirm-modal-info-row">
                  <span className="confirm-modal-info-label">Transaction ID</span>
                  <span className="confirm-modal-info-value">#{deleteTargetTx.id}</span>
                </div>
                <div className="confirm-modal-info-row">
                  <span className="confirm-modal-info-label">Account / User</span>
                  <span className="confirm-modal-info-value">{deleteTargetTx.user_name || deleteTargetTx.user_email || 'N/A'}</span>
                </div>
                <div className="confirm-modal-info-row">
                  <span className="confirm-modal-info-label">Type & Amount</span>
                  <span className="confirm-modal-info-value" style={{ color: deleteTargetTx.transaction_type === 'credit' ? '#15803D' : '#DC2626' }}>
                    {deleteTargetTx.transaction_type === 'credit' ? '🟢 Credit (+)' : '🔴 Debit (-)'} {formatCurrency(deleteTargetTx.amount, deleteTargetTx.currency || curr, dec)}
                  </span>
                </div>
                {deleteTargetTx.reference_id && (
                  <div className="confirm-modal-info-row">
                    <span className="confirm-modal-info-label">Reference ID</span>
                    <span className="confirm-modal-info-value" style={{ fontFamily: 'monospace' }}>{deleteTargetTx.reference_id}</span>
                  </div>
                )}
                {deleteTargetTx.description && (
                  <div className="confirm-modal-info-row">
                    <span className="confirm-modal-info-label">Description</span>
                    <span className="confirm-modal-info-value" style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {deleteTargetTx.description}
                    </span>
                  </div>
                )}
              </div>

              <div className="confirm-modal-warning-box">
                <span style={{ fontSize: '16px' }}>⚠️</span>
                <div>
                  <strong>Automatic Balance Reversal:</strong> Deleting this record will automatically adjust the user balance accordingly (e.g. subtracting credited funds or refunding debited messages).
                </div>
              </div>
            </div>

            <div className="confirm-modal-actions">
              <button
                type="button"
                className="btn-confirm-cancel"
                onClick={() => setDeleteTargetTx(null)}
                disabled={deletingTx}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-confirm-delete"
                onClick={confirmExecuteDelete}
                disabled={deletingTx}
              >
                {deletingTx ? 'Deleting...' : '🗑️ Yes, Delete & Adjust Balance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 9. ENHANCED SYSTEM & TARIFF SETTINGS VIEW (SUPERADMIN / ADMIN)
// -----------------------------------------------------------------------------
function SettingsView({ currentUser, showToast, onSettingsChange }) {
  const isSuperadmin = !currentUser || currentUser.role === 'superadmin';
  const [activeSubTab, setActiveSubTab] = useState('tariffs'); // 'meta', 'tariffs', 'currency', 'datetime'
  const [settings, setSettings] = useState({
    billing_model: 'per_message',
    meta_phone_number_id: '',
    meta_waba_account_id: '',
    meta_access_token: '',
    webhook_verify_token: '',
    business_display_name: 'UniGlobal Consultancy W.L.L',
    business_phone_number: '+973 1700 8899',
    system_currency: 'BHD',
    currency_decimals: '3',
    system_date_format: 'YYYY-MM-DD HH:mm:ss',
    system_timezone: 'Asia/Bahrain',
    tariff_utility_meta: '0.0140',
    tariff_utility_platform: '0.0045',
    tariff_auth_meta: '0.0110',
    tariff_auth_platform: '0.0035',
    tariff_marketing_meta: '0.0270',
    tariff_marketing_platform: '0.0070',
    tariff_service_meta: '0.0075',
    tariff_service_platform: '0.0025',
    wallet_enforcement: '1'
  });
  const [loading, setLoading] = useState(false);
  const [currentTimePreview, setCurrentTimePreview] = useState(new Date().toISOString());

  useEffect(() => {
    fetch('./api/settings.php')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.settings) {
          setSettings(prev => ({ ...prev, ...res.settings }));
        }
      });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTimePreview(new Date().toISOString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('./api/settings.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });
      const data = await res.json();
      if (data.success) {
        showToast('System configuration & Tariffs updated successfully! Changes are live.');
        if (onSettingsChange) onSettingsChange(settings);
      } else {
        showToast(data.error || 'Failed to update settings', 'error');
      }
    } catch (err) {
      showToast('Network error saving settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const curr = settings.system_currency || 'BHD';
  const dec = parseInt(settings.currency_decimals || '3', 10);

  // Supported GCC & India Currencies
  const currencyOptions = [
    { code: 'BHD', name: '🇧🇭 BHD - Bahraini Dinar (3 decimals)', defaultDecimals: 3 },
    { code: 'SAR', name: '🇸🇦 SAR - Saudi Riyal (2 decimals)', defaultDecimals: 2 },
    { code: 'AED', name: '🇦🇪 AED - UAE Dirham (2 decimals)', defaultDecimals: 2 },
    { code: 'KWD', name: '🇰🇼 KWD - Kuwaiti Dinar (3 decimals)', defaultDecimals: 3 },
    { code: 'QAR', name: '🇶🇦 QAR - Qatari Riyal (2 decimals)', defaultDecimals: 2 },
    { code: 'OMR', name: '🇴🇲 OMR - Omani Rial (3 decimals)', defaultDecimals: 3 },
    { code: 'INR', name: '🇮🇳 INR - Indian Rupee (₹, 2 decimals)', defaultDecimals: 2 },
    { code: 'USD', name: '🇺🇸 USD - US Dollar ($, 2 decimals)', defaultDecimals: 2 }
  ];

  const dateFormatOptions = [
    { value: 'YYYY-MM-DD HH:mm:ss', label: 'YYYY-MM-DD HH:mm:ss (2026-10-05 17:45:00)' },
    { value: 'DD/MM/YYYY hh:mm:ss A', label: 'DD/MM/YYYY hh:mm:ss A (05/10/2026 05:45:00 PM)' },
    { value: 'DD-MM-YYYY HH:mm', label: 'DD-MM-YYYY HH:mm (05-10-2026 17:45)' },
    { value: 'MM/DD/YYYY hh:mm A', label: 'MM/DD/YYYY hh:mm A (10/05/2026 05:45 PM)' },
    { value: 'YYYY-MM-DD hh:mm A', label: 'YYYY-MM-DD hh:mm A (2026-10-05 05:45 PM)' }
  ];

  return (
    <div>
      <div className="page-header-row">
        <div className="page-title-group">
          <h1><span>⚙️</span> Superadmin Platform Engine Configuration</h1>
          <p>Configure Meta Cloud API, message tariffs, GCC/India currencies, prepaid wallet rules, and date formats.</p>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="settings-nav-tabs">
        <button
          type="button"
          className={`settings-tab-btn ${activeSubTab === 'tariffs' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('tariffs')}
        >
          <span>💰</span> Tariffs & Pricing Engine
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeSubTab === 'currency' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('currency')}
        >
          <span>🌍</span> Currency & Regional (GCC / India)
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeSubTab === 'datetime' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('datetime')}
        >
          <span>🕒</span> Date & Time Formats
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeSubTab === 'meta' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('meta')}
        >
          <span>⚡</span> Meta Cloud API Credentials
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeSubTab === 'version' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('version')}
        >
          <span>🏷️</span> Version & Roadmap Architecture
        </button>
      </div>

      <form onSubmit={handleSave}>
        {/* TAB 1: TARIFFS & PRICING ENGINE */}
        {activeSubTab === 'tariffs' && (
          <div className="card" style={{ maxWidth: '950px' }}>
            {/* Superadmin vs Admin Notice */}
            {!isSuperadmin && (
              <div style={{ background: '#FEF3C7', border: '1.5px solid #FCD34D', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🔒</span>
                <div>
                  <strong style={{ fontSize: '13.5px', color: '#92400E' }}>Read-Only Official Tariff Schedule</strong>
                  <div style={{ fontSize: '12px', color: '#78350F', marginTop: '2px' }}>
                    WhatsApp Meta base costs, platform margins, and billing engine rules are managed exclusively by SaNDS Lab Superadmin. Admin accounts have view-only access.
                  </div>
                </div>
              </div>
            )}

            {/* Charging Model Indicator for Admin */}
            {!isSuperadmin && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <strong style={{ fontSize: '13.5px', color: '#0F172A' }}>Active Charging Engine Model:</strong>
                  <span className="badge" style={{ background: settings.billing_model === '24h_session' ? '#DBEAFE' : '#DCFCE7', color: settings.billing_model === '24h_session' ? '#1E40AF' : '#15803D', fontWeight: '700', padding: '5px 12px' }}>
                    {settings.billing_model === '24h_session' ? '⚡ Option B: Meta 24-Hour Session Billing' : '📄 Option A: Standard Per-Message Billing'}
                  </span>
                </div>
              </div>
            )}

            {/* Superadmin Only: Interactive Billing Model Selector (Option A vs Option B) */}
            {isSuperadmin && (
              <div style={{ background: '#F8FAFC', border: '1.5px solid #0D9488', borderRadius: '12px', padding: '18px', marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>⚡</span>
                    <strong style={{ fontSize: '15px', color: '#0F172A' }}>WhatsApp Tariff & Charging Engine Model</strong>
                  </div>
                  <span className="badge" style={{ background: '#CCFBF1', color: '#0F766E', fontWeight: '800', fontSize: '11px', padding: '4px 9px' }}>
                    👑 Superadmin Exclusive Rule
                  </span>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: '1.4' }}>
                  Choose how the platform calculates Meta tariffs and debits client prepaid balances for outgoing messages:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
                  {/* Option A */}
                  <div
                    onClick={() => setSettings({ ...settings, billing_model: 'per_message' })}
                    style={{
                      border: (settings.billing_model === 'per_message' || !settings.billing_model) ? '2px solid #10B981' : '1px solid #E2E8F0',
                      background: (settings.billing_model === 'per_message' || !settings.billing_model) ? '#FFFFFF' : '#F8FAFC',
                      borderRadius: '10px',
                      padding: '14px',
                      cursor: 'pointer',
                      boxShadow: (settings.billing_model === 'per_message' || !settings.billing_model) ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <input
                        type="radio"
                        name="billing_model"
                        value="per_message"
                        checked={settings.billing_model === 'per_message' || !settings.billing_model}
                        onChange={() => setSettings({ ...settings, billing_model: 'per_message' })}
                        style={{ width: '16px', height: '16px', accentColor: '#10B981', cursor: 'pointer' }}
                      />
                      <strong style={{ fontSize: '13.5px', color: '#0F172A' }}>Option A: Standard Per-Message Billing</strong>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 26px', lineHeight: '1.4' }}>
                      Every single outgoing message debits the full <strong>Meta Base Cost + Platform Margin</strong>.
                    </p>
                    <div style={{ margin: '8px 0 0 26px', fontSize: '11px', color: '#059669', fontWeight: '700' }}>
                      ✓ Standard SaaS / Reseller model (Maximum platform margin).
                    </div>
                  </div>

                  {/* Option B */}
                  <div
                    onClick={() => setSettings({ ...settings, billing_model: '24h_session' })}
                    style={{
                      border: settings.billing_model === '24h_session' ? '2px solid #3B82F6' : '1px solid #E2E8F0',
                      background: settings.billing_model === '24h_session' ? '#FFFFFF' : '#F8FAFC',
                      borderRadius: '10px',
                      padding: '14px',
                      cursor: 'pointer',
                      boxShadow: settings.billing_model === '24h_session' ? '0 4px 12px rgba(59, 130, 246, 0.15)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <input
                        type="radio"
                        name="billing_model"
                        value="24h_session"
                        checked={settings.billing_model === '24h_session'}
                        onChange={() => setSettings({ ...settings, billing_model: '24h_session' })}
                        style={{ width: '16px', height: '16px', accentColor: '#3B82F6', cursor: 'pointer' }}
                      />
                      <strong style={{ fontSize: '13.5px', color: '#0F172A' }}>Option B: Meta 24-Hour Session Billing</strong>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 26px', lineHeight: '1.4' }}>
                      <strong>1st Message:</strong> Opens a 24h window (Full Meta Cost + Platform Margin).<br/>
                      <strong>Subsequent Messages in 24h:</strong> Meta Cost is waived (<strong>0.0000 {curr}</strong>) and only Platform Margin is debited.
                    </p>
                    <div style={{ margin: '8px 0 0 26px', fontSize: '11px', color: '#2563EB', fontWeight: '700' }}>
                      ✓ Official Meta Conversation Window Alignment.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--wa-dark-teal)', marginBottom: '8px' }}>
              Dynamic Meta Cost & Platform Charges per Category
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              {isSuperadmin
                ? 'Configure the exact Meta Cost and SaNDS Platform Margin per message category. These tariffs take effect dynamically across all outgoing message dispatches, wallet debits, and client billing.'
                : 'Current official Meta Cost and Platform Charges per message category for outgoing dispatches.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '16px' }}>
              {/* Utility Category */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <strong style={{ fontSize: '14px', color: '#0F172A' }}>📄 UTILITY (Invoices, Receipts, Notices)</strong>
                  <span className="badge cat-util">UTILITY</span>
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11.5px' }}>Meta Base Cost ({curr})</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      value={settings.tariff_utility_meta}
                      onChange={(e) => isSuperadmin && setSettings({ ...settings, tariff_utility_meta: e.target.value })}
                      readOnly={!isSuperadmin}
                      disabled={!isSuperadmin}
                      style={!isSuperadmin ? { background: '#F1F5F9', cursor: 'not-allowed', color: '#475569', borderColor: '#CBD5E1' } : {}}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11.5px' }}>Platform Margin ({curr})</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      value={settings.tariff_utility_platform}
                      onChange={(e) => isSuperadmin && setSettings({ ...settings, tariff_utility_platform: e.target.value })}
                      readOnly={!isSuperadmin}
                      disabled={!isSuperadmin}
                      style={!isSuperadmin ? { background: '#F1F5F9', cursor: 'not-allowed', color: '#475569', borderColor: '#CBD5E1' } : {}}
                      required
                    />
                  </div>
                </div>
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#0369A1', fontWeight: '700' }}>
                  Total Client Rate: {(parseFloat(settings.tariff_utility_meta || 0) + parseFloat(settings.tariff_utility_platform || 0)).toFixed(dec)} {curr}
                </div>
              </div>

              {/* Authentication Category */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <strong style={{ fontSize: '14px', color: '#0F172A' }}>🔐 AUTHENTICATION (OTP, 2FA, Logins)</strong>
                  <span className="badge cat-auth">AUTH</span>
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11.5px' }}>Meta Base Cost ({curr})</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      value={settings.tariff_auth_meta}
                      onChange={(e) => isSuperadmin && setSettings({ ...settings, tariff_auth_meta: e.target.value })}
                      readOnly={!isSuperadmin}
                      disabled={!isSuperadmin}
                      style={!isSuperadmin ? { background: '#F1F5F9', cursor: 'not-allowed', color: '#475569', borderColor: '#CBD5E1' } : {}}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11.5px' }}>Platform Margin ({curr})</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      value={settings.tariff_auth_platform}
                      onChange={(e) => isSuperadmin && setSettings({ ...settings, tariff_auth_platform: e.target.value })}
                      readOnly={!isSuperadmin}
                      disabled={!isSuperadmin}
                      style={!isSuperadmin ? { background: '#F1F5F9', cursor: 'not-allowed', color: '#475569', borderColor: '#CBD5E1' } : {}}
                      required
                    />
                  </div>
                </div>
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#0369A1', fontWeight: '700' }}>
                  Total Client Rate: {(parseFloat(settings.tariff_auth_meta || 0) + parseFloat(settings.tariff_auth_platform || 0)).toFixed(dec)} {curr}
                </div>
              </div>

              {/* Marketing Category */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <strong style={{ fontSize: '14px', color: '#0F172A' }}>📣 MARKETING (Promotions, Discounts, Offers)</strong>
                  <span className="badge cat-mark">MARKETING</span>
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11.5px' }}>Meta Base Cost ({curr})</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      value={settings.tariff_marketing_meta}
                      onChange={(e) => isSuperadmin && setSettings({ ...settings, tariff_marketing_meta: e.target.value })}
                      readOnly={!isSuperadmin}
                      disabled={!isSuperadmin}
                      style={!isSuperadmin ? { background: '#F1F5F9', cursor: 'not-allowed', color: '#475569', borderColor: '#CBD5E1' } : {}}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11.5px' }}>Platform Margin ({curr})</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      value={settings.tariff_marketing_platform}
                      onChange={(e) => isSuperadmin && setSettings({ ...settings, tariff_marketing_platform: e.target.value })}
                      readOnly={!isSuperadmin}
                      disabled={!isSuperadmin}
                      style={!isSuperadmin ? { background: '#F1F5F9', cursor: 'not-allowed', color: '#475569', borderColor: '#CBD5E1' } : {}}
                      required
                    />
                  </div>
                </div>
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#0369A1', fontWeight: '700' }}>
                  Total Client Rate: {(parseFloat(settings.tariff_marketing_meta || 0) + parseFloat(settings.tariff_marketing_platform || 0)).toFixed(dec)} {curr}
                </div>
              </div>

              {/* Service Category */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <strong style={{ fontSize: '14px', color: '#0F172A' }}>💬 SERVICE (Customer Support, Live Chat)</strong>
                  <span className="badge cat-serv">SERVICE</span>
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11.5px' }}>Meta Base Cost ({curr})</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      value={settings.tariff_service_meta}
                      onChange={(e) => isSuperadmin && setSettings({ ...settings, tariff_service_meta: e.target.value })}
                      readOnly={!isSuperadmin}
                      disabled={!isSuperadmin}
                      style={!isSuperadmin ? { background: '#F1F5F9', cursor: 'not-allowed', color: '#475569', borderColor: '#CBD5E1' } : {}}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11.5px' }}>Platform Margin ({curr})</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      value={settings.tariff_service_platform}
                      onChange={(e) => isSuperadmin && setSettings({ ...settings, tariff_service_platform: e.target.value })}
                      readOnly={!isSuperadmin}
                      disabled={!isSuperadmin}
                      style={!isSuperadmin ? { background: '#F1F5F9', cursor: 'not-allowed', color: '#475569', borderColor: '#CBD5E1' } : {}}
                      required
                    />
                  </div>
                </div>
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#0369A1', fontWeight: '700' }}>
                  Total Client Rate: {(parseFloat(settings.tariff_service_meta || 0) + parseFloat(settings.tariff_service_platform || 0)).toFixed(dec)} {curr}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CURRENCY & REGIONAL (GCC & INDIA) */}
        {activeSubTab === 'currency' && (
          <div className="card" style={{ maxWidth: '800px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--wa-dark-teal)', marginBottom: '8px' }}>
              Multi-Currency Configuration (All GCC & India)
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Select the operating currency for the entire platform, wallet balances, tariffs, and transaction reports.
            </p>

            <div className="form-group">
              <label className="form-label">Platform Operating Currency</label>
              <select
                className="form-select"
                value={settings.system_currency}
                onChange={(e) => {
                  const selectedCode = e.target.value;
                  const found = currencyOptions.find(c => c.code === selectedCode);
                  setSettings({
                    ...settings,
                    system_currency: selectedCode,
                    currency_decimals: found ? String(found.defaultDecimals) : '3'
                  });
                }}
              >
                {currencyOptions.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
              <span className="form-hint">All wallet top-ups, message charges, and Odoo billing logs will display in this currency.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Currency Decimal Precision</label>
              <select
                className="form-select"
                value={settings.currency_decimals}
                onChange={(e) => setSettings({ ...settings, currency_decimals: e.target.value })}
              >
                <option value="3">3 Decimals (e.g. 0.0185 BHD / 100.500 KWD)</option>
                <option value="2">2 Decimals (e.g. 2.50 SAR / 150.00 INR / $ 10.00)</option>
                <option value="4">4 Decimals (e.g. 0.0145 BHD Micro-billing)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Prepaid Wallet Enforcement</label>
              <select
                className="form-select"
                value={settings.wallet_enforcement}
                onChange={(e) => setSettings({ ...settings, wallet_enforcement: e.target.value })}
              >
                <option value="1">Strict Enforcement: Block messages when wallet balance is insufficient</option>
                <option value="0">Monitor Only: Allow dispatches and record negative balance</option>
              </select>
            </div>
          </div>
        )}

        {/* TAB 3: DATE & TIME FORMATS */}
        {activeSubTab === 'datetime' && (
          <div className="card" style={{ maxWidth: '800px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--wa-dark-teal)', marginBottom: '8px' }}>
              Date & Time Format Settings
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Standardize how timestamps, audit logs, and message telemetry are rendered across all views.
            </p>

            <div className="form-group">
              <label className="form-label">System Date & Time Format</label>
              <select
                className="form-select"
                value={settings.system_date_format}
                onChange={(e) => setSettings({ ...settings, system_date_format: e.target.value })}
              >
                {dateFormatOptions.map(df => (
                  <option key={df.value} value={df.value}>{df.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Regional Timezone</label>
              <select
                className="form-select"
                value={settings.system_timezone}
                onChange={(e) => setSettings({ ...settings, system_timezone: e.target.value })}
              >
                <option value="Asia/Bahrain">🇧🇭 Bahrain (GMT+3) - Asia/Bahrain</option>
                <option value="Asia/Riyadh">🇸🇦 Saudi Arabia (GMT+3) - Asia/Riyadh</option>
                <option value="Asia/Dubai">🇦🇪 UAE / Dubai (GMT+4) - Asia/Dubai</option>
                <option value="Asia/Kuwait">🇰🇼 Kuwait (GMT+3) - Asia/Kuwait</option>
                <option value="Asia/Qatar">🇶🇦 Qatar (GMT+3) - Asia/Qatar</option>
                <option value="Asia/Muscat">🇴🇲 Oman (GMT+4) - Asia/Muscat</option>
                <option value="Asia/Kolkata">🇮🇳 India (GMT+5:30) - Asia/Kolkata</option>
                <option value="UTC">🌐 Coordinated Universal Time (UTC)</option>
              </select>
            </div>

            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '14px', marginTop: '16px' }}>
              <div style={{ fontSize: '11.5px', color: '#166534', fontWeight: '700', textTransform: 'uppercase' }}>Live Format Preview</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#15803D', marginTop: '4px' }}>
                {formatDateTime(currentTimePreview, settings.system_date_format)}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: META CLOUD API CREDENTIALS */}
        {activeSubTab === 'meta' && (
          <div className="card" style={{ maxWidth: '850px' }}>
            {/* Superadmin vs Admin Notice */}
            {!isSuperadmin && (
              <div style={{ background: '#FEF3C7', border: '1.5px solid #FCD34D', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🔒</span>
                <div>
                  <strong style={{ fontSize: '13.5px', color: '#92400E' }}>Read-Only Meta Cloud API Credentials</strong>
                  <div style={{ fontSize: '12px', color: '#78350F', marginTop: '2px' }}>
                    WhatsApp Business Cloud API tokens, Phone ID, WABA Account ID, and Webhook verification tokens are managed exclusively by SaNDS Lab Superadmin. Admin accounts have view-only access.
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--wa-dark-teal)', margin: 0 }}>
                Meta WhatsApp Business Cloud API Credentials
              </h3>
              {isSuperadmin && (
                <span className="badge" style={{ background: '#CCFBF1', color: '#0F766E', fontWeight: '800', fontSize: '11px', padding: '4px 9px' }}>
                  👑 Superadmin Managed
                </span>
              )}
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              {isSuperadmin
                ? 'Permanent System User Graph API access tokens and Webhook validation tokens for Meta WhatsApp Cloud API v19.0.'
                : 'Active Meta WhatsApp Cloud API credentials currently operating this platform.'}
            </p>

            <div className="form-group">
              <label className="form-label">Meta Phone Number ID</label>
              <input
                type="text"
                className="form-input"
                value={settings.meta_phone_number_id}
                onChange={(e) => isSuperadmin && setSettings({ ...settings, meta_phone_number_id: e.target.value })}
                readOnly={!isSuperadmin}
                disabled={!isSuperadmin}
                style={!isSuperadmin ? { background: '#F1F5F9', cursor: 'not-allowed', color: '#475569', borderColor: '#CBD5E1' } : {}}
              />
            </div>

            <div className="form-group">
              <label className="form-label">WhatsApp Business Account ID (WABA)</label>
              <input
                type="text"
                className="form-input"
                value={settings.meta_waba_account_id}
                onChange={(e) => isSuperadmin && setSettings({ ...settings, meta_waba_account_id: e.target.value })}
                readOnly={!isSuperadmin}
                disabled={!isSuperadmin}
                style={!isSuperadmin ? { background: '#F1F5F9', cursor: 'not-allowed', color: '#475569', borderColor: '#CBD5E1' } : {}}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Permanent System User Access Token (Graph API)</label>
              <input
                type="password"
                className="form-input"
                value={settings.meta_access_token}
                onChange={(e) => isSuperadmin && setSettings({ ...settings, meta_access_token: e.target.value })}
                readOnly={!isSuperadmin}
                disabled={!isSuperadmin}
                style={!isSuperadmin ? { background: '#F1F5F9', cursor: 'not-allowed', color: '#475569', borderColor: '#CBD5E1' } : {}}
              />
              <span className="form-hint">
                {isSuperadmin
                  ? 'Active system token connected to WhatsApp Business Cloud API.'
                  : 'System token is securely managed by Superadmin.'}
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Webhook Verification Secret Token</label>
              <input
                type="text"
                className="form-input"
                value={settings.webhook_verify_token}
                onChange={(e) => isSuperadmin && setSettings({ ...settings, webhook_verify_token: e.target.value })}
                readOnly={!isSuperadmin}
                disabled={!isSuperadmin}
                style={!isSuperadmin ? { background: '#F1F5F9', cursor: 'not-allowed', color: '#475569', borderColor: '#CBD5E1' } : {}}
              />
              <span className="form-hint">Paste this token into Meta Developer App Dashboard Webhook settings.</span>
            </div>
          </div>
        )}

        {/* TAB 5: VERSION & ROADMAP ARCHITECTURE */}
        {activeSubTab === 'version' && (
          <div className="card" style={{ maxWidth: '950px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--wa-dark-teal)', margin: 0 }}>
                  WhatsApp Platform — Version & Release Architecture
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Permanent specification of active Version 2.0 generation, locked Version 1.0 baseline, and Minor version handling.
                </p>
              </div>
              <span className="version-chip" style={{ background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0', padding: '6px 14px', fontSize: '12px' }}>
                Active: v2.1.0
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Active v2.1 Block */}
              <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '12px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '14.5px', color: '#0369A1' }}>⚡ Active Release: Version 2.1.0</strong>
                  <span className="badge" style={{ background: '#16A34A', color: '#FFFFFF' }}>LIVE & ACTIVE</span>
                </div>
                <p style={{ fontSize: '12.5px', color: '#0C4A6E', margin: '0 0 8px 0', lineHeight: '1.5' }}>
                  Inbound Live Chat & Two-Way Agent Inbox is officially released with real-time Meta 24-hour customer care session tracking. Subsequent milestones follow semantic minor increments (<code style={{ background: '#E0F2FE', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>v2.x.0</code>).
                </p>
                <div style={{ fontSize: '11.5px', color: '#0284C7', fontWeight: '600' }}>
                  Git Branch: <code>main</code> • Target Host: <code>https://whatsapp.sandslab.com</code>
                </div>
              </div>

              {/* Locked v1.0 Baseline Block */}
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '14.5px', color: '#15803D' }}>🔒 Locked Baseline Milestone: Version 1.0.0</strong>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span className="badge" style={{ background: '#16A34A', color: '#FFFFFF' }}>TAG: v1.0.0</span>
                    <span className="badge" style={{ background: '#16A34A', color: '#FFFFFF' }}>TAG: v1.0</span>
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: '#166534', margin: '0 0 10px 0', lineHeight: '1.4' }}>
                  <strong>Commit Hash:</strong> <code>9dd6ebc</code> • Permanent Git checkpoint. Fully tested, production-ready, and verified.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px', fontSize: '12px', color: '#14532D' }}>
                  <div>✓ Superadmin RBAC Security Restrictions</div>
                  <div>✓ Dual Charging Engine (Option A vs B)</div>
                  <div>✓ Meta WhatsApp Cloud API v19.0 Dispatch</div>
                  <div>✓ Multi-Language Odoo API Hub</div>
                  <div>✓ Prepaid Wallet & BHD 3-Dec Audit Ledger</div>
                  <div>✓ Enterprise DataTables (DESC Sort)</div>
                </div>
              </div>

              {/* Minor Version Protocol */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px' }}>
                <strong style={{ fontSize: '13.5px', color: '#0F172A', display: 'block', marginBottom: '8px' }}>
                  📐 Semantic Minor Versioning (SemVer 2.0.0) Protocol
                </strong>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Every new update from now onward must be versioned according to standard semantic versioning rules:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px' }}>
                    <strong style={{ fontSize: '12.5px', color: '#2563EB' }}>v2.0.0 (MAJOR)</strong>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>Major architecture shift & foundational framework upgrades.</div>
                  </div>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px' }}>
                    <strong style={{ fontSize: '12.5px', color: '#059669' }}>v2.x.0 (MINOR)</strong>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>New roadmap modules (e.g., v2.1 for Odoo Webhooks, v2.2 for Campaigns, v2.3 for Live Chat).</div>
                  </div>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px' }}>
                    <strong style={{ fontSize: '12.5px', color: '#D97706' }}>v2.x.y (PATCH)</strong>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>Targeted bug fixes, security patches, styling polish, or urgent hotfixes.</div>
                  </div>
                </div>
              </div>

              {/* Version 2.0 Roadmap Table */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px' }}>
                <strong style={{ fontSize: '13.5px', color: '#0F172A', display: 'block', marginBottom: '10px' }}>
                  📋 Scheduled Development Roadmap (Next Milestones)
                </strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '12.5px', color: '#0369A1' }}>1. Odoo ERP Automated Action Webhook & Model Sync</strong>
                      <div style={{ fontSize: '11.5px', color: '#0C4A6E' }}>Inbound triggers for automated invoice generation, payment receipts, and delivery status sync.</div>
                    </div>
                    <span className="badge" style={{ background: '#0284C7', color: '#FFFFFF' }}>Target: v2.1.0</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '12.5px', color: '#334155' }}>2. Bulk Campaign Broadcasts & Queue Pacing</strong>
                      <div style={{ fontSize: '11.5px', color: '#64748B' }}>CSV contact list upload, dynamic variable mapping, and queue pacing (50 msgs/min).</div>
                    </div>
                    <span className="badge" style={{ background: '#64748B', color: '#FFFFFF' }}>Target: v2.2.0</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '12.5px', color: '#334155' }}>3. Inbound Live Chat & Two-Way Agent Inbox</strong>
                      <div style={{ fontSize: '11.5px', color: '#64748B' }}>Interactive two-way chat window allowing agents to reply inside the 24-hour Meta session window.</div>
                    </div>
                    <span className="badge" style={{ background: '#64748B', color: '#FFFFFF' }}>Target: v2.3.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab !== 'version' && (
          <div style={{ marginTop: '20px' }}>
            <button
              type="submit"
              className={`btn ${isSuperadmin || (activeSubTab !== 'tariffs' && activeSubTab !== 'meta') ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '10px 24px', fontSize: '14px', fontWeight: '700' }}
              disabled={loading || (!isSuperadmin && (activeSubTab === 'tariffs' || activeSubTab === 'meta'))}
            >
              {loading
                ? 'Saving...'
                : (!isSuperadmin && activeSubTab === 'tariffs'
                    ? '🔒 Tariffs Managed by Superadmin (Read Only)'
                    : (!isSuperadmin && activeSubTab === 'meta'
                        ? '🔒 Meta Credentials Managed by Superadmin (Read Only)'
                        : '💾 Save & Apply System Configuration'))}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

// Render React App into #root
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}


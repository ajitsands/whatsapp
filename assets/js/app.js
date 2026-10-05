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
  defaultSortDir = 'asc',
  title = 'export',
  actions = null,
  emptyMessage = 'No matching records found.'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState(defaultSortKey || (columns[0]?.key || ''));
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

  // Sort rows
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
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
        : String(bVal).localeCompare(String(aVal), undefined, { numeric: true });
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
      setSortDir('asc');
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
    const validTabs = ['dashboard', 'composer', 'logs', 'templates', 'api_hub', 'api_keys', 'users', 'wallet', 'settings'];
    if (hash && validTabs.includes(hash)) return hash;
    if (saved && validTabs.includes(saved)) return saved;
    return 'dashboard';
  });

  const [toast, setToast] = useState(null);

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
      const validTabs = ['dashboard', 'composer', 'logs', 'templates', 'api_hub', 'api_keys', 'users', 'wallet', 'settings'];
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
              <button className={`nav-item ${activeTab === 'composer' ? 'active' : ''}`} onClick={() => navigateToTab('composer')}>
                <span>💬</span> Send Message
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
        {activeTab === 'composer' && <ComposerView showToast={showToast} onSent={() => { navigateToTab('logs'); loadWalletBalance(); }} globalSettings={globalSettings} />}
        {activeTab === 'logs' && <MessageLogsView showToast={showToast} globalSettings={globalSettings} />}
        {activeTab === 'templates' && <TemplatesView showToast={showToast} globalSettings={globalSettings} />}
        {activeTab === 'wallet' && <WalletView currentUser={currentUser} showToast={showToast} globalSettings={globalSettings} onBalanceChange={setWalletBalance} />}
        {activeTab === 'api_hub' && <OdooApiHubView showToast={showToast} globalSettings={globalSettings} />}
        {activeTab === 'api_keys' && <ApiKeysView showToast={showToast} />}
        {activeTab === 'users' && <UsersView currentUser={currentUser} showToast={showToast} />}
        {activeTab === 'settings' && <SettingsView showToast={showToast} onSettingsChange={(s) => { setGlobalSettings(prev => ({ ...prev, ...s })); loadWalletBalance(); }} />}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-left">
            All Rights Reserved | Engineered By SaNDS Lab Middle East W.L.L.
          </div>
          <div className="footer-right">
            <span className="footer-badge">WhatsApp Cloud API v19.0</span>
            <span className="footer-badge">Odoo ERP Connector Active</span>
            <span>Bahrain (BHD) Tariff Active</span>
          </div>
        </div>
      </footer>
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
function ConversationChatModal({ phone, onClose, showToast }) {
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
                      <span>{msg.created_at ? msg.created_at.split(' ')[1] : ''}</span>
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
// 4. MESSAGE LOGS VIEW (WITH DATATABLE & LIVE CONVERSATIONS)
// -----------------------------------------------------------------------------
function MessageLogsView({ showToast }) {
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
      render: (c) => <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{c.created_at}</span>
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
      render: (m) => <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{m.created_at}</span>
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

  const handleDeleteTemplate = async (id, name) => {
    if (!confirm(`Are you sure you want to delete template "${name}"?`)) return;
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
    }
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
          template_name: '', display_title: '', category: 'UTILITY', language: 'en',
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
                  <label className="form-label">Language Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="en, ar"
                    value={editingTemplate.language}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, language: e.target.value })}
                  />
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

  const pythonSnippet = `import requests

API_URL = "http://your-server-ip/whatsapp/api/messages.php"
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
    return response.json()`;

  return (
    <div>
      <div className="page-header-row">
        <div className="page-title-group">
          <h1><span>⚡</span> Odoo ERP Integration & API Hub</h1>
          <p>REST API documentation, live testing console, and copyable Python integration snippets for Odoo developers.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left: Interactive API Request Runner */}
        <div className="card">
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
              <div className="code-box">
                <pre>{responseOutput}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Right: Odoo Python Snippet */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><span>🐍</span> Odoo ERP Python Model Action Code</span>
            <button className="btn-copy-code" onClick={() => {
              navigator.clipboard.writeText(pythonSnippet);
              showToast('Python snippet copied to clipboard!');
            }}>Copy Code</button>
          </div>
          <div className="code-box" style={{ minHeight: '380px' }}>
            <div className="code-box-header">
              <span>odoo_whatsapp_connector.py</span>
            </div>
            <pre>{pythonSnippet}</pre>
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

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
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
    }
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
    const d = new Date(dateStr);
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
function SettingsView({ showToast, onSettingsChange }) {
  const [activeSubTab, setActiveSubTab] = useState('tariffs'); // 'meta', 'tariffs', 'currency', 'datetime'
  const [settings, setSettings] = useState({
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
      </div>

      <form onSubmit={handleSave}>
        {/* TAB 1: TARIFFS & PRICING ENGINE */}
        {activeSubTab === 'tariffs' && (
          <div className="card" style={{ maxWidth: '900px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--wa-dark-teal)', marginBottom: '8px' }}>
              Dynamic Meta Cost & Platform Charges Engine
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Configure the exact Meta Cost and SaNDS Platform Margin per message category. These tariffs take effect dynamically across all outgoing message dispatches, wallet debits, and client billing.
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
                      onChange={(e) => setSettings({ ...settings, tariff_utility_meta: e.target.value })}
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
                      onChange={(e) => setSettings({ ...settings, tariff_utility_platform: e.target.value })}
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
                      onChange={(e) => setSettings({ ...settings, tariff_auth_meta: e.target.value })}
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
                      onChange={(e) => setSettings({ ...settings, tariff_auth_platform: e.target.value })}
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
                      onChange={(e) => setSettings({ ...settings, tariff_marketing_meta: e.target.value })}
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
                      onChange={(e) => setSettings({ ...settings, tariff_marketing_platform: e.target.value })}
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
                      onChange={(e) => setSettings({ ...settings, tariff_service_meta: e.target.value })}
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
                      onChange={(e) => setSettings({ ...settings, tariff_service_platform: e.target.value })}
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
          <div className="card" style={{ maxWidth: '800px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--wa-dark-teal)', marginBottom: '8px' }}>
              Meta WhatsApp Business Cloud API Credentials
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Permanent System User Graph API access tokens and Webhook validation tokens.
            </p>

            <div className="form-group">
              <label className="form-label">Meta Phone Number ID</label>
              <input
                type="text"
                className="form-input"
                value={settings.meta_phone_number_id}
                onChange={(e) => setSettings({ ...settings, meta_phone_number_id: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">WhatsApp Business Account ID (WABA)</label>
              <input
                type="text"
                className="form-input"
                value={settings.meta_waba_account_id}
                onChange={(e) => setSettings({ ...settings, meta_waba_account_id: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Permanent System User Access Token (Graph API)</label>
              <input
                type="password"
                className="form-input"
                value={settings.meta_access_token}
                onChange={(e) => setSettings({ ...settings, meta_access_token: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Webhook Verification Secret Token</label>
              <input
                type="text"
                className="form-input"
                value={settings.webhook_verify_token}
                onChange={(e) => setSettings({ ...settings, webhook_verify_token: e.target.value })}
              />
              <span className="form-hint">Paste this token into Meta Developer App Dashboard Webhook settings.</span>
            </div>
          </div>
        )}

        <div style={{ marginTop: '20px' }}>
          <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '14px', fontWeight: '700' }} disabled={loading}>
            {loading ? 'Saving...' : '💾 Save & Apply System Configuration'}
          </button>
        </div>
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


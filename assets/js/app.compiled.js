const { useState, useEffect, useMemo, useRef } = React;
function DataTable({
  columns,
  data = [],
  searchable = true,
  searchPlaceholder = "Search records...",
  pageSizeOptions = [5, 10, 25, 50],
  defaultPageSize = 10,
  defaultSortKey = "",
  defaultSortDir = "desc",
  title = "export",
  actions = null,
  emptyMessage = "No matching records found."
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [currentPage, setCurrentPage] = useState(1);
  const initialSortKey = defaultSortKey !== void 0 && defaultSortKey !== "" ? defaultSortKey : columns.find((c) => c.key === "created_at" || c.key === "id")?.key || (columns[0]?.key || "");
  const [sortKey, setSortKey] = useState(initialSortKey);
  const [sortDir, setSortDir] = useState(defaultSortDir);
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((row) => {
      return columns.some((col) => {
        const val = row[col.key];
        if (val === null || val === void 0) return false;
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm, columns]);
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];
      if (aVal === null || aVal === void 0) aVal = "";
      if (bVal === null || bVal === void 0) bVal = "";
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const numA = Number(aVal);
      const numB = Number(bVal);
      if (!isNaN(numA) && !isNaN(numB) && typeof aVal !== "boolean" && typeof bVal !== "boolean" && aVal !== "" && bVal !== "") {
        return sortDir === "asc" ? numA - numB : numB - numA;
      }
      return sortDir === "asc" ? String(aVal).localeCompare(String(bVal), void 0, { numeric: true, sensitivity: "base" }) : String(bVal).localeCompare(String(aVal), void 0, { numeric: true, sensitivity: "base" });
    });
  }, [filteredData, sortKey, sortDir]);
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
      setSortDir((prev) => prev === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };
  const exportCSV = () => {
    const headerRow = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(",");
    const bodyRows = sortedData.map((row) => {
      return columns.map((c) => {
        let val = row[c.key];
        if (val === null || val === void 0) val = "";
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(",");
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
  return /* @__PURE__ */ React.createElement("div", { className: "datatable-container" }, /* @__PURE__ */ React.createElement("div", { className: "datatable-header" }, /* @__PURE__ */ React.createElement("div", { className: "datatable-length" }, /* @__PURE__ */ React.createElement("span", null, "Show"), /* @__PURE__ */ React.createElement("select", { value: pageSize, onChange: (e) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  } }, pageSizeOptions.map((opt) => /* @__PURE__ */ React.createElement("option", { key: opt, value: opt }, opt))), /* @__PURE__ */ React.createElement("span", null, "entries")), /* @__PURE__ */ React.createElement("div", { className: "datatable-tools" }, actions, /* @__PURE__ */ React.createElement("button", { className: "btn-export", onClick: exportCSV, title: "Export table data to CSV file" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4E5}"), " Export CSV"), searchable && /* @__PURE__ */ React.createElement("div", { className: "datatable-search" }, /* @__PURE__ */ React.createElement("span", { className: "datatable-search-icon" }, "\u{1F50D}"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: searchPlaceholder,
      value: searchTerm,
      onChange: (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
      }
    }
  )))), /* @__PURE__ */ React.createElement("div", { className: "data-table-wrapper" }, /* @__PURE__ */ React.createElement("table", { className: "data-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, columns.map((col) => {
    const isSorted = sortKey === col.key;
    const isSortable = col.sortable !== false;
    return /* @__PURE__ */ React.createElement(
      "th",
      {
        key: col.key,
        className: `${isSortable ? "sortable" : ""} ${isSorted ? "sorted" : ""}`,
        onClick: () => handleSort(col.key, isSortable),
        style: col.width ? { width: col.width } : {}
      },
      col.label,
      isSortable && /* @__PURE__ */ React.createElement("span", { className: "sort-indicator" }, isSorted ? sortDir === "asc" ? " \u25B2" : " \u25BC" : " \u21C5")
    );
  }))), /* @__PURE__ */ React.createElement("tbody", null, paginatedData.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: columns.length, style: { textAlign: "center", padding: "32px", color: "var(--text-muted)" } }, emptyMessage)) : paginatedData.map((row, rowIdx) => /* @__PURE__ */ React.createElement("tr", { key: row.id || rowIdx }, columns.map((col) => /* @__PURE__ */ React.createElement("td", { key: col.key }, col.render ? col.render(row) : row[col.key] ?? ""))))))), /* @__PURE__ */ React.createElement("div", { className: "datatable-footer" }, /* @__PURE__ */ React.createElement("div", { className: "datatable-info" }, "Showing ", startIdx, " to ", endIdx, " of ", totalEntries, " entries", searchTerm && ` (filtered from ${data.length} total entries)`), /* @__PURE__ */ React.createElement("div", { className: "datatable-pagination" }, /* @__PURE__ */ React.createElement("button", { className: "page-btn", disabled: safeCurrentPage <= 1, onClick: () => setCurrentPage((prev) => Math.max(1, prev - 1)) }, "\u2039 Prev"), Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    let pageNum = safeCurrentPage <= 3 ? i + 1 : safeCurrentPage + i - 2;
    if (pageNum > totalPages) pageNum = totalPages - (4 - i);
    if (pageNum < 1) pageNum = i + 1;
    if (pageNum > totalPages) return null;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: pageNum,
        className: `page-btn ${safeCurrentPage === pageNum ? "active" : ""}`,
        onClick: () => setCurrentPage(pageNum)
      },
      pageNum
    );
  }), /* @__PURE__ */ React.createElement("button", { className: "page-btn", disabled: safeCurrentPage >= totalPages, onClick: () => setCurrentPage((prev) => Math.min(totalPages, prev + 1)) }, "Next \u203A"))));
}
function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("wa_user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(!currentUser);
  const [globalSettings, setGlobalSettings] = useState({
    system_currency: "BHD",
    currency_decimals: "3",
    system_date_format: "YYYY-MM-DD HH:mm:ss",
    system_timezone: "Asia/Bahrain",
    tariff_utility_meta: "0.0140",
    tariff_utility_platform: "0.0045",
    tariff_auth_meta: "0.0110",
    tariff_auth_platform: "0.0035",
    tariff_marketing_meta: "0.0270",
    tariff_marketing_platform: "0.0070",
    tariff_service_meta: "0.0075",
    tariff_service_platform: "0.0025",
    wallet_enforcement: "1"
  });
  const [walletBalance, setWalletBalance] = useState(0);
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace("#", "").trim();
    const saved = localStorage.getItem("wa_tab");
    const validTabs = ["dashboard", "composer", "logs", "templates", "api_hub", "api_keys", "users", "wallet", "settings"];
    if (hash && validTabs.includes(hash)) return hash;
    if (saved && validTabs.includes(saved)) return saved;
    return "dashboard";
  });
  const [toast, setToast] = useState(null);
  const navigateToTab = (tab) => {
    setActiveTab(tab);
    try {
      window.location.hash = tab;
      localStorage.setItem("wa_tab", tab);
    } catch (e) {
    }
  };
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "").trim();
      const validTabs = ["dashboard", "composer", "logs", "templates", "api_hub", "api_keys", "users", "wallet", "settings"];
      if (hash && validTabs.includes(hash)) {
        setActiveTab(hash);
        localStorage.setItem("wa_tab", hash);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);
  const loadGlobalSettings = async () => {
    try {
      const res = await fetch("./api/settings.php");
      const data = await res.json();
      if (data.success && data.settings) {
        setGlobalSettings((prev) => ({ ...prev, ...data.settings }));
      }
    } catch (e) {
    }
  };
  const loadWalletBalance = async () => {
    try {
      const res = await fetch("./api/wallet.php?limit=1");
      const data = await res.json();
      if (data.success && data.wallet_balance !== void 0) {
        setWalletBalance(parseFloat(data.wallet_balance));
      }
    } catch (e) {
    }
  };
  useEffect(() => {
    checkAuth();
    loadGlobalSettings();
    loadWalletBalance();
  }, []);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4e3);
  };
  const checkAuth = async () => {
    try {
      const res = await fetch("./api/auth.php?action=check", {
        headers: currentUser ? { "X-User-Id": String(currentUser.id), "X-User-Email": currentUser.email } : {}
      });
      const data = await res.json();
      if (data.success && data.authenticated && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem("wa_user", JSON.stringify(data.user));
        loadWalletBalance();
      } else if (!currentUser) {
        setCurrentUser(null);
        localStorage.removeItem("wa_user");
      }
    } catch (e) {
      console.error("Auth check error", e);
    } finally {
      setLoading(false);
    }
  };
  const handleLogin = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("wa_user", JSON.stringify(user));
    } catch (e) {
    }
    showToast(`Welcome back, ${user.name}!`);
    loadGlobalSettings();
    loadWalletBalance();
  };
  const handleLogout = async () => {
    try {
      await fetch("./api/auth.php?action=logout");
      setCurrentUser(null);
      localStorage.removeItem("wa_user");
      localStorage.removeItem("wa_tab");
      window.location.hash = "";
      showToast("You have been logged out.");
    } catch (e) {
      console.error(e);
    }
  };
  const switchDemoRole = async (role) => {
    try {
      const res = await fetch("./api/auth.php?action=switch_demo_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        try {
          localStorage.setItem("wa_user", JSON.stringify(data.user));
        } catch (e) {
        }
        showToast(`Switched to ${data.user.name} (${role.toUpperCase()})`);
        loadWalletBalance();
      }
    } catch (e) {
      console.error(e);
    }
  };
  if (loading && !currentUser) {
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", gap: "12px" } }, /* @__PURE__ */ React.createElement("div", { className: "brand-badge" }, /* @__PURE__ */ React.createElement("span", { className: "dot" }), " Loading SaNDS Platform..."));
  }
  if (!currentUser) {
    return /* @__PURE__ */ React.createElement(LoginView, { onLogin: handleLogin, onSwitchDemo: switchDemoRole });
  }
  const curr = globalSettings?.system_currency || "BHD";
  const dec = parseInt(globalSettings?.currency_decimals || "3", 10);
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", minHeight: "100vh" } }, toast && /* @__PURE__ */ React.createElement("div", { style: {
    position: "fixed",
    top: "20px",
    right: "24px",
    zIndex: 9999,
    background: toast.type === "error" ? "#EF4444" : "#075E54",
    color: "#fff",
    padding: "12px 20px",
    borderRadius: "8px",
    boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
    fontSize: "13px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  } }, /* @__PURE__ */ React.createElement("span", null, toast.type === "error" ? "\u26A0\uFE0F" : "\u2705"), toast.message), /* @__PURE__ */ React.createElement("header", { className: "app-header" }, /* @__PURE__ */ React.createElement("div", { className: "header-top-bar" }, /* @__PURE__ */ React.createElement("div", { className: "header-top-inner" }, /* @__PURE__ */ React.createElement("div", { className: "header-brand" }, /* @__PURE__ */ React.createElement("img", { src: "./assets/logos/SaNDSLab-LogoNewUpdated.png", alt: "SaNDS Lab Middle East", className: "brand-logo" }), /* @__PURE__ */ React.createElement("div", { className: "brand-badge" }, /* @__PURE__ */ React.createElement("span", { className: "dot" }), " WhatsApp Gateway")), /* @__PURE__ */ React.createElement("div", { className: "header-actions" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "wallet-header-pill",
      onClick: () => navigateToTab("wallet"),
      title: "Click to manage Wallet & view Billing Statement"
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F4B3}"),
    /* @__PURE__ */ React.createElement("span", null, "Wallet: ", /* @__PURE__ */ React.createElement("strong", null, formatCurrency(walletBalance, curr, dec)))
  ), /* @__PURE__ */ React.createElement("div", { className: "user-profile-pill", title: `Logged in as ${currentUser.email}` }, /* @__PURE__ */ React.createElement("div", { className: "avatar", style: { background: currentUser.avatar_color || "#128C7E" } }, currentUser.name.charAt(0)), /* @__PURE__ */ React.createElement("div", { className: "user-details" }, /* @__PURE__ */ React.createElement("span", { className: "user-name" }, currentUser.name), /* @__PURE__ */ React.createElement("span", { className: "user-role-badge" }, currentUser.role))), /* @__PURE__ */ React.createElement("button", { className: "btn-logout", onClick: handleLogout, title: "Sign Out" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F6AA}"), " Logout")))), /* @__PURE__ */ React.createElement("div", { className: "header-nav-bar" }, /* @__PURE__ */ React.createElement("div", { className: "header-nav-inner" }, /* @__PURE__ */ React.createElement("nav", { className: "horizontal-nav" }, /* @__PURE__ */ React.createElement("button", { className: `nav-item ${activeTab === "dashboard" ? "active" : ""}`, onClick: () => navigateToTab("dashboard") }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4CA}"), " Dashboard"), /* @__PURE__ */ React.createElement("button", { className: `nav-item ${activeTab === "composer" ? "active" : ""}`, onClick: () => navigateToTab("composer") }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4AC}"), " Send Message"), /* @__PURE__ */ React.createElement("button", { className: `nav-item ${activeTab === "logs" ? "active" : ""}`, onClick: () => navigateToTab("logs") }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4DC}"), " Message Logs"), /* @__PURE__ */ React.createElement("button", { className: `nav-item ${activeTab === "templates" ? "active" : ""}`, onClick: () => navigateToTab("templates") }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4CB}"), " Templates & Tariffs"), /* @__PURE__ */ React.createElement("button", { className: `nav-item ${activeTab === "wallet" ? "active" : ""}`, onClick: () => navigateToTab("wallet") }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4B3}"), " Wallet & Billing"), /* @__PURE__ */ React.createElement("button", { className: `nav-item ${activeTab === "api_hub" ? "active" : ""}`, onClick: () => navigateToTab("api_hub") }, /* @__PURE__ */ React.createElement("span", null, "\u26A1"), " Odoo API Hub"), ["superadmin", "admin"].includes(currentUser.role) && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: `nav-item ${activeTab === "api_keys" ? "active" : ""}`, onClick: () => navigateToTab("api_keys") }, /* @__PURE__ */ React.createElement("span", null, "\u{1F511}"), " API Keys"), /* @__PURE__ */ React.createElement("button", { className: `nav-item ${activeTab === "users" ? "active" : ""}`, onClick: () => navigateToTab("users") }, /* @__PURE__ */ React.createElement("span", null, "\u{1F465}"), " Users"), /* @__PURE__ */ React.createElement("button", { className: `nav-item ${activeTab === "settings" ? "active" : ""}`, onClick: () => navigateToTab("settings") }, /* @__PURE__ */ React.createElement("span", null, "\u2699\uFE0F"), " Engine Settings")))))), /* @__PURE__ */ React.createElement("main", { className: "app-body" }, activeTab === "dashboard" && /* @__PURE__ */ React.createElement(DashboardView, { onNavigate: navigateToTab, globalSettings }), activeTab === "composer" && /* @__PURE__ */ React.createElement(ComposerView, { showToast, onSent: () => {
    navigateToTab("logs");
    loadWalletBalance();
  }, globalSettings }), activeTab === "logs" && /* @__PURE__ */ React.createElement(MessageLogsView, { showToast, globalSettings }), activeTab === "templates" && /* @__PURE__ */ React.createElement(TemplatesView, { showToast, globalSettings }), activeTab === "wallet" && /* @__PURE__ */ React.createElement(WalletView, { currentUser, showToast, globalSettings, onBalanceChange: setWalletBalance }), activeTab === "api_hub" && /* @__PURE__ */ React.createElement(OdooApiHubView, { showToast, globalSettings }), activeTab === "api_keys" && /* @__PURE__ */ React.createElement(ApiKeysView, { showToast }), activeTab === "users" && /* @__PURE__ */ React.createElement(UsersView, { currentUser, showToast }), activeTab === "settings" && /* @__PURE__ */ React.createElement(SettingsView, { showToast, onSettingsChange: (s) => {
    setGlobalSettings((prev) => ({ ...prev, ...s }));
    loadWalletBalance();
  } })), /* @__PURE__ */ React.createElement("footer", { className: "app-footer" }, /* @__PURE__ */ React.createElement("div", { className: "footer-inner" }, /* @__PURE__ */ React.createElement("div", { className: "footer-left" }, "All Rights Reserved | Engineered By SaNDS Lab Middle East W.L.L."), /* @__PURE__ */ React.createElement("div", { className: "footer-right" }, /* @__PURE__ */ React.createElement("span", { className: "footer-badge" }, "WhatsApp Cloud API v19.0"), /* @__PURE__ */ React.createElement("span", { className: "footer-badge" }, "Odoo ERP Connector Active"), /* @__PURE__ */ React.createElement("span", null, "Bahrain (BHD) Tariff Active")))));
}
function LoginView({ onLogin, onSwitchDemo }) {
  const [email, setEmail] = useState("superadmin@sandslab.com");
  const [password, setPassword] = useState("Password@123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submitLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("./api/auth.php?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const pickPreset = (presetEmail, role) => {
    setEmail(presetEmail);
    setPassword("Password@123");
    onSwitchDemo(role);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "login-container" }, /* @__PURE__ */ React.createElement("div", { className: "login-card" }, /* @__PURE__ */ React.createElement("div", { className: "login-header" }, /* @__PURE__ */ React.createElement("img", { src: "./assets/logos/SaNDSLab-LogoNewUpdated.png", alt: "SaNDS Lab", className: "login-logo" }), /* @__PURE__ */ React.createElement("h2", null, "WhatsApp Integration Platform"), /* @__PURE__ */ React.createElement("p", null, "Sign in to manage messaging, templates, and Odoo ERP webhooks")), /* @__PURE__ */ React.createElement("div", { className: "preset-roles-box" }, /* @__PURE__ */ React.createElement("div", { className: "preset-roles-title" }, "\u26A1 Quick Sign-In by Role:"), /* @__PURE__ */ React.createElement("div", { className: "preset-buttons-row" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn-preset", onClick: () => pickPreset("superadmin@sandslab.com", "superadmin") }, "\u{1F451} Superadmin"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn-preset", onClick: () => pickPreset("admin@uniglobal.bh", "admin") }, "\u{1F6E1}\uFE0F Admin"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn-preset", onClick: () => pickPreset("user@uniglobal.bh", "user") }, "\u{1F464} User"))), error && /* @__PURE__ */ React.createElement("div", { style: { background: "#FEE2E2", color: "#B91C1C", padding: "10px 14px", borderRadius: "8px", fontSize: "12.5px", marginBottom: "16px", fontWeight: "600" } }, "\u26A0\uFE0F ", error), /* @__PURE__ */ React.createElement("form", { onSubmit: submitLogin }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Email Address"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "email",
      className: "form-input",
      value: email,
      onChange: (e) => setEmail(e.target.value),
      required: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Password"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "password",
      className: "form-input",
      value: password,
      onChange: (e) => setPassword(e.target.value),
      required: true
    }
  )), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-primary", style: { width: "100%", padding: "10px", marginTop: "6px" }, disabled: loading }, loading ? "Authenticating..." : "Sign In to Gateway")), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginTop: "24px", fontSize: "11.5px", color: "var(--text-muted)" } }, "All Rights Reserved | Engineered By SaNDS Lab Middle East W.L.L.")));
}
function DashboardView({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const loadAnalytics = () => {
      fetch("./api/analytics.php").then((res) => res.json()).then((res) => {
        if (res.success) setData(res);
      }).finally(() => setLoading(false));
    };
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 4e3);
    return () => clearInterval(interval);
  }, []);
  if (loading && !data) {
    return /* @__PURE__ */ React.createElement("div", { className: "card" }, "Loading real-time analytics...");
  }
  if (!data) return null;
  const { kpis, categories, daily_volume, integrations } = data;
  const integrationColumns = [
    {
      key: "source_system",
      label: "Source Integration",
      render: (row) => /* @__PURE__ */ React.createElement("strong", null, row.source_system)
    },
    {
      key: "volume",
      label: "Message Volume",
      render: (row) => /* @__PURE__ */ React.createElement("span", { className: "badge status-read" }, row.volume, " msgs")
    },
    {
      key: "last_activity",
      label: "Last Activity",
      render: (row) => /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text-muted)", fontSize: "11.5px" } }, row.last_activity)
    }
  ];
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "page-header-row" }, /* @__PURE__ */ React.createElement("div", { className: "page-title-group" }, /* @__PURE__ */ React.createElement("h1", null, /* @__PURE__ */ React.createElement("span", null, "\u{1F4CA}"), " Operational Dashboard & Metrics"), /* @__PURE__ */ React.createElement("p", null, "Real-time telemetry of WhatsApp Business API throughput, delivery reliability, and billing tariffs.")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-success", onClick: () => onNavigate("composer") }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4AC}"), " Send New Message")), /* @__PURE__ */ React.createElement("div", { className: "kpi-grid" }, /* @__PURE__ */ React.createElement("div", { className: "kpi-card accent-green" }, /* @__PURE__ */ React.createElement("span", { className: "kpi-label" }, "Total Volume"), /* @__PURE__ */ React.createElement("span", { className: "kpi-value" }, kpis.total_messages.toLocaleString()), /* @__PURE__ */ React.createElement("span", { className: "kpi-sub positive" }, /* @__PURE__ */ React.createElement("span", null, "\u2191"), " ", kpis.outbound_count, " Outbound | ", kpis.inbound_count, " Inbound")), /* @__PURE__ */ React.createElement("div", { className: "kpi-card accent-blue" }, /* @__PURE__ */ React.createElement("span", { className: "kpi-label" }, "Delivery Reliability"), /* @__PURE__ */ React.createElement("span", { className: "kpi-value" }, kpis.delivery_rate, "%"), /* @__PURE__ */ React.createElement("span", { className: "kpi-sub positive" }, /* @__PURE__ */ React.createElement("span", null, "\u2713\u2713"), " ", kpis.read_rate, "% Read Rate")), /* @__PURE__ */ React.createElement("div", { className: "kpi-card accent-purple" }, /* @__PURE__ */ React.createElement("span", { className: "kpi-label" }, "Total Billed (BHD)"), /* @__PURE__ */ React.createElement("span", { className: "kpi-value" }, "BHD ", kpis.total_client_bhd), /* @__PURE__ */ React.createElement("span", { className: "kpi-sub" }, "Bahrain Market Official Schedule")), /* @__PURE__ */ React.createElement("div", { className: "kpi-card accent-amber" }, /* @__PURE__ */ React.createElement("span", { className: "kpi-label" }, "Cost Breakdown"), /* @__PURE__ */ React.createElement("span", { className: "kpi-value" }, "BHD ", kpis.total_platform_bhd), /* @__PURE__ */ React.createElement("span", { className: "kpi-sub" }, "Platform Margin | Meta Cost: BHD ", kpis.total_meta_cost_bhd))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" } }, /* @__PURE__ */ React.createElement("div", { className: "card", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "card-header" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F3F7}\uFE0F"), " Message Volume by Meta Category")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "14px" } }, categories.map((cat, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", flexDirection: "column", gap: "5px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "12.5px", fontWeight: "700" } }, /* @__PURE__ */ React.createElement("span", { className: `badge cat-${cat.category.toLowerCase().substring(0, 4)}` }, cat.category), /* @__PURE__ */ React.createElement("span", null, cat.message_count, " msgs (", parseFloat(cat.category_billed_bhd).toFixed(4), " BHD)")), /* @__PURE__ */ React.createElement("div", { style: { height: "7px", background: "#F1F5F9", borderRadius: "4px", overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: `${Math.min(100, cat.message_count / (kpis.total_messages || 1) * 100)}%`,
    height: "100%",
    background: cat.category === "UTILITY" ? "#10B981" : cat.category === "AUTHENTICATION" ? "#3B82F6" : cat.category === "MARKETING" ? "#8B5CF6" : "#06B6D4"
  } })))))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: "10px", fontWeight: "700", fontSize: "14px", color: "var(--text-primary)" } }, /* @__PURE__ */ React.createElement("span", null, "\u{1F517}"), " Active System Connectors"), /* @__PURE__ */ React.createElement(
    DataTable,
    {
      columns: integrationColumns,
      data: integrations,
      title: "active_integrations",
      searchPlaceholder: "Search connectors...",
      defaultPageSize: 5,
      pageSizeOptions: [5, 10, 20]
    }
  ))));
}
function ComposerView({ showToast, onSent }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [toPhone, setToPhone] = useState("+97339000000");
  const [category, setCategory] = useState("UTILITY");
  const [mediaUrl, setMediaUrl] = useState("https://erp.uniglobal.bh/INV_9941.pdf");
  const [mediaName, setMediaName] = useState("INV_9941.pdf");
  const [params, setParams] = useState(["Ahmed Al-Khalifa", "INV/2026/0142", "BHD 345.500", "15-Oct-2026"]);
  const [customText, setCustomText] = useState("");
  const [sending, setSending] = useState(false);
  useEffect(() => {
    fetch("./api/templates.php").then((res) => res.json()).then((res) => {
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
    const varMatches = tmpl.body_text ? tmpl.body_text.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) : null;
    let detectedVarNames = varMatches ? varMatches.map((m) => m.replace(/[\{\}]/g, "").trim()) : [];
    if (detectedVarNames.length === 0) {
      const numMatches = tmpl.body_text ? tmpl.body_text.match(/\{+[\(\[]?\s*(\d+)\s*[\)\]]?\}+/g) : null;
      if (numMatches) {
        detectedVarNames = numMatches.map((m) => m.replace(/\D/g, "").trim());
      }
    }
    const totalVars = Math.max(detectedVarNames.length, parseInt(tmpl.variable_count) || 0);
    let existingParams = [];
    if (tmpl.sample_params_json) {
      try {
        const parsed = typeof tmpl.sample_params_json === "string" ? JSON.parse(tmpl.sample_params_json) : tmpl.sample_params_json;
        if (Array.isArray(parsed)) existingParams = parsed;
      } catch (e) {
      }
    }
    const finalParams = [];
    for (let i = 0; i < totalVars; i++) {
      if (existingParams[i] !== void 0 && existingParams[i] !== null && existingParams[i] !== "") {
        finalParams.push(existingParams[i]);
      } else {
        const vName = detectedVarNames[i] || `Param ${i + 1}`;
        finalParams.push(vName.includes("_") ? vName.replace(/_/g, " ") : `Value ${i + 1}`);
      }
    }
    setParams(finalParams);
    if (tmpl.header_sample) {
      setMediaUrl(tmpl.header_sample);
      setMediaName(tmpl.header_sample.split("/").pop() || "document.pdf");
    } else {
      setMediaUrl("");
      setMediaName("");
    }
  };
  const renderedText = useMemo(() => {
    if (!selectedTemplate) return customText || "Type your message...";
    const tmpl = templates.find((t) => t.template_name === selectedTemplate);
    if (!tmpl) return "";
    let body = tmpl.body_text;
    const varMatches = tmpl.body_text ? tmpl.body_text.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) : null;
    const detectedVarNames = varMatches ? varMatches.map((m) => m.replace(/[\{\}]/g, "").trim()) : [];
    params.forEach((val, idx) => {
      const varName = detectedVarNames[idx] || String(idx + 1);
      const valText = val || `[${varName}]`;
      body = body.split(`{{${varName}}}`).join(valText);
      const pattern = new RegExp(`\\{+[\\(\\[]?\\s*${varName}\\s*[\\)\\]]?\\}+`, "g");
      body = body.replace(pattern, valText);
    });
    return body;
  }, [selectedTemplate, templates, params, customText]);
  const currentTemplateObj = templates.find((t) => t.template_name === selectedTemplate);
  const tariffEstimate = useMemo(() => {
    const rates = {
      "AUTHENTICATION": { meta: 0.011, platform: 35e-4, client: 0.0145 },
      "UTILITY": { meta: 0.014, platform: 45e-4, client: 0.0185 },
      "MARKETING": { meta: 0.027, platform: 7e-3, client: 0.034 },
      "SERVICE": { meta: 75e-4, platform: 25e-4, client: 0.01 }
    };
    return rates[category] || rates["UTILITY"];
  }, [category]);
  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const payload = {
        to_phone: toPhone,
        template_name: selectedTemplate || null,
        category,
        message: customText,
        body_parameters: params,
        header_media: mediaUrl ? { url: mediaUrl, filename: mediaName } : null,
        source_system: "Manual Web Console"
      };
      const res = await fetch("./api/messages.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => null);
      if (data && data.success) {
        if (data.status === "failed" && data.meta_error) {
          showToast(`Meta Error: ${data.meta_error}`, "error");
        } else if (data.status === "simulated") {
          showToast(`Dispatched in Simulation Mode (Enter Meta Token in Settings for Live)`, "success");
        } else {
          showToast(`WhatsApp Message Dispatched to ${toPhone}! (Rate: ${data.tariff?.client_rate})`);
        }
        onSent();
      } else {
        showToast(data && data.error || `Server Error (HTTP ${res.status})`, "error");
      }
    } catch (err) {
      showToast("Error: " + err.message, "error");
    } finally {
      setSending(false);
    }
  };
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "page-header-row" }, /* @__PURE__ */ React.createElement("div", { className: "page-title-group" }, /* @__PURE__ */ React.createElement("h1", null, /* @__PURE__ */ React.createElement("span", null, "\u{1F4AC}"), " Interactive Message Composer"), /* @__PURE__ */ React.createElement("p", null, "Compose pre-approved WhatsApp templates or direct customer notifications with real-time phone preview."))), /* @__PURE__ */ React.createElement("div", { className: "composer-layout" }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("form", { onSubmit: handleSend }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Recipient Phone Number (E.164 Format)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      value: toPhone,
      onChange: (e) => setToPhone(e.target.value),
      placeholder: "+97339000000",
      required: true
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "form-hint" }, "Includes Bahrain country code (+973) or international destination")), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "WhatsApp Meta Template"), /* @__PURE__ */ React.createElement(
    "select",
    {
      className: "form-select",
      value: selectedTemplate,
      onChange: (e) => {
        const tmpl = templates.find((t) => t.template_name === e.target.value);
        if (tmpl) pickTemplate(tmpl);
        else setSelectedTemplate("");
      }
    },
    templates.map((t) => /* @__PURE__ */ React.createElement("option", { key: t.id, value: t.template_name }, t.display_title, " [", t.category, "]")),
    /* @__PURE__ */ React.createElement("option", { value: "" }, "-- Custom Direct Text Message --")
  )), selectedTemplate && currentTemplateObj && /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Template Dynamic Parameters (", params.length, " Variables)"), /* @__PURE__ */ React.createElement("div", { className: "param-grid" }, params.map((val, idx) => {
    const varMatches = (currentTemplateObj.body_text || "").match(/\{\{([a-zA-Z0-9_]+)\}\}/g);
    const detectedVarNames = varMatches ? varMatches.map((m) => m.replace(/[\{\}]/g, "").trim()) : [];
    const varName = detectedVarNames[idx] || String(idx + 1);
    return /* @__PURE__ */ React.createElement("div", { key: idx }, /* @__PURE__ */ React.createElement("label", { style: { fontSize: "11px", fontWeight: "700", color: "var(--wa-dark-teal)" } }, varName.includes("_") ? `{{${varName}}}` : `Variable #${idx + 1}`), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        className: "form-input",
        value: val,
        onChange: (e) => {
          const newParams = [...params];
          newParams[idx] = e.target.value;
          setParams(newParams);
        }
      }
    ));
  }))), currentTemplateObj?.header_type === "DOCUMENT" && /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "PDF Invoice Attachment URL"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      value: mediaUrl,
      onChange: (e) => setMediaUrl(e.target.value),
      placeholder: "https://erp.uniglobal.bh/INV_9941.pdf"
    }
  )), !selectedTemplate && /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Custom Message Content"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      className: "form-textarea",
      value: customText,
      onChange: (e) => setCustomText(e.target.value),
      placeholder: "Type direct WhatsApp message here..."
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "tariff-estimate-banner" }, /* @__PURE__ */ React.createElement("div", { className: "tariff-info" }, /* @__PURE__ */ React.createElement("span", { className: "title" }, "Category: ", category), /* @__PURE__ */ React.createElement("span", { className: "breakdown" }, "Meta Cost: ", tariffEstimate.meta.toFixed(4), " BHD | Platform Charges: +", tariffEstimate.platform.toFixed(4), " BHD")), /* @__PURE__ */ React.createElement("div", { className: "tariff-rate-badge" }, "BHD ", tariffEstimate.client.toFixed(4), " / msg")), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-success", style: { width: "100%", marginTop: "20px", padding: "12px" }, disabled: sending }, sending ? "Dispatching via Meta API..." : "\u{1F680} Send WhatsApp Notification Now"))), /* @__PURE__ */ React.createElement("div", { className: "phone-mockup-wrapper" }, /* @__PURE__ */ React.createElement("div", { className: "phone-device" }, /* @__PURE__ */ React.createElement("div", { className: "phone-notch" }, /* @__PURE__ */ React.createElement("div", { className: "phone-speaker" })), /* @__PURE__ */ React.createElement("div", { className: "phone-screen" }, /* @__PURE__ */ React.createElement("div", { className: "wa-chat-header" }, /* @__PURE__ */ React.createElement("div", { className: "wa-avatar" }, "UG"), /* @__PURE__ */ React.createElement("div", { className: "wa-user-info" }, /* @__PURE__ */ React.createElement("div", { className: "wa-contact-name" }, "UniGlobal Consultancy ", /* @__PURE__ */ React.createElement("span", { className: "wa-verified-icon" }, "\u2713")), /* @__PURE__ */ React.createElement("div", { className: "wa-status-text" }, "Official Business Account"))), /* @__PURE__ */ React.createElement("div", { className: "wa-chat-body" }, /* @__PURE__ */ React.createElement("div", { className: "wa-date-pill" }, "TODAY"), /* @__PURE__ */ React.createElement("div", { className: "wa-bubble" }, currentTemplateObj?.header_type === "DOCUMENT" && /* @__PURE__ */ React.createElement("div", { className: "wa-bubble-doc" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4C4}"), /* @__PURE__ */ React.createElement("div", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, mediaName || "INV_9941.pdf", /* @__PURE__ */ React.createElement("div", { style: { fontSize: "9px", color: "#4B5563" } }, "PDF Document \u2022 345 KB"))), /* @__PURE__ */ React.createElement("div", { style: { whiteSpace: "pre-line" } }, renderedText), currentTemplateObj?.footer_text && /* @__PURE__ */ React.createElement("div", { className: "wa-bubble-footer" }, currentTemplateObj.footer_text), /* @__PURE__ */ React.createElement("div", { className: "wa-bubble-meta" }, /* @__PURE__ */ React.createElement("span", null, "10:42 AM"), /* @__PURE__ */ React.createElement("span", { className: "wa-ticks" }, "\u2713\u2713")))), /* @__PURE__ */ React.createElement("div", { className: "wa-chat-input-bar" }, /* @__PURE__ */ React.createElement("div", { className: "wa-dummy-input" }, "Message"), /* @__PURE__ */ React.createElement("span", { style: { color: "#075E54", fontSize: "14px" } }, "\u{1F3A4}")))))));
}
function ConversationChatModal({ phone, onClose, showToast, globalSettings }) {
  const [thread, setThread] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const cleanPhone = phone ? phone.replace(/[^0-9\+]/g, "") : "";
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
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
  useEffect(() => {
    const interval = setInterval(() => {
      fetchThread(true);
    }, 2e3);
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
      const res = await fetch("./api/messages.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_phone: cleanPhone,
          message: replyText.trim(),
          category: "SERVICE",
          source_system: "Live Chat Console"
        })
      });
      const data = await res.json();
      if (data.success) {
        setReplyText("");
        fetchThread(true);
        showToast(`WhatsApp message sent to ${cleanPhone}`);
      } else {
        showToast(data.error || "Failed to send WhatsApp message", "error");
      }
    } catch (err) {
      showToast("Network error sending message", "error");
    } finally {
      setSending(false);
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };
  const hasRecentInbound = useMemo(() => {
    const inboundMsgs = thread.filter((m) => m.direction === "inbound");
    if (inboundMsgs.length === 0) return false;
    const lastInbound = inboundMsgs[inboundMsgs.length - 1];
    const diffHours = (Date.now() - new Date(lastInbound.created_at).getTime()) / (1e3 * 60 * 60);
    return diffHours <= 24;
  }, [thread]);
  return /* @__PURE__ */ React.createElement("div", { className: "chat-modal-overlay", onClick: (e) => {
    if (e.target === e.currentTarget) onClose();
  } }, /* @__PURE__ */ React.createElement("div", { className: "chat-modal-box" }, /* @__PURE__ */ React.createElement("div", { className: "chat-modal-header" }, /* @__PURE__ */ React.createElement("div", { className: "chat-header-user" }, /* @__PURE__ */ React.createElement("div", { className: "chat-avatar" }, cleanPhone.slice(-2), /* @__PURE__ */ React.createElement("span", { className: "chat-avatar-online", title: "WhatsApp Connected" })), /* @__PURE__ */ React.createElement("div", { className: "chat-user-meta" }, /* @__PURE__ */ React.createElement("span", { className: "chat-user-phone" }, cleanPhone), /* @__PURE__ */ React.createElement("span", { className: "chat-user-sub" }, "Official WhatsApp Gateway \u2022 ", hasRecentInbound ? /* @__PURE__ */ React.createElement("span", { className: "chat-window-pill" }, "\u{1F7E2} 24h Window Active") : /* @__PURE__ */ React.createElement("span", { className: "chat-window-pill", style: { background: "rgba(234, 179, 8, 0.2)", color: "#FEF08A" } }, "\u{1F7E1} Outbound Session")))), /* @__PURE__ */ React.createElement("div", { className: "chat-header-actions" }, /* @__PURE__ */ React.createElement("button", { className: "btn-chat-close", onClick: onClose, title: "Close Chat" }, "\u2715"))), /* @__PURE__ */ React.createElement("div", { className: "chat-messages-canvas" }, /* @__PURE__ */ React.createElement("div", { className: "chat-date-separator" }, "\u{1F512} WhatsApp Cloud API Live Conversation Thread"), loading && thread.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", color: "#64748B", padding: "30px" } }, "Loading conversation history...") : thread.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", color: "#64748B", padding: "30px" } }, "No messages exchanged with ", cleanPhone, " yet.") : thread.map((msg, idx) => {
    const isOutbound = msg.direction === "outbound";
    return /* @__PURE__ */ React.createElement("div", { key: msg.id || idx, className: `chat-bubble-row ${isOutbound ? "outbound" : "inbound"}` }, /* @__PURE__ */ React.createElement("div", { className: "chat-bubble" }, msg.template_name && /* @__PURE__ */ React.createElement("span", { className: "chat-bubble-template-tag" }, "\u{1F4CB} ", msg.template_name, " [", msg.category, "]"), msg.header_media_name && /* @__PURE__ */ React.createElement("div", { className: "chat-bubble-media" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4CE}"), /* @__PURE__ */ React.createElement("span", null, msg.header_media_name)), /* @__PURE__ */ React.createElement("div", { style: { whiteSpace: "pre-wrap" } }, msg.message_body), /* @__PURE__ */ React.createElement("div", { className: "chat-bubble-footer" }, /* @__PURE__ */ React.createElement("span", null, formatDateTime(msg.created_at, globalSettings?.system_date_format)), isOutbound && /* @__PURE__ */ React.createElement("span", null, msg.status === "read" ? /* @__PURE__ */ React.createElement("span", { className: "chat-tick-read", title: "Read" }, "\u2713\u2713") : msg.status === "delivered" ? /* @__PURE__ */ React.createElement("span", { className: "chat-tick-delivered", title: "Delivered" }, "\u2713\u2713") : msg.status === "sent" ? /* @__PURE__ */ React.createElement("span", { title: "Sent" }, "\u2713") : msg.status === "failed" ? /* @__PURE__ */ React.createElement("span", { style: { color: "#EF4444" }, title: msg.error_message || "Failed" }, "\u26A0\uFE0F") : /* @__PURE__ */ React.createElement("span", { style: { color: "#94A3B8" }, title: "Queued" }, "\u23F1\uFE0F")))));
  }), /* @__PURE__ */ React.createElement("div", { ref: messagesEndRef })), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSendReply, className: "chat-input-bar" }, /* @__PURE__ */ React.createElement(
    "textarea",
    {
      className: "chat-textarea",
      placeholder: hasRecentInbound ? "Type a direct WhatsApp message... (Press Enter to send)" : "Type a WhatsApp reply... (Press Enter to send)",
      value: replyText,
      onChange: (e) => setReplyText(e.target.value),
      onKeyDown: handleKeyDown,
      rows: "1"
    }
  ), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn-chat-send", disabled: sending || !replyText.trim(), title: "Send WhatsApp Message" }, sending ? "\u23F3" : "\u27A4"))));
}
function MessageLogsView({ showToast, globalSettings }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);
  const [activeChatPhone, setActiveChatPhone] = useState(null);
  const [autoSync, setAutoSync] = useState(true);
  const [viewMode, setViewMode] = useState("grouped");
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
  useEffect(() => {
    if (!autoSync) return;
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 2500);
    return () => clearInterval(interval);
  }, [autoSync, statusFilter, categoryFilter]);
  const simulateStatus = async (msgId, newStatus) => {
    try {
      const res = await fetch("./api/messages.php", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_id: msgId, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Message status updated to ${newStatus.toUpperCase()}`);
        fetchLogs(true);
      }
    } catch (e) {
      showToast("Error updating status", "error");
    }
  };
  const groupedConversations = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const m of messages) {
      const contactPhone = (m.direction === "inbound" ? m.from_phone : m.to_phone) || m.to_phone || m.from_phone;
      if (!contactPhone) continue;
      if (!map.has(contactPhone)) {
        map.set(contactPhone, {
          ...m,
          contact_phone: contactPhone,
          total_count: 1,
          has_inbound: m.direction === "inbound",
          unread_inbound: m.direction === "inbound" && m.status !== "read" ? 1 : 0
        });
      } else {
        const entry = map.get(contactPhone);
        entry.total_count += 1;
        if (m.direction === "inbound") {
          entry.has_inbound = true;
          if (m.status !== "read") entry.unread_inbound += 1;
        }
      }
    }
    return Array.from(map.values());
  }, [messages]);
  const conversationColumns = [
    {
      key: "contact_phone",
      label: "Contact / Recipient",
      render: (c) => /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: "700", fontSize: "13.5px", color: "#0F172A" } }, c.contact_phone), /* @__PURE__ */ React.createElement("span", { className: "badge", style: { background: "#E0F2FE", color: "#0369A1", fontSize: "11px", padding: "2px 7px", fontWeight: "600" } }, c.total_count, " ", c.total_count === 1 ? "msg" : "msgs"), c.has_inbound && /* @__PURE__ */ React.createElement("span", { className: "badge", style: { background: "#DCFCE7", color: "#15803D", fontSize: "10.5px", padding: "2px 6px" } }, "\u{1F7E2} 2-Way Active")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" } }, c.source_system, " \u2022 ", c.direction === "inbound" ? "\u{1F4E5} Last Inbound" : "\u{1F4E4} Last Outbound"))
    },
    {
      key: "category",
      label: "Category",
      render: (c) => /* @__PURE__ */ React.createElement("span", { className: `badge cat-${(c.category || "SERVICE").toLowerCase().substring(0, 4)}` }, c.category)
    },
    {
      key: "message_body",
      label: "Latest Message Preview",
      render: (c) => /* @__PURE__ */ React.createElement("div", { style: { maxWidth: "320px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, title: c.message_body }, /* @__PURE__ */ React.createElement("span", { style: { marginRight: "6px", opacity: 0.85 } }, c.direction === "inbound" ? "\u{1F4E5}" : "\u{1F4E4}"), c.header_media_name && /* @__PURE__ */ React.createElement("span", { style: { marginRight: "4px", fontWeight: "600" } }, "\u{1F4CE} [", c.header_media_name, "]"), /* @__PURE__ */ React.createElement("span", null, c.message_body))
    },
    {
      key: "status",
      label: "Latest Status",
      render: (c) => /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: `badge status-${c.status}`, style: { transition: "all 0.3s ease" } }, c.status === "read" ? "\u2713\u2713 Read" : c.status === "delivered" ? "\u2713\u2713 Delivered" : c.status === "sent" ? "\u2713 Sent" : c.status.toUpperCase()), c.status === "failed" && c.error_message && /* @__PURE__ */ React.createElement("div", { style: { fontSize: "10px", color: "#EF4444", marginTop: "3px", maxWidth: "200px", whiteSpace: "normal", lineHeight: "1.2" } }, "\u26A0\uFE0F ", c.error_message))
    },
    {
      key: "client_rate_bhd",
      label: "Latest Rate (BHD)",
      render: (c) => /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, parseFloat(c.client_rate_bhd || 0).toFixed(4), " BHD"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "10px", color: "var(--text-muted)" } }, "Meta: ", parseFloat(c.meta_cost_bhd || 0).toFixed(4)))
    },
    {
      key: "created_at",
      label: "Last Message Time",
      render: (c) => /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11.5px", color: "var(--text-secondary)" } }, formatDateTime(c.created_at, globalSettings?.system_date_format))
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (c) => /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "6px" } }, /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "btn btn-success btn-sm",
          style: { padding: "5px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px", fontWeight: "700" },
          onClick: () => setActiveChatPhone(c.contact_phone),
          title: `Open Full WhatsApp Chat History with ${c.contact_phone}`
        },
        /* @__PURE__ */ React.createElement("span", null, "\u{1F4AC}"),
        " Open Chat (",
        c.total_count,
        ")"
      ), /* @__PURE__ */ React.createElement("button", { className: "btn btn-secondary btn-sm", onClick: () => setSelectedLog(c), title: "Inspect Latest Payload" }, "Inspect"))
    }
  ];
  const logColumns = [
    {
      key: "to_phone",
      label: "Recipient / Source",
      render: (m) => /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, m.direction === "inbound" ? m.from_phone : m.to_phone)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text-muted)" } }, m.direction === "inbound" ? "\u{1F4E5} WhatsApp Inbound" : `\u{1F4E4} ${m.source_system}`))
    },
    {
      key: "category",
      label: "Category",
      render: (m) => /* @__PURE__ */ React.createElement("span", { className: `badge cat-${m.category.toLowerCase().substring(0, 4)}` }, m.category)
    },
    {
      key: "message_body",
      label: "Message Content",
      render: (m) => /* @__PURE__ */ React.createElement("div", { style: { maxWidth: "280px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, m.header_media_name && /* @__PURE__ */ React.createElement("span", { style: { marginRight: "4px" } }, "\u{1F4CE} [", m.header_media_name, "]"), m.message_body)
    },
    {
      key: "status",
      label: "Status",
      render: (m) => /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: `badge status-${m.status}`, style: { transition: "all 0.3s ease" } }, m.status === "read" ? "\u2713\u2713 Read" : m.status === "delivered" ? "\u2713\u2713 Delivered" : m.status === "sent" ? "\u2713 Sent" : m.status.toUpperCase()), m.status === "failed" && m.error_message && /* @__PURE__ */ React.createElement("div", { style: { fontSize: "10px", color: "#EF4444", marginTop: "3px", maxWidth: "220px", whiteSpace: "normal", wordBreak: "break-word", lineHeight: "1.2" } }, "\u26A0\uFE0F ", m.error_message))
    },
    {
      key: "client_rate_bhd",
      label: "Client Rate (BHD)",
      render: (m) => /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, parseFloat(m.client_rate_bhd).toFixed(4), " BHD"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "10px", color: "var(--text-muted)" } }, "Meta: ", parseFloat(m.meta_cost_bhd).toFixed(4), " | Platform: +", parseFloat(m.platform_charge_bhd).toFixed(4)))
    },
    {
      key: "created_at",
      label: "Timestamp",
      render: (m) => /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11.5px", color: "var(--text-secondary)" } }, formatDateTime(m.created_at, globalSettings?.system_date_format))
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (m) => {
        const chatPhone = m.direction === "inbound" ? m.from_phone : m.to_phone;
        return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "5px" } }, /* @__PURE__ */ React.createElement(
          "button",
          {
            className: "btn btn-success btn-sm",
            style: { padding: "4px 9px", fontSize: "11.5px", display: "flex", alignItems: "center", gap: "4px" },
            onClick: () => setActiveChatPhone(chatPhone),
            title: `Open Live WhatsApp Chat with ${chatPhone}`
          },
          /* @__PURE__ */ React.createElement("span", null, "\u{1F4AC}"),
          " Chat"
        ), /* @__PURE__ */ React.createElement("button", { className: "btn btn-secondary btn-sm", onClick: () => setSelectedLog(m), title: "Inspect Payload" }, "Inspect"), m.status !== "read" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary btn-sm", onClick: () => simulateStatus(m.message_id, "read"), title: "Mark Read" }, "\u2713 Read"));
      }
    }
  ];
  const customFilterBar = /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { className: "view-mode-toggle" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `view-mode-btn ${viewMode === "grouped" ? "active" : ""}`,
      onClick: () => setViewMode("grouped"),
      title: "Group conversations by Phone Number (Shows latest message with full chat history on click)"
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F4AC} Conversations"),
    /* @__PURE__ */ React.createElement("span", { className: "count-badge" }, groupedConversations.length)
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `view-mode-btn ${viewMode === "raw" ? "active" : ""}`,
      onClick: () => setViewMode("raw"),
      title: "Show raw individual message logs and telemetry audit trail"
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F4DC} Raw Logs"),
    /* @__PURE__ */ React.createElement("span", { className: "count-badge" }, messages.length)
  )), /* @__PURE__ */ React.createElement("select", { className: "form-select", style: { width: "135px", padding: "5px 8px", fontSize: "12px" }, value: statusFilter, onChange: (e) => setStatusFilter(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "all" }, "All Statuses"), /* @__PURE__ */ React.createElement("option", { value: "read" }, "Read (\u2713\u2713 Blue)"), /* @__PURE__ */ React.createElement("option", { value: "delivered" }, "Delivered (\u2713\u2713 Grey)"), /* @__PURE__ */ React.createElement("option", { value: "sent" }, "Sent (\u2713 Single)"), /* @__PURE__ */ React.createElement("option", { value: "queued" }, "Queued"), /* @__PURE__ */ React.createElement("option", { value: "failed" }, "Failed")), /* @__PURE__ */ React.createElement("select", { className: "form-select", style: { width: "145px", padding: "5px 8px", fontSize: "12px" }, value: categoryFilter, onChange: (e) => setCategoryFilter(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "all" }, "All Categories"), /* @__PURE__ */ React.createElement("option", { value: "UTILITY" }, "Utility (Invoices)"), /* @__PURE__ */ React.createElement("option", { value: "AUTHENTICATION" }, "Authentication (OTP)"), /* @__PURE__ */ React.createElement("option", { value: "MARKETING" }, "Marketing (Promo)"), /* @__PURE__ */ React.createElement("option", { value: "SERVICE" }, "Service (Support)")));
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "page-header-row" }, /* @__PURE__ */ React.createElement("div", { className: "page-title-group" }, /* @__PURE__ */ React.createElement("h1", null, /* @__PURE__ */ React.createElement("span", null, "\u{1F4DC}"), " Message Telemetry & Conversations"), /* @__PURE__ */ React.createElement("p", null, viewMode === "grouped" ? "Grouped active WhatsApp conversations with latest message previews and instant chat consoles." : "Audit trail of all individual inbound and outbound WhatsApp messages, lifecycle, and billing tariffs.")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "10px", alignItems: "center" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: `btn ${autoSync ? "btn-success" : "btn-secondary"}`,
      style: { fontSize: "12px", padding: "6px 12px", display: "flex", alignItems: "center", gap: "6px" },
      onClick: () => setAutoSync(!autoSync),
      title: autoSync ? "Live Sync Active (Polling every 2.5s)" : "Click to enable Auto Sync"
    },
    /* @__PURE__ */ React.createElement("span", { style: { display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: autoSync ? "#22C55E" : "#9CA3AF", boxShadow: autoSync ? "0 0 8px #22C55E" : "none" } }),
    autoSync ? "\u{1F7E2} Live Auto-Sync Active" : "\u23F8\uFE0F Live Sync Paused"
  ), /* @__PURE__ */ React.createElement("button", { className: "btn btn-secondary", onClick: () => fetchLogs(false) }, /* @__PURE__ */ React.createElement("span", null, "\u{1F504}"), " Refresh Now"))), viewMode === "grouped" ? /* @__PURE__ */ React.createElement(
    DataTable,
    {
      columns: conversationColumns,
      data: groupedConversations,
      title: "whatsapp_conversations",
      searchPlaceholder: "Search phone or latest message...",
      defaultPageSize: 10,
      pageSizeOptions: [10, 25, 50, 100],
      defaultSortKey: "created_at",
      defaultSortDir: "desc",
      actions: customFilterBar,
      emptyMessage: loading ? "Loading conversations..." : "No conversations found matching criteria."
    }
  ) : /* @__PURE__ */ React.createElement(
    DataTable,
    {
      columns: logColumns,
      data: messages,
      title: "whatsapp_messages_log",
      searchPlaceholder: "Search phone, wamid, content...",
      defaultPageSize: 10,
      pageSizeOptions: [10, 25, 50, 100],
      defaultSortKey: "created_at",
      defaultSortDir: "desc",
      actions: customFilterBar,
      emptyMessage: loading ? "Loading telemetry logs..." : "No messages found matching criteria."
    }
  ), activeChatPhone && /* @__PURE__ */ React.createElement(
    ConversationChatModal,
    {
      phone: activeChatPhone,
      onClose: () => {
        setActiveChatPhone(null);
        fetchLogs(true);
      },
      showToast,
      globalSettings
    }
  ), selectedLog && /* @__PURE__ */ React.createElement("div", { style: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1e4
  } }, /* @__PURE__ */ React.createElement("div", { className: "card", style: { width: "600px", maxHeight: "85vh", overflowY: "auto" } }, /* @__PURE__ */ React.createElement("div", { className: "card-header", style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { className: "card-title", style: { display: "flex", alignItems: "center", gap: "8px", fontSize: "15px" } }, /* @__PURE__ */ React.createElement("span", null, "\u{1F50D}"), " Message Payload Inspection"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-secondary btn-sm", onClick: () => setSelectedLog(null) }, "\u2715 Close")), /* @__PURE__ */ React.createElement("div", { className: "code-box" }, /* @__PURE__ */ React.createElement("pre", null, JSON.stringify(selectedLog, null, 2))))));
}
function TemplatesView({ showToast }) {
  const [templates, setTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [saving, setSaving] = useState(false);
  const loadTemplates = () => {
    fetch("./api/templates.php").then((res) => res.json()).then((res) => {
      if (res.success) setTemplates(res.data);
    });
  };
  useEffect(() => {
    loadTemplates();
  }, []);
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!editingTemplate.template_name || !editingTemplate.body_text) {
      showToast("Template Key and Body Text are required", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("./api/templates.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTemplate)
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Template saved successfully!");
        setEditingTemplate(null);
        loadTemplates();
      } else {
        showToast(data.error || "Failed to save template", "error");
      }
    } catch (err) {
      showToast("Network error saving template", "error");
    } finally {
      setSaving(false);
    }
  };
  const handleDeleteTemplate = async (id, name) => {
    if (!confirm(`Are you sure you want to delete template "${name}"?`)) return;
    try {
      const res = await fetch(`./api/templates.php?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Template deleted successfully");
        loadTemplates();
      } else {
        showToast(data.error || "Failed to delete template", "error");
      }
    } catch (err) {
      showToast("Error deleting template", "error");
    }
  };
  const modalTariffs = {
    AUTHENTICATION: { meta: 0.011, platform: 35e-4, client: 0.0145 },
    UTILITY: { meta: 0.014, platform: 45e-4, client: 0.0185 },
    MARKETING: { meta: 0.027, platform: 7e-3, client: 0.034 },
    SERVICE: { meta: 75e-4, platform: 25e-4, client: 0.01 }
  };
  const activeTariff = editingTemplate ? modalTariffs[editingTemplate.category] || modalTariffs.UTILITY : modalTariffs.UTILITY;
  const varCount = editingTemplate && editingTemplate.body_text ? editingTemplate.body_text.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) ? new Set(editingTemplate.body_text.match(/\{\{([a-zA-Z0-9_]+)\}\}/g).map((s) => s.replace(/[\{\}]/g, "").trim())).size : editingTemplate.body_text.match(/\{+[\(\[]?\s*(\d+)\s*[\)\]]?\}+/g) ? new Set(editingTemplate.body_text.match(/\{+[\(\[]?\s*(\d+)\s*[\)\]]?\}+/g).map((s) => parseInt(s.replace(/\D/g, ""), 10))).size : 0 : 0;
  const templateColumns = [
    {
      key: "display_title",
      label: "Template Title & Key",
      render: (t) => /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, t.display_title)), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "monospace", fontSize: "11px", color: "var(--wa-teal)" } }, t.template_name))
    },
    {
      key: "category",
      label: "Category",
      render: (t) => /* @__PURE__ */ React.createElement("span", { className: `badge cat-${t.category.toLowerCase().substring(0, 4)}` }, t.category)
    },
    {
      key: "header_type",
      label: "Header Type",
      render: (t) => /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11px", fontWeight: "700" } }, t.header_type)
    },
    {
      key: "body_text",
      label: "Body Format",
      render: (t) => /* @__PURE__ */ React.createElement("div", { style: { maxWidth: "280px", fontSize: "11.5px", color: "var(--text-secondary)" } }, t.body_text)
    },
    {
      key: "meta_cost_bhd",
      label: "Meta Cost",
      render: (t) => /* @__PURE__ */ React.createElement("span", null, parseFloat(t.meta_cost_bhd).toFixed(4), " BHD")
    },
    {
      key: "platform_charge_bhd",
      label: "Platform Charges",
      render: (t) => /* @__PURE__ */ React.createElement("span", { style: { color: "var(--wa-dark-teal)", fontWeight: "700" } }, "+", parseFloat(t.platform_charge_bhd).toFixed(4), " BHD")
    },
    {
      key: "client_rate_bhd",
      label: "Client Rate",
      render: (t) => /* @__PURE__ */ React.createElement("strong", { style: { color: "var(--wa-teal)", fontSize: "13px" } }, parseFloat(t.client_rate_bhd).toFixed(4), " BHD")
    },
    {
      key: "meta_status",
      label: "Meta Status",
      render: (t) => /* @__PURE__ */ React.createElement("span", { className: "badge status-read" }, "APPROVED")
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (t) => /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "6px" } }, /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "btn btn-secondary btn-sm",
          onClick: () => setEditingTemplate({ ...t }),
          title: "Edit Template"
        },
        "\u270F\uFE0F Edit"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "btn btn-secondary btn-sm",
          style: { color: "#EF4444" },
          onClick: () => handleDeleteTemplate(t.id, t.template_name),
          title: "Delete Template"
        },
        "\u{1F5D1}\uFE0F"
      ))
    }
  ];
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "page-header-row" }, /* @__PURE__ */ React.createElement("div", { className: "page-title-group" }, /* @__PURE__ */ React.createElement("h1", null, /* @__PURE__ */ React.createElement("span", null, "\u{1F4CB}"), " WhatsApp Templates & Tariff Schedule"), /* @__PURE__ */ React.createElement("p", null, "Meta-registered message templates, variable placeholders, and official Bahrain Market rates.")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => setEditingTemplate({
    template_name: "",
    display_title: "",
    category: "UTILITY",
    language: "en_US",
    header_type: "NONE",
    header_sample: "",
    body_text: "",
    footer_text: ""
  }) }, /* @__PURE__ */ React.createElement("span", null, "\u2795"), " Register New Template")), /* @__PURE__ */ React.createElement(
    DataTable,
    {
      columns: templateColumns,
      data: templates,
      title: "whatsapp_templates",
      searchPlaceholder: "Search template title, category...",
      defaultPageSize: 10,
      pageSizeOptions: [5, 10, 20],
      defaultSortKey: "id",
      defaultSortDir: "desc"
    }
  ), editingTemplate && /* @__PURE__ */ React.createElement("div", { style: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1e4,
    padding: "20px"
  } }, /* @__PURE__ */ React.createElement("div", { className: "card", style: { maxWidth: "650px", width: "100%", maxHeight: "90vh", overflowY: "auto" } }, /* @__PURE__ */ React.createElement("div", { className: "card-header", style: { marginBottom: "16px" } }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, /* @__PURE__ */ React.createElement("span", null, editingTemplate.id ? "\u270F\uFE0F Edit Template" : "\u2795 Register New WhatsApp Template")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-secondary btn-sm", onClick: () => setEditingTemplate(null) }, "\u2715 Close")), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSaveTemplate }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" } }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Meta Template Key *"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      placeholder: "e.g. uniglobal_invoice_alert",
      value: editingTemplate.template_name,
      onChange: (e) => setEditingTemplate({
        ...editingTemplate,
        template_name: e.target.value.toLowerCase().replace(/\s+/g, "_")
      }),
      required: true
    }
  ), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "10.5px", color: "var(--text-muted)" } }, "Lowercase & underscores only")), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Display Title *"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      placeholder: "e.g. Invoice Notification with PDF",
      value: editingTemplate.display_title,
      onChange: (e) => setEditingTemplate({ ...editingTemplate, display_title: e.target.value }),
      required: true
    }
  ))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "6px" } }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Category"), /* @__PURE__ */ React.createElement(
    "select",
    {
      className: "form-select",
      value: editingTemplate.category,
      onChange: (e) => setEditingTemplate({ ...editingTemplate, category: e.target.value })
    },
    /* @__PURE__ */ React.createElement("option", { value: "UTILITY" }, "Utility (Invoices, Notifications)"),
    /* @__PURE__ */ React.createElement("option", { value: "AUTHENTICATION" }, "Authentication (OTP Verification)"),
    /* @__PURE__ */ React.createElement("option", { value: "MARKETING" }, "Marketing (Offers & Promotions)"),
    /* @__PURE__ */ React.createElement("option", { value: "SERVICE" }, "Service (Customer Support)")
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Language Code *"), /* @__PURE__ */ React.createElement(
    "select",
    {
      className: "form-select",
      value: editingTemplate.language || "en_US",
      onChange: (e) => setEditingTemplate({ ...editingTemplate, language: e.target.value })
    },
    /* @__PURE__ */ React.createElement("option", { value: "en_US" }, "English (US) \u2014 en_US (Most Common)"),
    /* @__PURE__ */ React.createElement("option", { value: "en" }, "English \u2014 en"),
    /* @__PURE__ */ React.createElement("option", { value: "en_GB" }, "English (UK) \u2014 en_GB"),
    /* @__PURE__ */ React.createElement("option", { value: "ar" }, "Arabic \u2014 ar"),
    /* @__PURE__ */ React.createElement("option", { value: "hi" }, "Hindi \u2014 hi")
  ), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "10.5px", color: "var(--text-muted)" } }, "Must match the Language set in Meta (e.g. English (US) is ", /* @__PURE__ */ React.createElement("code", null, "en_US"), ")."))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "6px" } }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Header Media Type"), /* @__PURE__ */ React.createElement(
    "select",
    {
      className: "form-select",
      value: editingTemplate.header_type,
      onChange: (e) => setEditingTemplate({ ...editingTemplate, header_type: e.target.value })
    },
    /* @__PURE__ */ React.createElement("option", { value: "NONE" }, "None (Plain Message)"),
    /* @__PURE__ */ React.createElement("option", { value: "DOCUMENT" }, "Document (PDF Invoice/Report)"),
    /* @__PURE__ */ React.createElement("option", { value: "IMAGE" }, "Image (Banner / JPG / PNG)"),
    /* @__PURE__ */ React.createElement("option", { value: "TEXT" }, "Text Header"),
    /* @__PURE__ */ React.createElement("option", { value: "VIDEO" }, "Video")
  )), editingTemplate.header_type !== "NONE" && /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Header Sample / URL"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      placeholder: "https://... or header text",
      value: editingTemplate.header_sample || "",
      onChange: (e) => setEditingTemplate({ ...editingTemplate, header_sample: e.target.value })
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "form-group", style: { marginTop: "6px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Body Text (Message Format) *"), /* @__PURE__ */ React.createElement("span", { className: "badge cat-auth", style: { fontSize: "10px" } }, varCount, " variable", varCount !== 1 ? "s" : "", " detected")), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      className: "form-textarea",
      style: { minHeight: "110px" },
      placeholder: "Dear {{1}}, your invoice {{2}} for BHD {{3}} has been generated on {{4}}.",
      value: editingTemplate.body_text,
      onChange: (e) => setEditingTemplate({ ...editingTemplate, body_text: e.target.value }),
      required: true
    }
  ), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "10.5px", color: "var(--text-muted)" } }, "Use placeholders like ", /* @__PURE__ */ React.createElement("code", null, "{{1}}"), ", ", /* @__PURE__ */ React.createElement("code", null, "{{2}}"), " for dynamic ERP variables.")), /* @__PURE__ */ React.createElement("div", { className: "form-group", style: { marginTop: "6px" } }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Footer Tagline (Optional)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      placeholder: "e.g. UniGlobal Accounts | Powered by SaNDS Lab",
      value: editingTemplate.footer_text || "",
      onChange: (e) => setEditingTemplate({ ...editingTemplate, footer_text: e.target.value })
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "tariff-estimate-banner", style: { margin: "14px 0" } }, /* @__PURE__ */ React.createElement("div", { className: "tariff-info" }, /* @__PURE__ */ React.createElement("span", { className: "title" }, "Bahrain Tariff (", editingTemplate.category, ")"), /* @__PURE__ */ React.createElement("span", { className: "breakdown" }, "Meta Cost: ", activeTariff.meta.toFixed(4), " BHD | Platform Fee: +", activeTariff.platform.toFixed(4), " BHD")), /* @__PURE__ */ React.createElement("div", { className: "tariff-rate-badge" }, "BHD ", activeTariff.client.toFixed(4), " / msg")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px" } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: () => setEditingTemplate(null) }, "Cancel"), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-primary", disabled: saving }, saving ? "Saving..." : editingTemplate.id ? "\u{1F4BE} Update Template" : "\u{1F680} Register Template"))))));
}
function OdooApiHubView({ showToast }) {
  const [responseOutput, setResponseOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("sk_live_odoo_uniglobal_98741362");
  const [endpoint, setEndpoint] = useState("/api/messages.php");
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
    setResponseOutput("Sending request to WhatsApp Gateway...");
    try {
      const res = await fetch(`.${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey
        },
        body: requestPayload
      });
      const data = await res.json();
      setResponseOutput(JSON.stringify(data, null, 2));
      showToast("API Executed successfully!");
    } catch (err) {
      setResponseOutput(JSON.stringify({ error: err.message }, null, 2));
      showToast("API execution error", "error");
    } finally {
      setLoading(false);
    }
  };
  const [activeSnippetLang, setActiveSnippetLang] = useState("python");
  const snippets = {
    python: {
      title: "Python 3 (Odoo ERP Action / Requests)",
      filename: "odoo_whatsapp_connector.py",
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
      title: "PHP 7.4+ / 8.x (cURL Native)",
      filename: "whatsapp_sender.php",
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
      title: "cURL (Bash / Terminal CLI)",
      filename: "send_invoice.sh",
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
      title: ".NET 6/7/8 C# (HttpClient)",
      filename: "WhatsAppService.cs",
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
      title: "Node.js / Express (Fetch API)",
      filename: "send_whatsapp.js",
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
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "page-header-row" }, /* @__PURE__ */ React.createElement("div", { className: "page-title-group" }, /* @__PURE__ */ React.createElement("h1", null, /* @__PURE__ */ React.createElement("span", null, "\u26A1"), " Odoo & Multi-Platform Integration API Hub"), /* @__PURE__ */ React.createElement("p", null, "REST API documentation, live testing console, and copyable integration snippets for Python, PHP, cURL, .NET (C#), and Node.js."))), /* @__PURE__ */ React.createElement("div", { className: "api-hub-grid" }, /* @__PURE__ */ React.createElement("div", { className: "card", style: { minWidth: 0, margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "card-header" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F9EA}"), " Live API Tester")), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "API Key Header (X-API-Key)"), /* @__PURE__ */ React.createElement("input", { type: "text", className: "form-input", value: apiKey, onChange: (e) => setApiKey(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "HTTP Method & Endpoint"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "10px" } }, /* @__PURE__ */ React.createElement("span", { className: "badge cat-utility", style: { padding: "8px 12px", fontSize: "12px" } }, "POST"), /* @__PURE__ */ React.createElement("input", { type: "text", className: "form-input", value: endpoint, readOnly: true }))), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Request Body (JSON)"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      className: "form-textarea",
      style: { minHeight: "180px", fontFamily: "monospace", fontSize: "11.5px" },
      value: requestPayload,
      onChange: (e) => setRequestPayload(e.target.value)
    }
  )), /* @__PURE__ */ React.createElement("button", { className: "btn btn-success", style: { width: "100%" }, onClick: runLiveTest, disabled: loading }, loading ? "Executing..." : "\u25B6 Execute API Call"), responseOutput && /* @__PURE__ */ React.createElement("div", { style: { marginTop: "16px" } }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Response Body (HTTP 200/201)"), /* @__PURE__ */ React.createElement("div", { className: "code-box", style: { maxHeight: "350px", overflowY: "auto" } }, /* @__PURE__ */ React.createElement("pre", { style: { margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", overflowWrap: "anywhere" } }, responseOutput)))), /* @__PURE__ */ React.createElement("div", { className: "card", style: { minWidth: 0, margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "card-header", style: { flexWrap: "wrap", gap: "8px" } }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F50C}"), " Multi-Platform Connector Snippets"), /* @__PURE__ */ React.createElement("button", { className: "btn-copy-code", onClick: () => {
    navigator.clipboard.writeText(currentSnippet.code);
    showToast(`${currentSnippet.filename} copied to clipboard!`);
  } }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4CB}"), " Copy Code")), /* @__PURE__ */ React.createElement("div", { className: "code-tabs-header" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `code-tab-btn ${activeSnippetLang === "python" ? "active" : ""}`,
      onClick: () => setActiveSnippetLang("python")
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F40D}"),
    " Python (Odoo)"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `code-tab-btn ${activeSnippetLang === "php" ? "active" : ""}`,
      onClick: () => setActiveSnippetLang("php")
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F418}"),
    " PHP"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `code-tab-btn ${activeSnippetLang === "curl" ? "active" : ""}`,
      onClick: () => setActiveSnippetLang("curl")
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F4BB}"),
    " cURL"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `code-tab-btn ${activeSnippetLang === "dotnet" ? "active" : ""}`,
      onClick: () => setActiveSnippetLang("dotnet")
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F537}"),
    " .NET (C#)"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `code-tab-btn ${activeSnippetLang === "node" ? "active" : ""}`,
      onClick: () => setActiveSnippetLang("node")
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F7E8}"),
    " Node.js"
  )), /* @__PURE__ */ React.createElement("div", { className: "code-box", style: { minHeight: "380px", maxHeight: "560px", overflowY: "auto" } }, /* @__PURE__ */ React.createElement("div", { className: "code-box-header" }, /* @__PURE__ */ React.createElement("span", null, currentSnippet.filename), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "10.5px", color: "#64748B" } }, currentSnippet.title)), /* @__PURE__ */ React.createElement("pre", { style: { margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", overflowWrap: "anywhere" } }, currentSnippet.code)))));
}
function ApiKeysView({ showToast }) {
  const [keys, setKeys] = useState([]);
  const [newSystemName, setNewSystemName] = useState("");
  const [loading, setLoading] = useState(false);
  const loadKeys = () => {
    fetch("./api/api_keys.php").then((res) => res.json()).then((res) => {
      if (res.success) setKeys(res.data);
    });
  };
  useEffect(() => {
    loadKeys();
  }, []);
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newSystemName) return;
    setLoading(true);
    try {
      const res = await fetch("./api/api_keys.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system_name: newSystemName })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Generated API key for ${newSystemName}`);
        setNewSystemName("");
        loadKeys();
      }
    } finally {
      setLoading(false);
    }
  };
  const toggleStatus = async (id, currentStatus) => {
    await fetch("./api/api_keys.php", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: currentStatus ? 0 : 1 })
    });
    showToast("API Key status updated");
    loadKeys();
  };
  const keyColumns = [
    {
      key: "system_name",
      label: "Integration System",
      render: (k) => /* @__PURE__ */ React.createElement("strong", null, k.system_name)
    },
    {
      key: "api_key",
      label: "Secret API Key Token",
      render: (k) => /* @__PURE__ */ React.createElement("code", { style: { background: "#F1F5F9", padding: "4px 8px", borderRadius: "4px", color: "#0F172A" } }, k.api_key)
    },
    {
      key: "rate_limit_per_minute",
      label: "Rate Limit",
      render: (k) => /* @__PURE__ */ React.createElement("span", null, k.rate_limit_per_minute, " req/min")
    },
    {
      key: "is_active",
      label: "Status",
      render: (k) => /* @__PURE__ */ React.createElement("span", { className: `badge ${k.is_active ? "status-read" : "status-failed"}` }, k.is_active ? "ACTIVE" : "REVOKED")
    },
    {
      key: "last_used_at",
      label: "Last Used",
      render: (k) => /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11.5px", color: "var(--text-muted)" } }, k.last_used_at || "Never")
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (k) => /* @__PURE__ */ React.createElement("button", { className: "btn btn-secondary btn-sm", onClick: () => toggleStatus(k.id, k.is_active) }, k.is_active ? "Revoke" : "Activate")
    }
  ];
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "page-header-row" }, /* @__PURE__ */ React.createElement("div", { className: "page-title-group" }, /* @__PURE__ */ React.createElement("h1", null, /* @__PURE__ */ React.createElement("span", null, "\u{1F511}"), " External API Keys Management"), /* @__PURE__ */ React.createElement("p", null, "Manage authentication tokens for Odoo ERP, POS terminal middleware, and third-party systems."))), /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: "16px 20px", marginBottom: "16px" } }, /* @__PURE__ */ React.createElement("form", { onSubmit: handleCreate, style: { display: "flex", gap: "12px", alignItems: "center" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      placeholder: "System / Application Name (e.g. Odoo ERP Production)",
      value: newSystemName,
      onChange: (e) => setNewSystemName(e.target.value),
      style: { flex: 1 },
      required: true
    }
  ), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-primary", disabled: loading }, /* @__PURE__ */ React.createElement("span", null, "\u2795"), " Generate New API Key"))), /* @__PURE__ */ React.createElement(
    DataTable,
    {
      columns: keyColumns,
      data: keys,
      title: "api_keys",
      searchPlaceholder: "Search system name, token...",
      defaultPageSize: 10,
      pageSizeOptions: [5, 10, 20],
      defaultSortKey: "id",
      defaultSortDir: "desc"
    }
  ));
}
function UsersView({ currentUser, showToast }) {
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "Password@123", role: "user", status: "active" });
  const loadUsers = () => {
    fetch("./api/users.php").then((res) => res.json()).then((res) => {
      if (res.success) setUsers(res.data);
    });
  };
  useEffect(() => {
    loadUsers();
  }, []);
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("./api/users.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        showToast("User created successfully");
        setShowAddModal(false);
        setForm({ name: "", email: "", password: "Password@123", role: "user", status: "active" });
        loadUsers();
      } else {
        showToast(data.error || "Failed to create user", "error");
      }
    } catch (err) {
      showToast("Error creating user", "error");
    }
  };
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`./api/users.php?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("User deleted");
        loadUsers();
      } else {
        showToast(data.error, "error");
      }
    } catch (e) {
      showToast("Error deleting user", "error");
    }
  };
  const userColumns = [
    {
      key: "name",
      label: "User Name",
      render: (u) => /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px" } }, /* @__PURE__ */ React.createElement("div", { className: "avatar", style: { background: u.avatar_color || "#128C7E" } }, u.name.charAt(0)), /* @__PURE__ */ React.createElement("strong", null, u.name))
    },
    {
      key: "email",
      label: "Email Address"
    },
    {
      key: "role",
      label: "Assigned Role",
      render: (u) => /* @__PURE__ */ React.createElement("span", { className: `badge ${u.role === "superadmin" ? "cat-marketing" : u.role === "admin" ? "cat-auth" : "cat-utility"}` }, u.role.toUpperCase())
    },
    {
      key: "status",
      label: "Account Status",
      render: (u) => /* @__PURE__ */ React.createElement("span", { className: `badge ${u.status === "active" ? "status-read" : "status-failed"}` }, u.status.toUpperCase())
    },
    {
      key: "last_login",
      label: "Last Active",
      render: (u) => /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11.5px", color: "var(--text-muted)" } }, u.last_login || "Never")
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (u) => /* @__PURE__ */ React.createElement(React.Fragment, null, currentUser.id !== u.id && /* @__PURE__ */ React.createElement("button", { className: "btn btn-secondary btn-sm", onClick: () => handleDelete(u.id) }, "Delete"))
    }
  ];
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "page-header-row" }, /* @__PURE__ */ React.createElement("div", { className: "page-title-group" }, /* @__PURE__ */ React.createElement("h1", null, /* @__PURE__ */ React.createElement("span", null, "\u{1F465}"), " User Accounts & Role Permissions"), /* @__PURE__ */ React.createElement("p", null, "Manage Superadmin, Admin, and Operations User accounts for platform access.")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => setShowAddModal(true) }, /* @__PURE__ */ React.createElement("span", null, "\u2795"), " Add New User")), /* @__PURE__ */ React.createElement(
    DataTable,
    {
      columns: userColumns,
      data: users,
      title: "platform_users",
      searchPlaceholder: "Search users by name, email, role...",
      defaultPageSize: 10,
      pageSizeOptions: [5, 10, 20],
      defaultSortKey: "id",
      defaultSortDir: "desc"
    }
  ), showAddModal && /* @__PURE__ */ React.createElement("div", { style: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1e4
  } }, /* @__PURE__ */ React.createElement("div", { className: "card", style: { width: "480px" } }, /* @__PURE__ */ React.createElement("div", { className: "card-header" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Create New User"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-secondary btn-sm", onClick: () => setShowAddModal(false) }, "\u2715")), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSave }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Full Name"), /* @__PURE__ */ React.createElement("input", { type: "text", className: "form-input", value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), required: true })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Email Address"), /* @__PURE__ */ React.createElement("input", { type: "email", className: "form-input", value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }), required: true })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Password"), /* @__PURE__ */ React.createElement("input", { type: "password", className: "form-input", value: form.password, onChange: (e) => setForm({ ...form, password: e.target.value }), required: true })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Role"), /* @__PURE__ */ React.createElement("select", { className: "form-select", value: form.role, onChange: (e) => setForm({ ...form, role: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "user" }, "User (Standard Access)"), /* @__PURE__ */ React.createElement("option", { value: "admin" }, "Admin (Full Client Access)"), /* @__PURE__ */ React.createElement("option", { value: "superadmin" }, "Superadmin (SaNDS Lab Platform)"))), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-primary", style: { width: "100%", marginTop: "10px" } }, "Save User")))));
}
function formatCurrency(amount, currency = "BHD", decimals = 3) {
  const num = parseFloat(amount || 0);
  const dec = typeof decimals === "number" ? decimals : ["BHD", "KWD", "OMR"].includes(currency) ? 3 : 2;
  const formatted = num.toFixed(dec);
  if (currency === "INR") return `\u20B9 ${formatted}`;
  if (currency === "USD") return `$ ${formatted}`;
  return `${formatted} ${currency}`;
}
function formatDateTime(dateStr, format = "YYYY-MM-DD HH:mm:ss") {
  if (!dateStr) return "";
  try {
    let cleanStr = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(cleanStr)) {
      cleanStr = cleanStr.replace(" ", "T");
    }
    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) return dateStr;
    const YYYY = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, "0");
    const DD = String(d.getDate()).padStart(2, "0");
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const hh12 = String(hours % 12 || 12).padStart(2, "0");
    const HH24 = String(hours).padStart(2, "0");
    if (format === "DD/MM/YYYY hh:mm:ss A") return `${DD}/${MM}/${YYYY} ${hh12}:${minutes}:${seconds} ${ampm}`;
    if (format === "DD-MM-YYYY HH:mm") return `${DD}-${MM}-${YYYY} ${HH24}:${minutes}`;
    if (format === "MM/DD/YYYY hh:mm A") return `${MM}/${DD}/${YYYY} ${hh12}:${minutes} ${ampm}`;
    if (format === "YYYY-MM-DD hh:mm A") return `${YYYY}-${MM}-${DD} ${hh12}:${minutes} ${ampm}`;
    return `${YYYY}-${MM}-${DD} ${HH24}:${minutes}:${seconds}`;
  } catch (e) {
    return dateStr;
  }
}
function WalletView({ currentUser, showToast, globalSettings, onBalanceChange }) {
  const [walletData, setWalletData] = useState({
    wallet_balance: 0,
    currency: "BHD",
    currency_decimals: 3,
    users: [],
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [selectedUserForTopUp, setSelectedUserForTopUp] = useState(null);
  const [topUpForm, setTopUpForm] = useState({
    user_id: "",
    amount: "",
    transaction_type: "credit",
    reference_id: "",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [deleteTargetTx, setDeleteTargetTx] = useState(null);
  const [deletingTx, setDeletingTx] = useState(false);
  const isSuperadmin = currentUser?.role === "superadmin";
  const loadWallet = async () => {
    setLoading(true);
    try {
      const res = await fetch(`./api/wallet.php?type=${typeFilter === "all" ? "" : typeFilter}&limit=100`);
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
    const targetId = user ? user.id : walletData.users[0]?.id || "";
    setTopUpForm({
      user_id: targetId,
      amount: "",
      transaction_type: "credit",
      reference_id: "",
      notes: ""
    });
    setSelectedUserForTopUp(user);
    setShowTopUpModal(true);
  };
  const handleSaveTopUp = async (e) => {
    e.preventDefault();
    if (!topUpForm.user_id || parseFloat(topUpForm.amount) <= 0) {
      showToast("Please enter a valid amount and target account", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("./api/wallet.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(topUpForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Wallet balance updated successfully!");
        setShowTopUpModal(false);
        loadWallet();
      } else {
        showToast(data.error || "Failed to update wallet balance", "error");
      }
    } catch (err) {
      showToast("Network error processing recharge", "error");
    } finally {
      setSubmitting(false);
    }
  };
  const confirmExecuteDelete = async () => {
    if (!deleteTargetTx) return;
    setDeletingTx(true);
    try {
      const res = await fetch(`./api/wallet.php?id=${deleteTargetTx.id}&revert=1`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Transaction record deleted & balance adjusted successfully");
        setDeleteTargetTx(null);
        loadWallet();
      } else {
        showToast(data.error || "Failed to delete transaction", "error");
      }
    } catch (e) {
      showToast("Network error deleting transaction", "error");
    } finally {
      setDeletingTx(false);
    }
  };
  const curr = walletData.currency || globalSettings?.system_currency || "BHD";
  const dec = walletData.currency_decimals ?? globalSettings?.currency_decimals ?? 3;
  const ledgerColumns = [
    {
      key: "created_at",
      label: "Date & Time",
      render: (t) => /* @__PURE__ */ React.createElement("span", { style: { fontSize: "12px", color: "var(--text-secondary)" } }, formatDateTime(t.created_at, globalSettings?.system_date_format))
    },
    {
      key: "user_name",
      label: "Account / User",
      render: (t) => /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, t.user_name || "Client Account"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "10.5px", color: "var(--text-muted)" } }, t.user_email))
    },
    {
      key: "transaction_type",
      label: "Type",
      render: (t) => /* @__PURE__ */ React.createElement("span", { className: `tx-type-badge tx-${t.transaction_type}` }, t.transaction_type === "credit" ? "\u{1F7E2} Credit (+)" : t.transaction_type === "debit" ? "\u{1F534} Debit (-)" : "\u{1F7E1} Adjustment")
    },
    {
      key: "amount",
      label: "Amount",
      render: (t) => {
        const isCredit = t.transaction_type === "credit";
        return /* @__PURE__ */ React.createElement("span", { style: { fontWeight: "800", fontSize: "13px", color: isCredit ? "#15803D" : "#B91C1C" } }, isCredit ? "+" : "-", formatCurrency(t.amount, t.currency || curr, dec));
      }
    },
    {
      key: "balance_after",
      label: "Balance After",
      render: (t) => /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, formatCurrency(t.balance_after, t.currency || curr, dec)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "10px", color: "var(--text-muted)" } }, "Before: ", formatCurrency(t.balance_before, t.currency || curr, dec)))
    },
    {
      key: "reference_id",
      label: "Reference / Ref ID",
      render: (t) => /* @__PURE__ */ React.createElement("div", { style: { maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, title: t.reference_id }, /* @__PURE__ */ React.createElement("span", { className: "badge badge-subtle", style: { fontSize: "11px", fontFamily: "monospace" } }, t.reference_id || "N/A"))
    },
    {
      key: "description",
      label: "Description / Notes",
      render: (t) => /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", maxWidth: "240px" }, title: t.description }, t.description || (t.reference_type === "superadmin_topup" ? "Recharge added by Superadmin" : "WhatsApp Dispatch"))
    },
    {
      key: "performed_by_name",
      label: "Processed By",
      render: (t) => /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11.5px", color: "var(--text-secondary)" } }, t.performed_by_name || "System / Auto")
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (t) => /* @__PURE__ */ React.createElement("div", null, isSuperadmin && /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "btn btn-secondary btn-sm",
          style: { padding: "3px 8px", fontSize: "11px", color: "#EF4444", display: "flex", alignItems: "center", gap: "3px" },
          onClick: () => setDeleteTargetTx(t),
          title: "Delete this transaction record and adjust user balance"
        },
        /* @__PURE__ */ React.createElement("span", null, "\u{1F5D1}\uFE0F"),
        " Delete"
      ))
    }
  ];
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "page-header-row" }, /* @__PURE__ */ React.createElement("div", { className: "page-title-group" }, /* @__PURE__ */ React.createElement("h1", null, /* @__PURE__ */ React.createElement("span", null, "\u{1F4B3}"), " Prepaid Wallet & Financial Statement"), /* @__PURE__ */ React.createElement("p", null, "Superadmin balance management, automatic transaction debit ledger, and multi-currency billing statement.")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "10px" } }, isSuperadmin && /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => handleOpenTopUp(null), style: { display: "flex", alignItems: "center", gap: "6px" } }, /* @__PURE__ */ React.createElement("span", null, "\u2795"), " Add Wallet Balance"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-secondary", onClick: loadWallet }, /* @__PURE__ */ React.createElement("span", null, "\u{1F504}"), " Refresh Statement"))), /* @__PURE__ */ React.createElement("div", { className: "wallet-hero-grid" }, /* @__PURE__ */ React.createElement("div", { className: "wallet-balance-card" }, /* @__PURE__ */ React.createElement("div", { className: "wallet-balance-label" }, "Available Prepaid Wallet Balance"), /* @__PURE__ */ React.createElement("div", { className: "wallet-balance-amount" }, formatCurrency(walletData.wallet_balance, curr, dec)), /* @__PURE__ */ React.createElement("div", { className: "wallet-quick-actions" }, isSuperadmin && /* @__PURE__ */ React.createElement("button", { className: "btn-recharge", onClick: () => handleOpenTopUp(null) }, /* @__PURE__ */ React.createElement("span", null, "\u2795"), " Top-Up / Add Credit"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "12px", opacity: 0.9, alignSelf: "center" } }, "Base Currency: ", /* @__PURE__ */ React.createElement("strong", null, curr)))), /* @__PURE__ */ React.createElement("div", { className: "card", style: { display: "flex", flexDirection: "column", justifyContent: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "12px", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase" } }, "Total Credits / Recharges"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "24px", fontWeight: "800", color: "#15803D", marginTop: "6px" } }, formatCurrency(
    walletData.transactions.filter((t) => t.transaction_type === "credit").reduce((acc, t) => acc + parseFloat(t.amount || 0), 0),
    curr,
    dec
  )), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "4px" } }, walletData.transactions.filter((t) => t.transaction_type === "credit").length, " credit events")), /* @__PURE__ */ React.createElement("div", { className: "card", style: { display: "flex", flexDirection: "column", justifyContent: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "12px", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase" } }, "Total Dispatches / Debits"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "24px", fontWeight: "800", color: "#B91C1C", marginTop: "6px" } }, formatCurrency(
    walletData.transactions.filter((t) => t.transaction_type === "debit").reduce((acc, t) => acc + parseFloat(t.amount || 0), 0),
    curr,
    dec
  )), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "4px" } }, walletData.transactions.filter((t) => t.transaction_type === "debit").length, " message dispatches"))), isSuperadmin && walletData.users && walletData.users.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "card", style: { marginBottom: "24px" } }, /* @__PURE__ */ React.createElement("div", { className: "card-header", style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { className: "card-title", style: { fontSize: "15px" } }, "\u{1F465} Client Account Balances Overview"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "12px", color: "var(--text-muted)" } }, "Superadmin Quick Balance Management")), /* @__PURE__ */ React.createElement("div", { style: { overflowX: "auto" } }, /* @__PURE__ */ React.createElement("table", { className: "data-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "User / Company"), /* @__PURE__ */ React.createElement("th", null, "Email"), /* @__PURE__ */ React.createElement("th", null, "Role"), /* @__PURE__ */ React.createElement("th", null, "Current Balance"), /* @__PURE__ */ React.createElement("th", null, "Status"), /* @__PURE__ */ React.createElement("th", null, "Action"))), /* @__PURE__ */ React.createElement("tbody", null, walletData.users.map((u) => /* @__PURE__ */ React.createElement("tr", { key: u.id }, /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("strong", null, u.name)), /* @__PURE__ */ React.createElement("td", null, u.email), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: `badge ${u.role === "superadmin" ? "cat-marketing" : u.role === "admin" ? "cat-auth" : "cat-utility"}` }, u.role.toUpperCase())), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "14px", color: parseFloat(u.wallet_balance) > 0 ? "#15803D" : "#94A3B8" } }, formatCurrency(u.wallet_balance, curr, dec))), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: `badge ${u.status === "active" ? "status-read" : "status-failed"}` }, u.status.toUpperCase())), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-primary btn-sm",
      style: { padding: "4px 10px", fontSize: "11.5px", display: "flex", alignItems: "center", gap: "4px" },
      onClick: () => handleOpenTopUp(u)
    },
    /* @__PURE__ */ React.createElement("span", null, "\u2795"),
    " Top-Up"
  )))))))), /* @__PURE__ */ React.createElement(
    DataTable,
    {
      columns: ledgerColumns,
      data: walletData.transactions,
      title: "wallet_transactions_statement",
      searchPlaceholder: "Search reference ID, description, user...",
      defaultPageSize: 10,
      pageSizeOptions: [10, 25, 50, 100],
      defaultSortKey: "created_at",
      defaultSortDir: "desc",
      actions: /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "8px", alignItems: "center" } }, /* @__PURE__ */ React.createElement(
        "select",
        {
          className: "form-select",
          style: { width: "150px", padding: "5px 8px", fontSize: "12px" },
          value: typeFilter,
          onChange: (e) => setTypeFilter(e.target.value)
        },
        /* @__PURE__ */ React.createElement("option", { value: "all" }, "All Transactions"),
        /* @__PURE__ */ React.createElement("option", { value: "credit" }, "Credits (Top-Ups)"),
        /* @__PURE__ */ React.createElement("option", { value: "debit" }, "Debits (Dispatches)")
      )),
      emptyMessage: loading ? "Loading wallet transactions..." : "No transaction history records found."
    }
  ), showTopUpModal && /* @__PURE__ */ React.createElement("div", { style: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1e4
  } }, /* @__PURE__ */ React.createElement("div", { className: "card", style: { width: "520px", maxWidth: "95vw" } }, /* @__PURE__ */ React.createElement("div", { className: "card-header", style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { className: "card-title", style: { fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" } }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4B3}"), " Add Wallet Balance / Payment Credit"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-secondary btn-sm", onClick: () => setShowTopUpModal(false) }, "\u2715")), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSaveTopUp, style: { marginTop: "14px" } }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Select Client / Admin Account"), /* @__PURE__ */ React.createElement(
    "select",
    {
      className: "form-select",
      value: topUpForm.user_id,
      onChange: (e) => setTopUpForm({ ...topUpForm, user_id: e.target.value }),
      required: true
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "-- Choose Account --"),
    walletData.users.map((u) => /* @__PURE__ */ React.createElement("option", { key: u.id, value: u.id }, u.name, " (", u.email, ") - Current Balance: ", formatCurrency(u.wallet_balance, curr, dec)))
  )), /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Top-Up Amount (", curr, ")"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.001",
      min: "0.001",
      placeholder: "e.g. 50.000",
      className: "form-input",
      value: topUpForm.amount,
      onChange: (e) => setTopUpForm({ ...topUpForm, amount: e.target.value }),
      required: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Transaction Type"), /* @__PURE__ */ React.createElement(
    "select",
    {
      className: "form-select",
      value: topUpForm.transaction_type,
      onChange: (e) => setTopUpForm({ ...topUpForm, transaction_type: e.target.value })
    },
    /* @__PURE__ */ React.createElement("option", { value: "credit" }, "Credit (Top-Up / Payment Made)"),
    /* @__PURE__ */ React.createElement("option", { value: "debit" }, "Debit (Deduction)"),
    /* @__PURE__ */ React.createElement("option", { value: "adjustment" }, "Manual Set (Override)")
  ))), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Payment Reference / Receipt ID"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "e.g. BENEFIT-849201, Bank Transfer #9912, Cash Receipt",
      className: "form-input",
      value: topUpForm.reference_id,
      onChange: (e) => setTopUpForm({ ...topUpForm, reference_id: e.target.value })
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "form-hint" }, "Reference number to match with client invoice or bank statement.")), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Notes & Description"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      rows: "2",
      placeholder: "e.g. 50 BHD Recharge via BenefitPay on 05-Oct-2026",
      className: "form-input",
      value: topUpForm.notes,
      onChange: (e) => setTopUpForm({ ...topUpForm, notes: e.target.value })
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "10px", marginTop: "16px" } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-secondary", style: { flex: 1 }, onClick: () => setShowTopUpModal(false) }, "Cancel"), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-primary", style: { flex: 1 }, disabled: submitting }, submitting ? "Processing..." : "\u{1F4B3} Credit Wallet Balance"))))), deleteTargetTx && /* @__PURE__ */ React.createElement("div", { className: "confirm-modal-overlay", onClick: () => !deletingTx && setDeleteTargetTx(null) }, /* @__PURE__ */ React.createElement("div", { className: "confirm-modal-card", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "confirm-modal-body" }, /* @__PURE__ */ React.createElement("div", { className: "confirm-modal-icon-badge" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F5D1}\uFE0F")), /* @__PURE__ */ React.createElement("div", { className: "confirm-modal-title" }, "Delete Transaction Record"), /* @__PURE__ */ React.createElement("div", { className: "confirm-modal-subtitle" }, "Are you sure you want to permanently remove this transaction from the ledger?"), /* @__PURE__ */ React.createElement("div", { className: "confirm-modal-info-box" }, /* @__PURE__ */ React.createElement("div", { className: "confirm-modal-info-row" }, /* @__PURE__ */ React.createElement("span", { className: "confirm-modal-info-label" }, "Transaction ID"), /* @__PURE__ */ React.createElement("span", { className: "confirm-modal-info-value" }, "#", deleteTargetTx.id)), /* @__PURE__ */ React.createElement("div", { className: "confirm-modal-info-row" }, /* @__PURE__ */ React.createElement("span", { className: "confirm-modal-info-label" }, "Account / User"), /* @__PURE__ */ React.createElement("span", { className: "confirm-modal-info-value" }, deleteTargetTx.user_name || deleteTargetTx.user_email || "N/A")), /* @__PURE__ */ React.createElement("div", { className: "confirm-modal-info-row" }, /* @__PURE__ */ React.createElement("span", { className: "confirm-modal-info-label" }, "Type & Amount"), /* @__PURE__ */ React.createElement("span", { className: "confirm-modal-info-value", style: { color: deleteTargetTx.transaction_type === "credit" ? "#15803D" : "#DC2626" } }, deleteTargetTx.transaction_type === "credit" ? "\u{1F7E2} Credit (+)" : "\u{1F534} Debit (-)", " ", formatCurrency(deleteTargetTx.amount, deleteTargetTx.currency || curr, dec))), deleteTargetTx.reference_id && /* @__PURE__ */ React.createElement("div", { className: "confirm-modal-info-row" }, /* @__PURE__ */ React.createElement("span", { className: "confirm-modal-info-label" }, "Reference ID"), /* @__PURE__ */ React.createElement("span", { className: "confirm-modal-info-value", style: { fontFamily: "monospace" } }, deleteTargetTx.reference_id)), deleteTargetTx.description && /* @__PURE__ */ React.createElement("div", { className: "confirm-modal-info-row" }, /* @__PURE__ */ React.createElement("span", { className: "confirm-modal-info-label" }, "Description"), /* @__PURE__ */ React.createElement("span", { className: "confirm-modal-info-value", style: { maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, deleteTargetTx.description))), /* @__PURE__ */ React.createElement("div", { className: "confirm-modal-warning-box" }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "16px" } }, "\u26A0\uFE0F"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, "Automatic Balance Reversal:"), " Deleting this record will automatically adjust the user balance accordingly (e.g. subtracting credited funds or refunding debited messages)."))), /* @__PURE__ */ React.createElement("div", { className: "confirm-modal-actions" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn-confirm-cancel",
      onClick: () => setDeleteTargetTx(null),
      disabled: deletingTx
    },
    "Cancel"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn-confirm-delete",
      onClick: confirmExecuteDelete,
      disabled: deletingTx
    },
    deletingTx ? "Deleting..." : "\u{1F5D1}\uFE0F Yes, Delete & Adjust Balance"
  )))));
}
function SettingsView({ showToast, onSettingsChange }) {
  const [activeSubTab, setActiveSubTab] = useState("tariffs");
  const [settings, setSettings] = useState({
    meta_phone_number_id: "",
    meta_waba_account_id: "",
    meta_access_token: "",
    webhook_verify_token: "",
    business_display_name: "UniGlobal Consultancy W.L.L",
    business_phone_number: "+973 1700 8899",
    system_currency: "BHD",
    currency_decimals: "3",
    system_date_format: "YYYY-MM-DD HH:mm:ss",
    system_timezone: "Asia/Bahrain",
    tariff_utility_meta: "0.0140",
    tariff_utility_platform: "0.0045",
    tariff_auth_meta: "0.0110",
    tariff_auth_platform: "0.0035",
    tariff_marketing_meta: "0.0270",
    tariff_marketing_platform: "0.0070",
    tariff_service_meta: "0.0075",
    tariff_service_platform: "0.0025",
    wallet_enforcement: "1"
  });
  const [loading, setLoading] = useState(false);
  const [currentTimePreview, setCurrentTimePreview] = useState((/* @__PURE__ */ new Date()).toISOString());
  useEffect(() => {
    fetch("./api/settings.php").then((res) => res.json()).then((res) => {
      if (res.success && res.settings) {
        setSettings((prev) => ({ ...prev, ...res.settings }));
      }
    });
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setCurrentTimePreview((/* @__PURE__ */ new Date()).toISOString()), 1e3);
    return () => clearInterval(timer);
  }, []);
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("./api/settings.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings })
      });
      const data = await res.json();
      if (data.success) {
        showToast("System configuration & Tariffs updated successfully! Changes are live.");
        if (onSettingsChange) onSettingsChange(settings);
      } else {
        showToast(data.error || "Failed to update settings", "error");
      }
    } catch (err) {
      showToast("Network error saving settings", "error");
    } finally {
      setLoading(false);
    }
  };
  const curr = settings.system_currency || "BHD";
  const dec = parseInt(settings.currency_decimals || "3", 10);
  const currencyOptions = [
    { code: "BHD", name: "\u{1F1E7}\u{1F1ED} BHD - Bahraini Dinar (3 decimals)", defaultDecimals: 3 },
    { code: "SAR", name: "\u{1F1F8}\u{1F1E6} SAR - Saudi Riyal (2 decimals)", defaultDecimals: 2 },
    { code: "AED", name: "\u{1F1E6}\u{1F1EA} AED - UAE Dirham (2 decimals)", defaultDecimals: 2 },
    { code: "KWD", name: "\u{1F1F0}\u{1F1FC} KWD - Kuwaiti Dinar (3 decimals)", defaultDecimals: 3 },
    { code: "QAR", name: "\u{1F1F6}\u{1F1E6} QAR - Qatari Riyal (2 decimals)", defaultDecimals: 2 },
    { code: "OMR", name: "\u{1F1F4}\u{1F1F2} OMR - Omani Rial (3 decimals)", defaultDecimals: 3 },
    { code: "INR", name: "\u{1F1EE}\u{1F1F3} INR - Indian Rupee (\u20B9, 2 decimals)", defaultDecimals: 2 },
    { code: "USD", name: "\u{1F1FA}\u{1F1F8} USD - US Dollar ($, 2 decimals)", defaultDecimals: 2 }
  ];
  const dateFormatOptions = [
    { value: "YYYY-MM-DD HH:mm:ss", label: "YYYY-MM-DD HH:mm:ss (2026-10-05 17:45:00)" },
    { value: "DD/MM/YYYY hh:mm:ss A", label: "DD/MM/YYYY hh:mm:ss A (05/10/2026 05:45:00 PM)" },
    { value: "DD-MM-YYYY HH:mm", label: "DD-MM-YYYY HH:mm (05-10-2026 17:45)" },
    { value: "MM/DD/YYYY hh:mm A", label: "MM/DD/YYYY hh:mm A (10/05/2026 05:45 PM)" },
    { value: "YYYY-MM-DD hh:mm A", label: "YYYY-MM-DD hh:mm A (2026-10-05 05:45 PM)" }
  ];
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "page-header-row" }, /* @__PURE__ */ React.createElement("div", { className: "page-title-group" }, /* @__PURE__ */ React.createElement("h1", null, /* @__PURE__ */ React.createElement("span", null, "\u2699\uFE0F"), " Superadmin Platform Engine Configuration"), /* @__PURE__ */ React.createElement("p", null, "Configure Meta Cloud API, message tariffs, GCC/India currencies, prepaid wallet rules, and date formats."))), /* @__PURE__ */ React.createElement("div", { className: "settings-nav-tabs" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `settings-tab-btn ${activeSubTab === "tariffs" ? "active" : ""}`,
      onClick: () => setActiveSubTab("tariffs")
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F4B0}"),
    " Tariffs & Pricing Engine"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `settings-tab-btn ${activeSubTab === "currency" ? "active" : ""}`,
      onClick: () => setActiveSubTab("currency")
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F30D}"),
    " Currency & Regional (GCC / India)"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `settings-tab-btn ${activeSubTab === "datetime" ? "active" : ""}`,
      onClick: () => setActiveSubTab("datetime")
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F552}"),
    " Date & Time Formats"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `settings-tab-btn ${activeSubTab === "meta" ? "active" : ""}`,
      onClick: () => setActiveSubTab("meta")
    },
    /* @__PURE__ */ React.createElement("span", null, "\u26A1"),
    " Meta Cloud API Credentials"
  )), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSave }, activeSubTab === "tariffs" && /* @__PURE__ */ React.createElement("div", { className: "card", style: { maxWidth: "900px" } }, /* @__PURE__ */ React.createElement("h3", { style: { fontSize: "15px", fontWeight: "800", color: "var(--wa-dark-teal)", marginBottom: "8px" } }, "Dynamic Meta Cost & Platform Charges Engine"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "12.5px", color: "var(--text-secondary)", marginBottom: "18px" } }, "Configure the exact Meta Cost and SaNDS Platform Margin per message category. These tariffs take effect dynamically across all outgoing message dispatches, wallet debits, and client billing."), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "16px" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "14px", color: "#0F172A" } }, "\u{1F4C4} UTILITY (Invoices, Receipts, Notices)"), /* @__PURE__ */ React.createElement("span", { className: "badge cat-util" }, "UTILITY")), /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontSize: "11.5px" } }, "Meta Base Cost (", curr, ")"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.0001",
      className: "form-input",
      value: settings.tariff_utility_meta,
      onChange: (e) => setSettings({ ...settings, tariff_utility_meta: e.target.value }),
      required: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontSize: "11.5px" } }, "Platform Margin (", curr, ")"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.0001",
      className: "form-input",
      value: settings.tariff_utility_platform,
      onChange: (e) => setSettings({ ...settings, tariff_utility_platform: e.target.value }),
      required: true
    }
  ))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: "10px", fontSize: "12px", color: "#0369A1", fontWeight: "700" } }, "Total Client Rate: ", (parseFloat(settings.tariff_utility_meta || 0) + parseFloat(settings.tariff_utility_platform || 0)).toFixed(dec), " ", curr)), /* @__PURE__ */ React.createElement("div", { style: { background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "14px", color: "#0F172A" } }, "\u{1F510} AUTHENTICATION (OTP, 2FA, Logins)"), /* @__PURE__ */ React.createElement("span", { className: "badge cat-auth" }, "AUTH")), /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontSize: "11.5px" } }, "Meta Base Cost (", curr, ")"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.0001",
      className: "form-input",
      value: settings.tariff_auth_meta,
      onChange: (e) => setSettings({ ...settings, tariff_auth_meta: e.target.value }),
      required: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontSize: "11.5px" } }, "Platform Margin (", curr, ")"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.0001",
      className: "form-input",
      value: settings.tariff_auth_platform,
      onChange: (e) => setSettings({ ...settings, tariff_auth_platform: e.target.value }),
      required: true
    }
  ))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: "10px", fontSize: "12px", color: "#0369A1", fontWeight: "700" } }, "Total Client Rate: ", (parseFloat(settings.tariff_auth_meta || 0) + parseFloat(settings.tariff_auth_platform || 0)).toFixed(dec), " ", curr)), /* @__PURE__ */ React.createElement("div", { style: { background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "14px", color: "#0F172A" } }, "\u{1F4E3} MARKETING (Promotions, Discounts, Offers)"), /* @__PURE__ */ React.createElement("span", { className: "badge cat-mark" }, "MARKETING")), /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontSize: "11.5px" } }, "Meta Base Cost (", curr, ")"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.0001",
      className: "form-input",
      value: settings.tariff_marketing_meta,
      onChange: (e) => setSettings({ ...settings, tariff_marketing_meta: e.target.value }),
      required: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontSize: "11.5px" } }, "Platform Margin (", curr, ")"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.0001",
      className: "form-input",
      value: settings.tariff_marketing_platform,
      onChange: (e) => setSettings({ ...settings, tariff_marketing_platform: e.target.value }),
      required: true
    }
  ))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: "10px", fontSize: "12px", color: "#0369A1", fontWeight: "700" } }, "Total Client Rate: ", (parseFloat(settings.tariff_marketing_meta || 0) + parseFloat(settings.tariff_marketing_platform || 0)).toFixed(dec), " ", curr)), /* @__PURE__ */ React.createElement("div", { style: { background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "14px", color: "#0F172A" } }, "\u{1F4AC} SERVICE (Customer Support, Live Chat)"), /* @__PURE__ */ React.createElement("span", { className: "badge cat-serv" }, "SERVICE")), /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontSize: "11.5px" } }, "Meta Base Cost (", curr, ")"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.0001",
      className: "form-input",
      value: settings.tariff_service_meta,
      onChange: (e) => setSettings({ ...settings, tariff_service_meta: e.target.value }),
      required: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontSize: "11.5px" } }, "Platform Margin (", curr, ")"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.0001",
      className: "form-input",
      value: settings.tariff_service_platform,
      onChange: (e) => setSettings({ ...settings, tariff_service_platform: e.target.value }),
      required: true
    }
  ))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: "10px", fontSize: "12px", color: "#0369A1", fontWeight: "700" } }, "Total Client Rate: ", (parseFloat(settings.tariff_service_meta || 0) + parseFloat(settings.tariff_service_platform || 0)).toFixed(dec), " ", curr)))), activeSubTab === "currency" && /* @__PURE__ */ React.createElement("div", { className: "card", style: { maxWidth: "800px" } }, /* @__PURE__ */ React.createElement("h3", { style: { fontSize: "15px", fontWeight: "800", color: "var(--wa-dark-teal)", marginBottom: "8px" } }, "Multi-Currency Configuration (All GCC & India)"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "12.5px", color: "var(--text-secondary)", marginBottom: "18px" } }, "Select the operating currency for the entire platform, wallet balances, tariffs, and transaction reports."), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Platform Operating Currency"), /* @__PURE__ */ React.createElement(
    "select",
    {
      className: "form-select",
      value: settings.system_currency,
      onChange: (e) => {
        const selectedCode = e.target.value;
        const found = currencyOptions.find((c) => c.code === selectedCode);
        setSettings({
          ...settings,
          system_currency: selectedCode,
          currency_decimals: found ? String(found.defaultDecimals) : "3"
        });
      }
    },
    currencyOptions.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.code, value: c.code }, c.name))
  ), /* @__PURE__ */ React.createElement("span", { className: "form-hint" }, "All wallet top-ups, message charges, and Odoo billing logs will display in this currency.")), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Currency Decimal Precision"), /* @__PURE__ */ React.createElement(
    "select",
    {
      className: "form-select",
      value: settings.currency_decimals,
      onChange: (e) => setSettings({ ...settings, currency_decimals: e.target.value })
    },
    /* @__PURE__ */ React.createElement("option", { value: "3" }, "3 Decimals (e.g. 0.0185 BHD / 100.500 KWD)"),
    /* @__PURE__ */ React.createElement("option", { value: "2" }, "2 Decimals (e.g. 2.50 SAR / 150.00 INR / $ 10.00)"),
    /* @__PURE__ */ React.createElement("option", { value: "4" }, "4 Decimals (e.g. 0.0145 BHD Micro-billing)")
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group", style: { marginTop: "16px" } }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Prepaid Wallet Enforcement"), /* @__PURE__ */ React.createElement(
    "select",
    {
      className: "form-select",
      value: settings.wallet_enforcement,
      onChange: (e) => setSettings({ ...settings, wallet_enforcement: e.target.value })
    },
    /* @__PURE__ */ React.createElement("option", { value: "1" }, "Strict Enforcement: Block messages when wallet balance is insufficient"),
    /* @__PURE__ */ React.createElement("option", { value: "0" }, "Monitor Only: Allow dispatches and record negative balance")
  ))), activeSubTab === "datetime" && /* @__PURE__ */ React.createElement("div", { className: "card", style: { maxWidth: "800px" } }, /* @__PURE__ */ React.createElement("h3", { style: { fontSize: "15px", fontWeight: "800", color: "var(--wa-dark-teal)", marginBottom: "8px" } }, "Date & Time Format Settings"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "12.5px", color: "var(--text-secondary)", marginBottom: "18px" } }, "Standardize how timestamps, audit logs, and message telemetry are rendered across all views."), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "System Date & Time Format"), /* @__PURE__ */ React.createElement(
    "select",
    {
      className: "form-select",
      value: settings.system_date_format,
      onChange: (e) => setSettings({ ...settings, system_date_format: e.target.value })
    },
    dateFormatOptions.map((df) => /* @__PURE__ */ React.createElement("option", { key: df.value, value: df.value }, df.label))
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Regional Timezone"), /* @__PURE__ */ React.createElement(
    "select",
    {
      className: "form-select",
      value: settings.system_timezone,
      onChange: (e) => setSettings({ ...settings, system_timezone: e.target.value })
    },
    /* @__PURE__ */ React.createElement("option", { value: "Asia/Bahrain" }, "\u{1F1E7}\u{1F1ED} Bahrain (GMT+3) - Asia/Bahrain"),
    /* @__PURE__ */ React.createElement("option", { value: "Asia/Riyadh" }, "\u{1F1F8}\u{1F1E6} Saudi Arabia (GMT+3) - Asia/Riyadh"),
    /* @__PURE__ */ React.createElement("option", { value: "Asia/Dubai" }, "\u{1F1E6}\u{1F1EA} UAE / Dubai (GMT+4) - Asia/Dubai"),
    /* @__PURE__ */ React.createElement("option", { value: "Asia/Kuwait" }, "\u{1F1F0}\u{1F1FC} Kuwait (GMT+3) - Asia/Kuwait"),
    /* @__PURE__ */ React.createElement("option", { value: "Asia/Qatar" }, "\u{1F1F6}\u{1F1E6} Qatar (GMT+3) - Asia/Qatar"),
    /* @__PURE__ */ React.createElement("option", { value: "Asia/Muscat" }, "\u{1F1F4}\u{1F1F2} Oman (GMT+4) - Asia/Muscat"),
    /* @__PURE__ */ React.createElement("option", { value: "Asia/Kolkata" }, "\u{1F1EE}\u{1F1F3} India (GMT+5:30) - Asia/Kolkata"),
    /* @__PURE__ */ React.createElement("option", { value: "UTC" }, "\u{1F310} Coordinated Universal Time (UTC)")
  )), /* @__PURE__ */ React.createElement("div", { style: { background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "10px", padding: "14px", marginTop: "16px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11.5px", color: "#166534", fontWeight: "700", textTransform: "uppercase" } }, "Live Format Preview"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "18px", fontWeight: "800", color: "#15803D", marginTop: "4px" } }, formatDateTime(currentTimePreview, settings.system_date_format)))), activeSubTab === "meta" && /* @__PURE__ */ React.createElement("div", { className: "card", style: { maxWidth: "800px" } }, /* @__PURE__ */ React.createElement("h3", { style: { fontSize: "15px", fontWeight: "800", color: "var(--wa-dark-teal)", marginBottom: "8px" } }, "Meta WhatsApp Business Cloud API Credentials"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "12.5px", color: "var(--text-secondary)", marginBottom: "18px" } }, "Permanent System User Graph API access tokens and Webhook validation tokens."), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Meta Phone Number ID"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      value: settings.meta_phone_number_id,
      onChange: (e) => setSettings({ ...settings, meta_phone_number_id: e.target.value })
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "WhatsApp Business Account ID (WABA)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      value: settings.meta_waba_account_id,
      onChange: (e) => setSettings({ ...settings, meta_waba_account_id: e.target.value })
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Permanent System User Access Token (Graph API)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "password",
      className: "form-input",
      value: settings.meta_access_token,
      onChange: (e) => setSettings({ ...settings, meta_access_token: e.target.value })
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Webhook Verification Secret Token"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      value: settings.webhook_verify_token,
      onChange: (e) => setSettings({ ...settings, webhook_verify_token: e.target.value })
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "form-hint" }, "Paste this token into Meta Developer App Dashboard Webhook settings."))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: "20px" } }, /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-primary", style: { padding: "10px 24px", fontSize: "14px", fontWeight: "700" }, disabled: loading }, loading ? "Saving..." : "\u{1F4BE} Save & Apply System Configuration"))));
}
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(/* @__PURE__ */ React.createElement(App, null));
}

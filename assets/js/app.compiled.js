const { useState, useEffect, useMemo, useRef } = React;
function DataTable({
  columns,
  data = [],
  searchable = true,
  searchPlaceholder = "Search records...",
  pageSizeOptions = [5, 10, 25, 50],
  defaultPageSize = 10,
  defaultSortKey = "",
  defaultSortDir = "asc",
  title = "export",
  actions = null,
  emptyMessage = "No matching records found."
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState(defaultSortKey || (columns[0]?.key || ""));
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
      return sortDir === "asc" ? String(aVal).localeCompare(String(bVal), void 0, { numeric: true }) : String(bVal).localeCompare(String(aVal), void 0, { numeric: true });
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
      setSortDir("asc");
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
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [toast, setToast] = useState(null);
  useEffect(() => {
    checkAuth();
  }, []);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4e3);
  };
  const checkAuth = async () => {
    try {
      const res = await fetch("./api/auth.php?action=check");
      const data = await res.json();
      if (data.success && data.authenticated && data.user) {
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch (e) {
      console.error("Auth check error", e);
    } finally {
      setLoading(false);
    }
  };
  const handleLogin = (user) => {
    setCurrentUser(user);
    showToast(`Welcome back, ${user.name}!`);
  };
  const handleLogout = async () => {
    try {
      await fetch("./api/auth.php?action=logout");
      setCurrentUser(null);
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
        showToast(`Switched to ${data.user.name} (${role.toUpperCase()})`);
      }
    } catch (e) {
      console.error(e);
    }
  };
  if (loading) {
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", gap: "12px" } }, /* @__PURE__ */ React.createElement("div", { className: "brand-badge" }, /* @__PURE__ */ React.createElement("span", { className: "dot" }), " Loading SaNDS Platform..."));
  }
  if (!currentUser) {
    return /* @__PURE__ */ React.createElement(LoginView, { onLogin: handleLogin, onSwitchDemo: switchDemoRole });
  }
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
  } }, /* @__PURE__ */ React.createElement("span", null, toast.type === "error" ? "\u26A0\uFE0F" : "\u2705"), toast.message), /* @__PURE__ */ React.createElement("header", { className: "app-header" }, /* @__PURE__ */ React.createElement("div", { className: "header-top-bar" }, /* @__PURE__ */ React.createElement("div", { className: "header-top-inner" }, /* @__PURE__ */ React.createElement("div", { className: "header-brand" }, /* @__PURE__ */ React.createElement("img", { src: "./assets/logos/SaNDSLab-LogoNewUpdated.png", alt: "SaNDS Lab Middle East", className: "brand-logo" }), /* @__PURE__ */ React.createElement("div", { className: "brand-badge" }, /* @__PURE__ */ React.createElement("span", { className: "dot" }), " WhatsApp Gateway")), /* @__PURE__ */ React.createElement("div", { className: "header-actions" }, /* @__PURE__ */ React.createElement("div", { className: "user-profile-pill", title: `Logged in as ${currentUser.email}` }, /* @__PURE__ */ React.createElement("div", { className: "avatar", style: { background: currentUser.avatar_color || "#128C7E" } }, currentUser.name.charAt(0)), /* @__PURE__ */ React.createElement("div", { className: "user-details" }, /* @__PURE__ */ React.createElement("span", { className: "user-name" }, currentUser.name), /* @__PURE__ */ React.createElement("span", { className: "user-role-badge" }, currentUser.role))), /* @__PURE__ */ React.createElement("button", { className: "btn-logout", onClick: handleLogout, title: "Sign Out" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F6AA}"), " Logout")))), /* @__PURE__ */ React.createElement("div", { className: "header-nav-bar" }, /* @__PURE__ */ React.createElement("div", { className: "header-nav-inner" }, /* @__PURE__ */ React.createElement("nav", { className: "horizontal-nav" }, /* @__PURE__ */ React.createElement("button", { className: `nav-item ${activeTab === "dashboard" ? "active" : ""}`, onClick: () => setActiveTab("dashboard") }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4CA}"), " Dashboard"), /* @__PURE__ */ React.createElement("button", { className: `nav-item ${activeTab === "composer" ? "active" : ""}`, onClick: () => setActiveTab("composer") }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4AC}"), " Send Message"), /* @__PURE__ */ React.createElement("button", { className: `nav-item ${activeTab === "logs" ? "active" : ""}`, onClick: () => setActiveTab("logs") }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4DC}"), " Message Logs"), /* @__PURE__ */ React.createElement("button", { className: `nav-item ${activeTab === "templates" ? "active" : ""}`, onClick: () => setActiveTab("templates") }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4CB}"), " Templates & Tariffs"), /* @__PURE__ */ React.createElement("button", { className: `nav-item ${activeTab === "api_hub" ? "active" : ""}`, onClick: () => setActiveTab("api_hub") }, /* @__PURE__ */ React.createElement("span", null, "\u26A1"), " Odoo API Hub"), ["superadmin", "admin"].includes(currentUser.role) && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: `nav-item ${activeTab === "api_keys" ? "active" : ""}`, onClick: () => setActiveTab("api_keys") }, /* @__PURE__ */ React.createElement("span", null, "\u{1F511}"), " API Keys"), /* @__PURE__ */ React.createElement("button", { className: `nav-item ${activeTab === "users" ? "active" : ""}`, onClick: () => setActiveTab("users") }, /* @__PURE__ */ React.createElement("span", null, "\u{1F465}"), " Users"), /* @__PURE__ */ React.createElement("button", { className: `nav-item ${activeTab === "settings" ? "active" : ""}`, onClick: () => setActiveTab("settings") }, /* @__PURE__ */ React.createElement("span", null, "\u2699\uFE0F"), " Meta Settings")))))), /* @__PURE__ */ React.createElement("main", { className: "app-body" }, activeTab === "dashboard" && /* @__PURE__ */ React.createElement(DashboardView, { onNavigate: setActiveTab }), activeTab === "composer" && /* @__PURE__ */ React.createElement(ComposerView, { showToast, onSent: () => setActiveTab("logs") }), activeTab === "logs" && /* @__PURE__ */ React.createElement(MessageLogsView, { showToast }), activeTab === "templates" && /* @__PURE__ */ React.createElement(TemplatesView, { showToast }), activeTab === "api_hub" && /* @__PURE__ */ React.createElement(OdooApiHubView, { showToast }), activeTab === "api_keys" && /* @__PURE__ */ React.createElement(ApiKeysView, { showToast }), activeTab === "users" && /* @__PURE__ */ React.createElement(UsersView, { currentUser, showToast }), activeTab === "settings" && /* @__PURE__ */ React.createElement(SettingsView, { showToast })), /* @__PURE__ */ React.createElement("footer", { className: "app-footer" }, /* @__PURE__ */ React.createElement("div", { className: "footer-inner" }, /* @__PURE__ */ React.createElement("div", { className: "footer-left" }, "All Rights Reserved | Engineered By SaNDS Lab Middle East W.L.L."), /* @__PURE__ */ React.createElement("div", { className: "footer-right" }, /* @__PURE__ */ React.createElement("span", { className: "footer-badge" }, "WhatsApp Cloud API v19.0"), /* @__PURE__ */ React.createElement("span", { className: "footer-badge" }, "Odoo ERP Connector Active"), /* @__PURE__ */ React.createElement("span", null, "Bahrain (BHD) Tariff Active")))));
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
    fetch("./api/analytics.php").then((res) => res.json()).then((res) => {
      if (res.success) setData(res);
    }).finally(() => setLoading(false));
  }, []);
  if (loading || !data) {
    return /* @__PURE__ */ React.createElement("div", { className: "card" }, "Loading real-time analytics...");
  }
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
    if (tmpl.sample_params_json) {
      try {
        setParams(JSON.parse(tmpl.sample_params_json));
      } catch (e) {
        setParams([]);
      }
    }
    if (tmpl.header_sample) {
      setMediaUrl(tmpl.header_sample);
      setMediaName(tmpl.header_sample.split("/").pop() || "document.pdf");
    }
  };
  const renderedText = useMemo(() => {
    if (!selectedTemplate) return customText || "Type your message...";
    const tmpl = templates.find((t) => t.template_name === selectedTemplate);
    if (!tmpl) return "";
    let body = tmpl.body_text;
    params.forEach((val, idx) => {
      body = body.replace(new RegExp(`\\{\\{${idx + 1}\\}\\}`, "g"), val || `[Param ${idx + 1}]`);
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
      const data = await res.json();
      if (data.success) {
        showToast(`WhatsApp Message Dispatched to ${toPhone}! (Rate: ${data.tariff?.client_rate})`);
        onSent();
      } else {
        showToast(data.error || "Failed to send message", "error");
      }
    } catch (err) {
      showToast("Connection error while sending message", "error");
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
  )), selectedTemplate && currentTemplateObj && /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Template Dynamic Parameters (", params.length, " Variables)"), /* @__PURE__ */ React.createElement("div", { className: "param-grid" }, params.map((val, idx) => /* @__PURE__ */ React.createElement("div", { key: idx }, /* @__PURE__ */ React.createElement("label", { style: { fontSize: "11px", fontWeight: "700", color: "var(--wa-dark-teal)" } }, "Variable #", idx + 1), /* @__PURE__ */ React.createElement(
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
  ))))), currentTemplateObj?.header_type === "DOCUMENT" && /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "PDF Invoice Attachment URL"), /* @__PURE__ */ React.createElement(
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
function MessageLogsView({ showToast }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);
  const fetchLogs = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchLogs();
  }, [statusFilter, categoryFilter]);
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
        fetchLogs();
      }
    } catch (e) {
      showToast("Error updating status", "error");
    }
  };
  const logColumns = [
    {
      key: "to_phone",
      label: "Recipient / Source",
      render: (m) => /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, m.to_phone)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text-muted)" } }, m.source_system))
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
      render: (m) => /* @__PURE__ */ React.createElement("span", { className: `badge status-${m.status}` }, m.status === "read" ? "\u2713\u2713 Read" : m.status === "delivered" ? "\u2713\u2713 Delivered" : m.status === "sent" ? "\u2713 Sent" : m.status)
    },
    {
      key: "client_rate_bhd",
      label: "Client Rate (BHD)",
      render: (m) => /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, parseFloat(m.client_rate_bhd).toFixed(4), " BHD"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "10px", color: "var(--text-muted)" } }, "Meta: ", parseFloat(m.meta_cost_bhd).toFixed(4), " | Platform: +", parseFloat(m.platform_charge_bhd).toFixed(4)))
    },
    {
      key: "created_at",
      label: "Timestamp",
      render: (m) => /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11.5px", color: "var(--text-secondary)" } }, m.created_at)
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (m) => /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "5px" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-secondary btn-sm", onClick: () => setSelectedLog(m), title: "Inspect Payload" }, "Inspect"), m.status !== "read" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary btn-sm", onClick: () => simulateStatus(m.message_id, "read"), title: "Mark Read" }, "\u2713 Read"))
    }
  ];
  const customFilterBar = /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "8px", alignItems: "center" } }, /* @__PURE__ */ React.createElement("select", { className: "form-select", style: { width: "140px", padding: "5px 8px", fontSize: "12px" }, value: statusFilter, onChange: (e) => setStatusFilter(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "all" }, "All Statuses"), /* @__PURE__ */ React.createElement("option", { value: "read" }, "Read (\u2713\u2713 Blue)"), /* @__PURE__ */ React.createElement("option", { value: "delivered" }, "Delivered (\u2713\u2713 Grey)"), /* @__PURE__ */ React.createElement("option", { value: "sent" }, "Sent (\u2713 Single)"), /* @__PURE__ */ React.createElement("option", { value: "queued" }, "Queued"), /* @__PURE__ */ React.createElement("option", { value: "failed" }, "Failed")), /* @__PURE__ */ React.createElement("select", { className: "form-select", style: { width: "150px", padding: "5px 8px", fontSize: "12px" }, value: categoryFilter, onChange: (e) => setCategoryFilter(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "all" }, "All Categories"), /* @__PURE__ */ React.createElement("option", { value: "UTILITY" }, "Utility (Invoices)"), /* @__PURE__ */ React.createElement("option", { value: "AUTHENTICATION" }, "Authentication (OTP)"), /* @__PURE__ */ React.createElement("option", { value: "MARKETING" }, "Marketing (Promo)"), /* @__PURE__ */ React.createElement("option", { value: "SERVICE" }, "Service (Support)")));
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "page-header-row" }, /* @__PURE__ */ React.createElement("div", { className: "page-title-group" }, /* @__PURE__ */ React.createElement("h1", null, /* @__PURE__ */ React.createElement("span", null, "\u{1F4DC}"), " Message Telemetry & Logs"), /* @__PURE__ */ React.createElement("p", null, "Audit trail of all inbound and outbound WhatsApp conversations, delivery lifecycle, and billing tariffs.")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-secondary", onClick: fetchLogs }, /* @__PURE__ */ React.createElement("span", null, "\u{1F504}"), " Refresh Logs")), /* @__PURE__ */ React.createElement(
    DataTable,
    {
      columns: logColumns,
      data: messages,
      title: "whatsapp_messages_log",
      searchPlaceholder: "Search phone, wamid, content...",
      defaultPageSize: 10,
      pageSizeOptions: [10, 25, 50, 100],
      actions: customFilterBar,
      emptyMessage: loading ? "Loading telemetry logs..." : "No messages found matching criteria."
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
  } }, /* @__PURE__ */ React.createElement("div", { className: "card", style: { width: "600px", maxHeight: "85vh", overflowY: "auto" } }, /* @__PURE__ */ React.createElement("div", { className: "card-header" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Message Inspection: ", selectedLog.message_id), /* @__PURE__ */ React.createElement("button", { className: "btn btn-secondary btn-sm", onClick: () => setSelectedLog(null) }, "\u2715 Close")), /* @__PURE__ */ React.createElement("div", { className: "code-box" }, /* @__PURE__ */ React.createElement("pre", null, JSON.stringify(selectedLog, null, 2))))));
}
function TemplatesView({ showToast }) {
  const [templates, setTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const loadTemplates = () => {
    fetch("./api/templates.php").then((res) => res.json()).then((res) => {
      if (res.success) setTemplates(res.data);
    });
  };
  useEffect(() => {
    loadTemplates();
  }, []);
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
    }
  ];
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "page-header-row" }, /* @__PURE__ */ React.createElement("div", { className: "page-title-group" }, /* @__PURE__ */ React.createElement("h1", null, /* @__PURE__ */ React.createElement("span", null, "\u{1F4CB}"), " WhatsApp Templates & Tariff Schedule"), /* @__PURE__ */ React.createElement("p", null, "Meta-registered message templates, variable placeholders, and official Bahrain Market rates.")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => setEditingTemplate({
    template_name: "",
    display_title: "",
    category: "UTILITY",
    language: "en",
    header_type: "NONE",
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
      pageSizeOptions: [5, 10, 20]
    }
  ));
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
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "page-header-row" }, /* @__PURE__ */ React.createElement("div", { className: "page-title-group" }, /* @__PURE__ */ React.createElement("h1", null, /* @__PURE__ */ React.createElement("span", null, "\u26A1"), " Odoo ERP Integration & API Hub"), /* @__PURE__ */ React.createElement("p", null, "REST API documentation, live testing console, and copyable Python integration snippets for Odoo developers."))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" } }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-header" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F9EA}"), " Live API Tester")), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "API Key Header (X-API-Key)"), /* @__PURE__ */ React.createElement("input", { type: "text", className: "form-input", value: apiKey, onChange: (e) => setApiKey(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "HTTP Method & Endpoint"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "10px" } }, /* @__PURE__ */ React.createElement("span", { className: "badge cat-utility", style: { padding: "8px 12px", fontSize: "12px" } }, "POST"), /* @__PURE__ */ React.createElement("input", { type: "text", className: "form-input", value: endpoint, readOnly: true }))), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Request Body (JSON)"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      className: "form-textarea",
      style: { minHeight: "180px", fontFamily: "monospace", fontSize: "11.5px" },
      value: requestPayload,
      onChange: (e) => setRequestPayload(e.target.value)
    }
  )), /* @__PURE__ */ React.createElement("button", { className: "btn btn-success", style: { width: "100%" }, onClick: runLiveTest, disabled: loading }, loading ? "Executing..." : "\u25B6 Execute API Call"), responseOutput && /* @__PURE__ */ React.createElement("div", { style: { marginTop: "16px" } }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Response Body (HTTP 200/201)"), /* @__PURE__ */ React.createElement("div", { className: "code-box" }, /* @__PURE__ */ React.createElement("pre", null, responseOutput)))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-header" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F40D}"), " Odoo ERP Python Model Action Code"), /* @__PURE__ */ React.createElement("button", { className: "btn-copy-code", onClick: () => {
    navigator.clipboard.writeText(pythonSnippet);
    showToast("Python snippet copied to clipboard!");
  } }, "Copy Code")), /* @__PURE__ */ React.createElement("div", { className: "code-box", style: { minHeight: "380px" } }, /* @__PURE__ */ React.createElement("div", { className: "code-box-header" }, /* @__PURE__ */ React.createElement("span", null, "odoo_whatsapp_connector.py")), /* @__PURE__ */ React.createElement("pre", null, pythonSnippet)))));
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
      pageSizeOptions: [5, 10, 20]
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
      pageSizeOptions: [5, 10, 20]
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
function SettingsView({ showToast }) {
  const [settings, setSettings] = useState({
    meta_phone_number_id: "",
    meta_waba_account_id: "",
    meta_access_token: "",
    webhook_verify_token: "",
    business_display_name: "UniGlobal Consultancy W.L.L",
    business_phone_number: "+973 1700 8899"
  });
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    fetch("./api/settings.php").then((res) => res.json()).then((res) => {
      if (res.success && res.settings) {
        setSettings((prev) => ({ ...prev, ...res.settings }));
      }
    });
  }, []);
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("./api/settings.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Meta & System settings saved successfully");
      }
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "page-header-row" }, /* @__PURE__ */ React.createElement("div", { className: "page-title-group" }, /* @__PURE__ */ React.createElement("h1", null, /* @__PURE__ */ React.createElement("span", null, "\u2699\uFE0F"), " Meta Cloud API & System Configuration"), /* @__PURE__ */ React.createElement("p", null, "Configure WhatsApp Business API credentials, permanent access tokens, and webhook secrets."))), /* @__PURE__ */ React.createElement("div", { className: "card", style: { maxWidth: "800px" } }, /* @__PURE__ */ React.createElement("form", { onSubmit: handleSave }, /* @__PURE__ */ React.createElement("h3", { style: { fontSize: "14px", fontWeight: "800", color: "var(--wa-dark-teal)", marginBottom: "14px" } }, "Meta WhatsApp Business Cloud API Credentials"), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Meta Phone Number ID"), /* @__PURE__ */ React.createElement(
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
  ), /* @__PURE__ */ React.createElement("span", { className: "form-hint" }, "Paste this token into Meta Developer App Dashboard Webhook settings.")), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-primary", style: { marginTop: "12px" }, disabled: loading }, loading ? "Saving..." : "\u{1F4BE} Save Settings"))));
}
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(/* @__PURE__ */ React.createElement(App, null));
}

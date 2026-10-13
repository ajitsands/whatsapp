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
function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  icon = "\u{1F504}",
  badgeClass = "primary",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isProcessing = false
}) {
  if (!isOpen) return null;
  return /* @__PURE__ */ React.createElement("div", { className: "confirm-modal-overlay", onClick: onClose, style: { zIndex: 12e3 } }, /* @__PURE__ */ React.createElement("div", { className: "confirm-modal-card", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "confirm-modal-body" }, /* @__PURE__ */ React.createElement("div", { className: `confirm-modal-icon-badge ${badgeClass}` }, /* @__PURE__ */ React.createElement("span", null, icon)), /* @__PURE__ */ React.createElement("div", { className: "confirm-modal-title" }, title), subtitle && /* @__PURE__ */ React.createElement("div", { className: "confirm-modal-subtitle", style: { fontSize: "13.5px", color: "#64748B", lineHeight: "1.55", marginTop: "6px" } }, subtitle)), /* @__PURE__ */ React.createElement("div", { className: "confirm-modal-actions" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn-confirm-cancel",
      onClick: onClose,
      disabled: isProcessing
    },
    cancelText
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: badgeClass === "danger" ? "btn-confirm-delete" : "btn-confirm-primary",
      onClick: onConfirm,
      disabled: isProcessing
    },
    isProcessing ? "Processing..." : confirmText
  ))));
}
function VersionArchitectureModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return /* @__PURE__ */ React.createElement("div", { className: "version-modal-overlay", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "version-modal-card", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "version-modal-header" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "12px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "26px" } }, "\u{1F680}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: "17px", fontWeight: "800", margin: 0, color: "#FFFFFF" } }, "WhatsApp Integration Platform \u2014 Version Architecture"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "12px", margin: "2px 0 0 0", opacity: 0.9, color: "#E8F8F5" } }, "Engineered by SaNDS Lab Middle East W.L.L. \u2022 Enterprise Release Registry"))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onClose,
      style: {
        background: "rgba(255,255,255,0.2)",
        border: "none",
        color: "#FFFFFF",
        borderRadius: "8px",
        width: "32px",
        height: "32px",
        cursor: "pointer",
        fontSize: "18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      },
      title: "Close"
    },
    "\u2715"
  )), /* @__PURE__ */ React.createElement("div", { className: "version-modal-body" }, /* @__PURE__ */ React.createElement("div", { className: "version-card-block", style: { borderLeft: "4px solid #10B981", background: "#F0FDF4" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "20px" } }, "\u26A1"), /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "15px", color: "#065F46" } }, "Active Release: Version 2.5.0 (Production Live)")), /* @__PURE__ */ React.createElement("span", { className: "version-chip", style: { background: "#DCFCE7", color: "#166534", border: "1px solid #BBF7D0" } }, "\u{1F7E2} v2.5.0 USER SECURITY & APPLICATION KEY LICENSING LIVE")), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "12.5px", color: "#065F46", margin: 0, lineHeight: "1.5" } }, "Version 2.5.0 delivers Enterprise User Security Management (Admin Edit, Suspend/Reactivate, and Password Resets) along with the official SaNDS Lab Application Key Licensing Engine with offline asymmetric RSA-SHA256 verification, top header expiry countdown, and strict security lock enforcement.")), /* @__PURE__ */ React.createElement("div", { className: "version-card-block", style: { borderLeft: "4px solid #10B981", background: "#F0FDF4" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "20px" } }, "\u{1F512}"), /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "15px", color: "#065F46" } }, "Baseline Milestone: Version 1.0.0 (LOCKED)")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "6px" } }, /* @__PURE__ */ React.createElement("span", { className: "version-chip", style: { background: "#DCFCE7", color: "#166534", border: "1px solid #BBF7D0" } }, "GIT TAG: v1.0.0"), /* @__PURE__ */ React.createElement("span", { className: "version-chip", style: { background: "#DCFCE7", color: "#166534", border: "1px solid #BBF7D0" } }, "GIT TAG: v1.0"))), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "12px", color: "#047857", marginBottom: "10px", lineHeight: "1.4" } }, /* @__PURE__ */ React.createElement("strong", null, "Commit Hash:"), " ", /* @__PURE__ */ React.createElement("code", { style: { background: "#E2E8F0", padding: "1px 5px", borderRadius: "4px", color: "#0F172A" } }, "9dd6ebc"), " | Production verified & deployed on ", /* @__PURE__ */ React.createElement("code", { style: { background: "#E2E8F0", padding: "1px 5px", borderRadius: "4px", color: "#0F172A" } }, "https://whatsapp.sandslab.com"), "."), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px", fontSize: "11.5px", color: "#065F46" } }, /* @__PURE__ */ React.createElement("div", null, "\u2713 Superadmin RBAC Security Restrictions"), /* @__PURE__ */ React.createElement("div", null, "\u2713 Dual Charging Engine (Option A vs B)"), /* @__PURE__ */ React.createElement("div", null, "\u2713 Meta WhatsApp Cloud API v19.0 Dispatch"), /* @__PURE__ */ React.createElement("div", null, "\u2713 Multi-Language Odoo API Hub"), /* @__PURE__ */ React.createElement("div", null, "\u2713 Prepaid Wallet & BHD 3-Dec Audit Ledger"), /* @__PURE__ */ React.createElement("div", null, "\u2713 Enterprise DataTables (DESC Sort)"))), /* @__PURE__ */ React.createElement("div", { className: "version-card-block", style: { background: "#FFFFFF" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "18px" } }, "\u{1F4D0}"), /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "14px", color: "#0F172A" } }, "Minor Version Management Protocol (SemVer 2.0.0)")), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" } }, "Starting from Version 2.0, all ongoing changes are version-controlled using structured semantic numbering:"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "10px" } }, /* @__PURE__ */ React.createElement("strong", { style: { color: "#2563EB", fontSize: "12px" } }, "v2.0.0 (MAJOR)"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "11px", color: "#64748B", margin: "4px 0 0 0" } }, "Major generation architecture shift & foundational framework upgrades.")), /* @__PURE__ */ React.createElement("div", { style: { background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "10px" } }, /* @__PURE__ */ React.createElement("strong", { style: { color: "#059669", fontSize: "12px" } }, "v2.x.0 (MINOR)"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "11px", color: "#64748B", margin: "4px 0 0 0" } }, "Scheduled roadmap feature milestones (v2.1 Live Chat, v2.2 Campaigns, v2.3 Odoo, v2.4 Templates, v2.5 License).")), /* @__PURE__ */ React.createElement("div", { style: { background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "10px" } }, /* @__PURE__ */ React.createElement("strong", { style: { color: "#D97706", fontSize: "12px" } }, "v2.x.y (PATCH)"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "11px", color: "#64748B", margin: "4px 0 0 0" } }, "Targeted bug fixes, security patches, styling polish, and maintenance hotfixes.")))), /* @__PURE__ */ React.createElement("div", { className: "version-card-block", style: { background: "#FFFFFF" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "18px" } }, "\u{1F4CB}"), /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "14px", color: "#0F172A" } }, "Version 2.0 Execution Roadmap (All Milestones Completed & Production Live \u2705)")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "10px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: "12px", padding: "10px 12px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "8px" } }, /* @__PURE__ */ React.createElement("span", { className: "version-chip", style: { background: "#16A34A", color: "#FFFFFF", marginTop: "2px" } }, "v2.1.0"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "12.5px", color: "#15803D" } }, "Inbound Live Chat & Two-Way Agent Inbox (Completed & Released \u2705)"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "11.5px", color: "#166534", margin: "2px 0 0 0" } }, "Two-way conversational workspace, Meta 24-hour customer care session window tracking, canned replies, free-text replies, and simulated inbound testing."))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: "12px", padding: "10px 12px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "8px" } }, /* @__PURE__ */ React.createElement("span", { className: "version-chip", style: { background: "#16A34A", color: "#FFFFFF", marginTop: "2px" } }, "v2.2.0"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "12.5px", color: "#15803D" } }, "Bulk Campaign Broadcasts & Queue Pacing (Completed & Released \u2705)"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "11.5px", color: "#166534", margin: "2px 0 0 0" } }, "CSV contact upload with dynamic variable mapping, anti-spam dispatch queue pacing, live animated monitor, and verified Meta webhook delivery receipts."))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: "12px", padding: "10px 12px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "8px" } }, /* @__PURE__ */ React.createElement("span", { className: "version-chip", style: { background: "#16A34A", color: "#FFFFFF", marginTop: "2px" } }, "v2.3.0"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "12.5px", color: "#15803D" } }, "Odoo ERP Automated Action Webhook & Model Sync (Completed & Released \u2705)"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "11.5px", color: "#166534", margin: "2px 0 0 0" } }, "Inbound webhook triggers for automated invoice generation (account.move), sales order confirmations, dynamic PDF attachment streaming, and bi-directional chatter delivery callbacks."))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: "12px", padding: "10px 12px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "8px" } }, /* @__PURE__ */ React.createElement("span", { className: "version-chip", style: { background: "#16A34A", color: "#FFFFFF", marginTop: "2px" } }, "v2.4.0"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "12.5px", color: "#15803D" } }, "WhatsApp Template Studio & Meta Graph API Live Approval (Completed & Released \u2705)"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "11.5px", color: "#166534", margin: "2px 0 0 0" } }, "Direct Meta Graph API submission for message templates, curated library of pre-built Meta presets, live handset mockup phone preview, and active/inactive template filtering."))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: "12px", padding: "10px 12px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "8px" } }, /* @__PURE__ */ React.createElement("span", { className: "version-chip", style: { background: "#16A34A", color: "#FFFFFF", marginTop: "2px" } }, "v2.5.0"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "12.5px", color: "#15803D" } }, "Enterprise User Security & SaNDS Lab Application Key Licensing (Active & Released \u2705)"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "11.5px", color: "#166534", margin: "2px 0 0 0" } }, "Admin user edit & suspension controls, self and admin password reset flows, SaNDS Lab Application Key licensing engine with offline asymmetric RSA-SHA256 verification, top header expiry duration pill, and strict lock security protection.")))))), /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 24px", background: "#F8FAFC", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-primary",
      onClick: onClose,
      style: { padding: "8px 20px", fontSize: "13px", fontWeight: "700" }
    },
    "Close Version Inspector"
  ))));
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
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [globalSettings2, setGlobalSettings] = useState({
    company_name: "UniGlobal Consultancy W.L.L",
    company_logo: "./assets/logos/SaNDSLab-LogoNewUpdated.png",
    business_display_name: "UniGlobal Consultancy W.L.L",
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
  useEffect(() => {
    if (globalSettings2?.company_name) {
      document.title = `${globalSettings2.company_name} | SaNDS Lab`;
    }
  }, [globalSettings2?.company_name]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace("#", "").trim();
    const saved = localStorage.getItem("wa_tab");
    const validTabs = ["dashboard", "inbox", "campaigns", "composer", "logs", "templates", "api_hub", "api_keys", "users", "wallet", "settings"];
    if (hash && validTabs.includes(hash)) return hash;
    if (saved && validTabs.includes(saved)) return saved;
    return "dashboard";
  });
  const [toast, setToast] = useState(null);
  const [inboxUnreadTotal, setInboxUnreadTotal] = useState(0);
  const [messagesDropdownOpen, setMessagesDropdownOpen] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const messagesDropdownRef = useRef(null);
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [checkingLicense, setCheckingLicense] = useState(true);
  const [showLicenseActivationModal, setShowLicenseActivationModal] = useState(false);
  const [showLicenseDetailsModal, setShowLicenseDetailsModal] = useState(false);
  const loadLicenseStatus = async (autoShowModalIfInvalid = true) => {
    try {
      const res = await fetch("./api/license.php?action=status");
      const data = await res.json();
      if (data.success && data.data) {
        setLicenseInfo(data.data);
        if (!data.data.valid && autoShowModalIfInvalid) {
          setShowLicenseActivationModal(true);
        }
      }
    } catch (err) {
      console.error("License check error:", err);
    } finally {
      setCheckingLicense(false);
    }
  };
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (messagesDropdownRef.current && !messagesDropdownRef.current.contains(e.target)) {
        setMessagesDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);
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
      const validTabs = ["dashboard", "inbox", "campaigns", "composer", "logs", "templates", "api_hub", "api_keys", "users", "wallet", "settings"];
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
    loadLicenseStatus(true);
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
  if (checkingLicense || loading && !currentUser) {
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", gap: "12px" } }, /* @__PURE__ */ React.createElement("div", { className: "brand-badge" }, /* @__PURE__ */ React.createElement("span", { className: "dot" }), " Loading SaNDS Platform..."));
  }
  const isLicenseLocked = !!(licenseInfo && !licenseInfo.valid);
  if (currentUser && isLicenseLocked) {
    return /* @__PURE__ */ React.createElement("div", { style: {
      minHeight: "100vh",
      background: "radial-gradient(circle at 50% 50%, #152033 0%, #0A0E17 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    } }, /* @__PURE__ */ React.createElement(
      LicenseActivationModal,
      {
        licenseInfo,
        isLockedScreen: true,
        currentUser,
        onSuccess: (newInfo) => {
          setLicenseInfo(newInfo);
          setShowLicenseActivationModal(false);
          showToast("\u2713 Application Key activated successfully! Access granted.");
        },
        onClose: () => {
          handleLogout();
        },
        showToast
      }
    ));
  }
  if (!currentUser) {
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      LoginView,
      {
        onLogin: handleLogin,
        onSwitchDemo: switchDemoRole,
        licenseInfo,
        globalSettings: globalSettings2,
        onOpenLicenseActivation: () => setShowLicenseActivationModal(true)
      }
    ), (showLicenseActivationModal || isLicenseLocked) && /* @__PURE__ */ React.createElement(
      LicenseActivationModal,
      {
        licenseInfo,
        isLockedScreen: isLicenseLocked,
        onSuccess: (newInfo) => {
          setLicenseInfo(newInfo);
          setShowLicenseActivationModal(false);
          showToast("\u2713 Application Key activated successfully!");
        },
        onClose: () => setShowLicenseActivationModal(false),
        showToast
      }
    ));
  }
  const curr = globalSettings2?.system_currency || "BHD";
  const dec = parseInt(globalSettings2?.currency_decimals || "3", 10);
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
  } }, /* @__PURE__ */ React.createElement("span", null, toast.type === "error" ? "\u26A0\uFE0F" : "\u2705"), toast.message), /* @__PURE__ */ React.createElement("header", { className: "app-header" }, /* @__PURE__ */ React.createElement("div", { className: "header-top-bar" }, /* @__PURE__ */ React.createElement("div", { className: "header-top-inner" }, /* @__PURE__ */ React.createElement("div", { className: "header-brand" }, /* @__PURE__ */ React.createElement(
    "img",
    {
      src: globalSettings2?.company_logo || "./assets/logos/SaNDSLab-LogoNewUpdated.png",
      alt: globalSettings2?.company_name || "Company Logo",
      className: "brand-logo",
      style: { maxHeight: "38px", maxWidth: "160px", objectFit: "contain" },
      onError: (e) => {
        e.target.onerror = null;
        e.target.src = "./assets/logos/SaNDSLab-LogoNewUpdated.png";
      }
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "brand-badge" }, /* @__PURE__ */ React.createElement("span", { className: "dot" }), " ", globalSettings2?.company_name ? globalSettings2.company_name : "WhatsApp Gateway"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "version-pill-btn",
      onClick: () => setShowVersionModal(true),
      title: "Click to view Version Architecture, Git Tags & Future Roadmap"
    },
    /* @__PURE__ */ React.createElement("span", { className: "version-pill-dot" }),
    /* @__PURE__ */ React.createElement("span", null, "v2.5.0")
  )), /* @__PURE__ */ React.createElement("div", { className: "header-actions" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `license-header-pill ${!licenseInfo || !licenseInfo.valid ? "status-unlicensed" : licenseInfo.days_left <= 7 ? "status-expiring-soon" : licenseInfo.days_left <= 30 ? "status-expiring-month" : "status-active"}`,
      onClick: () => setShowLicenseDetailsModal(true),
      title: licenseInfo?.expires_at ? `Click to view License details (Expires: ${formatExpiryDate(licenseInfo.expires_at, globalSettings2?.system_date_format)})` : "Click to view SaNDS Lab Application Key & Expiry details"
    },
    /* @__PURE__ */ React.createElement("span", null, !licenseInfo || !licenseInfo.valid ? "\u26A0\uFE0F" : licenseInfo.days_left <= 7 ? "\u23F3" : "\u{1F6E1}\uFE0F"),
    /* @__PURE__ */ React.createElement("span", null, "License: ", /* @__PURE__ */ React.createElement("strong", null, licenseInfo?.duration_text || (checkingLicense ? "Checking..." : "Unlicensed")))
  ), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "wallet-header-pill",
      onClick: () => navigateToTab("wallet"),
      title: "Click to manage Wallet & view Billing Statement"
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F4B3}"),
    /* @__PURE__ */ React.createElement("span", null, "Wallet: ", /* @__PURE__ */ React.createElement("strong", null, formatCurrency(walletBalance, curr, dec)))
  ), /* @__PURE__ */ React.createElement("div", { className: "user-profile-pill", title: `Logged in as ${currentUser.email}` }, /* @__PURE__ */ React.createElement("div", { className: "avatar", style: { background: currentUser.avatar_color || "#128C7E" } }, currentUser.name.charAt(0)), /* @__PURE__ */ React.createElement("div", { className: "user-details" }, /* @__PURE__ */ React.createElement("span", { className: "user-name" }, currentUser.name), /* @__PURE__ */ React.createElement("span", { className: "user-role-badge" }, currentUser.role))), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn-header-action",
      onClick: () => setShowChangePasswordModal(true),
      title: "Change Your Account Password"
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F511}"),
    /* @__PURE__ */ React.createElement("span", null, "Change Password")
  ), /* @__PURE__ */ React.createElement("button", { className: "btn-logout", onClick: handleLogout, title: "Sign Out" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F6AA}"), " Logout")))), /* @__PURE__ */ React.createElement("div", { className: "header-nav-bar" }, /* @__PURE__ */ React.createElement("div", { className: "header-nav-inner" }, /* @__PURE__ */ React.createElement("nav", { className: "horizontal-nav" }, /* @__PURE__ */ React.createElement("button", { className: `nav-item ${activeTab === "dashboard" ? "active" : ""}`, onClick: () => navigateToTab("dashboard") }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4CA}"), " Dashboard"), /* @__PURE__ */ React.createElement("div", { className: "nav-dropdown-wrap", ref: messagesDropdownRef }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `nav-dropdown-btn ${["inbox", "campaigns", "composer", "logs"].includes(activeTab) ? "active" : ""}`,
      onClick: () => setMessagesDropdownOpen((prev) => !prev),
      title: "Messages Menu (Inbox, Campaigns, Send Message, Logs)"
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F4AC}"),
    /* @__PURE__ */ React.createElement("span", null, "Messages"),
    inboxUnreadTotal > 0 && /* @__PURE__ */ React.createElement("span", { style: {
      background: ["inbox", "campaigns", "composer", "logs"].includes(activeTab) ? "#FFFFFF" : "#25D366",
      color: ["inbox", "campaigns", "composer", "logs"].includes(activeTab) ? "#075E54" : "#FFFFFF",
      fontSize: "10px",
      fontWeight: "800",
      padding: "1px 6px",
      borderRadius: "10px",
      marginLeft: "2px"
    } }, inboxUnreadTotal),
    /* @__PURE__ */ React.createElement("span", { className: `nav-chevron ${messagesDropdownOpen ? "open" : ""}` }, "\u25BC")
  ), messagesDropdownOpen && /* @__PURE__ */ React.createElement("div", { className: "nav-dropdown-menu" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `nav-dropdown-item ${activeTab === "inbox" ? "active" : ""}`,
      onClick: () => {
        navigateToTab("inbox");
        setMessagesDropdownOpen(false);
      }
    },
    /* @__PURE__ */ React.createElement("div", { className: "nav-dropdown-item-left" }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "15px" } }, "\u{1F4AC}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "6px" } }, /* @__PURE__ */ React.createElement("span", null, "Live Agent Inbox"), inboxUnreadTotal > 0 && /* @__PURE__ */ React.createElement("span", { style: {
      background: "#25D366",
      color: "#FFFFFF",
      fontSize: "10px",
      fontWeight: "800",
      padding: "1px 6px",
      borderRadius: "10px"
    } }, inboxUnreadTotal)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "#64748B", fontWeight: "400", marginTop: "1px" } }, "2-Way Live Chat & Care Session"))),
    activeTab === "inbox" && /* @__PURE__ */ React.createElement("span", { className: "nav-item-indicator" })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `nav-dropdown-item ${activeTab === "campaigns" ? "active" : ""}`,
      onClick: () => {
        navigateToTab("campaigns");
        setMessagesDropdownOpen(false);
      }
    },
    /* @__PURE__ */ React.createElement("div", { className: "nav-dropdown-item-left" }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "15px" } }, "\u{1F4E2}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", null, "Bulk Broadcasts"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "#64748B", fontWeight: "400", marginTop: "1px" } }, "Paced Queue & CSV Campaigns"))),
    activeTab === "campaigns" && /* @__PURE__ */ React.createElement("span", { className: "nav-item-indicator" })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `nav-dropdown-item ${activeTab === "composer" ? "active" : ""}`,
      onClick: () => {
        navigateToTab("composer");
        setMessagesDropdownOpen(false);
      }
    },
    /* @__PURE__ */ React.createElement("div", { className: "nav-dropdown-item-left" }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "15px" } }, "\u{1F4E4}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", null, "Send Message"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "#64748B", fontWeight: "400", marginTop: "1px" } }, "Direct Template Composer"))),
    activeTab === "composer" && /* @__PURE__ */ React.createElement("span", { className: "nav-item-indicator" })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `nav-dropdown-item ${activeTab === "logs" ? "active" : ""}`,
      onClick: () => {
        navigateToTab("logs");
        setMessagesDropdownOpen(false);
      }
    },
    /* @__PURE__ */ React.createElement("div", { className: "nav-dropdown-item-left" }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "15px" } }, "\u{1F4DC}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", null, "Message Logs"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "#64748B", fontWeight: "400", marginTop: "1px" } }, "Delivery & Status Telemetry"))),
    activeTab === "logs" && /* @__PURE__ */ React.createElement("span", { className: "nav-item-indicator" })
  ))), /* @__PURE__ */ React.createElement("button", { className: `nav-item ${activeTab === "templates" ? "active" : ""}`, onClick: () => navigateToTab("templates") }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4CB}"), " Templates & Tariffs"), /* @__PURE__ */ React.createElement("button", { className: `nav-item ${activeTab === "wallet" ? "active" : ""}`, onClick: () => navigateToTab("wallet") }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4B3}"), " Wallet & Billing"), /* @__PURE__ */ React.createElement("button", { className: `nav-item ${activeTab === "api_hub" ? "active" : ""}`, onClick: () => navigateToTab("api_hub") }, /* @__PURE__ */ React.createElement("span", null, "\u26A1"), " Odoo API Hub"), ["superadmin", "admin"].includes(currentUser.role) && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: `nav-item ${activeTab === "api_keys" ? "active" : ""}`, onClick: () => navigateToTab("api_keys") }, /* @__PURE__ */ React.createElement("span", null, "\u{1F511}"), " API Keys"), /* @__PURE__ */ React.createElement("button", { className: `nav-item ${activeTab === "users" ? "active" : ""}`, onClick: () => navigateToTab("users") }, /* @__PURE__ */ React.createElement("span", null, "\u{1F465}"), " Users"), /* @__PURE__ */ React.createElement("button", { className: `nav-item ${activeTab === "settings" ? "active" : ""}`, onClick: () => navigateToTab("settings") }, /* @__PURE__ */ React.createElement("span", null, "\u2699\uFE0F"), " Engine Settings")))))), /* @__PURE__ */ React.createElement("main", { className: "app-body" }, activeTab === "dashboard" && /* @__PURE__ */ React.createElement(DashboardView, { onNavigate: navigateToTab, globalSettings: globalSettings2, currentUser }), activeTab === "inbox" && /* @__PURE__ */ React.createElement(LiveAgentInboxView, { currentUser, showToast, globalSettings: globalSettings2, onUnreadCountChange: setInboxUnreadTotal, onNavigate: navigateToTab }), activeTab === "campaigns" && /* @__PURE__ */ React.createElement(CampaignsView, { currentUser, showToast, globalSettings: globalSettings2, onNavigate: navigateToTab, loadWalletBalance }), activeTab === "composer" && /* @__PURE__ */ React.createElement(ComposerView, { showToast, onSent: () => {
    navigateToTab("inbox");
    loadWalletBalance();
  }, globalSettings: globalSettings2 }), activeTab === "logs" && /* @__PURE__ */ React.createElement(MessageLogsView, { showToast, globalSettings: globalSettings2, currentUser, onOpenInbox: (phone) => {
    navigateToTab("inbox");
  } }), activeTab === "templates" && /* @__PURE__ */ React.createElement(TemplatesView, { showToast, globalSettings: globalSettings2, currentUser }), activeTab === "wallet" && /* @__PURE__ */ React.createElement(WalletView, { currentUser, showToast, globalSettings: globalSettings2, onBalanceChange: setWalletBalance }), activeTab === "api_hub" && /* @__PURE__ */ React.createElement(OdooApiHubView, { showToast, globalSettings: globalSettings2 }), activeTab === "api_keys" && /* @__PURE__ */ React.createElement(ApiKeysView, { showToast }), activeTab === "users" && /* @__PURE__ */ React.createElement(UsersView, { currentUser, showToast }), activeTab === "settings" && /* @__PURE__ */ React.createElement(SettingsView, { currentUser, showToast, onSettingsChange: (s) => {
    setGlobalSettings((prev) => ({ ...prev, ...s }));
    loadWalletBalance();
  } })), /* @__PURE__ */ React.createElement("footer", { className: "app-footer" }, /* @__PURE__ */ React.createElement("div", { className: "footer-inner" }, /* @__PURE__ */ React.createElement("div", { className: "footer-left" }, "All Rights Reserved | Engineered By SaNDS Lab Middle East W.L.L."), /* @__PURE__ */ React.createElement("div", { className: "footer-right" }, /* @__PURE__ */ React.createElement(
    "span",
    {
      className: "footer-badge version-footer-clickable",
      onClick: () => setShowVersionModal(true),
      title: "Click to inspect Version 2.5.0 Architecture & Locked v1.0.0 Baseline"
    },
    "Platform v2.5.0 (v1.0.0 Locked \u{1F512})"
  ), /* @__PURE__ */ React.createElement("span", { className: "footer-badge" }, "WhatsApp Cloud API v19.0"), /* @__PURE__ */ React.createElement("span", { className: "footer-badge" }, "Odoo ERP Connector Active"), /* @__PURE__ */ React.createElement("span", null, "Bahrain (BHD) Tariff Active")))), /* @__PURE__ */ React.createElement(VersionArchitectureModal, { isOpen: showVersionModal, onClose: () => setShowVersionModal(false) }), showChangePasswordModal && /* @__PURE__ */ React.createElement(
    ChangePasswordModal,
    {
      currentUser,
      onClose: () => setShowChangePasswordModal(false),
      showToast
    }
  ), showLicenseActivationModal && /* @__PURE__ */ React.createElement(
    LicenseActivationModal,
    {
      licenseInfo,
      onSuccess: (newInfo) => {
        setLicenseInfo(newInfo);
        setShowLicenseActivationModal(false);
        showToast("\u2713 Application Key activated successfully!");
      },
      onClose: () => setShowLicenseActivationModal(false),
      showToast
    }
  ), showLicenseDetailsModal && /* @__PURE__ */ React.createElement(
    LicenseDetailsModal,
    {
      licenseInfo,
      globalSettings: globalSettings2,
      onClose: () => setShowLicenseDetailsModal(false),
      onChangeKey: () => {
        setShowLicenseDetailsModal(false);
        setShowLicenseActivationModal(true);
      },
      onRefresh: () => loadLicenseStatus(false),
      showToast
    }
  ));
}
function LicenseActivationModal({ licenseInfo, isLockedScreen, currentUser, onSuccess, onClose, showToast }) {
  const [key, setKey] = useState("");
  const [domain, setDomain] = useState(licenseInfo?.detected_domain || "localhost");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleActivate = async (e) => {
    e.preventDefault();
    if (!key.trim()) {
      setError("Please enter a license key");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("./api/license.php?action=activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ license_key: key.trim(), domain_name: domain.trim() })
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(data.data);
      } else {
        setError(data.error || "Activation failed");
      }
    } catch (err) {
      setError("Network error connecting to activation service");
    } finally {
      setLoading(false);
    }
  };
  const handleStartTrial = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("./api/license.php?action=activate_eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain_name: domain.trim() })
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(data.data);
      } else {
        setError(data.error || "Failed to start evaluation");
      }
    } catch (err) {
      setError("Network error starting evaluation");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "modal-overlay", onClick: isLockedScreen ? void 0 : onClose }, /* @__PURE__ */ React.createElement("div", { className: "modal-content", style: { maxWidth: "520px", border: isLockedScreen ? "2px solid #EF4444" : void 0 }, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-header", style: { background: isLockedScreen ? "linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%)" : void 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "10px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "24px" } }, isLockedScreen ? "\u{1F512}" : "\u{1F6E1}\uFE0F"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { style: { margin: 0, fontSize: "16px" } }, isLockedScreen ? "Application Key Required (Locked)" : "Application Key Activation"), /* @__PURE__ */ React.createElement("p", { style: { margin: "2px 0 0 0", fontSize: "12px", color: "rgba(255,255,255,0.85)" } }, "SaNDS Lab Licensing Server (key.sandslab.com)"))), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "close-btn",
      onClick: onClose,
      title: isLockedScreen ? "Close and Return to Login" : "Close"
    },
    "\u2715"
  )), /* @__PURE__ */ React.createElement("form", { onSubmit: handleActivate }, /* @__PURE__ */ React.createElement("div", { className: "modal-body", style: { padding: "22px" } }, isLockedScreen ? /* @__PURE__ */ React.createElement("div", { style: {
    background: "#FEF2F2",
    border: "1px solid #FCA5A5",
    color: "#991B1B",
    padding: "12px 14px",
    borderRadius: "8px",
    fontSize: "12.5px",
    marginBottom: "18px",
    lineHeight: "1.5"
  } }, /* @__PURE__ */ React.createElement("strong", { style: { display: "block", fontSize: "13px", marginBottom: "2px" } }, "\u26D4 Platform Access Locked"), "The application requires a valid, active License Key to be unlocked. Closing this window will return you to the login screen.") : /* @__PURE__ */ React.createElement("div", { style: {
    background: "#F0FDF4",
    border: "1px solid #BBF7D0",
    color: "#166534",
    padding: "12px 14px",
    borderRadius: "8px",
    fontSize: "12.5px",
    marginBottom: "18px",
    lineHeight: "1.5"
  } }, "\u{1F4A1} ", /* @__PURE__ */ React.createElement("strong", null, "License Required:"), " This application authenticates via an asymmetric offline RSA verification model. Please enter your SaNDS Lab License Key."), error && /* @__PURE__ */ React.createElement("div", { style: {
    background: "#FEE2E2",
    border: "1px solid #FCA5A5",
    color: "#B91C1C",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "12.5px",
    marginBottom: "16px",
    fontWeight: "600"
  } }, "\u26A0\uFE0F ", error), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Application License Key ", /* @__PURE__ */ React.createElement("span", { style: { color: "#EF4444" } }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      placeholder: "INV-XXXXXX-XXXXXX-XXXXXX-XXXXXX",
      value: key,
      onChange: (e) => setKey(e.target.value),
      required: true,
      style: {
        fontFamily: "monospace",
        letterSpacing: "1px",
        fontWeight: "700",
        textTransform: "uppercase"
      }
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "form-hint" }, "Obtain your key from ", /* @__PURE__ */ React.createElement("a", { href: "https://key.sandslab.com/public/docs", target: "_blank", rel: "noreferrer", style: { color: "var(--wa-teal)", textDecoration: "underline" } }, "key.sandslab.com/public/docs"))), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Licensed Domain Name"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      value: domain,
      onChange: (e) => setDomain(e.target.value),
      required: true,
      style: { fontFamily: "monospace" }
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "form-hint" }, "Automatically detected server host domain.")), /* @__PURE__ */ React.createElement("div", { style: {
    marginTop: "16px",
    padding: "12px 14px",
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px"
  } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "12.5px", display: "block", color: "var(--text-primary)" } }, "Need a Quick Test Key?"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11.5px", color: "var(--text-muted)" } }, "Activate a 30-day developer trial key for localhost.")), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-secondary btn-sm",
      onClick: handleStartTrial,
      disabled: loading,
      style: { whiteSpace: "nowrap" }
    },
    "\u26A1 30-Day Trial"
  ))), /* @__PURE__ */ React.createElement("div", { className: "modal-footer", style: { padding: "14px 22px", display: "flex", gap: "10px", justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-secondary",
      onClick: onClose,
      disabled: loading
    },
    isLockedScreen ? "\u{1F6AA} Exit to Login" : "Close"
  ), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-primary", disabled: loading }, loading ? "Activating..." : "\u{1F680} Activate Application")))));
}
function formatExpiryDate(dateStr, format = "YYYY-MM-DD HH:mm:ss") {
  if (!dateStr) return "";
  if (dateStr === "Lifetime" || dateStr === "Lifetime License") return "Lifetime License";
  try {
    const str = String(dateStr).trim();
    let YYYY = "", MM = "", DD = "", hours = null, minutes = null, seconds = null;
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
    const dmySlashMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
    const dmyDashMatch = str.match(/^(\d{2})-(\d{2})-(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
    if (isoMatch) {
      YYYY = isoMatch[1];
      MM = isoMatch[2];
      DD = isoMatch[3];
      if (isoMatch[4] !== void 0) {
        hours = parseInt(isoMatch[4], 10);
        minutes = isoMatch[5] || "00";
        seconds = isoMatch[6] || "00";
      }
    } else if (dmyDashMatch) {
      DD = dmyDashMatch[1];
      MM = dmyDashMatch[2];
      YYYY = dmyDashMatch[3];
      if (dmyDashMatch[4] !== void 0) {
        hours = parseInt(dmyDashMatch[4], 10);
        minutes = dmyDashMatch[5] || "00";
        seconds = dmyDashMatch[6] || "00";
      }
    } else if (dmySlashMatch) {
      DD = dmySlashMatch[1];
      MM = dmySlashMatch[2];
      YYYY = dmySlashMatch[3];
      if (dmySlashMatch[4] !== void 0) {
        hours = parseInt(dmySlashMatch[4], 10);
        minutes = dmySlashMatch[5] || "00";
        seconds = dmySlashMatch[6] || "00";
      }
    } else {
      const d = new Date(str);
      if (isNaN(d.getTime())) return dateStr;
      YYYY = String(d.getFullYear());
      MM = String(d.getMonth() + 1).padStart(2, "0");
      DD = String(d.getDate()).padStart(2, "0");
      hours = d.getHours();
      minutes = String(d.getMinutes()).padStart(2, "0");
      seconds = String(d.getSeconds()).padStart(2, "0");
    }
    let datePart = `${YYYY}-${MM}-${DD}`;
    if (format && format.includes("DD/MM/YYYY")) {
      datePart = `${DD}/${MM}/${YYYY}`;
    } else if (format && format.includes("DD-MM-YYYY")) {
      datePart = `${DD}-${MM}-${YYYY}`;
    } else if (format && format.includes("MM/DD/YYYY")) {
      datePart = `${MM}/${DD}/${YYYY}`;
    } else if (format && format.includes("YYYY-MM-DD")) {
      datePart = `${YYYY}-${MM}-${DD}`;
    }
    if (hours === null || hours === 0 && minutes === "00" && (seconds === "00" || !seconds)) {
      return datePart;
    }
    const ampm = hours >= 12 ? "PM" : "AM";
    const hh12 = String(hours % 12 || 12).padStart(2, "0");
    const HH24 = String(hours).padStart(2, "0");
    if (format === "DD/MM/YYYY hh:mm:ss A") return `${datePart} ${hh12}:${minutes}:${seconds} ${ampm}`;
    if (format === "DD-MM-YYYY HH:mm") return `${datePart} ${HH24}:${minutes}`;
    if (format === "MM/DD/YYYY hh:mm A") return `${datePart} ${hh12}:${minutes} ${ampm}`;
    if (format === "YYYY-MM-DD hh:mm A") return `${datePart} ${hh12}:${minutes} ${ampm}`;
    return `${datePart} ${HH24}:${minutes}:${seconds}`;
  } catch (e) {
    return dateStr;
  }
}
function LicenseDetailsModal({ licenseInfo, globalSettings: globalSettings2, onClose, onChangeKey, onRefresh, showToast }) {
  const [refreshing, setRefreshing] = useState(false);
  const [showFullKey, setShowFullKey] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("./api/license.php?action=refresh", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showToast("\u2713 License status re-verified successfully!");
        if (onRefresh) onRefresh();
      } else {
        showToast(data.error || "Refresh failed", "error");
      }
    } catch (e) {
      showToast("Network error while refreshing license", "error");
    } finally {
      setRefreshing(false);
    }
  };
  const copyKey = () => {
    const k = licenseInfo?.full_license_key || licenseInfo?.license_key;
    if (k && navigator.clipboard) {
      navigator.clipboard.writeText(k);
      showToast("\u{1F4CB} License Key copied to clipboard");
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "modal-overlay", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "modal-content", style: { maxWidth: "520px" }, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-header" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "10px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "24px" } }, "\u{1F6E1}\uFE0F"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { style: { margin: 0, fontSize: "16px" } }, "SaNDS Lab License & Expiry Status"), /* @__PURE__ */ React.createElement("p", { style: { margin: "2px 0 0 0", fontSize: "12px", color: "rgba(255,255,255,0.85)" } }, "Asymmetric Offline Verification (key.sandslab.com)"))), /* @__PURE__ */ React.createElement("button", { type: "button", className: "close-btn", onClick: onClose }, "\u2715")), /* @__PURE__ */ React.createElement("div", { className: "modal-body", style: { padding: "22px" } }, /* @__PURE__ */ React.createElement("div", { style: {
    background: licenseInfo?.valid ? "#DCFCE7" : "#FEE2E2",
    border: `1px solid ${licenseInfo?.valid ? "#86EFAC" : "#FCA5A5"}`,
    color: licenseInfo?.valid ? "#15803D" : "#B91C1C",
    padding: "14px",
    borderRadius: "10px",
    marginBottom: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "10px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "22px" } }, licenseInfo?.valid ? "\u2713" : "\u26A0\uFE0F"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "14px", display: "block" } }, licenseInfo?.valid ? "License Active & Valid" : "License Inactive or Expired"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "12px" } }, licenseInfo?.message || (licenseInfo?.valid ? "Cryptographically Verified (RSA SHA-256)" : "Activation required")))), /* @__PURE__ */ React.createElement("span", { style: {
    background: licenseInfo?.valid ? "#15803D" : "#B91C1C",
    color: "#FFF",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11.5px",
    fontWeight: "700"
  } }, licenseInfo?.duration_text || "Unlicensed")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "12px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#F8FAFC", borderRadius: "8px" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text-muted)", fontSize: "12.5px" } }, "Expiry Duration Left:"), /* @__PURE__ */ React.createElement("strong", { style: { color: licenseInfo?.days_left <= 7 ? "#DC2626" : "var(--wa-dark-teal)", fontSize: "13px" } }, "\u23F3 ", licenseInfo?.duration_text || "N/A")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#F8FAFC", borderRadius: "8px" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text-muted)", fontSize: "12.5px" } }, "Expiration Date:"), /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "13px" } }, formatExpiryDate(licenseInfo?.expires_at, globalSettings2?.system_date_format) || "Lifetime")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#F8FAFC", borderRadius: "8px" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text-muted)", fontSize: "12.5px" } }, "Licensed Domain:"), /* @__PURE__ */ React.createElement("strong", { style: { fontFamily: "monospace", fontSize: "13px" } }, licenseInfo?.domain || "localhost")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#F8FAFC", borderRadius: "8px" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text-muted)", fontSize: "12.5px" } }, "Product Plan / Tier:"), /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "13px" } }, licenseInfo?.plan || "Enterprise License")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#F8FAFC", borderRadius: "8px" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text-muted)", fontSize: "12.5px" } }, "Remote Server Sync:"), /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "12.5px", color: "#047857" } }, "\u2713 Every 24h Auto-Check ", licenseInfo?.last_online_check ? `(Last: ${formatExpiryDate(licenseInfo.last_online_check, globalSettings2?.system_date_format)})` : "")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#F8FAFC", borderRadius: "8px" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text-muted)", fontSize: "12.5px" } }, "License Key:"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "monospace", fontSize: "12px", fontWeight: "700" } }, showFullKey ? licenseInfo?.full_license_key || licenseInfo?.license_key : licenseInfo?.stored_license_key || "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-secondary btn-sm",
      onClick: () => setShowFullKey((prev) => !prev),
      title: "Toggle show/hide"
    },
    showFullKey ? "\u{1F648}" : "\u{1F441}\uFE0F"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-secondary btn-sm",
      onClick: copyKey,
      title: "Copy key"
    },
    "\u{1F4CB}"
  ))))), /* @__PURE__ */ React.createElement("div", { className: "modal-footer", style: { padding: "14px 22px", display: "flex", gap: "10px", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-secondary",
      onClick: onChangeKey
    },
    "\u{1F511} Change / Renew Key"
  ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "8px" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-secondary",
      onClick: handleRefresh,
      disabled: refreshing
    },
    refreshing ? "Refreshing..." : "\u{1F504} Refresh Status"
  ), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-primary", onClick: onClose }, "Close")))));
}
function ChangePasswordModal({ currentUser, onClose, showToast }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("./api/auth.php?action=change_password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      });
      const data = await res.json();
      if (data.success) {
        showToast("\u2713 Password updated successfully!");
        onClose();
      } else {
        setError(data.error || "Failed to update password");
      }
    } catch (err) {
      setError("Network error while updating password");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "modal-overlay", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "modal-content", style: { maxWidth: "440px" }, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-header" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "10px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "20px" } }, "\u{1F511}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { style: { margin: 0, fontSize: "15px" } }, "Change Account Password"), /* @__PURE__ */ React.createElement("p", { style: { margin: "2px 0 0 0", fontSize: "11.5px", color: "rgba(255,255,255,0.85)" } }, currentUser?.name, " (", currentUser?.email, ")"))), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, "\u2715")), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSubmit }, /* @__PURE__ */ React.createElement("div", { className: "modal-body", style: { padding: "20px" } }, error && /* @__PURE__ */ React.createElement("div", { style: { background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#B91C1C", padding: "10px 14px", borderRadius: "8px", fontSize: "12px", marginBottom: "14px", fontWeight: "600" } }, "\u26A0\uFE0F ", error), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Current Password"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "password",
      className: "form-input",
      placeholder: "Enter current password",
      value: currentPassword,
      onChange: (e) => setCurrentPassword(e.target.value)
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "form-hint" }, "Leave blank if this is a newly assigned account password.")), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "New Password ", /* @__PURE__ */ React.createElement("span", { style: { color: "#EF4444" } }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "password",
      className: "form-input",
      placeholder: "At least 6 characters",
      value: newPassword,
      onChange: (e) => setNewPassword(e.target.value),
      required: true,
      minLength: 6
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Confirm New Password ", /* @__PURE__ */ React.createElement("span", { style: { color: "#EF4444" } }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "password",
      className: "form-input",
      placeholder: "Re-type new password",
      value: confirmPassword,
      onChange: (e) => setConfirmPassword(e.target.value),
      required: true,
      minLength: 6
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "modal-footer", style: { padding: "12px 20px", display: "flex", gap: "8px", justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: onClose, disabled: loading }, "Cancel"), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-primary", disabled: loading }, loading ? "Updating..." : "\u{1F4BE} Update Password")))));
}
function LoginView({ onLogin, onSwitchDemo, licenseInfo, globalSettings: globalSettings2, onOpenLicenseActivation }) {
  const [email, setEmail] = useState("admin@uniglobal.bh");
  const [password, setPassword] = useState("Password@123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submitLogin = async (e) => {
    e.preventDefault();
    if (licenseInfo && !licenseInfo.valid) {
      setError("Application is locked: You must enter and activate a valid SaNDS Lab License Key before using the application.");
      if (onOpenLicenseActivation) onOpenLicenseActivation();
      return;
    }
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
    if (licenseInfo && !licenseInfo.valid) {
      setError("Application is locked: You must enter and activate a valid SaNDS Lab License Key before using the application.");
      if (onOpenLicenseActivation) onOpenLicenseActivation();
      return;
    }
    setEmail(presetEmail);
    setPassword("Password@123");
    onSwitchDemo(role);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "login-container" }, /* @__PURE__ */ React.createElement("div", { className: "login-card" }, /* @__PURE__ */ React.createElement("div", { className: "login-header" }, /* @__PURE__ */ React.createElement(
    "img",
    {
      src: globalSettings2?.company_logo || "./assets/logos/SaNDSLab-LogoNewUpdated.png",
      alt: globalSettings2?.company_name || "Company Logo",
      className: "login-logo",
      style: { maxHeight: "60px", maxWidth: "220px", objectFit: "contain", margin: "0 auto 12px auto" },
      onError: (e) => {
        e.target.onerror = null;
        e.target.src = "./assets/logos/SaNDSLab-LogoNewUpdated.png";
      }
    }
  ), /* @__PURE__ */ React.createElement("h2", null, globalSettings2?.company_name || "WhatsApp Integration Platform"), /* @__PURE__ */ React.createElement("p", null, "Sign in to manage messaging, templates, and Odoo ERP webhooks")), licenseInfo && !licenseInfo.valid && /* @__PURE__ */ React.createElement("div", { style: {
    background: "#FEF2F2",
    border: "1px solid #FCA5A5",
    color: "#991B1B",
    padding: "12px 14px",
    borderRadius: "10px",
    fontSize: "12.5px",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px"
  } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", { style: { display: "block", fontSize: "13px" } }, "\u26A0\uFE0F Application Key Required"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11.5px", color: "#B91C1C" } }, licenseInfo.message || "Please activate your SaNDS Lab License.")), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-sm",
      style: { background: "#DC2626", color: "#FFF", whiteSpace: "nowrap", border: "none", fontWeight: "bold" },
      onClick: onOpenLicenseActivation
    },
    "\u{1F511} Enter Key"
  )), licenseInfo && licenseInfo.valid && /* @__PURE__ */ React.createElement("div", { style: {
    background: "#F0FDF4",
    border: "1px solid #BBF7D0",
    color: "#15803D",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontWeight: "600"
  } }, /* @__PURE__ */ React.createElement("span", null, "\u{1F6E1}\uFE0F License: ", /* @__PURE__ */ React.createElement("strong", null, licenseInfo.duration_text), " (", formatExpiryDate(licenseInfo.expires_at, globalSettings2?.system_date_format), ")"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-secondary btn-sm",
      style: { fontSize: "11px", padding: "2px 8px" },
      onClick: onOpenLicenseActivation
    },
    "Details"
  )), /* @__PURE__ */ React.createElement("div", { className: "preset-roles-box" }, /* @__PURE__ */ React.createElement("div", { className: "preset-roles-title" }, "\u26A1 Quick Sign-In by Role:"), /* @__PURE__ */ React.createElement("div", { className: "preset-buttons-row" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn-preset", onClick: () => pickPreset("admin@uniglobal.bh", "admin") }, "\u{1F6E1}\uFE0F Admin"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn-preset", onClick: () => pickPreset("user@uniglobal.bh", "user") }, "\u{1F464} User"))), error && /* @__PURE__ */ React.createElement("div", { style: { background: "#FEE2E2", color: "#B91C1C", padding: "10px 14px", borderRadius: "8px", fontSize: "12.5px", marginBottom: "16px", fontWeight: "600" } }, "\u26A0\uFE0F ", error), /* @__PURE__ */ React.createElement("form", { onSubmit: submitLogin }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Email Address"), /* @__PURE__ */ React.createElement(
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
function DashboardView({ onNavigate, globalSettings: globalSettings2, currentUser }) {
  const isSuperAdmin = currentUser?.role === "superadmin";
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
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "page-header-row" }, /* @__PURE__ */ React.createElement("div", { className: "page-title-group" }, /* @__PURE__ */ React.createElement("h1", null, /* @__PURE__ */ React.createElement("span", null, "\u{1F4CA}"), " Operational Dashboard & Metrics"), /* @__PURE__ */ React.createElement("p", null, "Real-time telemetry of WhatsApp Business API throughput, delivery reliability, and billing tariffs.")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-success", onClick: () => onNavigate("composer") }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4AC}"), " Send New Message")), /* @__PURE__ */ React.createElement("div", { className: "kpi-grid" }, /* @__PURE__ */ React.createElement("div", { className: "kpi-card accent-green" }, /* @__PURE__ */ React.createElement("span", { className: "kpi-label" }, "Total Volume"), /* @__PURE__ */ React.createElement("span", { className: "kpi-value" }, kpis.total_messages.toLocaleString()), /* @__PURE__ */ React.createElement("span", { className: "kpi-sub positive" }, /* @__PURE__ */ React.createElement("span", null, "\u2191"), " ", kpis.outbound_count, " Outbound | ", kpis.inbound_count, " Inbound")), /* @__PURE__ */ React.createElement("div", { className: "kpi-card accent-blue" }, /* @__PURE__ */ React.createElement("span", { className: "kpi-label" }, "Delivery Reliability"), /* @__PURE__ */ React.createElement("span", { className: "kpi-value" }, kpis.delivery_rate, "%"), /* @__PURE__ */ React.createElement("span", { className: "kpi-sub positive" }, /* @__PURE__ */ React.createElement("span", null, "\u2713\u2713"), " ", kpis.read_rate, "% Read Rate")), /* @__PURE__ */ React.createElement("div", { className: "kpi-card accent-purple" }, /* @__PURE__ */ React.createElement("span", { className: "kpi-label" }, "Total Billed (BHD)"), /* @__PURE__ */ React.createElement("span", { className: "kpi-value" }, "BHD ", kpis.total_client_bhd), /* @__PURE__ */ React.createElement("span", { className: "kpi-sub" }, "Bahrain Market Official Schedule")), isSuperAdmin ? /* @__PURE__ */ React.createElement("div", { className: "kpi-card accent-amber" }, /* @__PURE__ */ React.createElement("span", { className: "kpi-label" }, "Cost Breakdown"), /* @__PURE__ */ React.createElement("span", { className: "kpi-value" }, "BHD ", kpis.total_platform_bhd), /* @__PURE__ */ React.createElement("span", { className: "kpi-sub" }, "Platform Margin | Meta Cost: BHD ", kpis.total_meta_cost_bhd)) : /* @__PURE__ */ React.createElement("div", { className: "kpi-card accent-amber" }, /* @__PURE__ */ React.createElement("span", { className: "kpi-label" }, "Gateway Route"), /* @__PURE__ */ React.createElement("span", { className: "kpi-value" }, "Cloud API"), /* @__PURE__ */ React.createElement("span", { className: "kpi-sub positive" }, "Official Bahrain WABA Route"))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" } }, /* @__PURE__ */ React.createElement("div", { className: "card", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "card-header" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F3F7}\uFE0F"), " Message Volume by Meta Category")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "14px" } }, categories.map((cat, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", flexDirection: "column", gap: "5px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "12.5px", fontWeight: "700" } }, /* @__PURE__ */ React.createElement("span", { className: `badge cat-${cat.category.toLowerCase().substring(0, 4)}` }, cat.category), /* @__PURE__ */ React.createElement("span", null, cat.message_count, " msgs (", parseFloat(cat.category_billed_bhd).toFixed(4), " BHD)")), /* @__PURE__ */ React.createElement("div", { style: { height: "7px", background: "#F1F5F9", borderRadius: "4px", overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: {
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
    fetch("./api/templates.php?active_only=1").then((res) => res.json()).then((res) => {
      if (res.success) {
        const activeOnly = res.data.filter((t) => (t.is_active === 1 || t.is_active === true || t.is_active === "1") && ["APPROVED", "ACTIVE"].includes((t.meta_status || "").toUpperCase()));
        setTemplates(activeOnly);
        if (activeOnly.length > 0) {
          pickTemplate(activeOnly[0]);
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
    templates.filter((t) => (t.is_active === 1 || t.is_active === true || t.is_active === "1") && ["APPROVED", "ACTIVE"].includes((t.meta_status || "").toUpperCase())).map((t) => /* @__PURE__ */ React.createElement("option", { key: t.id, value: t.template_name }, t.display_title, " [", t.category, "]")),
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
  )), /* @__PURE__ */ React.createElement("div", { className: "tariff-estimate-banner" }, /* @__PURE__ */ React.createElement("div", { className: "tariff-info" }, /* @__PURE__ */ React.createElement("span", { className: "title" }, "Category: ", category), /* @__PURE__ */ React.createElement("span", { className: "breakdown" }, "Meta Cost: ", tariffEstimate.meta.toFixed(4), " BHD | Platform Charges: +", tariffEstimate.platform.toFixed(4), " BHD")), /* @__PURE__ */ React.createElement("div", { className: "tariff-rate-badge" }, "BHD ", tariffEstimate.client.toFixed(4), " / msg")), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-success", style: { width: "100%", marginTop: "20px", padding: "12px" }, disabled: sending }, sending ? "Dispatching via Meta API..." : "\u{1F680} Send WhatsApp Notification Now"))), /* @__PURE__ */ React.createElement("div", { className: "phone-mockup-wrapper" }, /* @__PURE__ */ React.createElement("div", { className: "phone-device" }, /* @__PURE__ */ React.createElement("div", { className: "phone-notch" }, /* @__PURE__ */ React.createElement("div", { className: "phone-speaker" })), /* @__PURE__ */ React.createElement("div", { className: "phone-screen" }, /* @__PURE__ */ React.createElement("div", { className: "wa-chat-header" }, /* @__PURE__ */ React.createElement("div", { className: "wa-avatar", style: { overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" } }, globalSettings?.company_logo ? /* @__PURE__ */ React.createElement("img", { src: globalSettings.company_logo, alt: "Logo", style: { width: "100%", height: "100%", objectFit: "cover" }, onError: (e) => {
    e.target.style.display = "none";
  } }) : (globalSettings?.company_name || "UG").substring(0, 2).toUpperCase()), /* @__PURE__ */ React.createElement("div", { className: "wa-user-info" }, /* @__PURE__ */ React.createElement("div", { className: "wa-contact-name" }, globalSettings?.company_name || globalSettings?.business_display_name || "Business Account", " ", /* @__PURE__ */ React.createElement("span", { className: "wa-verified-icon" }, "\u2713")), /* @__PURE__ */ React.createElement("div", { className: "wa-status-text" }, "Official Business Account"))), /* @__PURE__ */ React.createElement("div", { className: "wa-chat-body" }, /* @__PURE__ */ React.createElement("div", { className: "wa-date-pill" }, "TODAY"), /* @__PURE__ */ React.createElement("div", { className: "wa-bubble" }, currentTemplateObj?.header_type === "DOCUMENT" && /* @__PURE__ */ React.createElement("div", { className: "wa-bubble-doc" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4C4}"), /* @__PURE__ */ React.createElement("div", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, mediaName || "INV_9941.pdf", /* @__PURE__ */ React.createElement("div", { style: { fontSize: "9px", color: "#4B5563" } }, "PDF Document \u2022 345 KB"))), /* @__PURE__ */ React.createElement("div", { style: { whiteSpace: "pre-line" } }, renderedText), currentTemplateObj?.footer_text && /* @__PURE__ */ React.createElement("div", { className: "wa-bubble-footer" }, currentTemplateObj.footer_text), /* @__PURE__ */ React.createElement("div", { className: "wa-bubble-meta" }, /* @__PURE__ */ React.createElement("span", null, "10:42 AM"), /* @__PURE__ */ React.createElement("span", { className: "wa-ticks" }, "\u2713\u2713")))), /* @__PURE__ */ React.createElement("div", { className: "wa-chat-input-bar" }, /* @__PURE__ */ React.createElement("div", { className: "wa-dummy-input" }, "Message"), /* @__PURE__ */ React.createElement("span", { style: { color: "#075E54", fontSize: "14px" } }, "\u{1F3A4}")))))));
}
function ConversationChatModal({ phone, onClose, showToast, globalSettings: globalSettings2 }) {
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
    return /* @__PURE__ */ React.createElement("div", { key: msg.id || idx, className: `chat-bubble-row ${isOutbound ? "outbound" : "inbound"}` }, /* @__PURE__ */ React.createElement("div", { className: "chat-bubble" }, msg.template_name && /* @__PURE__ */ React.createElement("span", { className: "chat-bubble-template-tag" }, "\u{1F4CB} ", msg.template_name, " [", msg.category, "]"), msg.header_media_name && /* @__PURE__ */ React.createElement("div", { className: "chat-bubble-media" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4CE}"), /* @__PURE__ */ React.createElement("span", null, msg.header_media_name)), /* @__PURE__ */ React.createElement("div", { style: { whiteSpace: "pre-wrap" } }, msg.message_body), /* @__PURE__ */ React.createElement("div", { className: "chat-bubble-footer" }, /* @__PURE__ */ React.createElement("span", null, formatDateTime(msg.created_at, globalSettings2?.system_date_format)), isOutbound && /* @__PURE__ */ React.createElement("span", null, msg.status === "read" ? /* @__PURE__ */ React.createElement("span", { className: "chat-tick-read", title: "Read" }, "\u2713\u2713") : msg.status === "delivered" ? /* @__PURE__ */ React.createElement("span", { className: "chat-tick-delivered", title: "Delivered" }, "\u2713\u2713") : msg.status === "sent" ? /* @__PURE__ */ React.createElement("span", { title: "Sent" }, "\u2713") : msg.status === "failed" ? /* @__PURE__ */ React.createElement("span", { style: { color: "#EF4444" }, title: msg.error_message || "Failed" }, "\u26A0\uFE0F") : /* @__PURE__ */ React.createElement("span", { style: { color: "#94A3B8" }, title: "Queued" }, "\u23F1\uFE0F")))));
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
function SimulateInboundModal({ isOpen, onClose, onSimulated, showToast, globalSettings: globalSettings2 }) {
  const [phone, setPhone] = useState("+97335078079");
  const companyName = globalSettings2?.company_name || "Customer Support";
  const [message, setMessage] = useState(`Hello ${companyName}! I received my invoice and need to confirm my payment details.`);
  const [submitting, setSubmitting] = useState(false);
  if (!isOpen) return null;
  const handleSimulate = async (e) => {
    e.preventDefault();
    if (!phone || !message.trim()) {
      showToast("Phone and message text are required", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("./api/inbox.php?action=simulate_inbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message: message.trim() })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Simulated customer inbound message from ${phone}! 24h window active.`);
        if (onSimulated) onSimulated(phone);
        onClose();
      } else {
        showToast(data.error || "Failed to simulate message", "error");
      }
    } catch (err) {
      showToast("Network error simulating message", "error");
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "version-modal-overlay", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "version-modal-card", style: { maxWidth: "520px" }, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "version-modal-header" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "10px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "22px" } }, "\u{1F9EA}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { style: { fontSize: "15px", fontWeight: "800", margin: 0, color: "#FFFFFF" } }, "Simulate Inbound WhatsApp Message"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "11.5px", margin: "2px 0 0 0", opacity: 0.9, color: "#E8F8F5" } }, "Test customer inbound reply & trigger 24h session window"))), /* @__PURE__ */ React.createElement("button", { onClick: onClose, style: { background: "rgba(255,255,255,0.2)", border: "none", color: "#FFFFFF", borderRadius: "6px", width: "28px", height: "28px", cursor: "pointer" } }, "\u2715")), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSimulate, style: { padding: "20px" } }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Customer Mobile Phone"), /* @__PURE__ */ React.createElement("input", { type: "text", className: "form-input", value: phone, onChange: (e) => setPhone(e.target.value), placeholder: "+97335078079", required: true }), /* @__PURE__ */ React.createElement("span", { className: "form-hint" }, "E.164 formatted international WhatsApp number.")), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Customer Message Text"), /* @__PURE__ */ React.createElement("textarea", { className: "form-input", rows: "3", value: message, onChange: (e) => setMessage(e.target.value), placeholder: "Type customer reply here...", required: true })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "10px", marginTop: "20px" } }, /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-primary", style: { flex: 1 }, disabled: submitting }, submitting ? "Simulating..." : "\u{1F4E5} Ingest Inbound Message"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: onClose }, "Cancel")))));
}
function LiveAgentInboxView({ currentUser, showToast, globalSettings: globalSettings2, onUnreadCountChange, onNavigate }) {
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [activeThreadData, setActiveThreadData] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [cannedReplies, setCannedReplies] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [useTemplateMode, setUseTemplateMode] = useState(false);
  const [selectedTemplateName, setSelectedTemplateName] = useState("");
  const [templateParams, setTemplateParams] = useState({});
  const messagesEndRef = useRef(null);
  const fetchThreads = async (silent = false) => {
    if (!silent) setLoadingThreads(true);
    try {
      const res = await fetch(`./api/inbox.php?action=threads&search=${encodeURIComponent(search)}&filter=${filter}`);
      const data = await res.json();
      if (data.success && data.threads) {
        setThreads(data.threads);
        const totalUnread = data.threads.reduce((acc, t) => acc + (t.unread_inbound || 0), 0);
        if (onUnreadCountChange) onUnreadCountChange(totalUnread);
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
  useEffect(() => {
    fetchThreads(false);
    fetch("./api/inbox.php?action=canned_replies").then((res) => res.json()).then((data) => {
      if (data.success && data.canned_replies) setCannedReplies(data.canned_replies);
    });
    fetch("./api/templates.php?active_only=1").then((res) => res.json()).then((data) => {
      if (data.success && data.data) {
        const activeApproved = data.data.filter((t) => (t.is_active === 1 || t.is_active === true || t.is_active === "1") && ["APPROVED", "ACTIVE"].includes((t.meta_status || "").toUpperCase()));
        setTemplates(activeApproved);
      }
    });
  }, []);
  useEffect(() => {
    fetchThreads(false);
  }, [search, filter]);
  useEffect(() => {
    if (selectedPhone) {
      fetchThreadMessages(selectedPhone, false);
      setUseTemplateMode(false);
      setReplyText("");
    }
  }, [selectedPhone]);
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
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThreadData?.messages]);
  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    if (!selectedPhone) return;
    if (useTemplateMode) {
      if (!selectedTemplateName) {
        showToast("Please select an approved template", "error");
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
        message: useTemplateMode ? "" : replyText.trim(),
        template_name: useTemplateMode ? selectedTemplateName : "",
        params: useTemplateMode ? templateParams : []
      };
      const res = await fetch("./api/inbox.php?action=send_reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setReplyText("");
        setUseTemplateMode(false);
        showToast(`Reply sent to ${selectedPhone}`);
        fetchThreadMessages(selectedPhone, true);
        fetchThreads(true);
      } else {
        showToast(data.error || "Failed to dispatch reply", "error");
      }
    } catch (err) {
      showToast("Network error sending reply", "error");
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
  const handleMarkRead = async () => {
    if (!selectedPhone) return;
    try {
      await fetch("./api/inbox.php?action=mark_read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: selectedPhone })
      });
      showToast("Marked thread as read");
      fetchThreads(true);
      fetchThreadMessages(selectedPhone, true);
    } catch (e) {
    }
  };
  const selectedThread = threads.find((t) => t.contact_phone === selectedPhone);
  const is24hActive = activeThreadData?.is_24h_active ?? selectedThread?.is_24h_active ?? false;
  const hoursLeft = activeThreadData?.hours_remaining ?? selectedThread?.hours_remaining ?? 0;
  const contactName = activeThreadData?.contact_name ?? selectedThread?.contact_name ?? selectedPhone ?? "Customer";
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "page-header-row", style: { marginBottom: "16px" } }, /* @__PURE__ */ React.createElement("div", { className: "page-title-group" }, /* @__PURE__ */ React.createElement("h1", null, /* @__PURE__ */ React.createElement("span", null, "\u{1F4AC}"), " Inbound Live Chat & Two-Way Agent Inbox"), /* @__PURE__ */ React.createElement("p", null, "Real-time customer care console with official Meta 24-hour conversational session window tracking and instant replies.")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "10px", alignItems: "center" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: `btn ${autoSync ? "btn-success" : "btn-secondary"}`,
      style: { fontSize: "12px", padding: "6px 12px", display: "flex", alignItems: "center", gap: "6px" },
      onClick: () => setAutoSync(!autoSync),
      title: autoSync ? "Live Sync Active (2.5s)" : "Live Sync Paused"
    },
    /* @__PURE__ */ React.createElement("span", { style: { display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: autoSync ? "#22C55E" : "#9CA3AF", boxShadow: autoSync ? "0 0 8px #22C55E" : "none" } }),
    autoSync ? "\u{1F7E2} Live Auto-Sync Active" : "\u23F8\uFE0F Paused"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-primary",
      style: { fontSize: "12.5px", padding: "6px 14px", display: "flex", alignItems: "center", gap: "6px" },
      onClick: () => setShowSimulateModal(true)
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F9EA}"),
    " Simulate Inbound"
  ), /* @__PURE__ */ React.createElement("button", { className: "btn btn-secondary", onClick: () => {
    fetchThreads(false);
    if (selectedPhone) fetchThreadMessages(selectedPhone, false);
  } }, /* @__PURE__ */ React.createElement("span", null, "\u{1F504}"), " Refresh"))), /* @__PURE__ */ React.createElement("div", { className: "inbox-wrapper" }, /* @__PURE__ */ React.createElement("div", { className: "inbox-sidebar" }, /* @__PURE__ */ React.createElement("div", { className: "inbox-sidebar-header" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "inbox-search-input",
      placeholder: "Search contacts, phone, text...",
      value: search,
      onChange: (e) => setSearch(e.target.value)
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "inbox-filters-bar" }, /* @__PURE__ */ React.createElement("button", { className: `inbox-filter-btn ${filter === "all" ? "active" : ""}`, onClick: () => setFilter("all") }, "All (", threads.length, ")"), /* @__PURE__ */ React.createElement("button", { className: `inbox-filter-btn ${filter === "unread" ? "active" : ""}`, onClick: () => setFilter("unread") }, "Unread"), /* @__PURE__ */ React.createElement("button", { className: `inbox-filter-btn ${filter === "active_24h" ? "active" : ""}`, onClick: () => setFilter("active_24h") }, "24h Active \u{1F7E2}"))), /* @__PURE__ */ React.createElement("div", { className: "inbox-threads-list" }, loadingThreads && threads.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "30px", color: "#64748B", fontSize: "12.5px" } }, "Loading conversations...") : threads.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "30px", color: "#64748B", fontSize: "12.5px" } }, "No conversations match this filter.") : threads.map((t) => {
    const isSelected = t.contact_phone === selectedPhone;
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: t.contact_phone,
        className: `inbox-thread-item ${isSelected ? "active" : ""}`,
        onClick: () => setSelectedPhone(t.contact_phone)
      },
      /* @__PURE__ */ React.createElement("div", { className: `inbox-thread-avatar ${t.is_24h_active ? "online" : ""}` }, t.avatar_letter),
      /* @__PURE__ */ React.createElement("div", { className: "inbox-thread-info" }, /* @__PURE__ */ React.createElement("div", { className: "inbox-thread-top" }, /* @__PURE__ */ React.createElement("span", { className: "inbox-thread-name" }, t.contact_name), /* @__PURE__ */ React.createElement("span", { className: "inbox-thread-time" }, formatDateTime(t.latest_message?.created_at, "HH:mm"))), /* @__PURE__ */ React.createElement("div", { className: "inbox-thread-bottom" }, /* @__PURE__ */ React.createElement("span", { className: "inbox-thread-snippet" }, t.latest_message?.direction === "inbound" ? "\u{1F4E5} " : "\u{1F4E4} ", t.latest_message?.message_body || "Attachment"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "4px" } }, t.is_24h_active ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: "10px", background: "#DCFCE7", color: "#166534", padding: "1px 5px", borderRadius: "4px", fontWeight: "700" }, title: `24h Window: ${t.hours_remaining}h left` }, t.hours_remaining, "h") : /* @__PURE__ */ React.createElement("span", { style: { fontSize: "10px", background: "#F1F5F9", color: "#64748B", padding: "1px 5px", borderRadius: "4px" }, title: "Session Expired" }, "\u23F1\uFE0F"), t.unread_inbound > 0 && /* @__PURE__ */ React.createElement("span", { className: "inbox-unread-badge" }, t.unread_inbound))))
    );
  }))), /* @__PURE__ */ React.createElement("div", { className: "inbox-main-pane" }, !selectedPhone ? /* @__PURE__ */ React.createElement("div", { className: "inbox-pane-empty" }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "48px", marginBottom: "12px" } }, "\u{1F4AC}"), /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "16px", color: "#0F172A", marginBottom: "4px" } }, "No Conversation Selected"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "12.5px", maxWidth: "340px" } }, 'Select a customer conversation from the left to read live messages, or click "Simulate Inbound" to test two-way communication.')) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", height: "100%" } }, /* @__PURE__ */ React.createElement("div", { className: "inbox-chat-header" }, /* @__PURE__ */ React.createElement("div", { className: "inbox-chat-user" }, /* @__PURE__ */ React.createElement("div", { className: "inbox-thread-avatar", style: { width: "40px", height: "40px", fontSize: "13px" } }, selectedThread?.avatar_letter || "WA"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px" } }, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "14.5px", color: "#0F172A" } }, contactName), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "12px", color: "#64748B" } }, "(", selectedPhone, ")")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" } }, is24hActive ? /* @__PURE__ */ React.createElement("span", { className: "inbox-session-pill active" }, /* @__PURE__ */ React.createElement("span", { style: { width: "6px", height: "6px", borderRadius: "50%", background: "#16A34A" } }), "\u{1F7E2} 24h Customer Care Window Active (", hoursLeft, "h left) \u2022 Free-Text Allowed (Meta Fee Waived)") : /* @__PURE__ */ React.createElement("span", { className: "inbox-session-pill expired" }, "\u26A0\uFE0F 24h Session Closed \u2022 Pre-Approved Template Required by Meta")))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-secondary btn-sm", onClick: handleMarkRead, title: "Mark All Read" }, "\u2713 Read"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-secondary btn-sm", onClick: () => setShowSimulateModal(true), title: "Simulate reply from this customer" }, "\u{1F9EA} Simulate Reply"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-secondary btn-sm", onClick: () => onNavigate && onNavigate("logs"), title: "View In Message Telemetry" }, "\u{1F4DC} Telemetry"))), /* @__PURE__ */ React.createElement("div", { className: "inbox-chat-canvas" }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", margin: "6px 0" } }, /* @__PURE__ */ React.createElement("span", { style: { background: "#FFFFFF", padding: "4px 12px", borderRadius: "12px", fontSize: "11px", color: "#64748B", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" } }, "\u{1F512} Official WhatsApp Cloud API End-to-End Encrypted Session")), loadingMessages && (!activeThreadData || activeThreadData.messages?.length === 0) ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "40px", color: "#64748B" } }, "Loading messages...") : activeThreadData?.messages?.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "40px", color: "#64748B" } }, "No messages exchanged yet. Send a greeting to start!") : activeThreadData?.messages?.map((msg, idx) => {
    const isOutbound = msg.direction === "outbound";
    return /* @__PURE__ */ React.createElement("div", { key: msg.id || idx, className: `inbox-bubble-row ${isOutbound ? "outbound" : "inbound"}` }, /* @__PURE__ */ React.createElement("div", { className: `inbox-bubble ${isOutbound ? "outbound" : "inbound"}` }, msg.template_name && /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", fontWeight: "700", color: "#0369A1", marginBottom: "3px" } }, "\u{1F4CB} ", msg.template_name, " [", msg.category, "]"), msg.header_media_name && /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11.5px", fontWeight: "600", color: "#059669", marginBottom: "4px" } }, "\u{1F4CE} [", msg.header_media_name, "]"), /* @__PURE__ */ React.createElement("div", { style: { whiteSpace: "pre-wrap" } }, msg.message_body), /* @__PURE__ */ React.createElement("div", { className: "inbox-bubble-footer" }, /* @__PURE__ */ React.createElement("span", null, formatDateTime(msg.created_at, globalSettings2?.system_date_format || "HH:mm")), isOutbound && /* @__PURE__ */ React.createElement("span", null, msg.status === "read" ? /* @__PURE__ */ React.createElement("span", { style: { color: "#0284C7", fontWeight: "800" } }, "\u2713\u2713") : msg.status === "delivered" ? /* @__PURE__ */ React.createElement("span", { style: { color: "#64748B", fontWeight: "800" } }, "\u2713\u2713") : msg.status === "sent" ? /* @__PURE__ */ React.createElement("span", null, "\u2713") : msg.status === "failed" ? /* @__PURE__ */ React.createElement("span", { style: { color: "#EF4444" }, title: msg.error_message || "Failed" }, "\u26A0\uFE0F") : /* @__PURE__ */ React.createElement("span", null, "\u23F1\uFE0F")))));
  }), /* @__PURE__ */ React.createElement("div", { ref: messagesEndRef })), /* @__PURE__ */ React.createElement("div", { className: "inbox-canned-bar" }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11px", fontWeight: "700", color: "#64748B", alignSelf: "center", marginRight: "4px" } }, "\u26A1 Quick:"), cannedReplies.map((cr) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: cr.id,
      type: "button",
      className: "inbox-canned-chip",
      onClick: () => {
        setReplyText(cr.text);
        setUseTemplateMode(false);
      },
      title: cr.text
    },
    cr.title
  ))), /* @__PURE__ */ React.createElement("div", { className: "inbox-composer-area" }, !is24hActive && !useTemplateMode ? /* @__PURE__ */ React.createElement("div", { style: { flex: 1, background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: "8px", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "#92400E" } }, "\u26A0\uFE0F ", /* @__PURE__ */ React.createElement("strong", null, "24h Customer Service Window Closed."), " Meta requires an approved template to re-engage this contact."), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-primary btn-sm",
      onClick: () => setUseTemplateMode(true)
    },
    "\u{1F4CB} Select Approved Template"
  )) : useTemplateMode ? /* @__PURE__ */ React.createElement("div", { style: { flex: 1, background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "8px", padding: "12px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" } }, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "12.5px", color: "#0F172A" } }, "\u{1F4CB} Dispatch Approved WhatsApp Template"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: () => setUseTemplateMode(false) }, "\u2715 Switch to Free Text")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "10px", alignItems: "center" } }, /* @__PURE__ */ React.createElement(
    "select",
    {
      className: "form-input",
      style: { flex: 1, padding: "7px 10px", fontSize: "12.5px" },
      value: selectedTemplateName,
      onChange: (e) => setSelectedTemplateName(e.target.value)
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "-- Choose Template --"),
    templates.filter((t) => (t.is_active === 1 || t.is_active === true || t.is_active === "1") && ["APPROVED", "ACTIVE"].includes((t.meta_status || "").toUpperCase())).map((t) => /* @__PURE__ */ React.createElement("option", { key: t.template_name, value: t.template_name }, t.display_title || t.template_name, " (", t.category, ")"))
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-primary",
      style: { padding: "8px 18px", fontSize: "12.5px", fontWeight: "700" },
      disabled: sending || !selectedTemplateName,
      onClick: handleSendReply
    },
    sending ? "Sending..." : "\u{1F680} Send Template"
  ))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "textarea",
    {
      className: "inbox-textarea",
      placeholder: "Type a direct WhatsApp message... (Press Enter to send, Shift+Enter for new line)",
      value: replyText,
      onChange: (e) => setReplyText(e.target.value),
      onKeyDown: handleKeyDown,
      rows: "1"
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "inbox-btn-send",
      disabled: sending || !replyText.trim(),
      onClick: handleSendReply,
      title: "Send WhatsApp Message"
    },
    sending ? "\u23F3" : "\u27A4"
  )))))), /* @__PURE__ */ React.createElement(
    SimulateInboundModal,
    {
      isOpen: showSimulateModal,
      onClose: () => setShowSimulateModal(false),
      onSimulated: (phone) => {
        setSelectedPhone(phone);
        fetchThreads(true);
        fetchThreadMessages(phone, true);
      },
      showToast,
      globalSettings: globalSettings2
    }
  ));
}
function CampaignsView({ currentUser, showToast, globalSettings: globalSettings2, onNavigate, loadWalletBalance }) {
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
      const res = await fetch("./api/campaigns.php?action=list");
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
      const res = await fetch("./api/templates.php?active_only=1");
      const data = await res.json();
      if (data.success && data.data) {
        setTemplates(data.data.filter((t) => (t.is_active === 1 || t.is_active === true || t.is_active === "1") && ["APPROVED", "ACTIVE"].includes((t.meta_status || "").toUpperCase())));
      }
    } catch (e) {
    }
  };
  useEffect(() => {
    fetchCampaigns(false);
    fetchTemplates();
  }, []);
  const runningCampaign = useMemo(() => {
    return campaigns.find((c) => c.status === "running") || null;
  }, [campaigns]);
  useEffect(() => {
    if (!runningCampaign) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("./api/campaigns.php?action=process_batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campaign_id: runningCampaign.id, batch_size: 5 })
        });
        const data = await res.json();
        if (data.success) {
          fetchCampaigns(true);
          if (loadWalletBalance) loadWalletBalance();
          if (data.status === "completed") {
            showToast(`Campaign "${runningCampaign.name}" broadcast completed!`, "success");
          }
        }
      } catch (err) {
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [runningCampaign]);
  const handleStartCampaign = async (id) => {
    setProcessingId(id);
    try {
      const res = await fetch("./api/campaigns.php?action=process_batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: id, batch_size: 5 })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Campaign queue started! Processing recipients...", "success");
        fetchCampaigns(true);
      } else {
        showToast(data.error || "Failed to start campaign", "error");
      }
    } catch (e) {
      showToast("Network error", "error");
    } finally {
      setProcessingId(null);
    }
  };
  const handlePauseCampaign = async (id) => {
    try {
      const res = await fetch("./api/campaigns.php?action=pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: id })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Campaign paused");
        fetchCampaigns(true);
      }
    } catch (e) {
    }
  };
  const handleCancelCampaign = (id) => {
    setConfirmDialog({
      title: "Cancel Broadcast Campaign?",
      subtitle: "Are you sure you want to cancel this broadcast? Any unsent recipients remaining in the queue will be halted.",
      icon: "\u{1F6D1}",
      badgeClass: "danger",
      confirmText: "Yes, Cancel Broadcast",
      cancelText: "Keep Running",
      onConfirm: async () => {
        try {
          const res = await fetch("./api/campaigns.php?action=cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ campaign_id: id })
          });
          const data = await res.json();
          if (data.success) {
            showToast("Campaign cancelled");
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
    const targetCamp = campaigns.find((c) => c.id === id);
    const campName = targetCamp ? `"${targetCamp.name}"` : "this campaign";
    const recCount = targetCamp?.total_recipients || "all";
    setConfirmDialog({
      title: "Re-run Broadcast Campaign?",
      subtitle: `Reset the broadcast queue for ${campName} and re-dispatch official template messages to ${recCount} recipients via Meta Cloud API?`,
      icon: "\u{1F504}",
      badgeClass: "primary",
      confirmText: "Yes, Re-broadcast Now",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          const res = await fetch("./api/campaigns.php?action=rerun", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ campaign_id: id })
          });
          const data = await res.json();
          if (data.success) {
            showToast("Campaign queue reset. Starting Meta broadcast...", "success");
            await fetchCampaigns(true);
            handleStartCampaign(id);
          } else {
            showToast(data.error || "Failed to re-run campaign", "error");
          }
        } catch (e) {
          showToast("Error re-running campaign", "error");
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  };
  const columns = [
    {
      key: "name",
      label: "Campaign Details",
      sortable: true,
      render: (c) => /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: "700", fontSize: "13.5px", color: "var(--text-color)" } }, c.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" } }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4CB} ", c.template_title || c.template_name), " \u2022 ", /* @__PURE__ */ React.createElement("span", { className: `badge category-${c.category?.toLowerCase()}` }, c.category)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "10.5px", color: "var(--text-muted)", marginTop: "2px" } }, "Created: ", formatDateTime(c.created_at, globalSettings2?.system_date_format)))
    },
    {
      key: "pace_per_minute",
      label: "Queue Pacing",
      sortable: true,
      render: (c) => /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: "700", color: "#0369A1" } }, "\u23F1\uFE0F ", c.pace_per_minute, " msgs/min"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "10.5px", color: "var(--text-muted)" } }, "Anti-spam rate"))
    },
    {
      key: "progress_percent",
      label: "Broadcast Progress",
      sortable: true,
      render: (c) => /* @__PURE__ */ React.createElement("div", { style: { minWidth: "140px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "11.5px", fontWeight: "700", marginBottom: "3px" } }, /* @__PURE__ */ React.createElement("span", null, c.sent_count + c.failed_count, " / ", c.total_recipients), /* @__PURE__ */ React.createElement("span", null, c.progress_percent, "%")), /* @__PURE__ */ React.createElement("div", { style: { width: "100%", height: "8px", background: "#E2E8F0", borderRadius: "4px", overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: {
        width: `${c.progress_percent}%`,
        height: "100%",
        background: c.status === "completed" ? "#10B981" : c.status === "running" ? "linear-gradient(90deg, #10B981, #0284C7)" : "#94A3B8",
        borderRadius: "4px",
        transition: "width 0.3s ease"
      } })), c.failed_count > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: "10px", color: "#EF4444", marginTop: "2px" } }, "\u26A0\uFE0F ", c.failed_count, " failed"))
    },
    {
      key: "delivery_rate",
      label: "Delivery & Reads",
      sortable: true,
      render: (c) => /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px" } }, /* @__PURE__ */ React.createElement("strong", null, "\u2713\u2713 ", c.delivery_rate, "%"), " Delivered (", c.delivered_count, ")"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11.5px", color: "#0284C7", marginTop: "2px" } }, /* @__PURE__ */ React.createElement("strong", null, "\u2713\u2713 ", c.read_rate, "%"), " Read (", c.read_count, ")"))
    },
    {
      key: "actual_cost",
      label: "Total Spend",
      sortable: true,
      render: (c) => /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", { style: { color: "var(--text-color)" } }, formatCurrency(c.actual_cost, globalSettings2?.system_currency, globalSettings2?.currency_decimals)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "10.5px", color: "var(--text-muted)" } }, "Est: ", formatCurrency(c.estimated_cost, globalSettings2?.system_currency, globalSettings2?.currency_decimals)))
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (c) => {
        const statusMap = {
          completed: { label: "\u2713 Completed", cls: "status-read", bg: "#DCFCE7", color: "#166534" },
          running: { label: "\u25CF Running", cls: "status-sent", bg: "#DBEAFE", color: "#1E40AF" },
          paused: { label: "\u23F8 Paused", cls: "status-queued", bg: "#FEF3C7", color: "#92400E" },
          draft: { label: "\u{1F4DD} Draft", cls: "status-queued", bg: "#F1F5F9", color: "#475569" },
          cancelled: { label: "\u2715 Cancelled", cls: "status-failed", bg: "#FEE2E2", color: "#991B1B" }
        };
        const s = statusMap[c.status] || statusMap.draft;
        return /* @__PURE__ */ React.createElement("span", { style: {
          background: s.bg,
          color: s.color,
          padding: "3px 8px",
          borderRadius: "6px",
          fontSize: "11px",
          fontWeight: "700",
          textTransform: "uppercase"
        } }, s.label);
      }
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (c) => /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "6px" } }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "btn btn-secondary btn-sm",
          onClick: () => setInspectCampaignId(c.id),
          title: "Inspect Recipients Log"
        },
        "\u{1F441}\uFE0F Inspect"
      ), c.status === "draft" && /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "btn btn-primary btn-sm",
          disabled: processingId === c.id,
          onClick: () => handleStartCampaign(c.id),
          title: "Start Broadcast"
        },
        "\u{1F680} Launch"
      ), c.status === "running" && /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "btn btn-warning btn-sm",
          onClick: () => handlePauseCampaign(c.id),
          title: "Pause Queue"
        },
        "\u23F8 Pause"
      ), c.status === "paused" && /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "btn btn-primary btn-sm",
          onClick: () => handleStartCampaign(c.id),
          title: "Resume Queue"
        },
        "\u25B6 Resume"
      ), c.status === "completed" && /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "btn btn-secondary btn-sm",
          disabled: processingId === c.id,
          onClick: () => handleRerunCampaign(c.id),
          title: "Re-run broadcast to all recipients via Meta Cloud API"
        },
        "\u{1F504} Re-run"
      ))
    }
  ];
  return /* @__PURE__ */ React.createElement("div", { className: "campaigns-view-container" }, /* @__PURE__ */ React.createElement("div", { className: "view-header", style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { style: { margin: 0, display: "flex", alignItems: "center", gap: "8px" } }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4E2}"), " Bulk Broadcast Campaigns"), /* @__PURE__ */ React.createElement("p", { style: { margin: "4px 0 0 0", color: "var(--text-muted)", fontSize: "13px" } }, "Schedule mass WhatsApp campaigns with CSV contact mapping and anti-spam queue pacing.")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "10px" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-secondary",
      onClick: () => fetchCampaigns(false),
      title: "Refresh List"
    },
    "\u{1F504} Refresh"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-primary",
      onClick: () => setShowWizard(true),
      style: { display: "flex", alignItems: "center", gap: "6px" }
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F680}"),
    " Create Broadcast Campaign"
  ))), /* @__PURE__ */ React.createElement("div", { className: "campaigns-stats-grid" }, /* @__PURE__ */ React.createElement("div", { className: "campaign-stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "campaign-stat-icon", style: { background: "#EFF6FF", color: "#2563EB" } }, "\u{1F4E2}"), /* @__PURE__ */ React.createElement("div", { className: "campaign-stat-info" }, /* @__PURE__ */ React.createElement("span", { className: "campaign-stat-label" }, "Total Campaigns"), /* @__PURE__ */ React.createElement("span", { className: "campaign-stat-val" }, summary?.total_campaigns || 0), /* @__PURE__ */ React.createElement("span", { className: "campaign-stat-sub" }, "Active broadcast programs"))), /* @__PURE__ */ React.createElement("div", { className: "campaign-stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "campaign-stat-icon", style: { background: "#F0FDF4", color: "#16A34A" } }, "\u{1F465}"), /* @__PURE__ */ React.createElement("div", { className: "campaign-stat-info" }, /* @__PURE__ */ React.createElement("span", { className: "campaign-stat-label" }, "Total Audience"), /* @__PURE__ */ React.createElement("span", { className: "campaign-stat-val" }, summary?.total_recipients || 0), /* @__PURE__ */ React.createElement("span", { className: "campaign-stat-sub" }, summary?.total_sent || 0, " dispatched"))), /* @__PURE__ */ React.createElement("div", { className: "campaign-stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "campaign-stat-icon", style: { background: "#ECFDF5", color: "#059669" } }, "\u2713\u2713"), /* @__PURE__ */ React.createElement("div", { className: "campaign-stat-info" }, /* @__PURE__ */ React.createElement("span", { className: "campaign-stat-label" }, "Delivery Success"), /* @__PURE__ */ React.createElement("span", { className: "campaign-stat-val" }, summary?.overall_delivery_rate || 0, "%"), /* @__PURE__ */ React.createElement("span", { className: "campaign-stat-sub" }, summary?.total_delivered || 0, " verified delivered"))), /* @__PURE__ */ React.createElement("div", { className: "campaign-stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "campaign-stat-icon", style: { background: "#F5F3FF", color: "#7C3AED" } }, "\u{1F441}\uFE0F"), /* @__PURE__ */ React.createElement("div", { className: "campaign-stat-info" }, /* @__PURE__ */ React.createElement("span", { className: "campaign-stat-label" }, "Average Read Rate"), /* @__PURE__ */ React.createElement("span", { className: "campaign-stat-val" }, summary?.overall_read_rate || 0, "%"), /* @__PURE__ */ React.createElement("span", { className: "campaign-stat-sub" }, summary?.total_read || 0, " customer reads")))), runningCampaign && /* @__PURE__ */ React.createElement("div", { className: "campaign-live-monitor" }, /* @__PURE__ */ React.createElement("div", { className: "monitor-header" }, /* @__PURE__ */ React.createElement("div", { className: "monitor-title" }, /* @__PURE__ */ React.createElement("span", { className: "monitor-pulse-dot" }), /* @__PURE__ */ React.createElement("span", null, "Broadcasting: ", runningCampaign.name)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "8px" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-warning btn-sm",
      onClick: () => handlePauseCampaign(runningCampaign.id)
    },
    "\u23F8 Pause Queue"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-danger btn-sm",
      onClick: () => handleCancelCampaign(runningCampaign.id)
    },
    "\u2715 Cancel"
  ))), /* @__PURE__ */ React.createElement("div", { className: "campaign-progress-bar-wrap" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "campaign-progress-bar-fill",
      style: { width: `${runningCampaign.progress_percent}%` }
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "monitor-meta-grid" }, /* @__PURE__ */ React.createElement("div", null, "\u{1F4C8} Progress: ", /* @__PURE__ */ React.createElement("strong", null, runningCampaign.sent_count + runningCampaign.failed_count, " / ", runningCampaign.total_recipients, " (", runningCampaign.progress_percent, "%)")), /* @__PURE__ */ React.createElement("div", null, "\u23F1\uFE0F Pacing Rate: ", /* @__PURE__ */ React.createElement("strong", null, runningCampaign.pace_per_minute, " messages/min")), /* @__PURE__ */ React.createElement("div", null, "\u{1F4CB} Template: ", /* @__PURE__ */ React.createElement("strong", null, runningCampaign.template_title || runningCampaign.template_name)), /* @__PURE__ */ React.createElement("div", null, "\u{1F4B3} Total Spent: ", /* @__PURE__ */ React.createElement("strong", null, formatCurrency(runningCampaign.actual_cost, globalSettings2?.system_currency, globalSettings2?.currency_decimals))))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement(
    DataTable,
    {
      columns,
      data: campaigns,
      searchPlaceholder: "Search campaigns by name, template, status...",
      defaultSortKey: "id",
      defaultSortDir: "desc",
      emptyMessage: "No broadcast campaigns created yet. Click 'Create Broadcast Campaign' to launch your first mass WhatsApp announcement."
    }
  )), showWizard && /* @__PURE__ */ React.createElement(
    NewCampaignWizardModal,
    {
      isOpen: showWizard,
      onClose: () => setShowWizard(false),
      templates,
      globalSettings: globalSettings2,
      currentUser,
      showToast,
      onCampaignCreated: (newId) => {
        setShowWizard(false);
        fetchCampaigns(false);
        handleStartCampaign(newId);
      }
    }
  ), inspectCampaignId && /* @__PURE__ */ React.createElement(
    CampaignReportModal,
    {
      campaignId: inspectCampaignId,
      onClose: () => setInspectCampaignId(null),
      globalSettings: globalSettings2,
      showToast,
      onRerun: handleRerunCampaign
    }
  ), confirmDialog && /* @__PURE__ */ React.createElement(
    ConfirmDialog,
    {
      isOpen: !!confirmDialog,
      title: confirmDialog.title,
      subtitle: confirmDialog.subtitle,
      icon: confirmDialog.icon,
      badgeClass: confirmDialog.badgeClass,
      confirmText: confirmDialog.confirmText,
      cancelText: confirmDialog.cancelText,
      onClose: () => setConfirmDialog(null),
      onConfirm: confirmDialog.onConfirm
    }
  ));
}
function NewCampaignWizardModal({ isOpen, onClose, templates, globalSettings: globalSettings2, currentUser, showToast, onCampaignCreated }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [selectedTemplateName, setSelectedTemplateName] = useState(templates[0]?.template_name || "offer_sandslab");
  const [headerMediaUrl, setHeaderMediaUrl] = useState("");
  const [headerMediaName, setHeaderMediaName] = useState("");
  const [pacePerMinute, setPacePerMinute] = useState(50);
  const [rawText, setRawText] = useState("");
  const [recipients, setRecipients] = useState([]);
  const [csvColumns, setCsvColumns] = useState([]);
  const [creating, setCreating] = useState(false);
  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.template_name === selectedTemplateName) || templates[0] || null;
  }, [templates, selectedTemplateName]);
  useEffect(() => {
    if (selectedTemplate && selectedTemplate.header_sample) {
      setHeaderMediaUrl(selectedTemplate.header_sample);
      setHeaderMediaName(selectedTemplate.header_sample.split("/").pop() || "header_image.jpg");
    }
  }, [selectedTemplate]);
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        processCsvText(text);
      }
    };
    reader.readAsText(file);
  };
  const processCsvText = (text) => {
    setRawText(text);
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) return;
    const firstLineCols = lines[0].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
    setCsvColumns(firstLineCols);
    const startIdx = firstLineCols[0].toLowerCase().includes("phone") ? 1 : 0;
    const parsed = [];
    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
      if (!parts[0]) continue;
      parsed.push({
        phone: parts[0],
        name: parts[1] || "",
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
      showToast("Please paste recipient records or upload a CSV file", "error");
      return;
    }
    processCsvText(rawText);
  };
  const handleLaunch = async () => {
    if (!name.trim()) {
      showToast("Please enter a campaign name", "error");
      setStep(1);
      return;
    }
    if (recipients.length === 0) {
      showToast("Please provide at least one valid recipient", "error");
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
        recipients
      };
      const res = await fetch("./api/campaigns.php?action=create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Broadcast campaign "${name}" created with ${data.total_recipients} recipients!`, "success");
        onCampaignCreated(data.campaign_id);
      } else {
        showToast(data.error || "Failed to create campaign", "error");
      }
    } catch (err) {
      showToast("Network error creating campaign", "error");
    } finally {
      setCreating(false);
    }
  };
  const clientRate = parseFloat(selectedTemplate?.client_rate_bhd || 0.034);
  const estimatedTotalCost = recipients.length * clientRate;
  return /* @__PURE__ */ React.createElement("div", { className: "modal-overlay", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "modal-content", style: { maxWidth: "780px", width: "95%" }, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-header" }, /* @__PURE__ */ React.createElement("h3", { style: { margin: 0, display: "flex", alignItems: "center", gap: "8px" } }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4E2}"), " Create Broadcast Campaign"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "close-btn", onClick: onClose }, "\u2715")), /* @__PURE__ */ React.createElement("div", { className: "wizard-steps-indicator", style: { padding: "0 24px 16px 24px", margin: "16px 0" } }, /* @__PURE__ */ React.createElement("div", { className: `wizard-step-node ${step === 1 ? "active" : ""}`, onClick: () => setStep(1), style: { cursor: "pointer" } }, /* @__PURE__ */ React.createElement("span", { className: "step-num" }, "1"), " Template & Info"), /* @__PURE__ */ React.createElement("div", { className: `wizard-step-node ${step === 2 ? "active" : ""}`, onClick: () => setStep(2), style: { cursor: "pointer" } }, /* @__PURE__ */ React.createElement("span", { className: "step-num" }, "2"), " Upload Recipients"), /* @__PURE__ */ React.createElement("div", { className: `wizard-step-node ${step === 3 ? "active" : ""}`, onClick: () => setStep(3), style: { cursor: "pointer" } }, /* @__PURE__ */ React.createElement("span", { className: "step-num" }, "3"), " Column Mapping & Preview"), /* @__PURE__ */ React.createElement("div", { className: `wizard-step-node ${step === 4 ? "active" : ""}`, onClick: () => setStep(4), style: { cursor: "pointer" } }, /* @__PURE__ */ React.createElement("span", { className: "step-num" }, "4"), " Pacing & Launch")), /* @__PURE__ */ React.createElement("div", { className: "modal-body", style: { maxHeight: "65vh", overflowY: "auto", padding: "0 24px" } }, step === 1 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Campaign Title ", /* @__PURE__ */ React.createElement("span", { style: { color: "#EF4444" } }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      placeholder: "e.g. October Partner Special Promo Blast",
      value: name,
      onChange: (e) => setName(e.target.value),
      autoFocus: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Select Approved WhatsApp Template ", /* @__PURE__ */ React.createElement("span", { style: { color: "#EF4444" } }, "*")), /* @__PURE__ */ React.createElement(
    "select",
    {
      className: "form-select",
      value: selectedTemplateName,
      onChange: (e) => setSelectedTemplateName(e.target.value)
    },
    templates.filter((t) => (t.is_active === 1 || t.is_active === true || t.is_active === "1") && ["APPROVED", "ACTIVE"].includes((t.meta_status || "").toUpperCase())).map((t) => /* @__PURE__ */ React.createElement("option", { key: t.template_name, value: t.template_name }, t.display_title || t.template_name, " [", t.category, "] \u2022 Rate: ", t.client_rate_bhd, " BHD (", t.variable_count, " variables)"))
  )), selectedTemplate && /* @__PURE__ */ React.createElement("div", { style: {
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "10px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: "700", fontSize: "13px", color: "#0369A1" } }, "\u{1F4CB} Template Preview: ", selectedTemplate.display_title), /* @__PURE__ */ React.createElement("span", { className: `badge category-${selectedTemplate.category?.toLowerCase()}` }, selectedTemplate.category)), selectedTemplate.header_sample && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#059669", background: "#ECFDF5", padding: "6px 10px", borderRadius: "6px" } }, /* @__PURE__ */ React.createElement("span", null, "\u{1F5BC}\uFE0F Header Media:"), /* @__PURE__ */ React.createElement("a", { href: selectedTemplate.header_sample, target: "_blank", rel: "noreferrer", style: { color: "#059669", textDecoration: "underline" } }, selectedTemplate.header_sample.split("/").pop())), /* @__PURE__ */ React.createElement("div", { style: {
    background: "#FFFFFF",
    border: "1px solid #CBD5E1",
    borderRadius: "8px",
    padding: "12px",
    whiteSpace: "pre-wrap",
    fontSize: "13px",
    lineHeight: "1.5",
    fontFamily: "inherit"
  } }, selectedTemplate.body_text), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11.5px", color: "var(--text-muted)" } }, "Requires ", /* @__PURE__ */ React.createElement("strong", null, selectedTemplate.variable_count, " dynamic variable(s)"), " per contact row."))), step === 2 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: "700", fontSize: "13.5px" } }, "Upload Contact Audience"), /* @__PURE__ */ React.createElement(
    "a",
    {
      href: `./api/campaigns.php?action=sample_csv&template_name=${encodeURIComponent(selectedTemplateName)}`,
      className: "btn btn-secondary btn-sm",
      download: true,
      style: { display: "flex", alignItems: "center", gap: "4px" }
    },
    "\u{1F4E5} Download Sample CSV"
  )), /* @__PURE__ */ React.createElement("label", { className: "csv-upload-dropzone" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "file",
      accept: ".csv,text/csv",
      onChange: handleFileUpload,
      style: { display: "none" }
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "28px", marginBottom: "8px" } }, "\u{1F4C2}"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: "700", fontSize: "14px", color: "var(--text-color)" } }, "Click to select CSV File or Drag & Drop here"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" } }, "Supports CSV with international phone numbers and parameters")), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", color: "var(--text-muted)", fontSize: "12px", fontWeight: "700" } }, "\u2014 OR PASTE RECIPIENT DATA BELOW \u2014"), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement(
    "textarea",
    {
      className: "form-textarea",
      rows: "4",
      placeholder: `phone,name,param_1,param_2
+97335078079,Ali Al-Hassan,Valued Partner,+97317008899
+97339000001,Ahmed Al-Khalifa,Executive,+97317008899`,
      value: rawText,
      onChange: (e) => setRawText(e.target.value),
      style: { fontFamily: "monospace", fontSize: "12.5px" }
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11px", color: "var(--text-muted)" } }, "One contact per line (Comma separated)"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: handleManualParse }, "\u26A1 Parse Records"))), recipients.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#166534", display: "flex", alignItems: "center", gap: "8px" } }, /* @__PURE__ */ React.createElement("span", null, "\u2713"), " Successfully parsed ", /* @__PURE__ */ React.createElement("strong", null, recipients.length, " recipients"), " ready for broadcast!")), step === 3 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: "700", fontSize: "14px" } }, "Audience Dynamic Preview"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "var(--text-muted)" } }, "Found ", /* @__PURE__ */ React.createElement("strong", null, recipients.length, " recipients"), ". Previewing first 3 rows with template parameters:"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "10px" } }, recipients.slice(0, 3).map((r, idx) => /* @__PURE__ */ React.createElement("div", { key: idx, style: {
    background: "#FFFFFF",
    border: "1px solid #CBD5E1",
    borderRadius: "8px",
    padding: "12px 14px"
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12.5px" } }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("strong", null, "Recipient #", idx + 1, ":"), " ", /* @__PURE__ */ React.createElement("code", { style: { color: "#0369A1" } }, r.phone), " ", r.name && `(${r.name})`), /* @__PURE__ */ React.createElement("span", { className: "badge badge-success", style: { fontSize: "10px" } }, "Valid")), /* @__PURE__ */ React.createElement("div", { style: { background: "#F8FAFC", padding: "8px 10px", borderRadius: "6px", fontSize: "12px", color: "#334155" } }, /* @__PURE__ */ React.createElement("strong", null, "Substituted Variables:"), " ", r.variables && r.variables.length > 0 ? r.variables.map((v, i) => `{{${i + 1}}}: "${v}"`).join(", ") : "None")))), recipients.length > 3 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "var(--text-muted)", textAlign: "center" } }, "... and ", recipients.length - 3, " more recipients queued.")), step === 4 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "18px" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontWeight: "700", fontSize: "13.5px", marginBottom: "8px", display: "block" } }, "Anti-Spam Dispatch Queue Pacing"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "12px", color: "var(--text-muted)", margin: "0 0 12px 0" } }, "Throttle broadcast dispatch rate to stay within Meta Cloud API tier limits and protect your phone number reputation."), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" } }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `pace-option-card ${pacePerMinute === 20 ? "selected" : ""}`,
      onClick: () => setPacePerMinute(20)
    },
    /* @__PURE__ */ React.createElement("div", { style: { fontWeight: "700", color: "#047857", fontSize: "14px" } }, "\u{1F422} Conservative"),
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", fontWeight: "800", margin: "4px 0" } }, "20 msgs / min"),
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text-muted)" } }, "Safe for new numbers")
  ), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `pace-option-card ${pacePerMinute === 50 ? "selected" : ""}`,
      onClick: () => setPacePerMinute(50)
    },
    /* @__PURE__ */ React.createElement("div", { style: { fontWeight: "700", color: "#0369A1", fontSize: "14px" } }, "\u26A1 Standard"),
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", fontWeight: "800", margin: "4px 0" } }, "50 msgs / min"),
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text-muted)" } }, "Meta Tier 1 recommended")
  ), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `pace-option-card ${pacePerMinute === 100 ? "selected" : ""}`,
      onClick: () => setPacePerMinute(100)
    },
    /* @__PURE__ */ React.createElement("div", { style: { fontWeight: "700", color: "#7C3AED", fontSize: "14px" } }, "\u{1F680} Turbo"),
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", fontWeight: "800", margin: "4px 0" } }, "100 msgs / min"),
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text-muted)" } }, "Meta Tier 2+ high volume")
  ))), /* @__PURE__ */ React.createElement("div", { style: {
    background: "#F0FDF4",
    border: "1px solid #86EFAC",
    borderRadius: "10px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: "700", fontSize: "13.5px", color: "#166534", borderBottom: "1px solid #BBF7D0", paddingBottom: "6px" } }, "\u{1F4B3} Financial Budget Breakdown"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "13px" } }, /* @__PURE__ */ React.createElement("span", null, "Total Recipients:"), /* @__PURE__ */ React.createElement("strong", null, recipients.length, " contacts")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "13px" } }, /* @__PURE__ */ React.createElement("span", null, "Template Client Rate (", selectedTemplate?.category, "):"), /* @__PURE__ */ React.createElement("strong", null, formatCurrency(clientRate, globalSettings2?.system_currency, globalSettings2?.currency_decimals), " / msg")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "800", color: "#166534", borderTop: "1px solid #BBF7D0", paddingTop: "6px" } }, /* @__PURE__ */ React.createElement("span", null, "Estimated Total Budget:"), /* @__PURE__ */ React.createElement("span", null, formatCurrency(estimatedTotalCost, globalSettings2?.system_currency, globalSettings2?.currency_decimals)))))), /* @__PURE__ */ React.createElement("div", { className: "modal-footer", style: { display: "flex", justifyContent: "space-between", padding: "16px 24px" } }, /* @__PURE__ */ React.createElement("div", null, step > 1 && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-secondary",
      onClick: () => setStep(step - 1),
      disabled: creating
    },
    "\u2190 Back"
  )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "10px" } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: onClose, disabled: creating }, "Cancel"), step < 4 ? /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-primary",
      onClick: () => {
        if (step === 1 && !name.trim()) {
          showToast("Please enter a campaign name", "error");
          return;
        }
        if (step === 2 && recipients.length === 0) {
          showToast("Please upload or paste recipient contacts", "error");
          return;
        }
        setStep(step + 1);
      }
    },
    "Next Step \u2192"
  ) : /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-primary",
      onClick: handleLaunch,
      disabled: creating,
      style: { background: "#059669", borderColor: "#059669" }
    },
    creating ? "Creating Broadcast..." : "\u{1F680} Launch Broadcast Now"
  )))));
}
function CampaignReportModal({ campaignId, onClose, globalSettings: globalSettings2, showToast, onRerun }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`./api/campaigns.php?action=details&id=${campaignId}`).then((res) => res.json()).then((d) => {
      if (d.success) setData(d);
    }).catch(() => {
    }).finally(() => setLoading(false));
  }, [campaignId]);
  const campaign = data?.campaign;
  const recipients = data?.recipients || [];
  const recipientColumns = [
    { key: "recipient_phone", label: "Recipient Phone", sortable: true, render: (r) => /* @__PURE__ */ React.createElement("strong", null, r.recipient_phone) },
    { key: "contact_name", label: "Contact Name", sortable: true, render: (r) => r.contact_name || "-" },
    {
      key: "status",
      label: "Dispatch Status",
      sortable: true,
      render: (r) => /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: `badge status-${r.status}` }, r.status === "read" ? "\u2713\u2713 Read" : r.status === "delivered" ? "\u2713\u2713 Delivered" : r.status === "sent" ? "\u2713 Dispatched" : r.status === "failed" ? "\u26A0\uFE0F Failed" : r.status), r.error_message && /* @__PURE__ */ React.createElement("div", { style: { fontSize: "10px", color: "#EF4444", marginTop: "2px", wordBreak: "break-word", maxWidth: "280px" } }, r.error_message))
    },
    {
      key: "cost_deducted",
      label: "Debited Tariff",
      sortable: true,
      render: (r) => formatCurrency(r.cost_deducted, globalSettings2?.system_currency, globalSettings2?.currency_decimals)
    },
    {
      key: "sent_at",
      label: "Sent Timestamp",
      sortable: true,
      render: (r) => formatDateTime(r.sent_at || r.created_at, globalSettings2?.system_date_format)
    }
  ];
  return /* @__PURE__ */ React.createElement("div", { className: "modal-overlay", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "modal-content", style: { maxWidth: "850px", width: "95%" }, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-header" }, /* @__PURE__ */ React.createElement("h3", { style: { margin: 0, display: "flex", alignItems: "center", gap: "8px" } }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4CA}"), " Campaign Report: ", campaign?.name || "Loading..."), /* @__PURE__ */ React.createElement("button", { type: "button", className: "close-btn", onClick: onClose }, "\u2715")), /* @__PURE__ */ React.createElement("div", { className: "modal-body", style: { maxHeight: "70vh", overflowY: "auto" } }, loading ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "30px" } }, "Loading campaign report...") : campaign ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } }, /* @__PURE__ */ React.createElement("div", { style: {
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    padding: "14px 18px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "12px"
  } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text-muted)" } }, "Template"), /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "13px" } }, campaign.template_title || campaign.template_name)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text-muted)" } }, "Total Audience"), /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "13px" } }, campaign.total_recipients, " recipients")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text-muted)" } }, "Sent / Failed"), /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "13px", color: "#16A34A" } }, campaign.sent_count, " sent"), " \u2022 ", /* @__PURE__ */ React.createElement("span", { style: { color: "#EF4444" } }, campaign.failed_count, " failed")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "var(--text-muted)" } }, "Actual Spend"), /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "13px" } }, formatCurrency(campaign.actual_cost, globalSettings2?.system_currency, globalSettings2?.currency_decimals)))), /* @__PURE__ */ React.createElement(
    DataTable,
    {
      columns: recipientColumns,
      data: recipients,
      searchPlaceholder: "Search recipient phone, contact name, status...",
      defaultSortKey: "id",
      defaultSortDir: "asc",
      title: `campaign_${campaign.id}_recipients`,
      emptyMessage: "No recipients found for this campaign."
    }
  )) : null), /* @__PURE__ */ React.createElement("div", { className: "modal-footer", style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", null, campaign?.status === "completed" && onRerun && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-secondary btn-sm",
      style: { display: "flex", alignItems: "center", gap: "6px" },
      onClick: () => {
        onClose();
        onRerun(campaign.id);
      }
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F504}"),
    " Re-broadcast Campaign"
  )), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: onClose }, "Close"))));
}
function MessageLogsView({ showToast, globalSettings: globalSettings2, onOpenInbox, currentUser }) {
  const isSuperAdmin = currentUser?.role === "superadmin";
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
      render: (c) => /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, parseFloat(c.client_rate_bhd || 0).toFixed(4), " BHD"), isSuperAdmin && c.meta_cost_bhd !== void 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: "10px", color: "var(--text-muted)" } }, "Meta: ", parseFloat(c.meta_cost_bhd || 0).toFixed(4)))
    },
    {
      key: "created_at",
      label: "Last Message Time",
      render: (c) => /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11.5px", color: "var(--text-secondary)" } }, formatDateTime(c.created_at, globalSettings2?.system_date_format))
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
      render: (m) => /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, parseFloat(m.client_rate_bhd).toFixed(4), " BHD"), isSuperAdmin && m.meta_cost_bhd !== void 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: "10px", color: "var(--text-muted)" } }, "Meta: ", parseFloat(m.meta_cost_bhd).toFixed(4), " | Platform: +", parseFloat(m.platform_charge_bhd || 0).toFixed(4)))
    },
    {
      key: "created_at",
      label: "Timestamp",
      render: (m) => /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11.5px", color: "var(--text-secondary)" } }, formatDateTime(m.created_at, globalSettings2?.system_date_format))
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
      globalSettings: globalSettings2
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
const META_DEFAULT_PRESETS = [
  {
    key: "tax_invoice_notification",
    title: "Tax Invoice Notification with PDF",
    category: "UTILITY",
    language: "en_US",
    header_type: "DOCUMENT",
    header_sample: "https://whatsapp.sandslab.com/uploads/sample_invoice.pdf",
    body_text: "Dear {{1}},\n\nYour official Tax Invoice *{{2}}* for amount *{{3}} {{4}}* has been issued.\nDue Date: *{{5}}*.\n\nPlease find your invoice document attached above.",
    footer_text: "SaNDS Lab Financial Accounts",
    sample_params: ["Ahmed Al-Khalifa", "INV/2026/0142", "345.500", "BHD", "25-Oct-2026"],
    description: "Compliant invoice notification with attached PDF for ERP and accounting systems.",
    icon: "\u{1F4C4}"
  },
  {
    key: "order_delivery_tracking",
    title: "Sales Order Confirmation & Tracking",
    category: "UTILITY",
    language: "en_US",
    header_type: "TEXT",
    header_sample: "Order Confirmation #{{1}}",
    body_text: "Hello {{1}},\n\nThank you for your order! Your order *{{2}}* totaling *{{3}} {{4}}* is now confirmed.\n\nEstimated Delivery: *{{5}}*.\nYou can track your shipment status with our courier.",
    footer_text: "Customer Care & Logistics",
    sample_params: ["Sara Mohamed", "SO-9821", "120.000", "BHD", "Tomorrow, 2:00 PM"],
    description: "Instant dispatch confirmation for e-commerce, sales orders, and deliveries.",
    icon: "\u{1F4E6}"
  },
  {
    key: "payment_receipt_voucher",
    title: "Payment Receipt & Balance Statement",
    category: "UTILITY",
    language: "en_US",
    header_type: "NONE",
    header_sample: "",
    body_text: "Dear {{1}},\n\nWe have received your payment of *{{2}} {{3}}* for receipt *{{4}}* on {{5}}.\n\nRemaining Balance: *{{6}} {{3}}*.\nThank you for choosing our services.",
    footer_text: "Finance & Collections Team",
    sample_params: ["Ali Hassan", "50.000", "BHD", "REC-4412", "13-Oct-2026", "0.000"],
    description: "Receipt voucher acknowledging customer settlement and remaining balance.",
    icon: "\u{1F9FE}"
  },
  {
    key: "appointment_schedule_reminder",
    title: "Appointment / Meeting Reminder",
    category: "UTILITY",
    language: "en_US",
    header_type: "NONE",
    header_sample: "",
    body_text: "Hello {{1}},\n\nThis is a reminder for your upcoming appointment with *{{2}}* on *{{3}}* at *{{4}}*.\nLocation: {{5}}.\n\nIf you need to reschedule, please let us know in advance.",
    footer_text: "Client Scheduling Desk",
    sample_params: ["Fatima Ebrahim", "Dr. Al-Sayed", "15-Oct-2026", "10:30 AM", "Manama Office, 4th Floor"],
    description: "Timely reminders for consultations, doctor visits, meetings, and bookings.",
    icon: "\u{1F5D3}\uFE0F"
  },
  {
    key: "special_discount_promotion",
    title: "Seasonal Promotion & Discount Offer",
    category: "MARKETING",
    language: "en_US",
    header_type: "IMAGE",
    header_sample: "https://whatsapp.sandslab.com/assets/images/QRCodePoster.jpg",
    body_text: "Special Offer for {{1}}!\n\nEnjoy an exclusive *{{2}}% discount* on all our premium services this week.\nUse Promo Code: *{{3}}*\nValid until: *{{4}}*.\n\nTap below or contact us to claim your discount!",
    footer_text: "SaNDS Lab Special Offers",
    sample_params: ["Valued Client", "25", "AUTUMN2026", "31-Oct-2026"],
    description: "High-converting marketing broadcast with image banner and promo code.",
    icon: "\u{1F3F7}\uFE0F"
  },
  {
    key: "secure_otp_verification",
    title: "Security One-Time Passcode (OTP)",
    category: "AUTHENTICATION",
    language: "en_US",
    header_type: "NONE",
    header_sample: "",
    body_text: "Your verification code is *{{1}}*.\n\nThis code will expire in {{2}} minutes. For your security, do not share this code with anyone.",
    footer_text: "Security & Two-Factor Verification",
    sample_params: ["492817", "10"],
    description: "High-security OTP login code for web apps, portals, and password resets.",
    icon: "\u{1F510}"
  }
];
function TemplateStudioModal({ template, onClose, onSave, showToast, currentUser, globalSettings: globalSettings2 }) {
  const isSuperAdmin = currentUser?.role === "superadmin";
  const [studioTab, setStudioTab] = useState(template && template.id ? "custom" : "presets");
  const [formData, setFormData] = useState({
    id: template?.id || null,
    template_name: template?.template_name || "",
    display_title: template?.display_title || "",
    category: template?.category || "UTILITY",
    language: template?.language || "en_US",
    header_type: template?.header_type || "NONE",
    header_sample: template?.header_sample || "",
    body_text: template?.body_text || "",
    footer_text: template?.footer_text || "",
    sample_params: template?.sample_params_json ? typeof template.sample_params_json === "string" ? JSON.parse(template.sample_params_json) : template.sample_params_json : [],
    is_active: template?.is_active !== void 0 ? template.is_active : 1
  });
  const [selectedPresetKey, setSelectedPresetKey] = useState("");
  const [submittingMeta, setSubmittingMeta] = useState(false);
  const [savingLocal, setSavingLocal] = useState(false);
  const [metaError, setMetaError] = useState(null);
  const detectedVars = useMemo(() => {
    if (!formData.body_text) return [];
    const matches = formData.body_text.match(/\{\{([a-zA-Z0-9_]+)\}\}/g);
    if (matches) {
      return [...new Set(matches.map((m) => m.replace(/[\{\}]/g, "").trim()))];
    }
    const numMatches = formData.body_text.match(/\{+[\(\[]?\s*(\d+)\s*[\)\]]?\}+/g);
    if (numMatches) {
      return [...new Set(numMatches.map((m) => m.replace(/\D/g, "").trim()))];
    }
    return [];
  }, [formData.body_text]);
  const sampleParams = useMemo(() => {
    const list = Array.isArray(formData.sample_params) ? [...formData.sample_params] : [];
    for (let i = list.length; i < detectedVars.length; i++) {
      list.push(`Sample ${detectedVars[i] || i + 1}`);
    }
    return list;
  }, [formData.sample_params, detectedVars]);
  const handleUpdateSampleParam = (index, value) => {
    const next = [...sampleParams];
    next[index] = value;
    setFormData((prev) => ({ ...prev, sample_params: next }));
  };
  const handleSelectPreset = (preset) => {
    setSelectedPresetKey(preset.key);
    setFormData({
      id: formData.id,
      template_name: preset.key,
      display_title: preset.title,
      category: preset.category,
      language: preset.language,
      header_type: preset.header_type,
      header_sample: preset.header_sample,
      body_text: preset.body_text,
      footer_text: preset.footer_text,
      sample_params: [...preset.sample_params],
      is_active: 1
    });
    setMetaError(null);
  };
  const modalTariffs = {
    AUTHENTICATION: { meta: 0.011, platform: 35e-4, client: 0.0145 },
    UTILITY: { meta: 0.014, platform: 45e-4, client: 0.0185 },
    MARKETING: { meta: 0.027, platform: 7e-3, client: 0.034 },
    SERVICE: { meta: 75e-4, platform: 25e-4, client: 0.01 }
  };
  const activeTariff = modalTariffs[formData.category] || modalTariffs.UTILITY;
  const previewBodyText = useMemo(() => {
    let text = formData.body_text || "Enter message body text...";
    detectedVars.forEach((v, idx) => {
      const val = sampleParams[idx] || `[${v}]`;
      const regex = new RegExp(`\\{\\{${v}\\}\\}`, "g");
      text = text.replace(regex, `*${val}*`);
    });
    return text;
  }, [formData.body_text, detectedVars, sampleParams]);
  const handleSubmit = async (submitToMeta = false) => {
    if (!formData.template_name || !formData.body_text) {
      showToast("Template key and body text are required", "error");
      return;
    }
    if (submitToMeta) {
      setSubmittingMeta(true);
    } else {
      setSavingLocal(true);
    }
    setMetaError(null);
    try {
      const payload = {
        ...formData,
        sample_params: sampleParams,
        sample_params_json: JSON.stringify(sampleParams),
        submit_to_meta: submitToMeta
      };
      const res = await fetch("./api/templates.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        if (submitToMeta) {
          showToast(`\u{1F680} Template submitted to Meta! Status: ${data.meta_status || "PENDING"}`);
        } else {
          showToast(data.message || "Template saved locally in catalog!");
        }
        onSave();
        onClose();
      } else {
        const err = data.error || "Failed to save template";
        setMetaError(err);
        showToast(err, "error");
      }
    } catch (e) {
      setMetaError("Network error connecting to API");
      showToast("Network error saving template", "error");
    } finally {
      setSubmittingMeta(false);
      setSavingLocal(false);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "modal-overlay", onClick: onClose }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "modal-content",
      style: { maxWidth: "1100px", maxHeight: "92vh", display: "flex", flexDirection: "column" },
      onClick: (e) => e.stopPropagation()
    },
    /* @__PURE__ */ React.createElement("div", { className: "modal-header" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "10px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "24px" } }, "\u2728"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { style: { margin: 0, fontSize: "16px" } }, formData.id ? "Edit WhatsApp Template" : "WhatsApp Template Studio & Meta Approval"), /* @__PURE__ */ React.createElement("p", { style: { margin: "2px 0 0 0", fontSize: "11.5px", color: "rgba(255,255,255,0.85)" } }, "Design Meta-compliant templates, choose from verified presets, preview live on handset, and submit for Meta approval."))), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, "\u2715")),
    /* @__PURE__ */ React.createElement("div", { style: { background: "#F8FAFC", padding: "10px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", gap: "10px", alignItems: "center" } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: `btn ${studioTab === "presets" ? "btn-primary" : "btn-secondary"}`,
        style: { fontSize: "12px", padding: "6px 14px", display: "flex", alignItems: "center", gap: "6px" },
        onClick: () => setStudioTab("presets")
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4DA}"),
      " 1. Choose from Meta Presets (",
      META_DEFAULT_PRESETS.length,
      ")"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: `btn ${studioTab === "custom" ? "btn-primary" : "btn-secondary"}`,
        style: { fontSize: "12px", padding: "6px 14px", display: "flex", alignItems: "center", gap: "6px" },
        onClick: () => setStudioTab("custom")
      },
      /* @__PURE__ */ React.createElement("span", null, "\u270F\uFE0F"),
      " 2. Custom Template Design & Variables"
    ), selectedPresetKey && /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", fontSize: "11.5px", color: "#047857", fontWeight: "600" } }, "\u2713 Loaded Preset: ", /* @__PURE__ */ React.createElement("code", null, selectedPresetKey))),
    /* @__PURE__ */ React.createElement("div", { className: "modal-body", style: { display: "grid", gridTemplateColumns: "1.45fr 1fr", gap: "24px", overflowY: "auto" } }, /* @__PURE__ */ React.createElement("div", null, metaError && /* @__PURE__ */ React.createElement("div", { style: { background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#B91C1C", padding: "10px 14px", borderRadius: "8px", fontSize: "12.5px", marginBottom: "16px", fontWeight: "600" } }, "\u26A0\uFE0F Meta API: ", metaError), studioTab === "presets" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: "14px" } }, /* @__PURE__ */ React.createElement("h4", { style: { margin: "0 0 4px 0", fontSize: "13.5px", color: "var(--text-primary)" } }, "Standard Pre-Approved Industry Templates"), /* @__PURE__ */ React.createElement("p", { style: { margin: 0, fontSize: "11.5px", color: "var(--text-secondary)" } }, "Select any template below to load compliant wording, media headers, and sample parameters ready for Meta approval.")), /* @__PURE__ */ React.createElement("div", { className: "preset-grid" }, META_DEFAULT_PRESETS.map((p) => {
      const isSelected = formData.template_name === p.key || selectedPresetKey === p.key;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: p.key,
          className: `preset-card ${isSelected ? "selected" : ""}`,
          onClick: () => handleSelectPreset(p)
        },
        /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "preset-card-top" }, /* @__PURE__ */ React.createElement("span", { className: "preset-card-icon" }, p.icon), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "preset-card-title" }, p.title), /* @__PURE__ */ React.createElement("span", { className: `badge cat-${p.category.toLowerCase().substring(0, 4)}`, style: { fontSize: "9.5px" } }, p.category, " \u2022 ", p.header_type))), /* @__PURE__ */ React.createElement("div", { className: "preset-card-desc" }, p.description)),
        /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", paddingTop: "8px", borderTop: "1px solid #F1F5F9" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11px", fontFamily: "monospace", color: "var(--wa-teal)" } }, p.key), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            className: "btn btn-secondary btn-sm",
            style: { fontSize: "11px", padding: "3px 8px" },
            onClick: (e) => {
              e.stopPropagation();
              handleSelectPreset(p);
              setStudioTab("custom");
            }
          },
          "Use & Edit \u2192"
        ))
      );
    }))), studioTab === "custom" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" } }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontWeight: "700" } }, "Meta Template Key *"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        className: "form-input",
        placeholder: "e.g. order_dispatch_uniglobal",
        value: formData.template_name,
        onChange: (e) => setFormData({
          ...formData,
          template_name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_")
        }),
        required: true
      }
    ), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "10.5px", color: "var(--text-muted)" } }, "Lowercase letters and underscores only (Meta rule)")), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontWeight: "700" } }, "Display Title *"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        className: "form-input",
        placeholder: "e.g. Tax Invoice Dispatch with PDF",
        value: formData.display_title,
        onChange: (e) => setFormData({ ...formData, display_title: e.target.value }),
        required: true
      }
    ))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "4px" } }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontWeight: "700" } }, "Category"), /* @__PURE__ */ React.createElement(
      "select",
      {
        className: "form-select",
        value: formData.category,
        onChange: (e) => setFormData({ ...formData, category: e.target.value })
      },
      /* @__PURE__ */ React.createElement("option", { value: "UTILITY" }, "Utility (Invoices, Confirmations, Reminders)"),
      /* @__PURE__ */ React.createElement("option", { value: "MARKETING" }, "Marketing (Promotions, Discounts, Offers)"),
      /* @__PURE__ */ React.createElement("option", { value: "AUTHENTICATION" }, "Authentication (OTP Verification Codes)"),
      /* @__PURE__ */ React.createElement("option", { value: "SERVICE" }, "Service (Customer Support)")
    )), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontWeight: "700" } }, "Language Code *"), /* @__PURE__ */ React.createElement(
      "select",
      {
        className: "form-select",
        value: formData.language || "en_US",
        onChange: (e) => setFormData({ ...formData, language: e.target.value })
      },
      /* @__PURE__ */ React.createElement("option", { value: "en_US" }, "English (US) \u2014 en_US (Standard)"),
      /* @__PURE__ */ React.createElement("option", { value: "en" }, "English \u2014 en"),
      /* @__PURE__ */ React.createElement("option", { value: "en_GB" }, "English (UK) \u2014 en_GB"),
      /* @__PURE__ */ React.createElement("option", { value: "ar" }, "Arabic \u2014 ar"),
      /* @__PURE__ */ React.createElement("option", { value: "hi" }, "Hindi \u2014 hi")
    ))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "4px" } }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontWeight: "700" } }, "Header Media Type"), /* @__PURE__ */ React.createElement(
      "select",
      {
        className: "form-select",
        value: formData.header_type,
        onChange: (e) => setFormData({ ...formData, header_type: e.target.value })
      },
      /* @__PURE__ */ React.createElement("option", { value: "NONE" }, "None (Plain Text Message)"),
      /* @__PURE__ */ React.createElement("option", { value: "DOCUMENT" }, "Document (PDF Invoice / Report)"),
      /* @__PURE__ */ React.createElement("option", { value: "IMAGE" }, "Image (Promotion Banner / Photo)"),
      /* @__PURE__ */ React.createElement("option", { value: "TEXT" }, "Text Headline"),
      /* @__PURE__ */ React.createElement("option", { value: "VIDEO" }, "Video")
    )), formData.header_type !== "NONE" && /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontWeight: "700" } }, "Header Sample URL / Headline"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        className: "form-input",
        placeholder: "https://... or header headline",
        value: formData.header_sample || "",
        onChange: (e) => setFormData({ ...formData, header_sample: e.target.value })
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "form-group", style: { marginTop: "4px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontWeight: "700" } }, "Message Body Format *"), /* @__PURE__ */ React.createElement("span", { className: "badge cat-auth", style: { fontSize: "10px" } }, detectedVars.length, " variable", detectedVars.length !== 1 ? "s" : "", " detected")), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        className: "form-textarea",
        style: { minHeight: "110px", fontFamily: "inherit" },
        placeholder: "Dear {{1}}, your order {{2}} for BHD {{3}} has been confirmed.",
        value: formData.body_text,
        onChange: (e) => setFormData({ ...formData, body_text: e.target.value }),
        required: true
      }
    ), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "10.5px", color: "var(--text-muted)" } }, "Use sequential placeholders like ", /* @__PURE__ */ React.createElement("code", null, "{{1}}"), ", ", /* @__PURE__ */ React.createElement("code", null, "{{2}}"), " for customer name, invoice number, amount, etc.")), detectedVars.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "12px 14px", margin: "10px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "4px" } }, "\u26A1 Meta Review Sample Values (Required by Meta AI):"), /* @__PURE__ */ React.createElement("p", { style: { margin: "0 0 10px 0", fontSize: "11px", color: "var(--text-secondary)" } }, "Provide realistic example values for each placeholder so Meta reviewers understand your message intent."), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" } }, detectedVars.map((v, idx) => /* @__PURE__ */ React.createElement("div", { key: v }, /* @__PURE__ */ React.createElement("label", { style: { fontSize: "11px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "2px" } }, "Variable {{", v, "}} Sample:"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        className: "form-input",
        style: { padding: "6px 10px", fontSize: "12px" },
        value: sampleParams[idx] || "",
        onChange: (e) => handleUpdateSampleParam(idx, e.target.value),
        placeholder: `e.g. Value ${idx + 1}`
      }
    ))))), /* @__PURE__ */ React.createElement("div", { className: "form-group", style: { marginTop: "4px" } }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontWeight: "700" } }, "Footer Tagline (Optional)"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        className: "form-input",
        placeholder: `e.g. ${globalSettings2?.company_name || "UniGlobal Accounts"} | Powered by SaNDS Lab`,
        value: formData.footer_text || "",
        onChange: (e) => setFormData({ ...formData, footer_text: e.target.value })
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "tariff-estimate-banner", style: { margin: "14px 0" } }, /* @__PURE__ */ React.createElement("div", { className: "tariff-info" }, /* @__PURE__ */ React.createElement("span", { className: "title" }, "Bahrain Tariff Rate (", formData.category, ")"), /* @__PURE__ */ React.createElement("span", { className: "breakdown" }, isSuperAdmin ? /* @__PURE__ */ React.createElement(React.Fragment, null, "Meta Cost: ", activeTariff.meta.toFixed(4), " BHD | Platform Margin: +", activeTariff.platform.toFixed(4), " BHD") : /* @__PURE__ */ React.createElement(React.Fragment, null, "Official Meta Cloud API Business Messaging Tariff"))), /* @__PURE__ */ React.createElement("div", { className: "tariff-rate-badge" }, "BHD ", activeTariff.client.toFixed(4), " / msg")))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "12px", fontWeight: "700", color: "#475569" } }, "\u{1F4F1} Live WhatsApp Handset Simulator:"), /* @__PURE__ */ React.createElement("span", { className: "badge status-read", style: { fontSize: "10px" } }, "\u25CF Real-Time Mockup")), /* @__PURE__ */ React.createElement("div", { className: "phone-mockup-wrapper" }, /* @__PURE__ */ React.createElement("div", { className: "phone-screen" }, /* @__PURE__ */ React.createElement("div", { className: "phone-header" }, /* @__PURE__ */ React.createElement("div", { className: "phone-header-info" }, /* @__PURE__ */ React.createElement("div", { className: "phone-avatar", style: { overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" } }, globalSettings2?.company_logo ? /* @__PURE__ */ React.createElement("img", { src: globalSettings2.company_logo, alt: "Avatar", style: { width: "100%", height: "100%", objectFit: "cover" }, onError: (e) => {
      e.target.style.display = "none";
    } }) : (globalSettings2?.company_name || "SL").substring(0, 2).toUpperCase()), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "phone-header-title" }, /* @__PURE__ */ React.createElement("span", null, globalSettings2?.company_name || "SaNDS Lab Business"), /* @__PURE__ */ React.createElement("span", { style: { color: "#25D366", fontSize: "11px" } }, "\u2713")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "9.5px", color: "rgba(255,255,255,0.8)" } }, "Official Business Account"))), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "14px", color: "rgba(255,255,255,0.7)" } }, "\u22EE")), /* @__PURE__ */ React.createElement("div", { className: "phone-chat-body" }, /* @__PURE__ */ React.createElement("div", { style: { alignSelf: "center", background: "#E1F3FB", color: "#0369A1", fontSize: "9.5px", padding: "3px 8px", borderRadius: "6px", margin: "6px 0 12px 0" } }, "\u{1F512} Messages are end-to-end encrypted"), /* @__PURE__ */ React.createElement("div", { className: "phone-bubble" }, formData.header_type === "DOCUMENT" && /* @__PURE__ */ React.createElement("div", { className: "phone-bubble-media" }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "20px" } }, "\u{1F4C4}"), /* @__PURE__ */ React.createElement("div", { style: { overflow: "hidden" } }, /* @__PURE__ */ React.createElement("strong", { style: { display: "block", fontSize: "11px", whiteSpace: "nowrap", textOverflow: "ellipsis" } }, formData.header_sample ? formData.header_sample.split("/").pop() : "Invoice_Document.pdf"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "9.5px", color: "#64748B" } }, "1.2 MB \u2022 PDF Document"))), formData.header_type === "IMAGE" && /* @__PURE__ */ React.createElement("div", { style: { borderRadius: "6px", overflow: "hidden", marginBottom: "8px", maxHeight: "140px", background: "#E2E8F0" } }, /* @__PURE__ */ React.createElement(
      "img",
      {
        src: formData.header_sample || "./assets/images/QRCodePoster.jpg",
        alt: "Banner Preview",
        style: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
        onError: (e) => {
          e.target.style.display = "none";
        }
      }
    )), formData.header_type === "TEXT" && /* @__PURE__ */ React.createElement("div", { className: "phone-bubble-header" }, formData.header_sample || formData.display_title || "Headline"), /* @__PURE__ */ React.createElement("div", { className: "phone-bubble-text" }, previewBodyText), formData.footer_text && /* @__PURE__ */ React.createElement("div", { className: "phone-bubble-footer" }, formData.footer_text), /* @__PURE__ */ React.createElement("div", { className: "phone-bubble-meta" }, /* @__PURE__ */ React.createElement("span", null, "14:30"), /* @__PURE__ */ React.createElement("span", { style: { color: "#53BDEB" } }, "\u2713\u2713")))))))),
    /* @__PURE__ */ React.createElement("div", { className: "modal-footer", style: { justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11.5px", color: "#64748B" } }, "Approval Time: Utility ~2 mins \u2022 Marketing ~30 mins")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "10px", alignItems: "center" } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: onClose, disabled: submittingMeta || savingLocal }, "Cancel"), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "btn btn-secondary",
        style: { fontWeight: "700" },
        onClick: () => handleSubmit(false),
        disabled: submittingMeta || savingLocal
      },
      savingLocal ? "Saving..." : "\u{1F4BE} Save Locally Only"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "btn btn-primary",
        style: { display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: "700" },
        onClick: () => handleSubmit(true),
        disabled: submittingMeta || savingLocal
      },
      /* @__PURE__ */ React.createElement("span", null, submittingMeta ? "\u23F3" : "\u{1F680}"),
      submittingMeta ? "Submitting to Meta..." : "Submit to Meta for Approval"
    )))
  ));
}
function TemplatesView({ showToast, globalSettings: globalSettings2, currentUser }) {
  const isSuperAdmin = currentUser?.role === "superadmin";
  const [templates, setTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [syncingMeta, setSyncingMeta] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const loadTemplates = (autoSync = false) => {
    const url = autoSync ? "./api/templates.php?auto_sync=1" : "./api/templates.php";
    fetch(url).then((res) => res.json()).then((res) => {
      if (res.success) setTemplates(res.data);
    });
  };
  useEffect(() => {
    loadTemplates(true);
  }, []);
  useEffect(() => {
    const hasPending = templates.some((t) => (t.meta_status || "").toUpperCase() === "PENDING");
    if (!hasPending) return;
    const timer = setInterval(() => {
      fetch("./api/templates.php?auto_sync=1").then((res) => res.json()).then((res) => {
        if (res.success) setTemplates(res.data);
      }).catch(() => {
      });
    }, 8e3);
    return () => clearInterval(timer);
  }, [templates]);
  const handleToggleActive = async (id, currentStatus, templateName) => {
    const nextStatus = currentStatus ? 0 : 1;
    try {
      const res = await fetch("./api/templates.php?action=toggle_active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        showToast(nextStatus ? `Template "${templateName}" activated!` : `Template "${templateName}" paused.`);
        setTemplates((prev) => prev.map((t) => t.id === id ? { ...t, is_active: nextStatus } : t));
      } else {
        showToast(data.error || "Failed to update status", "error");
      }
    } catch (e) {
      showToast("Network error toggling status", "error");
    }
  };
  const handleSyncMeta = async () => {
    setSyncingMeta(true);
    try {
      const res = await fetch("./api/templates.php?action=sync_meta");
      const data = await res.json();
      if (data.success) {
        showToast(`\u2713 Synced with Meta WABA! Found ${data.total_meta} templates on Meta.`);
        loadTemplates();
      } else {
        showToast(data.error || "Meta sync failed", "error");
      }
    } catch (e) {
      showToast("Network error during Meta sync", "error");
    } finally {
      setSyncingMeta(false);
    }
  };
  const handleDeleteTemplate = (id, name) => {
    setConfirmDialog({
      title: "Delete WhatsApp Template?",
      subtitle: `Are you sure you want to permanently remove template "${name}" from your catalog?`,
      icon: "\u{1F5D1}\uFE0F",
      badgeClass: "danger",
      confirmText: "Yes, Delete Template",
      cancelText: "Cancel",
      onConfirm: async () => {
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
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  };
  const templateColumns = [
    {
      key: "display_title",
      label: "Template Title & Key",
      render: (t) => /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, t.display_title)), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "monospace", fontSize: "11px", color: "var(--wa-teal)" } }, t.template_name))
    },
    {
      key: "category",
      label: "Category & Lang",
      render: (t) => /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "3px" } }, /* @__PURE__ */ React.createElement("span", { className: `badge cat-${t.category.toLowerCase().substring(0, 4)}` }, t.category), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "10.5px", color: "#64748B" } }, t.language || "en_US"))
    },
    {
      key: "header_type",
      label: "Header Media",
      render: (t) => /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11px", fontWeight: "700" } }, t.header_type)
    },
    {
      key: "body_text",
      label: "Body Format",
      render: (t) => /* @__PURE__ */ React.createElement("div", { style: { maxWidth: "240px", fontSize: "11.5px", color: "var(--text-secondary)" } }, t.body_text)
    },
    {
      key: "client_rate_bhd",
      label: "Client Rate",
      render: (t) => /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", { style: { color: "var(--wa-teal)", fontSize: "12.5px" } }, parseFloat(t.client_rate_bhd).toFixed(4), " BHD"), isSuperAdmin && t.meta_cost_bhd !== void 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: "10.5px", color: "#64748B" } }, "Meta: ", parseFloat(t.meta_cost_bhd).toFixed(4)))
    },
    {
      key: "is_active",
      label: "Status & Control",
      render: (t) => {
        const st = (t.meta_status || "").toUpperCase();
        const isApproved = ["APPROVED", "ACTIVE"].includes(st);
        const isPending = st === "PENDING";
        const badgeClass = isApproved ? "status-read" : isPending ? "cat-auth" : "status-failed";
        const badgeText = isApproved ? "\u2713 APPROVED" : isPending ? "\u23F3 PENDING" : `\u2715 ${st || "REJECTED"}`;
        return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement(
          "div",
          {
            className: `tmpl-toggle-pill ${t.is_active ? "active" : "inactive"}`,
            onClick: () => handleToggleActive(t.id, t.is_active, t.template_name),
            title: t.is_active ? "Click to Pause / Deactivate Template" : "Click to Activate Template"
          },
          /* @__PURE__ */ React.createElement("span", { className: "tmpl-toggle-dot" }),
          /* @__PURE__ */ React.createElement("span", null, t.is_active ? "Active" : "Paused")
        ), /* @__PURE__ */ React.createElement(
          "span",
          {
            className: `badge ${badgeClass}`,
            style: { fontSize: "10px", display: "inline-flex", alignItems: "center", gap: "4px" }
          },
          badgeText
        ));
      }
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (t) => /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "6px" } }, /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "btn btn-secondary btn-sm",
          onClick: () => {
            setEditingTemplate({ ...t });
            setShowStudioModal(true);
          },
          title: "Edit / Re-submit Template"
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
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "page-header-row" }, /* @__PURE__ */ React.createElement("div", { className: "page-title-group" }, /* @__PURE__ */ React.createElement("h1", null, /* @__PURE__ */ React.createElement("span", null, "\u{1F4CB}"), " WhatsApp Templates & Tariff Schedule"), /* @__PURE__ */ React.createElement("p", null, "Meta-registered message templates, variable placeholders, official Bahrain Market rates, and active/inactive status controls.")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "8px", alignItems: "center" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-secondary",
      style: { display: "inline-flex", alignItems: "center", gap: "6px" },
      disabled: syncingMeta,
      onClick: handleSyncMeta,
      title: "Query Meta Graph API to refresh approval statuses"
    },
    /* @__PURE__ */ React.createElement("span", null, syncingMeta ? "\u23F3" : "\u{1F504}"),
    syncingMeta ? "Syncing..." : "Sync with Meta"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-primary",
      style: { display: "inline-flex", alignItems: "center", gap: "6px" },
      onClick: () => {
        setEditingTemplate(null);
        setShowStudioModal(true);
      }
    },
    /* @__PURE__ */ React.createElement("span", null, "\u2728"),
    " Template Creation Studio"
  ))), /* @__PURE__ */ React.createElement(
    DataTable,
    {
      columns: templateColumns,
      data: templates,
      title: "whatsapp_templates",
      searchPlaceholder: "Search template title, key, category...",
      defaultPageSize: 10,
      pageSizeOptions: [5, 10, 20],
      defaultSortKey: "id",
      defaultSortDir: "desc"
    }
  ), showStudioModal && /* @__PURE__ */ React.createElement(
    TemplateStudioModal,
    {
      template: editingTemplate,
      onClose: () => {
        setShowStudioModal(false);
        setEditingTemplate(null);
      },
      onSave: loadTemplates,
      showToast,
      currentUser,
      globalSettings: globalSettings2
    }
  ), confirmDialog && /* @__PURE__ */ React.createElement(
    ConfirmDialog,
    {
      isOpen: !!confirmDialog,
      title: confirmDialog.title,
      subtitle: confirmDialog.subtitle,
      icon: confirmDialog.icon,
      badgeClass: confirmDialog.badgeClass,
      confirmText: confirmDialog.confirmText,
      cancelText: confirmDialog.cancelText,
      onClose: () => setConfirmDialog(null),
      onConfirm: confirmDialog.onConfirm
    }
  ));
}
function OdooGuideModal({ onClose, showToast, apiKey }) {
  const [guideTab, setGuideTab] = useState("overview");
  return /* @__PURE__ */ React.createElement("div", { className: "modal-overlay", onClick: onClose }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "modal-content",
      style: { maxWidth: "960px", maxHeight: "90vh", display: "flex", flexDirection: "column" },
      onClick: (e) => e.stopPropagation()
    },
    /* @__PURE__ */ React.createElement("div", { className: "modal-header" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "10px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "24px" } }, "\u{1F4D6}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { style: { margin: 0, fontSize: "16px" } }, "Odoo ERP & WhatsApp Integration Setup Guide"), /* @__PURE__ */ React.createElement("p", { style: { margin: "2px 0 0 0", fontSize: "11.5px", color: "rgba(255,255,255,0.85)" } }, "Step-by-step procedure for Odoo 14, 15, 16, 17 & 18 \u2022 Automated Actions & Webhooks"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px" } }, /* @__PURE__ */ React.createElement(
      "a",
      {
        href: "./ODOO_INTEGRATION_GUIDE.md",
        download: "ODOO_INTEGRATION_GUIDE.md",
        className: "btn btn-secondary",
        style: { fontSize: "11.5px", padding: "4px 10px", textDecoration: "none", background: "rgba(255,255,255,0.2)", color: "#FFFFFF", border: "none" },
        title: "Download Full Markdown Documentation"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u2B07\uFE0F"),
      " Download .md"
    ), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: onClose }, "\u2715"))),
    /* @__PURE__ */ React.createElement("div", { style: { background: "#F8FAFC", padding: "10px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", gap: "8px", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: `btn ${guideTab === "overview" ? "btn-primary" : "btn-secondary"}`,
        style: { fontSize: "11.5px", padding: "5px 12px" },
        onClick: () => setGuideTab("overview")
      },
      "1. Overview & Credentials"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: `btn ${guideTab === "invoice" ? "btn-primary" : "btn-secondary"}`,
        style: { fontSize: "11.5px", padding: "5px 12px" },
        onClick: () => setGuideTab("invoice")
      },
      "2. Customer Invoices (account.move)"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: `btn ${guideTab === "orders" ? "btn-primary" : "btn-secondary"}`,
        style: { fontSize: "11.5px", padding: "5px 12px" },
        onClick: () => setGuideTab("orders")
      },
      "3. Orders & Payments (sale.order)"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: `btn ${guideTab === "webhooks" ? "btn-primary" : "btn-secondary"}`,
        style: { fontSize: "11.5px", padding: "5px 12px" },
        onClick: () => setGuideTab("webhooks")
      },
      "4. Webhooks & Chatter Callbacks"
    )),
    /* @__PURE__ */ React.createElement("div", { className: "modal-body", style: { padding: "24px", overflowY: "auto" } }, guideTab === "overview" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { background: "#F0FDF4", border: "1px solid #BBF7D0", padding: "14px", borderRadius: "8px", marginBottom: "16px" } }, /* @__PURE__ */ React.createElement("strong", { style: { color: "#166534", fontSize: "13px" } }, "\u26A1 What this integration does automatically:"), /* @__PURE__ */ React.createElement("p", { style: { color: "#14532D", fontSize: "12px", margin: "4px 0 0 0", lineHeight: "1.5" } }, "When an accountant validates an invoice or sales confirmation in Odoo, Odoo renders the official QWeb PDF in memory, sends it to the SaNDS Lab Gateway, and delivers it to the customer on WhatsApp with authentic delivery receipts posted back to Odoo Chatter.")), /* @__PURE__ */ React.createElement("h4", { style: { fontSize: "13px", marginBottom: "10px" } }, "\u{1F511} Integration Credentials"), /* @__PURE__ */ React.createElement("table", { className: "table", style: { width: "100%", marginBottom: "20px" } }, /* @__PURE__ */ React.createElement("tbody", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { width: "220px", fontWeight: "700" } }, "Platform Gateway URL"), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("code", null, "https://whatsapp.sandslab.com"))), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { fontWeight: "700" } }, "Inbound Webhook Endpoint"), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("code", null, "https://whatsapp.sandslab.com/api/odoo_webhook.php"))), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { fontWeight: "700" } }, "Authentication Header"), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("code", null, "X-API-Key: ", apiKey))), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { fontWeight: "700" } }, "Supported Odoo Versions"), /* @__PURE__ */ React.createElement("td", null, "Odoo 14, 15, 16, 17, 18 (Community, Enterprise, Odoo.sh, SaaS)")))), /* @__PURE__ */ React.createElement("h4", { style: { fontSize: "13px", marginBottom: "10px" } }, "\u{1F6E0}\uFE0F Step 1: Activate Developer Mode in Odoo"), /* @__PURE__ */ React.createElement("ol", { style: { fontSize: "12.5px", lineHeight: "1.7", margin: "0 0 0 20px", color: "var(--text-secondary)" } }, /* @__PURE__ */ React.createElement("li", null, "Log in to your Odoo ERP instance as an Administrator."), /* @__PURE__ */ React.createElement("li", null, "Go to ", /* @__PURE__ */ React.createElement("strong", null, "Settings"), " application."), /* @__PURE__ */ React.createElement("li", null, "Scroll to the bottom of the General Settings page."), /* @__PURE__ */ React.createElement("li", null, "Click ", /* @__PURE__ */ React.createElement("strong", null, "Activate the developer mode"), " (a bug icon \u{1FAB2} will appear in the top header)."))), guideTab === "invoice" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", { style: { fontSize: "13px", marginBottom: "6px" } }, "Step 2: Customer Invoices Automated Action (account.move)"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" } }, "Navigate to ", /* @__PURE__ */ React.createElement("strong", null, "Settings \u2192 Technical \u2192 Server Actions"), " \u2192 click ", /* @__PURE__ */ React.createElement("strong", null, "New"), ":"), /* @__PURE__ */ React.createElement("ul", { style: { fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 14px 20px", lineHeight: "1.6" } }, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Action Name:"), " ", /* @__PURE__ */ React.createElement("code", null, "Send WhatsApp Tax Invoice with PDF")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Model:"), " ", /* @__PURE__ */ React.createElement("code", null, "Journal Entry"), " (", /* @__PURE__ */ React.createElement("code", null, "account.move"), ")"), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Action To Do:"), " ", /* @__PURE__ */ React.createElement("code", null, "Execute Python Code"))), /* @__PURE__ */ React.createElement("div", { className: "card-header", style: { padding: "8px 12px", background: "#0F172A", color: "#FFFFFF", borderRadius: "8px 8px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11.5px", color: "#94A3B8" } }, "ir.actions.server.py (Zero Dependencies)"), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "btn-copy-code",
        onClick: () => {
          const code = `import json
import urllib.request
import base64

API_GATEWAY_URL = "https://whatsapp.sandslab.com/api/odoo_webhook.php"
API_SECRET_KEY  = "${apiKey}"

if record.move_type in ('out_invoice', 'out_refund'):
    partner = record.partner_id
    dest_phone = (partner.mobile or partner.phone or "").strip()
    if dest_phone:
        pdf_base64 = None
        try:
            report_ref = record.env.ref('account.account_invoices', raise_if_not_found=False)
            if report_ref:
                pdf_binary, _ = report_ref._render_qweb_pdf([record.id])
                pdf_base64 = base64.b64encode(pdf_binary).decode('utf-8')
        except Exception:
            pdf_base64 = None

        payload = {
            "model": "account.move",
            "record_id": record.id,
            "record_name": record.name,
            "partner_name": partner.name,
            "partner_phone": dest_phone,
            "amount": record.amount_total,
            "currency": record.currency_id.name if record.currency_id else "BHD",
            "date": str(record.invoice_date or record.create_date.date()),
            "template_name": "offer_sandslab",
            "pdf_base64": pdf_base64,
            "callback_url": "https://whatsapp.sandslab.com/api/odoo_webhook.php?action=simulate_callback"
        }

        req = urllib.request.Request(API_GATEWAY_URL, data=json.dumps(payload).encode('utf-8'), headers={"Content-Type": "application/json", "X-API-Key": API_SECRET_KEY}, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                res_json = json.loads(resp.read().decode('utf-8'))
                if res_json.get('success'):
                    record.message_post(body=f"\u2705 <b>WhatsApp Sent</b>: <code>{res_json.get('message_id')}</code>")
        except Exception as ex:
            record.message_post(body=f"\u274C <b>WhatsApp Error</b>: {str(ex)}")`;
          navigator.clipboard.writeText(code);
          showToast("Invoice Python Server Action copied!");
        }
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4CB}"),
      " Copy Python Code"
    )), /* @__PURE__ */ React.createElement("div", { className: "code-box", style: { borderRadius: "0 0 8px 8px", maxHeight: "300px", overflowY: "auto" } }, /* @__PURE__ */ React.createElement("pre", { style: { margin: 0, fontSize: "11px", whiteSpace: "pre-wrap" } }, `import json
import urllib.request
import base64

API_GATEWAY_URL = "https://whatsapp.sandslab.com/api/odoo_webhook.php"
API_SECRET_KEY  = "${apiKey}"

if record.move_type in ('out_invoice', 'out_refund'):
    partner = record.partner_id
    dest_phone = (partner.mobile or partner.phone or "").strip()
    if dest_phone:
        pdf_base64 = None
        try:
            report_ref = record.env.ref('account.account_invoices', raise_if_not_found=False)
            if report_ref:
                pdf_binary, _ = report_ref._render_qweb_pdf([record.id])
                pdf_base64 = base64.b64encode(pdf_binary).decode('utf-8')
        except Exception:
            pdf_base64 = None

        payload = {
            "model": "account.move",
            "record_id": record.id,
            "record_name": record.name,
            "partner_name": partner.name,
            "partner_phone": dest_phone,
            "amount": record.amount_total,
            "currency": record.currency_id.name if record.currency_id else "BHD",
            "date": str(record.invoice_date or record.create_date.date()),
            "template_name": "offer_sandslab",
            "pdf_base64": pdf_base64,
            "callback_url": "https://whatsapp.sandslab.com/api/odoo_webhook.php?action=simulate_callback"
        }

        req = urllib.request.Request(API_GATEWAY_URL, data=json.dumps(payload).encode('utf-8'), headers={"Content-Type": "application/json", "X-API-Key": API_SECRET_KEY}, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                res_json = json.loads(resp.read().decode('utf-8'))
                if res_json.get('success'):
                    record.message_post(body=f"\u2705 <b>WhatsApp Sent</b>: <code>{res_json.get('message_id')}</code>")
        except Exception as ex:
            record.message_post(body=f"\u274C <b>WhatsApp Error</b>: {str(ex)}")`)), /* @__PURE__ */ React.createElement("div", { style: { marginTop: "14px", padding: "10px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "6px" } }, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "12px" } }, "\u{1F517} Step 3: Trigger Automation Rule"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "11.5px", color: "var(--text-secondary)", margin: "4px 0 0 0" } }, "Go to ", /* @__PURE__ */ React.createElement("strong", null, "Settings \u2192 Technical \u2192 Automation Rules"), " \u2192 Create new rule on ", /* @__PURE__ */ React.createElement("code", null, "Journal Entry"), " triggered ", /* @__PURE__ */ React.createElement("strong", null, "On Save"), " where ", /* @__PURE__ */ React.createElement("code", null, "state = 'posted'"), " and link to this action!"))), guideTab === "orders" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", { style: { fontSize: "13px", marginBottom: "8px" } }, "Sales Quotations & Order Confirmations (sale.order)"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" } }, "Trigger on: ", /* @__PURE__ */ React.createElement("code", null, "state == 'sale'"), " (Confirmed Order) or ", /* @__PURE__ */ React.createElement("code", null, "state == 'sent'"), " (Quotation Sent)."), /* @__PURE__ */ React.createElement("div", { className: "card-header", style: { padding: "8px 12px", background: "#0F172A", color: "#FFFFFF", borderRadius: "8px 8px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11.5px", color: "#94A3B8" } }, "sale_order_automation.py"), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "btn-copy-code",
        onClick: () => {
          const code = `import json
import urllib.request
import base64

API_GATEWAY_URL = "https://whatsapp.sandslab.com/api/odoo_webhook.php"
API_SECRET_KEY  = "${apiKey}"

partner = record.partner_id
dest_phone = (partner.mobile or partner.phone or "").strip()

if dest_phone:
    pdf_base64 = None
    try:
        report_ref = record.env.ref('sale.action_report_saleorder', raise_if_not_found=False)
        if report_ref:
            pdf_binary, _ = report_ref._render_qweb_pdf([record.id])
            pdf_base64 = base64.b64encode(pdf_binary).decode('utf-8')
    except Exception:
        pdf_base64 = None

    payload = {
        "model": "sale.order",
        "record_id": record.id,
        "record_name": record.name,
        "partner_name": partner.name,
        "partner_phone": dest_phone,
        "amount": record.amount_total,
        "currency": record.currency_id.name if record.currency_id else "BHD",
        "date": str(record.date_order.date()),
        "template_name": "uniglobal_delivery_dispatch",
        "pdf_base64": pdf_base64
    }

    req = urllib.request.Request(API_GATEWAY_URL, data=json.dumps(payload).encode('utf-8'), headers={"Content-Type": "application/json", "X-API-Key": API_SECRET_KEY}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            res = json.loads(resp.read().decode('utf-8'))
            if res.get('success'):
                record.message_post(body=f"\u2705 WhatsApp Order Confirmation: {res.get('message_id')}")
    except Exception as ex:
        record.message_post(body=f"\u274C WhatsApp Order Error: {str(ex)}")`;
          navigator.clipboard.writeText(code);
          showToast("Sales Order Python script copied!");
        }
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4CB}"),
      " Copy Order Script"
    )), /* @__PURE__ */ React.createElement("div", { className: "code-box", style: { borderRadius: "0 0 8px 8px", maxHeight: "280px", overflowY: "auto" } }, /* @__PURE__ */ React.createElement("pre", { style: { margin: 0, fontSize: "11px", whiteSpace: "pre-wrap" } }, `import json
import urllib.request
import base64

API_GATEWAY_URL = "https://whatsapp.sandslab.com/api/odoo_webhook.php"
API_SECRET_KEY  = "${apiKey}"

partner = record.partner_id
dest_phone = (partner.mobile or partner.phone or "").strip()

if dest_phone:
    pdf_base64 = None
    try:
        report_ref = record.env.ref('sale.action_report_saleorder', raise_if_not_found=False)
        if report_ref:
            pdf_binary, _ = report_ref._render_qweb_pdf([record.id])
            pdf_base64 = base64.b64encode(pdf_binary).decode('utf-8')
    except Exception:
        pdf_base64 = None

    payload = {
        "model": "sale.order",
        "record_id": record.id,
        "record_name": record.name,
        "partner_name": partner.name,
        "partner_phone": dest_phone,
        "amount": record.amount_total,
        "currency": record.currency_id.name if record.currency_id else "BHD",
        "date": str(record.date_order.date()),
        "template_name": "uniglobal_delivery_dispatch",
        "pdf_base64": pdf_base64
    }

    req = urllib.request.Request(API_GATEWAY_URL, data=json.dumps(payload).encode('utf-8'), headers={"Content-Type": "application/json", "X-API-Key": API_SECRET_KEY}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            res = json.loads(resp.read().decode('utf-8'))
            if res.get('success'):
                record.message_post(body=f"\u2705 WhatsApp Order Confirmation: {res.get('message_id')}")
    except Exception as ex:
        record.message_post(body=f"\u274C WhatsApp Order Error: {str(ex)}")`))), guideTab === "webhooks" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", { style: { fontSize: "13px", marginBottom: "8px" } }, "Odoo 17 & 18 Native Webhooks & Bi-Directional Chatter"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" } }, "If using Odoo 17 or 18, you can configure no-code webhooks directly under ", /* @__PURE__ */ React.createElement("strong", null, "Automation Rules \u2192 Send Webhook Notification"), ":"), /* @__PURE__ */ React.createElement("table", { className: "table", style: { width: "100%", marginBottom: "16px" } }, /* @__PURE__ */ React.createElement("tbody", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { width: "180px", fontWeight: "700" } }, "Target URL"), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("code", null, "https://whatsapp.sandslab.com/api/odoo_webhook.php"))), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { fontWeight: "700" } }, "Headers"), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("code", null, "X-API-Key: ", apiKey), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("code", null, "Content-Type: application/json"))))), /* @__PURE__ */ React.createElement("div", { style: { background: "#F0F9FF", border: "1px solid #BAE6FD", padding: "14px", borderRadius: "8px" } }, /* @__PURE__ */ React.createElement("strong", { style: { color: "#0369A1", fontSize: "13px" } }, "\u{1F4AC} Bi-Directional Delivery Tracking in Odoo:"), /* @__PURE__ */ React.createElement("p", { style: { color: "#0C4A6E", fontSize: "12px", margin: "4px 0 0 0", lineHeight: "1.5" } }, "When the customer receives or opens the WhatsApp message on their handset, Meta webhooks callback to our platform, which in turn calls your Odoo instance, updating the document chatter with timestamps (e.g. ", /* @__PURE__ */ React.createElement("code", null, "\u2713\u2713 WhatsApp Read by Customer"), ").")))),
    /* @__PURE__ */ React.createElement("div", { className: "modal-footer", style: { padding: "12px 24px" } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: onClose, style: { fontSize: "12.5px" } }, "Close Guide"))
  ));
}
function OdooApiHubView({ showToast, globalSettings: globalSettings2 }) {
  const [hubTab, setHubTab] = useState("studio");
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [selectedModel, setSelectedModel] = useState("account.move");
  const [selectedTrigger, setSelectedTrigger] = useState("posted");
  const [selectedTemplate, setSelectedTemplate] = useState("uniglobal_invoice_notification");
  const [includePdf, setIncludePdf] = useState(true);
  const [logChatter, setLogChatter] = useState(true);
  const [phoneFallback, setPhoneFallback] = useState(true);
  const [studioLang, setStudioLang] = useState("python");
  const [templatesList, setTemplatesList] = useState([]);
  const [apiKey, setApiKey] = useState("sk_live_odoo_uniglobal_98741362");
  const [endpoint, setEndpoint] = useState("/api/odoo_webhook.php");
  const [testModel, setTestModel] = useState("account.move");
  const [testRecipient, setTestRecipient] = useState("+97335078079");
  const [testPartnerName, setTestPartnerName] = useState("Ahmed Al-Khalifa");
  const [testRecordName, setTestRecordName] = useState("INV/2026/0142");
  const [testAmount, setTestAmount] = useState("345.500");
  const [testCurrency, setTestCurrency] = useState("BHD");
  const [testTemplate, setTestTemplate] = useState("offer_sandslab");
  const [responseOutput, setResponseOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastDispatchedId, setLastDispatchedId] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [activeSnippetLang, setActiveSnippetLang] = useState("python");
  useEffect(() => {
    fetch("./api/odoo_webhook.php?action=templates").then((res) => res.json()).then((res) => {
      if (res.success && Array.isArray(res.data)) {
        setTemplatesList(res.data);
      }
    }).catch(() => {
    });
  }, []);
  const loadAuditLogs = () => {
    setLoadingAudit(true);
    fetch("./api/odoo_webhook.php?action=recent").then((res) => res.json()).then((res) => {
      if (res.success && Array.isArray(res.data)) {
        setAuditLogs(res.data);
      }
    }).catch(() => {
    }).finally(() => setLoadingAudit(false));
  };
  useEffect(() => {
    if (hubTab === "audit") {
      loadAuditLogs();
    }
  }, [hubTab]);
  const applyTesterPreset = (presetType) => {
    if (presetType === "invoice") {
      setTestModel("account.move");
      setTestRecordName("INV/2026/0142");
      setTestPartnerName("Ahmed Al-Khalifa");
      setTestAmount("345.500");
      setTestTemplate("offer_sandslab");
    } else if (presetType === "order") {
      setTestModel("sale.order");
      setTestRecordName("SO-8821");
      setTestPartnerName("Dr. Tariq Salman");
      setTestAmount("125.000");
      setTestTemplate("offer_sandslab");
    } else if (presetType === "payment") {
      setTestModel("account.payment");
      setTestRecordName("PAY/2026/0045");
      setTestPartnerName("Fatima Noor");
      setTestAmount("75.250");
      setTestTemplate("uniglobal_invoice_notification");
    }
    showToast(`Loaded ${presetType} simulation preset!`);
  };
  const runLiveTest = async () => {
    setLoading(true);
    setResponseOutput("Dispatching automated action to WhatsApp Gateway...");
    try {
      const payload = {
        model: testModel,
        record_id: 142,
        record_name: testRecordName,
        partner_name: testPartnerName,
        partner_phone: testRecipient,
        amount: testAmount,
        currency: testCurrency,
        date: (/* @__PURE__ */ new Date()).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        template_name: testTemplate,
        callback_url: "https://whatsapp.sandslab.com/api/odoo_webhook.php?action=simulate_callback"
      };
      const res = await fetch(`.${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setResponseOutput(JSON.stringify(data, null, 2));
      if (data.success) {
        setLastDispatchedId(data.message_id);
        showToast("WhatsApp notification successfully dispatched from Odoo!");
      } else {
        showToast(data.message || data.error || "Dispatch error", "error");
      }
    } catch (err) {
      setResponseOutput(JSON.stringify({ error: err.message }, null, 2));
      showToast("API execution error: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };
  const generateOdooPythonCode = () => {
    const isInvoice = selectedModel === "account.move";
    const isOrder = selectedModel === "sale.order";
    const isPayment = selectedModel === "account.payment";
    const pdfReportRef = isInvoice ? "'account.account_invoices'" : isOrder ? "'sale.action_report_saleorder'" : "'account.action_report_payment_receipt'";
    const dateField = isInvoice ? "record.invoice_date" : isOrder ? "record.date_order" : "record.date";
    const amountField = isPayment ? "record.amount" : "record.amount_total";
    return `# ==============================================================================
# SaNDS Lab WhatsApp Gateway \u2014 Odoo Automated Server Action
# Model: ${selectedModel} | Trigger: ${selectedTrigger}
# Requirements: ZERO EXTERNAL PIP PACKAGES (Native Python standard library)
# Compatible with: Odoo 14, 15, 16, 17, and 18 (Community & Enterprise / Odoo.sh)
# ==============================================================================
import json
import urllib.request
import base64

API_GATEWAY_URL = "https://whatsapp.sandslab.com/api/odoo_webhook.php"
API_SECRET_KEY  = "${apiKey}"

# 1. Resolve Destination Phone Number
partner = record.partner_id if hasattr(record, 'partner_id') else record
${phoneFallback ? 'dest_phone = (partner.mobile or partner.phone or "").strip()' : 'dest_phone = (partner.mobile or "").strip()'}

if not dest_phone:
    ${logChatter ? 'record.message_post(body="\u26A0\uFE0F <b>WhatsApp Skipped:</b> Customer has no mobile or phone number on file.")' : "pass"}
else:
    # 2. Extract Document PDF Attachment Binary (Optional)
    pdf_base64 = None
    ${includePdf ? `try:
        report_action = record.env.ref(${pdfReportRef}, raise_if_not_found=False)
        if report_action:
            pdf_binary, _ = report_action._render_qweb_pdf([record.id])
            pdf_base64 = base64.b64encode(pdf_binary).decode('utf-8')
    except Exception as pdf_err:
        pdf_base64 = None` : "# PDF Attachment disabled in Studio generator"}

    # 3. Build Webhook Payload
    amount_val = ${amountField} if hasattr(record, '${amountField.split(".")[1]}') else 0.0
    curr_name  = record.currency_id.name if hasattr(record, 'currency_id') and record.currency_id else "BHD"
    doc_date   = str(${dateField} or record.create_date.date())

    payload = {
        "model": record._name,
        "record_id": record.id,
        "record_name": record.name or f"DOC-{record.id}",
        "partner_name": partner.name or "Valued Customer",
        "partner_phone": dest_phone,
        "amount": amount_val,
        "currency": curr_name,
        "date": doc_date,
        "template_name": "${selectedTemplate}",
        "pdf_base64": pdf_base64,
        "callback_url": "https://whatsapp.sandslab.com/api/odoo_webhook.php?action=simulate_callback"
    }

    # 4. Dispatch Request to WhatsApp Gateway
    req = urllib.request.Request(
        API_GATEWAY_URL,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            "Content-Type": "application/json",
            "X-API-Key": API_SECRET_KEY,
            "User-Agent": "Odoo-WhatsApp-Connector/2.3"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            res_json = json.loads(response.read().decode('utf-8'))
            if res_json.get('success'):
                wamid = res_json.get('message_id', '')
                tariff = res_json.get('tariff', {}).get('client_rate', '')
                ${logChatter ? `record.message_post(
                    body=f"\u2705 <b>WhatsApp Notification Sent</b><br/>"
                         f"Template: <code>{res_json.get('template_name')}</code><br/>"
                         f"Recipient: <b>{dest_phone}</b><br/>"
                         f"Tracking ID: <code>{wamid}</code><br/>"
                         f"Tariff Debited: <b>{tariff}</b>"
                )` : "pass"}
            else:
                ${logChatter ? `record.message_post(body=f"\u274C <b>WhatsApp Dispatch Failed:</b> {res_json.get('error', res_json.get('message'))}")` : "pass"}
    except Exception as ex:
        ${logChatter ? 'record.message_post(body=f"\u274C <b>WhatsApp Gateway Error:</b> {str(ex)}")' : "pass"}`;
  };
  const generateOdoo17WebhookJson = () => {
    return JSON.stringify({
      "webhook_url": "https://whatsapp.sandslab.com/api/odoo_webhook.php",
      "http_headers": {
        "X-API-Key": apiKey,
        "Content-Type": "application/json"
      },
      "payload_fields": {
        "model": selectedModel,
        "record_id": "{{ record.id }}",
        "record_name": "{{ record.name }}",
        "partner_name": "{{ record.partner_id.name }}",
        "partner_phone": "{{ record.partner_id.mobile or record.partner_id.phone }}",
        "amount": "{{ record.amount_total }}",
        "currency": "{{ record.currency_id.name }}",
        "date": "{{ record.invoice_date or record.create_date }}",
        "template_name": selectedTemplate
      }
    }, null, 2);
  };
  const snippets = {
    python: {
      title: "Python 3 (Odoo ERP Action / Requests)",
      filename: "odoo_whatsapp_connector.py",
      code: `import requests

API_URL = "https://whatsapp.sandslab.com/api/odoo_webhook.php"
API_KEY = "${apiKey}"

def send_odoo_invoice_whatsapp(partner_phone, partner_name, invoice_num, amount_bhd, date_str, pdf_url=None):
    payload = {
        "model": "account.move",
        "record_name": invoice_num,
        "partner_name": partner_name,
        "partner_phone": partner_phone,
        "amount": amount_bhd,
        "currency": "BHD",
        "date": date_str,
        "template_name": "offer_sandslab",
        "pdf_url": pdf_url
    }
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY
    }
    response = requests.post(API_URL, json=payload, headers=headers, timeout=12)
    return response.json()`
    },
    php: {
      title: "PHP 7.4+ / 8.x (cURL Native)",
      filename: "odoo_sender.php",
      code: `<?php
function sendOdooWhatsApp($phone, $name, $invNum, $amount, $date, $apiKey = '${apiKey}') {
    $ch = curl_init('https://whatsapp.sandslab.com/api/odoo_webhook.php');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode([
            'model' => 'account.move',
            'record_name' => $invNum,
            'partner_name' => $name,
            'partner_phone' => $phone,
            'amount' => $amount,
            'currency' => 'BHD',
            'date' => $date,
            'template_name' => 'offer_sandslab'
        ]),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'X-API-Key: ' . $apiKey
        ],
        CURLOPT_RETURNTRANSFER => true
    ]);
    $res = curl_exec($ch);
    curl_close($ch);
    return json_decode($res, true);
}`
    },
    curl: {
      title: "cURL (Bash / Terminal CLI)",
      filename: "odoo_trigger.sh",
      code: `curl -X POST "https://whatsapp.sandslab.com/api/odoo_webhook.php" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '{
    "model": "account.move",
    "record_id": 142,
    "record_name": "INV/2026/0142",
    "partner_name": "Ahmed Al-Khalifa",
    "partner_phone": "+97335078079",
    "amount": "345.500",
    "currency": "BHD",
    "date": "13-Oct-2026",
    "template_name": "offer_sandslab"
  }'`
    },
    dotnet: {
      title: ".NET 6/7/8 C# (HttpClient)",
      filename: "OdooWhatsAppClient.cs",
      code: `using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

public class OdooWhatsAppClient
{
    private static readonly HttpClient client = new HttpClient();
    private const string ApiUrl = "https://whatsapp.sandslab.com/api/odoo_webhook.php";
    private const string ApiKey = "${apiKey}";

    public static async Task<string> DispatchOdooInvoiceAsync(string phone, string customerName, string invNum, decimal amount)
    {
        var payload = new
        {
            model = "account.move",
            record_name = invNum,
            partner_name = customerName,
            partner_phone = phone,
            amount = amount.ToString("F3"),
            currency = "BHD",
            template_name = "offer_sandslab"
        };
        var req = new HttpRequestMessage(HttpMethod.Post, ApiUrl);
        req.Headers.Add("X-API-Key", ApiKey);
        req.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var res = await client.SendAsync(req);
        return await res.Content.ReadAsStringAsync();
    }
}`
    },
    node: {
      title: "Node.js / Express (Fetch API)",
      filename: "odoo_sender.js",
      code: `const API_URL = 'https://whatsapp.sandslab.com/api/odoo_webhook.php';
const API_KEY = '${apiKey}';

async function dispatchOdooInvoice({ phone, customerName, invoiceNumber, amount }) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({
      model: 'account.move',
      record_name: invoiceNumber,
      partner_name: customerName,
      partner_phone: phone,
      amount: amount,
      currency: 'BHD',
      template_name: 'offer_sandslab'
    })
  });
  return await res.json();
}`
    }
  };
  const currentSnippet = snippets[activeSnippetLang] || snippets.python;
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "page-header-row" }, /* @__PURE__ */ React.createElement("div", { className: "page-title-group" }, /* @__PURE__ */ React.createElement("h1", null, /* @__PURE__ */ React.createElement("span", null, "\u26A1"), " Odoo ERP Automation & Developer Hub"), /* @__PURE__ */ React.createElement("p", null, "Enterprise Odoo Automated Action Studio, inbound webhook controllers, dynamic PDF streaming, and live bi-directional delivery telemetry.")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "8px", alignItems: "center" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-primary",
      style: { display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 14px", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
      onClick: () => setShowGuideModal(true)
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F4D6}"),
    " Step-by-Step Setup Guide"
  ), /* @__PURE__ */ React.createElement("span", { className: "odoo-code-header-badge" }, /* @__PURE__ */ React.createElement("span", null, "\u25CF"), " Odoo Gateway Active (v2.3.0)"))), /* @__PURE__ */ React.createElement("div", { className: "odoo-subnav-bar" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `odoo-subnav-btn ${hubTab === "studio" ? "active" : ""}`,
      onClick: () => setHubTab("studio")
    },
    /* @__PURE__ */ React.createElement("span", null, "\u26A1"),
    " Automated Action Studio"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `odoo-subnav-btn ${hubTab === "tester" ? "active" : ""}`,
      onClick: () => setHubTab("tester")
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F9EA}"),
    " Webhook Tester & Simulator"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `odoo-subnav-btn ${hubTab === "audit" ? "active" : ""}`,
      onClick: () => setHubTab("audit")
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F4DC}"),
    " Live Odoo Audit Telemetry"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `odoo-subnav-btn ${hubTab === "connectors" ? "active" : ""}`,
      onClick: () => setHubTab("connectors")
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F50C}"),
    " Multi-Platform Connectors"
  )), hubTab === "studio" && /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "minmax(360px, 420px) 1fr", gap: "20px" } }, /* @__PURE__ */ React.createElement("div", { className: "card", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "card-header" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, /* @__PURE__ */ React.createElement("span", null, "\u2699\uFE0F"), " Odoo Automation Configurator")), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontWeight: "700" } }, "1. Target Odoo Business Model"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" } }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `odoo-model-pill ${selectedModel === "account.move" ? "active" : ""}`,
      onClick: () => setSelectedModel("account.move")
    },
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: "20px" } }, "\u{1F4C4}"),
    /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "12.5px", display: "block" } }, "account.move"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11px", color: "var(--text-muted)" } }, "Customer Invoices"))
  ), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `odoo-model-pill ${selectedModel === "sale.order" ? "active" : ""}`,
      onClick: () => setSelectedModel("sale.order")
    },
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: "20px" } }, "\u{1F6D2}"),
    /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "12.5px", display: "block" } }, "sale.order"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11px", color: "var(--text-muted)" } }, "Sales Orders"))
  ), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `odoo-model-pill ${selectedModel === "account.payment" ? "active" : ""}`,
      onClick: () => setSelectedModel("account.payment")
    },
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: "20px" } }, "\u{1F4B3}"),
    /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "12.5px", display: "block" } }, "account.payment"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11px", color: "var(--text-muted)" } }, "Payment Receipts"))
  ), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `odoo-model-pill ${selectedModel === "stock.picking" ? "active" : ""}`,
      onClick: () => setSelectedModel("stock.picking")
    },
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: "20px" } }, "\u{1F69A}"),
    /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "12.5px", display: "block" } }, "stock.picking"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11px", color: "var(--text-muted)" } }, "Delivery Orders"))
  ))), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontWeight: "700" } }, "2. Trigger Event Condition"), /* @__PURE__ */ React.createElement("select", { className: "form-select", value: selectedTrigger, onChange: (e) => setSelectedTrigger(e.target.value) }, selectedModel === "account.move" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("option", { value: "posted" }, "On Invoice Posted / Validated (state == 'posted') [Recommended]"), /* @__PURE__ */ React.createElement("option", { value: "paid" }, "On Payment Completed (payment_state in ('paid', 'in_payment'))"), /* @__PURE__ */ React.createElement("option", { value: "create" }, "On Invoice Creation (Draft Created)")), selectedModel === "sale.order" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("option", { value: "posted" }, "On Sales Order Confirmed (state == 'sale') [Recommended]"), /* @__PURE__ */ React.createElement("option", { value: "sent" }, "On Quotation Sent to Customer (state == 'sent')")), selectedModel === "account.payment" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("option", { value: "posted" }, "On Payment Posted (state == 'posted') [Recommended]")), selectedModel === "stock.picking" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("option", { value: "posted" }, "On Delivery Done / Dispatched (state == 'done') [Recommended]")))), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontWeight: "700" } }, "3. WhatsApp Approved Template"), /* @__PURE__ */ React.createElement("select", { className: "form-select", value: selectedTemplate, onChange: (e) => setSelectedTemplate(e.target.value) }, templatesList.length > 0 ? templatesList.map((t) => /* @__PURE__ */ React.createElement("option", { key: t.id, value: t.template_name }, t.display_title, " (", t.template_name, " \u2022 ", t.category, ")")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("option", { value: "uniglobal_invoice_notification" }, "Invoice Notification with PDF (uniglobal_invoice_notification)"), /* @__PURE__ */ React.createElement("option", { value: "offer_sandslab" }, "SaNDS Lab Special Offer QR (offer_sandslab)"), /* @__PURE__ */ React.createElement("option", { value: "uniglobal_delivery_dispatch" }, "Order Dispatched Status (uniglobal_delivery_dispatch)")))), /* @__PURE__ */ React.createElement("div", { className: "form-group", style: { background: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" } }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontWeight: "700", marginBottom: "8px" } }, "4. Enterprise Automation Features"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "8px" } }, /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12.5px" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      checked: includePdf,
      onChange: (e) => setIncludePdf(e.target.checked)
    }
  ), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("strong", null, "Dynamic PDF Streaming:"), " Auto-generate & attach Odoo QWeb PDF")), /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12.5px" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      checked: logChatter,
      onChange: (e) => setLogChatter(e.target.checked)
    }
  ), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("strong", null, "Odoo Chatter Feedback:"), " Log WhatsApp delivery status in record chatter")), /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12.5px" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      checked: phoneFallback,
      onChange: (e) => setPhoneFallback(e.target.checked)
    }
  ), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("strong", null, "Smart Phone Fallback:"), " Check partner mobile first, then landline/phone")))), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Integration API Key"), /* @__PURE__ */ React.createElement("input", { type: "text", className: "form-input", value: apiKey, onChange: (e) => setApiKey(e.target.value) }))), /* @__PURE__ */ React.createElement("div", { className: "card", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "card-header", style: { flexWrap: "wrap", gap: "8px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "8px" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `btn ${studioLang === "python" ? "btn-primary" : "btn-secondary"}`,
      style: { fontSize: "12px", padding: "6px 14px" },
      onClick: () => setStudioLang("python")
    },
    "\u{1F40D} Python Server Action (Odoo 14 - 18)"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `btn ${studioLang === "webhook" ? "btn-primary" : "btn-secondary"}`,
      style: { fontSize: "12px", padding: "6px 14px" },
      onClick: () => setStudioLang("webhook")
    },
    "\u26A1 Odoo 17/18 Webhook Rule (JSON)"
  )), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn-copy-code",
      onClick: () => {
        const codeToCopy = studioLang === "python" ? generateOdooPythonCode() : generateOdoo17WebhookJson();
        navigator.clipboard.writeText(codeToCopy);
        showToast("Odoo Automation code copied to clipboard!");
      }
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F4CB}"),
    " Copy Code"
  )), /* @__PURE__ */ React.createElement("div", { className: "code-box", style: { minHeight: "440px", maxHeight: "580px", overflowY: "auto" } }, /* @__PURE__ */ React.createElement("div", { className: "code-box-header" }, /* @__PURE__ */ React.createElement("span", null, studioLang === "python" ? "ir.actions.server.py" : "odoo17_webhook_config.json"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11px", color: "#64748B" } }, studioLang === "python" ? 'Paste directly into Odoo Server Action "Python Code" field' : "Odoo 17 / 18 Automation Rule Webhook")), /* @__PURE__ */ React.createElement("pre", { style: { margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", overflowWrap: "anywhere" } }, studioLang === "python" ? generateOdooPythonCode() : generateOdoo17WebhookJson())), /* @__PURE__ */ React.createElement("div", { style: { marginTop: "16px", padding: "14px", background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: "8px" } }, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "13px", color: "#0369A1", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" } }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4D8}"), " How to Setup in Odoo in 30 Seconds:"), /* @__PURE__ */ React.createElement("ol", { style: { fontSize: "12px", color: "#0C4A6E", margin: "0 0 0 18px", lineHeight: "1.6" } }, /* @__PURE__ */ React.createElement("li", null, "In Odoo, activate ", /* @__PURE__ */ React.createElement("strong", null, "Developer Mode"), " (Settings \u2192 General Settings \u2192 Activate the developer mode)."), /* @__PURE__ */ React.createElement("li", null, "Navigate to ", /* @__PURE__ */ React.createElement("strong", null, "Settings \u2192 Technical \u2192 Server Actions"), " (or ", /* @__PURE__ */ React.createElement("em", null, "Automation Rules"), " in Odoo 17/18)."), /* @__PURE__ */ React.createElement("li", null, "Create a new action: Set Model to ", /* @__PURE__ */ React.createElement("strong", null, selectedModel), " and Action To Do to ", /* @__PURE__ */ React.createElement("strong", null, "Execute Python Code"), "."), /* @__PURE__ */ React.createElement("li", null, "Paste the copied script into the ", /* @__PURE__ */ React.createElement("strong", null, "Python Code"), " box and click ", /* @__PURE__ */ React.createElement("strong", null, "Save"), "!"), /* @__PURE__ */ React.createElement("li", null, "Whenever a document matches your trigger event, WhatsApp will dispatch automatically with live chatter logging."))))), hubTab === "tester" && /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "minmax(380px, 460px) 1fr", gap: "20px" } }, /* @__PURE__ */ React.createElement("div", { className: "card", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "card-header" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F9EA}"), " Odoo Inbound Webhook Simulator")), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: "14px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11.5px", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "6px" } }, "Load Quick Simulation Preset:"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "odoo-preset-btn", onClick: () => applyTesterPreset("invoice") }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4C4}"), " Invoice (INV/2026/0142)"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "odoo-preset-btn", onClick: () => applyTesterPreset("order") }, /* @__PURE__ */ React.createElement("span", null, "\u{1F6D2}"), " Sales Order (SO-8821)"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "odoo-preset-btn", onClick: () => applyTesterPreset("payment") }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4B3}"), " Payment (PAY-5510)"))), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Endpoint URL"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "8px" } }, /* @__PURE__ */ React.createElement("span", { className: "badge cat-utility", style: { padding: "8px 12px", fontSize: "12px" } }, "POST"), /* @__PURE__ */ React.createElement("input", { type: "text", className: "form-input", value: endpoint, readOnly: true }))), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "API Key Header (X-API-Key)"), /* @__PURE__ */ React.createElement("input", { type: "text", className: "form-input", value: apiKey, onChange: (e) => setApiKey(e.target.value) })), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" } }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Odoo Model"), /* @__PURE__ */ React.createElement("select", { className: "form-select", value: testModel, onChange: (e) => setTestModel(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "account.move" }, "account.move"), /* @__PURE__ */ React.createElement("option", { value: "sale.order" }, "sale.order"), /* @__PURE__ */ React.createElement("option", { value: "account.payment" }, "account.payment"), /* @__PURE__ */ React.createElement("option", { value: "stock.picking" }, "stock.picking"))), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Document Ref"), /* @__PURE__ */ React.createElement("input", { type: "text", className: "form-input", value: testRecordName, onChange: (e) => setTestRecordName(e.target.value) }))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" } }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Customer Name"), /* @__PURE__ */ React.createElement("input", { type: "text", className: "form-input", value: testPartnerName, onChange: (e) => setTestPartnerName(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Recipient Phone"), /* @__PURE__ */ React.createElement("input", { type: "text", className: "form-input", value: testRecipient, onChange: (e) => setTestRecipient(e.target.value) }))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" } }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Amount"), /* @__PURE__ */ React.createElement("input", { type: "text", className: "form-input", value: testAmount, onChange: (e) => setTestAmount(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Currency"), /* @__PURE__ */ React.createElement("input", { type: "text", className: "form-input", value: testCurrency, onChange: (e) => setTestCurrency(e.target.value) }))), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "WhatsApp Template"), /* @__PURE__ */ React.createElement("select", { className: "form-select", value: testTemplate, onChange: (e) => setTestTemplate(e.target.value) }, templatesList.length > 0 ? templatesList.map((t) => /* @__PURE__ */ React.createElement("option", { key: t.id, value: t.template_name }, t.display_title, " (", t.template_name, ")")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("option", { value: "offer_sandslab" }, "SaNDS Lab Special Offer QR (offer_sandslab)"), /* @__PURE__ */ React.createElement("option", { value: "uniglobal_invoice_notification" }, "Invoice Notification (uniglobal_invoice_notification)")))), /* @__PURE__ */ React.createElement("button", { className: "btn btn-success", style: { width: "100%", padding: "10px" }, onClick: runLiveTest, disabled: loading }, loading ? "Dispatching..." : "\u25B6 Dispatch Simulated Odoo Webhook")), /* @__PURE__ */ React.createElement("div", { className: "card", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "card-header" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4E1}"), " Gateway Real-Time Response"), lastDispatchedId && /* @__PURE__ */ React.createElement("span", { className: "badge status-sent", style: { fontSize: "11px" } }, "Meta Dispatch Verified")), /* @__PURE__ */ React.createElement("div", { className: "code-box", style: { minHeight: "360px", maxHeight: "560px", overflowY: "auto" } }, /* @__PURE__ */ React.createElement("div", { className: "code-box-header" }, /* @__PURE__ */ React.createElement("span", null, "HTTP Response Inspector"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "10.5px", color: "#64748B" } }, "application/json")), /* @__PURE__ */ React.createElement("pre", { style: { margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", overflowWrap: "anywhere" } }, responseOutput || '// Click "Dispatch Simulated Odoo Webhook" to execute live Meta Cloud API integration.')), lastDispatchedId && /* @__PURE__ */ React.createElement("div", { style: { marginTop: "14px", padding: "12px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "12.5px", color: "#166534", display: "block" } }, "Message Successfully Recorded"), /* @__PURE__ */ React.createElement("code", { style: { fontSize: "11.5px", color: "#047857" } }, lastDispatchedId)), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-secondary",
      style: { fontSize: "12px" },
      onClick: () => {
        const el = document.querySelector('button.nav-item[onClick*="logs"]');
        if (el) el.click();
      }
    },
    "View in Message Logs \u2192"
  )))), hubTab === "audit" && /* @__PURE__ */ React.createElement("div", { className: "card", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "card-header" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4DC}"), " Odoo Dispatched Messages Audit"), /* @__PURE__ */ React.createElement("p", { style: { margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" } }, "Real-time log of all WhatsApp messages triggered from Odoo ERP Automated Actions and webhooks.")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-secondary", style: { fontSize: "12px" }, onClick: loadAuditLogs, disabled: loadingAudit }, loadingAudit ? "Refreshing..." : "\u{1F504} Refresh Logs")), /* @__PURE__ */ React.createElement("div", { style: { overflowX: "auto" } }, /* @__PURE__ */ React.createElement("table", { className: "table", style: { width: "100%" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "ID"), /* @__PURE__ */ React.createElement("th", null, "Odoo Model"), /* @__PURE__ */ React.createElement("th", null, "Document Ref"), /* @__PURE__ */ React.createElement("th", null, "Recipient Phone"), /* @__PURE__ */ React.createElement("th", null, "Template"), /* @__PURE__ */ React.createElement("th", null, "Status"), /* @__PURE__ */ React.createElement("th", null, "Cost (BHD)"), /* @__PURE__ */ React.createElement("th", null, "Meta Tracking ID"), /* @__PURE__ */ React.createElement("th", null, "Dispatched At"))), /* @__PURE__ */ React.createElement("tbody", null, auditLogs.length > 0 ? auditLogs.map((log) => /* @__PURE__ */ React.createElement("tr", { key: log.id }, /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("strong", null, "#", log.id)), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: "badge", style: { background: "#E0F2FE", color: "#0369A1" } }, log.odoo_model || "account.move")), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("strong", null, log.odoo_record_name || "INV/2026/0142")), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("code", null, log.to_phone)), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "12px" } }, log.template_name || "N/A")), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: `badge status-${log.status || "sent"}` }, log.status === "read" ? "READ \u2713\u2713" : log.status === "delivered" ? "DELIVERED \u2713\u2713" : log.status === "sent" ? "SENT \u2713" : log.status.toUpperCase())), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("strong", null, parseFloat(log.client_rate_bhd || 0.0185).toFixed(4))), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("code", { style: { fontSize: "11px", maxWidth: "140px", display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, title: log.message_id }, log.message_id)), /* @__PURE__ */ React.createElement("td", { style: { fontSize: "11.5px", color: "var(--text-muted)" } }, log.sent_at || log.created_at))) : /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "9", style: { textAlign: "center", padding: "30px", color: "var(--text-muted)" } }, loadingAudit ? "Loading Odoo message telemetry..." : "No Odoo-triggered messages found yet. Use the Webhook Simulator to dispatch test notifications.")))))), hubTab === "connectors" && /* @__PURE__ */ React.createElement("div", { className: "card", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "card-header", style: { flexWrap: "wrap", gap: "8px" } }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F50C}"), " Multi-Platform Connector Snippets"), /* @__PURE__ */ React.createElement("button", { className: "btn-copy-code", onClick: () => {
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
  )), /* @__PURE__ */ React.createElement("div", { className: "code-box", style: { minHeight: "380px", maxHeight: "560px", overflowY: "auto" } }, /* @__PURE__ */ React.createElement("div", { className: "code-box-header" }, /* @__PURE__ */ React.createElement("span", null, currentSnippet.filename), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "10.5px", color: "#64748B" } }, currentSnippet.title)), /* @__PURE__ */ React.createElement("pre", { style: { margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", overflowWrap: "anywhere" } }, currentSnippet.code))), showGuideModal && /* @__PURE__ */ React.createElement(
    OdooGuideModal,
    {
      onClose: () => setShowGuideModal(false),
      showToast,
      apiKey
    }
  ));
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
  const isSuperadmin = currentUser?.role === "superadmin";
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "Password@123", role: "user", status: "active" });
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [adminNewPassword, setAdminNewPassword] = useState("Password@123");
  const [savingReset, setSavingReset] = useState(false);
  const loadUsers = () => {
    fetch("./api/users.php").then((res) => res.json()).then((res) => {
      if (res.success) {
        const list = isSuperadmin ? res.data : res.data.filter((u) => u.role !== "superadmin");
        setUsers(list);
      }
    });
  };
  useEffect(() => {
    loadUsers();
  }, [currentUser]);
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
        showToast("\u2713 User created successfully");
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
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingEdit(true);
    try {
      const payload = {
        id: editingUser.id,
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        status: editingUser.status
      };
      if (editingUser.password && editingUser.password.trim() !== "") {
        payload.password = editingUser.password.trim();
      }
      const res = await fetch("./api/users.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast("\u2713 User account updated successfully!");
        setEditingUser(null);
        loadUsers();
      } else {
        showToast(data.error || "Failed to update user", "error");
      }
    } catch (err) {
      showToast("Error updating user account", "error");
    } finally {
      setSavingEdit(false);
    }
  };
  const handleToggleStatus = (u, targetStatus) => {
    if (currentUser?.id === u.id) {
      showToast("You cannot suspend your own logged-in account", "error");
      return;
    }
    if (targetStatus === "suspended") {
      setConfirmDialog({
        title: "Suspend User Account?",
        subtitle: `Are you sure you want to suspend account "${u.name}" (${u.email})? They will immediately be prevented from logging into the platform.`,
        icon: "\u23F8\uFE0F",
        badgeClass: "warning",
        confirmText: "Yes, Suspend Account",
        cancelText: "Cancel",
        onConfirm: async () => {
          try {
            const res = await fetch("./api/users.php?action=toggle_status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: u.id, status: "suspended" })
            });
            const data = await res.json();
            if (data.success) {
              showToast(`\u23F8\uFE0F User "${u.name}" has been suspended`);
              loadUsers();
            } else {
              showToast(data.error || "Failed to suspend user", "error");
            }
          } catch (e) {
            showToast("Error suspending user", "error");
          } finally {
            setConfirmDialog(null);
          }
        }
      });
    } else {
      (async () => {
        try {
          const res = await fetch("./api/users.php?action=toggle_status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: u.id, status: "active" })
          });
          const data = await res.json();
          if (data.success) {
            showToast(`\u2713 User "${u.name}" has been activated`);
            loadUsers();
          } else {
            showToast(data.error || "Failed to activate user", "error");
          }
        } catch (e) {
          showToast("Error activating user", "error");
        }
      })();
    }
  };
  const handleAdminResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPasswordUser) return;
    if (!adminNewPassword || adminNewPassword.trim().length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }
    setSavingReset(true);
    try {
      const res = await fetch("./api/users.php?action=reset_password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: resetPasswordUser.id, new_password: adminNewPassword.trim() })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`\u2713 Password reset for "${resetPasswordUser.name}" successfully!`);
        setResetPasswordUser(null);
      } else {
        showToast(data.error || "Failed to reset password", "error");
      }
    } catch (err) {
      showToast("Error resetting password", "error");
    } finally {
      setSavingReset(false);
    }
  };
  const generateRandomPassword = () => {
    const pwd = "Pass@" + Math.floor(1e3 + Math.random() * 9e3) + "!";
    setAdminNewPassword(pwd);
  };
  const copyPassword = (pwd) => {
    if (!pwd) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(pwd).then(() => {
        showToast("\u{1F4CB} Password copied to clipboard");
      }).catch(() => {
        showToast(`Password: ${pwd}`);
      });
    } else {
      showToast(`Password: ${pwd}`);
    }
  };
  const handleDelete = (id) => {
    const targetUser = users.find((u) => u.id === id);
    const userName = targetUser ? `"${targetUser.name}"` : "this user";
    setConfirmDialog({
      title: "Delete User Account?",
      subtitle: `Are you sure you want to permanently delete user account ${userName}? They will no longer be able to log in.`,
      icon: "\u{1F464}",
      badgeClass: "danger",
      confirmText: "Yes, Delete User",
      cancelText: "Cancel",
      onConfirm: async () => {
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
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  };
  const userColumns = [
    {
      key: "name",
      label: "User Name",
      render: (u) => /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px" } }, /* @__PURE__ */ React.createElement("div", { className: "avatar", style: { background: u.avatar_color || "#128C7E" } }, u.name.charAt(0)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", { style: { display: "block", fontSize: "13px" } }, u.name), currentUser?.id === u.id && /* @__PURE__ */ React.createElement("span", { style: { fontSize: "10.5px", color: "var(--wa-teal)", fontWeight: "700" } }, "(Current Session)")))
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
      render: (u) => /* @__PURE__ */ React.createElement("span", { className: `badge ${u.status === "active" ? "status-read" : "status-failed"}` }, u.status === "active" ? "\u2713 ACTIVE" : "\u23F8\uFE0F SUSPENDED")
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
      render: (u) => /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "5px", alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "btn btn-secondary btn-sm",
          title: "Edit user details",
          onClick: () => setEditingUser({ ...u, password: "" })
        },
        "\u270F\uFE0F Edit"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "btn btn-secondary btn-sm",
          title: "Admin Reset Password",
          onClick: () => {
            setResetPasswordUser(u);
            setAdminNewPassword("Password@123");
          }
        },
        "\u{1F511} Reset PW"
      ), currentUser?.id !== u.id && (u.status === "active" ? /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "btn btn-warning btn-sm",
          title: "Suspend user account",
          onClick: () => handleToggleStatus(u, "suspended")
        },
        "\u23F8\uFE0F Suspend"
      ) : /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "btn btn-success btn-sm",
          title: "Activate user account",
          onClick: () => handleToggleStatus(u, "active")
        },
        "\u25B6\uFE0F Activate"
      )), currentUser?.id !== u.id && /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "btn btn-danger-outline btn-sm",
          title: "Delete user",
          onClick: () => handleDelete(u.id)
        },
        "\u{1F5D1}\uFE0F"
      ))
    }
  ];
  const displayedUsers = isSuperadmin ? users : users.filter((u) => u.role !== "superadmin");
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "page-header-row" }, /* @__PURE__ */ React.createElement("div", { className: "page-title-group" }, /* @__PURE__ */ React.createElement("h1", null, /* @__PURE__ */ React.createElement("span", null, "\u{1F465}"), " User Accounts & Role Permissions"), /* @__PURE__ */ React.createElement("p", null, isSuperadmin ? "Manage Superadmin, Admin, and Operations User accounts for platform access." : "Manage Admin and Operations User accounts for platform access.")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => setShowAddModal(true) }, /* @__PURE__ */ React.createElement("span", null, "\u2795"), " Add New User")), /* @__PURE__ */ React.createElement(
    DataTable,
    {
      columns: userColumns,
      data: displayedUsers,
      title: "platform_users",
      searchPlaceholder: "Search users by name, email, role...",
      defaultPageSize: 10,
      pageSizeOptions: [5, 10, 20],
      defaultSortKey: "id",
      defaultSortDir: "desc"
    }
  ), showAddModal && /* @__PURE__ */ React.createElement("div", { className: "modal-overlay", onClick: () => setShowAddModal(false) }, /* @__PURE__ */ React.createElement("div", { className: "modal-content", style: { maxWidth: "480px" }, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-header" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Create New User"), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: () => setShowAddModal(false) }, "\u2715")), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSave }, /* @__PURE__ */ React.createElement("div", { className: "modal-body", style: { padding: "20px" } }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Full Name ", /* @__PURE__ */ React.createElement("span", { style: { color: "#EF4444" } }, "*")), /* @__PURE__ */ React.createElement("input", { type: "text", className: "form-input", value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), required: true })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Email Address ", /* @__PURE__ */ React.createElement("span", { style: { color: "#EF4444" } }, "*")), /* @__PURE__ */ React.createElement("input", { type: "email", className: "form-input", value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }), required: true })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Password ", /* @__PURE__ */ React.createElement("span", { style: { color: "#EF4444" } }, "*")), /* @__PURE__ */ React.createElement("input", { type: "password", className: "form-input", value: form.password, onChange: (e) => setForm({ ...form, password: e.target.value }), required: true, minLength: 6 }), /* @__PURE__ */ React.createElement("span", { className: "form-hint" }, "Default password is Password@123 (min 6 characters)")), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Role"), /* @__PURE__ */ React.createElement("select", { className: "form-select", value: form.role, onChange: (e) => setForm({ ...form, role: e.target.value }) }, isSuperadmin && /* @__PURE__ */ React.createElement("option", { value: "superadmin" }, "Superadmin (Global Platform Owner)"), /* @__PURE__ */ React.createElement("option", { value: "admin" }, "Admin (Full Client Access)"), /* @__PURE__ */ React.createElement("option", { value: "user" }, "User (Standard Access)"))), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Account Status"), /* @__PURE__ */ React.createElement("select", { className: "form-select", value: form.status, onChange: (e) => setForm({ ...form, status: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "active" }, "Active (Access Allowed)"), /* @__PURE__ */ React.createElement("option", { value: "suspended" }, "Suspended (Access Blocked)")))), /* @__PURE__ */ React.createElement("div", { className: "modal-footer", style: { padding: "12px 20px", display: "flex", gap: "8px", justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: () => setShowAddModal(false) }, "Cancel"), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-primary" }, "\u2795 Create User"))))), editingUser && /* @__PURE__ */ React.createElement("div", { className: "modal-overlay", onClick: () => setEditingUser(null) }, /* @__PURE__ */ React.createElement("div", { className: "modal-content", style: { maxWidth: "480px" }, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-header" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "\u270F\uFE0F Edit User: ", editingUser.name), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: () => setEditingUser(null) }, "\u2715")), /* @__PURE__ */ React.createElement("form", { onSubmit: handleUpdateUser }, /* @__PURE__ */ React.createElement("div", { className: "modal-body", style: { padding: "20px" } }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Full Name ", /* @__PURE__ */ React.createElement("span", { style: { color: "#EF4444" } }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      value: editingUser.name,
      onChange: (e) => setEditingUser({ ...editingUser, name: e.target.value }),
      required: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Email Address ", /* @__PURE__ */ React.createElement("span", { style: { color: "#EF4444" } }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "email",
      className: "form-input",
      value: editingUser.email,
      onChange: (e) => setEditingUser({ ...editingUser, email: e.target.value }),
      required: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Assigned Role"), /* @__PURE__ */ React.createElement(
    "select",
    {
      className: "form-select",
      value: editingUser.role,
      onChange: (e) => setEditingUser({ ...editingUser, role: e.target.value })
    },
    isSuperadmin && /* @__PURE__ */ React.createElement("option", { value: "superadmin" }, "Superadmin (Global Platform Owner)"),
    /* @__PURE__ */ React.createElement("option", { value: "admin" }, "Admin (Full Client Access)"),
    /* @__PURE__ */ React.createElement("option", { value: "user" }, "User (Standard Access)")
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Account Status"), /* @__PURE__ */ React.createElement(
    "select",
    {
      className: "form-select",
      value: editingUser.status,
      onChange: (e) => setEditingUser({ ...editingUser, status: e.target.value })
    },
    /* @__PURE__ */ React.createElement("option", { value: "active" }, "Active (Access Allowed)"),
    /* @__PURE__ */ React.createElement("option", { value: "suspended" }, "Suspended (Access Blocked)")
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Set New Password (Optional)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "password",
      className: "form-input",
      placeholder: "Leave blank to keep unchanged",
      value: editingUser.password || "",
      onChange: (e) => setEditingUser({ ...editingUser, password: e.target.value }),
      minLength: 6
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "form-hint" }, "Enter at least 6 characters only if you want to overwrite password."))), /* @__PURE__ */ React.createElement("div", { className: "modal-footer", style: { padding: "12px 20px", display: "flex", gap: "8px", justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: () => setEditingUser(null), disabled: savingEdit }, "Cancel"), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-primary", disabled: savingEdit }, savingEdit ? "Saving..." : "\u{1F4BE} Save Changes"))))), resetPasswordUser && /* @__PURE__ */ React.createElement("div", { className: "modal-overlay", onClick: () => setResetPasswordUser(null) }, /* @__PURE__ */ React.createElement("div", { className: "modal-content", style: { maxWidth: "460px" }, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-header" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "\u{1F511} Reset Password for ", resetPasswordUser.name), /* @__PURE__ */ React.createElement("button", { className: "close-btn", onClick: () => setResetPasswordUser(null) }, "\u2715")), /* @__PURE__ */ React.createElement("form", { onSubmit: handleAdminResetPassword }, /* @__PURE__ */ React.createElement("div", { className: "modal-body", style: { padding: "20px" } }, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: "14px", fontSize: "12.5px", color: "var(--text-secondary)" } }, "User Account: ", /* @__PURE__ */ React.createElement("strong", null, resetPasswordUser.email), " \u2022 Role: ", /* @__PURE__ */ React.createElement("strong", { style: { textTransform: "uppercase" } }, resetPasswordUser.role)), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "New Password ", /* @__PURE__ */ React.createElement("span", { style: { color: "#EF4444" } }, "*")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "8px" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      value: adminNewPassword,
      onChange: (e) => setAdminNewPassword(e.target.value),
      placeholder: "Enter new password (min 6 chars)",
      required: true,
      minLength: 6,
      style: { fontFamily: "monospace", fontWeight: "bold" }
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-secondary btn-sm",
      onClick: generateRandomPassword,
      title: "Generate random password",
      style: { whiteSpace: "nowrap" }
    },
    "\u{1F3B2} Random"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-secondary btn-sm",
      onClick: () => copyPassword(adminNewPassword),
      title: "Copy to clipboard",
      style: { whiteSpace: "nowrap" }
    },
    "\u{1F4CB} Copy"
  ))), /* @__PURE__ */ React.createElement("div", { style: { background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1E40AF", padding: "10px 14px", borderRadius: "8px", fontSize: "12px", marginTop: "14px", lineHeight: "1.5" } }, "\u{1F4A1} ", /* @__PURE__ */ React.createElement("strong", null, "Admin Notice:"), " Once saved, the user must use this new password to sign in. Every user can also update their own password at any time via the ", /* @__PURE__ */ React.createElement("strong", null, "Change Password"), " button in the header.")), /* @__PURE__ */ React.createElement("div", { className: "modal-footer", style: { padding: "12px 20px", display: "flex", gap: "8px", justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-secondary", onClick: () => setResetPasswordUser(null), disabled: savingReset }, "Cancel"), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-primary", disabled: savingReset }, savingReset ? "Resetting..." : "\u{1F511} Reset Password"))))), confirmDialog && /* @__PURE__ */ React.createElement(
    ConfirmDialog,
    {
      isOpen: !!confirmDialog,
      title: confirmDialog.title,
      subtitle: confirmDialog.subtitle,
      icon: confirmDialog.icon,
      badgeClass: confirmDialog.badgeClass,
      confirmText: confirmDialog.confirmText,
      cancelText: confirmDialog.cancelText,
      onClose: () => setConfirmDialog(null),
      onConfirm: confirmDialog.onConfirm
    }
  ));
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
function WalletView({ currentUser, showToast, globalSettings: globalSettings2, onBalanceChange }) {
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
  const curr = walletData.currency || globalSettings2?.system_currency || "BHD";
  const dec = walletData.currency_decimals ?? globalSettings2?.currency_decimals ?? 3;
  const ledgerColumns = [
    {
      key: "created_at",
      label: "Date & Time",
      render: (t) => /* @__PURE__ */ React.createElement("span", { style: { fontSize: "12px", color: "var(--text-secondary)" } }, formatDateTime(t.created_at, globalSettings2?.system_date_format))
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
function SettingsView({ currentUser, showToast, onSettingsChange }) {
  const isSuperadmin = !currentUser || currentUser.role === "superadmin";
  const [activeSubTab, setActiveSubTab] = useState("branding");
  const fileInputRef = useRef(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [settings, setSettings] = useState({
    company_name: "UniGlobal Consultancy W.L.L",
    company_logo: "./assets/logos/SaNDSLab-LogoNewUpdated.png",
    business_display_name: "UniGlobal Consultancy W.L.L",
    business_phone_number: "+973 1700 8899",
    billing_model: "per_message",
    meta_phone_number_id: "",
    meta_waba_account_id: "",
    meta_access_token: "",
    webhook_verify_token: "",
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
        setSettings((prev) => ({
          ...prev,
          ...res.settings,
          company_name: res.settings.company_name || res.settings.business_display_name || prev.company_name,
          company_logo: res.settings.company_logo || prev.company_logo
        }));
      }
    });
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setCurrentTimePreview((/* @__PURE__ */ new Date()).toISOString()), 1e3);
    return () => clearInterval(timer);
  }, []);
  const handleLogoUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!isSuperadmin) {
      showToast("Only Superadmin can upload or configure company logo", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Logo file size must be under 5MB", "error");
      return;
    }
    const formData = new FormData();
    formData.append("logo_file", file);
    setUploadingLogo(true);
    try {
      const res = await fetch("./api/settings.php?action=upload_logo", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success && data.logo_url) {
        setSettings((prev) => ({ ...prev, company_logo: data.logo_url }));
        if (onSettingsChange) {
          onSettingsChange({ company_logo: data.logo_url });
        }
        showToast("Company branding logo uploaded and updated successfully!");
      } else {
        showToast(data.error || "Failed to upload company logo", "error");
      }
    } catch (err) {
      showToast("Network error uploading company logo", "error");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
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
        showToast("System configuration & Company Branding updated successfully! Changes are live.");
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
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "page-header-row" }, /* @__PURE__ */ React.createElement("div", { className: "page-title-group" }, /* @__PURE__ */ React.createElement("h1", null, /* @__PURE__ */ React.createElement("span", null, "\u2699\uFE0F"), " Superadmin Platform Engine Configuration"), /* @__PURE__ */ React.createElement("p", null, "Configure Company Branding, Meta Cloud API, message tariffs, GCC/India currencies, prepaid wallet rules, and date formats."))), /* @__PURE__ */ React.createElement("div", { className: "settings-nav-tabs" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `settings-tab-btn ${activeSubTab === "branding" ? "active" : ""}`,
      onClick: () => setActiveSubTab("branding")
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F3E2}"),
    " Company Profile & Branding"
  ), /* @__PURE__ */ React.createElement(
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
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `settings-tab-btn ${activeSubTab === "version" ? "active" : ""}`,
      onClick: () => setActiveSubTab("version")
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F3F7}\uFE0F"),
    " Version & Roadmap Architecture"
  )), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSave }, activeSubTab === "branding" && /* @__PURE__ */ React.createElement("div", { className: "card", style: { maxWidth: "950px" } }, !isSuperadmin ? /* @__PURE__ */ React.createElement("div", { style: { background: "#FEF3C7", border: "1.5px solid #FCD34D", borderRadius: "12px", padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "24px" } }, "\u{1F512}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "13.5px", color: "#92400E" } }, "Read-Only Company Profile & Branding"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "#78350F", marginTop: "2px" } }, "The official Company Name and Branding Logo are fixed and configured exclusively by Superadmin. Admin accounts have view-only access across the platform."))) : /* @__PURE__ */ React.createElement("div", { style: { background: "#ECFDF5", border: "1.5px solid #10B981", borderRadius: "12px", padding: "14px 18px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "10px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "24px" } }, "\u{1F3E2}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "14px", color: "#065F46" } }, "Superadmin Master Branding Configuration"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "#047857", marginTop: "2px" } }, "Fix the official Company Name and Logo. Changes reflect in real-time across the top navigation bar, login screen, phone simulators, page title, and receipts."))), /* @__PURE__ */ React.createElement("span", { className: "badge", style: { background: "#10B981", color: "#FFF", fontWeight: "800", padding: "4px 10px", fontSize: "11px" } }, "\u{1F451} Superadmin Exclusive Control")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontWeight: "700", fontSize: "13px" } }, "Company / Organization Name ", /* @__PURE__ */ React.createElement("span", { style: { color: "#EF4444" } }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      value: settings.company_name || "",
      onChange: (e) => isSuperadmin && setSettings({ ...settings, company_name: e.target.value, business_display_name: e.target.value }),
      readOnly: !isSuperadmin,
      disabled: !isSuperadmin,
      placeholder: "e.g. UniGlobal Consultancy W.L.L",
      style: !isSuperadmin ? { background: "#F1F5F9", cursor: "not-allowed", color: "#475569", borderColor: "#CBD5E1" } : { fontWeight: "600" },
      required: true
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "form-hint" }, "Primary company identity displayed across header brand badge, browser tab title, login dialog, and message footers.")), /* @__PURE__ */ React.createElement("div", { className: "form-group", style: { marginTop: "16px" } }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontWeight: "700", fontSize: "13px" } }, "Company Logo"), isSuperadmin && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "file",
      ref: fileInputRef,
      accept: "image/png,image/jpeg,image/svg+xml,image/webp,image/gif",
      onChange: handleLogoUpload,
      style: { display: "none" },
      disabled: uploadingLogo
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-secondary btn-sm",
      onClick: () => fileInputRef.current && fileInputRef.current.click(),
      disabled: uploadingLogo,
      style: { display: "flex", alignItems: "center", gap: "6px", fontWeight: "700" }
    },
    /* @__PURE__ */ React.createElement("span", null, uploadingLogo ? "\u23F3" : "\u{1F4E4}"),
    /* @__PURE__ */ React.createElement("span", null, uploadingLogo ? "Uploading Logo..." : "Upload Image (PNG, JPG, SVG, WEBP)")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-sm",
      style: { background: "#F1F5F9", color: "#475569", border: "1px solid #CBD5E1", fontSize: "11px" },
      onClick: () => setSettings({ ...settings, company_logo: "./assets/logos/SaNDSLab-LogoNewUpdated.png" }),
      title: "Reset to default SaNDS Lab logo"
    },
    "Reset Default"
  )), /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontSize: "11.5px", color: "#64748B", marginTop: "6px" } }, "Logo Image URL / Local Asset Path"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      value: settings.company_logo || "",
      onChange: (e) => isSuperadmin && setSettings({ ...settings, company_logo: e.target.value }),
      readOnly: !isSuperadmin,
      disabled: !isSuperadmin,
      placeholder: "./assets/logos/SaNDSLab-LogoNewUpdated.png",
      style: !isSuperadmin ? { background: "#F1F5F9", cursor: "not-allowed", color: "#475569", borderColor: "#CBD5E1" } : {}
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "form-hint" }, "PNG, SVG, or WEBP with transparent background recommended (Max 5MB).")), /* @__PURE__ */ React.createElement("div", { className: "form-group", style: { marginTop: "16px" } }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontWeight: "700", fontSize: "13px" } }, "Business Contact Phone Number"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      value: settings.business_phone_number || "",
      onChange: (e) => setSettings({ ...settings, business_phone_number: e.target.value }),
      placeholder: "+973 1700 8899"
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "form-hint" }, "Official WhatsApp Business contact phone number."))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "13px", fontWeight: "700", color: "#0F172A", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" } }, /* @__PURE__ */ React.createElement("span", null, "\u{1F441}\uFE0F"), " Real-Time Branding Previews"), /* @__PURE__ */ React.createElement("div", { style: { background: "#075E54", borderRadius: "12px", padding: "14px 18px", marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "12px" } }, /* @__PURE__ */ React.createElement(
    "img",
    {
      src: settings.company_logo || "./assets/logos/SaNDSLab-LogoNewUpdated.png",
      alt: "Brand Preview",
      style: { maxHeight: "36px", maxWidth: "140px", objectFit: "contain", background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "6px" },
      onError: (e) => {
        e.target.onerror = null;
        e.target.src = "./assets/logos/SaNDSLab-LogoNewUpdated.png";
      }
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { background: "rgba(255,255,255,0.15)", color: "#FFF", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" } }, /* @__PURE__ */ React.createElement("span", { style: { width: "6px", height: "6px", borderRadius: "50%", background: "#25D366" } }), /* @__PURE__ */ React.createElement("span", null, settings.company_name || "WhatsApp Gateway"))), /* @__PURE__ */ React.createElement("span", { style: { color: "rgba(255,255,255,0.7)", fontSize: "10.5px" } }, "Header View")), /* @__PURE__ */ React.createElement("div", { style: { background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px", textAlign: "center", marginBottom: "14px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" } }, /* @__PURE__ */ React.createElement(
    "img",
    {
      src: settings.company_logo || "./assets/logos/SaNDSLab-LogoNewUpdated.png",
      alt: "Login Preview",
      style: { maxHeight: "44px", maxWidth: "160px", objectFit: "contain", margin: "0 auto 8px auto", display: "block" },
      onError: (e) => {
        e.target.onerror = null;
        e.target.src = "./assets/logos/SaNDSLab-LogoNewUpdated.png";
      }
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: "800", fontSize: "14px", color: "#0F172A" } }, settings.company_name || "WhatsApp Integration Platform"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "#64748B", marginTop: "2px" } }, "Sign in to manage messaging, templates, and Odoo ERP webhooks"), /* @__PURE__ */ React.createElement("div", { style: { marginTop: "8px", fontSize: "10.5px", color: "#10B981", fontWeight: "700" } }, "\u2713 Login Card Preview")), /* @__PURE__ */ React.createElement("div", { style: { background: "#005D4B", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px", color: "#FFF" } }, /* @__PURE__ */ React.createElement("div", { style: { width: "34px", height: "34px", borderRadius: "50%", background: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" } }, settings.company_logo ? /* @__PURE__ */ React.createElement("img", { src: settings.company_logo, alt: "Handset Avatar", style: { width: "100%", height: "100%", objectFit: "cover" }, onError: (e) => {
    e.target.onerror = null;
    e.target.style.display = "none";
  } }) : /* @__PURE__ */ React.createElement("span", { style: { color: "#005D4B", fontWeight: "800", fontSize: "12px" } }, (settings.company_name || "UG").substring(0, 2).toUpperCase())), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12.5px", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, settings.company_name || "Business Account", " ", /* @__PURE__ */ React.createElement("span", { style: { color: "#25D366" } }, "\u2713")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "10px", color: "rgba(255,255,255,0.75)" } }, "Official Business Account")), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "10px", color: "rgba(255,255,255,0.6)" } }, "Phone Simulator"))))), activeSubTab === "tariffs" && /* @__PURE__ */ React.createElement("div", { className: "card", style: { maxWidth: "950px" } }, !isSuperadmin && /* @__PURE__ */ React.createElement("div", { style: { background: "#FEF3C7", border: "1.5px solid #FCD34D", borderRadius: "12px", padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "24px" } }, "\u{1F512}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "13.5px", color: "#92400E" } }, "Read-Only Official Tariff Schedule"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "#78350F", marginTop: "2px" } }, "WhatsApp Meta base costs, platform margins, and billing engine rules are managed exclusively by SaNDS Lab Superadmin. Admin accounts have view-only access."))), !isSuperadmin && /* @__PURE__ */ React.createElement("div", { style: { background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "14px 18px", marginBottom: "20px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" } }, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "13.5px", color: "#0F172A" } }, "Active Charging Engine Model:"), /* @__PURE__ */ React.createElement("span", { className: "badge", style: { background: settings.billing_model === "24h_session" ? "#DBEAFE" : "#DCFCE7", color: settings.billing_model === "24h_session" ? "#1E40AF" : "#15803D", fontWeight: "700", padding: "5px 12px" } }, settings.billing_model === "24h_session" ? "\u26A1 Option B: Meta 24-Hour Session Billing" : "\u{1F4C4} Option A: Standard Per-Message Billing"))), isSuperadmin && /* @__PURE__ */ React.createElement("div", { style: { background: "#F8FAFC", border: "1.5px solid #0D9488", borderRadius: "12px", padding: "18px", marginBottom: "22px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "18px" } }, "\u26A1"), /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "15px", color: "#0F172A" } }, "WhatsApp Tariff & Charging Engine Model")), /* @__PURE__ */ React.createElement("span", { className: "badge", style: { background: "#CCFBF1", color: "#0F766E", fontWeight: "800", fontSize: "11px", padding: "4px 9px" } }, "\u{1F451} Superadmin Exclusive Rule")), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "12.5px", color: "var(--text-secondary)", margin: "0 0 16px 0", lineHeight: "1.4" } }, "Choose how the platform calculates Meta tariffs and debits client prepaid balances for outgoing messages:"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "14px" } }, /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: () => setSettings({ ...settings, billing_model: "per_message" }),
      style: {
        border: settings.billing_model === "per_message" || !settings.billing_model ? "2px solid #10B981" : "1px solid #E2E8F0",
        background: settings.billing_model === "per_message" || !settings.billing_model ? "#FFFFFF" : "#F8FAFC",
        borderRadius: "10px",
        padding: "14px",
        cursor: "pointer",
        boxShadow: settings.billing_model === "per_message" || !settings.billing_model ? "0 4px 12px rgba(16, 185, 129, 0.15)" : "none",
        transition: "all 0.2s ease"
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "radio",
        name: "billing_model",
        value: "per_message",
        checked: settings.billing_model === "per_message" || !settings.billing_model,
        onChange: () => setSettings({ ...settings, billing_model: "per_message" }),
        style: { width: "16px", height: "16px", accentColor: "#10B981", cursor: "pointer" }
      }
    ), /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "13.5px", color: "#0F172A" } }, "Option A: Standard Per-Message Billing")),
    /* @__PURE__ */ React.createElement("p", { style: { fontSize: "12px", color: "var(--text-secondary)", margin: "4px 0 0 26px", lineHeight: "1.4" } }, "Every single outgoing message debits the full ", /* @__PURE__ */ React.createElement("strong", null, "Meta Base Cost + Platform Margin"), "."),
    /* @__PURE__ */ React.createElement("div", { style: { margin: "8px 0 0 26px", fontSize: "11px", color: "#059669", fontWeight: "700" } }, "\u2713 Standard SaaS / Reseller model (Maximum platform margin).")
  ), /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: () => setSettings({ ...settings, billing_model: "24h_session" }),
      style: {
        border: settings.billing_model === "24h_session" ? "2px solid #3B82F6" : "1px solid #E2E8F0",
        background: settings.billing_model === "24h_session" ? "#FFFFFF" : "#F8FAFC",
        borderRadius: "10px",
        padding: "14px",
        cursor: "pointer",
        boxShadow: settings.billing_model === "24h_session" ? "0 4px 12px rgba(59, 130, 246, 0.15)" : "none",
        transition: "all 0.2s ease"
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "radio",
        name: "billing_model",
        value: "24h_session",
        checked: settings.billing_model === "24h_session",
        onChange: () => setSettings({ ...settings, billing_model: "24h_session" }),
        style: { width: "16px", height: "16px", accentColor: "#3B82F6", cursor: "pointer" }
      }
    ), /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "13.5px", color: "#0F172A" } }, "Option B: Meta 24-Hour Session Billing")),
    /* @__PURE__ */ React.createElement("p", { style: { fontSize: "12px", color: "var(--text-secondary)", margin: "4px 0 0 26px", lineHeight: "1.4" } }, /* @__PURE__ */ React.createElement("strong", null, "1st Message:"), " Opens a 24h window (Full Meta Cost + Platform Margin).", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("strong", null, "Subsequent Messages in 24h:"), " Meta Cost is waived (", /* @__PURE__ */ React.createElement("strong", null, "0.0000 ", curr), ") and only Platform Margin is debited."),
    /* @__PURE__ */ React.createElement("div", { style: { margin: "8px 0 0 26px", fontSize: "11px", color: "#2563EB", fontWeight: "700" } }, "\u2713 Official Meta Conversation Window Alignment.")
  ))), /* @__PURE__ */ React.createElement("h3", { style: { fontSize: "15px", fontWeight: "800", color: "var(--wa-dark-teal)", marginBottom: "8px" } }, "Dynamic Meta Cost & Platform Charges per Category"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "12.5px", color: "var(--text-secondary)", marginBottom: "18px" } }, isSuperadmin ? "Configure the exact Meta Cost and SaNDS Platform Margin per message category. These tariffs take effect dynamically across all outgoing message dispatches, wallet debits, and client billing." : "Current official Meta Cost and Platform Charges per message category for outgoing dispatches."), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "16px" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "14px", color: "#0F172A" } }, "\u{1F4C4} UTILITY (Invoices, Receipts, Notices)"), /* @__PURE__ */ React.createElement("span", { className: "badge cat-util" }, "UTILITY")), /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontSize: "11.5px" } }, "Meta Base Cost (", curr, ")"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.0001",
      className: "form-input",
      value: settings.tariff_utility_meta,
      onChange: (e) => isSuperadmin && setSettings({ ...settings, tariff_utility_meta: e.target.value }),
      readOnly: !isSuperadmin,
      disabled: !isSuperadmin,
      style: !isSuperadmin ? { background: "#F1F5F9", cursor: "not-allowed", color: "#475569", borderColor: "#CBD5E1" } : {},
      required: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontSize: "11.5px" } }, "Platform Margin (", curr, ")"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.0001",
      className: "form-input",
      value: settings.tariff_utility_platform,
      onChange: (e) => isSuperadmin && setSettings({ ...settings, tariff_utility_platform: e.target.value }),
      readOnly: !isSuperadmin,
      disabled: !isSuperadmin,
      style: !isSuperadmin ? { background: "#F1F5F9", cursor: "not-allowed", color: "#475569", borderColor: "#CBD5E1" } : {},
      required: true
    }
  ))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: "10px", fontSize: "12px", color: "#0369A1", fontWeight: "700" } }, "Total Client Rate: ", (parseFloat(settings.tariff_utility_meta || 0) + parseFloat(settings.tariff_utility_platform || 0)).toFixed(dec), " ", curr)), /* @__PURE__ */ React.createElement("div", { style: { background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "14px", color: "#0F172A" } }, "\u{1F510} AUTHENTICATION (OTP, 2FA, Logins)"), /* @__PURE__ */ React.createElement("span", { className: "badge cat-auth" }, "AUTH")), /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontSize: "11.5px" } }, "Meta Base Cost (", curr, ")"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.0001",
      className: "form-input",
      value: settings.tariff_auth_meta,
      onChange: (e) => isSuperadmin && setSettings({ ...settings, tariff_auth_meta: e.target.value }),
      readOnly: !isSuperadmin,
      disabled: !isSuperadmin,
      style: !isSuperadmin ? { background: "#F1F5F9", cursor: "not-allowed", color: "#475569", borderColor: "#CBD5E1" } : {},
      required: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontSize: "11.5px" } }, "Platform Margin (", curr, ")"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.0001",
      className: "form-input",
      value: settings.tariff_auth_platform,
      onChange: (e) => isSuperadmin && setSettings({ ...settings, tariff_auth_platform: e.target.value }),
      readOnly: !isSuperadmin,
      disabled: !isSuperadmin,
      style: !isSuperadmin ? { background: "#F1F5F9", cursor: "not-allowed", color: "#475569", borderColor: "#CBD5E1" } : {},
      required: true
    }
  ))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: "10px", fontSize: "12px", color: "#0369A1", fontWeight: "700" } }, "Total Client Rate: ", (parseFloat(settings.tariff_auth_meta || 0) + parseFloat(settings.tariff_auth_platform || 0)).toFixed(dec), " ", curr)), /* @__PURE__ */ React.createElement("div", { style: { background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "14px", color: "#0F172A" } }, "\u{1F4E3} MARKETING (Promotions, Discounts, Offers)"), /* @__PURE__ */ React.createElement("span", { className: "badge cat-mark" }, "MARKETING")), /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontSize: "11.5px" } }, "Meta Base Cost (", curr, ")"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.0001",
      className: "form-input",
      value: settings.tariff_marketing_meta,
      onChange: (e) => isSuperadmin && setSettings({ ...settings, tariff_marketing_meta: e.target.value }),
      readOnly: !isSuperadmin,
      disabled: !isSuperadmin,
      style: !isSuperadmin ? { background: "#F1F5F9", cursor: "not-allowed", color: "#475569", borderColor: "#CBD5E1" } : {},
      required: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontSize: "11.5px" } }, "Platform Margin (", curr, ")"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.0001",
      className: "form-input",
      value: settings.tariff_marketing_platform,
      onChange: (e) => isSuperadmin && setSettings({ ...settings, tariff_marketing_platform: e.target.value }),
      readOnly: !isSuperadmin,
      disabled: !isSuperadmin,
      style: !isSuperadmin ? { background: "#F1F5F9", cursor: "not-allowed", color: "#475569", borderColor: "#CBD5E1" } : {},
      required: true
    }
  ))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: "10px", fontSize: "12px", color: "#0369A1", fontWeight: "700" } }, "Total Client Rate: ", (parseFloat(settings.tariff_marketing_meta || 0) + parseFloat(settings.tariff_marketing_platform || 0)).toFixed(dec), " ", curr)), /* @__PURE__ */ React.createElement("div", { style: { background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "14px", color: "#0F172A" } }, "\u{1F4AC} SERVICE (Customer Support, Live Chat)"), /* @__PURE__ */ React.createElement("span", { className: "badge cat-serv" }, "SERVICE")), /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontSize: "11.5px" } }, "Meta Base Cost (", curr, ")"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.0001",
      className: "form-input",
      value: settings.tariff_service_meta,
      onChange: (e) => isSuperadmin && setSettings({ ...settings, tariff_service_meta: e.target.value }),
      readOnly: !isSuperadmin,
      disabled: !isSuperadmin,
      style: !isSuperadmin ? { background: "#F1F5F9", cursor: "not-allowed", color: "#475569", borderColor: "#CBD5E1" } : {},
      required: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { className: "form-label", style: { fontSize: "11.5px" } }, "Platform Margin (", curr, ")"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.0001",
      className: "form-input",
      value: settings.tariff_service_platform,
      onChange: (e) => isSuperadmin && setSettings({ ...settings, tariff_service_platform: e.target.value }),
      readOnly: !isSuperadmin,
      disabled: !isSuperadmin,
      style: !isSuperadmin ? { background: "#F1F5F9", cursor: "not-allowed", color: "#475569", borderColor: "#CBD5E1" } : {},
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
  )), /* @__PURE__ */ React.createElement("div", { style: { background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "10px", padding: "14px", marginTop: "16px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11.5px", color: "#166534", fontWeight: "700", textTransform: "uppercase" } }, "Live Format Preview"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "18px", fontWeight: "800", color: "#15803D", marginTop: "4px" } }, formatDateTime(currentTimePreview, settings.system_date_format)))), activeSubTab === "meta" && /* @__PURE__ */ React.createElement("div", { className: "card", style: { maxWidth: "850px" } }, !isSuperadmin && /* @__PURE__ */ React.createElement("div", { style: { background: "#FEF3C7", border: "1.5px solid #FCD34D", borderRadius: "12px", padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "24px" } }, "\u{1F512}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "13.5px", color: "#92400E" } }, "Read-Only Meta Cloud API Credentials"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "#78350F", marginTop: "2px" } }, "WhatsApp Business Cloud API tokens, Phone ID, WABA Account ID, and Webhook verification tokens are managed exclusively by SaNDS Lab Superadmin. Admin accounts have view-only access."))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" } }, /* @__PURE__ */ React.createElement("h3", { style: { fontSize: "15px", fontWeight: "800", color: "var(--wa-dark-teal)", margin: 0 } }, "Meta WhatsApp Business Cloud API Credentials"), isSuperadmin && /* @__PURE__ */ React.createElement("span", { className: "badge", style: { background: "#CCFBF1", color: "#0F766E", fontWeight: "800", fontSize: "11px", padding: "4px 9px" } }, "\u{1F451} Superadmin Managed")), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "12.5px", color: "var(--text-secondary)", marginBottom: "18px" } }, isSuperadmin ? "Permanent System User Graph API access tokens and Webhook validation tokens for Meta WhatsApp Cloud API v19.0." : "Active Meta WhatsApp Cloud API credentials currently operating this platform."), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Meta Phone Number ID"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      value: settings.meta_phone_number_id,
      onChange: (e) => isSuperadmin && setSettings({ ...settings, meta_phone_number_id: e.target.value }),
      readOnly: !isSuperadmin,
      disabled: !isSuperadmin,
      style: !isSuperadmin ? { background: "#F1F5F9", cursor: "not-allowed", color: "#475569", borderColor: "#CBD5E1" } : {}
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "WhatsApp Business Account ID (WABA)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      value: settings.meta_waba_account_id,
      onChange: (e) => isSuperadmin && setSettings({ ...settings, meta_waba_account_id: e.target.value }),
      readOnly: !isSuperadmin,
      disabled: !isSuperadmin,
      style: !isSuperadmin ? { background: "#F1F5F9", cursor: "not-allowed", color: "#475569", borderColor: "#CBD5E1" } : {}
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Permanent System User Access Token (Graph API)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "password",
      className: "form-input",
      value: settings.meta_access_token,
      onChange: (e) => isSuperadmin && setSettings({ ...settings, meta_access_token: e.target.value }),
      readOnly: !isSuperadmin,
      disabled: !isSuperadmin,
      style: !isSuperadmin ? { background: "#F1F5F9", cursor: "not-allowed", color: "#475569", borderColor: "#CBD5E1" } : {}
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "form-hint" }, isSuperadmin ? "Active system token connected to WhatsApp Business Cloud API." : "System token is securely managed by Superadmin.")), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Webhook Verification Secret Token"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      value: settings.webhook_verify_token,
      onChange: (e) => isSuperadmin && setSettings({ ...settings, webhook_verify_token: e.target.value }),
      readOnly: !isSuperadmin,
      disabled: !isSuperadmin,
      style: !isSuperadmin ? { background: "#F1F5F9", cursor: "not-allowed", color: "#475569", borderColor: "#CBD5E1" } : {}
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "form-hint" }, "Paste this token into Meta Developer App Dashboard Webhook settings."))), activeSubTab === "version" && /* @__PURE__ */ React.createElement("div", { className: "card", style: { maxWidth: "950px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { style: { fontSize: "16px", fontWeight: "800", color: "var(--wa-dark-teal)", margin: 0 } }, "WhatsApp Platform \u2014 Version & Release Architecture"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "12.5px", color: "var(--text-secondary)", margin: "4px 0 0 0" } }, "Permanent specification of active Version 2.0 generation, locked Version 1.0 baseline, and Minor version handling.")), /* @__PURE__ */ React.createElement("span", { className: "version-chip", style: { background: "#DCFCE7", color: "#166534", border: "1px solid #BBF7D0", padding: "6px 14px", fontSize: "12px" } }, "Active: v2.5.0")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "12px", padding: "18px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" } }, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "14.5px", color: "#15803D" } }, "\u26A1 Active Release: Version 2.5.0 (Production Live)"), /* @__PURE__ */ React.createElement("span", { className: "badge", style: { background: "#16A34A", color: "#FFFFFF" } }, "LIVE & ACTIVE")), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "12.5px", color: "#166534", margin: "0 0 8px 0", lineHeight: "1.5" } }, "Enterprise User Security (Edit, Suspend, Password Reset) and SaNDS Lab Application Key Licensing Engine with offline asymmetric RSA-SHA256 verification are live. All scheduled Version 2.0 roadmap milestones are officially completed and deployed in production."), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11.5px", color: "#15803D", fontWeight: "600" } }, "Git Branch: ", /* @__PURE__ */ React.createElement("code", null, "main"), " \u2022 Target Host: ", /* @__PURE__ */ React.createElement("code", null, "https://whatsapp.sandslab.com"))), /* @__PURE__ */ React.createElement("div", { style: { background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "12px", padding: "18px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" } }, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "14.5px", color: "#15803D" } }, "\u{1F512} Locked Baseline Milestone: Version 1.0.0"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "6px" } }, /* @__PURE__ */ React.createElement("span", { className: "badge", style: { background: "#16A34A", color: "#FFFFFF" } }, "TAG: v1.0.0"), /* @__PURE__ */ React.createElement("span", { className: "badge", style: { background: "#16A34A", color: "#FFFFFF" } }, "TAG: v1.0"))), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "12px", color: "#166534", margin: "0 0 10px 0", lineHeight: "1.4" } }, /* @__PURE__ */ React.createElement("strong", null, "Commit Hash:"), " ", /* @__PURE__ */ React.createElement("code", null, "9dd6ebc"), " \u2022 Permanent Git checkpoint. Fully tested, production-ready, and verified."), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "8px", fontSize: "12px", color: "#14532D" } }, /* @__PURE__ */ React.createElement("div", null, "\u2713 Superadmin RBAC Security Restrictions"), /* @__PURE__ */ React.createElement("div", null, "\u2713 Dual Charging Engine (Option A vs B)"), /* @__PURE__ */ React.createElement("div", null, "\u2713 Meta WhatsApp Cloud API v19.0 Dispatch"), /* @__PURE__ */ React.createElement("div", null, "\u2713 Multi-Language Odoo API Hub"), /* @__PURE__ */ React.createElement("div", null, "\u2713 Prepaid Wallet & BHD 3-Dec Audit Ledger"), /* @__PURE__ */ React.createElement("div", null, "\u2713 Enterprise DataTables (DESC Sort)"))), /* @__PURE__ */ React.createElement("div", { style: { background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "18px" } }, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "13.5px", color: "#0F172A", display: "block", marginBottom: "8px" } }, "\u{1F4D0} Semantic Minor Versioning (SemVer 2.0.0) Protocol"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" } }, "Every new update from now onward must be versioned according to standard semantic versioning rules:"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "12px" } }, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "12.5px", color: "#2563EB" } }, "v2.0.0 (MAJOR)"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "#64748B", marginTop: "4px" } }, "Major architecture shift & foundational framework upgrades.")), /* @__PURE__ */ React.createElement("div", { style: { background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "12px" } }, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "12.5px", color: "#059669" } }, "v2.x.0 (MINOR)"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "#64748B", marginTop: "4px" } }, "Scheduled roadmap feature milestones (v2.1 Live Chat, v2.2 Campaigns, v2.3 Odoo, v2.4 Templates, v2.5 License).")), /* @__PURE__ */ React.createElement("div", { style: { background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "12px" } }, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "12.5px", color: "#D97706" } }, "v2.x.y (PATCH)"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "#64748B", marginTop: "4px" } }, "Targeted bug fixes, security patches, styling polish, or urgent hotfixes.")))), /* @__PURE__ */ React.createElement("div", { style: { background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "18px" } }, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "13.5px", color: "#0F172A", display: "block", marginBottom: "12px" } }, "\u{1F4CB} Version 2.0 Execution Roadmap (All Milestones Completed & Production Live \u2705)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "10px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 14px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "8px" } }, /* @__PURE__ */ React.createElement("span", { className: "badge", style: { background: "#16A34A", color: "#FFFFFF", marginTop: "2px" } }, "v2.1.0"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "12.5px", color: "#15803D" } }, "1. Inbound Live Chat & Two-Way Agent Inbox (Completed & Released \u2705)"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11.5px", color: "#166534", marginTop: "2px" } }, "Interactive two-way chat window, Meta 24-hour customer care session window tracking, canned replies, and simulated inbound testing."))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 14px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "8px" } }, /* @__PURE__ */ React.createElement("span", { className: "badge", style: { background: "#16A34A", color: "#FFFFFF", marginTop: "2px" } }, "v2.2.0"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "12.5px", color: "#15803D" } }, "2. Bulk Campaign Broadcasts & Queue Pacing (Completed & Released \u2705)"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11.5px", color: "#166534", marginTop: "2px" } }, "CSV contact upload with dynamic variable mapping, anti-spam dispatch queue pacing (50 msgs/min), and live animated monitor."))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 14px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "8px" } }, /* @__PURE__ */ React.createElement("span", { className: "badge", style: { background: "#16A34A", color: "#FFFFFF", marginTop: "2px" } }, "v2.3.0"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "12.5px", color: "#15803D" } }, "3. Odoo ERP Automated Action Webhook & Model Sync (Completed & Released \u2705)"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11.5px", color: "#166534", marginTop: "2px" } }, "Inbound webhook triggers for automated invoice generation (account.move), sales order confirmations, dynamic PDF attachment streaming, and bi-directional chatter delivery callbacks."))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 14px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "8px" } }, /* @__PURE__ */ React.createElement("span", { className: "badge", style: { background: "#16A34A", color: "#FFFFFF", marginTop: "2px" } }, "v2.4.0"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "12.5px", color: "#15803D" } }, "4. WhatsApp Template Studio & Meta Graph API Live Approval (Completed & Released \u2705)"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11.5px", color: "#166534", marginTop: "2px" } }, "Direct Meta Graph API submission for message templates, curated library of pre-built Meta presets, live handset mockup phone preview, and active/inactive template filtering."))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 14px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "8px" } }, /* @__PURE__ */ React.createElement("span", { className: "badge", style: { background: "#16A34A", color: "#FFFFFF", marginTop: "2px" } }, "v2.5.0"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", { style: { fontSize: "12.5px", color: "#15803D" } }, "5. Enterprise User Security & SaNDS Lab Application Key Licensing (Active & Released \u2705)"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11.5px", color: "#166534", marginTop: "2px" } }, "Admin user edit & suspension controls, self and admin password reset flows, SaNDS Lab Application Key licensing engine with offline asymmetric RSA-SHA256 verification, top header expiry duration pill, and strict lock security protection."))))))), activeSubTab !== "version" && /* @__PURE__ */ React.createElement("div", { style: { marginTop: "20px" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      className: `btn ${isSuperadmin || activeSubTab !== "tariffs" && activeSubTab !== "meta" && activeSubTab !== "branding" ? "btn-primary" : "btn-secondary"}`,
      style: { padding: "10px 24px", fontSize: "14px", fontWeight: "700" },
      disabled: loading || !isSuperadmin && (activeSubTab === "tariffs" || activeSubTab === "meta" || activeSubTab === "branding")
    },
    loading ? "Saving..." : !isSuperadmin && activeSubTab === "branding" ? "\u{1F512} Company Branding Managed by Superadmin (Read Only)" : !isSuperadmin && activeSubTab === "tariffs" ? "\u{1F512} Tariffs Managed by Superadmin (Read Only)" : !isSuperadmin && activeSubTab === "meta" ? "\u{1F512} Meta Credentials Managed by Superadmin (Read Only)" : "\u{1F4BE} Save & Apply System Configuration"
  ))));
}
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(/* @__PURE__ */ React.createElement(App, null));
}

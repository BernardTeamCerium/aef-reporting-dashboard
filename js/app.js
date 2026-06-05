/* =========================================================================
   AEF Digital Marketing Dashboard
   Vanilla JS. Data persists in localStorage. No backend required.
   ========================================================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "aef_marketing_campaigns_v1";
  const fmtMoney = (n) =>
    "$" + (Number(n) || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
  const fmtMoney2 = (n) =>
    "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtNum = (n) => (Number(n) || 0).toLocaleString("en-US");
  const fmtPct = (n) => (Number(n) || 0).toFixed(2) + "%";

  const PALETTE = ["#5b8cff", "#a78bfa", "#34d399", "#fbbf24", "#f87171", "#22d3ee", "#fb923c", "#f472b6"];

  /* ----------------------------- State ----------------------------------- */
  let state = {
    records: [],
    view: "dashboard",
    sortKey: "date",
    sortDir: -1, // -1 desc, 1 asc
    channelFilter: "",
    periodFilter: "",
    search: "",
  };
  let charts = {};

  /* --------------------------- Derived metrics --------------------------- */
  // Compute per-row derived fields (CTR, CPC, CPA, ROAS) from raw inputs.
  function decorate(r) {
    const impressions = +r.impressions || 0;
    const clicks = +r.clicks || 0;
    const spend = +r.spend || 0;
    const conversions = +r.conversions || 0;
    const revenue = +r.revenue || 0;
    return {
      ...r,
      impressions, clicks, spend, conversions, revenue,
      ctr: impressions ? (clicks / impressions) * 100 : 0,
      cpc: clicks ? spend / clicks : 0,
      cpa: conversions ? spend / conversions : 0,
      roas: spend ? revenue / spend : 0,
    };
  }

  /* ------------------------------ Storage -------------------------------- */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      state.records = raw ? JSON.parse(raw) : seedData();
    } catch (e) {
      state.records = [];
    }
    if (!localStorage.getItem(STORAGE_KEY)) save();
  }
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
  }

  // A little sample data so the dashboard isn't blank on first open.
  function seedData() {
    const ch = ["Google Ads", "Facebook", "Instagram", "LinkedIn"];
    const camps = ["Spring Promo", "Brand Awareness", "Lead Gen", "Retargeting"];
    const out = [];
    for (let m = 1; m <= 4; m++) {
      ch.forEach((c, i) => {
        const impressions = 40000 + Math.round(Math.random() * 60000);
        const clicks = Math.round(impressions * (0.01 + Math.random() * 0.03));
        const spend = Math.round(clicks * (0.8 + Math.random() * 2));
        const conversions = Math.round(clicks * (0.03 + Math.random() * 0.07));
        const revenue = Math.round(conversions * (60 + Math.random() * 120));
        out.push({
          id: cryptoId(),
          date: `2026-0${m}-15`,
          campaign: camps[i],
          channel: c,
          impressions, clicks, spend, conversions, revenue,
        });
      });
    }
    return out;
  }

  function cryptoId() {
    return "id-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }

  /* --------------------------- Filtering --------------------------------- */
  function monthKey(dateStr) {
    return (dateStr || "").slice(0, 7); // YYYY-MM
  }

  function filtered() {
    let rows = state.records.map(decorate);
    if (state.channelFilter) rows = rows.filter((r) => r.channel === state.channelFilter);
    if (state.periodFilter) rows = rows.filter((r) => monthKey(r.date) === state.periodFilter);
    if (state.search) {
      const q = state.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.campaign || "").toLowerCase().includes(q) ||
          (r.channel || "").toLowerCase().includes(q)
      );
    }
    return rows;
  }

  /* ------------------------------ Render --------------------------------- */
  function render() {
    populateFilters();
    if (state.view === "dashboard") renderDashboard();
    if (state.view === "campaigns") renderTable();
  }

  function populateFilters() {
    const channels = [...new Set(state.records.map((r) => r.channel).filter(Boolean))].sort();
    const periods = [...new Set(state.records.map((r) => monthKey(r.date)).filter(Boolean))].sort().reverse();

    const cf = document.getElementById("channelFilter");
    const pf = document.getElementById("periodFilter");
    cf.innerHTML = '<option value="">All channels</option>' +
      channels.map((c) => `<option ${c === state.channelFilter ? "selected" : ""}>${esc(c)}</option>`).join("");
    pf.innerHTML = '<option value="">All periods</option>' +
      periods.map((p) => `<option ${p === state.periodFilter ? "selected" : ""}>${esc(p)}</option>`).join("");
  }

  function renderDashboard() {
    const rows = filtered();
    const tot = rows.reduce(
      (a, r) => {
        a.impressions += r.impressions;
        a.clicks += r.clicks;
        a.spend += r.spend;
        a.conversions += r.conversions;
        a.revenue += r.revenue;
        return a;
      },
      { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 }
    );
    const ctr = tot.impressions ? (tot.clicks / tot.impressions) * 100 : 0;
    const cpa = tot.conversions ? tot.spend / tot.conversions : 0;
    const roas = tot.spend ? tot.revenue / tot.spend : 0;

    const kpis = [
      { label: "Total Spend", value: fmtMoney(tot.spend), sub: `${rows.length} records`, accent: "#5b8cff" },
      { label: "Revenue", value: fmtMoney(tot.revenue), sub: `ROAS ${roas.toFixed(2)}×`, accent: "#34d399" },
      { label: "Impressions", value: fmtNum(tot.impressions), sub: `${fmtNum(tot.clicks)} clicks · ${fmtPct(ctr)} CTR`, accent: "#a78bfa" },
      { label: "Conversions", value: fmtNum(tot.conversions), sub: `${fmtMoney2(cpa)} CPA`, accent: "#fbbf24" },
    ];
    document.getElementById("kpiGrid").innerHTML = kpis
      .map(
        (k) => `<div class="kpi" style="--accent:${k.accent}">
          <div class="kpi-label">${k.label}</div>
          <div class="kpi-value">${k.value}</div>
          <div class="kpi-sub">${k.sub}</div>
        </div>`
      )
      .join("");

    renderTrendChart(rows);
    renderChannelChart(rows);
    renderConvChart(rows);
    renderTopRoas(rows);
  }

  function groupBy(rows, keyFn) {
    const map = new Map();
    rows.forEach((r) => {
      const k = keyFn(r);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(r);
    });
    return map;
  }

  function sum(rows, field) {
    return rows.reduce((a, r) => a + (+r[field] || 0), 0);
  }

  function renderTrendChart(rows) {
    const byMonth = groupBy(rows, (r) => monthKey(r.date));
    const labels = [...byMonth.keys()].sort();
    const spend = labels.map((l) => sum(byMonth.get(l), "spend"));
    const revenue = labels.map((l) => sum(byMonth.get(l), "revenue"));
    drawChart("trendChart", "line", {
      labels,
      datasets: [
        { label: "Spend", data: spend, borderColor: "#5b8cff", backgroundColor: "rgba(91,140,255,0.12)", fill: true, tension: 0.35 },
        { label: "Revenue", data: revenue, borderColor: "#34d399", backgroundColor: "rgba(52,211,153,0.12)", fill: true, tension: 0.35 },
      ],
    });
  }

  function renderChannelChart(rows) {
    const byCh = groupBy(rows, (r) => r.channel || "—");
    const labels = [...byCh.keys()];
    const data = labels.map((l) => sum(byCh.get(l), "spend"));
    drawChart("channelChart", "doughnut", {
      labels,
      datasets: [{ data, backgroundColor: PALETTE, borderWidth: 0 }],
    }, { cutout: "62%" });
  }

  function renderConvChart(rows) {
    const byCh = groupBy(rows, (r) => r.channel || "—");
    const labels = [...byCh.keys()];
    const data = labels.map((l) => sum(byCh.get(l), "conversions"));
    drawChart("convChart", "bar", {
      labels,
      datasets: [{ label: "Conversions", data, backgroundColor: "#a78bfa", borderRadius: 6 }],
    });
  }

  function renderTopRoas(rows) {
    const byCamp = groupBy(rows, (r) => r.campaign + " · " + r.channel);
    const items = [...byCamp.entries()]
      .map(([name, rs]) => {
        const s = sum(rs, "spend");
        const rev = sum(rs, "revenue");
        return { name, roas: s ? rev / s : 0 };
      })
      .sort((a, b) => b.roas - a.roas)
      .slice(0, 6);
    const el = document.getElementById("topRoas");
    el.innerHTML = items.length
      ? items
          .map(
            (i) =>
              `<div class="mt-row"><span class="mt-name">${esc(i.name)}</span><span class="mt-val">${i.roas.toFixed(2)}×</span></div>`
          )
          .join("")
      : '<p class="muted">No data.</p>';
  }

  function drawChart(id, type, data, extraOpts = {}) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    if (charts[id]) charts[id].destroy();
    const isPie = type === "doughnut" || type === "pie";
    charts[id] = new Chart(ctx, {
      type,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: isPie || data.datasets.length > 1,
            position: isPie ? "right" : "top",
            labels: { color: "#98a0b6", boxWidth: 12, font: { size: 11 } },
          },
        },
        scales: isPie
          ? {}
          : {
              x: { ticks: { color: "#98a0b6" }, grid: { color: "rgba(255,255,255,0.04)" } },
              y: { ticks: { color: "#98a0b6" }, grid: { color: "rgba(255,255,255,0.04)" } },
            },
        ...extraOpts,
      },
    });
  }

  /* ------------------------------ Table ---------------------------------- */
  function renderTable() {
    const rows = filtered().sort((a, b) => {
      const k = state.sortKey;
      let va = a[k], vb = b[k];
      if (typeof va === "string") { va = va.toLowerCase(); vb = (vb || "").toLowerCase(); }
      if (va < vb) return -1 * state.sortDir;
      if (va > vb) return 1 * state.sortDir;
      return 0;
    });

    const body = document.getElementById("tableBody");
    const empty = document.getElementById("emptyState");
    if (!rows.length) {
      body.innerHTML = "";
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");
    body.innerHTML = rows
      .map(
        (r) => `<tr>
          <td>${esc(r.date)}</td>
          <td>${esc(r.campaign)}</td>
          <td><span class="chip">${esc(r.channel)}</span></td>
          <td class="num">${fmtNum(r.impressions)}</td>
          <td class="num">${fmtNum(r.clicks)}</td>
          <td class="num">${fmtPct(r.ctr)}</td>
          <td class="num">${fmtMoney2(r.spend)}</td>
          <td class="num">${fmtNum(r.conversions)}</td>
          <td class="num">${fmtMoney2(r.cpa)}</td>
          <td class="num">${fmtMoney2(r.revenue)}</td>
          <td class="num">${r.roas.toFixed(2)}×</td>
          <td>
            <div class="row-actions">
              <button class="icon-btn" data-edit="${r.id}" title="Edit">✎</button>
              <button class="icon-btn" data-del="${r.id}" title="Delete">🗑</button>
            </div>
          </td>
        </tr>`
      )
      .join("");
  }

  /* ------------------------------ Modal ---------------------------------- */
  function openModal(record) {
    document.getElementById("modalTitle").textContent = record ? "Edit campaign" : "Add campaign";
    document.getElementById("f_id").value = record ? record.id : "";
    document.getElementById("f_date").value = record ? record.date : new Date().toISOString().slice(0, 10);
    document.getElementById("f_campaign").value = record ? record.campaign : "";
    document.getElementById("f_channel").value = record ? record.channel : "";
    document.getElementById("f_impressions").value = record ? record.impressions : "";
    document.getElementById("f_clicks").value = record ? record.clicks : "";
    document.getElementById("f_spend").value = record ? record.spend : "";
    document.getElementById("f_conversions").value = record ? record.conversions : "";
    document.getElementById("f_revenue").value = record ? record.revenue : "";
    document.getElementById("modalBackdrop").classList.remove("hidden");
  }
  function closeModal() {
    document.getElementById("modalBackdrop").classList.add("hidden");
  }

  function saveForm(e) {
    e.preventDefault();
    const id = document.getElementById("f_id").value;
    const rec = {
      id: id || cryptoId(),
      date: document.getElementById("f_date").value,
      campaign: document.getElementById("f_campaign").value.trim(),
      channel: document.getElementById("f_channel").value.trim(),
      impressions: +document.getElementById("f_impressions").value || 0,
      clicks: +document.getElementById("f_clicks").value || 0,
      spend: +document.getElementById("f_spend").value || 0,
      conversions: +document.getElementById("f_conversions").value || 0,
      revenue: +document.getElementById("f_revenue").value || 0,
    };
    if (id) {
      const idx = state.records.findIndex((r) => r.id === id);
      if (idx >= 0) state.records[idx] = rec;
    } else {
      state.records.push(rec);
    }
    save();
    closeModal();
    render();
    toast(id ? "Campaign updated" : "Campaign added");
  }

  function deleteRecord(id) {
    if (!confirm("Delete this campaign record?")) return;
    state.records = state.records.filter((r) => r.id !== id);
    save();
    render();
    toast("Campaign deleted");
  }

  /* --------------------------- Import / Export --------------------------- */
  // Map many possible header spellings to our internal fields.
  const HEADER_MAP = {
    date: "date", month: "date", period: "date",
    campaign: "campaign", "campaign name": "campaign", name: "campaign",
    channel: "channel", platform: "channel", source: "channel", medium: "channel",
    impressions: "impressions", impr: "impressions", views: "impressions",
    clicks: "clicks",
    spend: "spend", cost: "spend", "ad spend": "spend", budget: "spend",
    conversions: "conversions", conv: "conversions", leads: "conversions", purchases: "conversions",
    revenue: "revenue", sales: "revenue", value: "revenue", "conversion value": "revenue",
  };

  function normalizeHeader(h) {
    const key = String(h || "").trim().toLowerCase();
    return HEADER_MAP[key] || null;
  }

  function normalizeDate(v) {
    if (v == null || v === "") return new Date().toISOString().slice(0, 10);
    // Excel serial date number
    if (typeof v === "number") {
      const d = new Date(Math.round((v - 25569) * 86400 * 1000));
      if (!isNaN(d)) return d.toISOString().slice(0, 10);
    }
    const d = new Date(v);
    if (!isNaN(d)) return d.toISOString().slice(0, 10);
    return String(v);
  }

  function importRows(rawRows) {
    const records = [];
    let skipped = 0;
    rawRows.forEach((raw) => {
      const rec = { id: cryptoId(), date: "", campaign: "", channel: "", impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 };
      let matched = false;
      Object.keys(raw).forEach((col) => {
        const field = normalizeHeader(col);
        if (!field) return;
        matched = true;
        const val = raw[col];
        if (field === "date") rec.date = normalizeDate(val);
        else if (field === "campaign" || field === "channel") rec[field] = String(val == null ? "" : val).trim();
        else rec[field] = parseNumber(val);
      });
      if (!matched || (!rec.campaign && !rec.channel && !rec.spend && !rec.impressions)) {
        skipped++;
        return;
      }
      if (!rec.date) rec.date = new Date().toISOString().slice(0, 10);
      if (!rec.campaign) rec.campaign = "(unnamed)";
      if (!rec.channel) rec.channel = "Other";
      records.push(rec);
    });
    return { records, skipped };
  }

  function parseNumber(v) {
    if (typeof v === "number") return v;
    if (v == null) return 0;
    const n = parseFloat(String(v).replace(/[$,%\s]/g, ""));
    return isNaN(n) ? 0 : n;
  }

  function handleFile(file) {
    const msg = document.getElementById("importMsg");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        if (!json.length) throw new Error("The first sheet appears to be empty.");
        const { records, skipped } = importRows(json);
        if (!records.length) {
          throw new Error("No recognizable columns found. Expected headers like Campaign, Channel, Spend, etc.");
        }
        const replace = document.getElementById("replaceToggle").checked;
        state.records = replace ? records : state.records.concat(records);
        save();
        render();
        msg.className = "import-msg ok";
        msg.textContent = `✓ Imported ${records.length} record${records.length === 1 ? "" : "s"}${skipped ? ` (${skipped} row(s) skipped)` : ""}. ${replace ? "Existing data replaced." : "Appended to existing data."}`;
        toast(`Imported ${records.length} records`);
      } catch (err) {
        msg.className = "import-msg err";
        msg.textContent = "✕ " + err.message;
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function exportCsv() {
    const rows = state.records.map(decorate);
    const headers = ["date", "campaign", "channel", "impressions", "clicks", "ctr", "spend", "cpc", "conversions", "cpa", "revenue", "roas"];
    const lines = [headers.join(",")];
    rows.forEach((r) => {
      lines.push(
        headers
          .map((h) => {
            let v = r[h];
            if (typeof v === "number") v = Math.round(v * 100) / 100;
            const s = String(v == null ? "" : v);
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(",")
      );
    });
    download("aef-campaigns.csv", lines.join("\n"), "text/csv");
  }

  function exportJson() {
    download("aef-campaigns-backup.json", JSON.stringify(state.records, null, 2), "application/json");
  }

  function restoreJson(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arr = JSON.parse(e.target.result);
        if (!Array.isArray(arr)) throw new Error("Invalid backup file.");
        state.records = arr.map((r) => ({ id: r.id || cryptoId(), ...r }));
        save();
        render();
        toast(`Restored ${arr.length} records`);
        const msg = document.getElementById("importMsg");
        msg.className = "import-msg ok";
        msg.textContent = `✓ Restored ${arr.length} records from backup.`;
      } catch (err) {
        toast("Restore failed: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  function downloadTemplate() {
    const headers = "Date,Campaign,Channel,Impressions,Clicks,Spend,Conversions,Revenue";
    const sample = [
      "2026-01-15,Spring Promo,Google Ads,52000,1340,1120,68,5400",
      "2026-01-15,Brand Awareness,Facebook,98000,2100,1850,41,2900",
    ];
    download("aef-campaign-template.csv", [headers, ...sample].join("\n"), "text/csv");
  }

  function download(name, content, mime) {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ------------------------------ Helpers -------------------------------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  let toastTimer;
  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add("hidden"), 2600);
  }

  function switchView(view) {
    state.view = view;
    document.querySelectorAll(".nav-item").forEach((n) => n.classList.toggle("active", n.dataset.view === view));
    document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
    document.getElementById("view-" + view).classList.remove("hidden");
    const titles = {
      dashboard: ["Dashboard", "Overview of your digital marketing performance"],
      campaigns: ["Campaigns", "Every campaign record — add, edit, or remove"],
      import: ["Import / Export", "Upload spreadsheets or back up your data"],
    };
    document.getElementById("viewTitle").textContent = titles[view][0];
    document.getElementById("viewSubtitle").textContent = titles[view][1];
    render();
  }

  /* ------------------------------ Events --------------------------------- */
  function bind() {
    document.querySelectorAll(".nav-item").forEach((n) =>
      n.addEventListener("click", () => switchView(n.dataset.view))
    );

    document.getElementById("addBtn").addEventListener("click", () => openModal(null));
    document.getElementById("emptyAddBtn").addEventListener("click", () => openModal(null));
    document.getElementById("modalClose").addEventListener("click", closeModal);
    document.getElementById("cancelBtn").addEventListener("click", closeModal);
    document.getElementById("campaignForm").addEventListener("submit", saveForm);
    document.getElementById("modalBackdrop").addEventListener("click", (e) => {
      if (e.target.id === "modalBackdrop") closeModal();
    });

    document.getElementById("channelFilter").addEventListener("change", (e) => {
      state.channelFilter = e.target.value; render();
    });
    document.getElementById("periodFilter").addEventListener("change", (e) => {
      state.periodFilter = e.target.value; render();
    });
    document.getElementById("searchInput").addEventListener("input", (e) => {
      state.search = e.target.value; renderTable();
    });

    // Table delegation (edit/delete + sorting)
    document.getElementById("tableBody").addEventListener("click", (e) => {
      const edit = e.target.closest("[data-edit]");
      const del = e.target.closest("[data-del]");
      if (edit) openModal(state.records.find((r) => r.id === edit.dataset.edit));
      if (del) deleteRecord(del.dataset.del);
    });
    document.querySelectorAll("#dataTable th[data-sort]").forEach((th) =>
      th.addEventListener("click", () => {
        const k = th.dataset.sort;
        if (state.sortKey === k) state.sortDir *= -1;
        else { state.sortKey = k; state.sortDir = 1; }
        renderTable();
      })
    );

    // Import
    const dz = document.getElementById("dropzone");
    const fi = document.getElementById("fileInput");
    dz.addEventListener("click", () => fi.click());
    fi.addEventListener("change", (e) => { if (e.target.files[0]) handleFile(e.target.files[0]); fi.value = ""; });
    ["dragover", "dragenter"].forEach((ev) =>
      dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add("drag"); })
    );
    ["dragleave", "drop"].forEach((ev) =>
      dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove("drag"); })
    );
    dz.addEventListener("drop", (e) => { if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });

    document.getElementById("templateBtn").addEventListener("click", downloadTemplate);
    document.getElementById("exportCsvBtn").addEventListener("click", exportCsv);
    document.getElementById("exportJsonBtn").addEventListener("click", exportJson);
    document.getElementById("restoreInput").addEventListener("change", (e) => {
      if (e.target.files[0]) restoreJson(e.target.files[0]);
      e.target.value = "";
    });
    document.getElementById("clearBtn").addEventListener("click", () => {
      if (!confirm("Clear ALL campaign data from this browser? Export a backup first if needed.")) return;
      state.records = [];
      save();
      render();
      toast("All data cleared");
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }

  /* ------------------------------- Init ---------------------------------- */
  load();
  bind();
  switchView("dashboard");
})();

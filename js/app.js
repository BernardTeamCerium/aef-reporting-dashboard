/* =========================================================================
   Allied Elite Financial — Digital Campaign Dashboard
   Vanilla JS. Data persists in localStorage. No backend required.
   Brand: Satoshi + teal/cream palette, light & dark themes.
   ========================================================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "aef_marketing_campaigns_v2";
  const THEME_KEY = "aef_theme";

  /* ----------------------------- Formatting ------------------------------ */
  const money = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);
  const money2 = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
  const num = (n) => new Intl.NumberFormat("en-US").format(Math.round(n || 0));
  const pct = (n) => (Number(n) || 0).toFixed(1) + "%";
  const monthLabel = (key) => { const d = new Date(key + "-01"); return isNaN(d) ? key : d.toLocaleString("en-US", { month: "short", year: "numeric" }); };

  /* ------------------------------- State --------------------------------- */
  let state = {
    records: [],
    sortKey: "date",
    sortDir: -1,
    channelFilter: "",
    periodFilter: "",
    search: "",
  };
  let charts = {};

  /* --------------------------- Derived metrics --------------------------- */
  function decorate(r) {
    const impressions = +r.impressions || 0;
    const clicks = +r.clicks || 0;
    const spend = +r.spend || 0;
    const conversions = +r.conversions || 0;
    const revenue = +r.revenue || 0;
    return {
      ...r, impressions, clicks, spend, conversions, revenue,
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
      if (raw) state.records = JSON.parse(raw);
    } catch (e) { state.records = []; }
  }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records)); }
  function cryptoId() { return "id-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }

  /* ------------------------------- Sample -------------------------------- */
  function sampleData() {
    const ch = ["Google Ads", "Facebook", "Instagram", "LinkedIn"];
    const camps = ["Spring Promo", "Brand Awareness", "Lead Gen", "Retargeting"];
    const out = [];
    let seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let m = 1; m <= 5; m++) {
      ch.forEach((c, i) => {
        const impressions = 40000 + Math.round(rnd() * 70000);
        const clicks = Math.round(impressions * (0.012 + rnd() * 0.03));
        const spend = Math.round(clicks * (0.8 + rnd() * 2.2));
        const conversions = Math.round(clicks * (0.03 + rnd() * 0.07));
        const revenue = Math.round(conversions * (70 + rnd() * 140));
        out.push({ id: cryptoId(), date: `2026-0${m}-15`, campaign: camps[i], channel: c, impressions, clicks, spend, conversions, revenue });
      });
    }
    return out;
  }

  /* ----------------------------- Filtering ------------------------------- */
  const monthKey = (d) => (d || "").slice(0, 7);
  function filtered() {
    let rows = state.records.map(decorate);
    if (state.channelFilter) rows = rows.filter((r) => r.channel === state.channelFilter);
    if (state.periodFilter) rows = rows.filter((r) => monthKey(r.date) === state.periodFilter);
    if (state.search) {
      const q = state.search.toLowerCase();
      rows = rows.filter((r) => (r.campaign || "").toLowerCase().includes(q) || (r.channel || "").toLowerCase().includes(q));
    }
    return rows;
  }
  const sumf = (rows, f) => rows.reduce((a, r) => a + (+r[f] || 0), 0);
  function groupBy(rows, keyFn) {
    const map = new Map();
    rows.forEach((r) => { const k = keyFn(r); if (!map.has(k)) map.set(k, []); map.get(k).push(r); });
    return map;
  }

  /* ------------------------------- Render -------------------------------- */
  function render() {
    populateFilters();
    const rows = filtered();

    document.getElementById("recordsLoaded").textContent = num(state.records.length);
    document.getElementById("channelsLoaded").textContent = new Set(state.records.map((r) => r.channel).filter(Boolean)).size;
    document.getElementById("statusText").textContent = state.records.length
      ? `${state.records.length} record(s) loaded across ${new Set(state.records.map((r) => monthKey(r.date))).size} month(s).`
      : "No campaign data loaded yet.";

    const tot = {
      impressions: sumf(rows, "impressions"), clicks: sumf(rows, "clicks"),
      spend: sumf(rows, "spend"), conversions: sumf(rows, "conversions"), revenue: sumf(rows, "revenue"),
    };
    const ctr = tot.impressions ? (tot.clicks / tot.impressions) * 100 : 0;
    const cpa = tot.conversions ? tot.spend / tot.conversions : 0;
    const roas = tot.spend ? tot.revenue / tot.spend : 0;

    document.getElementById("kpiSpend").textContent = money(tot.spend);
    document.getElementById("kpiRevenue").textContent = money(tot.revenue);
    document.getElementById("kpiRoas").textContent = roas.toFixed(2) + "×";
    document.getElementById("kpiConversions").textContent = num(tot.conversions);
    document.getElementById("kpiCpaNote").textContent = money2(cpa) + " cost per conversion";
    document.getElementById("kpiCtr").textContent = pct(ctr);
    document.getElementById("kpiClicksNote").textContent = num(tot.clicks) + " clicks";

    renderTable(rows);
    drawCharts(rows);
  }

  function populateFilters() {
    const channels = [...new Set(state.records.map((r) => r.channel).filter(Boolean))].sort();
    const periods = [...new Set(state.records.map((r) => monthKey(r.date)).filter(Boolean))].sort().reverse();
    const cf = document.getElementById("channelFilter");
    const pf = document.getElementById("periodFilter");
    cf.innerHTML = '<option value="">All channels</option>' + channels.map((c) => `<option ${c === state.channelFilter ? "selected" : ""}>${esc(c)}</option>`).join("");
    pf.innerHTML = '<option value="">All months</option>' + periods.map((p) => `<option value="${p}" ${p === state.periodFilter ? "selected" : ""}>${monthLabel(p)}</option>`).join("");
  }

  function renderTable(rows) {
    const sorted = [...rows].sort((a, b) => {
      let va = a[state.sortKey], vb = b[state.sortKey];
      if (typeof va === "string") { va = va.toLowerCase(); vb = (vb || "").toLowerCase(); }
      if (va < vb) return -1 * state.sortDir;
      if (va > vb) return 1 * state.sortDir;
      return 0;
    });
    const body = document.getElementById("tableBody");
    if (!sorted.length) {
      body.innerHTML = '<tr><td colspan="12" class="empty">No campaigns yet. Add one manually, upload an Excel/CSV file, or load the sample data.</td></tr>';
      return;
    }
    body.innerHTML = sorted.map((r) => `<tr>
      <td>${esc(r.date)}</td>
      <td>${esc(r.campaign)}</td>
      <td><span class="chip">${esc(r.channel)}</span></td>
      <td class="num">${num(r.impressions)}</td>
      <td class="num">${num(r.clicks)}</td>
      <td class="num">${pct(r.ctr)}</td>
      <td class="num">${money2(r.spend)}</td>
      <td class="num">${num(r.conversions)}</td>
      <td class="num">${money2(r.cpa)}</td>
      <td class="num">${money2(r.revenue)}</td>
      <td class="num">${r.roas.toFixed(2)}×</td>
      <td><div class="row-actions">
        <button class="icon-btn" data-edit="${r.id}" title="Edit">✎</button>
        <button class="icon-btn" data-del="${r.id}" title="Delete">🗑</button>
      </div></td>
    </tr>`).join("");
  }

  /* ------------------------------- Charts -------------------------------- */
  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  // Brand-aligned chart palette: mint -> teal -> blue -> indigo, plus tints.
  const PALETTE = () => [cssVar("--color-success"), cssVar("--color-blue"), cssVar("--color-primary"), cssVar("--color-purple"), cssVar("--color-orange"), "#1AE6A0", "#16BEE6", "#1e2a78"];

  function destroyCharts() { Object.values(charts).forEach((c) => c && c.destroy()); charts = {}; }

  function drawCharts(rows) {
    destroyCharts();
    const tc = cssVar("--color-text-muted");
    const gc = cssVar("--color-divider");
    const primary = cssVar("--color-primary");
    const success = cssVar("--color-success");

    // Trend: spend vs revenue by month
    const byMonth = groupBy(rows, (r) => monthKey(r.date));
    const months = [...byMonth.keys()].sort();
    const spend = months.map((m) => sumf(byMonth.get(m), "spend"));
    const revenue = months.map((m) => sumf(byMonth.get(m), "revenue"));

    const latestRev = revenue[revenue.length - 1];
    const prevRev = revenue.length > 1 ? revenue[revenue.length - 2] : null;
    const badge = document.getElementById("revenueBadge");
    if (latestRev != null && prevRev != null && prevRev !== 0) {
      const change = ((latestRev - prevRev) / prevRev) * 100;
      badge.textContent = `${change >= 0 ? "Up" : "Down"} ${Math.abs(change).toFixed(1)}% MoM`;
    } else badge.textContent = months.length ? "Latest month" : "No data";

    charts.trend = new Chart(document.getElementById("trendChart"), {
      type: "line",
      data: { labels: months.map(monthLabel), datasets: [
        { label: "Spend", data: spend, borderColor: primary, backgroundColor: hexA(primary, .12), fill: true, tension: .32, pointRadius: 3, pointBackgroundColor: primary },
        { label: "Revenue", data: revenue, borderColor: success, backgroundColor: hexA(success, .12), fill: true, tension: .32, pointRadius: 3, pointBackgroundColor: success },
      ] },
      options: baseOpts(tc, gc, { y: { ticks: { color: tc, callback: (v) => money(v) }, grid: { color: gc } } }, true),
    });

    // Spend by channel doughnut
    const byCh = groupBy(rows, (r) => r.channel || "—");
    charts.channel = new Chart(document.getElementById("channelChart"), {
      type: "doughnut",
      data: { labels: [...byCh.keys()], datasets: [{ data: [...byCh.keys()].map((k) => sumf(byCh.get(k), "spend")), backgroundColor: PALETTE(), borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: "62%", plugins: { legend: { position: "right", labels: { color: tc, boxWidth: 12, font: { size: 11 } } }, tooltip: { callbacks: { label: (c) => `${c.label}: ${money2(c.parsed)}` } } } },
    });

    // Conversions (bar) + CTR (line) by month
    const conv = months.map((m) => sumf(byMonth.get(m), "conversions"));
    const ctrByMonth = months.map((m) => { const g = byMonth.get(m); const im = sumf(g, "impressions"); const cl = sumf(g, "clicks"); return im ? +((cl / im) * 100).toFixed(2) : 0; });
    charts.conv = new Chart(document.getElementById("convChart"), {
      data: { labels: months.map(monthLabel), datasets: [
        { type: "bar", label: "Conversions", data: conv, backgroundColor: hexA(cssVar("--color-blue"), .75), borderRadius: 8, yAxisID: "y" },
        { type: "line", label: "CTR", data: ctrByMonth, borderColor: cssVar("--color-orange"), backgroundColor: cssVar("--color-orange"), tension: .28, yAxisID: "y1", pointRadius: 3 },
      ] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: tc } } }, scales: {
        x: { ticks: { color: tc }, grid: { display: false } },
        y: { position: "left", ticks: { color: tc }, grid: { color: gc } },
        y1: { position: "right", ticks: { color: tc, callback: (v) => v + "%" }, grid: { display: false } },
      } },
    });

    // Top campaigns by ROAS
    const byCamp = groupBy(rows, (r) => r.campaign + " · " + r.channel);
    const top = [...byCamp.entries()].map(([name, rs]) => { const s = sumf(rs, "spend"); return { name, roas: s ? sumf(rs, "revenue") / s : 0 }; })
      .sort((a, b) => b.roas - a.roas).slice(0, 8);
    charts.roas = new Chart(document.getElementById("roasChart"), {
      type: "bar",
      data: { labels: top.map((t) => t.name), datasets: [{ label: "ROAS", data: top.map((t) => +t.roas.toFixed(2)), backgroundColor: hexA(cssVar("--color-purple"), .8), borderRadius: 8 }] },
      options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => c.parsed.x.toFixed(2) + "× ROAS" } } }, scales: {
        x: { ticks: { color: tc, callback: (v) => v + "×" }, grid: { color: gc } },
        y: { ticks: { color: tc }, grid: { display: false } },
      } },
    });
  }

  function baseOpts(tc, gc, scaleY, money_tt) {
    return {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: tc } }, tooltip: money_tt ? { callbacks: { label: (c) => `${c.dataset.label}: ${money2(c.parsed.y)}` } } : {} },
      scales: Object.assign({ x: { ticks: { color: tc }, grid: { display: false } } }, scaleY),
    };
  }

  // Convert a hex (or rgb) color to rgba with given alpha; falls back gracefully.
  function hexA(color, a) {
    const c = color.trim();
    if (c.startsWith("#")) {
      const h = c.slice(1);
      const f = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
      const r = parseInt(f.slice(0, 2), 16), g = parseInt(f.slice(2, 4), 16), b = parseInt(f.slice(4, 6), 16);
      return `rgba(${r},${g},${b},${a})`;
    }
    return c;
  }

  /* -------------------------------- Modal -------------------------------- */
  function openModal(record) {
    document.getElementById("modalTitle").textContent = record ? "Edit campaign" : "Add campaign";
    document.getElementById("f_id").value = record ? record.id : "";
    document.getElementById("f_date").value = record ? record.date : new Date().toISOString().slice(0, 10);
    document.getElementById("f_campaign").value = record ? record.campaign : "";
    document.getElementById("f_channel").value = record ? record.channel : "";
    ["impressions", "clicks", "spend", "conversions", "revenue"].forEach((k) => {
      document.getElementById("f_" + k).value = record ? record[k] : "";
    });
    document.getElementById("modalBackdrop").classList.remove("hidden");
  }
  function closeModal() { document.getElementById("modalBackdrop").classList.add("hidden"); }

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
    if (id) { const i = state.records.findIndex((r) => r.id === id); if (i >= 0) state.records[i] = rec; }
    else state.records.push(rec);
    save(); closeModal(); render();
    toast(id ? "Campaign updated" : "Campaign added");
  }

  function deleteRecord(id) {
    if (!confirm("Delete this campaign record?")) return;
    state.records = state.records.filter((r) => r.id !== id);
    save(); render(); toast("Campaign deleted");
  }

  /* --------------------------- Import / Export --------------------------- */
  const HEADER_MAP = {
    date: "date", month: "date", period: "date",
    campaign: "campaign", "campaign name": "campaign", name: "campaign",
    channel: "channel", platform: "channel", source: "channel", medium: "channel",
    impressions: "impressions", impr: "impressions", views: "impressions",
    clicks: "clicks", "link clicks": "clicks",
    spend: "spend", cost: "spend", "ad spend": "spend", "amount spent": "spend", budget: "spend",
    conversions: "conversions", conv: "conversions", leads: "conversions", purchases: "conversions", results: "conversions",
    revenue: "revenue", sales: "revenue", value: "revenue", "conversion value": "revenue", "purchase value": "revenue",
  };
  const normalizeHeader = (h) => HEADER_MAP[String(h || "").trim().toLowerCase()] || null;

  function normalizeDate(v) {
    if (v == null || v === "") return new Date().toISOString().slice(0, 10);
    if (typeof v === "number") { const d = new Date(Math.round((v - 25569) * 86400 * 1000)); if (!isNaN(d)) return d.toISOString().slice(0, 10); }
    const d = new Date(v);
    return isNaN(d) ? String(v) : d.toISOString().slice(0, 10);
  }
  const parseNumber = (v) => { if (typeof v === "number") return v; if (v == null) return 0; const n = parseFloat(String(v).replace(/[$,%\s]/g, "")); return isNaN(n) ? 0 : n; };

  function importRows(rawRows) {
    const records = []; let skipped = 0;
    rawRows.forEach((raw) => {
      const rec = { id: cryptoId(), date: "", campaign: "", channel: "", impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 };
      let matched = false;
      Object.keys(raw).forEach((col) => {
        const field = normalizeHeader(col);
        if (!field) return; matched = true;
        const val = raw[col];
        if (field === "date") rec.date = normalizeDate(val);
        else if (field === "campaign" || field === "channel") rec[field] = String(val == null ? "" : val).trim();
        else rec[field] = parseNumber(val);
      });
      if (!matched || (!rec.campaign && !rec.channel && !rec.spend && !rec.impressions)) { skipped++; return; }
      if (!rec.date) rec.date = new Date().toISOString().slice(0, 10);
      if (!rec.campaign) rec.campaign = "(unnamed)";
      if (!rec.channel) rec.channel = "Other";
      records.push(rec);
    });
    return { records, skipped };
  }

  async function handleFiles(files) {
    let added = 0, skippedTotal = 0, errors = 0;
    for (const file of files) {
      try {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        const { records, skipped } = importRows(json);
        state.records = state.records.concat(records);
        added += records.length; skippedTotal += skipped;
      } catch (e) { errors++; }
    }
    save(); render();
    if (added) toast(`Imported ${added} record(s)${skippedTotal ? `, ${skippedTotal} skipped` : ""}`);
    else toast(errors ? "Could not read file — check the format" : "No recognizable rows found");
  }

  function exportCsv() {
    const rows = state.records.map(decorate);
    const headers = ["date", "campaign", "channel", "impressions", "clicks", "ctr", "spend", "cpc", "conversions", "cpa", "revenue", "roas"];
    const lines = [headers.join(",")];
    rows.forEach((r) => lines.push(headers.map((h) => {
      let v = r[h]; if (typeof v === "number") v = Math.round(v * 100) / 100;
      const s = String(v == null ? "" : v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(",")));
    download("aef-campaigns.csv", lines.join("\n"), "text/csv");
  }

  function downloadTemplate() {
    const headers = "Date,Campaign,Channel,Impressions,Clicks,Spend,Conversions,Revenue";
    const sample = ["2026-01-15,Spring Promo,Google Ads,52000,1340,1120,68,5400", "2026-01-15,Brand Awareness,Facebook,98000,2100,1850,41,2900"];
    download("aef-campaign-template.csv", [headers, ...sample].join("\n"), "text/csv");
  }

  function download(name, content, mime) {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    URL.revokeObjectURL(a.href);
  }

  /* -------------------------------- Theme -------------------------------- */
  function initTheme() {
    let t = localStorage.getItem(THEME_KEY);
    if (!t) t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", t);
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
    render(); // redraw charts with new palette
  }

  /* ------------------------------- Helpers ------------------------------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  let toastTimer;
  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg; t.classList.remove("hidden");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add("hidden"), 2600);
  }

  /* ------------------------------- Events -------------------------------- */
  function bind() {
    document.getElementById("addBtn").addEventListener("click", () => openModal(null));
    document.getElementById("modalClose").addEventListener("click", closeModal);
    document.getElementById("cancelBtn").addEventListener("click", closeModal);
    document.getElementById("campaignForm").addEventListener("submit", saveForm);
    document.getElementById("modalBackdrop").addEventListener("click", (e) => { if (e.target.id === "modalBackdrop") closeModal(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

    document.getElementById("fileInput").addEventListener("change", async (e) => { if (e.target.files.length) await handleFiles([...e.target.files]); e.target.value = ""; });
    document.getElementById("templateBtn").addEventListener("click", downloadTemplate);
    document.getElementById("exportBtn").addEventListener("click", exportCsv);
    document.getElementById("loadSampleBtn").addEventListener("click", () => {
      state.records = state.records.concat(sampleData()); save(); render(); toast("Sample data loaded");
    });
    document.getElementById("clearBtn").addEventListener("click", () => {
      if (!confirm("Clear ALL campaign data from this browser? Export a CSV first if you want a copy.")) return;
      state.records = []; save(); render(); toast("All data cleared");
    });
    document.getElementById("themeBtn").addEventListener("click", toggleTheme);

    document.getElementById("channelFilter").addEventListener("change", (e) => { state.channelFilter = e.target.value; render(); });
    document.getElementById("periodFilter").addEventListener("change", (e) => { state.periodFilter = e.target.value; render(); });
    document.getElementById("searchInput").addEventListener("input", (e) => { state.search = e.target.value; render(); });

    document.getElementById("tableBody").addEventListener("click", (e) => {
      const edit = e.target.closest("[data-edit]"); const del = e.target.closest("[data-del]");
      if (edit) openModal(state.records.find((r) => r.id === edit.dataset.edit));
      if (del) deleteRecord(del.dataset.del);
    });
    document.querySelectorAll("#dataTable th[data-sort]").forEach((th) => th.addEventListener("click", () => {
      const k = th.dataset.sort;
      if (state.sortKey === k) state.sortDir *= -1; else { state.sortKey = k; state.sortDir = 1; }
      render();
    }));
  }

  /* -------------------------------- Init --------------------------------- */
  initTheme();
  load();
  bind();
  if (!state.records.length) state.records = sampleData(); // first-run demo
  render();
})();

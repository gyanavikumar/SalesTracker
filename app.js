const storageKey = "small-business-tracker-v1";

const initialState = {
  orders: [],
  vendors: []
};

let appState = loadState();

const dashboardPage = document.getElementById("dashboard-page");
const statusPage = document.getElementById("status-page");
const vendorsPage = document.getElementById("vendors-page");
const tabDashboard = document.getElementById("tab-dashboard");
const tabStatus = document.getElementById("tab-status");
const tabVendors = document.getElementById("tab-vendors");

const orderForm = document.getElementById("order-form");
const orderClient = document.getElementById("order-client");
const orderPlacedDate = document.getElementById("order-placed-date");
const orderDeliveryDate = document.getElementById("order-delivery-date");
const orderProduct = document.getElementById("order-product");
const orderQty = document.getElementById("order-qty");
const orderSellingPerUnit = document.getElementById("order-selling-per-unit");
const orderCostPerUnit = document.getElementById("order-cost-per-unit");
const orderTotalSelling = document.getElementById("order-total-selling");
const orderTotalCost = document.getElementById("order-total-cost");
const orderProfit = document.getElementById("order-profit");

const vendorForm = document.getElementById("vendor-form");
const vendorName = document.getElementById("vendor-name");
const vendorProduct = document.getElementById("vendor-product");
const vendorContact = document.getElementById("vendor-contact");
const vendorLocation = document.getElementById("vendor-location");
const vendorAddress = document.getElementById("vendor-address");

function loadState() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return structuredClone(initialState);

  try {
    const parsed = JSON.parse(raw);
    return {
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      vendors: Array.isArray(parsed.vendors) ? parsed.vendors : []
    };
  } catch {
    return structuredClone(initialState);
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(appState));
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value);
}

function toNumber(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return parsed;
}

function formatDateDisplay(value) {
  if (!value || value === "-") return "-";

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function switchPage(page) {
  const pages = {
    dashboard: dashboardPage,
    status: statusPage,
    vendors: vendorsPage
  };
  const tabs = {
    dashboard: tabDashboard,
    status: tabStatus,
    vendors: tabVendors
  };

  Object.entries(pages).forEach(([key, section]) => {
    section.classList.toggle("active", key === page);
  });

  Object.entries(tabs).forEach(([key, tab]) => {
    tab.classList.toggle("active", key === page);
  });
}

function setDefaultDates() {
  const today = new Date();
  orderPlacedDate.value = today.toISOString().slice(0, 10);
  const delivery = new Date(today);
  delivery.setDate(delivery.getDate() + 7);
  orderDeliveryDate.value = delivery.toISOString().slice(0, 10);
}

function calculateOrderFormTotals() {
  const qty = Math.max(1, Number.parseInt(orderQty.value, 10) || 1);
  const sellingPerUnit = toNumber(orderSellingPerUnit.value);
  const costPerUnit = toNumber(orderCostPerUnit.value);
  const totalSelling = qty * sellingPerUnit;
  const totalCost = qty * costPerUnit;
  const profit = totalSelling - totalCost;

  orderTotalSelling.value = totalSelling.toFixed(2);
  orderTotalCost.value = totalCost.toFixed(2);
  orderProfit.value = profit.toFixed(2);

  return { qty, sellingPerUnit, costPerUnit, totalSelling, totalCost, profit };
}

function metricsFromOrders() {
  return appState.orders.reduce(
    (summary, order) => {
      const sales = Number(order.sales) || 0;
      const cost = Number(order.cost) || 0;

      summary.totalSales += sales;
      summary.totalProfit += sales - cost;
      summary.totalOrders += 1;
      return summary;
    },
    { totalSales: 0, totalProfit: 0, totalOrders: 0 }
  );
}

function renderMetrics() {
  const metrics = metricsFromOrders();
  document.getElementById("total-sales").textContent = formatMoney(metrics.totalSales);
  document.getElementById("total-orders").textContent = String(metrics.totalOrders);
  document.getElementById("total-profit").textContent = formatMoney(metrics.totalProfit);
}

function renderOrders() {
  const body = document.getElementById("orders-body");
  const empty = document.getElementById("orders-empty");

  body.innerHTML = "";

  const sorted = [...appState.orders].sort((a, b) => {
    const aDate = a.placedDate || a.date || "";
    const bDate = b.placedDate || b.date || "";
    return bDate.localeCompare(aDate);
  });

  sorted.forEach((order) => {
    const row = document.createElement("tr");
    const qty = Number(order.qty) || 0;
    const totalSelling = Number(order.sales) || 0;
    const totalCost = Number(order.cost) || 0;
    const sellingPerUnit =
      order.sellingPerUnit !== undefined
        ? Number(order.sellingPerUnit)
        : qty > 0
          ? totalSelling / qty
          : NaN;
    const costPerUnit =
      order.costPerUnit !== undefined
        ? Number(order.costPerUnit)
        : qty > 0
          ? totalCost / qty
          : NaN;
    const profit = order.profit !== undefined ? Number(order.profit) : totalSelling - totalCost;
    const placedDate = order.placedDate || order.date || "-";
    const deliveryDate = order.deliveryDate || "-";
    const client = order.client || "-";
    const deliveryStatus = order.status === "delivered" ? "delivered" : "pending";
    const deliveryButton =
      deliveryStatus === "delivered"
        ? `<button class="row-delivery-btn to-pending" type="button" data-toggle-delivery-id="${order.id}">Mark Pending</button>`
        : `<button class="row-delivery-btn" type="button" data-toggle-delivery-id="${order.id}">Mark Delivered</button>`;

    row.innerHTML = `
      <td>${escapeHtml(client)}</td>
      <td>${escapeHtml(formatDateDisplay(placedDate))}</td>
      <td>${escapeHtml(formatDateDisplay(deliveryDate))}</td>
      <td>${escapeHtml(order.product)}</td>
      <td>${escapeHtml(String(qty))}</td>
      <td>${Number.isFinite(sellingPerUnit) ? formatMoney(sellingPerUnit) : "-"}</td>
      <td>${Number.isFinite(costPerUnit) ? formatMoney(costPerUnit) : "-"}</td>
      <td>${formatMoney(totalSelling)}</td>
      <td>${formatMoney(totalCost)}</td>
      <td>${formatMoney(profit)}</td>
      <td><span class="status-pill ${deliveryStatus}">${deliveryStatus}</span></td>
      <td>${deliveryButton}</td>
      <td><button class="row-action-btn" type="button" data-order-id="${order.id}">Remove</button></td>
    `;
    body.appendChild(row);
  });

  empty.hidden = appState.orders.length > 0;
}

function renderVendors() {
  const body = document.getElementById("vendors-body");
  const empty = document.getElementById("vendors-empty");

  body.innerHTML = "";

  appState.vendors.forEach((vendor) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(vendor.name)}</td>
      <td>${escapeHtml(vendor.product)}</td>
      <td>${escapeHtml(vendor.contact)}</td>
      <td>${escapeHtml(vendor.location)}</td>
      <td>${escapeHtml(vendor.address)}</td>
      <td><button class="row-action-btn" type="button" data-vendor-id="${vendor.id}">Remove</button></td>
    `;
    body.appendChild(row);
  });

  empty.hidden = appState.vendors.length > 0;
}

function renderOrderStatusPage() {
  const pendingBody = document.getElementById("pending-orders-body");
  const deliveredBody = document.getElementById("delivered-orders-body");
  const pendingEmpty = document.getElementById("pending-empty");
  const deliveredEmpty = document.getElementById("delivered-empty");

  pendingBody.innerHTML = "";
  deliveredBody.innerHTML = "";

  const pendingOrders = appState.orders.filter((order) => (order.status || "pending") !== "delivered");
  const deliveredOrders = appState.orders.filter((order) => order.status === "delivered");

  pendingOrders.forEach((order) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(order.client || "-")}</td>
      <td>${escapeHtml(order.product || "-")}</td>
      <td>${escapeHtml(formatDateDisplay(order.placedDate || order.date || "-"))}</td>
      <td>${escapeHtml(formatDateDisplay(order.deliveryDate || "-"))}</td>
      <td>${formatMoney(Number(order.sales) || 0)}</td>
      <td><button class="row-delivery-btn" type="button" data-toggle-delivery-id="${order.id}">Mark Delivered</button></td>
    `;
    pendingBody.appendChild(row);
  });

  deliveredOrders.forEach((order) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(order.client || "-")}</td>
      <td>${escapeHtml(order.product || "-")}</td>
      <td>${escapeHtml(formatDateDisplay(order.placedDate || order.date || "-"))}</td>
      <td>${escapeHtml(formatDateDisplay(order.deliveryDate || "-"))}</td>
      <td>${formatMoney(Number(order.sales) || 0)}</td>
      <td><button class="row-delivery-btn to-pending" type="button" data-toggle-delivery-id="${order.id}">Mark Pending</button></td>
    `;
    deliveredBody.appendChild(row);
  });

  pendingEmpty.hidden = pendingOrders.length > 0;
  deliveredEmpty.hidden = deliveredOrders.length > 0;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function renderAll() {
  renderMetrics();
  renderOrders();
  renderOrderStatusPage();
  renderVendors();
}

orderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const totals = calculateOrderFormTotals();

  const order = {
    id: makeId(),
    client: orderClient.value.trim(),
    placedDate: orderPlacedDate.value || new Date().toISOString().slice(0, 10),
    deliveryDate: orderDeliveryDate.value || "-",
    product: orderProduct.value.trim(),
    qty: totals.qty,
    sellingPerUnit: totals.sellingPerUnit,
    costPerUnit: totals.costPerUnit,
    sales: totals.totalSelling,
    cost: totals.totalCost,
    profit: totals.profit,
    status: "pending"
  };

  if (!order.client || !order.product) return;

  appState.orders.push(order);
  saveState();
  renderAll();
  orderForm.reset();
  setDefaultDates();
  orderQty.value = "1";
  calculateOrderFormTotals();
});

vendorForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const vendor = {
    id: makeId(),
    name: vendorName.value.trim(),
    product: vendorProduct.value.trim(),
    contact: vendorContact.value.trim(),
    location: vendorLocation.value.trim(),
    address: vendorAddress.value.trim()
  };

  if (!vendor.name || !vendor.product || !vendor.contact || !vendor.location || !vendor.address) return;

  appState.vendors.push(vendor);
  saveState();
  renderVendors();
  vendorForm.reset();
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (target.matches("[data-order-id]")) {
    const orderId = target.getAttribute("data-order-id");
    appState.orders = appState.orders.filter((order) => order.id !== orderId);
    saveState();
    renderAll();
  }

  if (target.matches("[data-toggle-delivery-id]")) {
    const orderId = target.getAttribute("data-toggle-delivery-id");
    appState.orders = appState.orders.map((order) => {
      if (order.id !== orderId) return order;
      const currentStatus = order.status === "delivered" ? "delivered" : "pending";
      const nextStatus = currentStatus === "delivered" ? "pending" : "delivered";
      return { ...order, status: nextStatus };
    });
    saveState();
    renderAll();
  }

  if (target.matches("[data-vendor-id]")) {
    const vendorId = target.getAttribute("data-vendor-id");
    appState.vendors = appState.vendors.filter((vendor) => vendor.id !== vendorId);
    saveState();
    renderVendors();
  }
});

tabDashboard.addEventListener("click", () => switchPage("dashboard"));
tabStatus.addEventListener("click", () => switchPage("status"));
tabVendors.addEventListener("click", () => switchPage("vendors"));

orderQty.addEventListener("input", calculateOrderFormTotals);
orderSellingPerUnit.addEventListener("input", calculateOrderFormTotals);
orderCostPerUnit.addEventListener("input", calculateOrderFormTotals);

setDefaultDates();
calculateOrderFormTotals();
switchPage("dashboard");
renderAll();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

// /Users/apple/Documents/New project/app.js

// ===================== Firebase Setup =====================
const firebaseConfig = {
  apiKey: "AIzaSyCFqqQaasfBeOlstoue20188krj91gzbug",
  authDomain: "salestracker-f331b.firebaseapp.com",
  projectId: "salestracker-f331b",
  storageBucket: "salestracker-f331b.firebasestorage.app",
  messagingSenderId: "256699358454",
  appId: "1:256699358454:web:839afdac26a9c5497ca0d7"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ===================== Firestore Collections =====================
const ordersCollection = db.collection("orders");
const vendorsCollection = db.collection("vendors");

let ordersCache = [];
let vendorsCache = [];

// ===================== DOM Elements =====================
const tabDashboard = document.getElementById("tab-dashboard");
const tabOrders = document.getElementById("tab-orders");
const tabVendors = document.getElementById("tab-vendors");

const dashboardPage = document.getElementById("dashboard-page");
const ordersPage = document.getElementById("orders-page");
const vendorsPage = document.getElementById("vendors-page");

const orderForm = document.getElementById("order-form");
const clientNameInput = document.getElementById("client-name");
const productNameInput = document.getElementById("product-name");
const orderPlacedDateInput = document.getElementById("order-placed-date");
const deliveryDateInput = document.getElementById("delivery-date");
const quantityInput = document.getElementById("quantity");
const costPricePerPieceInput = document.getElementById("cost-price-per-piece");
const salePricePerPieceInput = document.getElementById("sale-price-per-piece");

const vendorForm = document.getElementById("vendor-form");
const vendorNameInput = document.getElementById("vendor-name");
const vendorLocationInput = document.getElementById("vendor-location");
const vendorProductsSoldInput = document.getElementById("vendor-products-sold");
const vendorContactNumberInput = document.getElementById("vendor-contact-number");

// ===================== Utility Functions =====================
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
}

function formatDateDisplay(value) {
  if (!value) return "-";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
  if (!match) return String(value);
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

function toNumber(value) {
  const n = Number(value);
  if (Number.isNaN(n) || n < 0) return 0;
  return n;
}

// ===================== Page Switch =====================
function switchPage(page) {
  const pages = { dashboard: dashboardPage, orders: ordersPage, vendors: vendorsPage };
  const tabs = { dashboard: tabDashboard, orders: tabOrders, vendors: tabVendors };

  Object.entries(pages).forEach(([key, section]) => section.classList.toggle("active", key === page));
  Object.entries(tabs).forEach(([key, button]) => button.classList.toggle("active", key === page));
}

// ===================== Dashboard Metrics =====================
function renderDashboardMetrics() {
  const totalRevenue = ordersCache.reduce((sum, order) => sum + (Number(order.totalRevenue) || 0), 0);
  const totalProfit = ordersCache.reduce((sum, order) => sum + (Number(order.profit) || 0), 0);
  const totalOrders = ordersCache.length;
  const pendingOrders = ordersCache.filter((order) => order.status === "pending").length;
  const completedOrders = ordersCache.filter((order) => order.status === "completed").length;

  document.getElementById("metric-total-revenue").textContent = formatMoney(totalRevenue);
  document.getElementById("metric-total-profit").textContent = formatMoney(totalProfit);
  document.getElementById("metric-total-orders").textContent = String(totalOrders);
  document.getElementById("metric-pending-orders").textContent = String(pendingOrders);
  document.getElementById("metric-completed-orders").textContent = String(completedOrders);
}

// ===================== Orders Rendering =====================
function buildOrderRow(order, includeAction) {
  const status = order.status === "completed" ? "completed" : "pending";
  const actionCell = includeAction
    ? status === "pending"
      ? `<button class="row-delivery-btn" type="button" data-deliver-id="${order.id}">Mark Delivered</button>`
      : `<span class="status-pill delivered">Completed</span>`
    : `<span class="status-pill ${status}">${status}</span>`;

  return `
    <tr>
      <td>${escapeHtml(order.clientName || "-")}</td>
      <td>${escapeHtml(order.productName || "-")}</td>
      <td>${escapeHtml(formatDateDisplay(order.orderPlacedDate || ""))}</td>
      <td>${escapeHtml(formatDateDisplay(order.deliveryDate || ""))}</td>
      <td>${Number(order.quantity) || 0}</td>
      <td>${formatMoney(order.totalCost)}</td>
      <td>${formatMoney(order.totalRevenue)}</td>
      <td>${formatMoney(order.profit)}</td>
      <td><span class="status-pill ${status}">${status}</span></td>
      <td>${actionCell}</td>
    </tr>
  `;
}

function renderOrdersTables() {
  const allBody = document.getElementById("all-orders-body");
  const pendingBody = document.getElementById("pending-orders-body");
  const completedBody = document.getElementById("completed-orders-body");

  allBody.innerHTML = "";
  pendingBody.innerHTML = "";
  completedBody.innerHTML = "";

  const pending = ordersCache.filter((order) => order.status === "pending");
  const completed = ordersCache.filter((order) => order.status === "completed");

  ordersCache.forEach((order) => allBody.insertAdjacentHTML("beforeend", buildOrderRow(order, true)));
  pending.forEach((order) => pendingBody.insertAdjacentHTML("beforeend", buildOrderRow(order, true)));
  completed.forEach((order) => completedBody.insertAdjacentHTML("beforeend", buildOrderRow(order, false)));

  document.getElementById("all-orders-empty").hidden = ordersCache.length > 0;
  document.getElementById("pending-orders-empty").hidden = pending.length > 0;
  document.getElementById("completed-orders-empty").hidden = completed.length > 0;
}

// ===================== Vendors Rendering =====================
function renderVendorsTable() {
  const vendorsBody = document.getElementById("vendors-body");
  vendorsBody.innerHTML = "";

  vendorsCache.forEach((vendor) => {
    vendorsBody.insertAdjacentHTML(
      "beforeend",
      `
      <tr>
        <td>${escapeHtml(vendor.vendorName || "-")}</td>
        <td>${escapeHtml(vendor.location || "-")}</td>
        <td>${escapeHtml(vendor.productsSold || "-")}</td>
        <td>${escapeHtml(vendor.contactNumber || "-")}</td>
      </tr>
    `
    );
  });

  document.getElementById("vendors-empty").hidden = vendorsCache.length > 0;
}

// ===================== Firestore CRUD =====================

// Add order to Firestore
async function addOrder(orderInput) {
  const quantity = Math.max(1, Math.floor(toNumber(orderInput.quantity)));
  const costPricePerPiece = toNumber(orderInput.costPricePerPiece);
  const salePricePerPiece = toNumber(orderInput.salePricePerPiece);

  const totalCost = quantity * costPricePerPiece;
  const totalRevenue = quantity * salePricePerPiece;
  const profit = totalRevenue - totalCost;

  try {
    await ordersCollection.add({
      clientName: orderInput.clientName,
      productName: orderInput.productName,
      orderPlacedDate: orderInput.orderPlacedDate,
      deliveryDate: orderInput.deliveryDate,
      quantity,
      costPricePerPiece,
      salePricePerPiece,
      totalCost,
      totalRevenue,
      profit,
      status: "pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error("Failed to add order:", error);
    alert("Unable to add order. Check Firestore permissions/config.");
  }
}

// Real-time listener for orders
function listenForOrders() {
  ordersCollection.orderBy("createdAt", "desc").onSnapshot((snapshot) => {
    ordersCache = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    renderDashboardMetrics();
    renderOrdersTables();
  });
}

// Mark order delivered
async function markOrderDelivered(orderId) {
  try {
    await ordersCollection.doc(orderId).update({ status: "completed" });
  } catch (error) {
    console.error("Failed to mark order delivered:", error);
    alert("Unable to mark delivered. Check Firestore permissions/config.");
  }
}

// Add vendor to Firestore
async function addVendor(vendorInput) {
  try {
    await vendorsCollection.add({
      vendorName: vendorInput.vendorName,
      location: vendorInput.location,
      productsSold: vendorInput.productsSold,
      contactNumber: vendorInput.contactNumber,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error("Failed to add vendor:", error);
    alert("Unable to add vendor. Check Firestore permissions/config.");
  }
}

// Real-time listener for vendors
function listenForVendors() {
  vendorsCollection.orderBy("createdAt", "desc").onSnapshot((snapshot) => {
    vendorsCache = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    renderVendorsTable();
  });
}

// ===================== Default Dates =====================
function setDefaultDates() {
  const today = new Date();
  orderPlacedDateInput.value = today.toISOString().slice(0, 10);

  const delivery = new Date(today);
  delivery.setDate(delivery.getDate() + 7);
  deliveryDateInput.value = delivery.toISOString().slice(0, 10);
}

// ===================== Event Listeners =====================
orderForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const orderInput = {
    clientName: clientNameInput.value.trim(),
    productName: productNameInput.value.trim(),
    orderPlacedDate: orderPlacedDateInput.value,
    deliveryDate: deliveryDateInput.value,
    quantity: quantityInput.value,
    costPricePerPiece: costPricePerPieceInput.value,
    salePricePerPiece: salePricePerPieceInput.value
  };

  if (!orderInput.clientName || !orderInput.productName || !orderInput.orderPlacedDate || !orderInput.deliveryDate) return;

  await addOrder(orderInput);
  orderForm.reset();
  quantityInput.value = "1";
  setDefaultDates();
});

vendorForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const vendorInput = {
    vendorName: vendorNameInput.value.trim(),
    location: vendorLocationInput.value.trim(),
    productsSold: vendorProductsSoldInput.value.trim(),
    contactNumber: vendorContactNumberInput.value.trim()
  };

  if (!vendorInput.vendorName || !vendorInput.location || !vendorInput.productsSold || !vendorInput.contactNumber) return;

  await addVendor(vendorInput);
  vendorForm.reset();
});

document.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (target.matches("[data-deliver-id]")) {
    const orderId = target.getAttribute("data-deliver-id");
    if (!orderId) return;

    await markOrderDelivered(orderId);
  }
});

tabDashboard.addEventListener("click", () => switchPage("dashboard"));
tabOrders.addEventListener("click", () => switchPage("orders"));
tabVendors.addEventListener("click", () => switchPage("vendors"));

// ===================== Initialization =====================
setDefaultDates();
switchPage("dashboard");
listenForOrders();
listenForVendors();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
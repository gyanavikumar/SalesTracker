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
const salesCollection = db.collection("sales");

const saleForm = document.getElementById("sale-form");
const productNameInput = document.getElementById("product-name");
const quantityInput = document.getElementById("quantity");
const priceInput = document.getElementById("price");
const saleDateInput = document.getElementById("sale-date");

const salesBody = document.getElementById("sales-body");
const salesEmpty = document.getElementById("sales-empty");
const totalSalesEl = document.getElementById("total-sales");
const totalOrdersEl = document.getElementById("total-orders");
const avgPriceEl = document.getElementById("avg-price");

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value);
}

function formatDateDisplay(dateValue) {
  if (!dateValue) return "-";

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }

  return dateValue;
}

function toNumber(value) {
  const n = Number(value);
  if (Number.isNaN(n) || n < 0) return 0;
  return n;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderSales(salesDocs) {
  salesBody.innerHTML = "";

  let totalSalesAmount = 0;
  let totalOrders = 0;

  salesDocs.forEach((doc) => {
    const sale = doc.data();
    const quantity = Number(sale.quantity) || 0;
    const price = Number(sale.price) || 0;
    const total = quantity * price;

    totalSalesAmount += total;
    totalOrders += 1;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formatDateDisplay(String(sale.date || ""))}</td>
      <td>${escapeHtml(String(sale.productName || "-"))}</td>
      <td>${quantity}</td>
      <td>${formatMoney(price)}</td>
      <td>${formatMoney(total)}</td>
    `;
    salesBody.appendChild(row);
  });

  const averagePrice = totalOrders > 0 ? totalSalesAmount / totalOrders : 0;

  totalSalesEl.textContent = formatMoney(totalSalesAmount);
  totalOrdersEl.textContent = String(totalOrders);
  avgPriceEl.textContent = formatMoney(averagePrice);
  salesEmpty.hidden = totalOrders > 0;
}

async function addSale(saleData) {
  await salesCollection.add({
    productName: saleData.productName,
    quantity: saleData.quantity,
    price: saleData.price,
    date: saleData.date
  });
}

async function loadSales() {
  const snapshot = await salesCollection.orderBy("date", "desc").get();
  renderSales(snapshot.docs);
}

function listenForUpdates() {
  salesCollection.orderBy("date", "desc").onSnapshot((snapshot) => {
    renderSales(snapshot.docs);
  });
}

function setDefaultDate() {
  saleDateInput.value = new Date().toISOString().slice(0, 10);
}

saleForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const sale = {
    productName: productNameInput.value.trim(),
    quantity: Math.max(1, Math.floor(toNumber(quantityInput.value))),
    price: toNumber(priceInput.value),
    date: saleDateInput.value || new Date().toISOString().slice(0, 10)
  };

  if (!sale.productName) return;

  try {
    await addSale(sale);
    saleForm.reset();
    quantityInput.value = "1";
    setDefaultDate();
  } catch (error) {
    console.error("Failed to add sale:", error);
    alert("Could not save sale to Firestore. Check your Firebase config and rules.");
  }
});

setDefaultDate();
loadSales().catch((error) => {
  console.error("Failed to load sales:", error);
});
listenForUpdates();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

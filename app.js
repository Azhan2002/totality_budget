// Totality Finance App Logic

// Function to get real-world current month in YYYY-MM format
function getRealCurrentMonthStr() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
  return `${currentYear}-${currentMonth}`;
}

// Default initial state (replicated from TOTALITY_v2.xlsx & User Preferences)
const DEFAULT_STATE = {
  selectedMonth: getRealCurrentMonthStr(), // Default month dynamically set to real-world current month
  categories: [
    { name: "Car Maintenance", budget: 10000 },
    { name: "Grocery", budget: 5000 },
    { name: "Petrol", budget: 8000 },
    { name: "Daily", budget: 5000 },
    { name: "Order Out", budget: 8000 },
    { name: "Clothes", budget: 5000 },
    { name: "Items", budget: 3000 },
    { name: "Mobile", budget: 2000 },
    { name: "Events / Activities", budget: 5000 },
    { name: "Daily Lunch", budget: 15000 },
    { name: "Optical Expense", budget: 0 },
    { name: "Miscellaneous", budget: 3000 },
    { name: "Uber", budget: 3000 },
    { name: "Gym", budget: 3000 },
    { name: "Charity", budget: 2000 },
    { name: "Loan Payment", budget: 0 }
  ],
  monthlyBudgets: {}, // Maps month key ("YYYY-MM") -> { categoryName: budgetAmount }
  incomeSources: ["Coca Cola", "Extra / EP", "Miscellaneous", "Tuition"],
  bankAccounts: [
    { id: "scb", name: "Standard Chartered", bank: "Standard Chartered", type: "Current", purpose: "Salary / Daily Spend", balance: 0, initialBalance: 0 },
    { id: "allied", name: "Allied Bank", bank: "Allied Bank", type: "Savings", purpose: "Savings", balance: 0, initialBalance: 0 },
    { id: "askari", name: "Askari Bank", bank: "Askari Bank", type: "Current", purpose: "Business / Excess Income", balance: 0, initialBalance: 0 },
    { id: "cash", name: "Cash", bank: "Physical Cash", type: "Cash", purpose: "Daily cash spending", balance: 0, initialBalance: 0 }
  ],
  savingsGoals: [
    { id: "goal_1", name: "Asus Laptop", target: 70000, saved: 0, targetDate: "2026-12-31", account: "allied" },
    { id: "goal_2", name: "Guitar", target: 30000, saved: 0, targetDate: "2026-09-30", account: "allied" },
    { id: "goal_3", name: "Apple Keyboard", target: 25000, saved: 0, targetDate: "2026-11-01", account: "allied" },
    { id: "goal_4", name: "Shehroz Laptop", target: 70000, saved: 0, targetDate: "2027-03-31", account: "allied" },
    { id: "goal_5", name: "Soundbar / Speakers", target: 40000, saved: 0, targetDate: "2026-12-31", account: "allied" },
    { id: "goal_6", name: "iPhone", target: 200000, saved: 0, targetDate: "2027-06-30", account: "allied" }
  ],
  subscriptions: [
    { id: "sub_1", name: "Netflix Premium", amount: 1500, dayOfMonth: 17, category: "Items", account: "scb", startMonth: "2026-01" },
    { id: "sub_2", name: "Spotify Duo", amount: 350, dayOfMonth: 5, category: "Items", account: "scb", startMonth: "2026-01" },
    { id: "sub_3", name: "Gym Membership", amount: 3000, dayOfMonth: 1, category: "Gym", account: "cash", startMonth: "2026-01" }
  ],
  debts: [
    { id: "debt_1", person: "Hamza", description: "Laptop purchase share", amount: 50000, dueDate: "2026-08-15", createdDate: "2026-05-01" },
    { id: "debt_2", person: "Papa", description: "Emergency car repair fund", amount: 150000, dueDate: "2026-12-31", createdDate: "2026-05-10" }
  ],
  deletedRecurring: [],
  transactions: [],
  wishlist: [],
  billSplitter: {
    restaurant: "Seven Sides",
    paymentMethod: "card",
    discountPct: 0,
    discountCap: 0,
    people: []
  }
};

// Months reference (updated dynamically based on selected year)
let MONTHS_REF = [];
function updateMonthsRef() {
  const selectedYear = (state && state.selectedMonth) ? state.selectedMonth.split('-')[0] : "2026";
  MONTHS_REF = [
    { key: `${selectedYear}-01`, name: "January" },
    { key: `${selectedYear}-02`, name: "February" },
    { key: `${selectedYear}-03`, name: "March" },
    { key: `${selectedYear}-04`, name: "April" },
    { key: `${selectedYear}-05`, name: "May" },
    { key: `${selectedYear}-06`, name: "June" },
    { key: `${selectedYear}-07`, name: "July" },
    { key: `${selectedYear}-08`, name: "August" },
    { key: `${selectedYear}-09`, name: "September" },
    { key: `${selectedYear}-10`, name: "October" },
    { key: `${selectedYear}-11`, name: "November" },
    { key: `${selectedYear}-12`, name: "December" }
  ];
}

// Global App State
let state = { ...DEFAULT_STATE };
let activeTab = 'dashboard';
let txModalCategoryManuallyChanged = false;

// Charts Instances
let expenseChartInstance = null;
let goalsChartInstance = null;
let annualTrendChartInstance = null;
let forecastChartInstance = null;
let comparisonChartInstance = null;

// Helpers
function formatCurrency(amount) {
  return "Rs. " + Number(amount).toLocaleString('en-US');
}

function animateNumber(elementId, targetValue, isPercent = false) {
  const el = document.getElementById(elementId);
  if (!el) return;
  
  if (el.innerText.includes('•')) {
    if (isPercent) {
      el.innerText = targetValue + '%';
    } else {
      el.innerText = formatCurrency(targetValue);
    }
    return;
  }
  
  let startValue = 0;
  // Correctly strip "Rs.", "Rs", commas, and percentage signs, then parse to support negative & decreasing changes
  const currentText = el.innerText.replace(/Rs\./g, '').replace(/Rs/g, '').replace(/,/g, '').replace(/%/g, '').trim();
  const parsedVal = parseFloat(currentText);
  if (!isNaN(parsedVal)) {
    startValue = parsedVal;
  }
  
  if (startValue === targetValue) {
    return;
  }

  const duration = 800;
  const startTimestamp = performance.now();
  
  function step(now) {
    const elapsed = now - startTimestamp;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = progress * (2 - progress);
    const currentValue = startValue + (targetValue - startValue) * easeProgress;
    
    if (isPercent) {
      el.innerText = Math.round(currentValue) + '%';
    } else {
      el.innerText = formatCurrency(Math.round(currentValue));
    }
    
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      if (isPercent) {
        el.innerText = targetValue + '%';
      } else {
        el.innerText = formatCurrency(targetValue);
      }
    }
  }
  
  requestAnimationFrame(step);
}

// ─── Goal Relevant Images keyword mapping ───
function getGoalImage(goalName) {
  const name = (goalName || "").toLowerCase();
  
  // 1. Laptops / Computers
  if (name.includes("laptop") || name.includes("macbook") || name.includes("pc") || name.includes("computer") || 
      name.includes("desktop") || name.includes("monitor") || name.includes("gpu") || name.includes("nvidia") || 
      name.includes("ryzen") || name.includes("intel") || name.includes("chromebook") || name.includes("thinkpad") || 
      name.includes("ipad") || name.includes("tablet") || name.includes("asus") || name.includes("dell") || 
      name.includes("hp") || name.includes("lenovo") || name.includes("acer") || name.includes("msi") || 
      name.includes("razer") || name.includes("alienware") || name.includes("mac mini") || name.includes("imac")) {
    return "https://images.unsplash.com/photo-1496181130204-755241544e35?w=500&auto=format&fit=crop&q=60";
  }
  
  // 2. Musical Instruments / Music gear
  if (name.includes("guitar") || name.includes("piano") || name.includes("music") || 
      name.includes("instrument") || name.includes("violin") || name.includes("synth") || 
      name.includes("keyboard") || name.includes("yamaha") || name.includes("casio") || 
      name.includes("roland") || name.includes("korg") || name.includes("fender") || 
      name.includes("gibson") || name.includes("psr") || name.includes("organ") || 
      name.includes("drum") || name.includes("drums") || name.includes("bass") || 
      name.includes("flute") || name.includes("brass") || name.includes("violin") || 
      name.includes("ukulele") || name.includes("microphone") || name.includes("amplifier")) {
      
    // Exclude computer keyboards
    if (name.includes("apple keyboard") || name.includes("keychron") || name.includes("mx keys") || name.includes("mechanical keyboard")) {
      return "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60";
    }
    
    // Exclude Yamaha motorbikes
    if (name.includes("bike") || name.includes("motorcycle") || name.includes("scooter") || name.includes("r1") || name.includes("ybr")) {
      return "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&auto=format&fit=crop&q=60";
    }
    
    // Check if it matches keyboard/piano terms specifically
    if (name.includes("piano") || name.includes("keyboard") || name.includes("yamaha") || name.includes("casio") || name.includes("roland") || name.includes("korg") || name.includes("psr") || name.includes("organ") || name.includes("synth")) {
      return "https://images.unsplash.com/photo-1552422535-c45813c61732?w=500&auto=format&fit=crop&q=60"; // keyboard / piano
    }
    
    return "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=500&auto=format&fit=crop&q=60"; // standard music/instrument
  }
  
  // 3. Audio / Speakers
  if (name.includes("speaker") || name.includes("speakers") || name.includes("soundbar") || name.includes("audio") || 
      name.includes("headphone") || name.includes("headphones") || name.includes("airpods") || name.includes("sony wh") || 
      name.includes("bose") || name.includes("jbl") || name.includes("sennheiser") || name.includes("beats") || 
      name.includes("jabra") || name.includes("shure") || name.includes("earbuds") || name.includes("microphone") || 
      name.includes("mic") || name.includes("podcast")) {
    return "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&auto=format&fit=crop&q=60";
  }
  
  // 4. Phones / Mobiles
  if (name.includes("phone") || name.includes("iphone") || name.includes("android") || name.includes("samsung") || 
      name.includes("galaxy") || name.includes("pixel") || name.includes("oneplus") || name.includes("xiaomi") || 
      name.includes("redmi") || name.includes("realme") || name.includes("oppo") || name.includes("vivo") || 
      name.includes("huawei") || name.includes("nokia") || name.includes("mobile")) {
    return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60";
  }
  
  // 5. Vehicles (Cars / Bikes)
  if (name.includes("car") || name.includes("bike") || name.includes("motorcycle") || name.includes("vehicle") || 
      name.includes("honda") || name.includes("toyota") || name.includes("vespa") || name.includes("scooter") || 
      name.includes("yamaha r") || name.includes("kawasaki") || name.includes("bmw") || name.includes("audi") || 
      name.includes("mercedes") || name.includes("tesla") || name.includes("civic") || name.includes("corolla") || 
      name.includes("suzuki")) {
    return "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&auto=format&fit=crop&q=60";
  }
  
  // 6. Travel / Vacations
  if (name.includes("travel") || name.includes("trip") || name.includes("vacation") || name.includes("ticket") || 
      name.includes("flight") || name.includes("umrah") || name.includes("hajj") || name.includes("dubai") || 
      name.includes("london") || name.includes("paris") || name.includes("america") || name.includes("tour") || 
      name.includes("hotel") || name.includes("resort")) {
    return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500&auto=format&fit=crop&q=60";
  }
  
  // 7. Watches
  if (name.includes("watch") || name.includes("rolex") || name.includes("casio") || name.includes("omega") || 
      name.includes("smartwatch") || name.includes("seiko") || name.includes("tissot") || name.includes("fitbit") || 
      name.includes("garmin") || name.includes("apple watch")) {
    return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60";
  }
  
  // 8. Cameras / Drone
  if (name.includes("camera") || name.includes("lens") || name.includes("dslr") || name.includes("gopro") || 
      name.includes("canon") || name.includes("nikon") || name.includes("sony a") || name.includes("fujifilm") || 
      name.includes("lumix") || name.includes("tripod") || name.includes("drone") || name.includes("dji")) {
    return "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=60";
  }
  
  // 9. Real Estate
  if (name.includes("house") || name.includes("home") || name.includes("apartment") || name.includes("rent") || 
      name.includes("property") || name.includes("land") || name.includes("plot") || name.includes("flat") || 
      name.includes("room")) {
    return "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500&auto=format&fit=crop&q=60";
  }
  
  // 10. Education / Books
  if (name.includes("book") || name.includes("education") || name.includes("course") || name.includes("degree") || 
      name.includes("school") || name.includes("university") || name.includes("tuition") || name.includes("exam") || 
      name.includes("class") || name.includes("kindle")) {
    return "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&auto=format&fit=crop&q=60";
  }
  
  // 11. Fitness / Health
  if (name.includes("gym") || name.includes("fitness") || name.includes("workout") || name.includes("health") || 
      name.includes("sports") || name.includes("protein") || name.includes("creatine") || name.includes("treadmill") || 
      name.includes("dumbbell")) {
    return "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=60";
  }
  
  // 12. Gaming
  if (name.includes("game") || name.includes("console") || name.includes("ps5") || name.includes("playstation") || 
      name.includes("xbox") || name.includes("nintendo") || name.includes("switch") || name.includes("steam") || 
      name.includes("rtx") || name.includes("pubg") || name.includes("fortnite") || name.includes("controller")) {
    return "https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=500&auto=format&fit=crop&q=60";
  }
  
  // Default: Money Plant coin jar
  return "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=500&auto=format&fit=crop&q=60";
}

// ─── Price Suggestions Dictionary ───
const PRICE_SUGGESTIONS = {
  'iphone': 200000,
  'apple watch': 80000,
  'watch': 50000,
  'macbook': 250000,
  'laptop': 100000,
  'asus': 70000,
  'guitar': 30000,
  'soundbar': 40000,
  'speaker': 15000,
  'speakers': 30000,
  'keyboard': 25000,
  'yamaha': 60000,
  'piano': 80000,
  'psr': 55000,
  'synthesizer': 90000,
  'synth': 50000,
  'roland': 75000,
  'korg': 85000,
  'casio': 25000,
  'car': 3000000,
  'bike': 200000,
  'motorcycle': 150000,
  'cycle': 20000,
  'bicycle': 25000,
  'playstation': 150000,
  'ps5': 160000,
  'xbox': 120000,
  'nintendo': 80000,
  'ipad': 120000,
  'tablet': 40000,
  'tv': 90000,
  'television': 100000,
  'camera': 180000,
  'lens': 100000,
  'gym': 15000,
  'membership': 20000,
  'ticket': 120000,
  'trip': 150000,
  'vacation': 250000,
  'rent': 40000,
  'deposit': 100000,
  'house': 8000000,
  'apartment': 5000000
};

let ddgDebounceTimeout = null;

function handleOnlinePriceSearch(nameVal, targetInput, suggSpan) {
  clearTimeout(ddgDebounceTimeout);
  if (!nameVal || nameVal.trim().length < 3) {
    suggSpan.style.display = 'none';
    return;
  }
  
  const queryVal = nameVal.toLowerCase().trim();
  
  // 1. First check local dictionary
  let matchedKey = null;
  for (const key in PRICE_SUGGESTIONS) {
    if (queryVal.includes(key)) {
      matchedKey = key;
      break;
    }
  }
  if (matchedKey && Number(targetInput.value) === 0) {
    const suggPrice = PRICE_SUGGESTIONS[matchedKey];
    suggSpan.innerHTML = `✨ Suggested Price: ${formatCurrency(suggPrice)}`;
    suggSpan.style.display = 'inline-flex';
    suggSpan.onclick = () => {
      targetInput.value = suggPrice;
      suggSpan.style.display = 'none';
    };
    return;
  }
  
  // 2. If not found in local dictionary, do online search
  ddgDebounceTimeout = setTimeout(async () => {
    // Only query if the target is currently 0 or empty
    if (Number(targetInput.value) > 0) return;
    
    try {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(nameVal + ' price')}&format=json&no_html=1`;
      const res = await fetch(url);
      const data = await res.json();
      
      const searchSource = [
        data.Answer || '',
        data.AbstractText || '',
        (data.RelatedTopics && data.RelatedTopics[0] && data.RelatedTopics[0].Text) || ''
      ].join(' ');
      
      if (!searchSource.trim()) {
        return;
      }
      
      // Search for PKR first, e.g. "Rs. 150,000" or "150000 PKR"
      const pkrMatch = searchSource.match(/(?:Rs\.?|PKR)\s*(\d{1,3}(?:,\d{3})*|\d+)/i);
      if (pkrMatch) {
        const price = parseInt(pkrMatch[1].replace(/,/g, ''), 10);
        if (price > 0) {
          showSugg(price, suggSpan, targetInput);
          return;
        }
      }
      
      // USD match: e.g. "$499" or "499 USD" or "499 dollars"
      const usdMatch = searchSource.match(/\$\s*(\d{1,3}(?:,\d{3})*|\d+)/) || searchSource.match(/(\d{1,3}(?:,\d{3})*|\d+)\s*(?:USD|dollars)/i);
      if (usdMatch) {
        const usdPrice = parseInt(usdMatch[1].replace(/,/g, ''), 10);
        if (usdPrice > 0) {
          const pkrPrice = Math.round(usdPrice * 278);
          showSugg(pkrPrice, suggSpan, targetInput, `(est. $${usdPrice})`);
          return;
        }
      }
    } catch (e) {
      console.error("DuckDuckGo Instant Answer search failed:", e);
    }
  }, 600);
}

function showSugg(price, suggSpan, targetInput, extraText = '') {
  suggSpan.innerHTML = `🌐 Online Suggestion: ${formatCurrency(price)} ${extraText}`;
  suggSpan.style.display = 'inline-flex';
  suggSpan.onclick = () => {
    targetInput.value = price;
    suggSpan.style.display = 'none';
  };
}

// ─── Custom Promise-based confirm/alert modal ───
let confirmModalResolve = null;

function showCustomConfirm(title, message, isDanger = true) {
  return new Promise((resolve) => {
    confirmModalResolve = resolve;
    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-message').innerText = message;
    
    const cancelBtn = document.getElementById('confirm-cancel-btn');
    if (cancelBtn) cancelBtn.style.display = 'inline-flex';
    
    const okBtn = document.getElementById('confirm-ok-btn');
    if (okBtn) {
      okBtn.className = isDanger ? 'btn btn-danger' : 'btn btn-primary';
      okBtn.innerText = isDanger ? 'Remove' : 'Confirm';
    }
    
    const iconContainer = document.querySelector('.confirm-icon');
    if (iconContainer) {
      // Coke red colors for consistent brand style and perfect contrast in light & dark modes
      iconContainer.style.color = 'var(--primary)';
      iconContainer.style.backgroundColor = 'rgba(244, 0, 0, 0.1)';
      iconContainer.style.borderColor = 'rgba(244, 0, 0, 0.2)';
      
      if (isDanger) {
        // Warning triangle SVG
        iconContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
      } else {
        // Question circle SVG
        iconContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
      }
    }
    
    document.getElementById('confirm-modal').classList.add('active');
  });
}

function showCustomAlert(title, message, isError = false) {
  return new Promise((resolve) => {
    confirmModalResolve = resolve;
    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-message').innerHTML = message;
    
    const cancelBtn = document.getElementById('confirm-cancel-btn');
    if (cancelBtn) cancelBtn.style.display = 'none';
    
    const okBtn = document.getElementById('confirm-ok-btn');
    if (okBtn) {
      okBtn.className = isError ? 'btn btn-danger' : 'btn btn-primary';
      okBtn.innerText = 'OK';
    }
    
    const iconContainer = document.querySelector('.confirm-icon');
    if (iconContainer) {
      // Use Coke Red theme to match the goal completion confirmation design and avoid low contrast green
      iconContainer.style.color = 'var(--primary)';
      iconContainer.style.backgroundColor = 'rgba(244, 0, 0, 0.1)';
      iconContainer.style.borderColor = 'rgba(244, 0, 0, 0.2)';
      
      if (isError) {
        // Error cross inside a circle
        iconContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
      } else {
        // Success checkmark SVG with animated polyline
        iconContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" class="animated-checkmark-polyline"></polyline></svg>`;
      }
    }
    
    document.getElementById('confirm-modal').classList.add('active');
  });
}

function showNotification(title, message, type = 'tip', icon = 'info') {
  const container = document.getElementById('smart-nudge-container');
  if (!container) return;
  
  const id = 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  const el = document.createElement('div');
  el.className = `smart-nudge ${type}`;
  el.id = id;
  el.innerHTML = `
    <div class="smart-nudge-icon">
      <i data-lucide="${icon}"></i>
    </div>
    <div class="smart-nudge-body">
      <span class="smart-nudge-label">${title}</span>
      <div class="smart-nudge-msg">${message}</div>
    </div>
    <button class="smart-nudge-close" onclick="dismissNudge('${id}')">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="smart-nudge-timer"></div>
  `;
  
  container.appendChild(el);
  if (typeof lucide !== 'undefined') {
    lucide.createIcons({ nodes: [el] });
  }
  
  setTimeout(() => {
    dismissNudge(id);
  }, 5000);
}

function initConfirmModalEvents() {
  document.getElementById('confirm-ok-btn').addEventListener('click', () => {
    document.getElementById('confirm-modal').classList.remove('active');
    if (confirmModalResolve) confirmModalResolve(true);
  });
  document.getElementById('confirm-cancel-btn').addEventListener('click', () => {
    document.getElementById('confirm-modal').classList.remove('active');
    if (confirmModalResolve) confirmModalResolve(false);
  });
}

function calculateMonthsLeft(targetDateStr) {
  if (!targetDateStr) return 0;
  const targetDate = new Date(targetDateStr);
  const today = new Date();
  if (targetDate > today) {
    const diffMs = targetDate - today;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const months = diffDays / 30.4;
    return Math.max(1, Math.round(months));
  }
  return 0; // Overdue
}

function calculateMonthlyNeeded(remaining, targetDateStr) {
  if (remaining <= 0) return 0;
  const months = calculateMonthsLeft(targetDateStr);
  if (months > 0) {
    return Math.round(remaining / months);
  }
  return remaining;
}

function getFormattedDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getBudgetForCategory(month, categoryName) {
  if (state.monthlyBudgets && state.monthlyBudgets[month] && state.monthlyBudgets[month][categoryName] !== undefined) {
    return state.monthlyBudgets[month][categoryName];
  }
  const cat = state.categories.find(c => c.name === categoryName);
  return cat ? cat.budget : 0;
}

function updateMonthlyBudget(month, categoryName, newValue) {
  if (!state.monthlyBudgets) state.monthlyBudgets = {};
  if (!state.monthlyBudgets[month]) state.monthlyBudgets[month] = {};
  state.monthlyBudgets[month][categoryName] = Number(newValue);
  saveState();
  updateUI();
}

// Local Storage Sync
// Local Storage Sync & Multi-Profile Support
let profiles = [];
let activeProfileId = 'default';

function normalizeLoadedState() {
  if (!state) state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  state.selectedMonth = getRealCurrentMonthStr();
  if (!state.categories) state.categories = DEFAULT_STATE.categories;
  if (!state.monthlyBudgets) state.monthlyBudgets = DEFAULT_STATE.monthlyBudgets;
  if (!state.incomeSources) state.incomeSources = DEFAULT_STATE.incomeSources;
  if (!state.bankAccounts) state.bankAccounts = DEFAULT_STATE.bankAccounts;
  if (!state.savingsGoals) state.savingsGoals = DEFAULT_STATE.savingsGoals;
  if (!state.subscriptions) state.subscriptions = DEFAULT_STATE.subscriptions || [];
  if (!state.debts) state.debts = DEFAULT_STATE.debts || [];
  if (!state.deletedRecurring) state.deletedRecurring = DEFAULT_STATE.deletedRecurring || [];
  if (!state.transactions) state.transactions = DEFAULT_STATE.transactions;
  if (!state.wishlist) state.wishlist = [];
  if (!state.billSplitter) {
    state.billSplitter = {
      restaurant: "Seven Sides",
      paymentMethod: "card",
      discountPct: 0,
      discountCap: 0,
      people: []
    };
  }

  // Schema Migration
  const hasOldAccounts = state.bankAccounts.some(acc => acc.id === 'daily_ops');
  if (hasOldAccounts) {
    console.log("Schema migration: resetting state to new default SCB/Allied bank accounts.");
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    state._schemaVersion = 2;
  }
  if (!state._schemaVersion) {
    state._schemaVersion = 2;
  }
  updateMonthsRef();
}

function loadProfiles() {
  const savedProfiles = localStorage.getItem('totality_finance_profiles');
  const savedActiveId = localStorage.getItem('totality_active_profile_id');
  
  if (savedProfiles) {
    try {
      profiles = JSON.parse(savedProfiles);
    } catch (e) {
      console.error("Failed to parse profiles", e);
      profiles = [];
    }
  }
  
  if (savedActiveId) {
    activeProfileId = savedActiveId;
  }
  
  // If no profiles exist, migrate the current single-user state if present
  if (profiles.length === 0) {
    const savedState = localStorage.getItem('totality_finance_state');
    if (savedState) {
      try {
        state = JSON.parse(savedState);
        normalizeLoadedState();
      } catch (e) {
        state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      }
    } else {
      state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
    
    const defaultProfile = {
      id: 'profile_default',
      name: 'Azhan',
      state: { ...state }
    };
    profiles.push(defaultProfile);
    activeProfileId = defaultProfile.id;
    saveProfiles();
  } else {
    let activeProfile = profiles.find(p => p.id === activeProfileId);
    if (!activeProfile) {
      activeProfile = profiles[0];
      activeProfileId = activeProfile.id;
    }
    state = activeProfile.state;
    normalizeLoadedState();
  }
}

function saveProfiles() {
  const activeProfile = profiles.find(p => p.id === activeProfileId);
  if (activeProfile) {
    activeProfile.state = { ...state };
  }
  localStorage.setItem('totality_finance_profiles', JSON.stringify(profiles));
  localStorage.setItem('totality_active_profile_id', activeProfileId);
}

function loadState() {
  loadProfiles();
  localStorage.setItem('totality_finance_state', JSON.stringify(state));
}

function saveState() {
  saveProfiles();
  localStorage.setItem('totality_finance_state', JSON.stringify(state));
}

function switchProfile(profileId) {
  // Save current profile state first
  saveProfiles();
  
  const targetProfile = profiles.find(p => p.id === profileId);
  if (targetProfile) {
    activeProfileId = profileId;
    state = targetProfile.state;
    normalizeLoadedState();
    saveProfiles();
    
    // Switch tab to dashboard and update UI
    switchTab('dashboard');
    showNotification("Profile Switched", `Switched to workspace "${targetProfile.name}".`, "saving", "check-circle");
    
    // Update profile dropdown
    populateProfileDropdown();
  }
}

function populateProfileDropdown() {
  const select = document.getElementById('profile-select');
  if (!select) return;
  select.innerHTML = '';
  profiles.forEach(p => {
    select.innerHTML += `<option value="${p.id}" ${p.id === activeProfileId ? 'selected' : ''}>${p.name}</option>`;
  });
}

// Get all YYYY-MM months from startMonth to endMonth (inclusive)
function getMonthsRange(startMonthStr, endMonthStr) {
  const months = [];
  if (!startMonthStr || !endMonthStr) return months;
  
  let [startYear, startMonth] = startMonthStr.split('-').map(Number);
  let [endYear, endMonth] = endMonthStr.split('-').map(Number);
  
  if (isNaN(startYear) || isNaN(startMonth) || isNaN(endYear) || isNaN(endMonth)) {
    return months;
  }
  
  let currYear = startYear;
  let currMonth = startMonth;
  
  while (currYear < endYear || (currYear === endYear && currMonth <= endMonth)) {
    const key = `${currYear}-${currMonth.toString().padStart(2, '0')}`;
    months.push(key);
    
    currMonth++;
    if (currMonth > 12) {
      currMonth = 1;
      currYear++;
    }
  }
  return months;
}

function processRecurringExpenses() {
  if (!state.subscriptions) state.subscriptions = [];
  if (!state.deletedRecurring) state.deletedRecurring = [];
  
  let stateChanged = false;
  
  // Real-world current date check (today's local date)
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
  const currentDay = today.getDate().toString().padStart(2, '0');
  const currentDateStr = `${currentYear}-${currentMonth}-${currentDay}`;

  // End of selected month
  const selectedParts = (state && state.selectedMonth) ? state.selectedMonth.split('-') : ["2026", "09"];
  const selYear = Number(selectedParts[0]);
  const selMonth = Number(selectedParts[1]);
  const lastDay = new Date(selYear, selMonth, 0).getDate();
  const selectedMonthEndStr = `${selYear}-${selMonth.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

  // limitDateStr is locked to today's real-world date to prevent writing future dummy transactions to the ledger
  const limitDateStr = currentDateStr;
  
  // 1. Prune future-dated or pre-start-month auto-generated recurring transactions to fix balances
  if (state.transactions) {
    const originalLen = state.transactions.length;
    state.transactions = state.transactions.filter(tx => {
      if (tx.recurringId) {
        if (tx.date > limitDateStr) {
          return false;
        }
        const sub = state.subscriptions.find(s => s.id === tx.recurringId);
        if (sub && sub.startMonth) {
          const txMonth = tx.date.substring(0, 7); // "YYYY-MM"
          if (txMonth < sub.startMonth) {
            return false;
          }
        }
      }
      return true;
    });
    if (state.transactions.length !== originalLen) {
      stateChanged = true;
    }
  }
  
  // 2. Generate recurring transactions up to limitDateStr
  const limitMonthStr = limitDateStr.substring(0, 7); // "YYYY-MM"
  
  state.subscriptions.forEach(sub => {
    // Determine starting month for this specific flow, defaulting to current selectedMonth if not set
    const startMonthStr = sub.startMonth || (state.selectedMonth || getRealCurrentMonthStr());
    
    // Generate all YYYY-MM keys in range
    const monthsToProcess = getMonthsRange(startMonthStr, limitMonthStr);
    
    monthsToProcess.forEach(mKey => {
      const deterministicId = `tx_rec_${sub.id}_${mKey}`;
      if (state.deletedRecurring.includes(deterministicId)) {
        return;
      }
      
      const [yStr, mStr] = mKey.split('-');
      const year = Number(yStr);
      const month = Number(mStr);
      
      let day = Number(sub.dayOfMonth) || 1;
      // Precise clamping: get the actual last day of this specific year/month combination
      const lastDayOfMonth = new Date(year, month, 0).getDate();
      if (day > lastDayOfMonth) {
        day = lastDayOfMonth;
      }
      
      const txDateStr = `${mKey}-${day.toString().padStart(2, '0')}`;
      
      // Do NOT charge/generate if billing date is in the future
      if (txDateStr > limitDateStr) {
        return;
      }
      
      const txExists = state.transactions.some(tx => tx.id === deterministicId);
      if (!txExists) {
        const subType = sub.type || 'expense';
        const newTx = {
          id: deterministicId,
          date: txDateStr,
          type: subType,
          description: `🔁 ${sub.name}`,
          amount: Number(sub.amount),
          account: sub.account,
          category: sub.category,
          recurringId: sub.id
        };
        state.transactions.push(newTx);
        stateChanged = true;
      }
    });
  });
  
  if (stateChanged) {
    saveState();
  }
}

// Dynamic State Calculations
function computeMetrics() {
  // 0. Auto-generate recurring transactions
  processRecurringExpenses();

  // Calculate dynamic remaining debt/credit balance
  if (!state.debts) state.debts = [];
  state.debts.forEach(d => {
    const isCredit = d.type === 'credit';
    const repaymentType = isCredit ? 'income' : 'expense';
    const repaid = state.transactions
      .filter(tx => tx.type === repaymentType && tx.category === 'Loan Payment' && tx.debtId === d.id)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    d.remaining = Math.max(0, Number(d.amount) - repaid);
  });

  // 1. Calculate cumulative ledger balances (reflects all time data)
  const balances = {};
  state.bankAccounts.forEach(acc => {
    balances[acc.id] = Number(acc.initialBalance || 0);
  });

  const goalSavings = {};
  state.savingsGoals.forEach(g => {
    goalSavings[g.id] = 0;
  });

  state.transactions.forEach(tx => {
    const amt = Number(tx.amount);
    if (tx.type === 'income') {
      if (balances[tx.account] !== undefined) {
        balances[tx.account] += amt;
      }
    } else if (tx.type === 'expense') {
      if (balances[tx.account] !== undefined) {
        balances[tx.account] -= amt;
      }
    } else if (tx.type === 'savings_transfer') {
      // Deduct from Source, add to Destination
      if (balances[tx.account] !== undefined) {
        balances[tx.account] -= amt;
      }
      if (balances[tx.destAccount] !== undefined) {
        balances[tx.destAccount] += amt;
      }
    } else if (tx.type === 'goal_allocation') {
      // Deduct from Source, add to Goal's bank account, add to Goal's saved amount
      if (balances[tx.account] !== undefined) {
        balances[tx.account] -= amt;
      }
      const goal = state.savingsGoals.find(g => g.id === tx.goalId);
      if (goal) {
        if (balances[goal.account] !== undefined) {
          balances[goal.account] += amt;
        }
        if (goalSavings[goal.id] !== undefined) {
          goalSavings[goal.id] += amt;
        }
      }
    }
  });

  // Assign calculated values to current bank accounts
  state.bankAccounts.forEach(acc => {
    acc.balance = balances[acc.id] || 0;
  });

  // Assign saved amounts to goals
  state.savingsGoals.forEach(g => {
    g.saved = goalSavings[g.id] || 0;
  });

  // 2. Calculate selected month specific metrics
  let totalIncome = 0;
  let totalSpent = 0;
  const categorySpent = {};
  state.categories.forEach(c => {
    categorySpent[c.name] = 0;
  });

  // Filter transactions that belong to the active month
  const monthlyTransactions = state.transactions.filter(tx => tx.date.startsWith(state.selectedMonth));

  monthlyTransactions.forEach(tx => {
    const amt = Number(tx.amount);
    if (tx.type === 'income') {
      totalIncome += amt;
    } else if (tx.type === 'expense') {
      totalSpent += amt;
      if (categorySpent[tx.category] !== undefined) {
        categorySpent[tx.category] += amt;
      }
    }
  });

  const netSavings = totalIncome - totalSpent;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  return {
    totalIncome,
    totalSpent,
    netSavings,
    savingsRate,
    categorySpent,
    balances
  };
}

// Compute Annual Overview Metrics (Jan - Dec 2026)
function computeAnnualOverview() {
  const monthsData = [];
  let ytdIncome = 0;
  let ytdSpent = 0;
  let runningBalance = 0;

  // Monthly aggregates
  MONTHS_REF.forEach(m => {
    let inc = 0;
    let exp = 0;
    
    state.transactions.forEach(tx => {
      if (tx.date.startsWith(m.key)) {
        if (tx.type === 'income') inc += Number(tx.amount);
        if (tx.type === 'expense') exp += Number(tx.amount);
      }
    });

    const sav = inc - exp;
    const rate = inc > 0 ? Math.round((sav / inc) * 100) : 0;
    runningBalance += sav;

    ytdIncome += inc;
    ytdSpent += exp;

    monthsData.push({
      key: m.key,
      name: m.name,
      income: inc,
      expense: exp,
      savings: sav,
      rate: rate,
      runningBalance: runningBalance
    });
  });

  const ytdSavings = ytdIncome - ytdSpent;
  const ytdRate = ytdIncome > 0 ? Math.round((ytdSavings / ytdIncome) * 100) : 0;

  // Category breakdowns YTD
  const categoryYTD = {};
  state.categories.forEach(c => {
    categoryYTD[c.name] = 0;
  });

  const selectedYear = state.selectedMonth ? state.selectedMonth.split('-')[0] : "2026";
  state.transactions.forEach(tx => {
    if (tx.type === 'expense' && tx.date.startsWith(selectedYear + '-') && categoryYTD[tx.category] !== undefined) {
      categoryYTD[tx.category] += Number(tx.amount);
    }
  });

  return {
    monthsData,
    ytdIncome,
    ytdSpent,
    ytdSavings,
    ytdRate,
    categoryYTD
  };
}

// UI Refresh
function updateUI() {
  const metrics = computeMetrics();
  const activeMonthLabel = MONTHS_REF.find(m => m.key === state.selectedMonth)?.name || "May";
  
  // Set month and year dropdown selections
  if (state.selectedMonth) {
    const parts = state.selectedMonth.split('-');
    const year = parts[0];
    const month = parts[1];
    const monthSelect = document.getElementById('global-month-select');
    if (monthSelect) monthSelect.value = month;
    const yearSelect = document.getElementById('global-year-select');
    if (yearSelect) yearSelect.value = year;
  }

  // Update Header Subtitles
  const selectedYear = state.selectedMonth ? state.selectedMonth.split('-')[0] : "2026";
  const monthName = MONTHS_REF.find(m => m.key === state.selectedMonth)?.name || "Selected Month";
  document.getElementById('budget-table-title').innerText = `Budget Allocation vs. Actual Spending (${monthName} ${selectedYear})`;
  document.getElementById('mini-tx-title').innerText = `Recent Transactions (${monthName})`;

  // 1. Dashboard summary cards with rolling animation
  animateNumber('dash-income', metrics.totalIncome);
  animateNumber('dash-spent', metrics.totalSpent);
  animateNumber('dash-savings', metrics.netSavings);
  animateNumber('dash-rate', metrics.savingsRate, true);
  
  const savingsValEl = document.getElementById('dash-savings');
  if (metrics.netSavings < 0) {
    savingsValEl.style.color = 'var(--danger)';
  } else {
    savingsValEl.style.color = 'var(--success)';
  }

  // 2. Dashboard accounts preview
  const dashAccountsBody = document.querySelector('#dash-accounts-table tbody');
  dashAccountsBody.innerHTML = '';
  state.bankAccounts.forEach(acc => {
    let balColor = 'var(--text-main)';
    if (acc.balance > 0) {
      balColor = 'var(--success)';
    } else if (acc.balance < 0) {
      balColor = 'var(--danger)';
    } else {
      balColor = 'var(--text-muted)';
    }
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${acc.name}</strong></td>
      <td>${acc.bank}</td>
      <td><span class="badge badge-info">${acc.type}</span></td>
      <td><strong style="color: ${balColor}">${formatCurrency(acc.balance)}</strong></td>
    `;
    dashAccountsBody.appendChild(tr);
  });

  // 3. Dashboard goals preview
  const dashGoalsBody = document.querySelector('#dash-goals-table tbody');
  dashGoalsBody.innerHTML = '';
  state.savingsGoals.forEach(g => {
    const pct = g.target > 0 ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${g.name}</strong></td>
      <td>${formatCurrency(g.target)}</td>
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="progress-bar-container" style="width: 60px; height: 6px;">
            <div class="progress-bar-fill secondary" style="width: ${pct}%"></div>
          </div>
          <span>${pct}%</span>
        </div>
      </td>
    `;
    dashGoalsBody.appendChild(tr);
  });

  // 4. Budget panel tables
  const budgetTableBody = document.querySelector('#budget-table tbody');
  let totalBudgeted = 0;
  let totalSpent = 0;

  const rows = budgetTableBody.children;
  const isCorrectRowCount = (rows.length === state.categories.length);

  state.categories.forEach((c, index) => {
    const budget = getBudgetForCategory(state.selectedMonth, c.name);
    const spent = metrics.categorySpent[c.name] || 0;
    const remaining = budget - spent;
    
    let pctUsed = 0;
    let pctUsedText = '';
    
    if (budget > 0) {
      pctUsed = Math.round((spent / budget) * 100);
      pctUsedText = `${pctUsed}%`;
    } else if (spent > 0) {
      pctUsed = 100;
      pctUsedText = '—';
    } else {
      pctUsed = 0;
      pctUsedText = '0%';
    }
    
    totalBudgeted += budget;
    totalSpent += spent;

    let badgeClass = 'badge-success';
    let statusText = 'On Track';
    let isOver = (budget === 0 && spent > 0) || pctUsed > 100;
    let isWarn = !isOver && pctUsed > 80;
    
    if (isOver) {
      badgeClass = 'badge-danger';
      statusText = 'Over Budget';
    } else if (isWarn) {
      badgeClass = 'badge-warning';
      statusText = 'Warning';
    } else if (budget === 0 && spent === 0) {
      statusText = '—';
      badgeClass = 'badge-secondary';
    }

    if (isCorrectRowCount) {
      const tr = rows[index];
      // Update Category name
      const nameEl = tr.cells[0].querySelector('strong');
      if (nameEl && nameEl.innerText !== c.name) {
        nameEl.innerText = c.name;
      }
      
      // Update Budget cell input (without losing focus if active)
      const input = tr.cells[1].querySelector('input');
      if (input && document.activeElement !== input) {
        input.value = budget;
      }

      // Update Spent
      const spentStr = formatCurrency(spent);
      if (tr.cells[2].innerText !== spentStr) {
        tr.cells[2].innerText = spentStr;
      }

      // Update Remaining
      const remainingStr = formatCurrency(remaining);
      if (tr.cells[3].innerText !== remainingStr) {
        tr.cells[3].innerText = remainingStr;
        tr.cells[3].style.color = remaining < 0 ? 'var(--danger)' : 'inherit';
      }

      // Update Progress Bar
      const fill = tr.cells[4].querySelector('.progress-bar-fill');
      if (fill) {
        fill.style.width = Math.min(100, pctUsed) + '%';
        fill.className = `progress-bar-fill ${isOver ? 'danger' : isWarn ? 'warning' : 'primary'}`;
      }
      const container = tr.cells[4].querySelector('.progress-bar-container');
      if (container) {
        container.style.width = '55px';
        container.style.height = '6px';
        container.style.flexShrink = '0';
        container.style.flexGrow = '0';
      }
      const pctText = tr.cells[4].querySelector('span');
      if (pctText && pctText.innerText !== pctUsedText) {
        pctText.innerText = pctUsedText;
      }

      // Update Status badge
      const badge = tr.cells[5].querySelector('.badge');
      if (badge) {
        badge.className = `badge ${badgeClass}`;
        if (badge.innerText !== statusText) {
          badge.innerText = statusText;
        }
      }
    } else {
      if (index === 0) budgetTableBody.innerHTML = '';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${c.name}</strong></td>
        <td>
          <input type="number" class="budget-cell-input" value="${budget}" min="0" onchange="updateMonthlyBudget('${state.selectedMonth}', '${c.name}', this.value)">
        </td>
        <td>${formatCurrency(spent)}</td>
        <td style="color: ${remaining < 0 ? 'var(--danger)' : 'inherit'}">${formatCurrency(remaining)}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="progress-bar-container" style="width: 55px; height: 6px; flex-shrink: 0;">
              <div class="progress-bar-fill ${isOver ? 'danger' : isWarn ? 'warning' : 'primary'}" style="width: ${Math.min(100, pctUsed)}%"></div>
            </div>
            <span style="font-size: 11px; width: 30px; text-align: right;">${pctUsedText}</span>
          </div>
        </td>
        <td><span class="badge ${badgeClass}">${statusText}</span></td>
      `;
      budgetTableBody.appendChild(tr);
    }
  });

  // Budget footers
  const totalRemaining = totalBudgeted - totalSpent;
  const totalPct = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;
  document.getElementById('budget-total-budgeted').innerText = formatCurrency(totalBudgeted);
  document.getElementById('budget-total-spent').innerText = formatCurrency(totalSpent);
  document.getElementById('budget-total-remaining').innerText = formatCurrency(totalRemaining);
  
  const totalBar = document.getElementById('budget-total-progress');
  totalBar.style.width = Math.min(100, totalPct) + '%';
  totalBar.className = `progress-bar-fill ${totalPct > 100 ? 'danger' : totalPct > 80 ? 'warning' : 'primary'}`;
  
  document.getElementById('budget-total-status').innerHTML = totalPct > 100 
    ? `<span class="badge badge-danger">Over Budget</span>` 
    : totalPct > 80 
      ? `<span class="badge badge-warning">Warning</span>` 
      : `<span class="badge badge-success">On Track</span>`;

  // Quick budget summary widgets
  document.getElementById('mini-planned-budget').innerText = formatCurrency(totalBudgeted);
  document.getElementById('mini-total-spent').innerText = formatCurrency(totalSpent);
  document.getElementById('mini-leftover-budget').innerText = formatCurrency(totalRemaining);

  // Expected Net Recurring Flow and money owed totals (Monthly Budget)
  let netRecurringFlow = 0;
  (state.subscriptions || []).forEach(sub => {
    const type = sub.type || 'expense';
    if (type === 'income') {
      netRecurringFlow += Number(sub.amount);
    } else {
      netRecurringFlow -= Number(sub.amount);
    }
  });
  const netRecurringEl = document.getElementById('mini-expected-net-recurring');
  if (netRecurringEl) {
    const isPositive = netRecurringFlow >= 0;
    netRecurringEl.innerText = (isPositive ? "+ " : "- ") + formatCurrency(Math.abs(netRecurringFlow));
    netRecurringEl.style.color = isPositive ? 'var(--success)' : 'var(--danger)';
  }

  const totalOwed = state.debts
    .filter(d => d.type !== 'credit')
    .reduce((sum, d) => sum + Number(d.remaining), 0);
  document.getElementById('mini-total-owed').innerText = formatCurrency(totalOwed);

  const totalReceivable = state.debts
    .filter(d => d.type === 'credit')
    .reduce((sum, d) => sum + Number(d.remaining), 0);
  const miniReceivableEl = document.getElementById('mini-total-receivable');
  if (miniReceivableEl) {
    miniReceivableEl.innerText = formatCurrency(totalReceivable);
  }

  // Recent transactions mini-list (for active month)
  const miniTxList = document.getElementById('mini-tx-list');
  miniTxList.innerHTML = '';
  const monthlyTxs = state.transactions
    .filter(tx => tx.date.startsWith(state.selectedMonth))
    .slice()
    .reverse()
    .slice(0, 5);

  if (monthlyTxs.length === 0) {
    miniTxList.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 13px;">
        No transactions logged in ${activeMonthLabel} yet.
      </div>
    `;
  } else {
    monthlyTxs.forEach(tx => {
      const item = document.createElement('div');
      item.className = 'transaction-item';
      
      let amountClass = 'expense';
      let amountPrefix = '-';
      let metaInfo = '';

      const accObj = state.bankAccounts.find(a => a.id === tx.account);
      const destAccObj = state.bankAccounts.find(a => a.id === tx.destAccount);

      if (tx.type === 'income') {
        amountClass = 'income';
        amountPrefix = '+';
        metaInfo = `Inflow ➔ ${accObj ? accObj.name : tx.account}`;
      } else if (tx.type === 'expense') {
        amountClass = 'expense';
        amountPrefix = '-';
        metaInfo = `${tx.category} ➔ ${accObj ? accObj.name : tx.account}`;
      } else if (tx.type === 'savings_transfer') {
        amountClass = 'savings';
        amountPrefix = '🔄';
        metaInfo = `${accObj ? accObj.name : 'Source'} ➔ ${destAccObj ? destAccObj.name : 'Destination'}`;
      } else if (tx.type === 'goal_allocation') {
        amountClass = 'savings';
        amountPrefix = '🎯';
        const goalObj = state.savingsGoals.find(g => g.id === tx.goalId);
        metaInfo = `${accObj ? accObj.name : 'Account'} ➔ ${goalObj ? goalObj.name : 'Goal'}`;
      }

      item.innerHTML = `
        <div class="tx-info">
          <span class="tx-desc">${tx.description}</span>
          <span class="tx-meta">
            ${getFormattedDate(tx.date)}
            <span class="tx-category-tag">${metaInfo}</span>
          </span>
        </div>
        <div class="tx-amount-area">
          <span class="tx-amount ${amountClass}">${amountPrefix} ${formatCurrency(tx.amount)}</span>
          <button class="tx-delete-btn" onclick="deleteTransaction('${tx.id}')">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      `;
      miniTxList.appendChild(item);
    });
  }

  // 5. Render Annual Overview Tab with rolling animations
  const annual = computeAnnualOverview();
  animateNumber('annual-ytd-income', annual.ytdIncome);
  animateNumber('annual-ytd-spent', annual.ytdSpent);
  animateNumber('annual-ytd-savings', annual.ytdSavings);
  animateNumber('annual-ytd-rate', (annual.ytdSavings < 0 ? -1 : 1) * annual.ytdRate, true);
  
  const annualSavingsEl = document.getElementById('annual-ytd-savings');
  if (annual.ytdSavings < 0) {
    annualSavingsEl.style.color = 'var(--danger)';
  } else {
    annualSavingsEl.style.color = 'var(--success)';
  }

  // Outstanding Loans and YTD Fixed Expenses (Annual Overview)
  const annualTotalOwed = state.debts
    .filter(d => d.type !== 'credit')
    .reduce((sum, d) => sum + Number(d.remaining), 0);
  animateNumber('annual-total-debt', annualTotalOwed);

  const annualTotalReceivable = state.debts
    .filter(d => d.type === 'credit')
    .reduce((sum, d) => sum + Number(d.remaining), 0);
  animateNumber('annual-total-receivable', annualTotalReceivable);

  const annualFixedSpent = state.transactions
    .filter(tx => tx.recurringId && tx.type === 'expense' && tx.date.startsWith(selectedYear + '-'))
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  animateNumber('annual-total-fixed', annualFixedSpent);

  // Render Month-by-month table
  const annualMonthsTbody = document.getElementById('annual-months-tbody');
  annualMonthsTbody.innerHTML = '';
  annual.monthsData.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${row.name}</strong></td>
      <td>${formatCurrency(row.income)}</td>
      <td>${formatCurrency(row.expense)}</td>
      <td style="color: ${row.savings < 0 ? 'var(--danger)' : 'var(--success)'}; font-weight: 500;">${formatCurrency(row.savings)}</td>
      <td><span class="badge ${row.savings < 0 ? 'badge-danger' : 'badge-success'}">${row.rate}%</span></td>
      <td><strong>${formatCurrency(row.runningBalance)}</strong></td>
    `;
    annualMonthsTbody.appendChild(tr);
  });

  // Render YTD Category breakdowns
  const annualCategoriesTbody = document.getElementById('annual-categories-tbody');
  annualCategoriesTbody.innerHTML = '';
  state.categories.forEach(c => {
    const annualBudget = c.budget * 12;
    const spent = annual.categoryYTD[c.name] || 0;
    
    let pct = 0;
    let pctText = '';
    
    if (annualBudget > 0) {
      pct = Math.round((spent / annualBudget) * 100);
      pctText = `${pct}%`;
    } else if (spent > 0) {
      pct = 100;
      pctText = '—';
    } else {
      pct = 0;
      pctText = '0%';
    }
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${c.name}</strong></td>
      <td>${formatCurrency(annualBudget)}</td>
      <td>${formatCurrency(spent)}</td>
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="progress-bar-container" style="width: 55px; height: 6px; flex-shrink: 0;">
            <div class="progress-bar-fill ${(annualBudget === 0 && spent > 0) || pct > 100 ? 'danger' : pct > 80 ? 'warning' : 'primary'}" style="width: ${Math.min(100, pct)}%"></div>
          </div>
          <span style="font-size: 11px;">${pctText}</span>
        </div>
      </td>
    `;
    annualCategoriesTbody.appendChild(tr);
  });

  // 6. Savings Goals panel
  const savingsGoalsGrid = document.getElementById('savings-goals-grid');
  savingsGoalsGrid.innerHTML = '';
  
  let totalSavedInGoals = 0;

  state.savingsGoals.forEach(g => {
    const pct = g.target > 0 ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0;
    const remaining = Math.max(0, g.target - g.saved);
    const monthsLeft = calculateMonthsLeft(g.targetDate);
    const monthlyNeeded = calculateMonthlyNeeded(remaining, g.targetDate);
    const goalAccountObj = state.bankAccounts.find(a => a.id === g.account);

    totalSavedInGoals += g.saved;
    
    const card = document.createElement('div');
    card.className = 'card';
    card.id = 'goal-card-' + g.id;
    
    const bannerUrl = g.image || getGoalImage(g.name);
    
    card.innerHTML = `
      <div class="goal-card-top" style="align-items: center; justify-content: flex-start; gap: 12px; margin-bottom: 14px;">
        <img class="goal-icon-img" src="${bannerUrl}" alt="Goal Icon">
        <div style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px;">
          <h4 class="goal-name-label" style="margin: 0; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; line-height: 1.2;">${g.name}</h4>
          <span class="goal-account" style="font-size: 11px; color: var(--text-muted); white-space: nowrap;">🏦 Storage: ${goalAccountObj ? goalAccountObj.name : 'allied'}</span>
          <div style="display: flex; align-items: center; margin-top: 2px;">
            <span class="badge ${pct === 100 ? 'badge-success' : 'badge-info'}" style="font-size: 9px; padding: 2px 6px; border-radius: 4px; line-height: 1; display: inline-block;">${pct === 100 ? 'Completed' : 'In Progress'}</span>
          </div>
        </div>
        <div style="flex-shrink: 0; margin-left: auto;">
          <button class="goal-complete-btn" onclick="completeGoal('${g.id}')" title="Remove goal" style="margin-left: 4px;">
            <i data-lucide="x" style="width: 16px; height: 16px;"></i>
          </button>
        </div>
      </div>
      
      <div class="goal-progress-section">
        <div class="progress-bar-container">
          <div class="progress-bar-fill secondary" style="width: ${pct}%"></div>
        </div>
        <div class="goal-progress-info">
          <span>${formatCurrency(g.saved)} saved</span>
          <span class="goal-target-val">Target: ${formatCurrency(g.target)}</span>
        </div>
      </div>
      
      <div class="goal-details">
        <div class="goal-detail-item">
          <span class="goal-detail-label">Remaining</span>
          <span class="goal-detail-val" style="color: ${remaining > 0 ? 'var(--secondary)' : 'var(--success)'}">${formatCurrency(remaining)}</span>
        </div>
        <div class="goal-detail-item">
          <span class="goal-detail-label">Monthly Needed</span>
          <span class="goal-detail-val">${monthlyNeeded > 0 ? formatCurrency(monthlyNeeded) : '—'}</span>
        </div>
        <div class="goal-detail-item">
          <span class="goal-detail-label">Target Date</span>
          <span class="goal-detail-val">${g.targetDate ? getFormattedDate(g.targetDate) : 'Not set'}</span>
        </div>
        <div class="goal-detail-item">
          <span class="goal-detail-label">Months Left</span>
          <span class="goal-detail-val">${monthsLeft > 0 ? monthsLeft + ' months' : '<span style="color: var(--danger)">Overdue</span>'}</span>
        </div>
      </div>

      <div class="goal-card-actions">
        <button class="btn btn-secondary" onclick="openDepositToGoalModal('${g.id}')" ${pct === 100 ? 'disabled' : ''}>
          <i data-lucide="plus-circle" style="width: 14px; height: 14px;"></i>
          <span>Allocate Funds</span>
        </button>
      </div>
    `;
    savingsGoalsGrid.appendChild(card);
  });

  document.getElementById('goals-total-available').innerText = formatCurrency(totalSavedInGoals);

  // 7. Bank Accounts Strategy panel
  const netCash = state.bankAccounts.reduce((sum, a) => sum + a.balance, 0);
  const netCashEl = document.getElementById('accounts-net-cash');
  if (netCashEl) {
    netCashEl.innerText = formatCurrency(netCash);
    if (netCash > 0) {
      netCashEl.style.color = 'var(--success)';
    } else if (netCash < 0) {
      netCashEl.style.color = 'var(--danger)';
    } else {
      netCashEl.style.color = 'var(--text-muted)';
    }
  }
  
  const bankAccountsGrid = document.getElementById('bank-accounts-grid');
  bankAccountsGrid.innerHTML = '';
  state.bankAccounts.forEach(acc => {
    let balColor = 'var(--text-main)';
    if (acc.balance > 0) {
      balColor = 'var(--success)';
    } else if (acc.balance < 0) {
      balColor = 'var(--danger)';
    } else {
      balColor = 'var(--text-muted)';
    }
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="account-card-header">
        <h4 class="account-card-title">${acc.name}</h4>
        <span class="badge ${acc.balance >= 0 ? 'badge-success' : 'badge-danger'}">${acc.type}</span>
      </div>
      <div class="account-bank">${acc.bank}</div>
      <div class="account-balance-area">
        <div class="account-balance-lbl">Current Balance</div>
        <div class="account-balance-val" style="color: ${balColor}">${formatCurrency(acc.balance)}</div>
      </div>
      <div class="account-purpose">${acc.purpose}</div>
    `;
    bankAccountsGrid.appendChild(card);
  });

  // 8. Transactions Tab Ledger (filtered by selected month)
  const allTxTbody = document.getElementById('all-tx-tbody');
  const txEmptyState = document.getElementById('tx-empty-state');
  allTxTbody.innerHTML = '';

  const ledgerTxs = state.transactions
    .filter(tx => tx.date.startsWith(state.selectedMonth))
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (ledgerTxs.length === 0) {
    txEmptyState.style.display = 'flex';
  } else {
    txEmptyState.style.display = 'none';
    
    ledgerTxs.forEach(tx => {
      let typeBadge = '';
      let amountClass = '';
      let details = '';
      let categoryCol = '—';
      
      const accObj = state.bankAccounts.find(a => a.id === tx.account);
      const destAccObj = state.bankAccounts.find(a => a.id === tx.destAccount);
      let accountCol = accObj ? accObj.name : (tx.account || '—');

      if (tx.type === 'income') {
        typeBadge = '<span class="badge badge-success">Income</span>';
        amountClass = 'income';
        details = 'Inflow';
        categoryCol = tx.category || 'Inflow';
      } else if (tx.type === 'expense') {
        typeBadge = '<span class="badge badge-danger">Expense</span>';
        amountClass = 'expense';
        details = 'Outflow';
        categoryCol = tx.category;
      } else if (tx.type === 'savings_transfer') {
        typeBadge = '<span class="badge badge-info">Transfer</span>';
        amountClass = 'savings';
        details = 'Account Transfer';
        accountCol = `${accObj ? accObj.name : 'Source'} ➔ ${destAccObj ? destAccObj.name : 'Destination'}`;
      } else if (tx.type === 'goal_allocation') {
        typeBadge = '<span class="badge badge-warning">Goal Deposit</span>';
        amountClass = 'savings';
        const goalObj = state.savingsGoals.find(g => g.id === tx.goalId);
        details = `Allocated to ${goalObj ? goalObj.name : 'Savings Goal'}`;
        
        const goalAccObj = goalObj ? state.bankAccounts.find(a => a.id === goalObj.account) : null;
        accountCol = `${accObj ? accObj.name : 'Source'} ➔ ${goalAccObj ? goalAccObj.name : 'Savings Goal'}`;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${getFormattedDate(tx.date)}</td>
        <td>${typeBadge}</td>
        <td><strong>${tx.description}</strong></td>
        <td>${categoryCol}</td>
        <td>${accountCol}</td>
        <td class="tx-amount ${amountClass}"><strong>${tx.type === 'income' ? '+' : '-'} ${formatCurrency(tx.amount)}</strong></td>
        <td>
          <button class="tx-delete-btn" onclick="deleteTransaction('${tx.id}')">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      `;
      allTxTbody.appendChild(tr);
    });
  }

  // 8a. Subscriptions Tab Panel Rendering
  const subsTbody = document.getElementById('subs-tbody');
  const subTotalNet = document.getElementById('sub-total-net');
  if (subsTbody) {
    subsTbody.innerHTML = '';
    if (!state.subscriptions) state.subscriptions = [];
    
    let netFlow = 0;
    state.subscriptions.forEach(sub => {
      const type = sub.type || 'expense';
      if (type === 'income') {
        netFlow += Number(sub.amount);
      } else {
        netFlow -= Number(sub.amount);
      }
      
      const accObj = state.bankAccounts.find(a => a.id === sub.account);
      
      const deterministicId = `tx_rec_${sub.id}_${state.selectedMonth}`;
      const isPaid = state.transactions.some(tx => tx.id === deterministicId);
      const isDeleted = state.deletedRecurring && state.deletedRecurring.includes(deterministicId);
      
      let statusBadge = '';
      if (isDeleted) {
        statusBadge = '<span class="badge badge-secondary">Skipped / Deleted</span>';
      } else if (isPaid) {
        statusBadge = type === 'income' ? '<span class="badge badge-success">✓ Auto-Deposited</span>' : '<span class="badge badge-success">✓ Auto-Deducted</span>';
      } else {
        statusBadge = '<span class="badge badge-warning">⏳ Pending</span>';
      }
      
      const typeBadge = type === 'income' 
        ? '<span class="badge badge-success">💰 Inflow</span>' 
        : '<span class="badge badge-danger">💸 Outflow</span>';
      
      const tr = document.createElement('tr');
      tr.id = 'sub-row-' + sub.id;
      const startMonthName = MONTHS_REF.find(m => m.key === (sub.startMonth || '2026-01'))?.name || 'Jan';
      tr.innerHTML = `
        <td><strong>${sub.name}</strong></td>
        <td>${typeBadge}</td>
        <td><strong style="color: ${type === 'income' ? 'var(--success)' : 'var(--danger)'}">${type === 'income' ? '+' : '-'} ${formatCurrency(sub.amount)}</strong></td>
        <td>
          Day ${sub.dayOfMonth}
          <br>
          <small style="color: var(--text-muted); font-size: 10px;">Starts: ${startMonthName}</small>
        </td>
        <td><span class="badge badge-info">${sub.category}</span></td>
        <td>${accObj ? accObj.name : 'Unknown Account'}</td>
        <td>${statusBadge}</td>
        <td>
          <button class="tx-delete-btn" onclick="deleteSubscription('${sub.id}')" title="Delete subscription template">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      `;
      subsTbody.appendChild(tr);
    });
    
    if (subTotalNet) {
      const isPositive = netFlow >= 0;
      subTotalNet.innerText = (isPositive ? "+ " : "- ") + formatCurrency(Math.abs(netFlow));
      subTotalNet.style.color = isPositive ? 'var(--success)' : 'var(--danger)';
    }
  }

  // 8b. Credits & Debts Tab Panel Rendering
  const debtsTbody = document.getElementById('debts-tbody');
  const debtTotalVal = document.getElementById('debt-total-owed');
  const creditTotalVal = document.getElementById('credit-total-receivable');
  if (debtsTbody) {
    debtsTbody.innerHTML = '';
    if (!state.debts) state.debts = [];
    
    let totalOwed = 0;
    let totalReceivable = 0;
    
    state.debts.forEach(d => {
      const isCredit = d.type === 'credit';
      if (isCredit) {
        totalReceivable += Number(d.remaining);
      } else {
        totalOwed += Number(d.remaining);
      }
      
      const repaidPct = d.amount > 0 ? Math.min(100, Math.round(((d.amount - d.remaining) / d.amount) * 100)) : 0;
      const isCreditBadge = isCredit 
        ? `<span class="badge badge-success" style="font-size: 9px; padding: 2px 4px; font-weight: 600;">Credit (Receivable)</span>`
        : `<span class="badge badge-danger" style="font-size: 9px; padding: 2px 4px; font-weight: 600;">Debt (Liability)</span>`;
      
      const tr = document.createElement('tr');
      tr.id = 'debt-row-' + d.id;
      tr.innerHTML = `
        <td>
          <strong>${d.person}</strong>
          <div style="margin-top: 4px;">${isCreditBadge}</div>
        </td>
        <td>${d.description}</td>
        <td>${formatCurrency(d.amount)}</td>
        <td style="color: ${d.remaining > 0 ? (isCredit ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)'}; font-weight: 700;">${formatCurrency(d.remaining)}</td>
        <td>${d.dueDate ? getFormattedDate(d.dueDate) : 'No due date'}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="progress-bar-container" style="width: 60px; height: 6px;">
              <div class="progress-bar-fill success" style="width: ${repaidPct}%"></div>
            </div>
            <span>${repaidPct}%</span>
          </div>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px; width: 80px; justify-content: center;" onclick="openRepayDebtModal('${d.id}')" ${d.remaining <= 0 ? 'disabled' : ''}>
              <i data-lucide="plus-circle" style="width: 12px; height: 12px;"></i>
              <span>${isCredit ? 'Receive' : 'Repay'}</span>
            </button>
            <button class="tx-delete-btn" onclick="deleteDebt('${d.id}')" title="Remove debt record">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      `;
      debtsTbody.appendChild(tr);
    });
    if (debtTotalVal) debtTotalVal.innerText = formatCurrency(totalOwed);
    if (creditTotalVal) creditTotalVal.innerText = formatCurrency(totalReceivable);
  }

  // Populate debt account dropdown in the form
  const debtAccountSelect = document.getElementById('debt-account');
  if (debtAccountSelect) {
    debtAccountSelect.innerHTML = '';
    state.bankAccounts.forEach(acc => {
      debtAccountSelect.innerHTML += `<option value="${acc.id}">${acc.name} (${acc.bank})</option>`;
    });
  }

  // Refresh icons
  lucide.createIcons();

  // If active tab is tools, refresh the active sub-tab
  const toolsTab = document.getElementById('tools-panel');
  if (toolsTab && toolsTab.classList.contains('active')) {
    const activeSubtabBtn = document.querySelector('.tools-subnav-btn.active');
    if (activeSubtabBtn) {
      const subtabId = activeSubtabBtn.getAttribute('data-subtab');
      if (subtabId === 'tools-insights') {
        renderInsightsPanel();
      } else if (subtabId === 'tools-whatif') {
        renderWhatIfSetup();
      } else if (subtabId === 'tools-wishlist') {
        renderWishlist();
      } else if (subtabId === 'tools-joy') {
        renderJoyMapping();
      }
    } else {
      switchSubtab('tools-insights');
    }
  }

  // 9. Load Charts
  renderCharts(metrics, annual);
  
  // Refresh top balances widget values
  if (typeof updateTopBalancesDisplay === 'function') {
    updateTopBalancesDisplay();
  }

  // Keep subscription dropdowns in sync with selected month/year
  populateSubscriptionFormDropdowns();
}

// Chart Renderings
function renderCharts(metrics, annual) {
  // Chart 1: Category Expenses Donut
  const expenseCanvas = document.getElementById('expenseChart');
  if (expenseCanvas) {
    const expenseLabels = [];
    const expenseData = [];
    const expenseColors = [
      '#E4002B', '#ff2d55', '#ff6b8a', '#F5C518', '#fcd34d', 
      '#f59e0b', '#ef4444', '#f87171', '#c084fc', '#a855f7',
      '#38bdf8', '#10b981', '#34d399', '#84cc16', '#fb923c', '#e11d48'
    ];

    state.categories.forEach(c => {
      const spent = metrics.categorySpent[c.name] || 0;
      if (spent > 0) {
        expenseLabels.push(c.name);
        expenseData.push(spent);
      }
    });

    if (expenseChartInstance) {
      expenseChartInstance.destroy();
    }

    const isDark = document.body.getAttribute('data-theme') !== 'light';

    if (expenseData.length === 0) {
      expenseChartInstance = new Chart(expenseCanvas, {
        type: 'doughnut',
        data: {
          labels: ['No Expenses in Selected Month'],
          datasets: [{
            data: [1],
            backgroundColor: [isDark ? '#1e293b' : '#e2e8f0'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: isDark ? '#94a3b8' : '#64748b' } }
          }
        }
      });
    } else {
      expenseChartInstance = new Chart(expenseCanvas, {
        type: 'doughnut',
        data: {
          labels: expenseLabels,
          datasets: [{
            data: expenseData,
            backgroundColor: expenseColors.slice(0, expenseData.length),
            borderColor: isDark ? '#0c1322' : '#ffffff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: isDark ? '#f8fafc' : '#0f172a',
                font: { family: 'Inter', size: 11 }
              }
            }
          }
        }
      });
    }
  }

  // Chart 2: Savings Goals progress
  const goalsCanvas = document.getElementById('goalsChart');
  if (goalsCanvas) {
    const goalLabels = [];
    const goalSavedData = [];
    const goalRemainingData = [];

    state.savingsGoals.forEach(g => {
      goalLabels.push(g.name);
      goalSavedData.push(g.saved);
      goalRemainingData.push(Math.max(0, g.target - g.saved));
    });

    if (goalsChartInstance) {
      goalsChartInstance.destroy();
    }

    const isDark = document.body.getAttribute('data-theme') !== 'light';

    goalsChartInstance = new Chart(goalsCanvas, {
      type: 'bar',
      data: {
        labels: goalLabels,
        datasets: [
          {
            label: 'Saved Amount',
            data: goalSavedData,
            backgroundColor: '#E4002B',
            borderRadius: 6
          },
          {
            label: 'Remaining Target',
            data: goalRemainingData,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.18)' : '#e2e8f0',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.35)' : '#cbd5e1',
            borderWidth: 1,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: {
            stacked: true,
            grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
            ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { family: 'Inter' } }
          },
          y: {
            stacked: true,
            grid: { display: false },
            ticks: { color: isDark ? '#f8fafc' : '#0f172a', font: { family: 'Outfit', weight: '600' } }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: isDark ? '#94a3b8' : '#64748b', font: { family: 'Inter' } }
          }
        }
      }
    });
  }

  // Chart 3: Annual Income vs Expense Trends
  const annualCanvas = document.getElementById('annualTrendChart');
  if (annualCanvas) {
    const months = annual.monthsData.map(m => m.name);
    const incomeTrend = annual.monthsData.map(m => m.income);
    const expenseTrend = annual.monthsData.map(m => m.expense);

    if (annualTrendChartInstance) {
      annualTrendChartInstance.destroy();
    }

    const isDark = document.body.getAttribute('data-theme') !== 'light';

    annualTrendChartInstance = new Chart(annualCanvas, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Monthly Income',
            data: incomeTrend,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.05)',
            tension: 0.4,
            fill: true,
            borderWidth: 3,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#10b981',
            pointHoverRadius: 6
          },
          {
            label: 'Monthly Expenses',
            data: expenseTrend,
            borderColor: '#E4002B',
            backgroundColor: 'rgba(228, 0, 43, 0.05)',
            tension: 0.4,
            fill: true,
            borderWidth: 3,
            pointBackgroundColor: '#E4002B',
            pointBorderColor: '#E4002B',
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
            ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { family: 'Inter' } }
          },
          y: {
            grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
            ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { family: 'Inter' } }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: isDark ? '#f8fafc' : '#0f172a', font: { family: 'Inter' } }
          }
        }
      }
    });
  }

  // Render forecast and comparison charts if canvas exists
  renderForecastCharts();
}

// ─── SMART INSIGHTS ENGINE ───

// Get spending per category for a given month key (YYYY-MM)
function getCategorySpendingForMonth(monthKey) {
  const spending = {};
  state.categories.forEach(c => { spending[c.name] = 0; });
  state.transactions.forEach(tx => {
    if (tx.type === 'expense' && tx.date.startsWith(monthKey) && spending[tx.category] !== undefined) {
      spending[tx.category] += Number(tx.amount);
    }
  });
  return spending;
}

// Get the previous N months' keys relative to the selected month
function getPreviousMonthKeys(currentMonthKey, count) {
  const idx = MONTHS_REF.findIndex(m => m.key === currentMonthKey);
  const keys = [];
  for (let i = 1; i <= count; i++) {
    const prevIdx = idx - i;
    if (prevIdx >= 0) keys.push(MONTHS_REF[prevIdx].key);
  }
  return keys;
}

// Compute 3-month rolling average spending per category
function compute3MonthAverage(currentMonthKey) {
  const prevKeys = getPreviousMonthKeys(currentMonthKey, 3);
  if (prevKeys.length === 0) return null;
  
  const totals = {};
  state.categories.forEach(c => { totals[c.name] = 0; });
  
  prevKeys.forEach(mk => {
    const spending = getCategorySpendingForMonth(mk);
    Object.keys(spending).forEach(cat => {
      totals[cat] += spending[cat];
    });
  });
  
  const averages = {};
  Object.keys(totals).forEach(cat => {
    averages[cat] = totals[cat] / prevKeys.length;
  });
  
  return averages;
}

// Generate smart nudge data objects
function generateSmartNudges() {
  const nudges = [];
  const currentMonth = state.selectedMonth;
  const selectedYear = currentMonth ? Number(currentMonth.split('-')[0]) : 2026;
  const currentSpending = getCategorySpendingForMonth(currentMonth);
  const averages = compute3MonthAverage(currentMonth);
  
  const today = new Date();
  const currentMonthDate = new Date(currentMonth + '-01');
  const daysInMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0).getDate();
  const dayOfMonth = (currentMonth === today.toISOString().slice(0, 7)) ? today.getDate() : daysInMonth;
  const daysLeft = daysInMonth - dayOfMonth;
  
  // 1. Spending Anomalies (vs 3-month average)
  if (averages) {
    state.categories.forEach(c => {
      const spent = currentSpending[c.name] || 0;
      const avg = averages[c.name] || 0;
      
      if (avg > 500 && spent > 0) { // Only flag if average is meaningful
        const deviation = ((spent - avg) / avg) * 100;
        
        if (deviation > 25) {
          nudges.push({
            type: 'spike',
            label: 'Spending Spike',
            icon: 'trending-up',
            message: `Your <strong>${c.name}</strong> spending is <strong>${Math.round(deviation)}% higher</strong> than your 3-month average`,
            priority: deviation,
            category: c.name
          });
        } else if (deviation < -30 && spent > 0) {
          nudges.push({
            type: 'saving',
            label: 'Savings Win',
            icon: 'piggy-bank',
            message: `Nice! Your <strong>${c.name}</strong> spending is <strong>${Math.round(Math.abs(deviation))}% below</strong> your 3-month average`,
            priority: Math.abs(deviation) * 0.5,
            category: c.name
          });
        }
      }
    });
  }
  
  // 2. Budget Warnings (approaching limit with days remaining)
  if (daysLeft > 0) {
    state.categories.forEach(c => {
      const budget = getBudgetForCategory(currentMonth, c.name);
      const spent = currentSpending[c.name] || 0;
      
      if (budget > 0) {
        const usedPct = (spent / budget) * 100;
        if (usedPct >= 80 && usedPct < 100) {
          nudges.push({
            type: 'warning',
            label: 'Budget Warning',
            icon: 'alert-triangle',
            message: `You've used <strong>${Math.round(usedPct)}%</strong> of your <strong>${c.name}</strong> budget with <strong>${daysLeft} days</strong> left`,
            priority: usedPct,
            category: c.name
          });
        }
      }
    });
  }
  
  // 3. Goal Progress
  state.savingsGoals.forEach(g => {
    if (g.target <= 0) return;
    const pctSaved = (g.saved / g.target) * 100;
    const targetDate = new Date(g.targetDate);
    const totalDays = (targetDate - new Date(selectedYear, 0, 1)) / (1000 * 60 * 60 * 24);
    const elapsedDays = (today - new Date(selectedYear, 0, 1)) / (1000 * 60 * 60 * 24);
    const expectedPct = totalDays > 0 ? Math.min(100, (elapsedDays / totalDays) * 100) : 100;
    
    if (pctSaved >= expectedPct + 10 && pctSaved > 5) {
      nudges.push({
        type: 'goal',
        label: 'Goal On Track',
        icon: 'target',
        message: `You're <strong>ahead of schedule</strong> on your <strong>${g.name}</strong> goal — keep it up!`,
        priority: 40,
        category: g.name
      });
    } else if (pctSaved < expectedPct - 20 && expectedPct > 15) {
      const remaining = g.target - g.saved;
      const monthsLeft = Math.max(1, Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24 * 30)));
      const monthlyNeeded = Math.round(remaining / monthsLeft);
      nudges.push({
        type: 'goal-risk',
        label: 'Goal At Risk',
        icon: 'alert-circle',
        message: `Your <strong>${g.name}</strong> goal needs <strong>${formatCurrency(monthlyNeeded)}/month</strong> to stay on track`,
        priority: 55,
        category: g.name
      });
    }
  });
  
  // 4. Savings Tips (pair surplus budget with behind goals)
  const behindGoals = state.savingsGoals.filter(g => {
    if (g.target <= 0) return false;
    const pctSaved = (g.saved / g.target) * 100;
    const targetDate = new Date(g.targetDate);
    const totalDays = (targetDate - new Date(selectedYear, 0, 1)) / (1000 * 60 * 60 * 24);
    const elapsedDays = (today - new Date(selectedYear, 0, 1)) / (1000 * 60 * 60 * 24);
    const expectedPct = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 100;
    return pctSaved < expectedPct - 5 && g.saved < g.target;
  });
  
  if (behindGoals.length > 0) {
    // Find categories with budget surplus
    const surplusCategories = state.categories
      .map(c => ({
        name: c.name,
        budget: getBudgetForCategory(currentMonth, c.name),
        spent: currentSpending[c.name] || 0
      }))
      .filter(c => c.budget > 0 && c.spent < c.budget * 0.5)
      .sort((a, b) => (b.budget - b.spent) - (a.budget - a.spent));
    
    if (surplusCategories.length > 0) {
      const topSurplus = surplusCategories[0];
      const suggestedCut = Math.round((topSurplus.budget - topSurplus.spent) * 0.5 / 500) * 500;
      const targetGoal = behindGoals[0];
      
      if (suggestedCut >= 500) {
        const remaining = targetGoal.target - targetGoal.saved;
        const monthsSaved = remaining > 0 ? Math.max(1, Math.floor(suggestedCut / (remaining / 6))) : 0;
        
        nudges.push({
          type: 'tip',
          label: 'Savings Tip',
          icon: 'lightbulb',
          message: `Reducing <strong>${topSurplus.name}</strong> by <strong>${formatCurrency(suggestedCut)}</strong> could fund your <strong>${targetGoal.name}</strong> faster`,
          priority: 45,
          category: topSurplus.name
        });
      }
    }
  }
  
  // Sort by priority and return top nudges
  nudges.sort((a, b) => b.priority - a.priority);
  return nudges;
}

// Show smart nudge toasts
function showSmartNudges() {
  const container = document.getElementById('smart-nudge-container');
  if (!container) return;
  
  // Check session storage to avoid repeating
  const shownKey = 'totality_nudges_shown_' + state.selectedMonth;
  if (sessionStorage.getItem(shownKey)) return;
  
  const nudges = generateSmartNudges();
  if (nudges.length === 0) return;
  
  const toShow = nudges.slice(0, 3);
  
  toShow.forEach((nudge, index) => {
    setTimeout(() => {
      const nudgeId = 'nudge_' + Date.now() + '_' + index;
      const el = document.createElement('div');
      el.className = `smart-nudge ${nudge.type}`;
      el.id = nudgeId;
      el.innerHTML = `
        <div class="smart-nudge-icon">
          <i data-lucide="${nudge.icon}"></i>
        </div>
        <div class="smart-nudge-body">
          <span class="smart-nudge-label">${nudge.label}</span>
          <div class="smart-nudge-msg">${nudge.message}</div>
        </div>
        <button class="smart-nudge-close" onclick="dismissNudge('${nudgeId}')">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="smart-nudge-timer"></div>
      `;
      
      container.appendChild(el);
      lucide.createIcons({ nodes: [el] });
      
      // Auto-dismiss after 6 seconds
      setTimeout(() => {
        dismissNudge(nudgeId);
      }, 6000);
    }, 1500 * index);
  });
  
  sessionStorage.setItem(shownKey, 'true');
}

// Dismiss a single nudge toast
function dismissNudge(nudgeId) {
  const el = document.getElementById(nudgeId);
  if (!el || el.classList.contains('dismissing')) return;
  
  el.classList.add('dismissing');
  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 400);
}

// ─── SMART INSIGHTS PANEL ───

function computeSmartInsights() {
  const currentMonth = state.selectedMonth;
  const currentSpending = getCategorySpendingForMonth(currentMonth);
  const averages = compute3MonthAverage(currentMonth);
  const metrics = computeMetrics();
  
  // Health Score Computation
  // Factor 1: Savings Rate (30 points)
  let savingsScore = 0;
  if (metrics.totalIncome > 0) {
    const savingsRate = metrics.netSavings / metrics.totalIncome;
    savingsScore = Math.max(0, Math.min(30, Math.round(savingsRate * 100)));
  }
  
  // Factor 2: Budget Adherence (25 points)
  let budgetScore = 0;
  let categoriesWithBudget = 0;
  let categoriesOnTrack = 0;
  state.categories.forEach(c => {
    const budget = getBudgetForCategory(currentMonth, c.name);
    if (budget > 0) {
      categoriesWithBudget++;
      const spent = currentSpending[c.name] || 0;
      if (spent <= budget) categoriesOnTrack++;
    }
  });
  if (categoriesWithBudget > 0) {
    budgetScore = Math.round((categoriesOnTrack / categoriesWithBudget) * 25);
  } else {
    budgetScore = 12; // Neutral
  }
  
  // Factor 3: Debt Ratio (20 points)
  let debtScore = 20;
  const totalDebt = state.debts
    .filter(d => d.type !== 'credit')
    .reduce((sum, d) => sum + (d.remaining !== undefined ? d.remaining : d.amount), 0);
  if (metrics.totalIncome > 0 && totalDebt > 0) {
    const debtRatio = totalDebt / (metrics.totalIncome * 12);
    debtScore = Math.max(0, Math.round(20 * (1 - Math.min(1, debtRatio))));
  }
  
  // Factor 4: Goal Progress (25 points)
  let goalScore = 0;
  if (state.savingsGoals.length > 0) {
    let totalProgress = 0;
    state.savingsGoals.forEach(g => {
      if (g.target > 0) {
        totalProgress += Math.min(1, g.saved / g.target);
      }
    });
    goalScore = Math.round((totalProgress / state.savingsGoals.length) * 25);
  } else {
    goalScore = 12;
  }
  
  const totalScore = Math.min(100, savingsScore + budgetScore + debtScore + goalScore);
  
  // Anomalies
  const anomalies = [];
  if (averages) {
    state.categories.forEach(c => {
      const spent = currentSpending[c.name] || 0;
      const avg = averages[c.name] || 0;
      
      if (avg > 200) {
        const deviation = ((spent - avg) / avg) * 100;
        if (deviation > 25) {
          anomalies.push({
            type: 'spike',
            category: c.name,
            spent,
            average: Math.round(avg),
            deviation: Math.round(deviation)
          });
        } else if (deviation < -30 && spent > 0) {
          anomalies.push({
            type: 'saving',
            category: c.name,
            spent,
            average: Math.round(avg),
            deviation: Math.round(Math.abs(deviation))
          });
        }
      }
    });
    
    // Budget warnings
    state.categories.forEach(c => {
      const budget = getBudgetForCategory(currentMonth, c.name);
      const spent = currentSpending[c.name] || 0;
      if (budget > 0 && spent > budget) {
        anomalies.push({
          type: 'warning',
          category: c.name,
          spent,
          average: budget,
          deviation: Math.round(((spent - budget) / budget) * 100)
        });
      }
    });
  }
  
  anomalies.sort((a, b) => b.deviation - a.deviation);
  
  // Advisor suggestions
  const advisor = [];
  state.savingsGoals.forEach(g => {
    if (g.target <= 0 || g.saved >= g.target) return;
    
    const remaining = g.target - g.saved;
    const targetDate = new Date(g.targetDate);
    const today = new Date();
    const monthsLeft = Math.max(1, Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24 * 30)));
    const monthlyNeeded = remaining / monthsLeft;
    
    // Find budget categories with surplus
    const surplusCategories = state.categories
      .map(c => ({
        name: c.name,
        budget: getBudgetForCategory(currentMonth, c.name),
        spent: currentSpending[c.name] || 0
      }))
      .filter(c => c.budget > 0 && c.budget - c.spent > 1000)
      .sort((a, b) => (b.budget - b.spent) - (a.budget - a.spent));
    
    if (surplusCategories.length > 0) {
      const top = surplusCategories[0];
      const suggestedCut = Math.round((top.budget - top.spent) * 0.4 / 500) * 500;
      
      if (suggestedCut >= 500) {
        const newMonthsNeeded = remaining / (monthlyNeeded + suggestedCut);
        const monthsSaved = Math.max(0, monthsLeft - Math.ceil(newMonthsNeeded));
        
        advisor.push({
          goal: g.name,
          category: top.name,
          cut: suggestedCut,
          monthsSaved: Math.min(monthsSaved, monthsLeft - 1),
          remaining,
          monthlyNeeded: Math.round(monthlyNeeded)
        });
      }
    }
  });
  
  return {
    totalScore,
    factors: {
      savings: { score: savingsScore, max: 30 },
      budget: { score: budgetScore, max: 25 },
      debt: { score: debtScore, max: 20 },
      goals: { score: goalScore, max: 25 }
    },
    anomalies,
    advisor
  };
}

// ─── BURN RATE SPEEDOMETER CALCULATION ───

function computeBurnRate() {
  const currentMonth = state.selectedMonth;
  
  let income = 0;
  let recurring = 0;
  let savings = 0;
  let debt = 0;
  let discretionarySpent = 0;
  
  state.transactions.forEach(tx => {
    if (!tx.date.startsWith(currentMonth)) return;
    const amt = Number(tx.amount);
    
    if (tx.type === 'income') {
      income += amt;
    } else if (tx.type === 'goal_allocation' || tx.type === 'savings_transfer') {
      savings += amt;
    } else if (tx.type === 'expense') {
      if (tx.category === 'Loan Payment' || tx.debtId) {
        debt += amt;
      } else {
        const isRecurring = (state.subscriptions || []).some(sub => 
          sub.type !== 'income' && 
          tx.description.includes(sub.name)
        );
        if (isRecurring) {
          recurring += amt;
        } else {
          discretionarySpent += amt;
        }
      }
    }
  });

  // Fallback for income if none registered yet
  if (income === 0) {
    (state.subscriptions || []).forEach(sub => {
      if (sub.type === 'income') {
        const subStart = sub.startMonth || '2026-01';
        if (currentMonth >= subStart) income += Number(sub.amount);
      }
    });
  }
  
  // Base fixed expense calculations
  const processedSubNames = new Set(
    state.transactions
      .filter(tx => tx.date.startsWith(currentMonth) && tx.type === 'expense')
      .map(tx => tx.description)
  );
  (state.subscriptions || []).forEach(sub => {
    if (sub.type !== 'income') {
      const subStart = sub.startMonth || '2026-01';
      if (currentMonth >= subStart && !processedSubNames.has(`🔁 ${sub.name}`)) {
        recurring += Number(sub.amount);
      }
    }
  });
  
  const discretionaryPool = Math.max(0, income - recurring - savings - debt);
  
  // Time elapsed fraction
  const today = new Date();
  const currentMonthStr = today.toISOString().slice(0, 7);
  
  let elapsedFraction = 1.0;
  let daysInMonth = 30;
  let currentDay = 30;
  
  const year = parseInt(currentMonth.substring(0, 4));
  const month = parseInt(currentMonth.substring(5, 7));
  daysInMonth = new Date(year, month, 0).getDate();
  
  if (currentMonth === currentMonthStr) {
    currentDay = today.getDate();
    elapsedFraction = Math.max(0.03, currentDay / daysInMonth);
  } else if (currentMonth > currentMonthStr) {
    elapsedFraction = 0.01;
  } else {
    elapsedFraction = 1.0;
  }
  
  let burnRate = 0;
  if (discretionaryPool > 0) {
    burnRate = (discretionarySpent / discretionaryPool) / elapsedFraction;
  } else if (discretionarySpent > 0) {
    burnRate = 2.0;
  }
  
  return {
    discretionaryPool,
    discretionarySpent,
    elapsedFraction,
    currentDay,
    daysInMonth,
    burnRate: Math.max(0, burnRate)
  };
}

function renderBurnRateGauge() {
  const data = computeBurnRate();
  
  const arc = document.getElementById('burn-gauge-arc');
  const needleGroup = document.getElementById('burn-needle-group');
  const valueEl = document.getElementById('burn-rate-value');
  const paceEl = document.getElementById('burn-rate-pace');
  const detailsEl = document.getElementById('burn-details-text');
  
  if (!valueEl || !detailsEl) return;
  
  const burnRatePct = Math.round(data.burnRate * 100);
  const circumference = Math.PI * 70; // ~219.9
  const fillFraction = Math.min(1.0, data.burnRate);
  const offset = circumference - fillFraction * circumference;
  const angle = Math.min(210, data.burnRate * 180);
  
  let paceColor = '#10b981';
  let paceText = '🟢 Safe Spend Pace';
  let adviceClass = 'safe';
  let adviceText = '';
  
  if (data.burnRate > 1.1) {
    paceColor = '#ef4444';
    paceText = '🔴 Speeding (Over Burn)';
    adviceClass = 'danger';
  } else if (data.burnRate >= 0.95) {
    paceColor = '#f59e0b';
    paceText = '🟡 Critical Limit';
    adviceClass = 'warning';
  } else if (data.burnRate >= 0.75) {
    paceColor = '#f59e0b';
    paceText = '🟡 Warning (Moderate)';
    adviceClass = 'warning';
  }
  
  valueEl.textContent = `${burnRatePct}%`;
  valueEl.style.color = paceColor;
  paceEl.textContent = paceText;
  paceEl.style.color = paceColor;
  
  if (arc) {
    arc.style.strokeDashoffset = offset;
  }
  if (needleGroup) {
    needleGroup.style.transform = `rotate(${angle}deg)`;
  }
  
  const spentStr = formatCurrency(data.discretionarySpent);
  const poolStr = formatCurrency(data.discretionaryPool);
  const remainingDays = data.daysInMonth - data.currentDay;
  
  let detailsHTML = `
    <div>Spent: <strong>${spentStr}</strong> / Discretionary Pool: <strong>${poolStr}</strong></div>
    <div style="margin-top: 4px;">Pace: <strong>${formatCurrency(Math.round(data.discretionarySpent / data.currentDay))}/day</strong> (Day ${data.currentDay} of ${data.daysInMonth})</div>
  `;
  
  const isCurrentMonth = (data.elapsedFraction > 0 && data.elapsedFraction < 1.0);
  
  if (!isCurrentMonth) {
    if (data.elapsedFraction === 1.0) {
      if (data.discretionarySpent > data.discretionaryPool) {
        adviceClass = 'danger';
        adviceText = `🔴 <strong>Over Spent:</strong> You exceeded your discretionary pool by <strong>${formatCurrency(data.discretionarySpent - data.discretionaryPool)}</strong> in this month.`;
      } else if (data.discretionaryPool > 0) {
        adviceClass = 'safe';
        adviceText = `🟢 <strong>Savings Surplus:</strong> Great job! You finished this month with <strong>${formatCurrency(data.discretionaryPool - data.discretionarySpent)}</strong> remaining unspent.`;
      } else {
        adviceClass = 'warning';
        adviceText = `💡 <strong>No Pool:</strong> You did not have a discretionary pool this month and spent <strong>${spentStr}</strong>.`;
      }
    } else {
      adviceClass = 'safe';
      adviceText = `📅 <strong>Month Not Started:</strong> Projections will calculate once this month begins. Your initial discretionary pool is projected at <strong>${poolStr}</strong>.`;
    }
  } else {
    if (data.burnRate > 1.0 && data.discretionarySpent > 0) {
      const dailyPace = data.discretionarySpent / data.currentDay;
      const projectedDaysToEmpty = Math.floor(data.discretionaryPool / dailyPace);
      
      const today = new Date();
      const dryOutDate = new Date(today.getFullYear(), today.getMonth(), projectedDaysToEmpty + 1);
      const dateFormatted = dryOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const daysShort = remainingDays - projectedDaysToEmpty;
      
      adviceText = `⚠️ <strong>High Burn Danger:</strong> Pool will empty in <strong>${projectedDaysToEmpty} days</strong> (${dateFormatted}) — <strong>${daysShort} day${daysShort > 1 ? 's' : ''} before</strong> next paycheck. Reduce variable spending by <strong>${formatCurrency(Math.round(dailyPace - (data.discretionaryPool - data.discretionarySpent) / Math.max(1, remainingDays)))}/day</strong> to make it.`;
    } else if (data.discretionaryPool > 0) {
      const dailyAllowanceRemaining = Math.max(0, Math.round((data.discretionaryPool - data.discretionarySpent) / Math.max(1, remainingDays)));
      adviceText = `✅ <strong>On Pace:</strong> You can safely spend up to <strong>${formatCurrency(dailyAllowanceRemaining)}/day</strong> for the remaining <strong>${remainingDays} days</strong> of this month.`;
    } else {
      adviceText = `💡 <strong>No Pool:</strong> You do not have an active discretionary pool because fixed outflows and savings targets exceed your income.`;
    }
  }
  
  detailsHTML += `
    <div class="burn-details-advice ${adviceClass}">
      ${adviceText}
    </div>
  `;
  
  detailsEl.innerHTML = detailsHTML;
}

function renderInsightsPanel() {
  const insights = computeSmartInsights();
  
  // Health Gauge
  const arc = document.getElementById('health-gauge-arc');
  const scoreEl = document.getElementById('health-score-value');
  const statusEl = document.getElementById('health-score-status');
  
  if (arc && scoreEl && statusEl) {
    const circumference = 2 * Math.PI * 85; // ~534
    const offset = circumference - (insights.totalScore / 100) * circumference;
    
    let gaugeColor = '#ef4444'; // Red
    let statusText = '🔴 Needs Attention';
    if (insights.totalScore >= 80) { gaugeColor = '#22c55e'; statusText = '🟢 Excellent'; }
    else if (insights.totalScore >= 60) { gaugeColor = '#f59e0b'; statusText = '🟡 Good'; }
    else if (insights.totalScore >= 40) { gaugeColor = '#f97316'; statusText = '🟠 Needs Work'; }
    
    arc.style.stroke = gaugeColor;
    arc.style.strokeDashoffset = offset;
    scoreEl.textContent = insights.totalScore;
    statusEl.textContent = statusText;
    statusEl.style.color = gaugeColor;
  }
  
  // Health Factors
  const factorsList = document.getElementById('health-factors-list');
  if (factorsList) {
    const factorConfig = [
      { key: 'savings', label: 'Savings Rate', color: '#22c55e' },
      { key: 'budget', label: 'Budget Adherence', color: '#f59e0b' },
      { key: 'debt', label: 'Debt Management', color: '#38bdf8' },
      { key: 'goals', label: 'Goal Progress', color: '#a855f7' }
    ];
    
    factorsList.innerHTML = factorConfig.map(fc => {
      const f = insights.factors[fc.key];
      const pct = Math.round((f.score / f.max) * 100);
      return `
        <div class="health-factor">
          <span class="health-factor-label">${fc.label}</span>
          <div class="health-factor-bar">
            <div class="health-factor-fill" style="width: ${pct}%; background: ${fc.color};"></div>
          </div>
          <span class="health-factor-value">${f.score}/${f.max}</span>
        </div>
      `;
    }).join('');
  }
  
  // Anomalies
  const anomalyList = document.getElementById('anomaly-list');
  if (anomalyList) {
    if (insights.anomalies.length === 0) {
      anomalyList.innerHTML = `
        <div class="insights-empty">
          <i data-lucide="check-circle"></i>
          <p>No spending anomalies detected this month. Your spending patterns are consistent!</p>
        </div>
      `;
    } else {
      anomalyList.innerHTML = insights.anomalies.map((a, i) => {
        const iconName = a.type === 'spike' ? 'trending-up' : a.type === 'saving' ? 'trending-down' : 'alert-triangle';
        const badgeText = a.type === 'spike' ? `+${a.deviation}%` : a.type === 'saving' ? `-${a.deviation}%` : `+${a.deviation}%`;
        const detail = a.type === 'warning'
          ? `${formatCurrency(a.spent)} spent vs ${formatCurrency(a.average)} budget`
          : `${formatCurrency(a.spent)} this month vs ${formatCurrency(a.average)} avg`;
        
        return `
          <div class="anomaly-card ${a.type}" style="animation-delay: ${i * 0.08}s;">
            <div class="anomaly-icon">
              <i data-lucide="${iconName}"></i>
            </div>
            <div class="anomaly-info">
              <div class="anomaly-category">${a.category}</div>
              <div class="anomaly-detail">${detail}</div>
            </div>
            <span class="anomaly-badge ${a.type}">${badgeText}</span>
          </div>
        `;
      }).join('');
    }
  }
  
  // Advisor
  const advisorList = document.getElementById('advisor-list');
  if (advisorList) {
    if (insights.advisor.length === 0) {
      advisorList.innerHTML = `
        <div class="insights-empty">
          <i data-lucide="sparkles"></i>
          <p>No optimization suggestions right now. Keep tracking your expenses to unlock insights!</p>
        </div>
      `;
    } else {
      advisorList.innerHTML = insights.advisor.map((a, i) => {
        const impactText = a.monthsSaved > 0 
          ? `⚡ Could save ~${a.monthsSaved} month${a.monthsSaved > 1 ? 's' : ''} on timeline`
          : `⚡ Adds ${formatCurrency(a.cut)}/month towards goal`;
        
        return `
          <div class="advisor-card" style="animation-delay: ${i * 0.08}s;">
            <div class="advisor-icon">
              <i data-lucide="lightbulb"></i>
            </div>
            <div class="advisor-text">
              If you reduce <strong>${a.category}</strong> by <strong>${formatCurrency(a.cut)}</strong>, 
              you can accelerate your <strong>${a.goal}</strong> goal
              <span class="advisor-impact">${impactText}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }
  
  // Render the burn rate speedometer
  renderBurnRateGauge();
  
  lucide.createIcons();
}

// ─── FINANCIAL TOOLS SUB-TAB ROUTER ───

function switchSubtab(subtabId) {
  // Active sub-nav button
  document.querySelectorAll('.tools-subnav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-subtab') === subtabId);
  });
  
  // Active sub-panel
  document.querySelectorAll('.tools-subpanel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `${subtabId}-panel`);
  });
  
  // Trigger specific renders
  if (subtabId === 'tools-insights') {
    renderInsightsPanel();
  } else if (subtabId === 'tools-whatif') {
    renderWhatIfSetup();
  } else if (subtabId === 'tools-wishlist') {
    renderWishlist();
  } else if (subtabId === 'tools-joy') {
    renderJoyMapping();
  } else if (subtabId === 'tools-billsplit') {
    renderBillSplitter();
  }
}

// ─── FEATURE 1: WHAT-IF SANDBOX SIMULATOR ───

function renderWhatIfSetup() {
  const listContainer = document.getElementById('whatif-categories-list');
  if (!listContainer) return;
  
  // Populate category list with checkboxes
  listContainer.innerHTML = state.categories.map(c => `
    <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; padding: 4px; color: var(--text-main);">
      <input type="checkbox" class="whatif-cat-checkbox" value="${c.name}">
      <span>${c.name}</span>
    </label>
  `).join('');

  // Setup form listener
  const form = document.getElementById('whatif-form');
  if (form && !form.dataset.bound) {
    form.dataset.bound = 'true';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      runWhatIfSimulation();
    });
    
    // Toggle targeted category checklist visibility
    form.querySelectorAll('input[name="whatif-strategy"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const container = document.getElementById('whatif-targeted-categories-container');
        if (container) {
          container.style.display = e.target.value === 'targeted' ? 'block' : 'none';
        }
      });
    });
  }
}

function runWhatIfSimulation() {
  const name = document.getElementById('whatif-name').value.trim();
  const amount = Number(document.getElementById('whatif-amount').value);
  const type = document.getElementById('whatif-type').value;
  const strategy = document.querySelector('input[name="whatif-strategy"]:checked').value;
  
  if (!name || !amount) return;
  
  const currentMonth = state.selectedMonth;
  
  // Collect current budgets
  const activeBudgets = {};
  let totalBudgeted = 0;
  state.categories.forEach(c => {
    const b = getBudgetForCategory(currentMonth, c.name);
    activeBudgets[c.name] = b;
    if (b > 0) totalBudgeted += b;
  });
  
  const proposedCuts = {};
  
  if (strategy === 'proportional') {
    state.categories.forEach(c => {
      const b = activeBudgets[c.name];
      if (b > 0 && totalBudgeted > 0) {
        proposedCuts[c.name] = Math.round((b / totalBudgeted) * amount);
      } else {
        proposedCuts[c.name] = 0;
      }
    });
  } else {
    const checkedCheckboxes = document.querySelectorAll('.whatif-cat-checkbox:checked');
    const checkedCats = Array.from(checkedCheckboxes).map(cb => cb.value);
    
    if (checkedCats.length === 0) {
      showCustomAlert("Input Required", "Please select at least one category to sacrifice for the targeted strategy.", true);
      return;
    }
    
    const cutPerCategory = Math.round(amount / checkedCats.length);
    state.categories.forEach(c => {
      if (checkedCats.includes(c.name)) {
        proposedCuts[c.name] = cutPerCategory;
      } else {
        proposedCuts[c.name] = 0;
      }
    });
  }
  
  const newBudgets = {};
  let hasNegatives = false;
  state.categories.forEach(c => {
    const cur = activeBudgets[c.name];
    const cut = proposedCuts[c.name] || 0;
    newBudgets[c.name] = cur - cut;
    if (newBudgets[c.name] < 0) {
      hasNegatives = true;
    }
  });
  
  // Render Comparison Table
  const tbody = document.getElementById('whatif-results-tbody');
  tbody.innerHTML = state.categories.map(c => {
    const cur = activeBudgets[c.name];
    const cut = proposedCuts[c.name] || 0;
    const remaining = newBudgets[c.name];
    const isOverSpent = remaining < 0;
    
    return `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td>${formatCurrency(cur)}</td>
        <td style="color: var(--danger); font-weight: 600;">-${formatCurrency(cut)}</td>
        <td style="font-weight: 700; color: ${isOverSpent ? 'var(--danger)' : 'var(--text-main)'};">
          ${formatCurrency(remaining)}
          ${isOverSpent ? '<span style="font-size: 10px; display: block; color: var(--danger);">⚠️ Deficit</span>' : ''}
        </td>
      </tr>
    `;
  }).join('');
  
  // Calculate Sustainability
  const metrics = computeMetrics();
  const originalSavingsRate = metrics.savingsRate;
  
  const newIncome = metrics.totalIncome;
  const newSpent = metrics.totalSpent + amount;
  const newNetSavings = newIncome - newSpent;
  const newSavingsRate = newIncome > 0 ? Math.round((newNetSavings / newIncome) * 100) : 0;
  
  let sustainabilityText = '';
  let statusClass = 'safe';
  
  if (newNetSavings < 0) {
    statusClass = 'danger';
    sustainabilityText = `🔴 <strong>Unsustainable Deficit:</strong> This cost drives monthly cash flow into a deficit of <strong>${formatCurrency(Math.abs(newNetSavings))}</strong>, dropping savings to <strong>${newSavingsRate}%</strong>. Budget cuts alone cannot cover this.`;
  } else if (hasNegatives) {
    statusClass = 'warning';
    sustainabilityText = `🟡 <strong>Budget Strain:</strong> Savings remain positive at <strong>${newSavingsRate}%</strong>, but one or more targeted category budgets have run into negative balances. Review your cuts.`;
  } else if (newSavingsRate < 10) {
    statusClass = 'warning';
    sustainabilityText = `🟡 <strong>Low Projected Savings:</strong> Projected savings rate falls from <strong>${originalSavingsRate}%</strong> to <strong>${newSavingsRate}%</strong> (Rs. ${formatCurrency(newNetSavings)} remaining). Proceed with caution.`;
  } else {
    statusClass = 'safe';
    sustainabilityText = `🟢 <strong>Sustainable Decision:</strong> Restructured budgets cleanly absorb this expense. Savings rate projects at a healthy <strong>${newSavingsRate}%</strong> (Rs. ${formatCurrency(newNetSavings)} remaining).`;
  }
  
  const impactSummary = document.getElementById('whatif-impact-summary');
  impactSummary.innerHTML = `
    <div class="whatif-report-metrics">
      <div class="whatif-metric-box">
        <div class="whatif-metric-lbl">Original Savings Rate</div>
        <div class="whatif-metric-val" style="color: var(--text-muted);">${originalSavingsRate}%</div>
      </div>
      <div class="whatif-metric-box">
        <div class="whatif-metric-lbl">Projected Savings Rate</div>
        <div class="whatif-metric-val" style="color: ${statusClass === 'danger' ? 'var(--danger)' : statusClass === 'warning' ? 'var(--warning)' : 'var(--success)'};">${newSavingsRate}%</div>
      </div>
    </div>
    <div class="burn-details-advice ${statusClass}" style="margin-top: 0; padding: 12px; border-radius: 8px;">
      ${sustainabilityText}
    </div>
  `;
  
  document.getElementById('whatif-scorecard').style.display = 'block';
  document.getElementById('whatif-results-card').style.display = 'block';
  document.getElementById('whatif-empty-state').style.display = 'none';
}

// ─── FEATURE 2: PURCHASE HESITATION VAULT ───

function renderWishlist() {
  const accountSelect = document.getElementById('wish-account');
  const vaultGrid = document.getElementById('wish-vault-grid');
  
  if (!accountSelect || !vaultGrid) return;
  
  accountSelect.innerHTML = state.bankAccounts.map(acc => `
    <option value="${acc.id}">${acc.name} (Bal: ${formatCurrency(acc.balance)})</option>
  `).join('');
  
  const metrics = computeMetrics();
  const monthlyIncome = metrics.totalIncome || 100000;
  const hourlyWage = monthlyIncome / 160;
  
  const priceInput = document.getElementById('wish-price');
  const previewContainer = document.getElementById('wish-hourly-preview-container');
  
  if (priceInput && previewContainer && !priceInput.dataset.bound) {
    priceInput.dataset.bound = 'true';
    const updatePreview = () => {
      const price = Number(priceInput.value);
      if (price > 0) {
        const hours = (price / hourlyWage).toFixed(1);
        previewContainer.innerHTML = `
          <div class="wish-badge work-hours" style="font-size: 12.5px; width: 100%; display: flex; align-items: center; justify-content: center; padding: 8px;">
            <i data-lucide="clock" style="width: 14px; height: 14px; margin-right: 6px;"></i>
            Simulated cost: <strong>${hours} hours</strong> of work
          </div>
        `;
        lucide.createIcons({ nodes: [previewContainer] });
      } else {
        previewContainer.innerHTML = '';
      }
    };
    priceInput.addEventListener('input', updatePreview);
  }
  
  const form = document.getElementById('wishlist-form');
  if (form && !form.dataset.bound) {
    form.dataset.bound = 'true';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      addWishItem();
    });
  }
  
  drawWishlistCards();
}

function drawWishlistCards() {
  const vaultGrid = document.getElementById('wish-vault-grid');
  const countEl = document.getElementById('wish-vault-count');
  if (!vaultGrid) return;
  
  if (!state.wishlist) state.wishlist = [];
  countEl.textContent = `${state.wishlist.length} Item${state.wishlist.length !== 1 ? 's' : ''}`;
  
  if (state.wishlist.length === 0) {
    vaultGrid.innerHTML = `
      <div class="card insights-full-width" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; text-align: center;">
        <i data-lucide="lock" style="width: 36px; height: 36px; color: var(--text-muted); opacity: 0.5; margin-bottom: 12px;"></i>
        <h4 style="font-family: var(--font-heading); font-size: 15px; color: var(--text-main);">Vault is empty</h4>
        <p style="color: var(--text-muted); font-size: 12.5px; max-width: 250px; margin-top: 4px;">Lock away your impulse purchases here to beat buyer's remorse.</p>
      </div>
    `;
    lucide.createIcons({ nodes: [vaultGrid] });
    return;
  }
  
  const metrics = computeMetrics();
  const monthlyIncome = metrics.totalIncome || 100000;
  const hourlyWage = monthlyIncome / 160;
  
  vaultGrid.innerHTML = state.wishlist.map(item => {
    const isLocked = item.lockedUntil > Date.now();
    const hours = (item.price / hourlyWage).toFixed(1);
    const acc = state.bankAccounts.find(a => a.id === item.accountId) || { name: 'Unknown Account' };
    
    let badgeHTML = '';
    let actionButtonsHTML = '';
    
    if (isLocked) {
      badgeHTML = `
        <div class="wish-badge timer" id="timer-${item.id}" data-until="${item.lockedUntil}">
          <i data-lucide="hourglass" style="width: 12px; height: 12px; margin-right: 4px;"></i>
          Calculating...
        </div>
      `;
      actionButtonsHTML = `
        <button class="btn btn-secondary" style="font-size: 11px; padding: 6px 10px;" onclick="simulateWishTimePass('${item.id}')" title="Simulate 48 hours passing immediately for testing">
          <i data-lucide="fast-forward" style="width: 12px; height: 12px; margin-right: 4px;"></i>
          Test Unlock
        </button>
        <button class="tx-delete-btn" onclick="discardWishItem('${item.id}')" style="margin-left: auto;" title="Remove item">
          <i data-lucide="trash-2"></i>
        </button>
      `;
    } else {
      badgeHTML = `
        <div class="wish-badge unlocked-status">
          <i data-lucide="unlock" style="width: 12px; height: 12px; margin-right: 4px;"></i>
          Unlocked
        </div>
      `;
      actionButtonsHTML = `
        <button class="btn btn-primary" style="font-size: 11px; padding: 6px 12px;" onclick="logWishPurchase('${item.id}')">
          <i data-lucide="shopping-cart" style="width: 12px; height: 12px; margin-right: 4px;"></i>
          Buy Item
        </button>
        <button class="btn btn-secondary" style="font-size: 11px; padding: 6px 12px; margin-left: auto;" onclick="discardWishItem('${item.id}', true)">
          <i data-lucide="piggy-bank" style="width: 12px; height: 12px; margin-right: 4px;"></i>
          Discard & Save
        </button>
      `;
    }
    
    const linkHTML = item.link 
      ? `<a href="${item.link}" target="_blank" class="wish-link-btn" style="margin-top: 4px;"><i data-lucide="external-link" style="width: 12px; height: 12px; margin-right: 4px;"></i>View Product</a>`
      : '';
      
    return `
      <div class="wish-card ${isLocked ? 'locked' : 'unlocked'}" id="card-${item.id}">
        <div class="wish-header">
          <span class="wish-title">${item.name}</span>
          <span class="wish-price">${formatCurrency(item.price)}</span>
        </div>
        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 2px;">
          Simulated Account: <strong>${acc.name}</strong>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          <div class="wish-badge work-hours">
            <i data-lucide="clock" style="width: 12px; height: 12px; margin-right: 4px;"></i>
            ${hours} work hours
          </div>
          ${badgeHTML}
        </div>
        ${linkHTML}
        <div class="wish-actions">
          ${actionButtonsHTML}
        </div>
      </div>
    `;
  }).join('');
  
  lucide.createIcons({ nodes: [vaultGrid] });
  updateWishTimers();
}

function addWishItem() {
  const name = document.getElementById('wish-name').value.trim();
  const price = Number(document.getElementById('wish-price').value);
  const link = document.getElementById('wish-link').value.trim();
  const accountId = document.getElementById('wish-account').value;
  
  if (!name || !price || !accountId) return;
  
  const newItem = {
    id: 'wish_' + Date.now(),
    name,
    price,
    link,
    accountId,
    createdAt: Date.now(),
    lockedUntil: Date.now() + 48 * 60 * 60 * 1000
  };
  
  if (!state.wishlist) state.wishlist = [];
  state.wishlist.push(newItem);
  
  saveState();
  document.getElementById('wishlist-form').reset();
  document.getElementById('wish-hourly-preview-container').innerHTML = '';
  renderWishlist();
  
  showNotification("Item Vaulted", `"${name}" has been locked for 48 hours to cool off impulse desire.`, "saving", "check-circle");
}

function discardWishItem(itemId, wasSaved = false) {
  if (!state.wishlist) return;
  
  const itemIndex = state.wishlist.findIndex(item => item.id === itemId);
  if (itemIndex === -1) return;
  
  const itemName = state.wishlist[itemIndex].name;
  const itemPrice = state.wishlist[itemIndex].price;
  
  state.wishlist.splice(itemIndex, 1);
  saveState();
  drawWishlistCards();
  
  if (wasSaved) {
    showNotification("Urge Bypassed!", `Fabulous discipline! Bypassed "${itemName}" and saved <strong>${formatCurrency(itemPrice)}</strong>!`, "saving", "check-circle");
  }
}

function logWishPurchase(itemId) {
  if (!state.wishlist) return;
  
  const item = state.wishlist.find(i => i.id === itemId);
  if (!item) return;
  
  const txData = {
    date: new Date().toISOString().slice(0, 10),
    type: 'expense',
    description: `Impulse Purchase: ${item.name}`,
    amount: item.price,
    account: item.accountId,
    category: 'Shopping',
    fulfillment: 'joy'
  };
  
  addTransaction(txData);
  state.wishlist = state.wishlist.filter(i => i.id !== itemId);
  saveState();
  drawWishlistCards();
  
  showNotification("Purchase Logged", `"${item.name}" bought and recorded.`, "saving", "check-circle");
}

function simulateWishTimePass(itemId) {
  if (!state.wishlist) return;
  
  const item = state.wishlist.find(i => i.id === itemId);
  if (!item) return;
  
  item.lockedUntil = Date.now() - 1000;
  saveState();
  drawWishlistCards();
  
  showNotification("Time Simulated", "48 hours have elapsed. Urge is now unlocked!", "saving", "check-circle");
}

let wishlistTimerInterval = null;

function updateWishTimers() {
  if (wishlistTimerInterval) clearInterval(wishlistTimerInterval);
  
  const runTimerUpdate = () => {
    let hasRunningTimers = false;
    
    document.querySelectorAll('.wish-badge.timer').forEach(el => {
      const until = Number(el.dataset.until);
      const remaining = until - Date.now();
      
      if (remaining > 0) {
        hasRunningTimers = true;
        const totalSecs = Math.floor(remaining / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;
        
        el.innerHTML = `<i data-lucide="hourglass" style="width: 12px; height: 12px; margin-right: 4px;"></i> ${hours}h ${mins}m ${secs}s`;
      } else {
        drawWishlistCards();
      }
    });
    
    if (!hasRunningTimers && wishlistTimerInterval) {
      clearInterval(wishlistTimerInterval);
      wishlistTimerInterval = null;
    }
  };
  
  runTimerUpdate();
  wishlistTimerInterval = setInterval(runTimerUpdate, 1000);
}

// ─── FEATURE 3: JOY MAPPING & REPORT ───

function renderJoyMapping() {
  const tbody = document.getElementById('joy-rater-tbody');
  if (!tbody) return;
  
  const currentMonth = state.selectedMonth;
  const expenses = state.transactions.filter(tx => tx.type === 'expense' && tx.date.startsWith(currentMonth));
  
  if (expenses.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 30px;">
          No expense transactions recorded in this month yet.
        </td>
      </tr>
    `;
    updateJoyAnalytics([]);
    return;
  }
  
  tbody.innerHTML = expenses.map(tx => {
    const isJoy = tx.fulfillment === 'joy';
    const isRemorse = tx.fulfillment === 'remorse';
    
    return `
      <tr>
        <td style="font-size: 12px; color: var(--text-muted);">${getFormattedDate(tx.date)}</td>
        <td style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          <strong style="color: var(--text-main); font-size: 12.5px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${tx.description}">${tx.description}</strong>
          <div style="font-size: 10px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${tx.category}">${tx.category}</div>
        </td>
        <td style="font-weight: 600; color: var(--text-main);">${formatCurrency(tx.amount)}</td>
        <td>
          <div class="joy-btn-group">
            <button class="joy-btn joy-up ${isJoy ? 'active' : ''}" type="button" onclick="rateTransaction(event, '${tx.id}', 'joy')" title="👍 Joy / Fulfillment">
              👍
            </button>
            <button class="joy-btn joy-down ${isRemorse ? 'active' : ''}" type="button" onclick="rateTransaction(event, '${tx.id}', 'remorse')" title="👎 Regret / Remorse">
              👎
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  updateJoyAnalytics(expenses);
}
 
function rateTransaction(event, txId, rating) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const tx = state.transactions.find(t => t.id === txId);
  if (!tx) return;
  
  if (tx.fulfillment === rating) {
    tx.fulfillment = null;
  } else {
    tx.fulfillment = rating;
  }
  
  saveState();
  
  const button = event ? event.currentTarget : null;
  if (button) {
    const parent = button.closest('.joy-btn-group');
    if (parent) {
      const upBtn = parent.querySelector('.joy-up');
      const downBtn = parent.querySelector('.joy-down');
      if (upBtn && downBtn) {
        upBtn.classList.toggle('active', tx.fulfillment === 'joy');
        downBtn.classList.toggle('active', tx.fulfillment === 'remorse');
      }
    }
    const currentMonth = state.selectedMonth;
    const expenses = state.transactions.filter(tx => tx.type === 'expense' && tx.date.startsWith(currentMonth));
    updateJoyAnalytics(expenses);
  } else {
    renderJoyMapping();
  }
}

function updateJoyAnalytics(expenses) {
  const joyValEl = document.getElementById('joy-total-value');
  const joyCountEl = document.getElementById('joy-total-count');
  const remorseValEl = document.getElementById('remorse-total-value');
  const remorseCountEl = document.getElementById('remorse-total-count');
  const rateValEl = document.getElementById('remorse-rate-value');
  const rateBarEl = document.getElementById('remorse-rate-bar');
  const insightsTextEl = document.getElementById('joy-insights-text');
  
  if (!joyValEl) return;
  
  let joyTotal = 0;
  let joyCount = 0;
  let remorseTotal = 0;
  let remorseCount = 0;
  const categoryRemorse = {};
  
  expenses.forEach(tx => {
    const amt = Number(tx.amount);
    if (tx.fulfillment === 'joy') {
      joyTotal += amt;
      joyCount++;
    } else if (tx.fulfillment === 'remorse') {
      remorseTotal += amt;
      remorseCount++;
      categoryRemorse[tx.category] = (categoryRemorse[tx.category] || 0) + amt;
    }
  });
  
  const totalRatedValue = joyTotal + remorseTotal;
  const remorseRate = totalRatedValue > 0 ? Math.round((remorseTotal / totalRatedValue) * 100) : 0;
  
  joyValEl.textContent = formatCurrency(joyTotal);
  joyCountEl.textContent = `${joyCount} transaction${joyCount !== 1 ? 's' : ''} rated`;
  remorseValEl.textContent = formatCurrency(remorseTotal);
  remorseCountEl.textContent = `${remorseCount} transaction${remorseCount !== 1 ? 's' : ''} rated`;
  rateValEl.textContent = `${remorseRate}%`;
  
  if (rateBarEl) {
    rateBarEl.style.width = `${remorseRate}%`;
  }
  
  let insightText = '';
  if (remorseCount === 0 && joyCount === 0) {
    insightText = `Rate recent expenses on the left to unlock buyer's remorse and joy metrics.`;
  } else {
    let maxRemorseCat = '';
    let maxRemorseAmt = 0;
    Object.keys(categoryRemorse).forEach(cat => {
      if (categoryRemorse[cat] > maxRemorseAmt) {
        maxRemorseAmt = categoryRemorse[cat];
        maxRemorseCat = cat;
      }
    });
    
    if (remorseRate > 35) {
      insightText = `⚠️ <strong>High Remorse Alert:</strong> Your remorse rate is <strong>${remorseRate}%</strong>. `;
      if (maxRemorseCat) {
        insightText += `Your highest regret category is <strong>${maxRemorseCat}</strong> at <strong>${formatCurrency(maxRemorseAmt)}</strong>. Reconsider this budget next month!`;
      }
    } else if (joyCount > 0 && remorseCount === 0) {
      insightText = `🎉 <strong>Fulfillment Win!</strong> 100% of your rated purchases this month brought you value. Excellent financial mindfulness!`;
    } else {
      insightText = `🟢 <strong>Mindful Budgeting:</strong> Your remorse rate is low at <strong>${remorseRate}%</strong>. `;
      if (maxRemorseCat) {
        insightText += `Watch out for impulses under <strong>${maxRemorseCat}</strong> to drop it further.`;
      }
    }
  }
  
  insightsTextEl.innerHTML = insightText;
  
  const pdfBtn = document.getElementById('download-report-btn');
  if (pdfBtn && !pdfBtn.dataset.bound) {
    pdfBtn.dataset.bound = 'true';
    pdfBtn.addEventListener('click', () => {
      downloadMonthlyPDFReport();
    });
  }
}

function downloadMonthlyPDFReport() {
  const selectedMonth = state.selectedMonth;
  const metrics = computeMetrics();
  const healthInsights = computeSmartInsights();
  const burnData = computeBurnRate();
  const burnRateVal = Math.round(burnData.burnRate * 100);
  
  const currentSpending = getCategorySpendingForMonth(selectedMonth);
  let categoryBudgetsHTML = state.categories.map(c => {
    const budget = getBudgetForCategory(selectedMonth, c.name);
    const spent = currentSpending[c.name] || 0;
    const status = budget > 0 ? (spent > budget ? '🚨 Over Spent' : '🟢 Clear') : (spent > 0 ? '🚨 Over Spent' : '✦ Empty');
    
    return `
      <tr>
        <td>${c.name}</td>
        <td>Rs. ${budget.toLocaleString()}</td>
        <td>Rs. ${spent.toLocaleString()}</td>
        <td style="color: ${spent > budget ? '#ef4444' : '#10b981'}; font-weight: 600;">${status}</td>
      </tr>
    `;
  }).join('');
  
  let ratedJoyTotal = 0;
  let ratedRemorseTotal = 0;
  let ratedJoyCount = 0;
  let ratedRemorseCount = 0;
  
  const expenses = state.transactions.filter(tx => tx.type === 'expense' && tx.date.startsWith(selectedMonth));
  expenses.forEach(tx => {
    const amt = Number(tx.amount);
    if (tx.fulfillment === 'joy') {
      ratedJoyTotal += amt;
      ratedJoyCount++;
    } else if (tx.fulfillment === 'remorse') {
      ratedRemorseTotal += amt;
      ratedRemorseCount++;
    }
  });
  
  const remorseRate = (ratedJoyTotal + ratedRemorseTotal) > 0 
    ? Math.round((ratedRemorseTotal / (ratedJoyTotal + ratedRemorseTotal)) * 100) 
    : 0;

  const reportWindow = window.open('', '_blank');
  reportWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Totality Budget Ledger - ${selectedMonth}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 40px;
            color: #1e293b;
            background: #ffffff;
            font-size: 14px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #ef4444;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: 800;
            color: #ef4444;
          }
          .meta {
            text-align: right;
          }
          .title {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 8px;
          }
          .subtitle {
            font-size: 13px;
            color: #64748b;
          }
          .section-title {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
            margin-top: 30px;
            margin-bottom: 16px;
          }
          .grid-3 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 24px;
          }
          .metric-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            background: #f8fafc;
          }
          .metric-label {
            font-size: 12px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
          }
          .metric-value {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 6px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          th, td {
            padding: 10px 12px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
          }
          th {
            background: #f1f5f9;
            font-weight: 600;
            font-size: 12px;
            color: #475569;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 16px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">Totality Budget</div>
            <div class="subtitle">Personal Finance Analytics</div>
          </div>
          <div class="meta">
            <div class="title">MONTHLY FINANCIAL STATEMENT</div>
            <div>Month: <strong>${selectedMonth}</strong></div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Generated: ${new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <div class="grid-3">
          <div class="metric-card">
            <div class="metric-label">Total Monthly Income</div>
            <div class="metric-value">Rs. ${metrics.totalIncome.toLocaleString()}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Monthly Expenses</div>
            <div class="metric-value">Rs. ${metrics.totalSpent.toLocaleString()}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Net Monthly Savings</div>
            <div class="metric-value" style="color: ${metrics.netSavings >= 0 ? '#10b981' : '#ef4444'};">
              Rs. ${metrics.netSavings.toLocaleString()}
            </div>
          </div>
        </div>

        <div class="grid-3">
          <div class="metric-card">
            <div class="metric-label">Financial Health Score</div>
            <div class="metric-value">${healthInsights.totalScore} / 100</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Discretionary Burn Rate</div>
            <div class="metric-value">${burnRateVal}%</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Buyer's Remorse Rate</div>
            <div class="metric-value" style="color: ${remorseRate > 30 ? '#ef4444' : '#0f172a'};">${remorseRate}%</div>
          </div>
        </div>

        <div class="section-title">📊 Category Budget Performance</div>
        <table>
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Budgeted (Allocated)</th>
              <th>Actual Spend</th>
              <th>Budget Status</th>
            </tr>
          </thead>
          <tbody>
            ${categoryBudgetsHTML}
          </tbody>
        </table>

        <div class="section-title">💡 Fulfillment & Joy Mapping Report</div>
        <div class="grid-3" style="grid-template-columns: 1fr 2fr;">
          <div class="metric-card" style="height: fit-content;">
            <div class="metric-label">Fulfillment Summary</div>
            <div style="margin-top: 10px; font-size: 13px;">
              <div>😊 Joy Spent: <strong>Rs. ${ratedJoyTotal.toLocaleString()}</strong> (${ratedJoyCount} items)</div>
              <div style="margin-top: 6px;">😔 Regret Spent: <strong>Rs. ${ratedRemorseTotal.toLocaleString()}</strong> (${ratedRemorseCount} items)</div>
              <div style="margin-top: 6px; border-top: 1px dashed #cbd5e1; padding-top: 6px;">Remorse Rate: <strong>${remorseRate}%</strong></div>
            </div>
          </div>
          <div class="metric-card" style="height: fit-content;">
            <div class="metric-label">Purchasing Insight</div>
            <p style="font-size: 13px; color: #475569; line-height: 1.5; margin-top: 10px;">
              ${remorseRate > 35 
                ? 'Your buyer\'s remorse rate is elevated this month. Look to review low-fulfillment transactions and reduce budgets in those categories to optimize your cash allocation.' 
                : 'Your remorse rate is low and healthy. This indicates mindful purchasing behaviors and stable alignment between cash flows and personal utility.'}
            </p>
          </div>
        </div>

        <div class="footer">
          © ElectroPlanet.pk Enterprises — Totality Budget Verified Ledger Statement. All rights reserved.
        </div>

        <div style="text-align: center; margin-top: 24px;" class="no-print">
          <button onclick="window.print()" style="padding: 10px 24px; font-size: 14px; background: #ef4444; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
            Print / Save to PDF
          </button>
        </div>
      </body>
  `);
  reportWindow.document.close();
}

// ─── CASH FLOW FORECASTING ───

function computeCashFlowForecast() {
  const today = new Date();
  const currentMonthIdx = MONTHS_REF.findIndex(m => m.key === state.selectedMonth);
  
  // Calculate monthly recurring net flow
  let monthlyRecurringIncome = 0;
  let monthlyRecurringExpense = 0;
  
  (state.subscriptions || []).forEach(sub => {
    if (sub.type === 'income') {
      monthlyRecurringIncome += Number(sub.amount);
    } else {
      monthlyRecurringExpense += Number(sub.amount);
    }
  });
  
  const netRecurring = monthlyRecurringIncome - monthlyRecurringExpense;
  
  // Calculate average discretionary spending (last 3 months)
  const prevKeys = getPreviousMonthKeys(state.selectedMonth, 3);
  let totalDiscretionary = 0;
  let monthsCounted = 0;
  
  prevKeys.forEach(mk => {
    const spending = getCategorySpendingForMonth(mk);
    let monthTotal = 0;
    Object.values(spending).forEach(v => { monthTotal += v; });
    
    // Subtract recurring expenses to get discretionary
    let recurringForMonth = 0;
    (state.subscriptions || []).forEach(sub => {
      if (sub.type !== 'income') {
        const subStart = sub.startMonth || '2026-01';
        if (mk >= subStart) recurringForMonth += Number(sub.amount);
      }
    });
    
    totalDiscretionary += Math.max(0, monthTotal - recurringForMonth);
    monthsCounted++;
  });
  
  const avgDiscretionary = monthsCounted > 0 ? totalDiscretionary / monthsCounted : 0;
  
  // Build forecast data
  const actualData = [];
  const forecastData = [];
  const labels = [];
  
  // Actual months with running balance
  let runningBalance = 0;
  for (let i = 0; i <= currentMonthIdx && i < MONTHS_REF.length; i++) {
    const mk = MONTHS_REF[i].key;
    let income = 0;
    let expenses = 0;
    
    state.transactions.forEach(tx => {
      if (tx.date.startsWith(mk)) {
        if (tx.type === 'income') income += Number(tx.amount);
        if (tx.type === 'expense') expenses += Number(tx.amount);
      }
    });
    
    runningBalance += (income - expenses);
    actualData.push(runningBalance);
    forecastData.push(null);
    labels.push(MONTHS_REF[i].name.substring(0, 3));
  }
  
  // Project next 6 months
  let projectedBalance = runningBalance;
  const forecastMonths = Math.min(6, MONTHS_REF.length - currentMonthIdx - 1);
  
  // Bridge: set forecast start at the current actual balance
  if (forecastData.length > 0) {
    forecastData[forecastData.length - 1] = runningBalance;
  }
  
  for (let i = 1; i <= forecastMonths; i++) {
    const futureIdx = currentMonthIdx + i;
    if (futureIdx >= MONTHS_REF.length) break;
    
    projectedBalance += (netRecurring - avgDiscretionary);
    actualData.push(null);
    forecastData.push(projectedBalance);
    labels.push(MONTHS_REF[futureIdx].name.substring(0, 3));
  }
  
  return { labels, actualData, forecastData, netRecurring, avgDiscretionary };
}

function renderForecastCharts() {
  const isDark = document.body.getAttribute('data-theme') !== 'light';
  
  // ─── Chart 1: Cash Flow Forecast ───
  const forecastCanvas = document.getElementById('forecastChart');
  if (forecastCanvas) {
    const forecast = computeCashFlowForecast();
    
    if (forecastChartInstance) forecastChartInstance.destroy();
    
    forecastChartInstance = new Chart(forecastCanvas, {
      type: 'line',
      data: {
        labels: forecast.labels,
        datasets: [
          {
            label: 'Actual Balance',
            data: forecast.actualData,
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.08)',
            tension: 0.4,
            fill: true,
            borderWidth: 3,
            pointBackgroundColor: '#22c55e',
            pointBorderColor: '#22c55e',
            pointRadius: 4,
            pointHoverRadius: 6,
            spanGaps: false
          },
          {
            label: 'Projected Balance',
            data: forecast.forecastData,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.06)',
            borderDash: [8, 4],
            tension: 0.4,
            fill: true,
            borderWidth: 3,
            pointBackgroundColor: '#38bdf8',
            pointBorderColor: '#38bdf8',
            pointRadius: 4,
            pointHoverRadius: 6,
            spanGaps: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
            ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { family: 'Inter' } }
          },
          y: {
            grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
            ticks: {
              color: isDark ? '#94a3b8' : '#64748b',
              font: { family: 'Inter' },
              callback: (v) => 'Rs. ' + Number(v).toLocaleString('en-US')
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ctx.dataset.label + ': Rs. ' + Number(ctx.parsed.y).toLocaleString('en-US')
            }
          }
        }
      }
    });
  }
  
  // ─── Chart 2: Monthly Savings Performance ───
  const comparisonCanvas = document.getElementById('comparisonChart');
  if (comparisonCanvas) {
    const annual = computeAnnualOverview();
    
    // Only show months with data
    const activeMonths = annual.monthsData.filter(m => m.income > 0 || m.expense > 0);
    if (activeMonths.length === 0) {
      if (comparisonChartInstance) comparisonChartInstance.destroy();
      return;
    }
    
    const labels = activeMonths.map(m => m.name.substring(0, 3));
    const incomeData = activeMonths.map(m => m.income);
    const expenseData = activeMonths.map(m => m.expense);
    const savingsData = activeMonths.map(m => m.savings);
    
    if (comparisonChartInstance) comparisonChartInstance.destroy();
    
    comparisonChartInstance = new Chart(comparisonCanvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Income',
            data: incomeData,
            backgroundColor: isDark ? 'rgba(34, 197, 94, 0.7)' : 'rgba(21, 128, 61, 0.7)',
            borderRadius: 6,
            barPercentage: 0.7,
            categoryPercentage: 0.8
          },
          {
            label: 'Spending',
            data: expenseData,
            backgroundColor: isDark ? 'rgba(228, 0, 43, 0.7)' : 'rgba(185, 28, 28, 0.7)',
            borderRadius: 6,
            barPercentage: 0.7,
            categoryPercentage: 0.8
          },
          {
            label: 'Net Savings',
            data: savingsData,
            type: 'line',
            borderColor: '#F5C518',
            backgroundColor: 'rgba(245, 197, 24, 0.1)',
            tension: 0.4,
            fill: true,
            borderWidth: 3,
            pointBackgroundColor: '#F5C518',
            pointBorderColor: '#F5C518',
            pointRadius: 5,
            pointHoverRadius: 7,
            yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { family: 'Inter' } }
          },
          y: {
            grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
            ticks: {
              color: isDark ? '#94a3b8' : '#64748b',
              font: { family: 'Inter', size: 11 },
              callback: (v) => 'Rs. ' + (v / 1000).toFixed(0) + 'k'
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: isDark ? '#f8fafc' : '#0f172a', font: { family: 'Inter' }, padding: 16 }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ctx.dataset.label + ': Rs. ' + Number(ctx.parsed.y).toLocaleString('en-US')
            }
          }
        }
      }
    });
  }
}

// Tab Switching (Resolves visual sync bug on navigation)

function switchTab(tabId) {
  if (activeTab === tabId) return;

  const widget = document.querySelector('.top-balances-widget');
  let firstLeft = 0;
  let firstTop = 0;
  if (widget) {
    if (widget._cleanupTransition) {
      widget._cleanupTransition();
    }
    const rect = widget.getBoundingClientRect();
    firstLeft = rect.left;
    firstTop = rect.top;
  }

  activeTab = tabId;

  // Close mobile sidebar drawer on tab switch
  const sidebar = document.querySelector('.sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  if (sidebar && sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
  }

  // Toggle active CSS panel
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });

  const targetPanel = document.getElementById(tabId + '-panel');
  if (targetPanel) targetPanel.classList.add('active');

  const targetLink = document.querySelector(`.nav-link[data-tab="${tabId}"]`);
  if (targetLink) targetLink.classList.add('active');

  // Headers
  const titles = {
    dashboard: { title: "Personal Finance Dashboard", subtitle: "Monthly overview and budget allocation" },
    budget: { title: "Monthly Budget Planner", subtitle: "Tracking planned category allocation vs. actual cash outflows" },
    annual: { title: "Annual Summary Overview", subtitle: "Year-to-date aggregates, cumulative savings, and monthly trends" },
    savings: { title: "Savings Goals Vault", subtitle: "Build your financial wealth and allocate towards targets" },
    accounts: { title: "Bank Directory Strategy", subtitle: "Manage accounts and coordinate standard funding flows" },
    transactions: { title: "Transaction Ledger", subtitle: "Verify past activities, export backups, and insert logs" },
    subscriptions: { title: "Fixed Recurring Expenses", subtitle: "Define fixed monthly costs, billing days, and payment accounts" },
    debts: { title: "Credits & Debts Ledger", subtitle: "Track money you owe to others (Debts) and money others owe to you (Credits)" },
    tools: { title: "Financial Tools & Simulators", subtitle: "Risk-free budgeting sandbox, impulse buy hesitation vault, and fulfillment trackers" },
    setup: { title: "Configuration Panel", subtitle: "Define your categories, bank accounts, and defaults" }
  };

  if (titles[tabId]) {
    document.getElementById('page-title').innerText = titles[tabId].title;
    document.getElementById('page-subtitle').innerText = titles[tabId].subtitle;
  }

  // Scroll to top of the right panel
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.scrollTop = 0;
  }

  // Trigger absolute UI redraw for navigated tab
  updateUI();

  // Re-render setup forms if switching to Setup tab
  if (tabId === 'setup') {
    initSetupPage();
  }
  if (tabId === 'subscriptions') {
    populateSubscriptionFormDropdowns();
  }
  if (tabId === 'tools') {
    const activeSubtabBtn = document.querySelector('.tools-subnav-btn.active');
    if (activeSubtabBtn) {
      const subtabId = activeSubtabBtn.getAttribute('data-subtab');
      switchSubtab(subtabId);
    } else {
      switchSubtab('tools-insights');
    }
  }

  if (widget) {
    const rect = widget.getBoundingClientRect();
    const lastLeft = rect.left;
    const lastTop = rect.top;
    const deltaX = firstLeft - lastLeft;
    const deltaY = firstTop - lastTop;

    if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
      // Invert
      widget.style.transition = 'none';
      widget.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      
      // Force reflow
      widget.offsetHeight;

      // Play (smooth slide animation with a subtle bounce and 0.73s duration)
      widget.style.transition = 'transform 0.73s cubic-bezier(0.34, 1.25, 0.64, 1)';
      widget.style.transform = 'translate(0, 0)';

      const onTransitionEnd = (e) => {
        if (e.propertyName === 'transform') {
          cleanup();
        }
      };

      const cleanup = () => {
        widget.style.transition = '';
        widget.style.transform = '';
        widget.removeEventListener('transitionend', onTransitionEnd);
        widget._cleanupTransition = null;
      };

      widget._cleanupTransition = cleanup;
      widget.addEventListener('transitionend', onTransitionEnd);
    }
  }
}

// Transaction operations
function addTransaction(txData) {
  const newTx = {
    id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    date: txData.date,
    type: txData.type,
    description: txData.description,
    amount: Number(txData.amount),
    account: txData.account || null,
    destAccount: txData.destAccount || null,
    category: txData.category || null,
    goalId: txData.goalId || null,
    debtId: txData.debtId || null
  };

  state.transactions.push(newTx);
  saveState();
  updateUI();
  
  if (txData.debtId) {
    const debt = state.debts.find(d => d.id === txData.debtId);
    if (debt) {
      const isCredit = debt.type === 'credit';
      const actionStr = isCredit ? 'Repayment received from' : 'Repayment paid to';
      showNotification("Payment Logged", `${actionStr} ${debt.person} of ${formatCurrency(newTx.amount)}.`, "saving", "check-circle");
    } else {
      showNotification("Transaction Added", `"${newTx.description}" of ${formatCurrency(newTx.amount)} was successfully recorded.`, "saving", "check-circle");
    }
  } else {
    showNotification("Transaction Added", `"${newTx.description}" of ${formatCurrency(newTx.amount)} was successfully recorded.`, "saving", "check-circle");
  }
}

async function deleteTransaction(txId) {
  const tx = state.transactions.find(t => t.id === txId);
  const desc = tx ? tx.description : "this transaction";
  if (await showCustomConfirm("Delete Transaction", `Are you sure you want to delete "${desc}"?`)) {
    const rowEl = document.getElementById('tx-row-' + txId);
    const miniEl = document.getElementById('tx-mini-' + txId);
    if (rowEl) rowEl.classList.add('removing');
    if (miniEl) miniEl.classList.add('removing');
    
    await new Promise(resolve => setTimeout(resolve, 350));
    
    if (txId.startsWith('tx_rec_')) {
      if (!state.deletedRecurring) state.deletedRecurring = [];
      if (!state.deletedRecurring.includes(txId)) {
        state.deletedRecurring.push(txId);
      }
    }
    
    state.transactions = state.transactions.filter(tx => tx.id !== txId);
    saveState();
    updateUI();
    showNotification("Transaction Deleted", `"${desc}" was successfully removed.`, "warning", "trash-2");
  }
}

async function completeGoal(goalId) {
  const goal = state.savingsGoals.find(g => g.id === goalId);
  if (!goal) return;
  const pct = goal.target > 0 ? Math.round((goal.saved / goal.target) * 100) : 0;
  const action = pct >= 100 ? 'complete and remove' : 'remove';
  if (await showCustomConfirm(
    pct >= 100 ? "Complete Goal" : "Remove Goal",
    `Are you sure you want to ${action} the goal "${goal.name}"?\n\nDeposits already allocated to this goal will remain in the transaction ledger.`,
    true
  )) {
    const cardEl = document.getElementById('goal-card-' + goalId);
    if (cardEl) cardEl.classList.add('removing');
    
    await new Promise(resolve => setTimeout(resolve, 350));
    
    state.savingsGoals = state.savingsGoals.filter(g => g.id !== goalId);
    saveState();
    updateUI();
    showNotification("Goal Removed", `Savings goal "${goal.name}" was successfully removed.`, "warning", "trash-2");
  }
}

async function deleteSubscription(subId) {
  const sub = state.subscriptions.find(s => s.id === subId);
  if (!sub) return;
  if (await showCustomConfirm("Remove Fixed Expense", `Are you sure you want to delete "${sub.name}"?\n\nGenerated transactions will remain in the transaction ledger.`)) {
    const rowEl = document.getElementById('sub-row-' + subId);
    if (rowEl) rowEl.classList.add('removing');
    
    await new Promise(resolve => setTimeout(resolve, 350));
    
    state.subscriptions = state.subscriptions.filter(s => s.id !== subId);
    
    // Also remove any generated transactions for this subscription that are not in the past or just keep them?
    // User said "Generated transactions will remain in ledger", so we keep them in state.transactions, but we stop generating new ones.
    saveState();
    updateUI();
    showNotification("Recurring Flow Removed", `"${sub.name}" was successfully removed.`, "warning", "trash-2");
  }
}

async function deleteDebt(debtId) {
  const debt = state.debts.find(d => d.id === debtId);
  if (!debt) return;
  if (await showCustomConfirm("Remove Ledger Record", `Are you sure you want to remove the record for "${debt.person}"?\n\nPayment transactions in the ledger will not be deleted.`)) {
    const rowEl = document.getElementById('debt-row-' + debtId);
    if (rowEl) rowEl.classList.add('removing');
    
    await new Promise(resolve => setTimeout(resolve, 350));
    
    state.debts = state.debts.filter(d => d.id !== debtId);
    saveState();
    updateUI();
    showNotification("Record Removed", `Outstanding record for "${debt.person}" was successfully removed.`, "warning", "trash-2");
  }
}

function openRepayDebtModal(debtId) {
  const d = state.debts.find(item => item.id === debtId);
  if (!d) return;
  
  const isCredit = d.type === 'credit';
  const type = isCredit ? 'income' : 'expense';
  
  openAddTxModal(type);
  
  // Set category to "Loan Payment"
  document.getElementById('tx-category').value = "Loan Payment";
  
  // Pre-fill Description
  document.getElementById('tx-desc').value = isCredit ? `Repayment from ${d.person}` : `Repayment to ${d.person}`;
  
  // Pre-fill Amount
  document.getElementById('tx-amount').value = d.remaining;
  
  // Display the linked debt dropdown and select this debt
  handleTxCategoryVisibility(type, 'Loan Payment');
  document.getElementById('tx-debt').value = debtId;
}

// Modal handling
const txModal = document.getElementById('tx-modal');
const txForm = document.getElementById('tx-form');
const addTxBtn = document.getElementById('add-tx-btn');
const closeTxModal = document.getElementById('close-tx-modal');
const cancelTxModal = document.getElementById('cancel-tx-modal');

function openAddTxModal(defaultType = 'expense', preselectedGoalId = null) {
  txForm.reset();
  txModalCategoryManuallyChanged = false;
  
  // Set date based on selected month (best UX)
  const activeMonth = state.selectedMonth; // YYYY-MM
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  if (todayStr.startsWith(activeMonth)) {
    document.getElementById('tx-date').value = todayStr;
  } else {
    document.getElementById('tx-date').value = `${activeMonth}-01`;
  }

  document.getElementById('tx-type').value = defaultType;
  populateModalDropdowns();

  if (preselectedGoalId) {
    document.getElementById('tx-goal').value = preselectedGoalId;
  }

  handleTxTypeFieldsVisibility(defaultType);
  document.getElementById('tx-modal-title').innerText = preselectedGoalId ? "Deposit to Savings Goal" : "Add Transaction";

  txModal.classList.add('active');
}

function closeTransactionModal() {
  txModal.classList.remove('active');
}

function populateModalDropdowns() {
  const accountSelect = document.getElementById('tx-account');
  accountSelect.innerHTML = '';
  state.bankAccounts.forEach(acc => {
    accountSelect.innerHTML += `<option value="${acc.id}">${acc.name} (${acc.bank})</option>`;
  });

  const destAccountSelect = document.getElementById('tx-dest-account');
  destAccountSelect.innerHTML = '';
  state.bankAccounts.forEach(acc => {
    destAccountSelect.innerHTML += `<option value="${acc.id}">${acc.name} (${acc.bank})</option>`;
  });

  const categorySelect = document.getElementById('tx-category');
  categorySelect.innerHTML = '';
  state.categories.forEach(cat => {
    categorySelect.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
  });

  const goalSelect = document.getElementById('tx-goal');
  goalSelect.innerHTML = '';
  state.savingsGoals.forEach(g => {
    goalSelect.innerHTML += `<option value="${g.id}">${g.name} (Target: ${formatCurrency(g.target)})</option>`;
  });

  const debtSelect = document.getElementById('tx-debt');
  if (debtSelect) {
    debtSelect.innerHTML = '';
    if (!state.debts) state.debts = [];
    state.debts.forEach(d => {
      debtSelect.innerHTML += `<option value="${d.id}">${d.person} (${d.description}) - Rem: ${formatCurrency(d.remaining)}</option>`;
    });
  }
}

function toggleSubFormTypeFields() {
  const typeSelect = document.getElementById('sub-type');
  const catSelect = document.getElementById('sub-category');
  const accLabel = document.querySelector('label[for="sub-account"]');
  const catLabel = document.querySelector('label[for="sub-category"]');
  
  if (!typeSelect) return;
  
  const type = typeSelect.value;
  if (catLabel) {
    catLabel.innerText = type === 'income' ? 'Income Source' : 'Category';
  }
  if (accLabel) {
    accLabel.innerText = type === 'income' ? 'Deposit Account' : 'Payment Account';
  }
  
  if (catSelect) {
    catSelect.innerHTML = '';
    if (type === 'income') {
      const sources = state.incomeSources || [];
      sources.forEach(src => {
        catSelect.innerHTML += `<option value="${src}">${src}</option>`;
      });
    } else {
      const categories = state.categories || [];
      categories.forEach(c => {
        catSelect.innerHTML += `<option value="${c.name}">${c.name}</option>`;
      });
    }
  }
}

function populateSubscriptionFormDropdowns() {
  toggleSubFormTypeFields();
  
  const accSelect = document.getElementById('sub-account');
  if (accSelect) {
    accSelect.innerHTML = '';
    state.bankAccounts.forEach(a => {
      accSelect.innerHTML += `<option value="${a.id}">${a.name}</option>`;
    });
  }

  const startMonthSelect = document.getElementById('sub-start-month-select');
  const startYearSelect = document.getElementById('sub-start-year-select');
  if (startMonthSelect && startYearSelect && state.selectedMonth) {
    const parts = state.selectedMonth.split('-');
    const year = parts[0];
    const month = parts[1];
    startMonthSelect.value = month;
    startYearSelect.value = year;
  }
}

function handleTxCategoryVisibility(type, category) {
  const debtGroup = document.getElementById('tx-target-debt-group');
  if (debtGroup) {
    if ((type === 'expense' || type === 'income') && category === 'Loan Payment') {
      debtGroup.style.display = 'block';
    } else {
      debtGroup.style.display = 'none';
    }
  }
}

function handleTxTypeFieldsVisibility(type) {
  const accountGroup = document.getElementById('tx-source-account-group');
  const destAccountGroup = document.getElementById('tx-dest-account-group');
  const categoryGroup = document.getElementById('tx-category-group');
  const goalGroup = document.getElementById('tx-target-goal-group');
  const accountsRow = document.getElementById('tx-accounts-row');
  const accountLabel = document.getElementById('tx-account-label');
  const categorySelect = document.getElementById('tx-category');

  accountGroup.style.display = 'block';
  destAccountGroup.style.display = 'none';
  categoryGroup.style.display = 'none';
  goalGroup.style.display = 'none';
  accountsRow.style.display = 'grid';
  accountLabel.innerText = "Account";

  // Hide debt group initially
  const debtGroup = document.getElementById('tx-target-debt-group');
  if (debtGroup) debtGroup.style.display = 'none';

  if (type === 'income') {
    categoryGroup.style.display = 'block';
    accountLabel.innerText = "Deposit To Account";
    if (categorySelect) {
      categorySelect.innerHTML = '';
      const sources = state.incomeSources || [];
      sources.forEach(src => {
        categorySelect.innerHTML += `<option value="${src}">${src}</option>`;
      });
      categorySelect.innerHTML += `<option value="Loan Payment">Repayment (Credit / Debt)</option>`;
    }
    handleTxCategoryVisibility(type, categorySelect ? categorySelect.value : '');
  } else if (type === 'expense') {
    categoryGroup.style.display = 'block';
    accountLabel.innerText = "Payment From Account";
    if (categorySelect) {
      categorySelect.innerHTML = '';
      state.categories.forEach(cat => {
        categorySelect.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
      });
    }
    handleTxCategoryVisibility(type, categorySelect ? categorySelect.value : '');
  } else if (type === 'savings_transfer') {
    destAccountGroup.style.display = 'block';
    accountLabel.innerText = "Transfer From Account";
  } else if (type === 'goal_allocation') {
    goalGroup.style.display = 'block';
    accountLabel.innerText = "Transfer From Account";
  }
}

function openDepositToGoalModal(goalId) {
  openAddTxModal('goal_allocation', goalId);
}

// Auto-categorize transaction description based on keywords
function autoCategorizeTxDescription() {
  if (txModalCategoryManuallyChanged) return;

  const type = document.getElementById('tx-type').value;
  if (type !== 'expense' && type !== 'income') return;

  const descVal = document.getElementById('tx-desc').value.toLowerCase().trim();
  if (!descVal) return;

  const descCategoryMapping = {
    // Grocery
    'pringles': 'Grocery',
    'coke': 'Grocery',
    'lays': 'Grocery',
    'chips': 'Grocery',
    'grocery': 'Grocery',
    'groceries': 'Grocery',
    'supermarket': 'Grocery',
    'al fatah': 'Grocery',
    'hyperstar': 'Grocery',
    'carrefour': 'Grocery',
    'milk': 'Grocery',
    'bread': 'Grocery',
    'eggs': 'Grocery',
    'water': 'Grocery',
    'snacks': 'Grocery',
    'food': 'Grocery',
    'mart': 'Grocery',
    'store': 'Grocery',
    'nestle': 'Grocery',
    'chicken': 'Grocery',
    'vegetables': 'Grocery',
    'fruit': 'Grocery',
    'yogurt': 'Grocery',
    'cheese': 'Grocery',
    'biscuit': 'Grocery',
    'chocolate': 'Grocery',
    
    // Petrol
    'petrol': 'Petrol',
    'fuel': 'Petrol',
    'shell': 'Petrol',
    'pso': 'Petrol',
    'hassan': 'Petrol',
    'total': 'Petrol',
    'cng': 'Petrol',
    'gas': 'Petrol',
    
    // Daily
    'daily': 'Daily',
    
    // Order Out
    'order out': 'Order Out',
    'foodpanda': 'Order Out',
    'kfc': 'Order Out',
    'mcdonald': 'Order Out',
    'burger': 'Order Out',
    'pizza': 'Order Out',
    'restaurant': 'Order Out',
    'dinner': 'Order Out',
    'delivery': 'Order Out',
    'panda': 'Order Out',
    
    // Daily Lunch
    'lunch': 'Daily Lunch',
    'office lunch': 'Daily Lunch',
    'subway': 'Daily Lunch',
    'cafe': 'Daily Lunch',
    
    // Car Maintenance
    'car': 'Car Maintenance',
    'maintenance': 'Car Maintenance',
    'tuning': 'Car Maintenance',
    'oil change': 'Car Maintenance',
    'mechanic': 'Car Maintenance',
    'tyre': 'Car Maintenance',
    'tire': 'Car Maintenance',
    'brake': 'Car Maintenance',
    'workshop': 'Car Maintenance',
    
    // Clothes
    'clothes': 'Clothes',
    'shirt': 'Clothes',
    'pants': 'Clothes',
    'shoes': 'Clothes',
    'wardrobe': 'Clothes',
    'boutique': 'Clothes',
    'outfitters': 'Clothes',
    'khaadi': 'Clothes',
    
    // Mobile
    'mobile': 'Mobile',
    'load': 'Mobile',
    'ufone': 'Mobile',
    'jazz': 'Mobile',
    'telenor': 'Mobile',
    'zong': 'Mobile',
    'bill': 'Mobile',
    'cellular': 'Mobile',
    'internet': 'Mobile',
    'wifi': 'Mobile',
    
    // Uber
    'uber': 'Uber',
    'indrive': 'Uber',
    'yango': 'Uber',
    'careem': 'Uber',
    'ride': 'Uber',
    'taxi': 'Uber',
    
    // Gym
    'gym': 'Gym',
    'fitness': 'Gym',
    'workout': 'Gym',
    'protein': 'Gym',
    'supplement': 'Gym',
    
    // Charity
    'charity': 'Charity',
    'donation': 'Charity',
    'zakat': 'Charity',
    'sadqah': 'Charity',
    'edhi': 'Charity',
    'saylani': 'Charity',
    
    // Income Sources
    'coca cola': 'Coca Cola',
    'extra': 'Extra / EP',
    'tuition': 'Tuition',
    'salary': 'Coca Cola'
  };

  let suggestedCategory = null;
  for (const [kw, catName] of Object.entries(descCategoryMapping)) {
    if (descVal.includes(kw)) {
      suggestedCategory = catName;
      break;
    }
  }

  if (suggestedCategory) {
    const catSelect = document.getElementById('tx-category');
    if (catSelect) {
      const exists = Array.from(catSelect.options).some(opt => opt.value === suggestedCategory);
      if (exists && catSelect.value !== suggestedCategory) {
        catSelect.value = suggestedCategory;
        catSelect.dispatchEvent(new Event('change'));
      }
    }

    if (suggestedCategory === 'Grocery' || suggestedCategory === 'Daily' || suggestedCategory === 'Daily Lunch' || suggestedCategory === 'Order Out') {
      const accSelect = document.getElementById('tx-account');
      if (accSelect) {
        let dailySpendAcc = state.bankAccounts.find(a => a.id === 'scb');
        if (!dailySpendAcc) {
          dailySpendAcc = state.bankAccounts.find(a => {
            const p = (a.purpose || '').toLowerCase();
            return p.includes('daily') || p.includes('salary');
          });
        }
        if (!dailySpendAcc) {
          dailySpendAcc = state.bankAccounts.find(a => {
            const t = (a.type || '').toLowerCase();
            const p = (a.purpose || '').toLowerCase();
            return !t.includes('saving') && !p.includes('saving');
          });
        }
        if (!dailySpendAcc && state.bankAccounts.length > 0) {
          dailySpendAcc = state.bankAccounts[0];
        }
        if (dailySpendAcc && Array.from(accSelect.options).some(opt => opt.value === dailySpendAcc.id)) {
          if (accSelect.value !== dailySpendAcc.id) {
            accSelect.value = dailySpendAcc.id;
            accSelect.dispatchEvent(new Event('change'));
          }
        }
      }
    }
  }
}

// Bind Modal Listeners
if (addTxBtn) addTxBtn.addEventListener('click', () => openAddTxModal('expense'));
if (closeTxModal) closeTxModal.addEventListener('click', closeTransactionModal);
if (cancelTxModal) cancelTxModal.addEventListener('click', closeTransactionModal);
document.getElementById('tx-type').addEventListener('change', (e) => {
  handleTxTypeFieldsVisibility(e.target.value);
  txModalCategoryManuallyChanged = false;
});
document.getElementById('tx-category').addEventListener('change', (e) => {
  const type = document.getElementById('tx-type').value;
  handleTxCategoryVisibility(type, e.target.value);
  txModalCategoryManuallyChanged = true;
});
document.getElementById('tx-desc').addEventListener('input', autoCategorizeTxDescription);

txForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const type = document.getElementById('tx-type').value;
  const description = document.getElementById('tx-desc').value;
  const amount = Number(document.getElementById('tx-amount').value);
  const date = document.getElementById('tx-date').value;
  
  let account = null;
  let destAccount = null;
  let category = null;
  let goalId = null;
  let debtId = null;

  account = document.getElementById('tx-account').value;

  if (type === 'expense' || type === 'income') {
    category = document.getElementById('tx-category').value;
    if (category === 'Loan Payment') {
      debtId = document.getElementById('tx-debt').value;
    }
  } else if (type === 'savings_transfer') {
    destAccount = document.getElementById('tx-dest-account').value;
  } else if (type === 'goal_allocation') {
    goalId = document.getElementById('tx-goal').value;
  }

  addTransaction({ type, description, amount, date, account, destAccount, category, goalId, debtId });
  closeTransactionModal();
});

// Setup Panel - Render Inputs
function initSetupPage() {
  // 1. Setup Categories List
  const setupCatList = document.getElementById('setup-categories-list');
  setupCatList.innerHTML = '';
  state.categories.forEach((cat, index) => {
    const row = document.createElement('div');
    row.className = 'setup-input-row';
    row.innerHTML = `
      <input type="text" class="form-control setup-cat-name" value="${cat.name}" required placeholder="Category Name">
      <input type="number" class="form-control setup-cat-budget" value="${cat.budget}" required min="0" placeholder="Default Budget">
      <button type="button" class="setup-del-btn" onclick="removeSetupCategory(${index})">
        <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
      </button>
    `;
    setupCatList.appendChild(row);
  });

  // 2. Setup Income Sources List
  const setupIncList = document.getElementById('setup-income-list');
  setupIncList.innerHTML = '';
  state.incomeSources.forEach((src, index) => {
    const row = document.createElement('div');
    row.className = 'setup-input-row';
    row.innerHTML = `
      <input type="text" class="form-control setup-inc-name" value="${src}" required placeholder="Income Source Name" style="grid-column: span 2;">
      <button type="button" class="setup-del-btn" onclick="removeSetupIncome(${index})">
        <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
      </button>
    `;
    setupIncList.appendChild(row);
  });

  // 3. Setup Bank Accounts List
  const setupAccList = document.getElementById('setup-accounts-list');
  setupAccList.innerHTML = '';
  state.bankAccounts.forEach((acc, index) => {
    const row = document.createElement('div');
    row.className = 'setup-acc-row';
    row.innerHTML = `
      <input type="text" class="form-control setup-acc-name" value="${acc.name}" required placeholder="Account Name">
      <input type="text" class="form-control setup-acc-bank" value="${acc.bank}" required placeholder="Bank Name">
      <select class="form-control setup-acc-type">
        <option value="Current" ${acc.type === 'Current' ? 'selected' : ''}>Current</option>
        <option value="Savings" ${acc.type === 'Savings' ? 'selected' : ''}>Savings</option>
        <option value="Digital Savings" ${acc.type === 'Digital Savings' ? 'selected' : ''}>Digital Savings</option>
        <option value="Cash" ${acc.type === 'Cash' ? 'selected' : ''}>Cash</option>
      </select>
      <input type="number" class="form-control setup-acc-init-balance" value="${acc.initialBalance || 0}" min="0" placeholder="Initial Balance (Rs.)">
      <input type="text" class="form-control setup-acc-purpose" value="${acc.purpose}" required placeholder="Account Strategy Purpose">
      <button type="button" class="setup-del-btn" onclick="removeSetupAccount(${index})">
        <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
      </button>
    `;
    setupAccList.appendChild(row);
  });

  // 4. Setup Savings Goals List
  const setupGoalsList = document.getElementById('setup-goals-list');
  setupGoalsList.innerHTML = '';
  
  // Make account selection dropdown options
  let accountOptions = '';
  state.bankAccounts.forEach(acc => {
    accountOptions += `<option value="${acc.id}">${acc.name}</option>`;
  });

  state.savingsGoals.forEach((g, index) => {
    const row = document.createElement('div');
    row.className = 'setup-goal-row';
    row.innerHTML = `
      <div style="position: relative; display: flex; flex-direction: column;">
        <input type="text" class="form-control setup-goal-name" value="${g.name}" required placeholder="Goal Name">
        <span class="setup-goal-suggestion" style="display: none;"></span>
      </div>
      <input type="number" class="form-control setup-goal-target" value="${g.target}" required min="0" placeholder="Target (Rs.)">
      <input type="date" class="form-control setup-goal-date" value="${g.targetDate || ''}" required>
      <select class="form-control setup-goal-account">
        ${state.bankAccounts.map(acc => `<option value="${acc.id}" ${g.account === acc.id ? 'selected' : ''}>${acc.name}</option>`).join('')}
      </select>
      <button type="button" class="setup-del-btn" onclick="removeSetupGoal(${index})">
        <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
      </button>
    `;
    setupGoalsList.appendChild(row);

    // Price suggestion logic bindings
    const nameInput = row.querySelector('.setup-goal-name');
    const targetInput = row.querySelector('.setup-goal-target');
    const suggSpan = row.querySelector('.setup-goal-suggestion');

    const handleSuggestions = () => {
      handleOnlinePriceSearch(nameInput.value, targetInput, suggSpan);
    };

    nameInput.addEventListener('input', handleSuggestions);
  });

  // 5. Setup Profile Management
  renderSetupProfilesList();

  lucide.createIcons();
}

function removeSetupCategory(index) {
  state.categories.splice(index, 1);
  initSetupPage();
}

function removeSetupIncome(index) {
  state.incomeSources.splice(index, 1);
  initSetupPage();
}

async function removeSetupAccount(index) {
  const acc = state.bankAccounts[index];
  if (await showCustomConfirm("Remove Account", `Are you sure you want to remove account "${acc.name || 'Unnamed Account'}"?\n\nTransactions associated will remain in ledger.`)) {
    state.bankAccounts.splice(index, 1);
    initSetupPage();
  }
}

async function removeSetupGoal(index) {
  const goal = state.savingsGoals[index];
  if (await showCustomConfirm("Remove Savings Goal", `Are you sure you want to remove goal "${goal.name || 'Unnamed Goal'}"?\n\nDeposits will remain in your accounts.`)) {
    state.savingsGoals.splice(index, 1);
    initSetupPage();
  }
}

function renderSetupProfilesList() {
  const container = document.getElementById('setup-profiles-list');
  if (!container) return;
  container.innerHTML = '';

  profiles.forEach(p => {
    const isCurrent = p.id === activeProfileId;
    const row = document.createElement('div');
    row.className = 'setup-input-row';
    row.style.gridTemplateColumns = '1.5fr auto';
    row.style.gap = '16px';
    row.style.alignItems = 'center';
    row.style.padding = '8px 12px';
    row.style.backgroundColor = 'var(--card-bg)';
    row.style.border = '1px solid var(--border-color)';
    row.style.borderRadius = 'var(--btn-radius)';

    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-weight: 500; font-size: 14px; color: var(--text-color);">${p.name}</span>
        ${isCurrent ? `<span style="font-size: 10px; padding: 2px 8px; border-radius: 12px; background-color: var(--success-glow); color: var(--success); border: 1px solid rgba(74, 222, 128, 0.2); font-weight: 600;">Active</span>` : ''}
      </div>
      <div>
        ${isCurrent ? `
          <span style="font-size: 12px; color: var(--text-muted); font-style: italic;">Active Workspace</span>
        ` : `
          <button type="button" class="setup-del-btn" title="Delete Profile" onclick="deleteProfile('${p.id}')">
            <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
          </button>
        `}
      </div>
    `;
    container.appendChild(row);
  });

  if (typeof lucide !== 'undefined') {
    lucide.createIcons({ nodes: [container] });
  }
}

async function deleteProfile(profileId) {
  if (profileId === activeProfileId) {
    showNotification("Error", "You cannot delete the active profile.", "saving", "alert-circle");
    return;
  }
  
  const targetProfile = profiles.find(p => p.id === profileId);
  if (!targetProfile) return;
  
  const confirmed = await showCustomConfirm(
    "Delete Profile Workspace",
    `Are you sure you want to delete the profile "${targetProfile.name}"?\n\nThis will permanently delete all transactions, bank accounts, and goals under this profile. This action cannot be undone.`
  );
  
  if (confirmed) {
    profiles = profiles.filter(p => p.id !== profileId);
    
    // Safety fallback just in case
    if (profiles.length === 0) {
      const defaultState = JSON.parse(JSON.stringify(DEFAULT_STATE));
      profiles.push({
        id: 'profile_default',
        name: 'Azhan',
        state: defaultState
      });
      activeProfileId = 'profile_default';
      state = defaultState;
    }
    
    saveProfiles();
    populateProfileDropdown();
    initSetupPage();
    showNotification("Profile Deleted", `Workspace "${targetProfile.name}" has been deleted.`, "saving", "check-circle");
  }
}

// Add Rows binders in Setup
document.getElementById('add-setup-cat-btn').addEventListener('click', () => {
  state.categories.push({ name: '', budget: 0 });
  initSetupPage();
});

document.getElementById('add-setup-income-btn').addEventListener('click', () => {
  state.incomeSources.push('');
  initSetupPage();
});

document.getElementById('add-setup-acc-btn').addEventListener('click', () => {
  const randomId = 'acc_' + Date.now();
  state.bankAccounts.push({ id: randomId, name: '', bank: '', type: 'Current', purpose: '', balance: 0 });
  initSetupPage();
});

document.getElementById('add-setup-goal-btn').addEventListener('click', () => {
  const randomId = 'goal_' + Date.now();
  const defaultAcc = state.bankAccounts[0] ? state.bankAccounts[0].id : 'allied';
  state.savingsGoals.push({ id: randomId, name: '', target: 0, saved: 0, targetDate: '', account: defaultAcc });
  initSetupPage();
});

// Setup forms submissions
document.getElementById('categories-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const rows = document.querySelectorAll('#setup-categories-list .setup-input-row');
  const newCats = [];
  rows.forEach(r => {
    const name = r.querySelector('.setup-cat-name').value.trim();
    const budget = Number(r.querySelector('.setup-cat-budget').value);
    if (name) newCats.push({ name, budget });
  });
  state.categories = newCats;
  saveState();
  updateUI();
  showNotification("Categories Saved", "Expense categories and default budgets saved successfully!", "saving", "check-circle");
});

document.getElementById('income-sources-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const rows = document.querySelectorAll('#setup-income-list .setup-input-row');
  const newIncs = [];
  rows.forEach(r => {
    const name = r.querySelector('.setup-inc-name').value.trim();
    if (name) newIncs.push(name);
  });
  state.incomeSources = newIncs;
  saveState();
  updateUI();
  showNotification("Income Sources Saved", "Income sources saved successfully!", "saving", "check-circle");
});

document.getElementById('bank-accounts-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const rows = document.querySelectorAll('#setup-accounts-list .setup-acc-row');
  const newAccs = [];
  
  rows.forEach((r, idx) => {
    const originalAcc = state.bankAccounts[idx];
    const name = r.querySelector('.setup-acc-name').value.trim();
    const bank = r.querySelector('.setup-acc-bank').value.trim();
    const type = r.querySelector('.setup-acc-type').value;
    const initialBalance = Number(r.querySelector('.setup-acc-init-balance').value) || 0;
    const purpose = r.querySelector('.setup-acc-purpose').value.trim();
    
    if (name) {
      newAccs.push({
        id: originalAcc ? originalAcc.id : 'acc_' + Date.now() + '_' + idx,
        name,
        bank,
        type,
        initialBalance,
        purpose,
        balance: originalAcc ? originalAcc.balance : 0
      });
    }
  });
  
  state.bankAccounts = newAccs;
  saveState();
  updateUI();
  showNotification("Accounts Saved", "Bank accounts updated successfully!", "saving", "check-circle");
});

document.getElementById('savings-goals-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const rows = document.querySelectorAll('#setup-goals-list .setup-goal-row');
  const newGoals = [];

  for (let idx = 0; idx < rows.length; idx++) {
    const r = rows[idx];
    const originalGoal = state.savingsGoals[idx];
    const name = r.querySelector('.setup-goal-name').value.trim();
    const target = Number(r.querySelector('.setup-goal-target').value);
    const date = r.querySelector('.setup-goal-date').value;
    const account = r.querySelector('.setup-goal-account').value;

    if (name) {
      let fetchedImage = originalGoal ? originalGoal.image : null;
      
      // Fetch a new image if the name has changed or if it's a new goal
      if (!originalGoal || originalGoal.name !== name) {
        try {
          const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(name)}&gsrlimit=1&prop=pageimages&pithumbsize=500&format=json&origin=*`;
          const res = await fetch(wikiUrl);
          const data = await res.json();
          if (data && data.query && data.query.pages) {
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            if (pages[pageId] && pages[pageId].thumbnail && pages[pageId].thumbnail.source) {
              fetchedImage = pages[pageId].thumbnail.source;
            }
          }
        } catch (err) {
          console.error("Failed to fetch goal image from Wikipedia:", err);
        }
      }

      newGoals.push({
        id: originalGoal ? originalGoal.id : 'goal_' + Date.now() + '_' + idx,
        name,
        target,
        saved: originalGoal ? originalGoal.saved : 0,
        targetDate: date,
        account,
        image: fetchedImage
      });
    }
  }

  state.savingsGoals = newGoals;
  saveState();
  updateUI();
  showNotification("Goals Saved", "Savings Goals updated successfully!", "saving", "check-circle");
});

// Backup handlers
document.getElementById('export-btn').addEventListener('click', () => {
  const jsonStr = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `totality_finance_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

const importBtn = document.getElementById('import-btn');
const importFileInput = document.getElementById('import-file-input');

if (importBtn && importFileInput) {
  importBtn.addEventListener('click', () => importFileInput.click());
  importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const importedData = JSON.parse(evt.target.result);
        if (importedData && typeof importedData === 'object') {
          if (Array.isArray(importedData.categories) && Array.isArray(importedData.transactions)) {
            state = importedData;
            saveState();
            updateUI();
            initSetupPage();
            showNotification("Backup Loaded", "Your configuration backup has been loaded successfully!", "saving", "check-circle");
          } else {
            showNotification("Invalid Schema", "The imported backup file is invalid or corrupted.", "warning", "alert-triangle");
          }
        }
      } catch (err) {
        showNotification("Error", "JSON parsing error: " + err.message, "warning", "alert-triangle");
      }
    };
    reader.readAsText(file);
  });
}

// Global Month/Year dropdown change handler
function handleGlobalDateChange() {
  const monthSelect = document.getElementById('global-month-select');
  const yearSelect = document.getElementById('global-year-select');
  if (monthSelect && yearSelect) {
    const month = monthSelect.value;
    const year = yearSelect.value;
    state.selectedMonth = `${year}-${month}`;
    updateMonthsRef();
    saveState();
    updateUI();
  }
}

const globalMonthSelect = document.getElementById('global-month-select');
if (globalMonthSelect) {
  globalMonthSelect.addEventListener('change', handleGlobalDateChange);
}

const globalYearSelect = document.getElementById('global-year-select');
if (globalYearSelect) {
  globalYearSelect.addEventListener('change', handleGlobalDateChange);
}

// Theme switcher
const themeToggleBtn = document.getElementById('theme-toggle');
themeToggleBtn.addEventListener('click', () => {
  const isLight = document.body.getAttribute('data-theme') === 'light';
  if (isLight) {
    document.body.removeAttribute('data-theme');
    themeToggleBtn.querySelector('.sun-icon').setAttribute('data-lucide', 'sun');
    themeToggleBtn.querySelector('.theme-text').innerText = 'Light Mode';
  } else {
    document.body.setAttribute('data-theme', 'light');
    themeToggleBtn.querySelector('.sun-icon').setAttribute('data-lucide', 'moon');
    themeToggleBtn.querySelector('.theme-text').innerText = 'Dark Mode';
  }
  lucide.createIcons();
  
  // Redraw
  const metrics = computeMetrics();
  const annual = computeAnnualOverview();
  renderCharts(metrics, annual);
});

// Navigation links binders
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    const tabId = link.getAttribute('data-tab');
    if (tabId) switchTab(tabId);
  });
});

// Subscriptions & Debts form submit handlers
const addSubForm = document.getElementById('add-sub-form');
if (addSubForm) {
  addSubForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('sub-type').value;
    const name = document.getElementById('sub-name').value.trim();
    const amount = Number(document.getElementById('sub-amount').value);
    const dayOfMonth = Number(document.getElementById('sub-day').value);
    const category = document.getElementById('sub-category').value;
    const account = document.getElementById('sub-account').value;
    const startM = document.getElementById('sub-start-month-select').value;
    const startY = document.getElementById('sub-start-year-select').value;
    const startMonth = `${startY}-${startM}`;
    
    if (name && amount > 0 && dayOfMonth >= 1 && dayOfMonth <= 31) {
      const newSub = {
        id: 'sub_' + Date.now(),
        type,
        name,
        amount,
        dayOfMonth,
        category,
        account,
        startMonth
      };
      
      if (!state.subscriptions) state.subscriptions = [];
      state.subscriptions.push(newSub);
      saveState();
      
      // Process recurring auto-transactions for the newly added flow
      processRecurringExpenses();
      
      updateUI();
      
      addSubForm.reset();
      toggleSubFormTypeFields();
      populateSubscriptionFormDropdowns();
      
      const titleText = type === 'income' ? "Fixed Income Added" : "Fixed Expense Added";
      const descText = type === 'income' ? "Fixed recurring income added successfully!" : "Fixed recurring expense added successfully!";
      showNotification(titleText, descText, "saving", "check-circle");
    }
  });
}

const addDebtForm = document.getElementById('add-debt-form');
if (addDebtForm) {
  addDebtForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('debt-type').value;
    const person = document.getElementById('debt-person').value.trim();
    const description = document.getElementById('debt-desc').value.trim();
    const amount = Number(document.getElementById('debt-amount').value);
    const dueDate = document.getElementById('debt-due').value || null;
    const adjustMode = document.getElementById('debt-adjust-mode').value;
    const account = document.getElementById('debt-account').value;
    
    if (person && amount > 0) {
      const debtId = 'debt_' + Date.now();
      const newDebt = {
        id: debtId,
        type,
        person,
        description,
        amount,
        remaining: amount,
        dueDate,
        adjustMode,
        account: adjustMode === 'cash' ? account : null,
        createdDate: new Date().toISOString().split('T')[0]
      };
      
      if (!state.debts) state.debts = [];
      state.debts.push(newDebt);
      
      if (adjustMode === 'cash' && account) {
        if (type === 'debt') {
          addTransaction({
            type: 'income',
            description: `Loan payout from ${person} (${description})`,
            amount: amount,
            date: newDebt.createdDate,
            account: account,
            category: 'Miscellaneous'
          });
        } else {
          addTransaction({
            type: 'expense',
            description: `Money lent to ${person} (${description})`,
            amount: amount,
            date: newDebt.createdDate,
            account: account,
            category: 'Miscellaneous'
          });
        }
      } else {
        saveState();
        updateUI();
      }
      
      addDebtForm.reset();
      
      // Reset form visual states
      const accountGroup = document.getElementById('debt-account-group');
      if (accountGroup) accountGroup.style.display = 'none';
      const personLabel = document.getElementById('debt-person-label');
      if (personLabel) personLabel.innerText = "Owed To (Creditor / Receiver)";
      const personInput = document.getElementById('debt-person');
      if (personInput) personInput.placeholder = "e.g. HBL Bank, Hamza";
      const adjustSelect = document.getElementById('debt-adjust-mode');
      if (adjustSelect) {
        adjustSelect.options[0].text = "No immediate bank adjustment (Deferred / Received work)";
        adjustSelect.options[1].text = "Receive cash in bank account (Loan)";
      }
      
      showNotification("Record Saved", "Outstanding record created successfully!", "saving", "check-circle");
    }
  });
}

// Register change listeners for debt-type and debt-adjust-mode
const debtTypeSelect = document.getElementById('debt-type');
if (debtTypeSelect) {
  debtTypeSelect.addEventListener('change', () => {
    const type = debtTypeSelect.value;
    const personLabel = document.getElementById('debt-person-label');
    const personInput = document.getElementById('debt-person');
    const adjustModeSelect = document.getElementById('debt-adjust-mode');
    if (personLabel && personInput && adjustModeSelect) {
      if (type === 'credit') {
        personLabel.innerText = "Owed By (Debtor / Payer)";
        personInput.placeholder = "e.g. Ali, Friend";
        adjustModeSelect.options[0].text = "No immediate bank adjustment (Deferred / Owed for work)";
        adjustModeSelect.options[1].text = "Disburse cash from bank account (Lent)";
      } else {
        personLabel.innerText = "Owed To (Creditor / Receiver)";
        personInput.placeholder = "e.g. HBL Bank, Hamza";
        adjustModeSelect.options[0].text = "No immediate bank adjustment (Deferred / Received work)";
        adjustModeSelect.options[1].text = "Receive cash in bank account (Loan)";
      }
    }
  });
}

const debtAdjustModeSelect = document.getElementById('debt-adjust-mode');
if (debtAdjustModeSelect) {
  debtAdjustModeSelect.addEventListener('change', () => {
    const accountGroup = document.getElementById('debt-account-group');
    if (accountGroup) {
      if (debtAdjustModeSelect.value === 'cash') {
        accountGroup.style.display = 'block';
      } else {
        accountGroup.style.display = 'none';
      }
    }
  });
}

// Expose handlers globally
window.switchTab = switchTab;
window.deleteTransaction = deleteTransaction;
window.openDepositToGoalModal = openDepositToGoalModal;
window.removeSetupCategory = removeSetupCategory;
window.removeSetupIncome = removeSetupIncome;
window.removeSetupAccount = removeSetupAccount;
window.removeSetupGoal = removeSetupGoal;
window.updateMonthlyBudget = updateMonthlyBudget;
window.completeGoal = completeGoal;
window.deleteSubscription = deleteSubscription;
window.deleteDebt = deleteDebt;
window.toggleSubFormTypeFields = toggleSubFormTypeFields;

function updateTodayDateDisplay() {
  const dateBadge = document.getElementById('today-date-badge');
  if (dateBadge) {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateBadge.innerText = today.toLocaleDateString('en-US', options);
  }
}

window.openRepayDebtModal = openRepayDebtModal;
window.updateTodayDateDisplay = updateTodayDateDisplay;

// Top Bar Masked Balances State & Functions
let balancesVisible = false;

function toggleTopBalancesVisibility() {
  balancesVisible = !balancesVisible;
  localStorage.setItem('totality_balances_visible', balancesVisible);
  updateTopBalancesDisplay();
}

function updateTopBalancesDisplay() {
  if (!state || !state.bankAccounts) return;
  const netCashVal = state.bankAccounts.reduce((sum, a) => sum + a.balance, 0);
  let dailySpendAcc = state.bankAccounts.find(a => a.id === 'scb');
  if (!dailySpendAcc) {
    dailySpendAcc = state.bankAccounts.find(a => {
      const p = (a.purpose || '').toLowerCase();
      return p.includes('daily') || p.includes('salary');
    });
  }
  if (!dailySpendAcc) {
    dailySpendAcc = state.bankAccounts.find(a => {
      const t = (a.type || '').toLowerCase();
      const p = (a.purpose || '').toLowerCase();
      return !t.includes('saving') && !p.includes('saving');
    });
  }
  if (!dailySpendAcc && state.bankAccounts.length > 0) {
    dailySpendAcc = state.bankAccounts[0];
  }
  const dailySpendVal = dailySpendAcc ? dailySpendAcc.balance : 0;
  
  const netCashEl = document.getElementById('top-net-cash');
  const dailySpendEl = document.getElementById('top-daily-spend');
  const eyeIcon = document.getElementById('top-balances-eye-icon');
  const mobileEyeIcon = document.getElementById('mobile-eye-icon');
  
  if (netCashEl && dailySpendEl) {
    if (balancesVisible) {
      animateNumber('top-net-cash', netCashVal);
      animateNumber('top-daily-spend', dailySpendVal);
      if (eyeIcon) {
        eyeIcon.setAttribute('data-lucide', 'eye-off');
      }
      if (mobileEyeIcon) {
        mobileEyeIcon.setAttribute('data-lucide', 'eye-off');
      }
    } else {
      netCashEl.innerText = '••••••';
      dailySpendEl.innerText = '••••••';
      if (eyeIcon) {
        eyeIcon.setAttribute('data-lucide', 'eye');
      }
      if (mobileEyeIcon) {
        mobileEyeIcon.setAttribute('data-lucide', 'eye');
      }
    }
    if (typeof lucide !== 'undefined') {
      if (eyeIcon) lucide.createIcons({ nodes: [eyeIcon] });
      if (mobileEyeIcon) lucide.createIcons({ nodes: [mobileEyeIcon] });
    }
  }
}

window.toggleTopBalancesVisibility = toggleTopBalancesVisibility;
window.updateTopBalancesDisplay = updateTopBalancesDisplay;
window.dismissNudge = dismissNudge;
window.showNotification = showNotification;

// Savings Goal Modal Event Listeners & Handler
const goalModal = document.getElementById('goal-modal');
const goalForm = document.getElementById('goal-modal-form');

function openGoalModal() {
  if (goalForm) goalForm.reset();
  
  // Set target date default: 6 months from now
  const defaultDate = new Date();
  defaultDate.setMonth(defaultDate.getMonth() + 6);
  const year = defaultDate.getFullYear();
  const month = (defaultDate.getMonth() + 1).toString().padStart(2, '0');
  const day = defaultDate.getDate().toString().padStart(2, '0');
  
  const dateInput = document.getElementById('modal-goal-date');
  if (dateInput) {
    dateInput.value = `${year}-${month}-${day}`;
  }
  
  // Populate Bank Accounts dropdown
  const accSelect = document.getElementById('modal-goal-account');
  if (accSelect) {
    accSelect.innerHTML = '';
    state.bankAccounts.forEach(acc => {
      accSelect.innerHTML += `<option value="${acc.id}">${acc.name} (${acc.bank})</option>`;
    });
  }
  
  // Clear suggestions
  const suggSpan = document.getElementById('modal-goal-suggestion');
  if (suggSpan) {
    suggSpan.style.display = 'none';
    suggSpan.innerHTML = '';
  }
  
  if (goalModal) goalModal.classList.add('active');
}

function closeGoalModal() {
  if (goalModal) goalModal.classList.remove('active');
}

// Binders
const addGoalTabBtn = document.getElementById('add-goal-tab-btn');
if (addGoalTabBtn) {
  addGoalTabBtn.addEventListener('click', openGoalModal);
}
const closeGoalModalBtn = document.getElementById('close-goal-modal');
if (closeGoalModalBtn) {
  closeGoalModalBtn.addEventListener('click', closeGoalModal);
}
const cancelGoalModalBtn = document.getElementById('cancel-goal-modal');
if (cancelGoalModalBtn) {
  cancelGoalModalBtn.addEventListener('click', closeGoalModal);
}

if (goalForm) {
  goalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('modal-goal-name').value.trim();
    const target = Number(document.getElementById('modal-goal-target').value);
    const date = document.getElementById('modal-goal-date').value;
    const account = document.getElementById('modal-goal-account').value;
    
    if (name && target > 0 && date && account) {
      let fetchedImage = null;
      try {
        const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(name)}&gsrlimit=1&prop=pageimages&pithumbsize=500&format=json&origin=*`;
        const res = await fetch(wikiUrl);
        const data = await res.json();
        if (data && data.query && data.query.pages) {
          const pages = data.query.pages;
          const pageId = Object.keys(pages)[0];
          if (pages[pageId] && pages[pageId].thumbnail && pages[pageId].thumbnail.source) {
            fetchedImage = pages[pageId].thumbnail.source;
          }
        }
      } catch (err) {
        console.error("Failed to fetch goal image from Wikipedia:", err);
      }

      const newGoal = {
        id: 'goal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        name,
        target,
        saved: 0,
        targetDate: date,
        account,
        image: fetchedImage
      };
      
      if (!state.savingsGoals) state.savingsGoals = [];
      state.savingsGoals.push(newGoal);
      saveState();
      updateUI();
      closeGoalModal();
      
      showNotification("Goal Created", `Savings goal for "${name}" has been created successfully!`, "saving", "check-circle");
    }
  });
}

// Online price suggestion for Add Goal Modal
const modalGoalName = document.getElementById('modal-goal-name');
const modalGoalTarget = document.getElementById('modal-goal-target');
const modalGoalSugg = document.getElementById('modal-goal-suggestion');

if (modalGoalName && modalGoalTarget && modalGoalSugg) {
  modalGoalName.addEventListener('input', () => {
    handleOnlinePriceSearch(modalGoalName.value, modalGoalTarget, modalGoalSugg);
  });
}

// Profile Manager Wizard Modal Handlers
const profileModal = document.getElementById('profile-modal');
const profileForm = document.getElementById('profile-modal-form');

function openProfileModal() {
  if (profileForm) profileForm.reset();
  
  // Clear lists
  document.getElementById('modal-profile-accounts-list').innerHTML = '';
  document.getElementById('modal-profile-income-list').innerHTML = '';
  
  // Populate defaults for ease of use
  addProfileAccountRow("Standard Chartered", "Standard Chartered", "Current", 0);
  addProfileAccountRow("Allied Bank", "Allied Bank", "Savings", 0);
  
  addProfileIncomeRow("Coca Cola");
  addProfileIncomeRow("Extra / EP");
  addProfileIncomeRow("Miscellaneous");
  addProfileIncomeRow("Tuition");
  
  if (profileModal) profileModal.classList.add('active');
}

function closeProfileModal() {
  if (profileModal) profileModal.classList.remove('active');
}

function addProfileAccountRow(name="", bank="", type="Current", initBalance=0) {
  const list = document.getElementById('modal-profile-accounts-list');
  if (!list) return;
  const row = document.createElement('div');
  row.className = 'modal-profile-acc-row';
  row.style.display = 'grid';
  row.style.gridTemplateColumns = '1.2fr 1fr 1fr 1fr auto';
  row.style.gap = '8px';
  row.style.alignItems = 'center';
  
  row.innerHTML = `
    <input type="text" class="form-control profile-acc-name" value="${name}" placeholder="Name (e.g. SCB)" required>
    <input type="text" class="form-control profile-acc-bank" value="${bank}" placeholder="Bank" required>
    <select class="form-control profile-acc-type">
      <option value="Current" ${type === 'Current' ? 'selected' : ''}>Current</option>
      <option value="Savings" ${type === 'Savings' ? 'selected' : ''}>Savings</option>
      <option value="Digital Savings" ${type === 'Digital Savings' ? 'selected' : ''}>Digital Savings</option>
      <option value="Cash" ${type === 'Cash' ? 'selected' : ''}>Cash</option>
    </select>
    <input type="number" class="form-control profile-acc-init" value="${initBalance}" placeholder="Inherited" min="0" required>
    <button type="button" class="btn btn-secondary modal-row-del-btn" style="padding: 6px; display: inline-flex; align-items: center; justify-content: center; color: var(--danger);">
      <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
    </button>
  `;
  
  row.querySelector('.modal-row-del-btn').addEventListener('click', () => {
    row.remove();
  });
  
  list.appendChild(row);
  if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [row] });
}

function addProfileIncomeRow(name="") {
  const list = document.getElementById('modal-profile-income-list');
  if (!list) return;
  const row = document.createElement('div');
  row.className = 'modal-profile-inc-row';
  row.style.display = 'grid';
  row.style.gridTemplateColumns = '1fr auto';
  row.style.gap = '8px';
  row.style.alignItems = 'center';
  
  row.innerHTML = `
    <input type="text" class="form-control profile-inc-name" value="${name}" placeholder="e.g. Salary, Freelance" required>
    <button type="button" class="btn btn-secondary modal-row-del-btn" style="padding: 6px; display: inline-flex; align-items: center; justify-content: center; color: var(--danger);">
      <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
    </button>
  `;
  
  row.querySelector('.modal-row-del-btn').addEventListener('click', () => {
    row.remove();
  });
  
  list.appendChild(row);
  if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [row] });
}

// Attach inner buttons within profile modal
const modalAddAccBtn = document.getElementById('modal-add-acc-btn');
if (modalAddAccBtn) {
  modalAddAccBtn.addEventListener('click', () => addProfileAccountRow());
}
const modalAddIncBtn = document.getElementById('modal-add-inc-btn');
if (modalAddIncBtn) {
  modalAddIncBtn.addEventListener('click', () => addProfileIncomeRow());
}
const closeProfileModalBtn = document.getElementById('close-profile-modal');
if (closeProfileModalBtn) {
  closeProfileModalBtn.addEventListener('click', closeProfileModal);
}
const cancelProfileModalBtn = document.getElementById('cancel-profile-modal');
if (cancelProfileModalBtn) {
  cancelProfileModalBtn.addEventListener('click', closeProfileModal);
}

if (profileForm) {
  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('profile-name').value.trim();
    if (!name) return;
    
    // Check if name already exists
    if (profiles.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      alert("A profile with this name already exists!");
      return;
    }
    
    // Gather accounts
    const accRows = document.querySelectorAll('#modal-profile-accounts-list .modal-profile-acc-row');
    const bankAccounts = [];
    accRows.forEach((r, idx) => {
      const accName = r.querySelector('.profile-acc-name').value.trim();
      const bank = r.querySelector('.profile-acc-bank').value.trim();
      const type = r.querySelector('.profile-acc-type').value;
      const initialBalance = Number(r.querySelector('.profile-acc-init').value) || 0;
      
      if (accName) {
        bankAccounts.push({
          id: 'acc_' + Date.now() + '_' + idx,
          name: accName,
          bank,
          type,
          initialBalance,
          purpose: type === 'Savings' ? 'Savings' : 'Daily Spend',
          balance: initialBalance
        });
      }
    });
    
    // Gather income sources
    const incRows = document.querySelectorAll('#modal-profile-income-list .modal-profile-inc-row');
    const incomeSources = [];
    incRows.forEach(r => {
      const incName = r.querySelector('.profile-inc-name').value.trim();
      if (incName) {
        incomeSources.push(incName);
      }
    });
    
    // Standard default categories and budgets (same for any user!)
    const categories = JSON.parse(JSON.stringify(DEFAULT_STATE.categories));
    
    // Construct new state
    const newProfileState = {
      ...DEFAULT_STATE,
      categories,
      bankAccounts,
      incomeSources,
      selectedMonth: state.selectedMonth || DEFAULT_STATE.selectedMonth,
      transactions: [],
      savingsGoals: [],
      subscriptions: [],
      debts: [],
      monthlyBudgets: {},
      _schemaVersion: 2
    };
    
    const newProfileId = 'profile_' + Date.now();
    const newProfile = {
      id: newProfileId,
      name,
      state: newProfileState
    };
    
    profiles.push(newProfile);
    activeProfileId = newProfileId;
    state = newProfileState;
    
    saveProfiles();
    normalizeLoadedState();
    saveState();
    
    closeProfileModal();
    switchTab('dashboard');
    updateUI();
    populateProfileDropdown();
    
    showNotification("Profile Created", `Workspace "${name}" has been created and activated!`, "saving", "check-circle");
  });
}

// ─── FEATURE 5: BILL SPLIT CALCULATOR ───

function updateBillSplitterTableTitle() {
  const tableTitle = document.getElementById('billsplit-table-title');
  if (tableTitle) {
    const name = (state.billSplitter && state.billSplitter.restaurant) ? state.billSplitter.restaurant.trim() : "Seven Sides";
    tableTitle.innerText = `📋 Split Breakdown (${name || 'Seven Sides'})`;
  }
}

function renderBillSplitter() {
  const mainContent = document.querySelector('.main-content');
  const savedScrollTop = mainContent ? mainContent.scrollTop : 0;

  const itemsTableContainer = document.querySelector('#tools-billsplit-panel .table-responsive');
  const savedTableScrollTop = itemsTableContainer ? itemsTableContainer.scrollTop : 0;

  if (!state.billSplitter) {
    state.billSplitter = {
      restaurant: "Seven Sides",
      paymentMethod: "card",
      discountPct: 0,
      discountCap: 0,
      members: ["Azhan", "Alina", "Ahmed"],
      items: []
    };
  }
  
  const members = state.billSplitter.members || [];
  const items = state.billSplitter.items || [];
  const discountPct = (Number(state.billSplitter.discountPct) || 0) / 100;
  const discountCap = Number(state.billSplitter.discountCap) || 0;
  const paymentMethod = state.billSplitter.paymentMethod || "card";
  const taxRate = (paymentMethod === 'cash') ? 0.16 : 0.05;
  
  // Render Group Members Badges List
  const membersListEl = document.getElementById('billsplit-members-list');
  if (membersListEl) {
    if (members.length === 0) {
      membersListEl.innerHTML = `<span style="color: var(--text-muted); font-size: 12px;">No members added. Enter names above to create a group.</span>`;
    } else {
      membersListEl.innerHTML = members.map(m => `
        <div class="member-pill" style="display: inline-flex; align-items: center; gap: 6px; background: rgba(228, 0, 43, 0.08); color: var(--primary); border: 1px solid rgba(228, 0, 43, 0.15); padding: 3px 8px; border-radius: 20px; font-size: 11.5px; font-weight: 600; box-sizing: border-box;">
          <span>${m}</span>
          <span class="billsplit-member-remove" data-name="${m}" style="cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; color: var(--text-muted); font-size: 12px; line-height: 1; height: 12px; width: 12px; transition: color 0.2s;" title="Remove Member">×</span>
        </div>
      `).join('');
    }
  }

  // Render Checkboxes in Add Item Card
  renderAddItemFormMembers();

  // Render Items List Table
  const itemsTbody = document.getElementById('billsplit-items-tbody');
  if (itemsTbody) {
    itemsTbody.innerHTML = '';
    if (items.length === 0) {
      itemsTbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 24px;">
            No items logged yet. Add food items using the form on the left.
          </td>
        </tr>
      `;
    } else {
      items.forEach(item => {
        const sharedNames = (item.shares || []).join(', ');
        itemsTbody.innerHTML += `
          <tr>
            <td style="font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.name}</td>
            <td>Rs. ${Number(item.price).toLocaleString()}</td>
            <td style="color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${sharedNames}">${sharedNames}</td>
            <td style="text-align: center; padding: 4px 8px;">
              <button class="btn btn-secondary billsplit-item-delete-btn" data-id="${item.id}" style="padding: 4px 8px; border-radius: 6px; color: var(--danger); border-color: rgba(239, 68, 68, 0.2); cursor: pointer;" title="Delete Item">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
              </button>
            </td>
          </tr>
        `;
      });
    }
  }

  // Compute Food Share for each member
  const memberOriginalCost = {};
  members.forEach(m => memberOriginalCost[m] = 0);
  
  let totalFoodCost = 0;
  items.forEach(item => {
    const price = Number(item.price) || 0;
    const shareCount = (item.shares || []).length;
    if (shareCount > 0) {
      totalFoodCost += price;
      const sharePrice = price / shareCount;
      item.shares.forEach(m => {
        if (memberOriginalCost[m] !== undefined) {
          memberOriginalCost[m] += sharePrice;
        }
      });
    }
  });

  // Calculate total discount applied (capped if cap > 0)
  const uncappedDiscount = totalFoodCost * discountPct;
  const actualTotalDiscount = (discountCap > 0) ? Math.min(uncappedDiscount, discountCap) : uncappedDiscount;

  // Render Split Breakdown Table
  const tbody = document.getElementById('billsplit-tbody');
  if (tbody) {
    tbody.innerHTML = '';
    
    if (members.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">
            No group members added yet. Add members to split bills.
          </td>
        </tr>
      `;
    } else if (items.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">
            Add food items on the left to see each person's split breakdown.
          </td>
        </tr>
      `;
    } else {
      members.forEach(m => {
        const originalAmt = memberOriginalCost[m] || 0;
        // Proportionate share of total food cost
        const share = totalFoodCost > 0 ? originalAmt / totalFoodCost : 0;
        // Proportional discount
        const personDiscount = share * actualTotalDiscount;
        // Tax is original share * taxRate
        const personTax = originalAmt * taxRate;
        // Total for this person
        const personTotal = originalAmt - personDiscount + personTax;
        
        tbody.innerHTML += `
          <tr>
            <td style="font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m}</td>
            <td>Rs. ${Math.round(originalAmt).toLocaleString()}</td>
            <td style="color: var(--success); font-weight: 500;">-Rs. ${Math.round(personDiscount).toLocaleString()}</td>
            <td style="color: var(--danger); font-weight: 500;">Rs. ${Math.round(personTax).toLocaleString()}</td>
            <td style="font-weight: 700; color: var(--text-main);">Rs. ${Math.round(personTotal).toLocaleString()}</td>
          </tr>
        `;
      });
    }
  }

  // Calculate sum of individual final splits and verify against formula
  let grandTotalSum = 0;
  members.forEach(m => {
    const originalAmt = memberOriginalCost[m] || 0;
    const share = totalFoodCost > 0 ? originalAmt / totalFoodCost : 0;
    const personDiscount = share * actualTotalDiscount;
    const personTax = originalAmt * taxRate;
    grandTotalSum += (originalAmt - personDiscount + personTax);
  });
  
  const totalTax = totalFoodCost * taxRate;
  const formulaTotal = (totalFoodCost - actualTotalDiscount) + totalTax;
  
  // Render Summary metrics
  const originalSumEl = document.getElementById('billsplit-sum-original');
  if (originalSumEl) originalSumEl.innerText = formatCurrency(totalFoodCost);
  
  const discountSumEl = document.getElementById('billsplit-sum-discount');
  if (discountSumEl) discountSumEl.innerText = `-Rs. ${Math.round(actualTotalDiscount).toLocaleString()}`;
  
  const taxSumEl = document.getElementById('billsplit-sum-tax');
  if (taxSumEl) taxSumEl.innerText = `Rs. ${Math.round(totalTax).toLocaleString()}`;
  
  const finalSumEl = document.getElementById('billsplit-sum-final');
  if (finalSumEl) finalSumEl.innerText = formatCurrency(Math.round(grandTotalSum));

  // Render Verification box
  const verifBox = document.getElementById('billsplit-verification-box');
  if (verifBox) {
    verifBox.style.display = 'block';
    const verifDetails = document.getElementById('billsplit-verif-details');
    const verifBadge = document.getElementById('billsplit-verif-badge');
    
    if (items.length > 0 && members.length > 0) {
      const diff = Math.abs(grandTotalSum - formulaTotal);
      if (diff < 0.2) { // 0.2 threshold to handle minor roundings
        verifBox.style.background = 'rgba(16, 185, 129, 0.08)';
        verifBox.style.borderLeftColor = 'var(--success)';
        if (verifBadge) {
          verifBadge.innerText = 'Calculations Verified ✓';
          verifBadge.style.color = 'var(--success)';
        }
        if (verifDetails) {
          verifDetails.innerHTML = `
            Sum of individual splits matches the formula check perfectly:<br>
            <strong>Sum of individual bills:</strong> Rs. ${Math.round(grandTotalSum).toLocaleString()}<br>
            <strong>Formula calculation:</strong> (Rs. ${totalFoodCost.toLocaleString()} food - Rs. ${Math.round(actualTotalDiscount).toLocaleString()} discount) + Rs. ${Math.round(totalTax).toLocaleString()} tax = <strong>Rs. ${Math.round(formulaTotal).toLocaleString()}</strong>
          `;
        }
      } else {
        verifBox.style.background = 'rgba(245, 158, 11, 0.08)';
        verifBox.style.borderLeftColor = 'var(--warning)';
        if (verifBadge) {
          verifBadge.innerText = 'Verification Discrepancy ⚠';
          verifBadge.style.color = 'var(--warning)';
        }
        if (verifDetails) {
          verifDetails.innerHTML = `
            Warning: Sum of splits (Rs. ${Math.round(grandTotalSum).toLocaleString()}) does not match formula (Rs. ${Math.round(formulaTotal).toLocaleString()}). Diff: Rs. ${diff.toFixed(2)}.
          `;
        }
      }
    } else {
      verifBox.style.background = 'rgba(255, 255, 255, 0.03)';
      verifBox.style.borderLeftColor = 'var(--border-color)';
      if (verifBadge) {
        verifBadge.innerText = 'Awaiting Calculations';
        verifBadge.style.color = 'var(--text-muted)';
      }
      if (verifDetails) {
        verifDetails.innerHTML = 'Add group members and food items to verify splits.';
      }
    }
  }

  // Pre-fill parameters on render if needed
  const restInput = document.getElementById('billsplit-restaurant');
  if (restInput && restInput.value !== state.billSplitter.restaurant) {
    restInput.value = state.billSplitter.restaurant || "Seven Sides";
  }
  
  const discountPctInput = document.getElementById('billsplit-discount-pct');
  if (discountPctInput && Number(discountPctInput.value) !== state.billSplitter.discountPct) {
    discountPctInput.value = state.billSplitter.discountPct || 0;
  }
  
  const discountCapInput = document.getElementById('billsplit-discount-cap');
  if (discountCapInput && Number(discountCapInput.value) !== state.billSplitter.discountCap) {
    discountCapInput.value = state.billSplitter.discountCap || 0;
  }
  
  const cardRadio = document.querySelector('input[name="billsplit-payment"][value="card"]');
  const cashRadio = document.querySelector('input[name="billsplit-payment"][value="cash"]');
  if (cardRadio && cashRadio) {
    if (paymentMethod === 'cash') {
      cashRadio.checked = true;
    } else {
      cardRadio.checked = true;
    }
  }

  updateBillSplitterTableTitle();
  
  // Populate user member dropdown
  const userSelect = document.getElementById('billsplit-user-member');
  if (userSelect) {
    const prevVal = userSelect.value;
    userSelect.innerHTML = members.map(m => `<option value="${m}">${m}</option>`).join('');
    // Try to auto-select active profile name if present
    const activeProfile = profiles.find(p => p.id === activeProfileId);
    const defaultUserName = activeProfile ? activeProfile.name : "Azhan";
    if (prevVal && members.includes(prevVal)) {
      userSelect.value = prevVal;
    } else {
      const match = members.find(m => m.toLowerCase() === defaultUserName.toLowerCase());
      if (match) {
        userSelect.value = match;
      } else if (members.length > 0) {
        userSelect.value = members[0];
      }
    }
  }

  // Populate payer dropdown (other members)
  const payerSelect = document.getElementById('billsplit-payer-select');
  if (payerSelect) {
    const selectedUser = userSelect ? userSelect.value : "";
    const otherMembers = members.filter(m => m !== selectedUser);
    const prevVal = payerSelect.value;
    payerSelect.innerHTML = otherMembers.map(m => `<option value="${m}">${m}</option>`).join('');
    if (prevVal && otherMembers.includes(prevVal)) {
      payerSelect.value = prevVal;
    } else if (otherMembers.length > 0) {
      payerSelect.value = otherMembers[0];
    }
  }

  // Populate bank accounts dropdown
  const payAccountSelect = document.getElementById('billsplit-pay-account');
  if (payAccountSelect) {
    const prevVal = payAccountSelect.value;
    payAccountSelect.innerHTML = state.bankAccounts.map(acc => `<option value="${acc.id}">${acc.name} (Rs. ${acc.balance.toLocaleString()})</option>`).join('');
    if (prevVal && state.bankAccounts.some(acc => acc.id === prevVal)) {
      payAccountSelect.value = prevVal;
    } else if (state.bankAccounts.length > 0) {
      payAccountSelect.value = state.bankAccounts[0].id;
    }
  }

  // Control state of settle post button
  const postBtn = document.getElementById('billsplit-post-btn');
  if (postBtn) {
    if (items.length > 0 && members.length > 0) {
      postBtn.disabled = false;
      postBtn.style.opacity = '1';
      postBtn.style.cursor = 'pointer';
    } else {
      postBtn.disabled = true;
      postBtn.style.opacity = '0.5';
      postBtn.style.cursor = 'not-allowed';
    }
  }

  const billSplitEl = document.getElementById('tools-billsplit-panel');
  if (billSplitEl && typeof lucide !== 'undefined') {
    lucide.createIcons({ nodes: [billSplitEl] });
  } else {
    lucide.createIcons();
  }

  if (mainContent) {
    mainContent.scrollTop = savedScrollTop;
  }
  if (itemsTableContainer) {
    itemsTableContainer.scrollTop = savedTableScrollTop;
  }
}

function renderAddItemFormMembers() {
  const container = document.getElementById('billsplit-members-checkboxes');
  if (!container) return;
  
  const members = state.billSplitter.members || [];
  if (members.length === 0) {
    container.innerHTML = `<span style="color: var(--text-muted); font-size: 12px;">Add members in the section above first.</span>`;
    return;
  }
  
  container.innerHTML = members.map(m => `
    <label class="form-checkbox-label" style="display: inline-flex; align-items: center; gap: 6px; font-size: 11px; background: var(--bg-card); border: 1px solid var(--border-color); padding: 3px 8px; border-radius: 20px; cursor: pointer; transition: all 0.2s;">
      <input type="checkbox" name="billsplit-item-member" value="${m}" style="accent-color: var(--primary);">
      <span>${m}</span>
    </label>
  `).join('');
}

function initBillSplitter() {
  const membersList = document.getElementById('billsplit-members-list');
  
  // Member Add
  const memberForm = document.getElementById('billsplit-add-member-form');
  if (memberForm) {
    memberForm.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (document.activeElement) {
        document.activeElement.blur();
      }
      const input = document.getElementById('billsplit-member-name');
      if (input) {
        const name = input.value.trim();
        if (name) {
          if (!state.billSplitter.members) state.billSplitter.members = [];
          if (!state.billSplitter.members.includes(name)) {
            state.billSplitter.members.push(name);
            saveState();
            renderBillSplitter();
          } else {
            showNotification("Duplicate Name", `"${name}" is already in the group!`, "warning", "alert-triangle");
          }
          input.value = '';
        }
      }
    });
  }

  // Member Delete (via Badges)
  if (membersList) {
    membersList.addEventListener('click', (e) => {
      const btn = e.target.closest('.billsplit-member-remove');
      if (btn) {
        const name = btn.getAttribute('data-name');
        if (state.billSplitter && state.billSplitter.members) {
          state.billSplitter.members = state.billSplitter.members.filter(m => m !== name);
          // Also clean up items sharing this member
          if (state.billSplitter.items) {
            state.billSplitter.items.forEach(item => {
              item.shares = (item.shares || []).filter(s => s !== name);
            });
            // Filter out items with no shares left
            state.billSplitter.items = state.billSplitter.items.filter(item => item.shares.length > 0);
          }
          saveState();
          renderBillSplitter();
        }
      }
    });
  }

  // Item Add
  const itemForm = document.getElementById('billsplit-add-item-form');
  if (itemForm) {
    itemForm.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (document.activeElement) {
        document.activeElement.blur();
      }
      const nameInput = document.getElementById('billsplit-item-name');
      const priceInput = document.getElementById('billsplit-item-price');
      
      // Get all checked members checkboxes
      const checkedCheckboxes = document.querySelectorAll('input[name="billsplit-item-member"]:checked');
      const selectedMembers = Array.from(checkedCheckboxes).map(cb => cb.value);
      
      if (selectedMembers.length === 0) {
        showNotification("Select Consumer", "Please select at least one person sharing this item!", "warning", "alert-triangle");
        return;
      }
      
      if (nameInput && priceInput) {
        const name = nameInput.value.trim();
        const price = parseFloat(priceInput.value);
        
        if (name && !isNaN(price) && price > 0) {
          if (!state.billSplitter.items) state.billSplitter.items = [];
          
          state.billSplitter.items.push({
            id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: name,
            price: price,
            shares: selectedMembers
          });
          
          nameInput.value = '';
          priceInput.value = '';
          
          // Re-check all boxes by default for the next entry
          document.querySelectorAll('input[name="billsplit-item-member"]').forEach(cb => cb.checked = true);
          
          saveState();
          renderBillSplitter();
        }
      }
    });
  }

  // Parameter Inputs Listeners
  const restInput = document.getElementById('billsplit-restaurant');
  if (restInput) {
    restInput.addEventListener('input', () => {
      if (!state.billSplitter) state.billSplitter = { people: [] };
      state.billSplitter.restaurant = restInput.value;
      saveState();
      updateBillSplitterTableTitle();
    });
  }

  const discountPctInput = document.getElementById('billsplit-discount-pct');
  if (discountPctInput) {
    discountPctInput.addEventListener('input', () => {
      if (!state.billSplitter) state.billSplitter = { people: [] };
      let val = parseFloat(discountPctInput.value);
      if (isNaN(val) || val < 0) val = 0;
      if (val > 100) val = 100;
      state.billSplitter.discountPct = val;
      saveState();
      renderBillSplitter();
    });
  }

  const discountCapInput = document.getElementById('billsplit-discount-cap');
  if (discountCapInput) {
    discountCapInput.addEventListener('input', () => {
      if (!state.billSplitter) state.billSplitter = { people: [] };
      let val = parseFloat(discountCapInput.value);
      if (isNaN(val) || val < 0) val = 0;
      state.billSplitter.discountCap = val;
      saveState();
      renderBillSplitter();
    });
  }

  // Payment Method Radios
  document.querySelectorAll('input[name="billsplit-payment"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        if (!state.billSplitter) state.billSplitter = { people: [] };
        state.billSplitter.paymentMethod = e.target.value;
        saveState();
        renderBillSplitter();
      }
    });
  });

  // Table row click for delete items
  const itemsTbody = document.getElementById('billsplit-items-tbody');
  if (itemsTbody) {
    itemsTbody.addEventListener('click', (e) => {
      const btn = e.target.closest('.billsplit-item-delete-btn');
      if (btn) {
        const id = btn.getAttribute('data-id');
        if (state.billSplitter && state.billSplitter.items) {
          state.billSplitter.items = state.billSplitter.items.filter(item => item.id !== id);
          saveState();
          renderBillSplitter();
        }
      }
    });
  }

  // Clear Button click
  const clearBtn = document.getElementById('billsplit-clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if ((state.billSplitter.items && state.billSplitter.items.length > 0) || (state.billSplitter.members && state.billSplitter.members.length > 0)) {
        const confirmed = await showCustomConfirm(
          "Clear Bill Splitter",
          "Are you sure you want to clear all members, food items, and parameters?",
          true
        );
        if (confirmed) {
          state.billSplitter.people = []; // Clean up old model if any
          state.billSplitter.items = [];
          state.billSplitter.members = ["Azhan", "Alina", "Ahmed"]; // Reset to default group
          state.billSplitter.restaurant = "Seven Sides";
          state.billSplitter.discountPct = 0;
          state.billSplitter.discountCap = 0;
          state.billSplitter.paymentMethod = "card";
          
          document.getElementById('billsplit-restaurant').value = "Seven Sides";
          document.getElementById('billsplit-discount-pct').value = 0;
          document.getElementById('billsplit-discount-cap').value = 0;
          
          const cardRadio = document.querySelector('input[name="billsplit-payment"][value="card"]');
          if (cardRadio) cardRadio.checked = true;
          
          saveState();
          renderBillSplitter();
        }
      }
    });
  }

  // User dropdown change listener (re-populate payer list)
  const userSelect = document.getElementById('billsplit-user-member');
  if (userSelect) {
    userSelect.addEventListener('change', () => {
      const payerSelect = document.getElementById('billsplit-payer-select');
      if (payerSelect) {
        const selectedUser = userSelect.value;
        const members = state.billSplitter.members || [];
        const otherMembers = members.filter(m => m !== selectedUser);
        payerSelect.innerHTML = otherMembers.map(m => `<option value="${m}">${m}</option>`).join('');
      }
    });
  }

  // Payer Type Toggle Listener
  document.querySelectorAll('input[name="billsplit-payer-type"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const mePaidSection = document.getElementById('billsplit-me-paid-section');
      const otherPaidSection = document.getElementById('billsplit-other-paid-section');
      if (mePaidSection && otherPaidSection) {
        if (e.target.value === 'me') {
          mePaidSection.style.display = 'block';
          otherPaidSection.style.display = 'none';
        } else {
          mePaidSection.style.display = 'none';
          otherPaidSection.style.display = 'block';
        }
      }
    });
  });

  // Post Button Event Listener
  const postBtn = document.getElementById('billsplit-post-btn');
  if (postBtn) {
    postBtn.addEventListener('click', async () => {
      const members = state.billSplitter.members || [];
      const items = state.billSplitter.items || [];
      if (members.length === 0 || items.length === 0) return;

      const restaurantName = (state.billSplitter.restaurant || "Seven Sides").trim();
      const userSelect = document.getElementById('billsplit-user-member');
      const userMember = userSelect ? userSelect.value : "";
      
      const payerRadio = document.querySelector('input[name="billsplit-payer-type"]:checked');
      const payerType = payerRadio ? payerRadio.value : "me";
      
      const discountPct = (Number(state.billSplitter.discountPct) || 0) / 100;
      const discountCap = Number(state.billSplitter.discountCap) || 0;
      const paymentMethod = state.billSplitter.paymentMethod || "card";
      const taxRate = (paymentMethod === 'cash') ? 0.16 : 0.05;

      // Recalculate original food cost for each person
      const memberOriginalCost = {};
      members.forEach(m => memberOriginalCost[m] = 0);
      
      let totalFoodCost = 0;
      items.forEach(item => {
        const price = Number(item.price) || 0;
        const shareCount = (item.shares || []).length;
        if (shareCount > 0) {
          totalFoodCost += price;
          const sharePrice = price / shareCount;
          item.shares.forEach(m => {
            if (memberOriginalCost[m] !== undefined) {
              memberOriginalCost[m] += sharePrice;
            }
          });
        }
      });

      const uncappedDiscount = totalFoodCost * discountPct;
      const actualTotalDiscount = (discountCap > 0) ? Math.min(uncappedDiscount, discountCap) : uncappedDiscount;

      // Compute individual totals
      const memberFinalTotals = {};
      members.forEach(m => {
        const originalAmt = memberOriginalCost[m] || 0;
        const share = totalFoodCost > 0 ? originalAmt / totalFoodCost : 0;
        const personDiscount = share * actualTotalDiscount;
        const personTax = originalAmt * taxRate;
        memberFinalTotals[m] = originalAmt - personDiscount + personTax;
      });

      let grandTotalSum = 0;
      members.forEach(m => grandTotalSum += (memberFinalTotals[m] || 0));

      let confirmTitle = "Confirm & Post Split";
      let confirmMsg = "";
      let payeeName = "";

      if (payerType === 'me') {
        payeeName = userMember;
        const accountSelect = document.getElementById('billsplit-pay-account');
        const payAccount = accountSelect ? accountSelect.value : "";
        const account = state.bankAccounts.find(a => a.id === payAccount);
        const accountName = account ? account.name : "your account";
        
        confirmMsg = `You are confirming that you (${userMember}) paid the entire bill at ${restaurantName}.\n\n` +
          `This will:\n` +
          `1. Deduct Rs. ${Math.round(grandTotalSum).toLocaleString()} from your bank account (${accountName}).\n` +
          `2. Record that other members owe you their shares (totaling Rs. ${Math.round(grandTotalSum - (memberFinalTotals[userMember] || 0)).toLocaleString()}).\n\n` +
          `Do you want to proceed?`;
      } else {
        const payerSelect = document.getElementById('billsplit-payer-select');
        payeeName = payerSelect ? payerSelect.value : "";
        
        confirmMsg = `You are confirming that ${payeeName} paid the entire bill at ${restaurantName}.\n\n` +
          `This will:\n` +
          `1. Create a debt of Rs. ${Math.round(memberFinalTotals[userMember] || 0).toLocaleString()} (your share) owed to ${payeeName}.\n` +
          `2. No money will be deducted from your bank accounts at this time.\n\n` +
          `Do you want to proceed?`;
      }

      const confirmed = await showCustomConfirm(confirmTitle, confirmMsg, false);

      if (confirmed) {
        const todayStr = new Date().toISOString().split('T')[0];

        if (payerType === 'me') {
          // I paid: Deduct entire bill from selected bank account
          const accountSelect = document.getElementById('billsplit-pay-account');
          const payAccount = accountSelect ? accountSelect.value : "";
          
          // 1. Record transaction: entire restaurant payment
          addTransaction({
            type: 'expense',
            description: `Paid entire bill at ${restaurantName} (including friends' shares)`,
            amount: Math.round(grandTotalSum),
            date: todayStr,
            account: payAccount,
            category: 'Order Out'
          });

          // 2. Record credits: other members owe me
          members.forEach(m => {
            if (m !== userMember) {
              const amountOwed = Math.round(memberFinalTotals[m] || 0);
              if (amountOwed > 0) {
                if (!state.debts) state.debts = [];
                state.debts.push({
                  id: 'debt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                  type: 'credit', // Credit means others owe me
                  person: m,
                  description: `Dinner share at ${restaurantName}`,
                  amount: amountOwed,
                  remaining: amountOwed,
                  dueDate: null,
                  adjustMode: 'none',
                  account: null,
                  createdDate: todayStr
                });
              }
            }
          });
          
          saveState();
          updateUI();
          showNotification("Split Settled", "Entire bill deducted. Outstanding credits created for friends!", "saving", "check-circle");
        } else {
          // Someone else paid: Record a debt for my share
          const userShare = Math.round(memberFinalTotals[userMember] || 0);

          if (payeeName && userShare > 0) {
            if (!state.debts) state.debts = [];
            state.debts.push({
              id: 'debt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
              type: 'debt', // Debt means I owe them
              person: payeeName,
              description: `Dinner share at ${restaurantName}`,
              amount: userShare,
              remaining: userShare,
              dueDate: null,
              adjustMode: 'none',
              account: null,
              createdDate: todayStr
            });
            
            saveState();
            updateUI();
            showNotification("Split Settled", `Recorded debt of Rs. ${userShare.toLocaleString()} owed to ${payeeName}!`, "saving", "check-circle");
          }
        }

        // Show Post-Split Summary Popup
        let summaryTitle = "Bill Split Summary";
        let summaryMsg = `
          <div style="font-family: inherit; font-size: 13.5px; color: var(--text-main); text-align: left;">
            <p style="margin-top: 0; margin-bottom: 12px; font-weight: 600; color: var(--text-main);">
              Split has been successfully posted to your ledger!
            </p>
            <div style="background: rgba(228, 0, 43, 0.05); border: 1px solid rgba(228, 0, 43, 0.15); padding: 12px; border-radius: 8px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span style="color: var(--text-muted);">Payee (Who Paid):</span>
                <strong style="color: var(--primary);">${payeeName}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span style="color: var(--text-muted);">Total Bill:</span>
                <strong>Rs. ${Math.round(grandTotalSum).toLocaleString()}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">Your Share:</span>
                <strong>Rs. ${Math.round(memberFinalTotals[userMember] || 0).toLocaleString()}</strong>
              </div>
            </div>
            
            <div style="font-weight: 700; margin-bottom: 8px; font-size: 13px; color: var(--text-main);">Who Owes the Payee (${payeeName}):</div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
        `;
        
        members.forEach(m => {
          if (m !== payeeName) {
            const shareVal = Math.round(memberFinalTotals[m] || 0);
            if (shareVal > 0) {
              summaryMsg += `
                <div style="display: flex; justify-content: space-between; padding: 8px 10px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 6px; align-items: center;">
                  <span>${m} ${m === userMember ? '<strong style="color: var(--primary); font-size: 11px; padding: 2px 6px; background: rgba(228,0,43,0.08); border-radius: 4px; margin-left: 4px;">You</strong>' : ''}</span>
                  <span style="font-weight: 700; color: var(--danger);">Rs. ${shareVal.toLocaleString()}</span>
                </div>
              `;
            }
          }
        });
        
        summaryMsg += `
            </div>
          </div>
        `;

        await showCustomAlert(summaryTitle, summaryMsg, false);
      }
    });
  }
}

// App Start
window.addEventListener('DOMContentLoaded', () => {
  loadState();
  
  // Profile dropdown bindings
  populateProfileDropdown();
  const profileSelect = document.getElementById('profile-select');
  if (profileSelect) {
    profileSelect.addEventListener('change', (e) => {
      switchProfile(e.target.value);
    });
  }
  const addProfileBtn = document.getElementById('add-profile-btn');
  if (addProfileBtn) {
    addProfileBtn.addEventListener('click', openProfileModal);
  }

  updateTodayDateDisplay();
  initConfirmModalEvents();
  updateUI();
  initSetupPage();
  
  const toggleBtn = document.getElementById('toggle-top-balances');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleTopBalancesVisibility);
  }
  
  // Mobile Top Balances Eye Toggle
  const mobileEyeBtn = document.getElementById('mobile-eye-btn');
  if (mobileEyeBtn) {
    mobileEyeBtn.addEventListener('click', toggleTopBalancesVisibility);
  }

  updateTopBalancesDisplay();
  
  lucide.createIcons();

  // Mobile menu toggle listeners
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.querySelector('.sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  
  if (mobileMenuBtn && sidebar && sidebarOverlay) {
    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
      sidebarOverlay.classList.add('active');
    });
    
    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
    });
  }

  // Register PWA Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registered successfully:', reg.scope))
      .catch(err => console.error('Service Worker registration failed:', err));
  }

  // Tools subtab navigation event listener
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.tools-subnav-btn');
    if (btn) {
      const subtabId = btn.getAttribute('data-subtab');
      switchSubtab(subtabId);
    }
  });

  // Start wishlist timers
  updateWishTimers();

  // Initialize Bill Splitter
  initBillSplitter();

  // Smart nudge trigger (after 2 seconds)
  setTimeout(() => {
    showSmartNudges();
  }, 2000);
});

// ─── DOM ELEMENT REFERENCES ───
const signupToggle = document.getElementById("signup-toggle");
const loginToggle = document.getElementById("login-toggle");

const loginButton = document.getElementById("login-submit-btn");
const signupButton = document.getElementById("signup-submit-btn");

const loginFormContainer = document.getElementById("login-form-container");
const signupFormContainer = document.getElementById("signup-form-container");
const appMain = document.getElementById("app-main");
const authWrapper = document.getElementById("auth-wrapper");
const siteLogo = document.getElementById("site-logo");
const sidebarNav = document.getElementById("sidebar-navigation");
const widgetContainer = document.getElementById("widget-container");
const nameEl = document.getElementById("name");
const schoolNameEl = document.getElementById("school-name");

// ─── DATA CONFIGURATIONS ───
const WIDGETS = [
  { type: "label", text: "Main Categories" }, 
  { id: "assignmentsWidget", label: "Assignments", size: "normal" },
  { id: "examsWidget", label: "Exams", size: "normal" },
  { id: "coursesWidget", label: "Courses", size: "normal" },
  { id: "mailboxWidget", label: "Mailbox", size: "normal" }, 
  { id: "notificationsWidget", label: "Notifications", size: "normal" }, 
  { id: "ebooksWidget", label: "Ebooks", size: "small" },

  { type: "label", text: "Other" },
  { 
    id: "videoWidget", 
    label: "Videos", 
    size: "normal",
    iconString: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8" fill="rgba(255, 255, 255, 0.1)"></polygon></svg>`
  },
  { 
    id: "reportCardsWidget", 
    label: "Report Cards", 
    size: "normal",
    iconString: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="12" y2="17"></line></svg>`
  },
];

const CURRENT_USER = {
  name: "Ahmed Eslam Fawzy Abdel Ghani Hassan",
  school: "MASE Middle School",
};

// ─── RENDER PLATFORM INFORMATION ───
function renderWidgets() {
  if (!widgetContainer) return;
  widgetContainer.innerHTML = ""; 
  const fragment = document.createDocumentFragment();

  WIDGETS.forEach((item) => {
    if (item.type === "label") {
      const heading = document.createElement("h3");
      heading.className = "main-categories-label"; 
      heading.textContent = item.text;
      fragment.appendChild(heading);
      return; 
    }

    const el = document.createElement("div");
    el.className = "widget";
    el.id = item.id;
    el.dataset.size = item.size;

    const iconWrapper = document.createElement("div");
    iconWrapper.className = "widget-icon-container";

    if (item.iconString) {
      iconWrapper.innerHTML = item.iconString;
      const svgNode = iconWrapper.querySelector("svg");
      if (svgNode) svgNode.classList.add("widget-icon");
    } else {
      const sourceIcon = document.getElementById(`${item.id}-icon`);
      if (sourceIcon) {
        const clonedIcon = sourceIcon.cloneNode(true);
        clonedIcon.removeAttribute("id"); 
        clonedIcon.classList.add("widget-icon");
        iconWrapper.appendChild(clonedIcon);
      } else {
        iconWrapper.innerHTML = `<svg viewBox="0 0 24 24" class="widget-icon" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z"/></svg>`;
      }
    }

    if (item.size === "small") {
      const heading = document.createElement("h4");
      heading.textContent = item.label;
      el.appendChild(iconWrapper);
      el.appendChild(heading);
    } else {
      const titleText = document.createElement("span");
      titleText.className = "widget-title-text";
      titleText.textContent = item.label;
      
      el.appendChild(iconWrapper);
      el.appendChild(titleText);
    }

    fragment.appendChild(el);
  });

  widgetContainer.appendChild(fragment);
}

function renderUserInfo() {
  if (nameEl) nameEl.textContent = CURRENT_USER.name;
  if (schoolNameEl) schoolNameEl.textContent = CURRENT_USER.school;
}

// ─── RUNTIME WORKSPACE HANDLERS ───
function handleLoginAction() {
  // LOCALSTORAGE UPDATE: Save authentication token to browser memory
  localStorage.setItem("classiq_logged_in", "true");
  loadDashboard();
}

function loadDashboard() {
  if (authWrapper) authWrapper.style.display = "none";
  if (appMain) appMain.style.display = "block";

  document.body.classList.add("logged-in");
  
  if (siteLogo && sidebarNav) {
    sidebarNav.insertBefore(siteLogo, sidebarNav.firstChild);
  }
  
  renderUserInfo();
  renderWidgets();
  
  // LOCALSTORAGE UPDATE: Reapply saved sidebar state once dashboard loads
  applySavedSidebarState();
}

function showSignup() {
  if (loginFormContainer) loginFormContainer.style.display = "none";
  if (signupFormContainer) signupFormContainer.style.display = "block";
}

function showLogin() {
  if (signupFormContainer) signupFormContainer.style.display = "none";
  if (loginFormContainer) loginFormContainer.style.display = "block";
}

function setupNavigationClickHandlers() {
  const navItems = document.querySelectorAll("#sidebar nav .nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      navItems.forEach(el => el.classList.remove("active"));
      item.classList.add("active");
    });
  });
}

function applySavedSidebarState() {
  const dashboardContainer = document.getElementById("dashboard");
  // LOCALSTORAGE UPDATE: Read saved user toggle preference
  const isCollapsed = localStorage.getItem("classiq_sidebar_collapsed") === "true";
  
  if (dashboardContainer && isCollapsed) {
    dashboardContainer.classList.add("collapsed");
    // Match the custom dynamic branding resize mechanics we built earlier
    if (siteLogo) {
      siteLogo.style.width = "44px";
      siteLogo.style.height = "44px";
      siteLogo.style.marginBottom = "16px";
    }
  }
}

function setupSidebarToggle() {
  const toggleBtn = document.getElementById("sidebar-toggle-btn");
  const dashboardContainer = document.getElementById("dashboard");

  if (toggleBtn && dashboardContainer) {
    toggleBtn.addEventListener("click", () => {
      dashboardContainer.classList.toggle("collapsed");
      
      const isCollapsed = dashboardContainer.classList.contains("collapsed");
      
      // LOCALSTORAGE UPDATE: Commit structural state change variable to device memory
      localStorage.setItem("classiq_sidebar_collapsed", isCollapsed ? "true" : "false");

      if (siteLogo) {
        if (isCollapsed) {
          siteLogo.style.width = "44px";
          siteLogo.style.height = "44px";
          siteLogo.style.marginBottom = "16px";
        } else {
          siteLogo.style.width = "54px";
          siteLogo.style.height = "54px";
          siteLogo.style.marginBottom = "20px";
        }
      }
    });
  }
}

// Optional Logout Trigger Helper
function handleLogout() {
  localStorage.removeItem("classiq_logged_in");
  window.location.reload();
}

// ─── CORE ORCHESTRATOR INITIALIZATION ───
function init() {
  setupSidebarToggle();
  setupNavigationClickHandlers();

  // Route button actions to use authentication storage wrapper handlers
  if (loginButton) loginButton.addEventListener("click", handleLoginAction);
  if (signupButton) signupButton.addEventListener("click", handleLoginAction);
  
  if (signupToggle) signupToggle.addEventListener("click", showSignup);
  if (loginToggle) loginToggle.addEventListener("click", showLogin);

  // LOCALSTORAGE UPDATE: Check if user has an active login session running
  const isLoggedIn = localStorage.getItem("classiq_logged_in") === "true";
  if (isLoggedIn) {
    loadDashboard();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

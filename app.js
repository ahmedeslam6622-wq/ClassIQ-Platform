javascript
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
const logoutBtn = document.getElementById("logout-btn");

// ─── DATA CONFIGURATIONS ───
const STUDENT_WIDGETS = [
  { type: "label", text: "Main Categories" }, 
  { id: "assignmentsWidget", label: "Assignments", size: "normal" },
  { id: "examsWidget", label: "Exams", size: "normal" },
  { id: "coursesWidget", label: "Courses", size: "normal" },
  { id: "mailboxWidget", label: "Mailbox", size: "normal" }, 
  { id: "notificationsWidget", label: "Notifications", size: "normal" }, 
  { id: "ebooksWidget", label: "Ebooks", size: "small" },
  { type: "label", text: "Other" },
  { id: "videoWidget", label: "Videos", size: "normal", iconString: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8" fill="rgba(255, 255, 255, 0.1)"></polygon></svg>` },
  { id: "reportCardsWidget", label: "Report Cards", size: "normal", iconString: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="12" y2="17"></line></svg>` }
];

const TEACHER_WIDGETS = [
  { type: "label", text: "Academic Control Desk" },
  { id: "gradingWidget", label: "Grade Submissions", size: "normal", iconString: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>` },
  { id: "attendanceWidget", label: "Attendance Roll", size: "normal", iconString: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>` },
  { id: "coursesWidget", label: "Manage Courses", size: "normal" },
  { id: "mailboxWidget", label: "Teacher Mailbox", size: "normal" }, 
  { type: "label", text: "Global Analytics" },
  { id: "reportsWidget", label: "Class Performance Reports", size: "small", iconString: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>` }
];

// ─── RENDER PLATFORM INFORMATION ───
function renderWidgets() {
  if (!widgetContainer) return;
  widgetContainer.innerHTML = ""; 
  const fragment = document.createDocumentFragment();

  const currentRole = localStorage.getItem("classiq_user_role") || "student";
  const targetWidgetsList = (currentRole === "teacher") ? TEACHER_WIDGETS : STUDENT_WIDGETS;

  targetWidgetsList.forEach((item) => {
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
  const name = localStorage.getItem("classiq_user_name") || "Ahmed Eslam Fawzy";
  const role = localStorage.getItem("classiq_user_role") || "student";
  
  if (nameEl) nameEl.textContent = name;
  if (schoolNameEl) schoolNameEl.textContent = `MASE Middle School (${role.toUpperCase()} PORTAL)`;
}

// ─── RUNTIME WORKSPACE HANDLERS ───
function handleSignupSubmit() {
  const roleSelect = document.getElementById("signup-role");
  const nameInput = document.getElementById("signup-name");

  if (!roleSelect.value || !nameInput.value) return;

  localStorage.setItem("classiq_logged_in", "true");
  localStorage.setItem("classiq_user_name", nameInput.value);
  localStorage.setItem("classiq_user_role", roleSelect.value);

  loadDashboard();
}

function handleLoginSubmit() {
  localStorage.setItem("classiq_logged_in", "true");
  if (!localStorage.getItem("classiq_user_name")) {
    localStorage.setItem("classiq_user_name", "Ahmed Eslam Fawzy");
    localStorage.setItem("classiq_user_role", "student");
  }
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
  applySavedSidebarState();
}

function handleLogout() {
  localStorage.removeItem("classiq_logged_in");
  localStorage.removeItem("classiq_user_name");
  localStorage.removeItem("classiq_user_role");
  window.location.reload();
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
  const isCollapsed = localStorage.getItem("classiq_sidebar_collapsed") === "true";
  
  if (dashboardContainer && isCollapsed) {
    dashboardContainer.classList.add("collapsed");
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

// ─── CORE ORCHESTRATOR INITIALIZATION ───
function init() {
  setupSidebarToggle();
  setupNavigationClickHandlers();

  const loginSubmitBtn = document.getElementById("login-submit-btn");
  const signupSubmitBtn = document.getElementById("signup-submit-btn");

  if (loginSubmitBtn) loginSubmitBtn.addEventListener("click", handleLoginSubmit);
  if (signupSubmitBtn) signupSubmitBtn.addEventListener("click", handleSignupSubmit);
  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
  
  if (signupToggle) signupToggle.addEventListener("click", showSignup);
  if (loginToggle) loginToggle.addEventListener("click", showLogin);

  const isLoggedIn = localStorage.getItem("classiq_logged_in") === "true";
  if (isLoggedIn) {loadDashboard();}}if (document.readyState === "loading") {document.addEventListener("DOMContentLoaded", init);} else {init();}
  

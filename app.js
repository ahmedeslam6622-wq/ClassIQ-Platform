const signupToggle = document.getElementById("signup-toggle");
const loginToggle = document.getElementById("login-toggle");

const loginButton = document.getElementById("login-submit-btn");
const signupButton = document.getElementById("signup-submit-btn");

const loginFormContainer = document.getElementById("login-form-container");
const signupFormContainer = document.getElementById("signup-form-container");
const loginSignupContainer = document.getElementById("login-signup-container")
const appMain = document.getElementById("app-main");
const authWrapper = document.getElementById("auth-wrapper");
const siteLogo = document.getElementById("site-logo");
const sidebarNav = document.getElementById("sidebar-navigation");
const widgetContainer = document.getElementById("widget-container");
const nameEl = document.getElementById("name");
const schoolNameEl = document.getElementById("school-name");
const logoutBtn = document.getElementById("logout-btn");
const closeButton = document.getElementById("close-button");
const fullSectionOverlay = document.querySelector(".full-section");
var info_value = 0;

loginSignupContainer.classList.add("active");


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
  { id: "reportCardsWidget", label: "Report Cards", size: "normal", iconString: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="12" y2="17"></line></svg>` },
  { id: "settingsWidget", label: "Settings", size: "normal" }
]
//gen load screen
const TEACHER_WIDGETS = [
  { type: "label", text: "Academic Control Desk" },
  { id: "gradingWidget", label: "Grade Submissions", size: "normal", iconString: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>` },
  { id: "attendanceWidget", label: "Attendance Roll", size: "normal", iconString: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>` },
  { id: "coursesWidget", label: "Manage Courses", size: "normal" },
  { id: "mailboxWidget", label: "Teacher Mailbox", size: "normal" }, 
  { type: "label", text: "Global Analytics" },
  { id: "reportsWidget", label: "Class Performance Reports", size: "small", iconString: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>` }
];
// currentRole / targetWidgetsList are no longer computed once at script load —
// real auth resolves asynchronously, so they're set inside renderWidgets(),
// called only after auth.js confirms a session and profile exist. See init()
// near the bottom of this file.
let currentRole = null;
let targetWidgetsList = [];

function generateTeacherSetup () { 
    // 1. Prevent duplicate rendering by purging any old setup view first
    document.getElementById("setup-wrapper")?.remove();

    // 2. The wrapper owns layout (same centered column as the login screen);
    //    the title and the card are just its children, so nothing is positioned by magic numbers.
    const wrapper = document.createElement("main");
    wrapper.id = "setup-wrapper";

    const appTitle = document.createElement("header");
    appTitle.id = "app-title";
    appTitle.textContent = "ClassIQ";

    // 3. The standalone Setup Card
    const container = document.createElement("div");
    container.id = "setup-container";
    
    const branding = document.createElement("h1"); 
    branding.id = "branding"; 
    branding.textContent = "Lets Get You Set Up!"; 
    branding.classList.add("active");
    
    const subtext = document.createElement("h2"); 
    subtext.id = "subtext"; 
    subtext.textContent = "Set up your classroom accounts to get started.";

    // Inline "Add Student" form — hidden until the Add button is clicked,
    // so the wizard's default view still matches the original design.
    const addStudentForm = document.createElement("div");
    addStudentForm.id = "add-student-form";
    addStudentForm.hidden = true;
    addStudentForm.innerHTML = `
      <div class="input-group">
        <input type="text" id="new-student-name" placeholder="Full Name" required>
        <input type="text" id="new-student-username" placeholder="Username" required>
        <input type="password" id="new-student-password" placeholder="Password (min. 8 characters)" required>
        <p id="add-student-error" class="auth-error" hidden></p>
        <p id="add-student-success" class="auth-success" hidden></p>
      </div>
    `;

    const addStudentAccountsConfirm = document.createElement("button"); 
    addStudentAccountsConfirm.id = "confirm"; 
    addStudentAccountsConfirm.textContent = "Done";
    
    const skip = document.createElement("button"); 
    skip.id = "skip"; 
    skip.textContent = "Skip for Now";
    
    const add = document.createElement("button"); 
    add.id = "add";
    add.textContent = "Add Student";

    // Build ONLY the wizard layout inside the container card
    container.appendChild(branding); 
    container.appendChild(subtext);
    container.appendChild(addStudentForm);
    container.appendChild(add);
    container.appendChild(addStudentAccountsConfirm); 
    container.appendChild(skip); 

    wrapper.append(appTitle, container);
    document.body.appendChild(wrapper);
    window.scrollTo(0, 0); // a full-page view swap must not inherit the previous view's scroll offset
    document.body.classList.add("is-animating");

    // Reveals the inline form; re-clicking submits it, so the button's own
    // label communicates which state it's in.
    add.addEventListener("click", async () => {
      if (addStudentForm.hidden) {
        addStudentForm.hidden = false;
        add.textContent = "Create Student Account";
        return;
      }

      const nameInput = document.getElementById("new-student-name");
      const usernameInput = document.getElementById("new-student-username");
      const passwordInput = document.getElementById("new-student-password");
      const errorEl = document.getElementById("add-student-error");
      const successEl = document.getElementById("add-student-success");

      errorEl.hidden = true;
      successEl.hidden = true;

      const full_name = nameInput.value.trim();
      const username = usernameInput.value.trim();
      const password = passwordInput.value;

      if (!full_name || !username || !password) {
        errorEl.textContent = "All fields are required.";
        errorEl.hidden = false;
        return;
      }

      add.disabled = true;
      add.textContent = "Creating…";

      const { error } = await window.ClassIQAuth.createStudent({ username, full_name, password });

      add.disabled = false;

      if (error) {
        errorEl.textContent = error;
        errorEl.hidden = false;
        add.textContent = "Create Student Account";
        return;
      }

      successEl.textContent = `${full_name} (@${username}) created successfully.`;
      successEl.hidden = false;
      nameInput.value = "";
      usernameInput.value = "";
      passwordInput.value = "";
      add.textContent = "Add Student";
      addStudentForm.hidden = true;
    });

    // 4. Bulletproof Teardown Event
    const closeWizard = () => {
        // Destroy the whole setup view (title + card) in one go
        wrapper.remove();

        // Clean up animation flags on the body
        document.body.classList.remove("is-animating");
        
        // Safely pivot execution over to your dashboard engine
        loadDashboard();
    };

    skip.addEventListener("click", closeWizard);
    addStudentAccountsConfirm.addEventListener("click", closeWizard);

    return container;
}


signupButton.addEventListener("click", async function(event) {
    // 1. Prevent the page from reloading if inside a form
    event.preventDefault(); 

    // 2. Check if the setup view already exists to prevent duplicate rendering
    if (document.getElementById("setup-container")) {
        return; 
    }

    const nameInput = document.getElementById("signup-name");
    const usernameInput = document.getElementById("signup-username");
    const passwordInput = document.getElementById("signup-password");
    const errorEl = document.getElementById("signup-error");

    errorEl.hidden = true;

    const full_name = nameInput.value.trim();
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!full_name || !username || !password) {
        errorEl.textContent = "All fields are required.";
        errorEl.hidden = false;
        return;
    }

    signupButton.disabled = true;
    signupButton.textContent = "Signing up…";

    // Account has to exist BEFORE the wizard opens — "Add Student" calls the
    // create-student Edge Function, which requires a real teacher session.
    const { error } = await window.ClassIQAuth.signupTeacher({ username, full_name, password });

    signupButton.disabled = false;
    signupButton.textContent = "Sign Up";

    if (error) {
        errorEl.textContent = error;
        errorEl.hidden = false;
        return;
    }

    // 3. Clear out the old auth form wrapper if you are transitioning screens
    const authWrapper = document.getElementById("auth-wrapper");
    if (authWrapper) {
        authWrapper.remove(); 
    }

    // 4. Optionally toggle body classes to trigger your CSS transitions
    document.body.classList.remove("logged-in"); // or add custom setup state classes

    // 5. Build and render the view
    generateTeacherSetup();
});



// ─── REWRITTEN RENDER ENGINE (WITH STABLE CARD HOOKS & IN-MODAL SEAMS) ───
function renderWidgets() {
  if (!widgetContainer) return;

  const profile = window.ClassIQAuth.getProfile();
  currentRole = profile?.role || "student";
  targetWidgetsList = (currentRole === "teacher") ? TEACHER_WIDGETS : STUDENT_WIDGETS;

  widgetContainer.innerHTML = ""; 
  const fragment = document.createDocumentFragment();
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

    el.addEventListener("click", () => {
      if (item.id === "settingsWidget") {
        openSettingsSection();
      } else {
        openGenericSection(item.label);
      }
    });

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
        console.warn(`No icon source found for widget "${item.id}" (expected #${item.id}-icon in the DOM). Falling back to generic.`);
        iconWrapper.innerHTML = `<svg viewBox="0 0 24 24" class="widget-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z"/></svg>`;
      }
    }

    el.appendChild(iconWrapper);

    if (item.size === "small") {
      const heading = document.createElement("h4");
      heading.textContent = item.label;
      el.appendChild(heading);
      
      // Inject hover panel inside small size widgets too so that they open correctly
      const hoverModal = document.createElement("div");
      hoverModal.className = "modal-hover-content";
      
    hoverModal.innerHTML = `
  <h4 class="modal-hover-title" style="margin: 0 0 8px 0;">${item.label} Panel</h4>
  <p class="modal-hover-desc" style="margin: 0; color: rgba(255,255,255,0.6); font-size: 14px;">Nothing Assigned Yet!</p>
  <button class="hover-show-all-btn" style="
    position: absolute;
    bottom: 20px;              /* Snaps it exactly 20px from the bottom border */
    left: 20px;                /* Matches the 20px parent container padding */
    width: calc(100% - 40px);  /* Spans the full width beautifully */
    
    height: 36px;              /* Fixed, explicit height */
    padding: 0;                /* Remove vertical padding completely so it can't crush the box */
    
    display: flex;
    justify-content: center;
    align-items: center;
    
    background: var(--accent);
    color: #ffffff;
    border: none;
    font-weight: 600;
    font-size: 15px;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: var(--transition-standard);
  ">Show All</button>
`;




      const innerButton = hoverModal.querySelector(".hover-show-all-btn");
      if (innerButton) {
        innerButton.addEventListener("click", (event) => {
          event.stopPropagation(); 
          openGenericSection(item.label);
        });
      }
      el.appendChild(hoverModal);

    } else {
      const titleText = document.createElement("span");
      titleText.className = "widget-title-text";
      titleText.textContent = item.label;
      el.appendChild(titleText);

      const hoverModal = document.createElement("div");
      hoverModal.className = "modal-hover-content";
      
      hoverModal.innerHTML = `
  <h4 class="modal-hover-title" style="margin: 0 0 8px 0;">${item.label} Panel</h4>
  <p class="modal-hover-desc" style="margin: 0; color: rgba(255,255,255,0.6); font-size: 14px;">Nothing Assigned Yet!</p>
  <button class="hover-show-all-btn" style="
    position: absolute;
    bottom: 20px;              /* Snaps it exactly 20px from the bottom border */
    left: 20px;                /* Matches the 20px parent container padding */
    width: calc(100% - 40px);  /* Spans the full width beautifully */
    
    height: 36px;              /* Fixed, explicit height */
    padding: 0;                /* Remove vertical padding completely so it can't crush the box */
    
    display: flex;
    justify-content: center;
    align-items: center;
    
    background: var(--accent);
    color: #ffffff;
    border: none;
    font-weight: 600;
    font-size: 15px;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: var(--transition-standard);
  ">Show All</button>
`;

      const innerButton = hoverModal.querySelector(".hover-show-all-btn");
      if (innerButton) {
        innerButton.addEventListener("click", (event) => {
          event.stopPropagation(); 
          if (item.id === "settingsWidget") {
            openSettingsSection();
          } else {
            openGenericSection(item.label);
          }
        });
      }

      el.appendChild(hoverModal);
    }

    fragment.appendChild(el);
  });

  widgetContainer.appendChild(fragment);

  const animTargets = widgetContainer.querySelectorAll('.widget, .main-categories-label');
  animTargets.forEach((target, index) => {
    setTimeout(() => {
      target.classList.add('animate-in');
    }, index * 50);
  });
}

function renderUserInfo() {
  const profile = window.ClassIQAuth.getProfile();
  const name = profile?.full_name || "";
  const role = profile?.role || "student";
  const school = profile?.school_name || "ClassIQ";

  if (nameEl) nameEl.textContent = name;
  if (schoolNameEl) schoolNameEl.textContent = `${school} (${role.toUpperCase()} PORTAL)`;
}

// ─── RUNTIME WORKSPACE HANDLERS ───
async function handleLoginSubmit(event) {
  event?.preventDefault();

  const usernameInput = document.getElementById("login-username");
  const passwordInput = document.getElementById("login-password");
  const errorEl = document.getElementById("login-error");

  errorEl.hidden = true;

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    errorEl.textContent = "Enter a username and password.";
    errorEl.hidden = false;
    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = "Logging in…";

  const { error } = await window.ClassIQAuth.loginWithUsername(username, password);

  loginButton.disabled = false;
  loginButton.textContent = "Login";

  if (error) {
    errorEl.textContent = error;
    errorEl.hidden = false;
    return;
  }

  // loadDashboard() is NOT called here directly — auth.js's onAuthChange
  // fires once the session actually resolves, and that's what triggers it
  // (see init() near the bottom of this file). Calling it here too would
  // risk it running before the profile fetch has finished.
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
  maybeShowEmailPrompt();
}

async function handleLogout() {
  await window.ClassIQAuth.logout();
  window.location.reload();
}

// ─── AUTH INTERACTION VIEW SHIFTS ───
// Visibility of each view is owned by the .active class (see style.css).
// JS only owns the container height, so the panel resizes smoothly
// instead of snapping between the login and signup form heights.
const authViewport = document.getElementById("auth-views");
const authViews = { login: loginFormContainer, signup: signupFormContainer };
const AUTH_HEIGHT_MS = 400;
const AUTH_HEIGHT_EASING = "cubic-bezier(0.16, 1, 0.3, 1)";
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function getActiveAuthView() {
  return Object.values(authViews).find((view) => view.classList.contains("active"));
}

// Keeps the viewport exactly as tall as the active view (no animation).
function syncAuthViewportHeight() {
  const active = getActiveAuthView();
  if (active) authViewport.style.height = active.offsetHeight + "px";
}

function switchAuthView(name) {
  const next = authViews[name];
  const current = getActiveAuthView();
  if (!next || next === current) return;

  // offsetHeight reflects the *currently rendered* height, so rapid
  // toggling mid-animation starts from where the panel visually is.
  const fromHeight = authViewport.offsetHeight;

  if (current) current.classList.remove("active");
  next.classList.add("active");

  const toHeight = next.offsetHeight; // laid out even while hidden (grid-stacked)
  authViewport.style.height = toHeight + "px";

  if (!prefersReducedMotion.matches && fromHeight !== toHeight) {
    authViewport.animate(
      [{ height: fromHeight + "px" }, { height: toHeight + "px" }],
      { duration: AUTH_HEIGHT_MS, easing: AUTH_HEIGHT_EASING }
    );
  }
}

function showSignup() { switchAuthView("signup"); }
function showLogin()  { switchAuthView("login"); }

// Content-driven height changes (font load, text wrapping on narrow screens,
// validation messages added later) are followed instantly, without animation.
if (authViewport && typeof ResizeObserver !== "undefined") {
  const authResizeObserver = new ResizeObserver(syncAuthViewportHeight);
  Object.values(authViews).forEach((view) => authResizeObserver.observe(view));
}


function setupNavigationClickHandlers() {
  const navItems = document.querySelectorAll("#sidebar nav .nav-item:not(#fullsection-nav-item)");

  // 1. Function to update the main view's title
  function editPlaceholder(item) {
    // Get the clean text of the clicked item (e.g., "Assignments")
    const categoryName = item.textContent.trim(); 
    
    // Find the title element inside your main modal/workspace window
    // CHANGE '.placeholder-title-class' to the actual class or ID of your "Placeholder" heading
    const mainTitle = document.querySelector(".placeholder-title-class") || document.querySelector("h2"); 
    
    if (mainTitle) {
      mainTitle.textContent = categoryName;
    }
  }

  // 2. Setup the click event listeners
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      // Clear active states
      document.querySelectorAll("#sidebar nav .nav-item").forEach(el => el.classList.remove("active"));
      document.querySelector(".full-section")?.classList.remove("active");
      
      // Add active state to clicked item
      item.classList.add("active");
      
      // Pass the clicked item to update the "Placeholder" text
      editPlaceholder(item);
      
      
      openGenericSection(item.textContent); 
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

      // Read state AFTER toggling, fresh, every click — not once at setup time
      const isNowCollapsed = dashboardContainer.classList.contains("collapsed");

      localStorage.setItem("classiq_sidebar_collapsed", isNowCollapsed ? "true" : "false");

      if (siteLogo) {
        if (isNowCollapsed) {
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
// ─── DYNAMIC SECTION COUPLING ENGINE ───
function openGenericSection(sectionTitle) { 
  if (!fullSectionOverlay) {
    fullSectionOverlay = document.querySelector(".full-section");
  }
  
  if (!fullSectionOverlay) {
    console.error("Critical: .full-section element was not found in the HTML DOM structure.");
    return; 
  }

  const sectionLabelEl = document.getElementById('section-label'); 
  if (sectionLabelEl && sectionTitle) { 
    sectionLabelEl.textContent = sectionTitle; 
  } 

  // 1. Added a dot (.) assuming subtext is a CSS class
const subText = fullSectionOverlay.querySelector("#subtext");

// 2. Changed from a function call () to an assignment =
subText.textContent = `No ${sectionTitle} Yet!`;

  // Force the layout engine to reveal the view
  fullSectionOverlay.classList.add('active'); 
  console.log(`Generic workspace opened for section: ${sectionTitle}`); 
}


function openSettingsSection() {
  openGenericSection("Settings");
}

function setupFullSectionNavHandlers() {
  const navItems = document.querySelectorAll(".full-section .fullsection-nav-item");
  if (!navItems.length) return;

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      navItems.forEach(el => el.classList.remove("active"));
      item.classList.add("active");
    });
  });
}

function setupModalCloseHandlers() {
  const fullSectionOverlay = document.querySelector(".full-section");
  if (!fullSectionOverlay) return;

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      fullSectionOverlay.classList.remove("active");

    }
  });
}

function manageTopBar() {
  const topBar = document.getElementById("top-bar");
  const mailbox = topBar.querySelector("#mailbox");
  const notifications = topBar.querySelector("#notifications");
    mailbox.addEventListener("click", () => {
       openGenericSection("Mail");
    })
    notifications.addEventListener("click", () => {
       openGenericSection("Notifications");
    }) 
}

// ─── POST-LOGIN RECOVERY EMAIL PROMPT ───
// Shown once per session at most, only when contact_email is still unset AND
// the user hasn't explicitly dismissed it before (email_prompt_dismissed).
// Both students and teachers can see it, since a teacher who signed up with
// a throwaway email is in the same spot — but teachers already gave a real
// email at signup, so in practice this mostly fires for students.
function maybeShowEmailPrompt() {
  const profile = window.ClassIQAuth.getProfile();
  if (!profile) return;
  if (profile.contact_email || profile.email_prompt_dismissed) return;

  const overlay = document.getElementById("email-prompt-overlay");
  if (!overlay) return;

  overlay.classList.add("active");

  const input = document.getElementById("email-prompt-input");
  const errorEl = document.getElementById("email-prompt-error");
  const saveBtn = document.getElementById("email-prompt-save");
  const skipBtn = document.getElementById("email-prompt-skip");

  errorEl.hidden = true;
  input.value = "";

  const closePrompt = () => overlay.classList.remove("active");

  const onSave = async () => {
    const email = input.value.trim();
    if (!email || !email.includes("@")) {
      errorEl.textContent = "Enter a valid email, or use Skip.";
      errorEl.hidden = false;
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving…";

    const { error } = await window.ClassIQAuth.saveContactEmail(email);

    saveBtn.disabled = false;
    saveBtn.textContent = "Save";

    if (error) {
      errorEl.textContent = error;
      errorEl.hidden = false;
      return;
    }

    closePrompt();
    saveBtn.removeEventListener("click", onSave);
    skipBtn.removeEventListener("click", onSkip);
  };

  const onSkip = async () => {
    await window.ClassIQAuth.dismissEmailPrompt();
    closePrompt();
    saveBtn.removeEventListener("click", onSave);
    skipBtn.removeEventListener("click", onSkip);
  };

  saveBtn.addEventListener("click", onSave);
  skipBtn.addEventListener("click", onSkip);
}


// ─── SAFE GLOBAL ORCHESTRATOR INITIALIZATION ───
async function init() {
  // Capture layout nodes securely after full DOM paint
  const globalOverlay = document.querySelector(".full-section");
  const closeBtnEl = document.getElementById("close-button");
  const loginSubmitBtn = document.getElementById("login-submit-btn");

  setupSidebarToggle();
  setupNavigationClickHandlers();
  setupFullSectionNavHandlers();
  manageTopBar();
  
  // 1. Clean Keydown Window Binding
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && globalOverlay) {
      globalOverlay.classList.remove("active");
    }
  });

  // 2. Clean Isolated Close Button Click Event
  if (closeBtnEl && globalOverlay) {
    closeBtnEl.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation(); // Prevents click from bubbling out to parent containers
      globalOverlay.classList.remove("active");
      const navItems = Array.from(document.querySelectorAll(".nav-item"));

  // 2. Check if the user's click landed inside ANY of those navigation items
  const clickedInsideANavItem = navItems.some(item => item.contains(event.target));

  // 3. If they clicked completely outside the navigation block, remove the active states
  if (!clickedInsideANavItem) {
    navItems.forEach(item => {
      item.classList.remove("active");
      item.blur(); // Strips native browser focus state if applicable
    });
  }
    });
  }

  if (loginSubmitBtn) loginSubmitBtn.addEventListener("click", handleLoginSubmit);
  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
 // Replace the signupToggle and loginToggle listeners inside init() with these clean paths:
if (signupToggle) {
  signupToggle.addEventListener("click", (event) => {
    event.preventDefault();
    showSignup();
  });
}

if (loginToggle) {
  loginToggle.addEventListener("click", (event) => {
    event.preventDefault();
    showLogin();
  });
}

  // auth.js owns session truth now — init() here waits for it to resolve
  // the existing session (if any) before deciding what to show, instead of
  // trusting a localStorage flag that could go stale relative to the real
  // session (e.g. a token that expired server-side).
  await window.ClassIQAuth.init();

  window.ClassIQAuth.onAuthChange(({ session }) => {
    if (session) {
      loadDashboard();
    } else {
      // Logged out (or never logged in): make sure the dashboard is hidden
      // and the auth screen is back, covering both the initial load and
      // an explicit logout without needing a full page reload for the UI swap.
      if (appMain) appMain.style.display = "none";
      if (authWrapper) authWrapper.style.display = "flex";
      document.body.classList.remove("logged-in");
      document.getElementById("email-prompt-overlay")?.classList.remove("active");
    }
  });
}

// Ensure execution hooks are synchronized safely
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

"use strict";

// ─── BACKEND CLIENT (Supabase) ───
// Keys live in config.js. The anon key is public by design; row level security
// (supabase/schema.sql) is what protects the data.
const CONFIG = window.CLASSIQ_CONFIG || {};

function createBackendClient() {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = CONFIG;
  const configured = SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes("YOUR-") && !SUPABASE_ANON_KEY.includes("YOUR-");
  if (!window.supabase || !configured) return null;
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
const db = createBackendClient();

// ─── DOM REFERENCES ───
const signupToggle = document.getElementById("signup-toggle");
const loginToggle = document.getElementById("login-toggle");

const loginButton = document.getElementById("login-submit-btn");
const signupButton = document.getElementById("signup-submit-btn");

const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const loginMessage = document.getElementById("login-message");
const signupMessage = document.getElementById("signup-message");
const loginUsernameInput = document.getElementById("login-username");
const loginPasswordInput = document.getElementById("login-password");

const loginFormContainer = document.getElementById("login-form-container");
const signupFormContainer = document.getElementById("signup-form-container");
const loginSignupContainer = document.getElementById("login-signup-container");
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
const sectionMain = fullSectionOverlay ? fullSectionOverlay.querySelector(".modal-main-content") : null;
const sectionList = document.getElementById("section-list");

loginSignupContainer.classList.add("active");

// ─── APPLICATION STATE ───
// The session itself is owned by Supabase (persisted and refreshed by the client).
// Only the loaded profile lives here.
const state = { profile: null };

const USERNAME_RE = /^[a-z0-9_.]{3,24}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

// ─── SMALL DOM / FORM HELPERS ───
// Everything user-controlled goes through textContent, never innerHTML.
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function field(type, placeholder, autocomplete) {
  const input = document.createElement("input");
  input.type = type;
  input.placeholder = placeholder;
  input.setAttribute("aria-label", placeholder);
  if (autocomplete) input.autocomplete = autocomplete;
  return input;
}

function labeledField(labelText, input) {
  const wrap = el("div", "field");
  const id = `field-${Math.random().toString(36).slice(2, 9)}`;
  input.id = id;
  const label = el("label", "", labelText);
  label.htmlFor = id;
  wrap.append(label, input);
  return wrap;
}

function setMessage(node, text, kind) {
  if (!node) return;
  node.textContent = text || "";
  node.classList.toggle("is-error", kind === "error");
  node.classList.toggle("is-success", kind === "success");
}

function setBusy(button, busy, busyText) {
  if (!button) return;
  if (busy) {
    button.dataset.label = button.textContent;
    button.textContent = busyText;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
  } else {
    if (button.dataset.label) button.textContent = button.dataset.label;
    button.disabled = false;
    button.removeAttribute("aria-busy");
  }
}

function studentEmail(username) {
  return `${username.trim().toLowerCase()}@${CONFIG.STUDENT_EMAIL_DOMAIN}`;
}

function formatDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function friendlyAuthError(error) {
  switch (error && error.code) {
    case "invalid_credentials":
      return "That username or password is incorrect.";
    case "email_not_confirmed":
      return "Confirm your email first. Check your inbox for the link.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many attempts. Wait a minute and try again.";
    case "user_already_exists":
    case "email_exists":
      return "An account with that email already exists. Try logging in.";
    case "weak_password":
      return `Choose a stronger password (at least ${MIN_PASSWORD} characters).`;
    default:
      return "Something went wrong. Check your connection and try again.";
  }
}

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
];

const TEACHER_WIDGETS = [
  { type: "label", text: "Academic Control Desk" },
  { id: "studentsWidget", label: "Students", size: "normal", iconString: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>` },
  { id: "gradingWidget", label: "Grade Submissions", size: "normal", iconString: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>` },
  { id: "attendanceWidget", label: "Attendance Roll", size: "normal", iconString: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>` },
  { id: "coursesWidget", label: "Manage Courses", size: "normal" },
  { id: "mailboxWidget", label: "Teacher Mailbox", size: "normal" },
  { type: "label", text: "Global Analytics" },
  { id: "reportsWidget", label: "Class Performance Reports", size: "small", iconString: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>` }
];

function getTargetWidgets() {
  return state.profile && state.profile.role === "student" ? STUDENT_WIDGETS : TEACHER_WIDGETS;
}

// ─── ACCOUNT CREATION (teacher → student) ───
// Runs in a Supabase Edge Function: creating another user needs the service-role key,
// which must never ship to the browser.
async function createStudent({ full_name, username, password }) {
  const { data, error } = await db.functions.invoke("create-student", {
    body: { full_name, username, password }
  });
  if (error) {
    let message = "Could not create the student. Try again.";
    try {
      const body = await error.context.json();
      if (body && body.error) message = body.error;
    } catch (_) { /* keep the generic message */ }
    throw new Error(message);
  }
  return data;
}

// One form, used by the setup wizard and by the Students section.
function buildStudentForm(onCreated) {
  const form = el("form", "student-form input-group");
  form.noValidate = true;

  const nameInput = field("text", "Student Full Name", "off");
  const usernameInput = field("text", "Student Username", "off");
  usernameInput.autocapitalize = "none";
  usernameInput.spellcheck = false;
  const passwordInput = field("text", "Temporary Password (8+ characters)", "off");
  const submit = el("button", "", "Create Student");
  submit.type = "submit";
  const message = el("p", "form-message");
  message.setAttribute("role", "alert");

  form.append(nameInput, usernameInput, passwordInput, submit, message);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const full_name = nameInput.value.trim();
    const username = usernameInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!full_name) return setMessage(message, "Enter the student's full name.", "error");
    if (!USERNAME_RE.test(username)) {
      return setMessage(message, "Username: 3–24 characters, lowercase letters, numbers, dot or underscore.", "error");
    }
    if (password.length < MIN_PASSWORD) {
      return setMessage(message, `Password must be at least ${MIN_PASSWORD} characters.`, "error");
    }

    setBusy(submit, true, "Creating…");
    setMessage(message, "");
    try {
      const student = await createStudent({ full_name, username, password });
      form.reset();
      setMessage(message, `Created ${student.full_name}. They log in as “${student.username}”.`, "success");
      nameInput.focus();
      if (onCreated) onCreated(student);
    } catch (err) {
      setMessage(message, err.message, "error");
    } finally {
      setBusy(submit, false);
    }
  });

  return form;
}

// ─── SETUP WIZARD ───
function generateTeacherSetup() {
  // Prevent duplicate rendering by purging any old setup view first
  document.getElementById("setup-wrapper")?.remove();

  // The wrapper owns layout (same centered column as the login screen);
  // the title and the card are just its children, so nothing is positioned by magic numbers.
  const wrapper = document.createElement("main");
  wrapper.id = "setup-wrapper";

  const appTitle = document.createElement("header");
  appTitle.id = "app-title";
  appTitle.textContent = "ClassIQ";

  const container = document.createElement("div");
  container.id = "setup-container";

  const branding = document.createElement("h1");
  branding.id = "branding";
  branding.textContent = "Lets Get You Set Up!";
  branding.classList.add("active");

  const subtext = document.createElement("h2");
  subtext.id = "setup-subtext"; // #subtext is already used by the section overlay; ids must be unique
  subtext.textContent = "Set up your classroom accounts to get started.";

  const add = document.createElement("button");
  add.id = "add";
  add.type = "button";
  add.textContent = "Add Student";
  add.setAttribute("aria-expanded", "false");

  const studentPanel = el("div", "setup-students");
  studentPanel.hidden = true;
  const createdList = el("ul", "student-list");
  createdList.setAttribute("aria-label", "Students created so far");
  studentPanel.append(
    buildStudentForm((student) => {
      const item = el("li", "student-chip");
      item.append(el("span", "student-chip-name", student.full_name), el("span", "student-chip-user", `@${student.username}`));
      createdList.append(item);
    }),
    createdList
  );

  const addStudentAccountsConfirm = document.createElement("button");
  addStudentAccountsConfirm.id = "confirm";
  addStudentAccountsConfirm.type = "button";
  addStudentAccountsConfirm.textContent = "Done";

  const skip = document.createElement("button");
  skip.id = "skip";
  skip.type = "button";
  skip.textContent = "Skip for Now";

  container.append(branding, subtext, add, studentPanel, addStudentAccountsConfirm, skip);
  wrapper.append(appTitle, container);
  document.body.appendChild(wrapper);
  window.scrollTo(0, 0); // a full-page view swap must not inherit the previous view's scroll offset
  document.body.classList.add("is-animating");

  add.addEventListener("click", () => {
    studentPanel.hidden = !studentPanel.hidden;
    add.setAttribute("aria-expanded", String(!studentPanel.hidden));
    if (!studentPanel.hidden) studentPanel.querySelector("input")?.focus();
  });

  // Done and Skip leave the same way: tear down the whole setup view, then hand over to the dashboard.
  function finishSetup() {
    wrapper.remove();
    document.body.classList.remove("is-animating");
    loadDashboard();
  }
  skip.addEventListener("click", finishSetup);
  addStudentAccountsConfirm.addEventListener("click", finishSetup);

  return container;
}

// ─── SECTION CONTENT (read from the database under row level security) ───
function sectionItem({ title, meta, body, unread }) {
  const item = el("article", "section-item" + (unread ? " is-unread" : ""));
  item.append(el("h4", "section-item-title", title));
  if (meta) item.append(el("p", "section-item-meta", meta));
  if (body) item.append(el("p", "section-item-body", body));
  return item;
}

async function loadAssignmentsSection() {
  const { data, error } = await db
    .from("assignments")
    .select("id,title,instructions,due_at,courses(title)")
    .order("due_at", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data.map((a) => sectionItem({
    title: a.title,
    meta: [a.courses && a.courses.title, a.due_at && `Due ${formatDateTime(a.due_at)}`].filter(Boolean).join(" • "),
    body: a.instructions
  }));
}

async function loadExamsSection() {
  const { data, error } = await db
    .from("exams")
    .select("id,title,starts_at,duration_minutes,courses(title)")
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return data.map((x) => sectionItem({
    title: x.title,
    meta: [x.courses && x.courses.title, formatDateTime(x.starts_at), x.duration_minutes && `${x.duration_minutes} min`].filter(Boolean).join(" • ")
  }));
}

async function loadCoursesSection() {
  const { data, error } = await db
    .from("courses")
    .select("id,title,description")
    .order("title", { ascending: true });
  if (error) throw error;
  return data.map((c) => sectionItem({ title: c.title, body: c.description }));
}

async function loadMailSection() {
  const { data, error } = await db
    .from("messages")
    .select("id,body,created_at,read_at,sender:profiles!messages_sender_id_fkey(full_name)")
    .eq("recipient_id", state.profile.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data.map((m) => sectionItem({
    title: (m.sender && m.sender.full_name) || "Unknown sender",
    meta: formatDateTime(m.created_at),
    body: m.body,
    unread: !m.read_at
  }));
}

async function loadNotificationsSection() {
  const { data, error } = await db
    .from("notifications")
    .select("id,title,body,created_at,read_at")
    .eq("user_id", state.profile.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data.map((n) => sectionItem({
    title: n.title,
    meta: formatDateTime(n.created_at),
    body: n.body,
    unread: !n.read_at
  }));
}

async function loadStudentsSection() {
  const { data, error } = await db
    .from("profiles")
    .select("id,full_name,username")
    .eq("created_by", state.profile.id)
    .order("full_name", { ascending: true });
  if (error) throw error;

  const toolbar = el("div", "section-toolbar");
  const addBtn = el("button", "section-action", "Add Student");
  addBtn.type = "button";
  addBtn.setAttribute("aria-expanded", "false");
  toolbar.append(addBtn);

  const panel = el("div", "section-panel");
  panel.hidden = true;

  const note = el("p", "section-note", "No students yet. Add your first student to get started.");
  note.hidden = data.length > 0;

  const list = el("div", "section-items");
  const row = (s) => sectionItem({ title: s.full_name, meta: `@${s.username}` });
  data.forEach((s) => list.append(row(s)));

  panel.append(buildStudentForm((student) => {
    list.prepend(row(student));
    note.hidden = true;
  }));

  addBtn.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    addBtn.setAttribute("aria-expanded", String(!panel.hidden));
    if (!panel.hidden) panel.querySelector("input")?.focus();
  });

  return [toolbar, panel, note, list];
}

async function loadSettingsSection() {
  const profile = state.profile;
  const form = el("form", "settings-form input-group");
  form.noValidate = true;

  const nameInput = field("text", "Full Name", "name");
  nameInput.value = profile.full_name;
  const usernameInput = field("text", "Username");
  usernameInput.value = profile.username;
  usernameInput.readOnly = true;

  form.append(
    labeledField("Full name", nameInput),
    labeledField("Username", usernameInput)
  );

  let schoolInput = null;
  if (profile.role === "teacher") {
    schoolInput = field("text", "School Name", "organization");
    schoolInput.value = profile.school_name || "";
    form.append(labeledField("School name", schoolInput));
  }

  const submit = el("button", "", "Save changes");
  submit.type = "submit";
  const message = el("p", "form-message");
  message.setAttribute("role", "alert");
  form.append(submit, message);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const full_name = nameInput.value.trim();
    if (!full_name) return setMessage(message, "Full name can't be empty.", "error");

    const changes = { full_name };
    if (schoolInput) changes.school_name = schoolInput.value.trim() || null;

    setBusy(submit, true, "Saving…");
    setMessage(message, "");
    try {
      const { data, error } = await db
        .from("profiles")
        .update(changes)
        .eq("id", profile.id)
        .select("id,username,full_name,role,school_name")
        .single();
      if (error) throw error;
      state.profile = { ...state.profile, ...data };
      renderUserInfo();
      setMessage(message, "Saved.", "success");
    } catch (err) {
      console.error("Saving settings failed:", err);
      setMessage(message, "Could not save your changes. Try again.", "error");
    } finally {
      setBusy(submit, false);
    }
  });

  return [form];
}

// Sections that have no data source yet fall through to the empty state.
function sectionKey(title) {
  const t = (title || "").trim().toLowerCase();
  if (t.includes("assign")) return "assignments";
  if (t.includes("exam")) return "exams";
  if (t.includes("course")) return "courses";
  if (t.includes("mail")) return "mail";
  if (t.includes("notif")) return "notifications";
  if (t.includes("student")) return "students";
  if (t.includes("setting")) return "settings";
  return null;
}

const SECTION_LOADERS = {
  assignments: loadAssignmentsSection,
  exams: loadExamsSection,
  courses: loadCoursesSection,
  mail: loadMailSection,
  notifications: loadNotificationsSection,
  students: loadStudentsSection,
  settings: loadSettingsSection
};

let sectionRequestId = 0; // guards against a slow response landing in a section the user already left

async function populateSection(title) {
  if (!sectionMain || !sectionList) return;
  const requestId = ++sectionRequestId;
  const loader = SECTION_LOADERS[sectionKey(title)];

  sectionList.replaceChildren();
  sectionMain.classList.remove("has-items");
  sectionMain.classList.remove("is-loading");
  if (!loader || !state.profile) return;

  sectionMain.classList.add("is-loading");
  sectionList.setAttribute("aria-busy", "true");
  try {
    const nodes = await loader();
    if (requestId !== sectionRequestId) return;
    sectionList.replaceChildren(...nodes);
    sectionMain.classList.toggle("has-items", nodes.length > 0);
  } catch (err) {
    if (requestId !== sectionRequestId) return;
    console.error(`Loading "${title}" failed:`, err);
    const failure = el("p", "form-message is-error", "Could not load this section. Check your connection and reopen it.");
    sectionList.replaceChildren(failure);
    sectionMain.classList.add("has-items");
  } finally {
    if (requestId === sectionRequestId) {
      sectionMain.classList.remove("is-loading");
      sectionList.removeAttribute("aria-busy");
    }
  }
}

// ─── RENDER ENGINE (STABLE CARD HOOKS & IN-MODAL SEAMS) ───
function openWidgetSection(item) {
  if (item.id === "settingsWidget") {
    openSettingsSection();
  } else {
    openGenericSection(item.label);
  }
}

function buildHoverPanel(item) {
  const hoverModal = el("div", "modal-hover-content");
  hoverModal.append(
    el("h4", "modal-hover-title", `${item.label} Panel`),
    el("p", "modal-hover-desc", "Nothing Assigned Yet!")
  );
  const showAll = el("button", "hover-show-all-btn", "Show All");
  showAll.type = "button";
  showAll.addEventListener("click", (event) => {
    event.stopPropagation();
    openWidgetSection(item);
  });
  hoverModal.append(showAll);
  return hoverModal;
}

function renderWidgets() {
  if (!widgetContainer) return;
  widgetContainer.replaceChildren();
  const fragment = document.createDocumentFragment();

  getTargetWidgets().forEach((item) => {
    if (item.type === "label") {
      const heading = document.createElement("h3");
      heading.className = "main-categories-label";
      heading.textContent = item.text;
      fragment.appendChild(heading);
      return;
    }

    const card = document.createElement("div");
    card.className = "widget";
    card.id = item.id;
    card.dataset.size = item.size;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Open ${item.label}`);

    card.addEventListener("click", () => openWidgetSection(item));
    card.addEventListener("keydown", (event) => {
      if (event.target !== card) return; // ignore keys pressed on the inner "Show All" button
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openWidgetSection(item);
      }
    });

    const iconWrapper = document.createElement("div");
    iconWrapper.className = "widget-icon-container";

    if (item.iconString) {
      iconWrapper.innerHTML = item.iconString; // trusted: static strings defined above
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

    card.appendChild(iconWrapper);

    if (item.size === "small") {
      const heading = document.createElement("h4");
      heading.textContent = item.label;
      card.appendChild(heading);
    } else {
      const titleText = document.createElement("span");
      titleText.className = "widget-title-text";
      titleText.textContent = item.label;
      card.appendChild(titleText);
    }

    card.appendChild(buildHoverPanel(item));
    fragment.appendChild(card);
  });

  widgetContainer.appendChild(fragment);

  const animTargets = widgetContainer.querySelectorAll(".widget, .main-categories-label");
  animTargets.forEach((target, index) => {
    setTimeout(() => {
      target.classList.add("animate-in");
    }, index * 50);
  });
}

function renderUserInfo() {
  const profile = state.profile;
  if (!profile) return;
  if (nameEl) nameEl.textContent = profile.full_name;
  if (schoolNameEl) {
    const school = profile.school_name || "ClassIQ";
    schoolNameEl.textContent = `${school} (${profile.role.toUpperCase()} PORTAL)`;
  }
}

// ─── SESSION & AUTH HANDLERS ───
async function fetchProfile(userId) {
  const { data, error } = await db
    .from("profiles")
    .select("id,username,full_name,role,school_name")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

async function startSession(userId) {
  state.profile = await fetchProfile(userId);
  loadDashboard();
}


async function handleLoginSubmit(event) {
  event.preventDefault();
  const identifier = loginUsernameInput.value.trim();
  const password = loginPasswordInput.value;

  if (!identifier || !password) {
    return setMessage(loginMessage, "Enter your username and password.", "error");
  }
  if (!db) return setMessage(loginMessage, "The app isn't connected to its backend yet. Check config.js.", "error");

  setBusy(loginButton, true, "Signing in…");
  setMessage(loginMessage, "");
  
  try {
    // ─── ADD THIS CRITICAL LINE TO CLEAR RESIDUE SESSIONS ───
    await db.auth.signOut(); 
    // ────────────────────────────────────────────────────────

    // Teachers log in with their email; students with the username their teacher gave them.
    const email = identifier.includes("@") ? identifier : studentEmail(identifier);
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await startSession(data.user.id);
  } catch (err) {
    console.error("Login failed:", err);
    setMessage(loginMessage, friendlyAuthError(err), "error");
    if (db && state.profile === null) await db.auth.signOut();
  } finally {
    setBusy(loginButton, false);
  }
}


async function handleSignupSubmit(event) {
  event.preventDefault();
  const full_name = document.getElementById("signup-name").value.trim();
  const username = document.getElementById("signup-username").value.trim().toLowerCase();
  const email = document.getElementById("signup-email").value.trim();
  const school_name = document.getElementById("signup-school").value.trim();
  const password = document.getElementById("signup-password").value;

  if (!full_name) return setMessage(signupMessage, "Enter your full name.", "error");
  if (!USERNAME_RE.test(username)) {
    return setMessage(signupMessage, "Username: 3–24 characters, lowercase letters, numbers, dot or underscore.", "error");
  }
  if (!EMAIL_RE.test(email)) return setMessage(signupMessage, "Enter a valid email address.", "error");
  if (password.length < MIN_PASSWORD) {
    return setMessage(signupMessage, `Password must be at least ${MIN_PASSWORD} characters.`, "error");
  }
  if (!db) return setMessage(signupMessage, "The app isn't connected to its backend yet. Check config.js.", "error");

  setBusy(signupButton, true, "Creating account…");
  setMessage(signupMessage, "");
  try {
    const { data: available, error: availabilityError } = await db.rpc("username_available", { p_username: username });
    if (availabilityError) throw availabilityError;
    if (!available) return setMessage(signupMessage, "That username is already taken.", "error");

    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: { data: { full_name, username, school_name } }
    });
    if (error) throw error;

    if (!data.session) {
      // Email confirmation is switched on in the project: no session until the link is clicked.
      setMessage(signupMessage, "Account created. Check your inbox to confirm your email, then log in.", "success");
      return;
    }

    state.profile = await fetchProfile(data.user.id);
    authWrapper.remove();
    document.body.classList.remove("logged-in");
    generateTeacherSetup();
  } catch (err) {
    console.error("Signup failed:", err);
    setMessage(signupMessage, friendlyAuthError(err), "error");
  } finally {
    setBusy(signupButton, false);
  }
}

function loadDashboard() {
  if (authWrapper) authWrapper.style.display = "none";
  if (appMain) appMain.style.display = "block";

  document.body.classList.add("logged-in");

  // ─── DIAGNOSTIC UPGRADE ───
  console.log("Dashboard loaded! Profile data:", state.profile);
  
  if (state.profile) {
    console.log("Applying role class for:", state.profile.role);
    document.body.classList.remove("role-teacher", "role-student");
    document.body.classList.add(`role-${state.profile.role}`);
  } else {
    console.error("CRITICAL: state.profile is null or undefined inside loadDashboard!");
  }
  // ──────────────────────────

  if (siteLogo && sidebarNav) {
    sidebarNav.insertBefore(siteLogo, sidebarNav.firstChild);
  }

  renderUserInfo();
  renderWidgets();
  applySavedSidebarState();
}


async function handleLogout() {
  try {
    await db.auth.signOut();
  } finally {
    window.location.reload();
  }
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
// validation messages) are followed instantly, without animation.
if (authViewport && typeof ResizeObserver !== "undefined") {
  const authResizeObserver = new ResizeObserver(syncAuthViewportHeight);
  Object.values(authViews).forEach((view) => authResizeObserver.observe(view));
}

// ─── NAVIGATION ───
function makeActivatable(node, handler) {
  node.tabIndex = 0;
  node.setAttribute("role", "button");
  node.addEventListener("click", handler);
  node.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handler(event);
    }
  });
}

function setupNavigationClickHandlers() {
  const navItems = document.querySelectorAll("#sidebar nav .nav-item:not(#fullsection-nav-item)");

  navItems.forEach((item) => {
    makeActivatable(item, () => {
      document.querySelectorAll("#sidebar nav .nav-item").forEach((navItem) => navItem.classList.remove("active"));
      item.classList.add("active");
      openGenericSection(item.textContent.trim());
    });
  });
}

function applySavedSidebarState() {
  const dashboardContainer = document.getElementById("dashboard");
  const toggleBtn = document.getElementById("sidebar-toggle-btn");
  const isCollapsed = localStorage.getItem("classiq_sidebar_collapsed") === "true"; // UI preference only
  if (dashboardContainer && isCollapsed) dashboardContainer.classList.add("collapsed");
  if (toggleBtn) toggleBtn.setAttribute("aria-expanded", String(!isCollapsed));
}

function setupSidebarToggle() {
  const toggleBtn = document.getElementById("sidebar-toggle-btn");
  const dashboardContainer = document.getElementById("dashboard");

  if (toggleBtn && dashboardContainer) {
    toggleBtn.addEventListener("click", () => {
      dashboardContainer.classList.toggle("collapsed");

      // Read state AFTER toggling, fresh, every click — not once at setup time.
      // The logo size follows the .collapsed class in CSS, so JS doesn't touch its styles.
      const isNowCollapsed = dashboardContainer.classList.contains("collapsed");
      localStorage.setItem("classiq_sidebar_collapsed", isNowCollapsed ? "true" : "false");
      toggleBtn.setAttribute("aria-expanded", String(!isNowCollapsed));
    });
  }
}

// ─── SECTION OVERLAY ───
let overlayOpener = null;

function openGenericSection(sectionTitle) {
  if (!fullSectionOverlay) {
    console.error("Critical: .full-section element was not found in the HTML DOM structure.");
    return;
  }
  const title = (sectionTitle || "").trim();

  const sectionLabelEl = document.getElementById("section-label");
  if (sectionLabelEl && title) sectionLabelEl.textContent = title;

  const subText = fullSectionOverlay.querySelector("#subtext");
  if (subText) subText.textContent = `No ${title} Yet!`;

  if (!fullSectionOverlay.classList.contains("active")) overlayOpener = document.activeElement;
  fullSectionOverlay.classList.add("active");
  fullSectionOverlay.setAttribute("aria-hidden", "false");
  if (closeButton) closeButton.focus({ preventScroll: true });

  populateSection(title);
}

function openSettingsSection() {
  openGenericSection("Settings");
}

function closeSection() {
  if (!fullSectionOverlay || !fullSectionOverlay.classList.contains("active")) return;
  fullSectionOverlay.classList.remove("active");
  fullSectionOverlay.setAttribute("aria-hidden", "true");
  sectionRequestId++; // drop any response still in flight
  document.querySelectorAll("#sidebar nav .nav-item").forEach((navItem) => navItem.classList.remove("active"));
  if (overlayOpener && document.contains(overlayOpener)) overlayOpener.focus({ preventScroll: true });
  overlayOpener = null;
}

function setupFullSectionNavHandlers() {
  const navItems = document.querySelectorAll(".full-section .fullsection-nav-item");
  if (!navItems.length) return;

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      navItems.forEach((navItem) => navItem.classList.remove("active"));
      item.classList.add("active");
    });
  });
}

function manageTopBar() {
  const topBar = document.getElementById("top-bar");
  const mailbox = topBar.querySelector("#mailbox");
  const notifications = topBar.querySelector("#notifications");
  mailbox.addEventListener("click", () => openGenericSection("Mail"));
  notifications.addEventListener("click", () => openGenericSection("Notifications"));
}

// ─── ORCHESTRATOR INITIALIZATION ───
async function init() {
  setupSidebarToggle();
  setupNavigationClickHandlers();
  setupFullSectionNavHandlers();
  manageTopBar();

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSection();
  });

  if (closeButton) {
    makeActivatable(closeButton, (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeSection();
    });
  }

  if (loginForm) loginForm.addEventListener("submit", handleLoginSubmit);
  if (signupForm) signupForm.addEventListener("submit", handleSignupSubmit);
  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);

  // The two switch links are <span>s, so they get button semantics and Enter/Space support.
  if (signupToggle) makeActivatable(signupToggle, showSignup);
  if (loginToggle) makeActivatable(loginToggle, showLogin);

  if (!db) {
    setMessage(loginMessage, "The app isn't connected to its backend yet. Check config.js.", "error");
    document.body.classList.remove("is-restoring");
    return;
  }

  // Signing out in another tab (or an expired refresh token) must end this session too.
  // The callback only reloads; calling Supabase from inside it can deadlock.
  db.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT" && state.profile) window.location.reload();
  });

  // Restore an existing session before the login screen is ever shown.
  try {
    const { data: { session } } = await db.auth.getSession();
    if (session) await startSession(session.user.id);
  } catch (err) {
    console.error("Could not restore the session:", err);
    await db.auth.signOut();
  } finally {
    document.body.classList.remove("is-restoring");
  }
}

// Ensure execution hooks are synchronized safely
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

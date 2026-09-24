// auth.js — owns the Supabase client and all session state.
// Nothing in this file touches the DOM. app.js consumes it through the
// functions exposed on window.ClassIQAuth. Keeping that boundary is what
// lets the render code stay ignorant of *how* auth resolves, only *that* it has.

const SUPABASE_URL = "https://oggwsvrakfookgmkolve.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nZ3dzdnJha2Zvb2tnbWtvbHZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNjAzMTQsImV4cCI6MjEwNTczNjMxNH0._GGn3dug05YV5aNPjgSZRGo6icyiRHNTxJkMi80gxV8";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Internal state. Not exported directly — read through the functions below,
// so callers always get the current value rather than a stale snapshot.
let _session = null;
let _profile = null; // the profiles row: { id, username, full_name, role, teacher_id, contact_email, ... }
let _listeners = [];
let _ready = false;

function _notify() {
  _listeners.forEach((fn) => fn({ session: _session, profile: _profile }));
}

async function _loadProfile(userId) {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Failed to load profile:", error.message);
    _profile = null;
    return;
  }
  _profile = data;
}

// Resolves username -> the auth email behind it via the locked-down RPC
// (see get_login_email in the SQL migration). Returns null if no match —
// callers should show a generic "invalid username or password" either way,
// never "no such username", which would let someone enumerate accounts.
async function _resolveLoginEmail(username) {
  const { data, error } = await supabaseClient.rpc("get_login_email", { p_username: username });
  if (error) {
    console.error("Username lookup failed:", error.message);
    return null;
  }
  return data || null;
}

/**
 * Call once, at startup, before anything reads session state.
 * Resolves the existing session (if any) and its profile, then wires
 * future auth changes to keep both in sync.
 */
async function init() {
  const { data } = await supabaseClient.auth.getSession();
  _session = data.session;
  if (_session) {
    await _loadProfile(_session.user.id);
  }
  _ready = true;
  _notify();

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    const previousUserId = _session?.user?.id;
    const nextUserId = session?.user?.id;
    _session = session;

    if (nextUserId !== previousUserId) {
      // Only actually changed users (or logged out) should clear the
      // profile before reloading — re-firing for the SAME user (which
      // happens right after signupTeacher()/loginWithUsername() already
      // set _session and _profile directly) must not null out data that's
      // already correct, or the UI flashes blank/wrong before catching up.
      _profile = null;
      if (session) {
        await _loadProfile(session.user.id);
      }
      _notify();
    }
  });
}

/** Subscribe to session/profile changes. Returns an unsubscribe function. */
function onAuthChange(callback) {
  _listeners.push(callback);
  if (_ready) callback({ session: _session, profile: _profile }); // fire immediately with current state
  return () => {
    _listeners = _listeners.filter((fn) => fn !== callback);
  };
}

function getSession() {
  return _session;
}

function getProfile() {
  return _profile;
}

/**
 * Logs in by username. Resolves the real email behind the username first,
 * since Supabase Auth only knows email+password — the username layer is
 * entirely our own (see get_login_email in the SQL migration).
 * Returns { error: string | null }.
 */
async function loginWithUsername(username, password) {
  if (!username || !password) {
    return { error: "Enter a username and password." };
  }

  const email = await _resolveLoginEmail(username);
  if (!email) {
    return { error: "Invalid username or password." };
  }

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Invalid username or password." };
  }
  return { error: null };
}

/**
 * Teacher self-signup. No email is collected anywhere in the UI — Supabase
 * Auth structurally requires an email/password pair (it has no email-less
 * signup mode), so a synthetic one is built from the username, same pattern
 * as createStudent(). This is invisible to the user; nothing displays it.
 * Students are never created this way — see createStudent() below, which
 * goes through the create-student Edge Function.
 * The 'signup_role' metadata is what the on_auth_user_created trigger checks
 * before inserting a profiles row — see handle_new_teacher_signup in the SQL.
 */
const TEACHER_EMAIL_DOMAIN = "teachers.classiq.internal";

async function signupTeacher({ username, full_name, password }) {
  if (!username || !full_name || !password) {
    return { error: "All fields are required." };
  }

  const syntheticEmail = `${username}@${TEACHER_EMAIL_DOMAIN}`;

  const { data, error } = await supabaseClient.auth.signUp({
    email: syntheticEmail,
    password,
    options: {
      data: { signup_role: "teacher", username, full_name },
    },
  });

  if (error) {
    // Supabase's own message would mention "email" here, which would be
    // confusing since the user never entered one — reworded to match what
    // they actually typed. The only realistic cause at this point is a
    // duplicate username (synthetic email collision), since password
    // length/format errors are the same regardless of email.
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "That username is already taken." };
    }
    return { error: error.message };
  }

  // signUp() already returns the new session directly — with email
  // confirmation off, this is live immediately. Setting it here, rather
  // than waiting for onAuthStateChange to fire asynchronously, closes the
  // race where generateTeacherSetup() (opened right after this resolves)
  // could call createStudent() before _session existed.
  _session = data.session;
  if (_session) {
    // The on_auth_user_created trigger inserts the profiles row inside the
    // same transaction as the auth.users insert, so it's already there by
    // the time signUp() resolves — no retry/poll needed.
    await _loadProfile(_session.user.id);
  }
  _notify();
  return { error: null };
}

/**
 * Teacher-only: creates a student account via the create-student Edge Function.
 * Runs server-side under service_role there specifically so the teacher's own
 * session is never touched by this call — see the Edge Function's header comment.
 * Returns { error: string | null }.
 */
async function createStudent({ username, full_name, password }) {
  if (!_session) {
    return { error: "You must be logged in." };
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/create-student`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${_session.access_token}`,
    },
    body: JSON.stringify({ username, full_name, password }),
  });

  const result = await response.json();
  if (!response.ok) {
    return { error: result.error || "Failed to create student account." };
  }
  return { error: null };
}

/** Saves an optional recovery email for the current user (see the post-login popup). */
async function saveContactEmail(email) {
  if (!_session) return { error: "Not logged in." };

  const { error } = await supabaseClient
    .from("profiles")
    .update({ contact_email: email })
    .eq("id", _session.user.id);

  if (error) return { error: error.message };
  _profile = { ..._profile, contact_email: email };
  _notify();
  return { error: null };
}

/** Dismisses the recovery-email popup without setting an email, permanently. */
async function dismissEmailPrompt() {
  if (!_session) return { error: "Not logged in." };

  const { error } = await supabaseClient
    .from("profiles")
    .update({ email_prompt_dismissed: true })
    .eq("id", _session.user.id);

  if (error) return { error: error.message };
  _profile = { ..._profile, email_prompt_dismissed: true };
  _notify();
  return { error: null };
}

async function logout() {
  await supabaseClient.auth.signOut();
}

window.ClassIQAuth = {
  init,
  onAuthChange,
  getSession,
  getProfile,
  loginWithUsername,
  signupTeacher,
  createStudent,
  saveContactEmail,
  dismissEmailPrompt,
  logout,
};

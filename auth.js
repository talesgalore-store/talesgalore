/* =========================================
   TALESGALORE — Firebase Authentication
   ========================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDhBOGaJKp6tb0B495p0BnCwcNCvTafRDs",
  authDomain:        "talesgalore-fb431.firebaseapp.com",
  projectId:         "talesgalore-fb431",
  storageBucket:     "talesgalore-fb431.firebasestorage.app",
  messagingSenderId: "772991771036",
  appId:             "1:772991771036:web:b85c2ef90a7eb36e2c6859",
  measurementId:     "G-ED7Y5BN84J"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Expose auth instance globally so checkout.js can use it
window._firebaseAuth = auth;

/* ── Inject modal HTML ── */
function injectModal() {
  if (document.getElementById('auth-modal')) return;

  document.body.insertAdjacentHTML('beforeend', `
    <div id="auth-modal" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.5);align-items:center;justify-content:center;">
      <div style="background:#FDFAF4;border-radius:12px;padding:36px 32px;width:100%;max-width:420px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
        
        <button onclick="closeAuthModal()" style="position:absolute;top:14px;right:16px;background:none;border:none;font-size:1.4rem;cursor:pointer;color:#888;">×</button>

        <!-- Tabs -->
        <div style="display:flex;gap:0;margin-bottom:28px;border-bottom:2px solid #E2D5BC;">
          <button id="tab-signin" onclick="switchTab('signin')" style="flex:1;padding:10px;background:none;border:none;font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;color:#8B5E3C;border-bottom:2px solid #8B5E3C;margin-bottom:-2px;cursor:pointer;">Sign In</button>
          <button id="tab-signup" onclick="switchTab('signup')" style="flex:1;padding:10px;background:none;border:none;font-family:'Playfair Display',serif;font-size:1rem;font-weight:400;color:#aaa;border-bottom:2px solid transparent;margin-bottom:-2px;cursor:pointer;">Create Account</button>
        </div>

        <!-- Error message -->
        <div id="auth-error" style="display:none;background:#fff0f0;border:1px solid #ffcccc;color:#cc0000;padding:10px 14px;border-radius:6px;font-size:0.85rem;margin-bottom:16px;"></div>

        <!-- Sign In Form -->
        <div id="form-signin">
          <div style="margin-bottom:14px;">
            <label style="display:block;font-size:0.72rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#C8923A;margin-bottom:6px;">Email</label>
            <input id="signin-email" type="email" placeholder="your@email.com" style="width:100%;border:1px solid #E2D5BC;padding:11px 14px;border-radius:6px;font-size:0.9rem;background:#fff;outline:none;" onfocus="this.style.borderColor='#C8923A'" onblur="this.style.borderColor='#E2D5BC'"/>
          </div>
          <div style="margin-bottom:8px;">
            <label style="display:block;font-size:0.72rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#C8923A;margin-bottom:6px;">Password</label>
            <input id="signin-password" type="password" placeholder="Your password" style="width:100%;border:1px solid #E2D5BC;padding:11px 14px;border-radius:6px;font-size:0.9rem;background:#fff;outline:none;" onfocus="this.style.borderColor='#C8923A'" onblur="this.style.borderColor='#E2D5BC'" onkeydown="if(event.key==='Enter') handleSignIn()"/>
          </div>
          <div style="text-align:right;margin-bottom:20px;">
            <button onclick="handleForgotPassword()" style="background:none;border:none;font-size:0.8rem;color:#C8923A;cursor:pointer;text-decoration:underline;">Forgot password?</button>
          </div>
          <button onclick="handleSignIn()" id="signin-btn" style="width:100%;padding:13px;background:#8B5E3C;color:white;border:none;border-radius:6px;font-family:'Lato',sans-serif;font-size:0.85rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;transition:background .2s;">Sign In</button>
          <p style="text-align:center;margin-top:16px;font-size:0.85rem;color:#888;">Don't have an account? <button onclick="switchTab('signup')" style="background:none;border:none;color:#C8923A;cursor:pointer;font-size:0.85rem;text-decoration:underline;">Create one</button></p>
        </div>

        <!-- Sign Up Form -->
        <div id="form-signup" style="display:none;">
          <div style="margin-bottom:14px;">
            <label style="display:block;font-size:0.72rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#C8923A;margin-bottom:6px;">Full Name</label>
            <input id="signup-name" type="text" placeholder="Your full name" style="width:100%;border:1px solid #E2D5BC;padding:11px 14px;border-radius:6px;font-size:0.9rem;background:#fff;outline:none;" onfocus="this.style.borderColor='#C8923A'" onblur="this.style.borderColor='#E2D5BC'"/>
          </div>
          <div style="margin-bottom:14px;">
            <label style="display:block;font-size:0.72rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#C8923A;margin-bottom:6px;">Email</label>
            <input id="signup-email" type="email" placeholder="your@email.com" style="width:100%;border:1px solid #E2D5BC;padding:11px 14px;border-radius:6px;font-size:0.9rem;background:#fff;outline:none;" onfocus="this.style.borderColor='#C8923A'" onblur="this.style.borderColor='#E2D5BC'"/>
          </div>
          <div style="margin-bottom:20px;">
            <label style="display:block;font-size:0.72rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#C8923A;margin-bottom:6px;">Password</label>
            <input id="signup-password" type="password" placeholder="Min. 6 characters" style="width:100%;border:1px solid #E2D5BC;padding:11px 14px;border-radius:6px;font-size:0.9rem;background:#fff;outline:none;" onfocus="this.style.borderColor='#C8923A'" onblur="this.style.borderColor='#E2D5BC'" onkeydown="if(event.key==='Enter') handleSignUp()"/>
          </div>
          <button onclick="handleSignUp()" id="signup-btn" style="width:100%;padding:13px;background:#8B5E3C;color:white;border:none;border-radius:6px;font-family:'Lato',sans-serif;font-size:0.85rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;transition:background .2s;">Create Account</button>
          <p style="text-align:center;margin-top:16px;font-size:0.85rem;color:#888;">Already have an account? <button onclick="switchTab('signin')" style="background:none;border:none;color:#C8923A;cursor:pointer;font-size:0.85rem;text-decoration:underline;">Sign in</button></p>
        </div>

      </div>
    </div>
  `);

  // Close on backdrop click
  document.getElementById('auth-modal').addEventListener('click', function(e) {
    if (e.target === this) closeAuthModal();
  });
}

/* ── Modal controls ── */
window.openAuthModal = function(tab = 'signin') {
  injectModal();
  switchTab(tab);
  document.getElementById('auth-modal').style.display = 'flex';
  clearAuthError();
};

window.closeAuthModal = function() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.style.display = 'none';
  clearAuthError();
};

window.switchTab = function(tab) {
  document.getElementById('form-signin').style.display = tab === 'signin' ? 'block' : 'none';
  document.getElementById('form-signup').style.display = tab === 'signup' ? 'block' : 'none';
  document.getElementById('tab-signin').style.fontWeight = tab === 'signin' ? '700' : '400';
  document.getElementById('tab-signin').style.color      = tab === 'signin' ? '#8B5E3C' : '#aaa';
  document.getElementById('tab-signin').style.borderBottomColor = tab === 'signin' ? '#8B5E3C' : 'transparent';
  document.getElementById('tab-signup').style.fontWeight = tab === 'signup' ? '700' : '400';
  document.getElementById('tab-signup').style.color      = tab === 'signup' ? '#8B5E3C' : '#aaa';
  document.getElementById('tab-signup').style.borderBottomColor = tab === 'signup' ? '#8B5E3C' : 'transparent';
  clearAuthError();
};

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.style.display = 'block';
}

function clearAuthError() {
  const el = document.getElementById('auth-error');
  if (el) el.style.display = 'none';
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? 'Please wait…' : (btnId === 'signin-btn' ? 'Sign In' : 'Create Account');
}

/* ── Auth handlers ── */
window.handleSignIn = async function() {
  const email    = document.getElementById('signin-email').value.trim();
  const password = document.getElementById('signin-password').value;
  if (!email || !password) { showAuthError('Please enter your email and password.'); return; }

  setLoading('signin-btn', true);
  clearAuthError();
  try {
    await signInWithEmailAndPassword(auth, email, password);
    closeAuthModal();
  } catch (e) {
    showAuthError(friendlyError(e.code));
    setLoading('signin-btn', false);
  }
};

window.handleSignUp = async function() {
  const name     = document.getElementById('signup-name').value.trim();
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;

  if (!name)               { showAuthError('Please enter your full name.'); return; }
  if (!email)              { showAuthError('Please enter your email.'); return; }
  if (password.length < 6) { showAuthError('Password must be at least 6 characters.'); return; }

  setLoading('signup-btn', true);
  clearAuthError();
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    closeAuthModal();
  } catch (e) {
    showAuthError(friendlyError(e.code));
    setLoading('signup-btn', false);
  }
};

window.handleSignOut = async function() {
  await signOut(auth);
};

window.handleForgotPassword = async function() {
  const email = document.getElementById('signin-email').value.trim();
  if (!email) { showAuthError('Enter your email above first, then click Forgot password.'); return; }
  try {
    await sendPasswordResetEmail(auth, email);
    showAuthError('✓ Reset email sent! Check your inbox.');
    document.getElementById('auth-error').style.background = '#f0fff4';
    document.getElementById('auth-error').style.borderColor = '#b2dfdb';
    document.getElementById('auth-error').style.color = '#2e7d32';
  } catch (e) {
    showAuthError(friendlyError(e.code));
  }
};

/* ── Friendly error messages ── */
function friendlyError(code) {
  switch (code) {
    case 'auth/user-not-found':      return 'No account found with this email.';
    case 'auth/wrong-password':      return 'Incorrect password. Try again.';
    case 'auth/email-already-in-use': return 'An account with this email already exists.';
    case 'auth/invalid-email':       return 'Please enter a valid email address.';
    case 'auth/weak-password':       return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests':   return 'Too many attempts. Please try again later.';
    case 'auth/invalid-credential':  return 'Incorrect email or password.';
    default:                         return 'Something went wrong. Please try again.';
  }
}

/* ── Update header on auth state change ── */
onAuthStateChanged(auth, user => {
  window._currentUser = user;
  updateHeaderAuth(user);
  // Pre-fill checkout form if on cart page
  prefillCheckout(user);
});

function updateHeaderAuth(user) {
  const btn = document.getElementById('auth-header-btn');
  if (!btn) return;

  if (user) {
    const name = user.displayName ? user.displayName.split(' ')[0] : user.email;
    btn.innerHTML = `
      <span style="font-size:0.85rem;color:#8B5E3C;font-weight:600;">Hi, ${name}</span>
      <button onclick="handleSignOut()" style="background:none;border:1px solid #E2D5BC;color:#888;padding:4px 10px;border-radius:4px;font-size:0.75rem;cursor:pointer;margin-left:8px;">Sign Out</button>
    `;
  } else {
    btn.innerHTML = `
      <button onclick="openAuthModal('signin')" style="background:none;border:1px solid #8B5E3C;color:#8B5E3C;padding:6px 14px;border-radius:6px;font-size:0.82rem;font-weight:700;letter-spacing:0.04em;cursor:pointer;transition:background .2s;" onmouseover="this.style.background='#8B5E3C';this.style.color='white'" onmouseout="this.style.background='none';this.style.color='#8B5E3C'">Sign In</button>
    `;
  }
}

function prefillCheckout(user) {
  if (!user) return;
  const nameEl  = document.getElementById('custName');
  const emailEl = document.getElementById('custEmail');
  if (nameEl  && !nameEl.value  && user.displayName) nameEl.value  = user.displayName;
  if (emailEl && !emailEl.value && user.email)        emailEl.value = user.email;
}

/* ── Expose getCurrentUser for checkout.js ── */
window.getCurrentUser = function() {
  return auth.currentUser;
};

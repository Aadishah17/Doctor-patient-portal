/*  ==========================================
    MedConnect – Core JavaScript
    All buttons wired and fully functional
    ==========================================  */

// ---- UTILITIES ----
function toast(msg, type = 'success') {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3300);
}

// ---- AUTH PAGE LOGIC ----
(function authInit() {
    const box = document.getElementById('auth-box');
    const go = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };

    // Slider toggle buttons
    go('go-register', () => box.classList.add('register-mode'));
    go('go-login', () => box.classList.remove('register-mode'));
    go('to-register-mobile', () => box.classList.add('register-mode'));
    go('to-login-mobile', () => box.classList.remove('register-mode'));

    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', e => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const pass = document.getElementById('login-password').value.trim();
            const role = document.getElementById('login-role').value;

            if (!email || !pass) { toast('Please fill in all fields', 'error'); return; }
            if (!role) { toast('Please select a role', 'error'); return; }

            // Simulated authentication
            if (role === 'doctor') window.location.href = 'doctor.html';
            if (role === 'patient') window.location.href = 'patient.html';
        });
    }

    // Register form
    const regForm = document.getElementById('register-form');
    if (regForm) {
        regForm.addEventListener('submit', e => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const pass = document.getElementById('reg-password').value.trim();
            const role = document.getElementById('reg-role').value;

            if (!name || !email || !pass) { toast('Please fill in all fields', 'error'); return; }
            if (!role) { toast('Please select a role', 'error'); return; }

            toast('Registration successful! Please sign in.');
            regForm.reset();
            if (box) box.classList.remove('register-mode');
        });
    }
})();

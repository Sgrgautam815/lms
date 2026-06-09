// ============================================================
//  STUDENT LOGIN PAGE — script.js
//  Handles: form validation, API login, role access control,
//           password toggle, loading states, error UI
// ============================================================

(function () {
    'use strict';

    const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
        ? 'http://localhost:3000'
        : 'https://lms-dra8.onrender.com';

    /* ── DOM REFS ──────────────────────────────────────────── */
    const form        = document.getElementById('studentLoginForm');
    const emailInput  = document.getElementById('loginEmail');
    const pwdInput    = document.getElementById('loginPassword');
    const togglePwd   = document.getElementById('togglePwd');
    const loginBtn    = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const alertBox    = document.getElementById('alertBox');
    const card        = document.querySelector('.login-card');

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            window.location.href = 'admin/login.html';
        }
    });

    /* ── 1. ALREADY LOGGED IN? ──────────────────────────────
       If the user already has a valid session, redirect them.
    ─────────────────────────────────────────────────────────── */
    const existingToken = localStorage.getItem('token');
    const existingRole  = localStorage.getItem('role');

    if (existingToken) {
        if (existingRole === 'student') {
            window.location.replace('student/dashboard.html');
            return;
        }
    }

    /* ── 2. PASSWORD TOGGLE ─────────────────────────────────── */
    function togglePassword() {
        const isPassword = pwdInput.type === 'password';
        pwdInput.type    = isPassword ? 'text' : 'password';
        togglePwd.textContent = isPassword ? '🙈' : '👁️';
    }
    togglePwd.addEventListener('click', togglePassword);
    togglePwd.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePassword(); }
    });

    /* ── 3. ALERT HELPER ────────────────────────────────────── */
    function showAlert(message, type = 'error') {
        alertBox.className = `alert-box alert-${type}`;
        alertBox.innerHTML = `
            <span style="font-size:1.1rem; flex-shrink:0;">${type === 'error' ? '⚠️' : '✅'}</span>
            <span>${message}</span>`;
        alertBox.style.display = 'flex';
        // Auto-dismiss success after 3s
        if (type === 'success') {
            setTimeout(() => { alertBox.style.display = 'none'; }, 3000);
        }
    }

    function clearAlert() { alertBox.style.display = 'none'; }

    /* ── 4. LOADING STATE ───────────────────────────────────── */
    function setLoading(isLoading) {
        if (isLoading) {
            loginBtn.classList.add('loading');
            loginBtn.textContent = 'Signing in';
        } else {
            loginBtn.classList.remove('loading');
            loginBtn.innerHTML = 'Sign In &nbsp;→';
        }
    }

    /* ── 5. FORM SUBMIT ─────────────────────────────────────── */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAlert();

        const email    = emailInput.value.trim();
        const password = pwdInput.value;

        /* Client-side validation */
        if (!email) {
            showAlert('Please enter your email address.');
            emailInput.focus();
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showAlert('Please enter a valid email address.');
            emailInput.focus();
            return;
        }
        if (password.length < 6) {
            showAlert('Password must be at least 6 characters.');
            pwdInput.focus();
            return;
        }

        setLoading(true);

        try {
            const res  = await fetch(`${API_BASE}/login`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                /* ── ROLE ACCESS CONTROL ──────────────────────────
                   Prevent teachers/admins from using the student portal.
                ─────────────────────────────────────────────────── */
                if (data.role === 'teacher') {
                    showAlert('This account belongs to faculty. Please use the <strong><a href="teacher/login.html" style="color:#fca5a5;">Teacher Portal</a></strong> to sign in.');
                    setLoading(false);
                    return;
                } else if (data.role === 'admin') {
                    showAlert('This is an administrator account. Please use the Admin Portal to sign in.');
                    setLoading(false);
                    return;
                }

                /* ── PERSIST SESSION ──────────────────────────────── */
                localStorage.setItem('token',     data.token);
                localStorage.setItem('role',      data.role);
                localStorage.setItem('name',      data.name);
                localStorage.setItem('userId',    data.user._id);
                localStorage.setItem('collegeId', data.user.collegeId);
                localStorage.setItem('course',    data.user.course);
                localStorage.setItem('subjects',  JSON.stringify(data.user.subjects || []));

                console.log('✅ Student login success:', data);

                showAlert('Login successful! Redirecting…', 'success');

                /* Page transition */
                setTimeout(() => {
                    window.location.href = 'student/dashboard.html';
                }, 700);

            } else {
                /* API returned an error */
                const msg = data.message || 'Login failed. Please check your credentials.';
                showAlert(msg);
                setLoading(false);
            }

        } catch (err) {
            console.error('Login error:', err);
            showAlert('Unable to connect to the server. Please ensure the backend is running.');
            setLoading(false);
        }
    });

    /* ── 6. REGISTER BUTTON ─────────────────────────────────── */
    registerBtn.addEventListener('click', () => {
        window.location.href = 'register.html';
    });

    /* ── 7. PAGE ENTRANCE ANIMATION ─────────────────────────── */
    window.addEventListener('load', () => {
        card.style.opacity   = '0';
        card.style.transform = 'translateY(30px)';
        requestAnimationFrame(() => {
            card.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
            card.style.opacity    = '1';
            card.style.transform  = 'translateY(0)';
        });
    });

    console.log('🎓 Student Login page loaded.');

})();


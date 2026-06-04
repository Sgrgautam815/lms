(function () {
    'use strict';
    const API = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
        ? 'https://lms-dra8.onrender.com'
        : 'https://lms-dra8.onrender.com';

    // Redirect if already admin
    if (localStorage.getItem('token') && localStorage.getItem('role') === 'admin') {
        window.location.replace('dashboard.html');
        return;
    }

    const form       = document.getElementById('adminLoginForm');
    const emailInput = document.getElementById('adminEmail');
    const pwdInput   = document.getElementById('adminPassword');
    const loginBtn   = document.getElementById('loginBtn');
    const alertBox   = document.getElementById('alertBox');
    const togglePwd  = document.getElementById('togglePwd');

    // Password toggle
    togglePwd.addEventListener('click', () => {
        const show = pwdInput.type === 'password';
        pwdInput.type = show ? 'text' : 'password';
        togglePwd.textContent = show ? '🙈' : '👁️';
    });

    function showAlert(msg, type = 'error') {
        alertBox.className = `alert-box alert-${type}`;
        alertBox.innerHTML = `<span>${type === 'error' ? '🚫' : '✅'}</span><span>${msg}</span>`;
        alertBox.style.display = 'flex';
    }

    function setLoading(on) {
        loginBtn.classList.toggle('loading', on);
        loginBtn.innerHTML = on ? 'Authenticating' : '<i class="fas fa-lock-open"></i>&nbsp; Sign In to Admin Panel';
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        alertBox.style.display = 'none';

        const email    = emailInput.value.trim();
        const password = pwdInput.value;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showAlert('Please enter a valid email address.'); return;
        }
        if (password.length < 6) {
            showAlert('Password is required.'); return;
        }

        setLoading(true);
        try {
            const res  = await fetch(`${API}/admin-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok) {
                // Role guard — only allow admin
                if (data.role !== 'admin') {
                    showAlert('Access denied. This portal is for administrators only.');
                    setLoading(false); return;
                }
                localStorage.setItem('token',    data.token);
                localStorage.setItem('role',     data.role);
                localStorage.setItem('name',     data.name);
                localStorage.setItem('adminId',  data.user._id);
                console.log('✅ Admin login success:', data.user);
                showAlert('Login successful! Redirecting…', 'success');
                setTimeout(() => { window.location.href = 'dashboard.html'; }, 700);
            } else {
                showAlert(data.message || 'Login failed.');
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            showAlert('Cannot connect to server. Is the backend running?');
            setLoading(false);
        }
    });
})();


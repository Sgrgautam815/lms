// ==========================================
// TEACHER REGISTRATION LOGIC
// ==========================================

const form = document.getElementById("teacherRegisterForm");
const message = document.getElementById("message");

// Highlight checked checkboxes
document.querySelectorAll(".checkbox-item").forEach(label => {
    const checkbox = label.querySelector("input[type='checkbox']");
    checkbox.addEventListener("change", () => {
        label.classList.toggle("checked", checkbox.checked);
    });
});

// Helper to get selected checkboxes
function getChecked(containerId) {
    return [...document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`)]
        .map(cb => cb.value);
}

// Validation Helpers
function setStatus(input, valid) {
    input.classList.remove("input-valid", "input-invalid");
    input.classList.add(valid ? "input-valid" : "input-invalid");
}

// Real-time Email Validation
const emailInput = document.getElementById("tEmail");
emailInput.addEventListener("input", () => {
    setStatus(emailInput, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value));
});

// Real-time Password Validation
const passwordInput = document.getElementById("tPassword");
passwordInput.addEventListener("input", () => {
    setStatus(passwordInput, /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(passwordInput.value));
});

// Form Submission
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    message.textContent = "";

    const name = document.getElementById("tName").value.trim();
    const teacherId = document.getElementById("tTeacherId").value.trim();
    const department = document.getElementById("tDepartment").value;
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const phone = document.getElementById("tPhone").value.trim();
    const qualification = document.getElementById("tQualification").value.trim();
    const experience = document.getElementById("tExperience").value.trim();

    const assignedCourses = getChecked("courseCheckboxes");
    const assignedSubjects = getChecked("subjectCheckboxes");

    // Validations
    if (!name || !teacherId || !email || !password || !department) {
        return showMessage("Please fill all required (*) fields.", "#ff4444");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return showMessage("Enter a valid email address.", "#ff4444");
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(password)) {
        return showMessage("Password must be 6+ chars with uppercase, lowercase & number.", "#ff4444");
    }
    if (phone && !/^\d{10}$/.test(phone)) {
        return showMessage("Phone number must be 10 digits.", "#ff4444");
    }
    if (assignedCourses.length === 0) {
        return showMessage("Please select at least one assigned course.", "#ff4444");
    }
    if (assignedSubjects.length === 0) {
        return showMessage("Please select at least one assigned subject.", "#ff4444");
    }

    showMessage("Registering... ⏳", "white");

    try {
        const apiBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
            ? 'https://lms-dra8.onrender.com'
            : 'https://lms-dra8.onrender.com';
        const res = await fetch(`${apiBase}/teacher-register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, teacherId, email, password, phone, department, qualification, experience, assignedCourses, assignedSubjects })
        });

        const data = await res.json();

        if (res.ok) {
            form.innerHTML = `
                <div class="success-box">
                    <h3>✅ Registration Successful!</h3>
                    <p style="margin: 12px 0;">Welcome, <strong>${name}</strong>!</p>
                    <p>Your Teacher ID: <code style="background:rgba(0,0,0,0.3);padding:4px 10px;border-radius:6px;color:#00f0ff;font-size:1.1rem;">${teacherId}</code></p>
                    <p style="margin-top:12px;font-size:0.9rem;opacity:0.8;">Assigned Courses: ${assignedCourses.join(", ")}</p>
                    <p style="font-size:0.9rem;opacity:0.8;">Redirecting to login in 4 seconds...</p>
                </div>`;
            setTimeout(() => { window.location.href = "login.html"; }, 4000);
        } else {
            showMessage(data.message || "Registration failed.", "#ff4444");
        }
    } catch (err) {
        console.error(err);
        showMessage("Server connection error. Is the backend running?", "#ff4444");
    }
});

function showMessage(text, color) {
    message.style.color = color;
    message.textContent = text;
}


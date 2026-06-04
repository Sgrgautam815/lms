const registerForm = document.getElementById("registerForm");
const message = document.getElementById("message");

registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    message.textContent = "";

    const name = document.getElementById("studentName").value.trim();
    const course = document.getElementById("course").value;
    const section = document.getElementById("section").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();

    // Regex for validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    const phoneRegex = /^\d{10}$/;

    // Basic Validations
    if (!name || !course || !email || !password || !phone) {
        showMessage("Please fill all required fields", "#ff4444");
        return;
    }

    if (!emailRegex.test(email)) {
        showMessage("Enter a valid email address", "#ff4444");
        return;
    }

    if (!passwordRegex.test(password)) {
        showMessage("Password must be 6+ chars with Upper, Lower, and Number", "#ff4444");
        return;
    }

    if (!phoneRegex.test(phone)) {
        showMessage("Enter a valid 10-digit phone number", "#ff4444");
        return;
    }

    const studentData = {
        name,
        course,
        section: section || "A",
        email,
        password,
        phone,
        address,
        role: "student"
    };

    try {
        message.textContent = "Processing registration... ⏳";
        message.style.color = "white";

        const apiBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
            ? 'http://localhost:3000'
            : 'https://lms-dra8.onrender.com';
        const response = await fetch(`${apiBase}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(studentData)
        });

        const data = await response.json();

        if (response.ok) {
            // Registration Success
            registerForm.innerHTML = `
                <div class="success-box">
                    <h3>Registration Successful! 🚀</h3>
                    <p style="margin: 10px 0;">Welcome to the portal, <strong>${name}</strong>.</p>
                    <p>Your unique College ID is:</p>
                    <div style="margin: 15px 0;">
                        <span class="id-highlight">${data.collegeId}</span>
                    </div>
                    <p style="font-size: 0.9rem; opacity: 0.8;">Please save this ID for your records. Redirecting to login...</p>
                </div>
            `;
            
            setTimeout(() => {
                window.location.href = "index.html";
            }, 5000);

        } else {
            showMessage(data.message || "Registration Failed", "red");
        }
    } catch (error) {
        console.error("Error:", error);
        showMessage("Server Connection Error", "red");
    }
});

function showMessage(text, color) {
    message.style.color = color;
    message.textContent = text;
}

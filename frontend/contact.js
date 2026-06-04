document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contactForm");
    const alertBox = document.getElementById("alertBox");
    const submitBtn = document.getElementById("submitBtn");

    function showAlert(msg, type) {
        alertBox.textContent = msg;
        alertBox.className = `alert-box alert-${type}`;
        alertBox.style.display = "block";
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const role = document.getElementById("role").value;
        const message = document.getElementById("message").value.trim();

        if (!name || !email || !role || !message) {
            showAlert("Please fill in all fields.", "error");
            return;
        }

        submitBtn.textContent = "Sending...";
        submitBtn.disabled = true;

        try {
            const apiBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
                ? 'http://localhost:3000'
                : 'https://lms-dra8.onrender.com';
            const res = await fetch(`${apiBase}/complaints`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name, email, role, message })
            });

            const data = await res.json();

            if (res.ok) {
                showAlert("✅ Your message has been sent to the Admin!", "success");
                form.reset();
            } else {
                showAlert(data.message || "Failed to send message.", "error");
            }
        } catch (error) {
            console.error("Contact Error:", error);
            showAlert("Server error. Please try again later.", "error");
        } finally {
            submitBtn.textContent = "Submit Request";
            submitBtn.disabled = false;
        }
    });
});


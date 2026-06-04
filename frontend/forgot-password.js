const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const message = document.getElementById("message");

forgotPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const newPassword = document.getElementById("newPassword").value;

    try {
        const apiBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
            ? 'http://localhost:3000'
            : 'https://lms-backend-pksf.onrender.com';
        const response = await fetch(`${apiBase}/forgot-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            message.style.color = "lightgreen";
            message.textContent = data.message;
            setTimeout(() => {
                window.location.href = "index.html";
            }, 2000);
        } else {
            message.style.color = "red";
            message.textContent = data.message || "Failed to reset password";
        }
    } catch (error) {
        console.log(error);
        message.style.color = "red";
        message.textContent = "Server Error";
    }
});


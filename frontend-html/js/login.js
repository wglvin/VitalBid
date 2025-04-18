window.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const reason = urlParams.get("reason");

    if (reason === "unauthorised") {
        showToast("❌ Unauthorised access. Please log in.", "warning");
    } else if (reason === "logout") {
        showToast("User has logged out successfully!", "success");
    }
});

async function loginUser() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const payload = {
        username: username,
        password: password
    };

    try {
        const response = await fetch("http://localhost:8000/outsystems/LoginUserAPI/Login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            // Store both token and full response data
            localStorage.setItem("authToken", result.token);
            localStorage.setItem("userData", JSON.stringify(result));

            showToast(result.message, "success");

            // Redirect to index.html after toast shows
            setTimeout(() => window.location.href = "index.html", 3500);
        } else {
            showToast(result.reason || "Login failed", "warning");
        }
    } catch (error) {
        console.error("Login error:", error);
        showToast("Failed to connect to server.", "danger");
    }
}

function showToast(message, type = 'primary') {
    const toastElement = document.getElementById('toastAlert');
    const toastBody = document.getElementById('toastMsg');

    toastElement.className = `toast align-items-center text-center fw-bold bg-${type} border rounded border-dark`;
    toastBody.textContent = message;

    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}

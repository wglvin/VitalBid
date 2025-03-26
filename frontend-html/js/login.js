async function loginUser() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const payload = {
        username: username,
        password: password
    };

    console.log("📦 request Sent:", payload);

    try {
        const response = await fetch("http://localhost:8000/outsystems/LoginUserAPI/Login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log("🔍 Response:", result);

        if (result.success) {
            showToast(result.message, "success");
            // Store both token and full response data
            localStorage.setItem("authToken", result.token);
            localStorage.setItem("userData", JSON.stringify(result));
            setTimeout(() => window.location.href = "../testingRedirect.html", 3500);
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

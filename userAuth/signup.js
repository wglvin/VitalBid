async function signup() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const email = document.getElementById('email').value;

    const payload = {
        username: username,
        email: email,
        password: password
    };
    console.log("📦bidder login sent:", payload);


    try {
        const response = await fetch("https://personal-rrotlkrf.outsystemscloud.com/UserAuth/rest/CreateUserAPI/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log("🔍bidder login received:", result); 

        if (result.success) {
            setTimeout(() => window.location.href = "./login.html", 2000); // delay redirect to see the toast

        } else {
            showToast(result.result, "warning");

        }
    } catch (error) {
        console.log(result)
        console.error("Error:", error);
        showToast("Failed to connect to server.", "danger");

    }
}

function showToast(message, type = 'primary') {
    const toastElement = document.getElementById('toastAlert');
    const toastBody = document.getElementById('toastMsg');

    // Change toast background color
    toastElement.className = `toast align-items-center text-center fw-bold bg-${type} border rounded border-dark`;


    toastBody.textContent = message;

    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}

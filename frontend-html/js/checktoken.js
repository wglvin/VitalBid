console.log("🔒 checktoken.js loaded!");
function checkAuth() {
    const token = localStorage.getItem("authToken");

    const path = window.location.pathname.toLowerCase();
    const isLoginOrSignup = path.includes("login.html") || path.includes("signup.html");

    if (!token && !isLoginOrSignup) {
        window.location.href = "login.html";
    }
}

checkAuth();

function logout() {
    localStorage.removeItem("authToken");
    window.location.href = "login.html";
}

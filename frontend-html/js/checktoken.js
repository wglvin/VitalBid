function checkAuth() {
    const token = localStorage.getItem("authToken");

    const path = window.location.pathname.toLowerCase();
    const isLoginOrSignup = path.includes("login.html") || path.includes("signup.html");

    if (!token && !isLoginOrSignup) {
        // Append query parameter to show toast on login page
        window.location.href = "login.html?reason=unauthorised";
    }
}

checkAuth();

function logout() {
    localStorage.removeItem("authToken");
    window.location.href = "login.html?reason=logout";
}

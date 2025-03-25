document.addEventListener('DOMContentLoaded', function() {
    // Redirect if already logged in
    if (localStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = 'index.html';
        return;
    }
    
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const loginErrorMessage = document.getElementById('login-error-message');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Hide any previous errors
        loginError.classList.add('hidden');
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Simple validation
        if (!email || !password) {
            loginErrorMessage.textContent = 'Please enter both email and password';
            loginError.classList.remove('hidden');
            return;
        }
        
        // For demo purposes - simple mock login
        // In a real app, this would make an API call
        if (email === 'user@example.com' && password === 'password') {
            const user = {
                id: 1,
                username: 'demouser',
                email: email
            };
            
            // Store user data in localStorage
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', 'mock-jwt-token');
            
            // Redirect to home page
            window.location.href = 'index.html';
        } else {
            loginErrorMessage.textContent = 'Invalid email or password';
            loginError.classList.remove('hidden');
        }
    });
}); 
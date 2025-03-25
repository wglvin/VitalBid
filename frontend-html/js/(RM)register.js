document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('register-form');
    const registerError = document.getElementById('register-error');
    
    // Check if already logged in
    if (authService.isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }
    
    registerForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // Clear previous errors
        registerError.classList.add('hidden');
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const address = document.getElementById('address').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (password !== confirmPassword) {
            registerError.textContent = 'Passwords do not match';
            registerError.classList.remove('hidden');
            return;
        }
        
        try {
            // Attempt to register
            const user = await authService.register({
                username,
                email,
                address,
                password,
                confirmPassword
            });
            
            // Redirect to home page on success
            window.location.href = 'index.html';
        } catch (error) {
            // Display error message
            registerError.textContent = error.message;
            registerError.classList.remove('hidden');
        }
    });
}); 
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the login or register page - these shouldn't show login/register buttons
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'login.html' || currentPage === 'register.html') {
        return; // Don't modify login/register buttons on these pages
    }
    
    // Check login status using multiple methods for compatibility
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const hasToken = user && user.token;
    
    // Use either method to determine if logged in
    const userIsLoggedIn = isLoggedIn || hasToken;
    
    // Get the auth container where login/register buttons are located
    const authContainer = document.querySelector('header .flex.items-center');
    if (!authContainer) {
        console.error('Auth container not found in header');
        return; // Exit if auth container not found
    }
    
    // Find existing login and register buttons
    const loginButton = authContainer.querySelector('a[href="login.html"]');
    const registerButton = authContainer.querySelector('a[href="register.html"]');
    
    // Only proceed if we found at least one of the buttons
    if (!loginButton && !registerButton) {
        console.error('Neither login nor register buttons found');
        return;
    }
    
    if (userIsLoggedIn) {
        // User is logged in, hide login/register buttons
        if (loginButton) loginButton.style.display = 'none';
        if (registerButton) registerButton.style.display = 'none';
        
        // Create welcome message and logout button only if they don't exist
        let welcomeMessage = authContainer.querySelector('.welcome-message');
        let logoutButton = authContainer.querySelector('#logout-btn');
        
        if (!welcomeMessage) {
            welcomeMessage = document.createElement('span');
            welcomeMessage.className = 'welcome-message text-gray-700 px-3 py-2 text-sm font-medium';
            welcomeMessage.textContent = `Welcome, ${user.username || user.email || 'User'}`;
            authContainer.appendChild(welcomeMessage);
        }
        
        if (!logoutButton) {
            logoutButton = document.createElement('button');
            logoutButton.id = 'logout-btn';
            logoutButton.className = 'ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500';
            logoutButton.textContent = 'Logout';
            authContainer.appendChild(logoutButton);
            
            // Add event listener to logout button
            logoutButton.addEventListener('click', function() {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                window.location.reload();
            });
        }
    } else {
        // User is not logged in, show login/register buttons
        if (loginButton) loginButton.style.display = '';
        if (registerButton) registerButton.style.display = '';
        
        // Remove welcome message and logout button if they exist
        const welcomeMessage = authContainer.querySelector('.welcome-message');
        const logoutButton = authContainer.querySelector('#logout-btn');
        
        if (welcomeMessage) welcomeMessage.remove();
        if (logoutButton) logoutButton.remove();
    }

    // Log state for debugging
    console.log('Auth buttons processed:', {
        page: currentPage,
        isLoggedIn: userIsLoggedIn,
        loginButtonFound: !!loginButton,
        registerButtonFound: !!registerButton
    });
}); 
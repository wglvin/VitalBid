// Authentication service for handling user login/registration
const authService = {
    // Login user
    async login(email, password) {
        // For demonstration purposes - in a real app, this would call an API
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Mock authentication - in a real app, this would be handled by a server
                if (email === 'user@example.com' && password === 'password') {
                    const user = {
                        id: 1,
                        username: 'user123',
                        email: email,
                        address: '123 Main St, Anytown, USA'
                    };
                    
                    // Store user info in localStorage
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('user', JSON.stringify(user));
                    localStorage.setItem('token', 'mock-jwt-token');
                    
                    resolve(user);
                } else {
                    reject(new Error('Invalid email or password'));
                }
            }, 500); // Simulate network delay
        });
    },
    
    // Register new user
    async register(userData) {
        // For demonstration purposes - in a real app, this would call an API
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Mock registration - in a real app, this would be handled by a server
                if (!userData.email || !userData.password || !userData.username) {
                    reject(new Error('Username, email and password are required'));
                    return;
                }
                
                if (userData.password !== userData.confirmPassword) {
                    reject(new Error('Passwords do not match'));
                    return;
                }
                
                // Create a new user object
                const user = {
                    id: Math.floor(Math.random() * 1000), // Generate a random ID
                    username: userData.username,
                    email: userData.email,
                    address: userData.address
                };
                
                // Store user info in localStorage
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('token', 'mock-jwt-token');
                
                resolve(user);
            }, 500); // Simulate network delay
        });
    },
    
    // Check if user is logged in
    isLoggedIn() {
        return localStorage.getItem('isLoggedIn') === 'true';
    },
    
    // Get current user
    getCurrentUser() {
        const userJson = localStorage.getItem('user');
        return userJson ? JSON.parse(userJson) : null;
    },
    
    // Logout
    logout() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    }
}; 
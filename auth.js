document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const authError = document.getElementById('authError');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const adminId = document.getElementById('adminId').value.trim();
            const password = document.getElementById('password').value;
            
            // Reset error message
            authError.textContent = '';
            
            // Validate credentials
            if (adminId === ADMIN_CREDENTIALS.userId && password === ADMIN_CREDENTIALS.password) {
                // Successful login
                localStorage.setItem('adminAuthenticated', 'true');
                window.location.href = 'dashboard.html';
            } else {
                // Invalid credentials
                authError.textContent = 'Invalid admin ID or password';
            }
        });
    }
    
    // Check authentication state on other pages
    if (!window.location.pathname.includes('index.html')) {
        checkAdminAuth();
    }
});

// Check if admin is authenticated
function checkAdminAuth() {
    const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
    
    if (!isAuthenticated) {
        window.location.href = 'index.html';
    }
}

// Logout function
function logoutAdmin() {
    localStorage.removeItem('adminAuthenticated');
    window.location.href = 'index.html';
}
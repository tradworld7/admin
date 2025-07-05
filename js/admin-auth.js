document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const authError = document.getElementById('authError');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const adminId = document.getElementById('adminId').value.trim();
        const password = document.getElementById('password').value;
        
        authError.textContent = '';
        
        if (adminId === ADMIN_CREDENTIALS.userId && password === ADMIN_CREDENTIALS.password) {
            localStorage.setItem('adminAuthenticated', 'true');
            window.location.href = 'dashboard.html';
        } else {
            authError.textContent = 'Invalid admin ID or password';
        }
    });
});

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBshAGZScyo7PJegLHMzORbkkrCLGD6U5s",
    authDomain: "mywebsite-600d3.firebaseapp.com",
    databaseURL: "https://mywebsite-600d3-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "mywebsite-600d3",
    storageBucket: "mywebsite-600d3.appspot.com",
    messagingSenderId: "584485288598",
    appId: "1:584485288598:web:01856eaa18ba5ada49e0b7",
    measurementId: "G-GQ9J9QH42J"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

// Admin credentials
const ADMIN_EMAIL = "rkv858810@gmail.com";
const ADMIN_PASSWORD = "123@Ramesh";

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('loginError');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginSpinner = document.getElementById('loginSpinner');
    
    // Validate inputs
    if (!email || !password) {
        errorElement.textContent = 'Please enter both email and password';
        return;
    }
    
    errorElement.textContent = '';
    loginBtnText.textContent = 'Logging in...';
    loginSpinner.style.display = 'inline-block';
    
    // Sign in with email and password
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Check if logged in user is admin
            if (userCredential.user.email === ADMIN_EMAIL) {
                // Store authentication state
                localStorage.setItem('adminAuthenticated', 'true');
                localStorage.setItem('adminEmail', ADMIN_EMAIL);
                
                // Redirect to dashboard
                window.location.href = '../index.html';
            } else {
                // Not admin - sign them out
                auth.signOut();
                throw new Error('Access denied. Admin privileges required.');
            }
        })
        .catch((error) => {
            console.error("Login error:", error);
            
            // Reset button state
            loginBtnText.textContent = 'Login';
            loginSpinner.style.display = 'none';
            
            // Show error message
            switch (error.code) {
                case 'auth/invalid-email':
                    errorElement.textContent = 'Invalid email address';
                    break;
                case 'auth/user-disabled':
                    errorElement.textContent = 'This account has been disabled';
                    break;
                case 'auth/user-not-found':
                    errorElement.textContent = 'No admin found with this email';
                    break;
                case 'auth/wrong-password':
                    errorElement.textContent = 'Incorrect password';
                    break;
                default:
                    errorElement.textContent = error.message || 'Login failed. Please try again.';
            }
        });
});

// Password reset function
function resetPassword() {
    const email = prompt("Please enter your admin email address:");
    if (email) {
        if (email === ADMIN_EMAIL) {
            auth.sendPasswordResetEmail(email)
                .then(() => {
                    alert("Password reset email sent to " + email);
                })
                .catch((error) => {
                    alert("Error sending reset email: " + error.message);
                });
        } else {
            alert("Only admin email can reset password");
        }
    }
}

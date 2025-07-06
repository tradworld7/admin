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
            // Store authentication state
            localStorage.setItem('adminAuthenticated', 'true');
            localStorage.setItem('adminId', userCredential.user.uid);
            
            // Redirect to dashboard
            window.location.href = '../index.html';
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
                    errorElement.textContent = 'No user found with this email';
                    break;
                case 'auth/wrong-password':
                    errorElement.textContent = 'Incorrect password';
                    break;
                default:
                    errorElement.textContent = 'Login failed. Please try again.';
            }
        });
});
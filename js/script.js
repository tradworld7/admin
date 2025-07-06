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
const database = firebase.database();

// Initialize admin user in database
function initializeAdminUser(user) {
    const adminEmail = 'rkv858810@gmail.com';
    
    if (user && user.email === adminEmail) {
        database.ref('admins/' + user.uid).once('value').then(snapshot => {
            if (!snapshot.exists()) {
                database.ref('admins/' + user.uid).set({
                    email: adminEmail,
                    createdAt: Date.now(),
                    permissions: {
                        manageUsers: true,
                        manageTransactions: true,
                        manageInvestments: true
                    }
                });
            }
        });
    }
}

// Check if admin is authenticated
function checkAdminAuth() {
    const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
    if (!isAuthenticated) {
        window.location.href = 'auth/login.html';
        return false;
    }
    return true;
}

// [Rest of your existing functions remain exactly the same...]
// (showToast, formatDate, formatCurrency, loadDashboardData, loadRecentActivity, 
//  addFundsToUser, resetAddFundsButton, setupDashboardEventListeners)

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    auth.onAuthStateChanged(user => {
        if (user) {
            // Initialize admin user in database
            initializeAdminUser(user);
            
            // User is signed in
            localStorage.setItem('adminAuthenticated', 'true');
            localStorage.setItem('adminId', user.uid);
            
            // Set admin name
            document.getElementById('adminName').textContent = user.email || 'Admin';
            
            // Load data
            loadDashboardData();
            setupDashboardEventListeners();
        } else {
            // User is signed out
            localStorage.removeItem('adminAuthenticated');
            localStorage.removeItem('adminId');
            window.location.href = 'auth/login.html';
        }
    });

    // Check if we have authentication in localStorage (fallback)
    if (!checkAdminAuth()) return;
});

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
const ADMIN_EMAIL = "rkv858810@gmail.com";

// Copy to clipboard function
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent || element.innerText;
    navigator.clipboard.writeText(text).then(() => {
        showToast("Copied to clipboard", "success");
    }).catch(err => {
        console.error('Failed to copy: ', err);
        showToast("Failed to copy", "error");
    });
}

// Paste from clipboard function
async function pasteFromClipboard(elementId) {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById(elementId).value = text;
        showToast("Pasted from clipboard", "success");
    } catch (err) {
        console.error('Failed to paste: ', err);
        showToast("Failed to paste", "error");
    }
}

// Make elements copyable
function makeCopyable(element) {
    if (!element) return;
    
    element.style.cursor = "pointer";
    element.title = "Click to copy";
    element.classList.add('copyable');
    element.addEventListener("click", function() {
        copyToClipboard(this.id || this);
    });
}

// Check if admin is authenticated
function checkAdminAuth() {
    const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
    const adminEmail = localStorage.getItem('adminEmail');
    
    if (!isAuthenticated || adminEmail !== ADMIN_EMAIL) {
        window.location.href = 'auth/login.html';
        return false;
    }
    return true;
}

// Show toast notification
function showToast(message, type) {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button class="toast-close">&times;</button>
    `;
    toastContainer.appendChild(toast);
    
    // Remove toast after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
    
    // Close button event
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.style.animation = 'slideIn 0.3s ease reverse forwards';
        setTimeout(() => toast.remove(), 300);
    });
}

// Format timestamp to readable date
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Format currency
function formatCurrency(amount) {
    return '$' + parseFloat(amount || 0).toFixed(2);
}

// Load all dashboard data
function loadDashboardData() {
    // Load total users count
    database.ref('users').once('value').then(snapshot => {
        const userCount = snapshot.exists() ? snapshot.numChildren() : 0;
        const totalUsersElement = document.getElementById('totalUsers');
        totalUsersElement.textContent = userCount;
        makeCopyable(totalUsersElement);
    }).catch(error => {
        console.error("Error loading users:", error);
        showToast("Error loading user data", "error");
    });

    // Load active investments count
    database.ref('investments').orderByChild('status').equalTo('active').once('value').then(snapshot => {
        const activeInvestments = snapshot.exists() ? snapshot.numChildren() : 0;
        const activeInvestmentsElement = document.getElementById('activeInvestments');
        activeInvestmentsElement.textContent = activeInvestments;
        makeCopyable(activeInvestmentsElement);
    }).catch(error => {
        console.error("Error loading investments:", error);
        showToast("Error loading investment data", "error");
    });

    // Load total deposits amount
    database.ref('transactions').orderByChild('type').equalTo('deposit').once('value').then(snapshot => {
        let totalDeposits = 0;
        if (snapshot.exists()) {
            snapshot.forEach(child => {
                const amount = parseFloat(child.val().amount) || 0;
                totalDeposits += amount;
            });
        }
        const totalDepositsElement = document.getElementById('totalDeposits');
        totalDepositsElement.textContent = formatCurrency(totalDeposits);
        makeCopyable(totalDepositsElement);
    }).catch(error => {
        console.error("Error loading deposits:", error);
        showToast("Error loading deposit data", "error");
    });

    // Load pending withdrawals count
    database.ref('transactions').orderByChild('status').equalTo('pending').once('value').then(snapshot => {
        let pendingWithdrawals = 0;
        if (snapshot.exists()) {
            snapshot.forEach(child => {
                if (child.val().type === 'withdrawal') {
                    pendingWithdrawals++;
                }
            });
        }
        const pendingWithdrawalsElement = document.getElementById('pendingWithdrawals');
        pendingWithdrawalsElement.textContent = pendingWithdrawals;
        makeCopyable(pendingWithdrawalsElement);
    }).catch(error => {
        console.error("Error loading withdrawals:", error);
        showToast("Error loading withdrawal data", "error");
    });

    // Load recent activity (last 10 transactions)
    loadRecentActivity();
}

// Load recent activity
function loadRecentActivity() {
    database.ref('transactions').orderByChild('timestamp').limitToLast(10).once('value').then(snapshot => {
        const tbody = document.getElementById('activityTableBody');
        tbody.innerHTML = '';
        
        if (!snapshot.exists()) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No recent activity</td></tr>';
            return;
        }

        // Convert to array and reverse to show newest first
        const transactions = [];
        snapshot.forEach(child => {
            transactions.push({
                id: child.key,
                ...child.val()
            });
        });
        transactions.reverse();

        // Populate table
        transactions.forEach(tx => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(tx.timestamp)}</td>
                <td class="copyable-user-id">${tx.userId || 'System'}</td>
                <td>${tx.type || 'N/A'}</td>
                <td>${formatCurrency(tx.amount)}</td>
                <td class="status-${tx.status || 'completed'}">${tx.status || 'completed'}</td>
            `;
            tbody.appendChild(row);
            
            // Make user ID copyable
            const userIdCell = row.querySelector('.copyable-user-id');
            makeCopyable(userIdCell);
        });
    }).catch(error => {
        console.error("Error loading activity:", error);
        showToast("Error loading recent activity", "error");
        document.getElementById('activityTableBody').innerHTML = 
            '<tr><td colspan="5" class="text-center">Error loading activity</td></tr>';
    });
}

// Add funds to user account
function addFundsToUser() {
    const userId = document.getElementById('userId').value.trim();
    const amount = parseFloat(document.getElementById('fundAmount').value);
    const note = document.getElementById('fundNote').value.trim();
    const errorElement = document.getElementById('addFundsError');
    const addFundsBtnText = document.getElementById('addFundsBtnText');
    const addFundsSpinner = document.getElementById('addFundsSpinner');

    // Validate inputs
    if (!userId) {
        errorElement.textContent = 'Please enter a user ID';
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        errorElement.textContent = 'Please enter a valid amount greater than 0';
        return;
    }

    errorElement.textContent = '';
    addFundsBtnText.textContent = 'Processing...';
    addFundsSpinner.style.display = 'inline-block';
    
    // Check if user exists
    database.ref('users/' + userId).once('value').then(snapshot => {
        if (!snapshot.exists()) {
            errorElement.textContent = 'User not found';
            resetAddFundsButton();
            return;
        }

        const user = snapshot.val();
        const currentBalance = parseFloat(user.balance) || 0;
        const newBalance = currentBalance + amount;
        const txId = database.ref().child('transactions').push().key;
        const timestamp = Date.now();
        const adminId = localStorage.getItem('adminId') || 'admin';

        const updates = {};
        updates[`users/${userId}/balance`] = newBalance;
        updates[`transactions/${txId}`] = {
            userId: userId,
            type: 'admin_deposit',
            amount: amount,
            status: 'completed',
            timestamp: timestamp,
            details: note || 'Admin added funds',
            processedBy: adminId
        };

        // Update database
        database.ref().update(updates).then(() => {
            showToast(`Successfully added ${formatCurrency(amount)} to user ${userId}`, "success");
            document.getElementById('addFundsModal').classList.remove('active');
            // Clear form
            document.getElementById('userId').value = '';
            document.getElementById('fundAmount').value = '';
            document.getElementById('fundNote').value = '';
            // Refresh dashboard data
            loadDashboardData();
        }).catch(error => {
            console.error("Error adding funds:", error);
            errorElement.textContent = 'Error adding funds. Please try again.';
            showToast("Error adding funds", "error");
        }).finally(() => {
            resetAddFundsButton();
        });
    }).catch(error => {
        console.error("Error checking user:", error);
        errorElement.textContent = 'Error checking user. Please try again.';
        showToast("Error checking user", "error");
        resetAddFundsButton();
    });
}

// Reset add funds button state
function resetAddFundsButton() {
    document.getElementById('addFundsBtnText').textContent = 'Add Funds';
    document.getElementById('addFundsSpinner').style.display = 'none';
}

// Setup all event listeners
function setupDashboardEventListeners() {
    // Menu toggle for mobile
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });

    // Add funds button - open modal
    document.getElementById('addFundsBtn').addEventListener('click', () => {
        document.getElementById('addFundsModal').classList.add('active');
    });

    // Approve withdrawals button - redirect to transactions page
    document.getElementById('approveWithdrawalsBtn').addEventListener('click', () => {
        window.location.href = 'transactions.html?type=withdrawal&status=pending';
    });

    // View transactions button - redirect to transactions page
    document.getElementById('viewTransactionsBtn').addEventListener('click', () => {
        window.location.href = 'transactions.html';
    });

    // Refresh activity button
    document.getElementById('refreshActivity').addEventListener('click', () => {
        loadRecentActivity();
        showToast("Recent activity refreshed", "success");
    });

    // Modal close buttons
    document.querySelectorAll('.modal-close, #cancelAddFunds').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('addFundsModal').classList.remove('active');
            // Clear form and errors
            document.getElementById('userId').value = '';
            document.getElementById('fundAmount').value = '';
            document.getElementById('fundNote').value = '';
            document.getElementById('addFundsError').textContent = '';
            resetAddFundsButton();
        });
    });

    // Confirm add funds
    document.getElementById('confirmAddFunds').addEventListener('click', addFundsToUser);

    // Logout functionality
    document.querySelectorAll('#logoutBtn, #logoutLink').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            // Clear authentication
            localStorage.removeItem('adminAuthenticated');
            localStorage.removeItem('adminId');
            localStorage.removeItem('adminEmail');
            // Sign out from Firebase
            auth.signOut().then(() => {
                // Redirect to login page
                window.location.href = 'auth/login.html';
            }).catch(error => {
                console.error("Logout error:", error);
                showToast("Logout failed. Please try again.", "error");
            });
        });
    });
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    auth.onAuthStateChanged(user => {
        if (user && user.email === ADMIN_EMAIL) {
            // User is signed in and is admin
            localStorage.setItem('adminAuthenticated', 'true');
            localStorage.setItem('adminId', user.uid);
            localStorage.setItem('adminEmail', user.email);
            
            // Set admin name
            document.getElementById('adminName').textContent = user.email;
            
            // Load data
            loadDashboardData();
            setupDashboardEventListeners();
        } else {
            // User is signed out or not admin
            localStorage.removeItem('adminAuthenticated');
            localStorage.removeItem('adminId');
            localStorage.removeItem('adminEmail');
            window.location.href = 'auth/login.html';
        }
    });

    // Check if we have authentication in localStorage (fallback)
    if (!checkAdminAuth()) return;
});

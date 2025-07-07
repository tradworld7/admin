// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBshAGZScyo7PJegLHMzORbkkrCLGD6U5s",
    authDomain: "mywebsite-600d3.firebaseapp.com",
    databaseURL: "https://mywebsite-600d3-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "mywebsite-600d3",
    storageBucket: "mywebsite-600d3.firebasestorage.app",
    messagingSenderId: "584485288598",
    appId: "1:584485288598:web:01856eaa18ba5ada49e0b7",
    measurementId: "G-GQ9J9QH42J"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// Admin credentials
const ADMIN_EMAIL = "rkv858810@gmail.com";
const ADMIN_PASSWORD = "123@Ramesh";

// DOM elements
const loginContainer = document.getElementById('login-container');
const adminDashboard = document.getElementById('admin-dashboard');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

// Current user data
let currentUser = null;
let usersData = {};
let depositsData = {};
let withdrawalsData = {};
let transactionsData = {};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    auth.onAuthStateChanged(user => {
        if (user && user.email === ADMIN_EMAIL) {
            currentUser = user;
            showAdminDashboard();
            loadData();
        } else {
            showLogin();
        }
    });
});

// Login function
function login() {
    const email = emailInput.value;
    const password = passwordInput.value;
    
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            currentUser = userCredential.user;
            if (currentUser.email === ADMIN_EMAIL) {
                showAdminDashboard();
                loadData();
            } else {
                alert('You are not authorized to access this panel');
                logout();
            }
        })
        .catch(error => {
            alert('Login failed: ' + error.message);
            console.error('Login error:', error);
        });
}

// Logout function
function logout() {
    auth.signOut().then(() => {
        currentUser = null;
        showLogin();
    }).catch(error => {
        console.error('Logout error:', error);
    });
}

// Show login screen
function showLogin() {
    loginContainer.style.display = 'flex';
    adminDashboard.style.display = 'none';
    emailInput.value = '';
    passwordInput.value = '';
}

// Show admin dashboard
function showAdminDashboard() {
    loginContainer.style.display = 'none';
    adminDashboard.style.display = 'block';
    showSection('dashboard-section');
}

// Show specific section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show the selected section
    document.getElementById(sectionId).style.display = 'block';
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Find the link that corresponds to this section
    const links = document.querySelectorAll('.nav-link');
    for (let link of links) {
        if (link.getAttribute('onclick').includes(sectionId)) {
            link.classList.add('active');
            break;
        }
    }
}

// Load all data from Firebase
function loadData() {
    if (!currentUser) return;
    
    // Load users
    database.ref('users').on('value', snapshot => {
        usersData = snapshot.val() || {};
        updateUsersTable();
        updateDashboardStats();
    });
    
    // Load deposits
    database.ref('deposits').on('value', snapshot => {
        depositsData = snapshot.val() || {};
        updateDepositsTable();
        updateDashboardStats();
    });
    
    // Load withdrawals
    database.ref('withdrawals').on('value', snapshot => {
        withdrawalsData = snapshot.val() || {};
        updateWithdrawalsTable();
        updateDashboardStats();
    });
    
    // Load transactions
    database.ref('transactions').on('value', snapshot => {
        transactionsData = snapshot.val() || {};
        updateTransactionsTable();
        updateRecentActivity();
    });
}

// Update dashboard statistics
function updateDashboardStats() {
    // Total users
    document.getElementById('total-users').textContent = Object.keys(usersData).length;
    
    // Total deposits (sum of all approved deposits)
    let totalDeposits = 0;
    for (let depositId in depositsData) {
        if (depositsData[depositId].status === 'approved') {
            totalDeposits += parseFloat(depositsData[depositId].amount) || 0;
        }
    }
    document.getElementById('total-deposits').textContent = '$' + totalDeposits.toFixed(2);
    
    // Total withdrawals (sum of all approved withdrawals)
    let totalWithdrawals = 0;
    for (let withdrawalId in withdrawalsData) {
        if (withdrawalsData[withdrawalId].status === 'approved') {
            totalWithdrawals += parseFloat(withdrawalsData[withdrawalId].amount) || 0;
        }
    }
    document.getElementById('total-withdrawals').textContent = '$' + totalWithdrawals.toFixed(2);
}

// Update recent activity
function updateRecentActivity() {
    const activityList = document.getElementById('recent-activity');
    activityList.innerHTML = '';
    
    // Get all transactions and sort by date (newest first)
    const allTransactions = [];
    
    for (let userId in transactionsData) {
        for (let transactionId in transactionsData[userId]) {
            const transaction = transactionsData[userId][transactionId];
            transaction.userId = userId;
            transaction.id = transactionId;
            allTransactions.push(transaction);
        }
    }
    
    allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Show only the 10 most recent activities
    const recentActivities = allTransactions.slice(0, 10);
    
    recentActivities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const icon = document.createElement('div');
        icon.className = 'activity-icon';
        
        let iconClass = 'fa-exchange-alt';
        if (activity.type === 'deposit') iconClass = 'fa-money-bill-wave';
        if (activity.type === 'withdrawal') iconClass = 'fa-wallet';
        if (activity.type === 'admin_credit') iconClass = 'fa-gift';
        
        icon.innerHTML = `<i class="fas ${iconClass}"></i>`;
        
        const content = document.createElement('div');
        content.className = 'activity-content';
        
        const title = document.createElement('h5');
        title.className = 'activity-title';
        
        let titleText = '';
        if (activity.type === 'deposit') titleText = `Deposit of $${activity.amount}`;
        if (activity.type === 'withdrawal') titleText = `Withdrawal of $${activity.amount}`;
        if (activity.type === 'admin_credit') titleText = `Admin credit of $${activity.amount}`;
        
        title.textContent = titleText;
        
        const time = document.createElement('p');
        time.className = 'activity-time';
        time.textContent = new Date(activity.timestamp).toLocaleString();
        
        content.appendChild(title);
        content.appendChild(time);
        
        activityItem.appendChild(icon);
        activityItem.appendChild(content);
        
        activityList.appendChild(activityItem);
    });
}

// Update users table
function updateUsersTable() {
    const usersTable = document.getElementById('users-table');
    usersTable.innerHTML = '';
    
    for (let userId in usersData) {
        const user = usersData[userId];
        
        const row = document.createElement('tr');
        
        // User ID with copy button
        const userIdCell = document.createElement('td');
        userIdCell.innerHTML = `
            ${userId}
            <button class="copy-btn" onclick="copyToClipboard('${userId}')">
                <i class="far fa-copy"></i>
            </button>
        `;
        
        // Name
        const nameCell = document.createElement('td');
        nameCell.textContent = user.name || 'N/A';
        
        // Email
        const emailCell = document.createElement('td');
        emailCell.textContent = user.email || 'N/A';
        
        // Balance
        const balanceCell = document.createElement('td');
        balanceCell.textContent = '$' + (user.balance || '0.00');
        
        // Join Date
        const joinDateCell = document.createElement('td');
        joinDateCell.textContent = user.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'N/A';
        
        // Actions
        const actionsCell = document.createElement('td');
        actionsCell.innerHTML = `
            <button class="btn btn-sm btn-primary" onclick="showSendMoneyModal('${userId}')">
                <i class="fas fa-paper-plane"></i> Send Money
            </button>
        `;
        
        row.appendChild(userIdCell);
        row.appendChild(nameCell);
        row.appendChild(emailCell);
        row.appendChild(balanceCell);
        row.appendChild(joinDateCell);
        row.appendChild(actionsCell);
        
        usersTable.appendChild(row);
    }
}

// Update deposits table
function updateDepositsTable() {
    const depositsTable = document.getElementById('deposits-table');
    depositsTable.innerHTML = '';
    
    for (let depositId in depositsData) {
        const deposit = depositsData[depositId];
        const user = usersData[deposit.userId] || {};
        
        const row = document.createElement('tr');
        
        // User ID
        const userIdCell = document.createElement('td');
        userIdCell.textContent = deposit.userId;
        
        // Name
        const nameCell = document.createElement('td');
        nameCell.textContent = user.name || 'N/A';
        
        // Amount
        const amountCell = document.createElement('td');
        amountCell.textContent = '$' + deposit.amount;
        
        // Transaction Hash
        const hashCell = document.createElement('td');
        hashCell.textContent = deposit.transactionHash || 'N/A';
        
        // Date
        const dateCell = document.createElement('td');
        dateCell.textContent = deposit.timestamp ? new Date(deposit.timestamp).toLocaleString() : 'N/A';
        
        // Status
        const statusCell = document.createElement('td');
        const statusBadge = document.createElement('span');
        statusBadge.className = `badge badge-${deposit.status === 'approved' ? 'success' : 
                                deposit.status === 'rejected' ? 'danger' : 'warning'}`;
        statusBadge.textContent = deposit.status || 'pending';
        statusCell.appendChild(statusBadge);
        
        // Actions
        const actionsCell = document.createElement('td');
        if (deposit.status === 'pending') {
            actionsCell.innerHTML = `
                <button class="btn btn-sm btn-success" onclick="approveDeposit('${depositId}')">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn btn-sm btn-danger" onclick="rejectDeposit('${depositId}')">
                    <i class="fas fa-times"></i> Reject
                </button>
            `;
        } else {
            actionsCell.textContent = 'No actions available';
        }
        
        row.appendChild(userIdCell);
        row.appendChild(nameCell);
        row.appendChild(amountCell);
        row.appendChild(hashCell);
        row.appendChild(dateCell);
        row.appendChild(statusCell);
        row.appendChild(actionsCell);
        
        depositsTable.appendChild(row);
    }
}

// Update withdrawals table
function updateWithdrawalsTable() {
    const withdrawalsTable = document.getElementById('withdrawals-table');
    withdrawalsTable.innerHTML = '';
    
    for (let withdrawalId in withdrawalsData) {
        const withdrawal = withdrawalsData[withdrawalId];
        const user = usersData[withdrawal.userId] || {};
        
        const row = document.createElement('tr');
        
        // User ID
        const userIdCell = document.createElement('td');
        userIdCell.textContent = withdrawal.userId;
        
        // Name
        const nameCell = document.createElement('td');
        nameCell.textContent = user.name || 'N/A';
        
        // Amount
        const amountCell = document.createElement('td');
        amountCell.textContent = '$' + withdrawal.amount;
        
        // Wallet Address
        const addressCell = document.createElement('td');
        addressCell.innerHTML = `
            ${withdrawal.walletAddress}
            <button class="copy-btn" onclick="copyToClipboard('${withdrawal.walletAddress}')">
                <i class="far fa-copy"></i>
            </button>
        `;
        
        // Date
        const dateCell = document.createElement('td');
        dateCell.textContent = withdrawal.timestamp ? new Date(withdrawal.timestamp).toLocaleString() : 'N/A';
        
        // Status
        const statusCell = document.createElement('td');
        const statusBadge = document.createElement('span');
        statusBadge.className = `badge badge-${withdrawal.status === 'approved' ? 'success' : 
                                withdrawal.status === 'rejected' ? 'danger' : 'warning'}`;
        statusBadge.textContent = withdrawal.status || 'pending';
        statusCell.appendChild(statusBadge);
        
        // Actions
        const actionsCell = document.createElement('td');
        if (withdrawal.status === 'pending') {
            actionsCell.innerHTML = `
                <button class="btn btn-sm btn-success" onclick="approveWithdrawal('${withdrawalId}')">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn btn-sm btn-danger" onclick="rejectWithdrawal('${withdrawalId}')">
                    <i class="fas fa-times"></i> Reject
                </button>
            `;
        } else {
            actionsCell.textContent = 'No actions available';
        }
        
        row.appendChild(userIdCell);
        row.appendChild(nameCell);
        row.appendChild(amountCell);
        row.appendChild(addressCell);
        row.appendChild(dateCell);
        row.appendChild(statusCell);
        row.appendChild(actionsCell);
        
        withdrawalsTable.appendChild(row);
    }
}

// Update transactions table
function updateTransactionsTable() {
    const transactionsTable = document.getElementById('transactions-table');
    transactionsTable.innerHTML = '';
    
    for (let userId in transactionsData) {
        const user = usersData[userId] || {};
        
        for (let transactionId in transactionsData[userId]) {
            const transaction = transactionsData[userId][transactionId];
            
            const row = document.createElement('tr');
            
            // User ID
            const userIdCell = document.createElement('td');
            userIdCell.textContent = userId;
            
            // Type
            const typeCell = document.createElement('td');
            let typeText = '';
            if (transaction.type === 'deposit') typeText = 'Deposit';
            if (transaction.type === 'withdrawal') typeText = 'Withdrawal';
            if (transaction.type === 'admin_credit') typeText = 'Admin Credit';
            typeCell.textContent = typeText;
            
            // Amount
            const amountCell = document.createElement('td');
            amountCell.textContent = '$' + transaction.amount;
            
            // Details
            const detailsCell = document.createElement('td');
            detailsCell.textContent = transaction.description || 'N/A';
            
            // Date
            const dateCell = document.createElement('td');
            dateCell.textContent = transaction.timestamp ? new Date(transaction.timestamp).toLocaleString() : 'N/A';
            
            // Status
            const statusCell = document.createElement('td');
            const statusBadge = document.createElement('span');
            statusBadge.className = `badge badge-${transaction.status === 'completed' ? 'success' : 
                                    transaction.status === 'failed' ? 'danger' : 'warning'}`;
            statusBadge.textContent = transaction.status || 'pending';
            statusCell.appendChild(statusBadge);
            
            row.appendChild(userIdCell);
            row.appendChild(typeCell);
            row.appendChild(amountCell);
            row.appendChild(detailsCell);
            row.appendChild(dateCell);
            row.appendChild(statusCell);
            
            transactionsTable.appendChild(row);
        }
    }
}

// Show send money modal
function showSendMoneyModal(userId) {
    const user = usersData[userId];
    if (!user) return;
    
    document.getElementById('send-user-id').value = userId;
    document.getElementById('send-user-name').value = user.name || 'N/A';
    document.getElementById('send-amount').value = '';
    document.getElementById('send-description').value = '';
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('sendMoneyModal'));
    modal.show();
}

// Send money to user
function sendMoney() {
    const userId = document.getElementById('send-user-id').value;
    const amount = parseFloat(document.getElementById('send-amount').value);
    const description = document.getElementById('send-description').value;
    
    if (!userId || !amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    const userRef = database.ref('users/' + userId);
    
    // Get current balance
    userRef.once('value').then(snapshot => {
        const user = snapshot.val();
        const currentBalance = parseFloat(user.balance) || 0;
        const newBalance = currentBalance + amount;
        
        // Update user balance
        userRef.update({
            balance: newBalance
        }).then(() => {
            // Record transaction
            const transactionRef = database.ref('transactions/' + userId).push();
            transactionRef.set({
                type: 'admin_credit',
                amount: amount,
                description: description || 'Admin credit',
                status: 'completed',
                timestamp: firebase.database.ServerValue.TIMESTAMP
            }).then(() => {
                alert('Money sent successfully!');
                // Hide modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('sendMoneyModal'));
                modal.hide();
            });
        });
    }).catch(error => {
        console.error('Error sending money:', error);
        alert('Error sending money: ' + error.message);
    });
}

// Approve deposit
function approveDeposit(depositId) {
    const deposit = depositsData[depositId];
    if (!deposit) return;
    
    const depositRef = database.ref('deposits/' + depositId);
    const userRef = database.ref('users/' + deposit.userId);
    
    // Update deposit status
    depositRef.update({
        status: 'approved'
    }).then(() => {
        // Get current balance
        userRef.once('value').then(snapshot => {
            const user = snapshot.val();
            const currentBalance = parseFloat(user.balance) || 0;
            const depositAmount = parseFloat(deposit.amount) || 0;
            const newBalance = currentBalance + depositAmount;
            
            // Update user balance
            userRef.update({
                balance: newBalance
            }).then(() => {
                // Record transaction
                const transactionRef = database.ref('transactions/' + deposit.userId).push();
                transactionRef.set({
                    type: 'deposit',
                    amount: deposit.amount,
                    description: 'Deposit approved',
                    status: 'completed',
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });
            });
        });
    }).catch(error => {
        console.error('Error approving deposit:', error);
        alert('Error approving deposit: ' + error.message);
    });
}

// Reject deposit
function rejectDeposit(depositId) {
    const depositRef = database.ref('deposits/' + depositId);
    
    depositRef.update({
        status: 'rejected'
    }).then(() => {
        // Record transaction
        const deposit = depositsData[depositId];
        const transactionRef = database.ref('transactions/' + deposit.userId).push();
        transactionRef.set({
            type: 'deposit',
            amount: deposit.amount,
            description: 'Deposit rejected',
            status: 'failed',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    }).catch(error => {
        console.error('Error rejecting deposit:', error);
        alert('Error rejecting deposit: ' + error.message);
    });
}

// Approve withdrawal
function approveWithdrawal(withdrawalId) {
    const withdrawal = withdrawalsData[withdrawalId];
    if (!withdrawal) return;
    
    const withdrawalRef = database.ref('withdrawals/' + withdrawalId);
    
    // Update withdrawal status
    withdrawalRef.update({
        status: 'approved'
    }).then(() => {
        // Record transaction
        const transactionRef = database.ref('transactions/' + withdrawal.userId).push();
        transactionRef.set({
            type: 'withdrawal',
            amount: withdrawal.amount,
            description: 'Withdrawal approved to ' + withdrawal.walletAddress,
            status: 'completed',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    }).catch(error => {
        console.error('Error approving withdrawal:', error);
        alert('Error approving withdrawal: ' + error.message);
    });
}

// Reject withdrawal
function rejectWithdrawal(withdrawalId) {
    const withdrawal = withdrawalsData[withdrawalId];
    if (!withdrawal) return;
    
    const withdrawalRef = database.ref('withdrawals/' + withdrawalId);
    const userRef = database.ref('users/' + withdrawal.userId);
    
    // Update withdrawal status
    withdrawalRef.update({
        status: 'rejected'
    }).then(() => {
        // Return funds to user balance
        userRef.once('value').then(snapshot => {
            const user = snapshot.val();
            const currentBalance = parseFloat(user.balance) || 0;
            const withdrawalAmount = parseFloat(withdrawal.amount) || 0;
            const newBalance = currentBalance + withdrawalAmount;
            
            // Update user balance
            userRef.update({
                balance: newBalance
            }).then(() => {
                // Record transaction
                const transactionRef = database.ref('transactions/' + withdrawal.userId).push();
                transactionRef.set({
                    type: 'withdrawal',
                    amount: withdrawal.amount,
                    description: 'Withdrawal rejected - funds returned',
                    status: 'failed',
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });
            });
        });
    }).catch(error => {
        console.error('Error rejecting withdrawal:', error);
        alert('Error rejecting withdrawal: ' + error.message);
    });
}

// Copy text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard: ' + text);
    }).catch(err => {
        console.error('Could not copy text: ', err);
    });
}

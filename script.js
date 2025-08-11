// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { 
    getAuth, 
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js";
import { 
    getDatabase, 
    ref, 
    onValue, 
    set, 
    update, 
    push,
    get,
    remove
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-database.js";

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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// DOM Elements
const adminSections = document.querySelectorAll('.admin-section');
const adminMenuLinks = document.querySelectorAll('.admin-menu li a');
const adminLogoutBtn = document.getElementById('adminLogout');
const toastContainer = document.getElementById('adminToastContainer');

// Admin Data
let currentAdmin = null;
let systemSettings = {
    adminCommission: 0.6,
    directCommission: 0.1,
    levelCommissions: [0.02, 0.02, 0.02, 0.02, 0.02],
    profitPercentage: 0.2
};
let usersData = [];
let transactionsData = [];
let pendingDeposits = [];
let pendingWithdrawals = [];

// Initialize Admin Panel
document.addEventListener('DOMContentLoaded', () => {
    // Check admin authentication
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentAdmin = user;
            loadAdminData();
            setupEventListeners();
        } else {
            // Redirect to login if not authenticated
            window.location.href = '../login.html';
        }
    });
});

function loadAdminData() {
    // Load system settings
    loadSystemSettings();
    
    // Load users data
    loadUsersData();
    
    // Load transactions data
    loadTransactionsData();
    
    // Load pending deposits and withdrawals
    loadPendingDeposits();
    loadPendingWithdrawals();
}

function loadSystemSettings() {
    const settingsRef = ref(database, 'system/settings');
    
    onValue(settingsRef, (snapshot) => {
        if (snapshot.exists()) {
            systemSettings = snapshot.val();
            updateSettingsForm();
            updateStats();
        } else {
            // Set default settings if none exist
            set(ref(database, 'system/settings'), systemSettings);
        }
    });
}

function loadUsersData() {
    const usersRef = ref(database, 'users');
    
    onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
            usersData = Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data }));
            updateUsersTable();
            updateStats();
        }
    });
}

function loadTransactionsData() {
    const transactionsRef = ref(database, 'transactions');
    
    onValue(transactionsRef, (snapshot) => {
        if (snapshot.exists()) {
            transactionsData = Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data }));
            updateTransactionsTable();
            updateStats();
        }
    });
}

function loadPendingDeposits() {
    const depositsRef = ref(database, 'pendingDeposits');
    
    onValue(depositsRef, (snapshot) => {
        if (snapshot.exists()) {
            pendingDeposits = Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data }));
            updateTransactionsTable();
            updateStats();
        } else {
            pendingDeposits = [];
            updateTransactionsTable();
            updateStats();
        }
    });
}

function loadPendingWithdrawals() {
    const withdrawalsRef = ref(database, 'pendingWithdrawals');
    
    onValue(withdrawalsRef, (snapshot) => {
        if (snapshot.exists()) {
            pendingWithdrawals = Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data }));
            updateTransactionsTable();
            updateStats();
        } else {
            pendingWithdrawals = [];
            updateTransactionsTable();
            updateStats();
        }
    });
}

function updateStats() {
    document.getElementById('totalUsers').textContent = usersData.length;
    
    // Calculate total deposits and withdrawals
    const totalDeposits = transactionsData
        .filter(tx => tx.type === 'deposit' && tx.status === 'completed')
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);
        
    const totalWithdrawals = transactionsData
        .filter(tx => tx.type === 'withdrawal' && tx.status === 'completed')
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);
        
    const totalAdminProfit = transactionsData
        .filter(tx => tx.type === 'admin_profit')
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);
        
    const totalUserProfit = transactionsData
        .filter(tx => tx.type === 'user_profit')
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    document.getElementById('totalDeposits').textContent = '$' + totalDeposits.toFixed(2);
    document.getElementById('totalWithdrawals').textContent = '$' + totalWithdrawals.toFixed(2);
    document.getElementById('adminProfit').textContent = '$' + totalAdminProfit.toFixed(2);
    document.getElementById('userProfit').textContent = '$' + totalUserProfit.toFixed(2);
    document.getElementById('pendingActions').textContent = pendingDeposits.length + pendingWithdrawals.length;
}

function updateSettingsForm() {
    document.getElementById('adminCommission').value = (systemSettings.adminCommission * 100) || 60;
    document.getElementById('directCommission').value = (systemSettings.directCommission * 100) || 10;
    document.getElementById('profitPercentage').value = (systemSettings.profitPercentage * 100) || 20;
    
    const levelInputs = document.querySelectorAll('.level-input');
    levelInputs.forEach(input => {
        const level = input.dataset.level;
        input.value = (systemSettings.levelCommissions[level - 1] * 100) || 2;
    });
}

function updateUsersTable() {
    const tableBody = document.getElementById('usersTableBody');
    tableBody.innerHTML = '';
    
    usersData.forEach(user => {
        // Calculate user's total investments
        const userInvestments = transactionsData
            .filter(tx => tx.userId === user.id && tx.type === 'investment')
            .reduce((sum, tx) => sum + (tx.amount || 0), 0);
        
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${user.id.substring(0, 8)}...</td>
            <td>${user.name || 'N/A'}</td>
            <td>${user.email || 'N/A'}</td>
            <td>$${(user.balance || 0).toFixed(2)}</td>
            <td>$${userInvestments.toFixed(2)}</td>
            <td><span class="badge status-active">Active</span></td>
            <td>
                <button class="btn btn-small btn-danger" data-action="delete" data-user="${user.id}">Delete</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function updateTransactionsTable() {
    const tableBody = document.getElementById('transactionsTableBody');
    tableBody.innerHTML = '';
    
    // Combine all transactions and pending transactions
    const allTransactions = [
        ...transactionsData,
        ...pendingDeposits.map(d => ({ ...d, type: 'deposit', status: 'pending' })),
        ...pendingWithdrawals.map(w => ({ ...w, type: 'withdrawal', status: 'pending' }))
    ];
    
    // Sort by timestamp (newest first)
    allTransactions.sort((a, b) => (b.timestamp || b.createdAt) - (a.timestamp || a.createdAt));
    
    allTransactions.slice(0, 50).forEach(tx => {
        const row = document.createElement('tr');
        
        const date = new Date(tx.timestamp || tx.createdAt).toLocaleString();
        const isPending = tx.status === 'pending';
        
        row.innerHTML = `
            <td>${tx.id.substring(0, 8)}...</td>
            <td>${tx.userId ? tx.userId.substring(0, 8) + '...' : 'System'}</td>
            <td>${tx.type}</td>
            <td>$${(tx.amount || 0).toFixed(2)}</td>
            <td>${date}</td>
            <td><span class="badge status-${tx.status || 'completed'}">${tx.status || 'Completed'}</span></td>
            <td>
                ${isPending ? `
                <button class="btn btn-small btn-success" data-action="approve" data-tx="${tx.id}" data-type="${tx.type}">Approve</button>
                <button class="btn btn-small btn-danger" data-action="reject" data-tx="${tx.id}" data-type="${tx.type}">Reject</button>
                ` : ''}
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function setupEventListeners() {
    // Admin menu navigation
    adminMenuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all links
            adminMenuLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Hide all sections
            adminSections.forEach(section => section.classList.remove('active'));
            
            // Show selected section
            const sectionId = link.dataset.section + '-section';
            document.getElementById(sectionId).classList.add('active');
        });
    });
    
    // Admin logout
    adminLogoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = '../login.html';
        }).catch(error => {
            showToast('Logout failed: ' + error.message, 'error');
        });
    });
    
    // Save settings
    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
        const adminCommission = parseFloat(document.getElementById('adminCommission').value) / 100;
        const directCommission = parseFloat(document.getElementById('directCommission').value) / 100;
        const profitPercentage = parseFloat(document.getElementById('profitPercentage').value) / 100;
        
        const levelCommissions = [];
        document.querySelectorAll('.level-input').forEach(input => {
            levelCommissions.push(parseFloat(input.value) / 100);
        });
        
        const settings = {
            adminCommission,
            directCommission,
            levelCommissions,
            profitPercentage
        };
        
        set(ref(database, 'system/settings'), settings)
            .then(() => {
                showToast('Settings saved successfully', 'success');
            })
            .catch(error => {
                showToast('Failed to save settings: ' + error.message, 'error');
            });
    });
    
    // Users table actions
    document.getElementById('usersTableBody').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        
        const action = btn.dataset.action;
        const userId = btn.dataset.user;
        
        if (action === 'delete') {
            if (confirm('Are you sure you want to delete this user?')) {
                remove(ref(database, `users/${userId}`))
                    .then(() => {
                        showToast('User deleted successfully', 'success');
                    })
                    .catch(error => {
                        showToast('Failed to delete user: ' + error.message, 'error');
                    });
            }
        }
    });
    
    // Transactions table actions (approve/reject)
    document.getElementById('transactionsTableBody').addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        
        const action = btn.dataset.action;
        const txId = btn.dataset.tx;
        const txType = btn.dataset.type;
        
        if (action === 'approve') {
            if (txType === 'deposit') {
                // Approve deposit
                const depositRef = ref(database, `pendingDeposits/${txId}`);
                const depositSnapshot = await get(depositRef);
                
                if (depositSnapshot.exists()) {
                    const depositData = depositSnapshot.val();
                    const userRef = ref(database, `users/${depositData.userId}`);
                    
                    // Add to transactions history
                    const newTxRef = push(ref(database, 'transactions'));
                    const txData = {
                        userId: depositData.userId,
                        amount: depositData.amount,
                        type: 'deposit',
                        status: 'completed',
                        timestamp: Date.now()
                    };
                    
                    // Update user balance and add transaction
                    await set(newTxRef, txData);
                    
                    // Get current user balance
                    const userSnapshot = await get(userRef);
                    let currentBalance = 0;
                    if (userSnapshot.exists()) {
                        currentBalance = userSnapshot.val().balance || 0;
                    }
                    
                    // Update user balance
                    await update(userRef, {
                        balance: currentBalance + depositData.amount
                    });
                    
                    // Remove from pending deposits
                    await remove(depositRef);
                    
                    showToast('Deposit approved successfully', 'success');
                }
            } else if (txType === 'withdrawal') {
                // Approve withdrawal (no balance change needed as it was already deducted)
                const withdrawalRef = ref(database, `pendingWithdrawals/${txId}`);
                const withdrawalSnapshot = await get(withdrawalRef);
                
                if (withdrawalSnapshot.exists()) {
                    const withdrawalData = withdrawalSnapshot.val();
                    
                    // Add to transactions history
                    const newTxRef = push(ref(database, 'transactions'));
                    const txData = {
                        userId: withdrawalData.userId,
                        amount: withdrawalData.amount,
                        type: 'withdrawal',
                        status: 'completed',
                        timestamp: Date.now()
                    };
                    
                    await set(newTxRef, txData);
                    await remove(withdrawalRef);
                    
                    showToast('Withdrawal approved successfully', 'success');
                }
            }
        } else if (action === 'reject') {
            if (txType === 'deposit') {
                // Reject deposit - just remove from pending
                const depositRef = ref(database, `pendingDeposits/${txId}`);
                await remove(depositRef);
                showToast('Deposit rejected', 'success');
            } else if (txType === 'withdrawal') {
                // Reject withdrawal - return funds to user
                const withdrawalRef = ref(database, `pendingWithdrawals/${txId}`);
                const withdrawalSnapshot = await get(withdrawalRef);
                
                if (withdrawalSnapshot.exists()) {
                    const withdrawalData = withdrawalSnapshot.val();
                    const userRef = ref(database, `users/${withdrawalData.userId}`);
                    
                    // Get current user balance
                    const userSnapshot = await get(userRef);
                    let currentBalance = 0;
                    if (userSnapshot.exists()) {
                        currentBalance = userSnapshot.val().balance || 0;
                    }
                    
                    // Return funds to user
                    await update(userRef, {
                        balance: currentBalance + withdrawalData.amount
                    });
                    
                    // Add to transactions history
                    const newTxRef = push(ref(database, 'transactions'));
                    const txData = {
                        userId: withdrawalData.userId,
                        amount: withdrawalData.amount,
                        type: 'withdrawal',
                        status: 'rejected',
                        timestamp: Date.now()
                    };
                    
                    await set(newTxRef, txData);
                    await remove(withdrawalRef);
                    
                    showToast('Withdrawal rejected and funds returned', 'success');
                }
            }
        }
    });
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button class="toast-close">&times;</button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
}

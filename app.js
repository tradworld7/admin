// Firebase configuration - Replace with your actual config
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
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Admin details
const ADMIN_ID = "KtdjLWRdN5M5uOA1xDokUtrxfe93";

// Global Variables
let currentUser = null;
let currentDeposit = null;
let currentWithdrawal = null;
let currentEditingUser = null;
let currentEditingPackage = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Setup sidebar toggle
    document.getElementById('menuToggle').addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('open');
    });
    
    // Setup tab switching
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Setup deposit tabs
    document.querySelectorAll('#deposits-tab .tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchDepositTab(tabId);
        });
    });
    
    // Setup withdrawal tabs
    document.querySelectorAll('#withdrawals-tab .tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchWithdrawalTab(tabId);
        });
    });
    
    // Check if user is logged in
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            
            // Check if user is admin
            checkAdminStatus(user.uid);
            
            // Update user avatar
            updateUserAvatar(user.email || 'Admin');
            
            // Load initial data
            loadDashboardData();
        } else {
            // Redirect to login if not authenticated
            window.location.href = 'login.html';
        }
    });
    
    // Setup logout
    document.getElementById('logoutLink').addEventListener('click', (e) => {
        e.preventDefault();
        logoutUser();
    });
    
    // Setup deposit action change
    document.getElementById('depositAction').addEventListener('change', function() {
        document.getElementById('rejectReasonContainer').style.display = 
            this.value === 'reject' ? 'block' : 'none';
    });
    
    // Setup withdrawal action change
    document.getElementById('withdrawalAction').addEventListener('change', function() {
        document.getElementById('withdrawalRejectReasonContainer').style.display = 
            this.value === 'reject' ? 'block' : 'none';
    });
    
    // Setup process deposit button
    document.getElementById('processDepositBtn').addEventListener('click', processDeposit);
    
    // Setup cancel deposit button
    document.getElementById('cancelDepositBtn').addEventListener('click', function() {
        document.getElementById('depositModal').style.display = 'none';
    });
    
    // Setup process withdrawal button
    document.getElementById('processWithdrawalBtn').addEventListener('click', processWithdrawal);
    
    // Setup cancel withdrawal button
    document.getElementById('cancelWithdrawalBtn').addEventListener('click', function() {
        document.getElementById('withdrawalModal').style.display = 'none';
    });
    
    // Setup add package button
    document.getElementById('addPackageBtn').addEventListener('click', function() {
        showPackageModal();
    });
    
    // Setup save package button
    document.getElementById('packageForm').addEventListener('submit', function(e) {
        e.preventDefault();
        savePackage();
    });
    
    // Setup cancel package button
    document.getElementById('cancelPackageBtn').addEventListener('click', function() {
        document.getElementById('packageModal').style.display = 'none';
    });
    
    // Setup save user button
    document.getElementById('saveUserBtn').addEventListener('click', saveUserChanges);
    
    // Setup close user button
    document.getElementById('closeUserBtn').addEventListener('click', function() {
        document.getElementById('userModal').style.display = 'none';
    });
    
    // Setup filter transactions button
    document.getElementById('filterTransactions').addEventListener('click', filterTransactions);
    
    // Setup user search
    document.getElementById('userSearch').addEventListener('input', searchUsers);
});

// Check if user is admin
async function checkAdminStatus(userId) {
    try {
        const snapshot = await database.ref(`admins/${userId}`).once('value');
        if (!snapshot.exists()) {
            // Not an admin, redirect to user dashboard
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
        showToast('Error verifying admin access', 'error');
        window.location.href = 'index.html';
    }
}

// Update user avatar with initials
function updateUserAvatar(email) {
    const avatar = document.getElementById('userAvatar');
    if (!avatar) return;
    
    // Extract initials from email or name
    let initials = 'A';
    if (email) {
        const namePart = email.split('@')[0];
        if (namePart.includes('.')) {
            initials = namePart.split('.').map(n => n[0]).join('').toUpperCase();
        } else {
            initials = namePart.substring(0, 2).toUpperCase();
        }
    }
    
    avatar.textContent = initials;
}

// Switch main tabs
function switchTab(tabId) {
    // Update sidebar menu active state
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`.sidebar-menu a[data-tab="${tabId}"]`).classList.add('active');
    
    // Update tab content visibility
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`${tabId}-tab`).classList.add('active');
    
    // Load data for the tab if needed
    switch(tabId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'users':
            loadUsers();
            break;
        case 'deposits':
            loadDeposits('pending');
            break;
        case 'withdrawals':
            loadWithdrawals('pending');
            break;
        case 'transactions':
            loadAllTransactions();
            break;
        case 'packages':
            loadPackages();
            break;
    }
}

// Switch deposit tabs
function switchDepositTab(tabId) {
    // Update tab active state
    document.querySelectorAll('#deposits-tab .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`#deposits-tab .tab[data-tab="${tabId}"]`).classList.add('active');
    
    // Update tab content visibility
    document.querySelectorAll('#deposits-tab .tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`${tabId}-tab`).classList.add('active');
    
    // Load data for the tab
    switch(tabId) {
        case 'pending-deposits':
            loadDeposits('pending');
            break;
        case 'completed-deposits':
            loadDeposits('completed');
            break;
        case 'rejected-deposits':
            loadDeposits('rejected');
            break;
    }
}

// Switch withdrawal tabs
function switchWithdrawalTab(tabId) {
    // Update tab active state
    document.querySelectorAll('#withdrawals-tab .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`#withdrawals-tab .tab[data-tab="${tabId}"]`).classList.add('active');
    
    // Update tab content visibility
    document.querySelectorAll('#withdrawals-tab .tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`${tabId}-tab`).classList.add('active');
    
    // Load data for the tab
    switch(tabId) {
        case 'pending-withdrawals':
            loadWithdrawals('pending');
            break;
        case 'completed-withdrawals':
            loadWithdrawals('completed');
            break;
        case 'rejected-withdrawals':
            loadWithdrawals('rejected');
            break;
    }
}

// Load dashboard data
function loadDashboardData() {
    // Total users
    database.ref('users').on('value', (snapshot) => {
        const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
        document.getElementById('totalUsers').textContent = count;
    });
    
    // Total deposits
    database.ref('system/totalDeposits').on('value', (snapshot) => {
        const amount = snapshot.exists() ? snapshot.val() : 0;
        document.getElementById('totalDeposits').textContent = `$${amount.toFixed(2)}`;
    });
    
    // Total withdrawals
    database.ref('system/totalWithdrawals').on('value', (snapshot) => {
        const amount = snapshot.exists() ? snapshot.val() : 0;
        document.getElementById('totalWithdrawals').textContent = `$${amount.toFixed(2)}`;
    });
    
    // System earnings
    database.ref('system/adminEarnings').on('value', (snapshot) => {
        const amount = snapshot.exists() ? snapshot.val() : 0;
        document.getElementById('systemEarnings').textContent = `$${amount.toFixed(2)}`;
    });
    
    // Recent activity (last 10 transactions)
    const recentTransactionsQuery = database.ref('transactions').orderByChild('timestamp').startAt(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    recentTransactionsQuery.on('value', (snapshot) => {
        const tbody = document.getElementById('recentActivity');
        tbody.innerHTML = '';
        
        if (!snapshot.exists()) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No recent activity</td></tr>';
            return;
        }
        
        // Convert to array and sort by timestamp
        const transactions = [];
        snapshot.forEach(child => {
            transactions.push({
                id: child.key,
                ...child.val()
            });
        });
        
        transactions.sort((a, b) => b.timestamp - a.timestamp);
        
        // Show only last 10 transactions
        transactions.slice(0, 10).forEach(tx => {
            const row = document.createElement('tr');
            
            const date = new Date(tx.timestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const user = tx.userName || tx.userId || 'N/A';
            const type = tx.type.charAt(0).toUpperCase() + tx.type.slice(1);
            const amount = `$${tx.amount?.toFixed(2) || '0.00'}`;
            const status = tx.status ? tx.status.charAt(0).toUpperCase() + tx.status.slice(1) : 'Completed';
            const details = tx.details || '';
            
            row.innerHTML = `
                <td>${date}</td>
                <td>${user}</td>
                <td>${type}</td>
                <td>${amount}</td>
                <td><span class="badge status-${tx.status || 'completed'}">${status}</span></td>
                <td>${details}</td>
            `;
            
            tbody.appendChild(row);
        });
        
        document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();
    });
}

// Load all users
function loadUsers() {
    database.ref('users').on('value', (snapshot) => {
        const tbody = document.getElementById('usersTable');
        tbody.innerHTML = '';
        
        if (!snapshot.exists()) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No users found</td></tr>';
            return;
        }
        
        const users = snapshot.val();
        Object.keys(users).forEach(userId => {
            const user = users[userId];
            const row = document.createElement('tr');
            
            const joinedDate = new Date(user.createdAt || Date.now()).toLocaleDateString();
            const status = user.status === 'suspended' ? 'Suspended' : 
                          user.status === 'banned' ? 'Banned' : 'Active';
            
            row.innerHTML = `
                <td>${userId.substring(0, 8)}...</td>
                <td>${user.name || 'N/A'}</td>
                <td>${user.email || 'N/A'}</td>
                <td>$${(user.balance || 0).toFixed(2)}</td>
                <td>${joinedDate}</td>
                <td><span class="badge ${status === 'Active' ? 'status-completed' : 'status-rejected'}">${status}</span></td>
                <td>
                    <button class="btn btn-primary btn-sm view-user" data-userid="${userId}">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-user').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-userid');
                showUserDetails(userId);
            });
        });
    });
}

// Search users
function searchUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#usersTable tr');
    
    rows.forEach(row => {
        if (row.querySelector('td')) {
            const name = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            const email = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
            const id = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
            
            if (name.includes(searchTerm) || email.includes(searchTerm) || id.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

// Show user details modal
async function showUserDetails(userId) {
    try {
        const snapshot = await database.ref(`users/${userId}`).once('value');
        if (!snapshot.exists()) {
            showToast('User not found', 'error');
            return;
        }
        
        const user = snapshot.val();
        currentEditingUser = userId;
        
        // Populate user details
        const content = document.getElementById('userDetailsContent');
        content.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                <div class="user-avatar" style="width: 60px; height: 60px; font-size: 1.5rem;">
                    ${user.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
                </div>
                <div>
                    <h3 style="margin-bottom: 0.25rem;">${user.name || 'N/A'}</h3>
                    <p style="color: var(--gray-color); margin-bottom: 0;">${user.email || 'N/A'}</p>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div>
                    <p style="color: var(--gray-color); margin-bottom: 0.25rem;">User ID</p>
                    <p>${userId}</p>
                </div>
                <div>
                    <p style="color: var(--gray-color); margin-bottom: 0.25rem;">Joined</p>
                    <p>${new Date(user.createdAt || Date.now()).toLocaleDateString()}</p>
                </div>
                <div>
                    <p style="color: var(--gray-color); margin-bottom: 0.25rem;">Balance</p>
                    <p>$${(user.balance || 0).toFixed(2)}</p>
                </div>
                <div>
                    <p style="color: var(--gray-color); margin-bottom: 0.25rem;">Referrals</p>
                    <p>${user.directReferrals ? Object.keys(user.directReferrals).length : 0}</p>
                </div>
            </div>
            ${user.referredBy ? `
            <div style="margin-bottom: 1rem;">
                <p style="color: var(--gray-color); margin-bottom: 0.25rem;">Referred By</p>
                <p>${user.referredBy}</p>
            </div>
            ` : ''}
        `;
        
        // Set current status
        document.getElementById('userStatus').value = user.status || 'active';
        
        // Set admin note if exists
        document.getElementById('userAdminNote').value = user.adminNote || '';
        
        // Show modal
        document.getElementById('userModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Error loading user details:', error);
        showToast('Error loading user details', 'error');
    }
}

// Save user changes
async function saveUserChanges() {
    const userId = currentEditingUser;
    const status = document.getElementById('userStatus').value;
    const balanceAdjustment = parseFloat(document.getElementById('userBalanceAdjustment').value) || 0;
    const adminNote = document.getElementById('userAdminNote').value;
    
    const btn = document.getElementById('saveUserBtn');
    const btnText = document.getElementById('saveUserBtnText');
    const spinner = document.getElementById('saveUserSpinner');
    
    btn.disabled = true;
    btnText.textContent = 'Saving...';
    spinner.style.display = 'inline-block';
    
    try {
        // Get current user data
        const snapshot = await database.ref(`users/${userId}`).once('value');
        if (!snapshot.exists()) {
            showToast('User not found', 'error');
            return;
        }
        
        const user = snapshot.val();
        const updates = {};
        
        // Update status if changed
        if (status !== (user.status || 'active')) {
            updates[`users/${userId}/status`] = status;
        }
        
        // Update balance if adjustment made
        if (balanceAdjustment !== 0) {
            const newBalance = (user.balance || 0) + balanceAdjustment;
            updates[`users/${userId}/balance`] = newBalance;
            
            // Record transaction
            const transactionId = database.ref('transactions').push().key;
            const transactionData = {
                type: 'adjustment',
                amount: balanceAdjustment,
                status: 'completed',
                timestamp: Date.now(),
                userId: userId,
                adminId: currentUser.uid,
                details: `Admin balance adjustment - ${balanceAdjustment > 0 ? 'Added' : 'Deducted'} $${Math.abs(balanceAdjustment).toFixed(2)}`
            };
            
            updates[`users/${userId}/transactions/${transactionId}`] = transactionData;
            updates[`transactions/${transactionId}`] = transactionData;
        }
        
        // Update admin note if changed
        if (adminNote !== (user.adminNote || '')) {
            updates[`users/${userId}/adminNote`] = adminNote;
        }
        
        // Execute updates
        if (Object.keys(updates).length > 0) {
            await database.ref().update(updates);
            showToast('User updated successfully', 'success');
            document.getElementById('userBalanceAdjustment').value = '';
        } else {
            showToast('No changes made', 'warning');
        }
        
    } catch (error) {
        console.error('Error updating user:', error);
        showToast('Error updating user', 'error');
    } finally {
        btn.disabled = false;
        btnText.textContent = 'Save Changes';
        spinner.style.display = 'none';
    }
}

// Load deposits
function loadDeposits(status) {
    let depositsRef;
    
    if (status === 'all') {
        depositsRef = database.ref('deposits');
    } else {
        depositsRef = database.ref('deposits').orderByChild('status').equalTo(status);
    }
    
    depositsRef.on('value', async (snapshot) => {
        const tbody = status === 'pending' ? document.getElementById('pendingDepositsTable') :
                      status === 'completed' ? document.getElementById('completedDepositsTable') :
                      document.getElementById('rejectedDepositsTable');
        
        tbody.innerHTML = '';
        
        if (!snapshot.exists()) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No ${status} deposits found</td></tr>`;
            return;
        }
        
        const deposits = [];
        snapshot.forEach(child => {
            deposits.push({
                id: child.key,
                ...child.val()
            });
        });
        
        // Sort by timestamp (newest first)
        deposits.sort((a, b) => b.timestamp - a.timestamp);
        
        // Process each deposit
        for (const deposit of deposits) {
            const row = document.createElement('tr');
            
            const date = new Date(deposit.timestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            // Get user details
            let userName = 'N/A';
            let userEmail = 'N/A';
            
            if (deposit.userId) {
                const userSnapshot = await database.ref(`users/${deposit.userId}`).once('value');
                if (userSnapshot.exists()) {
                    const user = userSnapshot.val();
                    userName = user.name || 'N/A';
                    userEmail = user.email || 'N/A';
                }
            }
            
            if (status === 'pending') {
                row.innerHTML = `
                    <td>${date}</td>
                    <td>
                        <div>${userName}</div>
                        <small style="color: var(--gray-color);">${deposit.userId}</small>
                    </td>
                    <td>$${deposit.amount.toFixed(2)}</td>
                    <td>${deposit.method || 'N/A'}</td>
                    <td>
                        ${deposit.proof ? `<a href="${deposit.proof}" target="_blank" class="btn btn-primary btn-sm">View Proof</a>` : 'No proof'}
                    </td>
                    <td>
                        <button class="btn btn-primary btn-sm process-deposit" data-depositid="${deposit.id}">
                            <i class="fas fa-cog"></i> Process
                        </button>
                    </td>
                `;
            } else if (status === 'completed') {
                row.innerHTML = `
                    <td>${date}</td>
                    <td>
                        <div>${userName}</div>
                        <small style="color: var(--gray-color);">${deposit.userId}</small>
                    </td>
                    <td>$${deposit.amount.toFixed(2)}</td>
                    <td>${deposit.method || 'N/A'}</td>
                    <td>${deposit.processedBy || 'System'}</td>
                    <td>${new Date(deposit.processedAt || deposit.timestamp).toLocaleDateString()}</td>
                `;
            } else {
                row.innerHTML = `
                    <td>${date}</td>
                    <td>
                        <div>${userName}</div>
                        <small style="color: var(--gray-color);">${deposit.userId}</small>
                    </td>
                    <td>$${deposit.amount.toFixed(2)}</td>
                    <td>${deposit.method || 'N/A'}</td>
                    <td>${deposit.rejectReason || 'No reason provided'}</td>
                    <td>${deposit.processedBy || 'System'}</td>
                `;
            }
            
            tbody.appendChild(row);
        }
        
        // Add event listeners to process buttons
        if (status === 'pending') {
            document.querySelectorAll('.process-deposit').forEach(btn => {
                btn.addEventListener('click', function() {
                    const depositId = this.getAttribute('data-depositid');
                    showDepositModal(depositId);
                });
            });
        }
    });
}

// Show deposit modal for processing
async function showDepositModal(depositId) {
    try {
        const snapshot = await database.ref(`deposits/${depositId}`).once('value');
        if (!snapshot.exists()) {
            showToast('Deposit not found', 'error');
            return;
        }
        
        const deposit = snapshot.val();
        currentDeposit = depositId;
        
        // Get user details
        let userName = 'N/A';
        if (deposit.userId) {
            const userSnapshot = await database.ref(`users/${deposit.userId}`).once('value');
            if (userSnapshot.exists()) {
                userName = userSnapshot.val().name || 'N/A';
            }
        }
        
        // Populate deposit details
        const details = document.getElementById('depositDetails');
        details.innerHTML = `
            <div style="margin-bottom: 0.5rem;">
                <p style="color: var(--gray-color); margin-bottom: 0.25rem;">User</p>
                <p>${userName} (${deposit.userId})</p>
            </div>
            <div style="margin-bottom: 0.5rem;">
                <p style="color: var(--gray-color); margin-bottom: 0.25rem;">Amount</p>
                <p>$${deposit.amount.toFixed(2)}</p>
            </div>
            <div style="margin-bottom: 0.5rem;">
                <p style="color: var(--gray-color); margin-bottom: 0.25rem;">Method</p>
                <p>${deposit.method || 'N/A'}</p>
            </div>
            ${deposit.proof ? `
            <div style="margin-bottom: 0.5rem;">
                <p style="color: var(--gray-color); margin-bottom: 0.25rem;">Payment Proof</p>
                <a href="${deposit.proof}" target="_blank" class="btn btn-primary btn-sm">View Proof</a>
            </div>
            ` : ''}
        `;
        
        // Reset form
        document.getElementById('depositAction').value = 'approve';
        document.getElementById('rejectReasonContainer').style.display = 'none';
        document.getElementById('rejectReason').value = '';
        document.getElementById('adminNote').value = '';
        
        // Show modal
        document.getElementById('depositModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Error loading deposit:', error);
        showToast('Error loading deposit', 'error');
    }
}

// Process deposit
async function processDeposit() {
    const depositId = currentDeposit;
    const action = document.getElementById('depositAction').value;
    const rejectReason = document.getElementById('rejectReason').value;
    const adminNote = document.getElementById('adminNote').value;
    
    const btn = document.getElementById('processDepositBtn');
    const btnText = document.getElementById('processDepositBtnText');
    const spinner = document.getElementById('processDepositSpinner');
    
    btn.disabled = true;
    btnText.textContent = 'Processing...';
    spinner.style.display = 'inline-block';
    
    try {
        // Get deposit data
        const snapshot = await database.ref(`deposits/${depositId}`).once('value');
        if (!snapshot.exists()) {
            showToast('Deposit not found', 'error');
            return;
        }
        
        const deposit = snapshot.val();
        const updates = {};
        const timestamp = Date.now();
        
        if (action === 'approve') {
            // Approve deposit
            updates[`deposits/${depositId}/status`] = 'completed';
            updates[`deposits/${depositId}/processedBy`] = currentUser.uid;
            updates[`deposits/${depositId}/processedAt`] = timestamp;
            
            // Update user balance
            const userBalance = await getValue(`users/${deposit.userId}/balance`);
            updates[`users/${deposit.userId}/balance`] = (userBalance || 0) + deposit.amount;
            
            // Update system totals
            const totalDeposits = await getValue('system/totalDeposits');
            updates['system/totalDeposits'] = (totalDeposits || 0) + deposit.amount;
            
            // Add transaction record
            const transactionId = database.ref('transactions').push().key;
            const transactionData = {
                type: 'deposit',
                amount: deposit.amount,
                status: 'completed',
                timestamp: timestamp,
                userId: deposit.userId,
                adminId: currentUser.uid,
                details: `Deposit via ${deposit.method || 'unknown method'}`
            };
            
            updates[`users/${deposit.userId}/transactions/${transactionId}`] = transactionData;
            updates[`transactions/${transactionId}`] = transactionData;
            
        } else {
            // Reject deposit
            updates[`deposits/${depositId}/status`] = 'rejected';
            updates[`deposits/${depositId}/processedBy`] = currentUser.uid;
            updates[`deposits/${depositId}/processedAt`] = timestamp;
            updates[`deposits/${depositId}/rejectReason`] = rejectReason;
            
            // Add transaction record
            const transactionId = database.ref('transactions').push().key;
            const transactionData = {
                type: 'deposit',
                amount: deposit.amount,
                status: 'rejected',
                timestamp: timestamp,
                userId: deposit.userId,
                adminId: currentUser.uid,
                details: `Deposit rejected: ${rejectReason}`
            };
            
            updates[`users/${deposit.userId}/transactions/${transactionId}`] = transactionData;
            updates[`transactions/${transactionId}`] = transactionData;
        }
        
        // Add admin note if provided
        if (adminNote) {
            updates[`deposits/${depositId}/adminNote`] = adminNote;
        }
        
        // Execute updates
        await database.ref().update(updates);
        
        showToast(`Deposit ${action === 'approve' ? 'approved' : 'rejected'} successfully`, 'success');
        document.getElementById('depositModal').style.display = 'none';
        loadDeposits('pending');
        
    } catch (error) {
        console.error('Error processing deposit:', error);
        showToast('Error processing deposit', 'error');
    } finally {
        btn.disabled = false;
        btnText.textContent = 'Process Deposit';
        spinner.style.display = 'none';
    }
}

// Load withdrawals
function loadWithdrawals(status) {
    let withdrawalsRef;
    
    if (status === 'all') {
        withdrawalsRef = database.ref('withdrawals');
    } else {
        withdrawalsRef = database.ref('withdrawals').orderByChild('status').equalTo(status);
    }
    
    withdrawalsRef.on('value', async (snapshot) => {
        const tbody = status === 'pending' ? document.getElementById('pendingWithdrawalsTable') :
                      status === 'completed' ? document.getElementById('completedWithdrawalsTable') :
                      document.getElementById('rejectedWithdrawalsTable');
        
        tbody.innerHTML = '';
        
        if (!snapshot.exists()) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No ${status} withdrawals found</td></tr>`;
            return;
        }
        
        const withdrawals = [];
        snapshot.forEach(child => {
            withdrawals.push({
                id: child.key,
                ...child.val()
            });
        });
        
        // Sort by timestamp (newest first)
        withdrawals.sort((a, b) => b.timestamp - a.timestamp);
        
        // Process each withdrawal
        for (const withdrawal of withdrawals) {
            const row = document.createElement('tr');
            
            const date = new Date(withdrawal.timestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            // Get user details
            let userName = 'N/A';
            let userEmail = 'N/A';
            
            if (withdrawal.userId) {
                const userSnapshot = await database.ref(`users/${withdrawal.userId}`).once('value');
                if (userSnapshot.exists()) {
                    const user = userSnapshot.val();
                    userName = user.name || 'N/A';
                    userEmail = user.email || 'N/A';
                }
            }
            
            if (status === 'pending') {
                row.innerHTML = `
                    <td>${date}</td>
                    <td>
                        <div>${userName}</div>
                        <small style="color: var(--gray-color);">${withdrawal.userId}</small>
                    </td>
                    <td>$${withdrawal.amount.toFixed(2)}</td>
                    <td>${withdrawal.method || 'N/A'}</td>
                    <td>${withdrawal.wallet || 'N/A'}</td>
                    <td>
                        <button class="btn btn-primary btn-sm process-withdrawal" data-withdrawalid="${withdrawal.id}">
                            <i class="fas fa-cog"></i> Process
                        </button>
                    </td>
                `;
            } else if (status === 'completed') {
                row.innerHTML = `
                    <td>${date}</td>
                    <td>
                        <div>${userName}</div>
                        <small style="color: var(--gray-color);">${withdrawal.userId}</small>
                    </td>
                    <td>$${withdrawal.amount.toFixed(2)}</td>
                    <td>${withdrawal.method || 'N/A'}</td>
                    <td>${withdrawal.wallet || 'N/A'}</td>
                    <td>${withdrawal.processedBy || 'System'}</td>
                `;
            } else {
                row.innerHTML = `
                    <td>${date}</td>
                    <td>
                        <div>${userName}</div>
                        <small style="color: var(--gray-color);">${withdrawal.userId}</small>
                    </td>
                    <td>$${withdrawal.amount.toFixed(2)}</td>
                    <td>${withdrawal.method || 'N/A'}</td>
                    <td>${withdrawal.rejectReason || 'No reason provided'}</td>
                    <td>${withdrawal.processedBy || 'System'}</td>
                `;
            }
            
            tbody.appendChild(row);
        }
        
        // Add event listeners to process buttons
        if (status === 'pending') {
            document.querySelectorAll('.process-withdrawal').forEach(btn => {
                btn.addEventListener('click', function() {
                    const withdrawalId = this.getAttribute('data-withdrawalid');
                    showWithdrawalModal(withdrawalId);
                });
            });
        }
    });
}

// Show withdrawal modal for processing
async function showWithdrawalModal(withdrawalId) {
    try {
        const snapshot = await database.ref(`withdrawals/${withdrawalId}`).once('value');
        if (!snapshot.exists()) {
            showToast('Withdrawal not found', 'error');
            return;
        }
        
        const withdrawal = snapshot.val();
        currentWithdrawal = withdrawalId;
        
        // Get user details
        let userName = 'N/A';
        let userBalance = 0;
        if (withdrawal.userId) {
            const userSnapshot = await database.ref(`users/${withdrawal.userId}`).once('value');
            if (userSnapshot.exists()) {
                const user = userSnapshot.val();
                userName = user.name || 'N/A';
                userBalance = user.balance || 0;
            }
        }
        
        // Populate withdrawal details
        const details = document.getElementById('withdrawalDetails');
        details.innerHTML = `
            <div style="margin-bottom: 0.5rem;">
                <p style="color: var(--gray-color); margin-bottom: 0.25rem;">User</p>
                <p>${userName} (${withdrawal.userId})</p>
            </div>
            <div style="margin-bottom: 0.5rem;">
                <p style="color: var(--gray-color); margin-bottom: 0.25rem;">Current Balance</p>
                <p>$${userBalance.toFixed(2)}</p>
            </div>
            <div style="margin-bottom: 0.5rem;">
                <p style="color: var(--gray-color); margin-bottom: 0.25rem;">Amount</p>
                <p>$${withdrawal.amount.toFixed(2)}</p>
            </div>
            <div style="margin-bottom: 0.5rem;">
                <p style="color: var(--gray-color); margin-bottom: 0.25rem;">Method</p>
                <p>${withdrawal.method || 'N/A'}</p>
            </div>
            <div style="margin-bottom: 0.5rem;">
                <p style="color: var(--gray-color); margin-bottom: 0.25rem;">Wallet/Account</p>
                <p>${withdrawal.wallet || 'N/A'}</p>
            </div>
        `;
        
        // Reset form
        document.getElementById('withdrawalAction').value = 'approve';
        document.getElementById('withdrawalRejectReasonContainer').style.display = 'none';
        document.getElementById('withdrawalRejectReason').value = '';
        document.getElementById('withdrawalAdminNote').value = '';
        
        // Show modal
        document.getElementById('withdrawalModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Error loading withdrawal:', error);
        showToast('Error loading withdrawal', 'error');
    }
}

// Process withdrawal
async function processWithdrawal() {
    const withdrawalId = currentWithdrawal;
    const action = document.getElementById('withdrawalAction').value;
    const rejectReason = document.getElementById('withdrawalRejectReason').value;
    const adminNote = document.getElementById('withdrawalAdminNote').value;
    
    const btn = document.getElementById('processWithdrawalBtn');
    const btnText = document.getElementById('processWithdrawalBtnText');
    const spinner = document.getElementById('processWithdrawalSpinner');
    
    btn.disabled = true;
    btnText.textContent = 'Processing...';
    spinner.style.display = 'inline-block';
    
    try {
        // Get withdrawal data
        const snapshot = await database.ref(`withdrawals/${withdrawalId}`).once('value');
        if (!snapshot.exists()) {
            showToast('Withdrawal not found', 'error');
            return;
        }
        
        const withdrawal = snapshot.val();
        const updates = {};
        const timestamp = Date.now();
        
        if (action === 'approve') {
            // Approve withdrawal
            updates[`withdrawals/${withdrawalId}/status`] = 'completed';
            updates[`withdrawals/${withdrawalId}/processedBy`] = currentUser.uid;
            updates[`withdrawals/${withdrawalId}/processedAt`] = timestamp;
            
            // Update system totals
            const totalWithdrawals = await getValue('system/totalWithdrawals');
            updates['system/totalWithdrawals'] = (totalWithdrawals || 0) + withdrawal.amount;
            
            // Add transaction record
            const transactionId = database.ref('transactions').push().key;
            const transactionData = {
                type: 'withdrawal',
                amount: withdrawal.amount,
                status: 'completed',
                timestamp: timestamp,
                userId: withdrawal.userId,
                adminId: currentUser.uid,
                details: `Withdrawal via ${withdrawal.method || 'unknown method'} to ${withdrawal.wallet || 'unknown wallet'}`
            };
            
            updates[`users/${withdrawal.userId}/transactions/${transactionId}`] = transactionData;
            updates[`transactions/${transactionId}`] = transactionData;
            
        } else {
            // Reject withdrawal - return funds to user
            updates[`withdrawals/${withdrawalId}/status`] = 'rejected';
            updates[`withdrawals/${withdrawalId}/processedBy`] = currentUser.uid;
            updates[`withdrawals/${withdrawalId}/processedAt`] = timestamp;
            updates[`withdrawals/${withdrawalId}/rejectReason`] = rejectReason;
            
            // Return funds to user
            const userBalance = await getValue(`users/${withdrawal.userId}/balance`);
            updates[`users/${withdrawal.userId}/balance`] = (userBalance || 0) + withdrawal.amount;
            
            // Add transaction record
            const transactionId = database.ref('transactions').push().key;
            const transactionData = {
                type: 'withdrawal',
                amount: withdrawal.amount,
                status: 'rejected',
                timestamp: timestamp,
                userId: withdrawal.userId,
                adminId: currentUser.uid,
                details: `Withdrawal rejected: ${rejectReason}`
            };
            
            updates[`users/${withdrawal.userId}/transactions/${transactionId}`] = transactionData;
            updates[`transactions/${transactionId}`] = transactionData;
        }
        
        // Add admin note if provided
        if (adminNote) {
            updates[`withdrawals/${withdrawalId}/adminNote`] = adminNote;
        }
        
        // Execute updates
        await database.ref().update(updates);
        
        showToast(`Withdrawal ${action === 'approve' ? 'approved' : 'rejected'} successfully`, 'success');
        document.getElementById('withdrawalModal').style.display = 'none';
        loadWithdrawals('pending');
        
    } catch (error) {
        console.error('Error processing withdrawal:', error);
        showToast('Error processing withdrawal', 'error');
    } finally {
        btn.disabled = false;
        btnText.textContent = 'Process Withdrawal';
        spinner.style.display = 'none';
    }
}

// Load all transactions
function loadAllTransactions() {
    const transactionsRef = database.ref('transactions');
    
    transactionsRef.on('value', async (snapshot) => {
        const tbody = document.getElementById('allTransactionsTable');
        tbody.innerHTML = '';
        
        if (!snapshot.exists()) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No transactions found</td></tr>';
            return;
        }
        
        const transactions = [];
        snapshot.forEach(child => {
            transactions.push({
                id: child.key,
                ...child.val()
            });
        });
        
        // Sort by timestamp (newest first)
        transactions.sort((a, b) => b.timestamp - a.timestamp);
        
        // Process each transaction
        for (const tx of transactions) {
            const row = document.createElement('tr');
            
            const date = new Date(tx.timestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Get user details
            let userName = 'N/A';
            if (tx.userId) {
                const userSnapshot = await database.ref(`users/${tx.userId}`).once('value');
                if (userSnapshot.exists()) {
                    const user = userSnapshot.val();
                    userName = user.name || 'N/A';
                }
            }
            
            const type = tx.type.charAt(0).toUpperCase() + tx.type.slice(1);
            const amount = `$${tx.amount?.toFixed(2) || '0.00'}`;
            const status = tx.status ? tx.status.charAt(0).toUpperCase() + tx.status.slice(1) : 'Completed';
            const details = tx.details || '';
            
            row.innerHTML = `
                <td>${date}</td>
                <td>
                    <div>${userName}</div>
                    <small style="color: var(--gray-color);">${tx.userId}</small>
                </td>
                <td>${type}</td>
                <td>${amount}</td>
                <td><span class="badge status-${tx.status || 'completed'}">${status}</span></td>
                <td>${details}</td>
            `;
            
            tbody.appendChild(row);
        }
    });
}

// Filter transactions
function filterTransactions() {
    const typeFilter = document.getElementById('transactionTypeFilter').value;
    const userFilter = document.getElementById('transactionUserFilter').value.toLowerCase();
    const dateFilter = document.getElementById('transactionDateFilter').value;
    
    const rows = document.querySelectorAll('#allTransactionsTable tr');
    
    rows.forEach(row => {
        if (row.querySelector('td')) {
            const type = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
            const user = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            const date = row.querySelector('td:nth-child(1)').textContent;
            
            let typeMatch = true;
            let userMatch = true;
            let dateMatch = true;
            
            if (typeFilter && type !== typeFilter.toLowerCase()) {
                typeMatch = false;
            }
            
            if (userFilter && !user.includes(userFilter)) {
                userMatch = false;
            }
            
            if (dateFilter && !date.includes(new Date(dateFilter).toLocaleDateString().split(',')[0])) {
                dateMatch = false;
            }
            
            if (typeMatch && userMatch && dateMatch) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

// Load packages
function loadPackages() {
    database.ref('packages').on('value', (snapshot) => {
        const tbody = document.getElementById('packagesTable');
        tbody.innerHTML = '';
        
        if (!snapshot.exists()) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No packages found</td></tr>';
            return;
        }
        
        const packages = snapshot.val();
        Object.keys(packages).forEach(packageId => {
            const pkg = packages[packageId];
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${pkg.name}</td>
                <td>$${pkg.price.toFixed(2)}</td>
                <td>${pkg.return}%</td>
                <td>${pkg.duration} days</td>
                <td><span class="badge ${pkg.active ? 'status-completed' : 'status-rejected'}">${pkg.active ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <button class="btn btn-primary btn-sm edit-package" data-packageid="${packageId}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-sm delete-package" data-packageid="${packageId}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Add event listeners to edit buttons
        document.querySelectorAll('.edit-package').forEach(btn => {
            btn.addEventListener('click', function() {
                const packageId = this.getAttribute('data-packageid');
                showPackageModal(packageId);
            });
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-package').forEach(btn => {
            btn.addEventListener('click', function() {
                const packageId = this.getAttribute('data-packageid');
                deletePackage(packageId);
            });
        });
    });
}

// Show package modal for add/edit
async function showPackageModal(packageId = null) {
    currentEditingPackage = packageId;
    
    if (packageId) {
        // Edit existing package
        document.getElementById('packageModalTitle').textContent = 'Edit Package';
        
        const snapshot = await database.ref(`packages/${packageId}`).once('value');
        if (snapshot.exists()) {
            const pkg = snapshot.val();
            
            document.getElementById('packageName').value = pkg.name;
            document.getElementById('packagePrice').value = pkg.price;
            document.getElementById('packageReturn').value = pkg.return;
            document.getElementById('packageDuration').value = pkg.duration;
            document.getElementById('packageFeatures').value = pkg.features.join('\n');
            document.getElementById('packageIsPopular').checked = pkg.popular || false;
            document.getElementById('packageIsActive').checked = pkg.active !== false;
            document.getElementById('packageId').value = packageId;
        }
    } else {
        // Add new package
        document.getElementById('packageModalTitle').textContent = 'Add New Package';
        
        // Reset form
        document.getElementById('packageForm').reset();
        document.getElementById('packageIsPopular').checked = false;
        document.getElementById('packageIsActive').checked = true;
        document.getElementById('packageId').value = '';
    }
    
    // Show modal
    document.getElementById('packageModal').style.display = 'flex';
}

// Save package
async function savePackage() {
    const packageId = currentEditingPackage;
    const name = document.getElementById('packageName').value;
    const price = parseFloat(document.getElementById('packagePrice').value);
    const returnPercent = parseFloat(document.getElementById('packageReturn').value);
    const duration = parseInt(document.getElementById('packageDuration').value);
    const features = document.getElementById('packageFeatures').value.split('\n').filter(f => f.trim());
    const isPopular = document.getElementById('packageIsPopular').checked;
    const isActive = document.getElementById('packageIsActive').checked;
    
    const btn = document.getElementById('savePackageBtn');
    const btnText = document.getElementById('savePackageBtnText');
    const spinner = document.getElementById('savePackageSpinner');
    
    btn.disabled = true;
    btnText.textContent = 'Saving...';
    spinner.style.display = 'inline-block';
    
    try {
        const packageData = {
            name,
            price,
            return: returnPercent,
            duration,
            features,
            popular: isPopular,
            active: isActive,
            updatedAt: Date.now()
        };
        
        if (packageId) {
            // Update existing package
            await database.ref(`packages/${packageId}`).update(packageData);
            showToast('Package updated successfully', 'success');
        } else {
            // Add new package
            packageData.createdAt = Date.now();
            const newPackageRef = database.ref('packages').push();
            await newPackageRef.set(packageData);
            showToast('Package added successfully', 'success');
        }
        
        document.getElementById('packageModal').style.display = 'none';
        loadPackages();
        
    } catch (error) {
        console.error('Error saving package:', error);
        showToast('Error saving package', 'error');
    } finally {
        btn.disabled = false;
        btnText.textContent = 'Save Package';
        spinner.style.display = 'none';
    }
}

// Delete package
async function deletePackage(packageId) {
    if (!confirm('Are you sure you want to delete this package?')) return;
    
    try {
        await database.ref(`packages/${packageId}`).remove();
        showToast('Package deleted successfully', 'success');
        loadPackages();
    } catch (error) {
        console.error('Error deleting package:', error);
        showToast('Error deleting package', 'error');
    }
}

// Logout user
async function logoutUser() {
    try {
        await auth.signOut();
        window.location.href = 'login.html';
    } catch (error) {
        showToast('Error logging out: ' + error.message, 'error');
    }
}

// Get value from database
async function getValue(path) {
    const snapshot = await database.ref(path).once('value');
    return snapshot.exists() ? snapshot.val() : 0;
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
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
}
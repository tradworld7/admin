document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAdminAuth();
    
    // Set admin name
    document.getElementById('adminName').textContent = ADMIN_CREDENTIALS.userId;
    
    // Logout button
    const logoutButtons = document.querySelectorAll('#logoutBtn, #logoutLink');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            logoutAdmin();
        });
    });
    
    // Load data based on current page
    if (window.location.pathname.includes('dashboard.html')) {
        loadDashboardData();
        setupDashboardEventListeners();
    } else if (window.location.pathname.includes('users.html')) {
        loadUsersData();
        setupUsersEventListeners();
    } else if (window.location.pathname.includes('transactions.html')) {
        loadTransactionsData();
        setupTransactionsEventListeners();
    }
});

// Load dashboard data
function loadDashboardData() {
    // Load total users count
    database.ref('users').once('value').then(snapshot => {
        const userCount = snapshot.numChildren();
        document.getElementById('totalUsers').textContent = userCount;
    });
    
    // Load active investments count
    database.ref('investments').orderByChild('status').equalTo('active').once('value').then(snapshot => {
        const activeInvestments = snapshot.numChildren();
        document.getElementById('activeInvestments').textContent = activeInvestments;
    });
    
    // Load total deposits
    database.ref('transactions').orderByChild('type').equalTo('deposit').once('value').then(snapshot => {
        let totalDeposits = 0;
        snapshot.forEach(childSnapshot => {
            totalDeposits += parseFloat(childSnapshot.val().amount) || 0;
        });
        document.getElementById('totalDeposits').textContent = `$${totalDeposits.toFixed(2)}`;
    });
    
    // Load pending withdrawals
    database.ref('transactions').orderByChild('status').equalTo('pending').once('value').then(snapshot => {
        let pendingWithdrawals = 0;
        snapshot.forEach(childSnapshot => {
            if (childSnapshot.val().type === 'withdrawal') {
                pendingWithdrawals++;
            }
        });
        document.getElementById('pendingWithdrawals').textContent = pendingWithdrawals;
    });
    
    // Load recent activity
    loadRecentActivity();
}

// Load recent activity
function loadRecentActivity() {
    database.ref('transactions').orderByChild('timestamp').limitToLast(10).once('value').then(snapshot => {
        const transactions = snapshot.val();
        const tbody = document.getElementById('activityTableBody');
        tbody.innerHTML = '';
        
        if (!transactions) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No recent activity</td></tr>';
            return;
        }
        
        // Convert to array and sort by timestamp
        const transactionsArray = Object.entries(transactions).map(([id, tx]) => ({ id, ...tx }));
        transactionsArray.sort((a, b) => b.timestamp - a.timestamp);
        
        transactionsArray.forEach(tx => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(tx.timestamp)}</td>
                <td>${tx.userId || 'System'}</td>
                <td>${formatTxType(tx.type)}</td>
                <td>$${tx.amount?.toFixed(2) || '0.00'}</td>
                <td class="status-${tx.status || 'completed'}">${formatStatus(tx.status)}</td>
            `;
            tbody.appendChild(row);
        });
    });
}

// Load users data
function loadUsersData() {
    database.ref('users').once('value').then(snapshot => {
        const users = snapshot.val();
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';
        
        if (!users) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No users found</td></tr>';
            return;
        }
        
        Object.entries(users).forEach(([userId, user]) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${userId}</td>
                <td>${user.name || 'N/A'}</td>
                <td>${user.email || 'N/A'}</td>
                <td>$${(user.balance || 0).toFixed(2)}</td>
                <td class="status-${user.status || 'active'}">${formatStatus(user.status)}</td>
                <td>
                    <button class="action-btn view" data-userid="${userId}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" data-userid="${userId}">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Attach event listeners to action buttons
        document.querySelectorAll('.action-btn.view').forEach(btn => {
            btn.addEventListener('click', () => showUserDetails(btn.dataset.userid));
        });
        
        document.querySelectorAll('.action-btn.edit').forEach(btn => {
            btn.addEventListener('click', () => editUser(btn.dataset.userid));
        });
    });
}

// Load transactions data
function loadTransactionsData() {
    database.ref('transactions').orderByChild('timestamp').once('value').then(snapshot => {
        const transactions = snapshot.val();
        const tbody = document.getElementById('transactionsTableBody');
        tbody.innerHTML = '';
        
        if (!transactions) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No transactions found</td></tr>';
            return;
        }
        
        // Convert to array and sort by timestamp
        const transactionsArray = Object.entries(transactions).map(([id, tx]) => ({ id, ...tx }));
        transactionsArray.sort((a, b) => b.timestamp - a.timestamp);
        
        transactionsArray.forEach(tx => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="tx-checkbox" data-txid="${tx.id}"></td>
                <td>${tx.id.substring(0, 8)}...</td>
                <td>${tx.userId || 'System'}</td>
                <td>${formatTxType(tx.type)}</td>
                <td>$${tx.amount?.toFixed(2) || '0.00'}</td>
                <td>${formatDate(tx.timestamp)}</td>
                <td class="status-${tx.status || 'completed'}">${formatStatus(tx.status)}</td>
                <td>
                    <button class="action-btn view" data-txid="${tx.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Attach event listeners to view buttons
        document.querySelectorAll('.action-btn.view').forEach(btn => {
            btn.addEventListener('click', () => showTransactionDetails(btn.dataset.txid));
        });
        
        // Setup checkbox functionality
        setupTransactionCheckboxes();
    });
}

// Show user details modal
function showUserDetails(userId) {
    database.ref('users/' + userId).once('value').then(snapshot => {
        const user = snapshot.val();
        if (!user) {
            showToast('User not found', 'error');
            return;
        }
        
        // Populate modal
        document.getElementById('detailUserId').textContent = userId;
        document.getElementById('detailName').textContent = user.name || 'N/A';
        document.getElementById('detailEmail').textContent = user.email || 'N/A';
        document.getElementById('detailBalance').textContent = `$${(user.balance || 0).toFixed(2)}`;
        document.getElementById('detailRegistration').textContent = user.registrationDate ? formatDate(user.registrationDate) : 'N/A';
        document.getElementById('detailStatus').textContent = formatStatus(user.status || 'active');
        document.getElementById('detailReferral').textContent = user.referralCode || 'N/A';
        document.getElementById('detailReferrer').textContent = user.referredBy || 'N/A';
        
        // Show modal
        document.getElementById('userDetailsModal').classList.add('active');
    });
}

// Show transaction details modal
function showTransactionDetails(txId) {
    database.ref('transactions/' + txId).once('value').then(snapshot => {
        const tx = snapshot.val();
        if (!tx) {
            showToast('Transaction not found', 'error');
            return;
        }
        
        // Populate modal
        document.getElementById('detailTxId').textContent = txId;
        document.getElementById('detailTxUserId').textContent = tx.userId || 'System';
        document.getElementById('detailTxType').textContent = formatTxType(tx.type);
        document.getElementById('detailTxAmount').textContent = `$${tx.amount?.toFixed(2) || '0.00'}`;
        document.getElementById('detailTxStatus').textContent = formatStatus(tx.status || 'completed');
        document.getElementById('detailTxDate').textContent = formatDate(tx.timestamp);
        document.getElementById('detailTxDetails').textContent = tx.details || 'N/A';
        
        // Show withdrawal address if available
        const withdrawalGroup = document.getElementById('withdrawalDetailsGroup');
        if (tx.type === 'withdrawal' && tx.walletAddress) {
            withdrawalGroup.style.display = 'flex';
            document.getElementById('detailWithdrawalAddress').textContent = tx.walletAddress;
            
            // Setup copy button
            document.getElementById('copyAddressBtn').onclick = () => {
                navigator.clipboard.writeText(tx.walletAddress);
                showToast('Address copied to clipboard', 'success');
            };
        } else {
            withdrawalGroup.style.display = 'none';
        }
        
        // Show modal
        document.getElementById('transactionDetailsModal').classList.add('active');
        
        // Setup approve/reject buttons if pending
        if (tx.status === 'pending' && (tx.type === 'withdrawal' || tx.type === 'deposit')) {
            document.getElementById('approveTxBtn').style.display = 'inline-block';
            document.getElementById('rejectTxBtn').style.display = 'inline-block';
            
            document.getElementById('approveTxBtn').onclick = () => approveTransaction(txId, tx);
            document.getElementById('rejectTxBtn').onclick = () => rejectTransaction(txId, tx);
        } else {
            document.getElementById('approveTxBtn').style.display = 'none';
            document.getElementById('rejectTxBtn').style.display = 'none';
        }
    });
}

// Approve transaction
function approveTransaction(txId, tx) {
    const updates = {};
    updates[`transactions/${txId}/status`] = 'completed';
    updates[`users/${tx.userId}/transactions/${txId}/status`] = 'completed';
    
    // For withdrawals, we've already deducted the amount when it was requested
    // For deposits, we need to add the funds
    if (tx.type === 'deposit') {
        database.ref(`users/${tx.userId}/balance`).once('value').then(snapshot => {
            const currentBalance = parseFloat(snapshot.val()) || 0;
            updates[`users/${tx.userId}/balance`] = currentBalance + parseFloat(tx.amount);
            
            database.ref().update(updates).then(() => {
                showToast('Transaction approved successfully', 'success');
                document.getElementById('transactionDetailsModal').classList.remove('active');
                loadTransactionsData();
            });
        });
    } else {
        database.ref().update(updates).then(() => {
            showToast('Transaction approved successfully', 'success');
            document.getElementById('transactionDetailsModal').classList.remove('active');
            loadTransactionsData();
        });
    }
}

// Reject transaction
function rejectTransaction(txId, tx) {
    const updates = {};
    updates[`transactions/${txId}/status`] = 'rejected';
    updates[`users/${tx.userId}/transactions/${txId}/status`] = 'rejected';
    
    // For withdrawals, we need to return the funds to the user's balance
    if (tx.type === 'withdrawal') {
        database.ref(`users/${tx.userId}/balance`).once('value').then(snapshot => {
            const currentBalance = parseFloat(snapshot.val()) || 0;
            updates[`users/${tx.userId}/balance`] = currentBalance + parseFloat(tx.amount);
            
            database.ref().update(updates).then(() => {
                showToast('Transaction rejected', 'success');
                document.getElementById('transactionDetailsModal').classList.remove('active');
                loadTransactionsData();
            });
        });
    } else {
        database.ref().update(updates).then(() => {
            showToast('Transaction rejected', 'success');
            document.getElementById('transactionDetailsModal').classList.remove('active');
            loadTransactionsData();
        });
    }
}

// Add funds to user
function addFundsToUser() {
    const userId = document.getElementById('userId').value.trim();
    const amount = parseFloat(document.getElementById('fundAmount').value);
    const note = document.getElementById('fundNote').value.trim();
    
    // Validation
    if (!userId) {
        showToast('Please enter user ID', 'error');
        return;
    }
    
    if (isNaN(amount) {
        showToast('Please enter valid amount', 'error');
        return;
    }
    
    if (amount <= 0) {
        showToast('Amount must be positive', 'error');
        return;
    }
    
    // Check if user exists
    database.ref('users/' + userId).once('value').then(snapshot => {
        if (!snapshot.exists()) {
            showToast('User not found', 'error');
            return;
        }
        
        const currentBalance = parseFloat(snapshot.val().balance) || 0;
        const updates = {};
        const timestamp = firebase.database.ServerValue.TIMESTAMP;
        const transactionId = database.ref().child('transactions').push().key;
        
        // Update user balance
        updates[`users/${userId}/balance`] = currentBalance + amount;
        
        // Record transaction
        updates[`transactions/${transactionId}`] = {
            userId: userId,
            type: 'admin_deposit',
            amount: amount,
            status: 'completed',
            timestamp: timestamp,
            details: note || 'Admin added funds'
        };
        
        // Add to user's transaction history
        updates[`users/${userId}/transactions/${transactionId}`] = {
            type: 'deposit',
            amount: amount,
            status: 'completed',
            timestamp: timestamp,
            details: note || 'Admin added funds'
        };
        
        // Execute updates
        database.ref().update(updates).then(() => {
            showToast(`Successfully added $${amount.toFixed(2)} to user ${userId}`, 'success');
            document.getElementById('addFundsModal').classList.remove('active');
            document.getElementById('userId').value = '';
            document.getElementById('fundAmount').value = '';
            document.getElementById('fundNote').value = '';
            
            // Refresh data if on users page
            if (window.location.pathname.includes('users.html')) {
                loadUsersData();
            }
        });
    });
}

// Setup dashboard event listeners
function setupDashboardEventListeners() {
    // Add funds button
    document.getElementById('addFundsBtn').addEventListener('click', () => {
        document.getElementById('addFundsModal').classList.add('active');
    });
    
    // Approve withdrawals button
    document.getElementById('approveWithdrawalsBtn').addEventListener('click', () => {
        window.location.href = 'transactions.html?type=withdrawal&status=pending';
    });
    
    // View transactions button
    document.getElementById('viewTransactionsBtn').addEventListener('click', () => {
        window.location.href = 'transactions.html';
    });
    
    // Refresh activity button
    document.getElementById('refreshActivity').addEventListener('click', loadRecentActivity);
    
    // Modal close buttons
    document.querySelectorAll('.modal-close, #cancelAddFunds').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
        });
    });
    
    // Confirm add funds
    document.getElementById('confirmAddFunds').addEventListener('click', addFundsToUser);
}

// Setup users event listeners
function setupUsersEventListeners() {
    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', () => {
        const searchTerm = document.getElementById('userSearch').value.trim().toLowerCase();
        if (!searchTerm) {
            loadUsersData();
            return;
        }
        
        database.ref('users').once('value').then(snapshot => {
            const users = snapshot.val();
            const tbody = document.getElementById('usersTableBody');
            tbody.innerHTML = '';
            
            if (!users) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">No users found</td></tr>';
                return;
            }
            
            let foundUsers = false;
            
            Object.entries(users).forEach(([userId, user]) => {
                if (userId.toLowerCase().includes(searchTerm) {
                    foundUsers = true;
                    addUserRow(tbody, userId, user);
                } else if (user.email && user.email.toLowerCase().includes(searchTerm)) {
                    foundUsers = true;
                    addUserRow(tbody, userId, user);
                } else if (user.name && user.name.toLowerCase().includes(searchTerm)) {
                    foundUsers = true;
                    addUserRow(tbody, userId, user);
                }
            });
            
            if (!foundUsers) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">No matching users found</td></tr>';
            }
        });
    });
    
    // Add user button
    document.getElementById('addUserBtn').addEventListener('click', () => {
        showToast('User registration should be done through the main website', 'info');
    });
    
    // Export users button
    document.getElementById('exportUsersBtn').addEventListener('click', () => {
        database.ref('users').once('value').then(snapshot => {
            const users = snapshot.val();
            if (!users) {
                showToast('No users to export', 'warning');
                return;
            }
            
            // Convert to CSV
            let csv = 'User ID,Name,Email,Balance,Status,Registration Date\n';
            
            Object.entries(users).forEach(([userId, user]) => {
                csv += `"${userId}","${user.name || ''}","${user.email || ''}",${user.balance || 0},"${user.status || 'active'}","${user.registrationDate ? formatDate(user.registrationDate) : ''}"\n`;
            });
            
            // Download CSV
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', `trade-world-users-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            showToast('Users exported successfully', 'success');
        });
    });
    
    // Close user details modal
    document.querySelector('#userDetailsModal .modal-close').addEventListener('click', () => {
        document.getElementById('userDetailsModal').classList.remove('active');
    });
}

// Setup transactions event listeners
function setupTransactionsEventListeners() {
    // Apply filters button
    document.getElementById('applyFiltersBtn').addEventListener('click', applyTransactionFilters);
    
    // Approve selected button
    document.getElementById('approveSelectedBtn').addEventListener('click', approveSelectedTransactions);
    
    // Reject selected button
    document.getElementById('rejectSelectedBtn').addEventListener('click', rejectSelectedTransactions);
    
    // Export transactions button
    document.getElementById('exportTransactionsBtn').addEventListener('click', exportTransactions);
    
    // Close transaction details modal
    document.querySelector('#transactionDetailsModal .modal-close, #closeTxModalBtn').addEventListener('click', () => {
        document.getElementById('transactionDetailsModal').classList.remove('active');
    });
    
    // Check if URL has filter parameters
    const urlParams = new URLSearchParams(window.location.search);
    const typeFilter = urlParams.get('type');
    const statusFilter = urlParams.get('status');
    
    if (typeFilter) {
        document.getElementById('transactionTypeFilter').value = typeFilter;
    }
    
    if (statusFilter) {
        document.getElementById('transactionStatusFilter').value = statusFilter;
    }
    
    // Apply filters if any
    if (typeFilter || statusFilter) {
        applyTransactionFilters();
    }
}

// Apply transaction filters
function applyTransactionFilters() {
    const typeFilter = document.getElementById('transactionTypeFilter').value;
    const statusFilter = document.getElementById('transactionStatusFilter').value;
    const dateFilter = document.getElementById('transactionDateFilter').value;
    
    let query = database.ref('transactions').orderByChild('timestamp');
    
    if (statusFilter !== 'all') {
        query = query.orderByChild('status').equalTo(statusFilter);
    }
    
    query.once('value').then(snapshot => {
        const transactions = snapshot.val();
        const tbody = document.getElementById('transactionsTableBody');
        tbody.innerHTML = '';
        
        if (!transactions) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No transactions found</td></tr>';
            return;
        }
        
        // Convert to array and sort by timestamp
        let transactionsArray = Object.entries(transactions).map(([id, tx]) => ({ id, ...tx }));
        transactionsArray.sort((a, b) => b.timestamp - a.timestamp);
        
        // Apply filters
        if (typeFilter !== 'all') {
            transactionsArray = transactionsArray.filter(tx => tx.type === typeFilter);
        }
        
        if (dateFilter) {
            const filterDate = new Date(dateFilter);
            const filterTimestamp = filterDate.getTime();
            const nextDayTimestamp = filterTimestamp + (24 * 60 * 60 * 1000);
            
            transactionsArray = transactionsArray.filter(tx => {
                return tx.timestamp >= filterTimestamp && tx.timestamp < nextDayTimestamp;
            });
        }
        
        if (transactionsArray.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No transactions match the filters</td></tr>';
            return;
        }
        
        transactionsArray.forEach(tx => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="tx-checkbox" data-txid="${tx.id}"></td>
                <td>${tx.id.substring(0, 8)}...</td>
                <td>${tx.userId || 'System'}</td>
                <td>${formatTxType(tx.type)}</td>
                <td>$${tx.amount?.toFixed(2) || '0.00'}</td>
                <td>${formatDate(tx.timestamp)}</td>
                <td class="status-${tx.status || 'completed'}">${formatStatus(tx.status)}</td>
                <td>
                    <button class="action-btn view" data-txid="${tx.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Attach event listeners to view buttons
        document.querySelectorAll('.action-btn.view').forEach(btn => {
            btn.addEventListener('click', () => showTransactionDetails(btn.dataset.txid));
        });
        
        // Setup checkbox functionality
        setupTransactionCheckboxes();
    });
}

// Setup transaction checkboxes
function setupTransactionCheckboxes() {
    const checkboxes = document.querySelectorAll('.tx-checkbox');
    const selectAll = document.getElementById('selectAllTransactions');
    const approveSelectedBtn = document.getElementById('approveSelectedBtn');
    const rejectSelectedBtn = document.getElementById('rejectSelectedBtn');
    
    // Select all checkbox
    selectAll.addEventListener('change', function() {
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
        updateSelectedButtons();
    });
    
    // Individual checkboxes
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedButtons);
    });
    
    function updateSelectedButtons() {
        const anyChecked = Array.from(checkboxes).some(checkbox => checkbox.checked);
        approveSelectedBtn.disabled = !anyChecked;
        rejectSelectedBtn.disabled = !anyChecked;
    }
}

// Approve selected transactions
function approveSelectedTransactions() {
    const selectedTxIds = Array.from(document.querySelectorAll('.tx-checkbox:checked')).map(checkbox => checkbox.dataset.txid);
    
    if (selectedTxIds.length === 0) {
        showToast('No transactions selected', 'warning');
        return;
    }
    
    if (!confirm(`Are you sure you want to approve ${selectedTxIds.length} selected transactions?`)) {
        return;
    }
    
    const updates = {};
    const promises = [];
    
    selectedTxIds.forEach(txId => {
        promises.push(
            database.ref('transactions/' + txId).once('value').then(snapshot => {
                const tx = snapshot.val();
                if (tx && tx.status === 'pending') {
                    updates[`transactions/${txId}/status`] = 'completed';
                    
                    if (tx.userId) {
                        updates[`users/${tx.userId}/transactions/${txId}/status`] = 'completed';
                    }
                    
                    // For deposits, add the funds to user balance
                    if (tx.type === 'deposit' && tx.userId) {
                        return database.ref(`users/${tx.userId}/balance`).once('value').then(snapshot => {
                            const currentBalance = parseFloat(snapshot.val()) || 0;
                            updates[`users/${tx.userId}/balance`] = currentBalance + parseFloat(tx.amount);
                        });
                    }
                }
            })
        );
    });
    
    Promise.all(promises).then(() => {
        return database.ref().update(updates);
    }).then(() => {
        showToast(`Successfully approved ${selectedTxIds.length} transactions`, 'success');
        loadTransactionsData();
    }).catch(error => {
        console.error('Error approving transactions:', error);
        showToast('Error approving transactions', 'error');
    });
}

// Reject selected transactions
function rejectSelectedTransactions() {
    const selectedTxIds = Array.from(document.querySelectorAll('.tx-checkbox:checked')).map(checkbox => checkbox.dataset.txid);
    
    if (selectedTxIds.length === 0) {
        showToast('No transactions selected', 'warning');
        return;
    }
    
    if (!confirm(`Are you sure you want to reject ${selectedTxIds.length} selected transactions?`)) {
        return;
    }
    
    const updates = {};
    const promises = [];
    
    selectedTxIds.forEach(txId => {
        promises.push(
            database.ref('transactions/' + txId).once('value').then(snapshot => {
                const tx = snapshot.val();
                if (tx && tx.status === 'pending') {
                    updates[`transactions/${txId}/status`] = 'rejected';
                    
                    if (tx.userId) {
                        updates[`users/${tx.userId}/transactions/${txId}/status`] = 'rejected';
                    }
                    
                    // For withdrawals, return the funds to user balance
                    if (tx.type === 'withdrawal' && tx.userId) {
                        return database.ref(`users/${tx.userId}/balance`).once('value').then(snapshot => {
                            const currentBalance = parseFloat(snapshot.val()) || 0;
                            updates[`users/${tx.userId}/balance`] = currentBalance + parseFloat(tx.amount);
                        });
                    }
                }
            })
        );
    });
    
    Promise.all(promises).then(() => {
        return database.ref().update(updates);
    }).then(() => {
        showToast(`Successfully rejected ${selectedTxIds.length} transactions`, 'success');
        loadTransactionsData();
    }).catch(error => {
        console.error('Error rejecting transactions:', error);
        showToast('Error rejecting transactions', 'error');
    });
}

// Export transactions
function exportTransactions() {
    const typeFilter = document.getElementById('transactionTypeFilter').value;
    const statusFilter = document.getElementById('transactionStatusFilter').value;
    
    let query = database.ref('transactions').orderByChild('timestamp');
    
    if (statusFilter !== 'all') {
        query = query.orderByChild('status').equalTo(statusFilter);
    }
    
    query.once('value').then(snapshot => {
        const transactions = snapshot.val();
        
        if (!transactions) {
            showToast('No transactions to export', 'warning');
            return;
        }
        
        // Convert to array and sort by timestamp
        let transactionsArray = Object.entries(transactions).map(([id, tx]) => ({ id, ...tx }));
        transactionsArray.sort((a, b) => b.timestamp - a.timestamp);
        
        // Apply type filter
        if (typeFilter !== 'all') {
            transactionsArray = transactionsArray.filter(tx => tx.type === typeFilter);
        }
        
        // Convert to CSV
        let csv = 'Transaction ID,User ID,Type,Amount,Status,Date,Details\n';
        
        transactionsArray.forEach(tx => {
            csv += `"${tx.id}","${tx.userId || 'System'}","${formatTxType(tx.type)}",${tx.amount || 0},"${tx.status || 'completed'}","${formatDate(tx.timestamp)}","${tx.details || ''}"\n`;
        });
        
        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `trade-world-transactions-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        showToast('Transactions exported successfully', 'success');
    });
}

// Helper function to add user row
function addUserRow(tbody, userId, user) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${userId}</td>
        <td>${user.name || 'N/A'}</td>
        <td>${user.email || 'N/A'}</td>
        <td>$${(user.balance || 0).toFixed(2)}</td>
        <td class="status-${user.status || 'active'}">${formatStatus(user.status)}</td>
        <td>
            <button class="action-btn view" data-userid="${userId}">
                <i class="fas fa-eye"></i>
            </button>
            <button class="action-btn edit" data-userid="${userId}">
                <i class="fas fa-edit"></i>
            </button>
        </td>
    `;
    tbody.appendChild(row);
    
    // Attach event listeners
    row.querySelector('.action-btn.view').addEventListener('click', () => showUserDetails(userId));
    row.querySelector('.action-btn.edit').addEventListener('click', () => editUser(userId));
}

// Edit user (placeholder function)
function editUser(userId) {
    showToast('User editing functionality coming soon', 'info');
}

// Format transaction type
function formatTxType(type) {
    if (!type) return 'Other';
    
    const typeMap = {
        'deposit': 'Deposit',
        'withdrawal': 'Withdrawal',
        'transfer': 'Transfer',
        'investment': 'Investment',
        'referral': 'Referral',
        'admin_deposit': 'Admin Deposit'
    };
    
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

// Format date
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
}

// Format status
function formatStatus(status) {
    if (!status) return 'Completed';
    return status.charAt(0).toUpperCase() + status.slice(1);
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
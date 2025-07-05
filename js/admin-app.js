document.addEventListener('DOMContentLoaded', function() {
    if (!checkAdminAuth()) return;

    // Set admin name
    document.getElementById('adminName').textContent = ADMIN_CREDENTIALS.userId;
    
    // Load all data
    loadDashboardData();
    setupDashboardEventListeners();
    
    // Logout functionality
    document.querySelectorAll('#logoutBtn, #logoutLink').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('adminAuthenticated');
            window.location.href = 'index.html';
        });
    });
});

function loadDashboardData() {
    // Load user count
    database.ref('users').once('value').then(snapshot => {
        document.getElementById('totalUsers').textContent = snapshot.numChildren();
    });

    // Load active investments
    database.ref('investments').orderByChild('status').equalTo('active').once('value').then(snapshot => {
        document.getElementById('activeInvestments').textContent = snapshot.numChildren();
    });

    // Load total deposits
    database.ref('transactions').orderByChild('type').equalTo('deposit').once('value').then(snapshot => {
        let total = 0;
        snapshot.forEach(child => {
            total += parseFloat(child.val().amount) || 0;
        });
        document.getElementById('totalDeposits').textContent = `$${total.toFixed(2)}`;
    });

    // Load pending withdrawals
    database.ref('transactions').orderByChild('status').equalTo('pending').once('value').then(snapshot => {
        let count = 0;
        snapshot.forEach(child => {
            if (child.val().type === 'withdrawal') count++;
        });
        document.getElementById('pendingWithdrawals').textContent = count;
    });

    // Load recent activity
    database.ref('transactions').orderByChild('timestamp').limitToLast(10).once('value').then(snapshot => {
        const tbody = document.getElementById('activityTableBody');
        tbody.innerHTML = '';
        
        if (!snapshot.exists()) {
            tbody.innerHTML = '<tr><td colspan="5">No recent activity</td></tr>';
            return;
        }

        snapshot.forEach(child => {
            const tx = child.val();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(tx.timestamp).toLocaleString()}</td>
                <td>${tx.userId || 'System'}</td>
                <td>${tx.type}</td>
                <td>$${(tx.amount || 0).toFixed(2)}</td>
                <td class="status-${tx.status || 'completed'}">${tx.status || 'completed'}</td>
            `;
            tbody.appendChild(row);
        });
    });
}

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

    // Modal close buttons
    document.querySelectorAll('.modal-close, #cancelAddFunds').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('addFundsModal').classList.remove('active');
        });
    });

    // Confirm add funds
    document.getElementById('confirmAddFunds').addEventListener('click', () => {
        const userId = document.getElementById('userId').value.trim();
        const amount = parseFloat(document.getElementById('fundAmount').value);
        const note = document.getElementById('fundNote').value.trim();

        if (!userId || isNaN(amount) || amount <= 0) {
            alert('Please enter valid user ID and amount');
            return;
        }

        database.ref('users/' + userId).once('value').then(snapshot => {
            if (!snapshot.exists()) {
                alert('User not found');
                return;
            }

            const updates = {};
            const currentBalance = parseFloat(snapshot.val().balance) || 0;
            const txId = database.ref().child('transactions').push().key;

            updates[`users/${userId}/balance`] = currentBalance + amount;
            updates[`transactions/${txId}`] = {
                userId: userId,
                type: 'admin_deposit',
                amount: amount,
                status: 'completed',
                timestamp: Date.now(),
                details: note || 'Admin added funds'
            };

            database.ref().update(updates).then(() => {
                alert(`Successfully added $${amount.toFixed(2)} to user ${userId}`);
                document.getElementById('addFundsModal').classList.remove('active');
                loadDashboardData();
            });
        });
    });
}

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
    update,
    push,
    set,
    get
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// DOM Elements
const usersTableBody = document.getElementById('usersTableBody');
const depositsTableBody = document.getElementById('depositsTableBody');
const withdrawalsTableBody = document.getElementById('withdrawalsTableBody');
const profitPercentageInput = document.getElementById('profitPercentage');
const distributeProfitBtn = document.getElementById('distributeProfitBtn');

// Load all data
function loadAllData() {
    loadUsers();
    loadDeposits();
    loadWithdrawals();
}

// Load users
function loadUsers() {
    const usersRef = ref(database, 'users');
    
    onValue(usersRef, (snapshot) => {
        usersTableBody.innerHTML = '';
        if (snapshot.exists()) {
            const users = snapshot.val();
            for (const userId in users) {
                const user = users[userId];
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${userId}</td>
                    <td>${user.name || 'N/A'}</td>
                    <td>${user.email || 'N/A'}</td>
                    <td>$${(user.balance || 0).toFixed(2)}</td>
                    <td><span class="status-active">Active</span></td>
                `;
                usersTableBody.appendChild(row);
            }
        }
    });
}

// Load deposit requests
function loadDeposits() {
    const depositsRef = ref(database, 'depositRequests');
    
    onValue(depositsRef, (snapshot) => {
        depositsTableBody.innerHTML = '';
        if (snapshot.exists()) {
            const deposits = snapshot.val();
            for (const depositId in deposits) {
                const deposit = deposits[depositId];
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${deposit.userId}</td>
                    <td>${deposit.userName || 'N/A'}</td>
                    <td>$${deposit.amount.toFixed(2)}</td>
                    <td>${deposit.method || 'N/A'}</td>
                    <td>${new Date(deposit.timestamp).toLocaleString()}</td>
                    <td><span class="status-${deposit.status || 'pending'}">${deposit.status || 'Pending'}</span></td>
                    <td>
                        ${deposit.status === 'pending' ? `
                        <button class="action-btn approve-btn" onclick="approveDeposit('${depositId}','${deposit.userId}',${deposit.amount})">Approve</button>
                        <button class="action-btn reject-btn" onclick="rejectDeposit('${depositId}')">Reject</button>
                        ` : 'Processed'}
                    </td>
                `;
                depositsTableBody.appendChild(row);
            }
        }
    });
}

// Load withdrawal requests
function loadWithdrawals() {
    const withdrawalsRef = ref(database, 'withdrawalRequests');
    
    onValue(withdrawalsRef, (snapshot) => {
        withdrawalsTableBody.innerHTML = '';
        if (snapshot.exists()) {
            const withdrawals = snapshot.val();
            for (const withdrawalId in withdrawals) {
                const withdrawal = withdrawals[withdrawalId];
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${withdrawal.userId}</td>
                    <td>${withdrawal.userName || 'N/A'}</td>
                    <td>$${withdrawal.amount.toFixed(2)}</td>
                    <td>${withdrawal.walletAddress || 'N/A'}</td>
                    <td>${new Date(withdrawal.timestamp).toLocaleString()}</td>
                    <td><span class="status-${withdrawal.status || 'pending'}">${withdrawal.status || 'Pending'}</span></td>
                    <td>
                        ${withdrawal.status === 'pending' ? `
                        <button class="action-btn approve-btn" onclick="approveWithdrawal('${withdrawalId}','${withdrawal.userId}',${withdrawal.amount})">Approve</button>
                        <button class="action-btn reject-btn" onclick="rejectWithdrawal('${withdrawalId}')">Reject</button>
                        ` : 'Processed'}
                    </td>
                `;
                withdrawalsTableBody.appendChild(row);
            }
        }
    });
}

// Approve deposit function
window.approveDeposit = async function(depositId, userId, amount) {
    try {
        // Update deposit status
        await update(ref(database, `depositRequests/${depositId}`), { 
            status: 'approved',
            processedAt: Date.now()
        });
        
        // Update user balance
        const userRef = ref(database, `users/${userId}`);
        const userSnapshot = await get(userRef);
        const currentBalance = userSnapshot.val().balance || 0;
        await update(userRef, { 
            balance: currentBalance + amount 
        });
        
        alert('Deposit approved successfully!');
    } catch (error) {
        alert('Error approving deposit: ' + error.message);
    }
};

// Approve withdrawal function
window.approveWithdrawal = async function(withdrawalId, userId, amount) {
    try {
        // Update withdrawal status
        await update(ref(database, `withdrawalRequests/${withdrawalId}`), { 
            status: 'approved',
            processedAt: Date.now()
        });
        
        alert('Withdrawal approved successfully!');
    } catch (error) {
        alert('Error approving withdrawal: ' + error.message);
    }
};

// Profit distribution function
distributeProfitBtn.addEventListener('click', async () => {
    const profitAmount = parseFloat(document.getElementById('profitAmount').value);
    const profitPercentage = parseFloat(profitPercentageInput.value);
    
    if (!profitAmount || !profitPercentage) {
        alert('Please enter both amount and percentage');
        return;
    }
    
    try {
        // Get all users with investments
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        
        if (!snapshot.exists()) {
            alert('No users found');
            return;
        }
        
        const users = snapshot.val();
        const distributionResults = [];
        const updates = {};
        
        // Calculate and distribute profit
        for (const userId in users) {
            const user = users[userId];
            if (user.totalInvestment > 0) {
                const profitShare = (profitAmount * (profitPercentage/100)) * (user.totalInvestment / 100);
                
                // Update user's trading profit
                updates[`users/${userId}/tradingProfit`] = (user.tradingProfit || 0) + profitShare;
                
                // Add to results
                distributionResults.push({
                    userId,
                    name: user.name,
                    investment: user.totalInvestment,
                    profit: profitShare.toFixed(2)
                });
            }
        }
        
        // Execute all updates
        await update(ref(database), updates);
        
        // Show results
        const resultsHTML = distributionResults.map(result => `
            <div class="user-profit-item">
                <span>${result.userId} (${result.name || 'No Name'})</span>
                <span>Investment: $${result.investment.toFixed(2)}</span>
                <span>Profit: $${result.profit}</span>
            </div>
        `).join('');
        
        document.getElementById('distributionResults').innerHTML = `
            <h3>Profit Distributed to ${distributionResults.length} Users</h3>
            ${resultsHTML}
        `;
        
        alert('Profit distributed successfully!');
    } catch (error) {
        alert('Error distributing profit: ' + error.message);
    }
});

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loadAllData();
        } else {
            window.location.href = '../login.html';
        }
    });
});

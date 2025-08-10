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
let systemSettings = {};
let usersData = [];
let packagesData = [];
let transactionsData = [];

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
    
    // Load packages data
    loadPackagesData();
    
    // Load transactions data
    loadTransactionsData();
}

function loadSystemSettings() {
    const settingsRef = ref(database, 'system/settings');
    
    onValue(settingsRef, (snapshot) => {
        if (snapshot.exists()) {
            systemSettings = snapshot.val();
            updateSettingsForm();
            
            // Update stats
            document.getElementById('totalUsers').textContent = usersData.length;
            document.getElementById('activePackages').textContent = packagesData.filter(pkg => pkg.status === 'active').length;
            document.getElementById('totalTransactions').textContent = transactionsData.length;
        }
    });
}

function loadUsersData() {
    const usersRef = ref(database, 'users');
    
    onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
            usersData = Object.values(snapshot.val());
            updateUsersTable();
        }
    });
}

function loadPackagesData() {
    const packagesRef = ref(database, 'packages');
    
    onValue(packagesRef, (snapshot) => {
        if (snapshot.exists()) {
            packagesData = Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data }));
            updatePackagesTable();
        }
    });
}

function loadTransactionsData() {
    const transactionsRef = ref(database, 'transactions');
    
    onValue(transactionsRef, (snapshot) => {
        if (snapshot.exists()) {
            transactionsData = Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data }));
            updateTransactionsTable();
        }
    });
}

function updateSettingsForm() {
    document.getElementById('adminCommission').value = (systemSettings.adminCommission * 100) || 60;
    document.getElementById('directCommission').value = (systemSettings.directCommission * 100) || 10;
    
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
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${user.uid.substring(0, 8)}...</td>
            <td>${user.name || 'N/A'}</td>
            <td>${user.email || 'N/A'}</td>
            <td>$${(user.balance || 0).toFixed(2)}</td>
            <td><span class="badge status-active">Active</span></td>
            <td>
                <button class="btn btn-small" data-action="edit" data-user="${user.uid}">Edit</button>
                <button class="btn btn-small btn-danger" data-action="delete" data-user="${user.uid}">Delete</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function updatePackagesTable() {
    const tableBody = document.getElementById('packagesTableBody');
    tableBody.innerHTML = '';
    
    packagesData.forEach(pkg => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${pkg.id.substring(0, 8)}...</td>
            <td>${pkg.name}</td>
            <td>$${pkg.amount}</td>
            <td>${pkg.return}%</td>
            <td><span class="badge status-${pkg.status || 'active'}">${pkg.status || 'Active'}</span></td>
            <td>
                <button class="btn btn-small" data-action="edit-pkg" data-pkg="${pkg.id}">Edit</button>
                <button class="btn btn-small btn-danger" data-action="delete-pkg" data-pkg="${pkg.id}">Delete</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function updateTransactionsTable() {
    const tableBody = document.getElementById('transactionsTableBody');
    tableBody.innerHTML = '';
    
    transactionsData.slice(0, 50).forEach(tx => {
        const row = document.createElement('tr');
        
        const date = new Date(tx.timestamp).toLocaleString();
        
        row.innerHTML = `
            <td>${tx.id.substring(0, 8)}...</td>
            <td>${tx.userId ? tx.userId.substring(0, 8) + '...' : 'System'}</td>
            <td>${tx.type}</td>
            <td>$${(tx.amount || 0).toFixed(2)}</td>
            <td>${date}</td>
            <td><span class="badge status-${tx.status || 'completed'}">${tx.status || 'Completed'}</span></td>
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
    
    // Add new package
    document.getElementById('addPackageBtn').addEventListener('click', () => {
        const name = document.getElementById('packageName').value.trim();
        const amount = parseFloat(document.getElementById('packageAmount').value);
        const returnPercent = parseFloat(document.getElementById('packageReturn').value);
        
        if (!name || !amount || !returnPercent) {
            showToast('Please fill all package details', 'error');
            return;
        }
        
        const packageData = {
            name,
            amount,
            return: returnPercent,
            status: 'active',
            createdAt: Date.now()
        };
        
        const newPackageRef = push(ref(database, 'packages'));
        set(newPackageRef, packageData)
            .then(() => {
                showToast('Package added successfully', 'success');
                document.getElementById('packageName').value = '';
                document.getElementById('packageAmount').value = '';
                document.getElementById('packageReturn').value = '';
            })
            .catch(error => {
                showToast('Failed to add package: ' + error.message, 'error');
            });
    });
    
    // Save settings
    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
        const adminCommission = parseFloat(document.getElementById('adminCommission').value) / 100;
        const directCommission = parseFloat(document.getElementById('directCommission').value) / 100;
        
        const levelCommissions = [];
        document.querySelectorAll('.level-input').forEach(input => {
            levelCommissions.push(parseFloat(input.value) / 100);
        });
        
        const settings = {
            adminCommission,
            directCommission,
            levelCommissions
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
        
        if (action === 'edit') {
            // Edit user functionality
            showToast('Edit user: ' + userId, 'warning');
        } else if (action === 'delete') {
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
    
    // Packages table actions
    document.getElementById('packagesTableBody').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        
        const action = btn.dataset.action;
        const pkgId = btn.dataset.pkg;
        
        if (action === 'edit-pkg') {
            // Edit package functionality
            showToast('Edit package: ' + pkgId, 'warning');
        } else if (action === 'delete-pkg') {
            if (confirm('Are you sure you want to delete this package?')) {
                remove(ref(database, `packages/${pkgId}`))
                    .then(() => {
                        showToast('Package deleted successfully', 'success');
                    })
                    .catch(error => {
                        showToast('Failed to delete package: ' + error.message, 'error');
                    });
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

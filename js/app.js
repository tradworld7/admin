// Replace your current event listener code with this:

function setupDashboardEventListeners() {
    // Add funds button
    document.getElementById('addFundsBtn')?.addEventListener('click', function() {
        console.log("Add Funds button clicked");
        document.getElementById('addFundsModal').classList.add('active');
    });
    
    // Approve withdrawals button
    document.getElementById('approveWithdrawalsBtn')?.addEventListener('click', function() {
        console.log("Approve Withdrawals button clicked");
        window.location.href = 'transactions.html?type=withdrawal&status=pending';
    });
    
    // View transactions button
    document.getElementById('viewTransactionsBtn')?.addEventListener('click', function() {
        console.log("View Transactions button clicked");
        window.location.href = 'transactions.html';
    });
    
    // Refresh activity button
    document.getElementById('refreshActivity')?.addEventListener('click', loadRecentActivity);
    
    // Modal close buttons
    document.querySelectorAll('.modal-close, #cancelAddFunds').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
        });
    });
    
    // Confirm add funds
    document.getElementById('confirmAddFunds')?.addEventListener('click', addFundsToUser);
}

// Make sure this runs when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    loadDashboardData();
    setupDashboardEventListeners();
    console.log("Event listeners attached");
});

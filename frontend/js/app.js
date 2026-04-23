document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('nexusUser'));
    const startBtn = document.getElementById('startWriting');
    
    if (user && user.loggedIn) {
        startBtn.innerHTML = '<i class="fas fa-dashboard me-2"></i>Go to Dashboard';
        startBtn.onclick = () => window.location.href = 'dashboard.html';
    } else {
        startBtn.onclick = () => window.location.href = 'login.html';
    }
});
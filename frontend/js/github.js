// ============================================================
//  NEXUSWrites – github.js
// ============================================================

// --- THEME (runs immediately to stop white flash) ---
(function syncTheme() {
    const isDark = localStorage.getItem('nexusTheme') === 'dark';
    document.body.classList.toggle('dark-mode', isDark);
    const sidebar = document.querySelector('.sidebar-left');
    if (sidebar) sidebar.classList.toggle('dark-mode', isDark);
})();

// --- PAGE META ---
document.addEventListener('DOMContentLoaded', () => {
    const pageHeader = document.getElementById('pageHeader');
    const pageIcon   = document.getElementById('pageIcon');
    if (pageHeader) pageHeader.innerText = 'GitHub Projects';
    if (pageIcon)   pageIcon.innerHTML   = '<i class="fab fa-github"></i>';
    document.title = 'GitHub Projects | NEXUSWrites';

    loadUserData();
    syncNotifications();
});

// ── THEMED ALERT (replaces every browser alert()) ──────────────
function nexusAlert(message, title = 'Notice', icon = 'fa-info-circle') {
    const el = document.getElementById('nexusAlertModal');
    if (!el) { console.warn('nexusAlertModal not found'); return; }
    document.getElementById('nexusAlertMessage').innerText = message;
    document.getElementById('nexusAlertTitle').innerText   = title;
    document.getElementById('nexusAlertIcon').className    = `fas ${icon} me-2`;
    new bootstrap.Modal(el).show();
}

// ── LOGOUT MODAL ───────────────────────────────────────────────
function showLogoutModal() {
    new bootstrap.Modal(document.getElementById('nexusLogoutModal')).show();
}

function logout() {
    localStorage.removeItem('nexusUser');
    window.location.href = 'login.html';
}
window.logoutUser = logout;

// ── NOTIFICATIONS ──────────────────────────────────────────────
function syncNotifications() {
    const badge = document.getElementById('nav-notification-badge');
    if (!badge) return;
    const count = parseInt(localStorage.getItem('nexusNotificationCount') || '0');
    if (count > 0) {
        badge.innerText     = count;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

// ── USER DATA ──────────────────────────────────────────────────
async function loadUserData() {
    const userData = JSON.parse(localStorage.getItem('nexusUser') || '{}');
    const navUser  = document.getElementById('navUsername');
    if (userData.name && navUser) navUser.innerText = userData.name;
}

// ── GITHUB REPO FETCH ──────────────────────────────────────────
async function fetchGitHubRepos() {
    const input     = document.getElementById('githubUsername');
    const username  = input ? input.value.trim() : '';
    const container = document.getElementById('github-content');

    if (!username) {
        nexusAlert('Please enter a GitHub username.', 'GitHub Search', 'fa-github');
        return;
    }

    container.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-info mb-3" role="status"></div>
            <p class="text-muted fw-medium">Connecting to Nexus API…</p>
        </div>`;

    try {
        const response = await fetch(`https://final-project-powerpuffgals-bsit2a.onrender.com/api/github/${username}`);
        if (!response.ok) throw new Error('User not found');

        const repos = await response.json();

        if (repos.length === 0) {
            container.innerHTML = `
                <p class="text-center text-secondary py-3">
                    This user has no public repositories.
                </p>`;
            return;
        }

        container.innerHTML = `
            <div class="mb-4 p-3 rounded-3 sync-banner border border-info text-center">
                <p class="small mb-2 sync-banner-text">
                    Found <strong>${username}</strong>. Is this you?
                </p>
                <button class="btn btn-nexus-primary btn-sm w-100"
                        onclick="syncThisAccount('${username}')">
                    <i class="fas fa-sync-alt me-2"></i> Sync to My Profile
                </button>
            </div>
            <div class="text-start" id="repo-list"></div>`;

        const list = document.getElementById('repo-list');
        repos.forEach(repo => {
            list.innerHTML += `
                <div class="repo-card p-3 rounded-3 mb-3 border">
                    <div class="d-flex justify-content-between align-items-start">
                        <h6 class="fw-bold mb-1 repo-title">${repo.name}</h6>
                        <span class="badge" style="background-color:var(--nexus-teal)">
                            <i class="fas fa-star text-warning me-1"></i>${repo.stars}
                        </span>
                    </div>
                    <p class="small text-muted mb-2">
                        ${repo.description || 'No description provided.'}
                    </p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="fw-bold text-info">${repo.language || 'Plain Text'}</small>
                        <a href="${repo.url}" target="_blank"
                           class="btn btn-sm btn-link text-decoration-none p-0">
                            View on GitHub <i class="fas fa-external-link-alt ms-1"></i>
                        </a>
                    </div>
                </div>`;
        });

    } catch (err) {
        container.innerHTML = `
            <p class="text-danger fw-bold text-center py-3">
                Error: ${err.message}. Please check your backend connection.
            </p>`;
    }
}

// Enter key triggers search
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('githubUsername');
    if (input) input.addEventListener('keydown', e => {
        if (e.key === 'Enter') fetchGitHubRepos();
    });
});

// ── SYNC ACCOUNT ───────────────────────────────────────────────
async function syncThisAccount(username) {
    const user  = JSON.parse(localStorage.getItem('nexusUser') || '{}');
    const token = localStorage.getItem('token');

    if (!token) {
        nexusAlert('You must be logged in to sync your GitHub account.', 'Login Required', 'fa-lock');
        return;
    }

    try {
        const response = await fetch('https://final-project-powerpuffgals-bsit2a.onrender.com/api/users/update', {
            method:  'PUT',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ githubUsername: username })
        });

        const data = await response.json();

        if (response.ok) {
            const updatedUser = { ...user, githubUsername: data.user?.githubUsername || username };
            localStorage.setItem('nexusUser', JSON.stringify(updatedUser));

            const modalMsg = document.getElementById('syncModalMessage');
            if (modalMsg) {
                modalMsg.innerText = `Successfully synced @${username} to your profile! ✨`;
                new bootstrap.Modal(document.getElementById('syncSuccessModal')).show();
                setTimeout(() => { window.location.href = 'profile.html'; }, 2000);
            } else {
                window.location.href = 'profile.html';
            }
        } else {
            nexusAlert(data.message || 'Failed to sync account.', 'Sync Failed', 'fa-exclamation-triangle');
        }
    } catch (err) {
        nexusAlert('Connection error. Is your backend running on port 5000?', 'Connection Error', 'fa-plug');
    }
}


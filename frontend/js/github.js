GitHub.js

        // Theme handling
        if (localStorage.getItem('nexusTheme') === 'dark') {
            document.body.classList.add('dark-mode');
        }

        const current = { title: 'GitHub Projects', icon: 'fa-github text-dark' };
        document.getElementById('pageHeader').innerText = current.title;
        document.querySelectorAll('.section-name').forEach(el => el.innerText = current.title);
        document.getElementById('pageIcon').innerHTML = `<i class="fas ${current.icon}"></i>`;
        document.title = current.title + " | NEXUSWrites";

        // GitHub Logic
        async function fetchGitHubRepos() {
            const username = document.getElementById('githubUsername').value.trim();
            const container = document.getElementById('github-content');
            if (!username) { alert("Please enter a username"); return; }
            container.innerHTML = `<div class="spinner-border text-info" role="status"></div><p class="mt-2">Connecting to Nexus API...</p>`;
            try {
                const response = await fetch(`http://localhost:5000/api/github/${username}`);
                if (!response.ok) throw new Error("User not found");
                const repos = await response.json();
                if (repos.length === 0) {
                    container.innerHTML = `<p class="text-secondary">This user has no public repositories.</p>`;
                    return;
                }
                container.innerHTML = `
                    <div class="mb-4 p-3 rounded-3 bg-light border border-info text-center shadow-sm">
                        <p class="small mb-2 text-dark">Found <strong>${username}</strong>. Is this you?</p>
                        <button class="btn btn-nexus-primary btn-sm w-100" onclick="syncThisAccount('${username}')">
                            <i class="fas fa-sync-alt me-2"></i> Sync to My Profile
                        </button>
                    </div>
                    <div class="text-start" id="repo-list"></div>`;
                const list = document.getElementById('repo-list');
                repos.forEach(repo => {
                    list.innerHTML += `
                        <div class="repo-card p-3 rounded-3 mb-3 shadow-sm border">
                            <div class="d-flex justify-content-between">
                                <h6 class="fw-bold mb-1 repo-title">${repo.name}</h6>
                                <span class="badge" style="background-color: var(--nexus-teal)">
                                    <i class="fas fa-star text-warning"></i> ${repo.stars}
                                </span>
                            </div>
                            <p class="small text-muted mb-2">${repo.description || 'No description provided.'}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="fw-bold text-info">${repo.language || 'Plain Text'}</small>
                                <a href="${repo.url}" target="_blank" class="btn btn-sm btn-link text-decoration-none p-0">
                                    View on GitHub <i class="fas fa-external-link-alt ms-1"></i>
                                </a>
                            </div>
                        </div>`;
                });
            } catch (err) {
                container.innerHTML = `<p class="text-danger fw-bold">Error: ${err.message}. Please check your backend connection.</p>`;
            }
        }

        async function syncThisAccount(username) {
    // 1. Correctly retrieve the token and user data
    const user = JSON.parse(localStorage.getItem('nexusUser') || '{}');
    
    // CHANGE: We now pull the token from its specific key where we saved it in login.js
    const token = localStorage.getItem('token'); 

    // Safety check: Ensure the user is actually logged in before trying to sync
    if (!token) {
        alert("You must be logged in to sync your GitHub account.");
        return;
    }

    try {
        // 2. HIT THE UPDATED BACKEND ROUTE
        const response = await fetch(`http://localhost:5000/api/users/update`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ githubUsername: username })
        });

        const data = await response.json();

        if (response.ok) {
            // 3. SUCCESS: Update the nexusUser in storage with the data from the server
            // This ensures all profile fields stay synced
            const updatedUser = { 
                ...user, 
                githubUsername: data.user.githubUsername || username 
            };
            
          // 1. Update local storage
            localStorage.setItem('nexusUser', JSON.stringify(updatedUser));
            
            // 2. Prepare the modal content
            const modalMsg = document.getElementById('syncModalMessage');
            if (modalMsg) {
                modalMsg.innerText = `Successfully synced @${username} to your profile! ✨`;
                
                // 3. Show the themed modal (Requires Bootstrap JS linked in HTML)
                const syncModal = new bootstrap.Modal(document.getElementById('syncSuccessModal'));
                syncModal.show();
                
                // 4. Wait 2 seconds before redirecting so they see the success!
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 2000);
            } else {
                // Fallback if modal HTML isn't found
                window.location.href = 'profile.html';
            }

        } else { 
            // Handle error without an ugly alert
            console.error("Sync Failed:", data.message);
            alert(data.message || "Failed to sync account."); 
        }
    } catch (err) { 
        console.error("Sync Error:", err);
        alert("Connection error. Is your backend running on port 5000?"); 
    }
}

        async function loadUserData() {
            const rawData = localStorage.getItem('nexusUser');
            const userData = JSON.parse(rawData || '{}');
            if (userData.name && document.getElementById('navUsername')) {
                document.getElementById('navUsername').innerText = userData.name;
            }
        }

        function logout() {
            localStorage.removeItem('nexusUser');
            window.location.href = 'login.html';
        }

        document.addEventListener('DOMContentLoaded', loadUserData);

        function syncNotifications() {
    // 1. Get the badge element (this ID must match on all pages)
    const badge = document.getElementById('nav-notification-badge');
    if (!badge) return;

    // 2. Get the saved notification count from localStorage
    const savedCount = localStorage.getItem('nexusNotificationCount') || '0';

    // 3. Update the UI
    if (parseInt(savedCount) > 0) {
        badge.innerText = savedCount;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

// Run this immediately when the script loads or on DOMContentLoaded
document.addEventListener('DOMContentLoaded', syncNotifications);

function syncNotifications() {
    const badge = document.getElementById('nav-notification-badge');
    if (!badge) return;

    // Pull the count from storage (make sure this matches the key in dashboard.js)
    const count = localStorage.getItem('nexusNotificationCount') || '0';

    if (parseInt(count) > 0) {
        badge.innerText = count;
        badge.style.display = 'block'; // Overrides the display:none in HTML
    } else {
        badge.style.display = 'none';
    }
}

// Run as soon as the Settings page loads
document.addEventListener('DOMContentLoaded', syncNotifications);
// Theme handling
if (localStorage.getItem('nexusTheme') === 'dark') {
    document.body.classList.add('dark-mode');
}

// Page Configuration
const filename = window.location.pathname.split('/').pop().split('.')[0] || 'following';
const pageConfigs = {
    'following': { title: 'Following', icon: 'fa-user-check text-success' },
    'github': { title: 'GitHub Projects', icon: 'fa-github text-dark' },
    'settings': { title: 'Settings', icon: 'fa-cog text-secondary' }
};

const current = pageConfigs[filename] || { title: 'NEXUSWrites', icon: 'fa-folder text-muted' };

// UI Setup
if (document.getElementById('pageTitle')) document.getElementById('pageTitle').innerText = current.title;
if (document.getElementById('pageIcon')) document.getElementById('pageIcon').innerHTML = `<i class="fas ${current.icon}"></i>`;
document.title = current.title + " | NEXUSWrites";

// Load Notifications and User Data
async function loadUserData() {
    const rawData = localStorage.getItem('nexusUser');
    const userData = JSON.parse(rawData || '{}');
    const token = userData.token;

    if (userData.name && document.getElementById('navUsername')) {
        document.getElementById('navUsername').innerText = userData.name;
    }

    if (!token) return;

    try {
        const response = await fetch('http://localhost:5000/api/notifications', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const badge = document.getElementById('nav-notification-badge');
            const list = document.getElementById('dropdown-notification-list');

            if (badge && data.unreadCount > 0) {
                badge.style.display = 'block';
                badge.innerText = data.unreadCount;
            }

            if (list && data.notifications && data.notifications.length > 0) {
                list.innerHTML = data.notifications.map(notif => {
                    let msg = notif.type === 'follow' ? 'started following you.' : 'interacted with your post.';
                    return `<div class="notification-item p-2 border-bottom small">
                                <strong class="${document.body.classList.contains('dark-mode') ? 'text-white' : 'text-dark'}">${notif.sender?.name || 'Someone'}</strong> ${msg}
                            </div>`;
                }).join('');
            }
        }
    } catch (err) {
        console.error('Notification error:', err);
    }
}

// FIX: Check if followedUsers is already declared by dashboard.js to prevent SyntaxError
if (typeof followedUsers === 'undefined') {
    window.followedUsers = JSON.parse(localStorage.getItem('nexusFollowedUsers')) || [];
}

function toggleFollow(userId, buttonElement) {
    const index = followedUsers.indexOf(userId);

    if (index === -1) {
        followedUsers.push(userId);
        buttonElement.innerHTML = '<i class="fas fa-user-check me-1"></i> Following';
        buttonElement.classList.add('active-follow');
    } else {
        followedUsers.splice(index, 1);
        buttonElement.innerHTML = '<i class="fas fa-user-plus me-1"></i> Follow';
        buttonElement.classList.remove('active-follow');
    }

    localStorage.setItem('nexusFollowedUsers', JSON.stringify(followedUsers));
    
    // Refresh the feed immediately
    fetchAndRenderFollowedPosts();
}

// Check if logout is already declared
if (typeof logout === 'undefined') {
    window.logout = function() {
        localStorage.removeItem('nexusUser');
        window.location.href = 'login.html';
    };
}

// --- INITIAL LOAD ---
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    fetchAndRenderFollowedPosts();
});

async function fetchAndRenderFollowedPosts() {
    const container = document.getElementById('postsContainer');
    if (!container) return;

    const user = JSON.parse(localStorage.getItem('nexusUser'));
    const followedList = JSON.parse(localStorage.getItem('nexusFollowedUsers')) || [];

    if (followedList.length === 0) {
        container.innerHTML = `
            <div class="card fb-card p-5 text-center mt-4">
                <div class="placeholder-icon mb-3">
                    <i class="fas fa-user-plus opacity-50"></i>
                </div>
                <h4 class="fw-bold">No followed creators yet</h4>
                <p class="text-muted">Follow other writers to see their tutorials here.</p>
                <div class="mt-4">
                    <a href="dashboard.html" class="btn btn-nexus">Discover Writers</a>
                </div>
            </div>`;
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/posts', {
            headers: { 'Authorization': `Bearer ${user?.token}` }
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        const allPosts = Array.isArray(data) ? data : (data.posts || []);

        const myFeed = allPosts.filter(post => {
            const authorId = (post.author?._id || post.author || post.userId || "").toString();
            return followedList.includes(authorId);
        });

        if (myFeed.length === 0) {
            container.innerHTML = `
                <div class="card fb-card p-5 text-center mt-4">
                    <p class="mb-0 text-muted fw-medium">The people you follow haven't posted anything yet.</p>
                </div>`;
            return;
        }

        // Uses renderSinglePost from dashboard.js to keep teal borders and dark blue comments
        container.innerHTML = myFeed.reverse()
            .map(post => renderSinglePost(post, user))
            .join('');

    } catch (err) {
        console.error("Error loading following feed:", err);
        container.innerHTML = `
            <div class="card fb-card p-4 text-center mt-4 border-danger">
                <p class="text-danger fw-bold">Unable to reach the server. Please check your connection.</p>
            </div>`;
    }
}
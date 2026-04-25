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
document.querySelectorAll('.section-name').forEach(el => el.innerText = current.title);
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

// Follow/Unfollow Logic
let followedUsers = JSON.parse(localStorage.getItem('nexusFollowedUsers')) || [];

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
    
    // Refresh the feed immediately if we are on the following page
    if (window.location.pathname.includes('following.html')) {
        renderFollowedPosts();
    }
}

// Render the Followed Feed
function renderFollowedPosts() {
    const container = document.getElementById('postsContainer');
    if (!container) return;

    const followedList = JSON.parse(localStorage.getItem('nexusFollowedUsers')) || [];
    const allPosts = JSON.parse(localStorage.getItem('nexusPosts')) || [];

    // Filter posts from people you follow
    const myFeed = allPosts.filter(post => followedList.includes(post.userId));

    if (myFeed.length === 0) {
        container.innerHTML = `
            <div class="py-5 bg-light rounded-4 border border-dashed text-center mt-4">
                <p class="mb-0 text-secondary fw-medium">No posts from people you follow yet.</p>
            </div>`;
        return;
    }

    // Render using Dashboard Design
    container.innerHTML = myFeed.map(post => `
        <div class="card fb-card p-4 mb-3 shadow-sm border-0 text-start mt-3">
            <div class="d-flex align-items-center mb-3">
                <i class="fas fa-user-circle fa-3x text-muted me-3"></i>
                <div>
                    <h5 class="mb-0 fw-bold">${post.username}</h5>
                    <small class="text-muted">${post.category || 'Tutorial'}</small>
                </div>
            </div>
            <h4 class="fw-bold">${post.title}</h4>
            <p class="text-muted">${post.content}</p>
            ${post.image ? `<img src="${post.image}" class="img-fluid rounded-3 mb-3" style="width:100%; max-height:400px; object-fit:cover;">` : ''}
            <div class="pt-3 border-top">
                <button class="btn btn-sm active-follow" onclick="toggleFollow('${post.userId}', this)">
                    <i class="fas fa-user-check me-1"></i> Following
                </button>
            </div>
        </div>
    `).join('');
}

function logout() {
    localStorage.removeItem('nexusUser');
    window.location.href = 'login.html';
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    renderFollowedPosts();
});
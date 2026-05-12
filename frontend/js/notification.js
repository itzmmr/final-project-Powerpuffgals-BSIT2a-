    //NOTIFICATIONS PAGE SCRIPT

    // --- 1. Load Notifications on Start ---
    async function loadNotifications() {
    const container = document.getElementById('notification-list');
    
    // 1. Safety check: Exit if the container doesn't exist on this specific page
    if (!container) return; 

    // 2. Correct Retrieval: Get the token FROM the nexusUser object
    const userData = JSON.parse(localStorage.getItem('nexusUser') || '{}');
    const token = userData.token;

    // 3. Logic fix: If the token is missing inside nexusUser, THEN redirect
    if (!token) {
        console.warn("No active session found. Redirecting...");
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('https://final-project-powerpuffgals-bsit2a.onrender.com/api/notifications', {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json'
            }
        });

        // Handle expired tokens or unauthorized access
        if (response.status === 401) {
            localStorage.removeItem('nexusUser');
            window.location.href = 'login.html';
            return;
        }

        if (!response.ok) throw new Error("Failed to fetch notifications");

        const data = await response.json();
        
        // Handle both array and object response formats
        const notifications = Array.isArray(data) ? data : (data.notifications || []);

        if (notifications.length === 0) {
            container.innerHTML = `
                <div class="empty-state bg-white rounded-3 shadow-sm p-5 text-center">
                    <i class="fas fa-inbox fa-3x mb-3 text-muted"></i>
                    <h5>All caught up!</h5>
                    <p class="small text-muted">When people interact with your IT stories, they'll show up here.</p>
                </div>`;
            return;
        }

        // 4. Render using your global helper
        container.innerHTML = notifications.map(n => renderNotificationItem(n)).join('');

    } catch (err) {
        console.error("Load Error:", err);
        container.innerHTML = `
            <div class="alert alert-danger m-3 shadow-sm">
                <i class="fas fa-exclamation-circle me-2"></i>
                Connection error. Please ensure your backend is running.
            </div>`;
    }
}
   // --- 2.1 Simple Template for Dropdown (NO IMAGES) ---
function renderSimpleNotificationItem(n) {
    const unreadClass = n.isRead ? '' : 'notification-unread';
    const senderName = n.sender ? n.sender.name : 'Someone';
    
    let actionText = "";
    switch(n.type) {
        case 'like': actionText = `liked your post.`; break;
        case 'comment': actionText = `commented on your post.`; break;
        case 'follow': actionText = `started following you.`; break;
        default: actionText = `interacted with you.`;
    }

    return `
        <div class="list-group-item list-group-item-action p-2 ${unreadClass} border-bottom">
            <p class="mb-0" style="font-size: 0.9rem; color: #333;">
                <span class="fw-bold">${senderName}</span> ${actionText}
            </p>
        </div>
    `;
}

    async function checkNotifications() {
    const userData = JSON.parse(localStorage.getItem('nexusUser') || '{}');
    const token = userData.token;
    if (!token) return;

    try {
        const response = await fetch('https://final-project-powerpuffgals-bsit2a.onrender.com/api/notifications', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            const notifications = Array.isArray(data) ? data : (data.notifications || []);
            
            const badge = document.getElementById('nav-notification-badge');
            const dropdownList = document.getElementById('dropdown-notification-list');

            // 1. Update the Red Badge
            if (badge) {
                const unreadCount = notifications.filter(n => !n.isRead).length;
                if (unreadCount > 0) {
                    badge.innerText = unreadCount;
                    badge.style.display = 'block';
                } else {
                    badge.style.display = 'none';
                }
            }

            // 2. Update the Dropdown List (This makes them look the same!)
            if (dropdownList) {
                if (notifications.length > 0) {
                    // Use the SAME renderNotificationItem function so photos appear
                    dropdownList.innerHTML = notifications.slice(0, 5).map(n => renderNotificationItem(n)).join('');
                } else {
                    dropdownList.innerHTML = `
                        <div class="p-4 text-center">
                            <p class="text-muted small mb-0">No new notifications</p>
                        </div>`;
                }
            }
        }
    } catch (err) {
        console.error("Badge Check Error:", err);
    }
}
    // --- 3. Mark All as Read ---
   async function markAllAsRead() {
    // 1. Hide it INSTANTLY for that fast feel
    const badge = document.getElementById('nav-notification-badge');
    if (badge) badge.style.display = 'none';

    const userData = JSON.parse(localStorage.getItem('nexusUser') || '{}');
    const token = userData.token;
    if (!token) return;

    try {
        const response = await fetch('https://final-project-powerpuffgals-bsit2a.onrender.com/api/notifications/read', {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            // 2. Refresh the list so the background color/font-weight updates
            if (typeof loadNotifications === 'function') loadNotifications();
            if (typeof checkNotifications === 'function') checkNotifications();
        } else {
            // If the server failed, bring the badge back
            if (badge) badge.style.display = 'block';
        }
    } catch (err) {
        console.error("Update Error:", err);
        if (badge) badge.style.display = 'block';
    }
}

function logout() {
    localStorage.removeItem('nexusUser');
    window.location.href = '../index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const userData = JSON.parse(localStorage.getItem('nexusUser') || '{}');
    
    // 1. Run Navbar update
    updateNavbar();

    // 2. Only run these if the user is logged in
    if (userData.token) {
        checkNotifications(); // Updates the badge and dropdown
        
        // 3. Only run this if we are on the actual Notifications page
        if (document.getElementById('notification-list')) {
            loadNotifications();
        }
    }
});
   
// At the very bottom of notification.js
document.addEventListener('DOMContentLoaded', () => {
    // Only call updateNavbar if it actually loaded from app.js
    if (typeof updateNavbar === 'function') {
        updateNavbar();
    } else {
        console.warn("updateNavbar not found - check if app.js has errors!");
    }
});

// --- New Simple Template for Dropdown only ---
function renderSimpleNotificationItem(n) {
    const unreadClass = n.isRead ? '' : 'notification-unread';
    const senderName = n.sender ? n.sender.name : 'Someone';
    
    let actionText = "";
    switch(n.type) {
        case 'like': actionText = `liked your post.`; break;
        case 'comment': actionText = `commented on your post.`; break;
        case 'follow': actionText = `started following you.`; break;
        default: actionText = `interacted with you.`;
    }

    return `
        <div class="list-group-item list-group-item-action p-2 ${unreadClass} border-bottom">
            <p class="mb-0" style="font-size: 0.9rem; color: #333;">
                <span class="fw-bold">${senderName}</span> ${actionText}
            </p>
        </div>
    `;
}
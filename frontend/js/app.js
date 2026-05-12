document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('nexusUser'));
    const path = window.location.pathname;

    if (path.includes('profile.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const profileIdFromUrl = urlParams.get('id');
        const myId = user ? String(user._id || user.id || "") : null;
        
        if (profileIdFromUrl && myId && String(profileIdFromUrl) !== myId) {
            const editBtn = document.getElementById('editProfileBtn');
            if (editBtn) {
                editBtn.style.setProperty('display', 'none', 'important');
                editBtn.classList.add('hidden-element');
            }
        }
    }

    console.log("🚀 NexusWrites Frontend Loaded on:", path);

    // --- 1. INDEX PAGE LOGIC ---
    if (path.includes('index.html') || path.endsWith('/') || path.endsWith('frontend/')) {
        const startBtn = document.getElementById('startWriting');
        if (startBtn) {
            if (user && user.loggedIn) {
                startBtn.innerHTML = '<i class="fas fa-columns me-2"></i>Go to Dashboard';
                startBtn.onclick = () => window.location.href = 'pages/dashboard.html';
            } else {
                startBtn.onclick = () => window.location.href = 'pages/login.html';
            }
        }
    }

       
// --- PROFILE PAGE LOGIC ---
    if (path.includes('profile.html')) {
        if (!user || !user.loggedIn) {
            window.location.href = 'login.html';
            return;
        }
        // These functions are defined in your profile.html <script>
        if (typeof loadProfile === 'function') loadProfile();
        if (typeof loadMyPosts === 'function') loadMyPosts();
    }

});

// --- GLOBAL UTILITIES ---
function openPostModal() {
    const modal = new bootstrap.Modal(document.getElementById('postModal'));
    modal.show();
}

async function handlePostSubmit() {
    // 1. Get user and check if they exist to avoid "cannot read property token of null"
    const userData = localStorage.getItem('nexusUser');
    if (!userData) {
        alert("You must be logged in to post.");
        return;
    }
    
    const user = JSON.parse(userData);
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const tagsInput = document.getElementById('postTags').value; 
    const categorySelect = document.getElementById('postCategorySelect').value;
    const categoryCustom = document.getElementById('postCategoryCustom').value;
    const imageFile = document.getElementById('postPhotoFile').files[0];

    // Convert string to array for hashtag support
    const tagsArray = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== "");
    const category = categorySelect === "OTHER" ? categoryCustom : categorySelect;

    // 2. Prepare FormData
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', category);
    
    // Append tags correctly for the backend
    tagsArray.forEach(tag => formData.append('tags[]', tag));

    if (imageFile) formData.append('image', imageFile);

    try {
        const response = await fetch('https://final-project-powerpuffgals-bsit2a.onrender.com/api/posts', {
            method: 'POST',
            headers: { 
                // Ensure there is a space after Bearer and the token exists
                'Authorization': `Bearer ${user.token}` 
                // NOTE: DO NOT add 'Content-Type': 'multipart/form-data' here. 
                // Browser handles it automatically for FormData.
            },
            body: formData
        });

        if (response.ok) {
            location.reload();
        } else {
            const err = await response.json();
            // If the backend says "malformed", the token string in localStorage might be corrupted
            alert(err.message || "Failed to publish tutorial");
            
            if (err.message.includes("token") || response.status === 401) {
                console.error("Token Issue. Check localStorage 'nexusUser' structure.");
            }
        }
    } catch (err) {
        console.error("Fetch error:", err);
        alert("Connection error while posting.");
    }
}

function checkCustomCategory(select) {
    const customInput = document.getElementById('postCategoryCustom');
    if (select.value === "OTHER") {
        customInput.classList.remove('d-none');
    } else {
        customInput.classList.add('d-none');
    }
}

// --- MISSING COMMENT & REPLY LOGIC (ADD THIS) ---

function renderComments(commentList, postId) {
    if (!commentList || commentList.length === 0) return '';

    return commentList.map((comment) => {
        const cId = comment._id.toString(); 
        const pId = postId.toString();
        
        const user = JSON.parse(localStorage.getItem('nexusUser'));
        const isCommentOwner = user && (
            (comment.user?._id && comment.user._id === user._id) || 
            (comment.user === user._id)
        );

        return `
        <div class="comment-thread mb-3" style="position: relative;">
            <div class="comment-box shadow-sm p-3 rounded bg-light border-start border-success border-4">
                <div class="d-flex justify-content-between align-items-center">
                    <strong class="text-success">${comment.user?.name || 'Nexus Writer'}</strong>
                    <small class="text-muted">${new Date(comment.createdAt).toLocaleDateString()}</small>
                </div>
                <p class="mb-0 mt-1" id="text-${cId}" style="font-size: 0.95rem;">${comment.text}</p>
            </div>
            
            <div class="comment-actions mt-1 ms-2 d-flex gap-3" style="font-size: 0.85rem; position: relative; z-index: 10;">
                <span class="action-btn text-muted" onclick="toggleCommentLike('${pId}', '${cId}')" style="cursor: pointer;">
                    <i class="fas fa-thumbs-up"></i> ${comment.likes?.length || 0} Likes
                </span>
                
                <span class="action-btn text-primary" onclick="toggleReplyInput('${pId}', '${cId}')" style="cursor: pointer;">
                    <i class="fas fa-reply"></i> Reply
                </span>

                ${isCommentOwner ? `
                    <span class="action-btn text-success" onclick="editComment('${pId}', '${cId}')" style="cursor: pointer;">
                        <i class="fas fa-edit"></i> Edit
                    </span>
                    <span class="action-btn text-danger" onclick="deleteComment('${pId}', '${cId}')" style="cursor: pointer;">
                        <i class="fas fa-trash"></i> Delete
                    </span>
                ` : ''}
            </div>

            <div id="reply-input-${pId}-${cId}" class="mt-2 ms-3 d-none">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control" id="field-${pId}-${cId}" placeholder="Write a reply...">
                    <button class="btn btn-success" onclick="submitReply('${pId}', '${cId}')">Send</button>
                </div>
            </div>

            <div class="nested-replies ms-4 mt-2 border-start ps-3" style="border-left: 2px solid #dee2e6 !important;">
                ${comment.replies && comment.replies.length > 0 ? renderComments(comment.replies, postId) : ''}
            </div>
        </div>`;
    }).join('');
}

function toggleReplyInput(postId, targetId) {
    const el = document.getElementById(`reply-input-${postId}-${targetId}`);
    if (el) {
        el.classList.toggle('d-none');
        if (!el.classList.contains('d-none')) {
            const input = document.getElementById(`field-${postId}-${targetId}`);
            if (input) input.focus();
        }
    }
}

async function submitReply(postId, targetId) {
    const user = JSON.parse(localStorage.getItem('nexusUser'));
    const input = document.getElementById(`field-${postId}-${targetId}`);
    if (!input || !input.value.trim() || !user?.token) return;

    try {
        const response = await fetch(`https://final-project-powerpuffgals-bsit2a.onrender.com/api/posts/${postId}/comment/${targetId}/reply`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}` 
            },
            body: JSON.stringify({ text: input.value.trim() })
        });
        if (response.ok) {
            input.value = '';
            toggleReplyInput(postId, targetId);
            // Refresh logic: if you are on post.html, call fetchPostDetails()
            // If you are on dashboard.html, call loadFeed()
            typeof fetchPostDetails === 'function' ? fetchPostDetails() : location.reload();
        }
    } catch (err) { console.error("Reply failed:", err); }
}

async function toggleCommentLike(postId, targetId) {
    const user = JSON.parse(localStorage.getItem('nexusUser'));
    if (!user?.token) return alert("Log in first!");

    try {
        const response = await fetch(`https://final-project-powerpuffgals-bsit2a.onrender.com/api/posts/${postId}/comment/${targetId}/like`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${user.token}`,
                'Content-Type': 'application/json' 
            }
        });
        if (response.ok) {
            typeof fetchPostDetails === 'function' ? fetchPostDetails() : location.reload();
        }
    } catch (err) { console.error("Like failed:", err); }
}

// --- GLOBAL FOLLOW HANDLER (Add this to app.js) ---
async function handleFollowAction(targetId) {
    const user = JSON.parse(localStorage.getItem('nexusUser'));
    if (!user || !user.token) {
        alert("Please log in to follow this user!");
        return;
    }

    try {
        const response = await fetch(`https://final-project-powerpuffgals-bsit2a.onrender.com/api/users/follow/${targetId}`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${user.token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // 1. Update Feed Links (Subtle '• Follow' text in the feed)
            const feedLinks = document.querySelectorAll(`[id^="follow-link-${targetId}"]`);
            feedLinks.forEach(link => {
                link.innerText = data.isFollowing ? '• Following' : '• Follow';
            });

            // 2. Update Profile Page (Large button and counts)
            const profileBtn = document.getElementById('followBtn');
            if (profileBtn) {
                // Only call this if the function exists on the current page
                if (typeof updateFollowButtonUI === 'function') {
                    updateFollowButtonUI(data.isFollowing);
                }
                
                // Automatically refresh follower/following counts
                if (typeof loadProfile === 'function') {
                    loadProfile(); 
                }
            }
        }
    } catch (err) {
        console.error("Follow error:", err);
    }
}
/* NAVBAR */
function updateNavbar() {
    const userSnapshot = localStorage.getItem('nexusUser');
    const navRight = document.getElementById('navbar-right'); // Or whatever your container ID is
    
    if (userSnapshot && navRight) {
        const user = JSON.parse(userSnapshot);
        navRight.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="profile.html" style="color: #1a535c;">
                    <i class="fas fa-user-circle"></i> ${user.name}
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link text-danger" href="#" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </a>
            </li>
        `;
    }
}
document.addEventListener('DOMContentLoaded', updateNavbar);

async function checkNotifications() {
    // 1. Get the nexusUser object and extract the token
    const userData = JSON.parse(localStorage.getItem('nexusUser') || '{}');
    const token = userData.token; 

    // 2. Security Check: If no token, don't try to fetch
    if (!token) return;

    try {
        const response = await fetch('https://final-project-powerpuffgals-bsit2a.onrender.com/api/notifications', {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error("Notification fetch failed");

        const data = await response.json();
        
        const badge = document.getElementById('nav-notification-badge');
        const list = document.getElementById('dropdown-notification-list');
        
        // 3. Update Badge (Only if the element exists)
        if (badge) {
            if (data.unreadCount > 0) {
                badge.style.display = 'block';
                badge.innerText = data.unreadCount;
            } else {
                badge.style.display = 'none';
            }
        }

        // 4. Update Dropdown List (Only if the element exists)
        if (list) {
            if (data.notifications && data.notifications.length > 0) {
                list.innerHTML = data.notifications.map(n => `
                    <div class="p-2 border-bottom small">
                        <strong>${n.sender?.name || 'Someone'}</strong> 
                        ${n.type === 'follow' ? 'followed you' : 'interacted with your post'}
                    </div>
                `).join('');
            } else {
                list.innerHTML = '<p class="small text-muted text-center p-2">No new notifications</p>';
            }
        }
    } catch (err) {
        console.error("Notification Error:", err);
    }
}

    // --- 2. Notification Item Template ---
    function renderNotificationItem(n) {
        const unreadClass = n.isRead ? '' : 'notification-unread';
        const senderName = n.sender ? n.sender.name : 'Someone';
        const senderAvatar = (n.sender && n.sender.avatar) ? n.sender.avatar : 'https://via.placeholder.com/45';
        const timeAgo = new Date(n.createdAt).toLocaleString();
        
        let actionText = "";
        let icon = "";

        switch(n.type) {
            case 'like':
                actionText = `liked your post <span class="fw-bold text-dark">"${n.post?.title || 'Untitled Post'}"</span>`;
                icon = '<i class="fas fa-heart text-danger small"></i>';
                break;
            case 'comment':
                actionText = `commented on your post <span class="fw-bold text-dark">"${n.post?.title || 'Untitled Post'}"</span>`;
                icon = '<i class="fas fa-comment text-primary small"></i>';
                break;
            case 'follow':
                actionText = `started following you`;
                icon = '<i class="fas fa-user-plus text-success small"></i>';
                break;
            default:
                actionText = `interacted with your profile`;
                icon = '<i class="fas fa-info-circle text-secondary small"></i>';
        }

        return `
            <div class="list-group-item list-group-item-action p-3 notification-card ${unreadClass} border-bottom">
                <div class="d-flex align-items-center">
                    <div class="position-relative">
                        <img src="${senderAvatar}" class="rounded-circle avatar-img me-3 shadow-sm" alt="User">
                        <span class="position-absolute bottom-0 end-0 bg-white rounded-circle p-1" style="transform: translate(-10px, 5px);">
                            ${icon}
                        </span>
                    </div>
                    <div class="flex-grow-1">
                        <p class="mb-0 text-muted" style="font-size: 0.95rem;">
                            <span class="fw-bold text-dark">${senderName}</span> ${actionText}
                        </p>
                        <small class="text-muted" style="font-size: 0.8rem;">
                            <i class="far fa-clock me-1"></i> ${timeAgo}
                        </small>
                    </div>
                </div>
            </div>
        `;
    }

    // --- 3. Mark All as Read ---
    async function markAllAsRead() {
    // 1. Get token from the object, not a standalone key
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
            // 2. Refresh the UI components
            if (typeof loadNotifications === 'function') loadNotifications();
            if (typeof checkNotifications === 'function') checkNotifications();
            
            // Optional: Hide the badge immediately for better UX
            const badge = document.getElementById('nav-notification-badge');
            if (badge) badge.style.display = 'none';
        }
    } catch (err) {
        console.error("Mark Read Error:", err);
    }
}

// Ensure the page loads notifications only when on the correct page
document.addEventListener('DOMContentLoaded', () => {
    const userData = JSON.parse(localStorage.getItem('nexusUser') || '{}');
    
    // Initial check for the badge (runs on all pages with a navbar)
    if (userData.token) {
        checkNotifications();
        
        // If we are on the specific notifications page, load the full list
        if (document.getElementById('notification-list')) {
            loadNotifications();
        }
    }
});

        //SIGNUP PAGE SCRIPT

        
    let base64Image = "";

    function previewImage(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById('avatarPreview');
                preview.src = e.target.result;
                preview.style.display = 'block';
                document.getElementById('avatarIcon').style.display = 'none';
                base64Image = e.target.result;
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    function toggleOther(selectId, otherId) {
        const val = document.getElementById(selectId).value;
        document.getElementById(otherId).style.display = (val === 'Other') ? 'block' : 'none';
    }

    function goToPage(page) {
        if (page === 2) {
            const fields = ['regName', 'regEmail', 'regDob', 'regGender', 'regPassword'];
            const allFilled = fields.every(id => document.getElementById(id).value);
            const pass = document.getElementById('regPassword').value;
            const confirm = document.getElementById('regConfirmPassword').value;

            if(!allFilled) {
                alert("Please fill in all identity fields."); 
                return;
            }
            if(pass !== confirm) { alert("Passwords do not match."); return; }
        }
        document.getElementById('page1').style.display = (page === 1) ? 'block' : 'none';
        document.getElementById('page2').style.display = (page === 2) ? 'block' : 'none';
    }

   const registerForm = document.getElementById('registerForm');
if (registerForm) 
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = document.getElementById('signupBtn');
        const btnText = btn.querySelector('.btn-text');
        const spinner = btn.querySelector('.spinner-border');

        btn.disabled = true;
        btnText.classList.add('d-none');
        spinner.classList.remove('d-none');

        let finalRole = document.getElementById('regWorkSelect').value;
        if (finalRole === "Other") finalRole = document.getElementById('workOther').value;
        
        let interests = Array.from(document.querySelectorAll('input[name="interest"]:checked'))
            .map(i => i.value.toLowerCase());
        
        const custom = document.getElementById('interestOther').value.trim();
        if (custom) interests.push(custom.toLowerCase());

        const signupData = {
            name: document.getElementById('regName').value,
            email: document.getElementById('regEmail').value,
            password: document.getElementById('regPassword').value,
            dob: document.getElementById('regDob').value,
            gender: document.getElementById('regGender').value.toLowerCase(), 
            bio: document.getElementById('regBio').value || "Technical Contributor",
            role: finalRole || "IT Student",
            githubUsername: document.getElementById('regGithub').value.trim(), // ADDED: GitHub Username
            interests: interests,
            avatar: base64Image
        };

        try {
            const response = await fetch('https://final-project-powerpuffgals-bsit2a.onrender.com/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(signupData)
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('nexusUser', JSON.stringify(data));
                window.location.href = 'dashboard.html';
            } else {
                alert(data.error || data.message || "Registration failed.");
                resetBtn();
            }
        } catch (error) {
            alert("Cannot connect to server. Check if backend is running.");
            resetBtn();
        }

        function resetBtn() {
            btn.disabled = false;
            btnText.classList.remove('d-none');
            spinner.classList.add('d-none');
        }
    });

    //LOGIN PAGE SCRIPT

    
   const loginForm = document.getElementById('loginForm');
if (loginForm) 
    loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // 1. Get Values & UI Elements
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = document.getElementById('submitBtn');
    const loginText = submitBtn.querySelector('.login-text');
    const loginSpinner = submitBtn.querySelector('.login-spinner');

    // 2. Show Loading State
    loginText.classList.add('d-none');
    loginSpinner.classList.remove('d-none');
    submitBtn.disabled = true;

    try {
        // 3. HIT THE REAL BACKEND
        const response = await fetch('https://final-project-powerpuffgals-bsit2a.onrender.com/api/users/login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // SUCCESS: Explicitly map the token and IDs to ensure they aren't undefined
            const userToStore = {
                ...data,
                token: data.token, // Explicitly capture token
                _id: data._id || data.id,
                id: data.id || data._id,
                loggedIn: true 
            };

            localStorage.setItem('nexusUser', JSON.stringify(userToStore));
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            // SERVER ERROR (Invalid credentials, etc.)
            alert(data.message || "Login failed. Please check your credentials.");
            resetButton();
        }
    } catch (error) {
        // NETWORK ERROR (Server is down)
        console.error("Connection Error:", error);
        alert("Connection refused. Is your backend running on port 5000?");
        resetButton();
    }

    function resetButton() {
        loginText.classList.remove('d-none');
        loginSpinner.classList.add('d-none');
        submitBtn.disabled = false;
    }
});

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
    // --- 2. Notification Item Template ---
    function renderNotificationItem(n) {
        const unreadClass = n.isRead ? '' : 'notification-unread';
        const senderName = n.sender ? n.sender.name : 'Someone';
        const senderAvatar = (n.sender && n.sender.avatar) ? n.sender.avatar : 'https://via.placeholder.com/45';
        const timeAgo = new Date(n.createdAt).toLocaleString();
        
        let actionText = "";
        let icon = "";

        switch(n.type) {
            case 'like':
                actionText = `liked your post <span class="fw-bold text-dark">"${n.post?.title || 'Untitled Post'}"</span>`;
                icon = '<i class="fas fa-heart text-danger small"></i>';
                break;
            case 'comment':
                actionText = `commented on your post <span class="fw-bold text-dark">"${n.post?.title || 'Untitled Post'}"</span>`;
                icon = '<i class="fas fa-comment text-primary small"></i>';
                break;
            case 'follow':
                actionText = `started following you`;
                icon = '<i class="fas fa-user-plus text-success small"></i>';
                break;
            default:
                actionText = `interacted with your profile`;
                icon = '<i class="fas fa-info-circle text-secondary small"></i>';
        }

        return `
            <div class="list-group-item list-group-item-action p-3 notification-card ${unreadClass} border-bottom">
                <div class="d-flex align-items-center">
                    <div class="position-relative">
                        <img src="${senderAvatar}" class="rounded-circle avatar-img me-3 shadow-sm" alt="User">
                        <span class="position-absolute bottom-0 end-0 bg-white rounded-circle p-1" style="transform: translate(-10px, 5px);">
                            ${icon}
                        </span>
                    </div>
                    <div class="flex-grow-1">
                        <p class="mb-0 text-muted" style="font-size: 0.95rem;">
                            <span class="fw-bold text-dark">${senderName}</span> ${actionText}
                        </p>
                        <small class="text-muted" style="font-size: 0.8rem;">
                            <i class="far fa-clock me-1"></i> ${timeAgo}
                        </small>
                    </div>
                </div>
            </div>
        `;
    }

    // --- 3. Mark All as Read ---
    async function markAllAsRead() {
    // 1. Correct Retrieval: Get the token from inside the nexusUser package
    const userData = JSON.parse(localStorage.getItem('nexusUser') || '{}');
    const token = userData.token;
    
    if (!token) return;

    try {
        const response = await fetch('https://final-project-powerpuffgals-bsit2a.onrender.com/api/notifications/read', {
            method: 'PUT', // Ensure your backend route supports PUT
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            // 2. Refresh UI: Clear the badge and reload the list
            const badge = document.getElementById('nav-notification-badge');
            if (badge) badge.style.display = 'none';
            
            // Re-run your loading functions to show the updated state
            if (typeof loadNotifications === 'function') loadNotifications();
            if (typeof checkNotifications === 'function') checkNotifications();
        }
    } catch (err) {
        console.error("Update Error:", err);
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

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('✅ Service Worker registered! Scope:', reg.scope))
            .catch(err => console.error('❌ Service Worker registration failed:', err));
    });
}
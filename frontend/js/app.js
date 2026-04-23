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

   // --- 2. LOGIN PAGE LOGIC (Updated) ---
if (path.includes('login.html')) {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            if(submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Connecting...';
            }

            try {
                const response = await fetch('http://localhost:5000/api/users/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailInput.value, password: passwordInput.value })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // --- AUTO-FETCH SECURITY CHECK ---
                    // Verify the token exists in the server response before saving
                    if (!data.token || data.token === 'undefined') {
                        console.error("Login failed: Server did not return a valid token.");
                        alert('Login successful, but session token is missing. Please contact support.');
                        return;
                    }

                    // Normalize the ID: ensure we have both _id and id to prevent 
                    // ownership check bugs in displayPosts
                    const userToStore = {
                        ...data,
                        _id: data._id || data.id,
                        id: data.id || data._id,
                        loggedIn: true
                    };

                    // Save the validated user object to storage
                    localStorage.setItem('nexusUser', JSON.stringify(userToStore));
                    
                    // Redirect to dashboard
                    window.location.href = 'dashboard.html'; 
                } else {
                    alert(data.message || 'Invalid Login Credentials');
                }
            } catch (error) {
                console.error("Login Error:", error);
                alert('Cannot reach the server. Please ensure your backend is running!');
            } finally {
                if(submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Login';
                }
            }
        });
    }
}
    // --- 3. DASHBOARD PAGE LOGIC ---
    if (path.includes('dashboard.html')) {
        if (!user || !user.loggedIn) {
            window.location.href = 'login.html';
            return;
        }

        const feedUsername = document.getElementById('feedUsername');
        if (feedUsername) feedUsername.textContent = `Welcome, ${user.name || "Nexus Writer"}!`;

        const postsContainer = document.getElementById('postsContainer');
        
        async function loadFeed() {
            if (!postsContainer) return;
            postsContainer.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-success"></div><p>Syncing with the Nexus...</p></div>';

            try {
                const response = await fetch('http://localhost:5000/api/posts', {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                const posts = await response.json();

                if (!posts || posts.length === 0) {
                    postsContainer.innerHTML = '<div class="text-center p-5 bg-white rounded shadow-sm"><p class="text-muted">No tutorials shared yet. Start the conversation!</p></div>';
                    return;
                }

                postsContainer.innerHTML = posts.map(post => {
                    // SAFETY CHECK: This is the fix for your console error!
                    const tagsHTML = (post.tags && typeof post.tags === 'string') 
                        ? post.tags.split(',').map(tag => `<span class="badge bg-light text-dark me-1">#${tag.trim()}</span>`).join('')
                        : '';

                    return `
                    <div class="card fb-card p-4 mb-4 shadow-sm border-0">
                        <div class="d-flex align-items-center mb-3">
                            <img src="${post.author?.avatar || 'https://via.placeholder.com/50'}" class="rounded-circle me-3 border" width="50" height="50">
                            <div>
                                <h6 class="mb-0 fw-bold">${post.author?.name || 'Dev Community'}</h6>
                                <small class="text-muted">${new Date(post.createdAt).toLocaleDateString()}</small>
                            </div>
                        </div>
                        <h5 class="fw-bold" style="color: #2d3e33;">${post.title}</h5>
                        <div class="mb-2">${tagsHTML}</div>
                        <span class="badge mb-3" style="background: #5b6d5b; width: fit-content;">${post.category}</span>
                        <p class="text-secondary">${post.content.substring(0, 200)}...</p>
                        ${post.image ? `<img src="${post.image}" class="img-fluid rounded mb-3" style="max-height: 300px; width: 100%; object-fit: cover;">` : ''}
                        <div class="d-flex justify-content-between align-items-center border-top pt-3">
                            <button class="btn btn-sm btn-link text-success text-decoration-none p-0" onclick="window.location.href='post.html?id=${post._id}'">Read Full Tutorial →</button>
                            <div class="text-muted small"><i class="fas fa-heart text-danger"></i> ${post.likes?.length || 0}</div>
                        </div>
                    </div>`;
                }).join('');
            } catch (err) {
                postsContainer.innerHTML = '<p class="text-danger">Failed to load posts. Is the backend running?</p>';
            }
        }
        loadFeed();

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.onclick = (e) => {
                e.preventDefault();
                localStorage.removeItem('nexusUser');
                window.location.href = '../index.html'; 
            };
        }
    }

    // --- 4. SIGNUP PAGE LOGIC ---
    if (path.includes('signup.html')) {
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(signupForm);
                const submitBtn = signupForm.querySelector('button[type="submit"]'); // FIXED SELECTOR

                if(submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = 'Initialising...';
                }

                try {
                    const response = await fetch('http://localhost:5000/api/users', {
                        method: 'POST',
                        body: formData
                    });
                    const data = await response.json();
                    if (response.ok) {
                        alert('Nexus account created!');
                        window.location.href = 'login.html';
                    } else {
                        alert(data.message || 'Signup failed');
                    }
                } catch (error) {
                    alert('Server connection error.');
                } finally {
                    if(submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = 'Sign Up';
                    }
                }
            });
        }
    }
});

// --- 5. PROFILE PAGE LOGIC ---
    if (path.includes('profile.html')) {
        if (!user || !user.loggedIn) {
            window.location.href = 'login.html';
            return;
        }
        // These functions are defined in your profile.html <script>
        if (typeof loadProfile === 'function') loadProfile();
        if (typeof loadMyPosts === 'function') loadMyPosts();
    }

// --- GLOBAL UTILITIES ---
function openPostModal() {
    const modal = new bootstrap.Modal(document.getElementById('postModal'));
    modal.show();
}

async function handlePostSubmit() {
    const user = JSON.parse(localStorage.getItem('nexusUser'));
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const categorySelect = document.getElementById('postCategorySelect').value;
    const categoryCustom = document.getElementById('postCategoryCustom').value;
    const tags = document.getElementById('postTags').value; 
    const imageFile = document.getElementById('postPhotoFile').files[0];

    if (!title || !content) {
        alert("Please fill in the title and content.");
        return;
    }

    const category = categorySelect === "OTHER" ? categoryCustom : categorySelect;
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', category);
    formData.append('tags', tags);
    if (imageFile) formData.append('image', imageFile);

    try {
        const response = await fetch('http://localhost:5000/api/posts', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${user.token}` },
            body: formData
        });
        if (response.ok) {
            location.reload();
        } else {
            const err = await response.json();
            alert(err.error || "Failed to publish tutorial");
        }
    } catch (err) {
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
        const response = await fetch(`http://localhost:5000/api/posts/${postId}/comment/${targetId}/reply`, {
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
        const response = await fetch(`http://localhost:5000/api/posts/${postId}/comment/${targetId}/like`, {
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
        const response = await fetch(`http://localhost:5000/api/users/follow/${targetId}`, {
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

// Function to check for new notifications
async function checkNotifications() {
    const user = JSON.parse(localStorage.getItem('nexusUser') || '{}');
    if (!user.token) return;

    try {
        const res = await fetch('http://localhost:5000/api/notifications', {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const notifications = await res.json();
        
        // Filter for notifications where isRead is false
        const unread = notifications.filter(n => !n.isRead).length;
        
        const badge = document.getElementById('nav-notification-badge');
        if (badge) {
            if (unread > 0) {
                badge.innerText = unread;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (err) {
        console.error("Badge error:", err);
    }
}

// Run this every 30 seconds to keep it updated
if (localStorage.getItem('nexusUser')) {
    checkNotifications();
    setInterval(checkNotifications, 30000); 
}

async function checkNotifications() {
    try {
        const response = await fetch('http://localhost:5000/api/notifications', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        
        const badge = document.getElementById('nav-notification-badge');
        const list = document.getElementById('dropdown-notification-list');
        
        if (data.unreadCount > 0) {
            badge.style.display = 'block';
            badge.innerText = data.unreadCount;
            
            // Generate the list items
            list.innerHTML = data.notifications.map(n => `
                <div class="p-2 border-bottom small">
                    <strong>${n.sender.name}</strong> ${n.type === 'follow' ? 'followed you' : 'liked your post'}
                </div>
            `).join('');
        }
    } catch (err) {
        console.error("Notif Error:", err);
    }
}

// Function to fetch and display notifications
async function loadNotifications() {
    // FIX: Pull token from the nexusUser object, not a separate 'token' key
    const userData = JSON.parse(localStorage.getItem('nexusUser') || '{}');
    const token = userData.token; 

    const welcomeHeader = document.querySelector('.welcome-section h2');
    if (welcomeHeader && userData.name) {
        welcomeHeader.innerText = `Welcome back, ${userData.name}!`;
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
        
        const data = await response.json();
        const badge = document.getElementById('nav-notification-badge');
        const list = document.getElementById('dropdown-notification-list');
        
        if (badge) {
            // Now this matches the updated backend object
            if (data.unreadCount > 0) {
                badge.style.display = 'block';
                badge.innerText = data.unreadCount;
            } else {
                badge.style.display = 'none';
            }
        }

        if (list) {
            if (data.notifications && data.notifications.length > 0) {
                list.innerHTML = data.notifications.map(notif => `
                    <div class="notification-item p-2 border-bottom small">
                        <strong>${notif.sender?.name || 'Someone'}</strong> 
                        ${notif.type === 'follow' ? 'started following you.' : 'interacted with your post.'}
                    </div>
                `).join('');
            } else {
                list.innerHTML = '<p class="small text-muted text-center p-3">No new notifications.</p>';
            }
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

//NOTIFICATIONS PAGE SCRIPT


    // --- 1. Load Notifications on Start ---
    async function loadNotifications() {
        const container = document.getElementById('notification-list');
        
        // Fix: Use your standard localStorage keys
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('nexusUser') || '{}');
        
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/notifications', {
                headers: { 
                    'Authorization': `Bearer ${token}`, // Correct Bearer format
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error("Failed to fetch");

            const data = await response.json();
            
            // Handle both array response and object response { notifications: [] }
            const notifications = Array.isArray(data) ? data : (data.notifications || []);

            if (notifications.length === 0) {
                container.innerHTML = `
                    <div class="empty-state bg-white rounded-3 shadow-sm">
                        <i class="fas fa-inbox fa-3x mb-3 text-muted"></i>
                        <h5>All caught up!</h5>
                        <p class="small">When people interact with your IT stories, they'll show up here.</p>
                    </div>`;
                return;
            }

            container.innerHTML = notifications.map(n => renderNotificationItem(n)).join('');

        } catch (err) {
            console.error("Load Error:", err);
            container.innerHTML = `<div class="alert alert-danger m-3">Connection error. Please ensure your backend is running.</div>`;
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
        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch('http://localhost:5000/api/notifications/read', {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                loadNotifications();
                // If you have a global function to update the navbar badge, call it here:
                if (typeof checkNotifications === 'function') checkNotifications();
            }
        } catch (err) {
            console.error("Update Error:", err);
        }
    }

    document.addEventListener('DOMContentLoaded', loadNotifications);

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

    document.getElementById('registerForm').addEventListener('submit', async function(e) {
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
            const response = await fetch('http://localhost:5000/api/users', {
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

    
   document.getElementById('loginForm').addEventListener('submit', async function(e) {
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
        const response = await fetch('http://localhost:5000/api/users/login', {
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
    
//SIGNUP PAGE SCRIPT



    //NOTIFICATIONS PAGE SCRIPT

    // --- 1. Load Notifications on Start ---
    async function loadNotifications() {
        const container = document.getElementById('notification-list');
        
        // Fix: Use your standard localStorage keys
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('nexusUser') || '{}');
        
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/notifications', {
                headers: { 
                    'Authorization': `Bearer ${token}`, // Correct Bearer format
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error("Failed to fetch");

            const data = await response.json();
            
            // Handle both array response and object response { notifications: [] }
            const notifications = Array.isArray(data) ? data : (data.notifications || []);

            if (notifications.length === 0) {
                container.innerHTML = `
                    <div class="empty-state bg-white rounded-3 shadow-sm">
                        <i class="fas fa-inbox fa-3x mb-3 text-muted"></i>
                        <h5>All caught up!</h5>
                        <p class="small">When people interact with your IT stories, they'll show up here.</p>
                    </div>`;
                return;
            }

            container.innerHTML = notifications.map(n => renderNotificationItem(n)).join('');

        } catch (err) {
            console.error("Load Error:", err);
            container.innerHTML = `<div class="alert alert-danger m-3">Connection error. Please ensure your backend is running.</div>`;
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
        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch('http://localhost:5000/api/notifications/read', {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                loadNotifications();
                // If you have a global function to update the navbar badge, call it here:
                if (typeof checkNotifications === 'function') checkNotifications();
            }
        } catch (err) {
            console.error("Update Error:", err);
        }
    }

    document.addEventListener('DOMContentLoaded', loadNotifications);

    

   
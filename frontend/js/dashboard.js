// Add this to the very top of dashboard.js
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
}
    // --- 1. SECURITY CHECK (Kicks unauthorized users out immediately) ---
    (function() {
        const session = localStorage.getItem('nexusUser');
        if (!session || session === "null" || session === "undefined") {
            window.location.href = "index.html"; 
        }
    })();

// --- 1. LOGOUT FUNCTION ---
window.logoutUser = function() {
    console.log("Clearing NexusWrite session...");
    localStorage.removeItem('nexusUser'); 
    localStorage.removeItem('token');
    localStorage.removeItem('nexusPosts'); 
    window.location.href = "index.html";
};

// --- 2. TRANSLATIONS ---
if (typeof window.translations === 'undefined') {
    window.translations = {
        'English': { 
            home: 'Home', following: 'Following', settings: 'Settings', logout: 'Logout', 
            notifications: 'Notifications', viewprofile: 'View Profile', 
            sharePrompt: 'What tutorial would you like to share today?', 
            post: 'Post a tutorial...', createNew: 'Create New Tutorial', 
            tutTitle: 'Tutorial Title', tutContent: 'Content', tutTags: 'Tags', 
            publish: 'Publish', welcome: 'Welcome back', 
            footerText: '© 2024 NEXUSWrites. Your Tech. Your Story.' 
        },
        'Filipino': { 
            home: 'Home', following: 'Sinusundan', settings: 'Mga Setting', logout: 'Mag-log Out', 
            notifications: 'Mga Notification', viewprofile: 'Tingnan ang Profile', 
            sharePrompt: 'Anong tutorial ang gusto mong ibahagi?', 
            post: 'Mag-post ng tutorial...', createNew: 'Gumawa ng Bagong Tutorial', 
            tutTitle: 'Pamagat ng Tutorial', tutContent: 'Nilalaman', tutTags: 'Mga Tag', 
            publish: 'I-publish', welcome: 'Maligayang pagbabalik', 
            footerText: '© 2024 NEXUSWrites. Ang Iyong Tech. Ang Iyong Kwento.' 
        }
    };
}

// --- 3. PERSISTENT DATA ---
let posts = JSON.parse(localStorage.getItem('nexusPosts')) || [];
let selectedFileBase64 = null;

// --- 4. PAGINATION GLOBALS (client‑side) ---
let currentPage = 1;
const POSTS_PER_PAGE = 10;
let allPostsRaw = [];      // all posts fetched from server
let isLoading = false;

// --- 5. LANGUAGE APPLY ---
function applyLanguage() {
    const lang = localStorage.getItem('nexusLang') || 'English';
    const dict = window.translations ? window.translations[lang] : null;
    if (!dict) {
        console.warn("Translation data not ready or dictionary missing.");
        return;
    }
    document.querySelectorAll('[data-key]').forEach(el => { 
        if(dict[el.dataset.key]) el.innerText = dict[el.dataset.key]; 
    });
    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (dict[key]) {
            if (el.tagName === 'INPUT' && el.placeholder) {
                el.placeholder = dict[key];
            } else {
                el.innerText = dict[key];
            }
        }
    });
    const currentUser = JSON.parse(localStorage.getItem('nexusUser')) || { name: 'User' };
    const feedUserEl = document.getElementById('feedUsername');
    if (feedUserEl && dict.welcome) {
        feedUserEl.textContent = `${dict.welcome}, ${currentUser.name || currentUser.username || 'User'}!`;
    }
    const navUserEl = document.getElementById('navUsername');
    if (navUserEl) {
        navUserEl.textContent = currentUser.name || 'User';
    }
}

window.changeLanguage = function(lang) {
    localStorage.setItem('nexusLang', lang);
    applyLanguage();
};

document.addEventListener('DOMContentLoaded', applyLanguage);
localStorage.setItem('nexusPosts', JSON.stringify(posts));

/* --- COMMENTING ENGINE (unchanged) --- */
function renderComments(commentList, postId) {
    if (!commentList || commentList.length === 0) return '';

    const userObj = JSON.parse(localStorage.getItem('nexusUser')) || {};
    const myId = userObj._id || userObj.id;

    return commentList.map((comment) => {
        const cId = comment._id ? comment._id.toString() : ''; 
        const pId = postId ? postId.toString() : '';
        const commentAuthorId = comment.user?._id || comment.user || comment.author?._id || comment.author;
        const isCommentOwner = myId && commentAuthorId === myId;

        return `
        <div class="comment-thread mb-4">
            <div class="comment-box p-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <strong class="comment-author-name">
                        <i class="fas fa-user-circle me-1"></i>
                        ${comment.user?.name || comment.author?.name || 'Nexus Writer'}
                    </strong>
                    <small class="opacity-75" style="font-size: 0.7rem; color: inherit;">
                        ${comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Just now'}
                    </small>
                </div>
                <p class="mb-0 comment-text-body" id="text-${cId}">
                    ${escapeHtml(comment.text || comment.content || '')}
                </p>
            </div>
            
            <div class="comment-actions ms-2 d-flex gap-3 mt-2">
                <a href="javascript:void(0)" class="action-btn" onclick="toggleCommentLike('${pId}', '${cId}')">
                    <i class="fas fa-thumbs-up me-1"></i> ${comment.likes?.length || 0} Likes
                </a>
                
                <a href="javascript:void(0)" class="action-btn" onclick="toggleReplyInput('${pId}', '${cId}')">
                    <i class="fas fa-reply me-1"></i> Reply
                </a>

                ${isCommentOwner ? `
                    <a href="javascript:void(0)" class="action-btn text-success" onclick="editComment('${pId}', '${cId}')">
                        <i class="fas fa-edit me-1"></i>Edit
                    </a>
                    <a href="javascript:void(0)" class="action-btn text-danger" onclick="deleteComment('${pId}', '${cId}')">
                        <i class="fas fa-trash me-1"></i>Delete
                    </a>
                ` : ''}
            </div>

            <div id="reply-input-${pId}-${cId}" class="mt-2 ms-3 d-none">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control comment-input-field" id="field-${pId}-${cId}" placeholder="Write a reply...">
                    <button class="btn btn-success" onclick="submitReply('${pId}', '${cId}')">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>

            <div class="nested-replies ms-4 mt-2 ps-3" style="border-left: 2px solid rgba(45, 212, 191, 0.2);">
                ${comment.replies && comment.replies.length > 0 ? renderComments(comment.replies, postId) : ''}
            </div>
        </div>`;
    }).join('');
}

// Helper to prevent XSS
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

async function toggleCommentLike(postId, commentId) {
    const user = JSON.parse(localStorage.getItem('nexusUser'));
    if (!user || !user.token) {
        alert("Please log in to like comments!");
        return;
    }
    if (!postId || !commentId) {
        console.error("Missing IDs:", { postId, commentId });
        return;
    }
    try {
        const response = await fetch(`http://localhost:5000/api/posts/${postId}/comment/${commentId}/like`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${user.token}`,
                'Content-Type': 'application/json'
            }
        });
        if (response.ok) {
            fetchAllPostsAndRefresh();
        } else {
            const errorData = await response.json();
            alert(`Error: ${errorData.message}`);
        }
    } catch (err) {
        console.error("Network/Fetch Error:", err);
    }
}

async function submitMainComment(postId) {
    const user = JSON.parse(localStorage.getItem('nexusUser'));
    if (!user || !user.token) {
        alert("Please log in to comment.");
        return;
    }
    const input = document.getElementById(`main-comment-${postId}`);
    const text = input.value.trim();
    if (!text) return;
    try {
        input.disabled = true;
        const response = await fetch(`http://localhost:5000/api/posts/${postId}/comment`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}` 
            },
            body: JSON.stringify({ text })
        });
        if (response.ok) {
            input.value = ''; 
            fetchAllPostsAndRefresh();
        } else {
            const data = await response.json();
            alert(data.message || "Failed to post comment.");
        }
    } catch (err) {
        console.error("Comment Error:", err);
    } finally {
        input.disabled = false;
    }
}

async function deleteComment(postId, commentId) {
    if (!confirm("Delete this comment?")) return;
    const user = JSON.parse(localStorage.getItem('nexusUser'));
    try {
        const response = await fetch(`http://localhost:5000/api/posts/${postId}/comment/${commentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (response.ok) fetchAllPostsAndRefresh(); 
        else alert("You can only delete your own comments!");
    } catch (err) {
        console.error("Delete failed", err);
    }
}

async function editComment(postId, commentId) {
    const oldText = document.getElementById(`text-${commentId}`).innerText;
    const newText = prompt("Update your comment:", oldText);
    if (!newText || newText === oldText) return;
    const user = JSON.parse(localStorage.getItem('nexusUser'));
    try {
        const response = await fetch(`http://localhost:5000/api/posts/${postId}/comment/${commentId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}` 
            },
            body: JSON.stringify({ text: newText })
        });
        if (response.ok) fetchAllPostsAndRefresh();
    } catch (err) {
        console.error("Edit failed:", err);
    }
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
    if (!user || !user.token) return alert("Please log in to reply!");
    const input = document.getElementById(`field-${postId}-${targetId}`);
    if (!input || !input.value.trim()) return;
    const text = input.value.trim();
    try {
        const response = await fetch(`http://localhost:5000/api/posts/${postId}/comment/${targetId}/reply`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}` 
            },
            body: JSON.stringify({ text })
        });
        if (response.ok) {
            input.value = ''; 
            toggleReplyInput(postId, targetId);
            fetchAllPostsAndRefresh();
        }
    } catch (err) {
        console.error("Reply failed:", err);
    }
}

/* --- POST LOGIC WITH CLIENT‑SIDE PAGINATION (FIXED) --- */

// Fetches all posts once, stores them, then displays first page
async function fetchAllPostsAndRefresh() {
    if (isLoading) return;
    isLoading = true;

    const container = document.getElementById('postsContainer');
    if (container) {
        container.innerHTML = `
            <div class="text-center p-5">
                <div class="spinner-border" style="color: #2dd4bf;" role="status"></div>
                <p class="mt-2 text-muted">Loading tutorials...</p>
            </div>`;
    }

    const userSnapshot = localStorage.getItem('nexusUser');
    if (!userSnapshot) {
        window.location.href = 'login.html';
        return;
    }
    const user = JSON.parse(userSnapshot);
    const token = user.token;

    try {
        const response = await fetch('http://localhost:5000/api/posts', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('nexusUser');
            window.location.href = 'login.html';
            return;
        }

        let data = await response.json();
        console.log("Backend response:", data);

        // Extract posts array (supports array or { posts: [...] })
        if (Array.isArray(data)) {
            allPostsRaw = data;
        } else if (data && data.posts && Array.isArray(data.posts)) {
            allPostsRaw = data.posts;
        } else if (data && data.data && Array.isArray(data.data)) {
            allPostsRaw = data.data;
        } else {
            console.error("Unexpected response format:", data);
            allPostsRaw = [];
        }

        console.log(`Loaded ${allPostsRaw.length} posts`);
        if (allPostsRaw.length > 0) {
            console.log("First post sample:", allPostsRaw[0]); // DEBUG
        }

        currentPage = 1;
        displayCurrentPage();
    } catch (err) {
        console.error("Fetch error:", err);
        if (container) {
            container.innerHTML = '<div class="alert alert-danger">Cannot connect to the NexusWrites server. Check console.</div>';
        }
    } finally {
        isLoading = false;
    }
}

// Displays the current page of posts
function displayCurrentPage(filter = "") {
    const container = document.getElementById('postsContainer');
    if (!container) {
        console.error("postsContainer element not found!");
        return;
    }

    const userSnapshot = localStorage.getItem('nexusUser');
    const user = userSnapshot ? JSON.parse(userSnapshot) : null;

    // Apply search filter if any
    let postsToShow = allPostsRaw;
    if (filter && filter.trim() !== "") {
        const search = filter.toLowerCase();
        postsToShow = allPostsRaw.filter(p => 
            (p.title || "").toLowerCase().includes(search) || 
            (p.content || "").toLowerCase().includes(search)
        );
    }

    const totalPosts = postsToShow.length;
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    const end = start + POSTS_PER_PAGE;
    const pagePosts = postsToShow.slice(start, end);

    console.log(`Displaying page ${currentPage}, posts ${start+1}-${Math.min(end, totalPosts)} of ${totalPosts}`);

    if (pagePosts.length === 0 && totalPosts === 0) {
        container.innerHTML = `
            <div class="text-center p-5 bg-light rounded shadow-sm">
                <i class="fas fa-seedling fa-3x text-success mb-3"></i>
                <p class="text-muted">No tutorials found. Be the first to bloom!</p>
            </div>`;
        return;
    }

    // Render each post safely (catch any per-post error)
    let postsHtml = '';
    for (let post of pagePosts) {
        try {
            postsHtml += renderSinglePost(post, user);
        } catch (err) {
            console.error("Error rendering post", post._id, err);
            postsHtml += `<div class="alert alert-warning">Failed to render post: ${err.message}</div>`;
        }
    }

    // Add Load More button only if there are more posts AND no active search filter
    const hasMore = end < totalPosts;
    let loadMoreHtml = '';
    if (hasMore && (!filter || filter.trim() === "")) {
        loadMoreHtml = `
            <div id="loadMoreWrapper" class="text-center my-4">
                <button class="btn btn-nexus px-4" onclick="loadMorePosts()" ${isLoading ? 'disabled' : ''}>
                    Load More <i class="fas fa-arrow-down ms-2"></i>
                </button>
            </div>`;
    }

    container.innerHTML = postsHtml + loadMoreHtml;
}

// Helper to render a single post (same logic as before but separated)
function renderSinglePost(post, user) {
    const isOwner = user && (
        (post.author?._id && post.author._id === user._id) || 
        (post.author === user._id)
    );
    const isFollowingUser = post.author?.followers?.includes(user?._id);
    const followLink = (!isOwner && post.author) ? `
        <span class="ms-2 small fw-bold follow-link" 
              id="follow-link-${post.author?._id || post.author}" 
              style="cursor: pointer; color: #2dd4bf; font-size: 0.8rem;" 
              onclick="handleFollowAction('${post.author?._id || post.author}')">
            ${isFollowingUser ? '• Following' : '• Follow'}
        </span>` : '';
    const tagsHTML = (post.tags && Array.isArray(post.tags)) 
        ? post.tags.map(tag => `<span class="badge bg-light text-dark me-1">#${escapeHtml(tag)}</span>`).join('')
        : (typeof post.tags === 'string' && post.tags.trim() !== '')
            ? post.tags.split(',').map(tag => `<span class="badge bg-light text-dark me-1">#${escapeHtml(tag.trim())}</span>`).join('')
            : ''; 

    return `
    <div class="card fb-card p-4 mb-4 shadow-sm border-0">
        ${isOwner ? `
        <div class="dropdown" style="position: absolute; right: 20px; top: 20px; z-index: 10;">
            <button class="btn btn-link text-muted" data-bs-toggle="dropdown"><i class="fas fa-ellipsis-v"></i></button>
            <ul class="dropdown-menu dropdown-menu-end shadow border-0">
                <li><a class="dropdown-item" onclick="editPost('${post._id}')"><i class="fas fa-edit me-2 text-success"></i>Edit Post</a></li>
                <li><a class="dropdown-item text-danger" onclick="deletePost('${post._id}')"><i class="fas fa-trash me-2"></i>Delete Post</a></li>
            </ul>
        </div>` : ''}

        <div class="d-flex align-items-center mb-3">
            <div class="rounded-circle bg-success text-white d-flex align-items-center justify-content-center me-3" style="width: 45px; height: 45px;">
                <i class="fas fa-user"></i>
            </div>
            <div>
                <h6 class="mb-0 fw-bold">
                    <a href="profile.html?id=${post.author?._id || post.author}" class="text-decoration-none" style="color: #1a535c;">
                        ${escapeHtml(post.author?.name || 'Nexus Writer')}
                    </a>
                    ${followLink}
                </h6>
                <small class="text-muted">${post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Just now'}</small>
            </div>
        </div>

        <h5 class="fw-bold">${escapeHtml(post.title)}</h5>
        <div class="mb-2">${tagsHTML}</div>
        <p class="text-secondary" style="white-space: pre-wrap;">${escapeHtml(post.content)}</p>

        ${(post.image && post.image !== "null") ? 
            `<img src="${post.image}" class="img-fluid rounded mb-3 shadow-sm" style="max-height: 400px; width: 100%; object-fit: cover;">` : ''}

        <div class="d-flex gap-4 mb-3 border-top pt-2">
            <div class="interaction-btn" onclick="togglePostLike('${post._id}')" style="cursor: pointer;">
                <i class="fas fa-heart ${(user && post.likes?.includes(user._id)) ? 'text-danger' : 'text-muted'}"></i>
                <span class="ms-1 small fw-bold">${post.likes?.length || 0}</span>
            </div>
            <div class="interaction-btn" onclick="document.getElementById('main-comment-${post._id}').focus()" style="cursor: pointer;">
                <i class="fas fa-comment text-muted"></i>
                <span class="ms-1 small fw-bold">Comment</span>
            </div>
        </div>

        <div class="comment-area bg-light p-3 rounded">
            <div id="comments-list-${post._id}">
                ${typeof renderComments === 'function' ? renderComments(post.comments || [], post._id) : ''}
            </div>
            
            <div class="input-group mt-2">
                <input type="text" class="form-control border-0 px-3" id="main-comment-${post._id}" 
                       placeholder="Join the discussion..." 
                       onkeypress="if(event.key==='Enter') submitMainComment('${post._id}')">
                <button class="btn btn-success" onclick="submitMainComment('${post._id}')">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    </div>`;
}

// Loads the next page of posts
function loadMorePosts() {
    if (isLoading) return;
    const totalPages = Math.ceil(allPostsRaw.length / POSTS_PER_PAGE);
    if (currentPage >= totalPages) return;
    currentPage++;
    displayCurrentPage();
    // Smooth scroll to the button
    const loadMoreDiv = document.getElementById('loadMoreWrapper');
    if (loadMoreDiv) loadMoreDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Main entry point
async function loadDashboard() {
    await fetchAllPostsAndRefresh();
}

// Refresh after any action (like, comment, delete)
async function refreshAfterAction() {
    await fetchAllPostsAndRefresh();
}

// Keep compatibility with old function names
const fetchPosts = refreshAfterAction;

document.addEventListener('DOMContentLoaded', loadDashboard);

// --- FOLLOW ACTION HANDLER ---
async function handleFollowAction(targetId) {
    const user = JSON.parse(localStorage.getItem('nexusUser'));
    if (!user || !user.token) return;
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
            const feedLinks = document.querySelectorAll(`[id^="follow-link-${targetId}"]`);
            feedLinks.forEach(link => {
                link.innerText = data.isFollowing ? '• Following' : '• Follow';
            });
            const profileBtn = document.getElementById('followBtn');
            if (profileBtn && typeof updateFollowButtonUI === 'function') {
                updateFollowButtonUI(data.isFollowing);
                if (typeof loadProfile === 'function') loadProfile();
            }
        }
    } catch (err) {
        console.error("Follow error:", err);
    }
}

/* Handle Custom Category Input */
function checkCustomCategory(select) {
    const customInput = document.getElementById('postCategoryCustom');
    if(select.value === 'OTHER') {
        customInput.classList.remove('d-none');
        customInput.setAttribute('required', 'required');
    } else {
        customInput.classList.add('d-none');
        customInput.removeAttribute('required');
        customInput.value = '';
    }
}

async function handlePostSubmit() {
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const tags = document.getElementById('postTags').value;
    const editId = document.getElementById('editPostId').value;
    
    const select = document.getElementById('postCategorySelect');
    const customInput = document.getElementById('postCategoryCustom');
    let category = select.value;
    if (category === 'OTHER') {
        category = customInput.value.trim();
        if (!category) {
            alert('Please enter your custom category.');
            customInput.focus();
            return;
        }
    }
    if (!title.trim() || !content.trim() || !category) {
        alert("Title, Content, and Category are required!");
        return;
    }
    const user = JSON.parse(localStorage.getItem('nexusUser'));
    if (!user || !user.token) {
        alert("Session expired. Please log in again.");
        window.location.href = 'login.html';
        return;
    }
    try {
        let url = 'http://localhost:5000/api/posts';
        let method = 'POST';
        if (editId) {
            url = `http://localhost:5000/api/posts/${editId}`;
            method = 'PUT';
        }
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('category', category);
        formData.append('tags', tags);
        const fileInput = document.getElementById('postPhotoFile');
        if (fileInput.files[0]) {
            formData.append('image', fileInput.files[0]);
        }
        const response = await fetch(url, {
            method: method,
            headers: { 
                'Authorization': `Bearer ${user.token}` 
            },
            body: formData
        });
        const data = await response.json();
        if (response.ok) {
            const modalElement = document.getElementById('postModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) modalInstance.hide();
            location.reload(); 
        } else {
            alert(data.message || "Failed to save post.");
        }
    } catch (err) {
        console.error("Connection Error:", err);
        alert("Could not connect to the server.");
    }
}

function editPost(id) {
    const p = allPostsRaw.find(x => x._id === id); 
    if(!p) {
        console.error("Post not found for editing:", id);
        return;
    }
    document.getElementById('editPostId').value = p._id; 
    document.getElementById('postTitle').value = p.title;
    document.getElementById('postContent').value = p.content;
    const select = document.getElementById('postCategorySelect');
    const customInput = document.getElementById('postCategoryCustom');
    customInput.classList.add('d-none');
    customInput.removeAttribute('required');
    let found = false;
    if (select) {
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].value === p.category) {
                select.selectedIndex = i;
                found = true;
                break;
            }
        }
        if(!found && p.category) {
            select.value = 'OTHER';
            customInput.classList.remove('d-none');
            customInput.setAttribute('required', 'required');
            customInput.value = p.category;
        }
    }
    document.getElementById('postTags').value = p.tags || "";
    if(p.image) { 
        document.getElementById('previewContainer').classList.remove('d-none');
        document.getElementById('filePreviewImg').src = p.image; 
    } else {
        document.getElementById('previewContainer').classList.add('d-none');
    }
    document.getElementById('submitBtnText').innerText = "Update";
    const editModal = new bootstrap.Modal(document.getElementById('postModal'));
    editModal.show();
}

async function deletePost(id) {
    if(confirm("Delete this tutorial?")) {
        const user = JSON.parse(localStorage.getItem('nexusUser'));
        try {
            const response = await fetch(`http://localhost:5000/api/posts/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
            if (response.ok) {
                fetchAllPostsAndRefresh(); 
            } else {
                alert("You can only delete your own posts!");
            }
        } catch (err) {
            console.error("Delete failed:", err);
        }
    }
}

async function togglePostLike(id) {
    const user = JSON.parse(localStorage.getItem('nexusUser'));
    try {
        const response = await fetch(`http://localhost:5000/api/posts/like/${id}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${user.token}` 
            }
        });
        if (response.ok) {
            fetchAllPostsAndRefresh();
        }
    } catch (err) {
        console.error("Like failed:", err);
    }
}

function openPostModal() {
    document.getElementById('postForm').reset();
    document.getElementById('editPostId').value = "";
    document.getElementById('submitBtnText').innerText = "Publish";
    document.getElementById('previewContainer').classList.add('d-none');
    document.getElementById('postCategoryCustom').classList.add('d-none');
    document.getElementById('postCategoryCustom').removeAttribute('required');
    selectedFileBase64 = null;
    new bootstrap.Modal(document.getElementById('postModal')).show();
}

function searchPosts() { 
    const filterText = document.getElementById('searchInput')?.value || '';
    displayCurrentPage(filterText); 
}

// File preview listener
document.getElementById('postPhotoFile')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            selectedFileBase64 = ev.target.result;
            document.getElementById('previewContainer').classList.remove('d-none');
            document.getElementById('filePreviewImg').src = selectedFileBase64;
        };
        reader.readAsDataURL(file);
    }
});

// Theme & Language on load
window.onload = () => {
    if (localStorage.getItem('nexusTheme') === 'dark') document.body.classList.add('dark-mode');
    applyLanguage();
    const userString = localStorage.getItem('nexusUser');
    if (!userString) {
        window.location.href = 'login.html';
        return;
    }
    const user = JSON.parse(userString);
    document.getElementById('navUsername').textContent = user.username || user.name || "User";
};

// Notifications (unchanged)
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('nexusUser'));
    if (user && user.name) {
        document.getElementById('navUsername').innerText = user.name.split(' ')[0];
    }
    if (typeof checkNotifications === 'function') {
        checkNotifications();
    }
});

async function loadNotifications() {
    const rawData = localStorage.getItem('nexusUser');
    const userData = JSON.parse(rawData || '{}');
    const token = userData.token; 
    const welcomeHeader = document.querySelector('.welcome-section h2');
    if (welcomeHeader && userData && userData.name) {
        welcomeHeader.innerText = `Welcome back, ${userData.name}!`;
    }
    if (!token) {
        console.warn('No token found. User might not be logged in.');
        return;
    }
    try {
        const response = await fetch('http://localhost:5000/api/notifications', {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            if (response.status === 401) {
                console.error('Unauthorized: Please log in again.');
                return;
            }
            throw new Error('Failed to fetch notifications');
        }
        const data = await response.json();
        const badge = document.getElementById('nav-notification-badge');
        const list = document.getElementById('dropdown-notification-list');
        if (badge) {
            if (data.unreadCount > 0) {
                badge.style.display = 'block';
                badge.innerText = data.unreadCount;
            } else {
                badge.style.display = 'none';
            }
        }
        if (list) {
            if (data.notifications && data.notifications.length > 0) {
                list.innerHTML = data.notifications.map(notif => {
                    let message = '';
                    switch (notif.type) {
                        case 'like': message = 'liked your post.'; break;
                        case 'comment': message = 'commented on your post.'; break;
                        case 'reply': message = 'replied to your comment.'; break;
                        case 'follow': message = 'started following you.'; break;
                        default: message = 'interacted with your post.';
                    }
                    return `
                        <div class="notification-item p-2 border-bottom small">
                            <strong>${escapeHtml(notif.sender?.name || 'Someone')}</strong> ${message}
                        </div>
                    `;
                }).join('');
            } else {
                list.innerHTML = '<p class="small text-muted text-center p-3">No new notifications.</p>';
            }
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadNotifications);

function toggleFollow(userId, buttonElement) {
    let followedUsers = JSON.parse(localStorage.getItem('nexusFollowedUsers')) || [];
    const index = followedUsers.indexOf(userId);
    if (index === -1) {
        followedUsers.push(userId);
        buttonElement.innerHTML = '<i class="fas fa-user-check me-1"></i> Following';
    } else {
        followedUsers.splice(index, 1);
        buttonElement.innerHTML = '<i class="fas fa-user-plus me-1"></i> Follow';
    }
    localStorage.setItem('nexusFollowedUsers', JSON.stringify(followedUsers));
}
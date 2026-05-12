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

// ========== FIX 1: ROBUST USER NAME RETRIEVAL ==========
function getCurrentUserName() {
    const userData = JSON.parse(localStorage.getItem('nexusUser'));
    console.log("Current nexusUser data:", userData); // <--- Add this line!
    
    if (!userData) return 'User';
    
    return userData.name || 
           userData.username || 
           userData.displayName || 
           userData.fullName || 
           (userData.email ? userData.email.split('@')[0] : 'User');
}


function updateUserGreeting() {
    const userName = getCurrentUserName();
    const feedUserEl = document.getElementById('feedUsername');
    if (!feedUserEl) return;
    const lang = localStorage.getItem('nexusLang') || 'English';
    const dict = window.translations ? window.translations[lang] : null;
    if (dict && dict.welcome) {
        feedUserEl.textContent = `${dict.welcome}, ${userName}!`;
    } else {
        feedUserEl.textContent = `Welcome back, ${userName}!`;
    }
}

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
    updateUserGreeting();
}

window.changeLanguage = function(lang) {
    localStorage.setItem('nexusLang', lang);
    applyLanguage();
};

document.addEventListener('DOMContentLoaded', applyLanguage);
localStorage.setItem('nexusPosts', JSON.stringify(posts));

/* --- COMMENTING ENGINE (fixed ownership detection for both comments and replies) --- */

// Helper to extract author ID from a comment object (robust)
function getCommentAuthorId(comment) {
    if (!comment) return null;
    if (comment.user && comment.user._id) return comment.user._id;
    if (comment.user && typeof comment.user === 'string') return comment.user;
    if (comment.userId) return comment.userId;
    if (comment.author && comment.author._id) return comment.author._id;
    if (comment.author && typeof comment.author === 'string') return comment.author;
    if (comment.user && comment.user.id) return comment.user.id;
    if (comment.author && comment.author.id) return comment.author.id;
    return null;
}

// 2. Helper to normalize tags for display
function normalizeTags(tags) {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags.filter(t => t && t.trim());
    if (typeof tags === 'string') {
        return tags.split(',').map(t => t.trim()).filter(t => t);
    }
    return [];
}

function renderComments(commentList, postId) {
    if (!commentList || commentList.length === 0) return '';

    const userObj = JSON.parse(localStorage.getItem('nexusUser')) || {};
    const myIdStr = (userObj._id || userObj.id || "").toString();

    return commentList.map((comment) => {
        const cId = (comment._id || "").toString(); 
        const pId = (postId || "").toString();
        
        // --- START OF FIX: IMPROVED OWNERSHIP & NAME DETECTION ---
        // Robust detection for the author's ID across nested levels
        const commentAuthorIdStr = (comment.user?._id || comment.user || "").toString();
        const isCommentOwner = myIdStr && commentAuthorIdStr && myIdStr === commentAuthorIdStr;

        // --- UPDATED LOGIC: SHOW ACTUAL NAMES ONLY ---
// Inside your renderComments function
let displayName = 'Nexus Writer'; 

// Check for name in 'user' object (populated from DB)
if (comment.user && comment.user.name) {
    displayName = comment.user.name; 
} 
// Check for name in 'author' object
else if (comment.author && comment.author.name) {
    displayName = comment.author.name;
}
// Fallback if population failed but we have local info
else if (isCommentOwner && userObj.name) {
    displayName = userObj.name;
}
        // --- END OF FIX ---

        // Tag Processing
        const tags = comment.tags || [];
        const tagsHtml = tags.map(tag => 
            `<span class="badge rounded-pill bg-success me-1" style="font-size: 0.6rem;">#${escapeHtml(tag)}</span>`
        ).join('');

        // Recursive call
        let repliesHtml = (comment.replies && comment.replies.length > 0) 
            ? renderComments(comment.replies, postId) 
            : '';

        return `
        <div class="comment-thread mb-3">
            <div class="comment-box p-3">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="d-flex align-items-center gap-2">
                        <i class="fas fa-user-circle" style="font-size:1.4rem;"></i>
                        <div>
                            <strong class="comment-author-name d-block" style="font-size:0.9rem;">${escapeHtml(displayName)}</strong>
                            <small style="font-size: 0.7rem; opacity: 0.65;">${comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Just now'}</small>
                        </div>
                    </div>
                    ${tagsHtml ? `<div class="d-flex align-items-center gap-1">${tagsHtml}</div>` : ''}
                </div>
                <p class="mb-0 comment-text-body" id="text-${cId}">${escapeHtml(comment.text || '')}</p>
            </div>
            <div class="comment-actions ms-2 d-flex gap-3 mt-2">
                <a href="javascript:void(0)" class="action-btn" onclick="toggleCommentLike('${pId}', '${cId}')">
                    <i class="fas fa-thumbs-up me-1 ${comment.likes?.includes(myIdStr) ? 'text-primary' : ''}"></i> ${comment.likes?.length || 0}
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
                ${repliesHtml}
            </div>
        </div>`;
    }).join('');
}

// Add this helper if it's missing!
function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// --- 3. TOGGLE COMMENT LIKE ---
async function toggleCommentLike(postId, commentId) {
    const user = JSON.parse(localStorage.getItem('nexusUser'));
    if (!user || !user.token) return;

    try {
        // Change 'comments' to 'posts' if your backend groups everything under posts
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
            console.error("Like failed:", errorData.message);
        }
    } catch (err) {
        console.error("Network Error:", err);
    }
}
function normalizeTags(tags) {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags.filter(t => t && t.trim());
    if (typeof tags === 'string') return tags.split(',').map(t => t.trim()).filter(t => t);
    return [];
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

// --- 1. EDIT COMMENT ---
async function editComment(postId, commentId) {
    const textElement = document.getElementById(`text-${commentId}`);
    const oldText = textElement ? textElement.innerText : "";

    const textarea = document.getElementById('editCommentTextarea');
    const saveBtn = document.getElementById('editCommentSaveBtn');
    textarea.value = oldText;

    const modalEl = document.getElementById('nexusEditCommentModal');
    const modalInstance = new bootstrap.Modal(modalEl);
    modalInstance.show();

    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

    newSaveBtn.addEventListener('click', async function () {
        const newText = textarea.value.trim();
        if (!newText || newText === oldText) {
            modalInstance.hide();
            return;
        }

        const user = JSON.parse(localStorage.getItem('nexusUser'));
        if (!user || !user.token) {
            modalInstance.hide();
            return alert("Please log in again.");
        }

        try {
            const response = await fetch(`http://localhost:5000/api/posts/${postId}/comment/${commentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ text: newText })
            });

            modalInstance.hide();

            if (response.ok) {
                if (typeof loadFeed === 'function') {
                    loadFeed();
                } else if (typeof fetchAllPostsAndRefresh === 'function') {
                    fetchAllPostsAndRefresh();
                }
            } else {
                const data = await response.json();
                alert(data.message || "Edit failed. You might not be the owner.");
            }
        } catch (err) {
            console.error("Edit failed:", err);
            alert("Server error. Check if the backend is running.");
        }
    });
}

// --- 2. DELETE COMMENT ---
async function deleteComment(postId, commentId) {
    const user = JSON.parse(localStorage.getItem('nexusUser'));
    if (!user || !user.token) {
        alert("Please log in to perform this action.");
        return;
    }

    const message = document.getElementById('nexusDeleteConfirmMessage');
    const confirmBtn = document.getElementById('nexusDeleteConfirmBtn');
    message.textContent = "Are you sure you want to delete this comment? All replies to this comment will also be removed.";

    const modalEl = document.getElementById('nexusDeleteConfirmModal');
    const modalInstance = new bootstrap.Modal(modalEl);
    modalInstance.show();

    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

    newBtn.addEventListener('click', async function () {
        modalInstance.hide();
        try {
            const response = await fetch(`http://localhost:5000/api/posts/${postId}/comment/${commentId}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                if (typeof loadFeed === 'function') {
                    loadFeed(); 
                } else if (typeof fetchAllPostsAndRefresh === 'function') {
                    fetchAllPostsAndRefresh();
                }
            } else {
                const errorData = await response.json();
                alert(`Delete failed: ${errorData.message || "Unauthorized"}`);
            }
        } catch (err) {
            console.error("Delete failed", err);
            alert("A server error occurred. Please try again.");
        }
    }, { once: true });
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
        // FIXED: Ensuring route matches the standard nested structure
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
            
            // Supporting both potential refresh function names
            if (typeof loadFeed === 'function') {
                loadFeed();
            } else if (typeof fetchAllPostsAndRefresh === 'function') {
                fetchAllPostsAndRefresh();
            }
        } else {
            const data = await response.json();
            alert(data.message || "Failed to post reply.");
        }
    } catch (err) {
        console.error("Reply failed:", err);
        alert("Server error while submitting reply.");
    }
}

/* --- POST LOGIC WITH CLIENT‑SIDE PAGINATION --- */

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
function displayCurrentPage(filter = "", isAppending = false) {
    const container = document.getElementById('postsContainer');
    if (!container) return;

    const userSnapshot = localStorage.getItem('nexusUser');
    const user = userSnapshot ? JSON.parse(userSnapshot) : null;

    // 1. Filtering Logic
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

    // 2. Build the posts HTML
    let postsHtml = '';
    for (let post of pagePosts) {
        postsHtml += renderSinglePost(post, user);
    }

    // 3. Render the posts (APPEND to keep old ones, REPLACE for fresh search)
    if (isAppending) {
        container.insertAdjacentHTML('beforeend', postsHtml);
    } else {
        container.innerHTML = postsHtml;
    }

    // --- THE FIX STARTS HERE ---
    
    const wrapper = document.getElementById('loadMoreWrapper');
    const btn = document.getElementById('loadMoreBtn');
    
    // Check if we ran out of posts
    const reachedEnd = pagePosts.length === 0 || end >= totalPosts;

    if (reachedEnd) {
        // If we hit the end, we find the existing wrapper and CHANGE its content
        if (wrapper) {
            wrapper.innerHTML = `
                <div class="py-4 text-center animate__animated animate__fadeIn">
                    <p class="fw-bold text-muted mb-0">✨ You're all caught up today!</p>
                    <small class="text-secondary">Check back later for more tutorials. 🌿</small>
                </div>`;
            // Remove the ID so the "Load More" logic doesn't try to use it again
            wrapper.removeAttribute('id');
        } else if (!isAppending && totalPosts > 0) {
            // If it's the first load and we're already caught up, add the message
            container.insertAdjacentHTML('afterend', `
                <div class="py-4 text-center animate__animated animate__fadeIn">
                    <p class="fw-bold text-muted mb-0">✨ You're all caught up today!</p>
                </div>`);
        }
    } else {
        // If there are MORE posts to show
        if (!wrapper) {
            // Create the wrapper if it doesn't exist (first load)
            const loadMoreHtml = `
                <div id="loadMoreWrapper" class="text-center my-4">
                    <button id="loadMoreBtn" class="btn btn-nexus px-4" onclick="loadMorePosts()">
                        Load More <i class="fas fa-arrow-down ms-2"></i>
                    </button>
                </div>`;
            container.insertAdjacentHTML('afterend', loadMoreHtml);
        } else if (btn) {
            // If it already exists, just reset the "Loading..." spinner back to a button
            btn.disabled = false;
            btn.innerHTML = `Load More <i class="fas fa-arrow-down ms-2"></i>`;
        }
    }
}
    
// Helper: get post author ID (robust)
function getPostAuthorId(post) {
    if (!post.author) return null;
    if (typeof post.author === 'string') return post.author;
    if (post.author._id) return post.author._id;
    if (post.author.id) return post.author.id;
    return null;

    
}

// Helper to render a single post (fixed ownership detection, tag display)
function renderSinglePost(post, user) {
    // FIXED: Reliable string-based ID comparison
    const postAuthorId = (post.author?._id || post.author?.id || post.author || "").toString();
    const myId = (user?._id || user?.id || "").toString();
    const isOwner = myId && postAuthorId && myId === postAuthorId;
    
    // --- START OF UPDATE ---
    // 1. Get the local list of followed IDs
    const localFollowed = JSON.parse(localStorage.getItem('nexusFollowedUsers')) || [];
    
    // 2. UPDATED: Check BOTH the server data AND the local storage list for persistence
    const isFollowingUser = post.author?.followers?.includes(myId) || localFollowed.includes(postAuthorId);
    
    const followLink = (!isOwner && post.author) ? `
        <span class="ms-2 small fw-bold follow-link" 
              id="follow-link-${postAuthorId}" 
              style="cursor: pointer; color: #2dd4bf; font-size: 0.8rem;" 
              onclick="handleFollowAction('${postAuthorId}')">
            ${isFollowingUser ? '• Following' : '• Follow'}
        </span>` : '';
    // --- END OF UPDATE ---
    

    // FIXED: Normalize tags so they always show up correctly
    const tagsArray = normalizeTags(post.tags);
    const tagsHTML = tagsArray.map(tag => `<span class="badge bg-light text-dark me-1">#${escapeHtml(tag)}</span>`).join('');

    return `
    <div class="card fb-card p-4 mb-4 shadow-sm border-0">
        ${isOwner ? `<div class="dropdown" style="position: absolute; right: 20px; top: 20px; z-index: 10;">
            <button class="btn btn-link text-muted" data-bs-toggle="dropdown"><i class="fas fa-ellipsis-v"></i></button>
            <ul class="dropdown-menu dropdown-menu-end shadow border-0">
                <li><a class="dropdown-item" href="javascript:void(0)" onclick="editPost('${post._id}')"><i class="fas fa-edit me-2 text-success"></i>Edit Post</a></li>
                <li><a class="dropdown-item text-danger" href="javascript:void(0)" onclick="deletePost('${post._id}')"><i class="fas fa-trash me-2"></i>Delete Post</a></li>
            </ul>
        </div>` : ''}

        <div class="d-flex align-items-center mb-3">
            <div class="rounded-circle bg-success text-white d-flex align-items-center justify-content-center me-3" style="width: 45px; height: 45px;"><i class="fas fa-user"></i></div>
            <div>
                <h6 class="mb-0 fw-bold">
                    <a href="profile.html?id=${postAuthorId}" class="text-decoration-none" style="color: #1a535c;">
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
                <i class="fas fa-heart ${(user && post.likes?.includes(myId)) ? 'text-danger' : ''}"></i>
                <span class="ms-1 small fw-bold">${post.likes?.length || 0}</span>
            </div>
            <div class="interaction-btn" onclick="document.getElementById('main-comment-${post._id}').focus()" style="cursor: pointer;">
                <i class="fas fa-comment"></i>
                <span class="ms-1 small fw-bold">Comment</span>
            </div>
        </div>

        <div class="comment-area bg-light p-3 rounded">
            <div id="comments-list-${post._id}">${renderComments(post.comments || [], post._id)}</div>
            <div class="input-group mt-2">
                <input type="text" class="form-control" id="main-comment-${post._id}" placeholder="Join the discussion..." onkeypress="if(event.key==='Enter') submitMainComment('${post._id}')">
                <button class="btn btn-success" onclick="submitMainComment('${post._id}')"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
    </div>`;
}
async function loadMorePosts() {
    const btn = document.getElementById('loadMoreBtn');
    if (!btn) return;

    // 1. Show loading state
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Loading...`;

    // 2. Increment the page
    currentPage++;

    // 3. Get token for the request
    const user = JSON.parse(localStorage.getItem('nexusUser'));
    const token = user?.token;

    try {
        // 4. FETCH the next set of posts from the backend
        const response = await fetch(`http://localhost:5000/api/posts?page=${currentPage}&limit=${POSTS_PER_PAGE}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        const nextPosts = data.posts || [];

        if (nextPosts.length > 0) {
            // 5. Add new posts to the global list
            allPostsRaw = [...allPostsRaw, ...nextPosts];
            
            // 6. Append to UI
            displayCurrentPage("", true); 
        } else {
            // No more posts to load
            const wrapper = document.getElementById('loadMoreWrapper');
            if (wrapper) wrapper.innerHTML = `<p class="text-muted mt-3">No more tutorials to show. 🌿</p>`;
        }
    }
        catch (err) {
        console.error("Load More Error:", err);
        btn.disabled = false;
        btn.innerHTML = `Try Again <i class="fas fa-redo ms-2"></i>`;
        currentPage--; // Reset page count on error
    }
}

// Main entry point
async function loadDashboard() {
    await fetchAllPostsAndRefresh();
}

// Refresh after any action
async function refreshAfterAction() {
    await fetchAllPostsAndRefresh();
}

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
            // --- ADDED: PERSISTENCE LOGIC ---
            // Update the local list so the state "sticks" even after a refresh
            let localFollowed = JSON.parse(localStorage.getItem('nexusFollowedUsers')) || [];
            if (data.isFollowing) {
                if (!localFollowed.includes(targetId)) localFollowed.push(targetId);
            } else {
                localFollowed = localFollowed.filter(id => id !== targetId);
            }
            localStorage.setItem('nexusFollowedUsers', JSON.stringify(localFollowed));
            // --------------------------------

            const feedLinks = document.querySelectorAll(`[id^="follow-link-${targetId}"]`);
            feedLinks.forEach(link => {
                link.innerText = data.isFollowing ? '• Following' : '• Follow';
            });
            
            const profileBtn = document.getElementById('followBtn');
            if (profileBtn && typeof updateFollowButtonUI === 'function') {
                updateFollowButtonUI(data.isFollowing);
            }

            // --- ADDED: REFRESH STATS ---
            // Refresh the profile data to update the Following/Followers count numbers
            if (typeof loadProfile === 'function') {
                loadProfile(); 
            } else if (typeof fetchAllPostsAndRefresh === 'function') {
                fetchAllPostsAndRefresh();
            }
            // ----------------------------
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
    const tagsInput = document.getElementById('postTags').value;
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
        const modalEl = document.getElementById('nexusAlertModal');
        document.getElementById('alertModalMessage').textContent = "Title, Content, and Category are required!";
        new bootstrap.Modal(modalEl).show();
        return;
    }
    const user = JSON.parse(localStorage.getItem('nexusUser'));
    if (!user || !user.token) {
        const modalEl = document.getElementById('nexusAlertModal');
        document.getElementById('alertModalMessage').textContent = "Session expired. Please log in again.";
        new bootstrap.Modal(modalEl).show();
        return;
    }

    // --- ADDED: TAG PROCESSING ---
    // Converts "Tag1, Tag2" into ["Tag1", "Tag2"] and removes empty spaces
    const tagsArray = tagsInput.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== "");

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

        // --- UPDATED: SENDING TAGS AS ARRAY ---
        // We send each tag individually so the backend receives them as an array
        tagsArray.forEach(tag => {
            formData.append('tags[]', tag);
        });

        const fileInput = document.getElementById('postPhotoFile');
        if (fileInput.files[0]) {
            formData.append('image', fileInput.files[0]);
        }

        const response = await fetch(url, {
            method: method,
            headers: { 
                'Authorization': `Bearer ${user.token}` 
                // Note: Don't set 'Content-Type' when sending FormData
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
            const modalEl = document.getElementById('nexusAlertModal');
            document.getElementById('alertModalMessage').textContent = data.message || "Failed to save post.";
            new bootstrap.Modal(modalEl).show();
        }
    } catch (err) {
        console.error("Connection Error:", err);
        const modalEl = document.getElementById('nexusAlertModal');
        document.getElementById('alertModalMessage').textContent = "Could not connect to the server.";
        new bootstrap.Modal(modalEl).show();
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
    // Set tags - if p.tags is array, join with commas; if string, use as is
    let tagsValue = '';
    if (Array.isArray(p.tags)) {
        tagsValue = p.tags.join(', ');
    } else if (typeof p.tags === 'string') {
        tagsValue = p.tags;
    } else {
        tagsValue = '';
    }
    document.getElementById('postTags').value = tagsValue;
    if(p.image && p.image !== "null") { 
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
    const user = JSON.parse(localStorage.getItem('nexusUser'));
    if (!user || !user.token) return;

    const message = document.getElementById('nexusDeleteConfirmMessage');
    const confirmBtn = document.getElementById('nexusDeleteConfirmBtn');
    message.textContent = "Delete this tutorial? This action cannot be undone.";

    const modalEl = document.getElementById('nexusDeleteConfirmModal');
    const modalInstance = new bootstrap.Modal(modalEl);
    modalInstance.show();

    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

    newBtn.addEventListener('click', async function () {
        modalInstance.hide();
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
                const modalEl = document.getElementById('nexusAlertModal');
                document.getElementById('alertModalMessage').textContent = "You can only delete your own posts!";
                new bootstrap.Modal(modalEl).show();
            }
        } catch (err) {
            console.error("Delete failed:", err);
        }
    }, { once: true });
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
    updateUserGreeting();
};

// Notifications
async function loadNotifications() {
    const rawData = localStorage.getItem('nexusUser');
    const userData = JSON.parse(rawData || '{}');
    const token = userData.token; 
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

// Add this to dashboard.js to resolve the ReferenceError
window.updateNavbar = function() {
    console.log("Updating navbar UI...");
    
    // 1. Update the Greeting (already in your code)
    if (typeof updateUserGreeting === 'function') {
        updateUserGreeting();
    }
    
    // 2. Update Notifications (already in your code)
    if (typeof loadNotifications === 'function') {
        loadNotifications();
    }

    // 3. Optional: Add any other Navbar logic here (like profile pic updates)
};

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

function applyGlobalTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.setAttribute('data-theme', 'dark'); // Double insurance
    } else {
        document.documentElement.removeAttribute('data-theme');
        document.body.removeAttribute('data-theme');
    }
}

// Run immediately to prevent "white flash" on load
applyGlobalTheme();

// Also run on DOMContentLoaded to catch dynamic elements
document.addEventListener('DOMContentLoaded', applyGlobalTheme);


  function showLogoutModal() {
    new bootstrap.Modal(document.getElementById("nexusLogoutModal")).show();
  }

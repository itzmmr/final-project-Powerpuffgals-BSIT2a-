// homesearch.js - UPDATED FOR SEPARATED INPUTS & SYNCED BUTTON STYLES
let allPosts = []; 
let displayedCount = 6; 
const increment = 6;    

// --- 1. CORE FETCHING ---
async function fetchPostsFromBackend() {
    const resultsGrid = document.getElementById('resultsGrid');
    try {
        const response = await fetch('http://localhost:5000/api/posts?limit=100'); 
        if (!response.ok) throw new Error('Server unavailable');
        const data = await response.json();
        allPosts = Array.isArray(data) ? data : (data.posts || []);
        displayPosts('all'); 
    } catch (error) {
        console.error("Fetch error:", error);
        if(resultsGrid) resultsGrid.innerHTML = '<div class="alert alert-danger m-3 text-center">Connection error. Please try again.</div>';
    }
}

// --- 2. RECURSIVE COMMENT RENDERING (Synced with Dashboard Style) ---
function renderComments(commentList, postId) {
    if (!commentList || commentList.length === 0) return '';

    const userObj = JSON.parse(localStorage.getItem('nexusUser')) || {};
    const myIdStr = (userObj._id || userObj.id || "").toString();

    return commentList.map((comment) => {
        const cId = (comment._id || "").toString(); 
        const pId = (postId || "").toString();
        
        const commentAuthorIdStr = (comment.user?._id || comment.user || "").toString();
        const isCommentOwner = myIdStr && commentAuthorIdStr && myIdStr === commentAuthorIdStr;

        let displayName = comment.user?.name || comment.author?.name || 'Nexus Writer';

        let repliesHtml = (comment.replies && comment.replies.length > 0) 
            ? renderComments(comment.replies, postId) 
            : '';

        return `
        <div class="comment-thread mb-4">
            <div class="comment-box p-3 shadow-sm">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <strong class="comment-author-name">
                        <i class="fas fa-user-circle me-1"></i>${displayName}
                    </strong>
                    <small class="opacity-50" style="font-size: 0.7rem; color: #cbd5e1;">
                        ${comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Just now'}
                    </small>
                </div>
                <p class="mb-0 text-white comment-text-body" id="comment-text-${cId}">${comment.text || ''}</p>
            </div>
            <div class="comment-actions ms-2 d-flex gap-3 mt-2">
                <a href="javascript:void(0)" class="action-btn" onclick="toggleCommentLike('${pId}', '${cId}', this)">
                    <i class="fas fa-thumbs-up me-1 ${comment.likes?.includes(myIdStr) ? 'text-primary' : ''}"></i> <span>${comment.likes?.length || 0}</span>
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
            <!-- Reply Input - UPDATED: SEPARATED STRUCTURE WITH GREEN BUTTON -->
            <div id="reply-input-${pId}-${cId}" class="mt-2 ms-3 d-none">
                <div class="input-group">
                    <input type="text" class="form-control comment-input-field" 
                           id="field-${pId}-${cId}" placeholder="Write a reply...">
                    <button class="btn btn-send-comment" onclick="submitReply('${pId}', '${cId}')">
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

// --- 3. COMMENT & REPLY ACTIONS ---
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
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
            body: JSON.stringify({ text })
        });
        if (response.ok) {
            input.value = ''; 
            toggleReplyInput(postId, targetId);
            await fetchPostsFromBackend();
            const post = allPosts.find(p => p._id === postId);
            document.getElementById('modalCommentsList').innerHTML = renderComments(post.comments || [], postId);
        }
    } catch (err) { console.error(err); }
}

async function togglePostLike(postId) {
    const heartIcon = document.getElementById('modal-heart-icon');
    const likeCountEl = document.getElementById('modal-like-count');
    const user = JSON.parse(localStorage.getItem('nexusUser'));
    if (!user || !user.token) return alert("Please log in to like.");
    try {
        const response = await fetch(`http://localhost:5000/api/posts/like/${postId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (response.ok) {
            await fetchPostsFromBackend();
            const post = allPosts.find(p => p._id === postId);
            const myId = (user._id || user.id).toString();
            if (likeCountEl) likeCountEl.innerText = post.likes?.length || 0;
            if (heartIcon) heartIcon.className = post.likes?.includes(myId) ? "fas fa-heart fs-5 text-danger" : "far fa-heart fs-5 text-dark";
        }
    } catch (err) { console.error(err); }
}

async function toggleCommentLike(postId, commentId, buttonElement) {
    const user = JSON.parse(localStorage.getItem('nexusUser'));
    if (!user || !user.token) return alert("Please log in to like.");
    try {
        const response = await fetch(`http://localhost:5000/api/posts/${postId}/comment/${commentId}/like`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (response.ok) {
            await fetchPostsFromBackend(); 
            const updatedPost = allPosts.find(p => p._id === postId);
            document.getElementById('modalCommentsList').innerHTML = renderComments(updatedPost.comments || [], postId);
        }
    } catch (err) { console.error(err); }
}

// --- 4. POST DETAIL & SEARCH UI ---

function openPostDetail(postId) {
    const post = allPosts.find(p => p._id === postId);
    if (!post) return;

    const userObj = JSON.parse(localStorage.getItem('nexusUser')) || {};
    const myId = (userObj._id || userObj.id || "").toString();
    
    const profileImg = post.author?.profilePicture 
        ? `<img src="${post.author.profilePicture}" class="rounded-circle shadow-sm" style="width: 45px; height: 45px; object-fit: cover; border: 2px solid #2dd4bf;">`
        : `<div class="rounded-circle d-flex align-items-center justify-content-center shadow-sm" style="width: 45px; height: 45px; background-color: #1a535c; color: white; border: 2px solid #2dd4bf;"><i class="fas fa-user-tie"></i></div>`;

    document.getElementById('modalPostHeader').innerHTML = `
        <div class="d-flex align-items-center p-2">
            <div class="me-3">${profileImg}</div>
            <div>
                <h6 class="mb-0 fw-bold post-author-display">${post.author?.name || "Anonymous User"}</h6>
                <small class="text-muted">${post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}</small>
            </div>
        </div>`;

    document.getElementById('modalPostTitle').innerText = post.title;
    
    const imageContainer = document.getElementById('modalPostImageContainer');
    const contentArea = document.getElementById('modalPostContent');
    
    if (imageContainer) imageContainer.innerHTML = ''; 
    
    const imageHtml = post.image ? `<img src="${post.image}" class="img-fluid rounded mb-3 shadow-sm w-100" style="max-height: 500px; object-fit: contain; background: #f8f9fa;">` : '';

    if (imageContainer) {
        imageContainer.innerHTML = imageHtml;
        imageContainer.style.display = post.image ? 'block' : 'none';
    } else if (contentArea && post.image) {
        const existingImgs = contentArea.parentElement.querySelectorAll('.img-fluid');
        existingImgs.forEach(img => img.remove());
        contentArea.insertAdjacentHTML('beforebegin', imageHtml);
    }
    
    if (contentArea) contentArea.innerText = post.content;

    const tagContainer = document.getElementById('modalPostTags');
    if (tagContainer) {
        tagContainer.innerHTML = (post.tags || []).map(t => `<span class="badge bg-light text-dark me-1 border">#${t}</span>`).join('');
    }
    
    const likeCountEl = document.getElementById('modal-like-count');
    const heartIcon = document.getElementById('modal-heart-icon');
    if (likeCountEl && heartIcon) {
        likeCountEl.innerText = post.likes?.length || 0;
        heartIcon.className = post.likes?.includes(myId) ? "fas fa-heart fs-5 text-danger" : "far fa-heart fs-5 text-dark";
    }
document.getElementById('modal-like-btn').onclick = () => togglePostLike(postId);
    document.getElementById('modalCommentsList').innerHTML = renderComments(post.comments || [], post._id);
    
    // --- ADD THIS PART BELOW ---
    const submitBtn = document.getElementById('modal-comment-submit-btn');
    if (submitBtn) {
        submitBtn.onclick = () => handleModalCommentSubmit(postId);
    }

    const inputField = document.getElementById('modal-comment-input-field');
    if (inputField) {
        inputField.onkeypress = (e) => {
            if (e.key === 'Enter') handleModalCommentSubmit(postId);
        };
    }
    // ---------------------------

    new bootstrap.Modal(document.getElementById('postDetailModal')).show();
    
    // --- MAIN MODAL INPUT - SYNCED WITH GREEN BUTTON STYLE ---
    const mainInputContainer = document.getElementById('modal-comment-section-container');
    if (mainInputContainer) {
        mainInputContainer.innerHTML = `
            <div class="input-group">
                <input type="text" class="form-control comment-input-field" 
                       id="modal-comment-input-field" 
                       placeholder="Join the discussion..."
                       onkeypress="if(event.key==='Enter') handleModalCommentSubmit('${post._id}')">
                <button class="btn" id="modal-comment-submit-btn"
                        onclick="handleModalCommentSubmit('${post._id}')">
                    <i class="fas fa-paper-plane" id="comment-submit-icon"></i>
                </button>
            </div>
        `;
    }

    new bootstrap.Modal(document.getElementById('postDetailModal')).show();
}

async function handleModalCommentSubmit(postId) {
    const input = document.getElementById('modal-comment-input-field');
    const icon = document.getElementById('comment-submit-icon');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    const user = JSON.parse(localStorage.getItem('nexusUser'));
    if (!user || !user.token) return alert("Please log in to comment.");
    if (icon) icon.className = "fas fa-spinner fa-spin";
    try {
        const response = await fetch(`http://localhost:5000/api/posts/${postId}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
            body: JSON.stringify({ text })
        });
        if (response.ok) {
            input.value = '';
            await fetchPostsFromBackend();
            const updatedPost = allPosts.find(p => p._id === postId);
            document.getElementById('modalCommentsList').innerHTML = renderComments(updatedPost.comments || [], postId);
        }
    } catch (err) { console.error(err); } finally { if (icon) icon.className = "fas fa-paper-plane"; }
}

function displayPosts(categoryFilter = 'all', searchTerm = '', append = false) {
    const resultsGrid = document.getElementById('resultsGrid');
    if(!resultsGrid) return; 
    if (!append) {
        resultsGrid.innerHTML = '';
        displayedCount = increment;
    }
    const filtered = allPosts.filter(post => {
        const postCat = (post.category || "").toLowerCase();
        const postTitle = (post.title || "").toLowerCase();
        return (categoryFilter === 'all' || postCat.includes(categoryFilter.toLowerCase())) &&
               (searchTerm === '' || postTitle.includes(searchTerm.toLowerCase()));
    });

    filtered.slice(0, displayedCount).forEach(post => {
        const tagsHtml = (post.tags || []).map(t => `<span class="me-2 text-muted" style="font-size: 0.85rem;">#${t}</span>`).join(' ');
        resultsGrid.innerHTML += `
            <div class="search-post-card p-4" onclick="openPostDetail('${post._id}')">
                <span class="badge mb-3" style="background-color: #4ecdc4 !important; color: #1a535c; font-size: 0.75rem;">${post.category || 'General'}</span>
                <h3 class="fw-bold mb-2 h3-title" style="font-family: 'Montserrat', sans-serif; font-size: 1.5rem; line-height: 1.3;">${post.title}</h3>
                <div class="mb-3 d-wrap">${tagsHtml}</div>
                <p class="text-muted mb-3 post-desc" style="font-size: 0.95rem; line-height: 1.5;">${post.content ? post.content.substring(0, 160) + '...' : ''}</p>
                <div class="d-flex align-items-center gap-3 text-muted small mt-auto pt-2 border-top">
                    <span><i class="far fa-heart"></i> ${post.likes?.length || 0}</span>
                    <span><i class="far fa-comment"></i> ${post.comments?.length || 0}</span>
                </div>
            </div>`;
    });
}

function switchTab(el, cat) {
    document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    displayPosts(cat); 
}

function handleInstantSuggestions(val) { displayPosts('all', val); }

document.addEventListener('DOMContentLoaded', () => {
    fetchPostsFromBackend();
    if (localStorage.getItem('nexusTheme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
});

// 1. List your actual tutorials here
const tutorials = [
  { title: "How to Make Coffee", link: "post1.html" },
  { title: "Heads Up Tutorial", link: "post2.html" }
];

// 2. Attach this to your existing input
// Change 'YOUR_INPUT_ID' to the id of your actual search bar
document.getElementById('YOUR_INPUT_ID').addEventListener('keyup', function() {
  const input = this.value.toLowerCase();
  
  // Change 'YOUR_SUGGESTION_DIV_ID' to the id of your result area
  const suggestionBox = document.getElementById('YOUR_SUGGESTION_DIV_ID');
  
  if (input === "") {
    suggestionBox.innerHTML = "";
    suggestionBox.style.display = "none"; // Hides it when empty
    return;
  }

  // Filter logic (starts with the letters typed)
  const matches = tutorials.filter(t => t.title.toLowerCase().startsWith(input));

  suggestionBox.style.display = "block"; // Shows the box when typing

  if (matches.length > 0) {
    suggestionBox.innerHTML = matches.map(t => 
      `<div class="search-item" onclick="location.href='${t.link}'">${t.title}</div>`
    ).join('');
  } else {
    suggestionBox.innerHTML = `<div class="no-match">Tutorials not found or not posted.</div>`;
  }
  // --- THIS IS THE ONLY PART YOU NEED TO CHANGE TO REMOVE THE GREY PART ---
    const modalEl = document.getElementById('postDetailModal');
    
    // 1. This is the "Kill Switch" for the grey backdrop
    modalEl.addEventListener('hidden.bs.modal', function () {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(b => b.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = 'auto';
    }, { once: true });

    // 2. Open it ONCE (This replaces the two lines that caused the double grey screen)
    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
    modalInstance.show();
});

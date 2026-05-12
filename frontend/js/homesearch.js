// homesearch.js
let allPosts = []; 
let displayedCount = 6; 
const increment = 6;    

async function fetchPostsFromBackend() {
    const resultsGrid = document.getElementById('resultsGrid');
    try {
        const response = await fetch('https://final-project-powerpuffgals-bsit2a.onrender.com/api/posts?limit=100'); 
        if (!response.ok) throw new Error('Server unavailable');
        const data = await response.json();
        allPosts = Array.isArray(data) ? data : (data.posts || []);
        displayPosts('all'); 
    } catch (error) {
        console.error("Fetch error:", error);
        if(resultsGrid) resultsGrid.innerHTML = '<div class="alert alert-danger m-3 text-center">Connection error. Please try again.</div>';
    }
}

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
                <p class="mb-0 comment-text-body" id="comment-text-${cId}">${comment.text || ''}</p>
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
        const response = await fetch(`https://final-project-powerpuffgals-bsit2a.onrender.com/api/posts/${postId}/comment/${targetId}/reply`, {
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
        const response = await fetch(`https://final-project-powerpuffgals-bsit2a.onrender.com/api/posts/like/${postId}`, {
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
        const response = await fetch(`https://final-project-powerpuffgals-bsit2a.onrender.com/api/posts/${postId}/comment/${commentId}/like`, {
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

function openPostDetail(postId) {
    const post = allPosts.find(p => p._id === postId);
    if (!post) return;

    const userObj = JSON.parse(localStorage.getItem('nexusUser')) || {};
    const myId = (userObj._id || userObj.id || "").toString();
    
    const profileImg = post.author?.profilePicture 
        ? `<img src="${post.author.profilePicture}" class="rounded-circle shadow-sm" style="width: 45px; height: 45px; object-fit: cover; border: 2px solid #2dd4bf;">`
        : `<div style="width:45px;height:45px;border-radius:50%;background:linear-gradient(135deg,#1a535c,#4ecdc4);display:flex;align-items:center;justify-content:center;border:2px solid #2dd4bf;"><i class="fas fa-user" style="color:white;font-size:1.2rem;"></i></div>`;

    document.getElementById('modalPostHeader').innerHTML = `
        <div class="d-flex align-items-center gap-3 p-2">
            ${profileImg}
            <div>
                <div class="fw-bold" style="font-size:1rem;">${post.author?.name || 'Nexus Writer'}</div>
                <div style="font-size:0.8rem;color:#94a3b8;">${post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}</div>
            </div>
        </div>`;

    document.getElementById('modalPostTitle').innerText = post.title || '';
    document.getElementById('modalPostContent').innerText = post.content || '';

    const imgContainer = document.getElementById('modalImageContainer');
    const imgEl = document.getElementById('modalPostImage');
    if (post.image) {
        imgEl.src = post.image;
        imgContainer.style.display = 'block';
    } else {
        imgContainer.style.display = 'none';
    }

    const tagContainer = document.getElementById('modalPostTags');
    if (tagContainer) {
        tagContainer.innerHTML = (post.tags || []).map(t => `<span class="badge modal-tag-badge me-1">#${t}</span>`).join('');
    }
    
    const likeCountEl = document.getElementById('modal-like-count');
    const heartIcon = document.getElementById('modal-heart-icon');
    if (likeCountEl && heartIcon) {
        likeCountEl.innerText = post.likes?.length || 0;
        heartIcon.className = post.likes?.includes(myId) ? "fas fa-heart fs-5 text-danger" : "far fa-heart fs-5 text-dark";
    }

    document.getElementById('modal-like-btn').onclick = () => togglePostLike(postId);
    document.getElementById('modalCommentsList').innerHTML = renderComments(post.comments || [], post._id);
    
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

    const modalEl = document.getElementById('postDetailModal');
    modalEl.addEventListener('hidden.bs.modal', function () {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(b => b.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = 'auto';
    }, { once: true });

    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
    modalInstance.show();
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
        const response = await fetch(`https://final-project-powerpuffgals-bsit2a.onrender.com/api/posts/${postId}/comment`, {
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
    if (!resultsGrid) return; 
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
        const tagsHtml = (post.tags || []).map(t => `<span class="me-2 card-tag" style="font-size: 0.85rem;">#${t}</span>`).join(' ');
        resultsGrid.innerHTML += `
            <div class="search-post-card p-4" onclick="openPostDetail('${post._id}')">
                <span class="badge post-category-badge mb-3">${post.category || 'General'}</span>
                <h3 class="fw-bold mb-2 post-card-title">${post.title}</h3>
                <div class="mb-3 d-wrap">${tagsHtml}</div>
                <p class="post-card-desc mb-3">${post.content ? post.content.substring(0, 160) + '...' : ''}</p>
                <div class="d-flex align-items-center gap-3 post-card-meta small mt-auto pt-2 border-top">
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

function clearInput() {
    const input = document.getElementById('innerSearchInput');
    const clearBtn = document.getElementById('clearBtn');
    if (input) input.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    displayPosts('all');
}

document.addEventListener('DOMContentLoaded', () => {
    fetchPostsFromBackend();
    if (localStorage.getItem('nexusTheme') === 'dark') {
        document.body.classList.add('dark-mode');
    }

    const searchInput = document.getElementById('innerSearchInput');
    const clearBtn = document.getElementById('clearBtn');
    if (searchInput && clearBtn) {
        searchInput.addEventListener('input', () => {
            clearBtn.style.display = searchInput.value ? 'inline' : 'none';
        });
    }
});
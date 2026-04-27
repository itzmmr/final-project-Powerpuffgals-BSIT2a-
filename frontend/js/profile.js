
 // --- 1. SECURITY CHECK (Kicks unauthorized users out immediately) ---
    (function() {
        const session = localStorage.getItem('nexusUser');
        if (!session || session === "null" || session === "undefined") {
            window.location.href = "index.html"; 
        }
    })();

    // --- 2. LOGOUT FUNCTION (Properly clears your session) ---
    function logoutUser() {
        localStorage.removeItem('nexusUser'); 
        localStorage.removeItem('nexusPosts'); // Clears cache so next user doesn't see your data
        window.location.href = "index.html";
    }


        let updatedAvatarBase64 = "";

       window.onload = function() {
    if (localStorage.getItem('nexusTheme') === 'dark') document.body.classList.add('dark-mode');
    loadProfile();
    loadMyPosts(); // Changed this line to load the feed automatically
};

        function previewEditImage(input) {
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('editAvatarPreview').src = e.target.result;
                    document.getElementById('editAvatarPreview').style.display = 'block';
                    document.getElementById('editAvatarIcon').style.display = 'none';
                    updatedAvatarBase64 = e.target.result;
                };
                reader.readAsDataURL(input.files[0]);
            }
        }


        // --- GITHUB PORTFOLIO AUTO-FETCH ---
async function loadGitHubPortfolio(username) {
    const githubContainer = document.getElementById('github-portfolio-container');
    if (!githubContainer) return;

    // 1. CHECK IF USERNAME IS VALID
    if (!username || username === 'undefined' || username === 'null' || username === '') {
        githubContainer.innerHTML = `
            <div class="text-center p-3 border rounded bg-light">
                <p class="small text-muted mb-2">No GitHub account linked yet.</p>
                <button class="btn btn-sm btn-outline-success" onclick="document.getElementById('editProfileBtn').click()" style="font-size: 0.75rem;">
                    <i class="fab fa-github me-1"></i> Link GitHub Account
                </button>
            </div>`;
        return;
    }

    // Show loading spinner
    githubContainer.innerHTML = `
        <div class="text-center p-3">
            <div class="spinner-border text-success" role="status"></div>
            <p class="small text-muted">Syncing with GitHub (${username})...</p>
        </div>`;

    try {
        // --- 2. AUTHENTICATION FIX ---
        // We pull directly from localStorage to solve the "Auth token missing" error
        const activeToken = localStorage.getItem('token'); 

        if (!activeToken) {
            console.error("GitHub Sync Failed: No token found in localStorage.");
            githubContainer.innerHTML = `<p class="text-center text-muted small">Please log in to view your portfolio.</p>`;
            return;
        }

        // --- 3. FETCH REPOSITORY DATA ---
        const response = await fetch(`http://localhost:5000/api/github/${username}`, {
            headers: { 
                'Authorization': `Bearer ${activeToken}`,
                'Content-Type': 'application/json' 
            }
        });

        const repoData = await response.json();

        if (response.ok && repoData) {
            // Handle if backend returns an array of repos or a single object
            const repo = Array.isArray(repoData) ? repoData[0] : repoData;

            if (!repo || !repo.html_url) {
                throw new Error("Invalid repository data received");
            }

            githubContainer.innerHTML = `
                <div class="card p-3 shadow-sm border-0 bg-light" style="border-left: 5px solid #1a535c !important;">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="fw-bold mb-0">${repo.name?.toUpperCase() || 'REPOSITORY'}</h6>
                            <small class="text-muted">Verified Technical Portfolio</small>
                            <div class="mt-1">
                                <a href="${repo.html_url}" target="_blank" class="text-decoration-none small fw-bold" style="color: #1a535c;">
                                    <i class="fas fa-code me-1"></i> Source Code
                                </a>
                            </div>
                        </div>
                        <div class="text-end">
                            <span class="badge bg-dark"><i class="fas fa-star text-warning me-1"></i>${repo.stargazers_count || 0}</span>
                            <div class="mt-2">
                                <a href="${repo.html_url}" target="_blank" class="btn btn-sm btn-outline-success" style="font-size: 0.7rem; border-color: #1a535c; color: #1a535c;">
                                    View Repo <i class="fas fa-external-link-alt ms-1"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>`;
        } else {
            githubContainer.innerHTML = `
                <div class="text-center p-3">
                    <p class="text-muted small">Could not verify GitHub user: <strong>${username}</strong></p>
                    <button class="btn btn-sm btn-link text-success p-0" onclick="document.getElementById('editProfileBtn').click()" style="font-size: 0.7rem;">Try a different username?</button>
                </div>`;
        }
    } catch (err) {
        console.error("GitHub Auto-Fetch failed:", err);
        githubContainer.innerHTML = `<p class="text-center text-muted small">Portfolio connection temporarily unavailable.</p>`;
    }
}

// --- USER POSTS AUTO-FETCH ---
async function loadUserPosts(targetProfileId) {
    const postContainer = document.getElementById('userPostsContainer');
    if (!postContainer) return;

    // 1. SAFETY CHECK: Ensure targetProfileId is valid before fetching
    if (!targetProfileId || targetProfileId === 'undefined' || targetProfileId === 'null') {
        postContainer.innerHTML = `<p class="text-center text-muted p-5">User profile data not fully loaded yet.</p>`;
        return;
    }

    // Spinner for the posts section
    postContainer.innerHTML = `
        <div class="text-center p-5">
            <div class="spinner-border" style="color: #1a535c;" role="status"></div>
            <p class="mt-2 text-muted">Retrieving your technical archive...</p>
        </div>`;

    try {
        // --- 2. FIXED AUTHENTICATION SOURCE ---
        // Pulling directly from the standalone 'token' key as seen in Local Storage
        const activeToken = localStorage.getItem('token'); 

        // Exit early if no token exists to avoid 401 errors
        if (!activeToken) {
            postContainer.innerHTML = `<p class="text-center text-muted p-5">Please log in to view posts.</p>`;
            return;
        }

        const response = await fetch(`http://localhost:5000/api/posts/user/${targetProfileId}`, {
            headers: { 
                'Authorization': `Bearer ${activeToken}`,
                'Content-Type': 'application/json' 
            }
        });

        const posts = await response.json();

        if (response.ok) {
            // Save to global window for displayPosts to use
            window.posts = posts;
            
            // Check if displayPosts exists (reusing your dashboard logic for consistency)
            if (typeof displayPosts === 'function') {
                displayPosts();
            } else {
                // Fallback UI if displayPosts isn't in scope
                postContainer.innerHTML = posts.length > 0 
                    ? `<p class="text-center text-muted">${posts.length} posts loaded.</p>`
                    : `<p class="text-center text-muted">No technical posts yet.</p>`;
            }
        } else if (response.status === 401) {
            postContainer.innerHTML = `<p class="text-center text-danger">Session expired. Please log in again.</p>`;
        }
    } catch (err) {
        console.error("Post Auto-Fetch error:", err);
        postContainer.innerHTML = `<p class="text-center text-danger">Connection error. Could not load posts.</p>`;
    }
}
       async function loadProfile() {
    // --- 1. SETUP & IDENTITY CHECK ---
    const userSnapshot = localStorage.getItem('nexusUser');
    
    // Safety check: If the user isn't logged in, stop here
    if (!userSnapshot) {
        console.warn("No session found. Redirecting to login...");
        window.location.href = 'login.html';
        return;
    }

    const loggedInUser = JSON.parse(userSnapshot) || {};
    
    // --- FIXED: AUTHENTICATION SOURCE ---
    // Pull the token from its own key where login.js saves it
    const token = localStorage.getItem('token'); 

    // CRITICAL FIX: Ensure token exists and isn't the string 'undefined'
    if (!token || token === 'undefined') {
        console.error("Auth token is missing. Please log in again.");
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const profileIdFromUrl = urlParams.get('id');
    
    const myId = String(loggedInUser._id || loggedInUser.id || "");
    const targetProfileId = profileIdFromUrl || myId;
    const isMyProfile = !profileIdFromUrl || String(profileIdFromUrl) === myId;

    // --- 2. INITIAL UI STATES (Skeleton/Loading) ---
    const feedTitle = document.querySelector('.container h4');
    if (feedTitle) {
        feedTitle.textContent = isMyProfile ? "My Technical Posts" : "Technical Feed";
    }

    const usernameEl = document.getElementById('profileUsername');
    const roleEl = document.getElementById('profileRoleDisplay');
    const bioEl = document.getElementById('profileBioDisplay');
    
    if (usernameEl) usernameEl.textContent = isMyProfile ? (loggedInUser.name || "User") : "Loading...";
    if (roleEl) roleEl.textContent = isMyProfile ? (loggedInUser.role || "IT Student") : "Technical Contributor";
    if (bioEl) bioEl.textContent = isMyProfile ? (loggedInUser.bio || "Technical Contributor") : "Loading bio...";
    
    const initialAvatar = isMyProfile 
        ? (loggedInUser.avatar || `https://ui-avatars.com/api/?background=1a535c&color=fff&name=${loggedInUser.name}`)
        : `https://ui-avatars.com/api/?background=1a535c&color=fff&name=User`;
    
    const profileAvatarEl = document.getElementById('profileAvatar');
    if (profileAvatarEl) profileAvatarEl.src = initialAvatar;

    // --- 3. FETCH & POPULATE DATA (AUTO-FETCH ENABLED) ---
    try {
        // Use the standalone token for the request
        const activeToken = localStorage.getItem('token');

        if (!activeToken || activeToken === 'undefined') {
            console.error("Auto-fetch blocked: Invalid Token.");
            return; 
        }

        const response = await fetch(`http://localhost:5000/api/users/stats/${targetProfileId}`, {
            headers: { 
                'Authorization': `Bearer ${activeToken}`,
                'Content-Type': 'application/json' 
            }
        });
        
        const profileData = await response.json();

        if (response.ok) {
            if (usernameEl) usernameEl.textContent = profileData.name || "User";
            if (roleEl) roleEl.textContent = profileData.role || "IT Student";
            if (bioEl) bioEl.textContent = profileData.bio || "No bio available.";
            
            if (profileAvatarEl) {
                if (profileData.avatar) {
                    profileAvatarEl.src = profileData.avatar;
                } else {
                    profileAvatarEl.src = `https://ui-avatars.com/api/?background=1a535c&color=fff&name=${profileData.name || 'User'}`;
                }
            }

            const followingCountEl = document.getElementById('followingCount');
            const followersCountEl = document.getElementById('followersCount');
            const postsCountEl = document.getElementById('postsCount');

            if (followingCountEl) followingCountEl.textContent = profileData.following || 0;
            if (followersCountEl) followersCountEl.textContent = profileData.followers || 0;
            if (postsCountEl) postsCountEl.textContent = profileData.posts || 0;

            // --- 🚀 NEW AUTO-FETCH INSERTIONS ---
            if (profileData.githubUsername) {
                loadGitHubPortfolio(profileData.githubUsername);
            }
            loadUserPosts(targetProfileId);

            // --- 4. BUTTON TOGGLE LOGIC ---
            const editBtn = document.getElementById('editProfileBtn');
            const followBtn = document.getElementById('followBtn');

            const applyButtonLogic = () => {
                if (isMyProfile) {
                    if (editBtn) {
                        editBtn.classList.remove('hidden-element'); 
                        editBtn.style.setProperty('display', 'inline-block', 'important');
                    }
                    if (followBtn) {
                        followBtn.classList.add('hidden-element'); 
                        followBtn.style.setProperty('display', 'none', 'important');
                    }
                } else {
                    if (editBtn) {
                        editBtn.classList.add('hidden-element'); 
                        editBtn.style.setProperty('display', 'none', 'important'); 
                    }
                    if (followBtn) {
                        followBtn.classList.remove('hidden-element'); 
                        followBtn.style.setProperty('display', 'inline-block', 'important');
                        
                        const isFollowing = profileData.followersList && profileData.followersList.includes(myId);
                        if (typeof updateFollowButtonUI === 'function') {
                            updateFollowButtonUI(isFollowing);
                        }
                    }
                }
            };

            applyButtonLogic();

            if (!isMyProfile && editBtn) {
                const observer = new MutationObserver(() => {
                    if (!editBtn.classList.contains('hidden-element')) {
                        editBtn.classList.add('hidden-element');
                        editBtn.style.setProperty('display', 'none', 'important');
                    }
                });
                observer.observe(editBtn, { attributes: true, attributeFilter: ['style', 'class'] });
            }

            console.log("Profile data persistent and verified. ✨");

        } else if (response.status === 401) {
            console.error("Authentication failed. Session expired.");
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        } else {
            console.error("Profile fetch failed:", profileData.message);
        }
    } catch (err) {
        console.error("Connection error while loading stats:", err);
    }
}

// --- DOMContentLoaded Listener ---
document.addEventListener('DOMContentLoaded', function() {
    const userData = JSON.parse(localStorage.getItem('nexusUser'));

    // Check if user is logged in AND has a linked GitHub account
    if (userData && userData.githubUsername) {
        loadGitHubPortfolio(userData.githubUsername);
    } else {
        const githubContainer = document.getElementById('github-portfolio-display');
        if (githubContainer) {
            githubContainer.innerHTML = `
                <div class="text-center">
                    <p class="text-muted mb-0">No GitHub account linked to this profile.</p>
                    <button onclick="linkGitHubAccount()" class="btn btn-sm btn-outline-secondary mt-2">
                        <i class="fab fa-github me-1"></i> Link GitHub Account
                    </button>
                </div>
            `;
        }
    }
    
    // Trigger the profile load
    loadProfile();
});

// Function to link account directly from profile
async function linkGitHubAccount() {
    const username = prompt("Please enter your GitHub username:");
    if (!username) return;

    try {
        const user = JSON.parse(localStorage.getItem('nexusUser'));
        
        // Update the backend
        const response = await fetch(`http://localhost:5000/api/users/${user._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ githubUsername: username })
        });

        if (response.ok) {
            const updatedUser = await response.json();
            // Update local storage so the UI stays updated
            localStorage.setItem('nexusUser', JSON.stringify(updatedUser));
            // Immediately load the repos
            loadGitHubPortfolio(username);
        } else {
            alert("User update failed. Make sure your backend PUT route is ready.");
        }
    } catch (err) {
        alert("Cannot connect to server to link GitHub.");
    }
}

/* --- GITHUB PORTFOLIO AUTO-FETCH (Multi-User Version) --- */

async function loadGitHubPortfolio(username) {
    const display = document.getElementById('github-portfolio-display');
    if (!display) return; 
    
    // GUARD: If the profile owner hasn't linked a GitHub, show a neutral message
    if (!username || username === "undefined" || username === "") {
        display.innerHTML = `<p class="text-secondary text-center small">No GitHub account linked to this profile.</p>`;
        return;
    }

    // Show loading state (Your design)
    display.innerHTML = `
        <div class="text-center p-3">
            <div class="spinner-border text-success" role="status" style="width: 1.5rem; height: 1.5rem;"></div>
            <p class="small text-muted mt-2">Syncing technical portfolio...</p>
        </div>`;
    
    try {
        const userSnapshot = localStorage.getItem('nexusUser');
        const loggedInUser = userSnapshot ? JSON.parse(userSnapshot) : {};
        const activeToken = loggedInUser.token;

        // Verify session (Required to prevent 'undefined' token errors in the console)
        if (!activeToken || activeToken === 'undefined') {
            throw new Error("Auth token missing for GitHub sync");
        }

        // FETCH: This is now dynamic based on the 'username' passed from loadProfile
        const response = await fetch(`http://localhost:5000/api/github/${username}`, {
            headers: {
                'Authorization': `Bearer ${activeToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error("Could not fetch GitHub data");

        const repos = await response.json();

        if (!repos || repos.length === 0) {
            display.innerHTML = `<p class="text-secondary text-center">No public repositories found.</p>`;
            return;
        }

        // YOUR ORIGINAL UI STRUCTURE (Untouched)
        display.innerHTML = `<div class="row g-3 m-0 p-0 justify-content-center" id="repo-grid"></div>`;
        const grid = document.getElementById('repo-grid');

        repos.forEach(repo => {
            grid.innerHTML += `
                <div class="col-12 p-0 mb-3"> 
                    <div class="p-3 border rounded-3 bg-body-tertiary repo-card-custom shadow-sm h-100 position-relative">
                        <div class="d-flex justify-content-between align-items-start text-start">
                            <h6 class="fw-bold text-truncate mb-0 text-body" style="max-width: 80%;">${repo.name}</h6>
                            <span class="badge" style="background-color: #1a535c;">
                                <i class="fas fa-star text-warning"></i> ${repo.stars || 0}
                            </span>
                        </div>
                        
                        <p class="small text-secondary-custom my-2 text-start" style="font-size: 0.75rem;">
                            ${repo.description || 'Verified Repository'}
                        </p>
                        
                        <div class="d-flex justify-content-between align-items-center mt-2">
                            <span class="small fw-bold text-info">${repo.language || 'Code'}</span>
                            <a href="${repo.url}" target="_blank" class="btn btn-sm btn-link p-0 text-decoration-none" style="font-size: 0.75rem;">
                                View <i class="fas fa-external-link-alt ms-1"></i>
                            </a>
                        </div>
                    </div>
                </div>`;
        });

        console.log(`GitHub Sync successful for profile: ${username} 🚀`);

    } catch (err) {
        console.error("GitHub Sync Failed:", err.message);
        // Error state if session is expired or connection is lost
        display.innerHTML = `<p class="text-danger small text-center">GitHub Sync Failed. Please log in again to view.</p>`;
    }
}
    // HELPER: Updates Follow Button appearance (Unified for Profile)
    function updateFollowButtonUI(isFollowing) {
        const followBtn = document.getElementById('followBtn');
        if (!followBtn) return;

        if (isFollowing) {
            followBtn.innerHTML = '<i class="fas fa-user-check me-2"></i>Following';
            followBtn.className = "btn btn-light text-success ms-3 fw-bold shadow-sm";
        } else {
            followBtn.innerHTML = '<i class="fas fa-user-plus me-2"></i>Follow';
            followBtn.className = "btn btn-primary ms-3 fw-bold shadow-sm"; 
        }
    }

    async function handleFollowActionFromProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    const targetId = urlParams.get('id');
    
    if (!targetId) return; // Safety check

    // This calls the global function you put in app.js
    await handleFollowAction(targetId);
    
    // This re-runs the profile fetch so the 0 followers becomes 1 immediately
    loadProfile();
}

    // FUNCTION: Handles follow/unfollow click
  async function handleFollow() {
    const loggedInUser = JSON.parse(localStorage.getItem('nexusUser')) || {};
    const token = loggedInUser.token;

    // Get the ID of the person whose profile we are looking at
    const urlParams = new URLSearchParams(window.location.search);
    const targetProfileId = urlParams.get('id');

    // 1. Safety check: ensure we have a target and a token
    if (!targetProfileId || !token) {
        console.warn("Follow action aborted: Missing target ID or User Token.");
        return;
    }

    // 2. Prevent UI glitch: ensure you aren't trying to follow yourself
    const myId = loggedInUser._id || loggedInUser.id;
    if (targetProfileId === myId) {
        console.log("Self-follow prevented on frontend.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/api/users/follow/${targetProfileId}`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            // Update the button UI (Following vs Follow) based on server response
            if (typeof updateFollowButtonUI === 'function') {
                updateFollowButtonUI(data.isFollowing);
            }
            
            // 3. Refresh the stats (Followers count) to show the change immediately
            // We use the existing loadProfile so the numbers update without a page refresh
            loadProfile(); 
        } else {
            // Handle specific error messages from your backend (e.g., "User not found")
            alert(data.message || "Failed to update follow status.");
        }
    } catch (err) {
        console.error("Follow Error:", err);
        alert("Cannot reach the server. Please check your connection.");
    }
}
        async function loadMyPosts() {
    const user = JSON.parse(localStorage.getItem('nexusUser')) || {};
    const container = document.getElementById('profileContentContainer');

    if (!container) return; 

    // --- FIXED: AUTHENTICATION SOURCE ---
    // Retrieve the standalone token we saved in login.js
    const token = localStorage.getItem('token'); 

    // Determine whose posts to fetch
    const urlParams = new URLSearchParams(window.location.search);
    const targetUserId = urlParams.get('id') || (user._id || user.id);
    const isMyProfile = targetUserId === (user._id || user.id);

    container.innerHTML = `<div class="text-center py-5 opacity-50"><h5>Loading technical feed...</h5></div>`;

    try {
        const response = await fetch(`http://localhost:5000/api/posts/user/${targetUserId}`, {
            headers: { 
                // FIXED: Using the direct token instead of user.token
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const posts = await response.json();

        // ADDED/UPDATED CHECK: Handle unauthorized or error messages from backend
        if (posts.message) {
            console.error("Auth Error:", posts.message);
            container.innerHTML = `<div class="text-center py-5"><h5>Please log in again to view posts.</h5></div>`;
            return;
        }

        if (!Array.isArray(posts)) {
            console.error("Expected array but got:", posts);
            container.innerHTML = `<div class="text-center py-5 opacity-50"><h5>No tutorials found.</h5></div>`;
            return;
        }

        if (posts.length === 0) {
            const emptyMsg = isMyProfile ? "You haven't published any tutorials yet." : "This user hasn't published any tutorials yet.";
            container.innerHTML = `<div class="text-center py-5 opacity-50"><h5>${emptyMsg}</h5></div>`;
            return;
        }

        // PRESERVED: Your exact HTML mapping and styling
        container.innerHTML = posts.map(post => `
            <div class="row">
                <div class="col-12">
                    <div class="post-card mb-5 shadow-sm p-4" style="background: #fff; border-radius: 20px; border-left: 8px solid #1a535c;">
                        <div class="d-flex justify-content-between mb-3">
                            <h5 class="fw-bold" style="color: #1a535c;">${post.title}</h5>
                            <span class="badge" style="background: #5b6d5b;">${post.category || 'Web Development'}</span>
                        </div>

                        <p class="text-secondary mb-3">${post.content}</p>

                        ${post.image ? `
                            <div class="bg-light p-2 rounded-3 mb-3"> 
                                <img src="${post.image}" class="img-fluid rounded" 
                                     style="width: 100%; object-fit: cover; max-height: 450px;">
                            </div>` 
                        : ''}

                        <div class="d-flex gap-3 pt-3 border-top">
                            <small class="text-muted"><i class="fas fa-heart text-danger"></i> ${post.likes?.length || 0}</small>
                            <small class="text-muted"><i class="fas fa-comment text-success"></i> ${post.comments?.length || 0}</small>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error("Error loading profile feed:", err);
        container.innerHTML = `<div class="text-center py-5 text-danger"><h5>Could not load posts. Make sure your server is running!</h5></div>`;
    }
}

// PRESERVED: UI Utility functions exactly as provided
function updateTabUI(idx) {
    document.querySelectorAll('#profileTabs .nav-link').forEach((btn, i) => {
        btn.classList.toggle('active', i === idx);
    });
}

function toggleEditOther() {
    const selectEl = document.getElementById('editRoleSelect');
    const otherInput = document.getElementById('editRoleOther');
    if (selectEl && otherInput) {
        otherInput.style.display = (selectEl.value === 'Other') ? 'block' : 'none';
    }
}

       async function saveProfile() {
    // 1. Get current session info
    let user = JSON.parse(localStorage.getItem('nexusUser')) || {};
    const token = user.token;

    // 2. Collect form data (Preserving your specific role/interest logic)
    let finalRole = document.getElementById('editRoleSelect').value;
    if (finalRole === "Other") finalRole = document.getElementById('editRoleOther').value;
    
    let selectedInterests = Array.from(document.querySelectorAll('input[name="editInterest"]:checked')).map(i => i.value);
    const otherInt = document.getElementById('editInterestOther').value.trim();
    if(otherInt) selectedInterests.push(otherInt);

    // --- INSERTED: GitHub Username logic ---
    // This allows users to update their GitHub as many times as they need
    const githubField = document.getElementById('editGithubUsername');
    const newGithub = githubField ? githubField.value.trim() : (user.githubUsername || "");

    // 3. Prepare the update object (Merged with GitHub)
const updatedData = {
    name: document.getElementById('editName').value,
    email: document.getElementById('editEmail').value,
    bio: document.getElementById('editBio').value,
    role: finalRole, 
    interests: selectedInterests,
    githubUsername: document.getElementById('editGithubUsername').value.trim(), // THIS SAVES IT
    // Use a safety check for the avatar variable
    avatar: (typeof updatedAvatarBase64 !== 'undefined' && updatedAvatarBase64) ? updatedAvatarBase64 : user.avatar 
};

    try {
        // 4. SEND TO BACKEND
        const response = await fetch(`http://localhost:5000/api/users/update`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedData)
        });

        const result = await response.json();

        if (response.ok) {
            // 5. Update LocalStorage ONLY after database confirms success
            // This ensures your session stays synced with your new changes
            const newUserSession = { ...user, ...updatedData };
            localStorage.setItem('nexusUser', JSON.stringify(newUserSession));

            // 6. Refresh the UI stats and portfolio
            if (typeof loadProfile === 'function') loadProfile();
            
            // 7. Close Modal using Bootstrap instance
            const modalEl = document.getElementById('editProfileModal');
            if (modalEl) {
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();
            }
            
            alert("Profile and GitHub synced successfully! ✨");
        } else {
            alert(result.message || "Failed to update profile on server.");
        }
    } catch (err) {
        console.error("Save Profile Error:", err);
        alert("Server error. Please ensure your backend is running.");
    }
}


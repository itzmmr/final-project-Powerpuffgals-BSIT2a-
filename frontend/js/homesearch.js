let allPosts = []; 

async function fetchPostsFromBackend() {
    const resultsGrid = document.getElementById('resultsGrid');
    
    // 1. CACHE CHECK: Look for posts we saved last time
    const cachedData = localStorage.getItem('nexus_search_cache');
    
    if(resultsGrid) {
    resultsGrid.innerHTML = `
        <div class="text-center p-5">
            <div class="spinner-border text-success mb-3" role="status"></div>
            <p class="text-muted">Connecting to NEXUSWrites Cloud...<br>
            <small>(This might take a moment.)</small></p>
        </div>`;
}

    try {
        // 2. FETCH FRESH DATA: Still talk to the server in the background
        const response = await fetch('http://localhost:5000/api/posts'); 
        
        if (!response.ok) throw new Error('Server asleep');
        
        const freshPosts = await response.json();
        
        // 3. UPDATE CACHE: Save the newest posts for the next visit
        localStorage.setItem('nexus_search_cache', JSON.stringify(freshPosts));
        
        // Only update the UI if the data is actually different (saves processing)
        if (JSON.stringify(allPosts) !== JSON.stringify(freshPosts)) {
            allPosts = freshPosts;
            console.log("🔄 Search results updated with fresh data!");
            displayPosts('all'); 
        }
    } catch (error) {
        console.error("Fetch error:", error);
        // If it fails and we don't even have a cache, show an error
        if(!cachedData && resultsGrid) {
            resultsGrid.innerHTML = '<div class="alert alert-danger m-3 text-center">Connection is weak. Please check your signal!</div>';
        }
    }
}

// 2. Logic for Search and Tabs
function displayPosts(categoryFilter = 'all', searchTerm = '') {
    const resultsGrid = document.getElementById('resultsGrid');
    if(!resultsGrid) return; 

    resultsGrid.innerHTML = '';

    const cleanCategoryFilter = categoryFilter.trim().toLowerCase();
    const cleanSearchTerm = searchTerm.trim().toLowerCase();

    const filtered = allPosts.filter(post => {
        // Fix: Standardize category checking
        const postCat = (post.category || "").trim().toLowerCase();
        const postTitle = (post.title || "").toLowerCase();
        const postContent = (post.content || "").toLowerCase();
        
        // Match logic: 'top' and 'all' show everything. 
        // Fuzzy matching helps "General" match "General Tech".
        const isAllTab = cleanCategoryFilter === 'all' || cleanCategoryFilter === 'top';
        const matchesCategory = isAllTab || postCat.includes(cleanCategoryFilter) || cleanCategoryFilter.includes(postCat);
        
        const matchesSearch = cleanSearchTerm === '' || 
                             postTitle.includes(cleanSearchTerm) || 
                             postContent.includes(cleanSearchTerm);

        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        resultsGrid.innerHTML = `<div class="col-12 text-center p-5 text-muted">No posts found for this selection.</div>`;
        return;
    }

    filtered.forEach(post => {
        // FIX: Handle the populated author object safely
        const authorName = post.author && post.author.name ? post.author.name : "Anonymous";
        const firstLetter = authorName.charAt(0).toUpperCase();

        resultsGrid.innerHTML += `
            <div class="col-12 col-md-6 col-lg-4 mb-3">
                <div class="card h-100 shadow-sm border-0" style="border-radius: 12px; border-top: 4px solid #1a535c;">
                    <div class="card-body">
                        <span class="badge bg-success mb-2">${post.category || 'General'}</span>
                        <h5 class="card-title" style="font-weight: 600;">${post.title}</h5>
                        <p class="card-text text-muted small">${post.content ? post.content.substring(0, 100) + '...' : ''}</p>
                        <div class="d-flex align-items-center mt-3">
                            <div class="user-icon bg-secondary text-white rounded-circle me-2" 
                                 style="width:30px; height:30px; display:flex; align-items:center; justify-content:center; font-size:12px;">
                                ${firstLetter}
                            </div>
                            <small class="text-muted">${authorName}</small>
                        </div>
                    </div>
                </div>
            </div>`;
    });
}

// 3. UI Handlers (Suggestions, Tabs, and Clearing)
function handleInstantSuggestions(val) {
    const box = document.getElementById('suggestionBox');
    const clearBtn = document.getElementById('clearBtn');
    
    if (val.length > 0) {
        if(clearBtn) clearBtn.style.display = 'block';
        const matches = allPosts.filter(p => p.title.toLowerCase().includes(val.toLowerCase()));
        if (matches.length > 0 && box) {
            box.innerHTML = matches.map(p => `
                <div class="suggest-row" onclick="applySearch('${p.title.replace(/'/g, "\\'")}')">
                    <span><i class="fas fa-search me-2 text-muted"></i> ${p.title}</span>
                </div>
            `).join('');
            box.style.display = 'block';
        } else if (box) { box.style.display = 'none'; }
    } else { 
        if(box) box.style.display = 'none'; 
        if(clearBtn) clearBtn.style.display = 'none';
    }
}

function applySearch(val) {
    const input = document.getElementById('innerSearchInput');
    if(input) input.value = val;
    const box = document.getElementById('suggestionBox');
    if(box) box.style.display = 'none';
    displayPosts('all', val); 
}

function switchTab(el, cat) {
    document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    const input = document.getElementById('innerSearchInput');
    if(input) input.value = '';
    displayPosts(cat); 
}

function clearInput() {
    const input = document.getElementById('innerSearchInput');
    if(input) input.value = '';
    handleInstantSuggestions('');
    displayPosts('all'); 
}

// EXECUTE ON LOAD
// --- UPDATED EXECUTE ON LOAD ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial fetch when page opens
    fetchPostsFromBackend();

    // 2. THE AUTOFETCH: Check for new posts every 30 seconds 
    // This keeps the feed "fresh" without you clicking refresh!
    setInterval(() => {
        console.log("🔄 Autofetching new updates...");
        fetchPostsFromBackend();
    }, 30000); 

    // 3. Search Button Logic
    const searchBtn = document.querySelector('.search-confirm');
    const searchInput = document.getElementById('innerSearchInput');

    if (searchBtn) {
        searchBtn.onclick = (e) => {
            e.preventDefault();
            const val = searchInput ? searchInput.value : '';
            displayPosts('all', val);
        };
    }
    
    // 4. Enter Key Logic
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                displayPosts('all', searchInput.value);
            }
        });
    }
});
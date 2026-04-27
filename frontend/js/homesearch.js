const keywords = ["AI Tutorials", "AI for Web", "WebSys Basics", "WebSys Architecture", "JavaScript Tips", "UI Design"];

function handleInstantSuggestions(val) {
    const box = document.getElementById('suggestionBox');
    const clearBtn = document.getElementById('clearBtn');
    
    if (val.length > 0) {
        clearBtn.style.display = 'block';
        
        // Filter list based on any character match
        const matches = keywords.filter(k => k.toLowerCase().includes(val.toLowerCase()));
        
        if (matches.length > 0) {
            box.innerHTML = matches.map(m => `
                <div class="suggest-row" onclick="applySearch('${m}')">
                    <span><i class="fas fa-search me-2 text-muted"></i> ${m}</span>
                    <i class="fas fa-arrow-up" style="transform: rotate(-45deg); color: #ddd;"></i>
                </div>
            `).join('');
            box.style.display = 'block';
        } else {
            box.style.display = 'none';
        }
    } else {
        box.style.display = 'none';
        clearBtn.style.display = 'none';
    }
}

function applySearch(val) {
    document.getElementById('innerSearchInput').value = val;
    document.getElementById('suggestionBox').style.display = 'none';
    // Add your filtering code here to show relevant NEXUSWrites posts
}

function switchTab(el, cat) {
    document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    // Filter posts by category logic...
}

function clearInput() {
    document.getElementById('innerSearchInput').value = '';
    handleInstantSuggestions('');
}

let allPosts = []; // Start empty

async function fetchPostsFromBackend() {
    try {
        // Replace this URL with your actual backend endpoint
        const response = await fetch('YOUR_BACKEND_API_URL_HERE/posts'); 
        allPosts = await response.json();
        
        // Once data is loaded, display 'Top' (all) by default
        displayPosts('all'); 
    } catch (error) {
        console.error("Error loading posts:", error);
    }
}

// Update your display function to use the fetched data
function displayPosts(categoryFilter = 'all') {
    const resultsGrid = document.getElementById('resultsGrid');
    if(!resultsGrid) return; 

    resultsGrid.innerHTML = '';

    // Filter logic
    const filtered = categoryFilter === 'all' 
        ? allPosts 
        : allPosts.filter(post => post.category.trim() === categoryFilter.trim());

    if (filtered.length === 0) {
        resultsGrid.innerHTML = `<div class="col-12 text-center p-5">No posts in ${categoryFilter} yet.</div>`;
        return;
    }

    filtered.forEach(post => {
        resultsGrid.innerHTML += `
            <div class="col-6 col-md-4">
                <div class="card h-100 shadow-sm border-0">
                    <div class="card-body">
                        <span class="badge bg-soft-primary mb-2">${post.category}</span>
                        <h6 class="card-title">${post.title}</h6>
                        <p class="small text-muted">Posted on Dashboard</p>
                    </div>
                </div>
            </div>`;
    });
}

// Call fetch when page loads
document.addEventListener('DOMContentLoaded', fetchPostsFromBackend);

// 1. Function to fetch data from your real backend
async function loadTaggedPosts(category = 'all') {
    const resultsGrid = document.getElementById('resultsGrid');
    resultsGrid.innerHTML = '<div class="text-center p-5">Loading posts...</div>';

    try {
        // Change this URL to your actual backend endpoint (e.g., http://localhost:3000/api/posts)
        const response = await fetch('YOUR_BACKEND_API_URL_HERE'); 
        const posts = await response.json();

        // 2. Filter logic: 
        // We compare the post's category from your database to the tab clicked
        const filteredPosts = category === 'all' 
            ? posts 
            : posts.filter(p => p.category === category);

        // 3. Clear and Display
        resultsGrid.innerHTML = ''; 

        if (filteredPosts.length === 0) {
            resultsGrid.innerHTML = `<div class="text-center p-5 text-muted">No posts found in ${category} yet.</div>`;
            return;
        }

        filteredPosts.forEach(post => {
            // This creates the card for your "fsgd" post
            resultsGrid.innerHTML += `
                <div class="col-12 col-md-6 col-lg-4 mb-3">
                    <div class="card h-100 shadow-sm border-0">
                        <div class="card-body">
                            <span class="badge bg-success mb-2">${post.category}</span>
                            <h5 class="card-title">${post.title}</h5>
                            <p class="card-text text-muted">${post.content || ''}</p>
                            <div class="d-flex align-items-center mt-3">
                                <div class="user-icon bg-secondary text-white rounded-circle me-2" style="width:30px; height:30px; display:flex; align-items:center; justify-content:center;">
                                    ${post.author ? post.author[0] : 'U'}
                                </div>
                                <small>${post.author || 'Anonymous'}</small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error fetching posts:", error);
        resultsGrid.innerHTML = '<div class="alert alert-danger">Could not load posts. Make sure backend is running.</div>';
    }
}

// 4. Update the switchTab function you already have
function switchTab(element, categoryName) {
    // UI: Set active tab
    document.querySelectorAll('.search-tab').forEach(tab => tab.classList.remove('active'));
    element.classList.add('active');

    // Logic: Fetch and filter
    loadTaggedPosts(categoryName);
}

// 5. Initial Load (runs when you open homesearch.html)
document.addEventListener('DOMContentLoaded', () => {
    loadTaggedPosts('all'); // Show everything by default
});
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
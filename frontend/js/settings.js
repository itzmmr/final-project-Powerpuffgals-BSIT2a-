// 2. INITIALIZATION & GLOBAL VARIABLES
let profileModal;

document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    const modalElem = document.getElementById('editProfileModal');
    if (modalElem) {
        profileModal = new bootstrap.Modal(modalElem);
        const savedSize = localStorage.getItem('nexusFontSize') || '16';
changeFontSize(savedSize);
if(document.getElementById('fontSizeSlider')) {
    document.getElementById('fontSizeSlider').value = savedSize;
    function changeFontSize(size) {
    // 1. Apply to the entire document immediately
    document.documentElement.style.fontSize = size + 'px';
    
    // 2. Update the number label in the settings UI
    const display = document.getElementById('fontSizeValue');
    if (display) display.innerText = size + 'px';

    // 3. Save it so it's "sticky" across all pages
    localStorage.setItem('nexusFontSize', size);
}
}
    }
});

// 3. CORE FUNCTIONS
function changeLanguage(lang) {
    // 1. Look for the data in the big window.translations object at the top
    const data = window.translations[lang]; 
    
    if (!data) {
        console.error("Translation for " + lang + " not found!");
        return;
    }

    // 2. Translate everything with data-translate OR data-key
    document.querySelectorAll('[data-translate], [data-key]').forEach(el => {
        const key = el.getAttribute('data-translate') || el.getAttribute('data-key');
        if (data[key]) {
            // Handle placeholders for search bars
            if (el.tagName === 'INPUT' && el.placeholder) {
                el.placeholder = data[key];
            } else {
                el.innerText = data[key];
            }
        }
    });

    // 3. Save to localStorage so other pages can see it
    localStorage.setItem('nexusLang', lang);
}

// --- 2. YOUR CHANGE LANGUAGE FUNCTION (Updated to use window.translations) ---
function changeLanguage(lang) {
    // FIX: Look at window.translations specifically
    const data = window.translations ? window.translations[lang] : null; 
    
    if (!data) {
        console.warn("Translation data not ready yet.");
        return;
    }

    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (data[key]) {
            if (el.tagName === 'INPUT' && el.placeholder) {
                el.placeholder = data[key];
            } else {
                el.innerText = data[key];
            }
        }
    });

    localStorage.setItem('nexusLang', lang);
}

function loadSettings() {
    const savedTheme = localStorage.getItem('nexusTheme') || 'light';
    document.body.classList.toggle('dark-mode', savedTheme === 'dark');
    if(document.getElementById('themeSelect')) document.getElementById('themeSelect').value = savedTheme;

    const savedLang = localStorage.getItem('nexusLang') || 'English';
    changeLanguage(savedLang);
    if(document.getElementById('langSelect')) document.getElementById('langSelect').value = savedLang;

    const userData = JSON.parse(localStorage.getItem('nexusUser') || '{}');
    if (userData.name && document.getElementById('navUsername')) {
        document.getElementById('navUsername').innerText = userData.name;
    }
}

function showSection(sectionId) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openProfileModal() {
    if (profileModal) {
        profileModal.show();
    } else {
        const modalElem = document.getElementById('editProfileModal');
        profileModal = new bootstrap.Modal(modalElem);
        profileModal.show();
    }
}

async function saveProfile() {
    // 1. Get the token directly from localStorage (Your current fix is correct!)
    // 2. Safely grab values using optional chaining (already good)
    const modalName = document.getElementById('editName')?.value;
    const modalBio = document.getElementById('editBio')?.value;
    const modalGithub = document.getElementById('editGithub')?.value;
    const modalRoleSelect = document.getElementById('editRoleSelect')?.value;
    const modalRoleOther = document.getElementById('editRoleOther')?.value;
    
    // Logic for "Other" role
    const finalRole = (modalRoleSelect === 'Other') ? modalRoleOther : modalRoleSelect;

    // 3. Collect interests (Ensures it's an array even if none are checked)
    const selectedInterests = Array.from(document.querySelectorAll('.interests-checkbox:checked'))
        .map(cb => cb.value);

    const updateData = {
        name: modalName,
        bio: modalBio,
        role: finalRole,
        githubUsername: modalGithub,
        interests: selectedInterests
    };

    // UI Feedback: Change button text so user knows it's working
    const saveBtn = document.querySelector('button[onclick="saveProfile()"]');
    if (saveBtn) saveBtn.innerText = "Saving...";

    try {
        const response = await fetch('http://localhost:5000/api/users/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // This fixes the 401 Unauthorized
            },
            body: JSON.stringify(updateData)
        });

        const result = await response.json();

        if (response.ok) {
            // Update local user data so the name changes instantly in the UI
            localStorage.setItem('nexusUser', JSON.stringify(result.user));
            
            alert("Profile updated successfully! ✨");

            // Safety check for Bootstrap modal
            if (typeof profileModal !== 'undefined' && profileModal) {
                profileModal.hide();
            }
            
            location.reload(); 
        } else {
            alert(result.message || "Update failed");
        }
    } catch (error) {
        console.error("Error saving profile:", error);
        alert("Server error. Please check if your backend is running.");
    } finally {
        if (saveBtn) saveBtn.innerText = "Save Changes";
    }
}
// 4. UI EVENT HANDLERS
function changeTheme(theme) {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    localStorage.setItem('nexusTheme', theme);
}

function previewEditImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('editAvatarPreview');
            const icon = document.getElementById('editAvatarIcon');
            if (preview && icon) {
                preview.src = e.target.result;
                preview.style.display = 'block';
                icon.style.display = 'none';
            }
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function toggleEditOther() {
    const select = document.getElementById('editRoleSelect');
    const otherInput = document.getElementById('editRoleOther');
    if (select && otherInput) {
        otherInput.style.display = (select.value === 'Other') ? 'block' : 'none';
    }
}

function applyLanguage() {
    // Safety check: if translations isn't defined yet, don't crash the script
    if (typeof translations === 'undefined' && !window.translations) {
        console.warn("NEXUSWrites: Translation data not ready yet.");
        return;
    }

    const lang = localStorage.getItem('nexusLang') || 'English';
    const dict = (window.translations || translations)[lang];

    if (!dict) return;

    document.querySelectorAll('[data-key], [data-translate]').forEach(el => {
        const key = el.dataset.key || el.getAttribute('data-translate');
        if (dict[key]) {
            el.innerText = dict[key];
        }
    });
}

function logout() {
    localStorage.removeItem('nexusUser');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

// Add this to the very bottom of settings.js
document.addEventListener('DOMContentLoaded', () => {
    // 1. Get the language saved in the browser's memory
    const savedLang = localStorage.getItem('nexusLang') || 'English';
    
    // 2. Run the changeLanguage function immediately
    if (typeof changeLanguage === 'function') {
        changeLanguage(savedLang);
    }
    
    // 3. Update the dropdown if it exists on this page
    const langDrop = document.getElementById('langSelect');
    if (langDrop) langDrop.value = savedLang;
});

// This function handles the slider input
function changeFontSize(size) {
    // 1. Update the label showing the number (e.g., 16px)
    const display = document.getElementById('fontSizeValue');
    if (display) {
        display.innerText = size + 'px';
    }

    // 2. Apply the font size to the main content or body
    // You can use document.body for everything, or a specific container
    document.documentElement.style.setProperty('--base-font-size', size + 'px');
    document.body.style.fontSize = size + 'px';

    // 3. Save the setting so it doesn't reset on refresh
    localStorage.setItem('nexusFontSize', size);
}

// This runs automatically on EVERY page
document.addEventListener('DOMContentLoaded', () => {
    // FONT SIZE STICKY LOGIC
    const savedSize = localStorage.getItem('nexusFontSize') || '16';
    changeFontSize(savedSize);
    
    // Sync the slider if we are on the settings page
    const slider = document.getElementById('fontSizeSlider');
    if (slider) slider.value = savedSize;

    // LANGUAGE STICKY LOGIC
    const savedLang = localStorage.getItem('nexusLang') || 'English';
    changeLanguage(savedLang);
});

async function handlePasswordChange() {
    const currentPass = document.getElementById('currentPassInput').value;
    const newPass = document.getElementById('newPassInput').value;
    const confirmPass = document.getElementById('confirmPassInput').value;

    if (newPass !== confirmPass) {
        showErrorModal("New passwords do not match.");
        return;
    }

    try {
        // Change the URL to match your Node server (e.g., http://localhost:5000/api/users/change-password)
        const response = await fetch('/api/users/change-password', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` // If using JWT
            },
            body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
        });

        const data = await response.json();

        if (data.success) {
            alert("Password updated!");
            location.reload();
        } else {
            // TRIGGER YOUR MODAL
            showErrorModal(data.message);
        }
    } catch (error) {
        showErrorModal("Connection to server failed.");
    }
}

function showErrorModal(msg) {
    document.getElementById('errorText').innerText = msg;
    const modalEl = document.getElementById('passwordErrorModal');
    // Forces the modal to show every time
    const myModal = bootstrap.Modal.getOrCreateInstance(modalEl);
    myModal.show();
}
async function handlePasswordChange() {
    const currentPass = document.getElementById('currentPassInput').value;
    const newPass = document.getElementById('newPassInput').value;
    const confirmPass = document.getElementById('confirmPassInput').value;

    // 1. Validation Logic
    if (!currentPass || !newPass || !confirmPass) {
        showStatusModal("Wait!", "Please fill in all fields before updating.", "error");
        return;
    }

    if (newPass !== confirmPass) {
        showStatusModal("Mismatch", "Your new passwords do not match.", "error");
        return;
    }

    try {
        console.log("📡 Attempting to change password via port 5000..."); 

        const response = await fetch('http://localhost:5000/api/users/update-password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` 
            },
            body: JSON.stringify({
                currentPassword: currentPass, 
                newPassword: newPass
            })
        });

        const result = await response.json();

        if (response.ok) {
            // SUCCESS: Message placed under the title
            showStatusModal("Updated!", "Your password has been changed successfully. You can now use your new credentials.", "success");
            
            document.getElementById('currentPassInput').value = '';
            document.getElementById('newPassInput').value = '';
            document.getElementById('confirmPassInput').value = '';
            
            console.log("✅ Password successfully updated in MongoDB.");
        } else {
            // ERROR: Specific English security messages
            let detailedTitle = "Security Check";
            let detailedMessage = result.message || "Update failed.";

            if (response.status === 401) {
                detailedMessage = "The current password you entered is incorrect. Please try again.";
            } else if (response.status === 400) {
                detailedTitle = "Invalid Input";
                detailedMessage = result.message || "Please ensure your new password meets security requirements.";
            } else if (response.status === 403) {
                detailedTitle = "Session Expired";
                detailedMessage = "Your session has expired. Please log out and log back in.";
            }

            showStatusModal(detailedTitle, detailedMessage, "error");
        }
    } catch (error) {
        console.error("❌ Error updating password:", error);
        showStatusModal("Connection Error", "Unable to reach the server. Please check port 5000.", "error");
    }
}

/**
 * Updated showStatusModal to force text visibility and clear ARIA warnings
 */
function showStatusModal(title, message, type = 'error') {
    const modalElem = document.getElementById('statusModal');
    if (!modalElem) return;

    // Accessibility preparation to stop console warnings
    modalElem.removeAttribute('aria-hidden');
    modalElem.setAttribute('aria-modal', 'true');
    modalElem.setAttribute('role', 'dialog');

    const modal = new bootstrap.Modal(modalElem, { focus: false });
    
    const icon = document.getElementById('statusIcon');
    const titleEl = document.getElementById('statusTitle');
    const textEl = document.getElementById('statusText');

    // FORCE injection: This makes the message appear below the title
    if (titleEl) titleEl.innerText = title;
    if (textEl) textEl.innerText = message;

    if (icon) {
        icon.className = 'fas fa-4x mb-3'; 
        if (type === 'success') {
            icon.classList.add('fa-check-circle', 'text-success');
        } else {
            icon.classList.add('fa-exclamation-triangle', 'text-warning');
        }
    }

    modal.show();

    // Fix: Managed focus after animation is finished
    modalElem.addEventListener('shown.bs.modal', () => {
        setTimeout(() => {
            const closeBtn = modalElem.querySelector('.btn-nexus') || modalElem.querySelector('button');
            if (closeBtn) closeBtn.focus();
        }, 150);
    }, { once: true });

    modalElem.addEventListener('hidden.bs.modal', () => {
        modalElem.setAttribute('aria-hidden', 'true');
    }, { once: true });
}

// Allow pressing "Enter" to submit password change
['currentPassInput', 'newPassInput', 'confirmPassInput'].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handlePasswordChange();
        });
    }
});

function logout() {
    localStorage.removeItem('nexusUser');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}
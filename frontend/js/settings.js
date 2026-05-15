// ============================================
// GLOBAL VARIABLES — declared once at the top
// ============================================
let profileModal;
let updatedAvatarBase64 = "";

// ============================================
// FONT SIZE — defined before anything calls it
// ============================================
function changeFontSize(size) {
    const display = document.getElementById('fontSizeValue');
    if (display) display.innerText = size + 'px';
    document.documentElement.style.setProperty('--base-font-size', size + 'px');
    document.body.style.fontSize = size + 'px';
    localStorage.setItem('nexusFontSize', size);
}

// ============================================
// THEME
// ============================================
function changeTheme(theme) {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    const sidebar = document.querySelector('.sidebar-left');
    if (sidebar) sidebar.classList.toggle('dark-mode', theme === 'dark');
    localStorage.setItem('nexusTheme', theme);
}

function applyGlobalTheme() {
    const savedTheme = localStorage.getItem('nexusTheme') || 'light';
    const isDark = savedTheme === 'dark';
    document.body.classList.toggle('dark-mode', isDark);
    const sidebar = document.querySelector('.sidebar-left');
    if (sidebar) sidebar.classList.toggle('dark-mode', isDark);
    if (document.getElementById('themeSelect')) {
        document.getElementById('themeSelect').value = savedTheme;
    }
}

// Run immediately to prevent white flash
applyGlobalTheme();

// ============================================
// LANGUAGE
// ============================================
function applyLanguage() {
    if (typeof translations === 'undefined' && !window.translations) {
        console.warn("NEXUSWrites: Translation data not ready yet.");
        return;
    }
    const lang = localStorage.getItem('nexusLang') || 'English';
    const dict = (window.translations || translations)[lang];
    if (!dict) return;
    document.querySelectorAll('[data-key], [data-translate]').forEach(el => {
        const key = el.dataset.key || el.getAttribute('data-translate');
        if (dict[key]) el.innerText = dict[key];
    });
}

// ============================================
// LOAD SETTINGS ON PAGE START
// ============================================
function loadSettings() {
    applyGlobalTheme();

    const savedSize = localStorage.getItem('nexusFontSize') || '16';
    changeFontSize(savedSize);
    const slider = document.getElementById('fontSizeSlider');
    if (slider) slider.value = savedSize;

    const savedLang = localStorage.getItem('nexusLang') || 'English';
    if (typeof changeLanguage === 'function') changeLanguage(savedLang);
    const langDrop = document.getElementById('langSelect');
    if (langDrop) langDrop.value = savedLang;

    const userData = JSON.parse(localStorage.getItem('nexusUser') || '{}');
    if (userData.name && document.getElementById('navUsername')) {
        document.getElementById('navUsername').innerText = userData.name;
    }
}

// ============================================
// SECTION NAVIGATION
// ============================================
function showSection(sectionId) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// PROFILE MODAL — open and pre-fill
// ============================================
function openProfileModal() {
    const user = JSON.parse(localStorage.getItem('nexusUser') || '{}');

    const nameEl       = document.getElementById('editName');
    const bioEl        = document.getElementById('editBio');
    const githubEl     = document.getElementById('editGithub');
    const roleSelectEl = document.getElementById('editRoleSelect');
    const roleOtherEl  = document.getElementById('editRoleOther');
    const avatarPreview = document.getElementById('editAvatarPreview');
    const avatarIcon    = document.getElementById('editAvatarIcon');

    if (nameEl)   nameEl.value   = user.name           || '';
    if (bioEl)    bioEl.value    = user.bio            || '';
    if (githubEl) githubEl.value = user.githubUsername || '';

    if (roleSelectEl) {
        const knownRoles = Array.from(roleSelectEl.options).map(o => o.value);
        if (user.role && knownRoles.includes(user.role)) {
            roleSelectEl.value = user.role;
        } else if (user.role) {
            roleSelectEl.value = 'Other';
            if (roleOtherEl) {
                roleOtherEl.value = user.role;
                roleOtherEl.style.display = 'block';
            }
        }
    }

    document.querySelectorAll('.interests-checkbox').forEach(cb => {
        cb.checked = user.interests ? user.interests.includes(cb.value) : false;
    });

    if (avatarPreview && user.avatar) {
        avatarPreview.src = user.avatar;
        avatarPreview.style.display = 'block';
        if (avatarIcon) avatarIcon.style.display = 'none';
    }

    // Reset avatar tracker each time modal opens
    updatedAvatarBase64 = "";

    if (!profileModal) {
        const modalElem = document.getElementById('editProfileModal');
        profileModal = new bootstrap.Modal(modalElem);
    }
    profileModal.show();
}

// ============================================
// PROFILE MODAL — save changes
// ============================================
async function saveProfile() {
    const modalName       = document.getElementById('editName')?.value.trim();
    const modalBio        = document.getElementById('editBio')?.value.trim();
    const modalGithub     = document.getElementById('editGithub')?.value.trim();
    const modalRoleSelect = document.getElementById('editRoleSelect')?.value;
    const modalRoleOther  = document.getElementById('editRoleOther')?.value.trim();

    const finalRole = (modalRoleSelect === 'Other') ? modalRoleOther : modalRoleSelect;

    const selectedInterests = Array.from(
        document.querySelectorAll('.interests-checkbox:checked')
    ).map(cb => cb.value);

    const user = JSON.parse(localStorage.getItem('nexusUser') || '{}');

    const updateData = {
        name:           modalName,
        bio:            modalBio,
        role:           finalRole,
        githubUsername: modalGithub,
        interests:      selectedInterests,
        avatar:         updatedAvatarBase64 || user.avatar || ""
    };

    const saveBtn = document.querySelector('button[onclick="saveProfile()"]');
    if (saveBtn) saveBtn.innerText = "Saving...";

    const token = localStorage.getItem('token');
    if (!token) {
        showStatusModal("Not Logged In", "No login token found. Please log out and log back in.", "error");
        if (saveBtn) saveBtn.innerText = "Save Changes";
        return;
    }

    try {
        const response = await fetch('https://final-project-powerpuffgals-bsit2a.onrender.com/api/users/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });

        const result = await response.json();

        if (response.ok) {
            // Merge updated fields into local user data
            const updatedUser = { ...user, ...result.user };
            localStorage.setItem('nexusUser', JSON.stringify(updatedUser));

            const navName = document.getElementById('navUsername');
            if (navName && modalName) navName.innerText = modalName;

            showStatusModal("Profile Updated!", "Your profile has been saved successfully. ✨", "success");

            if (profileModal) profileModal.hide();

            setTimeout(() => location.reload(), 2000);
        } else {
            showStatusModal("Update Failed", result.message || "Something went wrong. Please try again.", "error");
        }
    } catch (error) {
        console.error("Error saving profile:", error);
        showStatusModal("Server Error", "Could not reach localhost:5000. Is your backend running?", "error");
    } finally {
        if (saveBtn) saveBtn.innerText = "Save Changes";
    }
}

// ============================================
// AVATAR PREVIEW
// ============================================
function previewEditImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('editAvatarPreview');
            const icon    = document.getElementById('editAvatarIcon');
            if (preview && icon) {
                preview.src = e.target.result;
                preview.style.display = 'block';
                icon.style.display = 'none';
            }
            // Save base64 so saveProfile() can send it
            updatedAvatarBase64 = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// ============================================
// ROLE "OTHER" TOGGLE
// ============================================
function toggleEditOther() {
    const select     = document.getElementById('editRoleSelect');
    const otherInput = document.getElementById('editRoleOther');
    if (select && otherInput) {
        otherInput.style.display = (select.value === 'Other') ? 'block' : 'none';
    }
}

// ============================================
// PASSWORD CHANGE
// ============================================
async function handlePasswordChange() {
    const currentPass = document.getElementById('currentPassInput').value;
    const newPass     = document.getElementById('newPassInput').value;
    const confirmPass = document.getElementById('confirmPassInput').value;

    if (!currentPass || !newPass || !confirmPass) {
        showStatusModal("Wait!", "Please fill in all fields before updating.", "error");
        return;
    }
    if (newPass !== confirmPass) {
        showStatusModal("Mismatch", "Your new passwords do not match.", "error");
        return;
    }

    try {
        const response = await fetch('https://final-project-powerpuffgals-bsit2a.onrender.com/api/users/update-password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
        });

        const result = await response.json();

        if (response.ok) {
            showStatusModal("Updated!", "Your password has been changed successfully.", "success");
            document.getElementById('currentPassInput').value = '';
            document.getElementById('newPassInput').value     = '';
            document.getElementById('confirmPassInput').value = '';
        } else {
            let title = "Security Check";
            let msg   = result.message || "Update failed.";
            if (response.status === 401) msg   = "The current password is incorrect.";
            if (response.status === 403) title = "Session Expired";
            showStatusModal(title, msg, "error");
        }
    } catch (error) {
        showStatusModal("Connection Error", "Unable to reach the server. Is localhost:5000 running?", "error");
    }
}

// Enter key support for password fields
['currentPassInput', 'newPassInput', 'confirmPassInput'].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.addEventListener('keypress', e => {
        if (e.key === 'Enter') handlePasswordChange();
    });
});

// ============================================
// STATUS MODAL
// ============================================
function showStatusModal(title, message, type = 'error') {
    const modalElem = document.getElementById('statusModal');
    if (!modalElem) return;

    modalElem.removeAttribute('aria-hidden');
    modalElem.setAttribute('aria-modal', 'true');
    modalElem.setAttribute('role', 'dialog');

    const titleEl = document.getElementById('statusTitle');
    const textEl  = document.getElementById('statusText');
    const icon    = document.getElementById('statusIcon');

    if (titleEl) titleEl.innerText = title;
    if (textEl)  textEl.innerText  = message;

    if (icon) {
        icon.className = 'fas fa-4x mb-3';
        if (type === 'success') {
            icon.classList.add('fa-check-circle', 'text-success');
        } else {
            icon.classList.add('fa-exclamation-triangle', 'text-warning');
        }
    }

    const modal = new bootstrap.Modal(modalElem, { focus: false });
    modal.show();

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

// ============================================
// LOGOUT
// ============================================
function logoutUser() {
    localStorage.removeItem('nexusUser');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

function showLogoutModal() {
    new bootstrap.Modal(document.getElementById("nexusLogoutModal")).show();
}

// ============================================
// INIT — single DOMContentLoaded
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();

    const modalElem = document.getElementById('editProfileModal');
    if (modalElem) {
        profileModal = new bootstrap.Modal(modalElem);
    }
});

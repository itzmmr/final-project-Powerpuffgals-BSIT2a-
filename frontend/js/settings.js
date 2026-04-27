// 1. CONSOLIDATED TRANSLATION DATA
window.translations = {
    "English": {
        "home": "Home", "following": "Following", "github": "GitHub", "settings": "Settings",
        "accSettings": "Account Settings", "manageProfile": "Manage your profile and platform experience.",
        "editPref": "Edit Preferences", "customizeContent": "Customize content and display.",
        "privacySec": "Privacy & Security", "managePass": "Manage password and account visibility.",
        "helpCenter": "Help Center", "getSupport": "Get support and learn how to use NEXUSWrites.",
        "logout": "Log Out", "textSize": "Text Size", "displayMode": "Display Mode",
        "language": "Language", "saveChanges": "Save Changes", "changePass": "Change Password",
        "updatePass": "Update Password", "done": "Done", "backSettings": "Back to Settings",
        "welcome": "Welcome back", "post": "Post a tutorial...", "search": "Search tutorials..."
    },
    "Filipino": {
        "home": "Home", "following": "Sinusundan", "github": "GitHub", "settings": "Settings",
        "accSettings": "Settings ng Account", "manageProfile": "Pamahalaan ang iyong profile.",
        "editPref": "I-edit ang Kagustuhan", "customizeContent": "I-customize ang nilalaman.",
        "privacySec": "Privacy at Seguridad", "managePass": "Pamahalaan ang password.",
        "helpCenter": "Help Center", "getSupport": "Matuto gamitin ang NEXUSWrites.",
        "logout": "Mag-log Out", "textSize": "Laki ng Teksto", "displayMode": "Display Mode",
        "language": "Wika", "saveChanges": "I-save ang Pagbabago", "changePass": "Palitan ang Password",
        "updatePass": "I-update ang Password", "done": "Tapos na", "backSettings": "Bumalik sa Settings",
        "welcome": "Maligayang pagbabalik", "post": "Mag-post ng tutorial...", "search": "Maghanap..."
    },
    "Korean": {
        "home": "홈", "following": "팔로잉", "github": "GitHub", "settings": "설정",
        "accSettings": "계정 설정", "manageProfile": "프로필 및 플랫폼 환경 관리",
        "editPref": "기본 설정 편집", "customizeContent": "콘텐츠 및 디스플레이 맞춤 설정",
        "privacySec": "개인정보 및 보안", "managePass": "비밀번호 및 계정 관리",
        "helpCenter": "고객 센터", "getSupport": "NEXUSWrites 사용법 배우기",
        "logout": "로그아웃", "textSize": "글자 크기", "displayMode": "디스플레이 모드",
        "language": "언어", "saveChanges": "변경 사항 저장", "changePass": "비밀번호 변경",
        "updatePass": "비밀번호 업데이트", "done": "완료", "backSettings": "설정으로 돌아가기",
        "welcome": "다시 오신 것을 환영합니다", "post": "튜토리얼 게시...", "search": "검색..."
    },
    "Japanese": {
        "home": "ホーム", "following": "フォロー中", "github": "GitHub", "settings": "設定",
        "accSettings": "アカウント設定", "manageProfile": "プロフィールの管理",
        "editPref": "設定の編集", "customizeContent": "表示のカスタマイズ",
        "privacySec": "プライバシーとセキュリティ", "managePass": "パスワードの管理",
        "helpCenter": "ヘルプセンター", "getSupport": "使い方を学ぶ",
        "logout": "ログアウト", "textSize": "文字サイズ", "displayMode": "表示モード",
        "language": "言語", "saveChanges": "変更を保存", "changePass": "パスワードの変更",
        "updatePass": "パスワードを更新", "done": "完了", "backSettings": "設定に戻る",
        "welcome": "おかえりなさい", "post": "投稿する...", "search": "検索..."
    },
    "Chinese": {
        "home": "首页", "following": "正在关注", "github": "GitHub", "settings": "设置",
        "accSettings": "账号设置", "manageProfile": "管理您的个人资料",
        "editPref": "编辑偏好", "customizeContent": "自定义内容和显示",
        "privacySec": "隐私与安全", "managePass": "管理密码和可见性",
        "helpCenter": "帮助中心", "getSupport": "了解如何使用 NEXUSWrites",
        "logout": "登出", "textSize": "字体大小", "displayMode": "显示模式",
        "language": "语言", "saveChanges": "保存更改", "changePass": "修改密码",
        "updatePass": "更新密码", "done": "完成", "backSettings": "回到设置",
        "welcome": "欢迎回来", "post": "发布教程...", "search": "搜索..."
    },
    "Thai": {
        "home": "หน้าแรก", "following": "กำลังติดตาม", "github": "GitHub", "settings": "การตั้งค่า",
        "accSettings": "การตั้งค่าบัญชี", "manageProfile": "จัดการโปรไฟล์ของคุณ",
        "editPref": "แก้ไขความชอบ", "customizeContent": "ปรับแต่งเนื้อหา",
        "privacySec": "ความเป็นส่วนตัว", "managePass": "จัดการรหัสผ่าน",
        "helpCenter": "ศูนย์ช่วยเหลือ", "getSupport": "เรียนรู้วิธีใช้ NEXUSWrites",
        "logout": "ออกจากระบบ", "textSize": "ขนาดตัวอักษร", "displayMode": "โหมดการแสดงผล",
        "language": "ภาษา", "saveChanges": "บันทึกการเปลี่ยนแปลง", "changePass": "เปลี่ยนรหัสผ่าน",
        "updatePass": "อัปเดตรหัสผ่าน", "done": "เสร็จสิ้น", "backSettings": "กลับไปที่การตั้งค่า",
        "welcome": "ยินดีต้อนรับกลับ", "post": "โพสต์บทเรียน...", "search": "ค้นหา..."
    }
};
// 2. INITIALIZATION & GLOBAL VARIABLES
let profileModal;

document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    const modalElem = document.getElementById('editProfileModal');
    if (modalElem) {
        profileModal = new bootstrap.Modal(modalElem);
    }
});

// 3. CORE FUNCTIONS
// --- 1. SAFE TRANSLATION DECLARATION ---
// This prevents the red SyntaxError that stops the whole script
if (typeof translations === 'undefined') {
    window.translations = {
        'English': { 
            home: 'Home', 
            settings: 'Settings', 
            logout: 'Logout',
            welcome: 'Welcome back',
            // ... add all your other keys here
        },
        'Filipino': { 
            home: 'Home', 
            settings: 'Mga Setting', 
            logout: 'Mag-log Out',
            welcome: 'Maligayang pagbabalik',
            // ... add all your other keys here
        }
    };
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
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Session expired. Please log in again.");
        window.location.href = "index.html"; // Send them home if token is gone
        return;
    }

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
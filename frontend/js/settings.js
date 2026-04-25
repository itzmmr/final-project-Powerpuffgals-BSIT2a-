// --- TRANSLATION DATA ---
const translations = {
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

// --- NEW LANGUAGE FUNCTION ---
function changeLanguage(lang) {
    const data = translations[lang];
    if (!data) return;

    // This looks for elements with data-translate attributes in your HTML
    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (data[key]) {
            // Check if it's an input/search box
            if (el.tagName === 'INPUT' && el.placeholder) {
                el.placeholder = data[key];
            } else {
                el.innerText = data[key];
            }
        }
    });

    localStorage.setItem('nexusLang', lang);
}

// --- YOUR ORIGINAL FUNCTIONS (UNTOUCHED) ---

function openProfileModal() {
  const modal = document.getElementById('editProfileModal');
  if (modal) {
    modal.style.display = 'flex';
  } else {
    console.error("Modal element not found! Make sure your modal has id='editProfileModal'");
  }
}

function loadSettings() {
    const savedTheme = localStorage.getItem('nexusTheme') || 'light';
    document.body.classList.toggle('dark-mode', savedTheme === 'dark');
    if(document.getElementById('themeSelect')) document.getElementById('themeSelect').value = savedTheme;

    // Added: Load saved language
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
    document.getElementById(sectionId).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function changeTheme(theme) {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    localStorage.setItem('nexusTheme', theme);
}

function changeFontSize(size) {
    document.documentElement.style.fontSize = size + 'px';
    document.getElementById('fontSizeValue').innerText = size + 'px';
}

function logout() {
    localStorage.removeItem('nexusUser');
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', loadSettings);

function handlePasswordChange() {
    const current = document.getElementById('currentPassInput').value;
    const newPass = document.getElementById('newPassInput').value;
    const confirm = document.getElementById('confirmPassInput').value;

    // Fetch the password the user used to LOGIN
    let savedPassword = localStorage.getItem('userPassword');

    // Safety check: if no password found (user skipped login), default to a placeholder or force login
    if (!savedPassword) {
        triggerErrorModal("Session Error", "No active session found. Please log in again.");
        return;
    }

    // 1. Match against the Login Password
    if (current !== savedPassword) {
        triggerErrorModal("Incorrect Password", "The current password does not match the one used at login.");
        return;
    }

    // 2. Validation
    if (newPass === "" || newPass !== confirm) {
        triggerErrorModal("Entry Error", "New passwords must match and cannot be empty.");
        return;
    }

    // 3. SUCCESS Logic
    // Update the 'database' so the NEXT time they change it, they use the new one
    localStorage.setItem('userPassword', newPass);
    
    // Custom Success Alert (Matching your theme)
    alert("Password successfully updated!");
    
    // Clean up
    document.getElementById('currentPassInput').value = "";
    document.getElementById('newPassInput').value = "";
    document.getElementById('confirmPassInput').value = "";
    
    // Return to main settings
    showSection('mainSettingsView');
}

function triggerErrorModal(title, message) {
    document.getElementById('errorTitle').innerText = title;
    document.getElementById('errorText').innerText = message;
    
    if (typeof bootstrap !== 'undefined') {
        const modalEl = document.getElementById('passwordErrorModal');
        const myModal = new bootstrap.Modal(modalEl);
        myModal.show();
    } else {
        alert(title + ": " + message);
    }
}


    // 1. Create a variable to store the modal instance
    let myEditModal;

    // 2. Initialize the modal when the page loads
    document.addEventListener('DOMContentLoaded', function() {
        const modalElement = document.getElementById('editProfileModal');
        myEditModal = new bootstrap.Modal(modalElement);
    });

    // 3. This is the function your "Settings Card" is looking for
    function openProfileModal() {
        if (myEditModal) {
            myEditModal.show();
        } else {
            // Fallback in case it wasn't initialized yet
            const modalElement = document.getElementById('editProfileModal');
            myEditModal = new bootstrap.Modal(modalElement);
            myEditModal.show();
        }
    }

    // Optional: Add logic for the "Other" role toggle you have in your HTML
    function toggleEditOther() {
        const select = document.getElementById('editRoleSelect');
        const otherInput = document.getElementById('editRoleOther');
        otherInput.style.display = (select.value === 'Other') ? 'block' : 'none';
    }
    // Toggle the 'Other' input field
function toggleEditOther() {
    const select = document.getElementById('editRoleSelect');
    const otherInput = document.getElementById('editRoleOther');
    otherInput.style.display = (select.value === 'Other') ? 'block' : 'none';
}

// Show the selected image immediately
function previewEditImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('editAvatarPreview');
            const icon = document.getElementById('editAvatarIcon');
            
            preview.src = e.target.result;
            preview.style.display = 'block';
            icon.style.display = 'none';
        }
        reader.readAsDataURL(input.files[0]);
    }
}
// Initialize Modal safely
let profileModal;
document.addEventListener('DOMContentLoaded', function() {
    const modalElem = document.getElementById('editProfileModal');
    if (modalElem) {
        profileModal = new bootstrap.Modal(modalElem);
    }
});

function openProfileModal() {
    if (profileModal) {
        profileModal.show();
    } else {
        // Fallback if not initialized
        profileModal = new bootstrap.Modal(document.getElementById('editProfileModal'));
        profileModal.show();
    }
}

function saveProfile() {
    // 1. Get values
    const name = document.getElementById('editName').value;
    const bio = document.getElementById('editBio').value;
    const role = document.getElementById('editRoleSelect').value;
    const avatar = document.getElementById('editAvatarPreview').src;

    // 2. Update Display
    document.getElementById('displayProfileName').innerText = name;
    document.getElementById('displayProfileBio').innerText = bio;
    document.getElementById('displayProfileRole').innerText = role;
    
    if (avatar && avatar !== "#" && !avatar.includes(window.location.host)) {
        document.getElementById('mainProfileAvatar').src = avatar;
    }

    // 3. Show the display card (if it was hidden)
    document.getElementById('mainProfileDisplay').style.display = 'block';

    // 4. Close Modal
    profileModal.hide();
}
function saveProfile() {
    console.log("Save button detected!");

    // 1. Get values from MODAL IDs
    const modalName = document.getElementById('editName')?.value;
    const modalBio = document.getElementById('editBio')?.value;
    const modalRoleSelect = document.getElementById('editRoleSelect')?.value;
    const modalRoleOther = document.getElementById('editRoleOther')?.value;
    const modalAvatarSrc = document.getElementById('editAvatarPreview')?.src;

    // Determine role logic
    const finalRole = (modalRoleSelect === 'Other') ? modalRoleOther : modalRoleSelect;

    // 2. Target the DISPLAY IDs
    const targetName = document.getElementById('displayProfileName');
    const targetBio = document.getElementById('displayProfileBio');
    const targetRole = document.getElementById('displayProfileRole');
    const targetAvatar = document.getElementById('displayProfileAvatar');

    // 3. Update only if the elements exist
    if (targetName && modalName) {
        targetName.innerText = modalName;
        console.log("Updated Name to:", modalName);
    }
    
    if (targetBio && modalBio) {
        targetBio.innerText = modalBio;
    }
    
    if (targetRole && finalRole) {
        targetRole.innerText = finalRole;
    }

    // 4. Update Avatar only if a real photo was picked
    if (targetAvatar && modalAvatarSrc && modalAvatarSrc.includes('data:image')) {
        targetAvatar.src = modalAvatarSrc;
        console.log("Updated Avatar successfully.");
    }

    // 5. Force Modal to Close
    const modalElement = document.getElementById('editProfileModal');
    if (modalElement) {
        const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modalInstance.hide();
    }
}
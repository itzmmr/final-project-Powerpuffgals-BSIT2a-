// SIGNUP PAGE SCRIPT
let base64Image = "";

function previewImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('avatarPreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
            document.getElementById('avatarIcon').style.display = 'none';
            base64Image = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function toggleOther(selectId, otherId) {
    const val = document.getElementById(selectId).value;
    document.getElementById(otherId).style.display = (val === 'Other') ? 'block' : 'none';
}

function showNexusModal(message) {
    const modalMsgElement = document.getElementById('modalAlertMessage');
    const modalElement = document.getElementById('nexusAlertModal');
    
    if (modalMsgElement && modalElement) {
        modalMsgElement.innerText = message;
        const nexusModal = new bootstrap.Modal(modalElement);
        nexusModal.show();
    } else {
        alert(message);
    }
}

function goToPage(page) {
    if (page === 2) {
        const fields = ['regName', 'regEmail', 'regDob', 'regGender', 'regPassword'];
        const allFilled = fields.every(id => document.getElementById(id).value.trim());
        const pass = document.getElementById('regPassword').value;
        const confirm = document.getElementById('regConfirmPassword').value;

        if (!allFilled) {
            showNexusModal("Please fill in all identity fields."); 
            return;
        }

        const dobValue = document.getElementById('regDob').value;
        const birthDate = new Date(dobValue);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        if (age < 18) {
            showNexusModal("Sorry! You must be at least 18 years old to join NEXUSWrites.");
            return; 
        }

        if (pass !== confirm) { 
            showNexusModal("Passwords do not match."); 
            return; 
        }
    }
    
    document.getElementById('page1').style.display = (page === 1) ? 'block' : 'none';
    document.getElementById('page2').style.display = (page === 2) ? 'block' : 'none';
}

document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.getElementById('signupBtn');
    const btnText = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.spinner-border');

    btn.disabled = true;
    btnText.classList.add('d-none');
    spinner.classList.remove('d-none');

    // Handle open Role
    let finalRole = document.getElementById('regWorkSelect').value;
    if (finalRole === "Other") {
        finalRole = document.getElementById('workOther').value.trim();
    }
    
    // Handle open Interests (Checkboxes + Custom Text)
    let interests = Array.from(document.querySelectorAll('input[name="interest"]:checked'))
        .map(i => i.value);
    
    const customInterest = document.getElementById('interestOther').value.trim();
    if (customInterest) {
        interests.push(customInterest);
    }

    const signupData = {
        name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        dob: document.getElementById('regDob').value,
        gender: document.getElementById('regGender').value.toLowerCase(), 
        bio: document.getElementById('regBio').value || "Technical Contributor",
        role: finalRole || "IT Student",
        githubUsername: document.getElementById('regGithub').value.trim(),
        interests: interests,
        avatar: base64Image
    };

    try {
        const response = await fetch('http://localhost:5000/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(signupData)
        });

        const data = await response.json();
        if (response.ok) {
            window.location.href = 'login.html'; 
        } else {
            showNexusModal(data.error || data.message || "Registration failed.");
            resetBtn();
        }
    } catch (error) {
        showNexusModal("Cannot connect to server. Check if backend is running.");
        resetBtn();
    }

    function resetBtn() {
        btn.disabled = false;
        btnText.classList.remove('d-none');
        spinner.classList.add('d-none');
    }
});
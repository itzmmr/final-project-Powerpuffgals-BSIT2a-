document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // 1. Get Values & UI Elements
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = document.getElementById('submitBtn');
    const loginText = submitBtn.querySelector('.login-text');
    const loginSpinner = submitBtn.querySelector('.login-spinner');
    
    // Modal Elements
    const errorModalEl = document.getElementById('errorModal');
    const errorModal = new bootstrap.Modal(errorModalEl);
    const errorMessage = document.getElementById('modalErrorMessage');

    // 2. Show Loading State
    loginText.classList.add('d-none');
    loginSpinner.classList.remove('d-none');
    submitBtn.disabled = true;

    try {
        // 3. HIT THE REAL BACKEND
        const response = await fetch('https://final-project-powerpuffgals-bsit2a.onrender.com/api/users/login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // SUCCESS Logic
            localStorage.setItem('token', data.token);
            localStorage.setItem('userPassword', password);

            const userToStore = {
                ...(data.user || data), 
                token: data.token, 
                _id: data.user?._id || data._id || data.id,
                loggedIn: true 
            };

            if (data.name && !userToStore.name) userToStore.name = data.name;
            if (data.username && !userToStore.username) userToStore.username = data.username;

            localStorage.setItem('nexusUser', JSON.stringify(userToStore));
            
            window.location.href = 'dashboard.html';
        } else {
            // Error from Backend: Show Modal
            showError(data.message || "Invalid email or password");
        }
    } catch (error) {
        console.error("Connection Error:", error);
        showError("Connection refused. Is your backend running?");
    }

    // Helper function to show modal and reset button
    function showError(msg) {
        errorMessage.textContent = msg;
        errorModal.show();
        resetButton();
    }

    function resetButton() {
        loginText.classList.remove('d-none');
        loginSpinner.classList.add('d-none');
        submitBtn.disabled = false;
    }
});
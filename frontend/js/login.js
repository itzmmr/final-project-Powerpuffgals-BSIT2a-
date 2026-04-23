
   document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // 1. Get Values & UI Elements
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = document.getElementById('submitBtn');
    const loginText = submitBtn.querySelector('.login-text');
    const loginSpinner = submitBtn.querySelector('.login-spinner');

    // 2. Show Loading State
    loginText.classList.add('d-none');
    loginSpinner.classList.remove('d-none');
    submitBtn.disabled = true;

    try {
        // 3. HIT THE REAL BACKEND
        const response = await fetch('http://localhost:5000/api/users/login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // SUCCESS: Explicitly map the token and IDs to ensure they aren't undefined
            const userToStore = {
                ...data,
                token: data.token, // Explicitly capture token
                _id: data._id || data.id,
                id: data.id || data._id,
                loggedIn: true 
            };

            localStorage.setItem('nexusUser', JSON.stringify(userToStore));
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            // SERVER ERROR (Invalid credentials, etc.)
            alert(data.message || "Login failed. Please check your credentials.");
            resetButton();
        }
    } catch (error) {
        // NETWORK ERROR (Server is down)
        console.error("Connection Error:", error);
        alert("Connection refused. Is your backend running on port 5000?");
        resetButton();
    }

    function resetButton() {
        loginText.classList.remove('d-none');
        loginSpinner.classList.add('d-none');
        submitBtn.disabled = false;
    }
});
    
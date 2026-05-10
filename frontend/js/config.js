const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://final-project-backend.onrender.com/api';  // ← your real backend URL

export default API_BASE_URL;
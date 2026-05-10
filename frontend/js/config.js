const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://final-project-powerpuffgals-bsit2a.onrender.com';  // ← your real backend URL

export default API_BASE_URL;
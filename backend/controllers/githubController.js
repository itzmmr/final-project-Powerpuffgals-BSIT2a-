const axios = require('axios');

exports.getUserRepos = async (req, res) => {
    try {
        const { username } = req.params;
        
        // Fetches top 5 most recent public repos from GitHub
        // Added headers object to ensure GitHub API accepts the request
        const response = await axios.get(`https://api.github.com/users/${username}/repos?per_page=5&sort=created`, {
            headers: {
                'User-Agent': 'NEXUSWrites-App'
            }
        });
        
        const repos = response.data.map(repo => ({
            name: repo.name,
            url: repo.html_url,
            description: repo.description,
            language: repo.language,
            stars: repo.stargazers_count
        }));

        res.status(200).json(repos);
    } catch (err) {
        // Detailed error for debugging while keeping your original 404 response
        res.status(404).json({ message: "GitHub user not found" });
    }
};
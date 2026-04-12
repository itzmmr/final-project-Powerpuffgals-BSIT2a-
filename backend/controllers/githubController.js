const axios = require('axios');

exports.getUserRepos = async (req, res) => {
    try {
        const { username } = req.params;
        // Fetches top 5 most recent public repos from GitHub
        const response = await axios.get(`https://api.github.com/users/${username}/repos?per_page=5&sort=created`);
        
        const repos = response.data.map(repo => ({
            name: repo.name,
            url: repo.html_url,
            description: repo.description,
            language: repo.language,
            stars: repo.stargazers_count
        }));

        res.status(200).json(repos);
    } catch (err) {
        res.status(404).json({ message: "GitHub user not found" });
    }
};
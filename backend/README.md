Backend API Documentation
---
This is the server-side application for the platform, built with Node.js, Express, and MongoDB. It features secure JWT authentication, image processing via Cloudinary, and data relationships for social interactions.

Routes Implemented
---
The API is divided into modular segments. Routes marked with (Protected) require a valid JWT token in the Authorization header.

1. User and Authentication (/api/users)
---
    |  Method    | Endpoint     |            Description                        |   Auth            |
    |------------|--------------|-----------------------------------------------|-------------------|
    | POST       | /register    | Sign up with avatar upload support            |   Public          |
    |------------|--------------|-----------------------------------------------|-------------------|
    | POST       | /login       | Authenticate user and return JWT              |   Public          |
    |------------|--------------|-----------------------------------------------|-------------------|
    | GET        | /me          | Get current user profile                      |   Protected       |
    |------------|--------------|-----------------------------------------------|-------------------|
    | PUT        | /update      | Update profile (bio, avatar, etc.)            |   Protected       |
    |------------|--------------|-----------------------------------------------|-------------------|
    | PUT        | /follow/:id  | Toggle follow/unfollow for a user             |   Protected       |
    |------------|--------------|-----------------------------------------------|-------------------|
    | GET        | /profile/:id | Fetch public profile of a user                |   Public          |
    |------------|--------------|-----------------------------------------------|-------------------|
    | GET        | /search      | Search for users by name/username             |   Public          |
    |------------|--------------|-----------------------------------------------|-------------------|
    | GET        | /stats       | Retrieve user-specific statistics             |   Public          |
    |------------|--------------|-----------------------------------------------|-------------------|

2. Posts (/api/posts)
---
    |  Method    | Endpoint        |            Description                        |   Auth            |
    |------------|-----------------|-----------------------------------------------|-------------------|
    | POST       | /               | Create a post with image upload               |   Protected       |
    |------------|-----------------|-----------------------------------------------|-------------------|
    | GET        | /               | Fetch all posts                               |   Public          |
    |------------|-----------------|-----------------------------------------------|-------------------|
    | GET        | /following-feed | Get current user profile                      |   Protected       |
    |------------|-----------------|-----------------------------------------------|-------------------|
    | PUT        | /like/:id       | Like/Unlike a specific post                   |   Protected       |
    |------------|-----------------|-----------------------------------------------|-------------------|
    | PUT        | /:id            | Update post (Ownership Protected)             |   Protected       |
    |------------|-----------------|-----------------------------------------------|-------------------|
    | DELETE     | /:id            | Delete post (Ownership Protected)             |   Protected       |
    |------------|-----------------|-----------------------------------------------|-------------------|
    
3. Social and Utilities
---
    Comments (/api/comments)
---
    |  Method    | Endpoint        |            Description                        |   Auth            |
    |------------|-----------------|-----------------------------------------------|-------------------|
    | POST       | /               | Add a new comment or reply                    |   Protected       |
    |------------|-----------------|-----------------------------------------------|-------------------|
    | GET        | /:postId        | Get all comments for a specific post          |   Public          |
    |------------|-----------------|-----------------------------------------------|-------------------|
---
    Notifications (/api/notifications)
---
    |  Method    | Endpoint        |            Description                        |   Auth            |
    |------------|-----------------|-----------------------------------------------|-------------------|
    | GET        | /               | Fetch user alerts                             |   Protected       |
    |------------|-----------------|-----------------------------------------------|-------------------|
    | PUT        | /read           | Mark notifications as read                    |   Protected       |
    |------------|-----------------|-----------------------------------------------|-------------------|
---
    GitHub Integration (/api/github)
---
    |  Method    | Endpoint        |            Description                        |   Auth            |
    |------------|-----------------|-----------------------------------------------|-------------------|
    | GET        | /:username      | Fetch public repositories for a user          |   Public          |
    |------------|-----------------|-----------------------------------------------|-------------------|
---

Current Models
---
User (User.js)
---
Security: Uses bcryptjs for password hashing via a pre-save hook and includes a custom matchPassword method.

Settings: A nested object for UI preferences including theme (light/dark), fontSize (small/medium/large), and language (english, tagalog, bicolano, spanish).

Interests: Enum-validated array (e.g., web development, cybersecurity, data science).

Social: Tracks followers and following arrays using User ObjectIds.

Post (Post.js)
---
Fields: title, content, image (URL), and category.

Engagement: Stores a likes array of User ObjectIds.

Association: Linked to an author (User model).

Comment (Comment.js)
---
Threading: Supports nested replies via parentCommentId and a recursive replies array.

Meta: Tracks author name and authorId for easy UI rendering.

Notification (Notification.js)
Types: Enum values for like, follow, and comment.

State: Tracks isRead status for real-time alerts.

Connection Setup
---

Database and Data Storage
---
The application uses MongoDB as the primary database, managed through the Mongoose ODM. The connection logic is centralized in the main entry file using the mongoose.connect() method powered by the MONGO_URI environment variable. It is important to note that actual image files are not stored directly within the database instead, MongoDB only stores the secure URL string that points to the image's location on Cloudinary. This keeps the database lightweight and ensures that data retrieval remains fast and efficient.

File Storage and Image Processing
---
For professional media management, the backend is integrated with Cloudinary. When a user sends a request containing an image via multipart/form-data, a specialized upload middleware intercepts the file before it reaches the controller. This file is sent to Cloudinary, where the physical image is stored securely. Cloudinary then provides a secure HTTPS URL back to the controller, which is the link eventually saved in the MongoDB document for that user or post.

Authentication
---
The server implements JSON Web Tokens (JWT) for session management and security. A protect middleware function validates the token provided in the request header. Once the token is verified, the middleware extracts the user's information and attaches it to the req.user object, allowing the server to identify which authenticated user is performing the action.

How to Run the Server Locally
---
1. Prerequisites
---
The system requires Node.js (v16.x or higher). For data persistence, a MongoDB Atlas cluster is required. Additionally, a Cloudinary account must be configured to handle physical media storage, as the architecture is designed to store only secure image URLs within the database documents.


2. Installation
---
To prepare the environment, navigate to the backend directory and install the required dependencies:

Bash
cd backend
npm install


3. Environment Configuration
---
 A .env file must be created in the root of the /backend folder. This file manages the sensitive credentials required for the server to function. The following variables must be defined:

PORT: The port number for the local server.

MONGO_URI: The connection string provided by the MongoDB Atlas dashboard.

JWT_SECRET: The key used for signing JSON Web Tokens.

CLOUDINARY_API_KEYS: Credentials for the Cloudinary media service.


4. Server Execution and Verification
---
The server's integrity and connection to the Atlas cluster can be verified by executing the entry file:

Bash
node server.js

Successful execution confirms that the connection logic is correctly pulling the environment variables and that the database is reachable. For active development, the following script provides automatic restarts upon file modifications:

Bash
npm run dev

Notes
---
This project is developed as part of the Final Laboratory Requirement to highlight the shift from generic blogging platforms to NexusWrites—a full-stack, API-driven hub for structured technical documentation, professional networking, and credible knowledge exchange.
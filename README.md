#                                    TEAM POWERPUFFGALS - NEXUSWrites

---

## Project Description

NEXUSWrites is a full-stack web application developed for students, developers, and technology enthusiasts to publish technical content, showcase projects, and engage in collaborative discussions within a secure and structured digital environment. The platform integrates technical blogging, portfolio presentation, and social interaction features into a centralized system tailored specifically for the IT community.

Designed as more than a traditional blogging platform, NEXUSWrites emphasizes professional knowledge sharing through categorized technical posts, threaded discussions, GitHub portfolio integration, cloud-based media management, and personalized user interaction. The system provides an accessible and responsive experience across desktop and mobile devices while promoting collaborative learning and technical growth.

This project was developed as the Final Laboratory Requirement for IT 112: Web Systems and Technologies at Bicol University Polangui Campus during the Academic Year 2025–2026 by Group Powerpuffgals.

---

## Live Demo

[NEXUSWrites Live Deployment](https://final-project-powerpuffgals-bsit2a.onrender.com?utm_source=chatgpt.com)

---

## Core Features

### Secure Authentication & User Management

* JWT-based authentication and authorization
* Two-step user registration process
* Server-side age validation (18+ requirement)
* Secure password hashing using Bcrypt.js
* Protected routes and session management

### Technical Content Management System

* Create, edit, and delete technical tutorials and posts
* Categorized content organization
* Tag-based filtering and discovery
* Rich technical discussion environment
* Responsive dashboard interface

### Cloud-Based Media Integration

* Image uploads powered by Cloudinary
* Optimized cloud media storage
* Efficient file handling using Multer middleware

### Nested Discussion System

* Hierarchical threaded comments and replies
* Structured technical discussions
* Interactive user engagement system
* Notification support for replies and interactions

### GitHub Portfolio Integration

* GitHub username synchronization
* Live repository fetching through GitHub REST API
* Public technical portfolio display
* Repository details including language, stars, and descriptions

### Personalized Social Features

* Follow and unfollow functionality
* Personalized content feed
* Real-time notification system
* User profile customization

### Search & Categorization

* Dynamic search functionality
* Technical category filtering
* Real-time search suggestions
* Organized content navigation

### Progressive Web Application (PWA)

* Installable web application support
* Offline asset caching using service workers
* Responsive and mobile-friendly interface

---

## Technologies Used

### Frontend Technologies

* HTML5
* CSS3
* JavaScript
* Bootstrap 5.3
* Font Awesome
* Google Fonts

### Backend Technologies

* Node.js
* Express.js

### Database Technologies

* MongoDB
* Mongoose ODM

### Authentication & Security

* JSON Web Token (JWT)
* Bcrypt.js

### Cloud & Media Services

* Cloudinary
* Multer
* multer-storage-cloudinary

### Development & Deployment Tools

* Git & GitHub
* Visual Studio Code
* npm
* Render.com

---

## Installation Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/nexuswrites.git
```

### 2. Navigate to the Backend Directory

```bash
cd backend
```

### 3. Install Required Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file inside the backend directory and add the following configuration:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secret_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 5. Start the Development Server

```bash
npm start
```

### 6. Access the Application

Open the application in your browser:

```bash
http://localhost:5000
```

---

## Contributors

### Group Powerpuffgals

* **Ivy Angel R. Hidalgo** — Backend Developer & Project Manager
* **Kris Ann B. Apoon** — Frontend Developer
* **April Grace R. Dacanay** — Documentation & Testing
* **Princes Mateo** — Database Manager
* **Milan A. Rellora** — GitHub Manager

---

## Screenshots (Bonus)

### Homepage

```md
/screenshots/homepage.png
```

### User Dashboard

```md
/screenshots/dashboard.png
```

### Nested Discussion System

```md
/screenshots/discussions.png
```

### GitHub Portfolio Integration

```md
/screenshots/github-portfolio.png
```

# Powerpuffgals – FullStack Web Application

---
Project Description
---
NEXUSWrites is a full-stack web application developed for students, developers, and technology enthusiasts to publish technical content, showcase projects, and engage in collaborative discussions within a secure and structured digital environment. The platform integrates technical blogging, portfolio presentation, and social interaction features into a centralized system tailored specifically for the IT community.

Designed as more than a traditional blogging platform, NEXUSWrites emphasizes professional knowledge sharing through categorized technical posts, threaded discussions, GitHub portfolio integration, cloud-based media management, and personalized user interaction. The system provides an accessible and responsive experience across desktop and mobile devices while promoting collaborative learning and technical growth.

This project was developed as the Final Laboratory Requirement for IT 112: Web Systems and Technologies at Bicol University Polangui Campus during the Academic Year 2025–2026 by Group Powerpuffgals.

Live Demo Link
---
        https://final-project-powerpuffgals-bsit2a.onrender.com/


# Key Features

Secure Authentication & User Management 
---
● JWT-based authentication and authorization

● Two-step user registration process

● Server-side age validation (18+ requirement)

● Secure password hashing using Bcrypt.js

● Protected routes and session management

Technical Content Management System
---

● Create, edit, and delete technical tutorials and posts

● Categorized content organization

● Tag-based filtering and discovery

● Rich technical discussion environment

● Responsive dashboard interface

Cloud-Based Media Integration
---

● Image uploads powered by Cloudinary

● Optimized cloud media storage

● Efficient file handling using Multer middleware

Nested Discussion System
---

● Hierarchical threaded comments and replies

● Structured technical discussions

● Interactive user engagement system

● Notification support for replies and interactions

GitHub Portfolio Integration
---

● GitHub username synchronization

● Live repository fetching through GitHub REST API

● Public technical portfolio display

● Repository details including language, stars, and descriptions

Personalized Social Features
---

● Follow and unfollow functionality

● Personalized content feed

● Real-time notification system

● User profile customization

Search & Categorization
---

● Dynamic search functionality

● Technical category filtering

● Real-time search suggestions

● Organized content navigation

Progressive Web Application (PWA)
---

● Installable web application support

● Offline asset caching using service workers

● Responsive and mobile-friendly interface

# Technologies Used

Frontend Technologies
---

● HTML

● CSS3

● JavaScript

● Bootstrap 5.3

Backend Technologies
---

● Node.js

● Express.js

Database Technologies
---

● MongoDB

● Mongoose 

Authentication & Security
--- 

● JSON Web Token (JWT)

● Bcrypt.js

Cloud & Media Services
---

● Cloudinary

● Multer

● multer-storage-cloudinary

Development & Deployment Tools
---

● Git & GitHub

● Visual Studio Code

● npm

● Render.com


# Installation Instructions

1. Clone the Repository
---

        git clone https://github.com/itzmmr/final-project-Powerpuffgals-BSIT2a-.git

2. Navigate to the Backend Directory
---
        cd backend

3. Install Required Dependencies
---
        npm install

4. Configure Environment Variables
---
        cd backend
        cp .env.example .env
        # Edit .env with own configuration

5. Start the Development Server
---
        cd backend
        node server.js


# Contributors

Group Powerpuffgals
---

Ivy Angel R. Hidalgo — Backend Developer & Project Manager

Kris Ann B. Apoon — Frontend Developer

April Grace R. Dacanay — Documentation & Testing

Princes Mateo — Database Manager

Milan A. Rellora — GitHub Manager


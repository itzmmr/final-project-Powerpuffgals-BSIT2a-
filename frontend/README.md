NEXUSWrites 
---
Phase 3 – Frontend Documentation

Project Overview
---
NEXUSWrites is a web-based platform for sharing social and technical content, built for developers, students, and technology enthusiasts. It allows users to create, publish, and engage with technical posts while establishing their professional identity through personalized profiles and GitHub integration. The system aims to solve the issue of scattered learning materials and the absence of a centralized collaboration space by providing a single platform for content creation, discovery, and user interaction.

The project is developed following a structured system architecture based on the Use Case Diagram, Entity Relationship Diagram (ERD), and Data Flow Diagram (DFD). This ensures that all frontend features are directly aligned with defined user actions and system processes.

This phase focuses on the development of the frontend layer, which serves as the primary user interface of the system and lays the foundation for future backend integration.

What Was Implemented 
---
This week focused on building and refining the frontend layer of NEXUSWrites, turning the system from static pages into a dynamic, interactive user interface.

•	Built login and registration pages with form validation and session handling (localStorage) 

•	Developed dashboard UI with dynamic navigation and user state display 

•	Created profile page frontend with editable fields (bio, role, GitHub username, interests) 

•	Implemented post creation interface with category selection (AI, Web Dev, Mobile Apps, etc.) 

•	Added likes and comments interface (including nested comment layout) 

•	Built Help Center frontend section with FAQ-style layout 

•	Integrated GitHub profile UI section for linking developer accounts 

•	Improved overall layout consistency, spacing, and responsiveness acro
ss all pages 

•	Refactored and organized frontend files for better structure and maintainability


How it Aligns with the Use Case/ERD
---
Use Case Diagram
---

•	Create Post - Implemented through the post creation interface with category selection and content input 

•	Manage Profile & Settings - Supported by profile management and settings modules (edit bio, role, preferences, and security options) 

•	Social Interaction - Enabled through the Following system, likes, comments, and personalized feed rendering 

•	Search & Content Discovery - Implemented through category-based filtering and tab navigation system 

Entity Relationship Diagram (ERD)
---
•	User → Post (1-to-many relationship) - Implemented through user-generated posts displayed in dashboard and profile pages 

•	Post → Categories - Implemented via category assignment using category_id and filtering system 

•	User → User (Follow System) - Implemented through following/unfollowing feature for personalized content feeds 

•	Post → Comments - Implemented through nested comment system under each post 

•   Comments → Reply - Comments can have multiple replies for support and threaded discussions

•	Post → Likes - Implemented through user interaction buttons and engagement tracking 


Detailed Folder Structure
---
    frontend/
    ├── img/
    │   └── NEXUSWritesLogo.png
    ├── js/
    │   └── script.js
    ├── styles/
    │   └── styles.css
    ├── dashboard.html
    ├── features.html
    ├── following.html
    ├── github.html
    ├── homesearch.html
    ├── index.html
    ├── login.html
    ├── notification.html
    ├── overview.html
    ├── profile.html
    ├── settings.html
    ├── signup.html
    └── README.md



Notes
---
This project is developed as part of the Final Laboratory Requirement to highlight the shift from generic blogging platforms to NexusWrites—a full-stack, API-driven hub for structured technical documentation, professional networking, and credible knowledge exchange.


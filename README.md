
# CodeQuest

CodeQuest is a gamified learning platform designed to make
programming education more engaging through structured lessons,
progress tracking, experience points, levels, and learning streaks.

## Technology Stack

- Frontend: React, Vite, React Router, Tailwind CSS
- Backend API: Node.js, Express.js
- Database: MongoDB with Mongoose
- Authentication: JWT and bcrypt
- Gamification Microservice: Go (Golang), HTTP REST
- Version Control: Git and GitHub

## Planned Architecture

```text
CodeQuest
├── frontend/       React web application
├── backend/        Express REST API
└── gamification/   Go gamification service
```

The Node.js API will manage authentication, the course catalog,
lessons, and user progress.

The Go service will calculate XP, levels, and learning streaks.
The backend will communicate with the Go service through HTTP REST.

MongoDB will store users, courses, lessons, and user progress.

## Development Status

- [x] Step 1: Monorepo and GitHub initialization
- [ ] Step 2: Database schemas
- [ ] Step 3: Express API and authentication
- [ ] Step 4: Go gamification service
- [ ] Step 5: React frontend and routing

## Getting Started

Application-specific installation and environment configuration
instructions will be added as each component is implemented.

## Security

Never commit real secrets, passwords, private keys, or production
environment files to version control.

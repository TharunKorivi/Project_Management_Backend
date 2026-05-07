# Project Management Backend

A scalable RESTful backend API for collaborative project management built using Node.js, Express.js, MongoDB, and Mongoose.

Project Management Backend enables teams to:

- Manage projects collaboratively
- Assign and track tasks
- Organize subtasks
- Maintain project notes
- Upload task attachments
- Enforce role-based permissions
- Authenticate securely using JWT

---

# Features

## Authentication & Authorization

- User Registration
- Secure Login & Logout
- JWT Authentication
- Refresh Token Mechanism
- Current User Retrieval
- Change Password
- Forgot Password
- Reset Password
- Email Verification
- Resend Verification Email
- Role-Based Access Control (RBAC)

---

## Project Management

- Create Projects
- Update Projects
- Delete Projects
- List User Projects
- Get Project Details

---

## Team Member Management

- Add Members via Email
- Remove Project Members
- Update Member Roles
- List All Project Members

---

## Task Management

- Create Tasks
- Assign Tasks to Team Members
- Update Task Status
- Delete Tasks
- View Task Details
- Multiple File Attachments
- Aggregation-Based Task Retrieval

---

## Subtask Management

- Create Subtasks
- Update Subtask Completion Status
- Delete Subtasks
- Member-Level Completion Updates

---

## Project Notes

- Create Notes
- Update Notes
- Delete Notes
- View Notes
- Project-Level Collaboration

---

## System Health Monitoring

- API Health Check Endpoint
- Database Connection Status
- Server Uptime Monitoring

---

# Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt
- Multer

---

# Architecture Highlights

- Middleware-Based Architecture
- Aggregation Pipelines
- Nested `$lookup`
- MongoDB Transactions
- Cascading Deletion Logic
- RBAC Authorization System
- Validation Layer
- Modular Route Structure

---

# User Roles

| Role            | Description                                    |
| --------------- | ---------------------------------------------- |
| `admin`         | Full project access and management             |
| `project_admin` | Manage tasks and subtasks                      |
| `member`        | View project content and update subtask status |

---

# Task Statuses

| Status        | Meaning                    |
| ------------- | -------------------------- |
| `todo`        | Task not started           |
| `in_progress` | Task currently in progress |
| `done`        | Task completed             |

---

# Permission Matrix

| Feature                    | Admin | Project Admin | Member |
| -------------------------- | ----- | ------------- | ------ |
| Create Project             | ✓     | ✗             | ✗      |
| Update/Delete Project      | ✓     | ✗             | ✗      |
| Manage Project Members     | ✓     | ✗             | ✗      |
| Create/Update/Delete Tasks | ✓     | ✓             | ✗      |
| View Tasks                 | ✓     | ✓             | ✓      |
| Update Subtask Status      | ✓     | ✓             | ✓      |
| Create/Delete Subtasks     | ✓     | ✓             | ✗      |
| Create/Update/Delete Notes | ✓     | ✗             | ✗      |
| View Notes                 | ✓     | ✓             | ✓      |

---

# Project Structure

```txt id="aqv4zr"
src/
├── controllers/
├── middlewares/
├── models/
├── routes/
├── validators/
├── utils/
├── db/
├── app.js
└── index.js
```

---

# API Endpoints

## Authentication Routes

```txt id="cy0xgn"
/api/v1/auth

POST   /register
POST   /login
POST   /logout
GET    /current-user
POST   /change-password
POST   /refresh-token
GET    /verify-email/:verificationToken
POST   /forgot-password
POST   /reset-password/:resetToken
POST   /resend-email-verification
```

---

## Project Routes

```txt id="rnyo4t"
/api/v1/projects

GET    /
POST   /

GET    /:projectId
PUT    /:projectId
DELETE /:projectId

GET    /:projectId/members
POST   /:projectId/members
PUT    /:projectId/members/:userId
DELETE /:projectId/members/:userId
```

---

## Task Routes

```txt id="qkn3zx"
/api/v1/tasks

GET    /:projectId
POST   /:projectId

GET    /:projectId/task/:taskId
PUT    /:projectId/task/:taskId
DELETE /:projectId/task/:taskId

POST   /:projectId/task/:taskId/subtasks

PUT    /:projectId/subtask/:subTaskId
DELETE /:projectId/subtask/:subTaskId
```

---

## Note Routes

```txt id="fb9r2x"
/api/v1/notes

GET    /:projectId
POST   /:projectId

GET    /:projectId/note/:noteId
PUT    /:projectId/note/:noteId
DELETE /:projectId/note/:noteId
```

---

## Health Check

```txt id="gjj0k5"
/api/v1/healthcheck
```

---

# Security Features

- JWT Authentication
- Refresh Token Rotation
- Password Hashing using bcrypt
- Role-Based Authorization
- Protected Routes Middleware
- Secure file upload handling using Multer middleware with attachment metadata support.
- CORS Configuration
- Secure Password Reset Flow

---

# File Upload System

Supports:

- Images
- PDFs
- CSV Files
- Documents

Uploaded files include:

- URL
- MIME Type
- File Size

Static file serving enabled using Express middleware.

Example:

```txt id="t7eqxg"
http://localhost:8000/images/sample.pdf
```

---

# Environment Variables

Create a `.env` file in the root directory.

```env id="kj7wme"
PORT=
CORS_ORIGIN=
MONGO_URI=
NODE_ENV=

ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=

REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRY=


MAIL_SMTP_HOST=
MAIL_SMTP_PORT=
MAIL_SMTP_USERNAME=
MAIL_SMTP_PASSWORD=
```

---

# Installation

## Clone Repository

```bash id="v7h1te"
git clone https://github.com/TharunKorivi/Project_Management_Backend.git
```

---

## Install Dependencies

```bash id="ebz9h4"
npm install
```

---

## Start Development Server

```bash id="mh0j9u"
npm run dev
```

---

# Seed Database

Populate database with sample:

- users
- projects
- tasks
- subtasks
- notes

```bash id="v2cf9d"
npm run seed
```

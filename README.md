# 🎓 College Learning Management System (LMS)

A modern, full-stack Learning Management System designed for college administration, teachers, and students. Featuring a responsive, futuristic dark glassmorphism user interface on the frontend and a production-ready Node.js/Express API backend with MongoDB database integration.

---

## 🌟 Portals & Key Features

### 🏛️ Admin Portal
- **Dashboard**: View high-level metrics (total students, teachers, courses, complaints).
- **User Management**: Add, update, and manage accounts for Students, Teachers, and Admin staff.
- **Section & Subject Management**: Assign courses, classes, and sections to teachers and students.

### 👩‍🏫 Teacher Portal
- **Dashboard**: View assigned classes, subjects, and student performance metrics.
- **Attendance Tracker**: Mark, update, and track attendance percentage for students in their assigned courses.
- **Grading & Marks**: Update marks obtained in assignments/tests.
- **Resource Center**: Upload learning materials and assignments for courses.

### 👨‍🎓 Student Portal
- **Dashboard**: Track overall attendance percentage, assignment grades, and course notifications.
- **Attendance**: View course-wise attendance records with warning indicators if attendance is below 75%.
- **Grades**: Access assignment grades and feedback.
- **Resource Center**: Download materials uploaded by teachers.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | HTML5 / CSS3 / Vanilla JavaScript | Core layout with custom dark glassmorphic styling, animations, and clean separation of concerns. |
| **Backend** | Node.js / Express.js | REST API server with routing, role-based authorization middleware, and global error handling. |
| **Database** | MongoDB / Mongoose | NoSQL database hosting schemas for Users, Students, Teachers, Courses, Assignments, Attendance, and Marks. |
| **Authentication** | JSON Web Tokens (JWT) / BcryptJS | Secure token-based session auth and encrypted password storage. |
| **File Storage** | Multer | Disk storage middleware handling file uploads for course resources. |

---

## 📁 Project Directory Structure

```text
lms/
├── backend/
│   ├── middleware/            # JWT authentication & Role-based access control
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   ├── models/                # Mongoose Schemas (User, Student, Teacher, Course, etc.)
│   ├── uploads/               # Target directory for uploaded resources (Git ignored)
│   ├── package.json           # Backend package configuration
│   ├── server.js              # Express API Server entry point
│   ├── seedAdmin.js           # Database seeder utility for the Super Admin
│   ├── seedStudents.js        # Database seeder utility for Student accounts
│   ├── seedTeacher.js         # Database seeder utility for Teacher accounts
│   ├── syncStudents.js        # Sync script for database normalization
│   └── updateSections.js      # Migration script to update sections
├── frontend/
│   ├── admin/                 # Admin portal pages and scripts
│   ├── student/               # Student portal pages and scripts
│   ├── teacher/               # Teacher portal pages and scripts
│   ├── index.html             # Main login landing page
│   ├── style.css              # Main glassmorphic theme stylesheet
│   ├── serve.js               # Simple HTTP server for local frontend testing
│   └── script.js              # Landing page interactive scripts
└── README.md                  # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas Connection String)

### 1. Backend Configuration
Navigate to the backend directory:
```bash
cd backend
```

Install the dependencies:
```bash
npm install
```

Create a `.env` file in the `backend/` directory:
```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

*(Optional)* Seed the database with default administrative credentials:
```bash
node seedAdmin.js
```
*Note: This creates an Admin account with email `admin@college.com` and password `123456`.*

Start the backend API server:
```bash
npm start
```
The server will boot up on `http://localhost:3000`.

### 2. Frontend Configuration
The frontend communicates directly with the backend API. 

Navigate to the frontend directory:
```bash
cd ../frontend
```

Run the local development server:
```bash
node serve.js
```
The frontend application will be served at `http://localhost:5500`. Open this URL in your web browser to access the LMS.

---

## 🔒 Security & CORS configuration

The backend uses a production-ready **dynamic CORS whitelisting** middleware. 

In development mode (`NODE_ENV=development`), it permits local requests from `http://localhost:5500` or `http://127.0.0.1:5500`.

When deployed to production (e.g. Render backend, Vercel frontend), you must configure your production URLs in the backend's environment variables:
```env
NODE_ENV=production
PRODUCTION_FRONTEND_URL=https://your-frontend-domain.vercel.app
BACKEND_URL=https://your-backend-domain.onrender.com
```
This whitelist keeps the application secure by rejecting unauthorized external cross-origin requests.

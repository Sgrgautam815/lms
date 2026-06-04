require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Models
const User = require("./models/User");
const Student = require("./models/Student");
const Course = require("./models/Course");
const Attendance = require("./models/Attendance");
const Assignment = require("./models/Assignment");
const File = require("./models/File");
const Mark = require("./models/Mark");
const Admin = require("./models/Admin");
const Complaint = require("./models/Complaint");
const Teacher = require("./models/Teacher");

// Middleware
const authMiddleware = require("./middleware/authMiddleware");
const authorize = require("./middleware/roleMiddleware");

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// ========================================
// ALLOWED ORIGINS CONFIGURATION
// ========================================
const getAllowedOrigins = () => {
    const allowedOrigins = [
        // PRODUCTION - Vercel Frontend (REQUIRED on Render)
        "https://lms-one-lyart.vercel.app",
        // ENV VAR OVERRIDE - for flexibility across environments
        process.env.PRODUCTION_FRONTEND_URL,
        // LOCAL DEVELOPMENT
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ];
    
    // Remove undefined/null entries and duplicates
    return [...new Set(allowedOrigins.filter(url => url))];
};

// ========================================
// CORS MIDDLEWARE - PRODUCTION READY
// ========================================
const corsOptions = {
    // Dynamic origin verification
    origin: function (origin, callback) {
        const allowedOrigins = getAllowedOrigins();
        
        // IMPORTANT: Allow requests with no origin
        // (mobile apps, curl requests, Postman, server-to-server)
        if (!origin) {
            console.log("✅ [CORS] Request with no origin (allowed)");
            return callback(null, true);
        }
        
        // Check if origin is in whitelist
        if (allowedOrigins.includes(origin)) {
            console.log(`✅ [CORS] Allowed: ${origin}`);
            return callback(null, true);
        } else {
            // REJECT unknown origins
            console.error(`❌ [CORS] BLOCKED: ${origin} not in whitelist`);
            console.error(`📝 Allowed origins: ${allowedOrigins.join(", ")}`);
            return callback(new Error("CORS policy violation: Origin not allowed"));
        }
    },
    
    // Allow all methods required by frontend
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    
    // Allow necessary headers (especially Authorization for JWT)
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Accept-Language",
        "X-CSRF-Token",
        "X-API-Key"
    ],
    
    // CRITICAL: Enable credentials for cookies/auth
    credentials: true,
    
    // Cache preflight requests for 24 hours to reduce overhead
    maxAge: 86400,
    
    // Don't pass to next middleware automatically
    preflightContinue: false
};

// ========================================
// APPLY CORS MIDDLEWARE - FIRST MIDDLEWARE
// ========================================
app.use(cors(corsOptions));

// ========================================
// PREFLIGHT OPTIONS HANDLER (Explicit catch-all)
// ========================================
app.options(/.*/, cors(corsOptions));

// ========================================
// BODY PARSER MIDDLEWARE (after CORS)
// ========================================
// Parse JSON bodies with 50MB limit (for file uploads)
app.use(express.json({ 
    limit: "50mb",
    strict: true  // Only parse objects and arrays
}));

// Parse URL-encoded bodies
app.use(express.urlencoded({ 
    limit: "50mb", 
    extended: true,
    parameterLimit: 1000  // Prevent too many parameters
}));

// ========================================
// STATIC FILES & UPLOADS
// ========================================
// Serve uploaded files
app.use("/uploads", express.static("uploads"));

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads", { recursive: true });
    console.log("📁 Created uploads directory");
}

// ========================================
// REQUEST LOGGING MIDDLEWARE (Debug Helper)
// ========================================
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const origin = req.get("origin") || "No Origin";
    const userAgent = req.get("user-agent") || "Unknown";
    
    // Log incoming request with CORS debugging info
    console.log(
        `\n📨 [${timestamp}] ${req.method.toUpperCase()} ${req.path}\n` +
        `   Origin: ${origin}\n` +
        `   IP: ${req.ip}\n` +
        `   Content-Type: ${req.get("content-type") || "N/A"}\n` +
        `   Auth Header: ${req.get("authorization") ? "✅ Present" : "❌ Missing"}`
    );
    
    // Log response status when response is sent
    res.on("finish", () => {
        const duration = Date.now() - req._startTime;
        const status = res.statusCode;
        const statusEmoji = status < 300 ? "✅" : status < 400 ? "ℹ️" : status < 500 ? "⚠️" : "❌";
        
        console.log(
            `${statusEmoji} [Response] ${status} ${req.method.toUpperCase()} ${req.path} (${duration}ms)\n`
        );
    });
    
    // Track request start time for duration calculation
    req._startTime = Date.now();
    next();
});

// ========================================
// PREFLIGHT OPTIONS HANDLER (Explicit)
// ========================================
app.options(/.*/, cors(corsOptions));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Routes
app.get("/", (req, res) => {
    res.json({ status: "ok", message: "College LMS Backend Running ✅", timestamp: new Date().toISOString() });
});

app.get("/test", (req, res) => {
    res.json({ message: "Test route is working perfectly!", db: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected" });
});

// Registration with Enhanced Validation
app.post("/register", async (req, res) => {
    try {
        const { name, course, email, password, phone, address, role, section, subjects } = req.body;

        // 1. Basic Presence Check
        if (!name || !course || !email || !password || !phone) {
            return res.status(400).json({ message: "All required fields must be filled" });
        }

        // 2. Email Validation (Regex)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Please enter a valid email address" });
        }

        // Optional: Gmail Only Restriction (Toggle as needed)
        // if (!email.endsWith("@gmail.com")) {
        //     return res.status(400).json({ message: "Only @gmail.com addresses are accepted" });
        // }

        // 3. Password Strength (Min 6, Upper, Lower, Number)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ 
                message: "Password must be at least 6 characters and include uppercase, lowercase, and a number" 
            });
        }

        // 4. Phone Number Validation (10 digits)
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
        }

        // 5. Duplicate Checks
        const existingEmail = await User.findOne({ email });
        if (existingEmail) return res.status(400).json({ message: "Email already registered" });

        const existingPhone = await User.findOne({ phone });
        if (existingPhone) return res.status(400).json({ message: "Phone number already exists" });

        // --- AUTO GENERATE COLLEGE ID ---
        const currentYear = new Date().getFullYear().toString().slice(-2);
        const courseCodeMap = {
            "BTECH CSE": "CSE", "BTECH ME": "ME", "BTECH ECE": "ECE",
            "BCA": "BCA", "MCA": "MCA", "MBA": "MBA"
        };
        const courseCode = courseCodeMap[course] || "GEN";
        const count = await User.countDocuments({ collegeId: { $regex: new RegExp(`^${currentYear}S${courseCode}`) } });
        const generatedCollegeId = `${currentYear}S${courseCode}${101 + count}`;

        const hashedPassword = await bcrypt.hash(password, 10);

        const subjectMap = {
            "BTECH CSE": ["Mathematics", "Physics", "DBMS", "Operating System", "Computer Networks"],
            "BTECH ME": ["Thermodynamics", "Machine Design", "Mathematics", "Physics"],
            "BTECH ECE": ["Digital Electronics", "Microprocessors", "Mathematics", "Physics"],
            "BCA": ["C Programming", "Data Structures", "Mathematics", "Accounting"],
            "MCA": ["Advanced Algorithms", "Machine Learning", "Mathematics", "Cloud Computing"],
            "MBA": ["Economics", "Marketing", "HR Management", "Accounting"]
        };

        const assignedSubjects = subjects && subjects.length > 0 ? subjects : (subjectMap[course] || []);

        const newUser = new User({
            name,
            collegeId: generatedCollegeId,
            course,
            email,
            password: hashedPassword,
            phone,
            address,
            role: role || "student",
            section: section || "A",
            subjects: assignedSubjects,
            isVerified: false // Future OTP field
        });

        await newUser.save();

        if ((role || "student") === "student") {
            const newStudent = new Student({
                name,
                rollNumber: generatedCollegeId,
                course,
                section: section || "A",
                subjects: assignedSubjects
            });
            await newStudent.save();

            for (const sub of assignedSubjects) {
                await new Mark({ studentName: name, rollNumber: generatedCollegeId, course: sub, marksObtained: 0, totalMarks: 0 }).save();
                await new Attendance({ studentName: name, rollNumber: generatedCollegeId, course: sub, presentClasses: 0, totalClasses: 0, attendancePercentage: 0 }).save();
            }
        }

        // OPTIONAL: Send Verification Email Skeleton
        // await sendVerificationEmail(email, generatedCollegeId);

        res.status(201).json({ 
            message: "Registration successful! 🚀", 
            collegeId: generatedCollegeId 
        });
    } catch (error) {
        console.error("❌ REGISTER ERROR:", error);
        res.status(500).json({ message: "Error registering user" });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Try User model first (students & admins)
        let user = await User.findOne({ email });
        let isTeacher = false;

        // If not found in User, try Teacher model
        if (!user) {
            user = await Teacher.findOne({ email });
            if (user) isTeacher = true;
        }

        if (!user) {
            return res.status(400).json({ message: "No account found with this email" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid password" });

        // Build JWT payload based on user type
        const jwtPayload = isTeacher
            ? { 
                userId: user._id, 
                role: "teacher", 
                name: user.name, 
                teacherId: user.teacherId,
                department: user.department,
                assignedCourses: user.assignedCourses || [],
                assignedSubjects: user.assignedSubjects || []
              }
            : { 
                userId: user._id, 
                role: user.role, 
                name: user.name, 
                course: user.course, 
                collegeId: user.collegeId 
              };

        const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: "8h" });

        // Build response user object based on type
        const userPayload = isTeacher
            ? {
                _id: user._id,
                name: user.name,
                email: user.email,
                department: user.department,
                teacherId: user.teacherId,
                assignedCourses: user.assignedCourses || [],
                assignedSubjects: user.assignedSubjects || [],
                role: "teacher"
              }
            : {
                _id: user._id,
                name: user.name,
                email: user.email,
                course: user.course,
                collegeId: user.collegeId,
                subjects: user.subjects,
                role: user.role
              };

        console.log(`✅ Login: ${user.name} [${userPayload.role}]`);

        res.status(200).json({ 
            message: "Login successful 🚀",
            token,
            role: userPayload.role,
            name: user.name,
            user: userPayload
        });
    } catch (error) {
        console.error("❌ Login Error:", error);
        res.status(500).json({ message: "Error logging in" });
    }
});

app.post("/forgot-password", async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        if (!email || !newPassword) return res.status(400).json({ message: "Email and new password are required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found with this email" });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({ message: "Password reset successfully! 🚀" });
    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ message: "Error resetting password" });
    }
});

// Update User
app.put("/users/:collegeId", authMiddleware, authorize(["admin"]), async (req, res) => {
    try {
        const { password, ...otherDetails } = req.body;
        let updateData = { ...otherDetails };

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await User.findOneAndUpdate(
            { collegeId: req.params.collegeId },
            updateData,
            { new: true }
        );

        if (updatedUser && updatedUser.role === "student") {
            await Student.findOneAndUpdate(
                { rollNumber: req.params.collegeId },
                { 
                    name: updatedUser.name, 
                    course: updatedUser.course, 
                    section: updatedUser.section, 
                    subjects: updatedUser.subjects 
                }
            );
        }

        res.json(updatedUser);
    } catch (error) {
        console.error("Update User Error:", error);
        res.status(500).json({ message: "Error updating user" });
    }
});

// ==========================================
// TEACHER REGISTRATION
// ==========================================
app.post("/teacher-register", async (req, res) => {
    try {
        const { name, teacherId, email, password, phone, department, qualification, experience, assignedCourses, assignedSubjects } = req.body;

        if (!name || !teacherId || !email || !password || !department) {
            return res.status(400).json({ message: "All required fields must be filled" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return res.status(400).json({ message: "Invalid email format" });

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
        if (!passwordRegex.test(password)) return res.status(400).json({ message: "Password must be 6+ chars with upper, lower & number" });

        if (await Teacher.findOne({ email })) return res.status(400).json({ message: "Email already registered" });
        if (await Teacher.findOne({ teacherId })) return res.status(400).json({ message: "Teacher ID already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const newTeacher = new Teacher({
            name, teacherId, email,
            password: hashedPassword,
            phone, department, qualification, experience,
            assignedCourses: assignedCourses || [],
            assignedSubjects: assignedSubjects || [],
            role: "teacher"
        });

        await newTeacher.save();
        res.status(201).json({ message: "Teacher registered successfully! 🎓", teacherId });
    } catch (error) {
        console.error("❌ TEACHER REGISTER ERROR:", error);
        res.status(500).json({ message: "Error registering teacher" });
    }
});

// ==========================================
// TEACHER LOGIN
// ==========================================
app.post("/teacher-login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

        const teacher = await Teacher.findOne({ email });
        if (!teacher) return res.status(400).json({ message: "Teacher not found" });

        const isMatch = await bcrypt.compare(password, teacher.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid password" });

        const token = jwt.sign(
            {
                userId: teacher._id,
                role: "teacher",
                name: teacher.name,
                teacherId: teacher.teacherId,
                department: teacher.department,
                assignedCourses: teacher.assignedCourses,
                assignedSubjects: teacher.assignedSubjects
            },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.status(200).json({
            message: "Teacher login successful 🚀",
            token,
            role: "teacher",
            name: teacher.name,
            user: {
                _id: teacher._id,
                name: teacher.name,
                email: teacher.email,
                department: teacher.department,
                teacherId: teacher.teacherId,
                assignedCourses: teacher.assignedCourses,
                assignedSubjects: teacher.assignedSubjects,
                role: "teacher"
            }
        });
    } catch (error) {
        console.error("❌ Teacher Login Error:", error);
        res.status(500).json({ message: "Error logging in" });
    }
});

// ==========================================
// TEACHER PROFILE
// ==========================================
app.get("/teacher/profile", authMiddleware, authorize(["teacher", "admin"]), async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.user.userId).select("-password");
        if (!teacher) return res.status(404).json({ message: "Teacher not found" });
        res.json(teacher);
    } catch (error) {
        res.status(500).json({ message: "Error fetching teacher profile" });
    }
});

// ==========================================
// STUDENTS (with teacher access control)
// ==========================================
app.get("/students", authMiddleware, async (req, res) => {
    try {
        let students;
        if (req.user.role === "student") {
            students = await Student.find({ rollNumber: req.user.collegeId });
        } else if (req.user.role === "teacher") {
            // Teachers only see students in their assigned courses
            const assignedCourses = req.user.assignedCourses || [];
            students = assignedCourses.length > 0
                ? await Student.find({ course: { $in: assignedCourses } })
                : [];
        } else {
            students = await Student.find();
        }
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: "Error fetching students" });
    }
});

app.post("/students", authMiddleware, authorize(["admin"]), async (req, res) => {
    try {
        const { name, rollNumber, course, section, subjects } = req.body;
        const newStudent = new Student({ name, rollNumber, course, section: section || "A", subjects: subjects || [] });
        const savedStudent = await newStudent.save();

        if (subjects && subjects.length > 0) {
            for (const sub of subjects) {
                await new Mark({ studentName: name, course: sub, marksObtained: 0, totalMarks: 0 }).save();
                await new Attendance({ studentName: name, course: sub, presentClasses: 0, totalClasses: 0, attendancePercentage: 0 }).save();
            }
        }

        res.status(201).json({ message: "Student Added Successfully ✅", student: savedStudent });
    } catch (error) {
        res.status(500).json({ message: "Error adding student" });
    }
});

app.put("/students/:id", authMiddleware, authorize(["admin", "teacher"]), async (req, res) => {
    try {
        const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: "Error updating student" });
    }
});

app.delete("/students/:id", authMiddleware, authorize(["admin"]), async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        res.json({ message: "Student deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting student" });
    }
});

// Courses
app.post("/courses", authMiddleware, authorize(["admin"]), async (req, res) => {
    try {
        const newCourse = new Course(req.body);
        const saved = await newCourse.save();
        res.status(201).json(saved);
    } catch (error) {
        res.status(500).json({ message: "Error creating course" });
    }
});

app.get("/courses", authMiddleware, async (req, res) => {
    try {
        const courses = req.user.role === "student" ? await Course.find({ title: req.user.course }) : await Course.find();
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: "Error fetching courses" });
    }
});

app.put("/courses/:id", authMiddleware, authorize(["admin"]), async (req, res) => {
    try {
        const updated = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: "Error updating course" });
    }
});

// Attendance
app.post("/attendance", authMiddleware, authorize(["admin", "teacher"]), async (req, res) => {
    try {
        const { rollNumber, studentName, course, presentClasses, totalClasses } = req.body;
        
        if (!rollNumber || !course) {
            return res.status(400).json({ message: "Roll Number and Course are required" });
        }

        const attendancePercentage = totalClasses > 0 ? ((presentClasses / totalClasses) * 100).toFixed(2) : 0;

        // Find by unique rollNumber and course
        let record = await Attendance.findOne({ rollNumber, course });

        if (record) {
            record.presentClasses = presentClasses;
            record.totalClasses = totalClasses;
            record.attendancePercentage = attendancePercentage;
            if (studentName) record.studentName = studentName;
            await record.save();
        } else {
            record = new Attendance({ ...req.body, attendancePercentage });
            await record.save();
        }

        res.status(201).json({ message: "Attendance updated successfully ✅", attendance: record });
    } catch (error) {
        console.error("Attendance Update Error:", error);
        res.status(500).json({ message: "Error marking attendance" });
    }
});

app.get("/attendance", authMiddleware, async (req, res) => {
    try {
        let attendance;
        if (req.user.role === "student") {
            attendance = await Attendance.find({ rollNumber: req.user.collegeId });
        } else if (req.user.role === "teacher") {
            // Filter attendance to only subjects the teacher is assigned to
            const assignedSubjects = req.user.assignedSubjects || [];
            attendance = assignedSubjects.length > 0
                ? await Attendance.find({ course: { $in: assignedSubjects } })
                : [];
        } else {
            attendance = await Attendance.find();
        }
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: "Error fetching attendance" });
    }
});

// Assignments
app.post("/assignments", authMiddleware, authorize(["admin", "teacher"]), async (req, res) => {
    try {
        const newAssignment = new Assignment(req.body);
        const saved = await newAssignment.save();
        res.status(201).json(saved);
    } catch (error) {
        res.status(500).json({ message: "Error creating assignment" });
    }
});

app.get("/assignments", authMiddleware, async (req, res) => {
    try {
        const assignments = req.user.role === "student" ? await Assignment.find({ course: req.user.course }) : await Assignment.find();
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ message: "Error fetching assignments" });
    }
});

app.put("/assignments/:id", authMiddleware, authorize(["admin", "teacher"]), async (req, res) => {
    try {
        const updated = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: "Error updating assignment" });
    }
});

// Marks
app.post("/marks", authMiddleware, authorize(["admin", "teacher"]), async (req, res) => {
    try {
        const { rollNumber, studentName, course, marksObtained, totalMarks } = req.body;
        
        if (!rollNumber || !course) {
            return res.status(400).json({ message: "Roll Number and Course are required" });
        }

        let record = await Mark.findOne({ rollNumber, course });

        if (record) {
            record.marksObtained = marksObtained;
            record.totalMarks = totalMarks;
            if (studentName) record.studentName = studentName;
            await record.save();
        } else {
            record = new Mark(req.body);
            await record.save();
        }

        res.status(201).json({ message: "Marks updated successfully ✅", mark: record });
    } catch (error) {
        console.error("Marks Update Error:", error);
        res.status(500).json({ message: "Error assigning marks" });
    }
});

app.get("/marks", authMiddleware, async (req, res) => {
    try {
        let marks;
        if (req.user.role === "student") {
            marks = await Mark.find({ rollNumber: req.user.collegeId });
        } else if (req.user.role === "teacher") {
            // Filter marks to only subjects the teacher is assigned to
            const assignedSubjects = req.user.assignedSubjects || [];
            marks = assignedSubjects.length > 0
                ? await Mark.find({ course: { $in: assignedSubjects } })
                : [];
        } else {
            marks = await Mark.find();
        }
        res.json(marks);
    } catch (error) {
        res.status(500).json({ message: "Error fetching marks" });
    }
});

app.put("/marks/:id", authMiddleware, authorize(["admin", "teacher"]), async (req, res) => {
    try {
        const updated = await Mark.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: "Error updating marks" });
    }
});

// File Upload
app.post("/upload", authMiddleware, authorize(["admin", "teacher"]), upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // Determine the base URL for file serving
        let baseUrl;
        if (NODE_ENV === "production") {
            // Use Render backend URL or construct from environment
            baseUrl = process.env.BACKEND_URL || `https://${req.get("host")}`;
        } else {
            // Local development
            const protocol = req.protocol;
            const host = req.get("host");
            baseUrl = `${protocol}://${host}`;
        }

        const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

        console.log(`📂 File uploaded: ${req.file.originalname} -> ${fileUrl}`);

        const newFile = new File({ 
            fileName: req.file.originalname, 
            fileUrl,
            uploadedBy: req.user.userId,
            uploadedAt: new Date()
        });
        await newFile.save();

        res.json({ 
            message: "File uploaded successfully 📂", 
            file: newFile,
            fileUrl: fileUrl
        });
    } catch (error) {
        console.error("❌ File Upload Error:", error);
        res.status(500).json({ message: "Error uploading file", error: error.message });
    }
});

app.get("/files", authMiddleware, async (req, res) => {
    try {
        const files = await File.find();
        res.json(files);
    } catch (error) {
        res.status(500).json({ message: "Error fetching files" });
    }
});

// Student Profile Management
app.get("/student/:collegeId", authMiddleware, async (req, res) => {
    try {
        const student = await Student.findOne({ rollNumber: req.params.collegeId });
        if (!student) {
            return res.status(404).json({ message: "Student record not found" });
        }
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: "Error fetching student profile" });
    }
});

// Student Subject Management
app.get("/student-subjects/:id", authMiddleware, async (req, res) => {
    try {
        const student = await Student.findOne({ rollNumber: req.params.id });
        if (!student) return res.status(404).json({ message: "Student not found" });
        res.json({ subjects: student.subjects });
    } catch (error) {
        res.status(500).json({ message: "Error fetching subjects" });
    }
});

app.put("/enroll-subjects/:id", authMiddleware, authorize(["admin", "student"]), async (req, res) => {
    try {
        const { subjects } = req.body;
        const student = await Student.findOneAndUpdate(
            { rollNumber: req.params.id },
            { subjects },
            { new: true }
        );
        
        if (!student) return res.status(404).json({ message: "Student not found" });

        // Also sync with User model
        await User.findOneAndUpdate({ collegeId: req.params.id }, { subjects });

        // Initialize records for new subjects if not present
        if (subjects && subjects.length > 0) {
            for (const sub of subjects) {
                const existingMark = await Mark.findOne({ rollNumber: req.params.id, course: sub });
                if (!existingMark) {
                    await new Mark({ 
                        studentName: student.name, 
                        rollNumber: student.rollNumber, 
                        course: sub, 
                        marksObtained: 0, 
                        totalMarks: 0 
                    }).save();
                    
                    await new Attendance({ 
                        studentName: student.name, 
                        rollNumber: student.rollNumber, 
                        course: sub, 
                        presentClasses: 0, 
                        totalClasses: 0, 
                        attendancePercentage: 0 
                    }).save();
                }
            }
        }

        res.json({ message: "Enrollment updated ✅", subjects: student.subjects });
    } catch (error) {
        console.error("Enrollment Error:", error);
        res.status(500).json({ message: "Error updating enrollment" });
    }
});

// =====================================================
// ADMIN REGISTRATION (Seed/Setup — protect in prod)
// =====================================================
app.post("/admin-register", async (req, res) => {
    try {
        const { name, email, password, setupKey } = req.body;

        // Guard with a setup key to prevent public admin creation
        if (setupKey !== (process.env.ADMIN_SETUP_KEY || "COLLEGE_ADMIN_2026")) {
            return res.status(403).json({ message: "Invalid setup key" });
        }

        if (!name || !email || !password) return res.status(400).json({ message: "All fields required" });

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return res.status(400).json({ message: "Invalid email" });

        if (password.length < 8) return res.status(400).json({ message: "Password must be 8+ characters" });

        if (await Admin.findOne({ email })) return res.status(400).json({ message: "Admin already exists" });

        const hashedPassword = await bcrypt.hash(password, 12);
        const newAdmin = new Admin({ name, email, password: hashedPassword, role: "admin" });
        await newAdmin.save();

        console.log(`✅ Admin created: ${email}`);
        res.status(201).json({ message: "Admin account created successfully ✅" });
    } catch (error) {
        console.error("❌ Admin Register Error:", error);
        res.status(500).json({ message: "Error creating admin" });
    }
});

// =====================================================
// ADMIN LOGIN
// =====================================================
app.post("/admin-login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: "Email and password required" });

        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) return res.status(401).json({ message: "Invalid admin credentials" });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid admin credentials" });

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        const token = jwt.sign(
            { userId: admin._id, role: "admin", name: admin.name, email: admin.email },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        console.log(`✅ Admin login: ${admin.email} at ${new Date().toISOString()}`);

        res.status(200).json({
            message: "Admin login successful 🚀",
            token,
            role: "admin",
            name: admin.name,
            user: {
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                role: "admin",
                isSuperAdmin: admin.isSuperAdmin
            }
        });
    } catch (error) {
        console.error("❌ Admin Login Error:", error);
        res.status(500).json({ message: "Server error during login" });
    }
});

// =====================================================
// ADMIN: SYSTEM ANALYTICS STATS
// =====================================================
app.get("/admin/stats", authMiddleware, authorize(["admin"]), async (req, res) => {
    try {
        const [totalStudents, totalTeachers, totalCourses, totalAssignments, allAttendance] = await Promise.all([
            Student.countDocuments(),
            Teacher.countDocuments(),
            Course.countDocuments(),
            Assignment.countDocuments(),
            Attendance.find()
        ]);

        // Average attendance percentage
        const avgAttendance = allAttendance.length > 0
            ? (allAttendance.reduce((sum, a) => sum + parseFloat(a.attendancePercentage || 0), 0) / allAttendance.length).toFixed(1)
            : 0;

        res.json({ totalStudents, totalTeachers, totalCourses, totalAssignments, avgAttendance });
    } catch (error) {
        res.status(500).json({ message: "Error fetching stats" });
    }
});

// =====================================================
// ADMIN: GET ALL TEACHERS
// =====================================================
app.get("/admin/teachers", authMiddleware, authorize(["admin"]), async (req, res) => {
    try {
        const teachers = await Teacher.find().select("-password");
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ message: "Error fetching teachers" });
    }
});

// =====================================================
// ADMIN: UPDATE TEACHER PROFILE (including password)
// =====================================================
app.put("/admin/teachers/:id", authMiddleware, authorize(["admin"]), async (req, res) => {
    try {
        const { name, email, password, phone, department, qualification, experience } = req.body;
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) return res.status(404).json({ message: "Teacher not found" });

        if (email && email !== teacher.email) {
            const existingEmail = await Teacher.findOne({ email });
            if (existingEmail) return res.status(400).json({ message: "Email already registered" });
        }

        if (name) teacher.name = name;
        if (email) teacher.email = email;
        if (phone) teacher.phone = phone;
        if (department) teacher.department = department;
        if (qualification) teacher.qualification = qualification;
        if (experience) teacher.experience = experience;

        if (password) {
            teacher.password = await bcrypt.hash(password, 10);
        }

        await teacher.save();
        res.json({ message: "Teacher profile updated successfully ✅", teacher });
    } catch (error) {
        console.error("❌ Update Teacher Error:", error);
        res.status(500).json({ message: "Error updating teacher profile" });
    }
});

// =====================================================
// ADMIN: ASSIGN COURSES + SUBJECTS TO TEACHER
// =====================================================
app.put("/admin/teachers/:id/assign", authMiddleware, authorize(["admin"]), async (req, res) => {
    try {
        const { assignedCourses, assignedSubjects } = req.body;
        const updated = await Teacher.findByIdAndUpdate(
            req.params.id,
            { assignedCourses, assignedSubjects },
            { new: true }
        ).select("-password");
        if (!updated) return res.status(404).json({ message: "Teacher not found" });
        console.log(`✅ Admin assigned courses to ${updated.name}`);
        res.json({ message: "Assignments updated ✅", teacher: updated });
    } catch (error) {
        res.status(500).json({ message: "Error updating teacher assignment" });
    }
});

// =====================================================
// ADMIN: DELETE TEACHER
// =====================================================
app.delete("/admin/teachers/:id", authMiddleware, authorize(["admin"]), async (req, res) => {
    try {
        const deleted = await Teacher.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Teacher not found" });
        console.log(`🗑️ Admin deleted teacher: ${deleted.email}`);
        res.json({ message: "Teacher removed ✅" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting teacher" });
    }
});

// =====================================================
// ADMIN: DELETE STUDENT (User + Student record)
// =====================================================
app.delete("/admin/students/:rollNumber", authMiddleware, authorize(["admin"]), async (req, res) => {
    try {
        const roll = req.params.rollNumber;
        await Student.findOneAndDelete({ rollNumber: roll });
        await User.findOneAndDelete({ collegeId: roll });
        await Mark.deleteMany({ rollNumber: roll });
        await Attendance.deleteMany({ rollNumber: roll });
        console.log(`🗑️ Admin deleted student: ${roll}`);
        res.json({ message: "Student and all records removed ✅" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting student" });
    }
});

// =====================================================
// ADMIN: GET ALL USERS (students only)
// =====================================================
app.get("/admin/users", authMiddleware, authorize(["admin"]), async (req, res) => {
    try {
        const users = await User.find({ role: "student" }).select("-password");
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users" });
    }
});
// =====================================================
// COMPLAINTS / CONTACT US
// =====================================================

// Submit a new complaint (public route)
app.post("/complaints", async (req, res) => {
    try {
        const { name, email, role, message } = req.body;
        if (!name || !email || !role || !message) {
            return res.status(400).json({ message: "All fields are required" });
        }
        
        const newComplaint = new Complaint({ name, email, role, message });
        await newComplaint.save();
        
        res.status(201).json({ message: "Message sent successfully! ✅" });
    } catch (error) {
        console.error("Complaint Error:", error);
        res.status(500).json({ message: "Failed to send message." });
    }
});

// Get all complaints (Admin only)
app.get("/admin/complaints", authMiddleware, authorize(["admin"]), async (req, res) => {
    try {
        const complaints = await Complaint.find().sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: "Error fetching complaints" });
    }
});

// Mark a complaint as resolved (Admin only)
app.put("/admin/complaints/:id/resolve", authMiddleware, authorize(["admin"]), async (req, res) => {
    try {
        const updated = await Complaint.findByIdAndUpdate(
            req.params.id, 
            { status: "resolved" }, 
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: "Complaint not found" });
        res.json({ message: "Complaint marked as resolved ✅", complaint: updated });
    } catch (error) {
        res.status(500).json({ message: "Error updating complaint" });
    }
});

// =====================================================
// GLOBAL ERROR HANDLER (All unhandled errors)
// =====================================================
app.use((err, req, res, next) => {
    const timestamp = new Date().toISOString();
    console.error(`\n❌ [ERROR ${timestamp}] ${err.message}`);
    console.error(`   Stack: ${err.stack}\n`);
    
    // CORS Policy Violations
    if (err.message && err.message.includes("CORS")) {
        return res.status(403).json({
            success: false,
            message: "CORS policy violation - Your frontend domain is not authorized",
            error: NODE_ENV === "development" ? {
                details: err.message,
                origin: req.get("origin"),
                allowedOrigins: getAllowedOrigins()
            } : {},
            timestamp
        });
    }
    
    // Multer File Upload Errors
    if (err.name === "MulterError") {
        const statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
        return res.status(statusCode).json({
            success: false,
            message: err.code === "LIMIT_FILE_SIZE" 
                ? "File size exceeds 50MB limit" 
                : "File upload error",
            error: NODE_ENV === "development" ? err.message : {},
            timestamp
        });
    }
    
    // JSON Parse Errors
    if (err instanceof SyntaxError && "body" in err) {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON in request body",
            error: NODE_ENV === "development" ? err.message : {},
            timestamp
        });
    }
    
    // Default Server Error
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        error: NODE_ENV === "development" ? {
            stack: err.stack,
            message: err.message
        } : {},
        timestamp
    });
});

// =====================================================
// 404 HANDLER (Route not found)
// =====================================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// =====================================================
// DATABASE CONNECTION & SERVER STARTUP
// =====================================================
const startServer = async () => {
    try {
        // Validate environment variables
        if (!process.env.MONGO_URI) {
            throw new Error("❌ MONGO_URI environment variable is not set");
        }
        if (!process.env.JWT_SECRET) {
            throw new Error("❌ JWT_SECRET environment variable is not set");
        }
        
        // Connect to MongoDB
        console.log("\n🔄 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        console.log("✅ MongoDB Connected Successfully\n");
        console.log("═══════════════════════════════════════════════════════");
        console.log("🚀 SERVER CONFIGURATION");
        console.log("═══════════════════════════════════════════════════════");
        console.log(`📝 Environment: ${NODE_ENV}`);
        console.log(`🔒 CORS Allowed Origins:`);
        getAllowedOrigins().forEach((origin, index) => {
            console.log(`   ${index + 1}. ${origin}`);
        });
        console.log(`📊 Database: Connected`);
        console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? "✅ Set" : "❌ Not Set"}`);
        console.log("═══════════════════════════════════════════════════════\n");
        
        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
            console.log(`📍 API Base URL (Production): https://lms-backend-pksf.onrender.com`);
            console.log(`🌐 Frontend URL: https://lms-one-lyart.vercel.app`);
            console.log("\n✅ Server is ready to handle requests!\n");
        });
        
    } catch (error) {
        console.error("\n❌ STARTUP ERROR:");
        console.error(`   ${error.message}\n`);
        
        // Try to reconnect after delay if it's a connection error
        if (error.name === "MongooseServerSelectionError") {
            console.log("🔄 Retrying connection in 5 seconds...");
            setTimeout(startServer, 5000);
        } else {
            process.exit(1);
        }
    }
};

// Start the server
startServer();
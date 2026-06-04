// ==========================================
// LMS DASHBOARD JAVASCRIPT
// ==========================================

// Override fetch to point to local backend if running locally
(function() {
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
        if (typeof input === 'string' && input.includes('https://lms-dra8.onrender.com')) {
            const apiBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
                ? 'https://lms-dra8.onrender.com'
                : 'https://lms-dra8.onrender.com';
            input = input.replace('https://lms-dra8.onrender.com', apiBase);
        }
        return originalFetch(input, init);
    };
})();



// ==========================================
// CHECK JWT TOKEN
// ==========================================

const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const name = localStorage.getItem("name");

const esc = (str) => str ? str.replace(/'/g, "\\'") : "";

// Redirect if not logged in
if (!token) {
    window.location.href = "index.html";
}

// Redirect based on role to specific dashboards
if (role === "student") {
    window.location.href = "student-dashboard.html";
} else if (role === "teacher") {
    window.location.href = "teacher-dashboard.html";
}

// ==========================================
// USER INFO
// ==========================================

console.log("Logged in user:", name);

console.log("Role:", role);


// ==========================================
// GET HTML ELEMENTS
// ==========================================

const logoutBtn = document.getElementById("logoutBtn");

const studentForm = document.getElementById("studentForm");

const studentsGrid = document.getElementById("studentsGrid");

const searchInput = document.getElementById("searchInput");

const courseForm = document.getElementById("courseForm");

const coursesGrid = document.getElementById("coursesGrid");

const attendanceForm = document.getElementById("attendanceForm");

const attendanceGrid = document.getElementById("attendanceGrid");

const marksForm = document.getElementById("marksForm");

const marksGrid = document.getElementById("marksGrid");

const assignmentForm = document.getElementById("assignmentForm");

const assignmentsGrid = document.getElementById("assignmentsGrid");

const uploadForm = document.getElementById("uploadForm");

const filesContainer = document.getElementById("filesContainer");

const notificationBtn = document.getElementById("notificationBtn");

const notificationPanel = document.getElementById("notificationPanel");

const notificationList = document.getElementById("notificationList");

// ==========================================
// GLOBAL STUDENT ARRAY
// ==========================================

let allStudents = [];
let allAttendance = [];
let allMarks = [];
let currentCourse = null;
let currentSection = null;
let attendanceChart = null;
let performanceChart = null;

// ==========================================
// ROLE-BASED ACCESS CONTROL
// ==========================================

// STUDENT ROLE
if (role === "student") {

    // Hide ALL teacher/admin sections — students see their own portal
    const teacherSections = [
        "addStudentSection",
        "studentsListSection",
        "addCourseSection",
        "coursesListSection",
        "markAttendanceSection",
        "attendanceListSection",
        "markStudentSection",
        "marksListSection",
        "createAssignmentSection",
        "assignmentsListSection",
        "uploadFileSection",
        "filesListSection",
        "analyticsSection"
    ];

    teacherSections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });

    // Show the dedicated Student Portal
    const portal = document.getElementById("studentPortalSection");
    if (portal) portal.style.display = "block";

    // Update header
    const mainHeader = document.querySelector(".dashboard-header h1");
    const mainSubtitle = document.querySelector(".dashboard-header .header-subtitle");
    if (mainHeader) mainHeader.textContent = "🎓 College LMS";
    if (mainSubtitle) mainSubtitle.textContent = "Student Portal";

    // Update Welcome Message
    const welcomeTitle = document.querySelector(".welcome-section h2");
    const welcomeDesc  = document.querySelector(".welcome-section p");
    if (welcomeTitle) welcomeTitle.textContent = `Welcome back, ${name} 🎓`;
    if (welcomeDesc)  welcomeDesc.textContent   = "Track your timetable, marks, and attendance from one place.";

    // Load student data
    renderTimetable();
    loadStudentMarks();
    loadStudentAttendance();
    loadStudentAssignments();
}

// ==========================================
// STUDENT PORTAL — TAB SWITCHER
// ==========================================

window.showStudentTab = (tab, btn) => {
    // Hide all tabs
    document.querySelectorAll(".student-tab-content").forEach(el => el.style.display = "none");
    // Deactivate all buttons
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    // Show selected tab
    const target = document.getElementById(`studentTab${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
    if (target) {
        target.style.display = "block";
        target.classList.add("fade-in");
    }
    if (btn) btn.classList.add("active");
};

// ==========================================
// STUDENT PORTAL — TIMETABLE
// ==========================================

function renderTimetable() {
    const tbody = document.getElementById("timetableBody");
    if (!tbody) return;

    // Default timetable — adapt as needed or fetch from backend
    const schedule = [
        { time: "9:00 - 10:00",  mon: "Mathematics",    tue: "Physics",       wed: "Chemistry",    thu: "Mathematics",  fri: "Computer Sci", sat: "Lab" },
        { time: "10:00 - 11:00", mon: "Physics",        tue: "Mathematics",   wed: "Computer Sci", thu: "Chemistry",    fri: "Physics",      sat: "Lab" },
        { time: "11:00 - 11:15", mon: "☕ Break",       tue: "☕ Break",      wed: "☕ Break",     thu: "☕ Break",     fri: "☕ Break",     sat: "☕ Break" },
        { time: "11:15 - 12:15", mon: "Computer Sci",   tue: "Chemistry",     wed: "Physics",      thu: "Computer Sci", fri: "Chemistry",    sat: "—" },
        { time: "12:15 - 1:00",  mon: "🍽 Lunch",      tue: "🍽 Lunch",     wed: "🍽 Lunch",    thu: "🍽 Lunch",    fri: "🍽 Lunch",    sat: "—" },
        { time: "1:00 - 2:00",   mon: "English",        tue: "Lab (Physics)", wed: "Mathematics",  thu: "English",      fri: "Elective",     sat: "—" },
        { time: "2:00 - 3:00",   mon: "Elective",       tue: "English",       wed: "English",      thu: "Lab (CS)",     fri: "Self Study",   sat: "—" },
    ];

    tbody.innerHTML = schedule.map(row => `
        <tr>
            <td>${row.time}</td>
            <td>${row.mon}</td>
            <td>${row.tue}</td>
            <td>${row.wed}</td>
            <td>${row.thu}</td>
            <td>${row.fri}</td>
            <td>${row.sat}</td>
        </tr>
    `).join("");
}

// ==========================================
// STUDENT PORTAL — MY MARKS
// ==========================================

async function loadStudentMarks() {
    const grid = document.getElementById("studentMarksGrid");
    if (!grid) return;
    try {
        const res = await fetch("https://lms-dra8.onrender.com/marks", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const marks = await res.json();
        const myMarks = marks.filter(m => m.studentName && m.studentName.toLowerCase() === (name || "").toLowerCase());

        if (myMarks.length === 0) {
            grid.innerHTML = `<div class="empty-state"><h3>No marks recorded yet 📋</h3></div>`;
            return;
        }

        grid.innerHTML = myMarks.map(m => {
            const pct = ((m.marksObtained / m.totalMarks) * 100).toFixed(1);
            const pass = pct >= 40;
            return `
                <div class="student-mark-card">
                    <h3>${m.course || "—"}</h3>
                    <p style="margin-top:8px">Score: <strong>${m.marksObtained} / ${m.totalMarks}</strong></p>
                    <p class="${pass ? "mark-pass" : "mark-fail"}">${pass ? "✅ Passed" : "❌ Failed"} — ${pct}%</p>
                    <p style="margin-top:6px;opacity:0.6;font-size:13px">${new Date(m.createdAt).toLocaleDateString()}</p>
                </div>`;
        }).join("");
    } catch (e) {
        if (grid) grid.innerHTML = `<div class="empty-state"><h3>Could not load marks ⚠️</h3></div>`;
    }
}

// ==========================================
// STUDENT PORTAL — MY ATTENDANCE
// ==========================================

async function loadStudentAttendance() {
    const grid = document.getElementById("studentAttendanceGrid");
    if (!grid) return;
    try {
        const res = await fetch("https://lms-dra8.onrender.com/attendance", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const records = await res.json();
        const mine = records.filter(r => r.studentName && r.studentName.toLowerCase() === (name || "").toLowerCase());

        if (mine.length === 0) {
            grid.innerHTML = `<div class="empty-state"><h3>No attendance records yet 📋</h3></div>`;
            return;
        }

        grid.innerHTML = mine.map(r => {
            const pct = parseFloat(r.attendancePercentage) || ((r.presentClasses / r.totalClasses) * 100).toFixed(1);
            const low = pct < 75;
            return `
                <div class="student-mark-card">
                    <h3>${r.course || "—"}</h3>
                    <p style="margin-top:8px">Classes: <strong>${r.presentClasses} / ${r.totalClasses}</strong></p>
                    <p class="${low ? "att-low" : "att-good"}">${low ? "⚠️ Low Attendance" : "✅ Good Attendance"} — ${pct}%</p>
                    <p style="margin-top:6px;opacity:0.6;font-size:13px">${new Date(r.createdAt).toLocaleDateString()}</p>
                </div>`;
        }).join("");
    } catch (e) {
        if (grid) grid.innerHTML = `<div class="empty-state"><h3>Could not load attendance ⚠️</h3></div>`;
    }
}

// ==========================================
// STUDENT PORTAL — MY ASSIGNMENTS
// ==========================================

async function loadStudentAssignments() {
    const grid = document.getElementById("studentAssignmentsGrid");
    if (!grid) return;
    try {
        const res = await fetch("https://lms-dra8.onrender.com/assignments", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const all = await res.json();

        if (all.length === 0) {
            grid.innerHTML = `<div class="empty-state"><h3>No assignments posted yet 📋</h3></div>`;
            return;
        }

        grid.innerHTML = all.map(a => {
            const deadline = a.deadline ? new Date(a.deadline).toLocaleDateString() : "—";
            return `
                <div class="student-mark-card">
                    <h3>${a.title}</h3>
                    <p style="margin-top:8px">📚 Course: <strong>${a.course}</strong></p>
                    <p style="color:cyan">⏰ Deadline: ${deadline}</p>
                </div>`;
        }).join("");
    } catch (e) {
        if (grid) grid.innerHTML = `<div class="empty-state"><h3>Could not load assignments ⚠️</h3></div>`;
    }
}


// TEACHER ROLE
if (role === "teacher") {

    // Hide admin sections that teachers shouldn't see
    const restrictedSections = [
        "addStudentSection",
        "addCourseSection"
    ];

    restrictedSections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });

    // Update Welcome Message for Teacher
    const welcomeTitle = document.querySelector(".welcome-section h2");
    const welcomeDesc = document.querySelector(".welcome-section p");
    
    if (welcomeTitle) welcomeTitle.textContent = `Welcome ${name} 👨‍🏫`;
    if (welcomeDesc) welcomeDesc.textContent = "Manage attendance, assignments, and study materials here.";

    // Update Main Header
    const mainHeader = document.querySelector(".dashboard-header h1");
    const mainSubtitle = document.querySelector(".dashboard-header .header-subtitle");

    if (mainHeader) mainHeader.textContent = "👨‍🏫 Teacher Portal";
    if (mainSubtitle) mainSubtitle.textContent = "Faculty Management System";
}

// ==========================================
// LOGOUT
// ==========================================

logoutBtn.addEventListener("click", () => {

    localStorage.clear();

    alert("Logged out successfully 👋");

    window.location.href = "index.html";

});
// ==========================================
// TOGGLE NOTIFICATIONS
// ==========================================

notificationBtn.addEventListener(

    "click",

    () => {

        if (

            notificationPanel.style.display
            === "block"

        ) {

            notificationPanel.style.display =
                "none";

        }

        else {

            notificationPanel.style.display =
                "block";

        }

    }

);
// ==========================================
// ADD NOTIFICATION
// ==========================================

function addNotification(message) {

    const li = document.createElement("li");

    li.textContent = message;

    notificationList.prepend(li);

}


// ==========================================
// FETCH STUDENTS
// ==========================================

async function fetchStudents() {

    try {

        studentsGrid.innerHTML = `
            <p>Loading students...</p>
        `;

        const response = await fetch(
            "https://lms-dra8.onrender.com/students",
            {

                headers: {

                    Authorization: `Bearer ${token}`

                }

            }
        );

        // Invalid token
        if (!response.ok) {

            localStorage.removeItem("token");

            window.location.href = "index.html";

            return;

        }

        const students = await response.json();

        allStudents = students;

        renderStudents(students);

    } catch (error) {

        console.log(error);

    }

}


// ==========================================
// RENDER STUDENTS
// ==========================================

function renderStudents(students) {
    if (!studentsGrid) return;

    // Add fade-in effect for premium feel
    studentsGrid.classList.remove("fade-in");
    void studentsGrid.offsetWidth; // Trigger reflow
    studentsGrid.classList.add("fade-in");

    // IF WE ARE AT COURSE LEVEL
    if (!currentCourse) {
        renderCourseCards(students);
    } 
    // IF WE ARE AT SECTION LEVEL
    else if (currentCourse && !currentSection) {
        renderSectionCards(students);
    } 
    // IF WE ARE AT STUDENT LEVEL
    else {
        renderStudentCards(students);
    }

    updateNavigationUI();
}

// ==========================================
// RENDER COURSE CARDS
// ==========================================

function renderCourseCards(students) {
    studentsGrid.innerHTML = "";
    const courses = [...new Set(students.map(s => s.course))];

    if (courses.length === 0) {
        studentsGrid.innerHTML = `<div class="empty-state"><h3>No Courses Found 📚</h3></div>`;
        return;
    }

    courses.forEach(course => {
        const count = students.filter(s => s.course === course).length;
        studentsGrid.innerHTML += `
            <div class="student-card course-card" onclick="navigateToCourse('${course}')" style="cursor: pointer; text-align: center; border: 1px solid rgba(0, 255, 255, 0.2);">
                <div style="font-size: 40px; margin-bottom: 15px;">📂</div>
                <h3>${course}</h3>
                <p>${count} Students</p>
                <div style="margin-top: 15px; color: var(--cyan-glow); font-weight: bold;">View Sections →</div>
            </div>
        `;
    });
}

// ==========================================
// RENDER SECTION CARDS
// ==========================================

function renderSectionCards(students) {
    studentsGrid.innerHTML = "";
    const courseStudents = students.filter(s => s.course === currentCourse);
    const sections = [...new Set(courseStudents.map(s => s.section || "A"))];

    sections.forEach(section => {
        const count = courseStudents.filter(s => s.section === section).length;
        studentsGrid.innerHTML += `
            <div class="student-card section-card" onclick="navigateToSection('${section}')" style="cursor: pointer; text-align: center; border: 1px solid rgba(0, 255, 255, 0.2);">
                <div style="font-size: 40px; margin-bottom: 15px;">🏫</div>
                <h3>Section ${section}</h3>
                <p>${count} Students</p>
                <div style="margin-top: 15px; color: var(--cyan-glow); font-weight: bold;">View Students →</div>
            </div>
        `;
    });
}

// ==========================================
// RENDER STUDENT CARDS
// ==========================================

function renderStudentCards(students) {
    studentsGrid.innerHTML = "";
    const attendanceDropdown = document.getElementById("attendanceStudent");
    const marksDropdown = document.getElementById("marksStudent");

    if (attendanceDropdown) attendanceDropdown.innerHTML = '<option value="" disabled selected>Select Student...</option>';
    if (marksDropdown) marksDropdown.innerHTML = '<option value="" disabled selected>Select Student...</option>';

    const filtered = students.filter(s => s.course === currentCourse && s.section === currentSection);

    filtered.forEach(student => {
        if (attendanceDropdown) attendanceDropdown.innerHTML += `<option value="${student.name}">${student.name}</option>`;
        if (marksDropdown) marksDropdown.innerHTML += `<option value="${student.name}">${student.name}</option>`;

        studentsGrid.innerHTML += `
            <div class="student-card" onclick="selectStudent('${esc(student.name)}', '${esc(student.course)}')" style="cursor: pointer;">
                <h3>${student.name}</h3>
                <p><strong>Roll:</strong> ${student.rollNumber}</p>
                <p><strong>Course:</strong> ${student.course}</p>
                <p><strong>Section:</strong> ${student.section || "A"}</p>
                <div style="margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="edit-btn" onclick="event.stopPropagation(); editStudent('${student._id}', '${esc(student.name)}', '${esc(student.rollNumber)}', '${esc(student.course)}', '${esc(student.section || "A")}', '${esc((student.subjects || []).join(", "))}')">Edit</button>
                    <button class="delete-btn" onclick="event.stopPropagation(); deleteStudent('${student._id}')">Delete</button>
                    <button style="background: #8b5cf6;" class="edit-btn" onclick="event.stopPropagation(); resetStudentPassword('${esc(student.rollNumber)}')">🔑 Reset Pass</button>
                </div>
            </div>
        `;
    });
}

// ==========================================
// NAVIGATION HELPERS
// ==========================================

window.navigateToCourse = (course) => {
    currentCourse = course;
    currentSection = null;
    renderStudents(allStudents);
};

window.navigateToSection = (section) => {
    currentSection = section;
    renderStudents(allStudents);
};

window.selectStudent = (name, course) => {
    // Scroll to and reveal Attendance/Marks sections
    const attendanceSection = document.getElementById("markAttendanceSection");
    const marksSection = document.getElementById("markStudentSection");
    
    if (attendanceSection) attendanceSection.style.display = "block";
    if (marksSection) marksSection.style.display = "block";
    
    // Also show the record lists
    const attendanceList = document.getElementById("attendanceListSection");
    const marksList = document.getElementById("marksListSection");
    if (attendanceList) attendanceList.style.display = "block";
    if (marksList) marksList.style.display = "block";

    // Pre-fill the dropdowns
    const attDropdown = document.getElementById("attendanceStudent");
    const markDropdown = document.getElementById("marksStudent");
    const attCourse = document.getElementById("attendanceCourse");
    const markCourse = document.getElementById("marksCourse");

    if (attDropdown) attDropdown.value = name;
    if (markDropdown) markDropdown.value = name;
    if (attCourse) attCourse.value = course;
    if (markCourse) markCourse.value = course;

    // Scroll smoothly
    attendanceSection.scrollIntoView({ behavior: 'smooth' });
    
    addNotification(`🎯 Selected student: ${name}`);
};

function updateNavigationUI() {
    const breadcrumb = document.getElementById("breadcrumbNav");
    const backBtn = document.getElementById("backNavBtn");
    
    const adminSections = [
        "markAttendanceSection", "attendanceListSection",
        "markStudentSection", "marksListSection",
        "createAssignmentSection", "assignmentsListSection",
        "uploadFileSection", "filesListSection",
        "analyticsSection",
        "addStudentSection"
    ];

    if (!breadcrumb || !backBtn) return;

    // 1. Initial State: Hide all specific tool sections
    adminSections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });

    if (!currentCourse) {
        breadcrumb.textContent = "All Courses 🎓";
        backBtn.style.display = "none";
    } else if (currentCourse && !currentSection) {
        breadcrumb.innerHTML = `Students / <span style="color:white">${currentCourse}</span>`;
        backBtn.style.display = "block";
        
        // Show Course-level tools (Assignments & Files)
        ["createAssignmentSection", "assignmentsListSection", "uploadFileSection", "filesListSection"].forEach(id => {
            const el = document.getElementById(id);
            if (el && role !== "student") el.style.display = "block";
        });
        
    } else {
        breadcrumb.innerHTML = `Students / ${currentCourse} / <span style="color:white">Section ${currentSection}</span>`;
        backBtn.style.display = "block";
        
        // Show Course-level tools (Assignments & Files)
        ["createAssignmentSection", "assignmentsListSection", "uploadFileSection", "filesListSection"].forEach(id => {
            const el = document.getElementById(id);
            if (el && role !== "student") el.style.display = "block";
        });

        // Show Analytics for Section
        const analytics = document.getElementById("analyticsSection");
        if (analytics && role !== "student") {
            analytics.style.display = "block";
            updateAnalytics();
        }
    }
}

// ==========================================
// UPDATE ANALYTICS
// ==========================================

function updateAnalytics() {
    // Filter data for current course/section
    const sectionAttendance = allAttendance.filter(a => a.course === currentCourse);
    const sectionMarks = allMarks.filter(m => m.course === currentCourse);

    // Calculate averages/labels
    const labels = [...new Set([...sectionAttendance.map(a => a.studentName), ...sectionMarks.map(m => m.studentName)])];
    
    const attData = labels.map(name => {
        const records = sectionAttendance.filter(a => a.studentName === name);
        if (records.length === 0) return 0;
        const total = records.reduce((sum, r) => sum + (r.presentClasses / r.totalClasses), 0);
        return (total / records.length) * 100;
    });

    const marksData = labels.map(name => {
        const records = sectionMarks.filter(m => m.studentName === name);
        if (records.length === 0) return 0;
        const total = records.reduce((sum, r) => sum + (r.marksObtained / r.totalMarks), 0);
        return (total / records.length) * 100;
    });

    drawCharts(labels, attData, marksData);
}

function drawCharts(labels, attData, marksData) {
    const attCtx = document.getElementById('attendanceChart').getContext('2d');
    const perfCtx = document.getElementById('performanceChart').getContext('2d');

    if (attendanceChart) attendanceChart.destroy();
    if (performanceChart) performanceChart.destroy();

    attendanceChart = new Chart(attCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Attendance %',
                data: attData,
                backgroundColor: 'rgba(0, 255, 255, 0.2)',
                borderColor: 'cyan',
                borderWidth: 1
            }]
        },
        options: {
            scales: { y: { beginAtZero: true, max: 100 } },
            plugins: { legend: { labels: { color: 'white' } } }
        }
    });

    performanceChart = new Chart(perfCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Mark %',
                data: marksData,
                backgroundColor: 'rgba(255, 0, 255, 0.2)',
                borderColor: 'magenta',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            scales: { y: { beginAtZero: true, max: 100 } },
            plugins: { legend: { labels: { color: 'white' } } }
        }
    });
}

document.getElementById("backNavBtn").addEventListener("click", () => {
    if (currentSection) {
        currentSection = null;
    } else if (currentCourse) {
        currentCourse = null;
    }
    renderStudents(allStudents);
});


// ==========================================
// FILTER SYSTEM (Search within current view)
// ==========================================

function applyFilters() {
    const searchText = searchInput.value.toLowerCase();

    // Filter students based on search AND current navigation state
    const filteredStudents = allStudents.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchText) || 
                             student.course.toLowerCase().includes(searchText) ||
                             (student.section && student.section.toLowerCase().includes(searchText));
        
        // If we are at student level, only show students for that course/section
        if (currentCourse && currentSection) {
            return matchesSearch && student.course === currentCourse && student.section === currentSection;
        }
        // If we are at section level, only show sections for that course
        if (currentCourse) {
            return matchesSearch && student.course === currentCourse;
        }
        
        return matchesSearch;
    });

    renderStudents(filteredStudents);
}

searchInput.addEventListener("input", applyFilters);


// ==========================================
// POPULATE COURSE FILTER (Deprecated - keeping for compatibility if needed elsewhere)
// ==========================================
function populateCourseFilter(students) {}


// ==========================================
// ADD STUDENT
// ==========================================

studentForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const name = document.getElementById("studentName").value;

    const rollNumber = document.getElementById("studentRoll").value;

    const course = document.getElementById("studentCourse").value;

    const section = document.getElementById("studentSection").value;

    const subjects = document.getElementById("studentSubjects").value
        .split(",")
        .map(s => s.trim())
        .filter(s => s !== "");

    try {

        const response = await fetch(
            "https://lms-dra8.onrender.com/students",
            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json",

                    Authorization: `Bearer ${token}`

                },

                body: JSON.stringify({

                    name,
                    rollNumber,
                    course,
                    section,
                    subjects

                })

            }
        );

        if (response.ok) {

            alert("Student Added Successfully ✅");

            addNotification("👨‍🎓 New student added");

            studentForm.reset();

            fetchStudents();

        }

    } catch (error) {

        console.log(error);

    }

});


// ==========================================
// DELETE STUDENT
// ==========================================

async function deleteStudent(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this student?"
    );

    if (!confirmDelete) {

        return;

    }

    try {

        const response = await fetch(

            `https://lms-dra8.onrender.com/students/${id}`,

            {

                method: "DELETE",

                headers: {

                    Authorization: `Bearer ${token}`

                }

            }

        );

        if (response.ok) {

            alert("Student Deleted ❌");

            fetchStudents();

        }

    } catch (error) {

        console.log(error);

    }

}


// ==========================================
// EDIT STUDENT
// ==========================================

async function resetStudentPassword(collegeId) {
    const newPass = prompt("Enter new password for this student:");
    if (!newPass) return;
    try {
        const response = await fetch(`https://lms-dra8.onrender.com/users/${collegeId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ password: newPass })
        });
        if (response.ok) alert("Password Reset Successfully ✅");
    } catch (error) { console.log(error); }
}

async function editStudent(id, oldName, oldRoll, oldCourse, oldSection, oldSubjects) {
    const name = prompt("Student Name:", oldName) || oldName;
    const rollNumber = prompt("Roll Number:", oldRoll) || oldRoll;
    const course = prompt("Course:", oldCourse) || oldCourse;
    const section = prompt("Section:", oldSection) || oldSection;
    const subjectsStr = prompt("Subjects (comma separated):", oldSubjects) || oldSubjects;
    
    const subjects = subjectsStr.split(",").map(s => s.trim()).filter(s => s !== "");

    try {
        const response = await fetch(`https://lms-dra8.onrender.com/students/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name, rollNumber, course, section, subjects })
        });
        if (response.ok) { alert("Student Updated ✅"); fetchStudents(); }
    } catch (error) { console.log(error); }
}
// ==========================================
// FETCH COURSES
// ==========================================

async function fetchCourses() {

    try {

        const response = await fetch(
            "https://lms-dra8.onrender.com/courses",
            {

                headers: {

                    Authorization: `Bearer ${token}`

                }

            }
        );

        const courses = await response.json();

        renderCourses(courses);

    } catch (error) {

        console.log(error);

    }

}


// ==========================================
// RENDER COURSES
// ==========================================

function renderCourses(courses) {

    coursesGrid.innerHTML = "";

    if (courses.length === 0) {

        coursesGrid.innerHTML = `
            <div class="empty-state">
                <h3>No Courses Found 📚</h3>
            </div>
        `;

        return;

    }

    courses.forEach(course => {

        coursesGrid.innerHTML += `

            <div class="student-card">

                <h3>${course.title}</h3>

                <p>
                    <strong>Instructor:</strong>
                    ${course.instructor}
                </p>

                <p>
                    <strong>Duration:</strong>
                    ${course.duration}
                </p>

                <div style="margin-top: 10px; display: flex; gap: 10px;">
                    <button class="edit-btn" onclick="editCourse('${course._id}', '${course.title}', '${course.instructor}', '${course.duration}')">Edit</button>
                    <button class="delete-btn" onclick="deleteCourse('${course._id}')">Delete</button>
                </div>

            </div>

        `;

    });

}


// ==========================================
// ADD COURSE
// ==========================================

courseForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const title =
        document.getElementById("courseTitle").value;

    const instructor =
        document.getElementById("courseInstructor").value;

    const duration =
        document.getElementById("courseDuration").value;

    try {

        const response = await fetch(
            "https://lms-dra8.onrender.com/courses",
            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json",

                    Authorization: `Bearer ${token}`

                },

                body: JSON.stringify({

                    title,
                    instructor,
                    duration

                })

            }
        );

        if (response.ok) {

            alert("Course Added Successfully 📚");

            addNotification("📚 New course created");

            courseForm.reset();

            fetchCourses();

        }

    } catch (error) {

        console.log(error);

    }

});


// ==========================================
// DELETE COURSE
// ==========================================

async function deleteCourse(id) {
    if (!confirm("Delete this course?")) return;
    try {
        const response = await fetch(`https://lms-dra8.onrender.com/courses/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) { alert("Course Deleted ❌"); fetchCourses(); }
    } catch (error) { console.log(error); }
}

async function editCourse(id, oldTitle, oldInstructor, oldDuration) {
    const title = prompt("Course Title:", oldTitle) || oldTitle;
    const instructor = prompt("Instructor:", oldInstructor) || oldInstructor;
    const duration = prompt("Duration:", oldDuration) || oldDuration;

    try {
        const response = await fetch(`https://lms-dra8.onrender.com/courses/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ title, instructor, duration })
        });
        if (response.ok) { alert("Course Updated ✅"); fetchCourses(); }
    } catch (error) { console.log(error); }
}
// ==========================================
// FETCH ATTENDANCE
// ==========================================

async function fetchAttendance() {

    try {

        const response = await fetch(
            "https://lms-dra8.onrender.com/attendance",
            {

                headers: {

                    Authorization: `Bearer ${token}`

                }

            }
        );

        const attendance = await response.json();

        renderAttendance(attendance);

    } catch (error) {

        console.log(error);

    }

}


// ==========================================
// RENDER ATTENDANCE
// ==========================================

function renderAttendance(records) {

    attendanceGrid.innerHTML = "";

    if (records.length === 0) {

        attendanceGrid.innerHTML = `
            <div class="empty-state">
                <h3>No Attendance Records 📅</h3>
            </div>
        `;

        return;

    }

    records.forEach(record => {
        let warningLabel = "";
        let percentage = parseFloat(record.attendancePercentage);
        if (percentage < 75) {
            warningLabel = `<span class="warning-text" style="color: red; font-weight: bold; border: 1px solid red; padding: 2px 5px; border-radius: 4px; font-size: 0.8rem;">⚠️ Low Attendance</span>`;
        }

        attendanceGrid.innerHTML += `

            <div class="student-card">

                <h3>${record.studentName} ${warningLabel}</h3>

                <p>
                    <strong>Course:</strong>
                    ${record.course}
                </p>

                <p>
                    <strong>Classes:</strong>
                    ${record.presentClasses} / ${record.totalClasses} (${record.attendancePercentage}%)
                </p>

                <p>
                    <strong>Date:</strong>
                    ${new Date(record.date).toLocaleDateString()}
                </p>

                <div style="margin-top: 10px; display: flex; gap: 10px;">
                    <button class="edit-btn" onclick="editAttendance('${record._id}', '${record.presentClasses}', '${record.totalClasses}')">Edit</button>
                </div>

            </div>

        `;

    });

}


// ==========================================
// MARK ATTENDANCE
// ==========================================

attendanceForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const studentName = document.getElementById("attendanceStudent").value;
        const course = document.getElementById("attendanceCourse").value;
        const presentClasses = document.getElementById("presentClasses").value;
        const totalClasses = document.getElementById("totalClasses").value;

        try {

            const response = await fetch(
                "https://lms-dra8.onrender.com/attendance",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`

                    },

                    body: JSON.stringify({

                        studentName,
                        course,
                        presentClasses: parseInt(presentClasses),
                        totalClasses: parseInt(totalClasses)

                    })

                }
            );

            if (response.ok) {

                alert("Attendance Marked ✅");

                addNotification("📅 Attendance marked");

                attendanceForm.reset();

                fetchAttendance();

            }

        } catch (error) {

            console.log(error);

        }

    }
);
// ==========================================
// FETCH MARKS
// ==========================================

async function fetchMarks() {
    try {
        const response = await fetch("https://lms-dra8.onrender.com/marks", {
            headers: { Authorization: `Bearer ${token}` }
        });
        allMarks = await response.json();
        renderMarks(allMarks);
        updateAnalytics();
    } catch (error) {
        console.log(error);
    }
}

// ==========================================
// RENDER MARKS
// ==========================================

function renderMarks(records) {
    if (!marksGrid) return;
    marksGrid.innerHTML = "";
    if (records.length === 0) {
        marksGrid.innerHTML = `
            <div class="empty-state">
                <h3>No Marks Recorded 🏆</h3>
            </div>
        `;
        return;
    }

    records.forEach(record => {
        let percentage = (record.marksObtained / record.totalMarks) * 100;
        let color = percentage >= 40 ? "lightgreen" : "#fca5a5";
        let emoji = percentage >= 40 ? "✅ Passed" : "❌ Failed";

        marksGrid.innerHTML += `
            <div class="student-card">
                <h3>${record.studentName}</h3>
                <p><strong>Course:</strong> ${record.course}</p>
                <p><strong>Marks:</strong> ${record.marksObtained} / ${record.totalMarks} (<span style="color: ${color}; font-weight: bold;">${percentage.toFixed(1)}% - ${emoji}</span>)</p>
                <p><strong>Date:</strong> ${new Date(record.createdAt).toLocaleDateString()}</p>
                <div style="margin-top: 10px; display: flex; gap: 10px;">
                    <button class="edit-btn" onclick="editMarks('${record._id}', '${record.marksObtained}', '${record.totalMarks}')">Edit</button>
                </div>
            </div>
        `;
    });
}

// ==========================================
// GIVE MARKS
// ==========================================

if (marksForm) {
    marksForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const studentName = document.getElementById("marksStudent").value;
        const course = document.getElementById("marksCourse").value;
        const marksObtained = document.getElementById("marksObtained").value;
        const totalMarks = document.getElementById("totalMarks").value;

        try {
            const response = await fetch("https://lms-dra8.onrender.com/marks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    studentName, course, marksObtained: Number(marksObtained), totalMarks: Number(totalMarks)
                })
            });

            if (response.ok) {
                alert("Marks Assigned ✅");
                addNotification("📝 Marks assigned to student");
                marksForm.reset();
                fetchMarks();
            }
        } catch (error) {
            console.log(error);
        }
    });
}


// ==========================================
// FETCH ASSIGNMENTS
// ==========================================

async function fetchAssignments() {

    try {

        const response = await fetch(
            "https://lms-dra8.onrender.com/assignments",
            {

                headers: {

                    Authorization:
                        `Bearer ${token}`

                }

            }
        );

        const assignments =
            await response.json();

        renderAssignments(assignments);

    } catch (error) {

        console.log(error);

    }

}


// ==========================================
// RENDER ASSIGNMENTS
// ==========================================

function renderAssignments(assignments) {

    assignmentsGrid.innerHTML = "";

    if (assignments.length === 0) {

        assignmentsGrid.innerHTML = `
            <div class="empty-state">
                <h3>No Assignments Found 📝</h3>
            </div>
        `;

        return;

    }

    assignments.forEach(assignment => {

        assignmentsGrid.innerHTML += `

            <div class="student-card">

                <h3>${assignment.title}</h3>

                <p>
                    <strong>Course:</strong>
                    ${assignment.course}
                </p>

                <p>
                    <strong>Deadline:</strong>
                    ${assignment.deadline}
                </p>

                <div style="margin-top: 10px; display: flex; gap: 10px;">
                    <button class="edit-btn" onclick="editAssignment('${assignment._id}', '${assignment.title}', '${assignment.course}', '${assignment.deadline}')">Edit</button>
                    <button class="delete-btn" onclick="deleteAssignment('${assignment._id}')">Delete</button>
                </div>

            </div>

        `;

    });

}


// ==========================================
// CREATE ASSIGNMENT
// ==========================================

assignmentForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const title =
            document.getElementById(
                "assignmentTitle"
            ).value;

        const course =
            document.getElementById(
                "assignmentCourse"
            ).value;

        const deadline =
            document.getElementById(
                "assignmentDeadline"
            ).value;

        try {

            const response = await fetch(
                "https://lms-dra8.onrender.com/assignments",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`

                    },

                    body: JSON.stringify({

                        title,
                        course,
                        deadline

                    })

                }
            );

            if (response.ok) {

                alert("Assignment Created ✅");

                addNotification("📝 New assignment created");

                assignmentForm.reset();

                fetchAssignments();

            }

        } catch (error) {

            console.log(error);

        }

    }
);


// ==========================================
// DELETE ASSIGNMENT
// ==========================================

async function deleteAssignment(id) {
    if (!confirm("Delete this assignment?")) return;
    try {
        const response = await fetch(`https://lms-dra8.onrender.com/assignments/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) { alert("Assignment Deleted ❌"); fetchAssignments(); }
    } catch (error) { console.log(error); }
}

async function editAssignment(id, oldTitle, oldCourse, oldDeadline) {
    const title = prompt("Assignment Title:", oldTitle) || oldTitle;
    const course = prompt("Course:", oldCourse) || oldCourse;
    const deadline = prompt("Deadline (YYYY-MM-DD):", oldDeadline) || oldDeadline;

    try {
        const response = await fetch(`https://lms-dra8.onrender.com/assignments/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ title, course, deadline })
        });
        if (response.ok) { alert("Assignment Updated ✅"); fetchAssignments(); }
    } catch (error) { console.log(error); }
}

async function editAttendance(id, oldPresent, oldTotal) {
    const presentClasses = prompt("Present Classes:", oldPresent) || oldPresent;
    const totalClasses = prompt("Total Classes:", oldTotal) || oldTotal;
    try {
        const response = await fetch(`https://lms-dra8.onrender.com/attendance/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ presentClasses: Number(presentClasses), totalClasses: Number(totalClasses) })
        });
        if (response.ok) { alert("Attendance Updated ✅"); fetchAttendance(); }
    } catch (error) { console.log(error); }
}

async function editMarks(id, oldObtained, oldTotal) {
    const marksObtained = prompt("Marks Obtained:", oldObtained) || oldObtained;
    const totalMarks = prompt("Total Marks:", oldTotal) || oldTotal;
    try {
        const response = await fetch(`https://lms-dra8.onrender.com/marks/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ marksObtained: Number(marksObtained), totalMarks: Number(totalMarks) })
        });
        if (response.ok) { alert("Marks Updated ✅"); fetchMarks(); }
    } catch (error) { console.log(error); }
}



// ==========================================
// FILE UPLOAD SYSTEM
// ==========================================

uploadForm.addEventListener(

    "submit",

    async (event) => {

        event.preventDefault();

        // Get selected file
        const fileInput =
            document.getElementById(
                "fileInput"
            );

        // Create FormData
        const formData =
            new FormData();

        // Append file
        formData.append(

            "file",

            fileInput.files[0]

        );

        try {

            // Send upload request
            const response =
                await fetch(

                    "https://lms-dra8.onrender.com/upload",

                    {

                        method: "POST",

                        headers: {

                            Authorization:
                                `Bearer ${token}`

                        },

                        body: formData

                    }

                );

            const data =
                await response.json();

            // Success
            if (response.ok) {

                alert("File Uploaded Successfully 📂");

                addNotification("📁 File uploaded successfully");

                // Show uploaded file
                filesContainer.innerHTML += `

                    <div class="student-card">

                        <h3>
                            📄 Uploaded File
                        </h3>

                        <a
                            href="${data.file.fileUrl}"
                            target="_blank"
                            style="
                                color:white;
                                text-decoration:none;
                            "
                        >
                            Open File
                        </a>

                    </div>

                `;

                // Reset form
                uploadForm.reset();

            }

        } catch (error) {

            console.log(error);

        }

    }

);
// ==========================================
// FETCH FILES
// ==========================================

async function fetchFiles() {

    try {

        const response =
            await fetch(

                "https://lms-dra8.onrender.com/files",

                {

                    headers: {

                        Authorization:
                            `Bearer ${token}`

                    }

                }

            );

        const files =
            await response.json();

        renderFiles(files);

    }

    catch (error) {

        console.log(error);

    }

}


// ==========================================
// RENDER FILES
// ==========================================

function renderFiles(files) {

    filesContainer.innerHTML = "";

    if (files.length === 0) {

        filesContainer.innerHTML = `

            <div class="empty-state">

                <h3>
                    No Files Uploaded 📂
                </h3>

            </div>

        `;

        return;

    }

    files.forEach(file => {

        filesContainer.innerHTML += `

            <div class="student-card">

                <h3>
                    📄 ${file.fileName}
                </h3>

                <a
                    href="${file.fileUrl}"
                    target="_blank"
                    style="
                        color:white;
                        text-decoration:none;
                    "
                >
                    Open File
                </a>

            </div>

        `;

    });

}
// ==========================================
// INITIAL LOAD
// ==========================================

if (role === "student") {
    // Student only needs their specific data
    renderTimetable();
    loadStudentMarks();
    loadStudentAttendance();
    loadStudentAssignments();
} else {
    // Teachers/Admins need the full lists
    fetchStudents();
    fetchCourses();
    fetchAttendance();
    fetchMarks();
    fetchAssignments();
    fetchFiles();
}

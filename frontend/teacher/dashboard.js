// TEACHER DASHBOARD - ROLE-BASED ACCESS CONTROL
const token = localStorage.getItem("token") || "mock-token";
const role = localStorage.getItem("role") || "teacher";
const name = localStorage.getItem("name") || "Mock Teacher";
const department = localStorage.getItem("department") || "Computer Science";
const assignedCourses = JSON.parse(localStorage.getItem("assignedCourses") || '["BTECH CSE"]');
const assignedSubjects = JSON.parse(localStorage.getItem("assignedSubjects") || '["Computer Networks"]');

const apiBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
    ? 'https://lms-dra8.onrender.com'
    : 'https://lms-dra8.onrender.com';


console.log("--- TEACHER DASHBOARD ---");
console.log("Assigned Courses:", assignedCourses);
console.log("Assigned Subjects:", assignedSubjects);

// Auth Check (Bypassed for testing)
// if (!token || (role !== "teacher" && role !== "admin")) {
//     window.location.href = "login.html";
// }

// Global State
let allStudents = [];
let currentCourse = null;
let currentSection = null;

// Initial Setup
function setupUI() {
    document.getElementById("welcomeMsg").textContent = `Welcome, Prof. ${name.split(" ")[0]}! 👋`;
    document.getElementById("userNameSidebar").textContent = name;
    document.getElementById("userInitial").textContent = name.charAt(0);

    // Show department badge in sidebar
    const profileInfo = document.querySelector(".sidebar-profile .profile-info");
    if (profileInfo && department) {
        profileInfo.querySelector("p:last-child").textContent = department;
    }

    // Show assigned subject/course info in header
    const badge = document.querySelector(".topbar .badge");
    if (badge && assignedCourses.length > 0) {
        badge.textContent = `${assignedCourses.length} Course${assignedCourses.length > 1 ? "s" : ""} Assigned`;
    }
}

// Tab Switching Logic
window.switchTab = (tabName) => {
    // Update Menu UI
    document.querySelectorAll(".menu-item").forEach(item => item.classList.remove("active"));
    document.getElementById(`menu-${tabName}`).classList.add("active");

    // Hide All Sections
    const sections = ['mainSection', 'analyticsSection', 'attendanceSection', 'marksSection', 'assignmentsSection'];
    sections.forEach(s => {
        const el = document.getElementById(s);
        if (el) el.style.display = "none";
    });

    // Show Target Section
    if (tabName === 'dashboard' || tabName === 'students') {
        document.getElementById('mainSection').style.display = "block";
        if (tabName === 'dashboard') {
            currentCourse = null;
            currentSection = null;
            renderStudents(allStudents);
        }
    } else {
        document.getElementById(`${tabName}Section`).style.display = "block";
    }
};

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
});

// Fetch Data
async function fetchStudents() {
    const grid = document.getElementById("studentsGrid");
    try {
        const res = await fetch(`${apiBase}/students`, { 
            headers: { Authorization: `Bearer ${token}` } 
        });
        allStudents = await res.json();
        updateStats(allStudents);
        renderStudents(allStudents);
    } catch (e) { 
        console.error(e);
        grid.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Failed to load students</h3></div>`; 
    }
}

// Update Stats Widgets
function updateStats(students) {
    // For teachers: count only students in their assigned courses
    const relevantStudents = role === "teacher" && assignedCourses.length > 0
        ? students.filter(s => assignedCourses.includes(s.course))
        : students;
    const courseCount = role === "teacher" ? assignedCourses.length : [...new Set(students.map(s => s.course))].length;
    const subjectCount = role === "teacher" ? assignedSubjects.length : 0;

    animateCounter("statTotalStudents", relevantStudents.length);
    animateCounter("statActiveCourses", courseCount);
    document.getElementById("statAttendance").textContent = subjectCount > 0 ? `${subjectCount} Subj.` : "N/A";
    document.getElementById("statAssignments").textContent = "—";
}

function animateCounter(id, target) {
    let current = 0;
    const el = document.getElementById(id);
    const step = Math.ceil(target / 50);
    const interval = setInterval(() => {
        current += step;
        if (current >= target) {
            el.textContent = target;
            clearInterval(interval);
        } else {
            el.textContent = current;
        }
    }, 20);
}

// Render Grid Content
function renderStudents(students) {
    const grid = document.getElementById("studentsGrid");
    grid.innerHTML = "";
    
    if (!currentCourse) {
        // RBAC: For teachers, only show assigned courses
        let courses = [...new Set(students.map(s => s.course))];
        if (role === "teacher" && assignedCourses.length > 0) {
            courses = courses.filter(c => assignedCourses.includes(c));
        }
        if (courses.length === 0) return renderEmptyState("No Assigned Courses", "You are not assigned to any active courses yet.");

        courses.forEach(c => {
            const studentCount = students.filter(s => s.course === c).length;
            grid.innerHTML += `
                <div class="glass-card" onclick="navigateToCourse('${c}')" style="cursor:pointer">
                    <i class="fas fa-folder card-icon"></i>
                    <h3>${c}</h3>
                    <p>${studentCount} Enrolled Students</p>
                    <div class="card-footer">
                        <span class="badge">Active</span>
                        <button class="quick-btn">Open →</button>
                    </div>
                </div>`;
        });
    } else if (!currentSection) {
        // Render Section Cards
        const sections = [...new Set(students.filter(s => s.course === currentCourse).map(s => s.section || "A"))];
        sections.forEach(s => {
            grid.innerHTML += `
                <div class="glass-card" onclick="navigateToSection('${s}')" style="cursor:pointer">
                    <i class="fas fa-users card-icon"></i>
                    <h3>Section ${s}</h3>
                    <p>${currentCourse}</p>
                    <div class="card-footer">
                        <span class="badge">Lec Hall A</span>
                        <button class="quick-btn">View Students →</button>
                    </div>
                </div>`;
        });
    } else {
        // Render Student Profiles
        const filtered = students.filter(s => s.course === currentCourse && (s.section || "A") === currentSection);
        filtered.forEach(s => {
            grid.innerHTML += `
                <div class="glass-card" onclick="selectStudent('${s.name}')" style="cursor:pointer">
                    <i class="fas fa-user-circle card-icon"></i>
                    <h3>${s.name}</h3>
                    <p>Roll: ${s.rollNumber}</p>
                    <div class="card-footer">
                        <button class="quick-btn" onclick="event.stopPropagation(); editStudentInfo('${s._id}', '${s.name}', '${s.rollNumber}', '${s.course}', '${s.section || "A"}', '${(s.subjects || []).join(", ")}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="quick-btn" style="background: rgba(0, 240, 255, 0.1);">Manage →</button>
                    </div>
                </div>`;
        });
    }
    updateNav();
}

function renderEmptyState(title = "No Data Available", msg = "You haven't been assigned any courses yet.") {
    const grid = document.getElementById("studentsGrid");
    grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
            <i class="fas fa-folder-open"></i>
            <h3>${title}</h3>
            <p>${msg}</p>
        </div>`;
}

window.navigateToCourse = (c) => { currentCourse = c; renderStudents(allStudents); };
window.navigateToSection = (s) => { currentSection = s; renderStudents(allStudents); };

function updateNav() {
    const btn = document.getElementById("backNavBtn");
    const bread = document.getElementById("breadcrumbNav");
    btn.style.display = currentCourse ? "block" : "none";
    bread.textContent = currentCourse ? (currentSection ? `${currentCourse} / Section ${currentSection}` : currentCourse) : "Enrolled Courses";
}

document.getElementById("backNavBtn").addEventListener("click", () => {
    if (currentSection) currentSection = null; else currentCourse = null;
    renderStudents(allStudents);
});

// Forms Logic - Populate student + teacher's OWN assigned subjects
window.selectStudent = (studentName) => {
    const student = allStudents.find(s => s.name === studentName);
    if (!student) return;

    switchTab("attendance");

    document.getElementById("attendanceStudent").innerHTML = `<option value="${student.name}">${student.name}</option>`;
    document.getElementById("marksStudent").innerHTML = `<option value="${student.name}">${student.name}</option>`;

    document.getElementById("attendanceRoll").value = student.rollNumber;
    document.getElementById("marksRoll").value = student.rollNumber;

    // Use teacher's assigned subjects (filtered to what student also has)
    const studentSubjects = student.subjects || [];
    const teacherSubjects = assignedSubjects.length > 0 ? assignedSubjects : studentSubjects;
    // Intersection: only subjects both teacher teaches and student is enrolled in
    const validSubjects = teacherSubjects.filter(s => studentSubjects.includes(s));
    const fallback = teacherSubjects.length > 0 ? teacherSubjects : studentSubjects;
    const subjectList = validSubjects.length > 0 ? validSubjects : fallback;

    const options = subjectList.length
        ? subjectList.map(sub => `<option value="${sub}">${sub}</option>`).join("")
        : `<option value="" disabled>No matching subjects</option>`;

    const placeholder = `<option value="" disabled selected>Select Subject...</option>`;
    document.getElementById("attendanceSubject").innerHTML = placeholder + options;
    document.getElementById("marksSubject").innerHTML = placeholder + options;
};

// Search Implementation
document.getElementById("searchInput").addEventListener("input", (e) => {
    const val = e.target.value.toLowerCase();
    const filtered = allStudents.filter(s => 
        (s.name || "").toLowerCase().includes(val) || 
        (s.rollNumber || "").toLowerCase().includes(val) || 
        (s.course || "").toLowerCase().includes(val)
    );
    renderStudents(filtered);
});

// ==========================================
// ATTENDANCE FORM SUBMIT
// ==========================================
document.getElementById("attendanceForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const rollNumber = document.getElementById("attendanceRoll").value;
    const subject = document.getElementById("attendanceSubject").value;
    if (!rollNumber) { alert("Please select a student first."); return; }
    if (!subject) { alert("Please select a subject."); return; }

    const data = {
        studentName: document.getElementById("attendanceStudent").value,
        rollNumber,
        course: subject,
        presentClasses: Number(document.getElementById("presentClasses").value),
        totalClasses: Number(document.getElementById("totalClasses").value)
    };

    try {
        const res = await fetch(`${apiBase}/attendance`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (res.ok) {
            alert(`✅ ${result.message}`);
            document.getElementById("attendanceForm").reset();
        } else {
            alert(`❌ ${result.message}`);
        }
    } catch (err) {
        console.error(err);
        alert("Server error. Please try again.");
    }
});

// ==========================================
// MARKS FORM SUBMIT
// ==========================================
document.getElementById("marksForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const rollNumber = document.getElementById("marksRoll").value;
    const subject = document.getElementById("marksSubject").value;
    if (!rollNumber) { alert("Please select a student first."); return; }
    if (!subject) { alert("Please select a subject."); return; }

    const data = {
        studentName: document.getElementById("marksStudent").value,
        rollNumber,
        course: subject,
        marksObtained: Number(document.getElementById("marksObtained").value),
        totalMarks: Number(document.getElementById("totalMarks").value)
    };

    try {
        const res = await fetch(`${apiBase}/marks`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (res.ok) {
            alert(`✅ ${result.message}`);
            document.getElementById("marksForm").reset();
        } else {
            alert(`❌ ${result.message}`);
        }
    } catch (err) {
        console.error(err);
        alert("Server error. Please try again.");
    }
});

// ==========================================
// ASSIGNMENT FORM SUBMIT
// ==========================================
document.getElementById("assignmentForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
        title: document.getElementById("assignmentTitle").value,
        course: document.getElementById("assignmentCourse").value,
        deadline: document.getElementById("assignmentDeadline").value
    };
    try {
        const res = await fetch(`${apiBase}/assignments`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (res.ok) { alert(`✅ ${result.message || "Assignment created!"}`); document.getElementById("assignmentForm").reset(); }
        else { alert(`❌ ${result.message}`); }
    } catch (err) { console.error(err); }
});

// Edit Student
window.editStudentInfo = async (id, oldName, oldRoll, oldCourse, oldSection, oldSubjects) => {
    const name = prompt("Student Name:", oldName) || oldName;
    const rollNumber = prompt("Roll Number:", oldRoll) || oldRoll;
    const subjectsStr = prompt("Subjects (comma separated):", oldSubjects) || oldSubjects;
    const subjects = subjectsStr.split(",").map(s => s.trim()).filter(s => s !== "");
    
    try {
        const res = await fetch(`${apiBase}/students/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name, rollNumber, subjects })
        });
        if (res.ok) { 
            alert("Student info updated! ✅"); 
            fetchStudents(); 
        }
    } catch (e) { console.error(e); }
};

// Initialization
setupUI();
fetchStudents();


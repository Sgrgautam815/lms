// ==========================================
// STUDENT DASHBOARD SUBJECT-WISE LOGIC
// ==========================================

const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const name = localStorage.getItem("name");
const userId = localStorage.getItem("userId");

let mySubjects = []; // Global store for subject data

console.log("--- DASHBOARD INITIAL LOAD ---");
console.log("Token Present:", !!token);
console.log("Role:", role);
console.log("UserID:", userId);

// Redirect if not logged in or wrong role
if (!token || role !== "student") {
    console.warn("⚠️ Authentication missing or invalid role. Redirecting...");
    window.location.href = "../index.html";
}

// Initial UI Setup
function setupUI() {
    document.getElementById("userNameDisplay").textContent = name;
    document.getElementById("userInitial").textContent = name ? name.charAt(0).toUpperCase() : "S";
}

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "../index.html";
});

// Section Switching
window.showStudentTab = (tab, btn) => {
    document.querySelectorAll(".student-tab-content").forEach(el => el.style.display = "none");
    document.querySelectorAll(".nav-link").forEach(b => b.classList.remove("active"));
    const target = document.getElementById(`studentTab${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
    if (target) target.style.display = "block";
    if (btn) btn.classList.add("active");
};

// ==========================================
// API HELPER
// ==========================================

async function apiFetch(endpoint) {
    const apiBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
        ? 'http://localhost:3000'
        : 'https://lms-dra8.onrender.com';
    const url = endpoint.startsWith("http") ? endpoint : `${apiBase}${endpoint}`;
    
    console.log(`🚀 API CALL: ${url}`);
    
    try {
        const response = await fetch(url, {
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (response.status === 401) {
            console.error("❌ Session expired or Unauthorized. Logging out...");
            alert("Session expired. Please login again.");
            localStorage.clear();
            window.location.href = "../index.html";
            return null;
        }

        const data = await response.json();
        console.log(`✅ API RESPONSE [${url}]:`, data);
        return data;
    } catch (err) {
        console.error(`❌ API ERROR [${url}]:`, err);
        return null;
    }
}

// ==========================================
// DATA LOADING
// ==========================================

async function loadDashboardData() {
    const subjectsGrid = document.getElementById("enrolledSubjectsGrid");
    const marksGrid = document.getElementById("studentMarksGrid");
    const attGrid = document.getElementById("studentAttendanceGrid");
    const assignGrid = document.getElementById("studentAssignmentsGrid");

    const collegeId = localStorage.getItem("collegeId");

    try {
        let me = null;

        // 1. Try to load profile by College ID first
        if (collegeId) {
            me = await apiFetch(`/student/${collegeId}`);
        }

        // 2. Fallback: load from student list by name match
        if (!me) {
            const students = await apiFetch("/students");
            if (Array.isArray(students)) {
                me = students.find(s => s.name?.toLowerCase() === name?.toLowerCase()) || null;
            }
        }

        if (me) {
            mySubjects = me.subjects || [];
            document.getElementById("userNameDisplay").textContent = me.name || name;
            document.getElementById("userInitial").textContent = (me.name || name || "S").charAt(0).toUpperCase();
            document.getElementById("profileCollegeId").textContent = me.rollNumber || collegeId || "---";
            document.getElementById("profileCourse").textContent = me.course || "---";
            document.getElementById("userCourseDisplay").textContent = me.course || "General";
            localStorage.setItem("subjects", JSON.stringify(mySubjects));
        } else {
            console.warn("Could not load student profile.");
        }

        // 3. Load Marks, Attendance & Assignments in Parallel
        const [allMarks, allAtt, allAssign] = await Promise.all([
            apiFetch("/marks"),
            apiFetch("/attendance"),
            apiFetch("/assignments")
        ]);

        const myMarks = Array.isArray(allMarks) ? allMarks : [];
        const myAtt = Array.isArray(allAtt) ? allAtt : [];
        const safeAssign = Array.isArray(allAssign) ? allAssign : [];

        renderSubjects(myMarks, myAtt);
        renderSubjectWiseMarks(myMarks);
        renderSubjectWiseAttendance(myAtt);
        renderAssignments(safeAssign);
        renderTimetable();

    } catch (e) {
        console.error("Dashboard Load Error:", e);
        const errorMsg = `<div class="empty-state"><h3>⚠️ Failed to load dashboard.</h3><p>Please check your connection or try logging in again.</p></div>`;
        if (subjectsGrid) subjectsGrid.innerHTML = errorMsg;
        if (marksGrid) marksGrid.innerHTML = errorMsg;
        if (attGrid) attGrid.innerHTML = errorMsg;
    }
}

function renderSubjects(marks, attendance) {
    const grid = document.getElementById("enrolledSubjectsGrid");
    if (mySubjects.length === 0) {
        grid.innerHTML = `<div class="empty-state"><h3>No Subjects Assigned 📋</h3><p>Please contact admin to enroll in courses.</p></div>`;
        return;
    }

    grid.innerHTML = mySubjects.map(sub => {
        const markData = marks.find(m => m.course?.toLowerCase() === sub.toLowerCase());
        const attData = attendance.find(r => r.course?.toLowerCase() === sub.toLowerCase());
        
        const mPct = markData && markData.totalMarks > 0 ? ((markData.marksObtained / markData.totalMarks) * 100).toFixed(0) : 0;
        const aPct = attData ? attData.attendancePercentage : 0;

        return `
            <div class="student-mark-card subject-card">
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:15px;">
                    <span style="font-size:24px;">📚</span>
                    <div style="text-align:right;">
                        <div style="font-size:12px; color:var(--text-muted);">Overall Progress</div>
                        <div style="font-weight:700; color:var(--primary-cyan);">${Math.max(mPct, aPct)}%</div>
                    </div>
                </div>
                <h3 style="margin-bottom:20px;">${sub}</h3>
                
                <div style="margin-bottom:15px;">
                    <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:5px;">
                        <span>Attendance</span>
                        <span>${aPct}%</span>
                    </div>
                    <div class="progress-container" style="margin-top:0; height:4px;">
                        <div class="progress-bar attendance" style="width: ${aPct}%"></div>
                    </div>
                </div>

                <div>
                    <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:5px;">
                        <span>Academic Performance</span>
                        <span>${mPct}%</span>
                    </div>
                    <div class="progress-container" style="margin-top:0; height:4px;">
                        <div class="progress-bar marks" style="width: ${mPct}%"></div>
                    </div>
                </div>
            </div>`;
    }).join("");
}

function renderSubjectWiseMarks(marks) {
    const grid = document.getElementById("studentMarksGrid");
    if (mySubjects.length === 0) {
        grid.innerHTML = `<div class="empty-state">No subjects enrolled.</div>`;
        return;
    }

    grid.innerHTML = mySubjects.map(sub => {
        const data = marks.find(m => m.course?.toLowerCase() === sub.toLowerCase());
        const obtained = data ? data.marksObtained : 0;
        const total = data ? data.totalMarks : 0;
        const pct = total > 0 ? ((obtained / total) * 100).toFixed(1) : 0;

        return `
            <div class="student-mark-card subject-card">
                <div class="card-badge marks-badge">${pct}%</div>
                <h3>${sub}</h3>
                <p>Marks: <strong>${obtained} / ${total}</strong></p>
                <div class="progress-container">
                    <div class="progress-bar marks" style="width: ${pct}%"></div>
                </div>
            </div>`;
    }).join("");
}

function renderSubjectWiseAttendance(attendance) {
    const grid = document.getElementById("studentAttendanceGrid");
    if (mySubjects.length === 0) {
        grid.innerHTML = `<div class="empty-state">No subjects enrolled.</div>`;
        return;
    }

    let totalPercentage = 0;
    grid.innerHTML = mySubjects.map(sub => {
        const data = attendance.find(r => r.course?.toLowerCase() === sub.toLowerCase());
        const present = data ? data.presentClasses : 0;
        const total = data ? data.totalClasses : 0;
        const pct = data ? data.attendancePercentage : 0;
        totalPercentage += parseFloat(pct);

        return `
            <div class="student-mark-card subject-card">
                <div class="card-badge att-badge">${pct}%</div>
                <h3>${sub}</h3>
                <p>Presence: <strong>${present} / ${total}</strong></p>
                <div class="progress-container">
                    <div class="progress-bar attendance" style="width: ${pct}%"></div>
                </div>
            </div>`;
    }).join("");

    // Update Profile Card
    const avg = mySubjects.length > 0 ? (totalPercentage / mySubjects.length).toFixed(1) : 0;
    document.getElementById("profileAttendance").textContent = `${avg}%`;
}

function renderAssignments(all) {
    const grid = document.getElementById("studentAssignmentsGrid");
    grid.innerHTML = all.length ? all.map(a => `
        <div class="student-mark-card assignment-card">
            <h3>${a.title}</h3>
            <p>📚 Course: ${a.course}</p>
            <p style="color:var(--primary-cyan); margin-top:10px;">⏰ Deadline: ${new Date(a.deadline).toLocaleDateString()}</p>
        </div>`).join("") : `<div class="empty-state">No pending assignments.</div>`;
}

function renderTimetable() {
    const tbody = document.getElementById("timetableBody");
    const schedule = [
        { time: "09:00 - 10:00", mon: "Mathematics", tue: "Physics", wed: "Chemistry", thu: "Mathematics", fri: "Comp Science", sat: "Lab" },
        { time: "10:00 - 11:00", mon: "Physics", tue: "Mathematics", wed: "Comp Science", thu: "Chemistry", fri: "Physics", sat: "Lab" },
    ];
    tbody.innerHTML = schedule.map(row => `<tr><td>${row.time}</td><td>${row.mon}</td><td>${row.tue}</td><td>${row.wed}</td><td>${row.thu}</td><td>${row.fri}</td><td>${row.sat}</td></tr>`).join("");
}

// Init
setupUI();
loadDashboardData();


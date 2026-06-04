/**
 * ADMIN DASHBOARD — CORE LOGIC
 * Handles stats, user management, course assignments, and analytics.
 */

(function () {
    'use strict';

    const API = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
        ? 'http://localhost:3000'
        : 'https://lms-dra8.onrender.com';
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    // ── 1. SECURITY GUARD ─────────────────────────────────────
    if (!token || role !== 'admin') {
        console.error('🚫 Unauthorized access attempt to Admin Dashboard.');
        localStorage.clear();
        window.location.replace('login.html');
        return;
    }

    // ── 2. GLOBAL STATE ───────────────────────────────────────
    let state = {
        stats: {},
        students: [],
        teachers: [],
        attendance: [],
        marks: [],
        assignments: [],
        complaints: [],
        currentTeacher: null // For assignment modal
    };

    // ── 3. INITIALIZATION ─────────────────────────────────────
    window.addEventListener('DOMContentLoaded', () => {
        setupUI();
        fetchAllData();
    });

    function setupUI() {
        const name = localStorage.getItem('name') || 'Administrator';
        document.getElementById('sidebarName').textContent = name;
        document.getElementById('sidebarInitial').textContent = name.charAt(0);
        document.getElementById('topbarSub').textContent = `Welcome back, ${name.split(' ')[0]}`;

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.clear();
            window.location.replace('login.html');
        });
    }

    // ── 4. DATA FETCHING ──────────────────────────────────────
    async function fetchAllData() {
        showLoadingState();
        try {
            const [statsRes, teachersRes, studentsRes, attRes, marksRes, assignRes, compRes] = await Promise.all([
                fetchAPI('/admin/stats'),
                fetchAPI('/admin/teachers'),
                fetchAPI('/admin/users'), // Students only
                fetchAPI('/attendance'),
                fetchAPI('/marks'),
                fetchAPI('/assignments'),
                fetchAPI('/admin/complaints')
            ]);

            state.stats = statsRes;
            state.teachers = teachersRes;
            state.students = studentsRes;
            state.attendance = attRes;
            state.marks = marksRes;
            state.assignments = assignRes;
            state.complaints = compRes;

            renderAll();
        } catch (err) {
            console.error('❌ Data load error:', err);
        }
    }

    async function fetchAPI(endpoint) {
        const res = await fetch(`${API}${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401 || res.status === 403) {
            localStorage.clear();
            window.location.replace('login.html');
            return [];
        }
        return await res.json();
    }

    function showLoadingState() {
        // Simple shimmer or loading text
        const tables = ['studentsTbody', 'teachersTbody', 'attendanceTbody', 'marksTbody', 'assignmentsTbody', 'complaintsTbody'];
        tables.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = `<tr><td colspan="10" class="empty-state"><div class="spinner"></div><p>Fetching latest data…</p></td></tr>`;
        });
    }

    // ── 5. RENDERING ──────────────────────────────────────────
    function renderAll() {
        renderStats();
        renderRecentOverview();
        renderStudentsTable();
        renderTeachersTable();
        renderCoursesTable();
        renderAttendanceTable();
        renderMarksTable();
        renderAssignmentsTable();
        renderComplaintsTable();
    }

    function renderStats() {
        const s = state.stats;
        document.getElementById('statStudents').textContent = s.totalStudents || 0;
        document.getElementById('statTeachers').textContent = s.totalTeachers || 0;
        document.getElementById('statCourses').textContent = s.totalCourses || 0;
        document.getElementById('statAttendance').textContent = `${s.avgAttendance || 0}%`;
        document.getElementById('statAssignments').textContent = s.totalAssignments || 0;
    }

    function renderRecentOverview() {
        // Recent 5 students
        const recentStuds = state.students.slice(-5).reverse();
        const studBody = document.getElementById('recentStudentsTbody');
        studBody.innerHTML = recentStuds.length 
            ? recentStuds.map(s => `<tr><td>${s.name}</td><td>${s.collegeId}</td><td><span class="badge badge-blue">${s.course}</span></td></tr>`).join('')
            : '<tr><td colspan="3" class="empty-state">No students found</td></tr>';

        // Recent 5 teachers
        const recentTeachs = state.teachers.slice(-5).reverse();
        const teachBody = document.getElementById('recentTeachersTbody');
        teachBody.innerHTML = recentTeachs.length 
            ? recentTeachs.map(t => `<tr><td>${t.name}</td><td>${t.department}</td><td>${t.assignedCourses.length} Courses</td></tr>`).join('')
            : '<tr><td colspan="3" class="empty-state">No teachers found</td></tr>';
    }

    function renderStudentsTable(data = state.students) {
        const tbody = document.getElementById('studentsTbody');
        document.getElementById('studentCount').textContent = `${data.length} students enrolled`;
        
        tbody.innerHTML = data.length 
            ? data.map((s, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td style="font-weight:600;">${s.name}</td>
                    <td><code>${s.collegeId}</code></td>
                    <td><span class="badge badge-blue">${s.course}</span></td>
                    <td>Section ${s.section || 'A'}</td>
                    <td>
                        <div class="pill-list">
                            ${(s.subjects || []).map(sub => `<span class="pill">${sub}</span>`).join('')}
                        </div>
                    </td>
                    <td style="display:flex; gap:8px;">
                        <button class="action-btn btn-edit" onclick="openEditStudentModal('${s.collegeId}')" title="Edit Student">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn btn-delete" onclick="confirmDeleteStudent('${s.collegeId}', '${s.name}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `).join('')
            : '<tr><td colspan="7" class="empty-state"><i class="fas fa-user-slash"></i><p>No matching students found.</p></td></tr>';
    }

    function renderTeachersTable(data = state.teachers) {
        const tbody = document.getElementById('teachersTbody');
        document.getElementById('teacherCount').textContent = `${data.length} faculty members registered`;

        tbody.innerHTML = data.length 
            ? data.map((t, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td style="font-weight:600;">${t.name}</td>
                    <td><code>${t.teacherId}</code></td>
                    <td><span class="badge badge-amber">${t.department}</span></td>
                    <td>
                        <div class="pill-list">
                            ${(t.assignedCourses || []).map(c => `<span class="pill">${c}</span>`).join('')}
                        </div>
                    </td>
                    <td>
                        <div class="pill-list">
                            ${(t.assignedSubjects || []).map(s => `<span class="pill">${s}</span>`).join('')}
                        </div>
                    </td>
                    <td style="display:flex; gap:8px;">
                        <button class="action-btn btn-edit" onclick="openEditTeacherModal('${t._id}')" title="Edit Profile">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn btn-assign" onclick="openAssignModal('${t._id}')" title="Assign Courses">
                            <i class="fas fa-tasks"></i> Assign
                        </button>
                        <button class="action-btn btn-delete" onclick="confirmDeleteTeacher('${t._id}', '${t.name}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `).join('')
            : '<tr><td colspan="7" class="empty-state"><i class="fas fa-user-tie"></i><p>No matching teachers found.</p></td></tr>';
    }

    function renderCoursesTable() {
        const tbody = document.getElementById('coursesTbody');
        const coursesMap = {};
        state.students.forEach(s => {
            if (!coursesMap[s.course]) coursesMap[s.course] = { count: 0, sections: new Set() };
            coursesMap[s.course].count++;
            coursesMap[s.course].sections.add(s.section || 'A');
        });

        const courses = Object.keys(coursesMap);
        tbody.innerHTML = courses.length 
            ? courses.map((c, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td style="font-weight:600;">${c}</td>
                    <td><span class="badge badge-green">${coursesMap[c].count} Students</span></td>
                    <td>${Array.from(coursesMap[c].sections).map(sec => `<span class="pill">Sec ${sec}</span>`).join(' ')}</td>
                </tr>
            `).join('')
            : '<tr><td colspan="4" class="empty-state">No courses with students found.</td></tr>';
    }

    function renderAttendanceTable(data = state.attendance) {
        const tbody = document.getElementById('attendanceTbody');
        document.getElementById('attendanceCount').textContent = `${data.length} records found`;

        tbody.innerHTML = data.length 
            ? data.map((a, i) => {
                const perc = parseFloat(a.attendancePercentage || 0);
                const color = perc < 75 ? 'red' : 'green';
                return `
                    <tr>
                        <td>${i + 1}</td>
                        <td style="font-weight:600;">${a.studentName}</td>
                        <td><code>${a.rollNumber}</code></td>
                        <td>${a.course}</td>
                        <td>${a.presentClasses}</td>
                        <td>${a.totalClasses}</td>
                        <td><span class="badge badge-${color}">${perc}%</span></td>
                        <td>
                            <button class="action-btn btn-edit" onclick="openEditAttendanceModal('${a.rollNumber}', '${a.course}')" title="Edit Attendance">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                        </td>
                    </tr>
                `;
            }).join('')
            : '<tr><td colspan="7" class="empty-state">No attendance data.</td></tr>';
    }

    function renderMarksTable(data = state.marks) {
        const tbody = document.getElementById('marksTbody');
        document.getElementById('marksCount').textContent = `${data.length} grades recorded`;

        tbody.innerHTML = data.length 
            ? data.map((m, i) => {
                const perc = m.totalMarks > 0 ? (m.marksObtained / m.totalMarks) * 100 : 0;
                let grade = 'F';
                if (perc >= 90) grade = 'A+';
                else if (perc >= 80) grade = 'A';
                else if (perc >= 70) grade = 'B';
                else if (perc >= 60) grade = 'C';
                else if (perc >= 50) grade = 'D';

                return `
                    <tr>
                        <td>${i + 1}</td>
                        <td style="font-weight:600;">${m.studentName}</td>
                        <td><code>${m.rollNumber}</code></td>
                        <td>${m.course}</td>
                        <td>${m.marksObtained}</td>
                        <td>${m.totalMarks}</td>
                        <td><span class="badge badge-${perc >= 50 ? 'green' : 'red'}">${grade}</span></td>
                        <td>
                            <button class="action-btn btn-edit" onclick="openEditMarksModal('${m.rollNumber}', '${m.course}')" title="Edit Mark">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                        </td>
                    </tr>
                `;
            }).join('')
            : '<tr><td colspan="7" class="empty-state">No marks data.</td></tr>';
    }

    function renderAssignmentsTable() {
        const tbody = document.getElementById('assignmentsTbody');
        document.getElementById('assignmentCount').textContent = `${state.assignments.length} total assignments`;

        tbody.innerHTML = state.assignments.length 
            ? state.assignments.map((a, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td style="font-weight:600;">${a.title}</td>
                    <td><span class="badge badge-purple">${a.course}</span></td>
                    <td>${new Date(a.deadline).toLocaleDateString()}</td>
                    <td><span class="badge badge-amber">Active</span></td>
                    <td>
                        <button class="action-btn btn-edit" onclick="openEditAssignmentModal('${a._id}')" title="Edit Assignment">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </td>
                </tr>
            `).join('')
            : '<tr><td colspan="5" class="empty-state">No assignments created.</td></tr>';
    }

    function renderComplaintsTable() {
        const tbody = document.getElementById('complaintsTbody');
        document.getElementById('complaintCount').textContent = `${state.complaints.length} tickets`;

        tbody.innerHTML = state.complaints.length
            ? state.complaints.map(c => {
                const date = new Date(c.createdAt).toLocaleDateString();
                const isResolved = c.status === 'resolved';
                const statusBadge = isResolved ? `<span class="badge badge-green">Resolved</span>` : `<span class="badge badge-amber">Pending</span>`;
                const btn = isResolved ? `<button disabled class="action-btn" style="opacity:0.5;">Resolved</button>` : `<button class="action-btn btn-assign" onclick="resolveComplaint('${c._id}')">Resolve</button>`;
                
                return `
                <tr>
                    <td>${date}</td>
                    <td style="font-weight:600;">${c.name}<br><small style="color:rgba(255,255,255,0.4)">${c.email}</small></td>
                    <td><span class="badge badge-blue">${c.role}</span></td>
                    <td style="max-width:250px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${c.message}">${c.message}</td>
                    <td>${statusBadge}</td>
                    <td>${btn}</td>
                </tr>
                `;
            }).join('')
            : '<tr><td colspan="6" class="empty-state">No complaints found.</td></tr>';
    }

    // ── 6. NAVIGATION & SEARCH ──────────────────────────────
    window.showSection = (sectionId) => {
        // Hide all
        document.querySelectorAll('section').forEach(s => s.style.display = 'none');
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

        // Show target
        document.getElementById(`section-${sectionId}`).style.display = 'block';
        document.getElementById(`nav-${sectionId}`).classList.add('active');

        // Update topbar
        const titles = {
            overview: 'Dashboard Overview',
            students: 'Student Management',
            teachers: 'Teacher Management',
            courses: 'Course Overview',
            attendance: 'Attendance Analytics',
            marks: 'Grade Management',
            assignments: 'Assignments List',
            complaints: 'Support & Complaints',
            setup: 'Admin System Setup'
        };
        document.getElementById('topbarTitle').textContent = titles[sectionId] || 'Admin Panel';
    };

    window.handleGlobalSearch = (val) => {
        val = val.toLowerCase();
        // If searching globally, we could jump to sections, but for now let's just filter students/teachers
        filterStudents(val);
        filterTeachers(val);
    };

    window.filterStudents = () => {
        const q = document.getElementById('studentSearch').value.toLowerCase();
        const c = document.getElementById('studentCourseFilter').value.toLowerCase();
        const filtered = state.students.filter(s => 
            (s.name.toLowerCase().includes(q) || s.collegeId.toLowerCase().includes(q)) &&
            (s.course.toLowerCase().includes(c))
        );
        renderStudentsTable(filtered);
    };

    window.filterTeachers = () => {
        const q = document.getElementById('teacherSearch').value.toLowerCase();
        const d = document.getElementById('teacherDeptFilter').value.toLowerCase();
        const filtered = state.teachers.filter(t => 
            (t.name.toLowerCase().includes(q) || t.teacherId.toLowerCase().includes(q)) &&
            (t.department.toLowerCase().includes(d))
        );
        renderTeachersTable(filtered);
    };

    window.refreshAll = () => {
        fetchAllData();
    };

    // ── 7. TEACHER ASSIGNMENT MODAL ───────────────────────────
    const COURSES = ['BTECH CSE', 'BTECH ME', 'BTECH ECE', 'BCA', 'MCA', 'MBA'];
    const SUBJECTS = [
        'Mathematics', 'Physics', 'DBMS', 'Operating System', 'Computer Networks', 
        'Thermodynamics', 'Machine Design', 'Digital Electronics', 'Microprocessors', 
        'C Programming', 'Data Structures', 'Machine Learning', 'Cloud Computing', 
        'Accounting', 'Marketing', 'Economics'
    ];

    window.openAssignModal = (teacherId) => {
        const teacher = state.teachers.find(t => t._id === teacherId);
        if (!teacher) return;

        state.currentTeacher = teacher;
        document.getElementById('assignTeacherName').textContent = `Assigning to: ${teacher.name} (${teacher.department})`;

        // Render Course Grid
        const cGrid = document.getElementById('assignCourseGrid');
        cGrid.innerHTML = COURSES.map(c => `
            <label class="check-item ${teacher.assignedCourses.includes(c) ? 'checked' : ''}">
                <input type="checkbox" value="${c}" ${teacher.assignedCourses.includes(c) ? 'checked' : ''} onchange="this.parentElement.classList.toggle('checked', this.checked)">
                ${c}
            </label>
        `).join('');

        // Render Subject Grid
        const sGrid = document.getElementById('assignSubjectGrid');
        sGrid.innerHTML = SUBJECTS.map(s => `
            <label class="check-item ${teacher.assignedSubjects.includes(s) ? 'checked' : ''}">
                <input type="checkbox" value="${s}" ${teacher.assignedSubjects.includes(s) ? 'checked' : ''} onchange="this.parentElement.classList.toggle('checked', this.checked)">
                ${s}
            </label>
        `).join('');

        document.getElementById('assignModal').style.display = 'flex';
    };

    window.saveAssignment = async () => {
        if (!state.currentTeacher) return;

        const selCourses = [...document.querySelectorAll('#assignCourseGrid input:checked')].map(i => i.value);
        const selSubjects = [...document.querySelectorAll('#assignSubjectGrid input:checked')].map(i => i.value);

        try {
            const res = await fetch(`${API}/admin/teachers/${state.currentTeacher._id}/assign`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ assignedCourses: selCourses, assignedSubjects: selSubjects })
            });

            if (res.ok) {
                alert('Assignments updated successfully! ✅');
                document.getElementById('assignModal').style.display = 'none';
                fetchAllData();
            } else {
                alert('Failed to update assignments.');
            }
        } catch (err) {
            console.error(err);
            alert('Error connecting to server.');
        }
    };

    // ── 7.5. TEACHER EDIT MODAL ───────────────────────────────
    window.openEditTeacherModal = (teacherId) => {
        const teacher = state.teachers.find(t => t._id === teacherId);
        if (!teacher) return;

        document.getElementById('editTeacherId').value = teacher._id;
        document.getElementById('editTeacherName').value = teacher.name || '';
        document.getElementById('editTeacherEmail').value = teacher.email || '';
        document.getElementById('editTeacherPassword').value = ''; // Always starts empty
        document.getElementById('editTeacherPhone').value = teacher.phone || '';
        document.getElementById('editTeacherDept').value = teacher.department || '';
        document.getElementById('editTeacherQual').value = teacher.qualification || '';
        document.getElementById('editTeacherExp').value = teacher.experience || '';

        document.getElementById('editTeacherModal').style.display = 'flex';
    };

    window.saveTeacherProfile = async () => {
        const id = document.getElementById('editTeacherId').value;
        const name = document.getElementById('editTeacherName').value.trim();
        const email = document.getElementById('editTeacherEmail').value.trim();
        const password = document.getElementById('editTeacherPassword').value;
        const phone = document.getElementById('editTeacherPhone').value.trim();
        const department = document.getElementById('editTeacherDept').value.trim();
        const qualification = document.getElementById('editTeacherQual').value.trim();
        const experience = document.getElementById('editTeacherExp').value.trim();

        if (!name || !email || !department) {
            alert('Name, Email, and Department are required.');
            return;
        }

        const payload = { name, email, phone, department, qualification, experience };
        if (password) {
            if (password.length < 6) {
                alert('Password must be at least 6 characters long.');
                return;
            }
            payload.password = password;
        }

        try {
            const res = await fetch(`${API}/admin/teachers/${id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                alert(data.message || 'Profile updated successfully! ✅');
                document.getElementById('editTeacherModal').style.display = 'none';
                fetchAllData();
            } else {
                alert(data.message || 'Failed to update teacher profile.');
            }
        } catch (err) {
            console.error(err);
            alert('Error connecting to server.');
        }
    };

    // ── 8. DELETE OPERATIONS ──────────────────────────────────
    window.confirmDeleteTeacher = (id, name) => {
        const modal = document.getElementById('confirmModal');
        document.getElementById('confirmMsg').textContent = `Are you sure you want to delete Professor ${name}? This will remove their account permanently.`;
        modal.style.display = 'flex';
        
        document.getElementById('confirmOkBtn').onclick = async () => {
            try {
                const res = await fetch(`${API}/admin/teachers/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    modal.style.display = 'none';
                    fetchAllData();
                }
            } catch (err) { console.error(err); }
        };
    };

    window.confirmDeleteStudent = (roll, name) => {
        const modal = document.getElementById('confirmModal');
        document.getElementById('confirmMsg').textContent = `Delete student ${name} (${roll})? This will also remove all their attendance and mark records.`;
        modal.style.display = 'flex';
        
        document.getElementById('confirmOkBtn').onclick = async () => {
            try {
                const res = await fetch(`${API}/admin/students/${roll}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    modal.style.display = 'none';
                    fetchAllData();
                }
            } catch (err) { console.error(err); }
        };
    };

    window.resolveComplaint = async (id) => {
        if (!confirm("Mark this ticket as resolved?")) return;
        try {
            const res = await fetch(`${API}/admin/complaints/${id}/resolve`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchAllData();
        } catch (err) { console.error(err); }
    };

    // ── 9. ADMIN SETUP (CREATE NEW ADMIN) ─────────────────────
    window.createAdmin = async () => {
        const name = document.getElementById('setupName').value.trim();
        const email = document.getElementById('setupEmail').value.trim();
        const password = document.getElementById('setupPassword').value;
        const setupKey = document.getElementById('setupKey').value;
        const msg = document.getElementById('setupMsg');

        if (!name || !email || !password || !setupKey) {
            msg.style.color = '#ff4757';
            msg.textContent = 'Please fill all setup fields.';
            return;
        }

        try {
            const res = await fetch(`${API}/admin-register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, setupKey })
            });
            const data = await res.json();
            if (res.ok) {
                msg.style.color = '#2ed573';
                msg.textContent = 'Admin account created successfully! ✅';
                // Reset form
                document.getElementById('setupName').value = '';
                document.getElementById('setupEmail').value = '';
                document.getElementById('setupPassword').value = '';
                document.getElementById('setupKey').value = '';
            } else {
                msg.style.color = '#ff4757';
                msg.textContent = data.message || 'Setup failed.';
            }
        } catch (err) {
            msg.style.color = '#ff4757';
            msg.textContent = 'Server error.';
        }
    };

    // ── Student Edit Modal ───────────────────────────────
    window.openEditStudentModal = (collegeId) => {
        const student = state.students.find(s => s.collegeId === collegeId);
        if (!student) return;

        document.getElementById('editStudentId').value = student._id;
        document.getElementById('editStudentRoll').value = student.collegeId;
        document.getElementById('editStudentName').value = student.name || '';
        document.getElementById('editStudentEmail').value = student.email || '';
        document.getElementById('editStudentPassword').value = '';
        document.getElementById('editStudentCourse').value = student.course || '';
        document.getElementById('editStudentSection').value = student.section || 'A';
        document.getElementById('editStudentSubjects').value = (student.subjects || []).join(', ');

        document.getElementById('editStudentModal').style.display = 'flex';
    };

    window.saveStudentProfile = async () => {
        const id = document.getElementById('editStudentId').value;
        const collegeId = document.getElementById('editStudentRoll').value;
        const name = document.getElementById('editStudentName').value.trim();
        const email = document.getElementById('editStudentEmail').value.trim();
        const password = document.getElementById('editStudentPassword').value;
        const course = document.getElementById('editStudentCourse').value.trim();
        const section = document.getElementById('editStudentSection').value.trim();
        const subjectsStr = document.getElementById('editStudentSubjects').value;
        const subjects = subjectsStr.split(',').map(s => s.trim()).filter(s => s !== '');

        if (!name || !email || !course) {
            alert('Name, Email, and Course are required.');
            return;
        }

        const payload = { name, email, course, section, subjects };
        if (password) {
            if (password.length < 6) {
                alert('Password must be at least 6 characters long.');
                return;
            }
            payload.password = password;
        }

        try {
            const res = await fetch(`${API}/users/${collegeId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                alert('Student profile updated successfully! ✅');
                document.getElementById('editStudentModal').style.display = 'none';
                fetchAllData();
            } else {
                alert(data.message || 'Failed to update student profile.');
            }
        } catch (err) {
            console.error(err);
            alert('Error connecting to server.');
        }
    };

    // ── Attendance Edit Modal ────────────────────────────
    window.openEditAttendanceModal = (rollNumber, course) => {
        const record = state.attendance.find(a => a.rollNumber === rollNumber && a.course === course);
        if (!record) return;

        document.getElementById('editAttendanceRoll').value = record.rollNumber;
        document.getElementById('editAttendanceSubject').value = record.course;
        document.getElementById('editAttendanceName').value = record.studentName || '';
        document.getElementById('editPresentClasses').value = record.presentClasses || 0;
        document.getElementById('editTotalClasses').value = record.totalClasses || 0;

        document.getElementById('editAttendanceInfo').textContent = `Student: ${record.studentName} | Subject: ${record.course}`;
        document.getElementById('editAttendanceModal').style.display = 'flex';
    };

    window.saveAttendanceRecord = async () => {
        const rollNumber = document.getElementById('editAttendanceRoll').value;
        const course = document.getElementById('editAttendanceSubject').value;
        const studentName = document.getElementById('editAttendanceName').value;
        const presentClasses = Number(document.getElementById('editPresentClasses').value);
        const totalClasses = Number(document.getElementById('editTotalClasses').value);

        if (presentClasses < 0 || totalClasses < 0 || presentClasses > totalClasses) {
            alert('Invalid class count values.');
            return;
        }

        try {
            const res = await fetch(`${API}/attendance`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ rollNumber, course, studentName, presentClasses, totalClasses })
            });

            const data = await res.json();
            if (res.ok) {
                alert('Attendance updated successfully! ✅');
                document.getElementById('editAttendanceModal').style.display = 'none';
                fetchAllData();
            } else {
                alert(data.message || 'Failed to update attendance.');
            }
        } catch (err) {
            console.error(err);
            alert('Error connecting to server.');
        }
    };

    // ── Marks Edit Modal ─────────────────────────────────
    window.openEditMarksModal = (rollNumber, course) => {
        const record = state.marks.find(m => m.rollNumber === rollNumber && m.course === course);
        if (!record) return;

        document.getElementById('editMarksRoll').value = record.rollNumber;
        document.getElementById('editMarksSubject').value = record.course;
        document.getElementById('editMarksName').value = record.studentName || '';
        document.getElementById('editMarksObtained').value = record.marksObtained || 0;
        document.getElementById('editMarksTotal').value = record.totalMarks || 0;

        document.getElementById('editMarksInfo').textContent = `Student: ${record.studentName} | Subject: ${record.course}`;
        document.getElementById('editMarksModal').style.display = 'flex';
    };

    window.saveMarksRecord = async () => {
        const rollNumber = document.getElementById('editMarksRoll').value;
        const course = document.getElementById('editMarksSubject').value;
        const studentName = document.getElementById('editMarksName').value;
        const marksObtained = Number(document.getElementById('editMarksObtained').value);
        const totalMarks = Number(document.getElementById('editMarksTotal').value);

        if (marksObtained < 0 || totalMarks < 0 || marksObtained > totalMarks) {
            alert('Invalid mark values.');
            return;
        }

        try {
            const res = await fetch(`${API}/marks`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ rollNumber, course, studentName, marksObtained, totalMarks })
            });

            const data = await res.json();
            if (res.ok) {
                alert('Marks updated successfully! ✅');
                document.getElementById('editMarksModal').style.display = 'none';
                fetchAllData();
            } else {
                alert(data.message || 'Failed to update marks.');
            }
        } catch (err) {
            console.error(err);
            alert('Error connecting to server.');
        }
    };

    // ── Assignment Edit Modal ────────────────────────────
    window.openEditAssignmentModal = (assignmentId) => {
        const assignment = state.assignments.find(a => a._id === assignmentId);
        if (!assignment) return;

        document.getElementById('editAssignmentId').value = assignment._id;
        document.getElementById('editAssignmentTitle').value = assignment.title || '';
        document.getElementById('editAssignmentCourse').value = assignment.course || '';
        
        // Format date local: YYYY-MM-DDTHH:MM
        if (assignment.deadline) {
            const date = new Date(assignment.deadline);
            const pad = (num) => String(num).padStart(2, '0');
            const formatted = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
            document.getElementById('editAssignmentDeadline').value = formatted;
        } else {
            document.getElementById('editAssignmentDeadline').value = '';
        }

        document.getElementById('editAssignmentModal').style.display = 'flex';
    };

    window.saveAssignmentDetails = async () => {
        const id = document.getElementById('editAssignmentId').value;
        const title = document.getElementById('editAssignmentTitle').value.trim();
        const course = document.getElementById('editAssignmentCourse').value.trim();
        const deadline = document.getElementById('editAssignmentDeadline').value;

        if (!title || !course || !deadline) {
            alert('All fields are required.');
            return;
        }

        try {
            const res = await fetch(`${API}/assignments/${id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, course, deadline })
            });

            const data = await res.json();
            if (res.ok) {
                alert('Assignment updated successfully! ✅');
                document.getElementById('editAssignmentModal').style.display = 'none';
                fetchAllData();
            } else {
                alert(data.message || 'Failed to update assignment.');
            }
        } catch (err) {
            console.error(err);
            alert('Error connecting to server.');
        }
    };

    // Helper to close modals on outside click
    window.closeModal = (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.style.display = 'none';
        }
    };

})();


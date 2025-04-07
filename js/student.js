// 获取当前周数（单周/双周）
function getCurrentWeek() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil((((now - start) / 86400000) + start.getDay() + 1) / 7);
    return week % 2 === 0 ? 'even' : 'odd';
}

// 加载课程表
async function loadTimetable(weekType = 'odd') {
    try {
        const response = await fetch('http://localhost:3000/api/courses');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const courses = await response.json();
        
        // 清空课程表
        const timetable = document.querySelector('.timetable');
        if (!timetable) {
            throw new Error('找不到课程表元素');
        }
        
        // 清空课程表内容
        for(let i = 1; i < timetable.rows.length; i++) {
            for(let j = 1; j < timetable.rows[i].cells.length; j++) {
                timetable.rows[i].cells[j].innerHTML = '';
            }
        }

        // 填充课程表
        courses.forEach(course => {
            // 每周的课程都显示
            if (course.week_type === '每周') {
                addCourseToTimetable(course, timetable);
            }
            // 单周的课程只在单周显示
            else if (course.week_type === '单周' && weekType === 'odd') {
                addCourseToTimetable(course, timetable);
            }
            // 双周的课程只在双周显示
            else if (course.week_type === '双周' && weekType === 'even') {
                addCourseToTimetable(course, timetable);
            }
        });
    } catch(error) {
        console.error('加载课程表失败:', error);
        showError('加载课程表失败，请刷新页面重试');
    }
}

// 添加课程到课程表
function addCourseToTimetable(course, timetable) {
    const courseElement = document.createElement('div');
    courseElement.className = 'course';
    courseElement.textContent = course.name;
    courseElement.dataset.courseId = course.id;
    courseElement.addEventListener('click', () => showCourseDetails(course.id));

    const timeSlot = getTimeSlot(course.schedules[0].start_time);
    const dayIndex = course.schedules[0].day_of_week;
    
    if(timeSlot > 0 && dayIndex > 0) {
        const cell = timetable.rows[timeSlot].cells[dayIndex];
        if (cell) {
            cell.appendChild(courseElement);
        }
    }
}

// 获取时间槽索引
function getTimeSlot(time) {
    const timeSlots = {
        '08:20:00': 1,
        '10:20:00': 2,
        '14:30:00': 3,
        '16:30:00': 4
    };
    return timeSlots[time] || 0;
}

// 显示课程详情
async function showCourseDetails(courseId) {
    try {
        const response = await fetch(`http://localhost:3000/api/course-details?id=${courseId}`);
        const course = await response.json();
        
        document.getElementById('courseName').textContent = course.name;
        document.getElementById('teacherName').textContent = course.teacher_name;
        document.getElementById('teacherEmail').textContent = course.teacher_email;
        document.getElementById('className').textContent = course.class_name;
        document.getElementById('courseTime').textContent = `${course.start_time} - ${course.end_time}`;
        document.getElementById('classroom').textContent = course.classroom;
        document.getElementById('weekType').textContent = course.week_type;
        
        document.getElementById('courseModal').style.display = 'block';
    } catch(error) {
        console.error('获取课程详情失败:', error);
        showError('获取课程详情失败，请重试');
    }
}

// 显示错误消息
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 获取当前周数并加载课程表
    const currentWeek = getCurrentWeek();
    loadTimetable(currentWeek);

    // 周数选择器事件
    document.querySelectorAll('.week-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.week-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadTimetable(btn.dataset.week);
        });
    });

    // 关闭弹窗
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('courseModal').style.display = 'none';
    });

    // 点击弹窗外部关闭
    window.addEventListener('click', (e) => {
        if(e.target === document.getElementById('courseModal')) {
            document.getElementById('courseModal').style.display = 'none';
        }
    });

    // 退出登录
    document.querySelector('.logout-btn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}); 
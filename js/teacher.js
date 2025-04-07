let currentTeacherId = null;

// 加载教师课程
async function loadTeacherCourses() {
    try {
        const response = await fetch('http://localhost:3000/api/courses');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const allCourses = await response.json();
        const teacherCourses = allCourses.filter(course => course.teacher_id === parseInt(currentTeacherId));
        
        // 更新课程列表
        const courseList = document.querySelector('.course-list');
        courseList.innerHTML = '';
        
        if (teacherCourses.length === 0) {
            courseList.innerHTML = '<p class="no-courses">暂无课程</p>';
        } else {
            teacherCourses.forEach(course => {
                const courseElement = document.createElement('div');
                courseElement.className = 'course';
                courseElement.textContent = course.name;
                courseElement.dataset.courseId = course.id;
                courseElement.addEventListener('click', () => showCourseModal(course));
                courseList.appendChild(courseElement);
            });
        }
        
        // 更新课程表
        updateTimetable(teacherCourses);
        
        // 更新调课弹窗的课程选项
        const courseSelect = document.getElementById('changeCourseId');
        courseSelect.innerHTML = '';
        if (teacherCourses.length > 0) {
            teacherCourses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = course.name;
                courseSelect.appendChild(option);
            });
        } else {
            courseSelect.innerHTML = '<option value="" disabled>暂无课程</option>';
        }
    } catch(error) {
        console.error('加载教师课程失败:', error);
        showError('加载课程失败，请刷新页面重试');
    }
}

// 更新课程表
function updateTimetable(courses) {
    const timetable = document.querySelector('.timetable');
    
    // 清空课程表
    for(let i = 1; i < timetable.rows.length; i++) {
        for(let j = 1; j < timetable.rows[i].cells.length; j++) {
            timetable.rows[i].cells[j].innerHTML = '';
        }
    }

    // 填充课程表
    courses.forEach(course => {
        const courseElement = document.createElement('div');
        courseElement.className = 'course';
        courseElement.textContent = course.name;
        courseElement.dataset.courseId = course.id;
        courseElement.addEventListener('click', () => showCourseModal(course));

        const timeSlot = getTimeSlot(course.schedules[0].start_time);
        const dayIndex = course.schedules[0].day_of_week;
        
        if(timeSlot && dayIndex) {
            timetable.rows[timeSlot].cells[dayIndex].appendChild(courseElement);
        }
    });
}

// 显示课程编辑弹窗
function showCourseModal(course = null) {
    const modal = document.getElementById('courseModal');
    const form = document.getElementById('courseForm');
    const deleteBtn = form.querySelector('.delete-btn');
    const modalTitle = document.getElementById('modalTitle');
    
    if(course) {
        modalTitle.textContent = '修改课程';
        form.courseId.value = course.id;
        form.courseName.value = course.name;
        form.classId.value = course.class_id;
        form.weekType.value = course.week_type;
        form.day_of_week.value = course.schedules[0].day_of_week;
        form.start_time.value = course.schedules[0].start_time;
        form.classroom.value = course.schedules[0].classroom;
        deleteBtn.style.display = 'inline-block';
    } else {
        modalTitle.textContent = '添加课程';
        form.reset();
        form.courseId.value = '';
        deleteBtn.style.display = 'none';
    }
    
    modal.style.display = 'block';
}

// 保存课程
async function saveCourse(event) {
    event.preventDefault();
    const form = event.target;
    
    // 验证表单数据
    if (!form.courseName.value || !form.classId.value || !form.weekType.value || 
        !form.day_of_week.value || !form.start_time.value || !form.classroom.value) {
        showError('请填写所有必填字段');
        return;
    }
    
    // 构建课程数据
    const courseData = {
        name: form.courseName.value,
        teacher_id: parseInt(currentTeacherId),
        class_id: parseInt(form.classId.value),
        week_type: form.weekType.value,
        day_of_week: parseInt(form.day_of_week.value),
        start_time: form.start_time.value,
        end_time: getEndTime(form.start_time.value),
        classroom: form.classroom.value
    };

    console.log('提交的课程数据:', courseData);
    
    try {
        const courseId = form.courseId.value;
        const url = courseId ? 
            `http://localhost:3000/api/courses/${courseId}` : 
            'http://localhost:3000/api/courses';
        
        // 显示加载状态
        const submitBtn = form.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '保存中...';
        
        const response = await fetch(url, {
            method: courseId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(courseData)
        });

        const result = await response.json();
        console.log('服务器响应:', result);
        
        // 恢复按钮状态
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        
        if(response.ok) {
            document.getElementById('courseModal').style.display = 'none';
            loadTeacherCourses();
            showSuccess(courseId ? '课程修改成功！' : '课程添加成功！');
        } else {
            showError(result.error || '操作失败，请重试');
        }
    } catch(error) {
        console.error('保存课程失败:', error);
        showError('保存失败，请检查网络连接或联系管理员');
        
        // 恢复按钮状态
        const submitBtn = form.querySelector('.submit-btn');
        submitBtn.disabled = false;
        submitBtn.textContent = '保存';
    }
}

// 删除课程
async function deleteCourse(courseId) {
    if(!confirm('确定要删除这门课程吗？此操作不可恢复！')) return;
    
    try {
        const response = await fetch(`http://localhost:3000/api/courses/${courseId}`, {
            method: 'DELETE'
        });
        
        if(response.ok) {
            document.getElementById('courseModal').style.display = 'none';
            loadTeacherCourses();
            showSuccess('课程删除成功！');
        } else {
            const result = await response.json();
            showError(result.error || '删除失败，请重试！');
        }
    } catch(error) {
        console.error('删除课程失败:', error);
        showError('删除失败，请重试！');
    }
}

// 获取结束时间
function getEndTime(startTime) {
    const endTimes = {
        '08:20:00': '10:00:00',
        '10:20:00': '12:20:00',
        '14:30:00': '16:10:00',
        '16:30:00': '18:10:00'
    };
    return endTimes[startTime] || '18:10:00';
}

// 获取时间槽索引
function getTimeSlot(time) {
    const timeSlots = {
        '08:20:00': 1,
        '10:20:00': 2,
        '14:30:00': 3,
        '16:30:00': 4
    };
    return timeSlots[time];
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

// 显示成功消息
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 从localStorage获取教师ID
    currentTeacherId = localStorage.getItem('teacherId');
    if(!currentTeacherId) {
        window.location.href = 'index.html';
        return;
    }

    // 加载课程
    loadTeacherCourses();

    // 添加课程按钮
    document.querySelector('.add-course-btn').addEventListener('click', () => showCourseModal());
    
    // 课程表单提交
    document.getElementById('courseForm').addEventListener('submit', saveCourse);
    
    // 删除课程按钮
    document.querySelector('.delete-btn').addEventListener('click', () => {
        const courseId = document.getElementById('courseId').value;
        if(courseId) deleteCourse(courseId);
    });
    
    // 关闭弹窗
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            closeBtn.closest('.modal').style.display = 'none';
        });
    });
    
    // 点击弹窗外部关闭
    window.addEventListener('click', (e) => {
        if(e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // 退出登录
    document.querySelector('.logout-btn').addEventListener('click', () => {
        localStorage.removeItem('teacherId');
        window.location.href = 'index.html';
    });
}); 
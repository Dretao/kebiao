const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// 数据文件路径
const DATA_FILE = path.join(__dirname, 'data.json');

// 初始化数据
const initData = {
    courses: [
        {
            id: 1,
            name: '语文',
            teacher_id: 1,
            class_id: 1,
            week_type: '每周',
            schedules: [
                {
                    day_of_week: 1,
                    start_time: '08:20:00',
                    end_time: '10:00:00',
                    classroom: '101'
                }
            ]
        },
        {
            id: 2,
            name: '数学',
            teacher_id: 2,
            class_id: 1,
            week_type: '每周',
            schedules: [
                {
                    day_of_week: 2,
                    start_time: '10:20:00',
                    end_time: '12:20:00',
                    classroom: '102'
                }
            ]
        }
    ],
    teachers: [
        {
            id: 1,
            name: '张老师',
            email: 'zhang@example.com',
            password: '123456'
        },
        {
            id: 2,
            name: '李老师',
            email: 'li@example.com',
            password: '123456'
        }
    ],
    classes: [
        {
            id: 1,
            name: '高一(1)班',
            grade: '高一'
        }
    ],
    applications: []
};

// 确保数据文件存在
if (!fs.existsSync(DATA_FILE)) {
    console.log('数据文件不存在，创建新文件...');
    fs.writeFileSync(DATA_FILE, JSON.stringify(initData, null, 2));
}

// 读取数据
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取数据文件失败:', error);
        return initData;
    }
}

// 保存数据
function saveData(data) {
    try {
        // 检查数据是否有效
        if (!data || typeof data !== 'object') {
            throw new Error('无效的数据格式');
        }
        
        // 确保数据目录存在
        const dataDir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        // 将数据转换为JSON字符串
        const jsonData = JSON.stringify(data, null, 2);
        
        // 写入文件
        fs.writeFileSync(DATA_FILE, jsonData);
        console.log('数据保存成功');
    } catch (error) {
        console.error('保存数据文件失败:', error);
        console.error('错误详情:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        throw error;
    }
}

// 获取课程列表
app.get('/api/courses', (req, res) => {
    const data = readData();
    const courses = data.courses.map(course => {
        const teacher = data.teachers.find(t => t.id === course.teacher_id);
        const classInfo = data.classes.find(c => c.id === course.class_id);
        return {
            ...course,
            teacher_name: teacher?.name,
            class_name: classInfo?.name
        };
    });
    res.json(courses);
});

// 获取课程详情
app.get('/api/course-details', (req, res) => {
    const courseId = parseInt(req.query.id);
    const data = readData();
    
    const course = data.courses.find(c => c.id === courseId);
    if (!course) {
        return res.status(404).json({ error: '课程不存在' });
    }
    
    const teacher = data.teachers.find(t => t.id === course.teacher_id);
    const classInfo = data.classes.find(c => c.id === course.class_id);
    
    res.json({
        ...course,
        teacher_name: teacher?.name,
        teacher_email: teacher?.email,
        class_name: classInfo?.name,
        ...course.schedules[0]
    });
});

// 申请调课
app.post('/api/apply-change', (req, res) => {
    const { teacher_id, course_id, new_schedule } = req.body;
    const data = readData();
    
    const newApplication = {
        id: data.applications.length + 1,
        teacher_id,
        course_id,
        new_day_of_week: new_schedule.day_of_week,
        new_start_time: new_schedule.start_time,
        new_end_time: new_schedule.end_time,
        new_classroom: new_schedule.classroom,
        status: '待审核',
        created_at: new Date().toISOString()
    };
    
    data.applications.push(newApplication);
    saveData(data);
    
    res.json({ success: true });
});

// 验证登录
app.post('/api/login', (req, res) => {
    const { username, password, role } = req.body;
    
    if (role === 'teacher') {
        const data = readData();
        const teacher = data.teachers.find(t => t.email === username && t.password === password);
        if (teacher) {
            res.json({ success: true, userId: teacher.id });
        } else {
            res.json({ success: false, message: '用户名或密码错误' });
        }
    } else {
        res.json({ success: true, userId: 1 }); // 学生端直接通过
    }
});

// 添加新课程
app.post('/api/courses', (req, res) => {
    try {
        console.log('收到添加课程请求:', req.body);
        const data = readData();
        
        // 验证请求数据
        if (!req.body.name || !req.body.teacher_id || !req.body.class_id || !req.body.week_type) {
            console.log('缺少必要字段:', req.body);
            return res.status(400).json({ error: '缺少必要字段' });
        }

        // 验证教师ID是否存在
        const teacherExists = data.teachers.some(t => t.id === parseInt(req.body.teacher_id));
        if (!teacherExists) {
            console.log('教师不存在:', req.body.teacher_id);
            return res.status(400).json({ error: '教师不存在' });
        }

        // 验证班级ID是否存在
        const classExists = data.classes.some(c => c.id === parseInt(req.body.class_id));
        if (!classExists) {
            console.log('班级不存在:', req.body.class_id);
            return res.status(400).json({ error: '班级不存在' });
        }

        const newCourse = {
            id: data.courses.length + 1,
            name: req.body.name,
            teacher_id: parseInt(req.body.teacher_id),
            class_id: parseInt(req.body.class_id),
            week_type: req.body.week_type,
            schedules: [{
                day_of_week: parseInt(req.body.day_of_week),
                start_time: req.body.start_time,
                end_time: req.body.end_time,
                classroom: req.body.classroom
            }]
        };
        
        console.log('新课程数据:', newCourse);
        
        data.courses.push(newCourse);
        saveData(data);
        res.json({ success: true, course: newCourse });
    } catch(error) {
        console.error('添加课程失败:', error);
        res.status(500).json({ error: '服务器内部错误: ' + error.message });
    }
});

// 修改课程信息
app.put('/api/courses/:id', (req, res) => {
    try {
        console.log('收到修改课程请求:', req.params.id, req.body);
        const courseId = parseInt(req.params.id);
        const data = readData();
        const courseIndex = data.courses.findIndex(c => c.id === courseId);
        
        if (courseIndex === -1) {
            console.log('课程不存在:', courseId);
            return res.status(404).json({ error: '课程不存在' });
        }
        
        const updatedCourse = {
            ...data.courses[courseIndex],
            name: req.body.name,
            teacher_id: parseInt(req.body.teacher_id),
            class_id: parseInt(req.body.class_id),
            week_type: req.body.week_type,
            schedules: [{
                day_of_week: parseInt(req.body.day_of_week),
                start_time: req.body.start_time,
                end_time: req.body.end_time,
                classroom: req.body.classroom
            }]
        };
        
        console.log('更新后的课程数据:', updatedCourse);
        
        data.courses[courseIndex] = updatedCourse;
        saveData(data);
        res.json({ success: true, course: updatedCourse });
    } catch(error) {
        console.error('修改课程失败:', error);
        res.status(500).json({ error: '服务器内部错误: ' + error.message });
    }
});

// 删除课程
app.delete('/api/courses/:id', (req, res) => {
    try {
        console.log('收到删除课程请求:', req.params.id);
        const courseId = parseInt(req.params.id);
        const data = readData();
        const courseIndex = data.courses.findIndex(c => c.id === courseId);
        
        if (courseIndex === -1) {
            console.log('课程不存在:', courseId);
            return res.status(404).json({ error: '课程不存在' });
        }
        
        data.courses.splice(courseIndex, 1);
        saveData(data);
        console.log('课程删除成功:', courseId);
        res.json({ success: true });
    } catch(error) {
        console.error('删除课程失败:', error);
        res.status(500).json({ error: '服务器内部错误: ' + error.message });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});
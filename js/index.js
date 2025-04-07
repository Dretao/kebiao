document.addEventListener('DOMContentLoaded', () => {
    const roleBtns = document.querySelectorAll('.role-btn');
    const loginForm = document.querySelector('.login-form');
    const loginBtn = document.querySelector('.login-btn');

    // 角色选择
    roleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            roleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // 登录
    loginBtn.addEventListener('click', async () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.querySelector('.role-btn.active').dataset.role;

        if(!username || !password) {
            alert('请输入用户名和密码！');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password, role })
            });

            const result = await response.json();
            if(result.success) {
                if(role === 'teacher') {
                    localStorage.setItem('teacherId', result.userId);
                    window.location.href = 'teacher.html';
                } else {
                    window.location.href = 'student.html';
                }
            } else {
                alert(result.message || '登录失败，请重试！');
            }
        } catch(error) {
            console.error('登录失败:', error);
            alert('登录失败，请重试！');
        }
    });
}); 
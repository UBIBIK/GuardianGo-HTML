$('.message a').click(function(){
    $('form').animate({height: "toggle", opacity: "toggle"}, "slow");
 });

//const BASE_URL = 'http://localhost:8080';
const BASE_URL = 'http://34.64.214.135:8080';

 async function register() {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirm-password').value.trim();
    const phone = document.getElementById('phone').value.trim();

    // 모든 필드가 입력되었는지 확인
    if (!name || !email || !password || !confirmPassword || !phone) {
        alert("All fields must be filled out.");
        return;
    }

    // 이메일 형식 확인
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
        alert("올바른 형식의 이메일을 입력해주세요.");
        return;
    }

    // 비밀번호 확인
    if (password !== confirmPassword) {
        alert("비밀번호가 맞지 않습니다");
        return;
    }

    // 회원가입 데이터를 객체로 생성
    const userData = {
        userName: name,
        userEmail: email,
        password: password,
        phoneNumber: phone
    };

    try {
        // 서버에 회원가입 요청 보내기
        const response = await fetch(`${BASE_URL}/save-user`, { // BASE_URL을 사용하여 URL 구성
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            alert("회원가입 성공");
            window.location.reload(); // 현재 화면을 새로고침
        } else {
            alert("회원가입에 실패했습니다. 다시 시도해주세요.");
        }
    } catch (error) {
        console.error("Registration error:", error);
        alert("통신 중 오류가 발생했습니다.");
    }
}


async function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!username || !password) {
        alert("Please enter both username and password.");
        return;
    }

    const loginData = {
        userEmail: username,
        password: password
    };

    try {
        const response = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        if (response.ok) {
            const userInfo = await response.json();
            sessionStorage.setItem("userInfo", JSON.stringify(userInfo));

            alert(`Login successful. Welcome, ${userInfo.userName}!`);

            // userInfo에 groupKey가 있으면 그룹 정보를 서버에서 가져와 sessionStorage에 저장
            if (userInfo.groupKey) {
                try {
                    const groupResponse = await fetch(`${BASE_URL}/group-exist`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ groupKey: userInfo.groupKey })
                    });

                    if (groupResponse.ok) {
                        const groupInfo = await groupResponse.json();
                        sessionStorage.setItem("groupInfo", JSON.stringify(groupInfo)); // 그룹 정보를 sessionStorage에 저장
                        console.log("Group information stored in sessionStorage:", groupInfo);
                    } else {
                        console.warn("Failed to retrieve group information:", groupResponse.statusText);
                    }
                } catch (groupError) {
                    console.error("Error fetching group information:", groupError);
                }
            }

            window.location.href = "main/main.html";
        } else {
            alert("Login failed. Please check your username and password.");
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("An error occurred while logging in. Please try again later.");
    }
}

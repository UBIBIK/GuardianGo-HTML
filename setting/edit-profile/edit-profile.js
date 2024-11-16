// 새로 만드는 파일: edit-profile.js
document.addEventListener('DOMContentLoaded', () => {
    // 뒤로가기 버튼 이벤트
    document.getElementById('backButton').addEventListener('click', () => {
      // 페이드아웃 효과
      document.body.style.opacity = '0';
      document.body.style.transition = 'opacity 0.3s ease';
      
      setTimeout(() => {
        window.location.href = '../setting.html';
      }, 300);
    });
  
    // sessionStorage에서 사용자 정보 가져오기
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
    
    if (userInfo) {
      // 각 필드에 데이터 표시
      const fields = {
        'userName': userInfo.userName || '미설정',
        'userEmail': userInfo.userEmail || '미설정',
        'phoneNumber': userInfo.phoneNumber || '미설정',
        'groupKey': userInfo.groupKey || '미설정',
        'status': userInfo.status || '미설정'
      };
  
      // 애니메이션과 함께 데이터 표시
      Object.entries(fields).forEach(([id, value], index) => {
        const element = document.getElementById(id);
        if (element) {
          setTimeout(() => {
            element.textContent = value;
            element.style.opacity = '1';
          }, index * 100); // 각 필드마다 100ms 딜레이
        }
      });
    }
  
    // 페이지 로드 시 페이드인 효과
    document.body.style.opacity = '0';
    requestAnimationFrame(() => {
      document.body.style.transition = 'opacity 0.5s ease';
      document.body.style.opacity = '1';
    });
  });
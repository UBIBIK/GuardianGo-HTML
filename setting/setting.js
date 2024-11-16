document.addEventListener('DOMContentLoaded', () => {
  const modal = document.querySelector('.modal');
  const logoutButton = document.getElementById('logoutButton');
  const confirmLogout = document.getElementById('confirmLogout');
  const cancelLogout = document.getElementById('cancelLogout');

  // 페이지 로드 효과
  const buttons = document.querySelectorAll('.settings-button');
  buttons.forEach((button, index) => {
    button.style.animationDelay = `${index * 0.1}s`;
  });

  // 버튼 물결 효과
  function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    
    const rect = button.getBoundingClientRect();
    
    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${event.clientX - rect.left - radius}px`;
    ripple.style.top = `${event.clientY - rect.top - radius}px`;
    ripple.className = 'ripple';
    
    // 이전 물결 효과 제거
    const existingRipple = button.querySelector('.ripple');
    if (existingRipple) {
      existingRipple.remove();
    }
    
    button.appendChild(ripple);
    
    // 애니메이션 종료 후 제거
    ripple.addEventListener('animationend', () => {
      ripple.remove();
    });
  }

  // 사용자 정보 수정 버튼
  document.getElementById('editProfileButton').addEventListener('click', (e) => {
    createRipple(e);
    setTimeout(() => {
      window.location.href = 'edit-profile.html';
    }, 300);
  });

  // 신고 내역 관리 버튼
  document.getElementById('reportHistoryButton').addEventListener('click', (e) => {
    createRipple(e);
    setTimeout(() => {
      window.location.href = 'report-history.html';
    }, 300);
  });

  // 로그아웃 모달 표시
  logoutButton.addEventListener('click', (e) => {
    createRipple(e);
    setTimeout(() => {
      modal.classList.add('active');
    }, 300);
  });

  // 로그아웃 확인
  confirmLogout.addEventListener('click', () => {
    sessionStorage.clear();
    localStorage.clear();
    
    // 로그아웃 애니메이션
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 500);
  });

  // 로그아웃 취소
  cancelLogout.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  // 모달 외부 클릭 시 닫기
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  // 키보드 ESC 키로 모달 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      modal.classList.remove('active');
    }
  });
});

// 물결 효과를 위한 CSS 추가
const style = document.createElement('style');
style.textContent = `
  .settings-button {
    position: relative;
    overflow: hidden;
  }

  .ripple {
    position: absolute;
    background-color: rgba(255, 255, 255, 0.7);
    border-radius: 50%;
    transform: scale(0);
    animation: ripple 0.6s linear;
    pointer-events: none;
  }

  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
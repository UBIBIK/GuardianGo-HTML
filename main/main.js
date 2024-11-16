document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.grid-button');

    buttons.forEach((button, index) => {
        button.addEventListener('click', (event) => {
            createRippleEffect(event);

            // 약간의 지연 후 페이지 이동
            setTimeout(() => {
                if (index === 0) {
                    window.location.href = '../home/home.html';
                } else if (index === 1) {
                    window.location.href = '../list/list.html';
                } else if (index === 2) {
                    window.location.href = '../group/group.html';
                } else if (index === 3) {
                    window.location.href = '../report/selectlocation.html';
                } else if (index === 4) { // 긴급호출 버튼
                    activateEmergency();
                }
            }, 50);
        });

        // 마우스 움직임에 따른 3D 효과
        button.addEventListener('mousemove', (e) => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;

            button.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = '';
        });
    });

    const title = document.querySelector('.project-title');
    // 이스터에그
    title.addEventListener('mousedown', () => {
        pressTimer = setTimeout(() => {
            window.location.href = '../game/game.html';
        }, 5000); // 5초 동안 누를 때 이동
    });
    title.addEventListener('mouseenter', () => {
        title.style.transform = 'scale(1.1)';
    });
    title.addEventListener('mouseleave', () => {
        title.style.transform = '';
    });
});

function createRippleEffect(event) {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
    circle.classList.add('ripple');

    const ripple = button.getElementsByClassName('ripple')[0];
    if (ripple) {
        ripple.remove();
    }

    button.appendChild(circle);
}

// 긴급호출 기능
function activateEmergency() {
    const sirenSound = document.getElementById('sirenSound');
    const emergencyModal = document.getElementById('emergencyModal');
    
    // 사이렌 재생
    sirenSound.play().catch(error => {
        console.log("오디오 재생 실패:", error);
    });
    
    // 모달 표시
    emergencyModal.style.display = 'flex';
    
    // 버튼 이펙트
    const button = document.getElementById('emergencyModalClose');
    
    button.addEventListener('mousedown', function(e) {
        const x = e.offsetX;
        const y = e.offsetY;
        
        const effect = this.querySelector('.button-effect');
        effect.style.left = `${x}px`;
        effect.style.top = `${y}px`;
        
        const size = Math.max(this.offsetWidth, this.offsetHeight) * 2;
        effect.style.width = effect.style.height = `${size}px`;
        
        setTimeout(() => {
            effect.style.width = effect.style.height = '0';
        }, 600);
    });
    
    // 모달 닫기
    button.addEventListener('click', () => {
        sirenSound.pause();
        sirenSound.currentTime = 0;
        
        // 페이드아웃 애니메이션 후 모달 닫기
        emergencyModal.style.animation = 'fadeIn 0.3s ease-out reverse';
        setTimeout(() => {
            emergencyModal.style.display = 'none';
            emergencyModal.style.animation = '';
        }, 300);
    });
}
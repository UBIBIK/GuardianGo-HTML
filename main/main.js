document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.grid-button');

    buttons.forEach((button, index) => {
        button.addEventListener('click', (event) => {
            createRippleEffect(event);
            
            // 약간의 지연 후 페이지 이동
            setTimeout(() => {
                if (index === 0) {
                    window.location.href = '../home/home.html';
                } else if (index === 2) {
                    window.location.href = '../group/group.html';
                } else if (index === 3) {
                    window.location.href = '../report/selectlocation.html';
                }
            }, 300);
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
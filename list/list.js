let BASE_URL;

// config.json 파일을 먼저 로드한 후 BASE_URL을 설정하고 fetchRoutes를 호출
fetch('../config.json')
  .then(response => {
    if (!response.ok) throw new Error("Failed to load config.json");
    return response.json();
  })
  .then(config => {
    BASE_URL = config.BASE_URL;
    console.log("Loaded BASE_URL:", BASE_URL); // BASE_URL이 올바르게 로드되었는지 확인
    fetchRoutes(); // config.json 로드 후에만 fetchRoutes를 호출
  })
  .catch(error => console.error('Failed to load configuration:', error));

function fetchRoutes() {
  if (!BASE_URL) {
    console.error("BASE_URL is not defined");
    return;
  }

  const routeListContainer = document.querySelector('.route-list');
  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  routeListContainer.parentNode.insertBefore(spinner, routeListContainer);

  const emptyMessage = document.createElement('p');
  emptyMessage.className = 'empty-message';
  emptyMessage.textContent = 'No routes available.';

  const notification = document.createElement('div');
  notification.className = 'notification';
  document.body.appendChild(notification);

  function showNotification(message, isError = false) {
    notification.textContent = message;
    notification.classList.add('show');
    if (isError) {
      notification.classList.add('error');
    } else {
      notification.classList.remove('error');
    }

    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }

  async function loadRoutes() {
    try {
      spinner.style.display = 'block';

      const groupInfo = JSON.parse(sessionStorage.getItem('groupInfo'));
      if (!groupInfo || !groupInfo.groupKey) {
        showNotification('그룹 정보가 없습니다.', true);
        return;
      }

      const groupKey = groupInfo.groupKey;

      const response = await fetch(`${BASE_URL}/get-group-route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupKey: groupInfo.groupKey }) // JSON 객체 형태로 전송
      });

      if (!response.ok) {
        throw new Error('Failed to fetch routes from the server.');
      }

      const data = await response.json();
      renderRouteList(data.routes);
      showNotification('경로 목록을 성공적으로 불러왔습니다.');
    } catch (error) {
      console.error('통신 오류:', error);
      showNotification('경로를 불러오는 데 실패했습니다.', true);
    } finally {
      spinner.style.display = 'none';
    }
  }

    // 경로 목록을 화면에 렌더링
    function renderRouteList(routes) {
        // 기존 리스트 항목 제거
        routeListContainer.innerHTML = '';

        // 경로 목록이 비어 있는 경우 빈 메시지 표시
        if (!routes || routes.length === 0) {
            routeListContainer.parentNode.appendChild(emptyMessage);
            return;
        }

        // 경로 목록이 있을 경우 빈 메시지 제거
        if (emptyMessage.parentNode) {
            emptyMessage.parentNode.removeChild(emptyMessage);
        }

        // 각 경로 정보를 리스트 항목으로 추가
        routes.forEach((route) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            const h2 = document.createElement('h2');
            const p = document.createElement('p');

            // 경로 제목과 시간 설정
            h2.textContent = `${route.userName}의 경로`;
            
            // 경로 저장 시간을 사람이 읽을 수 있는 형식으로 표시
            p.textContent = `사용 날짜: ${formatDate(route.time)}`;

            a.href = '#';
            a.appendChild(h2);
            a.appendChild(p);
            li.appendChild(a);
            routeListContainer.appendChild(li);
        });
    }

    // 시간 형식을 "YYYY-MM-DD HH:MM" 형태로 변환하는 함수
    function formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }

  loadRoutes();
}

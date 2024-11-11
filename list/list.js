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

  function renderRouteList(routes) {
    routeListContainer.innerHTML = '';

    if (!routes || routes.length === 0) {
      routeListContainer.parentNode.appendChild(emptyMessage);
      return;
    }

    if (emptyMessage.parentNode) {
      emptyMessage.parentNode.removeChild(emptyMessage);
    }

    routes.forEach((route) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      const h2 = document.createElement('h2');
      const p = document.createElement('p');

      h2.textContent = `${route.userName}'s Route`;
      p.textContent = `Start: (${route.startLocation.latitude}, ${route.startLocation.longitude}), `
                    + `End: (${route.endLocation.latitude}, ${route.endLocation.longitude})`;

      a.href = '#';
      a.appendChild(h2);
      a.appendChild(p);
      li.appendChild(a);
      routeListContainer.appendChild(li);
    });
  }

  loadRoutes();
}

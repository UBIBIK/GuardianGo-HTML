document.addEventListener("DOMContentLoaded", () => {
    const BASE_URL = '/api'
    const routeListContainer = document.querySelector('.route-list');
  
    // 로딩 스피너와 빈 리스트 메시지 생성
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    routeListContainer.parentNode.insertBefore(spinner, routeListContainer);
  
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'empty-message';
    emptyMessage.textContent = 'No routes available.';
  
    // 알림 창 생성
    const notification = document.createElement('div');
    notification.className = 'notification';
    document.body.appendChild(notification);
  
    // 알림 창 표시 함수
    function showNotification(message, isError = false) {
      notification.textContent = message;
      notification.classList.add('show');
      if (isError) {
        notification.classList.add('error');
      } else {
        notification.classList.remove('error');
      }
  
      // 3초 후 알림 창 숨기기
      setTimeout(() => {
        notification.classList.remove('show');
      }, 3000);
    }
  
    // 서버에서 그룹의 경로 목록 가져오기
    async function fetchRoutes() {
      try {
        // 로딩 스피너 표시
        spinner.style.display = 'block';
  
        // sessionStorage에서 groupInfo 정보 가져오기
        const groupInfo = JSON.parse(sessionStorage.getItem('groupInfo'));
        if (!groupInfo || !groupInfo.groupKey) {
          showNotification('그룹 정보가 없습니다.', true);
          return;
        }
  
        const groupKey = groupInfo.groupKey;
  
        // 서버에 요청 보내기
        const response = await fetch(`${BASE_URL}/get-group-route`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(groupKey)
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
        // 로딩 스피너 숨기기
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
  
        // 경로 제목과 설명 설정
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
  
    // 페이지 로드 시 경로 목록 가져오기 호출
    fetchRoutes();
  });
  
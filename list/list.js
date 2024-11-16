let BASE_URL;
let routes = [];  // 전역 변수로 routes 선언
let map;
let routePath;

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
      routes = data.routes;  // 전역 변수 routes에 저장
      renderRouteList(routes);
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
    routeListContainer.innerHTML = '';

    if (!routes || routes.length === 0) {
      routeListContainer.parentNode.appendChild(emptyMessage);
      return;
    }

    if (emptyMessage.parentNode) {
      emptyMessage.parentNode.removeChild(emptyMessage);
    }

    routes.forEach((route, index) => {  // index 추가
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

      // 리스트 항목 클릭 시 모달 열기 이벤트
      li.addEventListener("click", (event) => {
        event.preventDefault();
        openRoutePreview(routes[index]); // 클릭된 경로 데이터를 전달
      });
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

// 모달 열기 및 닫기
const routeModal = document.getElementById("routeModal");
const closeModal = document.getElementById("closeModal");
const memberSelectModal = document.getElementById("memberSelectModal");
const closeMemberSelectModal = document.getElementById("closeMemberSelectModal");
const memberList = document.getElementById("memberList");

closeModal.addEventListener("click", () => {
  routeModal.style.display = "none";
  if (routePath) {
    routePath.setMap(null); // 경로 제거
  }
});

// 경로 미리 보기 모달 표시 및 지도에 경로 그리기
function openRoutePreview(route) {
  routeModal.style.display = "block";

  // 지도가 아직 초기화되지 않은 경우 초기화
  if (!map) {
    map = new google.maps.Map(document.getElementById("map"), {
      center: { lat: route.startLocation.latitude, lng: route.startLocation.longitude },
      zoom: 14,
      mapTypeControl: false,        // 지도 유형 전환 버튼 숨김
      fullscreenControl: false,     // 전체화면 버튼 숨김
      streetViewControl: false,     // 스트리트뷰 버튼 숨김
      zoomControl: false,           // 줌 버튼 숨김
      disableDefaultUI: true        // 모든 기본 UI 숨김
    });
  } else {
    // 지도 중심을 현재 경로의 시작 위치로 재설정
    map.setCenter({ lat: route.startLocation.latitude, lng: route.startLocation.longitude });
  }

  // 경로 표시
  const pathCoordinates = [
    { lat: route.startLocation.latitude, lng: route.startLocation.longitude },
    ...route.waypoints.map(waypoint => ({ lat: waypoint.latitude, lng: waypoint.longitude })),
    { lat: route.endLocation.latitude, lng: route.endLocation.longitude }
  ];

  // 기존 경로 제거 후 새 경로 표시
  if (routePath) {
    routePath.setMap(null);
  }
  if (startMarker) {
    startMarker.setMap(null);
  }
  if (endMarker) {
    endMarker.setMap(null);
  }
  routePath = new google.maps.Polyline({
    path: pathCoordinates,
    geodesic: true,
    strokeColor: "#FF6347",
    strokeOpacity: 1.0,
    strokeWeight: 5,
  });
  routePath.setMap(map);

  // 출발지 마커 추가
  new google.maps.Marker({
    position: { lat: route.startLocation.latitude, lng: route.startLocation.longitude },
    map: map,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,                     // 마커 크기 조절
      fillColor: "#DB4455",         // 원의 색상
      fillOpacity: 1.0,
      strokeWeight: 1,              // 테두리 두께
      strokeColor: "#333"           // 테두리 색상
    },
    title: "출발지"
  });

  // 목적지 마커 추가
  new google.maps.Marker({
    position: { lat: route.endLocation.latitude, lng: route.endLocation.longitude },
    map: map,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: "#DB4455",         // 원의 색상 (빨간색)
      fillOpacity: 1.0,
      strokeWeight: 1,
      strokeColor: "#333"
    },
    title: "목적지"
  });
}

// 경로 사용 버튼 클릭 이벤트
document.getElementById("useRouteButton").addEventListener("click", showMemberSelectModal);

// 그룹원 선택 모달을 표시
function showMemberSelectModal() {
  routeModal.style.display = "none";
  
  // 그룹 정보 불러오기
  const groupInfo = JSON.parse(sessionStorage.getItem("groupInfo"));

  // 그룹원 목록 표시
  if (groupInfo && groupInfo.groupMember) {
    memberList.innerHTML = ""; // 기존 목록 초기화
    groupInfo.groupMember.forEach(member => {
      const li = document.createElement("li");
      li.textContent = member.groupMemberName;
      li.addEventListener("click", () => sendRouteToMember(member.groupMemberName)); // 클릭 시 전송 이벤트
      memberList.appendChild(li);
    });
    memberSelectModal.style.display = "block";
  } else {
    console.error("그룹 정보가 없습니다.");
  }
}

// 그룹원 선택 모달 닫기
closeMemberSelectModal.addEventListener("click", () => {
  memberSelectModal.style.display = "none";
});

// 그룹원에게 경로 정보 전송
function sendRouteToMember(memberName) {
  console.log(`${memberName}에게 경로 정보를 전송합니다.`);
  
  // GroupInfo와 선택한 경로를 가져오기
  const groupInfo = JSON.parse(sessionStorage.getItem("groupInfo"));
  const selectedRoute = routes.find(route => route.userName === memberName); // 전송할 경로 찾기

  if (!groupInfo || !selectedRoute) {
    console.error("그룹 정보 또는 경로 정보가 부족합니다.");
    return;
  }

  // RouteRequest 형식에 맞춰 전송 데이터 준비
  const routeRequest = {
    userName: memberName,
    groupKey: groupInfo.groupKey,
    route: {
      startLocation: selectedRoute.startLocation,
      endLocation: selectedRoute.endLocation,
      waypoints: selectedRoute.waypoints,
    },
  };

  // 서버로 경로 전송
  fetch(`${BASE_URL}/set-route`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(routeRequest),
  })
  .then(response => {
    if (!response.ok) {
      throw new Error("경로 전송 실패");
    }
    alert(`${memberName}에게 경로 정보를 성공적으로 전송했습니다.`);
  })
  .catch(error => {
    console.error("경로 전송 오류:", error);
    alert("경로 전송에 실패했습니다.");
  })
  .finally(() => {
    memberSelectModal.style.display = "none";
  });
}
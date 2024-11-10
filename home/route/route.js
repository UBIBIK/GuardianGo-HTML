//const BASE_URL = 'http://localhost:8080';
const BASE_URL = '/api'

let map, startMarker, destinationMarker;
let startSelected = false;
let destinationSelected = false;
// 경로 편집 모드 토글 상태를 추적할 변수
let isEditMode = false;
// 경유지 관리 배열
let waypointMarkers = [];
const fileMapping = {
    bell: 'emergency_bell',
    // 필요시 추가 파일 매핑
};
let markerIcons;
// 사용자 신고 마커 그룹
let reportMarkers = [];

// 경로 저장 버튼 참조 및 초기 비활성화
const saveRouteButton = document.getElementById("saveRoute");
saveRouteButton.disabled = true; // 초기 상태는 비활성화
saveRouteButton.classList.remove("active"); // 비활성화 시 스타일 제거

function initMap() {
    const mokpo = { lat: 34.8118, lng: 126.3922 };
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
        center: mokpo,
        disableDefaultUI: true,
        mapTypeControl: true
    });

    // 마커 아이콘 정의
    markerIcons = {
        accidents: { url: './marker_image/accidents.png', scaledSize: new google.maps.Size(50, 50) },
        bell: { url: './marker_image/bell.png', scaledSize: new google.maps.Size(50, 50) },
        cctv: { url: './marker_image/cctv.png', scaledSize: new google.maps.Size(50, 50) },
        convenience: { url: './marker_image/convenience.png', scaledSize: new google.maps.Size(50, 50) },
        crime: { url: './marker_image/crime.png', scaledSize: new google.maps.Size(50, 50) },
        fire_fighting: { url: './marker_image/fire_fighting.png', scaledSize: new google.maps.Size(50, 50) },
        school_zone: { url: './marker_image/school_zone.png', scaledSize: new google.maps.Size(50, 50) }
    };

    // 데이터 로드
    loadAllMarkers(); // 지도 초기화 후 마커 로드

    // 지도 클릭 이벤트 및 다른 설정들
    map.addListener('click', handleMapClick);
    addTooltips();

    map.data.loadGeoJson('./data/safety_mokpo_final.geojson', null, styleRoads);
}

// 모든 마커 카테고리 로드
function loadAllMarkers() {
    const categories = ['accidents', 'bell', 'cctv', 'convenience', 'crime', 'fire_fighting', 'school_zone'];
    categories.forEach(category => {
        loadMarkersForCategory(category);
        const checkbox = document.getElementById(`marker-${category}`);
        if (checkbox) {
            checkbox.addEventListener('change', () => toggleMarkers(category));
        }
    });
}


document.addEventListener("DOMContentLoaded", () => {
    // findRoute 버튼 이벤트 리스너
    const findRouteButton = document.getElementById("findRoute");
    findRouteButton.onclick = function() {
        switchToRoutePanel(); // 버튼 클릭 시 바로 패널 전환
    };

    // 길찾기 패널 버튼 이벤트 리스너
    const backButton = document.getElementById("backToStart");
    const safeRouteButton = document.getElementById("safeRoute");
    const shortestRouteButton = document.getElementById("shortestRoute");
    const editRouteButton = document.getElementById("editRoute");
    backButton.addEventListener("click", () => {
        resetRouteButtons();
        backToInitialPanel();
    });
    safeRouteButton.addEventListener("click", () => {
        resetRouteButtons();
        findSafeRoute();
    });
    shortestRouteButton.addEventListener("click", () => {
        resetRouteButtons();
        findShortestRoute();
    });
    editRouteButton.addEventListener("click", () => {
        editCurrentRoute();
    });

    // 패널 토글 기능
    const panel = document.querySelector('.marker-panel');
    const toggleButton = document.querySelector('.toggle-panel');
    const panelContent = document.querySelector('.panel-content');
    
    // 토글 버튼 클릭 이벤트
    toggleButton.addEventListener('click', () => {
        panel.classList.toggle('collapsed');
        const arrow = toggleButton.querySelector('.arrow');
        if (panel.classList.contains('collapsed')) {
            arrow.textContent = '▲';
            panelContent.style.display = 'none';
        } else {
            arrow.textContent = '▼';
            panelContent.style.display = 'block';
        }
    });

    // 마커 데이터를 각 카테고리별로 로드하고 스위치 이벤트 설정
    const categories = ['accidents', 'bell', 'cctv', 'convenience', 'crime', 'fire_fighting', 'school_zone'];
    categories.forEach(category => {
        loadMarkersForCategory(category);
        const checkbox = document.getElementById(`marker-${category}`);
        if (checkbox) {
            checkbox.addEventListener('change', () => toggleMarkers(category));
        }
    });
});

// 사용자 신고 데이터 가져오기
async function fetchReports() {
    // sessionStorage에서 userInfo 가져오기
    const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));
    if (!userInfo || !userInfo.userEmail || !userInfo.groupKey) {
        console.error("사용자 정보가 없거나 불완전합니다. 다시 로그인해주세요.");
        return []; // 사용자 정보가 없을 경우 빈 배열 반환
    }

    // 서버에 요청 보내기
    const response = await fetch(`${BASE_URL}/get-element`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            userEmail: userInfo.userEmail, // 이메일을 요청 본문에 포함
            groupKey: userInfo.groupKey // 그룹 키를 요청 본문에 포함
        })
    });

    // 서버 응답 처리
    if (response.ok) {
        const element = await response.json();
        return element.reports;
    } else {
        console.error("사용자 신고 데이터를 가져오는 데 실패했습니다:", response.statusText);
        return []; // 요청 실패 시 빈 배열 반환
    }
}


async function toggleReportMarkers(show) {
    if (show) {
        const reports = await fetchReports(); // 서버에서 신고 데이터를 가져옵니다.
        reports.forEach(report => {
            const position = { lat: report.latitude, lng: report.longitude };
            const marker = new google.maps.Marker({
                position,
                map: map,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE, // 원형 마커
                    scale: 8, // 마커 크기
                    fillColor: '#800080', // 보라색 (hex 코드)
                    fillOpacity: 0.8,
                    strokeWeight: 2,
                    strokeColor: '#FFFFFF' // 외곽선 흰색
                },
                title: `${report.reporterName}의 사용자 신고`
            });
            marker.set("reportData", report); // 마커에 신고 데이터를 저장합니다.
            marker.addListener('click', () => showReportPopup(marker)); // 마커 클릭 시 신고 내용 표시

            reportMarkers.push(marker);
        });
    } else {
        reportMarkers.forEach(marker => marker.setMap(null)); // 신고 마커를 숨깁니다.
        reportMarkers = [];
    }
}

// 신고 모달 창 표시 함수
function showReportPopup(marker) {
    const report = marker.get("reportData");
    if (!report) return;

    // sessionStorage에서 groupKey 가져오기
    const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));
    const groupKey = userInfo && userInfo.groupKey ? userInfo.groupKey : "default-group";

    // 신고 내용을 모달에 표시
    document.getElementById("reportText").innerText = report.content;
    document.getElementById("reportImage").src = `${BASE_URL}/uploads/${groupKey}/${report.uuid}`; // 서버의 이미지 URL을 사용합니다.

    // 모달 창 표시
    const reportModal = document.getElementById("reportModal");
    reportModal.style.display = "block";
}


// 모달 닫기 버튼 이벤트
document.getElementById("closeReportModal").onclick = () => {
    document.getElementById("reportModal").style.display = "none";
};

// 모달 외부 클릭 시 닫기
window.onclick = (event) => {
    const reportModal = document.getElementById("reportModal");
    if (event.target === reportModal) {
        reportModal.style.display = "none";
    }
};

// 사용자 신고 스위치 이벤트
document.getElementById("marker-report").addEventListener("change", (e) => {
    toggleReportMarkers(e.target.checked);
});

// url로 정보 가져오기
function getQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        name: urlParams.get('name'),
        latitude: parseFloat(urlParams.get('lat')),
        longitude: parseFloat(urlParams.get('lng'))
    };
}

function handleMapClick(event) {
    if (isEditMode) {
        // 경유지 추가
        const position = event.latLng;
        addWaypointMarker(position);
    } else {
        if (startSelected && destinationSelected) return;

        const position = event.latLng;
        if (!startSelected) {
            addMarkerWithAnimation('start', position);
        } else if (!destinationSelected) {
            addMarkerWithAnimation('destination', position);
            enableFindRouteButton();
        }
    }
}

function addMarkerWithAnimation(type, position) {
    const isStart = type === 'start';
    const marker = new google.maps.Marker({
        position: position,
        map: map,
        title: isStart ? "출발지" : "목적지",
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: isStart ? '#FF0000' : '#0000FF',
            fillOpacity: 0.8,
            strokeWeight: 2,
            strokeColor: '#FFFFFF'
        },
        animation: google.maps.Animation.DROP
    });

    marker.addListener('click', () => {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => marker.setAnimation(null), 1500);
    });

    if (isStart) {
        if (startMarker) startMarker.setMap(null);
        startMarker = marker;
        startSelected = true;
        document.getElementById("setStart").classList.add("selected");
    } else {
        if (destinationMarker) destinationMarker.setMap(null);
        destinationMarker = marker;
        destinationSelected = true;
        document.getElementById("setDestination").classList.add("selected");
    }

    animateMarkerDrop(marker);
}

function animateMarkerDrop(marker) {
    marker.setAnimation(google.maps.Animation.DROP);
    setTimeout(() => {
        marker.setAnimation(null);
    }, 2000);
}

function styleRoads() {
    map.data.setStyle(feature => {
        const safetyIndex = feature.getProperty('safety_index');
        const color = getColor(safetyIndex);
        return {
            strokeColor: color,
            strokeWeight: 2
        };
    });
}

function getColor(safetyIndex) {
    const midpoint = 35;

    if (safetyIndex >= midpoint) {
        const green = Math.min(255, Math.max(0, (safetyIndex - midpoint) * 5.1));
        return `rgb(${255 - green}, 255, 0)`;
    } else {
        const red = Math.min(255, Math.max(0, (midpoint - safetyIndex) * 5.1));
        return `rgb(255, ${255 - red}, 0)`;
    }
}

function enableFindRouteButton() {
    const findRouteButton = document.getElementById("findRoute");
    findRouteButton.disabled = false;
    findRouteButton.classList.add("active");
    findRouteButton.style.transform = 'scale(1.1)';
    setTimeout(() => {
        findRouteButton.style.transform = 'scale(1)';
    }, 200);
}

function selectLocation(type) {
    if (type === 'start') {
        startSelected = false;
        if (startMarker) {
            startMarker.setMap(null);
            startMarker = null;
        }
        document.getElementById("setStart").classList.remove("selected");
    } else if (type === 'destination') {
        destinationSelected = false;
        if (destinationMarker) {
            destinationMarker.setMap(null);
            destinationMarker = null;
        }
        document.getElementById("setDestination").classList.remove("selected");
    }

    const findRouteButton = document.getElementById("findRoute");
    findRouteButton.disabled = true;
    findRouteButton.classList.remove("active");
}

function addTooltips() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip';

        switch (button.id) {
            case 'setStart':
                tooltip.textContent = '출발지를 선택하려면 클릭하세요';
                break;
            case 'setDestination':
                tooltip.textContent = '도착지를 선택하려면 클릭하세요';
                break;
            case 'findRoute':
                tooltip.textContent = '안전한 경로 찾기';
                break;
        }

        button.appendChild(tooltip);
    });
}

// 경로찾기 패널로 변경
function switchToRoutePanel() {
    const controlsPanel = document.querySelector('.controls');
    const routePanel = document.querySelector('.route-controls');
    
    // 초기 상태 설정
    routePanel.style.display = 'flex';
    
    // 애니메이션 시작
    requestAnimationFrame(() => {
        controlsPanel.classList.add('slide-down');
        routePanel.classList.add('slide-up');
    });
    
    // 첫 번째 패널이 완전히 사라진 후 display none 처리
    setTimeout(() => {
        controlsPanel.style.display = 'none';
    }, 500); // CSS 트랜지션 시간과 동일하게 설정
}

// 초기패널로 변경
function backToInitialPanel() {
    const controlsPanel = document.querySelector('.controls');
    const routePanel = document.querySelector('.route-controls');
    
    // 초기 패널 표시
    controlsPanel.style.display = 'flex';
    
    // 애니메이션 시작
    requestAnimationFrame(() => {
        controlsPanel.classList.remove('slide-down');
        routePanel.classList.remove('slide-up');
    });
    
    // 애니메이션 완료 후 route 패널 숨김
    setTimeout(() => {
        routePanel.style.display = 'none';
    }, 500);

    // 기존 선택 초기화
    selectLocation('start');
    selectLocation('destination');

    // 경로 편집 상태 비활성화
    isEditMode = false;

    // 경로 편집 마커 삭제
    clearWaypointMarkers();
}

async function findSafeRoute() {
    if (startMarker && destinationMarker) {
        const start = startMarker.getPosition();
        const end = destinationMarker.getPosition();

        // 경유지 좌표 추출
        const waypoints = waypointMarkers.map(marker => ({
            lat: marker.getPosition().lat(),
            lon: marker.getPosition().lng()
        }));

        console.log("안전 경로 찾기");

        // 이전 경로 삭제
        clearCurrentPolyline();

        try {
            const response = await fetch("/.netlify/functions/calculate_route", {
            // const response = await fetch("http://127.0.0.1:5000/calculate_route", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    start: { lat: start.lat(), lon: start.lng() },
                    end: { lat: end.lat(), lon: end.lng() },
                    waypoints: waypoints // 경유지 정보 추가
                })
            });

            const data = await response.json();

            if (data.safety_path) {
                parseSafetyRoute(data.safety_path);
                const safeRouteButton = document.getElementById("safeRoute");
                safeRouteButton.classList.add("edit-active");
            } else {
                alert("안전 경로를 찾을 수 없습니다.");
            }
        } catch (error) {
            console.error("Failed to fetch safe route:", error);
            alert("안전 경로 요청 중 오류가 발생했습니다.");
        }
    } else {
        console.warn("출발지와 목적지를 설정해주세요.");
    }
}


// 안전 경로 데이터를 기반으로 Polyline을 지도에 그리는 함수
function parseSafetyRoute(routeEdges) {
    const pathCoordinates = routeEdges.map(edge => new google.maps.LatLng(edge.start[1], edge.start[0]));

    // 기존 경로 제거 후 새 경로 표시
    if (window.currentPolyline) {
        window.currentPolyline.setMap(null);
    }
    window.currentPolyline = new google.maps.Polyline({
        path: pathCoordinates,
        geodesic: true,
        strokeColor: "#00FF00", // 안전 경로 색상: 녹색
        strokeOpacity: 1.0,
        strokeWeight: 6
    });

    window.currentPolyline.setMap(map); // Google Maps에 경로 표시
}

async function findShortestRoute() {
    if (startMarker && destinationMarker) {
        const start = startMarker.getPosition();
        const end = destinationMarker.getPosition();
        
        console.log("최단 경로 찾기");

        // 이전 경로 삭제 (새로운 최단 경로를 그리기 전 기존 경로 제거)
        clearCurrentPolyline();

        // 경유지 좌표 추출
        const waypoints = waypointMarkers.map(marker => ({
            lat: marker.getPosition().lat(),
            lng: marker.getPosition().lng()
        }));

        // Tmap API 요청을 통해 경유지를 포함한 경로 데이터를 가져옴
        try {
            const response = await $.ajax({
                method: "POST",
                headers: { "appKey": "Qo2Dzd0MGI2AyknkLTB8U6jqfAz5UwUA3gaqwxjj" },
                url: "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json",
                data: {
                    startX: start.lng(),
                    startY: start.lat(),
                    endX: end.lng(),
                    endY: end.lat(),
                    reqCoordType: "WGS84GEO",
                    resCoordType: "WGS84GEO",
                    startName: "출발지",
                    endName: "목적지",
                    passList: waypoints.map(point => `${point.lng},${point.lat}`).join('_') // 경유지 포함
                }
            });

            // 응답 데이터 처리 및 경로 그리기
            parseRoute(response);

            // 최단 경로 버튼 활성화 스타일 추가
            const shortestRouteButton = document.getElementById("shortestRoute");
            shortestRouteButton.classList.add("edit-active");
        } catch (error) {
            console.error("Failed to fetch the route:", error);
        }
    } else {
        console.warn("출발지와 목적지를 설정해주세요.");
    }
}

// 다른 버튼을 클릭할 때 현재 표시된 폴리라인 제거
function clearCurrentPolyline() {
    if (window.currentPolyline) {
        window.currentPolyline.setMap(null);
        window.currentPolyline = null;
    }
}

// 경로 편집 또는 다른 버튼 클릭 시 활성화 상태 초기화 및 기존 폴리라인 제거
function resetRouteButtons() {
    clearCurrentPolyline();
    const routeButtons = document.querySelectorAll(".route-controls button");
    routeButtons.forEach(button => button.classList.remove("edit-active"));
}

// 경로편집
function editCurrentRoute() {
    isEditMode = !isEditMode; // 토글형으로 상태 변경
    const editRouteButton = document.getElementById("editRoute");

    if (isEditMode) {
        // 활성화 상태로 변경
        editRouteButton.classList.add("edit-active");
        console.log('경로 편집 모드 활성화');
        // 필요한 경로 편집 기능 로직을 여기에 추가
    } else {
        // 비활성화 상태로 변경
        editRouteButton.classList.remove("edit-active");
        clearWaypointMarkers();
        console.log('경로 편집 모드 비활성화');
        // 경로 편집 모드 해제 시 수행할 추가 작업
    }
}

// 경유지 추가 제한 시 모달 표시
function showModal(message) {
    const modal = document.getElementById("modal");
    const modalMessage = modal.querySelector("p");
    modalMessage.textContent = message;
    modal.style.display = "block";
}

// 모달 닫기 버튼 이벤트 리스너
document.getElementById("close-modal").addEventListener("click", () => {
    document.getElementById("modal").style.display = "none";
});

// 모달 외부 클릭 시 닫기
window.addEventListener("click", (event) => {
    const modal = document.getElementById("modal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
});

// 경유지 마커 추가
function addWaypointMarker(position) {
    if (waypointMarkers.length >= 5) {
        showModal("경유지는 최대 5개까지 설정할 수 있습니다.");
        return; // 경유지 5개 초과 시 함수 종료
    }

    const waypointMarker = new google.maps.Marker({
        position: position,
        map: map,
        title: "경유지",
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#00FF00', // 초록색
            fillOpacity: 0.8,
            strokeWeight: 2,
            strokeColor: '#FFFFFF'
        },
        animation: google.maps.Animation.DROP
    });

    waypointMarkers.push(waypointMarker); // 배열에 경유지 마커 추가
    console.log("경유지 추가:", position);
}

// 경유지 초기화 기능 (경로 편집 해제 시 경유지 마커 제거)
function clearWaypointMarkers() {
    waypointMarkers.forEach(marker => marker.setMap(null));
    waypointMarkers = [];
}

// Tmap API 응답 데이터를 파싱하여 지도에 Polyline으로 표시하는 함수
function parseRoute(data) {
    const pathCoordinates = [];

    if (data && data.features) {
        const features = data.features;
        features.forEach(feature => {
            if (feature.geometry && feature.geometry.type === "LineString") {
                feature.geometry.coordinates.forEach(coord => {
                    const [lng, lat] = coord;
                    pathCoordinates.push(new google.maps.LatLng(lat, lng));
                });
            }
        });
    } else {
        console.error("Invalid route data:", data);
        return;
    }

    // 기존 경로 제거 후 새 경로 표시
    if (window.currentPolyline) {
        window.currentPolyline.setMap(null);
    }
    window.currentPolyline = new google.maps.Polyline({
        path: pathCoordinates,
        geodesic: true,
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 6
    });

    window.currentPolyline.setMap(map); // Google Maps에 경로 표시

    // 경로가 정상적으로 그려진 후 저장 버튼 활성화
    enableSaveRouteButton();
}

// 저장 버튼 활성화 함수
function enableSaveRouteButton() {
    saveRouteButton.disabled = false;
    saveRouteButton.classList.add("active"); // 활성화 시 스타일 추가
}

// 저장 버튼 클릭 시 이벤트
saveRouteButton.addEventListener("click", () => {
    if (!saveRouteButton.disabled) {
        sendRouteToServer(); // 서버로 경로 전송
    }
});

// 사용자 경로 정보를 서버로 전송
async function sendRouteToServer() {
    const userParams = getQueryParams();
    const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));

    // 경로 정보를 위한 startLocation 및 endLocation 준비
    const startLocation = startMarker ? { latitude: startMarker.getPosition().lat(), longitude: startMarker.getPosition().lng() } : null;
    const endLocation = destinationMarker ? { latitude: destinationMarker.getPosition().lat(), longitude: destinationMarker.getPosition().lng() } : null;

    // 폴리라인 경로에서 waypoints 추출 (폴리라인의 모든 좌표를 waypoints로 사용)
    const waypoints = window.currentPolyline
        ? window.currentPolyline.getPath().getArray().map(latlng => ({
            latitude: latlng.lat(),
            longitude: latlng.lng()
        }))
        : [];

    // RouteRequest 객체 생성
    const routeRequest = {
        userName: userParams.name, // URL에서 전달받은 이름
        groupKey: userInfo.groupKey, // sessionStorage에서 가져온 groupKey
        route: { // Route 객체 생성
            startLocation: startLocation,
            endLocation: endLocation,
            waypoints: waypoints // 폴리라인 좌표를 경유지로 전송
        }
    };

    // 서버 전송 전 JSON 데이터 확인
    console.log("RouteRequest JSON:", JSON.stringify(routeRequest));

    // 서버로 전송
    try {
        const response = await fetch(`${BASE_URL}/set-route`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(routeRequest)
        });

        if (response.ok) {
            console.log("경로가 서버에 성공적으로 전송되었습니다.");
            alert("경로가 저장되었습니다.");
        } else {
            console.error("서버에 경로 전송 실패:", response.statusText);
            alert("경로 저장에 실패했습니다.");
        }
    } catch (error) {
        console.error("서버 요청 중 오류 발생:", error);
        alert("서버 요청 중 오류가 발생했습니다.");
    }
}

//마커 관련 코드
let markerGroups = {
    accidents: [],
    bell: [],
    cctv: [],
    convenience: [],
    crime: [],
    fire_fighting: [],
    school_zone: []
};

// 마커 데이터 로드 함수
function loadMarkersForCategory(category) {
    const fileName = fileMapping[category] || category;
    fetch(`./resource/${fileName}.geojson`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => createMarkers(category, data))
        .catch(error => {
            console.error(`Error loading markers for ${category}:`, error);
        });
}

// 마커 생성 함수
function createMarkers(category, data) {
    // 기존 마커 제거
    if (markerGroups[category]) {
        markerGroups[category].forEach(marker => marker.setMap(null));
        markerGroups[category] = [];
    }

    data.features.forEach(feature => {
        const coords = feature.geometry.coordinates;
        const position = { lat: coords[1], lng: coords[0] };

        const marker = new google.maps.Marker({
            position: position,
            map: null, // 초기에는 보이지 않음
            icon: markerIcons[category],
            title: feature.properties?.name || category
        });

        // 클릭 이벤트 추가
        marker.addListener('click', () => {
            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div class="marker-info">
                        <h3>${feature.properties?.name || category.toUpperCase()}</h3>
                        <p>${feature.properties?.description || ''}</p>
                    </div>
                `
            });
            infoWindow.open(map, marker);
        });

        markerGroups[category].push(marker);
    });
}

// 마커 정보 표시 함수
function showMarkerInfo(category, item) {
    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div class="marker-info">
                <h3>${item.name || category.toUpperCase()}</h3>
                <p>${item.description || ''}</p>
            </div>
        `
    });

    infoWindow.open(map, marker);
}

// 마커 표시/숨김 토글 함수
function toggleMarkers(category) {
    const checkbox = document.getElementById(`marker-${category}`);
    if (!checkbox) return;

    const isVisible = checkbox.checked;
    if (markerGroups[category]) {
        markerGroups[category].forEach(marker => {
            marker.setMap(isVisible ? map : null);
        });
    }
}

window.initMap = initMap;
let BASE_URL;
let WEATHER_API_KEY; // 날씨 API 키

fetch('../config.json')
  .then(response => response.json())
  .then(config => {
    BASE_URL = config.BASE_URL;
    WEATHER_API_KEY = config.WEATHER_API_KEY; // 날씨 API 키
    console.log(BASE_URL);
  })
  .catch(error => console.error('Failed to load configuration:', error));

let map;
let markers = [];
let routePath;
let endMarker;

// 모달 DOM 요소
const infoModal = document.getElementById("infoModal");
const modalUserName = document.getElementById("modalUserName");
const modalLocationInfo = document.getElementById("modalLocationInfo");
const closeModalBtn = document.getElementById("closeModalBtn");
const streetViewBtn = document.getElementById("streetViewBtn");
const routeBtn = document.getElementById("routeBtn");

// 경로 정보 패널 관련 변수 및 DOM 요소
const routeInfoPanel = document.querySelector(".route-info-panel");
const togglePanelBtn = document.getElementById("togglePanelBtn");
const routeDetails = document.getElementById("routeDetails");

function initMap() {
    const defaultPosition = { lat: 34.8118, lng: 126.3921 };

    map = new google.maps.Map(document.getElementById("map"), {
        center: defaultPosition,
        zoom: 14,
        styles: [
            {
                featureType: "all",
                elementType: "labels.icon",
                stylers: [{ visibility: "off" }]
            }
        ],
        // 불필요한 UI 요소 비활성화
        zoomControl: false,
        fullscreenControl: false,
        mapTypeControl: true,  // 위성/지도 전환 버튼만 활성화
        streetViewControl: false
    });

    const groupInfo = JSON.parse(sessionStorage.getItem("groupInfo"));
    const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));

    if (!groupInfo || !groupInfo.groupMember) {
        showUserLocationOnly();
    } else {
        displayGroupMarkers(groupInfo, userInfo);
    }

    // 사용자 경로 표시
    if (userInfo && userInfo.route) {
        displayUserRoute();
    }
}

function createCustomMarker(position, title, memberData, isCurrentUser = false) {
    const markerDiv = document.createElement('div');
    markerDiv.className = `custom-marker ${isCurrentUser ? 'pulse' : ''}`;
    markerDiv.style.backgroundColor = isCurrentUser ? '#FF4444' : '#4285f4';

    const labelDiv = document.createElement('div');
    labelDiv.className = 'marker-label';
    labelDiv.textContent = title;

    const containerDiv = document.createElement('div');
    containerDiv.appendChild(labelDiv);
    containerDiv.appendChild(markerDiv);

    const overlay = new google.maps.OverlayView();

    overlay.onAdd = function() {
        const panes = this.getPanes();
        panes.overlayMouseTarget.appendChild(containerDiv);
    };

    overlay.draw = function() {
        const projection = this.getProjection();
        const point = projection.fromLatLngToDivPixel(position);

        if (point) {
            containerDiv.style.left = (point.x - 15) + 'px';
            containerDiv.style.top = (point.y - 35) + 'px';
            containerDiv.style.position = 'absolute';
        }
    };

    overlay.onRemove = function() {
        containerDiv.parentNode.removeChild(containerDiv);
    };

    // 클릭 이벤트 추가: 현재 사용자가 아닌 경우에만 모달 표시
    if (!isCurrentUser) {
        markerDiv.addEventListener('click', () => {
            showModal(memberData); // 모달 표시 함수 호출
        });
    }

    overlay.setMap(map); // Google Maps에 오버레이 추가
    return overlay;
}


function showModal(memberData) {
    if (!memberData) return;
    
    modalUserName.textContent = memberData.groupMemberName;
    modalLocationInfo.textContent = `위도: ${memberData.latitude}, 경도: ${memberData.longitude}`;

    // Geocoding API를 사용하여 주소 변환
    const geocoder = new google.maps.Geocoder();
    const latlng = { lat: parseFloat(memberData.latitude), lng: parseFloat(memberData.longitude) };
    
    geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === "OK") {
            if (results[0]) {
                // 한국어 주소를 포함한 상세 주소 표시
                const address = results[0].formatted_address;
                const addressElement = document.createElement("p");
                addressElement.textContent = `주소: ${address}`;
                modalLocationInfo.appendChild(addressElement);
            } else {
                console.error("No results found");
            }
        } else {
            console.error("Geocoder failed due to: " + status);
        }
    });

    infoModal.classList.add("show");

    streetViewBtn.onclick = () => openStreetView(memberData);
    routeBtn.onclick = () => openRoutePage(memberData);
}


function openStreetView(memberData) {
    const latitude = memberData.latitude;
    const longitude = memberData.longitude;

    // streetview.html로 이동하여 lat, lng 값을 쿼리 파라미터로 전달
    window.location.href = `streetview.html?lat=${latitude}&lng=${longitude}`;
}

// route창을 열면서 멤버의 이름, 위치 전달
function openRoutePage(memberData) {
    const { groupMemberName, latitude, longitude } = memberData;
    const url = `route/route.html?name=${encodeURIComponent(groupMemberName)}&lat=${latitude}&lng=${longitude}`;
    window.location.href = url;
}


function showUserLocationOnly() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const userPosition = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };
            addMarker(userPosition, "나의 위치", true);
            map.setCenter(userPosition);
        }, 
        (error) => {
            console.error("사용자 위치를 가져오는 중 오류 발생:", error);
        });
    }
}

function displayGroupMarkers(groupInfo, userInfo) {
    const currentUserName = userInfo.userName;

    groupInfo.groupMember.forEach((member) => {
        const memberName = member.groupMemberName;
        const latitude = member.latitude;
        const longitude = member.longitude;

        if (latitude !== null && longitude !== null) {
            const memberPosition = { lat: parseFloat(latitude), lng: parseFloat(longitude) };
            const isCurrentUser = memberName === currentUserName;

            createCustomMarker(memberPosition, memberName, member, isCurrentUser);
        }
    });
}


function addMarker(position, title, isCurrentUser = false) {
    const marker = createCustomMarker(position, title, isCurrentUser);
    marker.setMap(map);
    markers.push(marker);

    if (!isCurrentUser) {
        google.maps.event.addListener(marker, 'click', () => {
            showModal({ groupMemberName: title, latitude: position.lat, longitude: position.lng });
        });
    }
}



function updateMarkerPosition(markerId, newPosition, title, isCurrentUser = false) {
    if (markers[markerId]) {
        markers[markerId].setMap(null);
    }
    markers[markerId] = createCustomMarker(newPosition, title, isCurrentUser).setMap(map);
}

// 모달 닫기 버튼 이벤트
closeModalBtn.addEventListener("click", () => {
    infoModal.classList.remove("show");
});

// 패널 토글 버튼 클릭 이벤트
togglePanelBtn.addEventListener("click", () => {
    routeInfoPanel.classList.toggle("collapsed");
    togglePanelBtn.textContent = routeInfoPanel.classList.contains("collapsed") ? "▲" : "▼";
});

// sessionStorage에 저장된 경로 정보 표시 함수
function displayUserRoute() {
    const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));
    const routeInfoPanel = document.querySelector(".route-info-panel");

    // userInfo가 없거나 route 정보가 없는 경우 패널 숨김 처리
    if (!userInfo || !userInfo.route || !userInfo.route.startLocation || !userInfo.route.endLocation) {
        routeInfoPanel.style.display = 'none'; // display: none으로 완전히 숨김
        return;
    }

    // 경로 정보가 있는 경우 패널 표시
    routeInfoPanel.style.display = 'block';

    const { route } = userInfo;
    const startLocation = route.startLocation;
    const endLocation = route.endLocation;
    const waypoints = route.waypoints || [];

    // 지오코딩을 통해 도착지 주소 가져오기
    const geocoder = new google.maps.Geocoder();
    const endLatLng = { lat: endLocation.latitude, lng: endLocation.longitude };

    geocoder.geocode({ location: endLatLng }, (results, status) => {
        let endAddress = "주소 정보 없음";
        if (status === "OK" && results[0]) {
            endAddress = results[0].formatted_address;
        }

        // 이동 거리와 예상 시간 계산
        const distance = calculateTotalDistance([startLocation, ...waypoints, endLocation]);
        const estimatedTime = calculateEstimatedTime(distance);

        // 경로 정보 패널에 표시
        const routeDetails = document.getElementById("routeDetails");
        routeDetails.innerHTML = `
            <strong>도착지 주소:</strong> ${endAddress}<br>
            <strong>이동 거리:</strong> ${distance.toFixed(2)} km<br>
            <strong>예상 시간:</strong> ${estimatedTime} 분
        `;

        // 지도에 경로 표시
        drawRouteOnMap(route);
    });
}

// 경로를 지도에 표시하는 함수
function drawRouteOnMap(route) {
    const pathCoordinates = [
        { lat: route.startLocation.latitude, lng: route.startLocation.longitude },
        ...route.waypoints.map(waypoint => ({ lat: waypoint.latitude, lng: waypoint.longitude })),
        { lat: route.endLocation.latitude, lng: route.endLocation.longitude }
    ];

    routePath = new google.maps.Polyline({
        path: pathCoordinates,
        geodesic: true,
        strokeColor: "#FF6347",
        strokeOpacity: 1.0,
        strokeWeight: 5,
    });

    routePath.setMap(map);

    // 도착지 마커 생성
    const endPosition = {
        lat: route.endLocation.latitude,
        lng: route.endLocation.longitude
    };
    endMarker = createDestinationMarker(endPosition); // 도착 마커를 endMarker로 저장
}

//도착지 마커 표시
function createDestinationMarker(position) {
    const markerDiv = document.createElement('div');
    markerDiv.className = 'route-marker';

    const labelDiv = document.createElement('div');
    labelDiv.className = 'route-marker-label';
    labelDiv.textContent = '도착지';

    const containerDiv = document.createElement('div');
    containerDiv.appendChild(labelDiv);
    containerDiv.appendChild(markerDiv);

    const overlay = new google.maps.OverlayView();

    overlay.onAdd = function() {
        const panes = this.getPanes();
        panes.overlayMouseTarget.appendChild(containerDiv);
    };

    overlay.draw = function() {
        const projection = this.getProjection();
        const point = projection.fromLatLngToDivPixel(position);

        if (point) {
            containerDiv.style.left = (point.x - 13) + 'px';
            containerDiv.style.top = (point.y - 30) + 'px';
            containerDiv.style.position = 'absolute';
        }
    };

    overlay.onRemove = function() {
        containerDiv.parentNode.removeChild(containerDiv);
    };

    overlay.setMap(map);
    return overlay;
}

// 경로의 총 거리 계산 (단위: km)
function calculateTotalDistance(points) {
    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
        const start = points[i];
        const end = points[i + 1];
        totalDistance += calculateDistanceBetween(start, end);
    }
    return totalDistance;
}

// 두 지점 간 거리 계산 함수 (단위: km)
function calculateDistanceBetween(start, end) {
    const R = 6371; // 지구 반경 (km)
    const dLat = (end.latitude - start.latitude) * (Math.PI / 180);
    const dLng = (end.longitude - start.longitude) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(start.latitude * (Math.PI / 180)) *
              Math.cos(end.latitude * (Math.PI / 180)) *
              Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// 예상 시간 계산 (평균 속도 5 km/h 기준, 단위: 분)
function calculateEstimatedTime(distance) {
    const averageSpeed = 5; // km/h
    const estimatedTime = (distance / averageSpeed) * 60; // 분 단위로 계산
    return estimatedTime.toFixed(2); // 소수점 2자리까지 표시
}

// 도착 버튼 클릭 이벤트
document.getElementById("arrivalButton").addEventListener("click", () => {
    const arrivalModal = document.getElementById("arrivalConfirmationModal");
    arrivalModal.classList.remove("hidden"); // hidden 클래스를 제거
    arrivalModal.classList.add("show"); // show 클래스를 추가하여 표시
});

// 취소 버튼 클릭 시 모달 닫기
document.getElementById("cancelArrivalBtn").addEventListener("click", () => {
    const arrivalModal = document.getElementById("arrivalConfirmationModal");
    arrivalModal.classList.add("hidden");
    arrivalModal.classList.remove("show");
});

// 모달의 확인 버튼 클릭 시 경로 삭제 및 업데이트 수행
document.getElementById("confirmArrivalBtn").addEventListener("click", async () => {
    const arrivalModal = document.getElementById("arrivalConfirmationModal");
    arrivalModal.classList.add("hidden");
    arrivalModal.classList.remove("show");

    try {
        await deleteRouteFromServer(); // 서버로 경로 삭제 요청
        clearRouteAndMarker(); // 경로와 도착 마커 삭제
        updateUserInfoInSession(); // sessionStorage에 userInfo 업데이트
        console.log("도착 처리 완료");
    } catch (error) {
        console.error("도착 처리 중 오류 발생:", error);
    }
});

// 서버에 경로 삭제 요청
async function deleteRouteFromServer() {
    const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));
    if (!userInfo || !userInfo.userName) {
        throw new Error("사용자 정보가 없습니다.");
    }

    const response = await fetch(`${BASE_URL}/delete-route`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(userInfo)
    });

    if (!response.ok) {
        throw new Error("경로 삭제 요청 실패");
    }
}

// 경로와 도착 마커 삭제
function clearRouteAndMarker() {
    // 경로 폴리라인 삭제
    if (routePath) {
        routePath.setMap(null);
        routePath = null;
    }
    // 도착 마커 삭제
    if (endMarker) {
        endMarker.setMap(null);
        endMarker = null;
    }
    // 경로 정보 패널 숨김
    routeInfoPanel.style.display = 'none';
}

// sessionStorage의 userInfo에서 route 정보 비우기
function updateUserInfoInSession() {
    const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));
    userInfo.route = null; // route 정보를 null로 설정
    sessionStorage.setItem("userInfo", JSON.stringify(userInfo));
}

// 격자 좌표 변환 함수
function toGridCoordinates(lat, lon) {
    const RE = 6371.00877; // 지구 반경(km)
    const GRID = 5.0; // 격자 간격(km)
    const SLAT1 = 30.0;
    const SLAT2 = 60.0;
    const OLON = 126.0; // 기준점의 경도
    const OLAT = 38.0; // 기준점의 위도
    const XO = 43;
    const YO = 136;

    const DEGRAD = Math.PI / 180.0;
    const RADDEG = 180.0 / Math.PI;

    const re = RE / GRID;
    const slat1 = SLAT1 * DEGRAD;
    const slat2 = SLAT2 * DEGRAD;
    const olon = OLON * DEGRAD;
    const olat = OLAT * DEGRAD;

    let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
    let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
    let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
    ro = (re * sf) / Math.pow(ro, sn);
    const rs = {};

    let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
    ra = (re * sf) / Math.pow(ra, sn);
    let theta = lon * DEGRAD - olon;
    if (theta > Math.PI) theta -= 2.0 * Math.PI;
    if (theta < -Math.PI) theta += 2.0 * Math.PI;
    theta *= sn;
    rs['nx'] = Math.floor(ra * Math.sin(theta) + XO + 0.5);
    rs['ny'] = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);
    return rs;
}

// 기상청 API 요청을 위한 날짜 및 시각 설정 함수
function getBaseDateTime() {
    const now = new Date();

    // 현재 날짜 (YYYYMMDD 형식)
    const baseDate = now.toISOString().slice(0, 10).replace(/-/g, ''); // 예: 20231118

    // 현재 시간을 기준으로 가장 가까운 baseTime 설정
    const hours = now.getHours();
    const minutes = now.getMinutes();

    let baseTime;
    if (hours >= 23 || (hours === 0 && minutes < 10)) {
        baseTime = '2300';
    } else if (hours >= 20 || (hours === 21 && minutes < 10)) {
        baseTime = '2000';
    } else if (hours >= 17 || (hours === 18 && minutes < 10)) {
        baseTime = '1700';
    } else if (hours >= 14 || (hours === 15 && minutes < 10)) {
        baseTime = '1400';
    } else if (hours >= 11 || (hours === 12 && minutes < 10)) {
        baseTime = '1100';
    } else if (hours >= 8 || (hours === 9 && minutes < 10)) {
        baseTime = '0800';
    } else if (hours >= 5 || (hours === 6 && minutes < 10)) {
        baseTime = '0500';
    } else {
        baseTime = '0200';
    }

    return { baseDate, baseTime };
}

// 날씨 정보 가져오기
function loadWeather() {
    const weatherInfo = document.getElementById('weatherInfo');
    const weatherDescription = document.getElementById('weatherDescription');
    const temperature = document.getElementById('temperature');

    const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));
    const { locationInfo } = userInfo || {};

    if (locationInfo && locationInfo.latitude && locationInfo.longitude) {
        const { latitude, longitude } = locationInfo;
        const { nx, ny } = toGridCoordinates(latitude, longitude);
        const today = new Date();
        const { baseDate, baseTime } = getBaseDateTime();

        // Netlify Function을 통해 요청
        fetch(`/netlify/functions/getWeather?nx=${nx}&ny=${ny}&baseDate=${baseDate}&baseTime=${baseTime}&serviceKey=${WEATHER_API_KEY}`)
            .then(response => response.json())
            .then(data => {
                if (data.response && data.response.body && data.response.body.items) {
                    const items = data.response.body.items.item;
                    const temperatureData = items.find(item => item.category === "T1H");
                    const weatherData = items.find(item => item.category === "PTY");

                    if (temperatureData) {
                        temperature.textContent = `온도: ${temperatureData.obsrValue}°C`;
                    }
                    if (weatherData) {
                        const weatherDescriptionMap = {
                            '0': '맑음',
                            '1': '비',
                            '2': '비/눈',
                            '3': '눈',
                            '5': '빗방울',
                            '6': '빗방울눈날림',
                            '7': '눈날림'
                        };
                        weatherDescription.textContent = `날씨: ${weatherDescriptionMap[weatherData.obsrValue]}`;
                    }

                    weatherInfo.classList.remove('hidden');
                    weatherInfo.classList.add('show');
                } else {
                    console.error("No weather data found");
                }
            })
            .catch(error => console.error("Error fetching weather data:", error));
    } else {
        console.error("Location information not available in userInfo.");
    }
}


document.addEventListener("DOMContentLoaded", () => {
    // userInfo에 locationInfo가 설정될 때까지 기다림
    const checkLocationInfoInterval = setInterval(() => {
        const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));
        if (userInfo && userInfo.locationInfo) {
            clearInterval(checkLocationInfoInterval); // 위치 정보가 설정되면 반복 종료
            loadWeather(); // 위치 정보가 준비되면 loadWeather 호출
        }
    }, 1000); // 1초마다 확인
});

window.onload = initMap;
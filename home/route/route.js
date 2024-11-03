let map, startMarker, destinationMarker;
let startSelected = false;
let destinationSelected = false;

const fileMapping = {
    bell: 'emergency_bell',
    // 필요시 추가 파일 매핑
};

let markerIcons;

function initMap() {
    const mokpo = { lat: 34.8118, lng: 126.3922 };
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
        center: mokpo,
        disableDefaultUI: true,
        mapTypeControl: true
    });

    // 이제 `google` 객체가 초기화되었으므로 `markerIcons` 정의
    markerIcons = {
        accidents: { url: './marker_image/accidents.png', scaledSize: new google.maps.Size(50, 50) },
        bell: { url: './marker_image/bell.png', scaledSize: new google.maps.Size(50, 50) },
        cctv: { url: './marker_image/cctv.png', scaledSize: new google.maps.Size(50, 50) },
        convenience: { url: './marker_image/convenience.png', scaledSize: new google.maps.Size(50, 50) },
        crime: { url: './marker_image/crime.png', scaledSize: new google.maps.Size(50, 50) },
        fire_fighting: { url: './marker_image/fire_fighting.png', scaledSize: new google.maps.Size(50, 50) },
        school_zone: { url: './marker_image/school_zone.png', scaledSize: new google.maps.Size(50, 50) }
    };

    const userParams = getQueryParams();
    if (userParams.latitude && userParams.longitude) {
        const userPosition = new google.maps.LatLng(userParams.latitude, userParams.longitude);
        addMarkerWithAnimation('start', userPosition);
    }

    fetch('./data/safety_mokpo_final.geojson')
        .then(response => response.json())
        .then(data => {
            map.data.addGeoJson(data);
            map.data.setStyle({ clickable: true });
            styleRoads();
        });

    map.addListener('click', handleMapClick);
    addTooltips();
}

document.addEventListener("DOMContentLoaded", () => {
    // findRoute 버튼 이벤트 리스너
    const findRouteButton = document.getElementById("findRoute");
    findRouteButton.onclick = function() {
        if (startMarker && destinationMarker) {
            calculateRoute(startMarker.getPosition(), destinationMarker.getPosition());
        }
    };

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


function getQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        name: urlParams.get('name'),
        latitude: parseFloat(urlParams.get('lat')),
        longitude: parseFloat(urlParams.get('lng'))
    };
}

function handleMapClick(event) {
    if (startSelected && destinationSelected) return;

    const position = event.latLng;

    if (!startSelected) {
        addMarkerWithAnimation('start', position);
    } else if (!destinationSelected) {
        addMarkerWithAnimation('destination', position);
        enableFindRouteButton();
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

function calculateRoute(start, destination) {
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true
    });

    directionsService.route(
        {
            origin: start,
            destination: destination,
            travelMode: google.maps.TravelMode.WALKING
        },
        (response, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(response);
            } else {
                console.error("경로 요청 실패:", status);
            }
        }
    );
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
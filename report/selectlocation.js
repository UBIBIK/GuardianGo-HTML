let map;
let marker = null;
let selectedLocation = null;

// 지도 초기화
function initMap() {
    const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));
    const defaultLocation = userInfo && userInfo.locationInfo
        ? { lat: userInfo.locationInfo.latitude, lng: userInfo.locationInfo.longitude }
        : { lat: 34.8118351, lng: 126.3921664 }; // 기본 좌표 설정

    map = new google.maps.Map(document.getElementById('map'), {
        center: defaultLocation,
        zoom: 15,
        styles: [
            {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
            }
        ],
        mapTypeControl: false,
        streetViewControl: false
    });

    // 지도 클릭 이벤트 리스너
    map.addListener('click', (e) => {
        placeMarker(e.latLng);
    });

    // 모바일 환경 대응: 지도가 로드된 후 크기를 다시 계산
    google.maps.event.addListenerOnce(map, 'tilesloaded', () => {
        setTimeout(() => {
            google.maps.event.trigger(map, 'resize');
            map.setCenter(defaultLocation); // 센터 재설정
        }, 500); // 일정 시간 지연 후 resize 이벤트
    });
}

// 마커 생성 함수
function placeMarker(location) {
    if (marker) {
        marker.setMap(null);
    }

    // 커스텀 마커 생성
    marker = new google.maps.Marker({
        position: location,
        map: map,
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="8" fill="red" stroke="white" stroke-width="2"/>
                </svg>
            `),
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 12)
        }
    });

    marker.setAnimation(google.maps.Animation.DROP);

    selectedLocation = location;

    const nextBtn = document.getElementById('next-btn');
    nextBtn.classList.add('active');
    nextBtn.disabled = false;

    showPopup();
}

// 팝업 표시 함수
function showPopup() {
    const popup = document.getElementById('marker-popup');
    popup.classList.add('show');
    setTimeout(() => popup.classList.remove('show'), 2000);
}

// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', () => {
    initMap();

    document.getElementById('reset-btn').addEventListener('click', () => {
        if (marker) {
            marker.setMap(null);
            marker = null;
            selectedLocation = null;
            const nextBtn = document.getElementById('next-btn');
            nextBtn.classList.remove('active');
            nextBtn.disabled = true;
        }
    });

    document.getElementById('next-btn').addEventListener('click', () => {
        if (selectedLocation) {
            window.location.href = `report.html?lat=${selectedLocation.lat()}&lng=${selectedLocation.lng()}`;
        }
    });
});

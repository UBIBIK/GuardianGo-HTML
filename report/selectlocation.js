let map;
let marker = null;
let selectedLocation = null;

// 지도 초기화
function initMap() {
    const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));
    const defaultLocation = userInfo && userInfo.locationInfo
        ? { lat: userInfo.locationInfo.latitude, lng: userInfo.locationInfo.longitude }
        : { lat: 34.8118351, lng: 126.3921664 }; // userInfo가 없을 때 기본 좌표
    
    map = new google.maps.Map(document.getElementById('map'), {
        center: defaultLocation,
        zoom: 12,
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
}

// 마커 생성 함수
function placeMarker(location) {
    // 기존 마커 제거
    if (marker) {
        marker.setMap(null);
    }

    // 커스텀 마커 element 생성
    const markerElement = document.createElement('div');
    markerElement.className = 'custom-marker';

    // 새 마커 생성
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

    // 마커 애니메이션
    marker.setAnimation(google.maps.Animation.DROP);

    // 위치 저장
    selectedLocation = location;

    // 다음 버튼 활성화
    const nextBtn = document.getElementById('next-btn');
    nextBtn.classList.add('active');
    nextBtn.disabled = false;

    // 팝업 표시
    showPopup();
}

// 팝업 표시 함수
function showPopup() {
    const popup = document.getElementById('marker-popup');
    popup.classList.add('show');
    
    setTimeout(() => {
        popup.classList.remove('show');
    }, 2000);
}

// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', () => {
    initMap();

    // 다시 선택하기 버튼
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

    // 다음 버튼
    document.getElementById('next-btn').addEventListener('click', () => {
        if (selectedLocation) {
            // 선택한 위치 좌표를 쿼리 파라미터로 추가하여 report.html로 이동
            window.location.href = `report.html?lat=${selectedLocation.lat()}&lng=${selectedLocation.lng()}`;
        }
    });
});
let map;
let markers = [];

// 모달 DOM 요소
const infoModal = document.getElementById("infoModal");
const modalUserName = document.getElementById("modalUserName");
const modalLocationInfo = document.getElementById("modalLocationInfo");
const closeModalBtn = document.getElementById("closeModalBtn");
const streetViewBtn = document.getElementById("streetViewBtn");
const routeBtn = document.getElementById("routeBtn");

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
            containerDiv.style.left = (point.x - 10) + 'px';
            containerDiv.style.top = (point.y - 10) + 'px';
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

window.onload = initMap;
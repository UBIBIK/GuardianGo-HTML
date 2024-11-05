// locationUpdater.js

// 서버 URL 및 주기적인 위치 업데이트 간격 설정 (10000ms = 10초)
//const BASE_URL = 'http://localhost:8080';

const BASE_URL = '/api'
const UPDATE_INTERVAL = 10000; // 10초마다 위치 업데이트

// 위치 정보를 서버에 전송하는 함수
async function sendLocationToServer(latitude, longitude) {
    try {
        const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
        if (!userInfo) {
            console.error('사용자 정보가 없습니다. 위치 전송을 중지합니다.');
            return;
        }

        // locationInfo에 위도와 경도를 추가
        const locationData = {
            latitude: latitude,
            longitude: longitude
        };

        const updatedUserInfo = {
            ...userInfo,
            locationInfo: locationData // locationInfo 필드에 위치 정보 추가
        };

        console.log(`전송할 위치 정보 - 위도: ${latitude}, 경도: ${longitude}`); // 위치 정보 로그

        const response = await fetch(`${BASE_URL}/save-location`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedUserInfo)
        });

        if (!response.ok) {
            throw new Error('위치 정보를 서버에 전송하는 중 오류 발생');
        }

        // 서버에서 업데이트된 Group 객체를 받는 경우 이를 sessionStorage에 저장
        const updatedGroupInfo = await response.json();
        sessionStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
        sessionStorage.setItem('groupInfo', JSON.stringify(updatedGroupInfo));

        console.log('위치 정보가 서버에 성공적으로 전송되었습니다.');

    } catch (error) {
        console.error('위치 전송 오류:', error);
    } 
}

// 주기적으로 위치를 업데이트하는 함수
function startLocationUpdates() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                
                // 현재 위치를 콘솔로 출력
                console.log(`현재 위치 - 위도: ${latitude}, 경도: ${longitude}`);

                sendLocationToServer(latitude, longitude);
            },
            (error) => {
                console.error('위치 정보를 가져오는 중 오류 발생:', error);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 5000,
            }
        );
    } else {
        console.error('Geolocation을 지원하지 않는 브라우저입니다.');
    }
}

// 위치 업데이트 시작
startLocationUpdates();

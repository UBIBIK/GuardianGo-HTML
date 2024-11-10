(() => {
    //const BASE_URL = 'http://localhost:8080';
    const BASE_URL = '/api'
    const UPDATE_INTERVAL = 5000; // 5초마다 위치 업데이트
    let locationAccessDenied = false; // 권한 거부 상태를 추적하는 변수

    async function sendLocationToServer(latitude, longitude) {
        try {
            const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
            if (!userInfo) {
                console.error('사용자 정보가 없습니다. 위치 전송을 중지합니다.');
                return;
            }

            const locationData = { latitude, longitude };
            const updatedUserInfo = { ...userInfo, locationInfo: locationData };

            console.log(`전송할 위치 정보 - 위도: ${latitude}, 경도: ${longitude}`);

            const response = await fetch(`${BASE_URL}/save-location`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedUserInfo)
            });

            if (!response.ok) {
                throw new Error('위치 정보를 서버에 전송하는 중 오류 발생');
            }

            const updatedGroupInfo = await response.json();
            sessionStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
            sessionStorage.setItem('groupInfo', JSON.stringify(updatedGroupInfo));
            console.log('위치 정보가 서버에 성공적으로 전송되었습니다.');
        } catch (error) {
            console.error('위치 전송 오류:', error);
        }
    }

    function updateLocationPeriodically() {
        if (navigator.geolocation) {
            setInterval(() => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        console.log(`현재 위치 - 위도: ${latitude}, 경도: ${longitude}`);
                        sendLocationToServer(latitude, longitude);
                        locationAccessDenied = false; // 위치 정보를 얻으면 권한 거부 상태 해제
                    },
                    (error) => {
                        if (error.code === error.PERMISSION_DENIED && !locationAccessDenied) {
                            console.warn("위치 권한이 거부되었습니다. 설정에서 권한을 허용해 주세요.");
                            alert("위치 정보를 사용할 수 없습니다. 위치 권한을 허용해 주세요.");
                            locationAccessDenied = true; // 권한 거부 상태 설정
                        } else {
                            console.error('위치 정보를 가져오는 중 오류 발생:', error);
                        }
                    },
                    { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
                );
            }, UPDATE_INTERVAL);
        } else {
            console.error('Geolocation을 지원하지 않는 브라우저입니다.');
        }
    }

    updateLocationPeriodically();
})();

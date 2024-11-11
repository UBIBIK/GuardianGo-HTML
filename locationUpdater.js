(() => {
    const BASE_URL = '/api';
    const UPDATE_INTERVAL = 5000;

    async function sendLocationToServer(latitude, longitude) {
        try {
            const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
            if (!userInfo) {
                console.error('사용자 정보가 없습니다. 위치 전송을 중지합니다.');
                return;
            }

            const locationData = { latitude, longitude };
            const updatedUserInfo = { ...userInfo, locationInfo: locationData };

            const response = await fetch(`${BASE_URL}/save-location`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedUserInfo)
            });

            if (!response.ok) {
                throw new Error('위치 정보를 서버에 전송하는 중 오류 발생');
            }

            const groupInfo = await response.json();
            sessionStorage.setItem('groupInfo', JSON.stringify(groupInfo));
            console.log('위치 정보가 서버에 성공적으로 전송되었습니다.');

        } catch (error) {
            console.error('위치 전송 오류:', error);
        }
    }

    function getLocationFromDevice() {
        if (typeof Android !== 'undefined' && Android.getLocation) {
            // Android 환경에서 위치 정보를 요청
            Android.getLocation();
        } else if (navigator.geolocation) {
            // PC 환경에서 위치 정보 가져오기
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    sendLocationToServer(latitude, longitude);
                },
                (error) => {
                    console.error(`위치 정보를 가져오는 중 오류 발생: ${error.message} (code: ${error.code})`);
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            console.warn("위치 권한이 거부되었습니다. 설정에서 권한을 허용해 주세요.");
                            break;
                        case error.POSITION_UNAVAILABLE:
                            console.warn("위치 정보를 사용할 수 없습니다.");
                            break;
                        case error.TIMEOUT:
                            console.warn("위치 정보를 가져오는 요청이 시간 초과되었습니다.");
                            break;
                        default:
                            console.warn("알 수 없는 오류가 발생했습니다.");
                            break;
                    }
                },
                { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
            );
        } else {
            console.error('위치 정보를 사용할 수 없는 환경입니다.');
        }
    }

    // Android에서 위치 정보를 전달받는 함수
    window.receiveLocationFromAndroid = function(latitude, longitude) {
        sendLocationToServer(latitude, longitude);
    };

    // 주기적으로 위치 업데이트 요청
    setInterval(getLocationFromDevice, UPDATE_INTERVAL);
})();

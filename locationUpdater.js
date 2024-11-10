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

            console.log('위치 정보가 서버에 성공적으로 전송되었습니다.');
        } catch (error) {
            console.error('위치 전송 오류:', error);
        }
    }

    function getLocationFromDevice() {
        if (typeof Android !== 'undefined' && Android.getLocation) {
            // Android 환경에서는 Android 인터페이스를 사용해 위치 정보 요청
            Android.getLocation();
        } else if (navigator.geolocation) {
            // PC 환경에서는 브라우저의 geolocation API 사용
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    sendLocationToServer(latitude, longitude);
                },
                (error) => console.error("위치 정보를 가져오는 중 오류 발생:", error),
                { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
            );
        } else {
            console.error('위치 정보를 사용할 수 없는 환경입니다.');
        }
    }

    // 주기적으로 위치 업데이트 요청
    setInterval(getLocationFromDevice, UPDATE_INTERVAL);
})();

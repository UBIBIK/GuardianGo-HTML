// userInfoUpdater.js
(() => {
    //const BASE_URL = 'http://localhost:8080';
    const BASE_URL = '/api'

    function getStoredUserInfo() {
        const userInfoString = sessionStorage.getItem("userInfo");
        return userInfoString ? JSON.parse(userInfoString) : null;
    }

    async function updateUserInfo() {
        const userInfo = getStoredUserInfo();
        if (!userInfo) {
            console.error("sessionStorage에 userInfo가 없습니다.");
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/return-userInfo`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userInfo)
            });

            if (response.ok) {
                const updatedUserInfo = await response.json();
                sessionStorage.setItem("userInfo", JSON.stringify(updatedUserInfo));
                console.log("userInfo가 최신 정보로 업데이트되었습니다:", updatedUserInfo);

                // 처음 한 번만 모달 창을 표시하는 로직
                if (updatedUserInfo.route && !sessionStorage.getItem("routeModalShown")) {
                    showRouteModal();
                    sessionStorage.setItem("routeModalShown", "true");
                }
            } else {
                console.error("userInfo 업데이트 실패:", response.statusText);
            }
        } catch (error) {
            console.error("서버와의 통신 중 오류 발생:", error);
        }
    }

    function showRouteModal() {
        // 모달 요소 생성
        const modal = document.createElement("div");
        modal.classList.add("modal-overlay");

        const modalContent = document.createElement("div");
        modalContent.classList.add("modal-content");
        modalContent.innerHTML = `
            <p>이동해야할 경로가 있습니다.</p>
            <button id="modal-ok-button">확인</button>
        `;
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // 모달 확인 버튼 클릭 시 홈 화면으로 이동
        document.getElementById("modal-ok-button").addEventListener("click", () => {
            modal.remove(); // 모달 제거
            window.location.href = '../home/home.html';
        });
    }

    // 첫 실행
    updateUserInfo();
    setInterval(updateUserInfo, 5000);
})();

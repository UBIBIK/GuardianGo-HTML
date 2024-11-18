let BASE_URL;
let currentZoom = 1;

document.addEventListener('DOMContentLoaded', () => {
    const reportList = document.getElementById('reportList');
    const modal = document.getElementById('reportDetailModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalImage = document.getElementById('modalImage');
    const modalMemo = document.getElementById('modalMemo');
    const reportDate = document.getElementById('reportDate');
    const reportLocation = document.getElementById('reportLocation');
    const deleteReportBtn = document.getElementById('deleteReportBtn');
    const searchInput = document.getElementById('searchInput');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const noReports = document.getElementById('noReports');
    const totalReports = document.getElementById('totalReports');
    const monthReports = document.getElementById('monthReports');

    let selectedReportId = null;
    let allReports = [];

    const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));
    const groupKey = userInfo ? userInfo.groupKey : null;

    // 날짜 포맷팅 함수
    function formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
    }

    // 위치 정보 주소 변환
    async function getAddressFromLatLng(lat, lng) {
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=YOUR_GOOGLE_MAPS_API_KEY`);
        if (!response.ok) throw new Error('Failed to fetch address');
        
        const data = await response.json();
        return data.results[0]?.formatted_address || '주소 정보를 찾을 수 없습니다.';
    }

    // 토스트 메시지 표시 함수
    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // 신고 내역 불러오기
    async function loadReports() {
        showLoading(true);
        const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));
        if (!userInfo || !userInfo.userName) {
            showToast("사용자 정보를 찾을 수 없습니다.", "error");
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/get-element`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userInfo)
            });

            if (!response.ok) throw new Error("신고 내역을 불러오는 데 실패했습니다.");

            const element = await response.json();
            allReports = element.reports;
            updateStats(allReports);
            filterAndDisplayReports(searchInput.value);
        } catch (error) {
            console.error("Error loading reports:", error);
            showToast("신고 내역을 불러오는 데 실패했습니다.", "error");
        } finally {
            showLoading(false);
        }
    }

    // 통계 업데이트
    function updateStats(reports) {
        totalReports.textContent = reports.length;
        
        const currentMonth = new Date().getMonth();
        const thisMonthReports = reports.filter(report => 
            new Date(report.time).getMonth() === currentMonth
        ).length;
        monthReports.textContent = thisMonthReports;
    }

    // 로딩 스피너 표시/숨김
    function showLoading(show) {
        loadingSpinner.style.display = show ? 'flex' : 'none';
        reportList.style.display = show ? 'none' : 'grid';
    }

    // 신고 내역 필터링 및 표시
    function filterAndDisplayReports(searchTerm) {
        const filteredReports = allReports.filter(report =>
            report.content.toLowerCase().includes(searchTerm.toLowerCase())
        );

        displayReports(filteredReports);
    }

    // 신고 내역 표시
    function displayReports(reports) {
        reportList.innerHTML = '';
        noReports.style.display = reports.length === 0 ? 'block' : 'none';

        reports.forEach(report => {
            const reportItem = document.createElement('div');
            reportItem.classList.add('report-item');

            const imageUrl = `${BASE_URL}/uploads/${groupKey}/${report.uuid}`;
            reportItem.innerHTML = `
                <div class="thumbnail-container">
                    <img src="${imageUrl}" alt="신고 이미지" class="thumbnail">
                </div>
                <div class="report-content">
                    <div class="report-date">
                        <i class="far fa-clock"></i> ${formatDate(report.time)}
                    </div>
                    <p class="report-memo">${report.content}</p>
                </div>
            `;

            reportItem.addEventListener('click', () => openReportModal(report, imageUrl));
            reportList.appendChild(reportItem);
        });
    }

    // 신고 상세 모달 열기
    async function openReportModal(report, imageUrl) {
        selectedReportId = report.uuid;
        modalImage.src = imageUrl;
        modalMemo.textContent = report.content;
        reportDate.textContent = formatDate(report.time);
        // Geocoding API로 주소 변환 후 표시
        try {
            const address = await getAddressFromLatLng(report.latitude, report.longitude);
            reportLocation.textContent = address;
        } catch (error) {
            console.error('주소 변환 실패:', error);
            reportLocation.textContent = '주소 정보를 찾을 수 없습니다.';
        }
        modal.classList.add('show');
        currentZoom = 1;
        updateImageZoom();
    }

    // 이미지 줌 업데이트
    function updateImageZoom() {
        modalImage.style.transform = `scale(${currentZoom})`;
    }

    // 이벤트 리스너 설정
    document.getElementById('zoomIn').addEventListener('click', () => {
        currentZoom = Math.min(currentZoom + 0.1, 2);
        updateImageZoom();
    });

    document.getElementById('zoomOut').addEventListener('click', () => {
        currentZoom = Math.max(currentZoom - 0.1, 0.5);
        updateImageZoom();
    });

    // 신고 삭제
    deleteReportBtn.addEventListener('click', async () => {
        if (!confirm('정말로 이 신고를 삭제하시겠습니까?')) return;

        try {
            const response = await fetch(`${BASE_URL}/delete-report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportId: selectedReportId })
            });

            if (!response.ok) throw new Error("신고 삭제에 실패했습니다.");

            showToast("신고가 성공적으로 삭제되었습니다.");
            modal.classList.remove('show');
            loadReports();
        } catch (error) {
            console.error("Error deleting report:", error);
            showToast("신고 삭제에 실패했습니다.", "error");
        }
    });

    // 검색 기능
    searchInput.addEventListener('input', (e) => {
        filterAndDisplayReports(e.target.value);
    });

    // 모달 닫기
    closeModalBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });

    // 모달 외부 클릭시 닫기
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            modal.classList.remove('show');
        }
    });

    // config.json 로드 및 초기화
    fetch('../../config.json')
        .then(response => response.json())
        .then(config => {
            BASE_URL = config.BASE_URL;
            loadReports();
        })
        .catch(error => {
            console.error('Failed to load configuration:', error);
            showToast("설정을 불러오는 데 실패했습니다.", "error");
        });
});
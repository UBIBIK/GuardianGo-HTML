const BASE_URL = 'http://localhost:8080';

//const BASE_URL = '/api'

document.addEventListener('DOMContentLoaded', function() {
    // 요소 선택
    const imageInput = document.getElementById('imageInput');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const previewContainer = document.getElementById('previewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const removeImageBtn = document.getElementById('removeImage');
    const memoInput = document.getElementById('memoInput');
    const uploadButton = document.getElementById('uploadButton');
    const currentLength = document.getElementById('currentLength');
    const imageUploadContainer = document.getElementById('imageUploadContainer');

    // 이미지 업로드 관련 변수
    let selectedImage = null;

    // 이미지 업로드 영역 클릭 이벤트
    uploadPlaceholder.addEventListener('click', () => {
        imageInput.click();
    });

    // 드래그 앤 드롭 이벤트
    imageUploadContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        imageUploadContainer.classList.add('drag-over');
    });

    imageUploadContainer.addEventListener('dragleave', () => {
        imageUploadContainer.classList.remove('drag-over');
    });

    imageUploadContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        imageUploadContainer.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            handleImageSelection(files[0]);
        }
    });

    // 이미지 선택 이벤트
    imageInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImageSelection(e.target.files[0]);
        }
    });

    // 이미지 제거 버튼 이벤트
    removeImageBtn.addEventListener('click', () => {
        console.log('이미지 제거 버튼 클릭');
        selectedImage = null;
        imageInput.value = '';
        uploadPlaceholder.classList.remove('hidden');
        previewContainer.classList.add('hidden');
        checkUploadButtonState();
    });

    // 메모 입력 이벤트
    memoInput.addEventListener('input', (e) => {
        const length = e.target.value.length;
        currentLength.textContent = length;
        
        if (length > 500) {
            e.target.value = e.target.value.slice(0, 500);
            currentLength.textContent = 500;
        }
        
        checkUploadButtonState();
    });

    // 업로드 버튼 클릭 이벤트
    uploadButton.addEventListener('click', () => {
        console.log('업로드 버튼 클릭');
        uploadPostData();
    });

    // 이미지 선택 처리 함수
    function handleImageSelection(file) {
        if (file.type.startsWith('image/')) {
            selectedImage = file;
            const reader = new FileReader();
            
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                uploadPlaceholder.classList.add('hidden');
                previewContainer.classList.remove('hidden');
            };
            
            reader.readAsDataURL(file);
            checkUploadButtonState();
        }
    }

    // 업로드 버튼 상태 확인 함수
    function checkUploadButtonState() {
        const isMemoValid = memoInput.value.trim().length > 0;
        uploadButton.disabled = !(selectedImage && isMemoValid);
    }


    // 업로드 중 상태 표시 함수
    function showUploadingState(isUploading) {
        const loader = uploadButton.querySelector('.button-loader');
        console.log(loader); // 로드가 올바르게 되는지 확인
        
        // loader가 null인 경우 예외 처리 추가
        if (!loader) {
            console.error('button-loader 요소가 없습니다.');
            return;
        }
    
        if (isUploading) {
            uploadButton.disabled = true;
            loader.classList.remove('hidden'); // 로더 표시
            uploadButton.textContent = '업로드 중...';
        } else {
            uploadButton.disabled = false;
            loader.classList.add('hidden'); // 로더 숨기기
            uploadButton.textContent = '업로드';
        }
    }

    // URL 쿼리 파라미터에서 좌표 정보 가져오기 함수
    function getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        const lat = parseFloat(params.get("lat"));
        const lng = parseFloat(params.get("lng"));
        return { lat, lng };
    }

    // 업로드 함수
    function uploadPostData() {
        showUploadingState(true);
        
        // sessionStorage에서 userInfo 가져오기
        const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));
        if (!userInfo) {
            alert("사용자 정보가 없습니다. 다시 로그인해주세요.");
            showUploadingState(false);
            return;
        }

        // URL에서 좌표 정보 가져오기
        const { lat, lng } = getQueryParams();
        if (isNaN(lat) || isNaN(lng)) {
            alert("신고할 위치를 선택하지 않았습니다.");
            showUploadingState(false);
            return;
        }

        // FormData 객체 생성 및 데이터 추가
        const formData = new FormData();
        formData.append("image", selectedImage); // 선택된 이미지 파일 추가
        formData.append("PostData", JSON.stringify({
            postContent: memoInput.value,
            latitude: lat, // URL의 위도 사용
            longitude: lng, // URL의 경도 사용
            userInfo: userInfo
        }));

        // FormData 구조 확인 (콘솔에 표시)
        for (let pair of formData.entries()) {
            console.log(`${pair[0]}, ${pair[1]}`);
        }
        
        // 서버로 데이터 전송
        fetch(`${BASE_URL}/upload-postdata`, {
            method: "POST",
            body: formData, // Content-Type을 설정하지 않습니다.
        })
        .then(response => {
            showUploadingState(false);
            if (response.ok) {
                console.log("게시물이 성공적으로 업로드되었습니다.");
                alert("게시물이 업로드되었습니다.");
                window.location.href = '../main/main.html';
            } else {
                console.error("업로드 실패:", response.statusText);
                alert("업로드 실패: " + response.statusText);
            }
        })
        .catch(error => {
            showUploadingState(false);
            console.error("업로드 오류:", error);
            alert("업로드 오류: " + error.message);
        });
    }

});
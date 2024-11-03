document.addEventListener('DOMContentLoaded', async () => {
    // 전역 변수
    let userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
    let groupInfo = JSON.parse(sessionStorage.getItem('groupInfo'));
    const BASE_URL = 'http://localhost:8080';
    // const BASE_URL = 'http://34.64.214.135:8080';

    // DOM 요소
    const loadingSpinner = document.getElementById('loadingSpinner');
    const groupInfoSection = document.getElementById('groupInfo');
    const noGroupSection = document.getElementById('noGroup');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalForm = document.getElementById('modalForm');
    const groupInput = document.getElementById('groupInput');
    const modalCancelBtn = document.getElementById('modalCancelBtn');

    // 유틸리티 함수
    const showLoading = () => {
        loadingSpinner.classList.remove('hidden');
        groupInfoSection.classList.add('hidden');
        noGroupSection.classList.add('hidden');
    };

    const hideLoading = () => {
        loadingSpinner.classList.add('hidden');
    };

    const showModal = () => {
        modal.classList.remove('hidden');
        modal.classList.add('show');
        modalTitle.textContent = '그룹 참여하기';
        groupInput.placeholder = '그룹 키를 입력하세요';
        modalForm.dataset.type = 'join';
    
        // 그룹 참가 폼 내용으로 초기화
        modalForm.innerHTML = `
            <div class="input-group">
                <label for="groupInput"></label>
                <input type="text" id="groupInput" required>
            </div>
            <div class="modal-buttons">
                <button type="button" class="btn cancel" id="modalCancelBtn">취소</button>
                <button type="submit" class="btn confirm">확인</button>
            </div>
        `;
    
        // 취소 버튼 리스너 추가
        document.getElementById('modalCancelBtn').addEventListener('click', hideModal);
    };

    const hideModal = () => {
        modal.classList.remove('show');
        modal.classList.add('hidden');
        modalForm.reset();
    };

    // 삭제 버튼 모달
    const showDeleteModal = () => {
        modal.classList.remove('hidden');
        modal.classList.add('show');
        modalTitle.textContent = '그룹 삭제 확인';
        modalForm.dataset.type = 'delete';
    
        // 그룹 삭제 확인 폼으로 내용 변경
        modalForm.innerHTML = `
            <p>정말로 그룹을 삭제하시겠습니까?</p>
            <div class="modal-buttons">
                <button type="button" class="btn cancel" id="modalCancelBtn">취소</button>
                <button type="submit" class="btn confirm delete-confirm">삭제</button>
            </div>
        `;
    
        // 취소 버튼 리스너 추가
        document.getElementById('modalCancelBtn').addEventListener('click', hideModal);
    };

    // 모달의 제출 이벤트에서 그룹 삭제 핸들러 연결
    modalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
    
        const actionType = modalForm.dataset.type;
    
        if (actionType === 'join') {
            const groupKey = document.getElementById('groupInput').value.trim(); // groupInput 가져오기
            if (!groupKey) return;
    
            // 그룹 참여 요청
            await handleJoinGroup(groupKey); 
        } else if (actionType === 'delete') {
            await handleDeleteGroup();
        }
    
        hideModal();  // 제출 후 모달 닫기
    });  

    // 초기 데이터 로드
    const initializeApp = async () => {
        showLoading();

        if (userInfo && userInfo.groupKey) {
            if (groupInfo && groupInfo.groupKey === userInfo.groupKey) {
                // sessionStorage에 groupInfo가 있으면 이를 이용
                displayGroupInfo(groupInfo);
            } else {
                // sessionStorage에 groupInfo가 없으면 서버로 요청
                await loadGroupInfo();
            }
        } else {
            showNoGroupState();
        }

        hideLoading();
    };

    // 그룹 정보 로드
    const loadGroupInfo = async () => {
        try {
            const response = await fetch(`${BASE_URL}/group-exist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userInfo) 
            });

            if (response.ok) {
                const groupData = await response.json();
                sessionStorage.setItem('groupInfo', JSON.stringify(groupData)); // groupInfo 저장
                displayGroupInfo(groupData);
            } else {
                throw new Error('그룹 정보를 가져오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('그룹 정보 로드 중 오류 발생:', error);
            showError('그룹 정보를 불러오는 중 오류가 발생했습니다.');
        }
    };

    // 그룹 정보 표시
    const displayGroupInfo = (groupData) => {
        noGroupSection.classList.add('hidden');
        groupInfoSection.classList.remove('hidden');

        // 그룹 기본 정보 업데이트
        document.querySelector('.group-name').textContent = groupData.groupName;
        document.querySelector('.group-key').textContent = `그룹 키: ${groupData.groupKey}`;
        document.querySelector('.group-master').textContent = groupData.groupMaster;

        // 멤버 목록 업데이트
        updateMembersList(groupData.groupMember);

        // 현재 사용자가 그룹장인지 확인하여 삭제 버튼 표시
        const deleteGroupBtn = document.getElementById('deleteGroupBtn');
        if (userInfo.userEmail === groupData.groupMaster) {
            deleteGroupBtn.classList.remove('hidden'); // 그룹장이면 버튼 표시
        } else {
            deleteGroupBtn.classList.add('hidden'); // 그룹장이 아니면 버튼 숨기기
        }
    };

    // 멤버 목록 업데이트 함수
    const updateMembersList = (members) => {
        const membersContainer = document.querySelector('.members-container');
        membersContainer.innerHTML = '';

        members.forEach(member => {
            const memberCard = document.createElement('div');
            memberCard.className = 'member-card';
            memberCard.innerHTML = `
                <i class="fas fa-user"></i>
                <div class="member-info">
                    <div class="member-name">${member.groupMemberName}</div>
                    <div class="member-role">${member.groupRole}</div>
                </div>
            `;
            membersContainer.appendChild(memberCard);
        });
    };

    // 그룹이 없는 상태 표시
    const showNoGroupState = () => {
        groupInfoSection.classList.add('hidden');
        noGroupSection.classList.remove('hidden');
    };

    // 오류 메시지 표시
    const showError = (message) => {
        // Toast 메시지 생성
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.textContent = message;
        document.body.appendChild(toast);

        // 애니메이션 추가
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // 3초 후 제거
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    };

    // 새로고침 및 자동 새로고침
    initializeApp();
    setInterval(initializeApp, 60000);  // 60초마다 그룹 정보 자동 확인

    // 그룹 생성 핸들러 (모달 없이 바로 실행)
    const handleCreateGroup = async () => {
        try {
            showLoading();

            // 서버로 그룹 생성 요청 보내기
            const response = await fetch(`${BASE_URL}/group-create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail: userInfo.userEmail,
                    userName: userInfo.userName
                })
            });

            if (!response.ok) {
                throw new Error('그룹 생성에 실패했습니다.');
            }

            const newGroup = await response.json(); // 서버로부터 받은 Group 객체

            // 사용자 정보 업데이트: userInfo에 groupKey 추가
            userInfo.groupKey = newGroup.groupKey;
            sessionStorage.setItem('userInfo', JSON.stringify(userInfo));

            // 그룹 정보 표시
            displayGroupInfo(newGroup);
        } catch (error) {
            console.error('그룹 생성 중 오류 발생:', error);
            showError('그룹을 생성하는 중 오류가 발생했습니다.');
        } finally {
            hideLoading();
        }
    };


    // 그룹 참여 핸들러 함수
    const handleJoinGroup = async (groupKey) => {
        try {
            showLoading();
            
            // 서버로 그룹 참가 요청 보내기
            const response = await fetch(`${BASE_URL}/group-join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail: userInfo.userEmail,
                    userName: userInfo.userName,
                    groupKey: groupKey // 입력받은 그룹 키 전송
                })
            });

            if (!response.ok) {
                throw new Error('그룹 참여에 실패했습니다.');
            }

            const joinedGroup = await response.json(); // 서버로부터 받은 Group 객체

            // 사용자 정보에 그룹 키 업데이트
            userInfo.groupKey = joinedGroup.groupKey;
            sessionStorage.setItem('userInfo', JSON.stringify(userInfo));

            // 그룹 정보 표시
            displayGroupInfo(joinedGroup);
            alert('그룹에 성공적으로 참여했습니다.');

        } catch (error) {
            console.error('그룹 참여 중 오류 발생:', error);
            showError('그룹 참여에 실패했습니다. 그룹 키를 확인해주세요.');
        } finally {
            hideLoading();
            hideModal();
        }
    };


    // 그룹 삭제 핸들러 함수
    const handleDeleteGroup = async () => {
        try {
            showLoading();

            // 서버로 그룹 삭제 요청 보내기
            const response = await fetch(`${BASE_URL}/group-delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail: userInfo.userEmail,
                    userName: userInfo.userName,
                    phoneNumber: userInfo.phoneNumber,
                    groupKey: userInfo.groupKey
                })
            });

            if (!response.ok) {
                throw new Error('그룹 삭제에 실패했습니다.');
            }

            // 삭제 완료 후 UI 업데이트
            delete userInfo.groupKey; // userInfo 객체에서 groupKey만 제거
            sessionStorage.setItem('userInfo', JSON.stringify(userInfo)); // 변경된 userInfo를 다시 저장

            showNoGroupState(); // 그룹 정보 대신 그룹 없는 상태 표시
            alert('그룹이 성공적으로 삭제되었습니다.');

        } catch (error) {
            console.error('그룹 삭제 중 오류 발생:', error);
            showError('그룹을 삭제하는 중 오류가 발생했습니다.');
        } finally {
            hideLoading();
            hideModal();
        }
    };

    // 이벤트 리스너 설정
    document.getElementById('createGroupBtn').addEventListener('click', () => {
        console.log("Create Group button clicked");
        handleCreateGroup(); // 그룹 생성 버튼 클릭 시 바로 그룹 생성 요청
    });

    document.getElementById('joinGroupBtn').addEventListener('click', () => {
        console.log("Join Group button clicked");
        showModal(); // 그룹 참여 버튼 클릭 시 모달 표시
    });

    // 그룹 삭제 버튼 이벤트 리스너 추가
    document.getElementById('deleteGroupBtn').addEventListener('click', () => {
        showDeleteModal();
    });

    // 모달 외부 클릭 시 닫기
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });

    // 키보드 ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            hideModal();
        }
    });

    // CSS 애니메이션을 위한 추가 스타일
    const style = document.createElement('style');
    style.textContent = `
        .toast {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background-color: #333;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            opacity: 0;
            transition: all 0.3s ease-in-out;
            z-index: 1000;
        }

        .toast.error {
            background-color: var(--danger);
        }

        .toast.show {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    `;
    document.head.appendChild(style);

    // 앱 초기화
    initializeApp();
});
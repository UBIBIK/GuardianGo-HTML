# 🛫 GuardianGo

안전한 이동 지원 앱
https://mokpo-safety.netlify.app/

<br />

# 📃 프로젝트 정보

### 1. 참여 인원

> |                    Name                    |  Position   |
> | :----------------------------------------: | :---------: |
> | 최우빈 | Back, Front |
> |   김세호   |    Back     |
> |     나현승     |    Front     |
> |    오민성     |    Back     |

### 2. 나의 역할

> - 최우빈 : 안전지수 개발 + Front 및 Back(Flask) 구성

<br />

# 📚 사용 기술

### 1. Back-end

  > Flask  
  > Google Cloud Platform  
  > Spring Boot  
  > Firebase  

### 2. Front-end

  > Node.js  
  > JavaScript 및 HTML/CSS  
  > geoJSON  
  > Google Maps API  

<br />


# 📊 Structure

<details>
<summary>Structure</summary>
<div markdown="1" style="padding-left: 15px;">
<img src="https://github.com/user-attachments/assets/fec94a8e-33a9-416a-8b8e-c660f196722f" />
</div>
</details>

<br />

## 📄 프로젝트 설명 PDF
- [프로젝트 설명 PDF 다운로드](https://github.com/UBIBIK/GuardianGo-HTML/blob/main/GuardianGo%20%EC%86%8C%EA%B0%9C.pdf)

## 🚀 Guardian Go - 핵심 기능

1. **실시간 위치 공유**
   - 보호 대상자의 현재 위치를 실시간으로 보호자에게 공유하여, 이동 경로를 안전하게 모니터링할 수 있도록 지원.
   ![실시간 위치 공유](https://github.com/UBIBIK/GuardianGo-HTML/blob/main/screenshots/%EC%9C%84%EC%B9%98%EA%B3%B5%EC%9C%A0.png)

2. **안전한 경로 추천**
   - 직접 개발한 안전지수를 활용하여 사용자가 안전하게 이동할 수 있는 최적의 경로를 제공.
   ![안전 경로 추천](https://github.com/UBIBIK/GuardianGo-HTML/blob/main/screenshots/%EC%95%88%EC%A0%84%EA%B2%BD%EB%A1%9C%20%EC%B6%94%EC%B2%9C.png)

3. **사진 기반 안전 및 위험 요소 보고**
   - 사용자가 경로 상의 위험 요소나 안전한 장소를 사진으로 기록하여 보호자나 그룹 멤버들과 공유 가능.
   - 보고된 안전 요소를 지도에 실시간으로 반영하여, 사용자와 보호자가 위험 요소를 쉽게 인지할 수 있도록 지원.
   ![사진 기반 요소 보고](https://github.com/UBIBIK/GuardianGo-HTML/blob/main/screenshots/%EC%9A%94%EC%86%8C%20%EC%8B%A0%EA%B3%A0.png)

4. **그룹 관리 및 공유 기능**
   - 사용자 그룹을 생성하고, 그룹 키를 통해 다른 사용자를 초대하여 보호 대상자와 관련된 정보와 위치를 공유.
   - 그룹 내 사용자들이 안전 요소와 위치 정보를 공유하여 전체 그룹의 안전을 강화.
   ![그룹 관리](https://github.com/UBIBIK/GuardianGo-HTML/blob/main/screenshots/%EA%B7%B8%EB%A3%B9%EA%B4%80%EB%A6%AC.png)

5. **SOS 및 긴급 신고 기능**
   - 사용자에게 위급 상황 발생 시 보호자에게 빠르게 알릴 수 있는 SOS 버튼 제공.
   - SOS 기능을 통해 보호자나 그룹 멤버에게 실시간 알림을 보내어 빠른 대응이 가능하도록 지원.
   ![SOS 신고 기능](https://github.com/UBIBIK/GuardianGo-HTML/blob/main/screenshots/%EA%B8%B4%EA%B8%89.png)

## 🎥 프로젝트 시연 영상
- [Guardian Go 시연 영상](https://youtu.be/bBtc1MH-mBA)

## 💡 구현 과정 및 기술적 도전

### 1. **안전 지수 계산 알고리즘**
- **목표:** 목포 지역의 안전도를 정량적으로 평가하고, 사용자에게 시각적으로 제공.
- **구현 방식:**
  - 목포 지역 데이터를 기반으로 **geoJSON** 형식을 사용하여 각 도로 구간의 안전 지수를 시각적으로 표시.
  - **안전 지수 계산 요소:**
    - 교통 사고 데이터
    - 범죄자 거주지
    - 비상벨 및 CCTV 설치 여부
  - 안전 지수는 QGIS를 이용해 도로데이터에 적용 이후 도로정보는 Flask 서버에서 처리되며, Google Maps API와 통합하여 사용자에게 안전 정보를 제공.
- **경로 계산:**
  - 경로 계산 알고리즘(다익스트라)을 사용하여 사용자에게 안전하면서도 효율적인 경로를 추천.
  - Python의 **networkx** 라이브러리를 활용하여 그래프 기반 최적 경로 탐색 알고리즘을 구현.

---

### 2. **실시간 위치 공유**
- **목표:** 보호 대상자의 위치를 보호자와 실시간으로 공유.
- **구현 방식:**
  - Google Maps API를 활용해 사용자의 현재 위치를 지도에 표시.
  - Firebase Realtime Database를 사용하여 위치 정보를 실시간으로 동기화.
  - Firebase의 이벤트 기반 데이터 모델을 활용해 실시간 위치 업데이트를 안정적으로 처리.
- **전환 과정:**
  - 초기에는 WebSocket을 사용해 양방향 통신을 구현하려 했으나, Firebase의 간편한 사용성과 확장성을 고려하여 전환.

---

### 3. **안전 요소 신고 시스템**
- **목표:** 사용자들이 경로 상의 위험 요소와 안전 요소를 실시간으로 신고하고 공유.
- **구현 방식:**
  - 사용자가 앱에서 사진 및 위치 데이터를 입력하면 서버로 업로드.
  - springboot 서버에서 데이터를 처리한 후, **Google Cloud Storage**에 저장.
  - 저장된 데이터는 지도에 반영되어 다른 그룹원들이 이를 실시간으로 확인 가능.
- **Google Cloud Storage 사용 이유:**
  - 대량의 이미지 데이터를 관리하기에 적합한 확장성과 안정성을 제공.
- **결과:**
  - 보고된 안전 및 위험 요소를 지도 위 마커로 표시하여 사용자들이 한눈에 파악 가능하도록 구현.

---

### 4. **HTTP와 HTTPS 통신 문제 해결**
- **문제:** 
  - GCP VM 인스턴스에서 운영 중인 Flask 및 Spring Boot 서버는 **HTTP** 프로토콜을 사용.
  - 반면, 배포된 웹 애플리케이션(Netlify)은 **HTTPS** 프로토콜을 사용하여 통신이 제한됨.
- **해결 방법:**
  - **Netlify의 프록시 설정**을 활용하여 HTTPS 요청을 HTTP 서버로 안전하게 전달.
  - Netlify의 `netlify.toml` 파일에 프록시 규칙 추가:
    ```toml
    [[redirects]]
    from = "/api/*"
    to = "http://<VM_IP>:8080/:splat"
    status = 200
    force = true
    ```
- **결과:** 
  - HTTPS 웹 애플리케이션과 HTTP 서버 간의 데이터 통신 문제를 효과적으로 해결.
  - 테스트 환경과 실제 배포 환경 간의 통신 불일치 문제를 해소.

---

### 5. **기술적 성과**
- 목포 지역 사용자들이 실시간으로 안전 지수를 기반으로 한 경로를 확인하고 이동.
- 사용자 보고 시스템을 통해 그룹 간 안전 요소와 위험 요소에 대한 정보를 실시간으로 공유 가능.
- HTTP와 HTTPS 간 통신 문제를 해결하여 안정적이고 효율적인 웹 애플리케이션 배포 환경 구축.

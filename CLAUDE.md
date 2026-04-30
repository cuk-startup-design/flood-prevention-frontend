# 홍수 예방 시스템 - 프론트엔드

## 프로젝트 개요
서울시 침수 예보 및 신고 관리 플랫폼. 모바일 우선 설계.

## 기술 스택
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI**: shadcn/ui, Radix UI
- **State**: Zustand
- **Data Fetching**: TanStack Query + Axios
- **Package Manager**: pnpm

## 프로젝트 구조
```
src/app/
├── (public)/          # 인증 전 페이지 (NavBar 없음)
│   ├── page.tsx       # 랜딩 (로그인/회원가입 버튼)
│   ├── login/         # 로그인 (임시: admin / 1234)
│   └── signup/        # 회원가입
└── (app)/             # 인증 후 페이지 (NavBar + Header 있음)
    ├── home/          # 신고홈
    ├── map/           # 지도 (카카오맵 히트맵 예정)
    ├── alerts/        # 알림
    ├── camera/        # 카메라
    ├── checklist/     # 체크리스트
    ├── report/
    │   ├── new/       # 신고작성
    │   └── manage/    # 신고관리 (진행중/완료 탭)
    └── mypage/        # 마이페이지

src/components/
├── NavBar.tsx         # 반응형 네비게이션
│                      # - 데스크탑: 좌측 사이드바
│                      # - 모바일: 하단 탭바 (지도/신고홈/메뉴) + 햄버거 드로어
└── Header.tsx         # 탑바 (고정) + 서브바 (동적 페이지 타이틀)
                       # - 우측 아이콘: 🔔알림 / 👤마이페이지 / 🚪로그아웃
```

## 결정된 기술 사항
- **지도**: 카카오맵 JavaScript SDK (API 키 발급 예정)
- **히트맵**: 서울 25개 구 침수위험도 (높음/보통/낮음), 더미 데이터 → 공공API 연동 예정
- **공공데이터 API 키**: 백엔드에서 관리 (보안), 카카오맵 JS 키만 프론트에 노출
- **백엔드**: Python 예정 (미개발), 개발 후 API 연동

## 작업 방식 (중요)
1. **코드 바로 짜지 말 것** - 구현 요청이 오면 먼저 어떤 방식으로 진행할지 설명
2. **대안 제시** - 더 좋은 방법이 있으면 먼저 제안
3. **문제점 지적** - 잠재적 이슈가 있으면 구현 전에 먼저 언급
4. **확인 후 구현** - 사용자가 방향을 확인한 뒤에 코드 작성

## 커뮤니케이션
- **한국어**로 답변
- 구현 전 항상 방향 설명 먼저

## 배포
- **프론트**: Vercel (GitHub 자동 배포, `cuk-startup-design` 조직)
- **백엔드**: 미정 (Python, Railway/Render 예정)

## 현재 임시 처리된 것들
- 로그인: 하드코딩 (admin / 1234) → 백엔드 연동 시 교체 필요
- 지도 페이지: 빈 껍데기 → 카카오맵 연동 예정
- 모든 앱 페이지: UI 미구현 → 순차적으로 개발 예정

/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 백엔드 주소. 비어 있으면 mock JSON만 쓴다 (Phase 1 기본) */
  readonly VITE_API_BASE?: string;
  /** "true"면 mock 로그인 사용자(온보딩 완료)로 시작한다 */
  readonly VITE_MOCK_LOGGED_IN?: string;
  /** 푸터·진단 정보에 표시하는 앱 버전 */
  readonly VITE_APP_VERSION?: string;
}

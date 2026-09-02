# ADR-0005 배포는 PaaS + Cloudflare R2

- 상태: 채택 (2026-09-02)

## 맥락
2인 팀이 3개월 안에 베타를 내야 한다. AWS는 표준적이지만 네트워크·IAM·비용 관리에 시간이 든다. 개인 VPS는 백업·모니터링을 직접 책임져야 한다.

## 결정
- 백엔드 컨테이너와 관리형 PostgreSQL(PostGIS 지원)은 저렴한 PaaS(Fly.io / Railway / Render 중 하나, 첫 배포 시 확정)에 올린다.
- 프론트 정적 파일은 같은 PaaS 또는 Cloudflare Pages.
- 사진과 광공해 타일은 Cloudflare R2(S3 호환, 송신 비용 없음).
- `main` 머지 시 자동 배포는 베타 직전에 세팅한다.

## 결과
- Dockerfile 하나로 로컬·운영을 맞춘다.
- 스토리지 클라이언트는 S3 호환 API만 쓰므로 R2 ↔ S3 이동이 쉽다.
- 트래픽이 커지면 AWS 이전을 검토한다. 그때 새 ADR을 쓴다.

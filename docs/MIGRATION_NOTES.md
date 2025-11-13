# PostgreSQL Migration Tool Evaluation

## Candidate Options

### node-pg-migrate
- **장점**: SQL-first 접근, TypeScript 지원, 커맨드가 간단함(`npm run migrate up/down`).
- **장점**: 기존 `pg` 커넥션을 그대로 사용하므로 현재 코드베이스와 일관성 유지.
- **주의**: 마이그레이션 스크립트를 직접 작성해야 하므로 SQL 작성 규칙을 정리 필요.

### Knex.js Migrations
- **장점**: DSL 기반으로 DB-agnostic 코드 작성 가능, 시드 관리 기능 포함.
- **장점**: Query builder를 동시에 사용할 수 있어 동적 스크립트에 유리.
- **주의**: 현재 프로젝트가 Raw SQL 위주이므로 Query Builder 도입 여부 사전 합의 필요.

## 권장 이동 경로
1. `node-pg-migrate`를 우선 도입 후보로 설정 (Raw SQL 친화적, 러닝커브 낮음).
2. `server/package.json`에 `migrate up/down` 스크립트 추가 계획 수립.
3. 기존 `database/schema.sql`을 초기 마이그레이션(`001_initial_schema.sql`)으로 분할.
4. 프리셋 테이블 추가 등 최신 변경 사항을 `002_add_option_presets.sql` 등 단계별 파일로 재작성.
5. CI 워크플로우에 `npm run migrate up` 실행 후 `npm run migrate down` 검증을 추가.

## 준비 체크리스트
- [ ] 팀 합의: SQL 기반 마이그레이션 도구 채택 여부
- [ ] 마이그레이션 파일 구조 및 네이밍 규칙 문서화
- [ ] 기존 seed 로직을 `node-pg-migrate` 시드 또는 별도 스크립트로 이관
- [ ] `.env`에 마이그레이션 실행 시 사용할 DB 연결 정보 명시

## 참고 링크
- [node-pg-migrate 문서](https://salsita.github.io/node-pg-migrate/)
- [Knex.js 마이그레이션 가이드](https://knexjs.org/guide/migrations.html)

---
name: cross-repo-contract-risk
description: FE and BE live in separate repos (fb-tournament-fe, fb-tournament-be) — FE tsc cannot catch response-shape mismatches; verify DTO against BE mapper
metadata:
  type: project
---

FE (`fb-tournament-fe`) and BE (`fb-tournament-be`, NestJS+Mongo) are separate repos with no shared types. FE declares response types by hand in `lib/types/*` and asserts them via `api.get<T>` — there is NO compile-time link to the BE response.

**Why:** Strangler migration to a new NestJS API; FE types are hand-mirrored from BE mappers (see `bracket-response.mapper.ts` comment "mirrors fb-tournament-fe/lib/types/bracket.ts").

**How to apply:** When reviewing FE wiring to this API, ALWAYS open the matching BE `*-response.mapper.ts` and diff the projected fields against the FE type. `tsc --noEmit` passing on FE proves nothing about the actual payload. Known trap: a Mongo schema field existing does NOT mean the mapper projects it (Phase 3 bug: `status`/`drawVersion` on bracket schema but absent from mapper response → FE `bracket.status` undefined at runtime, re-draw UI dead).

Error contract is consistent: BE `DomainExceptionFilter` emits `{ statusCode, code, message }`; FE `ApiError` maps HTTP status→`status`, body.code→`code`. 404 + `SKELETON_NOT_FOUND` is an expected null, not an error.

---
name: gptcop-cto-rd-orchestrator
description: >
  QDEM .cop CTO 전용 R&D 오케스트레이션 스킬. 수소 열변환 로드맵, 실험 우선순위,
  특허 검토, 외부 연구 협력 판단이 필요할 때 사용하세요. 단순 실험 로그 정리만 할 때는
  사용하지 마세요.
---

# QDEM .cop CTO R&D Orchestrator

## 사용 시점

- 다음 실험 순서를 다시 정해야 할 때
- 열효율 목표와 현재 결과 사이 격차를 줄일 때
- 특허화 가능한 아이디어를 선별할 때
- 외부 연구기관 협업 여부를 판단할 때

## 실행 절차

1. 현재 기술 상태를 요약합니다.

```bash
GET $PAPERCLIP_API_URL/companies/{companyId}/issues?assigneeAgentId={myId}&status=todo,in_progress,blocked
```

2. 아래 네 가지를 각각 한 줄로 평가합니다.
- 효율: 현재 열효율 vs 목표
- 안전: 실험 위험과 인터록 상태
- 확장성: 파일럿으로 확장 가능한지
- 특허성: 신규성/차별성 여부

3. Founding Engineer에게 넘길 실행 항목을 1~3개로 압축합니다.

## 출력 포맷

```markdown
# CTO 기술 지시서 — {날짜}

## 현재 기술 판단
- 효율:
- 안전:
- 확장성:
- 특허성:

## 다음 실험 우선순위
1.
2.
3.

## 엔지니어 전달사항
- 목표:
- 측정값:
- 중단 조건:
```

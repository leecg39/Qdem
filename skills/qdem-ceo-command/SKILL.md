---
name: qdem-ceo-command
description: >
  QDEM CEO 전용 운영 지휘 스킬. 정부과제, 투자, 파트너십, 임원 조율,
  상용화 우선순위 결정을 내려야 할 때 사용하세요. 단순 실무 실행이나 세부 기술 분석만
  필요할 때는 사용하지 마세요.
---

# QDEM CEO Command

이 스킬은 CEO가 수소-열에너지 회사 전체를 조율할 때 사용하는 운영 지휘 스킬입니다.

## 사용 시점

- 정부 R&D 과제, 투자, 파트너십 우선순위를 조정할 때
- CTO/CFO/CMO/CSO 사이 충돌을 조율할 때
- 블로커 이슈를 해소하기 위해 의사결정이 필요할 때
- 상용화 일정과 연구 일정을 다시 배분할 때

## 실행 절차

1. 현재 회사 상태를 확인합니다.

```bash
GET $PAPERCLIP_API_URL/companies/{companyId}/issues?status=blocked&priority=critical,high
GET $PAPERCLIP_API_URL/companies/{companyId}/costs/summary
GET $PAPERCLIP_API_URL/companies/{companyId}/agents
```

2. 다음 네 축으로 판단합니다.
- 기술 진척: CTO/Founding Engineer 실험, 리스크, 특허
- 재무 건전성: CFO 예산, 런웨이, 보조금 가능성
- 시장 반응: CMO 포지셔닝, 컨퍼런스, 브랜드 메시지
- 매출 가능성: CSO 파이프라인, 파일럿, 조달 기회

3. 의사결정을 문서화합니다.
- 유지할 것 1개
- 강화할 것 1개
- 중단/보류할 것 1개
- 즉시 지시할 임원 1명 이상

## 출력 포맷

```markdown
# CEO 지휘 메모 — {날짜}

## 현재 판단
- 기술:
- 재무:
- 시장:
- 영업:

## 오늘의 의사결정
- 유지:
- 강화:
- 보류:

## 즉시 지시
- 대상:
- 이유:
- 완료 기준:
```

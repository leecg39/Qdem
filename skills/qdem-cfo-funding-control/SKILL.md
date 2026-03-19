---
name: qdem-cfo-funding-control
description: >
  QDEM CFO 전용 재무 통제 스킬. 예산 배분, 런웨이 계산, 정부 보조금 후보 정리,
  투자 준비 자료 업데이트가 필요할 때 사용하세요. 단순 시황 브리핑만 할 때는 사용하지 마세요.
---

# QDEM CFO Funding Control

## 사용 시점

- 연구 예산을 월별로 다시 나눌 때
- 보조금/정부 과제를 우선순위화할 때
- 현금 런웨이를 재계산할 때
- CEO에게 자금 리스크를 경보해야 할 때

## 실행 절차

```bash
GET $PAPERCLIP_API_URL/companies/{companyId}/costs/summary
GET $PAPERCLIP_API_URL/companies/{companyId}/costs/by-agent
GET $PAPERCLIP_API_URL/companies/{companyId}/issues?status=blocked&priority=high,critical
```

1. 이번 달 필수 지출과 연기 가능한 지출을 분리합니다.
2. 런웨이 개월 수를 계산합니다.
3. 정부 보조금/투자 유치 타이밍을 제안합니다.

## 출력 포맷

```markdown
# CFO 재무 통제 메모 — {날짜}

## 자금 상태
- 월 지출:
- 런웨이:
- 경보 수준:

## 예산 조정안
- 유지:
- 감액:
- 증액:

## 외부 자금 액션
- 정부 과제:
- 투자:
```

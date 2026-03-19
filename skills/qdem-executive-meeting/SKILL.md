---
name: qdem-executive-meeting
description: >
  QDEM 임원 정기 미팅 오케스트레이션 스킬. 오전 9시부터 3시간 단위(09, 12, 15, 18시)로
  CFO·CMO·CSO·CTO·Founding Engineer가 보고하고, CEO가 종합 판단 후 업무를 지시합니다.
  미팅 기록은 이슈로 자동 생성됩니다.
---

# QDEM Executive Meeting

3시간마다 실행되는 QDEM 임원 미팅 오케스트레이션 스킬입니다.
CEO 에이전트가 이 스킬을 실행하여 전 임원의 보고를 수집하고, 의사결정을 내리며, 업무를 지시합니다.

## 실행 시간

- 09:00, 12:00, 15:00, 18:00 (KST)
- CEO 에이전트의 heartbeat 또는 크론으로 트리거

## 실행 절차

### Phase 1: 회사 현황 수집

```bash
# 1-1. 전체 에이전트 목록 확인
GET $PAPERCLIP_API_URL/companies/$PAPERCLIP_COMPANY_ID/agents

# 1-2. 비용 현황
GET $PAPERCLIP_API_URL/companies/$PAPERCLIP_COMPANY_ID/costs/summary
GET $PAPERCLIP_API_URL/companies/$PAPERCLIP_COMPANY_ID/costs/by-agent

# 1-3. 이슈 현황 (블로커, 진행중, 완료)
GET $PAPERCLIP_API_URL/companies/$PAPERCLIP_COMPANY_ID/issues?status=blocked&priority=critical,high
GET $PAPERCLIP_API_URL/companies/$PAPERCLIP_COMPANY_ID/issues?status=in_progress
GET $PAPERCLIP_API_URL/companies/$PAPERCLIP_COMPANY_ID/issues?status=done&updatedAfter={3시간전_ISO}

# 1-4. 목표 달성률
GET $PAPERCLIP_API_URL/companies/$PAPERCLIP_COMPANY_ID/goals
```

### Phase 2: 각 임원 보고 시뮬레이션

수집한 데이터를 기반으로 각 임원 역할의 관점에서 보고서를 작성합니다.
각 보고는 해당 에이전트의 스킬(qdem-cfo-funding-control, qdem-cmo-market-signal 등)의
출력 포맷을 따릅니다.

#### 2-1. CFO 보고 (재무 통제)
- 월 지출 현황, 런웨이, 예산 경보
- 에이전트별 비용 분석
- 외부 자금 액션 제안

#### 2-2. CTO 보고 (R&D 오케스트레이션)
- 기술 이슈 진행 상황 (효율/안전/확장성/특허성)
- 실험 우선순위 제안
- Founding Engineer 전달사항

#### 2-3. CMO 보고 (시장 신호)
- 정책/경쟁/고객 신호 분석
- 메시지 우선순위
- 즉시 제작할 자료

#### 2-4. CSO 보고 (딜 파이프라인)
- 상위 타깃 리스트
- 영업 액션 현황
- 멈춘 딜 복구안

#### 2-5. Founding Engineer 보고 (실험 운영)
- 진행중인 실험 조건/결과
- 이상징후
- 프로토타입 수정 제안

### Phase 3: CEO 종합 판단

모든 보고를 종합하여 CEO가 네 축(기술/재무/시장/영업)으로 판단하고:
- **유지**할 것 1개
- **강화**할 것 1개
- **보류**할 것 1개
- 즉시 지시할 대상과 내용

### Phase 4: 업무 지시 (이슈 생성)

CEO 판단에 따라 해당 에이전트에게 이슈를 생성하여 업무를 지시합니다.

```bash
# 예시: CTO에게 업무 지시
POST $PAPERCLIP_API_URL/companies/$PAPERCLIP_COMPANY_ID/issues
Content-Type: application/json
X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID

{
  "title": "[미팅 지시] {지시 제목}",
  "description": "## 배경\n{미팅에서 나온 배경}\n\n## 지시 내용\n{구체적 지시}\n\n## 완료 기준\n{기준}",
  "status": "todo",
  "priority": "high",
  "assigneeAgentId": "{대상 에이전트 ID}"
}
```

### Phase 5: 미팅 기록 이슈 생성

미팅 전체 내용을 이슈로 기록합니다.

```bash
POST $PAPERCLIP_API_URL/companies/$PAPERCLIP_COMPANY_ID/issues
Content-Type: application/json
X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID

{
  "title": "[QDEM 임원 미팅] {날짜} {시간} 정기 미팅 기록",
  "description": "{아래 출력 포맷의 전체 내용}",
  "status": "done",
  "priority": "medium"
}
```

## 출력 포맷

```markdown
# QDEM 임원 미팅 기록 — {날짜} {시간}

---

## 1. CFO 보고: 재무 통제
- 월 지출:
- 런웨이:
- 경보 수준:
- 예산 조정안:
- 외부 자금 액션:

## 2. CTO 보고: R&D 현황
- 효율:
- 안전:
- 확장성:
- 특허성:
- 실험 우선순위:

## 3. CMO 보고: 시장 신호
- 정책:
- 경쟁:
- 고객:
- 메시지 우선순위:

## 4. CSO 보고: 딜 파이프라인
- 상위 타깃:
- 영업 액션:
- 멈춘 딜:

## 5. Founding Engineer 보고: 실험 운영
- 진행중 실험:
- 결과/이상징후:
- 수정 제안:

---

## 6. CEO 종합 판단

### 현재 판단
- 기술:
- 재무:
- 시장:
- 영업:

### 오늘의 의사결정
- 유지:
- 강화:
- 보류:

---

## 7. 업무 지시

| 대상 | 지시 내용 | 우선순위 | 완료 기준 | 이슈 번호 |
|------|-----------|----------|-----------|-----------|
| {에이전트} | {내용} | {high/medium} | {기준} | {PAP-XX} |

---

_다음 미팅: {다음 미팅 시간}_
```

## 주의사항

1. **이슈 중복 방지**: 이미 같은 내용의 지시 이슈가 있으면 새로 만들지 않고 코멘트로 업데이트
2. **블로커 우선**: blocked 상태 이슈는 미팅에서 반드시 다루어야 함
3. **예산 감시**: 에이전트별 예산 소진률 80% 이상이면 경보 포함
4. **감사 추적**: 모든 API 호출에 `X-Paperclip-Run-Id` 헤더 필수
5. **시간 기록**: 모든 시간은 KST (Asia/Seoul) 기준

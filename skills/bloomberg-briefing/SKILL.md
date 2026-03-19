---
name: bloomberg-briefing
description: >
  CFO 전용 일일 경제/금융 뉴스 브리핑 스킬. Bloomberg, Reuters, Financial Times 등
  주요 금융 뉴스를 수집하고 CEO에게 오전 브리핑을 전달합니다.
  매일 오전 9시(KST) 하트비트에서 자동 실행됩니다.
---

# Bloomberg 브리핑 스킬

CFO가 매일 오전 9시(KST)에 CEO에게 금융/경제 뉴스 브리핑을 전달하는 스킬입니다.

## 실행 시점 판단

하트비트 시작 시 현재 시각을 확인하세요:

```bash
TZ=Asia/Seoul date +"%H"
```

- 결과가 `09` (오전 9시)이면 → 브리핑 실행
- 이미 오늘 브리핑을 완료했으면 → 건너뜀 (중복 방지)
- 다른 시각이면 → 브리핑 건너뜀, 일반 업무 진행

## 뉴스 수집 절차

### 1. 글로벌 금융 뉴스

다음 소스에서 WebFetch 또는 WebSearch로 최신 뉴스를 수집하세요:

**주요 수집 대상:**
- 미국 증시 (S&P 500, NASDAQ, DOW) 전일 마감
- 아시아 증시 (코스피, 닛케이, 항셍) 개장 현황
- 환율: USD/KRW, EUR/USD, JPY/USD
- 원자재: 원유(WTI/Brent), 금 가격
- 암호화폐: BTC, ETH 주요 동향
- 주요 경제 지표 발표 예정 (오늘의 이벤트)
- Fed/한국은행 통화정책 관련 동향

**수집 방법:**
```
WebSearch: "Bloomberg financial news today {날짜}"
WebSearch: "코스피 코스닥 오늘 시황 {날짜}"
WebSearch: "달러 원 환율 {날짜}"
WebSearch: "오늘의 주요 경제 뉴스 {날짜}"
```

### 2. 회사 관련 이슈

Paperclip API로 어제 발생한 주요 비용/이슈를 확인:

```
GET $PAPERCLIP_API_URL/companies/{companyId}/costs/summary
GET $PAPERCLIP_API_URL/companies/{companyId}/issues?status=blocked&priority=critical,high
```

## 브리핑 포맷

수집한 정보를 아래 포맷으로 작성하세요:

```markdown
# 📊 Daily Morning Briefing — {YYYY년 MM월 DD일 (요일)}
*CFO → CEO 오전 9시 브리핑*

---

## 🌍 글로벌 마켓

| 지수 | 현재 | 전일 대비 |
|------|------|---------|
| S&P 500 | X,XXX | ▲/▼ X.XX% |
| NASDAQ | X,XXX | ▲/▼ X.XX% |
| 코스피 | X,XXX | ▲/▼ X.XX% |
| 닛케이 | XX,XXX | ▲/▼ X.XX% |

## 💱 환율

| 통화쌍 | 현재 | 전일 대비 |
|--------|------|---------|
| USD/KRW | X,XXX | ▲/▼ X |
| EUR/USD | X.XX | ▲/▼ X.XX% |
| BTC/USD | $XX,XXX | ▲/▼ X.XX% |

## 🛢️ 원자재

- WTI 원유: $XX.XX (▲/▼ X.XX%)
- 금: $X,XXX (▲/▼ X.XX%)

## 📰 주요 헤드라인 TOP 5

1. **{제목}** — {한 줄 요약}
2. **{제목}** — {한 줄 요약}
3. **{제목}** — {한 줄 요약}
4. **{제목}** — {한 줄 요약}
5. **{제목}** — {한 줄 요약}

## 📅 오늘의 주요 이벤트

- XX:XX KST — {경제 지표 발표 또는 이벤트}
- XX:XX KST — {경제 지표 발표 또는 이벤트}

## 🏢 내부 현황

- 이번 달 지출: $X.XX (예산 대비 XX%)
- 🚨 긴급 이슈: {있으면 표시, 없으면 "없음"}

## 💡 CFO 코멘트

{시장 상황에 대한 CFO의 간략한 분석 및 주의사항 1-3줄}

---
*다음 브리핑: 내일 오전 9시*
```

## CEO에게 전달하는 방법

브리핑 내용을 Paperclip 이슈 코멘트로 CEO에게 전달하세요:

### 방법 A: 기존 "Daily Briefing" 이슈에 코멘트
```
GET $PAPERCLIP_API_URL/companies/{companyId}/issues?title=Daily+Briefing&assigneeAgentId={CEO_ID}
POST $PAPERCLIP_API_URL/issues/{issueId}/comments
{ "body": "{브리핑 내용 마크다운}" }
```

### 방법 B: 새 이슈 생성 (기존 없을 경우)
```
POST $PAPERCLIP_API_URL/companies/{companyId}/issues
{
  "title": "📊 Daily Briefing — {날짜}",
  "description": "{브리핑 내용}",
  "status": "todo",
  "priority": "high",
  "assigneeAgentId": "{CEO_AGENT_ID}"
}
```

## 중복 방지

브리핑 후 오늘 날짜를 기록하여 중복 실행을 방지하세요:

```bash
echo "$(TZ=Asia/Seoul date +%Y-%m-%d)" > $AGENT_HOME/last_briefing_date.txt
```

다음 하트비트에서 이 파일을 확인:
```bash
LAST=$(cat $AGENT_HOME/last_briefing_date.txt 2>/dev/null)
TODAY=$(TZ=Asia/Seoul date +%Y-%m-%d)
if [ "$LAST" = "$TODAY" ]; then echo "이미 오늘 브리핑 완료"; fi
```

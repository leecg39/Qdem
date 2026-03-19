import { Link } from "@/lib/router";
import { Identity } from "./Identity";
import { timeAgo } from "../lib/timeAgo";
import { cn } from "../lib/utils";
import { deriveProjectUrlKey, type ActivityEvent, type Agent } from "@paperclipai/shared";

const ACTION_VERBS: Record<string, string> = {
  "issue.created": "생성함",
  "issue.updated": "업데이트함",
  "issue.checked_out": "체크아웃함",
  "issue.released": "릴리스함",
  "issue.comment_added": "댓글 추가함",
  "issue.attachment_added": "첨부 파일 추가함",
  "issue.attachment_removed": "첨부 파일 제거함",
  "issue.document_created": "문서 생성함",
  "issue.document_updated": "문서 업데이트함",
  "issue.document_deleted": "문서 삭제함",
  "issue.commented": "댓글 추가함",
  "issue.deleted": "삭제함",
  "agent.created": "생성함",
  "agent.updated": "업데이트함",
  "agent.paused": "일시 중지함",
  "agent.resumed": "재개함",
  "agent.terminated": "종료함",
  "agent.key_created": "API 키 생성함",
  "agent.budget_updated": "예산 업데이트함",
  "agent.runtime_session_reset": "세션 초기화함",
  "heartbeat.invoked": "하트비트 호출함",
  "heartbeat.cancelled": "하트비트 취소함",
  "approval.created": "승인 요청함",
  "approval.approved": "승인함",
  "approval.rejected": "거절함",
  "project.created": "생성함",
  "project.updated": "업데이트함",
  "project.deleted": "삭제함",
  "goal.created": "생성함",
  "goal.updated": "업데이트함",
  "goal.deleted": "삭제함",
  "cost.reported": "비용 보고함",
  "cost.recorded": "비용 기록함",
  "company.created": "회사 생성함",
  "company.updated": "회사 업데이트함",
  "company.archived": "보관함",
  "company.budget_updated": "예산 업데이트함",
};

function humanizeValue(value: unknown): string {
  if (typeof value !== "string") return String(value ?? "none");
  return value.replace(/_/g, " ");
}

function formatVerb(action: string, details?: Record<string, unknown> | null): string {
  if (action === "issue.updated" && details) {
    const previous = (details._previous ?? {}) as Record<string, unknown>;
    if (details.status !== undefined) {
      const from = previous.status;
      return from
        ? `상태를 ${humanizeValue(from)}에서 ${humanizeValue(details.status)}(으)로 변경함`
        : `상태를 ${humanizeValue(details.status)}(으)로 변경함`;
    }
    if (details.priority !== undefined) {
      const from = previous.priority;
      return from
        ? `우선순위를 ${humanizeValue(from)}에서 ${humanizeValue(details.priority)}(으)로 변경함`
        : `우선순위를 ${humanizeValue(details.priority)}(으)로 변경함`;
    }
  }
  return ACTION_VERBS[action] ?? action.replace(/[._]/g, " ");
}

function entityLink(entityType: string, entityId: string, name?: string | null): string | null {
  switch (entityType) {
    case "issue": return `/issues/${name ?? entityId}`;
    case "agent": return `/agents/${entityId}`;
    case "project": return `/projects/${deriveProjectUrlKey(name, entityId)}`;
    case "goal": return `/goals/${entityId}`;
    case "approval": return `/approvals/${entityId}`;
    default: return null;
  }
}

interface ActivityRowProps {
  event: ActivityEvent;
  agentMap: Map<string, Agent>;
  entityNameMap: Map<string, string>;
  entityTitleMap?: Map<string, string>;
  className?: string;
}

export function ActivityRow({ event, agentMap, entityNameMap, entityTitleMap, className }: ActivityRowProps) {
  const verb = formatVerb(event.action, event.details);

  const isHeartbeatEvent = event.entityType === "heartbeat_run";
  const heartbeatAgentId = isHeartbeatEvent
    ? (event.details as Record<string, unknown> | null)?.agentId as string | undefined
    : undefined;

  const name = isHeartbeatEvent
    ? (heartbeatAgentId ? entityNameMap.get(`agent:${heartbeatAgentId}`) : null)
    : entityNameMap.get(`${event.entityType}:${event.entityId}`);

  const entityTitle = entityTitleMap?.get(`${event.entityType}:${event.entityId}`);

  const link = isHeartbeatEvent && heartbeatAgentId
    ? `/agents/${heartbeatAgentId}/runs/${event.entityId}`
    : entityLink(event.entityType, event.entityId, name);

  const actor = event.actorType === "agent" ? agentMap.get(event.actorId) : null;
  const actorName = actor?.name ?? (event.actorType === "system" ? "시스템" : event.actorType === "user" ? "보드" : event.actorId || "알 수 없음");

  const inner = (
    <div className="flex gap-3">
      <p className="flex-1 min-w-0 truncate">
        <Identity
          name={actorName}
          size="xs"
          className="align-baseline"
        />
        <span className="text-muted-foreground ml-1">{verb} </span>
        {name && <span className="font-medium">{name}</span>}
        {entityTitle && <span className="text-muted-foreground ml-1">— {entityTitle}</span>}
      </p>
      <span className="text-xs text-muted-foreground shrink-0 pt-0.5">{timeAgo(event.createdAt)}</span>
    </div>
  );

  const classes = cn(
    "px-4 py-2 text-sm",
    link && "cursor-pointer hover:bg-accent/50 transition-colors",
    className,
  );

  if (link) {
    return (
      <Link to={link} className={cn(classes, "no-underline text-inherit block")}>
        {inner}
      </Link>
    );
  }

  return (
    <div className={classes}>
      {inner}
    </div>
  );
}

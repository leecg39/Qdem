import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@/lib/router";
import { issuesApi } from "../api/issues";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { EmptyState } from "../components/EmptyState";
import { PageSkeleton } from "../components/PageSkeleton";
import { StatusIcon } from "../components/StatusIcon";
import { PriorityIcon } from "../components/PriorityIcon";
import { CalendarDays, Download, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Issue } from "@paperclipai/shared";

function formatDate(iso: string | Date) {
  const d = iso instanceof Date ? iso : new Date(iso);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
}

function formatTime(iso: string | Date) {
  const d = iso instanceof Date ? iso : new Date(iso);
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function downloadMeetingJson(meetings: Issue[]) {
  const blob = new Blob([JSON.stringify(meetings, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `meetings-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadMeetingMarkdown(meeting: Issue) {
  const blob = new Blob([meeting.description ?? ""], {
    type: "text/markdown",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${meeting.identifier}-${new Date(meeting.createdAt).toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function Meetings() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([{ label: "미팅 기록" }]);
  }, [setBreadcrumbs]);

  const {
    data: meetings,
    isLoading,
    error,
  } = useQuery({
    queryKey: [...queryKeys.issues.list(selectedCompanyId!), "meetings"],
    queryFn: async () => {
      const all = await issuesApi.list(selectedCompanyId!, { q: "임원 미팅" });
      return all
        .filter((i) => i.title.includes("미팅"))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    },
    enabled: !!selectedCompanyId,
  });

  if (!selectedCompanyId) {
    return (
      <EmptyState
        icon={CalendarDays}
        message="미팅 기록을 보려면 회사를 선택하세요."
      />
    );
  }

  if (isLoading) {
    return <PageSkeleton variant="list" />;
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error.message}</p>}

      {meetings && meetings.length === 0 && (
        <EmptyState icon={CalendarDays} message="미팅 기록이 없습니다." />
      )}

      {meetings && meetings.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              총 {meetings.length}건의 미팅 기록
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadMeetingJson(meetings)}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              전체 내보내기 (JSON)
            </Button>
          </div>

          <div className="rounded-lg border border-border divide-y divide-border">
            {meetings.map((meeting) => {
              const issuePathId = meeting.identifier ?? meeting.id;
              return (
                <div
                  key={meeting.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
                >
                  <Link
                    to={`/issues/${issuePathId}`}
                    className="flex items-center gap-3 flex-1 min-w-0 no-underline text-inherit"
                  >
                    <CalendarDays className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="text-sm font-medium truncate">
                        {meeting.title}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">{meeting.identifier}</span>
                        <span>&middot;</span>
                        <span>{formatDate(meeting.createdAt)}</span>
                        <span>{formatTime(meeting.createdAt)}</span>
                        <span>&middot;</span>
                        <StatusIcon status={meeting.status} />
                        <PriorityIcon priority={meeting.priority} />
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="shrink-0"
                    title="마크다운 다운로드"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadMeetingMarkdown(meeting);
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

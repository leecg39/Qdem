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

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li>$2</li>")
    .replace(/\| (.+)/g, (line) => {
      const cells = line.split("|").filter(Boolean).map((c) => c.trim());
      return "<tr>" + cells.map((c) => `<td style="border:1px solid #ddd;padding:6px 10px">${c}</td>`).join("") + "</tr>";
    })
    .replace(/^---$/gm, "<hr/>")
    .replace(/\n/g, "<br/>");
}

function downloadMeetingsPdf(meetings: Issue[]) {
  const content = meetings
    .map((m) => {
      const date = new Date(m.createdAt).toLocaleDateString("ko-KR");
      return `<div style="page-break-after:always;margin-bottom:40px">
        <h1 style="font-size:18px;border-bottom:2px solid #333;padding-bottom:8px">${m.title}</h1>
        <p style="color:#666;font-size:12px">${m.identifier} | ${date}</p>
        <div style="font-size:13px;line-height:1.8">${markdownToHtml(m.description ?? "")}</div>
      </div>`;
    })
    .join("");

  const html = `<!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <title>QDEM 미팅 기록</title>
    <style>
      body{font-family:-apple-system,sans-serif;margin:40px;color:#222}
      h1{font-size:18px}h2{font-size:15px;margin-top:16px}h3{font-size:13px}
      hr{border:none;border-top:1px solid #ccc;margin:16px 0}
      li{margin:2px 0}
      table{border-collapse:collapse;width:100%;margin:8px 0}
      td{font-size:12px}
      @media print{body{margin:20px}}
    </style>
  </head><body>${content}</body></html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.onafterprint = () => win.close();
  setTimeout(() => win.print(), 300);
}

function downloadMeetingPdf(meeting: Issue) {
  const date = new Date(meeting.createdAt).toLocaleDateString("ko-KR");
  const html = `<!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <title>${meeting.identifier} - ${meeting.title}</title>
    <style>
      body{font-family:-apple-system,sans-serif;margin:40px;color:#222}
      h1{font-size:18px}h2{font-size:15px;margin-top:16px}h3{font-size:13px}
      hr{border:none;border-top:1px solid #ccc;margin:16px 0}
      li{margin:2px 0}
      table{border-collapse:collapse;width:100%;margin:8px 0}
      td{font-size:12px}
      @media print{body{margin:20px}}
    </style>
  </head><body>
    <h1 style="font-size:18px;border-bottom:2px solid #333;padding-bottom:8px">${meeting.title}</h1>
    <p style="color:#666;font-size:12px">${meeting.identifier} | ${date}</p>
    <div style="font-size:13px;line-height:1.8">${markdownToHtml(meeting.description ?? "")}</div>
  </body></html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.onafterprint = () => win.close();
  setTimeout(() => win.print(), 300);
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
              onClick={() => downloadMeetingsPdf(meetings)}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              전체 내보내기 (PDF)
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
                    title="PDF 다운로드"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadMeetingPdf(meeting);
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

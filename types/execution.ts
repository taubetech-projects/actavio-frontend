export type ExecutionStatus = "EXECUTING" | "SUCCESS" | "FAILED";

export interface ActionResultResponse {
  actionIndex: number;
  status: "SUCCESS" | "FAILED";
  link: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  data: Record<string, unknown> | null;
}

export interface ExecutionRunResponse {
  id: string;
  requestId: string;
  engineType: "N8N" | "DIRECT" | "HYBRID";
  status: ExecutionStatus;
  startedAt: string;
  finishedAt: string | null;
  actions: ActionResultResponse[];
}

import { actionPlansApi, type ActionPlanDetail } from "@/lib/api";
import type { PlanExecutionResult } from "@/types/airtable";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const TERMINAL_STATUSES = new Set(["SUCCESS", "COMPLETED", "FAILED", "CANCELLED"]);

async function pollUntilComplete(
  planId: string,
  maxAttempts = 20
): Promise<ActionPlanDetail> {
  for (let i = 0; i < maxAttempts; i++) {
    const plan = await actionPlansApi.get(planId);
    if (TERMINAL_STATUSES.has(plan.status)) return plan;
    await sleep(Math.min(1500 * Math.pow(1.3, i), 8000));
  }
  throw new Error("Airtable operation timed out after 30 seconds.");
}

export async function executeAirtablePlan(
  instructionText: string
): Promise<PlanExecutionResult> {
  // 1. Create plan via NLP preview
  const plan = await actionPlansApi.preview(instructionText);
  const planId = plan.actionPlanId;

  // 2. Confirm the plan (kick off execution)
  await actionPlansApi.confirm(planId);

  // 3. Poll until terminal state
  const completed = await pollUntilComplete(planId);

  // 4. Extract the first action's result
  const action = completed.actions?.[0];
  const payload = action?.payload ?? {};
  const raw = payload.raw ?? null;
  const link = (payload.link as string | null) ?? null;
  const errorCode = (payload.errorCode as string | null) ?? null;
  const messageUser = (payload.messageUser as string | null) ?? null;

  if (
    completed.status === "FAILED" ||
    completed.status === "CANCELLED" ||
    (action as { status?: string } | undefined)?.status === "FAILED"
  ) {
    return { raw, link, errorCode, messageUser, status: "FAILED" };
  }

  return { raw, link, errorCode, messageUser, status: "SUCCESS" };
}

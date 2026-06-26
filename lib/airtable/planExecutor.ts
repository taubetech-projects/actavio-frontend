import { actionPlansApi, executionApi } from "@/lib/api";
import type { PlanExecutionResult } from "@/types/airtable";
import type { ExecutionRunResponse } from "@/types/execution";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function pollExecution(
  planId: string,
  maxAttempts = 15
): Promise<ExecutionRunResponse> {
  for (let i = 0; i < maxAttempts; i++) {
    const execution = await executionApi.getLatest(planId);
    if (execution.status === "SUCCESS" || execution.status === "FAILED") {
      return execution;
    }
    await sleep(Math.min(2000 * Math.pow(1.2, i), 8000));
  }
  throw new Error("Airtable operation timed out after 30 seconds.");
}

export async function executeAirtablePlan(
  instructionText: string
): Promise<PlanExecutionResult> {
  // 1. Create plan via NLP preview
  const plan = await actionPlansApi.preview(instructionText);
  const planId = plan.actionPlanId;

  // 2. Confirm the plan (kicks off async execution)
  await actionPlansApi.confirm(planId);

  // 3. Poll executions/latest until SUCCESS or FAILED
  const execution = await pollExecution(planId);

  // 4. Extract first action result
  const actionResult = execution.actions?.[0];
  const data = actionResult?.data ?? null;
  const link = actionResult?.link ?? null;
  const errorCode = actionResult?.errorCode ?? null;
  const messageUser = actionResult?.errorMessage ?? null;

  if (execution.status === "FAILED" || actionResult?.status === "FAILED") {
    return { raw: data, link, errorCode, messageUser, status: "FAILED" };
  }

  return { raw: data, link, errorCode, messageUser, status: "SUCCESS" };
}

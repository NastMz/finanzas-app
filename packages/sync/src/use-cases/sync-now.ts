import { SyncError } from "../errors.js";
import type { SyncNowDependencies } from "../ports.js";

export interface SyncNowResult {
  pushedOpIds: string[];
  ackedOpIds: string[];
  failedOpIds: string[];
  pulledChanges: number;
  nextCursor: string;
}

export const syncNow = async (
  dependencies: SyncNowDependencies,
): Promise<SyncNowResult> => {
  const pendingOperations = await dependencies.outbox.listPending();
  const pendingOpIds = pendingOperations.map((operation) => operation.opId);

  let ackedOpIds: string[] = [];
  let failedOpIds: string[] = [];

  if (pendingOpIds.length > 0) {
    await dependencies.outbox.markAsSent(pendingOpIds);

    let pushResponse;

    try {
      pushResponse = await dependencies.api.push({
        deviceId: dependencies.deviceId,
        ops: pendingOperations,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      await dependencies.outbox.markAsFailed(pendingOpIds, errorMessage);
      throw new SyncError(`Push failed: ${errorMessage}`);
    }

    const ackedSet = new Set(pushResponse.ackedOpIds);
    ackedOpIds = pendingOpIds.filter((opId) => ackedSet.has(opId));
    failedOpIds = pendingOpIds.filter((opId) => !ackedSet.has(opId));

    if (ackedOpIds.length > 0) {
      await dependencies.outbox.markAsAcked(ackedOpIds);
    }

    if (failedOpIds.length > 0) {
      await dependencies.outbox.markAsFailed(
        failedOpIds,
        "Server did not acknowledge operation.",
      );
    }
  }

  const cursor = await dependencies.syncState.getCursor();
  const pullResponse = await dependencies.api.pull({
    deviceId: dependencies.deviceId,
    cursor,
  });

  await dependencies.changeApplier.apply(pullResponse.changes);
  await dependencies.syncState.setCursor(pullResponse.nextCursor);

  return {
    pushedOpIds: pendingOpIds,
    ackedOpIds,
    failedOpIds,
    pulledChanges: pullResponse.changes.length,
    nextCursor: pullResponse.nextCursor,
  };
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unknown sync error.";
};

import type { Clock } from "@finanzas/application";
import type { SyncApiClient, SyncChange } from "@finanzas/sync";

/**
 * Creates an in-memory sync backend used by local web bootstrap.
 */
export const createInMemorySyncApi = (clock: Clock): SyncApiClient => {
  const remoteChanges: SyncChange[] = [];

  return {
    async push(request) {
      for (const operation of request.ops) {
        const nextVersion = remoteChanges.length + 1;

        remoteChanges.push({
          changeId: `chg-${nextVersion}`,
          entityType: operation.entityType,
          entityId: operation.entityId,
          opType: operation.opType,
          payload: { ...operation.payload },
          serverVersion:
            operation.baseVersion === undefined
              ? nextVersion
              : operation.baseVersion,
          serverTimestamp: clock.now(),
        });
      }

      return {
        ackedOpIds: request.ops.map((operation) => operation.opId),
        conflicts: [],
        serverTime: clock.now(),
      };
    },
    async pull(request) {
      const cursor = parseCursor(request.cursor);

      return {
        nextCursor: remoteChanges.length.toString(),
        changes: remoteChanges.slice(cursor).map(cloneSyncChange),
      };
    },
  };
};

const parseCursor = (cursor: string | null): number => {
  if (!cursor) {
    return 0;
  }

  const parsedCursor = Number.parseInt(cursor, 10);

  if (Number.isNaN(parsedCursor) || parsedCursor < 0) {
    return 0;
  }

  return parsedCursor;
};

const cloneSyncChange = (change: SyncChange): SyncChange => ({
  ...change,
  payload: {
    ...change.payload,
  },
  serverTimestamp: new Date(change.serverTimestamp),
});

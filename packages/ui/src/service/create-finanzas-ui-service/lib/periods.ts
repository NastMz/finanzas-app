import type { FinanzasPeriod } from "../../../models/finanzas-ui-types.js";
import type { LoadHomeTabInput } from "../contracts/index.js";

export const resolvePeriod = (
  period: LoadHomeTabInput["period"] | undefined,
  baseDate: Date,
): FinanzasPeriod => {
  if (period) {
    return {
      from: new Date(period.from),
      to: new Date(period.to),
      label:
        period.label ??
        `${period.from.toISOString().slice(0, 10)} - ${period.to.toISOString().slice(0, 10)}`,
    };
  }

  const from = new Date(
    Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), 1, 0, 0, 0, 0),
  );
  const to = new Date(
    Date.UTC(
      baseDate.getUTCFullYear(),
      baseDate.getUTCMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    ),
  );

  return {
    from,
    to,
    label: `${from.getUTCFullYear()}-${String(from.getUTCMonth() + 1).padStart(2, "0")}`,
  };
};

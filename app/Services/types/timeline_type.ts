import { DateTime } from "luxon/src/datetime";

export interface TimelineType {
    investmentId: string,
    userId: string,
    walletId: string,
    action: string,
    message: string,
    metadata: string,
    createdAt: DateTime,
}

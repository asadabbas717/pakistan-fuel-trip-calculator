import { createSerialQueue } from "./serialQueue";
// Restore and all collection mutations share a queue, preventing lost updates.
export const enqueueCollection = createSerialQueue();

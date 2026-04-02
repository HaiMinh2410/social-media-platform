import { Job } from "bullmq";
import { JobType } from "@/domain/types/queue";

/**
 * Interface representing a map of job processors by their JobType.
 */
export type ProcessorMap = {
  [K in JobType]?: (job: Job) => Promise<any>;
};

/**
 * Registry of active processors for the worker.
 * We initialize this with empty handlers for now.
 */
export const processors: ProcessorMap = {
  [JobType.MESSAGE_RECEIVED]: async (job: Job) => {
    console.log(`[PROCESSOR] Handling ${JobType.MESSAGE_RECEIVED} Job:`, job.id);
    // Logic will be implemented in T011
  },
  [JobType.GENERATE_REPLY]: async (job: Job) => {
    console.log(`[PROCESSOR] Handling ${JobType.GENERATE_REPLY} Job:`, job.id);
    // Logic will be implemented in T011
  },
  [JobType.REFRESH_META_TOKEN]: async (job: Job) => {
    console.log(`[PROCESSOR] Handling ${JobType.REFRESH_META_TOKEN} Job:`, job.id);
    // Logic will be implemented in T012
  }
};

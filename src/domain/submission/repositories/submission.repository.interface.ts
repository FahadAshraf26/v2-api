import { Result } from 'oxide.ts';

import { Submission } from '../entity/submission.entity';

export interface ISubmissionRepository {
  save(submission: Submission): Promise<Result<Submission, Error>>;
  update(submission: Submission): Promise<Result<Submission, Error>>;
  findById(id: string): Promise<Result<Submission | null, Error>>;
  findByCampaignId(campaignId: string): Promise<Result<Submission[], Error>>;
  findBySubmittedBy(submittedBy: string): Promise<Result<Submission[], Error>>;
  findPendingSubmissions(): Promise<Result<Submission[], Error>>;
}

import { injectable } from 'tsyringe';

import { Submission } from '@/domain/submission/entity/submission.entity';

import { SubmissionModelAttributes } from '@/infrastructure/database/models/submission.model';

import { SubmissionProps } from '@/types/approval';

@injectable()
export class SubmissionMapper {
  toDomain(model: SubmissionModelAttributes): Submission {
    const props: SubmissionProps = {
      id: model.id,
      campaignId: model.campaignId,
      submittedBy: model.submittedBy,
      items: model.items,
      submissionNote: model.submissionNote ?? undefined,
      status: model.status,
      results: model.results,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };

    return Submission.fromPersistence(props);
  }

  toPersistence(domain: Submission): SubmissionModelAttributes {
    const domainObject = domain.toObject();

    return {
      id: domainObject.id,
      campaignId: domainObject.campaignId,
      submittedBy: domainObject.submittedBy,
      items: domainObject.items,
      submissionNote: domainObject.submissionNote ?? null,
      status: domainObject.status,
      results: domainObject.results,
      createdAt: domainObject.createdAt,
      updatedAt: domainObject.updatedAt,
    };
  }

  toPersistenceCriteria(
    domainCriteria: Record<string, any>
  ): Record<string, any> {
    const persistenceCriteria: Record<string, any> = {};

    for (const [key, value] of Object.entries(domainCriteria)) {
      if (value === undefined) {
        continue;
      }

      switch (key) {
        case 'id':
        case 'campaignId':
        case 'submittedBy':
        case 'status':
        case 'createdAt':
        case 'updatedAt':
          persistenceCriteria[key] = value;
          break;
        default:
          persistenceCriteria[key] = value;
          break;
      }
    }

    return persistenceCriteria;
  }
}

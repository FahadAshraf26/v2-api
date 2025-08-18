import { injectable } from 'tsyringe';

import { ApprovalHistory } from '@/domain/approval-history/entity/approval-history.entity';

import {
  ApprovalHistoryModelAttributes,
  ApprovalHistoryProps,
} from '@/types/approval-history';

@injectable()
export class ApprovalHistoryMapper {
  toDomain(model: ApprovalHistoryModelAttributes): ApprovalHistory {
    const props: ApprovalHistoryProps = {
      ...model,
      comment: model.comment || null,
    };
    return ApprovalHistory.fromPersistence(props);
  }

  toPersistence(domain: ApprovalHistory): ApprovalHistoryModelAttributes {
    const props = domain.toObject();
    return {
      ...props,
      comment: props.comment || null,
    };
  }
}

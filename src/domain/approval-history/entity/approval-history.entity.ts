import { randomUUID } from 'crypto';

import { Entity } from '@/domain/core/entity';

import { ApprovalHistoryProps } from '@/types/approval-history';

export class ApprovalHistory extends Entity<ApprovalHistoryProps> {
  constructor(props: ApprovalHistoryProps, id?: string) {
    super(id);
    this.props = props;
  }

  private props: ApprovalHistoryProps;

  static create(
    props: Omit<ApprovalHistoryProps, 'id' | 'createdAt' | 'updatedAt'>
  ): ApprovalHistory {
    const now = new Date();
    const id = randomUUID();
    return new ApprovalHistory(
      {
        ...props,
        id,
        createdAt: now,
        updatedAt: now,
      },
      id
    );
  }

  static fromPersistence(props: ApprovalHistoryProps): ApprovalHistory {
    return new ApprovalHistory(props, props.id);
  }

  toObject(): ApprovalHistoryProps {
    return this.props;
  }

  get entityId(): string {
    return this.props.entityId;
  }

  get entityType(): string {
    return this.props.entityType;
  }

  get status(): string {
    return this.props.status;
  }

  get userId(): string {
    return this.props.userId;
  }

  get comment(): string | null | undefined {
    return this.props.comment;
  }
}

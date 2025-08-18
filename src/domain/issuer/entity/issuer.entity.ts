import { Entity } from '@/domain/core/entity';

import { IssuerProps } from '@/types/issuer';

export class Issuer extends Entity<IssuerProps> {
  constructor(props: IssuerProps, id?: string) {
    super(id);
    this.props = props;
  }

  private props: IssuerProps;

  static create(props: Omit<IssuerProps, 'createdAt' | 'updatedAt'>): Issuer {
    const now = new Date();
    return new Issuer(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      props.issuerId
    );
  }

  static fromPersistence(props: IssuerProps): Issuer {
    return new Issuer(props, props.issuerId);
  }

  toObject(): IssuerProps {
    return this.props;
  }
}

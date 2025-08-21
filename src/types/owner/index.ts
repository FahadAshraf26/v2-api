export interface OwnerProps {
  ownerId: string;
  title?: string;
  subTitle?: string | null;
  description?: string;
  primaryOwner?: boolean;
  beneficialOwner?: boolean;
  beneficialOwnerId?: string | null;
  businessOwner?: boolean | null;
  userId?: string;
}

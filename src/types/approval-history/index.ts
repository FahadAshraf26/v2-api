export interface ApprovalHistoryModelAttributes {
  id: string;
  entityId: string;
  entityType: string;
  status: string;
  userId: string;
  comment?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalHistoryProps {
  id: string;
  entityId: string;
  entityType: string;
  status: string;
  userId: string;
  comment?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

export interface DashboardOwnersProps {
  id: string;
  campaignId: string;
  name: string;
  position: string;
  description: string;
  ownerId?: string;
  status: ApprovalStatus;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  reviewedAt?: Date;
  submittedBy?: string;
  reviewedBy?: string;
  comment?: string;
}

export interface DashboardOwnerDto {
  id: string;
  campaignId: string;
  name: string;
  position: string;
  description: string;
  status: ApprovalStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertDashboardOwnerDto {
  id?: string; // Present for updates, absent for creations
  name: string;
  position: string;
  description: string;
}

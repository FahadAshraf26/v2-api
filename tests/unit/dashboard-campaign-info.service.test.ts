import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardCampaignInfoService } from '@/application/services/dashboard-campaign-info.service';
import { DashboardCampaignInfoRepository } from '@/infrastructure/repositories/dashboard-campaign-info.repository';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { DashboardCampaignInfo } from '@/domain/dashboard-campaign-info/entity/dashboard-campaign-info.entity';
import { ApprovalStatus } from '@/shared/enums/dashboard-campaign-info.enums';
import { Ok, Err } from 'oxide.ts';
import { randomUUID } from 'crypto';

const mockRepository = {
  findByCampaignId: vi.fn(),
  save: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  moveToApprovedTable: vi.fn(),
  findPendingForReview: vi.fn(),
  findBySubmittedBy: vi.fn(),
} as unknown as DashboardCampaignInfoRepository;

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
} as unknown as LoggerService;

describe('DashboardCampaignInfoService', () => {
  let service: DashboardCampaignInfoService;
  let mockDashboardInfo: DashboardCampaignInfo;

  beforeEach(() => {
    vi.clearAllMocks();

    service = new DashboardCampaignInfoService(mockRepository, mockLogger);

    const mockProps = {
      id: randomUUID(),
      campaignId: randomUUID(),
      milestones: 'Test milestones',
      investorPitch: 'Test pitch',
      isShowPitch: true,
      investorPitchTitle: 'Test title',
      status: ApprovalStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockDashboardInfo = DashboardCampaignInfo.fromPersistence(mockProps);
  });

  describe('create', () => {
    const createDto = {
      campaignId: randomUUID(),
      milestones: 'Test milestones',
      investorPitch: 'Test pitch',
      isShowPitch: true,
      investorPitchTitle: 'Test title',
    };
    const userId = randomUUID();

    it('should create dashboard campaign info successfully', async () => {
      mockRepository.findByCampaignId = vi.fn().mockResolvedValue(Ok(null));
      mockRepository.save = vi.fn().mockResolvedValue(Ok(mockDashboardInfo));

      const result = await service.create(createDto, userId);

      expect(result.isOk()).toBe(true);
      expect(mockRepository.findByCampaignId).toHaveBeenCalledWith(
        createDto.campaignId
      );
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Dashboard campaign info created successfully',
        expect.objectContaining({
          campaignId: createDto.campaignId,
        })
      );
    });

    it('should fail if dashboard campaign info already exists', async () => {
      mockRepository.findByCampaignId = vi
        .fn()
        .mockResolvedValue(Ok(mockDashboardInfo));

      const result = await service.create(createDto, userId);

      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toContain('already exists');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      mockRepository.findByCampaignId = vi
        .fn()
        .mockResolvedValue(Err(new Error('Database error')));

      const result = await service.create(createDto, userId);

      expect(result.isErr()).toBe(true);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle domain validation errors', async () => {
      const invalidDto = { ...createDto, campaignId: '' };
      mockRepository.findByCampaignId = vi.fn().mockResolvedValue(Ok(null));

      const result = await service.create(invalidDto, userId);

      expect(result.isErr()).toBe(true);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateDto = {
      milestones: 'Updated milestones',
      investorPitch: 'Updated pitch',
    };
    const userId = randomUUID();
    const dashboardId = randomUUID();

    it('should update dashboard campaign info successfully', async () => {
      const mockUpdatedInfo = { ...mockDashboardInfo };
      mockRepository.findById = vi
        .fn()
        .mockResolvedValue(Ok(mockDashboardInfo));
      mockRepository.update = vi.fn().mockResolvedValue(Ok(mockUpdatedInfo));
      vi.spyOn(mockDashboardInfo, 'canEdit').mockReturnValue(true);
      vi.spyOn(mockDashboardInfo, 'update').mockReturnValue(Ok(undefined));

      const result = await service.update(dashboardId, updateDto, userId);

      expect(result.isOk()).toBe(true);
      expect(mockRepository.findById).toHaveBeenCalledWith(dashboardId);
      expect(mockDashboardInfo.canEdit).toHaveBeenCalledWith(userId);
      expect(mockDashboardInfo.update).toHaveBeenCalledWith(updateDto);
      expect(mockRepository.update).toHaveBeenCalledWith(
        dashboardId,
        mockDashboardInfo
      );
    });

    it('should fail if dashboard campaign info not found', async () => {
      mockRepository.findById = vi.fn().mockResolvedValue(Ok(null));

      const result = await service.update(dashboardId, updateDto, userId);

      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toContain('not found');
    });

    it('should fail if user cannot edit', async () => {
      mockRepository.findById = vi
        .fn()
        .mockResolvedValue(Ok(mockDashboardInfo));
      vi.spyOn(mockDashboardInfo, 'canEdit').mockReturnValue(false);

      const result = await service.update(dashboardId, updateDto, userId);

      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toContain('not authorized');
    });
  });

  describe('submit', () => {
    const userId = randomUUID();
    const dashboardId = randomUUID();

    it('should submit dashboard campaign info successfully', async () => {
      mockRepository.findById = vi
        .fn()
        .mockResolvedValue(Ok(mockDashboardInfo));
      mockRepository.update = vi.fn().mockResolvedValue(Ok(mockDashboardInfo));
      vi.spyOn(mockDashboardInfo, 'submit').mockReturnValue(Ok(undefined));

      const result = await service.submit(dashboardId, userId);

      expect(result.isOk()).toBe(true);
      expect(mockDashboardInfo.submit).toHaveBeenCalledWith(userId);
      expect(mockRepository.update).toHaveBeenCalledWith(
        dashboardId,
        mockDashboardInfo
      );
    });

    it('should fail if dashboard campaign info not found', async () => {
      mockRepository.findById = vi.fn().mockResolvedValue(Ok(null));

      const result = await service.submit(dashboardId, userId);

      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toContain('not found');
    });

    it('should handle domain validation errors', async () => {
      mockRepository.findById = vi
        .fn()
        .mockResolvedValue(Ok(mockDashboardInfo));
      vi.spyOn(mockDashboardInfo, 'submit').mockReturnValue(
        Err(new Error('Already approved'))
      );

      const result = await service.submit(dashboardId, userId);

      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toBe('Already approved');
    });
  });

  describe('review', () => {
    const adminId = randomUUID();
    const dashboardId = randomUUID();

    it('should approve dashboard campaign info successfully', async () => {
      const reviewDto = {
        action: 'approve' as const,
        comment: 'Looks good!',
        adminId,
      };

      mockRepository.findById = vi
        .fn()
        .mockResolvedValue(Ok(mockDashboardInfo));
      mockRepository.update = vi.fn().mockResolvedValue(Ok(mockDashboardInfo));
      mockRepository.moveToApprovedTable = vi
        .fn()
        .mockResolvedValue(Ok(undefined));
      vi.spyOn(mockDashboardInfo, 'approve').mockReturnValue(Ok(undefined));

      const result = await service.review(dashboardId, reviewDto);

      expect(result.isOk()).toBe(true);
      expect(mockDashboardInfo.approve).toHaveBeenCalledWith(
        adminId,
        reviewDto.comment
      );
      expect(mockRepository.update).toHaveBeenCalledWith(
        dashboardId,
        mockDashboardInfo
      );
      expect(mockRepository.moveToApprovedTable).toHaveBeenCalledWith(
        mockDashboardInfo
      );
    });

    it('should reject dashboard campaign info successfully', async () => {
      const reviewDto = {
        action: 'reject' as const,
        comment: 'Needs improvement',
        adminId,
      };

      mockRepository.findById = vi
        .fn()
        .mockResolvedValue(Ok(mockDashboardInfo));
      mockRepository.update = vi.fn().mockResolvedValue(Ok(mockDashboardInfo));
      vi.spyOn(mockDashboardInfo, 'reject').mockReturnValue(Ok(undefined));

      const result = await service.review(dashboardId, reviewDto);

      expect(result.isOk()).toBe(true);
      expect(mockDashboardInfo.reject).toHaveBeenCalledWith(
        adminId,
        reviewDto.comment
      );
      expect(mockRepository.update).toHaveBeenCalledWith(
        dashboardId,
        mockDashboardInfo
      );
      expect(mockRepository.moveToApprovedTable).not.toHaveBeenCalled();
    });

    it('should fail rejection without comment', async () => {
      const reviewDto = {
        action: 'reject' as const,
        adminId,
      };

      const result = await service.review(dashboardId, reviewDto);

      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toContain('Comment is required');
    });

    it('should handle moveToApprovedTable failure gracefully', async () => {
      const reviewDto = {
        action: 'approve' as const,
        comment: 'Approved',
        adminId,
      };

      mockRepository.findById = vi
        .fn()
        .mockResolvedValue(Ok(mockDashboardInfo));
      mockRepository.update = vi.fn().mockResolvedValue(Ok(mockDashboardInfo));
      mockRepository.moveToApprovedTable = vi
        .fn()
        .mockResolvedValue(Err(new Error('Migration failed')));
      vi.spyOn(mockDashboardInfo, 'approve').mockReturnValue(Ok(undefined));

      const result = await service.review(dashboardId, reviewDto);

      expect(result.isOk()).toBe(true); // Should still succeed even if migration fails
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to move approved data to campaignInfos table',
        expect.any(Error)
      );
    });
  });

  describe('getById', () => {
    const dashboardId = randomUUID();

    it('should get dashboard campaign info by ID successfully', async () => {
      mockRepository.findById = vi
        .fn()
        .mockResolvedValue(Ok(mockDashboardInfo));

      const result = await service.getById(dashboardId);

      expect(result.isOk()).toBe(true);
      expect(result.unwrap()).toBe(mockDashboardInfo);
      expect(mockRepository.findById).toHaveBeenCalledWith(dashboardId);
    });

    it('should return null if not found', async () => {
      mockRepository.findById = vi.fn().mockResolvedValue(Ok(null));

      const result = await service.getById(dashboardId);

      expect(result.isOk()).toBe(true);
      expect(result.unwrap()).toBeNull();
    });

    it('should handle repository errors', async () => {
      mockRepository.findById = vi
        .fn()
        .mockResolvedValue(Err(new Error('Database error')));

      const result = await service.getById(dashboardId);

      expect(result.isErr()).toBe(true);
    });
  });

  describe('getByCampaignId', () => {
    const campaignId = randomUUID();

    it('should get dashboard campaign info by campaign ID successfully', async () => {
      mockRepository.findByCampaignId = vi
        .fn()
        .mockResolvedValue(Ok(mockDashboardInfo));

      const result = await service.getByCampaignId(campaignId);

      expect(result.isOk()).toBe(true);
      expect(result.unwrap()).toBe(mockDashboardInfo);
      expect(mockRepository.findByCampaignId).toHaveBeenCalledWith(campaignId);
    });
  });

  describe('getPendingForReview', () => {
    it('should get pending dashboard campaign infos successfully', async () => {
      const pendingItems = [mockDashboardInfo];
      mockRepository.findPendingForReview = vi
        .fn()
        .mockResolvedValue(Ok(pendingItems));

      const result = await service.getPendingForReview();

      expect(result.isOk()).toBe(true);
      expect(result.unwrap()).toBe(pendingItems);
      expect(mockRepository.findPendingForReview).toHaveBeenCalled();
    });
  });

  describe('getBySubmittedBy', () => {
    const userId = randomUUID();

    it('should get dashboard campaign infos by submitter successfully', async () => {
      const userItems = [mockDashboardInfo];
      mockRepository.findBySubmittedBy = vi
        .fn()
        .mockResolvedValue(Ok(userItems));

      const result = await service.getBySubmittedBy(userId);

      expect(result.isOk()).toBe(true);
      expect(result.unwrap()).toBe(userItems);
      expect(mockRepository.findBySubmittedBy).toHaveBeenCalledWith(userId);
    });
  });
});

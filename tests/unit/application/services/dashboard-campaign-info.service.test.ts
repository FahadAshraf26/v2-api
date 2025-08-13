import { Err, Ok } from 'oxide.ts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DashboardCampaignInfoService } from '../../../../src/application/services/dashboard-campaign-info.service';
import { DashboardCampaignInfo } from '../../../../src/domain/dashboard-campaign-info/entity/dashboard-campaign-info.entity';
import { ApprovalStatus } from '../../../../src/shared/enums/approval-status.enums';
import { testHelpers } from '../../../setup/test-helper';

describe('DashboardCampaignInfoService', () => {
  let service: DashboardCampaignInfoService;
  let mockRepository: any;
  let mockApprovalRepository: any;
  let mockLogger: any;

  beforeEach(() => {
    mockRepository = testHelpers.mocks.createMockRepository();
    mockApprovalRepository = testHelpers.mocks.createMockApprovalRepository();
    mockLogger = testHelpers.mocks.createMockLogger();

    service = new DashboardCampaignInfoService(
      mockRepository,
      mockApprovalRepository,
      mockLogger
    );
  });

  describe('create', () => {
    it('should create dashboard campaign info successfully', async () => {
      // Arrange
      const userId = testHelpers.data.createUserId();
      const createDto = {
        campaignId: testHelpers.data.createCampaignId(),
        milestones: 'Q1: Development, Q2: Testing',
        investorPitch: 'Revolutionary platform',
        isShowPitch: true,
        investorPitchTitle: 'The Future',
      };

      const mockEntity = DashboardCampaignInfo.fromPersistence(
        testHelpers.domain.validDashboardCampaignInfoData()
      );

      mockRepository.findByCampaignIdWithApproval.mockResolvedValue(Ok(null));
      mockRepository.save.mockResolvedValue(Ok(mockEntity));

      // Act
      const result = await service.create(createDto, userId);

      // Assert
      expect(result.isOk()).toBe(true);
      const info = testHelpers.utils.assertOk(result);

      expect(info.campaignId).toBe(createDto.campaignId);
      expect(mockRepository.findByCampaignIdWithApproval).toHaveBeenCalledWith(
        createDto.campaignId
      );
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Creating dashboard campaign info',
        expect.objectContaining({ campaignId: createDto.campaignId, userId })
      );
    });

    it('should fail if dashboard campaign info already exists for campaign', async () => {
      // Arrange
      const userId = testHelpers.data.createUserId();
      const createDto = {
        campaignId: testHelpers.data.createCampaignId(),
        milestones: 'Q1: Development',
      };

      const existingEntity = DashboardCampaignInfo.fromPersistence(
        testHelpers.domain.validDashboardCampaignInfoData()
      );

      mockRepository.findByCampaignIdWithApproval.mockResolvedValue(
        Ok(existingEntity)
      );

      // Act
      const result = await service.create(createDto, userId);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain('already exists');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository errors during creation', async () => {
      // Arrange
      const userId = testHelpers.data.createUserId();
      const createDto = {
        campaignId: testHelpers.data.createCampaignId(),
        milestones: 'Q1: Development',
      };

      mockRepository.findByCampaignIdWithApproval.mockResolvedValue(Ok(null));
      mockRepository.save.mockResolvedValue(Err(new Error('Database error')));

      // Act
      const result = await service.create(createDto, userId);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain('Database error');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update dashboard campaign info successfully', async () => {
      // Arrange
      const infoId = testHelpers.data.createUserId();
      const userId = testHelpers.data.createUserId();
      const updateDto = {
        milestones: 'Updated milestones',
        investorPitch: 'Updated pitch',
      };

      const mockEntity = DashboardCampaignInfo.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignInfoData(),
        id: infoId,
        status: ApprovalStatus.PENDING,
        submittedBy: userId,
      });

      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(mockEntity));
      mockRepository.save.mockResolvedValue(Ok(mockEntity));

      // Act
      const result = await service.update(infoId, updateDto, userId);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockRepository.findByIdWithApproval).toHaveBeenCalledWith(infoId);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should fail if dashboard campaign info not found', async () => {
      // Arrange
      const infoId = testHelpers.data.createUserId();
      const userId = testHelpers.data.createUserId();
      const updateDto = { milestones: 'Updated' };

      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(null));

      // Act
      const result = await service.update(infoId, updateDto, userId);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain('not found');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should fail if user not authorized to edit', async () => {
      // Arrange
      const infoId = testHelpers.data.createUserId();
      const userId = testHelpers.data.createUserId();
      const differentUserId = testHelpers.data.createUserId();
      const updateDto = { milestones: 'Updated' };

      const mockEntity = DashboardCampaignInfo.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignInfoData(),
        id: infoId,
        status: ApprovalStatus.PENDING,
        submittedBy: differentUserId, // Different user
      });

      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(mockEntity));

      // Act
      const result = await service.update(infoId, updateDto, userId);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain('not authorized');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should fail if trying to update approved info', async () => {
      // Arrange
      const infoId = testHelpers.data.createUserId();
      const userId = testHelpers.data.createUserId();
      const updateDto = { milestones: 'Updated' };

      const mockEntity = DashboardCampaignInfo.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignInfoData(),
        id: infoId,
        status: ApprovalStatus.APPROVED,
        submittedBy: userId,
      });

      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(mockEntity));

      // Act
      const result = await service.update(infoId, updateDto, userId);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain('not authorized');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('submit', () => {
    it('should submit dashboard campaign info for approval successfully', async () => {
      // Arrange
      const infoId = testHelpers.data.createUserId();
      const userId = testHelpers.data.createUserId();

      const mockEntity = DashboardCampaignInfo.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignInfoData(),
        id: infoId,
        status: ApprovalStatus.PENDING,
      });

      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(mockEntity));
      mockRepository.submitForApproval.mockResolvedValue(Ok(mockEntity));

      // Act
      const result = await service.submit(infoId, userId);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockRepository.findByIdWithApproval).toHaveBeenCalledWith(infoId);
      expect(mockRepository.submitForApproval).toHaveBeenCalledWith(
        infoId,
        userId
      );
    });

    it('should fail if dashboard campaign info not found', async () => {
      // Arrange
      const infoId = testHelpers.data.createUserId();
      const userId = testHelpers.data.createUserId();

      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(null));

      // Act
      const result = await service.submit(infoId, userId);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain('not found');
      expect(mockRepository.submitForApproval).not.toHaveBeenCalled();
    });

    it('should fail if entity not ready for submission', async () => {
      // Arrange
      const infoId = testHelpers.data.createUserId();
      const userId = testHelpers.data.createUserId();

      const mockEntity = DashboardCampaignInfo.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignInfoData(),
        id: infoId,
        milestones: undefined, // No content
        investorPitch: undefined,
        isShowPitch: undefined,
        investorPitchTitle: undefined,
        status: ApprovalStatus.PENDING,
      });

      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(mockEntity));

      // Act
      const result = await service.submit(infoId, userId);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain('needs content');
      expect(mockRepository.submitForApproval).not.toHaveBeenCalled();
    });
  });

  describe('review', () => {
    it('should approve dashboard campaign info successfully', async () => {
      // Arrange
      const infoId = testHelpers.data.createUserId();
      const adminId = testHelpers.data.createAdminId();
      const reviewDto = {
        action: 'approve' as const,
        comment: 'Looks good!',
      };

      const mockEntity = DashboardCampaignInfo.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignInfoData(),
        id: infoId,
        status: ApprovalStatus.PENDING,
      });

      const mockApproval = {
        id: testHelpers.data.createUserId(),
        entityType: 'dashboard-campaign-info' as const,
        entityId: infoId,
        campaignId: mockEntity.campaignId,
        status: 'approved' as const,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        comment: reviewDto.comment,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(mockEntity));
      mockApprovalRepository.reviewApproval.mockResolvedValue(Ok(mockApproval));

      // Act
      const reviewDtoWithAdmin = { ...reviewDto, adminId };
      const result = await service.review(infoId, reviewDtoWithAdmin);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockRepository.findByIdWithApproval).toHaveBeenCalledWith(infoId);
      expect(mockApprovalRepository.reviewApproval).toHaveBeenCalledWith(
        'dashboard-campaign-info',
        infoId,
        'approve',
        adminId,
        reviewDto.comment
      );
    });

    it('should reject dashboard campaign info successfully', async () => {
      // Arrange
      const infoId = testHelpers.data.createUserId();
      const adminId = testHelpers.data.createAdminId();
      const reviewDto = {
        action: 'reject' as const,
        comment: 'Needs improvement',
      };

      const mockEntity = DashboardCampaignInfo.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignInfoData(),
        id: infoId,
        status: ApprovalStatus.PENDING,
      });

      const mockApproval = {
        id: testHelpers.data.createUserId(),
        entityType: 'dashboard-campaign-info' as const,
        entityId: infoId,
        campaignId: mockEntity.campaignId,
        status: 'rejected' as const,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        comment: reviewDto.comment,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(mockEntity));
      mockApprovalRepository.reviewApproval.mockResolvedValue(Ok(mockApproval));

      // Act
      const reviewDtoWithAdmin = { ...reviewDto, adminId };
      const result = await service.review(infoId, reviewDtoWithAdmin);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockApprovalRepository.reviewApproval).toHaveBeenCalledWith(
        'dashboard-campaign-info',
        infoId,
        'reject',
        adminId,
        reviewDto.comment
      );
    });

    it('should fail if dashboard campaign info not found', async () => {
      // Arrange
      const infoId = testHelpers.data.createUserId();
      const adminId = testHelpers.data.createAdminId();
      const reviewDto = {
        action: 'approve' as const,
        comment: 'Approved',
      };

      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(null));

      // Act
      const reviewDtoWithAdmin = { ...reviewDto, adminId };
      const result = await service.review(infoId, reviewDtoWithAdmin);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain('not found');
      expect(mockApprovalRepository.reviewApproval).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should get dashboard campaign info by id successfully', async () => {
      // Arrange
      const infoId = testHelpers.data.createUserId();
      const mockEntity = DashboardCampaignInfo.fromPersistence(
        testHelpers.domain.validDashboardCampaignInfoData()
      );

      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(mockEntity));

      // Act
      const result = await service.getById(infoId);

      // Assert
      expect(result.isOk()).toBe(true);
      const info = testHelpers.utils.assertOk(result);
      expect(info.id).toBe(mockEntity.id);
      expect(mockRepository.findByIdWithApproval).toHaveBeenCalledWith(infoId);
    });

    it('should fail if dashboard campaign info not found', async () => {
      // Arrange
      const infoId = testHelpers.data.createUserId();
      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(null));

      // Act
      const result = await service.getById(infoId);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain('not found');
    });
  });

  describe('getByCampaignId', () => {
    it('should get dashboard campaign info by campaign id successfully', async () => {
      // Arrange
      const campaignId = testHelpers.data.createCampaignId();
      const mockEntity = DashboardCampaignInfo.fromPersistence(
        testHelpers.domain.validDashboardCampaignInfoData()
      );

      mockRepository.findByCampaignIdWithApproval.mockResolvedValue(
        Ok(mockEntity)
      );

      // Act
      const result = await service.getByCampaignId(campaignId);

      // Assert
      expect(result.isOk()).toBe(true);
      const info = testHelpers.utils.assertOk(result);
      expect(info.campaignId).toBe(mockEntity.campaignId);
      expect(mockRepository.findByCampaignIdWithApproval).toHaveBeenCalledWith(
        campaignId
      );
    });

    it('should fail if dashboard campaign info not found', async () => {
      // Arrange
      const campaignId = testHelpers.data.createCampaignId();
      mockRepository.findByCampaignIdWithApproval.mockResolvedValue(Ok(null));

      // Act
      const result = await service.getByCampaignId(campaignId);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain('not found');
    });
  });

  describe('getBySubmittedBy', () => {
    it('should get dashboard campaign infos by submitted user successfully', async () => {
      // Arrange
      const userId = testHelpers.data.createUserId();
      const mockEntities = [
        DashboardCampaignInfo.fromPersistence(
          testHelpers.domain.validDashboardCampaignInfoData()
        ),
        DashboardCampaignInfo.fromPersistence(
          testHelpers.domain.validDashboardCampaignInfoData()
        ),
      ];

      mockRepository.findBySubmittedByWithApproval.mockResolvedValue(
        Ok(mockEntities)
      );

      // Act
      const result = await service.getBySubmittedBy(userId);

      // Assert
      expect(result.isOk()).toBe(true);
      const infos = testHelpers.utils.assertOk(result);
      expect(infos).toHaveLength(2);
      expect(mockRepository.findBySubmittedByWithApproval).toHaveBeenCalledWith(
        userId
      );
    });

    it('should return empty array if no infos found', async () => {
      // Arrange
      const userId = testHelpers.data.createUserId();
      mockRepository.findBySubmittedByWithApproval.mockResolvedValue(Ok([]));

      // Act
      const result = await service.getBySubmittedBy(userId);

      // Assert
      expect(result.isOk()).toBe(true);
      const infos = testHelpers.utils.assertOk(result);
      expect(infos).toHaveLength(0);
    });
  });

  describe('getPendingForReview', () => {
    it('should get pending dashboard campaign infos successfully', async () => {
      // Arrange
      const mockApprovals = [
        {
          id: testHelpers.data.createUserId(),
          entityType: 'dashboard-campaign-info' as const,
          entityId: testHelpers.data.createUserId(),
          campaignId: testHelpers.data.createCampaignId(),
          status: 'pending' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockApprovalRepository.findPending.mockResolvedValue(Ok(mockApprovals));

      // Act
      const result = await service.getPendingForReview();

      // Assert
      expect(result.isOk()).toBe(true);
      const infos = testHelpers.utils.assertOk(result);
      expect(infos).toHaveLength(1);
      expect(mockApprovalRepository.findPending).toHaveBeenCalledWith(
        'dashboard-campaign-info'
      );
    });
  });

  describe('error handling', () => {
    it('should handle repository errors gracefully', async () => {
      // Arrange
      const infoId = testHelpers.data.createUserId();
      mockRepository.findByIdWithApproval.mockResolvedValue(
        Err(new Error('Database connection failed'))
      );

      // Act
      const result = await service.getById(infoId);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain('Database connection failed');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle approval repository errors gracefully', async () => {
      // Arrange
      const infoId = testHelpers.data.createUserId();
      const adminId = testHelpers.data.createAdminId();
      const reviewDto = { action: 'approve' as const };

      const mockEntity = DashboardCampaignInfo.fromPersistence(
        testHelpers.domain.validDashboardCampaignInfoData()
      );

      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(mockEntity));
      mockApprovalRepository.reviewApproval.mockResolvedValue(
        Err(new Error('Approval system error'))
      );

      // Act
      const reviewDtoWithAdmin = { ...reviewDto, adminId };
      const result = await service.review(infoId, reviewDtoWithAdmin);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain('Approval system error');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});

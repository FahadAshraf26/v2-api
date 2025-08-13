import { Err, Ok } from 'oxide.ts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DashboardCampaignSummaryService } from '../../../../src/application/services/dashboard-campaign-summary.service';
import { DashboardCampaignSummary } from '../../../../src/domain/dashboard-campaign-summary/entity/dashboard-campaign-summary.entity';
import { ApprovalStatus } from '../../../../src/shared/enums/approval-status.enums';
import { testHelpers } from '../../../setup/test-helper';

describe('DashboardCampaignSummaryService', () => {
  let service: DashboardCampaignSummaryService;
  let mockRepository: any;
  let mockApprovalRepository: any;
  let mockLogger: any;

  beforeEach(() => {
    mockRepository = testHelpers.mocks.createMockRepository();
    mockApprovalRepository = testHelpers.mocks.createMockApprovalRepository();
    mockLogger = testHelpers.mocks.createMockLogger();

    service = new DashboardCampaignSummaryService(
      mockRepository,
      mockApprovalRepository,
      mockLogger
    );
  });

  describe('create', () => {
    it('should create dashboard campaign summary successfully', async () => {
      // Arrange
      const userId = testHelpers.data.createUserId();
      const createDto = {
        campaignId: testHelpers.data.createCampaignId(),
        summary: 'Revolutionary platform for innovation',
        tagLine: 'Innovation for everyone',
      };

      const mockEntity = DashboardCampaignSummary.fromPersistence(
        testHelpers.domain.validDashboardCampaignSummaryData()
      );

      mockRepository.findByCampaignIdWithApproval.mockResolvedValue(Ok(null));
      mockRepository.save.mockResolvedValue(Ok(mockEntity));

      // Act
      const result = await service.create(createDto, userId);

      // Assert
      expect(result.isOk()).toBe(true);
      const summary = testHelpers.utils.assertOk(result);

      expect(summary.campaignId).toBe(createDto.campaignId);
      expect(mockRepository.findByCampaignIdWithApproval).toHaveBeenCalledWith(
        createDto.campaignId
      );
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Creating dashboard campaign summary',
        expect.objectContaining({ campaignId: createDto.campaignId, userId })
      );
    });

    it('should create summary with only required fields', async () => {
      // Arrange
      const userId = testHelpers.data.createUserId();
      const createDto = {
        campaignId: testHelpers.data.createCampaignId(),
      };

      const mockEntity = DashboardCampaignSummary.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignSummaryData(),
        summary: undefined,
        tagLine: undefined,
      });

      mockRepository.findByCampaignIdWithApproval.mockResolvedValue(Ok(null));
      mockRepository.save.mockResolvedValue(Ok(mockEntity));

      // Act
      const result = await service.create(createDto, userId);

      // Assert
      expect(result.isOk()).toBe(true);
      const summary = testHelpers.utils.assertOk(result);
      expect(summary.campaignId).toBe(createDto.campaignId);
      expect(summary.summary).toBeUndefined();
      expect(summary.tagLine).toBeUndefined();
    });

    it('should fail if dashboard campaign summary already exists for campaign', async () => {
      // Arrange
      const userId = testHelpers.data.createUserId();
      const createDto = {
        campaignId: testHelpers.data.createCampaignId(),
        summary: 'Great summary',
      };

      const existingEntity = DashboardCampaignSummary.fromPersistence(
        testHelpers.domain.validDashboardCampaignSummaryData()
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
        summary: 'Great summary',
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
    it('should update dashboard campaign summary successfully', async () => {
      // Arrange
      const summaryId = testHelpers.data.createUserId();
      const userId = testHelpers.data.createUserId();
      const updateDto = {
        summary: 'Updated summary',
        tagLine: 'Updated tagline',
      };

      const mockEntity = DashboardCampaignSummary.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignSummaryData(),
        id: summaryId,
        status: ApprovalStatus.PENDING,
        submittedBy: userId,
      });

      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(mockEntity));
      mockRepository.save.mockResolvedValue(Ok(mockEntity));

      // Act
      const result = await service.update(summaryId, updateDto, userId);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockRepository.findByIdWithApproval).toHaveBeenCalledWith(
        summaryId
      );
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should fail if dashboard campaign summary not found', async () => {
      // Arrange
      const summaryId = testHelpers.data.createUserId();
      const userId = testHelpers.data.createUserId();
      const updateDto = { summary: 'Updated' };

      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(null));

      // Act
      const result = await service.update(summaryId, updateDto, userId);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain('not found');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should fail if user not authorized to edit', async () => {
      // Arrange
      const summaryId = testHelpers.data.createUserId();
      const userId = testHelpers.data.createUserId();
      const differentUserId = testHelpers.data.createUserId();
      const updateDto = { summary: 'Updated' };

      const mockEntity = DashboardCampaignSummary.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignSummaryData(),
        id: summaryId,
        status: ApprovalStatus.PENDING,
        submittedBy: differentUserId, // Different user
      });

      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(mockEntity));

      // Act
      const result = await service.update(summaryId, updateDto, userId);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain('not authorized');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should fail if trying to update approved summary', async () => {
      // Arrange
      const summaryId = testHelpers.data.createUserId();
      const userId = testHelpers.data.createUserId();
      const updateDto = { summary: 'Updated' };

      const mockEntity = DashboardCampaignSummary.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignSummaryData(),
        id: summaryId,
        status: ApprovalStatus.APPROVED,
        submittedBy: userId,
      });

      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(mockEntity));

      // Act
      const result = await service.update(summaryId, updateDto, userId);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain('not authorized');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('submit', () => {
    it('should submit dashboard campaign summary for approval successfully', async () => {
      // Arrange
      const summaryId = testHelpers.data.createUserId();
      const userId = testHelpers.data.createUserId();

      const mockEntity = DashboardCampaignSummary.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignSummaryData(),
        id: summaryId,
        status: ApprovalStatus.PENDING,
        summary: 'Great summary content',
        tagLine: 'Amazing tagline',
      });

      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(mockEntity));
      mockRepository.submitForApproval.mockResolvedValue(Ok(mockEntity));

      // Act
      const result = await service.submit(summaryId, userId);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockRepository.findByIdWithApproval).toHaveBeenCalledWith(
        summaryId
      );
      expect(mockRepository.submitForApproval).toHaveBeenCalledWith(
        summaryId,
        userId
      );
    });

    it('should fail if dashboard campaign summary not found', async () => {
      // Arrange
      const summaryId = testHelpers.data.createUserId();
      const userId = testHelpers.data.createUserId();

      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(null));

      // Act
      const result = await service.submit(summaryId, userId);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain('not found');
      expect(mockRepository.submitForApproval).not.toHaveBeenCalled();
    });

    it('should fail if entity not ready for submission', async () => {
      // Arrange
      const summaryId = testHelpers.data.createUserId();
      const userId = testHelpers.data.createUserId();

      const mockEntity = DashboardCampaignSummary.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignSummaryData(),
        id: summaryId,
        summary: undefined, // No content
        tagLine: undefined,
        status: ApprovalStatus.PENDING,
      });

      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(mockEntity));

      // Act
      const result = await service.submit(summaryId, userId);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain('needs content');
      expect(mockRepository.submitForApproval).not.toHaveBeenCalled();
    });
  });

  describe('review', () => {
    it('should approve dashboard campaign summary successfully', async () => {
      // Arrange
      const summaryId = testHelpers.data.createUserId();
      const adminId = testHelpers.data.createAdminId();
      const reviewDto = {
        action: 'approve' as const,
        comment: 'Excellent summary!',
      };

      const mockEntity = DashboardCampaignSummary.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignSummaryData(),
        id: summaryId,
        status: ApprovalStatus.PENDING,
      });

      const mockApproval = {
        id: testHelpers.data.createUserId(),
        entityType: 'dashboard-campaign-summary' as const,
        entityId: summaryId,
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
      const result = await service.review(summaryId, reviewDtoWithAdmin);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockRepository.findByIdWithApproval).toHaveBeenCalledWith(
        summaryId
      );
      expect(mockApprovalRepository.reviewApproval).toHaveBeenCalledWith(
        'dashboard-campaign-summary',
        summaryId,
        'approve',
        adminId,
        reviewDto.comment
      );
    });

    it('should reject dashboard campaign summary successfully', async () => {
      // Arrange
      const summaryId = testHelpers.data.createUserId();
      const adminId = testHelpers.data.createAdminId();
      const reviewDto = {
        action: 'reject' as const,
        comment: 'Needs more detail',
      };

      const mockEntity = DashboardCampaignSummary.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignSummaryData(),
        id: summaryId,
        status: ApprovalStatus.PENDING,
      });

      const mockApproval = {
        id: testHelpers.data.createUserId(),
        entityType: 'dashboard-campaign-summary' as const,
        entityId: summaryId,
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
      const result = await service.review(summaryId, reviewDtoWithAdmin);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockApprovalRepository.reviewApproval).toHaveBeenCalledWith(
        'dashboard-campaign-summary',
        summaryId,
        'reject',
        adminId,
        reviewDto.comment
      );
    });

    it('should fail if dashboard campaign summary not found', async () => {
      // Arrange
      const summaryId = testHelpers.data.createUserId();
      const adminId = testHelpers.data.createAdminId();
      const reviewDto = {
        action: 'approve' as const,
        comment: 'Approved',
      };

      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(null));

      // Act
      const reviewDtoWithAdmin = { ...reviewDto, adminId };
      const result = await service.review(summaryId, reviewDtoWithAdmin);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain('not found');
      expect(mockApprovalRepository.reviewApproval).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should get dashboard campaign summary by id successfully', async () => {
      // Arrange
      const summaryId = testHelpers.data.createUserId();
      const mockEntity = DashboardCampaignSummary.fromPersistence(
        testHelpers.domain.validDashboardCampaignSummaryData()
      );

      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(mockEntity));

      // Act
      const result = await service.getById(summaryId);

      // Assert
      expect(result.isOk()).toBe(true);
      const summary = testHelpers.utils.assertOk(result);
      expect(summary.campaignId).toBe(mockEntity.campaignId);
      expect(mockRepository.findByIdWithApproval).toHaveBeenCalledWith(
        summaryId
      );
    });

    it('should fail if dashboard campaign summary not found', async () => {
      // Arrange
      const summaryId = testHelpers.data.createUserId();
      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(null));

      // Act
      const result = await service.getById(summaryId);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain('not found');
    });
  });

  describe('getByCampaignId', () => {
    it('should get dashboard campaign summary by campaign id successfully', async () => {
      // Arrange
      const campaignId = testHelpers.data.createCampaignId();
      const mockEntity = DashboardCampaignSummary.fromPersistence(
        testHelpers.domain.validDashboardCampaignSummaryData()
      );

      mockRepository.findByCampaignIdWithApproval.mockResolvedValue(
        Ok(mockEntity)
      );

      // Act
      const result = await service.getByCampaignId(campaignId);

      // Assert
      expect(result.isOk()).toBe(true);
      const summary = testHelpers.utils.assertOk(result);
      expect(summary.campaignId).toBe(mockEntity.campaignId);
      expect(mockRepository.findByCampaignIdWithApproval).toHaveBeenCalledWith(
        campaignId
      );
    });

    it('should fail if dashboard campaign summary not found', async () => {
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
    it('should get dashboard campaign summaries by submitted user successfully', async () => {
      // Arrange
      const userId = testHelpers.data.createUserId();
      const mockEntities = [
        DashboardCampaignSummary.fromPersistence(
          testHelpers.domain.validDashboardCampaignSummaryData()
        ),
        DashboardCampaignSummary.fromPersistence(
          testHelpers.domain.validDashboardCampaignSummaryData()
        ),
      ];

      mockRepository.findBySubmittedByWithApproval.mockResolvedValue(
        Ok(mockEntities)
      );

      // Act
      const result = await service.getBySubmittedBy(userId);

      // Assert
      expect(result.isOk()).toBe(true);
      const summaries = testHelpers.utils.assertOk(result);
      expect(summaries).toHaveLength(2);
      expect(mockRepository.findBySubmittedByWithApproval).toHaveBeenCalledWith(
        userId
      );
    });

    it('should return empty array if no summaries found', async () => {
      // Arrange
      const userId = testHelpers.data.createUserId();
      mockRepository.findBySubmittedByWithApproval.mockResolvedValue(Ok([]));

      // Act
      const result = await service.getBySubmittedBy(userId);

      // Assert
      expect(result.isOk()).toBe(true);
      const summaries = testHelpers.utils.assertOk(result);
      expect(summaries).toHaveLength(0);
    });
  });

  describe('getApproved', () => {
    it('should get approved dashboard campaign summaries successfully', async () => {
      // Arrange
      const mockEntities = [
        DashboardCampaignSummary.fromPersistence({
          ...testHelpers.domain.validDashboardCampaignSummaryData(),
          status: ApprovalStatus.APPROVED,
        }),
        DashboardCampaignSummary.fromPersistence({
          ...testHelpers.domain.validDashboardCampaignSummaryData(),
          status: ApprovalStatus.APPROVED,
        }),
      ];

      mockRepository.findApprovedWithApproval.mockResolvedValue(
        Ok(mockEntities)
      );

      // Act
      const result = await service.getApproved();

      // Assert
      expect(result.isOk()).toBe(true);
      const summaries = testHelpers.utils.assertOk(result);
      expect(summaries).toHaveLength(2);
      summaries.forEach(summary => {
        expect(summary.status).toBe(ApprovalStatus.APPROVED);
      });
      expect(mockRepository.findApprovedWithApproval).toHaveBeenCalled();
    });
  });

  describe('getPendingForReview', () => {
    it('should get pending dashboard campaign summaries successfully', async () => {
      // Arrange
      const mockApprovals = [
        {
          id: testHelpers.data.createUserId(),
          entityType: 'dashboard-campaign-summary' as const,
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
      const summaries = testHelpers.utils.assertOk(result);
      expect(summaries).toHaveLength(1);
      expect(mockApprovalRepository.findPending).toHaveBeenCalledWith(
        'dashboard-campaign-summary'
      );
    });
  });

  describe('getStatistics', () => {
    it('should get dashboard campaign summary statistics successfully', async () => {
      // Arrange
      const mockStats = {
        total: 100,
        pending: 15,
        approved: 75,
        rejected: 10,
      };

      mockRepository.countByStatusWithApproval.mockResolvedValue(Ok(mockStats));

      // Act
      const result = await service.getStatistics();

      // Assert
      expect(result.isOk()).toBe(true);
      const stats = testHelpers.utils.assertOk(result);
      expect(stats).toEqual(mockStats);
      expect(mockRepository.countByStatusWithApproval).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete dashboard campaign summary successfully', async () => {
      // Arrange
      const summaryId = testHelpers.data.createUserId();
      const userId = testHelpers.data.createUserId();

      const mockEntity = DashboardCampaignSummary.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignSummaryData(),
        id: summaryId,
        status: ApprovalStatus.PENDING,
        submittedBy: userId,
      });

      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(mockEntity));
      mockRepository.delete.mockResolvedValue(Ok(undefined));

      // Act
      const result = await service.delete(summaryId, userId);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockRepository.findByIdWithApproval).toHaveBeenCalledWith(
        summaryId
      );
      expect(mockRepository.delete).toHaveBeenCalledWith(summaryId);
    });

    it('should fail if dashboard campaign summary not found', async () => {
      // Arrange
      const summaryId = testHelpers.data.createUserId();
      const userId = testHelpers.data.createUserId();

      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(null));

      // Act
      const result = await service.delete(summaryId, userId);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain('not found');
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should fail if user not authorized to delete', async () => {
      // Arrange
      const summaryId = testHelpers.data.createUserId();
      const userId = testHelpers.data.createUserId();
      const differentUserId = testHelpers.data.createUserId();

      const mockEntity = DashboardCampaignSummary.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignSummaryData(),
        id: summaryId,
        status: ApprovalStatus.PENDING,
        submittedBy: differentUserId, // Different user
      });

      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(mockEntity));

      // Act
      const result = await service.delete(summaryId, userId);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain('not authorized');
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should fail if trying to delete approved summary', async () => {
      // Arrange
      const summaryId = testHelpers.data.createUserId();
      const userId = testHelpers.data.createUserId();

      const mockEntity = DashboardCampaignSummary.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignSummaryData(),
        id: summaryId,
        status: ApprovalStatus.APPROVED,
        submittedBy: userId,
      });

      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(mockEntity));

      // Act
      const result = await service.delete(summaryId, userId);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain('not authorized');
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle repository errors gracefully', async () => {
      // Arrange
      const summaryId = testHelpers.data.createUserId();
      mockRepository.findByIdWithApproval.mockResolvedValue(
        Err(new Error('Database connection failed'))
      );

      // Act
      const result = await service.getById(summaryId);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain('Database connection failed');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle approval repository errors gracefully', async () => {
      // Arrange
      const summaryId = testHelpers.data.createUserId();
      const adminId = testHelpers.data.createAdminId();
      const reviewDto = { action: 'approve' as const };

      const mockEntity = DashboardCampaignSummary.fromPersistence(
        testHelpers.domain.validDashboardCampaignSummaryData()
      );

      mockRepository.findByIdWithApproval.mockResolvedValue(Ok(mockEntity));
      mockApprovalRepository.reviewApproval.mockResolvedValue(
        Err(new Error('Approval system error'))
      );

      // Act
      const reviewDtoWithAdmin = { ...reviewDto, adminId };
      const result = await service.review(summaryId, reviewDtoWithAdmin);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain('Approval system error');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});

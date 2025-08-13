import { Err, Ok } from 'oxide.ts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DashboardCampaignSummary } from '../../../../src/domain/dashboard-campaign-summary/entity/dashboard-campaign-summary.entity';
import { DashboardCampaignSummaryRepository } from '../../../../src/infrastructure/repositories/dashboard-campaign-summary.repository';
import { ApprovalStatus } from '../../../../src/shared/enums/approval-status.enums';
import type { DashboardApprovalProps } from '../../../../src/types/approval';
import type {
  DashboardCampaignSummaryModelAttributes,
  DashboardCampaignSummaryWithApproval,
} from '../../../../src/types/dashboard-campaign-summary';
import { testHelpers } from '../../../setup/test-helper';

describe('DashboardCampaignSummaryRepository', () => {
  let repository: DashboardCampaignSummaryRepository;
  let mockOrmAdapter: any;
  let mockLogger: any;
  let mockEventBus: any;
  let mockMapper: any;
  let mockApprovalRepository: any;
  let mockQueryBuilder: any;

  beforeEach(() => {
    mockQueryBuilder = {
      where: vi.fn().mockReturnThis(),
      first: vi.fn(),
      execute: vi.fn(),
      whereNotNull: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      count: vi.fn(),
    };

    mockOrmAdapter = {
      createQueryBuilder: vi.fn().mockReturnValue(mockQueryBuilder),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findById: vi.fn(),
      transaction: vi.fn(),
    };

    mockLogger = testHelpers.mocks.createMockLogger();

    mockEventBus = {
      publish: vi.fn(),
      publishAll: vi.fn(),
    };

    mockMapper = {
      toDomain: vi.fn(),
      toDomainFromBusinessData: vi.fn(),
      toBusinessPersistence: vi.fn(),
      toBusinessPersistenceUpdate: vi.fn(),
      toBusinessPersistenceCriteria: vi.fn(),
      toDomainList: vi.fn(),
      toDomainListFromBusinessData: vi.fn(),
    };

    mockApprovalRepository = testHelpers.mocks.createMockApprovalRepository();

    repository = new DashboardCampaignSummaryRepository(
      mockOrmAdapter,
      mockLogger,
      mockEventBus,
      mockMapper,
      mockApprovalRepository
    );
  });

  describe('findByCampaignId', () => {
    it('should find dashboard campaign summary by campaign id successfully', async () => {
      // Arrange
      const campaignId = testHelpers.data.createCampaignId();
      const mockModelData: DashboardCampaignSummaryModelAttributes = {
        id: testHelpers.data.createUserId(),
        campaignId,
        summary: 'Great platform for innovation',
        tagLine: 'Innovation for everyone',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockEntity = DashboardCampaignSummary.fromPersistence(
        testHelpers.domain.validDashboardCampaignSummaryData()
      );

      mockQueryBuilder.first.mockResolvedValue(mockModelData);
      mockMapper.toDomainFromBusinessData.mockReturnValue(mockEntity);

      // Act
      const result = await repository.findByCampaignId(campaignId);

      // Assert
      expect(result.isOk()).toBe(true);
      const summary = testHelpers.utils.assertOk(result);
      expect(summary).toBe(mockEntity);

      expect(mockOrmAdapter.createQueryBuilder).toHaveBeenCalledWith(
        'DashboardCampaignSummary'
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ campaignId });
      expect(mockQueryBuilder.first).toHaveBeenCalled();
      expect(mockMapper.toDomainFromBusinessData).toHaveBeenCalledWith(
        mockModelData
      );
    });

    it('should return null if no dashboard campaign summary found', async () => {
      // Arrange
      const campaignId = testHelpers.data.createCampaignId();
      mockQueryBuilder.first.mockResolvedValue(null);

      // Act
      const result = await repository.findByCampaignId(campaignId);

      // Assert
      expect(result.isOk()).toBe(true);
      const summary = testHelpers.utils.assertOk(result);
      expect(summary).toBeNull();
      expect(mockMapper.toDomainFromBusinessData).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      // Arrange
      const campaignId = testHelpers.data.createCampaignId();
      const dbError = new Error('Database connection failed');
      mockQueryBuilder.first.mockRejectedValue(dbError);

      // Act
      const result = await repository.findByCampaignId(campaignId);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain(
        'Failed to find dashboard campaign summary'
      );
      expect(error.message).toContain('Database connection failed');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('findByIdWithApproval', () => {
    it('should find dashboard campaign summary with approval data successfully', async () => {
      // Arrange
      const summaryId = testHelpers.data.createUserId();
      const mockBusinessEntity = DashboardCampaignSummary.fromPersistence(
        testHelpers.domain.validDashboardCampaignSummaryData()
      );

      const mockApprovalData: DashboardApprovalProps = {
        id: testHelpers.data.createUserId(),
        entityType: 'dashboard-campaign-summary',
        entityId: summaryId,
        campaignId: mockBusinessEntity.campaignId,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockModelData: DashboardCampaignSummaryModelAttributes = {
        id: summaryId,
        campaignId: mockBusinessEntity.campaignId,
        summary: 'Great platform for innovation',
        tagLine: 'Innovation for everyone',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCombinedEntity = DashboardCampaignSummary.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignSummaryData(),
        id: summaryId,
        submittedAt: mockApprovalData.submittedAt,
        reviewedAt: mockApprovalData.reviewedAt,
      });

      // Mock the findById call (inherited from BaseRepository)
      vi.spyOn(repository, 'findById').mockResolvedValue(
        Ok(mockBusinessEntity)
      );
      mockApprovalRepository.findByEntity.mockResolvedValue(
        Ok(mockApprovalData)
      );
      mockMapper.toBusinessPersistence.mockReturnValue(mockModelData);
      mockMapper.toDomain.mockReturnValue(mockCombinedEntity);

      // Act
      const result = await repository.findByIdWithApproval(summaryId);

      // Assert
      expect(result.isOk()).toBe(true);
      const summary = testHelpers.utils.assertOk(result);
      expect(summary).toBe(mockCombinedEntity);

      expect(repository.findById).toHaveBeenCalledWith(summaryId);
      expect(mockApprovalRepository.findByEntity).toHaveBeenCalledWith(
        'dashboard-campaign-summary',
        summaryId
      );
      expect(mockMapper.toBusinessPersistence).toHaveBeenCalledWith(
        mockBusinessEntity
      );
      expect(mockMapper.toDomain).toHaveBeenCalledWith({
        summary: mockModelData,
        approval: mockApprovalData,
      });
    });

    it('should handle entity with no approval data', async () => {
      // Arrange
      const summaryId = testHelpers.data.createUserId();
      const mockBusinessEntity = DashboardCampaignSummary.fromPersistence(
        testHelpers.domain.validDashboardCampaignSummaryData()
      );

      const mockModelData: DashboardCampaignSummaryModelAttributes = {
        id: summaryId,
        campaignId: mockBusinessEntity.campaignId,
        summary: 'Great platform for innovation',
        tagLine: 'Innovation for everyone',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCombinedEntity = DashboardCampaignSummary.fromPersistence(
        testHelpers.domain.validDashboardCampaignSummaryData()
      );

      vi.spyOn(repository, 'findById').mockResolvedValue(
        Ok(mockBusinessEntity)
      );
      mockApprovalRepository.findByEntity.mockResolvedValue(
        Err(new Error('No approval found'))
      );
      mockMapper.toBusinessPersistence.mockReturnValue(mockModelData);
      mockMapper.toDomain.mockReturnValue(mockCombinedEntity);

      // Act
      const result = await repository.findByIdWithApproval(summaryId);

      // Assert
      expect(result.isOk()).toBe(true);
      const summary = testHelpers.utils.assertOk(result);
      expect(summary).toBe(mockCombinedEntity);

      expect(mockMapper.toDomain).toHaveBeenCalledWith({
        summary: mockModelData,
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to fetch approval data',
        expect.any(Error)
      );
    });

    it('should return null if business entity not found', async () => {
      // Arrange
      const summaryId = testHelpers.data.createUserId();
      vi.spyOn(repository, 'findById').mockResolvedValue(Ok(null));

      // Act
      const result = await repository.findByIdWithApproval(summaryId);

      // Assert
      expect(result.isOk()).toBe(true);
      const summary = testHelpers.utils.assertOk(result);
      expect(summary).toBeNull();
      expect(mockApprovalRepository.findByEntity).not.toHaveBeenCalled();
    });

    it('should handle findById errors', async () => {
      // Arrange
      const summaryId = testHelpers.data.createUserId();
      const dbError = new Error('Database error');
      vi.spyOn(repository, 'findById').mockResolvedValue(Err(dbError));

      // Act
      const result = await repository.findByIdWithApproval(summaryId);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error).toBe(dbError);
    });
  });

  describe('findByCampaignIdWithApproval', () => {
    it('should find dashboard campaign summary by campaign id with approval data', async () => {
      // Arrange
      const campaignId = testHelpers.data.createCampaignId();
      const mockModelData: DashboardCampaignSummaryModelAttributes = {
        id: testHelpers.data.createUserId(),
        campaignId,
        summary: 'Great platform for innovation',
        tagLine: 'Innovation for everyone',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockBusinessEntity = DashboardCampaignSummary.fromPersistence(
        testHelpers.domain.validDashboardCampaignSummaryData()
      );

      const mockApprovalData: DashboardApprovalProps = {
        id: testHelpers.data.createUserId(),
        entityType: 'dashboard-campaign-summary',
        entityId: mockModelData.id,
        campaignId,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCombinedEntity = DashboardCampaignSummary.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignSummaryData(),
        submittedAt: mockApprovalData.submittedAt,
      });

      mockQueryBuilder.execute.mockResolvedValue([mockModelData]);
      mockMapper.toDomainFromBusinessData.mockReturnValue(mockBusinessEntity);
      mockApprovalRepository.findByEntity.mockResolvedValue(
        Ok(mockApprovalData)
      );
      mockMapper.toBusinessPersistence.mockReturnValue(mockModelData);
      mockMapper.toDomain.mockReturnValue(mockCombinedEntity);

      // Act
      const result = await repository.findByCampaignIdWithApproval(campaignId);

      // Assert
      expect(result.isOk()).toBe(true);
      const summary = testHelpers.utils.assertOk(result);
      expect(summary).toBe(mockCombinedEntity);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ campaignId });
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
      expect(mockApprovalRepository.findByEntity).toHaveBeenCalledWith(
        'dashboard-campaign-summary',
        mockModelData.id
      );
    });

    it('should return null if no entity found by campaign id', async () => {
      // Arrange
      const campaignId = testHelpers.data.createCampaignId();
      mockQueryBuilder.execute.mockResolvedValue([]);

      // Act
      const result = await repository.findByCampaignIdWithApproval(campaignId);

      // Assert
      expect(result.isOk()).toBe(true);
      const summary = testHelpers.utils.assertOk(result);
      expect(summary).toBeNull();
      expect(mockApprovalRepository.findByEntity).not.toHaveBeenCalled();
    });
  });

  describe('submitForApproval', () => {
    it('should submit dashboard campaign summary for approval successfully', async () => {
      // Arrange
      const summaryId = testHelpers.data.createUserId();
      const submittedBy = testHelpers.data.createUserId();
      const campaignId = testHelpers.data.createCampaignId();

      const mockEntity = DashboardCampaignSummary.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignSummaryData(),
        id: summaryId,
        campaignId,
      });

      const mockApprovalData: DashboardApprovalProps = {
        id: testHelpers.data.createUserId(),
        entityType: 'dashboard-campaign-summary',
        entityId: summaryId,
        campaignId,
        status: 'pending',
        submittedBy,
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedEntity = DashboardCampaignSummary.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignSummaryData(),
        id: summaryId,
        submittedBy,
        submittedAt: mockApprovalData.submittedAt,
      });

      vi.spyOn(repository, 'findById').mockResolvedValue(Ok(mockEntity));
      mockApprovalRepository.submitForApproval.mockResolvedValue(
        Ok(mockApprovalData)
      );
      vi.spyOn(repository, 'findByIdWithApproval').mockResolvedValue(
        Ok(mockUpdatedEntity)
      );

      // Act
      const result = await repository.submitForApproval(summaryId, submittedBy);

      // Assert
      expect(result.isOk()).toBe(true);
      const summary = testHelpers.utils.assertOk(result);
      expect(summary).toBe(mockUpdatedEntity);

      expect(repository.findById).toHaveBeenCalledWith(summaryId);
      expect(mockApprovalRepository.submitForApproval).toHaveBeenCalledWith(
        'dashboard-campaign-summary',
        summaryId,
        campaignId,
        submittedBy
      );
      expect(repository.findByIdWithApproval).toHaveBeenCalledWith(summaryId);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Submitting dashboard campaign summary for approval',
        { id: summaryId, submittedBy }
      );
    });

    it('should fail if entity not found', async () => {
      // Arrange
      const summaryId = testHelpers.data.createUserId();
      const submittedBy = testHelpers.data.createUserId();

      vi.spyOn(repository, 'findById').mockResolvedValue(Ok(null));

      // Act
      const result = await repository.submitForApproval(summaryId, submittedBy);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toBe('Dashboard campaign summary not found');
      expect(mockApprovalRepository.submitForApproval).not.toHaveBeenCalled();
    });

    it('should handle approval repository errors', async () => {
      // Arrange
      const summaryId = testHelpers.data.createUserId();
      const submittedBy = testHelpers.data.createUserId();
      const campaignId = testHelpers.data.createCampaignId();

      const mockEntity = DashboardCampaignSummary.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignSummaryData(),
        id: summaryId,
        campaignId,
      });

      const approvalError = new Error('Approval system error');

      vi.spyOn(repository, 'findById').mockResolvedValue(Ok(mockEntity));
      mockApprovalRepository.submitForApproval.mockResolvedValue(
        Err(approvalError)
      );

      // Act
      const result = await repository.submitForApproval(summaryId, submittedBy);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error).toBe(approvalError);
    });
  });

  describe('findBySubmittedByWithApproval', () => {
    it('should find dashboard campaign summaries by submitted user with approval data', async () => {
      // Arrange
      const userId = testHelpers.data.createUserId();
      const mockApprovals: DashboardApprovalProps[] = [
        {
          id: testHelpers.data.createUserId(),
          entityType: 'dashboard-campaign-summary',
          entityId: testHelpers.data.createUserId(),
          campaignId: testHelpers.data.createCampaignId(),
          status: 'pending',
          submittedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: testHelpers.data.createUserId(),
          entityType: 'dashboard-campaign-summary',
          entityId: testHelpers.data.createUserId(),
          campaignId: testHelpers.data.createCampaignId(),
          status: 'approved',
          submittedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockBusinessEntities = mockApprovals.map(approval =>
        DashboardCampaignSummary.fromPersistence({
          ...testHelpers.domain.validDashboardCampaignSummaryData(),
          id: approval.entityId,
          campaignId: approval.campaignId,
        })
      );

      const mockModelData = mockApprovals.map((approval, index) => ({
        id: approval.entityId,
        campaignId: approval.campaignId,
        summary: 'Great platform for innovation',
        tagLine: 'Innovation for everyone',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const mockCombinedEntities = mockApprovals.map((approval, index) =>
        DashboardCampaignSummary.fromPersistence({
          ...testHelpers.domain.validDashboardCampaignSummaryData(),
          id: approval.entityId,
          submittedBy: userId,
          submittedAt: approval.submittedAt,
        })
      );

      mockApprovalRepository.findBySubmittedBy.mockResolvedValue(
        Ok(mockApprovals)
      );

      // Mock findById calls for each approval
      const findByIdSpy = vi.spyOn(repository, 'findById');
      mockBusinessEntities.forEach((entity, index) => {
        findByIdSpy.mockResolvedValueOnce(Ok(entity));
      });

      mockMapper.toBusinessPersistence.mockImplementation(
        (entity, index) => mockModelData[index] || mockModelData[0]
      );
      mockMapper.toDomain.mockImplementation(
        (data, index) => mockCombinedEntities[index] || mockCombinedEntities[0]
      );

      // Act
      const result = await repository.findBySubmittedByWithApproval(userId);

      // Assert
      expect(result.isOk()).toBe(true);
      const summaries = testHelpers.utils.assertOk(result);
      expect(summaries).toHaveLength(2);

      expect(mockApprovalRepository.findBySubmittedBy).toHaveBeenCalledWith(
        userId,
        'dashboard-campaign-summary'
      );
      expect(findByIdSpy).toHaveBeenCalledTimes(2);
      mockApprovals.forEach(approval => {
        expect(findByIdSpy).toHaveBeenCalledWith(approval.entityId);
      });
    });

    it('should skip entities that are not found in business table', async () => {
      // Arrange
      const userId = testHelpers.data.createUserId();
      const mockApprovals: DashboardApprovalProps[] = [
        {
          id: testHelpers.data.createUserId(),
          entityType: 'dashboard-campaign-summary',
          entityId: testHelpers.data.createUserId(),
          campaignId: testHelpers.data.createCampaignId(),
          status: 'pending',
          submittedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockApprovalRepository.findBySubmittedBy.mockResolvedValue(
        Ok(mockApprovals)
      );
      vi.spyOn(repository, 'findById').mockResolvedValue(Ok(null)); // Entity not found

      // Act
      const result = await repository.findBySubmittedByWithApproval(userId);

      // Assert
      expect(result.isOk()).toBe(true);
      const summaries = testHelpers.utils.assertOk(result);
      expect(summaries).toHaveLength(0); // No entities returned since business entity not found
    });

    it('should handle approval repository errors', async () => {
      // Arrange
      const userId = testHelpers.data.createUserId();
      const approvalError = new Error('Approval system error');

      mockApprovalRepository.findBySubmittedBy.mockResolvedValue(
        Err(approvalError)
      );

      // Act
      const result = await repository.findBySubmittedByWithApproval(userId);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error).toBe(approvalError);
    });
  });

  describe('findApprovedWithApproval', () => {
    it('should find approved dashboard campaign summaries with approval data', async () => {
      // Arrange
      const mockApprovals: DashboardApprovalProps[] = [
        {
          id: testHelpers.data.createUserId(),
          entityType: 'dashboard-campaign-summary',
          entityId: testHelpers.data.createUserId(),
          campaignId: testHelpers.data.createCampaignId(),
          status: 'approved',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockBusinessEntity = DashboardCampaignSummary.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignSummaryData(),
        id: mockApprovals[0].entityId,
        campaignId: mockApprovals[0].campaignId,
      });

      const mockModelData: DashboardCampaignSummaryModelAttributes = {
        id: mockApprovals[0].entityId,
        campaignId: mockApprovals[0].campaignId,
        summary: 'Great platform for innovation',
        tagLine: 'Innovation for everyone',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCombinedEntity = DashboardCampaignSummary.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignSummaryData(),
        id: mockApprovals[0].entityId,
        status: ApprovalStatus.APPROVED,
      });

      mockApprovalRepository.findByStatus.mockResolvedValue(Ok(mockApprovals));
      vi.spyOn(repository, 'findById').mockResolvedValue(
        Ok(mockBusinessEntity)
      );
      mockMapper.toBusinessPersistence.mockReturnValue(mockModelData);
      mockMapper.toDomain.mockReturnValue(mockCombinedEntity);

      // Act
      const result = await repository.findApprovedWithApproval();

      // Assert
      expect(result.isOk()).toBe(true);
      const summaries = testHelpers.utils.assertOk(result);
      expect(summaries).toHaveLength(1);
      expect(summaries[0].status).toBe(ApprovalStatus.APPROVED);

      expect(mockApprovalRepository.findByStatus).toHaveBeenCalledWith(
        'approved',
        'dashboard-campaign-summary'
      );
    });
  });

  describe('countByStatusWithApproval', () => {
    it('should count dashboard campaign summaries by status successfully', async () => {
      // Arrange
      const mockCounts = {
        total: 100,
        pending: 15,
        approved: 75,
        rejected: 10,
      };

      mockApprovalRepository.getStatistics.mockResolvedValue(Ok(mockCounts));

      // Act
      const result = await repository.countByStatusWithApproval();

      // Assert
      expect(result.isOk()).toBe(true);
      const counts = testHelpers.utils.assertOk(result);
      expect(counts).toEqual(mockCounts);

      expect(mockApprovalRepository.getStatistics).toHaveBeenCalledWith(
        'dashboard-campaign-summary'
      );
    });

    it('should handle approval repository errors', async () => {
      // Arrange
      const statisticsError = new Error('Statistics error');
      mockApprovalRepository.getStatistics.mockResolvedValue(
        Err(statisticsError)
      );

      // Act
      const result = await repository.countByStatusWithApproval();

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error).toBe(statisticsError);
    });
  });

  describe('delete', () => {
    it('should delete dashboard campaign summary successfully', async () => {
      // Arrange
      const summaryId = testHelpers.data.createUserId();

      mockOrmAdapter.delete.mockResolvedValue(Ok(undefined));

      // Act
      const result = await repository.delete(summaryId);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockOrmAdapter.delete).toHaveBeenCalledWith(
        'DashboardCampaignSummary',
        summaryId
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Deleting dashboard campaign summary',
        { id: summaryId }
      );
    });

    it('should handle delete errors', async () => {
      // Arrange
      const summaryId = testHelpers.data.createUserId();
      const deleteError = new Error('Delete failed');

      mockOrmAdapter.delete.mockRejectedValue(deleteError);

      // Act
      const result = await repository.delete(summaryId);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain(
        'Failed to delete dashboard campaign summary'
      );
      expect(error.message).toContain('Delete failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error deleting dashboard campaign summary',
        deleteError
      );
    });
  });

  describe('error handling', () => {
    it('should handle general database errors gracefully', async () => {
      // Arrange
      const campaignId = testHelpers.data.createCampaignId();
      const unexpectedError = new Error('Unexpected database error');
      mockOrmAdapter.createQueryBuilder.mockImplementation(() => {
        throw unexpectedError;
      });

      // Act
      const result = await repository.findByCampaignId(campaignId);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain(
        'Failed to find dashboard campaign summary'
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error finding dashboard campaign summary by campaignId',
        unexpectedError
      );
    });

    it('should handle mapper errors', async () => {
      // Arrange
      const campaignId = testHelpers.data.createCampaignId();
      const mockModelData: DashboardCampaignSummaryModelAttributes = {
        id: testHelpers.data.createUserId(),
        campaignId,
        summary: 'Great platform for innovation',
        tagLine: 'Innovation for everyone',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mapperError = new Error('Mapper error');

      mockQueryBuilder.first.mockResolvedValue(mockModelData);
      mockMapper.toDomainFromBusinessData.mockImplementation(() => {
        throw mapperError;
      });

      // Act
      const result = await repository.findByCampaignId(campaignId);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain(
        'Failed to find dashboard campaign summary'
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});

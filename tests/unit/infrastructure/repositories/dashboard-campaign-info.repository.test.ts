import { Err, Ok } from 'oxide.ts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DashboardCampaignInfo } from '../../../../src/domain/dashboard-campaign-info/entity/dashboard-campaign-info.entity';
import { DashboardCampaignInfoRepository } from '../../../../src/infrastructure/repositories/dashboard-campaign-info.repository';
import { ApprovalStatus } from '../../../../src/shared/enums/approval-status.enums';
import type { DashboardApprovalProps } from '../../../../src/types/approval';
import type {
  DashboardCampaignInfoModelAttributes,
  DashboardCampaignInfoWithApproval,
} from '../../../../src/types/dashboard-campaign-info';
import { testHelpers } from '../../../setup/test-helper';

describe('DashboardCampaignInfoRepository', () => {
  let repository: DashboardCampaignInfoRepository;
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
      toCampaignInfoPersistence: vi.fn(),
    };

    mockApprovalRepository = testHelpers.mocks.createMockApprovalRepository();

    repository = new DashboardCampaignInfoRepository(
      mockOrmAdapter,
      mockLogger,
      mockEventBus,
      mockMapper,
      mockApprovalRepository
    );
  });

  describe('findByCampaignId', () => {
    it('should find dashboard campaign info by campaign id successfully', async () => {
      // Arrange
      const campaignId = testHelpers.data.createCampaignId();
      const mockModelData: DashboardCampaignInfoModelAttributes = {
        id: testHelpers.data.createUserId(),
        campaignId,
        milestones: 'Q1: Development',
        investorPitch: 'Great platform',
        isShowPitch: true,
        investorPitchTitle: 'Innovation',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockEntity = DashboardCampaignInfo.fromPersistence(
        testHelpers.domain.validDashboardCampaignInfoData()
      );

      mockQueryBuilder.first.mockResolvedValue(mockModelData);
      mockMapper.toDomainFromBusinessData.mockReturnValue(mockEntity);

      // Act
      const result = await repository.findByCampaignId(campaignId);

      // Assert
      expect(result.isOk()).toBe(true);
      const info = testHelpers.utils.assertOk(result);
      expect(info).toBe(mockEntity);

      expect(mockOrmAdapter.createQueryBuilder).toHaveBeenCalledWith(
        'DashboardCampaignInfo'
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ campaignId });
      expect(mockQueryBuilder.first).toHaveBeenCalled();
      expect(mockMapper.toDomainFromBusinessData).toHaveBeenCalledWith(
        mockModelData
      );
    });

    it('should return null if no dashboard campaign info found', async () => {
      // Arrange
      const campaignId = testHelpers.data.createCampaignId();
      mockQueryBuilder.first.mockResolvedValue(null);

      // Act
      const result = await repository.findByCampaignId(campaignId);

      // Assert
      expect(result.isOk()).toBe(true);
      const info = testHelpers.utils.assertOk(result);
      expect(info).toBeNull();
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
      expect(error.message).toContain('Failed to find dashboard campaign info');
      expect(error.message).toContain('Database connection failed');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('findByIdWithApproval', () => {
    it('should find dashboard campaign info with approval data successfully', async () => {
      // Arrange
      const infoId = testHelpers.data.createUserId();
      const mockBusinessEntity = DashboardCampaignInfo.fromPersistence(
        testHelpers.domain.validDashboardCampaignInfoData()
      );

      const mockApprovalData: DashboardApprovalProps = {
        id: testHelpers.data.createUserId(),
        entityType: 'dashboard-campaign-info',
        entityId: infoId,
        campaignId: mockBusinessEntity.campaignId,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockModelData: DashboardCampaignInfoModelAttributes = {
        id: infoId,
        campaignId: mockBusinessEntity.campaignId,
        milestones: 'Q1: Development',
        investorPitch: 'Great platform',
        isShowPitch: true,
        investorPitchTitle: 'Innovation',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCombinedEntity = DashboardCampaignInfo.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignInfoData(),
        id: infoId,
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
      const result = await repository.findByIdWithApproval(infoId);

      // Assert
      expect(result.isOk()).toBe(true);
      const info = testHelpers.utils.assertOk(result);
      expect(info).toBe(mockCombinedEntity);

      expect(repository.findById).toHaveBeenCalledWith(infoId);
      expect(mockApprovalRepository.findByEntity).toHaveBeenCalledWith(
        'dashboard-campaign-info',
        infoId
      );
      expect(mockMapper.toBusinessPersistence).toHaveBeenCalledWith(
        mockBusinessEntity
      );
      expect(mockMapper.toDomain).toHaveBeenCalledWith({
        info: mockModelData,
        approval: mockApprovalData,
      });
    });

    it('should handle entity with no approval data', async () => {
      // Arrange
      const infoId = testHelpers.data.createUserId();
      const mockBusinessEntity = DashboardCampaignInfo.fromPersistence(
        testHelpers.domain.validDashboardCampaignInfoData()
      );

      const mockModelData: DashboardCampaignInfoModelAttributes = {
        id: infoId,
        campaignId: mockBusinessEntity.campaignId,
        milestones: 'Q1: Development',
        investorPitch: 'Great platform',
        isShowPitch: true,
        investorPitchTitle: 'Innovation',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCombinedEntity = DashboardCampaignInfo.fromPersistence(
        testHelpers.domain.validDashboardCampaignInfoData()
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
      const result = await repository.findByIdWithApproval(infoId);

      // Assert
      expect(result.isOk()).toBe(true);
      const info = testHelpers.utils.assertOk(result);
      expect(info).toBe(mockCombinedEntity);

      expect(mockMapper.toDomain).toHaveBeenCalledWith({
        info: mockModelData,
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to fetch approval data',
        expect.any(Error)
      );
    });

    it('should return null if business entity not found', async () => {
      // Arrange
      const infoId = testHelpers.data.createUserId();
      vi.spyOn(repository, 'findById').mockResolvedValue(Ok(null));

      // Act
      const result = await repository.findByIdWithApproval(infoId);

      // Assert
      expect(result.isOk()).toBe(true);
      const info = testHelpers.utils.assertOk(result);
      expect(info).toBeNull();
      expect(mockApprovalRepository.findByEntity).not.toHaveBeenCalled();
    });

    it('should handle findById errors', async () => {
      // Arrange
      const infoId = testHelpers.data.createUserId();
      const dbError = new Error('Database error');
      vi.spyOn(repository, 'findById').mockResolvedValue(Err(dbError));

      // Act
      const result = await repository.findByIdWithApproval(infoId);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error).toBe(dbError);
    });
  });

  describe('findByCampaignIdWithApproval', () => {
    it('should find dashboard campaign info by campaign id with approval data', async () => {
      // Arrange
      const campaignId = testHelpers.data.createCampaignId();
      const mockModelData: DashboardCampaignInfoModelAttributes = {
        id: testHelpers.data.createUserId(),
        campaignId,
        milestones: 'Q1: Development',
        investorPitch: 'Great platform',
        isShowPitch: true,
        investorPitchTitle: 'Innovation',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockBusinessEntity = DashboardCampaignInfo.fromPersistence(
        testHelpers.domain.validDashboardCampaignInfoData()
      );

      const mockApprovalData: DashboardApprovalProps = {
        id: testHelpers.data.createUserId(),
        entityType: 'dashboard-campaign-info',
        entityId: mockModelData.id,
        campaignId,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCombinedEntity = DashboardCampaignInfo.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignInfoData(),
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
      const info = testHelpers.utils.assertOk(result);
      expect(info).toBe(mockCombinedEntity);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ campaignId });
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
      expect(mockApprovalRepository.findByEntity).toHaveBeenCalledWith(
        'dashboard-campaign-info',
        mockBusinessEntity.id
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
      const info = testHelpers.utils.assertOk(result);
      expect(info).toBeNull();
      expect(mockApprovalRepository.findByEntity).not.toHaveBeenCalled();
    });
  });

  describe('submitForApproval', () => {
    it('should submit dashboard campaign info for approval successfully', async () => {
      // Arrange
      const infoId = testHelpers.data.createUserId();
      const submittedBy = testHelpers.data.createUserId();
      const campaignId = testHelpers.data.createCampaignId();

      const mockEntity = DashboardCampaignInfo.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignInfoData(),
        id: infoId,
        campaignId,
      });

      const mockApprovalData: DashboardApprovalProps = {
        id: testHelpers.data.createUserId(),
        entityType: 'dashboard-campaign-info',
        entityId: infoId,
        campaignId,
        status: 'pending',
        submittedBy,
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedEntity = DashboardCampaignInfo.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignInfoData(),
        id: infoId,
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
      const result = await repository.submitForApproval(infoId, submittedBy);

      // Assert
      expect(result.isOk()).toBe(true);
      const info = testHelpers.utils.assertOk(result);
      expect(info).toBe(mockUpdatedEntity);

      expect(repository.findById).toHaveBeenCalledWith(infoId);
      expect(mockApprovalRepository.submitForApproval).toHaveBeenCalledWith(
        'dashboard-campaign-info',
        infoId,
        campaignId,
        submittedBy
      );
      expect(repository.findByIdWithApproval).toHaveBeenCalledWith(infoId);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Submitting dashboard campaign info for approval',
        { id: infoId, submittedBy }
      );
    });

    it('should fail if entity not found', async () => {
      // Arrange
      const infoId = testHelpers.data.createUserId();
      const submittedBy = testHelpers.data.createUserId();

      vi.spyOn(repository, 'findById').mockResolvedValue(Ok(null));

      // Act
      const result = await repository.submitForApproval(infoId, submittedBy);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toBe('Dashboard campaign info not found');
      expect(mockApprovalRepository.submitForApproval).not.toHaveBeenCalled();
    });

    it('should handle approval repository errors', async () => {
      // Arrange
      const infoId = testHelpers.data.createUserId();
      const submittedBy = testHelpers.data.createUserId();
      const campaignId = testHelpers.data.createCampaignId();

      const mockEntity = DashboardCampaignInfo.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignInfoData(),
        id: infoId,
        campaignId,
      });

      const approvalError = new Error('Approval system error');

      vi.spyOn(repository, 'findById').mockResolvedValue(Ok(mockEntity));
      mockApprovalRepository.submitForApproval.mockResolvedValue(
        Err(approvalError)
      );

      // Act
      const result = await repository.submitForApproval(infoId, submittedBy);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error).toBe(approvalError);
    });
  });

  describe('findBySubmittedByWithApproval', () => {
    it('should find dashboard campaign infos by submitted user with approval data', async () => {
      // Arrange
      const userId = testHelpers.data.createUserId();
      const mockApprovals: DashboardApprovalProps[] = [
        {
          id: testHelpers.data.createUserId(),
          entityType: 'dashboard-campaign-info',
          entityId: testHelpers.data.createUserId(),
          campaignId: testHelpers.data.createCampaignId(),
          status: 'pending',
          submittedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: testHelpers.data.createUserId(),
          entityType: 'dashboard-campaign-info',
          entityId: testHelpers.data.createUserId(),
          campaignId: testHelpers.data.createCampaignId(),
          status: 'approved',
          submittedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockBusinessEntities = mockApprovals.map(approval =>
        DashboardCampaignInfo.fromPersistence({
          ...testHelpers.domain.validDashboardCampaignInfoData(),
          id: approval.entityId,
          campaignId: approval.campaignId,
        })
      );

      const mockModelData = mockApprovals.map((approval, index) => ({
        id: approval.entityId,
        campaignId: approval.campaignId,
        milestones: 'Q1: Development',
        investorPitch: 'Great platform',
        isShowPitch: true,
        investorPitchTitle: 'Innovation',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const mockCombinedEntities = mockApprovals.map((approval, index) =>
        DashboardCampaignInfo.fromPersistence({
          ...testHelpers.domain.validDashboardCampaignInfoData(),
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
      const infos = testHelpers.utils.assertOk(result);
      expect(infos).toHaveLength(2);

      expect(mockApprovalRepository.findBySubmittedBy).toHaveBeenCalledWith(
        userId,
        'dashboard-campaign-info'
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
          entityType: 'dashboard-campaign-info',
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
      const infos = testHelpers.utils.assertOk(result);
      expect(infos).toHaveLength(0); // No entities returned since business entity not found
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

  describe('moveToApprovedTable', () => {
    it('should move approved dashboard campaign info to campaignInfos table successfully', async () => {
      // Arrange
      const mockEntity = DashboardCampaignInfo.fromPersistence({
        ...testHelpers.domain.validDashboardCampaignInfoData(),
        status: ApprovalStatus.APPROVED,
      });

      const mockCampaignInfoData = {
        id: mockEntity.id,
        campaignId: mockEntity.campaignId,
        milestones: mockEntity.milestones,
        investorPitch: mockEntity.investorPitch,
        isShowPitch: mockEntity.isShowPitch,
        investorPitchTitle: mockEntity.investorPitchTitle,
        createdAt: mockEntity.createdAt,
        updatedAt: mockEntity.updatedAt,
      };

      const mockTransaction = { id: 'mock-transaction' };

      mockMapper.toCampaignInfoPersistence.mockReturnValue(
        mockCampaignInfoData
      );
      mockOrmAdapter.transaction.mockImplementation(async callback => {
        return await callback(mockTransaction);
      });
      mockOrmAdapter.create.mockResolvedValue(mockCampaignInfoData);

      // Act
      const result = await repository.moveToApprovedTable(mockEntity);

      // Assert
      expect(result.isOk()).toBe(true);

      expect(mockMapper.toCampaignInfoPersistence).toHaveBeenCalledWith(
        mockEntity
      );
      expect(mockOrmAdapter.transaction).toHaveBeenCalled();
      expect(mockOrmAdapter.create).toHaveBeenCalledWith(
        'CampaignInfo',
        mockCampaignInfoData,
        {
          transaction: mockTransaction,
        }
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Moving approved dashboard campaign info to campaignInfos table',
        {
          id: mockEntity.id,
          campaignId: mockEntity.campaignId,
        }
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Successfully moved dashboard campaign info to campaignInfos table',
        {
          dashboardId: mockEntity.id,
          campaignId: mockEntity.campaignId,
        }
      );
    });

    it('should handle transaction errors', async () => {
      // Arrange
      const mockEntity = DashboardCampaignInfo.fromPersistence(
        testHelpers.domain.validDashboardCampaignInfoData()
      );

      const transactionError = new Error('Transaction failed');
      mockOrmAdapter.transaction.mockRejectedValue(transactionError);

      // Act
      const result = await repository.moveToApprovedTable(mockEntity);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      expect(error.message).toContain('Failed to move to approved table');
      expect(error.message).toContain('Transaction failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error moving dashboard campaign info to approved table',
        transactionError
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
      expect(error.message).toContain('Failed to find dashboard campaign info');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error finding dashboard campaign info by campaignId',
        unexpectedError
      );
    });

    it('should handle mapper errors', async () => {
      // Arrange
      const campaignId = testHelpers.data.createCampaignId();
      const mockModelData: DashboardCampaignInfoModelAttributes = {
        id: testHelpers.data.createUserId(),
        campaignId,
        milestones: 'Q1: Development',
        investorPitch: 'Great platform',
        isShowPitch: true,
        investorPitchTitle: 'Innovation',
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
      expect(error.message).toContain('Failed to find dashboard campaign info');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});

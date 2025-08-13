import { beforeEach, describe, expect, it } from 'vitest';

import { DashboardCampaignInfo } from '../../../../src/domain/dashboard-campaign-info/entity/dashboard-campaign-info.entity';
import { ApprovalStatus } from '../../../../src/shared/enums/approval-status.enums';
import { testHelpers } from '../../../setup/test-helper';

describe('DashboardCampaignInfo Entity', () => {
  describe('Entity Creation', () => {
    it('should create a valid dashboard campaign info entity', () => {
      // Arrange
      const validData = testHelpers.domain.validDashboardCampaignInfoData();
      const createData = {
        id: validData.id,
        campaignId: validData.campaignId,
        milestones: validData.milestones,
        investorPitch: validData.investorPitch,
        isShowPitch: validData.isShowPitch,
        investorPitchTitle: validData.investorPitchTitle,
      };

      // Act
      const result = DashboardCampaignInfo.create(createData);

      // Assert
      expect(result.isOk()).toBe(true);

      const entity = testHelpers.utils.assertOk(result);
      testHelpers.assertions.assertValidDomainEntity(entity);

      expect(entity.campaignId).toBe(createData.campaignId);
      expect(entity.milestones).toBe(createData.milestones);
      expect(entity.investorPitch).toBe(createData.investorPitch);
      expect(entity.isShowPitch).toBe(createData.isShowPitch);
      expect(entity.investorPitchTitle).toBe(createData.investorPitchTitle);
      expect(entity.status).toBe(ApprovalStatus.PENDING);
    });

    it('should create entity with only required fields', () => {
      // Arrange
      const createData = {
        id: testHelpers.data.createUserId(),
        campaignId: testHelpers.data.createCampaignId(),
      };

      // Act
      const result = DashboardCampaignInfo.create(createData);

      // Assert
      expect(result.isOk()).toBe(true);
      const entity = testHelpers.utils.assertOk(result);

      expect(entity.campaignId).toBe(createData.campaignId);
      expect(entity.milestones).toBeUndefined();
      expect(entity.investorPitch).toBeUndefined();
      expect(entity.isShowPitch).toBeUndefined();
      expect(entity.investorPitchTitle).toBeUndefined();
      expect(entity.status).toBe(ApprovalStatus.PENDING);
    });

    it('should fail to create entity with empty campaign ID', () => {
      // Arrange
      const invalidData = {
        id: testHelpers.data.createUserId(),
        campaignId: '', // Invalid: empty
        milestones: 'Valid milestones',
        investorPitch: 'Valid pitch',
        isShowPitch: true,
        investorPitchTitle: 'Valid title',
      };

      // Act
      const result = DashboardCampaignInfo.create(invalidData);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      testHelpers.assertions.assertValidationError(
        error,
        'Campaign ID is required'
      );
    });

    it('should fail to create entity with null campaign ID', () => {
      // Arrange
      const invalidData = {
        id: testHelpers.data.createUserId(),
        campaignId: null as any, // Invalid: null
        milestones: 'Valid milestones',
        investorPitch: 'Valid pitch',
        isShowPitch: true,
        investorPitchTitle: 'Valid title',
      };

      // Act
      const result = DashboardCampaignInfo.create(invalidData);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      testHelpers.assertions.assertValidationError(
        error,
        'Campaign ID is required'
      );
    });
  });

  describe('Entity Updates', () => {
    let entity: DashboardCampaignInfo;

    beforeEach(() => {
      const validData = testHelpers.domain.validDashboardCampaignInfoData();
      const createData = {
        id: validData.id,
        campaignId: validData.campaignId,
        milestones: validData.milestones,
        investorPitch: validData.investorPitch,
        isShowPitch: validData.isShowPitch,
        investorPitchTitle: validData.investorPitchTitle,
      };

      const result = DashboardCampaignInfo.create(createData);
      entity = testHelpers.utils.assertOk(result);
    });

    it('should update milestones successfully', () => {
      // Arrange
      const updateData = {
        milestones: 'Updated Q1: Research\nQ2: Development\nQ3: Launch',
      };

      // Act
      const result = entity.update(updateData);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(entity.milestones).toBe(updateData.milestones);
      expect(entity.updatedAt).toBeInstanceOf(Date);
    });

    it('should update investor pitch successfully', () => {
      // Arrange
      const updateData = {
        investorPitch: 'Updated revolutionary platform pitch',
      };

      // Act
      const result = entity.update(updateData);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(entity.investorPitch).toBe(updateData.investorPitch);
      expect(entity.updatedAt).toBeInstanceOf(Date);
    });

    it('should update show pitch flag successfully', () => {
      // Arrange
      const updateData = {
        isShowPitch: false,
      };

      // Act
      const result = entity.update(updateData);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(entity.isShowPitch).toBe(updateData.isShowPitch);
      expect(entity.updatedAt).toBeInstanceOf(Date);
    });

    it('should update investor pitch title successfully', () => {
      // Arrange
      const updateData = {
        investorPitchTitle: 'Updated Investment Opportunity',
      };

      // Act
      const result = entity.update(updateData);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(entity.investorPitchTitle).toBe(updateData.investorPitchTitle);
      expect(entity.updatedAt).toBeInstanceOf(Date);
    });

    it('should update multiple fields', () => {
      // Arrange
      const updateData = {
        milestones: 'Updated milestones',
        investorPitch: 'Updated pitch',
        isShowPitch: false,
        investorPitchTitle: 'Updated title',
      };

      // Act
      const result = entity.update(updateData);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(entity.milestones).toBe(updateData.milestones);
      expect(entity.investorPitch).toBe(updateData.investorPitch);
      expect(entity.isShowPitch).toBe(updateData.isShowPitch);
      expect(entity.investorPitchTitle).toBe(updateData.investorPitchTitle);
    });

    it('should handle empty update data', () => {
      // Arrange
      const originalMilestones = entity.milestones;
      const originalPitch = entity.investorPitch;
      const originalShowPitch = entity.isShowPitch;
      const originalTitle = entity.investorPitchTitle;
      const updateData = {};

      // Act
      const result = entity.update(updateData);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(entity.milestones).toBe(originalMilestones);
      expect(entity.investorPitch).toBe(originalPitch);
      expect(entity.isShowPitch).toBe(originalShowPitch);
      expect(entity.investorPitchTitle).toBe(originalTitle);
    });
  });

  describe('Entity Validation', () => {
    it('should validate campaign ID presence during creation', () => {
      // Arrange
      const invalidData = {
        id: testHelpers.data.createUserId(),
        campaignId: undefined as any,
      };

      // Act
      const result = DashboardCampaignInfo.create(invalidData);

      // Assert
      expect(result.isErr()).toBe(true);
      const error = testHelpers.utils.assertErr(result);
      testHelpers.assertions.assertValidationError(
        error,
        'Campaign ID is required'
      );
    });
  });

  describe('Entity State Management', () => {
    it('should have pending status by default', () => {
      // Arrange
      const createData = {
        id: testHelpers.data.createUserId(),
        campaignId: testHelpers.data.createCampaignId(),
      };

      // Act
      const result = DashboardCampaignInfo.create(createData);

      // Assert
      expect(result.isOk()).toBe(true);
      const entity = testHelpers.utils.assertOk(result);
      expect(entity.status).toBe(ApprovalStatus.PENDING);
    });

    it('should track creation and update timestamps', () => {
      // Arrange
      const createData = {
        id: testHelpers.data.createUserId(),
        campaignId: testHelpers.data.createCampaignId(),
      };

      // Act
      const result = DashboardCampaignInfo.create(createData);

      // Assert
      expect(result.isOk()).toBe(true);
      const entity = testHelpers.utils.assertOk(result);
      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);
      expect(entity.createdAt.getTime()).toBeLessThanOrEqual(
        entity.updatedAt.getTime()
      );
    });
  });
});

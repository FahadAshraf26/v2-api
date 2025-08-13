import { beforeEach, describe, expect, it } from 'vitest';

import { DashboardCampaignSummary } from '../../../../src/domain/dashboard-campaign-summary/entity/dashboard-campaign-summary.entity';
import { ApprovalStatus } from '../../../../src/shared/enums/approval-status.enums';
import { testHelpers } from '../../../setup/test-helper';

describe('DashboardCampaignSummary Entity', () => {
  describe('Entity Creation', () => {
    it('should create a valid dashboard campaign summary entity with all fields', () => {
      // Arrange
      const validData = testHelpers.domain.validDashboardCampaignSummaryData();
      const createData = {
        id: validData.id,
        campaignId: validData.campaignId,
        summary: validData.summary,
        tagLine: validData.tagLine,
      };

      // Act
      const result = DashboardCampaignSummary.create(createData);

      // Assert
      expect(result.isOk()).toBe(true);

      const entity = testHelpers.utils.assertOk(result);
      testHelpers.assertions.assertValidDomainEntity(entity);

      expect(entity.campaignId).toBe(createData.campaignId);
      expect(entity.summary).toBe(createData.summary);
      expect(entity.tagLine).toBe(createData.tagLine);
      expect(entity.status).toBe(ApprovalStatus.PENDING);
    });

    it('should create entity with only required fields', () => {
      // Arrange
      const createData = {
        id: testHelpers.data.createUserId(),
        campaignId: testHelpers.data.createCampaignId(),
      };

      // Act
      const result = DashboardCampaignSummary.create(createData);

      // Assert
      expect(result.isOk()).toBe(true);
      const entity = testHelpers.utils.assertOk(result);

      expect(entity.campaignId).toBe(createData.campaignId);
      expect(entity.summary).toBeUndefined();
      expect(entity.tagLine).toBeUndefined();
      expect(entity.status).toBe(ApprovalStatus.PENDING);
    });

    it('should create entity with only summary', () => {
      // Arrange
      const createData = {
        id: testHelpers.data.createUserId(),
        campaignId: testHelpers.data.createCampaignId(),
        summary: 'This is a comprehensive campaign summary',
      };

      // Act
      const result = DashboardCampaignSummary.create(createData);

      // Assert
      expect(result.isOk()).toBe(true);
      const entity = testHelpers.utils.assertOk(result);

      expect(entity.campaignId).toBe(createData.campaignId);
      expect(entity.summary).toBe(createData.summary);
      expect(entity.tagLine).toBeUndefined();
      expect(entity.status).toBe(ApprovalStatus.PENDING);
    });

    it('should create entity with only tagLine', () => {
      // Arrange
      const createData = {
        id: testHelpers.data.createUserId(),
        campaignId: testHelpers.data.createCampaignId(),
        tagLine: 'Transform the future',
      };

      // Act
      const result = DashboardCampaignSummary.create(createData);

      // Assert
      expect(result.isOk()).toBe(true);
      const entity = testHelpers.utils.assertOk(result);

      expect(entity.campaignId).toBe(createData.campaignId);
      expect(entity.summary).toBeUndefined();
      expect(entity.tagLine).toBe(createData.tagLine);
      expect(entity.status).toBe(ApprovalStatus.PENDING);
    });

    it('should fail to create entity with empty campaign ID', () => {
      // Arrange
      const invalidData = {
        id: testHelpers.data.createUserId(),
        campaignId: '', // Invalid: empty
        summary: 'Valid summary',
        tagLine: 'Valid tagline',
      };

      // Act
      const result = DashboardCampaignSummary.create(invalidData);

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
        summary: 'Valid summary',
        tagLine: 'Valid tagline',
      };

      // Act
      const result = DashboardCampaignSummary.create(invalidData);

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
    let entity: DashboardCampaignSummary;

    beforeEach(() => {
      const validData = testHelpers.domain.validDashboardCampaignSummaryData();
      const createData = {
        id: validData.id,
        campaignId: validData.campaignId,
        summary: validData.summary,
        tagLine: validData.tagLine,
      };

      const result = DashboardCampaignSummary.create(createData);
      entity = testHelpers.utils.assertOk(result);
    });

    it('should update summary successfully', () => {
      // Arrange
      const updateData = {
        summary: 'Updated comprehensive campaign summary',
      };

      // Act
      const result = entity.update(updateData);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(entity.summary).toBe(updateData.summary);
      expect(entity.updatedAt).toBeInstanceOf(Date);
    });

    it('should update tagLine successfully', () => {
      // Arrange
      const updateData = {
        tagLine: 'Updated future transformation',
      };

      // Act
      const result = entity.update(updateData);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(entity.tagLine).toBe(updateData.tagLine);
      expect(entity.updatedAt).toBeInstanceOf(Date);
    });

    it('should update both summary and tagLine', () => {
      // Arrange
      const updateData = {
        summary: 'Updated comprehensive summary',
        tagLine: 'Updated tagline',
      };

      // Act
      const result = entity.update(updateData);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(entity.summary).toBe(updateData.summary);
      expect(entity.tagLine).toBe(updateData.tagLine);
    });

    it('should handle empty update data', () => {
      // Arrange
      const originalSummary = entity.summary;
      const originalTagLine = entity.tagLine;
      const updateData = {};

      // Act
      const result = entity.update(updateData);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(entity.summary).toBe(originalSummary);
      expect(entity.tagLine).toBe(originalTagLine);
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
      const result = DashboardCampaignSummary.create(invalidData);

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
      const result = DashboardCampaignSummary.create(createData);

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
      const result = DashboardCampaignSummary.create(createData);

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

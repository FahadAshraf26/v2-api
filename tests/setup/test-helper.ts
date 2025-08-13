import { randomUUID } from 'crypto';
import { expect, vi } from 'vitest';

import type { CampaignProps } from '../../src/domain/campaign/entity/campaign.entity';
import { ApprovalStatus } from '../../src/shared/enums/approval-status.enums';
import type { DashboardCampaignInfoProps } from '../../src/types/dashboard-campaign-info';
import type { DashboardCampaignSummaryProps } from '../../src/types/dashboard-campaign-summary';

/**
 * Test data factories for domain entities
 */
export const testDataFactory = {
  /**
   * Create test dashboard campaign info data
   */
  createDashboardCampaignInfoData(
    overrides: Partial<DashboardCampaignInfoProps> = {}
  ): DashboardCampaignInfoProps {
    return {
      id: randomUUID(),
      campaignId: randomUUID(),
      milestones: 'Q1: Product Development\nQ2: Market Launch\nQ3: Scale',
      investorPitch:
        'Revolutionary platform that solves X problem for Y market.',
      isShowPitch: true,
      investorPitchTitle: 'The Future of Innovation',
      status: ApprovalStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Create test dashboard campaign summary data
   */
  createDashboardCampaignSummaryData(
    overrides: Partial<DashboardCampaignSummaryProps> = {}
  ): DashboardCampaignSummaryProps {
    return {
      id: randomUUID(),
      campaignId: randomUUID(),
      summary:
        'This campaign aims to revolutionize the healthcare industry by providing innovative solutions that improve patient outcomes and reduce costs.',
      tagLine: 'Transform healthcare together',
      status: ApprovalStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Create test user ID
   */
  createUserId(): string {
    return randomUUID();
  },

  /**
   * Create test admin ID
   */
  createAdminId(): string {
    return randomUUID();
  },

  /**
   * Create test campaign ID
   */
  createCampaignId(): string {
    return randomUUID();
  },
};

/**
 * Mock factory for services and repositories
 */
export const mockFactory = {
  /**
   * Create mock logger
   */
  createMockLogger() {
    return {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };
  },

  /**
   * Create mock repository with common methods
   */
  createMockRepository() {
    return {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findByCampaignId: vi.fn(),
      findBySubmittedBy: vi.fn(),
      findPendingForReview: vi.fn(),
      findApproved: vi.fn(),
      countByStatus: vi.fn(),
      // New approval methods
      findByIdWithApproval: vi.fn(),
      findByCampaignIdWithApproval: vi.fn(),
      submitForApproval: vi.fn(),
      findBySubmittedByWithApproval: vi.fn(),
      findApprovedWithApproval: vi.fn(),
      countByStatusWithApproval: vi.fn(),
    };
  },

  /**
   * Create mock approval repository
   */
  createMockApprovalRepository() {
    return {
      findByEntity: vi.fn(),
      submitForApproval: vi.fn(),
      reviewApproval: vi.fn(),
      findPending: vi.fn(),
      findByCampaignId: vi.fn(),
      findBySubmittedBy: vi.fn(),
      getStatistics: vi.fn(),
    };
  },
};

/**
 * Test utilities for assertions and common operations
 */
export const testUtils = {
  /**
   * Assert that a result is Ok and return the unwrapped value
   */
  assertOk<T, E>(result: {
    isOk(): boolean;
    isErr(): boolean;
    unwrap(): T;
    unwrapErr(): E;
  }): T {
    expect(result.isOk()).toBe(true);
    return result.unwrap();
  },

  /**
   * Assert that a result is Err and return the unwrapped error
   */
  assertErr<T, E>(result: {
    isErr(): boolean;
    unwrap(): T;
    unwrapErr(): E;
  }): E {
    expect(result.isErr()).toBe(true);

    return result.unwrapErr();
  },
};

/**
 * Domain-specific test helpers
 */
export const domainTestHelpers = {
  /**
   * Create valid dashboard campaign info data
   */
  validDashboardCampaignInfoData(): DashboardCampaignInfoProps {
    return testDataFactory.createDashboardCampaignInfoData({
      milestones: 'Q1: Complete MVP\nQ2: Beta Testing\nQ3: Launch',
      investorPitch:
        'Our platform revolutionizes the way businesses manage their operations.',
      investorPitchTitle: 'Revolutionary Business Platform',
      isShowPitch: true,
    });
  },

  /**
   * Create invalid dashboard campaign info data
   */
  invalidDashboardCampaignInfoData(): Partial<DashboardCampaignInfoProps> {
    return {
      campaignId: '', // Invalid: empty campaign ID
      milestones: '', // Invalid: empty milestones
      investorPitch: '', // Invalid: empty pitch
      investorPitchTitle: '', // Invalid: empty title
    };
  },

  /**
   * Create valid dashboard campaign summary data
   */
  validDashboardCampaignSummaryData(): DashboardCampaignSummaryProps {
    return testDataFactory.createDashboardCampaignSummaryData({
      summary:
        'This comprehensive campaign focuses on transforming healthcare delivery through innovative technology solutions.',
      tagLine: 'Revolutionize healthcare, one patient at a time',
    });
  },

  /**
   * Create invalid dashboard campaign summary data
   */
  invalidDashboardCampaignSummaryData(): Partial<DashboardCampaignSummaryProps> {
    return {
      campaignId: '', // Invalid: empty campaign ID
    };
  },
};

/**
 * Assertion helpers for domain tests
 */
export const domainAssertions = {
  /**
   * Assert that a domain entity has valid required properties
   */
  assertValidDomainEntity(entity: any): void {
    expect(entity).toBeDefined();
    expect(entity.id).toBeDefined();
    expect(entity.createdAt).toBeInstanceOf(Date);
    expect(entity.updatedAt).toBeInstanceOf(Date);
  },

  /**
   * Assert that an error is a validation error with expected message
   */
  assertValidationError(error: Error, expectedMessage: string): void {
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain(expectedMessage);
  },

  /**
   * Assert that an entity has approval workflow properties
   */
  assertApprovalEntity(entity: any): void {
    expect(entity.status).toBeDefined();
    expect(Object.values(ApprovalStatus)).toContain(entity.status);
  },
};

/**
 * Main test helpers export
 */
export const testHelpers = {
  data: testDataFactory,
  mocks: mockFactory,
  utils: testUtils,
  domain: domainTestHelpers,
  assertions: domainAssertions,
};

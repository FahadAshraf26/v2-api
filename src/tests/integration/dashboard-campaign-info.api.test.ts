import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import {
  createTestApp,
  createAuthTokens,
  testHelpers,
  type TestApp,
  type AuthTokens,
} from '../setup/test-app';

describe('Dashboard Campaign Info API Integration Tests', () => {
  let testApp: TestApp;
  let authTokens: AuthTokens;
  let campaignId: string;
  let dashboardInfoId: string;

  beforeAll(async () => {
    try {
      console.log('Creating test app...');
      testApp = await createTestApp();
      console.log('Creating auth tokens...');
      authTokens = await createAuthTokens();
      console.log('Test setup completed successfully');
    } catch (error) {
      console.error('Test setup failed:', error);
      throw error;
    }
  }, 60000); // Increase timeout to 60 seconds

  afterAll(async () => {
    if (testApp) {
      await testApp.cleanup();
    }
  });

  beforeEach(async () => {
    await testApp.clearDatabase(); // Use testApp.clearDatabase instead

    // Create a test campaign first (required for foreign key constraint)
    campaignId = testHelpers.createCampaignId();
    console.log(`Creating test campaign with ID: ${campaignId}`);

    try {
      await testApp.createTestCampaign(campaignId);
      console.log(`✅ Test campaign created successfully: ${campaignId}`);
    } catch (error) {
      console.error(`❌ Failed to create test campaign: ${error}`);
      throw error;
    }

    dashboardInfoId = randomUUID();
  });

  describe('POST /api/v2/dashboard-campaign-info', () => {
    it('should create dashboard campaign info successfully', async () => {
      // Arrange
      const payload = testHelpers.createDashboardCampaignInfoData({
        campaignId,
        milestones: 'Quarter 1: MVP Development\nQuarter 2: Beta Testing',
        investorPitch: 'Revolutionary platform for crowdfunding',
        isShowPitch: true,
        investorPitchTitle: 'The Future of Crowdfunding',
      });

      // Act
      const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/v2/dashboard-campaign-info',
        headers: {
          'x-auth-token': authTokens.userToken,
        },
        payload,
      });

      // Assert
      expect(response.statusCode).toBe(201);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        campaignId: payload.campaignId,
        milestones: payload.milestones,
        investorPitch: payload.investorPitch,
        isShowPitch: payload.isShowPitch,
        investorPitchTitle: payload.investorPitchTitle,
        status: 'PENDING',
      });
      expect(body.data.id).toBeDefined();
      expect(body.data.createdAt).toBeDefined();
      expect(body.message).toContain('created successfully');
    });

    it('should fail with validation errors for invalid payload', async () => {
      // Arrange
      const invalidPayload = {
        campaignId: 'not-a-uuid',
        milestones: '', // Empty string should fail validation
        investorPitch: 'Test pitch',
        isShowPitch: true,
        investorPitchTitle: 'Test title',
      };

      // Act
      const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/v2/dashboard-campaign-info',
        headers: {
          'x-auth-token': authTokens.userToken,
        },
        payload: invalidPayload,
      });

      // Assert
      expect(response.statusCode).toBe(400);
    });

    it('should fail without authentication', async () => {
      // Arrange
      const payload = testHelpers.createDashboardCampaignInfoData({
        campaignId,
      });

      // Act
      const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/v2/dashboard-campaign-info',
        payload,
      });

      // Assert
      expect(response.statusCode).toBe(401);
    });

    it('should fail if dashboard campaign info already exists for campaign', async () => {
      // Arrange
      const payload = testHelpers.createDashboardCampaignInfoData({
        campaignId,
      });

      // Create first dashboard campaign info
      await testApp.app.inject({
        method: 'POST',
        url: '/api/v2/dashboard-campaign-info',
        headers: {
          'x-auth-token': authTokens.userToken,
        },
        payload,
      });

      // Act - Try to create another for the same campaign
      const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/v2/dashboard-campaign-info',
        headers: {
          'x-auth-token': authTokens.userToken,
        },
        payload,
      });

      // Assert
      expect(response.statusCode).toBe(409);

      const body = JSON.parse(response.body);
      expect(body.error).toContain('already exists');
    });
  });

  describe('PUT /api/v2/dashboard-campaign-info/:id', () => {
    let createdDashboardInfo: any;

    beforeEach(async () => {
      // Create a dashboard campaign info for testing updates
      const createResponse = await testApp.app.inject({
        method: 'POST',
        url: '/api/v2/dashboard-campaign-info',
        headers: {
          'x-auth-token': authTokens.userToken,
        },
        payload: testHelpers.createDashboardCampaignInfoData({
          campaignId,
          milestones: 'Original milestones',
          investorPitch: 'Original pitch',
          isShowPitch: true,
          investorPitchTitle: 'Original title',
        }),
      });

      createdDashboardInfo = JSON.parse(createResponse.body).data;
    });

    it('should update dashboard campaign info successfully', async () => {
      // Arrange
      const updatePayload = {
        milestones: 'Updated milestones',
        investorPitch: 'Updated pitch',
        isShowPitch: false,
        investorPitchTitle: 'Updated title',
      };

      // Act
      const response = await testApp.app.inject({
        method: 'PUT',
        url: `/api/v2/dashboard-campaign-info/${createdDashboardInfo.id}`,
        headers: {
          'x-auth-token': authTokens.userToken,
        },
        payload: updatePayload,
      });

      // Assert
      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject(updatePayload);
      expect(body.message).toContain('updated successfully');
    });

    it('should fail to update non-existent dashboard campaign info', async () => {
      // Act
      const response = await testApp.app.inject({
        method: 'PUT',
        url: `/api/v2/dashboard-campaign-info/${randomUUID()}`,
        headers: {
          'x-auth-token': authTokens.userToken,
        },
        payload: {
          milestones: 'Updated milestones',
        },
      });

      // Assert
      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/v2/dashboard-campaign-info/:id/submit', () => {
    let createdDashboardInfo: any;

    beforeEach(async () => {
      const createResponse = await testApp.app.inject({
        method: 'POST',
        url: '/api/v2/dashboard-campaign-info',
        headers: {
          'x-auth-token': authTokens.userToken,
        },
        payload: testHelpers.createDashboardCampaignInfoData({ campaignId }),
      });

      createdDashboardInfo = JSON.parse(createResponse.body).data;
    });

    it('should submit dashboard campaign info for review successfully', async () => {
      // Act
      const response = await testApp.app.inject({
        method: 'POST',
        url: `/api/v2/dashboard-campaign-info/${createdDashboardInfo.id}/submit`,
        headers: {
          'x-auth-token': authTokens.userToken,
        },
      });

      // Assert
      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.submittedAt).toBeDefined();
      expect(body.message).toContain('submitted for review');
    });
  });

  describe('POST /api/v2/dashboard-campaign-info/:id/review', () => {
    let submittedDashboardInfo: any;

    beforeEach(async () => {
      // Create and submit a dashboard campaign info
      const createResponse = await testApp.app.inject({
        method: 'POST',
        url: '/api/v2/dashboard-campaign-info',
        headers: {
          'x-auth-token': authTokens.userToken,
        },
        payload: testHelpers.createDashboardCampaignInfoData({ campaignId }),
      });

      const dashboardInfo = JSON.parse(createResponse.body).data;

      // Submit for review
      const submitResponse = await testApp.app.inject({
        method: 'POST',
        url: `/api/v2/dashboard-campaign-info/${dashboardInfo.id}/submit`,
        headers: {
          'x-auth-token': authTokens.userToken,
        },
      });

      submittedDashboardInfo = JSON.parse(submitResponse.body).data;
    });

    it('should approve dashboard campaign info successfully (admin)', async () => {
      // Arrange
      const reviewPayload = {
        action: 'approve',
        comment: 'Looks great! Approved.',
      };

      // Act
      const response = await testApp.app.inject({
        method: 'POST',
        url: `/api/v2/dashboard-campaign-info/${submittedDashboardInfo.id}/review`,
        headers: {
          'x-auth-token': authTokens.adminToken,
        },
        payload: reviewPayload,
      });

      // Assert
      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('APPROVED');
      expect(body.data.reviewedAt).toBeDefined();
      expect(body.data.comment).toBe(reviewPayload.comment);
      expect(body.message).toContain('approved successfully');
    });

    it('should reject dashboard campaign info successfully (admin)', async () => {
      // Arrange
      const reviewPayload = {
        action: 'reject',
        comment: 'Needs more detailed milestones.',
      };

      // Act
      const response = await testApp.app.inject({
        method: 'POST',
        url: `/api/v2/dashboard-campaign-info/${submittedDashboardInfo.id}/review`,
        headers: {
          'x-auth-token': authTokens.adminToken,
        },
        payload: reviewPayload,
      });

      // Assert
      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('REJECTED');
      expect(body.data.comment).toBe(reviewPayload.comment);
      expect(body.message).toContain('rejected successfully');
    });

    it('should fail review without admin authentication', async () => {
      // Act
      const response = await testApp.app.inject({
        method: 'POST',
        url: `/api/v2/dashboard-campaign-info/${submittedDashboardInfo.id}/review`,
        headers: {
          'x-auth-token': authTokens.userToken, // User token instead of admin
        },
        payload: {
          action: 'approve',
        },
      });

      // Assert
      expect(response.statusCode).toBe(403);
    });

    it('should fail rejection without comment', async () => {
      // Act
      const response = await testApp.app.inject({
        method: 'POST',
        url: `/api/v2/dashboard-campaign-info/${submittedDashboardInfo.id}/review`,
        headers: {
          'x-auth-token': authTokens.adminToken,
        },
        payload: {
          action: 'reject',
          // No comment provided
        },
      });

      // Assert
      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body.error).toContain('Comment is required');
    });
  });

  describe('GET /api/v2/dashboard-campaign-info/:id', () => {
    let createdDashboardInfo: any;

    beforeEach(async () => {
      const createResponse = await testApp.app.inject({
        method: 'POST',
        url: '/api/v2/dashboard-campaign-info',
        headers: {
          'x-auth-token': authTokens.userToken,
        },
        payload: testHelpers.createDashboardCampaignInfoData({ campaignId }),
      });

      createdDashboardInfo = JSON.parse(createResponse.body).data;
    });

    it('should get dashboard campaign info by ID successfully', async () => {
      // Act
      const response = await testApp.app.inject({
        method: 'GET',
        url: `/api/v2/dashboard-campaign-info/${createdDashboardInfo.id}`,
        headers: {
          'x-auth-token': authTokens.userToken,
        },
      });

      // Assert
      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(createdDashboardInfo.id);
    });

    it('should return 404 for non-existent dashboard campaign info', async () => {
      // Act
      const response = await testApp.app.inject({
        method: 'GET',
        url: `/api/v2/dashboard-campaign-info/${randomUUID()}`,
        headers: {
          'x-auth-token': authTokens.userToken,
        },
      });

      // Assert
      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/v2/dashboard-campaign-info/admin/pending', () => {
    beforeEach(async () => {
      // Create and submit multiple dashboard campaign infos
      for (let i = 0; i < 3; i++) {
        const createResponse = await testApp.app.inject({
          method: 'POST',
          url: '/api/v2/dashboard-campaign-info',
          headers: {
            'x-auth-token': authTokens.userToken,
          },
          payload: testHelpers.createDashboardCampaignInfoData({
            campaignId: testHelpers.createCampaignId(),
            milestones: `Test milestones ${i}`,
            investorPitch: `Test pitch ${i}`,
            investorPitchTitle: `Test title ${i}`,
          }),
        });

        const dashboardInfo = JSON.parse(createResponse.body).data;

        // Submit for review
        await testApp.app.inject({
          method: 'POST',
          url: `/api/v2/dashboard-campaign-info/${dashboardInfo.id}/submit`,
          headers: {
            'x-auth-token': authTokens.userToken,
          },
        });
      }
    });

    it('should get pending dashboard campaign infos for admin', async () => {
      // Act
      const response = await testApp.app.inject({
        method: 'GET',
        url: '/api/v2/dashboard-campaign-info/admin/pending',
        headers: {
          'x-auth-token': authTokens.adminToken,
        },
      });

      // Assert
      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(3);
      expect(body.count).toBe(3);

      // All items should be pending and submitted
      body.data.forEach((item: any) => {
        expect(item.status).toBe('PENDING');
        expect(item.submittedAt).toBeDefined();
      });
    });

    it('should fail without admin authentication', async () => {
      // Act
      const response = await testApp.app.inject({
        method: 'GET',
        url: '/api/v2/dashboard-campaign-info/admin/pending',
        headers: {
          'x-auth-token': authTokens.userToken, // User token instead of admin
        },
      });

      // Assert
      expect(response.statusCode).toBe(403);
    });
  });

  describe('GET /api/v2/dashboard-campaign-info/user/my-submissions', () => {
    beforeEach(async () => {
      // Create multiple dashboard campaign infos for the user
      for (let i = 0; i < 2; i++) {
        await testApp.app.inject({
          method: 'POST',
          url: '/api/v2/dashboard-campaign-info',
          headers: {
            'x-auth-token': authTokens.userToken,
          },
          payload: testHelpers.createDashboardCampaignInfoData({
            campaignId: testHelpers.createCampaignId(),
            milestones: `Test milestones ${i}`,
            investorPitch: `Test pitch ${i}`,
            investorPitchTitle: `Test title ${i}`,
          }),
        });
      }
    });

    it("should get user's dashboard campaign info submissions", async () => {
      // Act
      const response = await testApp.app.inject({
        method: 'GET',
        url: '/api/v2/dashboard-campaign-info/user/my-submissions',
        headers: {
          'x-auth-token': authTokens.userToken,
        },
      });

      // Assert
      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.count).toBe(2);
    });

    it('should fail without user authentication', async () => {
      // Act
      const response = await testApp.app.inject({
        method: 'GET',
        url: '/api/v2/dashboard-campaign-info/user/my-submissions',
      });

      // Assert
      expect(response.statusCode).toBe(401);
    });
  });
});

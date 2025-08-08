import { injectable } from 'tsyringe';
import {
  Campaign,
  CampaignProps,
} from '@/domain/campaign/entity/campaign.entity';
import { CampaignModelAttributes } from '@/infrastructure/database/models/campaign.model';
import { randomUUID } from 'crypto';

@injectable()
export class CampaignMapper {
  toDomain(model: CampaignModelAttributes): Campaign {
    const props: CampaignProps = {
      id: model.campaignId, // Using campaignId as the domain id
      campaignId: model.campaignId,
      campaignName: model.campaignName,
      campaignTargetAmount: model.campaignTargetAmount,
      campaignMinimumAmount: model.campaignMinimumAmount,
      investmentType: model.investmentType,
      slug: model.slug,
      isChargeFee: model.isChargeFee,
      isChargeStripe: model.isChargeStripe,
      isCampaignAddress: model.isCampaignAddress,
      isShowOnExplorePage: model.isShowOnExplorePage,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };

    // Conditionally add optional properties
    if (model.campaignStartDate !== undefined)
      props.campaignStartDate = model.campaignStartDate;
    if (model.campaignDuration !== undefined)
      props.campaignDuration = model.campaignDuration;
    if (model.campaignExpirationDate !== undefined)
      props.campaignExpirationDate = model.campaignExpirationDate;
    if (model.campaignStage !== undefined)
      props.campaignStage = model.campaignStage;
    if (model.earningProcess !== undefined)
      props.earningProcess = model.earningProcess;
    if (model.overSubscriptionAccepted !== undefined)
      props.overSubscriptionAccepted = model.overSubscriptionAccepted;
    if (model.typeOfSecurityOffered !== undefined)
      props.typeOfSecurityOffered = model.typeOfSecurityOffered;
    if (model.useOfProceeds !== undefined)
      props.useOfProceeds = model.useOfProceeds;
    if (model.salesLead !== undefined) props.salesLead = model.salesLead;
    if (model.summary !== undefined) props.summary = model.summary;
    if (model.demoLink !== undefined) props.demoLink = model.demoLink;
    if (model.isLocked !== undefined) props.isLocked = model.isLocked;
    if (model.financialProjectionsDescription !== undefined)
      props.financialProjectionsDescription =
        model.financialProjectionsDescription;
    if (model.howHoneycombIsCompensated !== undefined)
      props.howHoneycombIsCompensated = model.howHoneycombIsCompensated;
    if (model.campaignDocumentUrl !== undefined)
      props.campaignDocumentUrl = model.campaignDocumentUrl;
    if (model.ncOfferingId !== undefined)
      props.ncOfferingId = model.ncOfferingId;
    if (model.repaymentSchedule !== undefined)
      props.repaymentSchedule = model.repaymentSchedule;
    if (model.collateral !== undefined) props.collateral = model.collateral;
    if (model.annualInterestRate !== undefined)
      props.annualInterestRate = model.annualInterestRate;
    if (model.maturityDate !== undefined)
      props.maturityDate = model.maturityDate;
    if (model.repaymentStartDate !== undefined)
      props.repaymentStartDate = model.repaymentStartDate;
    if (model.loanDuration !== undefined)
      props.loanDuration = model.loanDuration;
    if (model.interestOnlyLoanDuration !== undefined)
      props.interestOnlyLoanDuration = model.interestOnlyLoanDuration;
    if (model.campaignEndTime !== undefined)
      props.campaignEndTime = model.campaignEndTime;
    if (model.campaignTimezone !== undefined)
      props.campaignTimezone = model.campaignTimezone;
    if (model.blanketLien !== undefined) props.blanketLien = model.blanketLien;
    if (model.equipmentLien !== undefined)
      props.equipmentLien = model.equipmentLien;
    if (model.isPersonalGuarantyFilled !== undefined)
      props.isPersonalGuarantyFilled = model.isPersonalGuarantyFilled;
    if (model.personalGuaranty !== undefined)
      props.personalGuaranty = model.personalGuaranty;
    if (model.shareValue !== undefined) props.shareValue = model.shareValue;
    if (model.escrowType !== undefined) props.escrowType = model.escrowType;
    if (model.competitorOffering !== undefined)
      props.competitorOffering = model.competitorOffering;
    if (model.investmentConfiguration !== undefined)
      props.investmentConfiguration = model.investmentConfiguration;
    if (model.dividendRate !== undefined)
      props.dividendRate = model.dividendRate;
    if (model.deletedAt !== undefined) props.deletedAt = model.deletedAt;

    return Campaign.fromPersistence(props);
  }

  toPersistence(domain: Campaign): Partial<CampaignModelAttributes> {
    const domainProps = domain.toObject();

    const result: Partial<CampaignModelAttributes> = {
      campaignId: domainProps.campaignId,
      campaignName: domainProps.campaignName,
      campaignTargetAmount: domainProps.campaignTargetAmount,
      campaignMinimumAmount: domainProps.campaignMinimumAmount,
      investmentType: domainProps.investmentType,
      slug: domainProps.slug,
      isChargeFee: domainProps.isChargeFee ?? true,
      isChargeStripe: domainProps.isChargeStripe ?? true,
      isCampaignAddress: domainProps.isCampaignAddress ?? false,
      isShowOnExplorePage: domainProps.isShowOnExplorePage ?? true,
      createdAt: domainProps.createdAt || new Date(),
      updatedAt: domainProps.updatedAt || new Date(),
    };

    // Conditionally add optional properties
    if (domainProps.campaignStartDate !== undefined)
      result.campaignStartDate = domainProps.campaignStartDate;
    if (domainProps.campaignDuration !== undefined)
      result.campaignDuration = domainProps.campaignDuration;
    if (domainProps.campaignExpirationDate !== undefined)
      result.campaignExpirationDate = domainProps.campaignExpirationDate;
    if (domainProps.campaignStage !== undefined)
      result.campaignStage = domainProps.campaignStage;
    if (domainProps.earningProcess !== undefined)
      result.earningProcess = domainProps.earningProcess;
    if (domainProps.overSubscriptionAccepted !== undefined)
      result.overSubscriptionAccepted = domainProps.overSubscriptionAccepted;
    if (domainProps.typeOfSecurityOffered !== undefined)
      result.typeOfSecurityOffered = domainProps.typeOfSecurityOffered;
    if (domainProps.useOfProceeds !== undefined)
      result.useOfProceeds = domainProps.useOfProceeds;
    if (domainProps.salesLead !== undefined)
      result.salesLead = domainProps.salesLead;
    if (domainProps.summary !== undefined) result.summary = domainProps.summary;
    if (domainProps.demoLink !== undefined)
      result.demoLink = domainProps.demoLink;
    if (domainProps.isLocked !== undefined)
      result.isLocked = domainProps.isLocked;
    if (domainProps.financialProjectionsDescription !== undefined)
      result.financialProjectionsDescription =
        domainProps.financialProjectionsDescription;
    if (domainProps.howHoneycombIsCompensated !== undefined)
      result.howHoneycombIsCompensated = domainProps.howHoneycombIsCompensated;
    if (domainProps.campaignDocumentUrl !== undefined)
      result.campaignDocumentUrl = domainProps.campaignDocumentUrl;
    if (domainProps.ncOfferingId !== undefined)
      result.ncOfferingId = domainProps.ncOfferingId;
    if (domainProps.repaymentSchedule !== undefined)
      result.repaymentSchedule = domainProps.repaymentSchedule;
    if (domainProps.collateral !== undefined)
      result.collateral = domainProps.collateral;
    if (domainProps.annualInterestRate !== undefined)
      result.annualInterestRate = domainProps.annualInterestRate;
    if (domainProps.maturityDate !== undefined)
      result.maturityDate = domainProps.maturityDate;
    if (domainProps.repaymentStartDate !== undefined)
      result.repaymentStartDate = domainProps.repaymentStartDate;
    if (domainProps.loanDuration !== undefined)
      result.loanDuration = domainProps.loanDuration;
    if (domainProps.interestOnlyLoanDuration !== undefined)
      result.interestOnlyLoanDuration = domainProps.interestOnlyLoanDuration;
    if (domainProps.campaignEndTime !== undefined)
      result.campaignEndTime = domainProps.campaignEndTime;
    if (domainProps.campaignTimezone !== undefined)
      result.campaignTimezone = domainProps.campaignTimezone;
    if (domainProps.blanketLien !== undefined)
      result.blanketLien = domainProps.blanketLien;
    if (domainProps.equipmentLien !== undefined)
      result.equipmentLien = domainProps.equipmentLien;
    if (domainProps.isPersonalGuarantyFilled !== undefined)
      result.isPersonalGuarantyFilled = domainProps.isPersonalGuarantyFilled;
    if (domainProps.personalGuaranty !== undefined)
      result.personalGuaranty = domainProps.personalGuaranty;
    if (domainProps.shareValue !== undefined)
      result.shareValue = domainProps.shareValue;
    if (domainProps.escrowType !== undefined)
      result.escrowType = domainProps.escrowType;
    if (domainProps.competitorOffering !== undefined)
      result.competitorOffering = domainProps.competitorOffering;
    if (domainProps.investmentConfiguration !== undefined)
      result.investmentConfiguration = domainProps.investmentConfiguration;
    if (domainProps.dividendRate !== undefined)
      result.dividendRate = domainProps.dividendRate;
    if (domainProps.deletedAt !== undefined)
      result.deletedAt = domainProps.deletedAt;

    return result;
  }

  toPersistenceUpdate(domain: Campaign): Partial<CampaignModelAttributes> {
    const domainProps = domain.toObject();

    // For updates, exclude the primary key and timestamps
    const { campaignId, createdAt, ...updateProps } = this.toPersistence(
      domain
    ) as CampaignModelAttributes;

    return {
      ...updateProps,
      updatedAt: new Date(),
    };
  }

  toPersistenceCriteria(
    domainCriteria: Record<string, any>
  ): Record<string, any> {
    // Map domain search criteria to persistence layer
    const persistenceCriteria: Record<string, any> = {};

    for (const [key, value] of Object.entries(domainCriteria)) {
      if (value === undefined) continue;

      // Direct mapping for most fields
      persistenceCriteria[key] = value;
    }

    return persistenceCriteria;
  }

  toDomainList(models: CampaignModelAttributes[]): Campaign[] {
    return models.map(model => this.toDomain(model));
  }

  toNewPersistence(domainProps: CampaignProps): CampaignModelAttributes {
    return {
      campaignId: domainProps.campaignId || randomUUID(),
      campaignName: domainProps.campaignName,
      campaignStartDate: domainProps.campaignStartDate || null,
      campaignDuration: domainProps.campaignDuration || null,
      campaignExpirationDate: domainProps.campaignExpirationDate || null,
      campaignStage: domainProps.campaignStage || 'draft',
      campaignTargetAmount: domainProps.campaignTargetAmount,
      campaignMinimumAmount: domainProps.campaignMinimumAmount,
      investmentType: domainProps.investmentType,
      earningProcess: domainProps.earningProcess || null,
      overSubscriptionAccepted: domainProps.overSubscriptionAccepted || null,
      typeOfSecurityOffered: domainProps.typeOfSecurityOffered || null,
      useOfProceeds: domainProps.useOfProceeds || null,
      salesLead: domainProps.salesLead || null,
      summary: domainProps.summary || null,
      demoLink: domainProps.demoLink || null,
      isLocked: domainProps.isLocked || null,
      financialProjectionsDescription:
        domainProps.financialProjectionsDescription || null,
      howHoneycombIsCompensated: domainProps.howHoneycombIsCompensated || null,
      campaignDocumentUrl: domainProps.campaignDocumentUrl || null,
      ncOfferingId: domainProps.ncOfferingId || null,
      slug: domainProps.slug,
      repaymentSchedule: domainProps.repaymentSchedule || null,
      collateral: domainProps.collateral || null,
      annualInterestRate: domainProps.annualInterestRate || null,
      maturityDate: domainProps.maturityDate || null,
      repaymentStartDate: domainProps.repaymentStartDate || null,
      loanDuration: domainProps.loanDuration || null,
      isChargeFee: domainProps.isChargeFee ?? true,
      interestOnlyLoanDuration: domainProps.interestOnlyLoanDuration || null,
      campaignEndTime: domainProps.campaignEndTime || null,
      campaignTimezone: domainProps.campaignTimezone || null,
      blanketLien: domainProps.blanketLien || null,
      equipmentLien: domainProps.equipmentLien || null,
      isPersonalGuarantyFilled: domainProps.isPersonalGuarantyFilled || null,
      personalGuaranty: domainProps.personalGuaranty || null,
      shareValue: domainProps.shareValue || null,
      escrowType: domainProps.escrowType || null,
      isChargeStripe: domainProps.isChargeStripe ?? true,
      isCampaignAddress: domainProps.isCampaignAddress ?? false,
      competitorOffering: domainProps.competitorOffering || null,
      isShowOnExplorePage: domainProps.isShowOnExplorePage ?? true,
      investmentConfiguration: domainProps.investmentConfiguration || null,
      dividendRate: domainProps.dividendRate || null,
      createdAt: domainProps.createdAt || new Date(),
      updatedAt: domainProps.updatedAt || new Date(),
      deletedAt: domainProps.deletedAt || null,
    };
  }
}

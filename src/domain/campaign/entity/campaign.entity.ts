import { Result, Ok, Err } from 'oxide.ts';
import { Entity } from '@/domain/core/entity';

export interface CampaignProps {
  id?: string;
  campaignId: string;
  campaignName: string;
  campaignStartDate?: Date | null;
  campaignDuration?: number | null;
  campaignExpirationDate?: Date | null;
  campaignStage?: string | null;
  campaignTargetAmount: number;
  campaignMinimumAmount: number;
  investmentType: string;
  earningProcess?: string | null;
  overSubscriptionAccepted?: boolean | null;
  typeOfSecurityOffered?: string | null;
  useOfProceeds?: string | null;
  salesLead?: string | null;
  summary?: string | null;
  demoLink?: string | null;
  isLocked?: boolean | null;
  financialProjectionsDescription?: string | null;
  howHoneycombIsCompensated?: string | null;
  campaignDocumentUrl?: string | null;
  ncOfferingId?: string | null;
  slug: string;
  repaymentSchedule?: string | null;
  collateral?: string | null;
  annualInterestRate?: number | null;
  maturityDate?: Date | null;
  repaymentStartDate?: Date | null;
  loanDuration?: number | null;
  isChargeFee?: boolean;
  interestOnlyLoanDuration?: number | null;
  campaignEndTime?: string | null;
  campaignTimezone?: string | null;
  blanketLien?: boolean | null;
  equipmentLien?: boolean | null;
  isPersonalGuarantyFilled?: boolean | null;
  personalGuaranty?: string | null;
  shareValue?: number | null;
  escrowType?: string | null;
  isChargeStripe?: boolean;
  isCampaignAddress?: boolean;
  competitorOffering?: string | null;
  isShowOnExplorePage?: boolean;
  investmentConfiguration?: any | null;
  dividendRate?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export enum CampaignStage {
  DRAFT = 'draft',
  REVIEW = 'review',
  APPROVED = 'approved',
  LIVE = 'live',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum InvestmentType {
  EQUITY = 'equity',
  DEBT = 'debt',
  CONVERTIBLE = 'convertible',
  REVENUE_SHARE = 'revenue_share',
}

export class Campaign extends Entity<CampaignProps> {
  private constructor(
    private readonly props: Required<
      Omit<CampaignProps, 'id' | 'deletedAt'>
    > & {
      id?: string;
      deletedAt?: Date | null;
    }
  ) {
    super(props.id);
  }

  static create(props: CampaignProps): Result<Campaign, Error> {
    // Validate required fields
    if (!props.campaignId?.trim()) {
      return Err(new Error('Campaign ID is required'));
    }

    if (!props.campaignName?.trim()) {
      return Err(new Error('Campaign name is required'));
    }

    if (!props.slug?.trim()) {
      return Err(new Error('Campaign slug is required'));
    }

    if (!props.investmentType?.trim()) {
      return Err(new Error('Investment type is required'));
    }

    // Validate amounts
    if (props.campaignTargetAmount <= 0) {
      return Err(new Error('Campaign target amount must be greater than 0'));
    }

    if (props.campaignMinimumAmount <= 0) {
      return Err(new Error('Campaign minimum amount must be greater than 0'));
    }

    if (props.campaignMinimumAmount > props.campaignTargetAmount) {
      return Err(
        new Error('Campaign minimum amount cannot exceed target amount')
      );
    }

    // Validate slug format (alphanumeric, hyphens, and underscores only)
    const slugRegex = /^[a-z0-9-_]+$/;
    if (!slugRegex.test(props.slug)) {
      return Err(
        new Error(
          'Slug can only contain lowercase letters, numbers, hyphens, and underscores'
        )
      );
    }

    // Validate dates if provided
    if (props.campaignStartDate && props.campaignExpirationDate) {
      if (props.campaignStartDate >= props.campaignExpirationDate) {
        return Err(
          new Error('Campaign start date must be before expiration date')
        );
      }
    }

    if (props.maturityDate && props.repaymentStartDate) {
      if (props.repaymentStartDate >= props.maturityDate) {
        return Err(
          new Error('Repayment start date must be before maturity date')
        );
      }
    }

    // Validate interest rate if provided
    if (
      props.annualInterestRate !== null &&
      props.annualInterestRate !== undefined
    ) {
      if (props.annualInterestRate < 0 || props.annualInterestRate > 100) {
        return Err(new Error('Annual interest rate must be between 0 and 100'));
      }
    }

    // Set defaults
    const campaignProps: Required<Omit<CampaignProps, 'id' | 'deletedAt'>> & {
      id?: string;
      deletedAt?: Date | null;
    } = {
      campaignId: props.campaignId.trim(),
      campaignName: props.campaignName.trim(),
      campaignStartDate: props.campaignStartDate || null,
      campaignDuration: props.campaignDuration || null,
      campaignExpirationDate: props.campaignExpirationDate || null,
      campaignStage: props.campaignStage || CampaignStage.DRAFT,
      campaignTargetAmount: props.campaignTargetAmount,
      campaignMinimumAmount: props.campaignMinimumAmount,
      investmentType: props.investmentType.trim(),
      earningProcess: props.earningProcess || null,
      overSubscriptionAccepted: props.overSubscriptionAccepted || false,
      typeOfSecurityOffered: props.typeOfSecurityOffered || null,
      useOfProceeds: props.useOfProceeds || null,
      salesLead: props.salesLead || null,
      summary: props.summary || null,
      demoLink: props.demoLink || null,
      isLocked: props.isLocked || false,
      financialProjectionsDescription:
        props.financialProjectionsDescription || null,
      howHoneycombIsCompensated: props.howHoneycombIsCompensated || null,
      campaignDocumentUrl: props.campaignDocumentUrl || null,
      ncOfferingId: props.ncOfferingId || null,
      slug: props.slug.trim().toLowerCase(),
      repaymentSchedule: props.repaymentSchedule || null,
      collateral: props.collateral || null,
      annualInterestRate: props.annualInterestRate || null,
      maturityDate: props.maturityDate || null,
      repaymentStartDate: props.repaymentStartDate || null,
      loanDuration: props.loanDuration || null,
      isChargeFee: props.isChargeFee ?? true,
      interestOnlyLoanDuration: props.interestOnlyLoanDuration || null,
      campaignEndTime: props.campaignEndTime || null,
      campaignTimezone: props.campaignTimezone || null,
      blanketLien: props.blanketLien || false,
      equipmentLien: props.equipmentLien || false,
      isPersonalGuarantyFilled: props.isPersonalGuarantyFilled || false,
      personalGuaranty: props.personalGuaranty || null,
      shareValue: props.shareValue || null,
      escrowType: props.escrowType || null,
      isChargeStripe: props.isChargeStripe ?? true,
      isCampaignAddress: props.isCampaignAddress ?? false,
      competitorOffering: props.competitorOffering || null,
      isShowOnExplorePage: props.isShowOnExplorePage ?? true,
      investmentConfiguration: props.investmentConfiguration || null,
      dividendRate: props.dividendRate || null,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
      deletedAt: props.deletedAt || null,
    };

    if (props.id) {
      campaignProps.id = props.id;
    }

    const campaign = new Campaign(campaignProps);
    return Ok(campaign);
  }

  static fromPersistence(props: CampaignProps): Campaign {
    return new Campaign({
      ...props,
      campaignStartDate: props.campaignStartDate || null,
      campaignDuration: props.campaignDuration || null,
      campaignExpirationDate: props.campaignExpirationDate || null,
      campaignStage: props.campaignStage || CampaignStage.DRAFT,
      earningProcess: props.earningProcess || null,
      overSubscriptionAccepted: props.overSubscriptionAccepted || false,
      typeOfSecurityOffered: props.typeOfSecurityOffered || null,
      useOfProceeds: props.useOfProceeds || null,
      salesLead: props.salesLead || null,
      summary: props.summary || null,
      demoLink: props.demoLink || null,
      isLocked: props.isLocked || false,
      financialProjectionsDescription:
        props.financialProjectionsDescription || null,
      howHoneycombIsCompensated: props.howHoneycombIsCompensated || null,
      campaignDocumentUrl: props.campaignDocumentUrl || null,
      ncOfferingId: props.ncOfferingId || null,
      repaymentSchedule: props.repaymentSchedule || null,
      collateral: props.collateral || null,
      annualInterestRate: props.annualInterestRate || null,
      maturityDate: props.maturityDate || null,
      repaymentStartDate: props.repaymentStartDate || null,
      loanDuration: props.loanDuration || null,
      isChargeFee: props.isChargeFee ?? true,
      interestOnlyLoanDuration: props.interestOnlyLoanDuration || null,
      campaignEndTime: props.campaignEndTime || null,
      campaignTimezone: props.campaignTimezone || null,
      blanketLien: props.blanketLien || false,
      equipmentLien: props.equipmentLien || false,
      isPersonalGuarantyFilled: props.isPersonalGuarantyFilled || false,
      personalGuaranty: props.personalGuaranty || null,
      shareValue: props.shareValue || null,
      escrowType: props.escrowType || null,
      isChargeStripe: props.isChargeStripe ?? true,
      isCampaignAddress: props.isCampaignAddress ?? false,
      competitorOffering: props.competitorOffering || null,
      isShowOnExplorePage: props.isShowOnExplorePage ?? true,
      investmentConfiguration: props.investmentConfiguration || null,
      dividendRate: props.dividendRate || null,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
      deletedAt: props.deletedAt || null,
    } as Required<Omit<CampaignProps, 'id' | 'deletedAt'>> & {
      id?: string;
      deletedAt?: Date | null;
    });
  }

  // Getters
  override get id(): string | undefined {
    return this.props.id;
  }
  get campaignId(): string {
    return this.props.campaignId;
  }
  get campaignName(): string {
    return this.props.campaignName;
  }
  get slug(): string {
    return this.props.slug;
  }
  get campaignStage(): string {
    return this.props.campaignStage || CampaignStage.DRAFT;
  }
  get investmentType(): string {
    return this.props.investmentType;
  }
  get campaignTargetAmount(): number {
    return this.props.campaignTargetAmount;
  }
  get campaignMinimumAmount(): number {
    return this.props.campaignMinimumAmount;
  }
  get isShowOnExplorePage(): boolean {
    return this.props.isShowOnExplorePage || true;
  }
  get isLocked(): boolean {
    return this.props.isLocked || false;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  canEdit(): boolean {
    return (
      this.props.campaignStage === CampaignStage.DRAFT && !this.props.isLocked
    );
  }

  canLaunch(): boolean {
    return (
      this.props.campaignStage === CampaignStage.APPROVED &&
      !this.props.isLocked
    );
  }

  launch(): Result<void, Error> {
    if (!this.canLaunch()) {
      return Err(new Error('Campaign cannot be launched in current state'));
    }

    this.props.campaignStage = CampaignStage.LIVE;
    this.props.updatedAt = new Date();
    return Ok(undefined);
  }

  pause(): Result<void, Error> {
    if (this.props.campaignStage !== CampaignStage.LIVE) {
      return Err(new Error('Only live campaigns can be paused'));
    }

    this.props.campaignStage = CampaignStage.PAUSED;
    this.props.updatedAt = new Date();
    return Ok(undefined);
  }

  resume(): Result<void, Error> {
    if (this.props.campaignStage !== CampaignStage.PAUSED) {
      return Err(new Error('Only paused campaigns can be resumed'));
    }

    this.props.campaignStage = CampaignStage.LIVE;
    this.props.updatedAt = new Date();
    return Ok(undefined);
  }

  complete(): Result<void, Error> {
    if (this.props.campaignStage !== CampaignStage.LIVE) {
      return Err(new Error('Only live campaigns can be completed'));
    }

    this.props.campaignStage = CampaignStage.COMPLETED;
    this.props.updatedAt = new Date();
    return Ok(undefined);
  }

  update(updates: Partial<CampaignProps>): Result<void, Error> {
    if (!this.canEdit()) {
      return Err(new Error('Campaign cannot be edited in current state'));
    }

    // Validate updates
    if (updates.campaignName !== undefined && !updates.campaignName?.trim()) {
      return Err(new Error('Campaign name cannot be empty'));
    }

    if (
      updates.campaignTargetAmount !== undefined &&
      updates.campaignTargetAmount <= 0
    ) {
      return Err(new Error('Campaign target amount must be greater than 0'));
    }

    if (
      updates.campaignMinimumAmount !== undefined &&
      updates.campaignMinimumAmount <= 0
    ) {
      return Err(new Error('Campaign minimum amount must be greater than 0'));
    }

    // Apply updates
    Object.assign(this.props, updates);
    this.props.updatedAt = new Date();

    return Ok(undefined);
  }

  override toObject(): CampaignProps {
    const result: CampaignProps = {
      campaignId: this.props.campaignId,
      campaignName: this.props.campaignName,
      campaignStartDate: this.props.campaignStartDate,
      campaignDuration: this.props.campaignDuration,
      campaignExpirationDate: this.props.campaignExpirationDate,
      campaignStage: this.props.campaignStage,
      campaignTargetAmount: this.props.campaignTargetAmount,
      campaignMinimumAmount: this.props.campaignMinimumAmount,
      investmentType: this.props.investmentType,
      earningProcess: this.props.earningProcess,
      overSubscriptionAccepted: this.props.overSubscriptionAccepted,
      typeOfSecurityOffered: this.props.typeOfSecurityOffered,
      useOfProceeds: this.props.useOfProceeds,
      salesLead: this.props.salesLead,
      summary: this.props.summary,
      demoLink: this.props.demoLink,
      isLocked: this.props.isLocked,
      financialProjectionsDescription:
        this.props.financialProjectionsDescription,
      howHoneycombIsCompensated: this.props.howHoneycombIsCompensated,
      campaignDocumentUrl: this.props.campaignDocumentUrl,
      ncOfferingId: this.props.ncOfferingId,
      slug: this.props.slug,
      repaymentSchedule: this.props.repaymentSchedule,
      collateral: this.props.collateral,
      annualInterestRate: this.props.annualInterestRate,
      maturityDate: this.props.maturityDate,
      repaymentStartDate: this.props.repaymentStartDate,
      loanDuration: this.props.loanDuration,
      isChargeFee: this.props.isChargeFee,
      interestOnlyLoanDuration: this.props.interestOnlyLoanDuration,
      campaignEndTime: this.props.campaignEndTime,
      campaignTimezone: this.props.campaignTimezone,
      blanketLien: this.props.blanketLien,
      equipmentLien: this.props.equipmentLien,
      isPersonalGuarantyFilled: this.props.isPersonalGuarantyFilled,
      personalGuaranty: this.props.personalGuaranty,
      shareValue: this.props.shareValue,
      escrowType: this.props.escrowType,
      isChargeStripe: this.props.isChargeStripe,
      isCampaignAddress: this.props.isCampaignAddress,
      competitorOffering: this.props.competitorOffering,
      isShowOnExplorePage: this.props.isShowOnExplorePage,
      investmentConfiguration: this.props.investmentConfiguration,
      dividendRate: this.props.dividendRate,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };

    if (this.props.id) {
      result.id = this.props.id;
    }

    if (this.props.deletedAt !== null && this.props.deletedAt !== undefined) {
      result.deletedAt = this.props.deletedAt;
    }

    return result;
  }
}

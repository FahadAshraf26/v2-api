import { Err, Ok, Result } from 'oxide.ts';

import { ValueObject } from '@/domain/core/value-object';

// Valid dashboard items that can be submitted
export const VALID_DASHBOARD_ITEMS = [
  'dashboardCampaignInfo',
  'dashboardCampaignSummary',
  'dashboardSocials',
] as const;

export type DashboardItemType = (typeof VALID_DASHBOARD_ITEMS)[number];

interface SubmissionItemsProps {
  items: Record<DashboardItemType, boolean>;
}

export class SubmissionItems extends ValueObject<SubmissionItemsProps> {
  private constructor(props: SubmissionItemsProps) {
    super(props);
  }

  static create(
    items: Record<string, boolean>
  ): Result<SubmissionItems, Error> {
    // Validate all items are known dashboard items
    const unknownItems = Object.keys(items).filter(
      item => !VALID_DASHBOARD_ITEMS.includes(item as DashboardItemType)
    );

    if (unknownItems.length > 0) {
      return Err(
        new Error(`Unknown dashboard items: ${unknownItems.join(', ')}`)
      );
    }

    // At least one item must be selected
    const hasSelectedItems = Object.values(items).some(Boolean);
    if (!hasSelectedItems) {
      return Err(new Error('At least one dashboard item must be selected'));
    }

    // Create normalized items record
    const normalizedItems: Record<DashboardItemType, boolean> = {
      dashboardCampaignInfo: items['dashboardCampaignInfo'] || false,
      dashboardCampaignSummary: items['dashboardCampaignSummary'] || false,
      dashboardSocials: items['dashboardSocials'] || false,
    };

    return Ok(new SubmissionItems({ items: normalizedItems }));
  }

  static fromPersistence(
    items: Record<DashboardItemType, boolean>
  ): SubmissionItems {
    return new SubmissionItems({ items });
  }

  // Query methods
  hasItem(itemName: string): boolean {
    return this.props.items[itemName as DashboardItemType] === true;
  }

  getSelectedItems(): string[] {
    return Object.entries(this.props.items)
      .filter(([_, selected]) => selected)
      .map(([item, _]) => item);
  }

  getAllItems(): Record<DashboardItemType, boolean> {
    return { ...this.props.items };
  }

  getSelectedCount(): number {
    return this.getSelectedItems().length;
  }

  isDashboardCampaignInfoSelected(): boolean {
    return this.props.items.dashboardCampaignInfo;
  }

  isDashboardCampaignSummarySelected(): boolean {
    return this.props.items.dashboardCampaignSummary;
  }

  isDashboardSocialsSelected(): boolean {
    return this.props.items.dashboardSocials;
  }

  // For human-readable display
  getSelectedItemsDisplay(): string {
    const selectedItems = this.getSelectedItems();
    const displayNames: Record<string, string> = {
      dashboardCampaignInfo: 'Campaign Info',
      dashboardCampaignSummary: 'Campaign Summary',
      dashboardSocials: 'Social Media',
    };

    return selectedItems.map(item => displayNames[item] || item).join(', ');
  }

  toString(): string {
    return this.getSelectedItemsDisplay();
  }

  toObject(): Record<DashboardItemType, boolean> {
    return { ...this.props.items };
  }
}

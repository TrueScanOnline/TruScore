/**
 * Banner Alerts Types
 *
 * Defines the structure for banner alerts that appear above the TruScore card.
 * Alerts are a combination of APP-generated alerts and User Preference alerts.
 *
 * actionUrl: When present, the banner links to this URL. Per ID 17, this MUST be
 * the specific report/issue hyperlink when available (e.g. recall notice, DOL
 * list of goods, Walk Free GSI). Use the generic organization link ONLY when the
 * exact report URL cannot be provided.
 */

export type AlertSource = 
  | 'app' // APP-generated alerts
  | 'user_preference'; // User Preference alerts

export type AlertCategory =
  | 'recall' // Product recalls
  | 'animal_cruelty' // Animal cruelty concerns
  | 'labor_violations' // Labor violations
  | 'palm_oil' // Palm oil concerns
  | 'geopolitical' // Geopolitical preferences
  | 'other'; // Other concerns

export interface BannerAlert {
  id: string; // Unique identifier for the alert
  source: AlertSource; // APP or user preference
  category: AlertCategory; // Type of alert
  title: string; // Alert title (e.g., "Product Recall", "Animal Cruelty Concerns")
  message: string; // Alert message/description
  severity: 'high' | 'medium' | 'low'; // Alert severity
  timestamp?: number; // When the alert was generated (for time-bound alerts)
  sourceDetails?: {
    // For APP alerts
    organization?: string; // e.g., "FDA", "PETA", "HSUS", "RSPCA", etc.
    recallClassification?: 'Class I' | 'Class II' | 'Class III'; // For recalls
    // For user preference alerts
    preferenceType?: string; // e.g., "avoidAnimalTesting", "avoidForcedLabour"
  };
  /** Specific report/issue URL when available; otherwise generic org link. See module comment (ID 17). */
  actionUrl?: string;
}

export interface BannerAlertsData {
  alerts: BannerAlert[];
  hasAlerts: boolean;
  alertCount: number;
}

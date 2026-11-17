import React, { useState } from 'react';
import { TouchableOpacity, Text, type StyleProp, type ViewStyle, type TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import ProductReportConcernPicker from './account/ProductReportConcernPicker';
import { openAssessmentReport } from '../utils/openAssessmentReport';
import type { AssessmentReportFields } from '../utils/reportAssessmentMailto';
import type { ProductReportConcernType } from '../content/accountTrustContent';
import { productIdentity } from '../config/productIdentity';

type Props = {
  /** Prefilled product context when launched from Result (omit empty fields). */
  productContext?: Pick<AssessmentReportFields, 'barcode' | 'productName' | 'brand' | 'shareUrl' | 'disputedStatement'>;
  /** Fixed concern when the caller already knows the class (e.g. administrative hold). */
  fixedConcern?: ProductReportConcernType | string;
  onPressWhenUnconfigured?: () => void;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  hintStyle?: StyleProp<TextStyle>;
  title: string;
  hint?: string;
  testID?: string;
};

/**
 * Opens a concern picker (unless fixed), then a draft assessment mailto.
 * Does not claim receipt or create a ticket.
 */
export default function ProductAssessmentReportControl({
  productContext,
  fixedConcern,
  onPressWhenUnconfigured,
  style,
  titleStyle,
  hintStyle,
  title,
  hint,
  testID,
}: Props) {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const supportEmail = productIdentity.supportEmail.trim();
  const configured = supportEmail.length > 0;

  const launch = (concern: string) => {
    void openAssessmentReport({
      subject: t('account.supportSubjectReport'),
      fields: {
        ...productContext,
        errorType: concern,
      },
      missingMessage: t('account.supportEmailMissing'),
      failedMessage: t('account.supportEmailFailed', { email: supportEmail }),
    });
  };

  const onPress = () => {
    if (!configured) {
      onPressWhenUnconfigured?.();
      if (!onPressWhenUnconfigured) {
        void openAssessmentReport({
          subject: t('account.supportSubjectReport'),
          fields: { ...productContext, errorType: fixedConcern || 'other' },
          missingMessage: t('account.supportEmailMissing'),
          failedMessage: t('account.supportEmailFailed', { email: supportEmail }),
        });
      }
      return;
    }
    if (fixedConcern) {
      launch(fixedConcern);
      return;
    }
    setPickerOpen(true);
  };

  return (
    <>
      <TouchableOpacity style={style} onPress={onPress} testID={testID} accessibilityRole="button">
        <Text style={titleStyle}>{title}</Text>
        {hint ? <Text style={hintStyle}>{hint}</Text> : null}
      </TouchableOpacity>
      <ProductReportConcernPicker
        visible={pickerOpen}
        onCancel={() => setPickerOpen(false)}
        onSelect={(concern) => {
          setPickerOpen(false);
          launch(concern);
        }}
      />
    </>
  );
}

import { default as i18nConfig } from './config';
import { useTranslation as useI18nTranslation } from 'react-i18next';

export default i18nConfig;
export * from './config';

// Re-export useTranslation avec le bon typage
export const useTranslation = useI18nTranslation;

// Custom hook for typed translations
export const useTypedTranslation = () => {
  const { t, i18n } = useTranslation();

  // Helper functions avec vérification de sécurité
  const getPropertyTypeLabel = (type: string): string => {
    try {
      return t(`property.types.${type}`, type);
    } catch {
      return type;
    }
  };

  const getPropertyCategoryLabel = (category: string): string => {
    try {
      return t(`property.categories.${category}`, category);
    } catch {
      return category;
    }
  };

  const getPropertyStatusLabel = (status: string): string => {
    try {
      return t(`property.status.${status}`, status);
    } catch {
      return status;
    }
  };

  const getPropertyConditionLabel = (condition: string): string => {
    try {
      return t(`property.conditions.${condition}`, condition);
    } catch {
      return condition;
    }
  };

  const getFeatureLabel = (feature: string): string => {
    try {
      return t(`property.features.${feature}`, feature);
    } catch {
      return feature;
    }
  };

  return {
    t,
    i18n,
    getPropertyTypeLabel,
    getPropertyCategoryLabel,
    getPropertyStatusLabel,
    getPropertyConditionLabel,
    getFeatureLabel,
    isRTL: i18n.language === 'ar',
    currentLanguage: i18n.language,
    changeLanguage: (lng: string) => i18n.changeLanguage(lng),
  };
};
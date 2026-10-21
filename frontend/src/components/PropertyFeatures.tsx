import React from 'react';
import { motion } from 'framer-motion';
import {
  Ruler,
  Bed,
  Bath,
  Home,
  Calendar,
  Wrench,
  Car,
  Waves,
  Wind,
  Wifi,
  Shield,
  TreePine,
  ArrowUp,
  CheckCircle,
  XCircle,
  Building,
  Timer,
  PawPrint,
  DoorOpen,
  GraduationCap,
  Library,
  Landmark,
  HeartPulse,
  Store,
  TrainFront,
  Bus,
  Train,
  TrendingUp,
  Sparkles,
  VolumeX,
  Users,
  Map,
  Sun,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Property } from '../types';

interface PropertyFeaturesProps {
  property: Property;
  finalPrice?: number;
}

const FeatureItem: React.FC<{ icon: React.ReactNode; label: string; value: string | number; active?: boolean }> = ({
  icon,
  label,
  value,
  active = true,
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`flex items-center gap-3 rounded-xl p-3 transition-all ${
      active ? 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800' : 'bg-slate-50/50 opacity-60 dark:bg-slate-800/30'
    }`}
  >
    <div className="text-morocco-royal dark:text-morocco-gold">{icon}</div>
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  </motion.div>
);

const AmenityBadge: React.FC<{ active: boolean; label: string; icon: React.ReactNode }> = ({
  active,
  label,
  icon,
}) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
      active
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
    }`}
  >
    {active ? <CheckCircle size={14} /> : <XCircle size={14} />}
    {icon}
    <span>{label}</span>
  </motion.div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="mb-4 text-lg font-bold text-morocco-charcoal dark:text-slate-100 flex items-center gap-2">
    <div className="h-6 w-1 rounded-full bg-morocco-gold" />
    {children}
  </h3>
);

export const PropertyFeatures: React.FC<PropertyFeaturesProps> = ({ property, finalPrice }) => {
  const { t } = useTranslation();
  const {
    surface, rooms, bedrooms, bathrooms, floorNumber, totalFloors, buildingAge,
    constructionYear, condition, furnished,
    hasElevator, hasParking, hasPool, hasGarden, hasAirConditioning,
    hasInternet, hasSecurity, hasBalcony, petAllowed,
    cityCenter, nearSchool, nearUniversity, nearMosque, nearHospital,
    nearMarket, nearTram, nearBus, nearTrainStation,
    popularArea, modernArea, quietArea, familyArea,
    sunDirection, gardenView, streetView, seaView,
    pricePerSquareMeter,
  } = property;

  const conditionLabel = condition
    ? t(`property.conditions.${condition}`, condition)
    : t('common.notSpecified', 'Non spécifié');

  const displayPricePerM2 = pricePerSquareMeter || (finalPrice && surface > 0 ? finalPrice / surface : 0);

  const environmentItems = [
    { active: !!cityCenter, label: t('property.env.cityCenter', 'Centre-ville'), icon: <Building size={14} /> },
    { active: !!nearSchool, label: t('property.env.nearSchool', 'Près école'), icon: <GraduationCap size={14} /> },
    { active: !!nearUniversity, label: t('property.env.nearUniversity', 'Près université'), icon: <Library size={14} /> },
    { active: !!nearMosque, label: t('property.env.nearMosque', 'Près mosquée'), icon: <Landmark size={14} /> },
    { active: !!nearHospital, label: t('property.env.nearHospital', 'Près hôpital'), icon: <HeartPulse size={14} /> },
    { active: !!nearMarket, label: t('property.env.nearMarket', 'Près marché'), icon: <Store size={14} /> },
    { active: !!nearTram, label: t('property.env.nearTram', 'Tramway'), icon: <TrainFront size={14} /> },
    { active: !!nearBus, label: t('property.env.nearBus', 'Bus'), icon: <Bus size={14} /> },
    { active: !!nearTrainStation, label: t('property.env.nearTrain', 'Gare'), icon: <Train size={14} /> },
  ];

  const areaItems = [
    { active: !!popularArea, label: t('property.area.popular', 'Zone populaire'), icon: <TrendingUp size={14} /> },
    { active: !!modernArea, label: t('property.area.modern', 'Zone moderne'), icon: <Sparkles size={14} /> },
    { active: !!quietArea, label: t('property.area.quiet', 'Zone calme'), icon: <VolumeX size={14} /> },
    { active: !!familyArea, label: t('property.area.family', 'Familiale'), icon: <Users size={14} /> },
  ];

  const viewItems = [
    { active: !!gardenView, label: t('property.view.garden', 'Vue jardin'), icon: <TreePine size={14} /> },
    { active: !!streetView, label: t('property.view.street', 'Vue rue'), icon: <Map size={14} /> },
    { active: !!seaView, label: t('property.view.sea', 'Vue mer'), icon: <Waves size={14} /> },
  ];

  const hasAnyEnvironment = environmentItems.some(i => i.active);
  const hasAnyArea = areaItems.some(i => i.active);
  const hasAnyView = viewItems.some(i => i.active);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Caractéristiques physiques */}
      <div>
        <SectionTitle>{t('property.details.characteristics', 'Caractéristiques')}</SectionTitle>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          <FeatureItem icon={<Ruler size={18} />} label={t('common.surface', 'Surface')} value={`${surface} ${t('common.squareMeter', 'm²')}`} />
          <FeatureItem icon={<Home size={18} />} label={t('common.rooms', 'Pièces')} value={rooms} />
          <FeatureItem icon={<Bed size={18} />} label={t('common.bedrooms', 'Chambres')} value={bedrooms || 0} />
          <FeatureItem icon={<Bath size={18} />} label={t('common.bathrooms', 'Salles de bain')} value={bathrooms || 0} />
          {floorNumber !== undefined && floorNumber !== null && (
            <FeatureItem icon={<Building size={18} />} label={t('property.floorNumber', 'Étage')} value={`${floorNumber} / ${totalFloors || '?'}`} />
          )}
          {buildingAge !== undefined && buildingAge !== null && (
            <FeatureItem icon={<Timer size={18} />} label={t('property.buildingAge', 'Âge du bâtiment')} value={`${buildingAge} ${t('common.years', 'ans')}`} />
          )}
          {constructionYear && <FeatureItem icon={<Calendar size={18} />} label={t('common.constructionYear', 'Construit en')} value={constructionYear} />}
          <FeatureItem icon={<Wrench size={18} />} label={t('common.condition', 'État')} value={conditionLabel} active={!!condition} />
          <FeatureItem
            icon={furnished ? <CheckCircle size={18} /> : <XCircle size={18} />}
            label={t('common.furnished', 'Meublé')}
            value={furnished ? t('common.yes', 'Oui') : t('common.no', 'Non')}
            active={!!furnished}
          />
        </div>
      </div>

      {/* Équipements */}
      <div>
        <SectionTitle>{t('property.details.equipments', 'Équipements')}</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <AmenityBadge active={!!hasParking} label={t('property.features.parking', 'Parking')} icon={<Car size={14} />} />
          <AmenityBadge active={!!hasPool} label={t('property.features.pool', 'Piscine')} icon={<Waves size={14} />} />
          <AmenityBadge active={!!hasElevator} label={t('property.features.elevator', 'Ascenseur')} icon={<ArrowUp size={14} />} />
          <AmenityBadge active={!!hasGarden} label={t('property.features.garden', 'Jardin')} icon={<TreePine size={14} />} />
          <AmenityBadge active={!!hasAirConditioning} label={t('property.features.airConditioning', 'Climatisation')} icon={<Wind size={14} />} />
          <AmenityBadge active={!!hasInternet} label={t('property.features.internet', 'Internet')} icon={<Wifi size={14} />} />
          <AmenityBadge active={!!hasSecurity} label={t('property.features.security', 'Sécurité')} icon={<Shield size={14} />} />
          <AmenityBadge active={!!hasBalcony} label={t('property.features.balcony', 'Balcon')} icon={<DoorOpen size={14} />} />
          <AmenityBadge active={!!petAllowed} label={t('property.features.pets', 'Animaux acceptés')} icon={<PawPrint size={14} />} />
        </div>
      </div>

      {/* Environnement */}
      {hasAnyEnvironment && (
        <div>
          <SectionTitle>{t('property.details.environment', 'Environnement')}</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {environmentItems.map(item => (
              <AmenityBadge key={item.label} active={item.active} label={item.label} icon={item.icon} />
            ))}
          </div>
        </div>
      )}

      {/* Quartier */}
      {hasAnyArea && (
        <div>
          <SectionTitle>{t('property.details.area', 'Quartier')}</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {areaItems.map(item => (
              <AmenityBadge key={item.label} active={item.active} label={item.label} icon={item.icon} />
            ))}
          </div>
        </div>
      )}

      {/* Vues & Orientation */}
      {(hasAnyView || sunDirection) && (
        <div>
          <SectionTitle>{t('property.details.views', 'Vues & Orientation')}</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {sunDirection && (
              <AmenityBadge
                active={true}
                label={t(`property.sunDirection.${sunDirection}`, sunDirection)}
                icon={<Sun size={14} />}
              />
            )}
            {viewItems.map(item => (
              <AmenityBadge key={item.label} active={item.active} label={item.label} icon={item.icon} />
            ))}
          </div>
        </div>
      )}

      {/* Prix au m² */}
      {displayPricePerM2 > 0 && (
        <div className="rounded-2xl border border-morocco-gold/30 bg-gradient-to-r from-amber-50/50 to-emerald-50/50 dark:from-amber-900/20 dark:to-emerald-900/20 p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('common.pricePerSquareMeter', 'Prix au m²')}</p>
          <p className="text-2xl font-bold text-morocco-royal dark:text-morocco-gold">
            {Math.round(displayPricePerM2).toLocaleString()} {t('property.card.pricePerM2', 'DH/m²')}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('property.priceBasedOnFinal', 'Basé sur le prix final')}</p>
        </div>
      )}
    </motion.div>
  );
};

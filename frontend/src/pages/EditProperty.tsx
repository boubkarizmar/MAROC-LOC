import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { propertyApi } from '../api/propertyApi';
import { Property, PropertyType, PropertyCategory, PropertyCondition, SunDirection, PaymentMethod, BillingPeriod } from '../types';
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle2, Image as ImageIcon,
  Trash2, MapPin, DollarSign, Home, Building, Bed, Bath, Maximize,
  Car, Waves, TreePine, Snowflake, Wifi, Shield, DoorOpen, ArrowUpFromLine,
  PawPrint, Landmark, GraduationCap, Church as Mosque, Store, BusFront,
  TrainFront, TramFront, Compass, VolumeX, Baby, TreeDeciduous, Waves as SeaIcon,
  Sun, Sunrise, Sunset, CreditCard, Banknote, Coins, FileBadge,
  RotateCcw, Wrench, BadgeCheck, CheckSquare, Globe, Navigation,
  Sparkles, Crown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ImageDropZone, MediaFile } from '../components/owner/ImageDropZone';
import { MapPicker } from '../components/owner/MapPicker';
import { AIDescriptionGenerator } from '../components/owner/AIDescriptionGenerator';
import { AIPricingSuggestion } from '../components/owner/AIPricingSuggestion';
import { useToast } from '../components/ui/Toast';
import { fixMediaUrl } from '../utils/imageUtils';
import { useTranslation } from 'react-i18next';

export const EditProperty: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isProprietaire, isAdmin } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [property, setProperty] = useState<Partial<Property>>({});
  const [images, setImages] = useState<MediaFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('info');
  const { t } = useTranslation();

  const conditionConfig = [
    { value: 'NEW', label: t('property.conditions.NEW'), icon: BadgeCheck },
    { value: 'GOOD', label: t('property.conditions.GOOD'), icon: CheckCircle2 },
    { value: 'RENOVATED', label: t('property.conditions.RENOVATED'), icon: RotateCcw },
    { value: 'NEEDS_REPAIR', label: t('property.conditions.NEEDS_REPAIR'), icon: Wrench },
    { value: 'TO_RENOVATE', label: t('property.conditions.TO_RENOVATE'), icon: Wrench },
  ];

  const equipmentConfig = [
    { field: 'hasParking', label: t('property.features.parking'), icon: Car },
    { field: 'hasPool', label: t('property.features.pool'), icon: Waves },
    { field: 'hasGarden', label: t('property.features.garden'), icon: TreePine },
    { field: 'hasAirConditioning', label: t('property.features.airConditioning'), icon: Snowflake },
    { field: 'hasInternet', label: t('property.features.internet'), icon: Wifi },
    { field: 'hasSecurity', label: t('property.features.security'), icon: Shield },
    { field: 'hasBalcony', label: t('property.features.balcony'), icon: DoorOpen },
    { field: 'hasElevator', label: t('property.features.elevator'), icon: ArrowUpFromLine },
  ];

  const environmentConfig = [
    { field: 'cityCenter', label: t('property.env.cityCenter'), icon: Landmark },
    { field: 'nearSchool', label: t('property.env.nearSchool'), icon: GraduationCap },
    { field: 'nearUniversity', label: t('property.env.nearUniversity'), icon: GraduationCap },
    { field: 'nearMosque', label: t('property.env.nearMosque'), icon: Mosque },
    { field: 'nearHospital', label: t('property.env.nearHospital'), icon: BadgeCheck },
    { field: 'nearMarket', label: t('property.env.nearMarket'), icon: Store },
    { field: 'nearBus', label: t('property.env.nearBus'), icon: BusFront },
    { field: 'nearTram', label: t('property.env.nearTram'), icon: TramFront },
    { field: 'nearTrainStation', label: t('property.env.nearTrain'), icon: TrainFront },
  ];

  const areaConfig = [
    { field: 'popularArea', label: t('property.area.popular'), icon: Compass },
    { field: 'modernArea', label: t('property.area.modern'), icon: Building },
    { field: 'quietArea', label: t('property.area.quiet'), icon: VolumeX },
    { field: 'familyArea', label: t('property.area.family'), icon: Baby },
    { field: 'gardenView', label: t('property.view.garden'), icon: TreeDeciduous },
    { field: 'streetView', label: t('property.view.street'), icon: Compass },
    { field: 'seaView', label: t('property.view.sea'), icon: SeaIcon },
  ];

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!isProprietaire) { navigate('/home'); return; }
    loadProperty();
  }, [user, isProprietaire, id, navigate]);

  const loadProperty = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await propertyApi.getById(Number(id));
      const data = res.data;
      setProperty(data);
      if (data.images) {
        setImages(data.images.map((url, idx) => ({
          file: new File([], url.split('/').pop() || 'image'),
          url: fixMediaUrl(url),
          type: 'image' as const,
          isPrimary: idx === 0,
        })));
      }
    } catch (err) {
      showToast(t('property.edit.loadError'), 'error');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof Property>(field: K, value: Property[K]) => {
    setProperty(prev => ({ ...prev, [field]: value }));
  };

  const toggleField = (field: keyof Property) => {
    setProperty(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!property.title?.trim()) errs.push(t('property.create.errTitleRequired'));
    if (!property.description || property.description.length < 50) errs.push(t('property.create.errDescMin'));
    if (!property.price || property.price < 1000) errs.push(t('property.create.errPriceMin'));
    if (!property.city) errs.push(t('property.create.errCityRequired'));
    if (!property.address) errs.push(t('property.create.errAddressRequired'));
    if (!property.surface || property.surface < 10) errs.push(t('property.create.errSurfaceMin'));
    if (!property.rooms || property.rooms < 1) errs.push(t('property.create.errRoomsRequired'));
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      showToast('Veuillez corriger les erreurs', 'error');
      return;
    }
    setSaving(true);
    try {
      const propertyData = {
        title: property.title,
        description: property.description,
        price: property.price,
        city: property.city,
        address: property.address,
        type: property.type,
        category: property.category,
        surface: property.surface,
        rooms: property.rooms,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        floorNumber: property.floorNumber,
        totalFloors: property.totalFloors,
        constructionYear: property.constructionYear,
        condition: property.condition,
        furnished: property.furnished,
        hasElevator: property.hasElevator,
        hasParking: property.hasParking,
        hasPool: property.hasPool,
        hasGarden: property.hasGarden,
        hasAirConditioning: property.hasAirConditioning,
        hasInternet: property.hasInternet,
        hasSecurity: property.hasSecurity,
        hasBalcony: property.hasBalcony,
        petAllowed: property.petAllowed,
        cityCenter: property.cityCenter,
        nearSchool: property.nearSchool,
        nearUniversity: property.nearUniversity,
        nearMosque: property.nearMosque,
        nearHospital: property.nearHospital,
        nearMarket: property.nearMarket,
        nearTram: property.nearTram,
        nearBus: property.nearBus,
        nearTrainStation: property.nearTrainStation,
        popularArea: property.popularArea,
        modernArea: property.modernArea,
        quietArea: property.quietArea,
        familyArea: property.familyArea,
        sunDirection: property.sunDirection,
        gardenView: property.gardenView,
        streetView: property.streetView,
        seaView: property.seaView,
        paymentMethod: property.paymentMethod,
        discountPercentage: property.discountPercentage,
        additionalFees: property.additionalFees,
        latitude: property.latitude,
        longitude: property.longitude,
        phoneNumber: property.phoneNumber,
        whatsappNumber: property.whatsappNumber,
        status: property.status,
      };

      // Separate new uploads from existing images
      const newImages = images.filter(img => img.file && img.file.size > 0).map(img => img.file);
      const existingUrls = images.filter(img => !img.file || img.file.size === 0).map(img => img.url);

      if (newImages.length > 0) {
        await propertyApi.updateWithImages(Number(id), propertyData, newImages as File[], existingUrls);
      } else {
        await propertyApi.update(Number(id), propertyData);
      }
      showToast(t('property.edit.success'), 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast(t('property.edit.error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-teal-600" />
      </div>
    );
  }

  const tabs = [
    { id: 'info', label: t('property.edit.tabInfo'), icon: Home },
    { id: 'features', label: t('property.edit.tabFeatures'), icon: Maximize },
    { id: 'amenities', label: t('property.edit.tabAmenities'), icon: CheckSquare },
    { id: 'location', label: t('property.edit.tabLocation'), icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition">
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">{t('common.back')}</span>
          </button>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Crown size={24} className="text-amber-500" />
            {t('property.edit.title')}
          </h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-teal-700 transition disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {t('property.edit.submit')}
          </button>
        </div>

        {errors.length > 0 && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <ul className="list-disc pl-5 text-sm text-red-700">
              {errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm border border-slate-100 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {/* INFO TAB */}
          {activeTab === 'info' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow-lg space-y-4">
                <h2 className="text-lg font-bold text-slate-900">{t('property.edit.sectionMain')}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{t('property.create.titleLabel')}</label>
                    <input
                      type="text"
                      value={property.title || ''}
                      onChange={e => updateField('title', e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{t('property.create.price')}</label>
                    <input
                      type="number"
                      value={property.price || ''}
                      onChange={e => updateField('price', Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 transition"
                    />
                  </div>
                </div>

                {/* AI Pricing Suggestion */}
                <AIPricingSuggestion
                  propertyData={{
                    city: property.city || '',
                    category: property.category || 'APARTMENT',
                    propertyType: property.type || 'RENT',
                    surface: property.surface || 0,
                    rooms: property.rooms || 0,
                    bedrooms: property.bedrooms,
                    bathrooms: property.bathrooms,
                    furnished: property.furnished,
                    hasParking: property.hasParking,
                    hasPool: property.hasPool,
                    hasGarden: property.hasGarden,
                    hasAirConditioning: property.hasAirConditioning,
                    hasElevator: property.hasElevator,
                    cityCenter: property.cityCenter,
                    nearTram: property.nearTram,
                    seaView: property.seaView,
                    condition: property.condition || 'GOOD',
                    buildingAge: property.buildingAge,
                  }}
                  currentPrice={property.price}
                  onPriceSuggested={(price) => updateField('price', price)}
                />

                <div>
                  <label className="block text-sm font-medium text-slate-700">{t('common.description')}</label>
                  <textarea
                    rows={4}
                    value={property.description || ''}
                    onChange={e => updateField('description', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 transition"
                  />
                  <p className="mt-1 text-xs text-slate-500">{(property.description || '').length} {t('property.edit.characters')}</p>
                </div>

                {/* AI Description Generator */}
                <AIDescriptionGenerator
                  propertyData={{
                    title: property.title || '',
                    city: property.city || '',
                    category: property.category || 'APARTMENT',
                    propertyType: property.type || 'RENT',
                    surface: property.surface || 0,
                    rooms: property.rooms || 0,
                    bedrooms: property.bedrooms,
                    bathrooms: property.bathrooms,
                    furnished: property.furnished,
                    hasParking: property.hasParking,
                    hasPool: property.hasPool,
                    hasGarden: property.hasGarden,
                    hasAirConditioning: property.hasAirConditioning,
                    hasInternet: property.hasInternet,
                    hasSecurity: property.hasSecurity,
                    hasBalcony: property.hasBalcony,
                    hasElevator: property.hasElevator,
                    cityCenter: property.cityCenter,
                    nearSchool: property.nearSchool,
                    nearUniversity: property.nearUniversity,
                    nearMosque: property.nearMosque,
                    nearHospital: property.nearHospital,
                    nearTram: property.nearTram,
                    nearBus: property.nearBus,
                    nearTrainStation: property.nearTrainStation,
                    seaView: property.seaView,
                    gardenView: property.gardenView,
                    quietArea: property.quietArea,
                    familyArea: property.familyArea,
                    modernArea: property.modernArea,
                  }}
                  onDescriptionGenerated={(desc) => updateField('description', desc)}
                  currentDescription={property.description}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{t('property.create.propertyType')}</label>
                    <select
                      value={property.type || 'RENT'}
                      onChange={e => updateField('type', e.target.value as PropertyType)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <option value="RENT">{t('property.types.RENT')}</option>
                      <option value="BUY">{t('property.types.BUY')}</option>
                      <option value="MORTGAGE">{t('property.types.MORTGAGE')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{t('property.create.category')}</label>
                    <select
                      value={property.category || 'APARTMENT'}
                      onChange={e => updateField('category', e.target.value as PropertyCategory)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <option value="APARTMENT">{t('property.categories.APARTMENT')}</option>
                      <option value="HOUSE">{t('property.categories.HOUSE')}</option>
                      <option value="OFFICE">{t('property.categories.OFFICE')}</option>
                      <option value="SHOP">{t('property.categories.SHOP')}</option>
                      <option value="LAND">{t('property.categories.LAND')}</option>
                      <option value="RIAD">{t('property.categories.RIAD')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{t('common.city')}</label>
                    <input
                      type="text"
                      value={property.city || ''}
                      onChange={e => updateField('city', e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{t('property.create.address')}</label>
                    <input
                      type="text"
                      value={property.address || ''}
                      onChange={e => updateField('address', e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">{t('property.status.title')}</label>
                  <select
                    value={property.status || 'PENDING'}
                    onChange={e => updateField('status', e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <option value="PENDING">{t('property.status.PENDING')}</option>
                    {isAdmin && <option value="APPROVED">{t('property.status.APPROVED')}</option>}
                    <option value="AVAILABLE">{t('property.status.AVAILABLE')}</option>
                    <option value="RESERVED">{t('property.status.RESERVED')}</option>
                    <option value="RENTED">{t('property.status.RENTED')}</option>
                  </select>
                </div>
              </div>

              {/* Images */}
              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <h2 className="text-lg font-bold text-slate-900 mb-4">{t('property.create.images')}</h2>
                <ImageDropZone images={images} onImagesChange={setImages} maxImages={10} />
              </div>
            </motion.div>
          )}

          {/* FEATURES TAB */}
          {activeTab === 'features' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-white p-6 shadow-lg space-y-4">
              <h2 className="text-lg font-bold text-slate-900">{t('property.edit.sectionFeatures')}</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: t('property.create.surface'), key: 'surface', type: 'number' },
                  { label: t('property.create.rooms'), key: 'rooms', type: 'number' },
                  { label: t('property.create.bedrooms'), key: 'bedrooms', type: 'number' },
                  { label: t('property.create.bathrooms'), key: 'bathrooms', type: 'number' },
                  { label: t('property.create.floorNumber'), key: 'floorNumber', type: 'number' },
                  { label: t('property.create.totalFloors'), key: 'totalFloors', type: 'number' },
                  { label: t('property.create.constructionYear'), key: 'constructionYear', type: 'number' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-slate-700">{field.label}</label>
                    <input
                      type={field.type}
                      value={(property as any)[field.key] || ''}
                      onChange={e => updateField(field.key as any, Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 transition"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">{t('property.create.condition')}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                  {conditionConfig.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => updateField('condition', c.value as PropertyCondition)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition ${
                        property.condition === c.value
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <c.icon size={16} />
                      <span className="text-sm">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleField('furnished')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition ${
                  property.furnished
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                {property.furnished ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded border-2 border-slate-300" />}
                {t('property.features.furnished')}
              </button>
            </motion.div>
          )}

          {/* AMENITIES TAB */}
          {activeTab === 'amenities' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <h2 className="text-lg font-bold text-slate-900 mb-4">{t('property.edit.sectionAmenities')}</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {equipmentConfig.map((eq) => (
                    <button
                      key={eq.field}
                      type="button"
                      onClick={() => toggleField(eq.field as keyof Property)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition ${
                        (property as any)[eq.field]
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <eq.icon size={16} />
                      <span className="text-sm">{eq.label}</span>
                      {(property as any)[eq.field] && <CheckCircle2 size={14} className="ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <h2 className="text-lg font-bold text-slate-900 mb-4">{t('property.edit.sectionEnvironment')}</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {environmentConfig.map((env) => (
                    <button
                      key={env.field}
                      type="button"
                      onClick={() => toggleField(env.field as keyof Property)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition ${
                        (property as any)[env.field]
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <env.icon size={16} />
                      <span className="text-sm">{env.label}</span>
                      {(property as any)[env.field] && <CheckCircle2 size={14} className="ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <h2 className="text-lg font-bold text-slate-900 mb-4">{t('property.edit.sectionArea')}</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {areaConfig.map((area) => (
                    <button
                      key={area.field}
                      type="button"
                      onClick={() => toggleField(area.field as keyof Property)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition ${
                        (property as any)[area.field]
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <area.icon size={16} />
                      <span className="text-sm">{area.label}</span>
                      {(property as any)[area.field] && <CheckCircle2 size={14} className="ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* LOCATION TAB */}
          {activeTab === 'location' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <h2 className="text-lg font-bold text-slate-900 mb-4">{t('property.create.coordinates')}</h2>
                <MapPicker
                  latitude={property.latitude || 33.5731}
                  longitude={property.longitude || -7.5898}
                  city={property.city}
                  onLocationChange={(lat, lng) => {
                    updateField('latitude', lat);
                    updateField('longitude', lng);
                  }}
                />
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{t('property.create.latitude')}</label>
                    <input
                      type="number"
                      step="any"
                      value={property.latitude || ''}
                      onChange={e => updateField('latitude', parseFloat(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{t('property.create.longitude')}</label>
                    <input
                      type="number"
                      step="any"
                      value={property.longitude || ''}
                      onChange={e => updateField('longitude', parseFloat(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <h2 className="text-lg font-bold text-slate-900 mb-4">{t('common.contact')}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{t('property.create.phoneNumber')}</label>
                    <input
                      type="tel"
                      value={property.phoneNumber || ''}
                      onChange={e => updateField('phoneNumber', e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{t('common.whatsapp')}</label>
                    <input
                      type="tel"
                      value={property.whatsappNumber || ''}
                      onChange={e => updateField('whatsappNumber', e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditProperty;

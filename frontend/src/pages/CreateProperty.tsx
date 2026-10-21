import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { propertyApi } from '../api/propertyApi';
import {
  CheckCircle2,
  Loader2,
  MapPin,
  Image,
  XCircle,
  AlertCircle,
  Building2 as Hospital,
  ChevronRight,
  ChevronLeft,
  Sunrise,
  Sunset,
  Wrench,
  Upload,
  Video,
  Building,
  Home,
  Bed,
  Bath,
  Maximize,
  Layers,
  Calendar,
  Car,
  Waves,
  Trees,
  Wind,
  Wifi,
  Shield,
  DoorOpen as Balcony,
  PawPrint,
  GraduationCap,
  School,
  Church as Mosque,
  ShoppingCart,
  Bus,
  Train,
  Sun,
  Eye,
  MapPinned,
  DollarSign,
  FileText,
  Phone,
  MessageCircle,
  Check,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckSquare,
  Trash2,
  Crown,
  Plus,
  Navigation,
  Globe,
  Sofa,
  ArrowUpFromLine,
  Droplets,
  Flower2,
  Snowflake,
  Lock,
  ParkingSquare as SquareParking,
  Waves as WavesLadder,
  ThermometerSun,
  Network,
  ShieldCheck,
  Dog,
  Landmark,
  GraduationCap as University,
  Store,
  BusFront,
  TrainFront,
  TramFront,
  Compass,
  Mountain,
  TreePine,
  VolumeX,
  Baby,
  TreeDeciduous,
  Waves as SeaIcon,
  Eye as ViewIcon,
  CreditCard,
  Banknote,
  Percent,
  Coins,
  PhoneCall,
  Smartphone,
  User,
  Fingerprint,
  FileBadge,
  BadgeCheck,
  RotateCcw,
  Map as MapIcon,
  LocateFixed
} from 'lucide-react';
import { ImageDropZone, MediaFile } from '../components/owner/ImageDropZone';
import { MapPicker } from '../components/owner/MapPicker';
import { AIDescriptionGenerator } from '../components/owner/AIDescriptionGenerator';
import { AIPricingSuggestion } from '../components/owner/AIPricingSuggestion';
import {
  PropertyType,
  PropertyCategory,
  PropertyCondition,
  SunDirection,
  PaymentMethod,
  BillingPeriod,
} from '../types';

// ==================== TYPES LOCAUX ====================
interface FormState {
  title: string;
  description: string;
  price: string;
  propertyType: PropertyType;
  category: PropertyCategory;
  customCategory: string;
  city: string;
  address: string;
  surface: string;
  rooms: string;
  bedrooms: string;
  bathrooms: string;
  floorNumber: string;
  totalFloors: string;
  buildingAge: string;
  constructionYear: string;
  condition: PropertyCondition;
  furnished: boolean;
  hasElevator: boolean;
  hasParking: boolean;
  hasPool: boolean;
  hasGarden: boolean;
  hasAirConditioning: boolean;
  hasInternet: boolean;
  hasSecurity: boolean;
  hasBalcony: boolean;
  petAllowed: boolean;
  cityCenter: boolean;
  nearSchool: boolean;
  nearUniversity: boolean;
  nearMosque: boolean;
  nearHospital: boolean;
  nearMarket: boolean;
  nearTram: boolean;
  nearBus: boolean;
  nearTrainStation: boolean;
  popularArea: boolean;
  modernArea: boolean;
  quietArea: boolean;
  familyArea: boolean;
  sunDirection: SunDirection;
  gardenView: boolean;
  streetView: boolean;
  seaView: boolean;
  paymentMethod: PaymentMethod;
  billingPeriod: BillingPeriod;
  discountPercentage: string;
  additionalFees: string;
  latitude: string;
  longitude: string;
  phoneNumber: string;
  whatsappNumber: string;
  firstNameArabic: string;
  lastNameArabic: string;
  firstNameLatin: string;
  lastNameLatin: string;
  cin: string;
}

interface GeoCoordinates {
  lat: number;
  lng: number;
  displayName?: string;
}

// ==================== CONSTANTS ====================
const defaultCities = [
  "Casablanca", "Rabat", "Marrakech", "Fes", "Tangier", "Agadir", "Mohammedia",
  "Meknes", "Oujda", "Kenitra", "Tetouan", "Safi", "El Jadida", "Nador",
  "Beni Mellal", "Errachidia", "Laayoune", "Dakhla", "Essaouira", "Chefchaouen",
  "Ifrane", "Ouarzazate", "Al Hoceima", "Larache", "Settat", "Berrechid",
  "Khemisset", "Taroudant", "Tiznit", "Khouribga", "Taza", "Guelmim"
];

// Cache local pour éviter les appels API répétés
const geoCache: Map<string, GeoCoordinates> = new Map();

const steps = [
  { id: 1, titleKey: 'property.create.step.info', icon: FileText },
  { id: 2, titleKey: 'property.create.step.features', icon: Maximize },
  { id: 3, titleKey: 'property.create.step.equipments', icon: CheckSquare },
  { id: 4, titleKey: 'property.create.step.environment', icon: MapPin },
  { id: 5, titleKey: 'property.create.step.views', icon: Eye },
  { id: 6, titleKey: 'property.create.step.payment', icon: DollarSign },
  { id: 7, titleKey: 'property.create.step.media', icon: Image },
];

// ✅ MAPPING DES ÉQUIPEMENTS AVEC ICÔNES
const equipmentConfig = [
  { field: 'hasParking' as keyof FormState, labelKey: 'property.features.parking', label: 'Parking', icon: SquareParking, color: 'text-blue-500' },
  { field: 'hasPool' as keyof FormState, labelKey: 'property.features.pool', label: 'Pool', icon: WavesLadder, color: 'text-cyan-500' },
  { field: 'hasGarden' as keyof FormState, labelKey: 'property.features.garden', label: 'Garden', icon: Flower2, color: 'text-green-500' },
  { field: 'hasAirConditioning' as keyof FormState, labelKey: 'property.create.equip.ac', label: 'Air conditioning', icon: Snowflake, color: 'text-primary-500' },
  { field: 'hasInternet' as keyof FormState, labelKey: 'property.features.internet', label: 'WiFi / Internet', icon: Wifi, color: 'text-indigo-500' },
  { field: 'hasSecurity' as keyof FormState, labelKey: 'property.features.security', label: 'Security', icon: ShieldCheck, color: 'text-red-500' },
  { field: 'hasBalcony' as keyof FormState, labelKey: 'property.create.equip.balcony', label: 'Balcony / Terrace', icon: Balcony, color: 'text-amber-500' },
  { field: 'hasElevator' as keyof FormState, labelKey: 'property.features.elevator', label: 'Elevator', icon: ArrowUpFromLine, color: 'text-violet-500' },
];

// ✅ MAPPING DE L'ENVIRONNEMENT AVEC ICÔNES
const environmentConfig = [
  { field: 'cityCenter' as keyof FormState, labelKey: 'property.create.env.cityCenter', label: 'City center', icon: Landmark, color: 'text-amber-600' },
  { field: 'nearSchool' as keyof FormState, labelKey: 'property.create.env.school', label: 'School nearby', icon: School, color: 'text-blue-600' },
  { field: 'nearUniversity' as keyof FormState, labelKey: 'property.create.env.university', label: 'University nearby', icon: University, color: 'text-purple-600' },
  { field: 'nearMosque' as keyof FormState, labelKey: 'property.create.env.mosque', label: 'Mosque nearby', icon: Mosque, color: 'text-emerald-600' },
  { field: 'nearHospital' as keyof FormState, labelKey: 'property.create.env.hospital', label: 'Hospital nearby', icon: Hospital, color: 'text-red-600' },
  { field: 'nearMarket' as keyof FormState, labelKey: 'property.create.env.market', label: 'Market / Souk', icon: Store, color: 'text-orange-600' },
  { field: 'nearBus' as keyof FormState, labelKey: 'property.create.env.bus', label: 'Bus stop', icon: BusFront, color: 'text-yellow-600' },
  { field: 'nearTram' as keyof FormState, labelKey: 'property.create.env.tram', label: 'Tramway', icon: TramFront, color: 'text-cyan-600' },
  { field: 'nearTrainStation' as keyof FormState, labelKey: 'property.create.env.train', label: 'Train station', icon: TrainFront, color: 'text-slate-600' },
];

// ✅ MAPPING DES VUES ET QUARTIERS AVEC ICÔNES
const areaConfig = [
  { field: 'popularArea' as keyof FormState, labelKey: 'property.create.area.popular', label: 'Popular area', icon: Compass, color: 'text-rose-500' },
  { field: 'modernArea' as keyof FormState, labelKey: 'property.create.area.modern', label: 'Modern area', icon: Building, color: 'text-blue-500' },
  { field: 'quietArea' as keyof FormState, labelKey: 'property.create.area.quiet', label: 'Quiet area', icon: VolumeX, color: 'text-teal-500' },
  { field: 'familyArea' as keyof FormState, labelKey: 'property.create.area.family', label: 'Family area', icon: Baby, color: 'text-pink-500' },
  { field: 'gardenView' as keyof FormState, labelKey: 'property.create.area.gardenView', label: 'Garden view', icon: TreeDeciduous, color: 'text-green-500' },
  { field: 'streetView' as keyof FormState, labelKey: 'property.create.area.streetView', label: 'Street view', icon: MapIcon, color: 'text-slate-500' },
  { field: 'seaView' as keyof FormState, labelKey: 'property.create.area.seaView', label: 'Sea view', icon: SeaIcon, color: 'text-blue-400' },
];

// ✅ MAPPING DES ORIENTATIONS AVEC ICÔNES
const sunDirectionConfig = [
  { value: 'SOUTH', labelKey: 'property.create.south', label: 'South ☀️ Sunny', icon: Sun },
  { value: 'NORTH', labelKey: 'property.create.north', label: 'North ❄️ Cool', icon: Snowflake },
  { value: 'EAST', labelKey: 'property.create.east', label: 'East 🌅 Sunrise', icon: Sunrise },
  { value: 'WEST', labelKey: 'property.create.west', label: 'West 🌇 Sunset', icon: Sunset },
];

// ✅ MAPPING DES MODES DE PAIEMENT AVEC ICÔNES
const paymentConfig = [
  { value: 'BANK_TRANSFER', labelKey: 'property.create.bankTransfer', label: 'Bank transfer', icon: Banknote },
  { value: 'CASH', labelKey: 'property.create.cash', label: 'Cash', icon: Coins },
  { value: 'CARD', labelKey: 'property.create.card', label: 'Credit card', icon: CreditCard },
  { value: 'CHECK', labelKey: 'property.create.check', label: 'Check', icon: FileBadge },
];

// ✅ MAPPING DES CATÉGORIES AVEC ICÔNES
const categoryConfig = [
  { value: 'HOUSE', labelKey: 'property.categories.HOUSE', label: 'House / Villa', icon: Home },
  { value: 'APARTMENT', labelKey: 'property.categories.APARTMENT', label: 'Apartment', icon: Building },
  { value: 'OFFICE', labelKey: 'property.categories.OFFICE', label: 'Office / Coworking', icon: Landmark },
  { value: 'SHOP', labelKey: 'property.categories.SHOP', label: 'Shop / Store', icon: Store },
  { value: 'LAND', labelKey: 'property.categories.LAND', label: 'Land', icon: Mountain },
  { value: 'RIAD', labelKey: 'property.categories.RIAD', label: 'Traditional riad', icon: Crown },
];

// ✅ MAPPING DES ÉTATS AVEC ICÔNES
const conditionConfig = [
  { value: 'NEW', labelKey: 'property.conditions.NEW', label: 'New', icon: BadgeCheck },
  { value: 'GOOD', labelKey: 'property.conditions.GOOD', label: 'Good condition', icon: CheckCircle2 },
  { value: 'RENOVATED', labelKey: 'property.conditions.RENOVATED', label: 'Renovated', icon: RotateCcw },
  { value: 'NEEDS_REPAIR', labelKey: 'property.conditions.NEEDS_REPAIR', label: 'Needs repair', icon: Wrench },
  { value: 'TO_RENOVATE', labelKey: 'property.conditions.TO_RENOVATE', label: 'To renovate', icon: Wrench },
];

interface NumberFieldProps {
  label: string;
  icon: React.ElementType;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  min?: number;
  max?: number;
  required?: boolean;
}

const NumberField: React.FC<NumberFieldProps> = ({ label, icon: Icon, value, onChange, suffix, min, max, required }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative mt-1">
      <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-10 py-2.5 text-slate-900 dark:text-slate-100 focus:border-morocco-gold focus:ring-1 focus:ring-teal-500 outline-none transition"
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">{suffix}</span>
      )}
    </div>
  </div>
);

const CounterField: React.FC<NumberFieldProps> = ({ label, icon: Icon, value, onChange, min = 0, required }) => {
  const val = Number(value) || 0;
  const decrement = () => onChange(String(Math.max(min, val - 1)));
  const increment = () => onChange(String(val + 1));
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex items-center gap-2 mt-1">
        <button type="button" onClick={decrement} className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center justify-center">
          −
        </button>
        <div className="relative flex-1">
          <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="number"
            min={min}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-center text-slate-900 dark:text-slate-100 focus:border-morocco-gold focus:ring-1 focus:ring-teal-500 outline-none transition"
          />
        </div>
        <button type="button" onClick={increment} className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center justify-center">
          +
        </button>
      </div>
    </div>
  );
};

interface ToggleCardProps {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  subLabel?: string;
}

const ToggleCard: React.FC<ToggleCardProps> = ({ active, onClick, icon: Icon, label, subLabel }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition w-full ${
      active
        ? 'border-morocco-gold bg-amber-50/50 dark:bg-amber-900/20 text-teal-700 dark:text-teal-400'
        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700/50'
    }`}
  >
    <div className={`p-2 rounded-lg ${active ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
      <Icon size={20} />
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">{label}</span>
        {active ? <CheckCircle2 size={18} className="text-teal-600" /> : <div className="h-5 w-5 rounded border-2 border-slate-300 dark:border-slate-600" />}
      </div>
      {subLabel && <p className={`text-xs mt-0.5 ${active ? 'text-teal-600/80' : 'text-slate-400'}`}>{subLabel}</p>}
    </div>
  </button>
);

export const CreateProperty: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormState>({
    title: '', description: '', price: '', propertyType: 'RENT', category: 'APARTMENT',
    customCategory: '', city: '', address: '', surface: '', rooms: '', bedrooms: '',
    bathrooms: '', floorNumber: '', totalFloors: '', buildingAge: '', constructionYear: '',
    condition: 'NEW', furnished: false, hasElevator: false, hasParking: false, hasPool: false,
    hasGarden: false, hasAirConditioning: false, hasInternet: false, hasSecurity: false,
    hasBalcony: false, petAllowed: false, cityCenter: false, nearSchool: false,
    nearUniversity: false, nearMosque: false, nearHospital: false, nearMarket: false,
    nearTram: false, nearBus: false, nearTrainStation: false, popularArea: false,
    modernArea: false, quietArea: false, familyArea: false, sunDirection: 'SOUTH',
    gardenView: false, streetView: false, seaView: false, paymentMethod: 'BANK_TRANSFER',
    billingPeriod: 'MONTH', discountPercentage: '', additionalFees: '', latitude: '',
    longitude: '', phoneNumber: '', whatsappNumber: '', firstNameArabic: '', lastNameArabic: '',
    firstNameLatin: '', lastNameLatin: '', cin: '',
  });

  const [images, setImages] = useState<MediaFile[]>([]);
  const [video, setVideo] = useState<MediaFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // États pour la gestion des villes
  const [cityInput, setCityInput] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>(defaultCities);

  // ✅ NOUVEAUX ÉTATS pour le géocodage
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoSuccess, setGeoSuccess] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  // ==================== ✅ BROUILLON LOCAL ====================
  const DRAFT_KEY = 'marocloc-draft-create-property';

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.formData) setFormData(parsed.formData);
      if (parsed.step && parsed.step >= 1 && parsed.step <= 7) setStep(parsed.step);
      if (parsed.cityInput) setCityInput(parsed.cityInput);
      showMessage(t('property.create.draftRestored', 'Brouillon restauré automatiquement'), 'info');
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ formData, step, cityInput }));
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData, step, cityInput]);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleField = (field: keyof FormState) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // ==================== ✅ FONCTION DE GÉOCODAGE AUTOMATIQUE ====================

  /**
   * Récupère les coordonnées GPS via Nominatim (OpenStreetMap)
   * Gratuit, sans clé API, limite de 1 requête/seconde
   */
  const fetchCoordinates = useCallback(async (cityName: string): Promise<GeoCoordinates | null> => {
    if (!cityName.trim()) return null;

    const cacheKey = cityName.toLowerCase().trim();

    // Vérifier le cache d'abord
    if (geoCache.has(cacheKey)) {
      return geoCache.get(cacheKey)!;
    }

    try {
      // Ajouter ", Morocco" pour améliorer la précision
      const searchQuery = encodeURIComponent(`${cityName}, Morocco`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=1&countrycodes=ma`,
        {
          headers: {
            'Accept-Language': 'fr',
            'User-Agent': 'MarocLoc-App/1.0'
          }
        }
      );

      if (!response.ok) throw new Error(t('property.create.networkError', 'Erreur réseau'));

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const coords: GeoCoordinates = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          displayName: result.display_name
        };

        // Stocker dans le cache
        geoCache.set(cacheKey, coords);
        return coords;
      }

      return null;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Geocoding] Error:', error);
      }
      return null;
    }
  }, []);

  /**
   * Géocode la ville et met à jour automatiquement les coordonnées
   */
  const geocodeCity = useCallback(async (cityName: string) => {
    if (!cityName.trim()) {
      updateField('latitude', '');
      updateField('longitude', '');
      setGeoSuccess(false);
      return;
    }

    setIsGeocoding(true);
    setGeoError(null);
    setGeoSuccess(false);

    // Délai pour éviter les appels trop fréquents (rate limiting Nominatim)
    await new Promise(resolve => setTimeout(resolve, 300));

    const coords = await fetchCoordinates(cityName);

    if (coords) {
      updateField('latitude', coords.lat.toString());
      updateField('longitude', coords.lng.toString());
      setGeoSuccess(true);
      setTimeout(() => setGeoSuccess(false), 3000);
    } else {
      setGeoError(t('property.create.geoError', 'Impossible de localiser "{{city}}". Veuillez vérifier le nom ou saisir manuellement les coordonnées.', { city: cityName }));
      // Réinitialiser les coordonnées si la ville n'est pas trouvée
      updateField('latitude', '');
      updateField('longitude', '');
    }

    setIsGeocoding(false);
  }, [fetchCoordinates]);

  // Debounce pour le géocodage automatique
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (cityInput.trim() && !showCitySuggestions) {
        geocodeCity(cityInput);
      }
    }, 800); // Attendre 800ms après la dernière frappe

    return () => clearTimeout(timeoutId);
  }, [cityInput, showCitySuggestions, geocodeCity]);

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      showMessage(t('property.create.videoTypeError', 'Le fichier doit être une vidéo.'), 'error');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      showMessage(t('property.create.videoSizeError', 'La vidéo est trop volumineuse (max 50MB).'), 'error');
      return;
    }
    const url = URL.createObjectURL(file);
    setVideo({ file, url, type: 'video' });
  };

  const removeVideo = () => setVideo(null);

  // ✅ Fonction améliorée pour la gestion des villes avec géocodage
  const handleCityInputChange = (value: string) => {
    setCityInput(value);
    updateField('city', value);
    setGeoError(null);
    setGeoSuccess(false);

    if (value.length > 0) {
      const filtered = availableCities.filter(city =>
        city.toLowerCase().includes(value.toLowerCase())
      );
      setCitySuggestions(filtered);
      setShowCitySuggestions(true);
    } else {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      updateField('latitude', '');
      updateField('longitude', '');
    }
  };

  const selectCity = async (city: string) => {
    setCityInput(city);
    updateField('city', city);
    setShowCitySuggestions(false);
    setGeoError(null);

    // Géocoder immédiatement lors de la sélection
    await geocodeCity(city);
  };

  const addCustomCity = async () => {
    if (cityInput.trim() && !availableCities.includes(cityInput)) {
      setAvailableCities(prev => [...prev, cityInput]);
      await selectCity(cityInput);
      showMessage(t('property.create.cityAdded', 'Ville "{{city}}" ajoutée avec succès', { city: cityInput }), 'success');
    }
  };

  // ✅ Fonction pour rafraîchir manuellement les coordonnées
  const handleRefreshCoordinates = async () => {
    if (!formData.city) {
      // showMessage('Veuillez d'abord saisir une ville', 'error');
        showMessage(t('property.create.enterCityFirst', 'Veuillez d\'abord saisir une ville'), 'error');
      return;
    }
    await geocodeCity(formData.city);
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: string[] = [];
    if (currentStep === 1) {
      if (!formData.title.trim()) newErrors.push(t('property.create.errTitleRequired', 'Titre requis'));
      if (formData.description.length < 50) newErrors.push(t('property.create.errDescMin', 'Description: minimum 50 caractères'));
      if (!formData.price || Number(formData.price) < 1000) newErrors.push(t('property.create.errPriceMin', 'Prix minimum 1000 DH'));
      if (!formData.city) newErrors.push(t('property.create.errCityRequired', 'Ville requise'));
      if (!formData.address) newErrors.push(t('property.create.errAddressRequired', 'Adresse requise'));
    } else if (currentStep === 2) {
      if (!formData.surface || Number(formData.surface) < 40) newErrors.push(t('property.create.errSurfaceMin', 'Surface minimum 40 m²'));
      if (!formData.rooms || Number(formData.rooms) < 1) newErrors.push(t('property.create.errRoomsRequired', 'Nombre de pièces requis'));
    } else if (currentStep === 6) {
      if (!formData.phoneNumber) newErrors.push(t('property.create.errPhoneRequired', 'Téléphone requis'));
      if (!formData.latitude || !formData.longitude) newErrors.push(t('property.create.errGpsRequired', 'Coordonnées GPS requises - Veuillez vérifier la ville saisie'));
    } else if (currentStep === 7) {
      if (images.length < 1) newErrors.push(t('property.create.errImageRequired', 'Au moins 1 image requise'));
      // Video is now optional
      if (!formData.firstNameArabic) newErrors.push(t('property.create.errFirstNameArRequired', 'Prénom arabe requis'));
      if (!formData.lastNameArabic) newErrors.push(t('property.create.errLastNameArRequired', 'Nom arabe requis'));
      if (!formData.firstNameLatin) newErrors.push(t('property.create.errFirstNameLatRequired', 'Prénom latin requis'));
      if (!formData.lastNameLatin) newErrors.push(t('property.create.errLastNameLatRequired', 'Nom latin requis'));
      if (!formData.cin || !/^[A-Z]{1,2}\d{5,8}$/.test(formData.cin)) newErrors.push(t('property.create.errCinInvalid', 'CIN invalide (ex: AB123456)'));
    }
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep(prev => prev + 1);
    else showMessage(t('property.create.fixErrors'), 'error');
  };

  const handlePrevious = () => { setErrors([]); setStep(prev => prev - 1); };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateStep(7)) {
      showMessage(t('property.create.fixErrors', 'Veuillez corriger les erreurs'), 'error');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    if (!user || user.role !== 'PROPRIETAIRE') {
      showMessage(t('property.create.ownerRequired', 'Vous devez être connecté en tant que propriétaire'), 'error');
      setLoading(false);
      navigate('/login');
      return;
    }

    try {
      const propertyObject: any = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        type: formData.propertyType,
        category: formData.category,
        city: formData.city,
        address: formData.address,
        surface: Number(formData.surface),
        rooms: Number(formData.rooms),
        furnished: formData.furnished,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        phoneNumber: formData.phoneNumber,
        firstNameArabic: formData.firstNameArabic,
        lastNameArabic: formData.lastNameArabic,
        firstNameLatin: formData.firstNameLatin,
        lastNameLatin: formData.lastNameLatin,
        cin: formData.cin.toUpperCase(),
        hasElevator: formData.hasElevator,
        hasParking: formData.hasParking,
        hasPool: formData.hasPool,
        hasGarden: formData.hasGarden,
        hasAirConditioning: formData.hasAirConditioning,
        hasInternet: formData.hasInternet,
        hasSecurity: formData.hasSecurity,
        hasBalcony: formData.hasBalcony,
        petAllowed: formData.petAllowed,
        cityCenter: formData.cityCenter,
        nearSchool: formData.nearSchool,
        nearUniversity: formData.nearUniversity,
        nearMosque: formData.nearMosque,
        nearHospital: formData.nearHospital,
        nearMarket: formData.nearMarket,
        nearTram: formData.nearTram,
        nearBus: formData.nearBus,
        nearTrainStation: formData.nearTrainStation,
        popularArea: formData.popularArea,
        modernArea: formData.modernArea,
        quietArea: formData.quietArea,
        familyArea: formData.familyArea,
        gardenView: formData.gardenView,
        streetView: formData.streetView,
        seaView: formData.seaView,
        sunDirection: formData.sunDirection,
        paymentMethod: formData.paymentMethod,
        condition: formData.condition,
      };

      if (formData.bedrooms) propertyObject.bedrooms = Number(formData.bedrooms);
      if (formData.bathrooms) propertyObject.bathrooms = Number(formData.bathrooms);
      if (formData.floorNumber) propertyObject.floorNumber = Number(formData.floorNumber);
      if (formData.totalFloors) propertyObject.totalFloors = Number(formData.totalFloors);
      if (formData.constructionYear) propertyObject.constructionYear = Number(formData.constructionYear);
      if (formData.discountPercentage) propertyObject.discountPercentage = Number(formData.discountPercentage);
      if (formData.additionalFees) propertyObject.additionalFees = Number(formData.additionalFees);
      if (formData.whatsappNumber) propertyObject.whatsappNumber = formData.whatsappNumber;
      if (formData.customCategory) propertyObject.customCategory = formData.customCategory;

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 300);

      const formDataToSend = new FormData();
      formDataToSend.append('property', new Blob([JSON.stringify(propertyObject)], { type: 'application/json' }));
      images.forEach(img => formDataToSend.append('images', img.file));
      if (video) formDataToSend.append('video', video.file);

      try {
        await propertyApi.create(formDataToSend);
        setUploadProgress(100);
      } finally {
        clearInterval(progressInterval);
      }

      localStorage.removeItem(DRAFT_KEY);
      showMessage(t('property.create.success'), 'success');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Erreur:', error);
      }
      if (error.response?.data?.fieldErrors) {
        const errorMessages = Object.values(error.response.data.fieldErrors).flat() as string[];
        setErrors(errorMessages);
        showMessage(t('property.create.validationErrors', 'Erreurs de validation'), 'error');
      } else {
        showMessage(error.response?.data?.message || t('property.create.error'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) navigate('/login');
    else if (user.role !== 'PROPRIETAIRE') navigate('/dashboard');
  }, [user, navigate]);

  // ✅ Fixed blob URL leak: only revoke URLs of removed items, not all on every change
  const prevImagesRef = useRef<MediaFile[]>([]);
  const prevVideoRef = useRef<MediaFile | null>(null);

  useEffect(() => {
    // Revoke URLs that are no longer in the current state
    const currentImageUrls = new Set(images.map(img => img.url));
    prevImagesRef.current.forEach(img => {
      if (!currentImageUrls.has(img.url)) {
        URL.revokeObjectURL(img.url);
      }
    });
    prevImagesRef.current = images;

    if (prevVideoRef.current && (!video || prevVideoRef.current.url !== video.url)) {
      URL.revokeObjectURL(prevVideoRef.current.url);
    }
    prevVideoRef.current = video;
  }, [images, video]);

  const progressWidth = `${(step / 7) * 100}%`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg border border-morocco-gold/15">
          <div className="flex items-center gap-3 mb-2">
            <Crown size={28} className="text-amber-500" />
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">{t('property.create.title')}</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400">{t('property.create.subtitle')}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {steps.map((s) => (
              <button
                key={s.id}
                onClick={() => { if (s.id <= step) { setErrors([]); setStep(s.id); } }}
                disabled={s.id > step}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  s.id === step
                    ? 'bg-teal-600 text-white shadow-md'
                    : s.id < step
                    ? 'bg-teal-600/20 text-teal-600'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                }`}
              >
                {s.id < step ? <Check size={14} /> : <s.icon size={14} />}
                <span className="hidden sm:inline">{t(s.titleKey)}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-gradient-to-r from-morocco-royal to-morocco-emerald transition-all duration-500" style={{ width: progressWidth }} />
          </div>
        </div>

        {message && (
          <div className={`mb-6 rounded-xl border p-4 ${
            message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' :
            message.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-primary-200 bg-primary-50 text-primary-800'
          }`}>
            {message.text}
          </div>
        )}

        {errors.length > 0 && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-800">{t('property.create.errorsTitle')}</p>
            <ul className="mt-2 list-disc pl-5">
              {errors.map((err, i) => <li key={i} className="text-sm text-red-700">{err}</li>)}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1 - Informations */}
          {step === 1 && (
            <div className="space-y-5 rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <FileText size={20} className="text-amber-500" />
                {t('property.create.step.info')}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('property.create.titleLabel')} *</label>
                  <input type="text" value={formData.title} onChange={e => updateField('title', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 focus:border-morocco-gold focus:ring-1 focus:ring-teal-500 outline-none transition" placeholder={t('property.create.titlePlaceholder', 'Ex: Villa moderne avec piscine')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('property.create.price')} *</label>
                  <input type="number" value={formData.price} onChange={e => updateField('price', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 focus:border-morocco-gold focus:ring-1 focus:ring-teal-500 outline-none transition" placeholder="1500000" />
                  <div className="mt-3">
                    <AIPricingSuggestion
                      propertyData={{
                        city: formData.city,
                        category: formData.category,
                        propertyType: formData.propertyType,
                        surface: Number(formData.surface) || 0,
                        rooms: Number(formData.rooms) || 0,
                        bedrooms: Number(formData.bedrooms) || undefined,
                        bathrooms: Number(formData.bathrooms) || undefined,
                        furnished: formData.furnished,
                        hasParking: formData.hasParking,
                        hasPool: formData.hasPool,
                        hasGarden: formData.hasGarden,
                        hasAirConditioning: formData.hasAirConditioning,
                        hasElevator: formData.hasElevator,
                        cityCenter: formData.cityCenter,
                        nearTram: formData.nearTram,
                        seaView: formData.seaView,
                        condition: formData.condition,
                        buildingAge: Number(formData.buildingAge) || undefined,
                      }}
                      currentPrice={Number(formData.price) || undefined}
                      onPriceSuggested={(price) => updateField('price', price.toString())}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('common.description')} *</label>
                <textarea rows={4} value={formData.description} onChange={e => updateField('description', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 focus:border-morocco-gold focus:ring-1 focus:ring-teal-500 outline-none transition" placeholder={t('property.create.descPlaceholder', 'Décrivez votre propriété en détails (min 50 caractères)')} />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formData.description.length} / 50 caractères minimum</p>
                <div className="mt-3">
                  <AIDescriptionGenerator
                    propertyData={{
                      title: formData.title,
                      city: formData.city,
                      category: formData.category,
                      propertyType: formData.propertyType,
                      surface: Number(formData.surface) || 0,
                      rooms: Number(formData.rooms) || 0,
                      bedrooms: Number(formData.bedrooms) || undefined,
                      bathrooms: Number(formData.bathrooms) || undefined,
                      furnished: formData.furnished,
                      hasParking: formData.hasParking,
                      hasPool: formData.hasPool,
                      hasGarden: formData.hasGarden,
                      hasAirConditioning: formData.hasAirConditioning,
                      hasInternet: formData.hasInternet,
                      hasSecurity: formData.hasSecurity,
                      hasBalcony: formData.hasBalcony,
                      hasElevator: formData.hasElevator,
                      cityCenter: formData.cityCenter,
                      nearSchool: formData.nearSchool,
                      nearUniversity: formData.nearUniversity,
                      nearMosque: formData.nearMosque,
                      nearHospital: formData.nearHospital,
                      nearTram: formData.nearTram,
                      nearBus: formData.nearBus,
                      nearTrainStation: formData.nearTrainStation,
                      seaView: formData.seaView,
                      gardenView: formData.gardenView,
                      quietArea: formData.quietArea,
                      familyArea: formData.familyArea,
                      modernArea: formData.modernArea,
                    }}
                    onDescriptionGenerated={(desc) => updateField('description', desc)}
                    currentDescription={formData.description}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('property.create.propertyType')} *</label>
                  <select value={formData.propertyType} onChange={e => updateField('propertyType', e.target.value as PropertyType)} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3">
                    <option value="RENT">{t('property.types.RENT')}</option>
                    <option value="BUY">{t('property.types.BUY')}</option>
                    <option value="MORTGAGE">{t('property.types.MORTGAGE')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('common.category')} *</label>
                  <select value={formData.category} onChange={e => updateField('category', e.target.value as PropertyCategory)} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3">
                    <option value="HOUSE">{t('property.categories.HOUSE')}</option>
                    <option value="APARTMENT">{t('property.categories.APARTMENT')}</option>
                    <option value="OFFICE">{t('property.categories.OFFICE')}</option>
                    <option value="SHOP">{t('property.categories.SHOP')}</option>
                    <option value="LAND">{t('property.categories.LAND')}</option>
                    <option value="RIAD">{t('property.categories.RIAD')}</option>
                    <option value="CAFE">{t('property.categories.CAFE')}</option>
                    <option value="GYM">{t('property.categories.GYM')}</option>
                    <option value="OTHER">{t('property.categories.OTHER')}</option>
                  </select>
                </div>
              </div>

              {/* ✅ SECTION VILLE AVEC GÉOCODAGE AUTOMATIQUE */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('common.city')} *</label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      value={cityInput}
                      onChange={(e) => handleCityInputChange(e.target.value)}
                      onFocus={() => cityInput.length > 0 && setShowCitySuggestions(true)}
                      onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                      placeholder={t('property.create.cityPlaceholder', 'Recherchez ou saisissez une ville...')}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-10 pr-10 py-3 focus:border-morocco-gold focus:ring-1 focus:ring-teal-500 outline-none transition"
                    />

                    {/* Indicateur de géocodage */}
                    {isGeocoding && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500 animate-spin" />
                    )}
                    {geoSuccess && !isGeocoding && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
                    )}

                    {showCitySuggestions && citySuggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
                        {citySuggestions.map(city => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => selectCity(city)}
                            className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-amber-50/30 transition flex items-center gap-2"
                          >
                            <MapPin size={14} className="text-amber-500" />
                            {city}
                          </button>
                        ))}
                      </div>
                    )}

                    {showCitySuggestions && cityInput && citySuggestions.length === 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-center shadow-lg">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t('property.create.noCityFound', 'Aucune ville trouvée pour "{{city}}"', { city: cityInput })}</p>
                        <button
                          type="button"
                          onClick={addCustomCity}
                          className="mt-2 text-sm text-teal-600 hover:underline flex items-center justify-center gap-1"
                        >
                          <Plus size={14} />
                          {t('property.create.addCity', 'Ajouter "{{city}}"', { city: cityInput })}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Messages de statut du géocodage */}
                  {geoError && (
                    <div className="mt-2 flex items-start gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-lg">
                      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                      <span>{geoError}</span>
                    </div>
                  )}
                  {geoSuccess && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-emerald-600">
                      <CheckCircle2 size={16} />
                      <span>{t('property.create.gpsSuccess', 'Coordonnées GPS récupérées automatiquement')}</span>
                    </div>
                  )}

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {t('property.create.gpsHint', '💡 Les coordonnées GPS se mettent à jour automatiquement')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('property.create.address')} *</label>
                  <input type="text" value={formData.address} onChange={e => updateField('address', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3" placeholder={t('property.create.addressPlaceholder', 'Ex: Boulevard Zerktouni')} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 à 5 (identique) */}
          {step === 2 && (
            <div className="space-y-6 rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600">
                  <Maximize size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-slate-50">{t('property.create.step.features')}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('property.create.featuresHint', 'Renseignez les détails essentiels du bien.')}</p>
                </div>
              </div>

              {/* Dimensions & capacité */}
              <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 p-4 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Maximize size={16} /> {t('property.create.features.dimensions', 'Dimensions & capacité')}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <NumberField label={t('property.create.surface')} icon={Maximize} value={formData.surface} onChange={v => updateField('surface', v)} suffix="m²" min={40} required />
                  <CounterField label={t('common.rooms')} icon={Layers} value={formData.rooms} onChange={v => updateField('rooms', v)} min={0} required />
                  <CounterField label={t('common.bedrooms')} icon={Bed} value={formData.bedrooms} onChange={v => updateField('bedrooms', v)} min={0} />
                  <CounterField label={t('common.bathrooms')} icon={Bath} value={formData.bathrooms} onChange={v => updateField('bathrooms', v)} min={0} />
                </div>
              </div>

              {/* Étage & construction */}
              <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 p-4 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Building size={16} /> {t('property.create.features.building', 'Étage & construction')}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <NumberField label={t('property.create.floorNumber', 'Étage')} icon={Layers} value={formData.floorNumber} onChange={v => updateField('floorNumber', v)} min={0} />
                  <NumberField label={t('property.create.totalFloors', "Nombre total d'étages")} icon={Building} value={formData.totalFloors} onChange={v => updateField('totalFloors', v)} min={0} />
                  <NumberField label={t('common.constructionYear')} icon={Calendar} value={formData.constructionYear} onChange={v => updateField('constructionYear', v)} min={1800} max={new Date().getFullYear() + 2} />
                  <NumberField label={t('property.create.buildingAge', 'Âge du bâtiment')} icon={Home} value={formData.buildingAge} onChange={v => updateField('buildingAge', v)} min={0} suffix="ans" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('common.condition')}</label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {conditionConfig.map((cfg) => {
                      const IconComponent = cfg.icon;
                      const isActive = formData.condition === cfg.value;
                      return (
                        <button
                          key={cfg.value}
                          type="button"
                          onClick={() => updateField('condition', cfg.value as PropertyCondition)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition ${
                            isActive
                              ? 'border-morocco-gold bg-amber-50/50 dark:bg-amber-900/20 text-teal-700 dark:text-teal-400'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <IconComponent size={16} className={isActive ? 'text-amber-500' : 'text-slate-400'} />
                          {t(cfg.labelKey, cfg.label)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Options de location */}
              <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 p-4 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Sofa size={16} /> {t('property.create.features.rentalOptions', 'Options de location')}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ToggleCard
                    active={formData.furnished}
                    onClick={() => toggleField('furnished')}
                    icon={Sofa}
                    label={t('common.furnished')}
                    subLabel={t('property.create.furnishedHint', 'Logement équipé de mobilier')}
                  />
                  <ToggleCard
                    active={formData.petAllowed}
                    onClick={() => toggleField('petAllowed')}
                    icon={PawPrint}
                    label={t('property.create.petAllowed', 'Animaux acceptés')}
                    subLabel={t('property.create.petAllowedHint', 'Les locataires peuvent avoir des animaux')}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <CheckSquare size={20} className="text-amber-500" />
                {t('property.create.step.equipments')}
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {equipmentConfig.map((cfg) => {
                  const IconComponent = cfg.icon;
                  const isActive = formData[cfg.field] as boolean;
                  return (
                    <button
                      key={cfg.field}
                      type="button"
                      onClick={() => toggleField(cfg.field)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition ${
                        isActive
                          ? 'border-morocco-gold bg-amber-50/30 dark:bg-amber-900/20 text-teal-600 dark:text-teal-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      {isActive ? <CheckCircle2 size={16} className={cfg.color} /> : <IconComponent size={16} className="text-slate-400 dark:text-slate-500" />}
                      <span className="text-sm font-medium">{t(cfg.labelKey, cfg.label)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5 rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <MapPin size={20} className="text-amber-500" />
                {t('property.create.step.environment')}
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {environmentConfig.map((cfg) => {
                  const IconComponent = cfg.icon;
                  const isActive = formData[cfg.field] as boolean;
                  return (
                    <button
                      key={cfg.field}
                      type="button"
                      onClick={() => toggleField(cfg.field)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition ${
                        isActive
                          ? 'border-morocco-gold bg-amber-50/30 dark:bg-amber-900/20 text-teal-600 dark:text-teal-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      {isActive ? <CheckCircle2 size={16} className={cfg.color} /> : <IconComponent size={16} className="text-slate-400 dark:text-slate-500" />}
                      <span className="text-sm font-medium">{t(cfg.labelKey, cfg.label)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5 rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <Eye size={20} className="text-amber-500" />
                {t('property.create.step.views')}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {areaConfig.map((cfg) => {
                  const IconComponent = cfg.icon;
                  const isActive = formData[cfg.field] as boolean;
                  return (
                    <button
                      key={cfg.field}
                      type="button"
                      onClick={() => toggleField(cfg.field)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition ${
                        isActive
                          ? 'border-morocco-gold bg-amber-50/30 dark:bg-amber-900/20 text-teal-600 dark:text-teal-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      {isActive ? <CheckCircle2 size={16} className={cfg.color} /> : <IconComponent size={16} className="text-slate-400 dark:text-slate-500" />}
                      <span className="text-sm font-medium">{t(cfg.labelKey, cfg.label)}</span>
                    </button>
                  );
                })}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('property.create.orientation', 'Orientation')}</label>
                <select value={formData.sunDirection} onChange={e => updateField('sunDirection', e.target.value as SunDirection)} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3">
                  {sunDirectionConfig.map((cfg) => (
                    <option key={cfg.value} value={cfg.value}>{t(cfg.labelKey, cfg.label)}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 6 - Paiement avec coordonnées GPS améliorées */}
          {step === 6 && (
            <div className="space-y-5 rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <DollarSign size={20} className="text-amber-500" />
                {t('property.create.step.payment')}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('property.create.paymentMethod', 'Mode de paiement')}</label>
                  <select value={formData.paymentMethod} onChange={e => updateField('paymentMethod', e.target.value as PaymentMethod)} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3">
                    <option value="BANK_TRANSFER">{t('property.create.bankTransfer', 'Virement bancaire')}</option>
                    <option value="CASH">{t('property.create.cash', 'Espèces')}</option>
                    <option value="CARD">{t('property.create.card', 'Carte bancaire')}</option>
                    <option value="CHECK">{t('property.create.check', 'Chèque')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('property.create.discount', 'Remise (%)')}</label>
                  <input type="number" min="0" max="50" value={formData.discountPercentage} onChange={e => updateField('discountPercentage', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('property.create.phoneNumber')} *</label>
                  <input type="tel" value={formData.phoneNumber} onChange={e => updateField('phoneNumber', e.target.value)} placeholder={t('property.create.phonePlaceholder')} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('property.create.whatsappNumber')}</label>
                  <input type="tel" value={formData.whatsappNumber} onChange={e => updateField('whatsappNumber', e.target.value)} placeholder={t('property.create.phonePlaceholder')} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3" />
                </div>
              </div>

              {/* ✅ SECTION COORDONNÉES GPS AVEC CARTE */}
              <div className="rounded-xl border-2 border-morocco-gold/20 bg-gradient-to-r from-morocco-beige/20 to-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={20} className="text-amber-500" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-50">{t('property.create.mapLocation', 'Localisation sur carte')}</h3>
                  {isGeocoding && (
                    <span className="text-xs text-amber-500 animate-pulse">{t('property.create.geocoding', 'Récupération en cours...')}</span>
                  )}
                </div>

                <MapPicker
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  city={formData.city}
                  onLocationChange={(lat, lng) => {
                    updateField('latitude', lat.toString());
                    updateField('longitude', lng.toString());
                  }}
                  className="mb-4"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('property.create.latitude')} *</label>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        value={formData.latitude}
                        onChange={e => updateField('latitude', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 pr-10"
                        placeholder="33.5731"
                      />
                      {formData.latitude && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('property.create.longitude')} *</label>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        value={formData.longitude}
                        onChange={e => updateField('longitude', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 pr-10"
                        placeholder="-7.5898"
                      />
                      {formData.longitude && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleRefreshCoordinates}
                    disabled={isGeocoding || !formData.city}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm hover:bg-teal-600/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Navigation size={16} />
                    {isGeocoding ? t('property.create.geocodingBtn', 'Géocodage...') : t('property.create.refreshCoords', 'Rafraîchir les coordonnées')}
                  </button>

                  {formData.city && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t('property.create.basedOn', 'Basé sur :')} <span className="font-medium text-slate-900 dark:text-slate-50">{formData.city}</span>
                    </span>
                  )}
                </div>

                {!formData.latitude && !formData.longitude && formData.city && !isGeocoding && (
                  <div className="mt-2 text-sm text-amber-600 flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>{t('property.create.gpsManual', 'Les coordonnées n\'ont pas pu être récupérées automatiquement. Cliquez sur la carte ou saisissez manuellement.')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-6 rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <Image size={20} className="text-amber-500" />
                {t('property.create.step.media')}
              </h2>

              <ImageDropZone images={images} onImagesChange={setImages} maxImages={10} />

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('property.create.videoOptional', 'Vidéo (optionnel)')}</label>
                <label className="block cursor-pointer rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 p-6 text-center hover:border-morocco-gold transition">
                  <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                  <Video className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-500" />
                  <span className="mt-2 block text-sm text-slate-500 dark:text-slate-400">{video ? video.file.name : t('property.create.videoHint')}</span>
                </label>
                {video && (
                  <button type="button" onClick={removeVideo} className="mt-2 text-sm text-red-500">{t('common.delete')}</button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('property.create.firstNameArabic', 'Prénom (Arabe)')} *</label><input type="text" value={formData.firstNameArabic} onChange={e => updateField('firstNameArabic', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('property.create.lastNameArabic', 'Nom (Arabe)')} *</label><input type="text" value={formData.lastNameArabic} onChange={e => updateField('lastNameArabic', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('property.create.firstNameLatin', 'Prénom (Latin)')} *</label><input type="text" value={formData.firstNameLatin} onChange={e => updateField('firstNameLatin', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('property.create.lastNameLatin', 'Nom (Latin)')} *</label><input type="text" value={formData.lastNameLatin} onChange={e => updateField('lastNameLatin', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('property.create.cin', 'CIN')} *</label><input type="text" value={formData.cin} onChange={e => updateField('cin', e.target.value.toUpperCase())} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3" placeholder="AB123456" /></div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-3">
            {step > 1 && (
              <button type="button" onClick={handlePrevious} className="px-6 py-3 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900 transition font-medium">
                <ArrowLeft className="inline mr-2" size={16} />{t('common.previous')}
              </button>
            )}
            {step < 7 && (
              <button type="button" onClick={handleNext} className="px-6 py-3 rounded-full bg-teal-600 text-white font-medium hover:bg-teal-600/80 transition ml-auto">
                {t('common.next')}<ArrowRight className="inline ml-2" size={16} />
              </button>
            )}
            {step === 7 && (
              <button type="submit" disabled={loading} className="px-8 py-3 rounded-full bg-gradient-to-r from-morocco-royal to-morocco-emerald text-white font-bold hover:opacity-90 transition ml-auto flex items-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                {loading ? t('property.create.publishing', 'Publication {{progress}}%', { progress: uploadProgress }) : t('property.create.submit')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProperty;
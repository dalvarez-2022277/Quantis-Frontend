import {
  WalletIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  ShoppingCartIcon,
  TruckIcon,
  HomeIcon,
  HeartIcon,
  MusicalNoteIcon,
  AcademicCapIcon,
  TagIcon,
  EllipsisHorizontalCircleIcon,
  BanknotesIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CakeIcon,
  CameraIcon,
  CreditCardIcon,
  GiftIcon,
  LightBulbIcon,
  MapPinIcon,
  NewspaperIcon,
  PaintBrushIcon,
  PhoneIcon,
  ReceiptPercentIcon,
  RocketLaunchIcon,
  ShoppingBagIcon,
  StarIcon,
  TicketIcon,
  UserIcon,
  VideoCameraIcon,
  BookOpenIcon,
  ChartBarIcon,
  ClockIcon,
  FireIcon,
  GlobeAltIcon,
  IdentificationIcon,
  KeyIcon,
  LinkIcon,
  MegaphoneIcon,
  Square2StackIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

// Mapa centralizado de iconos disponibles para tipos/categorías
export const ICON_COMPONENTS = {
  WalletIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  ShoppingCartIcon,
  TruckIcon,
  HomeIcon,
  HeartIcon,
  MusicalNoteIcon,
  AcademicCapIcon,
  TagIcon,
  EllipsisHorizontalCircleIcon,
  BanknotesIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CakeIcon,
  CameraIcon,
  CreditCardIcon,
  GiftIcon,
  LightBulbIcon,
  MapPinIcon,
  NewspaperIcon,
  PaintBrushIcon,
  PhoneIcon,
  ReceiptPercentIcon,
  RocketLaunchIcon,
  ShoppingBagIcon,
  StarIcon,
  TicketIcon,
  UserIcon,
  VideoCameraIcon,
  BookOpenIcon,
  ChartBarIcon,
  ClockIcon,
  FireIcon,
  GlobeAltIcon,
  IdentificationIcon,
  KeyIcon,
  LinkIcon,
  MegaphoneIcon,
  Square2StackIcon,
  WrenchScrewdriverIcon
};

// Lista de iconKeys para el selector al crear tipo/categoría personalizado (orden amigable)
export const ICON_KEYS_FOR_PICKER = [
  'WalletIcon',
  'CurrencyDollarIcon',
  'BanknotesIcon',
  'CreditCardIcon',
  'ArrowTrendingUpIcon',
  'ReceiptPercentIcon',
  'SparklesIcon',
  'GiftIcon',
  'BriefcaseIcon',
  'RocketLaunchIcon',
  'ShoppingCartIcon',
  'ShoppingBagIcon',
  'HomeIcon',
  'TruckIcon',
  'HeartIcon',
  'AcademicCapIcon',
  'MusicalNoteIcon',
  'TagIcon',
  'CakeIcon',
  'CameraIcon',
  'VideoCameraIcon',
  'PhoneIcon',
  'BookOpenIcon',
  'LightBulbIcon',
  'StarIcon',
  'TicketIcon',
  'MapPinIcon',
  'GlobeAltIcon',
  'UserIcon',
  'ChartBarIcon',
  'ClockIcon',
  'FireIcon',
  'PaintBrushIcon',
  'NewspaperIcon',
  'IdentificationIcon',
  'KeyIcon',
  'LinkIcon',
  'MegaphoneIcon',
  'Square2StackIcon',
  'WrenchScrewdriverIcon',
  'EllipsisHorizontalCircleIcon',
  'BuildingOfficeIcon'
];

// Devuelve el componente de icono correspondiente o un fallback
export const getIconComponent = (iconKey, fallback) => {
  if (iconKey && ICON_COMPONENTS[iconKey]) {
    return ICON_COMPONENTS[iconKey];
  }
  if (fallback) return fallback;
  return WalletIcon;
};

// Valida que un iconKey exista en el registro; si no, devuelve el por defecto
export const normalizeIconKey = (iconKey, defaultKey = 'WalletIcon') => {
  if (iconKey && ICON_COMPONENTS[iconKey]) return iconKey;
  return defaultKey;
};

// Listas por defecto: 3 en cada modal; el 4.º en UI es "Nuevo tipo" (ambos modales)
export const DEFAULT_INGRESO_TYPES = [
  { slug: 'quincena', label: 'Quincena', iconKey: 'WalletIcon' },
  { slug: 'fin_mes', label: 'Fin de Mes', iconKey: 'CurrencyDollarIcon' },
  { slug: 'comision', label: 'Comisión', iconKey: 'ArrowTrendingUpIcon' }
];

export const DEFAULT_GASTO_CATEGORIES = [
  { slug: 'alimentacion', label: 'Alimentación', iconKey: 'ShoppingCartIcon' },
  { slug: 'transporte', label: 'Transporte', iconKey: 'TruckIcon' },
  { slug: 'otros', label: 'Otros', iconKey: 'EllipsisHorizontalCircleIcon' }
];

// Slug por defecto para categoría de gasto (fallback al eliminar o resetear)
export const DEFAULT_GASTO_CATEGORY_SLUG = 'alimentacion';


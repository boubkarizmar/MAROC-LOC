// src/utils/imageUtils.ts

const ASSET_BASE_URL =
  import.meta.env.VITE_ASSET_BASE_URL ||
  (import.meta.env.VITE_API_BASE_URL as string | undefined)
    ?.replace(/\/api\/?$/, '') ||
  '';

/**
 * Normalise une URL média retournée par le backend.
 * Le backend sert les fichiers uploadés sous `/api/uploads/**`
 * (context-path `/api`), donc les chemins `/uploads/...` doivent être
 * préfixés par `/api/uploads/`.
 */
export const fixMediaUrl = (url: string | undefined | null): string => {
  if (!url || url === '') return '';

  const trimmed = url.trim();

  // URL absolue ou inline data : on la garde telle quelle
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  let fixed = trimmed;

  // Nettoyage des doubles slashes accidentels
  fixed = fixed.replaceAll('//uploads/', '/uploads/');

  // Normalise les anciens chemins vidéo vers le dossier uploads
  if (fixed.startsWith('/api/videos/')) {
    fixed = fixed.replace('/api/videos/', '/api/uploads/videos/');
  }

  // Déjà au bon format relatif
  if (fixed.startsWith('/api/uploads/')) {
    return ASSET_BASE_URL ? `${ASSET_BASE_URL.replace(/\/$/, '')}${fixed}` : fixed;
  }

  // Convertit /uploads/... en /api/uploads/...
  if (fixed.startsWith('/uploads/')) {
    fixed = `/api${fixed}`;
    return ASSET_BASE_URL ? `${ASSET_BASE_URL.replace(/\/$/, '')}${fixed}` : fixed;
  }

  // Fichier nu
  if (!fixed.startsWith('/')) {
    fixed = `/api/uploads/${fixed}`;
    return ASSET_BASE_URL ? `${ASSET_BASE_URL.replace(/\/$/, '')}${fixed}` : fixed;
  }

  // Autre chemin relatif
  return ASSET_BASE_URL ? `${ASSET_BASE_URL.replace(/\/$/, '')}${fixed}` : fixed;
};

// Alias pour compatibilité
export const fixImageUrl = fixMediaUrl;

// Récupère la première image d'une propriété
export const getFirstImage = (property: any): string => {
  if (!property) return '/images/no-image.svg';

  if (property.images && Array.isArray(property.images) && property.images.length > 0) {
    const firstImage = property.images[0];
    if (firstImage && typeof firstImage === 'string' && firstImage.trim() !== '') {
      return fixMediaUrl(firstImage) || '/images/no-image.svg';
    }
  }

  if (property.imageUrl && typeof property.imageUrl === 'string' && property.imageUrl.trim() !== '') {
    return fixMediaUrl(property.imageUrl) || '/images/no-image.svg';
  }

  return '/images/no-image.svg';
};

// Récupère la vidéo d'une propriété
export const getVideoUrl = (property: any): string | null => {
  if (!property) return null;

  if (property.videoTour && typeof property.videoTour === 'string' && property.videoTour.trim() !== '') {
    const fixed = fixMediaUrl(property.videoTour);
    if (import.meta.env.DEV) {
      console.log('🎬 Video URL fixée:', fixed);
    }
    return fixed;
  }

  return null;
};

// Récupère toutes les images d'une propriété
export const getAllImages = (property: any): string[] => {
  if (!property) return [];

  if (property.images && Array.isArray(property.images)) {
    return property.images
      .filter((img: string) => img && typeof img === 'string' && img.trim() !== '')
      .map((img: string) => fixMediaUrl(img))
      .filter(Boolean);
  }

  return [];
};

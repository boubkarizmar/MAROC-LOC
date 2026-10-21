import React, { useCallback, useRef, useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import {
  Upload,
  X,
  GripVertical,
  Star,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface MediaFile {
  file: File;
  url: string;
  type: 'image' | 'video';
  isPrimary?: boolean;
}

interface ImageDropZoneProps {
  images: MediaFile[];
  onImagesChange: (images: MediaFile[]) => void;
  maxImages?: number;
  maxFileSizeMB?: number;
  className?: string;
}

export const ImageDropZone: React.FC<ImageDropZoneProps> = ({
  images,
  onImagesChange,
  maxImages = 10,
  maxFileSizeMB = 5,
  className = '',
}) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<Record<string, number>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const processFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const newImages: MediaFile[] = [];
    const remainingSlots = maxImages - images.length;

    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      if (file.size > maxFileSizeMB * 1024 * 1024) {
        setCompressionProgress(prev => ({ ...prev, [file.name]: -1 }));
        continue;
      }
      setCompressionProgress(prev => ({ ...prev, [file.name]: 0 }));
      const url = URL.createObjectURL(file);
      newImages.push({
        file,
        url,
        type: 'image',
        isPrimary: images.length === 0 && newImages.length === 0,
      });
      setCompressionProgress(prev => ({ ...prev, [file.name]: 100 }));
    }
    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }
    setTimeout(() => setCompressionProgress({}), 2000);
  }, [images, maxImages, maxFileSizeMB, onImagesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    e.target.value = '';
  }, [processFiles]);

  const removeImage = useCallback((index: number) => {
    const removed = images[index];
    const newImages = images.filter((_, i) => i !== index);
    if (removed?.url) URL.revokeObjectURL(removed.url);
    if (newImages.length > 0 && !newImages.some(img => img.isPrimary)) {
      newImages[0] = { ...newImages[0], isPrimary: true };
    }
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  const setPrimary = useCallback((index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  const handleReorder = useCallback((newOrder: MediaFile[]) => {
    onImagesChange(newOrder);
  }, [onImagesChange]);

  return (
    <div className={className}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center
          transition-all duration-300 ease-out
          ${isDragging
            ? 'border-morocco-gold bg-amber-50/40 dark:bg-amber-900/15 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-800/40 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-100/80 dark:hover:bg-slate-700/30'
          }
          ${images.length >= maxImages ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={images.length >= maxImages}
        />
        <div className={`transition-transform duration-300 ${isDragging ? 'scale-110' : 'scale-100'}`}>
          <Upload className={`mx-auto h-8 w-8 ${isDragging ? 'text-morocco-gold' : 'text-slate-400 dark:text-slate-500'}`} />
        </div>
        <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
          {isDragging
            ? t('property.create.dropImages', 'Déposez les images ici')
            : t('property.create.dragOrClick', 'Glissez-déposez ou cliquez pour ajouter')}
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          JPG, PNG, WebP • {t('property.create.max', 'Max')} {maxFileSizeMB}MB • {images.length}/{maxImages} {t('property.create.images', 'images')}
        </p>
      </div>

      {images.length > 0 && (
        <Reorder.Group
          axis="y"
          values={images}
          onReorder={handleReorder}
          className="mt-4 space-y-2"
        >
          <>
            {images.map((image, index) => (
              <Reorder.Item
                key={image.url}
                value={image}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="cursor-grab active:cursor-grabbing p-1 text-slate-400 dark:text-slate-500">
                  <GripVertical size={16} />
                </div>
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                  <img src={image.url} alt={`Property ${index + 1}`} className="h-full w-full object-cover" />
                  {image.isPrimary && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Star size={14} className="text-amber-400 fill-amber-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{image.file.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{(image.file.size / 1024 / 1024).toFixed(2)} MB</p>
                  {compressionProgress[image.file.name] !== undefined && (
                    <div className="mt-1 flex items-center gap-1 text-xs">
                      {compressionProgress[image.file.name] === -1 ? (
                        <span className="text-red-500 flex items-center gap-1">
                          <AlertCircle size={12} /> {t('property.create.tooLarge', 'Trop volumineux')}
                        </span>
                      ) : compressionProgress[image.file.name] === 100 ? (
                        <span className="text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 size={12} /> {t('property.create.ready', 'Prêt')}
                        </span>
                      ) : (
                        <span className="text-amber-500 flex items-center gap-1">
                          <Loader2 size={12} className="animate-spin" /> {t('property.create.processing', 'Traitement...')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {!image.isPrimary && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPrimary(index); }}
                      className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition"
                      title={t('property.create.setPrimary', 'Définir comme principale')}
                    >
                      <Star size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                    className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    title={t('common.delete')}
                  >
                    <X size={16} />
                  </button>
                </div>
              </Reorder.Item>
            ))}
          </>
        </Reorder.Group>
      )}

      {images.length > 1 && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <Star size={12} className="text-amber-500" />
          {t('property.create.primaryHint', "L'image avec l'étoile est la photo principale. Faites glisser pour réorganiser.")}
        </p>
      )}
    </div>
  );
};

'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  X,
  Image as ImageIcon,
  Check,
  Loader2,
  Camera,
} from 'lucide-react';

interface AvatarUploadProps {
  division: 'male' | 'female';
  onUpload: (url: string) => void;
  previewUrl?: string | null;
  onClear?: () => void;
  autoLoaded?: boolean; // true when avatar was auto-filled from existing user
}

export function AvatarUpload({ division, onUpload, previewUrl, onClear, autoLoaded = false }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMale = division === 'male';
  const accentColor = isMale ? 'amber' : 'violet';
  const gradientFrom = isMale ? 'from-amber-500/15' : 'from-violet-500/15';
  const gradientTo = isMale ? 'to-orange-500/5' : 'to-purple-500/5';
  const borderColor = isMale ? 'border-amber-500/20' : 'border-violet-500/20';
  const iconColor = isMale ? 'text-amber-400' : 'text-violet-400';
  const ringColor = isMale ? 'ring-amber-400/40' : 'ring-violet-400/40';
  const hoverBorder = isMale ? 'hover:border-amber-500/40' : 'hover:border-violet-500/40';

  const handleFile = useCallback(async (file: File) => {
    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Hanya file JPG, PNG, WebP, dan GIF yang diperbolehkan');
      setTimeout(() => setUploadError(null), 3000);
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Ukuran file maksimal 5MB');
      setTimeout(() => setUploadError(null), 3000);
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onUpload(data.url);
      } else {
        setUploadError(data.error || 'Gagal mengupload gambar');
        setTimeout(() => setUploadError(null), 3000);
      }
    } catch {
      setUploadError('Gagal mengupload gambar. Coba lagi.');
      setTimeout(() => setUploadError(null), 3000);
    } finally {
      setIsUploading(false);
    }
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

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

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [handleFile]);

  const handleClick = () => {
    if (!isUploading && !previewUrl) {
      fileInputRef.current?.click();
    }
  };

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClear?.();
  }, [onClear]);

  /* ── Preview state — image uploaded ── */
  if (previewUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-emerald-500/15"
      >
        {/* Preview image */}
        <div className="relative flex-shrink-0">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden ring-2 ${ringColor}`}
          >
            <img
              src={previewUrl}
              alt="Avatar terpilih"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Check badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30, delay: 0.1 }}
            className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"
          >
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </motion.div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] font-semibold ${autoLoaded ? 'text-sky-400/90' : 'text-emerald-400/90'}`}>
            {autoLoaded ? 'Data ditemukan otomatis' : 'Foto Profil Terpilih'}
          </p>
          <p className="text-[11px] text-white/30 mt-0.5">
            {autoLoaded ? 'Klik X untuk ganti foto' : 'Karakter bebas sesuai selera pribadi'}
          </p>
        </div>

        {/* Clear button */}
        <motion.button
          onClick={handleClear}
          className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center hover:bg-red-500/15 hover:border-red-500/20 transition-all group"
          whileTap={{ scale: 0.9 }}
          title="Ganti foto"
        >
          <X className="w-4 h-4 text-white/30 group-hover:text-red-400 transition-colors" />
        </motion.button>
      </motion.div>
    );
  }

  /* ── Upload state — empty/uploading ── */
  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleInputChange}
        className="hidden"
      />

      <motion.div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-200
          ${isDragging
            ? `bg-gradient-to-br ${gradientFrom} ${gradientTo} border-2 border-dashed ${isMale ? 'border-amber-400/50' : 'border-violet-400/50'}`
            : `bg-white/[0.02] border border-dashed ${borderColor} ${hoverBorder}`
          }
        `}
        whileHover={!isUploading ? { y: -2, scale: 1.005 } : undefined}
        whileTap={!isUploading ? { scale: 0.98 } : undefined}
      >
        <div className="flex flex-col items-center justify-center py-8 px-4 sm:py-10">
          {isUploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                  <Loader2 className={`w-6 h-6 ${iconColor} animate-spin`} />
                </div>
              </div>
              <div className="text-center">
                <p className="text-[13px] font-semibold text-white/60">Mengupload...</p>
                <p className="text-[11px] text-white/25 mt-1">Mohon tunggu sebentar</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3"
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center transition-transform ${isDragging ? 'scale-110' : ''}`}>
                {isDragging ? (
                  <Camera className={`w-6 h-6 ${iconColor}`} />
                ) : (
                  <Upload className={`w-6 h-6 ${iconColor}`} />
                )}
              </div>

              {/* Text */}
              <div className="text-center">
                <p className="text-[13px] font-semibold text-white/50">
                  {isDragging ? 'Lepaskan untuk upload' : 'Upload Foto Karakter'}
                </p>
                <p className="text-[11px] text-white/25 mt-1">
                  Klik atau seret gambar ke sini
                </p>
                <p className="text-[10px] text-white/15 mt-2">
                  JPG, PNG, WebP, GIF &bull; Maks 5MB
                </p>
              </div>

              {/* Subtle hint */}
              <div className="flex items-center gap-1.5 text-[10px] text-white/15">
                <ImageIcon className="w-3 h-3" />
                <span>Karakter bebas sesuai selera pribadi</span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {uploadError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-[11px] text-red-400/80 text-center mt-2"
          >
            {uploadError}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

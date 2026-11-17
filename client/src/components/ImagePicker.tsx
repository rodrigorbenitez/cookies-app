import { useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { api, imageUrl } from '../lib/api';
import { useToast } from './Toast';
import { useI18n } from '../lib/i18n';

interface Props {
  value: string | null;
  onChange: (imagePath: string | null) => void;
}

/** Take a photo with the camera or pick one from the gallery. Uploads immediately. */
export function ImagePicker({ value, onChange }: Props) {
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const { t } = useI18n();

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const { imagePath } = await api.uploadImage(file);
      onChange(imagePath);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
      if (camera.current) camera.current.value = '';
      if (gallery.current) gallery.current.value = '';
    }
  };

  const src = imageUrl(value);
  return (
    <div>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900/40 dark:to-orange-900/30">
        {src ? (
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-amber-800/60 dark:text-amber-200/50">
            <ImagePlus size={48} strokeWidth={1.25} />
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Loader2 className="animate-spin text-white" size={36} />
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary flex-1" disabled={busy} onClick={() => camera.current?.click()}>
          <Camera size={18} /> {t.form.camera}
        </button>
        <button type="button" className="btn-secondary flex-1" disabled={busy} onClick={() => gallery.current?.click()}>
          <ImagePlus size={18} /> {t.form.gallery}
        </button>
        {value && (
          <button type="button" className="btn-ghost" disabled={busy} onClick={() => onChange(null)} aria-label={t.form.removeImage}>
            <Trash2 size={18} />
          </button>
        )}
      </div>
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => upload(e.target.files?.[0])} />
      <input ref={gallery} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
    </div>
  );
}

import { supabase } from '@/lib/supabase';
import { resizeImage } from '@/lib/resizeImage';

const BUCKET = 'recipe-images';
const MAX_FILE_BYTES = 30 * 1024 * 1024;

function storagePathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i < 0 ? null : decodeURIComponent(url.slice(i + marker.length));
}

/** Best-effort cleanup of a previously uploaded photo; external image URLs are left alone. */
async function deleteStoredPhoto(url: string | null): Promise<void> {
  const path = url ? storagePathFromUrl(url) : null;
  if (path) await supabase.storage.from(BUCKET).remove([path]);
}

async function setImageUrl(recipeId: string, imageUrl: string | null): Promise<void> {
  const { error } = await supabase.from('recipe_recipes').update({ image_url: imageUrl }).eq('id', recipeId);
  if (error) throw error;
}

/** Resizes and uploads a photo, makes it the recipe's picture, and removes the old one. */
export async function setRecipePhoto(recipeId: string, file: File, previousUrl: string | null): Promise<void> {
  if (file.size > MAX_FILE_BYTES) throw new Error('That photo is too large.');
  const blob = await resizeImage(file);

  // Unique path per upload so browsers and the CDN never serve a stale cached photo.
  const path = `${recipeId}-${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  await setImageUrl(recipeId, data.publicUrl);
  await deleteStoredPhoto(previousUrl);
}

export async function removeRecipePhoto(recipeId: string, currentUrl: string): Promise<void> {
  await setImageUrl(recipeId, null);
  await deleteStoredPhoto(currentUrl);
}

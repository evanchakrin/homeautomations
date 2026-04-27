import { requireHousehold } from "@/lib/auth";
import { fetchPhotos } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { PhotosApp } from "@/components/photos/PhotosApp";

export const dynamic = "force-dynamic";

export default async function PhotosPage() {
  const { household } = await requireHousehold();
  const photos = await fetchPhotos(household.id);
  const supabase = createClient();
  const signed = await Promise.all(
    photos.map(async (p) => {
      const { data } = await supabase.storage.from("photos").createSignedUrl(p.storage_path, 60 * 60 * 12);
      return { ...p, signedUrl: data?.signedUrl ?? null };
    }),
  );
  return <PhotosApp photos={signed} />;
}

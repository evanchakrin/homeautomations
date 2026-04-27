"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Photo } from "@/lib/supabase/types";
import { uploadPhotoAction, deletePhotoAction } from "@/app/(app)/photos/actions";

type PhotoSigned = Photo & { signedUrl: string | null };

export function PhotosApp({ photos }: { photos: PhotoSigned[] }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setError(null);
    startTransition(async () => {
      const res = await uploadPhotoAction(fd);
      if (res?.error) setError(res.error);
      router.refresh();
    });
    e.target.value = "";
  }

  function onDelete(p: PhotoSigned) {
    if (!confirm("Delete this photo?")) return;
    startTransition(async () => {
      await deletePhotoAction(p.id, p.storage_path);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Photos</h1>
          <p className="text-ink/60 text-sm">Shows on the wall display when idle.</p>
        </div>
        <div>
          <input ref={fileInput} type="file" accept="image/*" onChange={onUpload} className="hidden" />
          <button onClick={() => fileInput.current?.click()} disabled={pending} className="btn btn-primary">
            {pending ? "Uploading…" : "+ Upload"}
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {photos.length === 0 ? (
        <div className="card p-12 text-center text-ink/50">No photos yet.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((p) => (
            <div key={p.id} className="card overflow-hidden group relative aspect-square">
              {p.signedUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.signedUrl} alt={p.caption ?? ""} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-paper flex items-center justify-center text-ink/40">unavailable</div>
              )}
              <button
                onClick={() => onDelete(p)}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 opacity-0 group-hover:opacity-100"
                aria-label="Delete"
              >×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

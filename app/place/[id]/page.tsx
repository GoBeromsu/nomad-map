import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import AppShell from "@/components/AppShell";
import { getAllPlaces, getPlaceById } from "@/lib/places";

// Prerender every place at build time → instant, static, CDN-served share pages.
export function generateStaticParams() {
  return getAllPlaces().map((p) => ({ id: p.id }));
}

// Korean IDs may arrive percent-encoded depending on the client; resolve both.
function resolvePlace(rawId: string) {
  let decoded = rawId;
  try {
    decoded = decodeURIComponent(rawId);
  } catch {
    /* malformed escape — fall back to the raw id */
  }
  return getPlaceById(decoded) ?? getPlaceById(rawId);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const place = resolvePlace(id);
  if (!place) return { title: "노마드 맵" };

  const name = place.name_i18n?.ko ?? place.name;
  const description = place.description_i18n?.ko ?? place.description;
  const image = place.photos?.[0];
  const images = image ? [{ url: image, alt: name }] : undefined;

  return {
    title: `${name} · 노마드 맵`,
    description,
    openGraph: {
      title: name,
      description,
      type: "article",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PlacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const place = resolvePlace(id);
  if (!place) notFound();

  return (
    <main className="flex h-dvh flex-col">
      <AppHeader />
      <AppShell places={getAllPlaces()} initialPlaceId={place.id} />
    </main>
  );
}

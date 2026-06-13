import AppHeader from "@/components/AppHeader";
import AppShell from "@/components/AppShell";
import { getAllPlaces } from "@/lib/places";

export default function Home() {
  const places = getAllPlaces();

  return (
    <main className="flex h-dvh flex-col">
      <AppHeader />
      <AppShell places={places} />
    </main>
  );
}

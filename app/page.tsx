import AppHeader from "@/components/AppHeader";
import Explorer from "@/components/Explorer";
import { getAllPlaces } from "@/lib/places";

export default function Home() {
  const places = getAllPlaces();

  return (
    <main className="flex h-dvh flex-col">
      <AppHeader />
      <Explorer places={places} />
    </main>
  );
}

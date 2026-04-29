import { requireHousehold } from "@/lib/auth";
import { fetchLightDevices } from "@/lib/data";
import { lightsEnabled, WIZ_SCENES } from "@/lib/wiz";
import { LightsApp } from "@/components/lights/LightsApp";

export const dynamic = "force-dynamic";

export default async function LightsPage() {
  const { household } = await requireHousehold();
  const devices = await fetchLightDevices(household.id);
  return (
    <LightsApp
      devices={devices}
      enabled={lightsEnabled()}
      scenes={Object.keys(WIZ_SCENES)}
    />
  );
}

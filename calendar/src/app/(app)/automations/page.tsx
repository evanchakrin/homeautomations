import { requireHousehold } from "@/lib/auth";
import { fetchScenes, fetchLightDevices } from "@/lib/data";
import { lightsEnabled, WIZ_SCENES } from "@/lib/wiz";
import { AutomationsApp } from "@/components/automations/AutomationsApp";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  const { household } = await requireHousehold();
  const [scenes, devices] = await Promise.all([
    fetchScenes(household.id),
    fetchLightDevices(household.id),
  ]);
  return (
    <AutomationsApp
      scenes={scenes}
      devices={devices}
      enabled={lightsEnabled()}
      lightScenes={Object.keys(WIZ_SCENES)}
    />
  );
}

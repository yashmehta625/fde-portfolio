import { getDemo } from "@/lib/demos";
import { DemoShell } from "@/components/DemoShell";
import { EntityResolutionDemo } from "./EntityResolutionDemo";

export default function Page() {
  const demo = getDemo("entity-resolution")!;
  return (
    <DemoShell demo={demo}>
      <EntityResolutionDemo />
    </DemoShell>
  );
}

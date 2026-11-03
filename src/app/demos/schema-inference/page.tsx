import { getDemo } from "@/lib/demos";
import { DemoShell } from "@/components/DemoShell";
import { SchemaInferenceDemo } from "./SchemaInferenceDemo";

export default function Page() {
  const demo = getDemo("schema-inference")!;
  return (
    <DemoShell demo={demo}>
      <SchemaInferenceDemo />
    </DemoShell>
  );
}

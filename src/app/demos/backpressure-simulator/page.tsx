import { getDemo } from "@/lib/demos";
import { DemoShell } from "@/components/DemoShell";
import { BackpressureDemo } from "./BackpressureDemo";

export default function Page() {
  const demo = getDemo("backpressure-simulator")!;
  return (
    <DemoShell demo={demo}>
      <BackpressureDemo />
    </DemoShell>
  );
}

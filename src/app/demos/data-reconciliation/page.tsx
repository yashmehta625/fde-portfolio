import { getDemo } from "@/lib/demos";
import { DemoShell } from "@/components/DemoShell";
import { DataReconciliationDemo } from "./DataReconciliationDemo";

export default function Page() {
  const demo = getDemo("data-reconciliation")!;
  return (
    <DemoShell demo={demo}>
      <DataReconciliationDemo />
    </DemoShell>
  );
}

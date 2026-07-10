import { ParentShell } from "@/components/shells/parent-shell";
import { LoadingState } from "@/components/ui/loading-state";

export default function ParentLoading() {
  return <ParentShell identity="Protected"><LoadingState label="Preparing the parent workspace" /></ParentShell>;
}

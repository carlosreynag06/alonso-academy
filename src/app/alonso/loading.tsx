import { ChildShell } from "@/components/shells/child-shell";
import { LoadingState } from "@/components/ui/loading-state";

export default function AlonsoLoading() {
  return <ChildShell><LoadingState label="Getting your learning space ready" /></ChildShell>;
}

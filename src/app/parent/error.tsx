"use client";

import { ParentShell } from "@/components/shells/parent-shell";
import { ErrorState } from "@/components/ui/error-state";

export default function ParentError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ParentShell identity="Protected"><ErrorState reset={reset} title="The parent workspace did not load" description="No curriculum or approval was changed. Try opening the workspace again." /></ParentShell>;
}

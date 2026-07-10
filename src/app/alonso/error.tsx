"use client";

import { ChildShell } from "@/components/shells/child-shell";
import { ErrorState } from "@/components/ui/error-state";

export default function AlonsoError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ChildShell><ErrorState reset={reset} title="Your learning space needs another try" description="Nothing was lost. Tap try again, or ask a parent if the page still does not open." /></ChildShell>;
}

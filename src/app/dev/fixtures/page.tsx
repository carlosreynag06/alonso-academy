import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fixtureControlAvailable } from "@/lib/development-fixtures/guard";
import { fixtureScenarios, getFixtureScenario } from "@/lib/development-fixtures/scenarios";
import { getDevelopmentFixtureSession } from "@/lib/development-fixtures/session";
import { activateFixtureScenario, exitFixtureScenario, resetFixtureScenario } from "./actions";
import styles from "./fixtures.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Development Fixtures | Alonso Academy",
  robots: { index: false, follow: false },
};

export default async function DevelopmentFixturesPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; exited?: string }>;
}) {
  if (!await fixtureControlAvailable()) notFound();
  const [session, query] = await Promise.all([getDevelopmentFixtureSession(), searchParams]);
  const activeDefinition = session ? getFixtureScenario(session.scenario) : null;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Recovery 0 · local development only</p>
          <h1>Isolated fixture control</h1>
          <p className={styles.intro}>These scenarios use synthetic, file-backed state. They do not authenticate with family passwords and must never call Supabase, OpenAI, or ElevenLabs.</p>
        </div>
        <span className={styles.localBadge}>LOOPBACK · FIXTURE DATA</span>
      </header>

      {query.reset && <p className={styles.notice}>The active fixture was reset to its deterministic starting state.</p>}
      {query.exited && <p className={styles.notice}>The fixture session and its local state file were removed.</p>}

      <section className={styles.status} aria-labelledby="fixture-status-title">
        <div>
          <p className={styles.eyebrow}>Current session</p>
          <h2 id="fixture-status-title">{activeDefinition?.label ?? "No fixture active"}</h2>
          <p>{activeDefinition?.description ?? "Choose a scenario below to create a new opaque local session."}</p>
        </div>
        {session && (
          <dl>
            <div><dt>Role</dt><dd>{session.role}</dd></div>
            <div><dt>Lessons</dt><dd>{session.catalog.lessons.length}</dd></div>
            <div><dt>Evidence</dt><dd>{session.catalog.evidence.length}</dd></div>
            <div><dt>Source</dt><dd>local JSON</dd></div>
          </dl>
        )}
        {session && (
          <div className={styles.sessionActions}>
            <Link href={activeDefinition!.destination}>Open active fixture</Link>
            <form action={resetFixtureScenario}><button type="submit">Reset</button></form>
            <form action={exitFixtureScenario}><button className={styles.exitButton} type="submit">Exit and delete</button></form>
          </div>
        )}
      </section>

      <section className={styles.scenarioSection} aria-labelledby="scenario-title">
        <div className={styles.sectionHeading}>
          <div><p className={styles.eyebrow}>Scenario catalog</p><h2 id="scenario-title">Select an exact application state</h2></div>
          <p>Activating another scenario replaces only this fixture session’s local file.</p>
        </div>
        <div className={styles.grid}>
          {fixtureScenarios.map((scenario) => {
            const active = session?.scenario === scenario.key;
            return (
              <article className={active ? styles.activeCard : styles.card} key={scenario.key}>
                <div className={styles.cardHeading}>
                  <span>{scenario.role === "parent" ? "PARENT" : "ALONSO"}</span>
                  {active && <strong>ACTIVE</strong>}
                </div>
                <h3>{scenario.label}</h3>
                <p>{scenario.description}</p>
                <form action={activateFixtureScenario}>
                  <input name="scenario" type="hidden" value={scenario.key} />
                  <button type="submit">{active ? "Restart scenario" : "Activate scenario"}</button>
                </form>
              </article>
            );
          })}
        </div>
      </section>

      <footer className={styles.footer}>
        <strong>Safety boundary</strong>
        <p>The server-only flag must equal <code>ALONSO_ENABLE_DEV_FIXTURES=true</code>, the runtime must be development, and the request host must be loopback. Otherwise this route returns 404.</p>
      </footer>
    </main>
  );
}

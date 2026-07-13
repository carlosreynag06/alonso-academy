import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getParentAccessState } from "@/lib/auth/parent";
import {
  recovery2ApprovalItems,
  recovery2Arc,
  recovery2Characters,
  recovery2ConceptAssets,
  recovery2Interactions,
} from "@/lib/recovery-2/concepts";
import styles from "./recovery-2.module.css";

export const metadata: Metadata = {
  title: "Recovery 2 Concept Review | Alonso Academy",
  description: "Parent review gallery for the Alonso Academy instructional and visual direction.",
};

function EarMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.6 19.2c0-2.1 3.7-2.1 3.7-7.5a5.3 5.3 0 0 0-10.6 0" /><path d="M10.1 11.6c0-1.9 3.9-2.3 3.9.7 0 2.2-2.9 2.4-2.9 4.7 0 1.2-.7 2.1-1.9 2.1-1.4 0-2.5-1.1-2.5-2.5" /></svg>;
}

function MicMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="3" width="8" height="12" rx="4" /><path d="M5.5 11.5v.8a6.5 6.5 0 0 0 13 0v-.8M12 18.8V22M8.8 22h6.4" /></svg>;
}

function PlayMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 9 6-9 6z" /></svg>;
}

function AppleMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8c-4-3-8-.3-8 5.1C4 18.2 7.2 22 12 22s8-3.8 8-8.9C20 7.7 16 5 12 8Z" /><path d="M12 8c0-3 1.7-5 4.5-5M12 5c-1.5-1.7-3.1-2.2-4.8-1.4" /></svg>;
}

function BallMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M4.6 7.2c4.4.8 8.2 4.8 8.8 9.5M9 3.5c-.6 4 2.9 7.9 7.2 8.7M4 16c4.8-.4 9.6-3.3 12.5-7.6" /></svg>;
}

function BookMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 5.2c3.5-.9 6.4-.2 8.5 2.1v12.3c-2.1-2.3-5-3-8.5-2.1Z" /><path d="M20.5 5.2c-3.5-.9-6.4-.2-8.5 2.1v12.3c2.1-2.3 5-3 8.5-2.1Z" /></svg>;
}

function TurnMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 17h8a6 6 0 0 0 6-6V7" /><path d="m15 10 4-4 4 4" /><circle cx="6" cy="17" r="2" /></svg>;
}

function ConceptVisual({ conceptId }: { conceptId: string }) {
  if (conceptId === "home") {
    return <div className={`${styles.conceptVisual} ${styles.homeVisual}`}>
      <Image src="/recovery-2/concepts/luma-landing-world-v1.png" alt="Luma Landing home concept" fill sizes="(max-width: 900px) 100vw, 54vw" />
      <div className={styles.journeyMarks} aria-hidden="true"><i className={styles.journeyCurrent} /><i /><i /><i /><i /></div>
      <span className={styles.homeAction} aria-hidden="true"><PlayMark /></span>
    </div>;
  }

  if (conceptId === "listen-find") {
    return <div className={`${styles.conceptVisual} ${styles.storyboardVisual} ${styles.listenVisual}`} role="img" aria-label="Non-scored teaching example in which Miko points toward the modeled apple before an independent choice">
      <Image className={`${styles.storyboardImage} ${styles.listenImage}`} src="/recovery-2/concepts/luma-interactions-v1.png" alt="" width={1693} height={929} sizes="(max-width: 850px) 172vw, 108vw" />
      <span className={styles.audioAction} aria-hidden="true"><EarMark /></span>
      <span className={styles.safeCaption}>Non-scored example</span>
    </div>;
  }

  if (conceptId === "conversation") {
    return <div className={`${styles.conceptVisual} ${styles.storyboardVisual} ${styles.conversationVisual}`} role="img" aria-label="Miko and Nia greet each other at Welcome Dock">
      <Image className={`${styles.storyboardImage} ${styles.conversationImage}`} src="/recovery-2/concepts/luma-interactions-v1.png" alt="" width={1693} height={929} sizes="(max-width: 850px) 172vw, 108vw" />
      <span className={styles.turnPulse} aria-hidden="true" />
      <span className={styles.audioAction} aria-hidden="true"><PlayMark /></span>
    </div>;
  }

  if (conceptId === "speaking") {
    return <div className={`${styles.conceptVisual} ${styles.poseVisual}`} role="img" aria-label="Miko holds a calm listening pose beside the recording action">
      <Image className={styles.poseConceptImage} src="/recovery-2/concepts/miko-teaching-poses-v1.png" alt="" width={1693} height={929} sizes="(max-width: 850px) 258vw, 162vw" />
      <span className={styles.recordAction} aria-hidden="true"><MicMark /><i /></span>
      <span className={styles.safeCaption}>Your turn</span>
    </div>;
  }

  if (conceptId === "story") {
    return <div className={`${styles.conceptVisual} ${styles.storyboardVisual} ${styles.storyVisual}`} role="img" aria-label="Nia and Miko use three picture panels to demonstrate a story sequence">
      <Image className={`${styles.storyboardImage} ${styles.storyImage}`} src="/recovery-2/concepts/luma-interactions-v1.png" alt="" width={1693} height={929} sizes="(max-width: 850px) 172vw, 108vw" />
      <div className={styles.sequenceDots} aria-hidden="true"><i /><i className={styles.sequenceCurrent} /><i /></div>
      <span className={styles.audioAction} aria-hidden="true"><PlayMark /></span>
    </div>;
  }

  if (conceptId === "completion") {
    return <div className={`${styles.conceptVisual} ${styles.storyboardVisual} ${styles.completionVisual}`} role="img" aria-label="Three evidence-neutral picture memories reflect activities completed during the lesson">
      <Image className={`${styles.storyboardImage} ${styles.completionImage}`} src="/recovery-2/concepts/luma-interactions-v1.png" alt="" width={1693} height={929} sizes="(max-width: 850px) 172vw, 108vw" />
      <div className={styles.momentStrip} aria-hidden="true"><span><EarMark /></span><span><AppleMark /></span><span><TurnMark /></span></div>
      <span className={styles.returnAction} aria-hidden="true">↩</span>
    </div>;
  }

  return <div className={`${styles.conceptVisual} ${styles.storyboardVisual} ${styles.collectionVisual}`} role="img" aria-label="Moss presents a picture collection containing an apple, ball, and book">
    <Image className={`${styles.storyboardImage} ${styles.collectionImage}`} src="/recovery-2/concepts/luma-interactions-v1.png" alt="" width={1693} height={929} sizes="(max-width: 850px) 172vw, 108vw" />
    <div className={styles.collectionTiles} aria-hidden="true"><span><AppleMark /></span><span><BallMark /></span><span><BookMark /></span></div>
    <span className={styles.audioAction} aria-hidden="true"><EarMark /></span>
  </div>;
}

export default async function Recovery2ReviewPage() {
  const access = await getParentAccessState();
  if (access.status !== "ready") redirect("/login");

  return <div className={styles.reviewApp}>
    <header className={styles.topbar}>
      <Link className={styles.brand} href="/parent/recovery" aria-label="Back to recovery overview">
        <span>R2</span>
        <div><strong>Alonso Academy</strong><small>Concept review room</small></div>
      </Link>
      <nav aria-label="Recovery 2 review sections">
        <a href="#world">World</a>
        <a href="#learning">Learning</a>
        <a href="#interactions">Interactions</a>
        <a href="#adult">Parent app</a>
        <a href="#decision">Decision</a>
      </nav>
      <div className={styles.reviewStatus}><i />Awaiting your review</div>
    </header>

    <main id="main-content" className={styles.main}>
      <section className={styles.hero} id="review-start">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Recovery 2 · candidate direction 01</p>
          <h1>English becomes something Alonso can <em>see, hear, and do.</em></h1>
          <p className={styles.lede}>Luma Landing is an illustrated oral-language world led by characters who model, point, wait, respond, and help. This is a review package—not the rebuilt child application.</p>
          <div className={styles.heroFacts}>
            <span><strong>12–15</strong> minutes</span>
            <span><strong>1–2</strong> new oral targets</span>
            <span><strong>1</strong> obvious action</span>
          </div>
          <div className={styles.heroNote}><EarMark /><span><strong>Audio leads every task.</strong> Captions are optional support, never the instruction Alonso must decode.</span></div>
        </div>
        <div className={styles.heroArt}>
          <Image src="/recovery-2/concepts/luma-landing-world-v1.png" alt="Luma Landing, an illustrated archipelago with Welcome Dock, Action Grove, Sound Workshop, Story Camp, and Word Gallery" fill priority sizes="(max-width: 900px) 100vw, 54vw" />
          <span className={styles.artLabel}>World concept · draft review</span>
        </div>
      </section>

      <section className={styles.castSection} id="world">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>The teaching cast</p>
          <h2>Four jobs. No decorative mascots.</h2>
          <p>Each character owns an instructional responsibility and a predictable kind of help. Their acting makes the task visible before any caption appears.</p>
        </div>
        <div className={styles.castArt}>
          <Image src="/recovery-2/concepts/luma-cast-concept-v1.png" alt="Miko, Pippa, Moss, and Nia character concept lineup" fill sizes="(max-width: 900px) 100vw, 62vw" />
        </div>
        <div className={styles.characterList}>
          {recovery2Characters.map((character) => <article key={character.id} className={styles[`character_${character.color}`]}>
            <span>{character.name.slice(0, 1)}</span>
            <div><p>{character.role}</p><h3>{character.name}</h3><small>{character.job}</small></div>
          </article>)}
        </div>
      </section>

      <section className={styles.learningSection} id="learning">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Phase A lesson choreography</p>
          <h2>Teach first. Use language for a reason. Retrieve before exit.</h2>
          <p>The arc protects first-attempt evidence while still giving Alonso a humane path from demonstration to independent use.</p>
        </div>
        <div className={styles.arcGrid}>
          {recovery2Arc.map((item, index) => <article key={item.step}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{item.minutes} · {item.owner}</p>
            <h3>{item.step}</h3>
            <small>{item.purpose}</small>
          </article>)}
        </div>
        <div className={styles.supportLadder}>
          <div><p className={styles.eyebrow}>Support ladder</p><h3>Replay → gesture → modeled example → fewer choices → brief Spanish rescue</h3></div>
          <p>Spanish is a bounded comprehension rescue after two failed English-first supports—not routine translation. Every support step remains attached to the evidence.</p>
        </div>
      </section>

      <section className={styles.interactionsSection} id="interactions">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Seven required interaction concepts</p>
          <h2>Every screen has a visual cue, a spoken line, one action, and a recovery.</h2>
          <p>The frames below are responsive concept compositions. They are deliberately separate from the rejected v1 lesson player and do not make these assets production-ready.</p>
        </div>
        <div className={styles.interactionList}>
          {recovery2Interactions.map((concept) => <article className={styles.interactionRow} key={concept.id}>
            <div className={styles.frameColumn}>
              <div className={styles.frameTop}><span>{concept.number}</span><small>{concept.place}</small></div>
              <ConceptVisual conceptId={concept.id} />
            </div>
            <div className={styles.interactionCopy}>
              <p className={styles.eyebrow}>{concept.number} · no-reading proof</p>
              <h3>{concept.title}</h3>
              <blockquote><span>Spoken</span>“{concept.spokenLine}”</blockquote>
              <dl>
                <div><dt>One action</dt><dd>{concept.childAction}</dd></div>
                <div><dt>Recovery</dt><dd>{concept.fallback}</dd></div>
                <div><dt>Evidence</dt><dd>{concept.evidence}</dd></div>
              </dl>
            </div>
          </article>)}
        </div>
      </section>

      <section className={styles.poseSection}>
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Instructional acting</p>
          <h2>Miko’s pose carries the verb before the UI asks for action.</h2>
          <p>Greeting, listening, modeling, joint attention, calm retry, and effort celebration each have a distinct silhouette. Reduced motion holds the teaching pose instead of animating it.</p>
        </div>
        <div className={styles.poseArt}><Image src="/recovery-2/concepts/miko-teaching-poses-v1.png" alt="Six Miko teaching poses" fill sizes="(max-width: 900px) 100vw, 70vw" /></div>
      </section>

      <section className={styles.adultSection} id="adult">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Separate adult direction</p>
          <h2>A compact operational workspace—not the child world in business clothes.</h2>
          <p>Flat surfaces, persistent labels, minimal radius, dense five-day state, and explicit lifecycle consequences. No gradients. No icon-only rail. No oversized dashboard cards.</p>
        </div>
        <p className={styles.scaleNote}>Desktop composition study shown at reduced scale. Production body text remains 14–16 px; the separate mobile direction uses a labeled navigation sheet and complete stacked day groups.</p>
        <div className={styles.adultConceptViewport} tabIndex={0} aria-label="Scrollable desktop parent-workspace composition study">
        <div className={styles.adultConcept}>
          <aside>
            <div className={styles.adultBrand}><span>AA</span><div><strong>Alonso Academy</strong><small>Parent workspace</small></div></div>
          <div className={styles.adultNav} aria-label="Illustrative parent application navigation">
              {['Overview','Week','Review queue','Curriculum','Alonso','Progress','History','Settings'].map((item) => <span className={item === 'Week' ? styles.adultActive : undefined} key={item}><i />{item}</span>)}
          </div>
            <footer>Private family app</footer>
          </aside>
          <div className={styles.adultWorkspace}>
            <header><div><small>Learning week</small><h3>Week of July 13</h3></div><div><span>Planned</span><b>Signed-in parent</b></div></header>
            <section className={styles.adultToolbar}><div><strong>Five-day production board</strong><small>Approval and publication remain separate.</small></div><span>Week actions</span></section>
            <div className={styles.weekHeader}><span>Day</span><span>Focus / targets</span><span>Lesson version</span><span>Validation</span><span>Child state</span><span>Action</span></div>
            {[
              ['1','Hello · greeting','Daily v2','Passed','Published to Alonso','Inspect'],
              ['2','Yes · hello review','Daily v1','Passed','Scheduled — not visible','Inspect'],
              ['3','No · yes review','No lesson','—','Not available','Create'],
              ['4','Guided greeting','Review v1','2 failures','Not available','Fix'],
              ['5','Independent hello','No lesson','—','Not available','Create'],
            ].map((row) => <div className={styles.weekRow} key={row[0]}>{row.map((cell, index) => <span key={`${row[0]}-${index}`}>{cell}</span>)}</div>)}
            <div className={styles.adultBottom}>
              <div><small>Next decision</small><strong>Review Day 2 before publication</strong></div>
              <span>Open review queue</span>
            </div>
          </div>
        </div>
        </div>
        <div className={styles.adultRules}>
          <span><strong>216–232 px</strong> labeled navigation</span>
          <span><strong>4–8 px</strong> permanent surface radius</span>
          <span><strong>1 px</strong> borders, no permanent shadow</span>
          <span><strong>1 primary</strong> action per decision region</span>
        </div>
      </section>

      <section className={styles.assetSection}>
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Immutable concept register</p>
          <h2>Every candidate has identity, provenance, accessibility text, and a review state.</h2>
          <p>These files are concept assets only. Recovery 3 owns the production registry, resolver, storage, and fail-closed validation.</p>
        </div>
        <div className={styles.assetTable} role="table" aria-label="Recovery 2 concept assets">
          <div className={styles.assetHeader} role="row"><span role="columnheader">Review key</span><span role="columnheader">Kind</span><span role="columnheader">SHA-256</span><span role="columnheader">State</span></div>
          {recovery2ConceptAssets.map((asset) => <div role="row" key={asset.reviewKey}>
            <span role="cell"><strong>{asset.label}</strong><small>{asset.reviewKey}</small><small>{asset.permittedUse}</small></span>
            <span role="cell">{asset.kind.replaceAll('_', ' ')}</span>
            <code role="cell">{asset.sha256.slice(0, 12)}…</code>
            <span role="cell" className={styles.pendingState}>{asset.state.replaceAll('_', ' ')}</span>
          </div>)}
        </div>
      </section>

      <section className={styles.decisionSection} id="decision">
        <div>
          <p className={styles.eyebrow}>Parent approval gate</p>
          <h2>Recovery 3 stays closed until you decide.</h2>
          <p>Viewing this gallery records nothing. To decide, reply with “approve Recovery 2 direction 01,” reject it, or request changes by named area. Generated assets require their own explicit decision.</p>
        </div>
        <div className={styles.decisionList}>
          {recovery2ApprovalItems.map((item) => <div key={item}><i /><span>{item}</span><small>Decision pending</small></div>)}
        </div>
        <footer>
          <span>Concept set</span><strong>Recovery 2 · direction 01</strong><span>Signed in</span><strong>{access.email}</strong>
        </footer>
      </section>
    </main>
  </div>;
}

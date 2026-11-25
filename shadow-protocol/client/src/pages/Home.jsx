import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { HINTS, TOTAL_POINTS } from '../data/hints.js'

gsap.registerPlugin(ScrollTrigger)

function Window({ title, children, className = '' }) {
  return (
    <div className={`terminal-window ${className}`}>
      <div className="win-chrome">
        <div className="win-dots"><i /><i /><i /></div>
        <div className="win-title">{title}</div>
        <div className="win-meta">tty1</div>
      </div>
      <div className="win-body">{children}</div>
    </div>
  )
}

export default function Home() {
  const root = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-left', { opacity: 0, x: -70, duration: 0.9, ease: 'power3.out', delay: 1.9 })
      gsap.from('.hero-side', { opacity: 0, x: 70, duration: 0.9, ease: 'power3.out', delay: 2.05 })
      gsap.from('.hero-title span', { opacity: 0, y: 40, stagger: 0.12, duration: 0.7, ease: 'power3.out', delay: 2.15 })
      gsap.from('.hero-actions .btn', { opacity: 0, y: 20, stagger: 0.1, duration: 0.6, ease: 'power2.out', delay: 2.4 })

      gsap.to('.progress-fill', {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { trigger: document.documentElement, start: 'top top', end: 'bottom bottom', scrub: 0.2 }
      })

      gsap.to('.matrix-grid', {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: true }
      })

      gsap.utils.toArray('.reveal').forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 40,
          duration: 0.75,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%' }
        })
      })

      gsap.utils.toArray('.file-row').forEach((row, i) => {
        gsap.from(row, {
          opacity: 0,
          x: -40,
          clipPath: 'inset(0 100% 0 0)',
          duration: 0.6,
          delay: (i % 4) * 0.04,
          ease: 'power2.out',
          scrollTrigger: { trigger: row, start: 'top 94%' }
        })
      })

      gsap.utils.toArray('.stat-number').forEach((el) => {
        const target = Number(el.dataset.value || 0)
        const counter = { value: 0 }
        gsap.to(counter, {
          value: target,
          duration: 1.6,
          ease: 'power2.out',
          snap: { value: 1 },
          onUpdate: () => { el.textContent = String(Math.round(counter.value)) },
          scrollTrigger: { trigger: el, start: 'top 92%', once: true }
        })
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={root} className="home">
      <div className="scroll-progress"><div className="progress-fill" /></div>

      <section className="hero">
        <Window title="mission.sh — bash" className="hero-left">
          <div className="cmd-line"><span className="prompt">$</span> whoami</div>
          <div className="cmd-out">guest@crypton <span className="muted">(unprivileged)</span></div>
          <div className="cmd-line"><span className="prompt">$</span> cat /mission/brief</div>
          <h1 className="hero-title"><span>CRYPT</span><span className="accent">ON</span></h1>
          <div className="hero-event">
            CRYPTON <span className="sep">/</span> IEEE TECHNICAL EVENT <span className="sep">/</span> DEPT OF MCA <span className="sep">/</span> RAMAIAH INSTITUTE OF TECHNOLOGY
          </div>
          <p className="hero-tagline">
            A LIVE BREACH SIMULATOR. 15 FLAGS ARE BURIED IN THIS STACK.<br />
            EVERY HINT IS DIRECT. EVERY ENDPOINT IS BROKEN.
          </p>
          <div className="hero-actions">
            <Link to="/lab" className="btn btn-primary">./enter_lab</Link>
            <Link to="/submit" className="btn btn-ghost">./submit_flags</Link>
          </div>
          <div className="cmd-line cursor-line"><span className="prompt">$</span> <span className="cursor" /></div>
        </Window>

        <aside className="hero-side">
          <Window title="system_status" className="sys-panel">
            <div className="sys-head">TARGET TELEMETRY</div>
            <div className="sys-row"><span>HOST</span><span className="sys-value">crypton.local</span></div>
            <div className="sys-row"><span>PORT</span><span className="sys-value">7000/tcp</span></div>
            <div className="sys-row"><span>STACK</span><span className="sys-value">react / express</span></div>
            <div className="sys-row"><span>DB</span><span className="sys-value">sqlite3</span></div>
            <div className="sys-row"><span>FIREWALL</span><span className="sys-value warn">disabled</span></div>
            <div className="sys-row"><span>INPUT VALIDATION</span><span className="sys-value warn">none</span></div>
            <div className="sys-bar"><span /></div>
            <div className="sys-foot">VULNERABILITY SURFACE: 100%</div>
          </Window>
          <div className="hex-panel">
            <div className="hex-line">0x00  NOP  NOP  MOV  EAX,0x1</div>
            <div className="hex-line">0x04  INT  0x80  RET  JMP  ESP</div>
            <div className="hex-line">0x08  XOR  EAX,EAX  PUSH 0x0</div>
            <div className="hex-line dim">... waiting for input ...</div>
          </div>
        </aside>
      </section>

      <div className="stats-row">
        <div className="stat-card"><span className="stat-number" data-value="15">0</span><span className="stat-label">FLAGS_BURIED</span></div>
        <div className="stat-card"><span className="stat-number" data-value="8">0</span><span className="stat-label">ATTACK_CLASSES</span></div>
        <div className="stat-card"><span className="stat-number" data-value={TOTAL_POINTS}>0</span><span className="stat-label">TOTAL_POINTS</span></div>
        <div className="stat-card"><span className="stat-number" data-value="0">0</span><span className="stat-label">FLAGS_CAPTURED</span></div>
      </div>

      <section className="briefing reveal">
        <div className="section-kicker">$ cat /mission/brief.txt</div>
        <h2>THE HINTS ARE NOT A MYSTERY.</h2>
        <p>
          Fifteen flags. Fifteen <strong>direct hints</strong>. Each row below names the endpoint,
          the technique and the exact payload — your job is to understand <em>why</em> it works,
          then paste the captured string into the submission terminal.
        </p>
        <div className="briefing-line">
          <span>TARGET</span><span>{typeof window === 'undefined' ? 'localhost:7000' : window.location.host}</span>
          <span>RULES</span><span>isolated lab · break anything</span>
          <span>FLAG FORMAT</span><span>RITCTF{'{...}'}</span>
        </div>
      </section>

      <section className="files-section">
        <div className="files-heading reveal">
          <div className="section-kicker">$ ls -la /flags</div>
          <h2>FLAG DIRECTORY</h2>
          <p>15 entries. No guesswork. Scroll to decrypt each hint.</p>
        </div>

        <div className="file-list">
          {HINTS.map((item) => {
            const isInternal = item.href.startsWith('/')
            const content = (
              <>
                <span className="file-perm">-rwxr-xr-x</span>
                <span className="file-id">{String(item.id).padStart(2, '0')}</span>
                <span className="file-name">{item.title}</span>
                <span className="file-hint">{item.hint}</span>
                <span className="file-open">[ OPEN ]</span>
              </>
            )
            return (
              <article className="file-row" key={item.id} id={`flag-${item.id}`}>
                {isInternal ? (
                  <Link to={item.href} className="file-link">{content}</Link>
                ) : (
                  <a className="file-link" href={item.href} target="_blank" rel="noreferrer">{content}</a>
                )}
              </article>
            )
          })}
        </div>
      </section>

      <section className="final-cta reveal">
        <Window title="mission_complete.sh" className="cta-window">
          <div className="section-kicker">$ ./finalize</div>
          <h2>ALL 15 CAPTURED?</h2>
          <p>Feed every flag to the capture terminal and watch the scoreboard climb.</p>
          <div className="hero-actions">
            <Link to="/submit" className="btn btn-primary">./submit_flags</Link>
            <Link to="/lab" className="btn btn-ghost">./open_lab</Link>
          </div>
        </Window>
      </section>
    </div>
  )
}

/* ==========================================================================
   scarlettabbott • Performance & Growth Toolkit
   Full app.js – routing, role profile, PEP Prep, evaluate (sliders + radar)
   ========================================================================== */

/* ====================== THEME (robust + independent) ====================== */
(function initTheme(){
  const BTN_ID = "toggleTheme";

  function apply(mode){
    document.body.classList.toggle("dark", mode === "dark");
    localStorage.setItem("sa-theme", mode);
  }

  // Initial: saved → system → light
  const saved = localStorage.getItem("sa-theme");
  const systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  apply(saved || (systemDark ? "dark" : "light"));

  // Bind button click (bind now; re-bind after DOM ready if needed)
  function bindBtn(){
    const btn = document.getElementById(BTN_ID);
    if (!btn) return false;
    if (!btn.dataset.bound){
      btn.addEventListener("click", () => {
        const mode = document.body.classList.contains("dark") ? "light" : "dark";
        apply(mode);
      });
      btn.dataset.bound = "1";
    }
    return true;
  }
  if (!bindBtn()){
    document.addEventListener("DOMContentLoaded", bindBtn, { once:true });
  }

  // Re-apply on tab focus (helps with SPA navigation & system theme changes)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      const pref = localStorage.getItem("sa-theme") ||
        (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      apply(pref);
      bindBtn(); // ensure bound if DOM changed
    }
  });

  // React to OS theme changes live (optional but nice)
  if (window.matchMedia){
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener?.("change", () => {
      const savedPref = localStorage.getItem("sa-theme");
      if (!savedPref) apply(mq.matches ? "dark" : "light"); // only if user hasn't chosen
    });
  }
})();

/* ----------------------- SPA ROUTING (no theme here) ---------------------- */
(function initShell(){
  const sections = ["home","role","pep","evaluate"];

  function setRoute(route){
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle("active", id===route);
    });
    location.hash = route;
    if(route === "role") onRoleReady();
  }

  // nav buttons
  document.querySelectorAll("[data-nav]").forEach(btn => {
    btn.addEventListener("click", () => setRoute(btn.getAttribute("data-nav")));
  });

  // initial route
  window.addEventListener("hashchange", () => {
    const route = (location.hash || "#home").slice(1);
    if (sections.includes(route)) setRoute(route);
  });
  setRoute((location.hash || "#home").slice(1));
})();

/* ----------------------- UTIL: safe fetch helpers ------------------------ */
async function fetchText(url){
  try{
    const r = await fetch(url, {cache:"no-cache"});
    if(!r.ok) throw new Error(r.statusText);
    return await r.text();
  }catch(e){ return null; }
}
async function fetchJson(url){
  try{
    const r = await fetch(url, {cache:"no-cache"});
    if(!r.ok) throw new Error(r.statusText);
    return await r.json();
  }catch(e){ return null; }
}

function getRole() {
    const role = localStorage.getItem("sa-role");
    const validRoles = ["project-manager", "consultant", "senior-designer"];
    if (validRoles.includes(role)) {
        return role;
    }
    return "project-manager"; // Default for 'other', null, etc.
}

/* ----------------------- ROLE PROFILE (stable, single-run) ---------------- */

// 1) Fallback role content (used only if /data/competencies.html not found)
const ROLE_FALLBACK_HTML = `
<section>
  <details open>
    <summary>How the framework works</summary>
    <div class="inner">
      <p>The core competencies detail the skills and behaviours needed to perform your job successfully. Professional competencies are the ‘even better if’s’ — the extra knowledge, skills, and abilities that elevate your impact.</p>
      <ul>
        <li>Benchmark yourself against each competency and identify growth actions.</li>
        <li>Use the competencies to create your development plan for discussion at your next PEP.</li>
        <li>If you’ve mastered your current role’s competencies, review the next role in your pathway.</li>
      </ul>
    </div>
  </details>

  <details>
    <summary>Your role: Project Manager</summary>
    <div class="inner">
      <p>Lead the successful delivery of client projects on time, on budget, and to high standards of quality. Translate strategic intent into executable plans and coordinate people and processes to deliver measurable business value.</p>
      <p>PMs sit at the heart of the high-performing triangle (with Consultants and DoCs), representing the executional arm of delivery.</p>
    </div>
  </details>

  <details>
    <summary>Core competencies</summary>
    <div class="inner">
      <table class="table">
        <thead><tr><th>Theme</th><th>Competency</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>Project Delivery</td><td>End-to-End Ownership</td><td>Delivers small to mid-size projects from brief to completion, ensuring quality, clarity, and efficiency.</td></tr>
          <tr><td>Project Delivery</td><td>Time &amp; Budget Management</td><td>Accurately scopes and tracks budgets, timelines, and team hours. Escalates issues early.</td></tr>
          <tr><td>Client Communication</td><td>Confidence &amp; Clarity</td><td>Provides reliable, professional updates to clients and internal teams. Builds trust.</td></tr>
          <tr><td>Team Collaboration</td><td>Connector &amp; Co-ordinator</td><td>Works with Consultants, DoCs, creatives, and freelancers to ensure smooth execution.</td></tr>
          <tr><td>Quality Control</td><td>Attention to Detail</td><td>Oversees QA and ensures outputs meet standards.</td></tr>
          <tr><td>Tool Usage</td><td>Structured Delivery</td><td>Uses tools, trackers, timelines, and documentation to maintain rigour.</td></tr>
        </tbody>
      </table>
    </div>
  </details>

  <details>
    <summary>Core duties</summary>
    <div class="inner">
      <ul class="two-col">
        <li>Own the end-to-end project lifecycle</li>
        <li>Develop plans, timelines, and schedules</li>
        <li>Define scopes, deliverables, and objectives</li>
        <li>Lead kick-offs and onboarding</li>
        <li>Assign responsibilities and coordinate teams</li>
        <li>Schedule and manage resources</li>
        <li>Set expectations and remove blockers</li>
        <li>Prepare, monitor, and track budgets</li>
        <li>Manage scope and flag creep early</li>
        <li>Prepare SoWs, timelines, trackers</li>
        <li>Be the client’s go-to for logistics</li>
        <li>Maintain clear comms between teams</li>
        <li>Identify risks and mitigate early</li>
        <li>Track milestones and deliverables</li>
        <li>Maintain high delivery standards</li>
        <li>Run post-mortems to improve</li>
      </ul>
    </div>
  </details>

  <details>
    <summary>Professional competencies</summary>
    <div class="inner">
      <table class="table">
        <thead><tr><th>Theme</th><th>Competency</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>Communication</td><td>Tailored Messaging</td><td>Communicates clearly with different audiences and adapts tone appropriately.</td></tr>
          <tr><td>Problem Solving</td><td>Calm Under Pressure</td><td>Resolves delivery obstacles proactively; knows when to escalate.</td></tr>
          <tr><td>Learning Mindset</td><td>Growth &amp; Curiosity</td><td>Seeks feedback, learns from experience, and brings improvements forward.</td></tr>
          <tr><td>Process Discipline</td><td>Methodical Execution</td><td>Follows best practice delivery models and supports consistent delivery culture.</td></tr>
          <tr><td>Team Discipline</td><td>Positive Contributor</td><td>Supports others, brings energy, collaborates generously.</td></tr>
        </tbody>
      </table>
    </div>
  </details>

  <details>
    <summary>KPIs</summary>
    <div class="inner">
      <ul>
        <li><strong>On-Time, On-Budget Delivery:</strong> 90%+ projects on track</li>
        <li><strong>QA Accuracy:</strong> Minimal rework</li>
        <li><strong>Client Feedback:</strong> &gt;8/10 or “professional and dependable”</li>
        <li><strong>Tool Use Compliance:</strong> 100% accuracy and completeness</li>
        <li><strong>Internal Team Feedback:</strong> 8/10+ average</li>
        <li><strong>Handover &amp; Briefing Quality:</strong> Consistently clear and complete</li>
        <li><strong>Learning Goals Progress:</strong> 100% tracked per cycle</li>
        <li><strong>Knowledge Contribution:</strong> 1+ per quarter</li>
      </ul>
    </div>
  </details>

  <details>
    <summary>PM → Senior PM progression (snapshot)</summary>
    <div class="inner">
      <table class="table">
        <thead><tr><th>Category</th><th>Project Manager</th><th>Senior Project Manager</th></tr></thead>
        <tbody>
          <tr><td>Scope</td><td>Small to mid-size projects</td><td>Complex, multi-workstream programmes</td></tr>
          <tr><td>Client Role</td><td>Supports delivery conversations</td><td>Primary delivery contact &amp; escalation</td></tr>
          <tr><td>Leadership</td><td>Supports team; flags risks</td><td>Mentors PMs; leads improvements</td></tr>
          <tr><td>Commercial</td><td>Tracks budget &amp; timelines</td><td>Owns programme-level budgets</td></tr>
          <tr><td>Strategic</td><td>Executes to brief with support</td><td>Translates strategy into delivery</td></tr>
          <tr><td>Tools &amp; Process</td><td>Applies tools with guidance</td><td>Champions process improvement</td></tr>
        </tbody>
      </table>
    </div>
  </details>
</section>
`;

// 2) simple inline SVG set (no emoji flicker)
const ROLE_ICONS = [
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><line x1="12" y1="7" x2="12" y2="13" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="17" r="1.5" fill="currentColor"/></svg>',
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 12h18M12 3v18" stroke="currentColor" stroke-width="2" opacity=".25"/><path d="M4 12a8 8 0 0 1 16 0" stroke="currentColor" stroke-width="2"/></svg>',
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" stroke-width="2"/><rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" stroke-width="2"/></svg>',
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="10" rx="2" stroke="currentColor" stroke-width="2"/><path d="M7 7v10M17 7v10" stroke="currentColor" stroke-width="2" opacity=".3"/></svg>',
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3l3.09 6.26L22 10l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.87 2 10l6.91-.74L12 3z" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 17l6-6 4 4 7-7" stroke="currentColor" stroke-width="2"/><path d="M3 21h18" stroke="currentColor" stroke-width="2" opacity=".3"/></svg>',
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7 21V8l5-5 5 5v13" stroke="currentColor" stroke-width="2"/><path d="M7 13h10" stroke="currentColor" stroke-width="2" opacity=".3"/></svg>'
];

// 3) Decorate details ONCE, based on preserved original titles
function enhanceRoleProfile(container){
  if (container.dataset.enhanced === "1") return; // whole container already done

  const titles = [];
  container.querySelectorAll("details").forEach((d, idx) => {
    if (d.dataset.enhanced === "1") return; // this block already done

    const summary = d.querySelector("summary");
    if(!summary) return;

    // Preserve original title (first run only)
    const original = d.dataset.title || summary.textContent.trim();
    d.dataset.title = original;
    titles.push(original);

    const id = "sec-" + original.toLowerCase().replace(/[^a-z0-9]+/g,"-");
    d.id = id;

    const tag =
      idx===0 ? "Overview" :
      /core competencies/i.test(original) ? "Core" :
      /professional/i.test(original) ? "Professional" :
      /kpi/i.test(original) ? "KPIs" :
      /progression/i.test(original) ? "Pathway" : "Section";

    const iconSvg = ROLE_ICONS[idx % ROLE_ICONS.length];

    // Write a fresh, clean summary using the preserved title
    summary.innerHTML = `
      <span class="icon" aria-hidden="true">${iconSvg}</span>
      <span class="title">${original}</span>
      <span class="tag">${tag}</span>
      <span class="chev">›</span>
    `;

    // Wrap body content once
    if (!d.querySelector(".inner")) {
      const rest = Array.from(d.childNodes).filter(n => n.nodeName.toLowerCase() !== "summary");
      const wrap = document.createElement("div");
      wrap.className = "inner";
      rest.forEach(n => wrap.appendChild(n));
      d.appendChild(wrap);
    }

    d.dataset.enhanced = "1";
  });

  // Build TOC exactly once
  const toc = document.getElementById("tocLinks");
  if (toc && !toc.dataset.enhanced) {
    // Build links
    toc.innerHTML = titles.map(t => {
      const id = "sec-" + t.toLowerCase().replace(/[^a-z0-9]+/g,"-");
      return `<a href="#${id}">${t}</a>`;
    }).join("");
    toc.dataset.enhanced = "1";
  }

  // Add click handler once: open closed section, then smooth scroll
  if (toc && !toc.dataset.handlers) {
    toc.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      e.preventDefault();

      const id = a.getAttribute("href").slice(1);
      const sec = document.getElementById(id);
      if (!sec) return;

      // If it's a <details> and closed, open it first
      if (sec.tagName.toLowerCase() === "details" && !sec.open) {
        sec.open = true;
      }

      // Smooth scroll with an extra offset for comfort
      const HEADER_OFFSET = 80;
      const y = sec.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      window.scrollTo({ top: y, behavior: "smooth" });
    }, { passive: false });

    toc.dataset.handlers = "1";
  }

  // Scrollspy once per container
  if (!container.dataset.spy) {
    const tocLinks = toc ? toc.querySelectorAll("a") : [];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const link = Array.from(tocLinks).find(a => a.getAttribute("href") === `#${entry.target.id}`);
        if (link) link.classList.toggle("active", entry.isIntersecting && entry.intersectionRatio > 0.2);
      });
    }, { rootMargin: "-20% 0px -70% 0px", threshold: [0, 0.25, 1] });

    container.querySelectorAll("details").forEach(sec => observer.observe(sec));
    container.dataset.spy = "1";
  }

  // Expand/Collapse handlers once
  if (!container.dataset.bound) {
    const expandAll = document.getElementById("expandAll");
    const collapseAll = document.getElementById("collapseAll");
    if (expandAll) expandAll.onclick = () => container.querySelectorAll("details").forEach(d => d.open = true);
    if (collapseAll) collapseAll.onclick = () => container.querySelectorAll("details").forEach(d => d.open = false);
    container.dataset.bound = "1";
  }

  container.dataset.enhanced = "1";
}

// 4) Load once, decorate once
async function onRoleReady(){
  const target = document.getElementById("roleProfile");
  if (!target) return;
  const role = getRole();
  const currentRole = target.dataset.role;

  // If role is different, reset content and loaded/enhanced flags
  if (currentRole !== role) {
      target.innerHTML = '';
      target.dataset.loaded = '';
      target.dataset.enhanced = '';
      target.dataset.spy = ''; // also reset scrollspy
      target.dataset.bound = ''; // and expand/collapse buttons
      const toc = document.getElementById("tocLinks");
      if (toc) {
          toc.innerHTML = '';
          toc.dataset.enhanced = '';
          toc.dataset.handlers = '';
      }
  }

  if (!target.dataset.loaded) {
    target.dataset.role = role; // Store the current role
    try {
      const path = `data/${role}/competencies.html`;
      const r = await fetch(path, {cache:"no-cache"});
      target.innerHTML = r.ok ? await r.text() : ROLE_FALLBACK_HTML;
    } catch {
      target.innerHTML = ROLE_FALLBACK_HTML;
    }
    target.dataset.loaded = "1";
  }

  enhanceRoleProfile(target);
}


/* ----------------------- PEP FFF PREP ------------------------------------ */
const PEP_QUESTIONS = [
  "Looking back, what skills or strengths have you developed most this year, and how have they helped you in your role?",
  "What feedback have you received this year that you’ve acted on, and what impact did it have?",
  "Consider your Competency Framework: what are you currently achieving?",
  "What 2-3 things you want to challenge yourself on next year, and how would this help your growth and the teams’ success?",
  "Where do you see yourself adding the most value in the next 12 months?",
  "What do you want to learn, try, or achieve next year that will support your growth?",
  "How have you brought our values of United, Brilliant, and Unstoppable to life in your role this year?",
  "What could you do differently next year to live our values even more fully?"
];

function renderPep(){
  const pepQuestionsEl = document.getElementById("pepQuestions");
  if (!pepQuestionsEl) return;

  // Only render once
  if (pepQuestionsEl.dataset.rendered) return;
  pepQuestionsEl.dataset.rendered = "1";

  pepQuestionsEl.innerHTML = "";
  PEP_QUESTIONS.forEach((q, i) => {
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <label for="pep_q_${i}">${q}</label>
      <textarea id="pep_q_${i}" placeholder="Type your reflection..."></textarea>
    `;
    pepQuestionsEl.appendChild(wrap);
  });

  const pepResetBtn = document.getElementById("pepReset");
  if (pepResetBtn) {
    pepResetBtn.addEventListener("click", () => {
      ["pepDate","pepName","pepManager"].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = "";
      });
      pepQuestionsEl.querySelectorAll("textarea").forEach(t => t.value = "");
    });
  }

  const pepDownloadBtn = document.getElementById("pepDownload");
  if (pepDownloadBtn) {
    pepDownloadBtn.addEventListener("click", () => {
      const date = (document.getElementById("pepDate") || {}).value || "";
      const name = (document.getElementById("pepName") || {}).value || "";
      const manager = (document.getElementById("pepManager") || {}).value || "";
      const answers = PEP_QUESTIONS.map((_, i) => {
        const el = document.getElementById(`pep_q_${i}`); return el ? el.value : "";
      });

      const printable = window.open("", "_blank");
      printable.document.write(`<!doctype html><html><head>
        <meta charset="utf-8"><title>PEP FFF Prep</title>
        <style>
          body{ font-family: Arial, sans-serif; padding:20px; }
          h1{ margin:0 0 10px; }
          .meta{ margin-bottom:12px; }
          .qa{ margin:12px 0; page-break-inside:avoid; }
          .qa h3{ font-size:14px; margin:0 0 6px; }
          .qa p{ white-space:pre-wrap; border:1px solid #ddd; padding:10px; border-radius:8px; }
          @media print{ .no-print{ display:none } }
        </style>
      </head><body>
        <h1>PEP FFF Prep</h1>
        <div class="meta"><strong>Date:</strong> ${date} &nbsp;&nbsp; <strong>Name:</strong> ${name} &nbsp;&nbsp; <strong>Line manager:</strong> ${manager}</div>
        ${PEP_QUESTIONS.map((q, idx) => `
          <div class="qa">
            <h3>${q}</h3>
            <p>${(answers[idx] || "").replace(/</g,"&lt;")}</p>
          </div>
        `).join("")}
        <p class="no-print"><em>Tip: Save this as PDF and upload to your team’s PEP channel in Microsoft Teams.</em></p>
        <script>window.onload = () => window.print();<\/script>
      </body></html>`);
      printable.document.close();
    });
  }
}

document.addEventListener("DOMContentLoaded", renderPep);

/* ----------------------- EVALUATE (SLIDERS + RADAR) ---------------------- */
// Fallback data in case /data/*.json are missing
const COMP_FALLBACK = [
  {"theme":"Project Delivery","competency":"End-to-End Ownership","description":"Delivers projects from brief to completion with quality and clarity."},
  {"theme":"Project Delivery","competency":"Time & Budget Management","description":"Scopes and tracks budgets, timelines, and hours accurately."},
  {"theme":"Client Communication","competency":"Confidence & Clarity","description":"Provides reliable, professional updates; builds trust."},
  {"theme":"Team Collaboration","competency":"Connector & Co-ordinator","description":"Coordinates internal teams and freelancers for smooth delivery."},
  {"theme":"Quality Control","competency":"Attention to Detail","description":"Oversees QA so outputs meet standards."},
  {"theme":"Tool Usage","competency":"Structured Delivery","description":"Uses PM tools and documentation to maintain rigour."}
];
const RUBRIC_FALLBACK = [
  {"score":1,"label":"Needs development","desc":"Significant support required; outcomes often below expectations."},
  {"score":2,"label":"Developing","desc":"Inconsistent performance; meets expectations with guidance."},
  {"score":3,"label":"Solid","desc":"Consistently meets expectations for the role."},
  {"score":4,"label":"Strong","desc":"Often exceeds expectations; shows initiative and impact."},
  {"score":5,"label":"Outstanding","desc":"Regularly exceeds expectations with significant, sustained impact."}
];

let competencies = [];
let selfScores = [];
let peerScores = null;

const slidersEl = document.getElementById("sliders");
const radarCanvas = document.getElementById("radar");
const rubricWrap = document.getElementById("scoringRubric");

async function loadEvaluateData() {
    const role = getRole();
    const path = `data/${role}/competencies.json`;
    const items = await fetchJson(path);
    competencies = Array.isArray(items) && items.length ? items : COMP_FALLBACK;
    selfScores = new Array(competencies.length).fill(0);
    peerScores = null; // Also reset peer scores.
    renderSliders();
    drawRadar();
}
window.loadEvaluateData = loadEvaluateData;

function renderSliders(){
  if (!slidersEl) return;
  slidersEl.innerHTML = "";
  competencies.forEach((item, i) => {
    const row = document.createElement("div");
    row.className = "slider-row";
    row.innerHTML = `
      <div>
        <div><strong>${item.competency}</strong></div>
        <div class="small">${item.theme}${item.description ? " • " + item.description : ""}</div>
      </div>
      <input type="range" min="0" max="5" step="1" value="${selfScores[i]}" data-idx="${i}">
      <div class="badge">${selfScores[i]}</div>
    `;
    slidersEl.appendChild(row);
  });
  slidersEl.querySelectorAll('input[type="range"]').forEach(sl => {
    sl.addEventListener("input", () => {
      const idx = +sl.dataset.idx;
      selfScores[idx] = +sl.value;
      sl.parentElement.querySelector(".badge").textContent = sl.value;
      drawRadar();
    });
  });
}

function drawRadar(){
  if (!radarCanvas) return;
  const ctx = radarCanvas.getContext("2d");
  const w = radarCanvas.width, h = radarCanvas.height;
  const cx = w/2, cy = h/2, radius = Math.min(w,h)/2 - 40;
  const n = competencies.length || 5;
  const maxScore = 5;

  ctx.clearRect(0,0,w,h);
  ctx.save(); ctx.translate(cx, cy);

  // grid
  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue("--muted");
  ctx.globalAlpha = 0.5;
  for(let r=1;r<=maxScore;r++){
    ctx.beginPath();
    for(let i=0;i<n;i++){
      const angle = (Math.PI*2*i/n) - Math.PI/2;
      const x = Math.cos(angle) * (radius*r/maxScore);
      const y = Math.sin(angle) * (radius*r/maxScore);
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // axes
  for(let i=0;i<n;i++){
    const angle = (Math.PI*2*i/n) - Math.PI/2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(x,y); ctx.stroke();
  }

  // labels
  ctx.font = "12px Arial";
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--ink");
  competencies.forEach((c, i) => {
    const angle = (Math.PI*2*i/n) - Math.PI/2;
    const x = Math.cos(angle) * (radius + 14);
    const y = Math.sin(angle) * (radius + 14);
    const text = c.competency;
    const metrics = ctx.measureText(text);
    ctx.fillText(text, x - metrics.width/2, y + 4);
  });

  // polygon helper
  function pathFor(scores){
    ctx.beginPath();
    scores.forEach((s, i) => {
      const angle = (Math.PI*2*i/n) - Math.PI/2;
      const r = radius * (s/maxScore);
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.closePath();
  }

  // self
  ctx.save();
  ctx.strokeStyle = "#e01f2d";
  ctx.fillStyle = "rgba(224,31,45,0.18)";
  pathFor(selfScores);
  ctx.fill(); ctx.stroke();
  ctx.restore();

  // peer
  if(peerScores){
    ctx.save();
    ctx.strokeStyle = "#1f77b4";
    ctx.fillStyle = "rgba(31,119,180,0.18)";
    pathFor(peerScores);
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function bindEvaluateActions(){
  const resetBtn = document.getElementById("resetScores");
  if (resetBtn) resetBtn.onclick = () => { selfScores = selfScores.map(()=>0); renderSliders(); drawRadar(); };

  const exportBtn = document.getElementById("exportSelf");
  if (exportBtn) exportBtn.onclick = () => {
    const payload = { label: "Self", scores: selfScores, competencies: competencies.map(c => c.competency) };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "scores-self.json"; a.click();
  };

  const importInput = document.getElementById("importPeer");
  if (importInput) importInput.addEventListener("change", (e) => {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const data = JSON.parse(reader.result);
        if(Array.isArray(data.scores)){
          peerScores = data.scores.slice(0, competencies.length);
          drawRadar();
        }
      }catch{ alert("Could not read JSON file."); }
    };
    reader.readAsText(file);
  });

  const downloadPng = document.getElementById("downloadPNG");
  if (downloadPng && radarCanvas){
    downloadPng.onclick = () => {
      const a = document.createElement("a");
      a.href = radarCanvas.toDataURL("image/png");
      a.download = "radar-chart.png";
      a.click();
    };
  }

  const printSummary = document.getElementById("printSummary");
  if (printSummary && radarCanvas){
    printSummary.onclick = () => {
      const rows = competencies.map((c,i)=>`
        <tr><td>${c.theme}</td><td>${c.competency}</td><td>${selfScores[i]}</td><td>${peerScores? (peerScores[i] ?? "") : ""}</td></tr>
      `).join("");
      const chart = radarCanvas.toDataURL("image/png");
      const w = window.open("", "_blank");
      w.document.write(`<!doctype html><html><head>
        <meta charset="utf-8"><title>Evaluation Summary</title>
        <style>
          body{ font-family: Arial, sans-serif; padding:20px; }
          h1{ margin:0 0 10px; }
          table{ border-collapse: collapse; width:100%; margin-top:10px; }
          th,td{ border:1px solid #ddd; padding:8px; }
          th{ background:#f3f3f3; text-align:left; }
          img{ max-width: 640px; height:auto; display:block; margin:12px 0; }
          @media print{ .no-print{ display:none } }
        </style>
      </head><body>
        <h1>Evaluation Summary</h1>
        <img src="${chart}" alt="Radar chart">
        <table>
          <thead><tr><th>Theme</th><th>Competency</th><th>Self</th><th>Peer</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="no-print"><em>Tip: Save this as PDF and upload to your team’s PEP channel in Microsoft Teams.</em></p>
        <script>window.onload = () => window.print();<\/script>
      </body></html>`);
      w.document.close();
    };
  }
}

async function initEvaluate(){
  await loadEvaluateData();

  const rubric = await fetchJson("data/scoring.json");
  const list = Array.isArray(rubric) && rubric.length ? rubric : RUBRIC_FALLBACK;
  if (rubricWrap) {
    rubricWrap.innerHTML = list.map(r => `
      <div class="slider-row" style="grid-template-columns: 44px 1fr;">
        <div class="badge"><strong>${r.score}</strong></div>
        <div><strong>${r.label}</strong><div class="small">${r.desc}</div></div>
      </div>
    `).join("");
  }

  bindEvaluateActions();
}

document.addEventListener("DOMContentLoaded", () => {
  renderPep();
  initEvaluate();
});

// SPA navigation
const sections = ["home","role","pep","evaluate"];
document.querySelectorAll("[data-nav]").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-nav");
    setRoute(target);
  });
});
function setRoute(route){
  sections.forEach(id => document.getElementById(id).classList.toggle("active", id===route));
  location.hash = route;
}
window.addEventListener("hashchange", () => {
  const route = location.hash.replace("#","") || "home";
  if(sections.includes(route)) setRoute(route);
});
setRoute(location.hash.replace("#","") || "home");

// Dark mode
const toggleThemeBtn = document.getElementById("toggleTheme");
const themePref = localStorage.getItem("sa-theme");
if(themePref==="dark"){ document.body.classList.add("dark"); }
toggleThemeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("sa-theme", document.body.classList.contains("dark") ? "dark" : "light");
});

// Load role profile content
fetch("data/competencies.html").then(r=>r.text()).then(html => {
  document.getElementById("roleProfile").innerHTML = html;
});

// PEP questions
const pepQuestionsEl = document.getElementById("pepQuestions");
fetch("data/pep_questions.json").then(r=>r.json()).then(questions => {
  questions.forEach((q, i) => {
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <label for="q_${i}">${q}</label>
      <textarea id="q_${i}" placeholder="Type your reflection..."></textarea>
    `;
    pepQuestionsEl.appendChild(wrap);
  });
});

// Reset and Print to PDF for PEP
document.getElementById("pepReset").addEventListener("click", () => {
  document.getElementById("pepDate").value = "";
  document.getElementById("pepName").value = "";
  document.getElementById("pepManager").value = "";
  pepQuestionsEl.querySelectorAll("textarea").forEach(t => t.value = "");
});
document.getElementById("pepDownload").addEventListener("click", () => {
  const date = document.getElementById("pepDate").value;
  const name = document.getElementById("pepName").value;
  const manager = document.getElementById("pepManager").value;
  const answers = [...pepQuestionsEl.querySelectorAll("textarea")].map(t => t.value);

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
    <div class="meta"><strong>Date:</strong> ${date || ""} &nbsp;&nbsp; <strong>Name:</strong> ${name || ""} &nbsp;&nbsp; <strong>Line manager:</strong> ${manager || ""}</div>
    ${[...pepQuestionsEl.querySelectorAll("label")].map((lab, idx) => `
      <div class="qa">
        <h3>${lab.textContent}</h3>
        <p>${answers[idx] ? answers[idx].replace(/</g,"&lt;") : ""}</p>
      </div>
    `).join("")}
    <p class="no-print"><em>Tip: Save this as PDF and upload to your team’s PEP channel in Microsoft Teams.</em></p>
    <script>window.onload = () => window.print();<\/script>
  </body></html>`);
  printable.document.close();
});

// Evaluate progress
let competencies = [];
let selfScores = [];
let peerScores = null;

const slidersEl = document.getElementById("sliders");
const radarCanvas = document.getElementById("radar");
const ctx = radarCanvas.getContext("2d");

fetch("data/competencies.json").then(r=>r.json()).then(items => {
  competencies = items;
  selfScores = new Array(competencies.length).fill(0);
  renderSliders();
  drawRadar();
});

function renderSliders(){
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
    sl.addEventListener("input", (e) => {
      const idx = +sl.dataset.idx;
      selfScores[idx] = +sl.value;
      sl.parentElement.querySelector(".badge").textContent = sl.value;
      drawRadar();
    });
  });
}

document.getElementById("resetScores").addEventListener("click", () => {
  selfScores = selfScores.map(_ => 0);
  renderSliders();
  drawRadar();
});

// Export / Import peer JSON
document.getElementById("exportSelf").addEventListener("click", () => {
  const payload = {
    label: "Self",
    scores: selfScores,
    competencies: competencies.map(c => c.competency)
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "scores-self.json";
  a.click();
});
document.getElementById("importPeer").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const data = JSON.parse(reader.result);
      if(Array.isArray(data.scores)){
        peerScores = data.scores.slice(0, competencies.length);
        drawRadar();
      }
    }catch(err){
      alert("Could not read JSON file.");
    }
  };
  reader.readAsText(file);
});

// Scoring rubric
fetch("data/scoring.json").then(r=>r.json()).then(rubric => {
  const wrap = document.getElementById("scoringRubric");
  wrap.innerHTML = rubric.map(r => `
    <div class="slider-row" style="grid-template-columns: 44px 1fr;">
      <div class="badge"><strong>${r.score}</strong></div>
      <div><strong>${r.label}</strong><div class="small">${r.desc}</div></div>
    </div>
  `).join("");
});

// Simple radar drawing (no external libs)
function drawRadar(){
  const w = radarCanvas.width, h = radarCanvas.height;
  const cx = w/2, cy = h/2, radius = Math.min(w,h)/2 - 40;
  const n = competencies.length || 5;
  const maxScore = 5;

  ctx.clearRect(0,0,w,h);

  // grid
  ctx.save();
  ctx.translate(cx, cy);
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
    ctx.beginPath();
    ctx.moveTo(0,0); ctx.lineTo(x,y); ctx.stroke();
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

  // peer overlay
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

// Download PNG
document.getElementById("downloadPNG").addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = radarCanvas.toDataURL("image/png");
  a.download = "radar-chart.png";
  a.click();
});

// Print summary (chart + table)
document.getElementById("printSummary").addEventListener("click", () => {
  const printable = window.open("", "_blank");
  const rows = competencies.map((c,i)=>`
    <tr><td>${c.theme}</td><td>${c.competency}</td><td>${selfScores[i]}</td><td>${peerScores? peerScores[i] ?? "" : ""}</td></tr>
  `).join("");
  const chart = radarCanvas.toDataURL("image/png");
  printable.document.write(`<!doctype html><html><head>
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
  printable.document.close();
});

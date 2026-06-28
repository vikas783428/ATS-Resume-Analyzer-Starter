document.addEventListener("DOMContentLoaded", () => {

let uploadedResumeText = "";
let keywordChart = null;

// ---------------- ELEMENTS ----------------
const analyzeBtn = document.getElementById("analyzeBtn");
const resumeFile = document.getElementById("resumeFile");
const resumeText = document.getElementById("resumeText");
const jobDescription = document.getElementById("jobDescription");

const matchedSkills = document.getElementById("matchedSkills");
const missingSkills = document.getElementById("missingSkills");
const technicalSkills = document.getElementById("technicalSkills");
const softSkills = document.getElementById("softSkills");
const formatAnalysis = document.getElementById("formatAnalysis");

const scoreText = document.getElementById("scoreText");
const progressCircle = document.getElementById("progressCircle");

const strengthBar = document.getElementById("strengthBar");
const completeBar = document.getElementById("completeBar");
const strengthValue = document.getElementById("strengthValue");
const completeValue = document.getElementById("completeValue");

// NEW ELEMENTS (FIX)
const themeBtn = document.getElementById("themeBtn");
const downloadBtn = document.getElementById("downloadPDF");

// ✅ FIX: missing elements added
const grammarSuggestions = document.getElementById("grammarSuggestions");
const suggestions = document.getElementById("suggestions");

// ---------------- DARK MODE FIX ----------------
themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  themeBtn.innerText =
    document.body.classList.contains("dark")
      ? "☀️ Light Mode"
      : "🌙 Dark Mode";
});

// ---------------- DOWNLOAD REPORT FIX ----------------
downloadBtn.addEventListener("click", () => {

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const resume = resumeText.value || uploadedResumeText;
  const job = jobDescription.value;

  doc.setFontSize(14);
  doc.text("ATS Resume Report", 10, 10);

  doc.setFontSize(11);
  doc.text("ATS Score: " + scoreText.innerText, 10, 25);

  doc.text("Resume:", 10, 40);
  doc.text(resume.substring(0, 900), 10, 50);

  doc.text("Job Description:", 10, 120);
  doc.text(job.substring(0, 900), 10, 130);

  doc.save("ATS_Report.pdf");
});

// ---------------- FILE UPLOAD ----------------
resumeFile.addEventListener("change", async (e) => {

  const file = e.target.files[0];
  if (!file) return;

  const ext = file.name.split(".").pop().toLowerCase();

  if (ext === "txt") {
    uploadedResumeText = await file.text();
  }

  else if (ext === "pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(" ") + " ";
    }

    uploadedResumeText = text;
  }

  else if (ext === "docx") {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    uploadedResumeText = result.value;
  }
});

// ---------------- HELPERS ----------------
function cleanWords(text) {
  return text.toLowerCase()
    .replace(/[^\w\s+#.]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2);
}

function renderList(el, arr) {
  el.innerHTML = arr.length
    ? arr.map(i => `<li>${i}</li>`).join("")
    : "<li>None</li>";
}

function calculateScore(match, total) {
  return total === 0 ? 0 : Math.round((match / total) * 100);
}

function updateUI(score) {
  scoreText.innerText = score + "%";
  progressCircle.style.strokeDasharray = 440;
  progressCircle.style.strokeDashoffset = 440 - (score / 100) * 440;

  strengthBar.style.width = score + "%";
  completeBar.style.width = Math.min(score + 15, 100) + "%";

  strengthValue.innerText = score + "%";
  completeValue.innerText = Math.min(score + 15, 100) + "%";
}

// ---------------- KEYWORD CHART ----------------
function updateKeywordChart(jobWords, resumeWords) {

  const counts = {};

  jobWords.forEach(word => {
    const count = resumeWords.filter(w => w === word).length;
    if (count > 0) counts[word] = count;
  });

  const labels = Object.keys(counts);
  const data = Object.values(counts);

  const canvas = document.getElementById("keywordChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (keywordChart) keywordChart.destroy();

  keywordChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Keyword Density",
        data,
        backgroundColor: "#4f46e5"
      }]
    }
  });
}

// ---------------- ANALYZE ----------------
analyzeBtn.addEventListener("click", () => {

  const resume =
    resumeText.value.trim() || uploadedResumeText.trim();

  const job = jobDescription.value.trim();

  if (!resume) return alert("Please upload or paste a resume.");
  if (!job) return alert("Please enter Job Description.");

  const rWords = cleanWords(resume);
  const jWords = cleanWords(job);

  const matched = jWords.filter(w => rWords.includes(w));
  const missing = jWords.filter(w => !rWords.includes(w));

  const score = calculateScore(matched.length, jWords.length);
  updateUI(score);

  renderList(matchedSkills, matched);
  renderList(missingSkills, missing);

  renderList(technicalSkills,
    ['html','css','javascript','react','node','sql','python','java','spring','git']
      .filter(s => resume.toLowerCase().includes(s))
  );

  renderList(softSkills,
    ['communication','teamwork','leadership']
      .filter(s => resume.toLowerCase().includes(s))
  );

  renderList(formatAnalysis, [
    resume.length > 300 ? "Good length" : "Too short",
    resume.includes("@") ? "Has Email" : "Missing Email",
    resume.toLowerCase().includes("experience") ? "Has Experience" : "Missing Experience"
  ]);

  updateKeywordChart(jWords, rWords);

  // ---------------- GRAMMAR SUGGESTIONS ----------------
  const grammarIssues = [];

  if (resume.includes("  ")) grammarIssues.push("Extra spaces found");
  if (!resume.match(/[.!?]$/)) grammarIssues.push("Resume should end with proper punctuation");
  if (resume.toLowerCase() === resume) grammarIssues.push("Add proper capitalization");

  // ---------------- IMPROVEMENT SUGGESTIONS ----------------
  const improvementSuggestions = [];

  if (resume.length < 300) improvementSuggestions.push("Add more detail to your resume");
  if (!resume.toLowerCase().includes("project")) improvementSuggestions.push("Add project section");
  if (!resume.toLowerCase().includes("experience")) improvementSuggestions.push("Add work experience section");
  if (!resume.toLowerCase().includes("skills")) improvementSuggestions.push("Highlight key skills");

  // ---------------- RENDER ----------------
  renderList(grammarSuggestions, grammarIssues);
  renderList(suggestions, improvementSuggestions);
});

});
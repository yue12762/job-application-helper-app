const applicationForm = document.querySelector("#application-form");
const jobDescription = document.querySelector("#job-description");
const candidateBackground = document.querySelector("#candidate-background");
const resultMessage = document.querySelector("#result-message");
const submitButton = applicationForm.querySelector('button[type="submit"]');

function createList(items) {
  if (!items.length) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent = "目前沒有可列出的項目。";
    return emptyMessage;
  }

  const list = document.createElement("ul");

  items.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    list.append(listItem);
  });

  return list;
}

function createAnalysisSection(title, items) {
  const section = document.createElement("section");
  const heading = document.createElement("h3");

  section.className = "analysis-section";
  heading.textContent = title;
  section.append(heading, createList(items));

  return section;
}

function renderAnalysis(analysis) {
  const coverLetterSection = document.createElement("section");
  const coverLetterHeading = document.createElement("h3");
  const coverLetter = document.createElement("p");

  coverLetterSection.className = "analysis-section cover-letter";
  coverLetterHeading.textContent = "簡短自我推薦信";
  coverLetter.textContent = analysis.coverLetter;
  coverLetterSection.append(coverLetterHeading, coverLetter);

  resultMessage.replaceChildren(
    createAnalysisSection("職缺重點", analysis.jobHighlights),
    createAnalysisSection("符合的能力（Confirmed）", analysis.confirmedCapabilities),
    createAnalysisSection("合理推測的能力（Inferred）", analysis.inferredCapabilities),
    createAnalysisSection(
      "尚未確認的能力或資訊（Unknown）",
      analysis.unknownCapabilities,
    ),
    createAnalysisSection("求職建議", analysis.recommendations),
    coverLetterSection,
  );
}

applicationForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const jd = jobDescription.value.trim();
  const background = candidateBackground.value.trim();

  resultMessage.classList.remove("is-warning", "is-loading");

  if (!jd || !background) {
    resultMessage.textContent = "請補充職缺 JD 與你的背景資料後再開始分析。";
    resultMessage.classList.add("is-warning");

    if (!jd) {
      jobDescription.focus();
    } else {
      candidateBackground.focus();
    }

    return;
  }

  resultMessage.textContent = "分析中……";
  resultMessage.classList.add("is-loading");
  submitButton.disabled = true;

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ jd, background }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || "伺服器暫時無法完成分析");
    }

    if (!data?.analysis) {
      throw new Error("分析結果格式不完整，請稍後再試");
    }

    renderAnalysis(data.analysis);
    resultMessage.classList.remove("is-loading");
  } catch (error) {
    resultMessage.textContent = `無法完成分析：${error.message}`;
    resultMessage.classList.remove("is-loading");
    resultMessage.classList.add("is-warning");
  } finally {
    submitButton.disabled = false;
  }
});

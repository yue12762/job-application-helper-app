const applicationForm = document.querySelector("#application-form");
const jobDescription = document.querySelector("#job-description");
const candidateBackground = document.querySelector("#candidate-background");
const resultMessage = document.querySelector("#result-message");
const submitButton = applicationForm.querySelector('button[type="submit"]');
const saveProfileButton = document.querySelector("#save-profile");
const profileStatus = document.querySelector("#profile-status");
const saveStructuredProfileButton = document.querySelector("#save-structured-profile");
const structuredProfileStatus = document.querySelector("#structured-profile-status");
const legacyProfileSection = document.querySelector("#legacy-profile-section");
const profileCategories = document.querySelector(".profile-categories");
const profileEditorDialog = document.querySelector("#profile-editor-dialog");
const profileEditorForm = document.querySelector("#profile-editor-form");
const profileEditorTitle = document.querySelector("#profile-editor-title");
const profileEditorFields = document.querySelector("#profile-editor-fields");
const profileEditorError = document.querySelector("#profile-editor-error");
const closeProfileEditorButton = document.querySelector("#close-profile-editor");
const cancelProfileEditorButton = document.querySelector("#cancel-profile-editor");
const profileSupplementDialog = document.querySelector("#profile-supplement-dialog");
const profileSupplementForm = document.querySelector("#profile-supplement-form");
const profileSupplementRequirement = document.querySelector(
  "#profile-supplement-requirement",
);
const profileSupplementCategory = document.querySelector(
  "#profile-supplement-category",
);
const profileSupplementFields = document.querySelector("#profile-supplement-fields");
const profileSupplementError = document.querySelector("#profile-supplement-error");
const closeProfileSupplementButton = document.querySelector(
  "#close-profile-supplement",
);
const cancelProfileSupplementButton = document.querySelector(
  "#cancel-profile-supplement",
);
const jdImageInput = document.querySelector("#jd-image-input");
const jdImagePreview = document.querySelector("#jd-image-preview");
const jdPreviewImage = document.querySelector("#jd-preview-image");
const jdImageName = document.querySelector("#jd-image-name");
const jdUploadStatus = document.querySelector("#jd-upload-status");
const removeJdImageButton = document.querySelector("#remove-jd-image");
const LEGACY_PROFILE_STORAGE_KEY = "jobApplicationHelper.profile.background";
const STRUCTURED_PROFILE_STORAGE_KEY = "jobApplicationHelper.profile.v2";
const SUPPORTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const SUPPORTED_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
let jdImageObjectUrl = null;
let jdImageDataUrl = null;
let jdImageReadVersion = 0;
let isReadingJdImage = false;
let structuredProfile = createEmptyStructuredProfile();
let activeProfileEditor = null;
let activeSupplementRequirement = "";

const PROFILE_CATEGORY_CONFIG = {
  skills: {
    label: "技能",
    emptyMessage: "尚未新增技能。",
    fields: [
      {
        name: "name",
        label: "技能名稱",
        placeholder: "例如：Figma、JavaScript、AI 工具",
        required: true,
      },
    ],
  },
  certifications: {
    label: "證照 / 專業證明",
    emptyMessage: "尚未新增證照或專業證明。",
    fields: [
      {
        name: "name",
        label: "證照 / 專業證明名稱",
        placeholder: "例如：Adobe Certified Professional Illustrator",
        required: true,
      },
    ],
  },
  experiences: {
    label: "經驗",
    emptyMessage: "尚未新增經驗。",
    fields: [
      {
        name: "name",
        label: "經驗名稱",
        placeholder: "例如：社群粉絲專頁經營",
        required: true,
      },
      {
        name: "description",
        label: "經驗描述",
        placeholder: "例如：社群文案、貼文內容規劃、活動對外聯絡",
        required: true,
        multiline: true,
      },
    ],
  },
  projects: {
    label: "作品 / 專案",
    emptyMessage: "尚未新增作品或專案。",
    fields: [
      {
        name: "name",
        label: "作品 / 專案名稱",
        placeholder: "例如：YouTube Shorts",
        required: true,
      },
      {
        name: "description",
        label: "描述",
        placeholder: "例如：短影音企劃、剪輯、AI 內容製作",
        required: true,
        multiline: true,
      },
      {
        name: "url",
        label: "作品連結（選填）",
        placeholder: "https://example.com/project",
        type: "url",
        required: false,
      },
    ],
  },
  strengths: {
    label: "其他求職能力 / 優勢",
    emptyMessage: "尚未新增其他能力或優勢。",
    fields: [
      {
        name: "name",
        label: "能力 / 優勢",
        placeholder: "例如：溝通協作、流行趨勢觀察",
        required: true,
      },
    ],
  },
};

function isSupportedImage(file) {
  const lowerCaseName = file.name.toLowerCase();
  const hasSupportedType = SUPPORTED_IMAGE_TYPES.has(file.type);
  const hasSupportedExtension = SUPPORTED_IMAGE_EXTENSIONS.some((extension) =>
    lowerCaseName.endsWith(extension),
  );

  return hasSupportedType && hasSupportedExtension;
}

function clearJdImage() {
  jdImageReadVersion += 1;
  isReadingJdImage = false;
  jdImageDataUrl = null;

  if (jdImageObjectUrl) {
    URL.revokeObjectURL(jdImageObjectUrl);
    jdImageObjectUrl = null;
  }

  jdImageInput.value = "";
  jdPreviewImage.removeAttribute("src");
  jdImageName.textContent = "";
  jdImagePreview.hidden = true;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("無法讀取圖片")));
    reader.readAsDataURL(file);
  });
}

jdImageInput.addEventListener("change", async () => {
  const [file] = jdImageInput.files;

  if (!file) {
    return;
  }

  if (!isSupportedImage(file)) {
    clearJdImage();
    jdUploadStatus.textContent = "請選擇 PNG、JPG、JPEG 或 WEBP 圖片";
    return;
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    clearJdImage();
    jdUploadStatus.textContent = "圖片大小不可超過 5 MB，請縮小圖片後再試";
    return;
  }

  const readVersion = ++jdImageReadVersion;
  isReadingJdImage = true;
  jdUploadStatus.textContent = "正在讀取職缺截圖……";

  try {
    const dataUrl = await readFileAsDataUrl(file);

    if (readVersion !== jdImageReadVersion) {
      return;
    }

    if (jdImageObjectUrl) {
      URL.revokeObjectURL(jdImageObjectUrl);
    }

    jdImageDataUrl = dataUrl;
    jdImageObjectUrl = URL.createObjectURL(file);
    jdPreviewImage.src = jdImageObjectUrl;
    jdImageName.textContent = file.name;
    jdImagePreview.hidden = false;
    jdUploadStatus.textContent = "職缺截圖已準備，可供本次分析使用";
  } catch {
    if (readVersion === jdImageReadVersion) {
      clearJdImage();
      jdUploadStatus.textContent = "無法讀取圖片，請重新選擇檔案";
    }
  } finally {
    if (readVersion === jdImageReadVersion) {
      isReadingJdImage = false;
    }
  }
});

removeJdImageButton.addEventListener("click", () => {
  clearJdImage();
  jdUploadStatus.textContent = "圖片已移除";
});

window.addEventListener("beforeunload", () => {
  if (jdImageObjectUrl) {
    URL.revokeObjectURL(jdImageObjectUrl);
  }
});

function createEmptyStructuredProfile() {
  return {
    skills: [],
    certifications: [],
    experiences: [],
    projects: [],
    strengths: [],
  };
}

function createProfileItemId() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeProfileText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function getSafeProjectUrl(value) {
  const normalizedUrl = normalizeProfileText(value, 2000);

  if (!normalizedUrl) {
    return "";
  }

  try {
    const parsedUrl = new URL(normalizedUrl);
    return ["http:", "https:"].includes(parsedUrl.protocol) ? parsedUrl.href : "";
  } catch {
    return "";
  }
}

function normalizeProfileItem(category, item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const normalizedItem = {
    id: normalizeProfileText(item.id, 100) || createProfileItemId(),
    name: normalizeProfileText(item.name, 200),
  };

  if (!normalizedItem.name) {
    return null;
  }

  if (category === "experiences" || category === "projects") {
    normalizedItem.description = normalizeProfileText(item.description, 5000);
  }

  if (category === "projects") {
    normalizedItem.url = getSafeProjectUrl(item.url);
  }

  return normalizedItem;
}

function normalizeStructuredProfile(value) {
  const normalizedProfile = createEmptyStructuredProfile();

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return normalizedProfile;
  }

  Object.keys(PROFILE_CATEGORY_CONFIG).forEach((category) => {
    const items = Array.isArray(value[category]) ? value[category] : [];
    normalizedProfile[category] = items
      .map((item) => normalizeProfileItem(category, item))
      .filter(Boolean);
  });

  return normalizedProfile;
}

function hasStructuredProfileData(profile) {
  return Object.keys(PROFILE_CATEGORY_CONFIG).some(
    (category) => profile[category].length > 0,
  );
}

function createAnalysisProfile(profile) {
  return {
    skills: profile.skills.map(({ name }) => ({ name })),
    certifications: profile.certifications.map(({ name }) => ({ name })),
    experiences: profile.experiences.map(({ name, description }) => ({
      name,
      description,
    })),
    projects: profile.projects.map(({ name, description, url }) => ({
      name,
      description,
      ...(url ? { url } : {}),
    })),
    strengths: profile.strengths.map(({ name }) => ({ name })),
  };
}

function readStructuredProfileForAnalysis() {
  let profile = structuredProfile;

  try {
    const savedProfile = localStorage.getItem(STRUCTURED_PROFILE_STORAGE_KEY);

    if (savedProfile !== null) {
      profile = normalizeStructuredProfile(JSON.parse(savedProfile));
    }
  } catch {
    // If localStorage is unavailable, use the already loaded in-memory Profile.
  }

  return createAnalysisProfile(profile);
}

function createItemActionButton(label, action, category, itemId) {
  const button = document.createElement("button");

  button.type = "button";
  button.className = `item-action-button${action === "delete" ? " delete" : ""}`;
  button.dataset.profileAction = action;
  button.dataset.category = category;
  button.dataset.itemId = itemId;
  button.textContent = label;
  button.setAttribute("aria-label", `${label}此${PROFILE_CATEGORY_CONFIG[category].label}`);

  return button;
}

function createProfileItemActions(category, itemId) {
  const actions = document.createElement("div");
  actions.className = "profile-item-actions";
  actions.append(
    createItemActionButton("編輯", "edit", category, itemId),
    createItemActionButton("刪除", "delete", category, itemId),
  );
  return actions;
}

function createProfileItemElement(category, item) {
  if (category === "skills" || category === "strengths") {
    const tag = document.createElement("div");
    const name = document.createElement("span");

    tag.className = "profile-tag";
    name.textContent = item.name;
    tag.append(name, createProfileItemActions(category, item.id));
    return tag;
  }

  const card = document.createElement("div");
  const content = document.createElement("div");
  const title = document.createElement("h4");

  card.className = "profile-item-card";
  title.textContent = item.name;
  content.append(title);

  if (item.description) {
    const description = document.createElement("p");
    description.textContent = item.description;
    content.append(description);
  }

  if (category === "projects" && item.url) {
    const link = document.createElement("a");
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = item.url;
    content.append(link);
  }

  card.append(content, createProfileItemActions(category, item.id));
  return card;
}

function renderProfileCategory(category) {
  const list = document.querySelector(`#profile-${category}`);
  const items = structuredProfile[category];

  list.replaceChildren();

  if (!items.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "profile-empty-state";
    emptyState.textContent = PROFILE_CATEGORY_CONFIG[category].emptyMessage;
    list.append(emptyState);
    return;
  }

  list.append(...items.map((item) => createProfileItemElement(category, item)));
}

function renderStructuredProfile() {
  Object.keys(PROFILE_CATEGORY_CONFIG).forEach(renderProfileCategory);
}

function persistStructuredProfile(successMessage = "求職 Profile 已儲存於此瀏覽器") {
  try {
    localStorage.setItem(
      STRUCTURED_PROFILE_STORAGE_KEY,
      JSON.stringify(structuredProfile),
    );
    structuredProfileStatus.textContent = successMessage;
    return true;
  } catch {
    structuredProfileStatus.textContent = "無法儲存求職 Profile，請確認瀏覽器設定";
    return false;
  }
}

function createProfileEditorField(field, value, idPrefix = "profile-editor") {
  const wrapper = document.createElement("div");
  const label = document.createElement("label");
  const input = field.multiline
    ? document.createElement("textarea")
    : document.createElement("input");

  wrapper.className = "profile-editor-field";
  label.htmlFor = `${idPrefix}-${field.name}`;
  label.textContent = field.label;
  input.id = `${idPrefix}-${field.name}`;
  input.name = field.name;
  input.placeholder = field.placeholder;
  input.required = field.required;
  input.maxLength = field.name === "description" ? 5000 : field.name === "url" ? 2000 : 200;
  input.value = value || "";

  if (field.multiline) {
    input.rows = 4;
  } else {
    input.type = field.type || "text";
  }

  wrapper.append(label, input);
  return wrapper;
}

function readProfileItemValues(form, category, errorElement) {
  const config = PROFILE_CATEGORY_CONFIG[category];

  if (!config) {
    errorElement.textContent = "請選擇有效的資料類型";
    errorElement.hidden = false;
    return null;
  }

  const formData = new FormData(form);
  const values = {};

  config.fields.forEach((field) => {
    values[field.name] = normalizeProfileText(
      formData.get(field.name),
      field.name === "description" ? 5000 : field.name === "url" ? 2000 : 200,
    );
  });

  const missingRequiredField = config.fields.find(
    (field) => field.required && !values[field.name],
  );

  if (missingRequiredField) {
    errorElement.textContent = `請填寫${missingRequiredField.label}`;
    errorElement.hidden = false;
    return null;
  }

  if (values.url) {
    const safeUrl = getSafeProjectUrl(values.url);

    if (!safeUrl) {
      errorElement.textContent = "作品連結請使用有效的 http:// 或 https:// 網址";
      errorElement.hidden = false;
      return null;
    }

    values.url = safeUrl;
  }

  errorElement.hidden = true;
  errorElement.textContent = "";
  return values;
}

function createStructuredProfileItem(category, values, itemId = null) {
  return {
    id: itemId || createProfileItemId(),
    name: values.name,
    ...(category === "experiences" || category === "projects"
      ? { description: values.description }
      : {}),
    ...(category === "projects" ? { url: values.url || "" } : {}),
  };
}

function openProfileEditor(category, itemId = null) {
  const config = PROFILE_CATEGORY_CONFIG[category];
  const item = itemId
    ? structuredProfile[category].find((candidate) => candidate.id === itemId)
    : null;

  if (!config || (itemId && !item)) {
    return;
  }

  activeProfileEditor = { category, itemId };
  profileEditorTitle.textContent = `${item ? "編輯" : "新增"}${config.label}`;
  profileEditorError.hidden = true;
  profileEditorError.textContent = "";
  profileEditorFields.replaceChildren(
    ...config.fields.map((field) =>
      createProfileEditorField(field, item?.[field.name]),
    ),
  );
  profileEditorDialog.showModal();
  profileEditorFields.querySelector("input, textarea")?.focus();
}

function closeProfileEditor() {
  activeProfileEditor = null;
  profileEditorForm.reset();
  profileEditorDialog.close();
}

function deleteProfileItem(category, itemId) {
  structuredProfile[category] = structuredProfile[category].filter(
    (item) => item.id !== itemId,
  );
  renderProfileCategory(category);
  persistStructuredProfile("刪除完成，變更已自動儲存");
}

profileCategories.addEventListener("click", (event) => {
  const addButton = event.target.closest("button[data-category]:not([data-profile-action])");

  if (addButton) {
    openProfileEditor(addButton.dataset.category);
    return;
  }

  const actionButton = event.target.closest("button[data-profile-action]");

  if (!actionButton) {
    return;
  }

  const { category, itemId, profileAction } = actionButton.dataset;

  if (profileAction === "edit") {
    openProfileEditor(category, itemId);
  } else if (profileAction === "delete") {
    deleteProfileItem(category, itemId);
  }
});

profileEditorForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!activeProfileEditor) {
    return;
  }

  const { category, itemId } = activeProfileEditor;
  const values = readProfileItemValues(
    profileEditorForm,
    category,
    profileEditorError,
  );

  if (!values) {
    return;
  }

  const nextItem = createStructuredProfileItem(category, values, itemId);

  if (itemId) {
    structuredProfile[category] = structuredProfile[category].map((item) =>
      item.id === itemId ? nextItem : item,
    );
  } else {
    structuredProfile[category].push(nextItem);
  }

  renderProfileCategory(category);
  persistStructuredProfile(
    itemId ? "編輯完成，變更已自動儲存" : "新增完成，變更已自動儲存",
  );
  closeProfileEditor();
});

closeProfileEditorButton.addEventListener("click", closeProfileEditor);
cancelProfileEditorButton.addEventListener("click", closeProfileEditor);

profileEditorDialog.addEventListener("click", (event) => {
  if (event.target === profileEditorDialog) {
    closeProfileEditor();
  }
});

function loadStructuredProfile() {
  try {
    const savedProfile = localStorage.getItem(STRUCTURED_PROFILE_STORAGE_KEY);

    if (savedProfile !== null) {
      structuredProfile = normalizeStructuredProfile(JSON.parse(savedProfile));
      structuredProfileStatus.textContent = "已載入儲存的求職 Profile";
    }
  } catch {
    structuredProfile = createEmptyStructuredProfile();
    structuredProfileStatus.textContent = "無法載入已儲存的 Profile，請重新建立";
  }

  renderStructuredProfile();
}

saveStructuredProfileButton.addEventListener("click", () => {
  persistStructuredProfile();
});

function loadLegacyProfile() {
  try {
    const savedProfile = localStorage.getItem(LEGACY_PROFILE_STORAGE_KEY);

    if (savedProfile !== null) {
      candidateBackground.value = savedProfile;
      legacyProfileSection.open = true;
      profileStatus.textContent = "已載入舊版背景資料";
    }
  } catch {
    // localStorage unavailable: keep the legacy field in its current state.
  }
}

saveProfileButton.addEventListener("click", () => {
  try {
    localStorage.setItem(LEGACY_PROFILE_STORAGE_KEY, candidateBackground.value);
    profileStatus.textContent = "舊版背景資料已儲存";
  } catch {
    profileStatus.textContent = "無法儲存舊版背景資料，請確認瀏覽器設定";
  }
});

loadStructuredProfile();
loadLegacyProfile();

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

const MATCH_STATUS_DISPLAY = {
  confirmed: {
    label: "已符合",
    symbol: "✓",
  },
  inferred: {
    label: "可延伸",
    symbol: "↗",
  },
  unknown: {
    label: "待確認",
    symbol: "?",
  },
};

function createMatchSummary(requirementMatches) {
  const section = document.createElement("section");
  const heading = document.createElement("h3");
  const summaryGrid = document.createElement("div");

  section.className = "match-overview";
  heading.textContent = "職缺配對摘要";
  summaryGrid.className = "match-summary-grid";

  Object.entries(MATCH_STATUS_DISPLAY).forEach(([status, display]) => {
    const card = document.createElement("div");
    const label = document.createElement("span");
    const count = document.createElement("strong");

    card.className = `match-summary-card is-${status}`;
    label.textContent = display.label;
    count.textContent = requirementMatches.filter(
      (match) => match.status === status,
    ).length;
    card.append(label, count);
    summaryGrid.append(card);
  });

  section.append(heading, summaryGrid);
  return section;
}

function createRequirementMatches(requirementMatches) {
  const section = document.createElement("section");
  const heading = document.createElement("h3");
  const matchList = document.createElement("div");

  section.className = "analysis-section requirement-match-section";
  heading.textContent = "能力配對";
  matchList.className = "requirement-match-list";

  if (!requirementMatches.length) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent = "目前沒有可確認的職缺能力要求。";
    matchList.append(emptyMessage);
  }

  requirementMatches.forEach((match) => {
    const display = MATCH_STATUS_DISPLAY[match.status] || MATCH_STATUS_DISPLAY.unknown;
    const matchedParts = Array.isArray(match.matchedParts)
      ? match.matchedParts.filter((part) => typeof part === "string" && part.trim())
      : [];
    const unknownParts = Array.isArray(match.unknownParts)
      ? match.unknownParts.filter((part) => typeof part === "string" && part.trim())
      : [];
    const card = document.createElement("article");
    const header = document.createElement("div");
    const requirement = document.createElement("h4");
    const badge = document.createElement("span");
    const evidence = document.createElement("p");
    const evidenceLabel = document.createElement("strong");

    card.className = `requirement-match-card is-${match.status}`;
    header.className = "requirement-match-heading";
    requirement.textContent = match.requirement;
    badge.className = "match-status-badge";
    badge.textContent = `${display.symbol} ${display.label}`;
    evidenceLabel.textContent = match.status === "unknown" ? "說明：" : "證據：";
    evidence.append(evidenceLabel, document.createTextNode(match.evidence));
    header.append(requirement, badge);
    card.append(header, evidence);

    if (matchedParts.length || unknownParts.length) {
      const parts = document.createElement("div");
      parts.className = "requirement-parts";

      if (matchedParts.length) {
        parts.append(createRequirementParts("已有證據", matchedParts, "is-matched"));
      }

      if (unknownParts.length) {
        parts.append(createRequirementParts("尚待確認", unknownParts, "is-unknown"));
      }

      card.append(parts);
    }

    if (match.status === "unknown") {
      const supplementButton = document.createElement("button");
      supplementButton.type = "button";
      supplementButton.className = "supplement-profile-button";
      supplementButton.textContent = "＋ 補充相關能力";
      supplementButton.addEventListener("click", () => {
        openProfileSupplement(match.requirement);
      });
      card.append(supplementButton);
    }

    matchList.append(card);
  });

  section.append(heading, matchList);
  return section;
}

function createRequirementParts(labelText, items, className) {
  const group = document.createElement("div");
  const label = document.createElement("span");
  const list = document.createElement("ul");

  group.className = `requirement-parts-group ${className}`;
  label.className = "requirement-parts-label";
  label.textContent = labelText;
  list.className = "requirement-parts-list";

  items.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    list.append(listItem);
  });

  group.append(label, list);
  return group;
}

function renderProfileSupplementFields() {
  const category = profileSupplementCategory.value;
  const config = PROFILE_CATEGORY_CONFIG[category];

  profileSupplementError.hidden = true;
  profileSupplementError.textContent = "";
  profileSupplementFields.replaceChildren(
    ...config.fields.map((field) =>
      createProfileEditorField(field, "", "profile-supplement"),
    ),
  );
}

function openProfileSupplement(requirement) {
  activeSupplementRequirement = normalizeProfileText(requirement, 1000);
  profileSupplementRequirement.textContent = activeSupplementRequirement;
  profileSupplementForm.reset();
  profileSupplementCategory.value = "skills";
  renderProfileSupplementFields();
  profileSupplementDialog.showModal();
  profileSupplementCategory.focus();
}

function closeProfileSupplement() {
  activeSupplementRequirement = "";
  profileSupplementForm.reset();
  profileSupplementFields.replaceChildren();
  profileSupplementError.hidden = true;
  profileSupplementError.textContent = "";
  profileSupplementDialog.close();
}

profileSupplementCategory.addEventListener("change", renderProfileSupplementFields);
closeProfileSupplementButton.addEventListener("click", closeProfileSupplement);
cancelProfileSupplementButton.addEventListener("click", closeProfileSupplement);

profileSupplementDialog.addEventListener("click", (event) => {
  if (event.target === profileSupplementDialog) {
    closeProfileSupplement();
  }
});

function createFocusCard(title, items, className) {
  const card = document.createElement("article");
  const heading = document.createElement("h4");

  card.className = `application-focus-card ${className}`;
  heading.textContent = title;
  card.append(heading, createList(items));
  return card;
}

function createApplicationFocus(applicationFocus) {
  const section = document.createElement("section");
  const heading = document.createElement("h3");
  const focusGrid = document.createElement("div");

  section.className = "analysis-section application-focus-section";
  heading.textContent = "求職重點";
  focusGrid.className = "application-focus-grid";
  focusGrid.append(
    createFocusCard(
      "優先主打",
      applicationFocus.strengthsToHighlight,
      "focus-strengths",
    ),
    createFocusCard(
      "可以補強",
      applicationFocus.gapsToClarify,
      "focus-gaps",
    ),
    createFocusCard(
      "應徵呈現方式",
      applicationFocus.presentationTips,
      "focus-presentation",
    ),
  );
  section.append(heading, focusGrid);
  return section;
}

function renderAnalysis(analysis) {
  const requirementMatches = Array.isArray(analysis.requirementMatches)
    ? analysis.requirementMatches
    : [];
  const applicationFocus = analysis.applicationFocus || {
    strengthsToHighlight: [],
    gapsToClarify: [],
    presentationTips: [],
  };
  const coverLetterSection = document.createElement("section");
  const coverLetterHeading = document.createElement("h3");
  const coverLetter = document.createElement("p");

  coverLetterSection.className = "analysis-section cover-letter";
  coverLetterHeading.textContent = "簡短自我推薦信";
  coverLetter.textContent = analysis.coverLetter;
  coverLetterSection.append(coverLetterHeading, coverLetter);

  resultMessage.replaceChildren(
    createMatchSummary(requirementMatches),
    createAnalysisSection("職缺重點", analysis.jobHighlights),
    createRequirementMatches(requirementMatches),
    createApplicationFocus(applicationFocus),
    coverLetterSection,
  );
}

async function runAnalysis() {
  const jd = jobDescription.value.trim();
  const profile = readStructuredProfileForAnalysis();
  const hasStructuredProfile = hasStructuredProfileData(profile);
  const legacyBackground = candidateBackground.value.trim();
  const hasJdImage = Boolean(jdImageDataUrl);

  resultMessage.classList.remove("is-warning", "is-loading");

  if (isReadingJdImage) {
    resultMessage.textContent = "圖片仍在讀取中，請稍候再開始分析。";
    resultMessage.classList.add("is-warning");
    return false;
  }

  if (!jd && !hasJdImage) {
    resultMessage.textContent = "請貼上職缺 JD 或上傳職缺截圖後再開始分析。";
    resultMessage.classList.add("is-warning");
    jobDescription.focus();
    return false;
  }

  if (!hasStructuredProfile && !legacyBackground) {
    resultMessage.textContent = "請先建立求職 Profile，或補充舊版背景資料後再開始分析。";
    resultMessage.classList.add("is-warning");
    legacyProfileSection.open = true;
    candidateBackground.focus();
    return false;
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
      body: JSON.stringify({
        jd,
        profile,
        ...(!hasStructuredProfile && legacyBackground
          ? { background: legacyBackground }
          : {}),
        ...(hasJdImage ? { jdImage: jdImageDataUrl } : {}),
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || data?.message || "伺服器暫時無法完成分析");
    }

    if (!data?.analysis) {
      throw new Error("分析結果格式不完整，請稍後再試");
    }

    renderAnalysis(data.analysis);
    resultMessage.classList.remove("is-loading");
    return true;
  } catch (error) {
    resultMessage.textContent = `無法完成分析：${error.message}`;
    resultMessage.classList.remove("is-loading");
    resultMessage.classList.add("is-warning");
    return false;
  } finally {
    submitButton.disabled = false;
  }
}

profileSupplementForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!activeSupplementRequirement) {
    profileSupplementError.textContent = "找不到要補充的職缺要求，請關閉後重試";
    profileSupplementError.hidden = false;
    return;
  }

  const category = profileSupplementCategory.value;
  const values = readProfileItemValues(
    profileSupplementForm,
    category,
    profileSupplementError,
  );

  if (!values) {
    return;
  }

  const nextItem = createStructuredProfileItem(category, values);
  structuredProfile[category].push(nextItem);
  renderProfileCategory(category);

  if (!persistStructuredProfile("補充資料已加入 Profile，正在重新分析")) {
    structuredProfile[category] = structuredProfile[category].filter(
      (item) => item.id !== nextItem.id,
    );
    renderProfileCategory(category);
    profileSupplementError.textContent = "無法儲存 Profile，因此尚未重新分析";
    profileSupplementError.hidden = false;
    return;
  }

  closeProfileSupplement();
  const analysisSucceeded = await runAnalysis();
  structuredProfileStatus.textContent = analysisSucceeded
    ? "補充資料已加入 Profile，重新分析完成"
    : "補充資料已加入 Profile，但重新分析未完成";
});

applicationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await runAnalysis();
});

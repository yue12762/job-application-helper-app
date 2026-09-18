# Job Application Helper

Job Application Helper 是一個 AI 求職輔助 Web App，也是用於個人作品集與開發展示的 MVP 專案。

使用者可以輸入職缺 JD，以及自己的技能、經歷、作品、證照等背景資料。系統會透過 OpenAI API 分析職缺需求與求職者背景，整理出個人化的能力比對、待確認資訊、求職建議與簡短自我推薦信。

## 目前功能

- 分析職缺 JD
- 找出職缺重點
- 比對使用者已確認的能力
- 區分 Confirmed、Inferred 與 Unknown 資訊
- 列出尚未確認的能力或資訊
- 提供具體的求職建議
- 產生簡短自我推薦信
- 避免捏造使用者未提供的工作經歷、技能、證照、作品或成果
- 以結構化格式呈現 AI 分析結果
- 提供基本的輸入驗證與錯誤提示

## 設計原則

AI 分析會依照證據強度區分使用者背景資訊：

- **Confirmed**：使用者明確提供的資訊，可以直接用於能力比對與自我推薦信。
- **Inferred**：可以根據現有資料合理推測，但必須使用保守措辭，不能當成已確認的事實。
- **Unknown**：使用者尚未提供或現有資料不足以確認的資訊。Unknown 不代表使用者不具備該能力，只表示目前尚未確認。

系統不得自行補完或捏造求職者的公司、職稱、工作經歷、技能、證照、作品、年資、成果或數據。自我推薦信也只能將 Confirmed 資訊寫成事實。

## 技術架構

- **HTML**：頁面結構與表單內容
- **CSS**：響應式版面與使用者介面樣式
- **JavaScript**：前端互動、資料送出與分析結果呈現
- **Node.js**：後端 HTTP server 與 API route
- **OpenAI API**：分析職缺與使用者背景，產生結構化結果
- **dotenv**：從後端環境變數安全載入 API Key

目前前端會將 JD 與背景資料送至 `POST /api/analyze`。後端完成輸入驗證後呼叫 OpenAI Responses API，並以 Structured Outputs 取得固定格式的分析資料，再回傳給前端顯示。

## 專案檔案結構

```text
job-helper-app/
├── index.html        # Web App 頁面結構
├── style.css         # 介面樣式與響應式排版
├── script.js         # 前端表單、API 呼叫與結果呈現
├── server.js         # Node.js server、API route 與 OpenAI 串接
├── package.json      # 專案資訊、套件與執行指令
├── .env.example      # 環境變數範例，不包含真實 API Key
├── .gitignore        # 排除 .env、node_modules 等檔案
└── README.md         # 專案說明文件
```

## 本機執行方式

### 1. 安裝套件

```bash
npm install
```

### 2. 建立環境變數檔案

在專案根目錄建立 `.env`，並填入自己的 OpenAI API Key：

```env
OPENAI_API_KEY=your_api_key_here
```

也可以先複製範例檔：

```bash
cp .env.example .env
```

再開啟 `.env`，將範例值替換為自己的 API Key。

### 3. 啟動伺服器

```bash
npm start
```

伺服器啟動後，在瀏覽器開啟：

[http://127.0.0.1:3000](http://127.0.0.1:3000)

## API Key 安全提醒

- 不要把真正的 API Key 寫進 `index.html`、`script.js` 或其他前端程式。
- 不要把 `.env` 上傳至 GitHub 或分享給其他人。
- Repository 只提供不含真實憑證的 `.env.example`。
- `.env` 已透過 `.gitignore` 排除。
- API Key 僅能由後端讀取，不應傳送或回傳給瀏覽器。
- 若 API Key 曾經意外公開，應立即至 OpenAI Platform 撤銷並重新建立。

## 專案狀態

目前版本為 **MVP v1**，核心目標是完成安全的前後端串接，並驗證 AI 求職分析流程。

未來可以加入：

- 使用者 Profile 儲存
- JD 圖片上傳與辨識
- 履歷重點建議
- 面試準備
- 更完整的求職分析

## 使用提醒

AI 產生的內容適合作為求職準備與寫作參考。正式投遞前，使用者仍應自行確認所有經歷、能力與文字內容是否正確。


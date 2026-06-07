# 💰 SmartLedger - 個人智慧記帳與股票追蹤系統

[![Deploy to GitHub Pages](https://github.com/ChenYuHsu413/AccountSystem/actions/workflows/deploy.yml/badge.svg)](https://github.com/ChenYuHsu413/AccountSystem/actions/workflows/deploy.yml)

> 🚀 **線上 Demo 連結**：[https://chenyuhsu413.github.io/AccountSystem/](https://chenyuhsu413.github.io/AccountSystem/)

`SmartLedger` 是一款專為手機與行動網頁優化的個人理財與資產追蹤系統。本系統採用 **Serverless 無伺服器架構**，前端以 React 19 + Vite 構建，並使用 **Google 試算表 (Google Sheets)** 作為雲端資料庫。同時整合了 **Gemini AI** 智慧解析與**語音輸入**功能，提供流暢、安全且極致美觀的個人記帳體驗。

---

## ✨ 核心功能

### 1. 📝 手動記帳與分類
* 提供簡潔流暢的記帳表單，可快速輸入日期、金額、分類、項目名稱與備註。
* 支援多種常用記帳分類，並同步寫入 Google 試算表。

### 2. 📊 歷史帳目明細 (CRUD)
* **檢視歷史紀錄**：以磨砂玻璃質感 (Glassmorphism) 卡片條列所有消費項目。
* **消費摘要**：自動計算「本月總支出 (與筆數)」以及「所有累計支出」。
* **單筆刪除**：附帶防誤觸二次確認，可直接在手機上將指定帳目從試算表中永久刪除。

### 3. 📈 即時股票追蹤 (Stock Dashboard)
* **資產總覽**：彙整持股總成本、即時證券市值與累積帳面損益。
* **即時行情**：股票即時報價、市值與損益利用 Google 試算表內建的 `GOOGLEFINANCE` 公式進行自動雲端更新與運算。
* **持股管理**：支援在前端直接**新增持股**與**刪除持股**，新增時會自動寫入對應的試算表公式。

### 4. 🪄 Gemini AI 智慧記帳 & 🎤 語音輸入
* **AI 語意解析**：只需輸入日常對話（例如：「昨天晚餐吃麥當勞花了一百五元」），Gemini AI 就會自動將其解析為「日期」、「分類（餐飲）」、「項目（麥當勞）」與「金額（150）」，並直接同步至後端。
* **語音輸入**：整合瀏覽器內建 Web Speech API，點擊麥克風 🎤 按鈕即可說話，自動轉為文字代入，省去手動打字的繁瑣。

---

## 🛠️ 技術棧與架構

* **前端**：React 19, Vite, Vanilla CSS (精緻現代暗黑美學、毛玻璃陰影、互動微動畫)。
* **後端 / API 路由**：Google Apps Script (GAS) ── 充當 Serverless API 處理跨網域 CORS 請求並與 Google Sheets 交互。
* **資料庫**：Google Sheets (Google 試算表)。
* **自動部署**：GitHub Actions + GitHub Pages。

---

## 🚀 快速開始與本地開發

### 1. 複製專案並安裝依賴
```bash
git clone https://github.com/ChenYuHsu413/AccountSystem.git
cd AccountSystem
npm install
```

### 2. 本地開發執行
```bash
npm run dev
```
啟動後在瀏覽器開啟：`http://localhost:5173/`。

### 3. 設定後端 Google Apps Script (GAS)
1. 前往 [Google 雲端硬碟](https://drive.google.com/) 建立一個全新的 **Google 試算表**。
2. 在試算表選單中點選 **「擴充功能」 > 「Apps Script」**。
3. 將本專案 [gas/Database.gs](file:///c:/Users/alung/Documents/WorkSpace/MyAIProject/AccountSystem/gas/Database.gs) 與 [gas/Code.gs](file:///c:/Users/alung/Documents/WorkSpace/MyAIProject/AccountSystem/gas/Code.gs) 的程式碼分別複製並覆蓋到 GAS 編輯器中對應的檔案。
4. 在編輯器中點選 **「部署」 > 「新增部署」**：
   * 部署類型選擇 **「網頁應用程式 (Web App)」**。
   * 將「執行身分」設定為 **「我」 (Me)**。
   * 將「誰有權存取」設定為 **「所有人」 (Anyone)**。
5. 點選部署並複製產生的 **網頁應用程式 URL** (Web App URL)。
6. 打開您的網頁應用程式，點選右上角的 **⚙️ (設定齒輪)**，將該 URL 貼上並儲存即可！

*(若要啟用 Gemini AI 功能，請至 Google AI Studio 申請免費的 API Key，並在「AI 記帳」分頁的設定中填入，或作為 Script 屬性設定在 GAS 中。)*
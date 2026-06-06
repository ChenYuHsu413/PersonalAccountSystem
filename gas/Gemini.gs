/**
 * 個人手機記帳與股票追蹤 App - Gemini AI 語意解析邏輯 (Gemini.gs)
 * 
 * 此檔案負責串接 Gemini API。當前端傳入自然語言句子（例如「昨天吃牛排花了 500 元」）時，
 * 利用 Gemini API 進行語意分析，將非結構化文字轉換為結構化的 JSON 記帳資料，並寫入 Google Sheets。
 */

/**
 * 取得 Gemini API Key
 * 優先從 Script 屬性取得，若無則傳回空值（允許從前端傳入 Key 作為備援）
 */
function getGeminiApiKey() {
  return PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY") || "";
}

/**
 * 接收前端請求並處理 Gemini AI 記帳
 * @param {Object} payload 包含 text (自然語言) 與選填的 apiKey
 */
function parseAndAddWithGemini(payload) {
  var text = payload.text;
  // 優先使用前端傳過來的 API Key，若無則讀取後端設定
  var apiKey = payload.apiKey || getGeminiApiKey();

  if (!apiKey) {
    throw new Error("未設定 Gemini API Key。請在 GAS 的專案設定中新增指令碼屬性 'GEMINI_API_KEY'，或在前端輸入。");
  }

  if (!text) {
    throw new Error("請提供要分析的記帳語句。");
  }

  // 1. 呼叫 Gemini API 進行解析
  var parsedData = parseTextWithGemini(text, apiKey);

  // 2. 將解析後的資料寫入 Google Sheets
  var dbResult = addBookkeepingRecord(parsedData);

  return {
    success: true,
    rawText: text,
    parsedData: parsedData,
    message: "AI 成功解析並記帳！"
  };
}

/**
 * 呼叫 Gemini API 解析文字
 * @param {string} text 自然語言輸入
 * @param {string} apiKey Gemini API 金鑰
 */
function parseTextWithGemini(text, apiKey) {
  var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;
  
  // 取得今天日期，作為基準供 Gemini 計算「昨天、明天、星期幾」等相對時間
  var today = new Date();
  var timezone = Session.getScriptTimeZone();
  var todayStr = Utilities.formatDate(today, timezone, "yyyy-MM-dd");
  var dayOfWeekStr = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"][today.getDay()];

  // 設計 Prompt 提示詞，限制其輸出 JSON 格式
  var prompt = "你是一個專業的記帳助理。請將使用者的記帳語句解析為結構化的 JSON 資料。\n\n" +
               "【基準時間設定】\n" +
               "今天日期是: " + todayStr + " (" + dayOfWeekStr + ")。請以此日期為基準推算語句中的時間（如『昨天』為 " + 
               Utilities.formatDate(new Date(today.getTime() - 24*60*60*1000), timezone, "yyyy-MM-dd") + "，依此類推）。\n\n" +
               "【預設分類清單】\n" +
               "請僅從以下分類中挑選最合適的一項：'食', '衣', '住', '行', '育', '樂', '其它'\n\n" +
               "【輸入語句】\n" +
               "「" + text + "」\n\n" +
               "【輸出格式規範】\n" +
               "必須回傳一個合法的 JSON 物件，不可以包含任何 markdown 標記（如 ```json 等包裝字眼），也不要有任何多餘的前言或後記。格式如下：\n" +
               "{\n" +
               "  \"date\": \"YYYY-MM-DD (字串，推算出的實際日期)\",\n" +
               "  \"category\": \"(上述分類清單中符合的一項)\",\n" +
               "  \"item\": \"(商品或消費項目的簡短名稱)\",\n" +
               "  \"amount\": (數值，消費金額),\n" +
               "  \"note\": \"(選填，如地點、與誰一起等備註，無則為空字串)\"\n" +
               "}";

  var requestBody = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json" // 強制 Gemini 1.5 回傳 JSON
    }
  };

  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(requestBody),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  var responseCode = response.getResponseCode();
  var responseText = response.getContentText();

  if (responseCode !== 200) {
    throw new Error("Gemini API 呼叫失敗 (" + responseCode + "): " + responseText);
  }

  // 解析 API 回應
  var jsonResponse = JSON.parse(responseText);
  
  try {
    var candidateText = jsonResponse.candidates[0].content.parts[0].text.trim();
    // 雙重保險：如果 AI 還是回傳了 markdown，將其剝除
    if (candidateText.indexOf("```") === 0) {
      candidateText = candidateText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }
    
    var parsedResult = JSON.parse(candidateText);
    
    // 欄位防呆與補正
    if (!parsedResult.date) parsedResult.date = todayStr;
    if (!parsedResult.category) parsedResult.category = "其它";
    if (!parsedResult.item) parsedResult.item = text;
    if (parsedResult.amount === undefined || isNaN(parsedResult.amount)) {
      parsedResult.amount = 0;
    }
    
    return parsedResult;

  } catch (err) {
    throw new Error("解析 Gemini 回傳的 JSON 失敗，原文為: " + responseText + "，錯誤: " + err.toString());
  }
}

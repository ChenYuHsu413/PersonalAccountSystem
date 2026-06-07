/**
 * 個人手機記帳與股票追蹤 App - 後端 API 路由器 (Code.gs)
 * 
 * 此檔案負責接收前端 React 發送的 GET 與 POST 請求，
 * 處理 CORS 並轉發給對應的資料庫與 AI 邏輯處理。
 */

// 設定區：填入您的 Google 試算表 ID (如果您直接在試算表中開啟「擴充功能 > Apps Script」，可留空自動偵測)
var SPREADSHEET_ID = "";

/**
 * 取得試算表實例的輔助函式
 */
function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID !== "") {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  try {
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    throw new Error("無法取得試算表。請確認您是否已設定 SPREADSHEET_ID，或此腳本為試算表繫結腳本。");
  }
}

/**
 * 處理 HTTP GET 請求
 * 主要用於讀取即時股票報價與資產數據
 */
function doGet(e) {
  try {
    var action = e.parameter.action;
    var responseData;

    if (action === 'getStocks') {
      // 讀取股票報價邏輯 (定義於 Database.gs)
      responseData = getStocksData();
    } else if (action === 'getRecords') {
      // 讀取記帳歷史明細 (定義於 Database.gs)
      responseData = getBookkeepingRecords();
    } else if (action === 'getPing') {
      responseData = { status: "success", message: "API 連線測試成功！" };
    } else {
      responseData = { 
        status: "error", 
        message: "未指定的 action 或不支援的 GET 請求。可用動作: action=getStocks, getRecords" 
      };
    }

    // 回傳 JSON 格式並處理 CORS
    return ContentService.createTextOutput(JSON.stringify(responseData))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: "GET 處理失敗: " + error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 處理 HTTP POST 請求
 * 接收記帳資料並寫入，或發送給 Gemini 進行語意分析
 * 
 * 備註：為避開 CORS OPTIONS 預檢限制，前端需以 text/plain 傳送 JSON 字串，
 * 這裡將 contents 解析為 JSON 物件。
 */
function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      throw new Error("未接收到任何 Post 資料。");
    }

    // 解析 JSON 內容
    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action;
    var payload = requestData.payload;
    var responseData;

    if (action === 'addRecord') {
      // 寫入記帳資料邏輯 (定義於 Database.gs)
      responseData = addBookkeepingRecord(payload);
    } else if (action === 'deleteRecord') {
      // 刪除記帳明細 (定義於 Database.gs)
      responseData = deleteBookkeepingRecord(payload.row);
    } else if (action === 'addStock') {
      // 新增股票持股 (定義於 Database.gs)
      responseData = addStockRecord(payload);
    } else if (action === 'deleteStock') {
      // 刪除股票持股 (定義於 Database.gs)
      responseData = deleteStockRecord(payload.row);
    } else if (action === 'parseGemini') {
      // 呼叫 Gemini AI 解析自然語言並寫入 (定義於 Gemini.gs)
      responseData = parseAndAddWithGemini(payload);
    } else {
      throw new Error("不支援的 POST 動作 (action): " + action);
    }

    return ContentService.createTextOutput(JSON.stringify({ 
      status: "success", 
      data: responseData 
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: "POST 處理失敗: " + error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 個人手機記帳與股票追蹤 App - Google 試算表讀寫邏輯 (Database.gs)
 * 
 * 負責直接對試算表工作表 (Sheets) 進行讀寫與初始化設定。
 */

var BOOKKEEPING_SHEET_NAME = "Bookkeeping";
var STOCKS_SHEET_NAME = "Stocks";

/**
 * 取得或自動初始化指定的工作表
 * @param {string} sheetName 工作表名稱
 * @param {Array<string>} headers 如果工作表不存在，自動建立並寫入此標頭
 */
function getOrCreateSheet(sheetName, headers) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    // 設定標頭粗體與背景顏色 (使試算表看起來更美觀)
    var range = sheet.getRange(1, 1, 1, headers.length);
    range.setFontWeight("bold");
    range.setBackground("#4facfe");
    range.setFontColor("#ffffff");
    
    // 如果是 Stocks 工作表，寫入一筆範例資料
    if (sheetName === STOCKS_SHEET_NAME) {
      // 寫入範例台積電 (2330) 與 蘋果 (AAPL)
      sheet.appendRow(["TPE:2330", "台積電", 500, 1000, '=GOOGLEFINANCE("TPE:2330", "price")', "=D2*E2", "=(E2-C2)*D2"]);
      sheet.appendRow(["NASDAQ:AAPL", "Apple Inc.", 150, 10, '=GOOGLEFINANCE("NASDAQ:AAPL", "price")', "=D3*E3", "=(E3-C3)*D3"]);
    }
  }
  return sheet;
}

/**
 * 寫入一筆記帳資料
 * @param {Object} payload 包含 date, category, item, amount, note
 */
function addBookkeepingRecord(payload) {
  var headers = ["日期", "分類", "項目", "金額", "備註"];
  var sheet = getOrCreateSheet(BOOKKEEPING_SHEET_NAME, headers);
  
  // 驗證必填欄位
  if (!payload.date || !payload.category || !payload.item || payload.amount === undefined) {
    throw new Error("記帳失敗：缺少必填欄位（日期、分類、項目、金額）");
  }

  // 將資料寫入最下方
  var rowData = [
    payload.date,
    payload.category,
    payload.item,
    Number(payload.amount),
    payload.note || ""
  ];
  sheet.appendRow(rowData);
  
  return { 
    success: true, 
    message: "記帳成功！已寫入試算表。",
    insertedData: payload
  };
}

/**
 * 讀取即時股票資料
 * 包含從工作表中自動讀取 GOOGLEFINANCE 計算出來的數值
 */
function getStocksData() {
  var headers = ["股票代號", "股票名稱", "平均成本", "股數", "即時股價", "市值", "損益"];
  var sheet = getOrCreateSheet(STOCKS_SHEET_NAME, headers);
  
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    // 只有標頭列，沒有資料
    return {
      stocks: [],
      summary: { totalCost: 0, totalValue: 0, totalProfitLoss: 0 }
    };
  }

  // 取得所有資料 (排除標頭列)
  var range = sheet.getRange(2, 1, lastRow - 1, headers.length);
  var values = range.getValues(); // getValues() 會自動獲取公式計算後的值而非公式字串

  var stocks = [];
  var totalCost = 0;
  var totalValue = 0;
  var totalProfitLoss = 0;

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var ticker = row[0];
    
    // 如果股票代號為空，則跳過
    if (!ticker) continue;

    var name = row[1] || ticker;
    var costPrice = Number(row[2]) || 0;
    var shares = Number(row[3]) || 0;
    var currentPrice = Number(row[4]) || 0;
    var marketValue = Number(row[5]) || (shares * currentPrice);
    var profitLoss = Number(row[6]) || ((currentPrice - costPrice) * shares);

    // 累加總量
    totalCost += costPrice * shares;
    totalValue += marketValue;
    totalProfitLoss += profitLoss;

    stocks.push({
      ticker: ticker,
      name: name,
      costPrice: costPrice,
      shares: shares,
      currentPrice: currentPrice,
      marketValue: Math.round(marketValue * 100) / 100,
      profitLoss: Math.round(profitLoss * 100) / 100,
      profitRate: costPrice > 0 ? Math.round(((currentPrice - costPrice) / costPrice) * 10000) / 100 : 0
    });
  }

  return {
    stocks: stocks,
    summary: {
      totalCost: Math.round(totalCost * 100) / 100,
      totalValue: Math.round(totalValue * 100) / 100,
      totalProfitLoss: Math.round(totalProfitLoss * 100) / 100,
      totalProfitRate: totalCost > 0 ? Math.round((totalProfitLoss / totalCost) * 10000) / 100 : 0
    }
  };
}

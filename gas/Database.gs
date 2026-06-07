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
 * 讀取所有記帳資料
 */
function getBookkeepingRecords() {
  var headers = ["日期", "分類", "項目", "金額", "備註"];
  var sheet = getOrCreateSheet(BOOKKEEPING_SHEET_NAME, headers);
  
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return { records: [] };
  }
  
  // 取得所有資料 (排除標頭列)
  var range = sheet.getRange(2, 1, lastRow - 1, headers.length);
  var values = range.getValues();
  
  var records = [];
  // 迴圈讀取每一行，保留真實列號 (row index)
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var date = row[0];
    
    // 如果日期為空，跳過
    if (!date) continue;
    
    // 轉換日期格式為 YYYY-MM-DD
    var dateStr = "";
    if (date instanceof Date) {
      var y = date.getFullYear();
      var m = ("0" + (date.getMonth() + 1)).slice(-2);
      var d = ("0" + date.getDate()).slice(-2);
      dateStr = y + "-" + m + "-" + d;
    } else {
      dateStr = String(date);
    }
    
    records.push({
      row: i + 2, // 因為第一行是標頭 (1-based)，且 i=0 對應第二列，所以是 i + 2
      date: dateStr,
      category: row[1] || "未分類",
      item: row[2] || "",
      amount: Number(row[3]) || 0,
      note: row[4] || ""
    });
  }
  
  // 按照日期由新到舊排序 (若日期相同，則按行號由大到小，即最新輸入的在最上面)
  records.sort(function(a, b) {
    var dateA = new Date(a.date).getTime();
    var dateB = new Date(b.date).getTime();
    if (dateA !== dateB) {
      return dateB - dateA;
    }
    return b.row - a.row;
  });
  
  return { records: records };
}

/**
 * 刪除指定列號的記帳資料
 * @param {number} row 列號
 */
function deleteBookkeepingRecord(row) {
  if (!row || isNaN(row) || row <= 1) {
    throw new Error("無效的列號，無法刪除！");
  }
  
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(BOOKKEEPING_SHEET_NAME);
  if (!sheet) {
    throw new Error("找不到記帳工作表！");
  }
  
  sheet.deleteRow(row);
  return { success: true, message: "成功刪除第 " + row + " 列資料！" };
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
      summary: { totalCost: 0, totalValue: 0, totalProfitLoss: 0, totalProfitRate: 0 }
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
      row: i + 2,
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

/**
 * 新增股票資料
 * @param {Object} payload 包含 ticker, name, costPrice, shares
 */
function addStockRecord(payload) {
  var headers = ["股票代號", "股票名稱", "平均成本", "股數", "即時股價", "市值", "損益"];
  var sheet = getOrCreateSheet(STOCKS_SHEET_NAME, headers);
  
  if (!payload.ticker || !payload.name || payload.costPrice === undefined || payload.shares === undefined) {
    throw new Error("新增股票失敗：缺少必填欄位（股票代號、名稱、平均成本、持有股數）");
  }

  var nextRow = sheet.getLastRow() + 1;
  var ticker = payload.ticker.trim().toUpperCase();
  
  // 插入資料列，含內建公式：
  // E: 即時股價, F: 市值, G: 損益
  var rowData = [
    ticker,
    payload.name.trim(),
    Number(payload.costPrice),
    Number(payload.shares),
    '=GOOGLEFINANCE("' + ticker + '", "price")',
    '=D' + nextRow + '*E' + nextRow,
    '=(E' + nextRow + '-C' + nextRow + ')*D' + nextRow
  ];
  
  sheet.appendRow(rowData);
  
  return { 
    success: true, 
    message: "成功新增股票！已寫入試算表。" 
  };
}

/**
 * 刪除指定列號的股票
 * @param {number} row 列號
 */
function deleteStockRecord(row) {
  if (!row || isNaN(row) || row <= 1) {
    throw new Error("無效的列號，無法刪除股票！");
  }
  
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(STOCKS_SHEET_NAME);
  if (!sheet) {
    throw new Error("找不到股票工作表！");
  }
  
  sheet.deleteRow(row);
  return { success: true, message: "成功刪除第 " + row + " 列股票！" };
}

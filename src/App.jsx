import React, { useState, useEffect } from 'react';
import BookkeepingForm from './components/BookkeepingForm';
import StockDashboard from './components/StockDashboard';
import GeminiInput from './components/GeminiInput';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('bookkeep');
  const [gasUrl, setGasUrl] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState(null);
  
  // Toast 訊息狀態
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  // 載入本地存取的 GAS Web App URL
  useEffect(() => {
    const savedUrl = localStorage.getItem('gas_web_app_url');
    if (savedUrl) {
      setGasUrl(savedUrl);
    } else {
      setShowSettings(true); // 如果沒設定過，預設顯示設定面板
    }
  }, []);

  // 當切換到股票看板時，自動重新載入
  useEffect(() => {
    if (activeTab === 'stocks' && gasUrl) {
      fetchStocks();
    }
  }, [activeTab, gasUrl]);

  // 觸發 Toast 提示
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'info' });
    }, 3500);
  };

  // 儲存 GAS URL
  const handleSaveGasUrl = (e) => {
    e.preventDefault();
    if (!gasUrl.trim()) {
      showToast('請輸入有效的 URL！', 'error');
      return;
    }
    localStorage.setItem('gas_web_app_url', gasUrl.trim());
    showToast('GAS API 連線網址已儲存！', 'success');
    setShowSettings(false);
  };

  // 呼叫 GET 取得股票資訊
  const fetchStocks = async () => {
    if (!gasUrl) {
      showToast('請先設定後端 GAS 部署 URL。', 'error');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${gasUrl}?action=getStocks`, {
        method: 'GET',
        mode: 'cors'
      });
      const data = await response.json();
      if (data.status === 'error') {
        showToast(`讀取股票失敗: ${data.message}`, 'error');
      } else {
        setStockData(data);
        showToast('股票即時報價已更新！', 'success');
      }
    } catch (error) {
      console.error(error);
      showToast('網路連線失敗，請檢查 URL 是否正確並已設定為「所有人」存取。', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 呼叫 POST 新增記帳明細
  const handleAddRecord = async (record) => {
    if (!gasUrl) {
      showToast('請先設定後端 GAS 部署 URL。', 'error');
      return;
    }
    setLoading(true);
    try {
      // 關鍵：使用 text/plain 以避免 CORS OPTIONS 預檢請求失敗
      const response = await fetch(gasUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          action: 'addRecord',
          payload: record
        })
      });
      const result = await response.json();
      
      if (result.status === 'success') {
        showToast('🎉 記帳成功，已同步至 Google Sheets！', 'success');
      } else {
        showToast(`記帳失敗: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('網路傳送失敗，請確認 GAS 專案權限已開放給所有人。', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 呼叫 POST AI 語意解析記帳
  const handleGeminiParse = async (payload) => {
    if (!gasUrl) {
      showToast('請先設定後端 GAS 部署 URL。', 'error');
      return null;
    }
    setLoading(true);
    try {
      const response = await fetch(gasUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          action: 'parseGemini',
          payload: payload
        })
      });
      const result = await response.json();
      
      if (result.status === 'success') {
        showToast('🪄 AI 解析完成並成功寫入！', 'success');
        return result.data;
      } else {
        showToast(`AI 解析失敗: ${result.message}`, 'error');
        return null;
      }
    } catch (error) {
      console.error(error);
      showToast('AI 解析連線失敗，請確認 API Key 與後端設定。', 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* 標頭 */}
      <header className="app-header">
        <div>
          <h1 className="app-title">
            <span style={{ fontSize: '28px' }}>💰</span> 
            <span className="text-gradient-green">SmartLedger</span>
          </h1>
          <div className="app-subtitle">個人記帳 & 證券追蹤</div>
        </div>
        
        {/* 設定按鈕 */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="clickable"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-color)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            cursor: 'pointer'
          }}
          title="系統設定"
        >
          ⚙️
        </button>
      </header>

      {/* GAS URL 設定面板 */}
      {showSettings && (
        <div className="glass-panel settings-panel">
          <div className="settings-title">🔗 後端 GAS API 設定</div>
          <form onSubmit={handleSaveGasUrl}>
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <input
                type="url"
                className="form-input"
                placeholder="請輸入後端 GAS Web App 部署網址"
                value={gasUrl}
                onChange={(e) => setGasUrl(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn-gradient-green clickable" style={{ flex: 1, padding: '8px' }}>
                儲存網址
              </button>
              <button 
                type="button" 
                onClick={() => setShowSettings(false)}
                className="clickable"
                style={{ 
                  flex: 1, 
                  background: 'transparent', 
                  border: '1px solid var(--border-color)', 
                  color: 'var(--text-secondary)',
                  borderRadius: 'var(--border-radius-md)'
                }}
              >
                取消
              </button>
            </div>
          </form>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
            💡 提示：在 GAS 點擊「部署 &gt; 新增部署」，將執行身分設為「我」，並把「誰有權存取」設為「所有人」，部署後複製產生的 Web app URL 填入此處。
          </div>
        </div>
      )}

      {/* 導覽 Tab */}
      <nav className="nav-tabs">
        <button 
          className={`tab-btn ${activeTab === 'bookkeep' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookkeep')}
        >
          📝 手動記帳
        </button>
        <button 
          className={`tab-btn ${activeTab === 'stocks' ? 'active' : ''}`}
          onClick={() => setActiveTab('stocks')}
        >
          📈 股票追蹤
        </button>
        <button 
          className={`tab-btn ${activeTab === 'gemini' ? 'active' : ''}`}
          onClick={() => setActiveTab('gemini')}
        >
          ✨ AI 記帳
        </button>
      </nav>

      {/* 分頁內容 */}
      <main className="tab-content">
        {activeTab === 'bookkeep' && (
          <BookkeepingForm onSubmit={handleAddRecord} loading={loading} />
        )}
        
        {activeTab === 'stocks' && (
          <StockDashboard data={stockData} loading={loading} onRefresh={fetchStocks} />
        )}

        {activeTab === 'gemini' && (
          <GeminiInput onParseSubmit={handleGeminiParse} loading={loading} />
        )}
      </main>

      {/* Toast 訊息 */}
      {toast.show && (
        <div className="toast">
          <span>{toast.type === 'error' ? '❌' : toast.type === 'success' ? '✅' : 'ℹ️'}</span>
          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default App;

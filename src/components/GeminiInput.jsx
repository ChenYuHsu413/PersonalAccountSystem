import React, { useState, useEffect } from 'react';

export default function GeminiInput({ onParseSubmit, loading }) {
  const [textInput, setTextInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [lastParsed, setLastParsed] = useState(null);

  // 載入與儲存本機 LocalStorage 中的 API Key，方便使用者測試
  useEffect(() => {
    const savedKey = localStorage.getItem('user_gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const handleApiKeyChange = (e) => {
    const key = e.target.value;
    setApiKey(key);
    localStorage.setItem('user_gemini_api_key', key);
  };

  const handleClearKey = () => {
    setApiKey('');
    localStorage.removeItem('user_gemini_api_key');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    setLastParsed(null);
    try {
      const response = await onParseSubmit({
        text: textInput,
        apiKey: apiKey || undefined // 若為空，後端會嘗試使用內建 Script Properties
      });

      if (response && response.success) {
        setLastParsed(response.parsedData);
        setTextInput(''); // 清空輸入欄位
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '700' }} className="text-gradient-purple">
        ✨ Gemini AI 智慧記帳
      </h2>
      <p className="ai-desc">
        直接輸入日常對話，AI 將自動解析日期、消費項目、分類與金額，並直接寫入 Google 試算表！
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <textarea
            className="form-textarea"
            style={{ minHeight: '90px' }}
            placeholder="例：明天下午跟朋友喝咖啡花了 350 元、昨天買午餐 120 元，加滷蛋 15 元"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {/* API Key 進階設定 (可摺疊) */}
        <div style={{ marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => setShowKeyInput(!showKeyInput)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '4px 0'
            }}
          >
            {showKeyInput ? '🙈 隱藏 API Key 設定' : '⚙️ 設定 Gemini API Key (可選)'}
          </button>
          
          {showKeyInput && (
            <div className="glass-panel" style={{ padding: '12px', marginTop: '8px', background: 'rgba(0,0,0,0.2)' }}>
              <div className="form-group" style={{ margin: '0' }}>
                <label className="form-label" style={{ fontSize: '11px' }}>
                  <span>Gemini API Key</span>
                  {apiKey && (
                    <span 
                      onClick={handleClearKey} 
                      style={{ color: 'var(--color-danger)', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      清除
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="輸入 AI 金鑰 (若後端 GAS 已設定則免填)"
                  value={apiKey}
                  onChange={handleApiKeyChange}
                  style={{ padding: '8px 12px', fontSize: '13px' }}
                />
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  🔑 密鑰將儲存在您本地瀏覽器的 LocalStorage 中，僅用於此呼叫。
                </span>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn-gradient-purple clickable"
          style={{ width: '100%', padding: '14px', fontSize: '16px' }}
          disabled={loading || !textInput.trim()}
        >
          {loading ? 'AI 解析並寫入中...' : 'AI 語意分析記帳 🪄'}
        </button>
      </form>

      {/* 解析成功預覽面板 */}
      {lastParsed && (
        <div className="glass-panel ai-preview-card" style={{ marginTop: '20px' }}>
          <div className="ai-preview-title">🎉 AI 解析成功並已寫入試算表</div>
          <div className="ai-preview-grid">
            <div className="ai-preview-label">🗓️ 消費日期</div>
            <div className="ai-preview-value">{lastParsed.date}</div>

            <div className="ai-preview-label">🏷️ 消費分類</div>
            <div className="ai-preview-value">
              <span style={{ 
                background: 'rgba(161, 140, 209, 0.2)', 
                color: '#fbc2eb', 
                padding: '2px 8px', 
                borderRadius: '4px',
                fontWeight: '600'
              }}>
                {lastParsed.category}
              </span>
            </div>

            <div className="ai-preview-label">🛍️ 項目名稱</div>
            <div className="ai-preview-value">{lastParsed.item}</div>

            <div className="ai-preview-label">💵 消費金額</div>
            <div className="ai-preview-value" style={{ color: '#00f2fe', fontWeight: 'bold' }}>
              ${lastParsed.amount.toLocaleString()}
            </div>

            {lastParsed.note && (
              <>
                <div className="ai-preview-label">📝 備註說明</div>
                <div className="ai-preview-value" style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                  {lastParsed.note}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

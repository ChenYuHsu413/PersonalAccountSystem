import React, { useState } from 'react';

export default function WatchlistDashboard({ data = [], loading, onRefresh, onAddWatchlist, onDeleteWatchlist, onCheckStock }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [deleteConfirmRow, setDeleteConfirmRow] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatCurrency = (val) => {
    if (val === undefined || val === null || isNaN(val) || val === 0) return '--';
    return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 2 }).format(val);
  };

  const handleVerifyTicker = async () => {
    if (!ticker.trim()) {
      alert('請先輸入股票代碼！');
      return;
    }

    setIsSaving(true);
    try {
      const result = await onCheckStock(ticker.trim());
      if (result) {
        setName(result.name);
        if (result.ticker) {
          setTicker(result.ticker);
        }
      }
    } catch (e) {
      console.error(e);
      alert(e.message || '驗證出錯');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ticker.trim() || !name.trim()) return;

    let finalTicker = ticker.trim().toUpperCase();
    if (/^\d+$/.test(finalTicker)) {
      finalTicker = 'TPE:' + finalTicker;
    }

    setIsSaving(true);
    try {
      const success = await onAddWatchlist({
        ticker: finalTicker,
        name: name.trim()
      });
      if (success) {
        setTicker('');
        setName('');
        setShowAddForm(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmRow) return;
    setIsDeleting(true);
    try {
      await onDeleteWatchlist(deleteConfirmRow);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmRow(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* 總結卡片 / 說明卡片 */}
      <div className="glass-panel stock-summary-card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>👀 自選股票即時追蹤</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>及時查看您感興趣的自選股票價格（僅展示名稱與即時價格）</span>
          </div>
          <button 
            onClick={onRefresh} 
            disabled={loading}
            className="clickable"
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: '#00f2fe', 
              fontSize: '18px', 
              cursor: 'pointer',
              animation: loading ? 'pulse 1s infinite' : 'none'
            }}
            title="重新整理"
          >
            🔄
          </button>
        </div>
      </div>

      {/* 新增股票按鈕 與 表單 */}
      <div style={{ marginBottom: '8px' }}>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="clickable btn-gradient-green"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: showAddForm ? 'transparent' : 'linear-gradient(135deg, var(--grad-green-start), var(--grad-green-end))',
            border: showAddForm ? '1px solid var(--border-color)' : 'none',
            color: showAddForm ? 'var(--text-secondary)' : '#041221',
            boxShadow: showAddForm ? 'none' : '0 4px 14px 0 rgba(79, 172, 254, 0.3)'
          }}
        >
          {showAddForm ? '🙈 取消新增自選' : '➕ 新增自選股票'}
        </button>

        {showAddForm && (
          <div className="glass-panel" style={{ padding: '16px', marginTop: '12px', background: 'rgba(13, 20, 35, 0.85)' }}>
            
            {/* 常用股快速填入 */}
            <div style={{ marginBottom: '12px', borderBottom: '1px dashed rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: '600' }}>💡 常用股快速填入：</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { ticker: 'TPE:2330', name: '台積電' },
                  { ticker: 'TPE:0050', name: '元大台灣50' },
                  { ticker: 'TPE:2317', name: '鴻海' },
                  { ticker: 'NASDAQ:NVDA', name: 'Nvidia' },
                  { ticker: 'NASDAQ:AAPL', name: 'Apple' },
                  { ticker: 'NASDAQ:TSLA', name: 'Tesla' }
                ].map(qs => (
                  <button
                    key={qs.ticker}
                    type="button"
                    onClick={() => {
                      setTicker(qs.ticker);
                      setName(qs.name);
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      color: '#00f2fe',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    className="clickable"
                  >
                    {qs.name} ({qs.ticker.split(':')[1] || qs.ticker})
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* 第一行：股票代碼與驗證按鈕 */}
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{ fontSize: '12px' }}>股票代號 (例: TPE:2330)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="TPE:2330"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    required
                    style={{ padding: '8px 12px', fontSize: '14px', flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyTicker}
                    disabled={loading || isSaving || !ticker.trim()}
                    style={{
                      padding: '8px 14px',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      background: 'rgba(0, 242, 254, 0.1)',
                      border: '1px solid rgba(0, 242, 254, 0.3)',
                      color: '#00f2fe',
                      borderRadius: 'var(--border-radius-md)',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                    className="clickable"
                  >
                    {isSaving ? '檢查中...' : '🔍 驗證並帶入'}
                  </button>
                </div>
                {ticker && /^\d+$/.test(ticker.trim()) && (
                  <div style={{ fontSize: '10px', color: '#34d399', marginTop: '4px', lineHeight: '1.2' }}>
                    🟢 偵測為台股，送出或驗證時將自動補上為 <strong>TPE:{ticker.trim()}</strong>
                  </div>
                )}
                {ticker && /^[a-zA-Z]+$/.test(ticker.trim()) && (
                  <div style={{ fontSize: '10px', color: '#fbbf24', marginTop: '4px', lineHeight: '1.2' }}>
                    🟡 提示：美股代號建議加上交易所字首，如 <strong>NASDAQ:{ticker.trim().toUpperCase()}</strong>
                  </div>
                )}
              </div>

              {/* 第二行：股票名稱 */}
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{ fontSize: '12px' }}>股票名稱</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="台積電 (驗證代碼後會自動填入)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ padding: '8px 12px', fontSize: '14px' }}
                />
              </div>

              <button
                type="submit"
                className="btn-gradient-green clickable"
                style={{ padding: '10px', width: '100%', marginTop: '6px' }}
                disabled={isSaving}
              >
                {isSaving ? '正在寫入試算表...' : '加入自選追蹤 💾'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 刪除確認模態框 */}
      {deleteConfirmRow !== null && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-content">
            <h3 style={{ marginBottom: '12px', fontSize: '16px', color: 'var(--text-primary)' }}>⚠️ 確認要移除此自選股票嗎？</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              此操作將會把本自選股票從追蹤清單中移除。
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleConfirmDelete} 
                className="btn-danger clickable" 
                style={{ flex: 1, padding: '10px', borderRadius: 'var(--border-radius-sm)', border: 'none', color: '#fff', fontWeight: 'bold', background: 'var(--color-danger)' }}
                disabled={isDeleting}
              >
                {isDeleting ? '移除中...' : '確認移除'}
              </button>
              <button 
                onClick={() => setDeleteConfirmRow(null)} 
                className="clickable"
                style={{ 
                  flex: 1, 
                  padding: '10px', 
                  borderRadius: 'var(--border-radius-sm)', 
                  border: '1px solid var(--border-color)', 
                  background: 'transparent', 
                  color: 'var(--text-secondary)' 
                }}
                disabled={isDeleting}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 自選清單列表 */}
      <h3 style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: '700', paddingLeft: '4px' }}>
        👀 我的自選監控
      </h3>

      <div className="stock-list">
        {loading && data.length === 0 ? (
          // 骨架屏
          [1, 2, 3].map(i => (
            <div key={i} className="glass-panel stock-card" style={{ height: '70px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '50%' }}>
                <div className="skeleton" style={{ height: '18px', width: '80%' }}></div>
                <div className="skeleton" style={{ height: '12px', width: '40%' }}></div>
              </div>
              <div className="skeleton" style={{ height: '24px', width: '25%' }}></div>
            </div>
          ))
        ) : data.length === 0 ? (
          <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            📭 尚無任何自選追蹤股票。請點擊上方按鈕新增！
          </div>
        ) : (
          data.map((stock, idx) => (
            <div 
              key={stock.ticker + '-' + idx} 
              className="glass-panel stock-card" 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '14px 16px',
                transition: 'transform 0.2s'
              }}
            >
              {/* 左側：代碼與名稱 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="stock-ticker" style={{ fontSize: '15px', fontWeight: '700' }}>{stock.ticker}</span>
                <span className="stock-name" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{stock.name}</span>
              </div>

              {/* 右側：即時價格與刪除按鈕 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#00f2fe', fontFamily: 'var(--font-heading)' }}>
                  {formatCurrency(stock.currentPrice)}
                </span>
                <button
                  onClick={() => setDeleteConfirmRow(stock.row)}
                  className="clickable"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: 'none',
                    color: 'var(--color-danger)',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                  title="移除此追蹤股票"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

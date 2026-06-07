import React, { useState } from 'react';

export default function StockDashboard({ data, loading, onRefresh, onAddStock, onDeleteStock, onUpdateStockShares }) {
  const { stocks = [], summary = { totalCost: 0, totalValue: 0, totalProfitLoss: 0, totalProfitRate: 0 } } = data || {};

  const [showAddForm, setShowAddForm] = useState(false);
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [shares, setShares] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 修改股數狀態
  const [editingRow, setEditingRow] = useState(null);
  const [editSharesValue, setEditSharesValue] = useState('');

  const [deleteConfirmRow, setDeleteConfirmRow] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatCurrency = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '$0';
    return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(val);
  };

  const formatPercent = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '0.00%';
    return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ticker.trim() || !name.trim() || !costPrice || !shares) return;

    setIsSaving(true);
    try {
      const success = await onAddStock({
        ticker: ticker.trim().toUpperCase(),
        name: name.trim(),
        costPrice: Number(costPrice),
        shares: Number(shares)
      });
      if (success) {
        setTicker('');
        setName('');
        setCostPrice('');
        setShares('');
        setShowAddForm(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (stock) => {
    setEditingRow(stock.row);
    setEditSharesValue(stock.shares);
  };

  const handleSaveShares = async (row) => {
    if (editSharesValue === '' || isNaN(editSharesValue) || Number(editSharesValue) < 0) return;
    setIsSaving(true);
    try {
      const success = await onUpdateStockShares(row, Number(editSharesValue));
      if (success) {
        setEditingRow(null);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmRow) return;
    setIsDeleting(true);
    try {
      await onDeleteStock(deleteConfirmRow);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmRow(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* 總結卡片 */}
      <div className="glass-panel stock-summary-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>📊 我的證券資產總覽</span>
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

        {loading && !data ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="skeleton" style={{ height: '36px', width: '70%' }}></div>
            <div className="summary-grid">
              <div className="skeleton" style={{ height: '50px' }}></div>
              <div className="skeleton" style={{ height: '50px' }}></div>
            </div>
          </div>
        ) : (
          <>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>即時證券市值</div>
              <div style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: '#00f2fe' }}>
                {formatCurrency(summary.totalValue)}
              </div>
            </div>

            <div className="summary-grid" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
              <div className="summary-item">
                <span className="summary-label">持股總成本</span>
                <span className="summary-value" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(summary.totalCost)}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">累積帳面損益</span>
                <span className={`summary-value ${summary.totalProfitLoss >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(summary.totalProfitLoss)} ({formatPercent(summary.totalProfitRate)})
                </span>
              </div>
            </div>
          </>
        )}
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
          {showAddForm ? '🙈 取消新增持股' : '➕ 新增持股資料'}
        </button>

        {showAddForm && (
          <div className="glass-panel" style={{ padding: '16px', marginTop: '12px', background: 'rgba(13, 20, 35, 0.85)' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>股票代號 (例: TPE:2330)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="TPE:2330"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    required
                    style={{ padding: '8px 12px', fontSize: '14px' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>股票名稱</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="台積電"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ padding: '8px 12px', fontSize: '14px' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>平均買入成本價</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="成本"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    required
                    style={{ padding: '8px 12px', fontSize: '14px' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>持股股數</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="股數"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    required
                    style={{ padding: '8px 12px', fontSize: '14px' }}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn-gradient-green clickable"
                style={{ padding: '10px', width: '100%', marginTop: '6px' }}
                disabled={isSaving}
              >
                {isSaving ? '正在寫入試算表...' : '儲存股票資料 💾'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 刪除股票確認模態框 */}
      {deleteConfirmRow !== null && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-content">
            <h3 style={{ marginBottom: '12px', fontSize: '16px', color: 'var(--text-primary)' }}>⚠️ 確認要刪除此持股嗎？</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              此操作將會把本股票項目從 Google Sheets 試算表中永久刪除，且無法回復。
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleConfirmDelete} 
                className="btn-danger clickable" 
                style={{ flex: 1, padding: '10px', borderRadius: 'var(--border-radius-sm)', border: 'none', color: '#fff', fontWeight: 'bold', background: 'var(--color-danger)' }}
                disabled={isDeleting}
              >
                {isDeleting ? '刪除中...' : '確認刪除'}
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

      {/* 股票清單列表 */}
      <h3 style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: '700', paddingLeft: '4px' }}>
        📈 即時持股明細
      </h3>

      <div className="stock-list">
        {loading && stocks.length === 0 ? (
          // 骨架屏載入狀態
          [1, 2].map(i => (
            <div key={i} className="glass-panel stock-card" style={{ height: '76px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '50%' }}>
                <div className="skeleton" style={{ height: '18px', width: '80%' }}></div>
                <div className="skeleton" style={{ height: '12px', width: '50%' }}></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '30%', alignItems: 'flex-end' }}>
                <div className="skeleton" style={{ height: '18px', width: '100%' }}></div>
                <div className="skeleton" style={{ height: '12px', width: '70%' }}></div>
              </div>
            </div>
          ))
        ) : stocks.length === 0 ? (
          <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            📭 試算表 Stocks 工作表內尚無持股資料。請點擊「新增持股資料」新增！
          </div>
        ) : (
          stocks.map((stock, idx) => {
            const isProfit = stock.profitLoss >= 0;
            return (
              <div key={stock.ticker + '-' + idx} className="glass-panel stock-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px', padding: '14px 16px' }}>
                {/* 第一排：代號名稱與刪除按鈕 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="stock-ticker" style={{ fontSize: '15px' }}>{stock.ticker}</span>
                    <span className="stock-name" style={{ fontSize: '13px' }}>{stock.name}</span>
                  </div>
                  <button
                    onClick={() => setDeleteConfirmRow(stock.row)}
                    className="clickable"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: 'none',
                      color: 'var(--color-danger)',
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                    title="刪除此股票"
                  >
                    🗑️
                  </button>
                </div>

                {/* 第二排：數據資訊網格 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px' }}>
                  {/* 左側：成本資訊 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>成本單價</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>${(stock.costPrice || 0).toFixed(1)}</span>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>持有股數</span>
                      {editingRow === stock.row ? (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <input
                            type="number"
                            value={editSharesValue}
                            onChange={(e) => setEditSharesValue(e.target.value)}
                            style={{
                              width: '60px',
                              background: 'var(--bg-input)',
                              border: '1px solid var(--border-color-active)',
                              color: '#fff',
                              borderRadius: '4px',
                              fontSize: '11px',
                              padding: '2px 4px',
                              outline: 'none'
                            }}
                            required
                          />
                          <button
                            onClick={() => handleSaveShares(stock.row)}
                            style={{ background: 'transparent', border: 'none', color: '#00f2fe', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                            title="儲存"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingRow(null)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                            title="取消"
                          >
                            ✗
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{(stock.shares || 0).toLocaleString()} 股</span>
                          <button
                            onClick={() => startEdit(stock)}
                            style={{ background: 'transparent', border: 'none', color: '#00f2fe', cursor: 'pointer', fontSize: '11px', padding: '0' }}
                            title="修改股數"
                          >
                            ✏️
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '4px' }}>
                      <span>個股總成本</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                        {formatCurrency((stock.costPrice || 0) * (stock.shares || 0))}
                      </span>
                    </div>
                  </div>

                  {/* 右側：市值損益 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>即時單價</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>${(stock.currentPrice || 0).toFixed(2)}</span>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>目前現值</span>
                      <span style={{ color: '#00f2fe', fontWeight: '700' }}>{formatCurrency(stock.marketValue || 0)}</span>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '4px' }}>
                      <span>帳面損益</span>
                      <span style={{ fontWeight: '700', color: isProfit ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {stock.profitLoss >= 0 ? '+' : ''}{Math.round(stock.profitLoss).toLocaleString()} ({formatPercent(stock.profitRate)})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}

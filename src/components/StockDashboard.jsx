import React from 'react';

export default function StockDashboard({ data, loading, onRefresh }) {
  const { stocks = [], summary = { totalCost: 0, totalValue: 0, totalProfitLoss: 0, totalProfitRate: 0 } } = data || {};

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(val);
  };

  const formatPercent = (val) => {
    return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
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

      {/* 股票清單列表 */}
      <h3 style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: '700', paddingLeft: '4px' }}>
        📈 即時持股明細
      </h3>

      <div className="stock-list">
        {loading ? (
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
            📭 試算表 Stocks 工作表內尚無持股資料。請先於試算表中新增股票代號！
          </div>
        ) : (
          stocks.map((stock) => {
            const isProfit = stock.profitLoss >= 0;
            return (
              <div key={stock.ticker} className="glass-panel stock-card">
                <div className="stock-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="stock-ticker">{stock.ticker}</span>
                    <span className="stock-name">{stock.name}</span>
                  </div>
                  <div className="stock-cost">
                    成本價: {stock.costPrice.toFixed(1)} | 庫存: {stock.shares.toLocaleString()} 股
                  </div>
                </div>

                <div className="stock-price-block">
                  <span className="stock-price">{stock.currentPrice.toFixed(2)}</span>
                  <span className={`stock-profit ${isProfit ? 'positive' : 'negative'}`}>
                    {isProfit ? '▲' : '▼'} {formatPercent(stock.profitRate)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}

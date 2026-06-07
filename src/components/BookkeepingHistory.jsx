import React, { useState } from 'react';

export default function BookkeepingHistory({ records, loading, onRefresh, onDelete }) {
  const [deleteConfirmRow, setDeleteConfirmRow] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statsTimeFrame, setStatsTimeFrame] = useState('month'); // 'month' or 'all'

  // 取得分類對應的圖示與樣式
  const getCategoryStyle = (category) => {
    const defaultStyle = {
      icon: '📝',
      bg: 'rgba(148, 163, 184, 0.15)',
      color: '#cbd5e1'
    };

    const categoriesMap = {
      '食': { icon: '🍔', bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399' },
      '餐飲': { icon: '🍔', bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399' },
      '食品': { icon: '🍔', bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399' },
      '衣': { icon: '👕', bg: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' },
      '購物': { icon: '🛍️', bg: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' },
      '住': { icon: '🏠', bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' },
      '居住': { icon: '🏠', bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' },
      '水電': { icon: '💧', bg: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' },
      '行': { icon: '🚌', bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' },
      '交通': { icon: '🚌', bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' },
      '育': { icon: '📚', bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' },
      '樂': { icon: '🎬', bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171' },
      '娛樂': { icon: '🎬', bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171' },
      '其它': { icon: '📝', bg: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1' },
      '其他': { icon: '📝', bg: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1' },
      '醫療': { icon: '🏥', bg: 'rgba(20, 184, 166, 0.15)', color: '#2dd4bf' },
      '投資': { icon: '📈', bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' },
      '收入': { icon: '💵', bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }
    };

    // 模糊匹配分類名稱
    for (const key in categoriesMap) {
      if (category.includes(key) || key.includes(category)) {
        return categoriesMap[key];
      }
    }
    return defaultStyle;
  };

  // 計算本月及全部的總和
  const currentMonthStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  const totalAmount = records?.reduce((sum, r) => sum + (Number(r.amount) || 0), 0) || 0;
  const currentMonthRecords = records?.filter(r => r.date.startsWith(currentMonthStr)) || [];
  const currentMonthAmount = currentMonthRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  // 計算分類統計數據
  const getCategoryStats = () => {
    if (!records || records.length === 0) return [];

    // 依據篩選條件過濾資料
    const filteredRecords = statsTimeFrame === 'month' 
      ? records.filter(r => r.date.startsWith(currentMonthStr))
      : records;

    const statsMap = {};
    let totalSpent = 0;

    filteredRecords.forEach(r => {
      const amount = Number(r.amount) || 0;
      if (amount <= 0) return; // 忽略無支出或負值
      
      let matchedCategory = '其它';
      const catName = r.category || '';
      
      // 比對標準類別
      if (catName.includes('食') || catName.includes('餐') || catName.includes('食品')) {
        matchedCategory = '食';
      } else if (catName.includes('衣') || catName.includes('購')) {
        matchedCategory = '衣';
      } else if (catName.includes('住') || catName.includes('居') || catName.includes('水電')) {
        matchedCategory = '住';
      } else if (catName.includes('行') || catName.includes('交')) {
        matchedCategory = '行';
      } else if (catName.includes('育') || catName.includes('書') || catName.includes('學')) {
        matchedCategory = '育';
      } else if (catName.includes('樂') || catName.includes('娛') || catName.includes('影')) {
        matchedCategory = '樂';
      } else if (catName.includes('醫') || catName.includes('藥')) {
        matchedCategory = '醫療';
      } else if (catName.includes('投') || catName.includes('股')) {
        matchedCategory = '投資';
      } else if (catName.includes('收') || catName.includes('薪')) {
        matchedCategory = '收入';
      } else {
        matchedCategory = catName || '其它';
      }

      if (!statsMap[matchedCategory]) {
        statsMap[matchedCategory] = 0;
      }
      statsMap[matchedCategory] += amount;
      totalSpent += amount;
    });

    if (totalSpent === 0) return [];

    // 轉為陣列、排序並計算百分比
    const statsList = Object.keys(statsMap).map(cat => {
      const amount = statsMap[cat];
      const percentage = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
      return {
        category: cat,
        amount,
        percentage
      };
    });

    // 依金額由大到小排序
    return statsList.sort((a, b) => b.amount - a.amount);
  };

  const categoryStats = getCategoryStats();

  const handleDeleteClick = (row) => {
    setDeleteConfirmRow(row);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmRow) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteConfirmRow);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmRow(null);
    }
  };

  return (
    <div className="history-container">
      {/* 總結資訊卡片 */}
      <div className="glass-panel stock-summary-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: '700', fontSize: '15px' }}>📊 記帳明細總覽</div>
          <button 
            onClick={onRefresh} 
            disabled={loading} 
            className="clickable"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#00f2fe',
              cursor: 'pointer',
              fontSize: '13px',
              textDecoration: 'underline'
            }}
          >
            {loading ? '更新中...' : '🔄 重新載入'}
          </button>
        </div>
        
        <div className="summary-grid" style={{ marginTop: '8px' }}>
          <div className="summary-item">
            <span className="summary-label">📅 本月總支出 ({currentMonthRecords.length} 筆)</span>
            <span className="summary-value" style={{ color: '#fbc2eb' }}>
              ${currentMonthAmount.toLocaleString()}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">💰 所有累計支出</span>
            <span className="summary-value" style={{ color: '#00f2fe' }}>
              ${totalAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 類別支出佔比卡片 */}
      {records && records.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontWeight: '700', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🏷️ 類別支出佔比</span>
            </div>
            
            {/* 時間切換按鈕 */}
            <div style={{ 
              display: 'flex', 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '8px', 
              padding: '2px',
              border: '1px solid var(--border-color)'
            }}>
              <button
                onClick={() => setStatsTimeFrame('month')}
                className="clickable"
                style={{
                  background: statsTimeFrame === 'month' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                  border: 'none',
                  color: statsTimeFrame === 'month' ? '#00f2fe' : 'var(--text-secondary)',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                本月
              </button>
              <button
                onClick={() => setStatsTimeFrame('all')}
                className="clickable"
                style={{
                  background: statsTimeFrame === 'all' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                  border: 'none',
                  color: statsTimeFrame === 'all' ? '#00f2fe' : 'var(--text-secondary)',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                全部
              </button>
            </div>
          </div>

          {categoryStats.length === 0 ? (
            <div style={{ padding: '10px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              📭 此區間尚無可統計的支出項目。
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {categoryStats.map((stat, idx) => {
                const style = getCategoryStyle(stat.category);
                return (
                  <div key={stat.category + '-' + idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                        <span>{style.icon}</span>
                        <span style={{ color: 'var(--text-primary)' }}>{stat.category}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                        <span style={{ color: '#00f2fe' }}>${stat.amount.toLocaleString()}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '500' }}>
                          {stat.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    {/* 進度條 */}
                    <div style={{ 
                      height: '8px', 
                      background: 'rgba(255,255,255,0.05)', 
                      borderRadius: '4px', 
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${stat.percentage}%`,
                        borderRadius: '4px',
                        background: `linear-gradient(90deg, ${style.color}cc, ${style.color})`,
                        boxShadow: `0 0 8px ${style.color}66`,
                        transition: 'width 0.6s cubic-bezier(0.1, 1, 0.1, 1)'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 刪除確認模態框 */}
      {deleteConfirmRow !== null && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-content">
            <h3 style={{ marginBottom: '12px', fontSize: '16px', color: 'var(--text-primary)' }}>⚠️ 確認要刪除此筆記帳嗎？</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              此操作將會把本筆資料從 Google Sheets 試算表中永久刪除，且無法回復。
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

      {/* 歷史列表內容 */}
      {loading && (!records || records.length === 0) ? (
        // 骨架屏載入動畫
        <div className="stock-list">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-panel stock-card skeleton" style={{ height: '80px', border: 'none' }} />
          ))}
        </div>
      ) : !records || records.length === 0 ? (
        // 無資料狀態
        <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          📭 尚無任何記帳資料。<br />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>快去「手動記帳」或「AI 記帳」新增一筆吧！</span>
        </div>
      ) : (
        // 歷史卡片清單
        <div className="stock-list">
          {records.map((record, index) => {
            const catStyle = getCategoryStyle(record.category);
            return (
              <div 
                key={record.row + '-' + index} 
                className="glass-panel stock-card history-card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 16px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {/* 圖示 */}
                  <div 
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: catStyle.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px'
                    }}
                  >
                    {catStyle.icon}
                  </div>
                  
                  {/* 文字明細 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>
                        {record.item}
                      </span>
                      <span 
                        style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: catStyle.bg,
                          color: catStyle.color
                        }}
                      >
                        {record.category}
                      </span>
                    </div>
                    
                    {record.note && (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {record.note}
                      </span>
                    )}
                    
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      📅 {record.date}
                    </span>
                  </div>
                </div>

                {/* 右側：金額與刪除 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <span style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: '#00f2fe' }}>
                    ${Number(record.amount).toLocaleString()}
                  </span>
                  
                  <button
                    onClick={() => handleDeleteClick(record.row)}
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
                    title="刪除此筆記帳"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

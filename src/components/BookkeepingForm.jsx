import React, { useState } from 'react';

export default function BookkeepingForm({ onSubmit, loading }) {
  const categories = ['食', '衣', '住', '行', '育', '樂', '其它'];
  
  // 預設日期為今天
  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [formData, setFormData] = useState({
    date: getTodayString(),
    category: '食',
    item: '',
    amount: '',
    note: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.date || !formData.item || !formData.amount) {
      alert('請填寫日期、項目與金額！');
      return;
    }
    
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount)
    });

    // 成功後重設項目與金額，保留日期與分類以利連續輸入
    setFormData(prev => ({
      ...prev,
      item: '',
      amount: '',
      note: ''
    }));
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '18px', marginBottom: '20px', fontWeight: '700' }} className="text-gradient-green">
        ✍️ 新增記帳明細
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">消費日期</label>
          <input
            type="date"
            name="date"
            className="form-input"
            value={formData.date}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">消費分類</label>
          <select
            name="category"
            className="form-select"
            value={formData.category}
            onChange={handleChange}
            disabled={loading}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">項目名稱</label>
          <input
            type="text"
            name="item"
            className="form-input"
            placeholder="例如：午餐便當、捷運加值..."
            value={formData.item}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">金額</label>
          <input
            type="number"
            name="amount"
            className="form-input"
            placeholder="請輸入金額"
            value={formData.amount}
            onChange={handleChange}
            required
            disabled={loading}
            min="0"
            step="any"
          />
        </div>

        <div className="form-group">
          <label className="form-label">備註 (選填)</label>
          <textarea
            name="note"
            className="form-textarea"
            placeholder="補充說明..."
            value={formData.note}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="btn-gradient-green clickable"
          style={{ width: '100%', padding: '14px', marginTop: '8px', fontSize: '16px' }}
          disabled={loading}
        >
          {loading ? '寫入中...' : '確認送出'}
        </button>
      </form>
    </div>
  );
}

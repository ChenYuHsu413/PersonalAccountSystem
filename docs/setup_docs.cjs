const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\alung\\.gemini\\antigravity-ide\\brain\\c4dc2b91-7203-4258-ac65-67bc7b9b3c58\\.system_generated\\logs\\transcript.jsonl';
const targetLogMd = 'c:\\Users\\alung\\Documents\\WorkSpace\\MyAIProject\\AccountSystem\\docs\\log.md';

const img1Src = 'C:\\Users\\alung\\.gemini\\antigravity-ide\\brain\\c4dc2b91-7203-4258-ac65-67bc7b9b3c58\\media__1780815289479.png';
const img2Src = 'C:\\Users\\alung\\.gemini\\antigravity-ide\\brain\\c4dc2b91-7203-4258-ac65-67bc7b9b3c58\\media__1780815304433.png';

const img1Dest = 'c:\\Users\\alung\\Documents\\WorkSpace\\MyAIProject\\AccountSystem\\docs\\screenshot_bookkeeping.png';
const img2Dest = 'c:\\Users\\alung\\Documents\\WorkSpace\\MyAIProject\\AccountSystem\\docs\\screenshot_stocks.png';

// Ensure docs folder exists
const docsDir = path.dirname(targetLogMd);
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Copy screenshots
try {
  fs.copyFileSync(img1Src, img1Dest);
  console.log('Successfully copied bookkeeping screenshot.');
} catch (e) {
  console.error('Error copying bookkeeping screenshot:', e);
}

try {
  fs.copyFileSync(img2Src, img2Dest);
  console.log('Successfully copied stocks screenshot.');
} catch (e) {
  console.error('Error copying stocks screenshot:', e);
}

// Parse transcript.jsonl
try {
  const content = fs.readFileSync(logPath, 'utf-8');
  const lines = content.split('\n');
  const requests = [];

  for (let line of lines) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.source === 'USER_EXPLICIT' && obj.type === 'USER_INPUT') {
        let reqText = obj.content || '';
        // Extract content inside <USER_REQUEST> tags if present
        const match = reqText.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
        if (match) {
          reqText = match[1].trim();
        }
        
        requests.push({
          timestamp: obj.created_at,
          text: reqText
        });
      }
    } catch (err) {
      // Ignore parse errors on truncated lines
    }
  }

  // Format to Markdown
  let mdContent = `# 📋 SmartLedger 使用者對話指令歷史記錄\n\n本檔案記錄了使用者在開發此專案過程中所下達的所有核心指令與功能需求。\n\n`;
  requests.forEach((req, idx) => {
    const timeStr = new Date(req.timestamp).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
    mdContent += `### 💬 指令 ${idx + 1}\n\n`;
    mdContent += `* **時間**：\`${timeStr}\`\n`;
    mdContent += `* **指令內容**：\n\n\`\`\`text\n${req.text}\n\`\`\`\n\n---\n\n`;
  });

  fs.writeFileSync(targetLogMd, mdContent, 'utf-8');
  console.log('Successfully generated docs/log.md with', requests.length, 'records.');
} catch (e) {
  console.error('Error processing transcript:', e);
}

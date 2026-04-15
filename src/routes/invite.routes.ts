import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  // Disable caching completely
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const token = (req.query.token as string) || '';
  const apkUrl = process.env.APK_DOWNLOAD_URL || 'https://plusone-backend-hhs1.onrender.com/plusone.apk';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
<title>Join PlusOne</title>
<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}
body {
    background: linear-gradient(135deg, #0f172a, #1e293b);
    color: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 20px;
}
.container {
    text-align: center;
    max-width: 400px;
    width: 100%;
    padding: 30px 20px;
    background: rgba(255,255,255,0.05);
    border-radius: 32px;
    backdrop-filter: blur(12px);
}
.logo {
    font-size: 42px;
    font-weight: 800;
    margin-bottom: 16px;
}
h1 {
    font-size: 26px;
    margin-bottom: 10px;
}
p {
    font-size: 14px;
    color: #cbd5e1;
    margin-bottom: 25px;
}
.token-box {
    margin-bottom: 20px;
    padding: 12px;
    background: rgba(255,255,255,0.08);
    border-radius: 16px;
}
.token-input {
    width: 100%;
    padding: 10px;
    background: #1e293b;
    border: 1px solid #3b82f6;
    border-radius: 12px;
    color: white;
    font-family: monospace;
    text-align: center;
    font-size: 14px;
    margin-bottom: 12px;
}
.copy-btn {
    width: 100%;
    padding: 10px;
    border-radius: 30px;
    border: none;
    background: #3b82f6;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
}
.copy-btn.copied {
    background: #22c55e;
}
.btn {
    display: block;
    width: 100%;
    padding: 16px;
    font-size: 18px;
    font-weight: 600;
    border-radius: 50px;
    text-decoration: none;
    background: #22c55e;
    color: white;
    margin-top: 10px;
}
.note {
    font-size: 12px;
    color: #94a3b8;
    margin-top: 20px;
}
</style>
</head>
<body>
<div class="container">
    <div class="logo">PlusOne</div>
    <h1>You're Invited</h1>
    <p>Download the app and use this code</p>
    
    <div class="token-box">
        <input type="text" id="tokenInput" class="token-input" readonly value="${escapeHtml(token)}" placeholder="Referral code">
        <button class="copy-btn" id="copyBtn">📋 Copy Referral Code</button>
    </div>

    <a href="${apkUrl}" class="btn" id="downloadBtn">📲 Download App</a>
    <div class="note">After installing, open the app and paste this code during signup.</div>
</div>

<script>
(function() {
    const copyBtn = document.getElementById('copyBtn');
    const tokenInput = document.getElementById('tokenInput');
    const tokenValue = tokenInput.value;

    if (!tokenValue) {
        copyBtn.disabled = true;
        copyBtn.style.opacity = '0.5';
        copyBtn.title = 'No referral code to copy';
    }

    // Universal copy function that works everywhere
    function copyToClipboard(text) {
        // Method 1: Try using the modern Clipboard API (requires HTTPS or localhost)
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                showCopied();
            }).catch(() => {
                fallbackCopy(text);
            });
        } else {
            // Method 2: Fallback using textarea (works on HTTP too)
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        // Make the textarea out of viewport
        textarea.style.position = 'fixed';
        textarea.style.top = '-9999px';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, text.length); // For mobile
        let success = false;
        try {
            success = document.execCommand('copy');
        } catch (err) {
            console.error('Fallback copy error:', err);
        }
        document.body.removeChild(textarea);
        if (success) {
            showCopied();
        } else {
            alert('Unable to copy. Please manually select and copy the code.');
        }
    }

    function showCopied() {
        const originalText = copyBtn.innerText;
        copyBtn.innerText = '✓ Copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
            copyBtn.innerText = originalText;
            copyBtn.classList.remove('copied');
        }, 2000);
    }

    copyBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (!tokenValue) {
            alert('No referral code to copy.');
            return;
        }
        copyToClipboard(tokenValue);
    });
})();
</script>
</body>
</html>
`;

  res.send(html);
});

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default router;
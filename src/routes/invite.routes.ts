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
    border: 2px solid #3b82f6;
    border-radius: 12px;
    color: white;
    font-family: monospace;
    text-align: center;
    font-size: 14px;
    margin-bottom: 12px;
    transition: 0.2s;
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
    transition: 0.2s;
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

.toast {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    background: #22c55e;
    color: #fff;
    padding: 12px 20px;
    border-radius: 30px;
    font-size: 14px;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: fadeInOut 2s ease;
}

@keyframes fadeInOut {
    0% { opacity: 0; transform: translate(-50%, 20px); }
    10% { opacity: 1; transform: translate(-50%, 0); }
    90% { opacity: 1; }
    100% { opacity: 0; transform: translate(-50%, 20px); }
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

    <a href="${apkUrl}" class="btn">📲 Download App</a>
    <div class="note">After installing, open the app and paste this code during signup.</div>
</div>

<script>
(function() {
    const copyBtn = document.getElementById('copyBtn');
    const tokenInput = document.getElementById('tokenInput');

    function showToast(msg, isError = false) {
        const toast = document.createElement('div');
        toast.innerText = msg;
        toast.style.position = 'fixed';
        toast.style.bottom = '30px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.background = isError ? '#e53e3e' : '#22c55e';
        toast.style.color = '#fff';
        toast.style.padding = '12px 20px';
        toast.style.borderRadius = '30px';
        toast.style.fontSize = '14px';
        toast.style.zIndex = '9999';
        toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        toast.style.animation = 'fadeInOut 2s ease';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    async function copyToClipboard(text) {
        // Modern Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (err) {
                console.error('Clipboard API failed:', err);
                return false;
            }
        }
        // Fallback for old browsers
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        } catch (err) {
            console.error('Fallback copy failed:', err);
            return false;
        }
    }

    copyBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        const text = tokenInput.value.trim();
        if (!text) {
            showToast('No referral code to copy', true);
            return;
        }

        const success = await copyToClipboard(text);
        if (success) {
            showToast('Referral code copied!');
            copyBtn.innerText = '✓ Copied!';
            copyBtn.classList.add('copied');
            setTimeout(() => {
                copyBtn.innerText = '📋 Copy Referral Code';
                copyBtn.classList.remove('copied');
            }, 2000);
        } else {
            showToast('Failed to copy. Please select and copy manually.', true);
        }
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
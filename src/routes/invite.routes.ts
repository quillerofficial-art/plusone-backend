import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  // Token from query string (e.g., ?token=abc)
  let token = (req.query.token as string) || '';
  
  // If token is empty, try to read from referer or hash? Not possible server-side.
  // But we'll also provide a client-side fallback to read from hash.

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
#tokenText {
    font-size: 14px;
    margin-bottom: 10px;
    word-break: break-all;
    color: #e2e8f0;
    font-family: monospace;
}
.token-input {
    width: 100%;
    padding: 10px;
    margin-top: 8px;
    background: #1e293b;
    border: 1px solid #3b82f6;
    border-radius: 12px;
    color: white;
    font-family: monospace;
    text-align: center;
    font-size: 14px;
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
    margin-top: 12px;
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
.debug {
    font-size: 10px;
    color: #ef4444;
    margin-top: 10px;
    word-break: break-all;
}
</style>
</head>
<body>
<div class="container">
    <div class="logo">PlusOne</div>
    <h1>You're Invited</h1>
    <p>Download the app and use this code</p>
    
    <div class="token-box">
        <div id="tokenText">Loading referral code...</div>
        <input type="text" id="tokenInput" class="token-input" readonly placeholder="Referral code will appear here">
        <button class="copy-btn" id="copyBtn">📋 Copy Referral Code</button>
    </div>

    <a href="${apkUrl}" class="btn" id="downloadBtn">📲 Download App</a>
    <div class="note">After installing, open the app and paste this code during signup.</div>
    <div id="debugInfo" class="debug"></div>
</div>

<script>
(function() {
    // Helper to get URL parameters
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }
    
    // Also check hash fragment (if token is after #)
    function getHashParam(param) {
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        return hashParams.get(param);
    }

    let token = getQueryParam('token') || getHashParam('token');
    
    // Debug info
    const debugDiv = document.getElementById('debugInfo');
    debugDiv.innerHTML = 'URL: ' + window.location.href + '<br>Extracted token: ' + (token || '❌ NOT FOUND');
    
    const tokenTextDiv = document.getElementById('tokenText');
    const tokenInput = document.getElementById('tokenInput');
    const copyBtn = document.getElementById('copyBtn');
    
    if (token) {
        tokenTextDiv.innerText = 'Your referral code:';
        tokenInput.value = token;
        tokenInput.style.display = 'block';
    } else {
        tokenTextDiv.innerText = '⚠️ No referral code found in this link.';
        tokenInput.value = '';
        tokenInput.style.display = 'block';
        copyBtn.disabled = true;
        copyBtn.style.opacity = '0.5';
        debugDiv.innerHTML += '<br>❌ Token missing. Make sure the link contains ?token=YOUR_CODE';
    }
    
    // Copy function
    async function copyToken() {
        if (!token) {
            alert('No referral code to copy.');
            return;
        }
        try {
            await navigator.clipboard.writeText(token);
            showCopied();
        } catch (err) {
            // Fallback
            tokenInput.select();
            document.execCommand('copy');
            showCopied();
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
    
    copyBtn.addEventListener('click', copyToken);
    
    // No auto-copy on download
    const downloadBtn = document.getElementById('downloadBtn');
    // Just let the link work normally
})();
</script>
</body>
</html>
`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;
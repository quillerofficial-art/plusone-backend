import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  const token = req.query.token || '';
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
    <p>Download the app and continue</p>
    <div class="token-box">
        <div id="tokenText"></div>
        <button class="copy-btn" id="copyBtn">📋 Copy Referral Code</button>
    </div>
    <a href="${apkUrl}" class="btn" id="downloadBtn">📲 Download App</a>
    <div class="note">Use the referral code while signing up.</div>
</div>

<script>
(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token') || '';
    const tokenTextDiv = document.getElementById('tokenText');
    const copyBtn = document.getElementById('copyBtn');

    // Display token
    if (token) {
        tokenTextDiv.innerText = "Referral Code: " + token;
    } else {
        tokenTextDiv.innerText = "No referral code found";
        copyBtn.disabled = true;
        copyBtn.style.opacity = '0.5';
    }

    // Copy function with feedback
    function copyTokenToClipboard() {
        if (!token) return false;
        // Try modern clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(token).then(() => {
                showCopiedFeedback();
            }).catch(() => {
                fallbackCopy();
            });
        } else {
            fallbackCopy();
        }
        return true;
    }

    function fallbackCopy() {
        const textarea = document.createElement('textarea');
        textarea.value = token;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showCopiedFeedback();
    }

    function showCopiedFeedback() {
        const originalText = copyBtn.innerText;
        copyBtn.innerText = '✓ Copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
            copyBtn.innerText = originalText;
            copyBtn.classList.remove('copied');
        }, 2000);
    }

    copyBtn.addEventListener('click', copyTokenToClipboard);

    // Download button - no auto copy, just download
    const downloadBtn = document.getElementById('downloadBtn');
    // No extra code needed; href handles download.
    // If you want to remove any previous onclick, it's already removed.
})();
</script>
</body>
</html>
`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;
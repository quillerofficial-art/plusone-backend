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
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
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
            box-shadow: 0 20px 35px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.1);
        }
        .logo {
            font-size: 48px;
            font-weight: 800;
            background: linear-gradient(135deg, #38bdf8, #818cf8);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            margin-bottom: 16px;
        }
        h1 {
            font-size: 28px;
            margin-bottom: 8px;
            font-weight: 600;
        }
        p {
            font-size: 15px;
            color: #cbd5e1;
            margin-bottom: 28px;
        }
        .btn {
            display: inline-block;
            width: 100%;
            padding: 16px 20px;
            font-size: 18px;
            font-weight: 600;
            border-radius: 60px;
            border: none;
            cursor: pointer;
            text-decoration: none;
            background: #22c55e;
            color: white;
            transition: all 0.2s ease;
            box-shadow: 0 8px 20px rgba(34,197,94,0.3);
        }
        .btn:hover {
            background: #16a34a;
            transform: scale(1.02);
        }
        .note {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 24px;
        }
        .toast {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: #22c55e;
            color: #0f172a;
            padding: 10px 20px;
            border-radius: 40px;
            font-size: 14px;
            font-weight: 500;
            opacity: 0;
            transition: opacity 0.3s;
            pointer-events: none;
            z-index: 1000;
            white-space: nowrap;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">PlusOne</div>
        <h1>✨ You're Invited!</h1>
        <p>Join PlusOne and start growing your network today.</p>
        <button id="downloadBtn" class="btn">📲 Download PlusOne App</button>
        <div class="note">After install, the app will automatically join you using the invitation token.</div>
    </div>
    <div id="toast" class="toast">✓ Token copied! Download starting...</div>

    <script>
        (function() {
            // Get token from URL query parameter
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token') || '';
            
            const downloadBtn = document.getElementById('downloadBtn');
            const apkUrl = '${apkUrl}';
            
            function showToast(message) {
                const toast = document.getElementById('toast');
                toast.textContent = message;
                toast.style.opacity = '1';
                setTimeout(() => {
                    toast.style.opacity = '0';
                }, 2500);
            }
            
            function copyToClipboard(text) {
                // Modern approach
                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(text).then(() => true).catch(() => false);
                } else {
                    // Fallback
                    const textarea = document.createElement('textarea');
                    textarea.value = text;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                }
            }
            
            downloadBtn.addEventListener('click', function () {
             if (token) {
               copyToClipboard(token);
                showToast('✓ Invitation token copied!');
                }

                setTimeout(() => {
                      window.location.href = apkUrl;
                 }, 300);
             });
        })();
    </script>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;
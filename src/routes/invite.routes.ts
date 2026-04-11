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

    <!-- ✅ DIRECT DOWNLOAD LINK -->
    <a href="#" id="downloadBtn" class="btn">📲 Download App</a>

    <div class="note">Token auto copied. Paste inside app if needed.</div>
</div>

<script>
(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token') || '';

    const apkUrl = '${apkUrl}';
    const btn = document.getElementById('downloadBtn');

     btn.addEventListener('click', function(e) {
     e.preventDefault();

     // copy token
     if (token) {
        try {
            navigator.clipboard.writeText(token);
        } catch (err) {
            const textarea = document.createElement('textarea');
            textarea.value = token;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
     }

     // delay + download
     setTimeout(() => {
        window.location.href = apkUrl;
     }, 400);
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
import express from 'express';
import path from 'path';

const router = express.Router();

router.get('/', (req, res) => {
  const token = req.query.token || '';
  const apkUrl = process.env.APK_DOWNLOAD_URL || 'https://plusone-backend-hhs1.onrender.com/plusone.apk';

  const html = `
<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Join PlusOne</title>

    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      }

      body {
        background: linear-gradient(135deg, #0f172a, #1e293b);
        color: #fff;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }

      .container {
        text-align: center;
        max-width: 400px;
        padding: 30px;
        background: rgba(255,255,255,0.05);
        border-radius: 16px;
        backdrop-filter: blur(10px);
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      }

      h1 {
        font-size: 26px;
        margin-bottom: 10px;
      }

      p {
        font-size: 15px;
        color: #cbd5e1;
        margin-bottom: 25px;
      }

      .btn {
        display: block;
        width: 100%;
        padding: 14px;
        margin-bottom: 12px;
        font-size: 16px;
        border-radius: 10px;
        border: none;
        cursor: pointer;
        text-decoration: none;
      }

      .download {
        background: #22c55e;
        color: #fff;
        font-weight: bold;
      }

      .download:hover {
        background: #16a34a;
      }

      .logo {
        font-size: 32px;
        margin-bottom: 15px;
        font-weight: bold;
        color: #38bdf8;
      }

    </style>
  </head>

  <body>
    <div class="container">
      <div class="logo">PlusOne</div>

      <h1>You're Invited🚀 </h1>
      <p>Join PlusOne and start growing your network today.</p>

      <a class="btn download" href="https://plusone-backend-hhs1.onrender.com/plusone.apk">
        Download APK & Join Now
      </a>

    </div>
  </body>
  </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;
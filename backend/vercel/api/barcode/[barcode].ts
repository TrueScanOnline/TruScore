// World-leading redirect page for barcode deep links
// Served at: https://truescan.app/barcode/{barcode}
// Fetches product data and displays an amazing, viral-worthy page
// Automatically opens app if installed, redirects to app stores if not

import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { barcode } = req.query;
  
  if (!barcode || typeof barcode !== 'string') {
    return res.status(400).send('Invalid barcode');
  }

  // App Store links
  const APP_STORE_ID = process.env.APP_STORE_ID || '[APP_STORE_ID]';
  const appStoreLink = APP_STORE_ID !== '[APP_STORE_ID]' 
    ? `https://apps.apple.com/app/id${APP_STORE_ID}`
    : 'https://apps.apple.com/app/truescan';
  const playStoreLink = 'https://play.google.com/store/apps/details?id=com.truescan.foodscanner';
  
  // Deep link to app
  const deepLink = `truescan://barcode/${barcode}`;
  const universalLink = `https://truescan.app/barcode/${barcode}`;
  
  // Fetch product data
  let productData: any = null;
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'https://truscoreapi.vercel.app';
    const productResponse = await fetch(`${baseUrl}/api/product-preview?barcode=${barcode}`);
    if (productResponse.ok) {
      productData = await productResponse.json();
    }
  } catch (error) {
    // Continue without product data
    console.error('Error fetching product data:', error);
  }

  const productName = productData?.product_name || productData?.product_name_en || 'This Product';
  const productImage = productData?.image_url || '';
  const trustScore = productData?.trust_score;
  const trustScoreBreakdown = productData?.trust_score_breakdown;
  const brands = productData?.brands;
  const categories = productData?.categories;
  
  // Calculate score color and emoji with viral messaging
  const getScoreColor = (score: number | null | undefined) => {
    if (!score && score !== 0) return { 
      color: '#667eea', 
      emoji: '🔍', 
      label: 'Scan to See',
      hook: 'Discover the truth about this product',
      viralMessage: 'You won\'t believe what we found!'
    };
    if (score >= 80) return { 
      color: '#16a085', 
      emoji: '🌟', 
      label: 'Excellent',
      hook: 'This product scored EXCELLENT!',
      viralMessage: 'One of the best products we\'ve seen!'
    };
    if (score >= 60) return { 
      color: '#4dd09f', 
      emoji: '✅', 
      label: 'Good',
      hook: 'Solid choice with good ratings',
      viralMessage: 'A trustworthy product worth checking out'
    };
    if (score >= 40) return { 
      color: '#f39c12', 
      emoji: '⚠️', 
      label: 'Fair',
      hook: 'This product has some concerns',
      viralMessage: 'You might want to see the full breakdown...'
    };
    return { 
      color: '#e74c3c', 
      emoji: '❌', 
      label: 'Poor',
      hook: '⚠️ Low score - important info inside',
      viralMessage: 'This is why you need to check products before buying!'
    };
  };
  
  const scoreInfo = getScoreColor(trustScore);
  
  // Generate viral headline based on score
  const getViralHeadline = () => {
    if (trustScore === null || trustScore === undefined) {
      return '🔍 Someone Shared This Product With You';
    }
    if (trustScore >= 80) {
      return `🌟 ${productName} Got an EXCELLENT Score!`;
    }
    if (trustScore >= 60) {
      return `✅ Check Out This Product's TruScore`;
    }
    if (trustScore >= 40) {
      return `⚠️ You Should See This Product's Score`;
    }
    return `❌ This Product's Score Will Surprise You`;
  };
  
  const viralHeadline = getViralHeadline();
  
  // World-leading HTML page with premium design
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${productName} - TruScore</title>
  <meta name="description" content="Discover the TruScore for ${productName}. Get detailed product information, nutrition facts, ingredients, and sustainability data with TruScore.">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${universalLink}">
  <meta property="og:title" content="${viralHeadline}">
  <meta property="og:description" content="${trustScore !== null && trustScore !== undefined ? `${scoreInfo.viralMessage} TruScore: ${trustScore}/100 - See the full breakdown in TruScore app` : 'Discover the truth about products with TruScore - Free app, no sign-up required'}">
  ${productImage ? `<meta property="og:image" content="${productImage}">` : ''}
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${universalLink}">
  <meta name="twitter:title" content="${viralHeadline}">
  <meta name="twitter:description" content="${trustScore !== null && trustScore !== undefined ? `${scoreInfo.viralMessage} TruScore: ${trustScore}/100` : 'Discover the truth about products - Free TruScore app'}">
  ${productImage ? `<meta name="twitter:image" content="${productImage}">` : ''}
  
  <!-- iOS Universal Links -->
  <meta property="al:ios:app_store_id" content="${APP_STORE_ID}">
  <meta property="al:ios:app_name" content="TruScore">
  <meta property="al:ios:url" content="${deepLink}">
  
  <!-- Android App Links -->
  <meta property="al:android:package" content="com.truescan.foodscanner">
  <meta property="al:android:app_name" content="TruScore">
  <meta property="al:android:url" content="${deepLink}">
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }
    
    html, body {
      height: 100%;
      overflow-x: hidden;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      background-size: 400% 400%;
      animation: gradientShift 20s ease infinite;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      color: #333;
      position: relative;
      overflow-x: hidden;
    }
    
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    body::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.05) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
      animation: float 15s ease-in-out infinite;
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(5deg); }
    }
    
    .container {
      max-width: 420px;
      width: 100%;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.98);
      border-radius: 32px;
      overflow: hidden;
      box-shadow: 
        0 25px 80px rgba(0, 0, 0, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.6);
      animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      z-index: 1;
      backdrop-filter: blur(20px);
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(40px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    .hero {
      position: relative;
      background: linear-gradient(135deg, #16a085 0%, #4dd09f 100%);
      padding: 50px 30px 40px;
      text-align: center;
      color: #fff;
      overflow: hidden;
    }
    
    .hero::before {
      content: '';
      position: absolute;
      top: -100%;
      left: -100%;
      width: 300%;
      height: 300%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 60%);
      animation: rotate 25s linear infinite;
    }
    
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .hero > * {
      position: relative;
      z-index: 1;
    }
    
    .logo {
      font-size: 56px;
      margin-bottom: 12px;
      animation: pulse 2.5s ease-in-out infinite;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1) rotate(0deg); }
      50% { transform: scale(1.15) rotate(5deg); }
    }
    
    .hero h1 {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 12px;
      text-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
      letter-spacing: -0.5px;
      line-height: 1.2;
    }
    
    .hero .tagline {
      font-size: 16px;
      opacity: 0.95;
      font-weight: 600;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      margin-bottom: 8px;
    }
    
    .hero .viral-message {
      font-size: 15px;
      opacity: 0.9;
      font-weight: 500;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      margin-top: 8px;
      font-style: italic;
    }
    
    .social-proof {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 12px;
      font-size: 14px;
      opacity: 0.85;
    }
    
    .social-proof-icon {
      font-size: 18px;
    }
    
    .product-section {
      padding: 32px 24px;
    }
    
    .product-image-container {
      width: 100%;
      height: 280px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #f8f9fa 100%);
      background-size: 200% 200%;
      animation: shimmer 3s ease-in-out infinite;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      overflow: hidden;
      position: relative;
      box-shadow: 
        0 10px 30px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.8);
    }
    
    @keyframes shimmer {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    
    .product-image {
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
      border-radius: 12px;
      transition: transform 0.3s ease;
    }
    
    .product-image:hover {
      transform: scale(1.05);
    }
    
    .product-image-placeholder {
      font-size: 80px;
      color: #ddd;
      opacity: 0.6;
    }
    
    .product-name {
      font-size: 26px;
      font-weight: 800;
      color: #1a1a1a;
      margin-bottom: 10px;
      line-height: 1.2;
      letter-spacing: -0.3px;
    }
    
    .product-meta {
      color: #6c757d;
      font-size: 14px;
      margin-bottom: 28px;
      line-height: 1.6;
    }
    
    .product-meta strong {
      color: #495057;
      font-weight: 600;
    }
    
    .truScore-card {
      background: linear-gradient(135deg, ${scoreInfo.color}18 0%, ${scoreInfo.color}08 100%);
      border: 3px solid ${scoreInfo.color};
      border-radius: 24px;
      padding: 36px 24px;
      margin-bottom: 28px;
      text-align: center;
      box-shadow: 
        0 12px 40px ${scoreInfo.color}40,
        0 0 0 1px ${scoreInfo.color}20,
        inset 0 1px 0 rgba(255, 255, 255, 0.5);
      position: relative;
      overflow: hidden;
      animation: cardPulse 3s ease-in-out infinite;
    }
    
    @keyframes cardPulse {
      0%, 100% { transform: scale(1); box-shadow: 0 12px 40px ${scoreInfo.color}40, 0 0 0 1px ${scoreInfo.color}20, inset 0 1px 0 rgba(255, 255, 255, 0.5); }
      50% { transform: scale(1.02); box-shadow: 0 16px 50px ${scoreInfo.color}60, 0 0 0 1px ${scoreInfo.color}30, inset 0 1px 0 rgba(255, 255, 255, 0.6); }
    }
    
    .truScore-card::before {
      content: '';
      position: absolute;
      top: -80%;
      right: -80%;
      width: 250%;
      height: 250%;
      background: radial-gradient(circle, ${scoreInfo.color}15 0%, transparent 65%);
      animation: pulseGlow 4s ease-in-out infinite;
    }
    
    @keyframes pulseGlow {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(1.2); }
    }
    
    .truScore-card > * {
      position: relative;
      z-index: 1;
    }
    
    .truScore-emoji {
      font-size: 72px;
      margin-bottom: 16px;
      animation: bounce 1.2s ease-in-out infinite;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
    }
    
    @keyframes bounce {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-12px) scale(1.1); }
    }
    
    .truScore-number {
      font-size: 84px;
      font-weight: 900;
      color: ${scoreInfo.color};
      margin-bottom: 8px;
      line-height: 1;
      text-shadow: 0 4px 12px ${scoreInfo.color}50;
      letter-spacing: -2px;
    }
    
    .truScore-label {
      font-size: 20px;
      font-weight: 700;
      color: ${scoreInfo.color};
      margin-bottom: 24px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .truScore-breakdown {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
      margin-top: 24px;
    }
    
    .breakdown-item {
      background: rgba(255, 255, 255, 0.85);
      padding: 16px 12px;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transition: transform 0.2s ease;
    }
    
    .breakdown-item:hover {
      transform: translateY(-2px);
    }
    
    .breakdown-label {
      font-size: 11px;
      color: #6c757d;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
    }
    
    .breakdown-score {
      font-size: 24px;
      font-weight: 800;
      color: #1a1a1a;
      letter-spacing: -0.5px;
    }
    
    .features {
      padding: 32px 24px;
      background: linear-gradient(to bottom, #fff 0%, #f8f9fa 100%);
    }
    
    .features-title {
      font-size: 22px;
      font-weight: 800;
      color: #1a1a1a;
      margin-bottom: 24px;
      text-align: center;
      letter-spacing: -0.3px;
    }
    
    .features-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    
    .feature-item {
      text-align: center;
      padding: 20px 16px;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
    }
    
    .feature-item:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
    }
    
    .feature-icon {
      font-size: 36px;
      margin-bottom: 10px;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }
    
    .feature-label {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a1a;
      letter-spacing: -0.2px;
    }
    
    .cta-section {
      padding: 36px 24px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      text-align: center;
    }
    
    .cta-title {
      font-size: 26px;
      font-weight: 800;
      color: #1a1a1a;
      margin-bottom: 10px;
      letter-spacing: -0.5px;
    }
    
    .cta-subtitle {
      font-size: 16px;
      color: #6c757d;
      margin-bottom: 28px;
      line-height: 1.5;
    }
    
    .app-buttons {
      display: flex;
      flex-direction: column;
      gap: 14px;
      max-width: 320px;
      margin: 0 auto;
    }
    
    .app-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 20px 28px;
      background: linear-gradient(135deg, #16a085 0%, #4dd09f 100%);
      color: #fff;
      text-decoration: none;
      border-radius: 18px;
      font-weight: 700;
      font-size: 18px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 
        0 8px 24px rgba(22, 160, 133, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.2);
      position: relative;
      overflow: hidden;
      border: none;
      cursor: pointer;
    }
    
    .app-button::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.4);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }
    
    .app-button:active::before {
      width: 400px;
      height: 400px;
    }
    
    .app-button:hover {
      background: linear-gradient(135deg, #138d75 0%, #3bb88a 100%);
      transform: translateY(-4px) scale(1.02);
      box-shadow: 
        0 12px 32px rgba(22, 160, 133, 0.5),
        0 0 0 1px rgba(255, 255, 255, 0.3);
    }
    
    .app-button:active {
      transform: translateY(-2px) scale(1);
    }
    
    .app-button.secondary {
      background: linear-gradient(135deg, #4dd09f 0%, #16a085 100%);
      box-shadow: 
        0 8px 24px rgba(77, 208, 159, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.2);
    }
    
    .app-button.secondary:hover {
      background: linear-gradient(135deg, #3bb88a 0%, #138d75 100%);
      box-shadow: 
        0 12px 32px rgba(77, 208, 159, 0.5),
        0 0 0 1px rgba(255, 255, 255, 0.3);
    }
    
    .app-button-icon {
      font-size: 28px;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }
    
    .app-button-text {
      font-weight: 700;
      letter-spacing: -0.3px;
    }
    
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(102, 126, 234, 0.95);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      color: #fff;
    }
    
    .loading-spinner {
      width: 60px;
      height: 60px;
      border: 5px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .loading-text {
      font-size: 18px;
      font-weight: 600;
    }
    
    @media (max-width: 480px) {
      .container {
        border-radius: 0;
        max-width: 100%;
        min-height: 100vh;
      }
      
      .hero {
        padding: 40px 24px 32px;
      }
      
      .hero h1 {
        font-size: 28px;
      }
      
      .product-section {
        padding: 28px 20px;
      }
      
      .product-image-container {
        height: 240px;
      }
      
      .product-name {
        font-size: 22px;
      }
      
      .truScore-number {
        font-size: 64px;
      }
      
      .truScore-breakdown {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      
      .features {
        padding: 28px 20px;
      }
      
      .cta-section {
        padding: 32px 20px;
      }
      
      .cta-title {
        font-size: 22px;
      }
    }
  </style>
</head>
<body>
  <div class="loading-overlay" id="loadingOverlay">
    <div class="loading-spinner"></div>
    <div class="loading-text">Opening TruScore...</div>
  </div>

  <div class="container">
    <div class="hero">
      <div class="logo">🔍</div>
      <h1>${viralHeadline}</h1>
      <div class="tagline">${scoreInfo.hook}</div>
      <div class="viral-message">${scoreInfo.viralMessage}</div>
      <div class="social-proof">
        <span class="social-proof-icon">👥</span>
        <span>Join 1M+ users discovering the truth about products</span>
      </div>
    </div>
    
    <div class="product-section">
      ${productImage ? `
      <div class="product-image-container">
        <img src="${productImage}" alt="${productName}" class="product-image" onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'product-image-placeholder\\'>📦</div>'">
      </div>
      ` : `
      <div class="product-image-container">
        <div class="product-image-placeholder">📦</div>
      </div>
      `}
      
      <h2 class="product-name">${productName}</h2>
      <div class="product-meta">
        ${brands ? `<strong>Brand:</strong> ${brands.split(',')[0].trim()}<br>` : ''}
        ${categories ? `<strong>Category:</strong> ${categories.split(',')[0].trim()}<br>` : ''}
        <strong>Barcode:</strong> ${barcode}
      </div>
      
      ${trustScore !== null && trustScore !== undefined ? `
      <div class="truScore-card">
        <div class="truScore-emoji">${scoreInfo.emoji}</div>
        <div class="truScore-number">${trustScore}</div>
        <div class="truScore-label">TruScore ${scoreInfo.label}</div>
        ${trustScoreBreakdown ? `
        <div style="margin-top: 8px; font-size: 14px; color: #6c757d; font-weight: 600;">See the full breakdown in the app</div>
        <div class="truScore-breakdown">
          <div class="breakdown-item">
            <div class="breakdown-label">Body</div>
            <div class="breakdown-score">${Math.round(trustScoreBreakdown.body)}/25</div>
          </div>
          <div class="breakdown-item">
            <div class="breakdown-label">Planet</div>
            <div class="breakdown-score">${Math.round(trustScoreBreakdown.planet)}/25</div>
          </div>
          <div class="breakdown-item">
            <div class="breakdown-label">Ethics</div>
            <div class="breakdown-score">${Math.round((trustScoreBreakdown.ethics ?? trustScoreBreakdown.care ?? 0))}/25</div>
          </div>
          <div class="breakdown-item">
            <div class="breakdown-label">Open</div>
            <div class="breakdown-score">${Math.round(trustScoreBreakdown.open)}/25</div>
          </div>
        </div>
        ` : ''}
        <div style="margin-top: 20px; padding: 12px; background: rgba(255, 255, 255, 0.6); border-radius: 12px; font-size: 13px; color: #495057;">
          💡 <strong>Want more?</strong> See nutrition, ingredients, recalls, and sustainability data in the app
        </div>
      </div>
      ` : `
      <div class="truScore-card">
        <div class="truScore-emoji">🔍</div>
        <div class="truScore-label" style="font-size: 22px; margin-top: 24px; color: #667eea;">Scan to See TruScore</div>
        <div style="color: #6c757d; margin-top: 12px; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Get detailed product information, nutrition facts, and sustainability data</div>
        <div style="padding: 12px; background: rgba(255, 255, 255, 0.6); border-radius: 12px; font-size: 13px; color: #495057;">
          📱 <strong>Free app</strong> - Scan any barcode to see its complete TruScore breakdown
        </div>
      </div>
      `}
    </div>
    
    <div class="features">
      <div class="features-title">Why 1M+ Users Trust TruScore</div>
      <div class="features-grid">
        <div class="feature-item">
          <div class="feature-icon">📊</div>
          <div class="feature-label">TruScore Rating</div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🥗</div>
          <div class="feature-label">Nutrition Facts</div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🌱</div>
          <div class="feature-label">Sustainability</div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🔒</div>
          <div class="feature-label">Food Safety</div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🚨</div>
          <div class="feature-label">Recall Alerts</div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🌍</div>
          <div class="feature-label">Origin Tracking</div>
        </div>
      </div>
      <div style="text-align: center; margin-top: 20px; padding: 16px; background: rgba(22, 160, 133, 0.1); border-radius: 12px;">
        <div style="font-size: 14px; color: #16a085; font-weight: 600; margin-bottom: 4px;">✨ 100% Free • No Ads • No Sign-Up</div>
        <div style="font-size: 12px; color: #6c757d;">Join millions discovering the truth about products</div>
      </div>
    </div>
    
    <div class="cta-section">
      <div class="cta-title">${trustScore !== null && trustScore !== undefined ? 'See the Full Breakdown' : 'Discover What\'s Inside'}</div>
      <div class="cta-subtitle">${trustScore !== null && trustScore !== undefined ? 'Get detailed nutrition, ingredients, sustainability, and safety data' : 'Scan any product to see its complete TruScore breakdown'}</div>
      <div style="background: rgba(255, 255, 255, 0.9); border-radius: 16px; padding: 16px; margin-bottom: 20px; text-align: center;">
        <div style="font-size: 14px; color: #6c757d; margin-bottom: 8px;">✨ Free to download • No sign-up required</div>
        <div style="font-size: 13px; color: #95a5a6;">Trusted by millions of conscious shoppers</div>
      </div>
      <div class="app-buttons">
        <a href="${appStoreLink}" class="app-button" id="appStoreButton" onclick="tryOpenApp(event, 'ios')">
          <span class="app-button-icon">📱</span>
          <span class="app-button-text">Get TruScore Free</span>
        </a>
        <a href="${playStoreLink}" class="app-button secondary" id="playStoreButton" onclick="tryOpenApp(event, 'android')">
          <span class="app-button-icon">🤖</span>
          <span class="app-button-text">Get TruScore Free</span>
        </a>
      </div>
      <div style="text-align: center; margin-top: 16px; font-size: 12px; color: #95a5a6;">
        ⚡ Opens instantly if you have the app
      </div>
    </div>
  </div>

  <script>
    const barcode = '${barcode}';
    const deepLink = '${deepLink}';
    const universalLink = '${universalLink}';
    const appStoreLink = '${appStoreLink}';
    const playStoreLink = '${playStoreLink}';
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    const isMobile = isIOS || isAndroid;
    
    let appOpenAttempted = false;
    
    // Hide loading overlay after page loads
    window.addEventListener('load', () => {
      setTimeout(() => {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
          overlay.style.opacity = '0';
          overlay.style.transition = 'opacity 0.5s ease';
          setTimeout(() => overlay.style.display = 'none', 500);
        }
      }, 500);
    });
    
    // Try to open app
    function tryOpenApp(event, platform) {
      if (appOpenAttempted) return;
      
      appOpenAttempted = true;
      
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      // Show loading
      const overlay = document.getElementById('loadingOverlay');
      if (overlay) {
        overlay.style.display = 'flex';
        overlay.style.opacity = '1';
      }
      
      // Try deep link first
      if (isAndroid) {
        // Android Intent URL - best for app detection
        const intentUrl = \`intent://barcode/\${barcode}#Intent;scheme=truescan;package=com.truescan.foodscanner;S.browser_fallback_url=\${encodeURIComponent(playStoreLink)};end\`;
        
        // Try intent URL
        window.location.href = intentUrl;
        
        // Fallback to Play Store after delay
        setTimeout(() => {
          if (!document.hidden) {
            window.location.href = playStoreLink;
          }
        }, 2000);
      } else if (isIOS) {
        // iOS - try universal link first (if configured), then deep link
        // Universal links work automatically if configured
        window.location.href = deepLink;
        
        // Fallback to App Store after delay
        setTimeout(() => {
          if (!document.hidden && appStoreLink !== 'https://apps.apple.com/app/id[APP_STORE_ID]') {
            window.location.href = appStoreLink;
          }
        }, 2000);
      } else {
        // Desktop - show download options
        if (overlay) overlay.style.display = 'none';
      }
    }
    
    // Auto-open app on page load for mobile
    if (isMobile && !appOpenAttempted) {
      // Small delay to ensure page is ready
      setTimeout(() => {
        tryOpenApp(null, isIOS ? 'ios' : 'android');
      }, 300);
    }
    
    // Handle visibility change (user returned from app)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // User likely opened the app
        appOpenAttempted = true;
      }
    });
    
    // Handle page focus (user might have app installed)
    window.addEventListener('focus', () => {
      if (!appOpenAttempted && isMobile) {
        setTimeout(() => {
          if (!document.hidden) {
            // App didn't open, show download buttons
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) overlay.style.display = 'none';
          }
        }, 1000);
      }
    });
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
  return res.status(200).send(html);
}

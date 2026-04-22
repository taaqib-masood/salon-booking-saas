(function() {
  // Config
  var scriptTag = document.currentScript;
  var tenantSlug = scriptTag.getAttribute('data-tenant') || 'la-maison';
  var hostUrl = scriptTag.getAttribute('data-host') || 'http://localhost:5173';

  // Inject CSS for the widget button and modal
  var style = document.createElement('style');
  style.innerHTML = `
    .lm-widget-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #D4AF37;
      color: #1A1A1A;
      font-family: "Playfair Display", serif;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 2px;
      padding: 16px 32px;
      border-radius: 50px;
      border: none;
      box-shadow: 0 10px 30px rgba(212, 175, 55, 0.4);
      cursor: pointer;
      z-index: 999999;
      transition: all 0.3s ease;
    }
    .lm-widget-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 15px 40px rgba(212, 175, 55, 0.6);
      background: #1A1A1A;
      color: #FAF9F6;
    }
    .lm-widget-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(26, 26, 26, 0.8);
      backdrop-filter: blur(8px);
      z-index: 1000000;
      display: none;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.4s ease;
    }
    .lm-widget-overlay.lm-active {
      display: flex;
      opacity: 1;
    }
    .lm-widget-modal {
      width: 100%;
      max-width: 800px;
      height: 90vh;
      background: #FAF9F6;
      border-radius: 24px;
      overflow: hidden;
      position: relative;
      transform: translateY(40px) scale(0.95);
      transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 25px 80px rgba(0,0,0,0.5);
    }
    .lm-widget-overlay.lm-active .lm-widget-modal {
      transform: translateY(0) scale(1);
    }
    .lm-widget-close {
      position: absolute;
      top: 16px;
      right: 16px;
      background: #1A1A1A;
      color: #D4AF37;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      font-size: 20px;
      cursor: pointer;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .lm-widget-close:hover {
      background: #D4AF37;
      color: #1A1A1A;
    }
    .lm-widget-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  `;
  document.head.appendChild(style);

  // Inject Button
  var btn = document.createElement('button');
  btn.className = 'lm-widget-btn';
  btn.innerText = 'Reserve Now ✦';
  document.body.appendChild(btn);

  // Inject Overlay
  var overlay = document.createElement('div');
  overlay.className = 'lm-widget-overlay';
  
  var modal = document.createElement('div');
  modal.className = 'lm-widget-modal';

  var closeBtn = document.createElement('button');
  closeBtn.className = 'lm-widget-close';
  closeBtn.innerHTML = '&times;';

  var iframe = document.createElement('iframe');
  iframe.className = 'lm-widget-iframe';
  // Strip out the header/footer by using a query parameter we can look for
  iframe.src = hostUrl + '/?embed=true&tenant=' + tenantSlug;

  modal.appendChild(closeBtn);
  modal.appendChild(iframe);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Interactions
  btn.onclick = function() {
    overlay.classList.add('lm-active');
    document.body.style.overflow = 'hidden';
  };

  closeBtn.onclick = function() {
    overlay.classList.remove('lm-active');
    setTimeout(() => {
      overlay.style.display = 'none';
      document.body.style.overflow = 'auto';
      // Reset iframe to clear state if desired
      // iframe.src = iframe.src; 
    }, 400); // Wait for transition
  };
})();

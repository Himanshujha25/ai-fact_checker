// Truecast Eye - Content Script
let btn = null;

document.addEventListener('mouseup', function(e) {
  const selection = window.getSelection().toString().trim();
  
  // Cleanup old button
  if (btn) {
    btn.remove();
    btn = null;
  }

  if (selection.length > 5 && selection.length < 500) { // Practical limit for quick audit
    createAuditButton(e.pageX, e.pageY, selection);
  }
});

function createAuditButton(x, y, text) {
  btn = document.createElement('div');
  btn.id = 'truecast-audit-btn';
  
  // High-fidelity styling - perfectly centered on selection
  btn.style.cssText = `
    position: absolute;
    top: ${y + 15}px;
    left: ${x}px;
    transform: translateX(-50%);
    z-index: 2147483647;
    background: #08080E;
    color: #C9A84C;
    border: 1px solid rgba(201,168,76,0.3);
    border-radius: 20px;
    padding: 8px 18px;
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 12px 30px rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    gap: 8px;
    user-select: none;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    backdrop-filter: blur(12px);
    opacity: 0;
  `;
  
  btn.innerHTML = `
    <span style="font-size: 15px;">⚖️</span>
    Audit with Truecast
  `;

  // Trigger fade-in
  requestAnimationFrame(() => {
    btn.style.opacity = '1';
    btn.style.top = `${y + 10}px`;
  });

  btn.onmouseover = () => {
    btn.style.borderColor = '#C9A84C';
    btn.style.background = 'rgba(201,168,76,0.12)';
    btn.style.transform = 'translateX(-50%) translateY(-2px)';
  };
  btn.onmouseout = () => {
    btn.style.borderColor = 'rgba(201,168,76,0.3)';
    btn.style.background = '#08080E';
    btn.style.transform = 'translateX(-50%) translateY(0)';
  };

  btn.onclick = (e) => {
    e.stopPropagation();
    chrome.runtime.sendMessage({ action: "openVerification", text: text });
    btn.remove();
  };

  document.body.appendChild(btn);
}

// Global click listeners for cleanup
document.body.addEventListener('mousedown', function(e) {
  if (btn && !btn.contains(e.target)) {
    btn.remove();
    btn = null;
  }
});

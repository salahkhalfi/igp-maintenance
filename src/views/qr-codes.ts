/**
 * QR Codes Generation Page
 * 
 * Copyright (c) 2025 Salah-Eddine KHALFI (salah [at] khalfi [dot] com)
 * All rights reserved.
 * 
 * Generates printable QR codes for all machines.
 * Each QR code links to /m/{machine_id} for quick access.
 */

export interface Machine {
  id: number;
  machine_type: string;
  model: string | null;
  location: string | null;
  serial_number: string | null;
}

export function generateQRCodesHTML(machines: Machine[], baseUrl: string): string {
  const totalMachines = machines.length;
  
  const machineCards = machines.map((machine, index) => {
    const label = machine.machine_type + (machine.model ? ` ${machine.model}` : '');
    const location = machine.location || 'Emplacement non défini';
    const qrUrl = `${baseUrl}/m/${machine.id}`;
    
    // Afficher le numéro de série si disponible, sinon le numéro séquentiel
    const displayId = machine.serial_number 
      ? `SN: ${machine.serial_number}` 
      : `#${index + 1}`;
    
    return `
      <div class="qr-card">
        <div class="qr-code" id="qr-${machine.id}"></div>
        <div class="qr-label">${escapeHtml(label)}</div>
        <div class="qr-location">${escapeHtml(location)}</div>
        <div class="qr-id">${escapeHtml(displayId)}</div>
      </div>
    `;
  }).join('');

  const machineIds = machines.map(m => m.id);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Codes - Machines</title>
  <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f3f4f6;
      min-height: 100vh;
      padding: 1rem;
    }
    
    .header {
      background: white;
      padding: 1.5rem;
      border-radius: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .header h1 {
      font-size: 1.5rem;
      color: #1f2937;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .header-actions {
      display: flex;
      gap: 0.75rem;
    }
    
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border-radius: 0.5rem;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      border: none;
      font-size: 0.9rem;
      transition: all 0.2s;
    }
    
    .btn-primary {
      background: #3b82f6;
      color: white;
    }
    
    .btn-primary:hover {
      background: #2563eb;
    }
    
    .btn-secondary {
      background: #6b7280;
      color: white;
    }
    
    .btn-secondary:hover {
      background: #4b5563;
    }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }
    
    .qr-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1rem;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      break-inside: avoid;
      page-break-inside: avoid;
    }
    
    .qr-code {
      width: 150px;
      height: 150px;
      margin: 0 auto 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .qr-code canvas {
      max-width: 100%;
      height: auto;
    }
    
    .qr-label {
      font-weight: 600;
      color: #1f2937;
      font-size: 0.95rem;
      margin-bottom: 0.25rem;
      word-break: break-word;
    }
    
    .qr-location {
      color: #6b7280;
      font-size: 0.8rem;
      margin-bottom: 0.25rem;
    }
    
    .qr-id {
      color: #9ca3af;
      font-size: 0.75rem;
      font-family: monospace;
    }
    
    .empty-state {
      background: white;
      padding: 3rem;
      border-radius: 1rem;
      text-align: center;
      color: #6b7280;
    }
    
    .empty-state .icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    
    /* Print styles */
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .header {
        box-shadow: none;
        border-bottom: 2px solid #e5e7eb;
        border-radius: 0;
        margin-bottom: 1rem;
      }
      
      .header-actions {
        display: none;
      }
      
      .grid {
        grid-template-columns: repeat(4, 1fr);
        gap: 0.5rem;
      }
      
      .qr-card {
        box-shadow: none;
        border: 1px solid #e5e7eb;
        padding: 0.5rem;
      }
      
      .qr-code {
        width: 120px;
        height: 120px;
      }
    }
    
    @page {
      margin: 1cm;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📱 QR Codes - Machines</h1>
    <div class="header-actions">
      <button class="btn btn-primary" onclick="window.print()">
        🖨️ Imprimer
      </button>
      <a href="/" class="btn btn-secondary">
        ← Retour
      </a>
    </div>
  </div>
  
  ${machines.length > 0 ? `
    <div class="grid">
      ${machineCards}
    </div>
  ` : `
    <div class="empty-state">
      <div class="icon">🔧</div>
      <h2>Aucune machine</h2>
      <p>Ajoutez des machines dans l'application pour générer leurs QR codes.</p>
    </div>
  `}
  
  <script>
    // Generate QR codes for each machine with company logo overlay
    const baseUrl = '${baseUrl}';
    const machineIds = ${JSON.stringify(machineIds)};
    
    // Load company logo first
    const logo = new Image();
    logo.crossOrigin = 'anonymous';
    let logoLoaded = false;
    
    logo.onload = function() {
      logoLoaded = true;
      generateAllQRCodes();
    };
    
    logo.onerror = function() {
      // Logo failed to load, generate QR codes without logo
      console.log('Logo not available, generating QR codes without logo');
      generateAllQRCodes();
    };
    
    // Try to load company logo
    logo.src = '/api/settings/logo';
    
    // Fallback: if logo doesn't load in 2 seconds, proceed without it
    setTimeout(() => {
      if (!logoLoaded) {
        generateAllQRCodes();
      }
    }, 2000);
    
    let qrGenerated = false;
    
    function generateAllQRCodes() {
      if (qrGenerated) return; // Prevent double generation
      qrGenerated = true;
      
      machineIds.forEach(id => {
        const container = document.getElementById('qr-' + id);
        if (container) {
          // Use error correction level H (30%) to allow logo overlay
          QRCode.toCanvas(baseUrl + '/m/' + id, {
            width: 150,
            margin: 1,
            errorCorrectionLevel: 'H',
            color: {
              dark: '#1f2937',
              light: '#ffffff'
            }
          }, function(error, canvas) {
            if (!error) {
              // If logo loaded, overlay it on the QR code
              if (logoLoaded && logo.complete && logo.naturalWidth > 0) {
                const ctx = canvas.getContext('2d');
                const logoSize = canvas.width * 0.25; // Logo = 25% of QR code size
                const logoX = (canvas.width - logoSize) / 2;
                const logoY = (canvas.height - logoSize) / 2;
                
                // Draw white background circle for logo
                ctx.beginPath();
                ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2 + 4, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                
                // Draw logo
                ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
              }
              container.appendChild(canvas);
            }
          });
        }
      });
    }
  </script>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

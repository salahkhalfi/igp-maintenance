import React from 'react';
import { Message, Participant } from '../types';
import { getInitials, getAvatarGradient, formatTime } from '../utils';
import AudioPlayer from './AudioPlayer';
import ActionCardComponent from './ActionCardComponent';

// --- HELPER: Process content using Markdown (with robust fallback) ---
// Defined outside component to prevent recreation on every render
const processMarkdown = (content: string) => {
        let text = content;

        // 1. SECURITY FIRST: Escape HTML characters from the raw text to prevent XSS
        // We do this BEFORE generating our own HTML tags so we don't escape our own tables/images.
        text = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // 2. Table Parser (Simple & Robust)
        const tableRegex = /(?:^|\n)(\|.*\|(?:\n|$))(\|[-:| ]+\|(?:\n|$))((?:\|.*\|(?:\n|$))+)/g;
        const processTable = (match: string, header: string, separator: string, body: string) => {
            const parseRow = (row: string) => row.trim().split('|').filter(c => c !== '').map(c => c.trim());
            const headers = parseRow(header);
            const rows = body.trim().split('\n').map(parseRow);
            let html = '<div class="overflow-x-auto my-3 rounded-lg border border-gray-200 shadow-sm"><table class="min-w-full divide-y divide-gray-200 text-sm">';
            html += '<thead class="bg-gray-50"><tr>';
            headers.forEach(h => {
                 const safeHeader = h.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                 html += `<th class="px-3 py-3 text-left font-bold text-gray-900 tracking-wider whitespace-nowrap">${safeHeader}</th>`;
            });
            html += '</tr></thead><tbody class="bg-white divide-y divide-gray-200">';
            rows.forEach(row => {
                html += '<tr class="hover:bg-gray-50 transition-colors">';
                row.forEach(cell => {
                    let cellContent = cell
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
                            let validUrl = url.trim();
                            // Check if URL is internal (same origin or relative path)
                            const isInternal = validUrl.startsWith('/') || validUrl.includes(window.location.hostname);
                            const target = isInternal ? '_self' : '_blank';
                            return `<a href="${validUrl}" target="${target}" class="text-blue-600 underline">${text}</a>`;
                        });
                    html += `<td class="px-3 py-3 whitespace-normal text-gray-700 min-w-[120px] leading-relaxed">${cellContent}</td>`;
                });
                html += '</tr>';
            });
            html += '</tbody></table></div>';
            return html;
        };
        // Apply Table Parser
        text = text.replace(tableRegex, (match, h, s, b) => processTable(match, h, s, b));

        text = text
            // Bold (**text**)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic (*text*)
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Headers (H2-H4)
        .replace(/^#### (.*)$/gm, '<h4 class="font-bold text-base mt-2 mb-1 text-gray-800">$1</h4>')
        .replace(/^### (.*)$/gm, '<h3 class="font-bold text-lg mt-3 mb-1 text-gray-900">$1</h3>')
        .replace(/^## (.*)$/gm, '<h2 class="font-bold text-xl mt-4 mb-2 text-gray-900 border-b border-gray-200 pb-1">$1</h2>')
        // Lists (- or * Item)
        .replace(/^\s*[-*]\s+(.*)$/gm, '<li class="ml-4 list-disc mb-0.5">$1</li>')
        // Images ![Alt](URL) - Robust regex to handle spaces and special chars in URL if encoded
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
            let validUrl = url.trim();
            // Fix AI hallucination of absolute 'api' domain (handles any domain prefix for internal api routes)
            validUrl = validUrl.replace(/^https?:\/\/(?:www\.)?[\w.-]+\/api\//, '/api/');
            return `<img src="${validUrl}" alt="${alt}" class="rounded-lg max-w-full h-auto my-2 shadow-md border border-gray-200 print:shadow-none print:border-0" data-signature="${alt.toLowerCase().includes('signature') ? 'true' : 'false'}" />`;
        })
        // Links [Text](URL)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
            // FIX: If text is corrupted as '1$', replace with meaningful text
            if (text === '1$') text = 'Voir Ticket';
            
            let validUrl = url.trim();
            // Fix AI hallucination of absolute 'api' domain (handles any domain prefix for internal api routes)
            validUrl = validUrl.replace(/^https?:\/\/(?:www\.)?[\w.-]+\/api\//, '/api/');
            
            // Check if URL is internal (same origin or relative path)
            const isInternal = validUrl.startsWith('/') || validUrl.includes(window.location.hostname);
            const target = isInternal ? '_self' : '_blank';
            
            return `<a href="${validUrl}" target="${target}" class="text-blue-600 hover:underline font-medium">${text}</a>`;
        })
        // Blockquotes (> text)
        .replace(/^>\s+(.*)$/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-2">$1</blockquote>')
        // Fix: Remove newlines immediately after headers and list items to prevent double spacing (gap reduction)
        .replace(/(<\/h[2-4]>|<\/li>)\n/g, '$1')
        // Newlines to BR
        .replace(/\n/g, '<br/>');
    return text;
};

// --- DETECT IF CONTENT IS A FORMAL LETTER ---
const isLetterContent = (content: string): boolean => {
    // Detect formal letter patterns: company header, "Montréal, le", "Objet :", formal salutations
    const letterPatterns = [
        /Montréal,\s*le\s*\d/i,
        /^(Monsieur|Madame|Cher|Chère)\s/m,
        /Objet\s*:/i,
        /Veuillez\s+(agréer|recevoir)/i,
        /salutations\s+(distinguées|cordiales)/i,
        /La\s+Direction\s*$/m
    ];
    return letterPatterns.filter(p => p.test(content)).length >= 2;
};

// --- FETCH COMPANY CONFIG ---
const fetchCompanyConfig = async (): Promise<{ companyName: string; companyAddress: string; companyPhone: string; companyEmail: string; logoUrl: string }> => {
    let companyName = 'Entreprise';
    let companyAddress = '';
    let companyPhone = '';
    let companyEmail = '';
    let logoUrl = '/api/settings/logo';
    try {
        const resp = await fetch('/api/settings/config/public');
        if (resp.ok) {
            const cfg = await resp.json();
            // Priorité: company_name (nouveau) > company_subtitle (legacy) > company_short_name
            companyName = cfg.company_name || cfg.company_subtitle || cfg.company_short_name || 'Entreprise';
            companyAddress = cfg.company_address || '';
            companyPhone = cfg.company_phone || '';
            companyEmail = cfg.company_email || '';
            if (cfg.company_logo_url) logoUrl = cfg.company_logo_url;
        }
    } catch (e) { /* Use defaults */ }
    return { companyName, companyAddress, companyPhone, companyEmail, logoUrl };
};

// --- FETCH LOGO AS ARRAY BUFFER FOR DOCX ---
const fetchLogoAsArrayBuffer = async (logoUrl: string): Promise<{ data: ArrayBuffer; width: number; height: number } | null> => {
    try {
        const resp = await fetch(logoUrl);
        if (!resp.ok) return null;
        const blob = await resp.blob();
        const arrayBuffer = await blob.arrayBuffer();
        
        // Get image dimensions using Image element
        const img = new Image();
        const blobUrl = URL.createObjectURL(blob);
        
        return new Promise((resolve) => {
            img.onload = () => {
                URL.revokeObjectURL(blobUrl);
                resolve({ data: arrayBuffer, width: img.naturalWidth, height: img.naturalHeight });
            };
            img.onerror = () => {
                URL.revokeObjectURL(blobUrl);
                resolve(null);
            };
            img.src = blobUrl;
        });
    } catch (e) {
        console.warn('Failed to fetch logo for DOCX:', e);
        return null;
    }
};

// --- CLEAN LETTER CONTENT: Replace first company block with logo ---
/**
 * Extract official document content between --- separators
 * AI responses now use format: "AI comment\n---\nDOCUMENT\n---\nAI instructions"
 * This function extracts ONLY the document part for printing
 */
const extractOfficialDocument = (content: string): string => {
    // Pattern: content between two --- separators
    const separatorPattern = /^---\s*\n([\s\S]*?)\n---\s*$/m;
    
    // Try to find content between --- markers
    const lines = content.split('\n');
    const separatorIndices: number[] = [];
    
    lines.forEach((line, index) => {
        if (line.trim() === '---') {
            separatorIndices.push(index);
        }
    });
    
    // If we have at least 2 separators, extract content between first two
    if (separatorIndices.length >= 2) {
        const startIdx = separatorIndices[0] + 1;
        const endIdx = separatorIndices[1];
        const documentLines = lines.slice(startIdx, endIdx);
        return documentLines.join('\n').trim();
    }
    
    // If only one separator at the start, take everything after it
    if (separatorIndices.length === 1 && separatorIndices[0] < 3) {
        const documentLines = lines.slice(separatorIndices[0] + 1);
        return documentLines.join('\n').trim();
    }
    
    // No separators found - return original content
    return content;
};

const cleanLetterForPrint = (content: string, companyName: string): string => {
    // First, extract official document if separators exist
    let cleaned = extractOfficialDocument(content);
    
    // Pattern to match the company header block at the start of a letter
    // Example: "**Les Produits Verriers International Inc.**\n9150 Bd Maurice-Duplessis,\nMontréal, QC H1E 7C2"
    const companyBlockPattern = /^\*\*[^*]+\*\*\s*\n[^\n]*\n[^\n]*(?:QC|Québec|Quebec)[^\n]*\n?/i;
    
    // Also match without bold: "Les Produits Verriers International Inc.\n9150..."
    const companyBlockNoBold = /^[A-Z][^\n]{5,50}(?:Inc\.|Ltée|Ltd|Corp)\.?\s*\n[^\n]*\n[^\n]*(?:QC|Québec|Quebec)[^\n]*\n?/i;
    
    // Try to remove company header block (will be replaced by logo)
    if (companyBlockPattern.test(cleaned)) {
        cleaned = cleaned.replace(companyBlockPattern, '');
    } else if (companyBlockNoBold.test(cleaned)) {
        cleaned = cleaned.replace(companyBlockNoBold, '');
    }
    
    // Clean up extra line breaks at start
    cleaned = cleaned.replace(/^\s*(<br\s*\/?>|\n)+/gi, '');
    
    return cleaned;
};

// --- PRINT FUNCTION FOR AI RESPONSES ---
const printAIResponse = async (content: string) => {
    const { companyName, companyAddress, companyPhone, companyEmail, logoUrl } = await fetchCompanyConfig();
    
    // First, extract official document (between --- separators) to remove AI notes
    const documentContent = extractOfficialDocument(content);
    const isLetter = isLetterContent(documentContent);
    
    // For letters: also clean the content to remove company header (logo replaces it)
    const cleanedContent = isLetter ? cleanLetterForPrint(documentContent, companyName) : documentContent;
    const html = processMarkdown(cleanedContent);
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;
    
    const printHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Document</title>
<style>
@page { size: A4; margin: ${isLetter ? '18mm 20mm' : '15mm 18mm'}; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { 
    font-family: ${isLetter ? "'Times New Roman', Times, serif" : "'Georgia', serif"}; 
    font-size: ${isLetter ? '12pt' : '11pt'}; 
    line-height: ${isLetter ? '1.6' : '1.5'}; 
    color: #000; 
    max-width: 800px; 
    margin: 0 auto; 
    padding: 0; 
}

/* Letter header: Logo + Company name + Address */
.letter-header {
    display: ${isLetter ? 'flex' : 'none'};
    align-items: center;
    gap: 16pt;
    margin-bottom: 28pt;
    padding-bottom: 14pt;
    border-bottom: 2pt solid #1a1a1a;
}
.letter-header img { 
    height: 55px; 
    width: auto;
    object-fit: contain;
    flex-shrink: 0;
}
.letter-header .company-block {
    border-left: 1.5pt solid #1a1a1a;
    padding-left: 12pt;
}
.letter-header .company-name {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 14pt;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0 0 2pt 0;
}
.letter-header .company-address {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9pt;
    color: #555;
    line-height: 1.4;
    margin: 0;
}
.letter-header .company-contact {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 8pt;
    color: #666;
    margin-top: 2pt;
}

/* Non-letter header */
.print-header { 
    display: ${isLetter ? 'none' : 'flex'}; 
    align-items: center; 
    gap: 12px; 
    padding-bottom: 12pt; 
    margin-bottom: 20pt; 
    border-bottom: 1pt solid #000; 
}
.print-header img { height: 40px; }
.print-header .brand { border-left: 1pt solid #000; padding-left: 10px; }
.print-header .brand-name { font-family: Arial, sans-serif; font-size: 14pt; font-weight: 700; }

/* Document content */
.doc-content h2 { font-family: Arial, sans-serif; font-size: 14pt; font-weight: 700; margin: 18pt 0 10pt; padding-bottom: 4pt; border-bottom: 1pt solid #000; }
.doc-content h3 { font-family: Arial, sans-serif; font-size: 12pt; font-weight: 700; margin: 14pt 0 8pt; }
.doc-content h4 { font-family: Arial, sans-serif; font-size: 11pt; font-weight: 700; margin: 10pt 0 6pt; }
.doc-content p { margin: 0 0 10pt; text-align: ${isLetter ? 'left' : 'justify'}; }
.doc-content ul, .doc-content ol { margin: 6pt 0 10pt; padding-left: 20pt; }
.doc-content li { margin: 3pt 0; }
.doc-content table { width: 100%; border-collapse: collapse; margin: 12pt 0; font-size: 10pt; }
.doc-content th { background: #f0f0f0; border: 1px solid #000; padding: 8pt; text-align: left; font-weight: 700; }
.doc-content td { border: 1px solid #000; padding: 6pt 8pt; }
.doc-content blockquote { border-left: 3pt solid #ccc; padding-left: 12pt; margin: 10pt 0; font-style: italic; }
.doc-content strong { font-weight: 700; }
.doc-content a { color: #000; text-decoration: underline; }
.doc-content img { max-width: 100%; height: auto; margin: 12pt 0; }
.doc-content img[data-signature="true"] { 
    border: none !important; 
    box-shadow: none !important; 
    margin: 8pt 0 !important;
    max-height: 80px;
}

@media print {
    .doc-content img[data-signature="true"] { 
        border: none !important; 
        box-shadow: none !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }
    .letter-header, .print-header { page-break-inside: avoid; }
    .doc-content h2, .doc-content h3, .doc-content h4 { page-break-after: avoid; }
    .doc-content table { page-break-inside: auto; }
    .doc-content tr { page-break-inside: avoid; }
}
</style>
</head>
<body>
<!-- Letter header: Logo + Company name + Address + Contact -->
<div class="letter-header">
    <img src="${logoUrl}" onerror="this.style.display='none'" alt="Logo">
    <div class="company-block">
        <div class="company-name">${companyName}</div>
        ${companyAddress ? `<div class="company-address">${companyAddress}</div>` : ''}
        ${(companyPhone || companyEmail) ? `<div class="company-contact">${[companyPhone, companyEmail].filter(Boolean).join(' | ')}</div>` : ''}
    </div>
</div>

<!-- Non-letter header with logo + company name -->
<div class="print-header">
    <img src="${logoUrl}" onerror="this.style.display='none'" alt="Logo">
    <div class="brand">
        <div class="brand-name">${companyName}</div>
    </div>
</div>

<div class="doc-content">${html}</div>
</body>
</html>`;
    
    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.onload = () => setTimeout(() => { printWindow.focus(); printWindow.print(); }, 250);
};

// --- EXPORT DOCX FOR AI RESPONSES ---
const exportDocx = async (content: string) => {
    const { companyName, companyAddress, companyPhone, companyEmail, logoUrl } = await fetchCompanyConfig();
    
    // First, extract official document (between --- separators) to remove AI notes
    const documentContent = extractOfficialDocument(content);
    const isLetter = isLetterContent(documentContent);
    
    // For letters: also clean the content to remove company header
    const cleanedContent = isLetter ? cleanLetterForPrint(documentContent, companyName) : documentContent;
    
    // Fetch logo for DOCX embedding
    const logoData = await fetchLogoAsArrayBuffer(logoUrl);
    
    try {
        // Load docx library from CDN on demand
        if (!(window as any).docx) {
            await new Promise<void>((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.min.js';
                script.onload = () => resolve();
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
        
        const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, BorderStyle, ImageRun } = (window as any).docx;
        
        const children: any[] = [];
        
        // Calculate logo dimensions (max height ~50px in DOCX EMUs: 50 * 914400 / 96 ≈ 476250)
        const logoHeight = 55; // pixels
        let logoWidthEMU = 0;
        let logoHeightEMU = 0;
        if (logoData) {
            const aspectRatio = logoData.width / logoData.height;
            logoHeightEMU = Math.round(logoHeight * 914400 / 96); // Convert px to EMU
            logoWidthEMU = Math.round(logoHeightEMU * aspectRatio);
        }
        
        // Header for letters: Logo + Company name (bold) + address + contact
        if (isLetter) {
            // If we have a logo, create a table with logo and company info side by side
            if (logoData) {
                const headerTable = new Table({
                    rows: [
                        new TableRow({
                            children: [
                                // Logo cell
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [
                                                new ImageRun({
                                                    data: logoData.data,
                                                    transformation: { width: Math.round(logoWidthEMU / 914400 * 96), height: logoHeight },
                                                    type: 'png'
                                                })
                                            ]
                                        })
                                    ],
                                    width: { size: 1500, type: WidthType.DXA },
                                    borders: { top: { style: BorderStyle.NIL }, bottom: { style: BorderStyle.NIL }, left: { style: BorderStyle.NIL }, right: { style: BorderStyle.SINGLE, size: 8, color: '1a1a1a' } },
                                    verticalAlign: 'center'
                                }),
                                // Company info cell
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [new TextRun({ text: companyName, bold: true, size: 28, font: 'Arial' })],
                                            spacing: { after: 40 }
                                        }),
                                        ...(companyAddress ? [new Paragraph({
                                            children: [new TextRun({ text: companyAddress, size: 18, color: '555555', font: 'Arial' })],
                                            spacing: { after: 20 }
                                        })] : []),
                                        ...([companyPhone, companyEmail].filter(Boolean).length > 0 ? [new Paragraph({
                                            children: [new TextRun({ text: [companyPhone, companyEmail].filter(Boolean).join(' | '), size: 16, color: '666666', font: 'Arial' })]
                                        })] : [])
                                    ],
                                    width: { size: 7500, type: WidthType.DXA },
                                    borders: { top: { style: BorderStyle.NIL }, bottom: { style: BorderStyle.NIL }, left: { style: BorderStyle.NIL }, right: { style: BorderStyle.NIL } },
                                    margins: { left: 200 }
                                })
                            ]
                        })
                    ],
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: { top: { style: BorderStyle.NIL }, bottom: { style: BorderStyle.NIL }, left: { style: BorderStyle.NIL }, right: { style: BorderStyle.NIL }, insideHorizontal: { style: BorderStyle.NIL }, insideVertical: { style: BorderStyle.NIL } }
                });
                children.push(headerTable);
            } else {
                // No logo: just company name
                children.push(new Paragraph({
                    children: [new TextRun({ text: companyName, bold: true, size: 28, font: 'Arial' })],
                    spacing: { after: 50 }
                }));
                if (companyAddress) {
                    children.push(new Paragraph({
                        children: [new TextRun({ text: companyAddress, size: 18, color: '666666', font: 'Arial' })],
                        spacing: { after: 50 }
                    }));
                }
                const contactInfo = [companyPhone, companyEmail].filter(Boolean).join(' | ');
                if (contactInfo) {
                    children.push(new Paragraph({
                        children: [new TextRun({ text: contactInfo, size: 16, color: '888888', font: 'Arial' })],
                        spacing: { after: 100 }
                    }));
                }
            }
            // Separator line
            children.push(new Paragraph({
                border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: '1a1a1a' } },
                spacing: { before: 200, after: 400 }
            }));
        }
        
        // Header for non-letters: Logo + company name
        if (!isLetter) {
            if (logoData) {
                const headerTable = new Table({
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [
                                                new ImageRun({
                                                    data: logoData.data,
                                                    transformation: { width: Math.round(logoWidthEMU / 914400 * 96 * 0.8), height: Math.round(logoHeight * 0.8) },
                                                    type: 'png'
                                                })
                                            ]
                                        })
                                    ],
                                    width: { size: 1200, type: WidthType.DXA },
                                    borders: { top: { style: BorderStyle.NIL }, bottom: { style: BorderStyle.NIL }, left: { style: BorderStyle.NIL }, right: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
                                    verticalAlign: 'center'
                                }),
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [new TextRun({ text: companyName, bold: true, size: 28, font: 'Arial' })]
                                        })
                                    ],
                                    width: { size: 7800, type: WidthType.DXA },
                                    borders: { top: { style: BorderStyle.NIL }, bottom: { style: BorderStyle.NIL }, left: { style: BorderStyle.NIL }, right: { style: BorderStyle.NIL } },
                                    margins: { left: 150 },
                                    verticalAlign: 'center'
                                })
                            ]
                        })
                    ],
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: { top: { style: BorderStyle.NIL }, bottom: { style: BorderStyle.NIL }, left: { style: BorderStyle.NIL }, right: { style: BorderStyle.NIL }, insideHorizontal: { style: BorderStyle.NIL }, insideVertical: { style: BorderStyle.NIL } }
                });
                children.push(headerTable);
                children.push(new Paragraph({ spacing: { after: 300 } }));
            } else {
                children.push(new Paragraph({
                    children: [new TextRun({ text: companyName, bold: true, size: 28, font: 'Arial' })],
                    spacing: { after: 300 }
                }));
            }
        }
        
        // Parse markdown content line by line
        const lines = cleanedContent.split('\n');
        let i = 0;
        
        while (i < lines.length) {
            const line = lines[i];
            
            // Table detection
            if (line.trim().startsWith('|') && lines[i + 1]?.includes('---')) {
                const tableLines: string[] = [];
                while (i < lines.length && lines[i].trim().startsWith('|')) {
                    tableLines.push(lines[i]);
                    i++;
                }
                const rows = tableLines.filter(l => !l.includes('---'));
                if (rows.length > 0) {
                    const numCols = rows[0].split('|').slice(1, -1).length;
                    const colWidth = Math.floor(9000 / numCols);
                    const tableRows = rows.map((row, rowIdx) => {
                        const cells = row.split('|').slice(1, -1).map(c => c.trim());
                        while (cells.length < numCols) cells.push('');
                        return new TableRow({
                            children: cells.map(cellText => new TableCell({
                                children: [new Paragraph({
                                    children: [new TextRun({ text: cellText || ' ', bold: rowIdx === 0, size: 22 })]
                                })],
                                width: { size: colWidth, type: WidthType.DXA },
                                shading: rowIdx === 0 ? { fill: 'E0E0E0' } : undefined
                            }))
                        });
                    });
                    children.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
                    children.push(new Paragraph({ text: '', spacing: { after: 200 } }));
                }
                continue;
            }
            
            // Headings
            if (line.startsWith('## ')) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: line.replace(/^## /, '').replace(/\*\*/g, ''), bold: true, size: 28 })],
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 300, after: 150 }
                }));
                i++; continue;
            }
            if (line.startsWith('### ')) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: line.replace(/^### /, '').replace(/\*\*/g, ''), bold: true, size: 24 })],
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 200, after: 100 }
                }));
                i++; continue;
            }
            
            // Lists
            if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                const text = line.trim().replace(/^[-*]\s+/, '');
                const parts = text.split(/(\*\*[^*]+\*\*)/g);
                const runs = parts.filter(p => p).map(part => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return new TextRun({ text: part.slice(2, -2), bold: true, size: 22 });
                    }
                    return new TextRun({ text: part, size: 22 });
                });
                children.push(new Paragraph({ children: runs, bullet: { level: 0 }, spacing: { after: 80 } }));
                i++; continue;
            }
            
            // Normal paragraph
            if (line.trim()) {
                const text = line.trim();
                const parts = text.split(/(\*\*[^*]+\*\*)/g);
                const runs = parts.filter(p => p).map(part => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return new TextRun({ text: part.slice(2, -2), bold: true, size: 22 });
                    }
                    return new TextRun({ text: part, size: 22 });
                });
                children.push(new Paragraph({ children: runs, spacing: { after: 150 } }));
            }
            i++;
        }
        
        const doc = new Document({ sections: [{ children }] });
        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Document_${new Date().toISOString().slice(0, 10)}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('Erreur export DOCX:', error);
        alert('Erreur lors de l\'export Word. Veuillez réessayer.');
    }
};

// --- MEMOIZED SUB-COMPONENT: AI Message Content ---
// This prevents regex reprocessing on every keystroke when parent re-renders
const AIMessageContent = React.memo(({ content, showActions = true }: { content: string; showActions?: boolean }) => {
    const html = processMarkdown(content);
    return (
        <div className="relative">
            <div 
                className="text-[15px] leading-snug break-words pr-16 pb-1 font-medium tracking-wide prose-sm"
                dangerouslySetInnerHTML={{ __html: html }}
            />
            {showActions && (
                <div className="absolute top-0 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                        onClick={(e) => { e.stopPropagation(); printAIResponse(content); }}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                        title="Imprimer"
                    >
                        <i className="fas fa-print text-xs"></i>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); exportDocx(content); }}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        title="Exporter Word (.docx)"
                    >
                        <i className="fas fa-file-word text-xs"></i>
                    </button>
                </div>
            )}
        </div>
    );
});

interface MessageListProps {
    messages: Message[];
    participants: Participant[];
    currentUserId: number | null;
    currentUserRole: string;
    conversationType: string;
    loadingMessages: boolean;
    searchMode: boolean;
    searchKeyword: string;
    onPrivateChat: (userId: number) => void;
    onUpdateCardStatus: (msgId: string, status: 'open' | 'in_progress' | 'resolved') => void;
    onCreateActionCard: (msgId: string) => void;
    canCreateTickets?: boolean; // RBAC permission check
    onDeleteMessage: (msgId: string) => void;
    onSaveTranscription: (msgId: string, text: string) => void;
    onDownload: (key: string, type: 'image' | 'audio') => void;
    setViewImage: (data: any) => void;
    setTriggerAddMember: (val: boolean) => void;
    setShowInfo: (val: boolean) => void;
    editingTranscriptionId: string | null;
    setEditingTranscriptionId: (id: string | null) => void;
    editingTranscriptionText: string;
    setEditingTranscriptionText: (val: string) => void;
    messagesContainerRef: React.RefObject<HTMLDivElement>;
    messagesEndRef: React.RefObject<HTMLDivElement>;
}

const MessageList: React.FC<MessageListProps> = ({
    messages,
    participants,
    currentUserId,
    currentUserRole,
    conversationType,
    loadingMessages,
    searchMode,
    searchKeyword,
    onPrivateChat,
    onUpdateCardStatus,
    onCreateActionCard,
    onDeleteMessage,
    canCreateTickets = false,
    onSaveTranscription,
    onDownload,
    setViewImage,
    setTriggerAddMember,
    setShowInfo,
    editingTranscriptionId,
    setEditingTranscriptionId,
    editingTranscriptionText,
    setEditingTranscriptionText,
    messagesContainerRef,
    messagesEndRef
}) => {

    const renderContent = () => {
        if (loadingMessages) {
             return (
                <div className="flex justify-center items-center h-full animate-fade-in">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
                    </div>
                </div>
             );
        }

        if (messages.length === 0 && conversationType === 'group') {
            const hasMembers = participants.length > 1; 
            
            return (
                <div className="flex flex-col items-center justify-center h-full animate-fade-in p-8 text-center">
                    <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-gray-800 to-black flex items-center justify-center mb-8 border border-white/5 shadow-2xl">
                        <i className="fas fa-users text-gray-600 text-4xl"></i>
                    </div>
                    <h3 className="text-white font-bold text-2xl mb-3 font-display">
                        {hasMembers ? "La discussion est ouverte" : "Le groupe est prêt"}
                    </h3>
                    <p className="text-gray-400 mb-10 max-w-sm mx-auto text-lg font-light">
                        {hasMembers 
                            ? "Il n'y a pas encore de messages. Lancez la conversation avec vos collègues." 
                            : "Il n'y a pas encore de messages. Ajoutez des collègues pour commencer la discussion."}
                    </p>
                    
                    {hasMembers ? (
                         <div className="bg-white/5 rounded-2xl p-6 border border-white/5 mb-6 max-w-xs w-full backdrop-blur-md">
                            <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-4 text-left">Membres présents</div>
                            <div className="flex flex-wrap gap-3">
                                {participants.map(p => (
                                    <div key={p.user_id} className="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center text-xs text-white border border-gray-600 shadow-lg font-bold" title={p.full_name}>
                                        {getInitials(p.full_name)}
                                    </div>
                                )).slice(0, 5)}
                                {participants.length > 5 && <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-xs text-gray-400 border border-gray-700 font-bold">+{participants.length - 5}</div>}
                            </div>
                         </div>
                    ) : (
                        <button 
                            onClick={() => { setShowInfo(true); setTriggerAddMember(true); }}
                            className="glass-button-primary text-white font-bold py-4 px-8 rounded-2xl flex items-center gap-3 shadow-xl hover:scale-105 transition-transform text-base"
                        >
                            <i className="fas fa-user-plus"></i> Ajouter des membres
                        </button>
                    )}
                </div>
            );
        }

        const result: React.ReactNode[] = [];
        let lastDate = '';

        // SEARCH FILTERING
        const messagesToDisplay = searchMode && searchKeyword.trim() 
            ? messages.filter(m => m.content.toLowerCase().includes(searchKeyword.toLowerCase()))
            : messages;

        if (searchMode && messagesToDisplay.length === 0 && searchKeyword.trim()) {
             return (
                <div className="flex flex-col items-center justify-center h-full animate-fade-in opacity-50 text-gray-400">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <i className="fas fa-search text-2xl"></i>
                    </div>
                    <p className="font-bold">Aucun message trouvé</p>
                    <p className="text-xs mt-1">"{searchKeyword}"</p>
                </div>
             );
        }

        for (let i = 0; i < messagesToDisplay.length; i++) {
            const msg = messagesToDisplay[i];
            const dateObj = new Date(msg.created_at.endsWith('Z') ? msg.created_at : msg.created_at + 'Z');
            
            // Timezone Adjustment Logic
            const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
            const shiftedDateObj = new Date(dateObj.getTime() + (offset * 3600000));
            const dateStr = shiftedDateObj.toLocaleDateString('fr-CA', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'UTC' });

            if (dateStr !== lastDate) {
                let displayDate = dateStr;
                
                const now = new Date();
                const shiftedNow = new Date(now.getTime() + (offset * 3600000));
                const yesterday = new Date(shiftedNow);
                yesterday.setDate(shiftedNow.getDate() - 1);
                
                const shiftedDateISO = shiftedDateObj.toISOString().slice(0, 10);
                const shiftedNowISO = shiftedNow.toISOString().slice(0, 10);
                const yesterdayISO = yesterday.toISOString().slice(0, 10);

                if (shiftedDateISO === shiftedNowISO) displayDate = "Aujourd'hui";
                else if (shiftedDateISO === yesterdayISO) displayDate = "Hier";

                result.push(
                    <div key={`date-${dateStr}`} className="flex justify-center my-8">
                        <span className="bg-black/40 border border-white/10 backdrop-blur-md text-gray-400 text-[11px] font-bold py-1.5 px-4 rounded-full uppercase tracking-widest shadow-lg">
                            {displayDate}
                        </span>
                    </div>
                );
                lastDate = dateStr;
            }

            const isMe = currentUserId === msg.sender_id;
            const otherParticipants = participants.filter(p => p.user_id !== currentUserId);
            const isGlobalAdmin = currentUserRole === 'admin';
            let isRead = false;
            if (otherParticipants.length > 0) {
                isRead = otherParticipants.every(p => {
                    if (!p.last_read_at) return false;
                    const readTime = new Date(p.last_read_at.endsWith('Z') ? p.last_read_at : p.last_read_at + 'Z');
                    return readTime > dateObj;
                });
            }

            // Avatar rendering logic
            const avatarUrl = msg.sender_avatar_key 
                ? `/api/auth/avatar/${msg.sender_id}?v=${msg.sender_avatar_key}` // Stable cache busting
                : null;
            
            // FIX: Detect AI messages by sender_id OR avatar_key (robust detection)
            // - sender_id === 0 means AI (set in ChatWindow.tsx when creating AI messages)
            // - sender_avatar_key === 'ai_avatar' is the explicit marker
            const isAI = msg.sender_id === 0 || msg.sender_avatar_key === 'ai_avatar';
            const bubbleClass = isMe 
                ? 'message-bubble-me text-white rounded-tr-sm' 
                : isAI 
                    ? 'bg-white text-gray-900 border border-gray-200 shadow-md rounded-tl-sm' // AI Light Mode
                    : 'message-bubble-them text-gray-100 rounded-tl-sm'; // Dark Mode for humans

            result.push(
                <div key={msg.id} className={`flex mb-6 ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in group items-end gap-3`}>
                    
                    {/* Avatar for OTHERS (Left) - HIDDEN FOR AI */ }
                    {!isMe && !isAI && (
                        <div className="flex-shrink-0 mb-1">
                            {avatarUrl ? (
                                <img 
                                    src={avatarUrl} 
                                    alt={msg.sender_name}
                                    className="w-8 h-8 rounded-xl object-cover shadow-md border border-white/10 cursor-pointer hover:scale-110 transition-transform"
                                    onClick={() => onPrivateChat(msg.sender_id)}
                                    title={msg.sender_name}
                                />
                            ) : (
                                <div 
                                    className={`w-8 h-8 rounded-xl ${getAvatarGradient(msg.sender_name)} flex items-center justify-center text-white text-[10px] font-bold shadow-md border border-white/10 cursor-pointer hover:scale-110 transition-transform`}
                                    onClick={() => onPrivateChat(msg.sender_id)}
                                    title={msg.sender_name}
                                >
                                    {getInitials(msg.sender_name)}
                                </div>
                            )}
                        </div>
                    )}

                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isAI ? 'max-w-full w-full pr-4' : 'max-w-[75%] md:max-w-[65%]'} min-w-0`}>
                        {!isMe && (
                            <div 
                                onClick={() => onPrivateChat(msg.sender_id)}
                                className={`text-[11px] font-bold mb-1.5 ml-1 ${getAvatarGradient(msg.sender_name).replace('bg-gradient-to-br', '').replace('from-', 'text-').replace('to-', 'text-opacity-100')} cursor-pointer hover:underline transition-colors flex items-center gap-1.5`}
                                title="Envoyer un message privé"
                            >
                                {msg.sender_name} 
                            </div>
                        )}
                        
                        <div className={`p-4 rounded-2xl shadow-lg backdrop-blur-md relative transition-all ${bubbleClass}`}>
                            {(isGlobalAdmin || isMe) && (
                                <>
                                    {/* Only show "Transform to ticket" button if user has permission */}
                                    {!msg.action_card && canCreateTickets && (
                                        <div className="absolute -top-3 -right-2 z-20 transition-all">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onCreateActionCard(msg.id); }}
                                                className="w-7 h-7 bg-white text-emerald-600 rounded-full flex items-center justify-center shadow-lg border-2 border-[#0b141a] hover:scale-110 active:scale-95 transition-transform"
                                                title="Transformer en ticket"
                                            >
                                                <i className="fas fa-bolt text-xs"></i>
                                            </button>
                                        </div>
                                    )}
                                    <div className="absolute -top-3 -left-2 z-20 transition-all opacity-0 group-hover:opacity-100">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDeleteMessage(msg.id); }}
                                            className="w-7 h-7 bg-red-500 rounded-full text-white flex items-center justify-center shadow-lg border-2 border-[#0b141a] hover:scale-110 active:scale-95 transition-transform"
                                            title="Supprimer le message"
                                        >
                                            <i className="fas fa-trash text-xs"></i>
                                        </button>
                                    </div>
                                </>
                            )}
                            {msg.type === 'image' && msg.media_key ? (
                                <div className="flex flex-col gap-2">
                                    <div className="overflow-hidden rounded-xl border border-white/10 relative group/image">
                                        <img 
                                            src={`/api/v2/chat/asset?key=${encodeURIComponent(msg.media_key)}`} 
                                            alt="Photo" 
                                            className="max-h-96 object-cover w-full cursor-pointer hover:scale-105 transition-transform duration-700"
                                            onClick={() => setViewImage({
                                                src: `/api/v2/chat/asset?key=${encodeURIComponent(msg.media_key!)}`,
                                                msgId: msg.id,
                                                canDelete: isMe || isGlobalAdmin,
                                                mediaKey: msg.media_key!,
                                                createdAt: msg.created_at
                                            })}
                                        />
                                        {/* Download Button Overlay */}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDownload(msg.media_key!, 'image'); }}
                                            className="absolute bottom-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white/80 hover:text-white rounded-full backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover/image:opacity-100 shadow-lg border border-white/10 md:hidden"
                                            title="Télécharger l'image"
                                        >
                                            <i className="fas fa-download text-xs"></i>
                                        </button>
                                    </div>
                                    {/* Caption below image (if not default placeholder) */}
                                    {msg.content && msg.content !== '📷 Photo annotée' && msg.content !== '📷 Photo' && (
                                        <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words pr-10 pb-1 font-medium tracking-wide">
                                            {msg.content}
                                        </div>
                                    )}
                                </div>
                            ) : msg.type === 'audio' && msg.media_key ? (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <AudioPlayer src={`/api/v2/chat/asset?key=${encodeURIComponent(msg.media_key)}`} isMe={isMe} />
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDownload(msg.media_key!, 'audio'); }}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isMe ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-200 hover:bg-black/10'}`}
                                            title="Télécharger l'audio"
                                        >
                                            <i className="fas fa-download text-xs"></i>
                                        </button>
                                    </div>
                                    {msg.transcription && (
                                        editingTranscriptionId === msg.id ? (
                                            <div className="flex flex-col gap-2 mt-2 w-full min-w-[200px]">
                                                <textarea
                                                    value={editingTranscriptionText}
                                                    onChange={(e) => setEditingTranscriptionText(e.target.value)}
                                                    className="w-full bg-black/20 text-white text-xs p-2 rounded-lg border border-white/10 focus:border-emerald-500 outline-none resize-y min-h-[60px]"
                                                    autoFocus
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setEditingTranscriptionId(null); }}
                                                        className="text-[10px] uppercase font-bold text-gray-400 hover:text-white px-2 py-1"
                                                    >
                                                        Annuler
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onSaveTranscription(msg.id, editingTranscriptionText); }}
                                                        className="text-[10px] uppercase font-bold bg-emerald-500 text-white px-3 py-1 rounded hover:bg-emerald-600 shadow-lg"
                                                    >
                                                        Enregistrer
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`text-[11px] italic font-medium tracking-wide flex items-start gap-1.5 p-2 rounded-lg ${isMe ? 'bg-black/10 text-emerald-100/90' : 'bg-white/5 text-gray-300'} relative`}>
                                                <i className="fas fa-robot text-[10px] mt-0.5 opacity-70 flex-shrink-0"></i>
                                                <span className="flex-1 whitespace-pre-wrap">{msg.transcription}</span>
                                                
                                                {isMe && (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingTranscriptionId(msg.id);
                                                            setEditingTranscriptionText(msg.transcription || '');
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-white hover:scale-110"
                                                        title="Éditer la transcription"
                                                    >
                                                        <i className="fas fa-pen text-[10px]"></i>
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                            ) : (
                                isAI ? (
                                    <AIMessageContent content={msg.content} />
                                ) : (
                                    <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words pr-10 pb-1 font-medium tracking-wide">
                                        {msg.content}
                                    </div>
                                )
                            )}

                            {msg.action_card && (
                                <ActionCardComponent 
                                    card={msg.action_card} 
                                    isSender={isMe} 
                                    onUpdateStatus={(status) => onUpdateCardStatus(msg.id, status)} 
                                    content={msg.content}
                                    imageUrl={msg.type === 'image' && msg.media_key ? `/api/v2/chat/asset?key=${encodeURIComponent(msg.media_key)}` : undefined}
                                    canEscalate={canCreateTickets}
                                />
                            )}
                            
                            <div className={`text-[10px] absolute bottom-1.5 right-3 flex items-center gap-1.5 font-bold tracking-wide ${isMe ? 'text-emerald-100/60' : isAI ? 'text-gray-400' : 'text-gray-500'}`}>
                                <span>{formatTime(msg.created_at)}</span>
                                {isMe && (
                                    <i className={`fas fa-check-double text-[10px] ${isRead ? 'text-white' : 'text-emerald-200/40'}`}></i>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Avatar for ME (Right) */}
                    {isMe && (
                        <div className="flex-shrink-0 mb-1">
                            {avatarUrl ? (
                                <img 
                                    src={avatarUrl} 
                                    alt="Me"
                                    className="w-8 h-8 rounded-xl object-cover shadow-md border border-white/10"
                                />
                            ) : (
                                <div className={`w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold shadow-md border border-white/10`}>
                                    {getInitials(msg.sender_name)}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            );
        }
        return result;
    };

    return (
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 md:p-10 z-10 custom-scrollbar relative scroll-smooth">
            {renderContent()}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;

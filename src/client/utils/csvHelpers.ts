// Utilitaires simples pour l'import/export CSV (Zéro Dépendance)

export const parseCSV = (content: string): any[] => {
    if (!content) return [];

    // 1. Detect Delimiter (Line 1)
    const firstLine = content.split('\n')[0];
    let delimiter = ',';
    if (firstLine.includes(';') && (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) {
        delimiter = ';';
    }

    // 2. Split Lines (Handle CRLF)
    const lines = content.replace(/\r\n/g, '\n').split('\n').filter(l => l.trim().length > 0);
    if (lines.length < 2) return []; // Header only or empty

    // 3. Extract Headers
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, '').toUpperCase());

    // 4. Parse Rows
    const result = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        
        // Basic split (Not supporting commas inside quotes for "Simple/Pragmatic" version)
        // If we needed robust quote handling, we'd need a real parser state machine.
        // For basic imports (Name, Email, Role), this is usually 99% fine.
        const values = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));

        // Map to Object
        const obj: any = {};
        let hasData = false;
        
        headers.forEach((header, index) => {
            if (values[index]) {
                obj[header] = values[index];
                hasData = true;
            }
        });

        if (hasData) result.push(obj);
    }

    return result;
};

export const downloadTemplate = async (type: 'users' | 'machines') => {
    let content = '';
    let filename = '';

    if (type === 'users') {
        content = 'EMAIL,PRENOM,NOM,ROLE\nuser1@exemple.com,Jean,Dupont,technician\nuser2@exemple.com,Marie,Curie,operator';
        filename = 'modele_utilisateurs.csv';
    } else {
        // Fetch customizable CSV example from settings (SaaS-ready)
        try {
            const res = await fetch('/api/settings/placeholders');
            if (res.ok) {
                const placeholders = await res.json();
                if (placeholders.csv_example_machines) {
                    content = placeholders.csv_example_machines;
                }
            }
        } catch { /* Use default */ }
        
        // Default if not customized
        if (!content) {
            content = 'TYPE,MODELE,MARQUE,SERIE,LIEU\nÉquipement,Modèle A,Fabricant,SN123456,Zone A\nMachine,Standard,Marque X,,Secteur B';
        }
        filename = 'modele_machines.csv';
    }

    // Add BOM for Excel UTF-8 compatibility
    const bom = '\uFEFF';
    const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export const exportToCSV = (data: any[], filename: string) => {
    if (!data || !data.length) {
        alert('Aucune donnée à exporter');
        return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => {
            const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
            // Escape quotes and wrap in quotes if contains comma
            if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        }).join(','))
    ].join('\n');

    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if ((navigator as any).msSaveBlob) { // IE 10+
        (navigator as any).msSaveBlob(blob, filename);
    } else {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

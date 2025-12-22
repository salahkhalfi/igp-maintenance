// ===== MODAL D'IMPORT/EXPORT CSV (Utilisateurs & Machines) =====
// Version 2.0 - Avec templates améliorés et prévisualisation

const DataImportModal = ({ show, onClose, initialTab = 'users' }) => {
    const [activeTab, setActiveTab] = React.useState(initialTab);
    const [file, setFile] = React.useState(null);
    const [previewData, setPreviewData] = React.useState([]);
    const [isUploading, setIsUploading] = React.useState(false);
    const [isExporting, setIsExporting] = React.useState(false);
    const [updateExisting, setUpdateExisting] = React.useState(false);
    const [report, setReport] = React.useState(null);

    // Sync tab when modal opens
    React.useEffect(() => {
        if (show) {
            setActiveTab(initialTab);
            setFile(null);
            setPreviewData([]);
            setReport(null);
            setUpdateExisting(false);
        }
    }, [show, initialTab]);

    // Parse CSV content - AMÉLIORÉ : ignore les lignes commençant par #
    const parseCSV = (content) => {
        if (!content) return [];

        // Normaliser les sauts de ligne
        const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        // Séparer les lignes et filtrer les vides
        const allLines = normalizedContent.split('\n').filter(l => l.trim().length > 0);
        if (allLines.length < 1) return [];

        // Trouver la première ligne non-commentaire (en-têtes)
        let headerIndex = 0;
        while (headerIndex < allLines.length && allLines[headerIndex].trim().startsWith('#')) {
            headerIndex++;
        }
        
        if (headerIndex >= allLines.length) return [];

        // Détecter le délimiteur sur la ligne d'en-tête
        const headerLine = allLines[headerIndex];
        let delimiter = ',';
        if (headerLine.includes(';') && (headerLine.match(/;/g) || []).length > (headerLine.match(/,/g) || []).length) {
            delimiter = ';';
        }

        // Parser les en-têtes
        const headers = headerLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, '').toUpperCase());

        // Parser les données (ignorer les lignes commençant par #)
        const result = [];
        for (let i = headerIndex + 1; i < allLines.length; i++) {
            const line = allLines[i].trim();
            
            // Ignorer les commentaires
            if (line.startsWith('#')) continue;
            
            const values = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
            const obj = {};
            let hasData = false;

            headers.forEach((header, index) => {
                const value = values[index] || '';
                obj[header] = value;
                if (value) hasData = true;
            });

            if (hasData) result.push(obj);
        }

        return result;
    };

    // Templates CSV avec ligne d'aide - AMÉLIORÉ
    const TEMPLATES = {
        users: {
            filename: 'modele_utilisateurs.csv',
            content: `EMAIL,PRENOM,NOM,ROLE
# AIDE: EMAIL obligatoire | ROLE: admin/supervisor/technician/operator/viewer | MDP par défaut: Changeme123!
jean.dupont@exemple.com,Jean,Dupont,technician
marie.martin@exemple.com,Marie,Martin,supervisor
pierre.durand@exemple.com,Pierre,Durand,operator`
        },
        machines: {
            filename: 'modele_machines.csv',
            content: `TYPE,MODELE,MARQUE,SERIE,LIEU
# AIDE: TYPE obligatoire | SERIE = identifiant unique (pour mises à jour) | Laissez SERIE vide pour toujours créer
Presse hydraulique,PH-500,Bosch,SN-2024-001,Atelier A
Four industriel,FI-800,Siemens,SN-2024-002,Zone B
Chariot élévateur,Toyota 8FG,Toyota,,Entrepôt`
        }
    };

    // Download template
    const downloadTemplate = (type) => {
        const template = TEMPLATES[type];
        if (!template) return;

        const bom = '\uFEFF'; // UTF-8 BOM pour Excel
        const blob = new Blob([bom + template.content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', template.filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Export current data
    const handleExport = async () => {
        setIsExporting(true);
        try {
            const endpoint = activeTab === 'users' ? '/settings/export/users' : '/settings/export/machines';
            const res = await axios.get(API_URL + endpoint);
            const data = res.data;

            if (activeTab === 'users' && data.users) {
                exportToCSV(data.users, 'export_utilisateurs.csv');
            } else if (activeTab === 'machines' && data.machines) {
                exportToCSV(data.machines, 'export_machines.csv');
            } else {
                alert('Aucune donnée à exporter');
            }
        } catch (e) {
            console.error('Export error:', e);
            alert('Erreur lors de l\'export: ' + (e.response?.data?.error || e.message));
        } finally {
            setIsExporting(false);
        }
    };

    // Export to CSV file
    const exportToCSV = (data, filename) => {
        if (!data || !data.length) {
            alert('Aucune donnée à exporter');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(h => {
                const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
                if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                    return `"${val.replace(/"/g, '""')}"`;
                }
                return val;
            }).join(','))
        ].join('\n');

        const bom = '\uFEFF';
        const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Handle file selection
    const handleFileChange = async (e) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setReport(null);

        try {
            const text = await selectedFile.text();
            const data = parseCSV(text);

            if (data.length === 0) {
                alert('Erreur : Le fichier est vide ou ne contient que des commentaires.');
                setFile(null);
                setPreviewData([]);
                return;
            }

            // Validate Headers
            const required = activeTab === 'users' ? ['EMAIL'] : ['TYPE'];
            const headers = Object.keys(data[0] || {});
            const missing = required.filter(r => !headers.includes(r));

            if (missing.length > 0) {
                alert(`Erreur : Colonnes obligatoires manquantes : ${missing.join(', ')}`);
                setFile(null);
                setPreviewData([]);
                return;
            }

            setPreviewData(data);
        } catch (err) {
            console.error('File read error:', err);
            alert('Erreur lors de la lecture du fichier.');
            setFile(null);
            setPreviewData([]);
        }
    };

    // Handle import
    const handleImport = async () => {
        if (!previewData.length) return;

        setIsUploading(true);
        try {
            let payload = {};

            if (activeTab === 'users') {
                payload.users = previewData.map(row => ({
                    email: row.EMAIL,
                    first_name: row.PRENOM,
                    last_name: row.NOM,
                    role: row.ROLE
                }));
            } else {
                payload.machines = previewData.map(row => ({
                    type: row.TYPE,
                    model: row.MODELE,
                    manufacturer: row.MARQUE,
                    serial: row.SERIE,
                    location: row.LIEU
                }));
            }

            const endpoint = activeTab === 'users' ? '/settings/import/users' : '/settings/import/machines';
            const res = await axios.post(API_URL + endpoint, { ...payload, updateExisting });

            setReport(res.data.stats);
            setFile(null);
            setPreviewData([]);

            // Notification du mot de passe par défaut
            if (res.data.note) {
                setTimeout(() => alert(res.data.note), 100);
            }
        } catch (error) {
            console.error('Import error', error);
            alert("Erreur: " + (error.response?.data?.error || "Erreur technique lors de l'import."));
        } finally {
            setIsUploading(false);
        }
    };

    // Colonnes à afficher dans la prévisualisation
    const getPreviewColumns = () => {
        if (activeTab === 'users') {
            return ['EMAIL', 'PRENOM', 'NOM', 'ROLE'];
        } else {
            return ['TYPE', 'MODELE', 'MARQUE', 'SERIE', 'LIEU'];
        }
    };

    if (!show) return null;

    const previewColumns = getPreviewColumns();

    return React.createElement('div', {
        className: 'fixed inset-0 z-[10005] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4',
        onClick: onClose
    },
        React.createElement('div', {
            className: 'bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]',
            onClick: (e) => e.stopPropagation()
        },
            // Header
            React.createElement('div', { className: 'bg-slate-900 p-4 flex items-center justify-between text-white' },
                React.createElement('div', { className: 'flex items-center gap-3' },
                    React.createElement('div', { className: 'bg-emerald-500/20 p-2 rounded-full' },
                        React.createElement('i', { className: 'fas fa-file-import text-emerald-400 text-xl' })
                    ),
                    React.createElement('div', null,
                        React.createElement('h3', { className: 'font-bold text-lg' }, 'Import / Export de Données'),
                        React.createElement('p', { className: 'text-xs text-slate-400' }, 'Onboarding rapide - Utilisateurs & Machines')
                    )
                ),
                React.createElement('button', {
                    onClick: onClose,
                    className: 'p-2 hover:bg-white/10 rounded-full transition-colors'
                },
                    React.createElement('i', { className: 'fas fa-times text-xl' })
                )
            ),

            // Tabs
            React.createElement('div', { className: 'flex border-b border-gray-200' },
                React.createElement('button', {
                    onClick: () => { setActiveTab('users'); setFile(null); setReport(null); setPreviewData([]); },
                    className: 'flex-1 py-3 text-sm font-bold border-b-2 transition-colors ' + 
                        (activeTab === 'users' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:bg-gray-50')
                }, '👥 Utilisateurs'),
                React.createElement('button', {
                    onClick: () => { setActiveTab('machines'); setFile(null); setReport(null); setPreviewData([]); },
                    className: 'flex-1 py-3 text-sm font-bold border-b-2 transition-colors ' + 
                        (activeTab === 'machines' ? 'border-teal-600 text-teal-600 bg-teal-50' : 'border-transparent text-gray-500 hover:bg-gray-50')
                }, '🏭 Machines')
            ),

            // Content
            React.createElement('div', { className: 'p-6 overflow-y-auto flex-1' },
                // Step 1: Template & Export
                React.createElement('div', { className: 'mb-6 bg-slate-50 border border-slate-200 rounded-lg p-4' },
                    React.createElement('div', { className: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4' },
                        React.createElement('div', { className: 'text-sm text-slate-700' },
                            React.createElement('p', { className: 'font-bold mb-1' }, '📥 Étape 1 : Obtenir un fichier'),
                            React.createElement('p', { className: 'text-xs text-slate-500' }, 'Téléchargez un modèle vide ou exportez vos données actuelles.')
                        ),
                        React.createElement('div', { className: 'flex gap-2' },
                            React.createElement('button', {
                                onClick: () => downloadTemplate(activeTab),
                                className: 'px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100 flex items-center gap-2 shadow-sm'
                            },
                                React.createElement('i', { className: 'fas fa-download' }),
                                'Modèle Vide'
                            ),
                            React.createElement('button', {
                                onClick: handleExport,
                                disabled: isExporting,
                                className: 'px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 flex items-center gap-2 shadow-sm disabled:opacity-50'
                            },
                                isExporting ? React.createElement('i', { className: 'fas fa-spinner fa-spin' }) : React.createElement('i', { className: 'fas fa-file-export' }),
                                'Exporter Actuel'
                            )
                        )
                    )
                ),

                // Step 2: Upload
                React.createElement('div', { className: 'mb-6' },
                    React.createElement('p', { className: 'font-bold text-sm text-slate-700 mb-2' }, '📤 Étape 2 : Sélectionner le fichier rempli'),
                    !file ? React.createElement('label', {
                        className: 'flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-blue-50 hover:border-blue-400 transition-colors group'
                    },
                        React.createElement('div', { className: 'flex flex-col items-center justify-center pt-5 pb-6' },
                            React.createElement('i', { className: 'fas fa-cloud-upload-alt text-3xl text-slate-400 group-hover:text-blue-500 mb-2' }),
                            React.createElement('p', { className: 'text-sm text-slate-500 group-hover:text-blue-600 font-medium' }, 'Cliquez pour choisir un fichier CSV'),
                            React.createElement('p', { className: 'text-xs text-slate-400 mt-1' }, 'Les lignes commençant par # sont ignorées')
                        ),
                        React.createElement('input', {
                            type: 'file',
                            accept: '.csv,.txt',
                            className: 'hidden',
                            onChange: handleFileChange
                        })
                    ) : React.createElement('div', { className: 'flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl' },
                        React.createElement('div', { className: 'flex items-center gap-3' },
                            React.createElement('i', { className: 'fas fa-file-csv text-3xl text-blue-500' }),
                            React.createElement('div', null,
                                React.createElement('p', { className: 'text-sm font-bold text-blue-900' }, file.name),
                                React.createElement('p', { className: 'text-xs text-blue-700' }, previewData.length + ' lignes de données détectées')
                            )
                        ),
                        React.createElement('button', {
                            onClick: () => { setFile(null); setPreviewData([]); },
                            className: 'text-blue-400 hover:text-blue-600'
                        },
                            React.createElement('i', { className: 'fas fa-times text-xl' })
                        )
                    )
                ),

                // Step 3: Preview - NOUVEAU
                previewData.length > 0 && React.createElement('div', { className: 'mb-6' },
                    React.createElement('p', { className: 'font-bold text-sm text-slate-700 mb-2' }, '👁️ Étape 3 : Vérifier les données'),
                    React.createElement('div', { className: 'border border-slate-200 rounded-lg overflow-hidden' },
                        React.createElement('div', { className: 'overflow-x-auto' },
                            React.createElement('table', { className: 'w-full text-xs' },
                                React.createElement('thead', { className: 'bg-slate-100' },
                                    React.createElement('tr', null,
                                        previewColumns.map(col => 
                                            React.createElement('th', { key: col, className: 'px-3 py-2 text-left font-bold text-slate-700 border-b' }, col)
                                        )
                                    )
                                ),
                                React.createElement('tbody', null,
                                    previewData.slice(0, 5).map((row, idx) => 
                                        React.createElement('tr', { key: idx, className: idx % 2 === 0 ? 'bg-white' : 'bg-slate-50' },
                                            previewColumns.map(col => 
                                                React.createElement('td', { key: col, className: 'px-3 py-2 border-b border-slate-100 truncate max-w-[150px]' }, 
                                                    row[col] || React.createElement('span', { className: 'text-slate-300' }, '—')
                                                )
                                            )
                                        )
                                    )
                                )
                            )
                        ),
                        previewData.length > 5 && React.createElement('div', { className: 'px-3 py-2 bg-slate-50 text-xs text-slate-500 text-center border-t' },
                            '... et ' + (previewData.length - 5) + ' autres lignes'
                        )
                    )
                ),

                // Options
                previewData.length > 0 && React.createElement('div', { className: 'mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg' },
                    React.createElement('label', { className: 'flex items-start gap-3 cursor-pointer' },
                        React.createElement('input', {
                            type: 'checkbox',
                            checked: updateExisting,
                            onChange: (e) => setUpdateExisting(e.target.checked),
                            className: 'mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500'
                        }),
                        React.createElement('div', null,
                            React.createElement('span', { className: 'font-bold text-sm text-amber-900' }, 'Mettre à jour les données existantes ?'),
                            React.createElement('p', { className: 'text-xs text-amber-800 mt-1' },
                                activeTab === 'users' 
                                    ? 'Si coché, les utilisateurs existants (même EMAIL) seront mis à jour. Sinon, ils seront ignorés.'
                                    : 'Si coché, les machines existantes (même N° SERIE) seront mises à jour. Sinon, elles seront ignorées.'
                            )
                        )
                    )
                ),

                // Report
                report && React.createElement('div', { className: 'mb-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200' },
                    React.createElement('div', { className: 'flex items-center gap-2 mb-3' },
                        React.createElement('i', { className: 'fas fa-check-circle text-emerald-600 text-xl' }),
                        React.createElement('h4', { className: 'font-bold text-emerald-900' }, 'Import terminé !')
                    ),
                    React.createElement('div', { className: 'grid grid-cols-4 gap-3 text-center' },
                        React.createElement('div', { className: 'bg-white p-3 rounded-lg border border-emerald-100' },
                            React.createElement('div', { className: 'text-2xl font-bold text-emerald-600' }, report.success || 0),
                            React.createElement('div', { className: 'text-xs font-bold text-emerald-500 mt-1' }, '✅ Créés')
                        ),
                        React.createElement('div', { className: 'bg-white p-3 rounded-lg border border-blue-100' },
                            React.createElement('div', { className: 'text-2xl font-bold text-blue-600' }, report.updated || 0),
                            React.createElement('div', { className: 'text-xs font-bold text-blue-500 mt-1' }, '🔄 Mis à jour')
                        ),
                        React.createElement('div', { className: 'bg-white p-3 rounded-lg border border-amber-100' },
                            React.createElement('div', { className: 'text-2xl font-bold text-amber-500' }, report.ignored || 0),
                            React.createElement('div', { className: 'text-xs font-bold text-amber-500 mt-1' }, '⏭️ Ignorés')
                        ),
                        React.createElement('div', { className: 'bg-white p-3 rounded-lg border border-red-100' },
                            React.createElement('div', { className: 'text-2xl font-bold text-red-500' }, report.errors || 0),
                            React.createElement('div', { className: 'text-xs font-bold text-red-500 mt-1' }, '❌ Erreurs')
                        )
                    ),
                    activeTab === 'users' && report.success > 0 && React.createElement('div', { className: 'mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800 text-center' },
                        '🔑 Mot de passe par défaut : Changeme123!'
                    )
                )
            ),

            // Footer
            React.createElement('div', { className: 'p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center' },
                React.createElement('div', { className: 'text-xs text-slate-500' },
                    previewData.length > 0 ? `${previewData.length} ligne(s) prête(s) à importer` : ''
                ),
                React.createElement('div', { className: 'flex gap-3' },
                    React.createElement('button', {
                        onClick: onClose,
                        className: 'px-5 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded-lg transition-colors',
                        disabled: isUploading
                    }, 'Fermer'),
                    React.createElement('button', {
                        onClick: handleImport,
                        disabled: isUploading || !file || previewData.length === 0,
                        className: 'px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:shadow-none'
                    },
                        isUploading ? React.createElement('i', { className: 'fas fa-spinner fa-spin' }) : React.createElement('i', { className: 'fas fa-upload' }),
                        isUploading ? 'Import en cours...' : 'Lancer l\'Import'
                    )
                )
            )
        )
    );
};

// Global function to open the modal
window.DataImportModal = DataImportModal;

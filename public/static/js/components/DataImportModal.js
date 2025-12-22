// ===== MODAL D'IMPORT/EXPORT CSV (Utilisateurs & Machines) =====

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
        }
    }, [show, initialTab]);

    // Parse CSV content
    const parseCSV = (content) => {
        if (!content) return [];

        const firstLine = content.split('\n')[0];
        let delimiter = ',';
        if (firstLine.includes(';') && (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) {
            delimiter = ';';
        }

        const lines = content.replace(/\r\n/g, '\n').split('\n').filter(l => l.trim().length > 0);
        if (lines.length < 2) return [];

        const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, '').toUpperCase());

        const result = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
            const obj = {};
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

    // Download template
    const downloadTemplate = (type) => {
        let content = '';
        let filename = '';

        if (type === 'users') {
            content = 'EMAIL,PRENOM,NOM,ROLE\nuser1@exemple.com,Jean,Dupont,technician\nuser2@exemple.com,Marie,Curie,operator';
            filename = 'modele_utilisateurs.csv';
        } else {
            content = 'TYPE,MODELE,MARQUE,SERIE,LIEU\nÉquipement,Modèle A,Fabricant,SN123456,Zone A\nMachine,Standard,Marque X,,Secteur B';
            filename = 'modele_machines.csv';
        }

        const bom = '\uFEFF';
        const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Export current data
    const handleExport = async () => {
        setIsExporting(true);
        try {
            const endpoint = activeTab === 'users' ? '/api/settings/export/users' : '/api/settings/export/machines';
            const res = await axios.get(API_URL + endpoint.replace('/api', ''));
            const data = res.data;

            if (activeTab === 'users' && data.users) {
                exportToCSV(data.users, 'export_utilisateurs.csv');
            } else if (activeTab === 'machines' && data.machines) {
                exportToCSV(data.machines, 'export_machines.csv');
            } else {
                alert('Erreur: Pas de données à exporter');
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
    };

    // Handle file selection
    const handleFileChange = async (e) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setReport(null);

        const text = await selectedFile.text();
        const data = parseCSV(text);

        // Validate Headers
        const required = activeTab === 'users' ? ['EMAIL'] : ['TYPE'];
        const headers = Object.keys(data[0] || {});
        const missing = required.filter(r => !headers.includes(r));

        if (missing.length > 0) {
            alert(`Erreur : Colonnes manquantes dans le fichier CSV : ${missing.join(', ')}`);
            setFile(null);
            setPreviewData([]);
            return;
        }

        setPreviewData(data);
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

            if (res.data.note) {
                alert(res.data.note);
            }
        } catch (error) {
            console.error('Import error', error);
            alert("Erreur: " + (error.response?.data?.error || "Erreur technique lors de l'import."));
        } finally {
            setIsUploading(false);
        }
    };

    if (!show) return null;

    return React.createElement('div', {
        className: 'fixed inset-0 z-[10005] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4',
        onClick: onClose
    },
        React.createElement('div', {
            className: 'bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]',
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
                        React.createElement('p', { className: 'text-xs text-slate-400' }, 'Configuration rapide (Utilisateurs & Machines)')
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
                            React.createElement('p', { className: 'font-bold mb-1' }, 'Étape 1 : Obtenir un fichier'),
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
                    React.createElement('p', { className: 'font-bold text-sm text-slate-700 mb-2' }, 'Étape 2 : Sélectionner le fichier rempli'),
                    !file ? React.createElement('label', {
                        className: 'flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-blue-50 hover:border-blue-400 transition-colors group'
                    },
                        React.createElement('div', { className: 'flex flex-col items-center justify-center pt-5 pb-6' },
                            React.createElement('i', { className: 'fas fa-cloud-upload-alt text-3xl text-slate-400 group-hover:text-blue-500 mb-2' }),
                            React.createElement('p', { className: 'text-sm text-slate-500 group-hover:text-blue-600 font-medium' }, 'Cliquez pour choisir un fichier CSV')
                        ),
                        React.createElement('input', {
                            type: 'file',
                            accept: '.csv',
                            className: 'hidden',
                            onChange: handleFileChange
                        })
                    ) : React.createElement('div', { className: 'flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl' },
                        React.createElement('div', { className: 'flex items-center gap-3' },
                            React.createElement('i', { className: 'fas fa-file-csv text-3xl text-blue-500' }),
                            React.createElement('div', null,
                                React.createElement('p', { className: 'text-sm font-bold text-blue-900' }, file.name),
                                React.createElement('p', { className: 'text-xs text-blue-700' }, previewData.length + ' lignes détectées')
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

                // Options
                file && React.createElement('div', { className: 'mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg' },
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
                                'Si coché, les éléments existants (basés sur Email ou Numéro de Série) seront écrasés par les valeurs du CSV. Sinon, les doublons seront ignorés (plus sûr).'
                            )
                        )
                    )
                ),

                // Report
                report && React.createElement('div', { className: 'mb-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200' },
                    React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                        React.createElement('i', { className: 'fas fa-check-circle text-emerald-600 text-xl' }),
                        React.createElement('h4', { className: 'font-bold text-emerald-900' }, 'Import terminé !')
                    ),
                    React.createElement('div', { className: 'grid grid-cols-3 gap-4 text-center' },
                        React.createElement('div', { className: 'bg-white p-2 rounded border border-emerald-100' },
                            React.createElement('div', { className: 'text-lg font-bold text-emerald-600' }, report.success),
                            React.createElement('div', { className: 'text-xs uppercase font-bold text-emerald-400' }, 'Ajoutés')
                        ),
                        report.updated > 0 && React.createElement('div', { className: 'bg-white p-2 rounded border border-blue-100' },
                            React.createElement('div', { className: 'text-lg font-bold text-blue-600' }, report.updated),
                            React.createElement('div', { className: 'text-xs uppercase font-bold text-blue-400' }, 'Mis à jour')
                        ),
                        React.createElement('div', { className: 'bg-white p-2 rounded border border-amber-100' },
                            React.createElement('div', { className: 'text-lg font-bold text-amber-500' }, report.ignored),
                            React.createElement('div', { className: 'text-xs uppercase font-bold text-amber-400' }, 'Ignorés')
                        ),
                        React.createElement('div', { className: 'bg-white p-2 rounded border border-red-100' },
                            React.createElement('div', { className: 'text-lg font-bold text-red-500' }, report.errors),
                            React.createElement('div', { className: 'text-xs uppercase font-bold text-red-400' }, 'Erreurs')
                        )
                    )
                )
            ),

            // Footer
            React.createElement('div', { className: 'p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3' },
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
    );
};

// Global function to open the modal
window.DataImportModal = DataImportModal;

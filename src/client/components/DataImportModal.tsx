import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { parseCSV, downloadTemplate, exportToCSV } from '../utils/csvHelpers';
import { client } from '../api';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'users' | 'machines';
}

const DataImportModal: React.FC<DataImportModalProps> = ({ isOpen, onClose, initialTab = 'users' }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'machines'>(initialTab);
  
  // Sync with prop when opening
  React.useEffect(() => {
      if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [report, setReport] = useState<{success: number, updated?: number, ignored: number, errors: number} | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
        const endpoint = activeTab === 'users' ? '/api/settings/export/users' : '/api/settings/export/machines';
        const res = await fetch(endpoint, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        const data = await res.json();
        
        if (activeTab === 'users' && data.users) {
            exportToCSV(data.users, 'export_utilisateurs.csv');
        } else if (activeTab === 'machines' && data.machines) {
            exportToCSV(data.machines, 'export_machines.csv');
        } else {
            alert('Erreur: Pas de données');
        }
    } catch (e) {
        alert('Erreur export');
    } finally {
        setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleImport = async () => {
    if (!previewData.length) return;

    setIsUploading(true);
    try {
        // Map CSV keys to API keys
        let payload: any = {};
        
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

        const endpoint = activeTab === 'users' ? '/api/settings/import/users' : '/api/settings/import/machines';
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({ ...payload, updateExisting })
        });

        const result = await res.json();
        
        if (res.ok) {
            setReport(result.stats);
            setFile(null);
            setPreviewData([]);
        } else {
            alert('Erreur: ' + result.error);
        }

    } catch (error) {
        console.error('Import error', error);
        alert("Erreur technique lors de l'import.");
    } finally {
        setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10005] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 p-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2 rounded-full">
              <Upload className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Import de Données</h3>
              <p className="text-xs text-slate-400">Configuration rapide (Utilisateurs & Machines)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 shrink-0">
            <button 
                onClick={() => { setActiveTab('users'); setFile(null); setReport(null); setPreviewData([]); }}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'users' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
            >
                👥 Utilisateurs
            </button>
            <button 
                onClick={() => { setActiveTab('machines'); setFile(null); setReport(null); setPreviewData([]); }}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'machines' ? 'border-teal-600 text-teal-600 bg-teal-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
            >
                🏭 Machines
            </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          
          {/* Step 1: Template & Export */}
          <div className="mb-6 bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
            <div className="text-sm text-slate-700">
                <p className="font-bold mb-1">Étape 1 : Obtenir un fichier</p>
                <p className="text-xs text-slate-500">Téléchargez un modèle vide ou exportez vos données actuelles pour les modifier.</p>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => downloadTemplate(activeTab)}
                    className="px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100 flex items-center gap-2 shadow-sm"
                >
                    <Download className="w-4 h-4" />
                    Modèle Vide
                </button>
                <button 
                    onClick={handleExport}
                    disabled={isExporting}
                    className="px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                    {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    Exporter Actuel
                </button>
            </div>
          </div>

          {/* Step 2: Upload */}
          <div className="mb-6">
            <p className="font-bold text-sm text-slate-700 mb-2">Étape 2 : Sélectionner le fichier rempli</p>
            {!file ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-blue-50 hover:border-blue-400 transition-colors group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mb-2" />
                        <p className="text-sm text-slate-500 group-hover:text-blue-600 font-medium">Cliquez pour choisir un fichier CSV</p>
                    </div>
                    <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                </label>
            ) : (
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-blue-500" />
                        <div>
                            <p className="text-sm font-bold text-blue-900">{file.name}</p>
                            <p className="text-xs text-blue-700">{previewData.length} lignes détectées</p>
                        </div>
                    </div>
                    <button onClick={() => { setFile(null); setPreviewData([]); }} className="text-blue-400 hover:text-blue-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}
          </div>

          {/* Options */}
          {file && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={updateExisting}
                        onChange={(e) => setUpdateExisting(e.target.checked)}
                        className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <div>
                        <span className="font-bold text-sm text-amber-900">Mettre à jour les données existantes ?</span>
                        <p className="text-xs text-amber-800 mt-1">
                            Si coché, les éléments existants (basés sur Email ou Numéro de Série) seront écrasés par les valeurs du CSV.
                            <br/>Sinon, les doublons seront ignorés (plus sûr).
                        </p>
                    </div>
                </label>
            </div>
          )}

          {/* Report Area */}
          {report && (
            <div className="mb-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-bold text-emerald-900">Import terminé !</h4>
                </div>
                <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="bg-white p-2 rounded border border-emerald-100">
                        <div className="text-lg font-bold text-emerald-600">{report.success}</div>
                        <div className="text-[10px] uppercase font-bold text-emerald-400">Ajoutés</div>
                    </div>
                    {report.updated !== undefined && report.updated > 0 && (
                        <div className="bg-white p-2 rounded border border-blue-100">
                            <div className="text-lg font-bold text-blue-600">{report.updated}</div>
                            <div className="text-[10px] uppercase font-bold text-blue-400">Mis à jour</div>
                        </div>
                    )}
                    <div className="bg-white p-2 rounded border border-emerald-100">
                        <div className="text-lg font-bold text-amber-500">{report.ignored}</div>
                        <div className="text-[10px] uppercase font-bold text-amber-400">Ignorés</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-emerald-100">
                        <div className="text-lg font-bold text-red-500">{report.errors}</div>
                        <div className="text-[10px] uppercase font-bold text-red-400">Erreurs</div>
                    </div>
                </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isUploading}
          >
            Fermer
          </button>
          <button
            onClick={handleImport}
            disabled={isUploading || !file || previewData.length === 0}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
          >
            {isUploading ? 'Import en cours...' : 'Lancer l\'Import'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default DataImportModal;

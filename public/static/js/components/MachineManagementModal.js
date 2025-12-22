// Composant de gestion des machines (VERSION SIMPLIFIÉE ET ÉLÉGANTE)
const MachineManagementModal = ({ show, onClose, currentUser, machines, onRefresh }) => {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [showCreateForm, setShowCreateForm] = React.useState(false);
    const [editingMachine, setEditingMachine] = React.useState(null);
    
    // Placeholders personnalisables (SaaS-ready)
    const [placeholders, setPlaceholders] = React.useState({
        placeholder_machine_type: 'Ex: Équipement, Machine...',
        placeholder_location: 'Ex: Zone A, Atelier...',
        placeholder_manufacturer: 'Ex: Marque, Fabricant...',
        placeholder_model: 'Ex: Modèle, Version...',
        placeholder_serial_number: 'Ex: SN-001, ABC123...'
    });
    
    // Charger les placeholders au montage
    React.useEffect(() => {
        if (show) {
            fetch('/api/settings/placeholders')
                .then(res => res.ok ? res.json() : {})
                .then(data => setPlaceholders(prev => ({ ...prev, ...data })))
                .catch(() => {}); // Silently fail, defaults already set
        }
    }, [show]);

    // Formulaire création
    const [newType, setNewType] = React.useState("");
    const [newModel, setNewModel] = React.useState("");
    const [newSerial, setNewSerial] = React.useState("");
    const [newLocation, setNewLocation] = React.useState("");
    const [newManufacturer, setNewManufacturer] = React.useState("");
    const [newYear, setNewYear] = React.useState("");
    const [newTechnicalSpecs, setNewTechnicalSpecs] = React.useState("");

    // Formulaire édition
    const [editType, setEditType] = React.useState("");
    const [editModel, setEditModel] = React.useState("");
    const [editSerial, setEditSerial] = React.useState("");
    const [editLocation, setEditLocation] = React.useState("");
    const [editManufacturer, setEditManufacturer] = React.useState("");
    const [editYear, setEditYear] = React.useState("");
    const [editTechnicalSpecs, setEditTechnicalSpecs] = React.useState("");
    const [editStatus, setEditStatus] = React.useState("");

    // Référence pour le scroll
    const scrollContainerRef = React.useRef(null);
    const fileInputRef = React.useRef(null);
    const [importing, setImporting] = React.useState(false);

    // Gestion touche Escape pour fermer le modal
    React.useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && show) {
                onClose();
            }
        };
        
        if (show) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [show, onClose]);

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!confirm(`Importer les machines depuis "${file.name}" ?\n\nFormat attendu (CSV): type, model, serial, location\nLes doublons de numéro de série seront ignorés.`)) {
            e.target.value = '';
            return;
        }

        setImporting(true);
        const reader = new FileReader();
        
        reader.onload = async (event) => {
            try {
                const text = event.target.result;
                const lines = text.split(/\r\n|\n/);
                
                if (lines.length < 2) {
                    throw new Error("Le fichier semble vide ou sans en-tête.");
                }

                // Parse headers (flexible mapping)
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
                
                let successCount = 0;
                let errorCount = 0;
                let skippedCount = 0;

                // Process rows
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;
                    
                    // Basic CSV split (handling simple commas)
                    const values = lines[i].split(',').map(v => v.trim().replace(/["']/g, ''));
                    const row = {};
                    headers.forEach((h, idx) => {
                        if (values[idx]) row[h] = values[idx];
                    });

                    // Map known columns to API payload
                    // Supports EN and FR headers
                    const payload = {
                        machine_type: row['type'] || row['machine_type'] || row['nom'] || row['equipement'],
                        model: row['model'] || row['modele'],
                        serial_number: row['serial'] || row['serial_number'] || row['serie'] || row['sn'],
                        location: row['location'] || row['emplacement'] || row['zone'],
                        manufacturer: row['manufacturer'] || row['fabricant'] || row['marque'],
                        year: (row['year'] || row['annee']) ? parseInt(row['year'] || row['annee']) : null,
                        technical_specs: row['specs'] || row['description'] || row['details']
                    };

                    if (!payload.machine_type) {
                        skippedCount++;
                        continue;
                    }

                    try {
                        await axios.post(API_URL + "/machines", payload);
                        successCount++;
                    } catch (err) {
                        console.warn(`Row ${i} failed:`, err);
                        // If duplicate serial (409 or 500 constraint), count as skipped/error
                        errorCount++;
                    }
                }

                alert(`Import terminé !\n\n✅ Ajoutées: ${successCount}\n❌ Erreurs: ${errorCount}\n⏭️ Ignorées: ${skippedCount}`);
                onRefresh();
                
            } catch (err) {
                alert("Erreur critique lors de l'import: " + err.message);
            } finally {
                setImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };

        reader.onerror = () => {
            alert("Erreur de lecture du fichier.");
            setImporting(false);
            e.target.value = '';
        };

        reader.readAsText(file);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newType) {
            alert("Type de machine requis");
            return;
        }
        try {
            await axios.post(API_URL + "/machines", {
                machine_type: newType,
                model: newModel || null,
                serial_number: newSerial || null,
                location: newLocation || null,
                manufacturer: newManufacturer || null,
                year: newYear ? parseInt(newYear) : null,
                technical_specs: newTechnicalSpecs || null
            });
            alert("Machine creee avec succes!");
            setNewType("");
            setNewModel("");
            setNewSerial("");
            setNewLocation("");
            setNewManufacturer("");
            setNewYear("");
            setNewTechnicalSpecs("");
            setShowCreateForm(false);
            onRefresh();
        } catch (error) {
            alert("Erreur: " + (error.response?.data?.error || "Erreur inconnue"));
        }
    };

    const handleEdit = (machine) => {
        setEditingMachine(machine);
        setEditType(machine.machine_type);
        setEditModel(machine.model || "");
        setEditSerial(machine.serial_number || "");
        setEditLocation(machine.location || "");
        setEditManufacturer(machine.manufacturer || "");
        setEditYear(machine.year || "");
        setEditTechnicalSpecs(machine.technical_specs || "");
        setEditStatus(machine.status);

        // Scroller vers le haut pour voir le formulaire
        setTimeout(() => {
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = 0;
            }
        }, 100);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.patch(API_URL + "/machines/" + editingMachine.id, {
                machine_type: editType,
                model: editModel || null,
                serial_number: editSerial || null,
                location: editLocation || null,
                manufacturer: editManufacturer || null,
                year: editYear ? parseInt(editYear) : null,
                technical_specs: editTechnicalSpecs || null,
                status: editStatus
            });
            alert("Machine mise a jour!");
            setEditingMachine(null);
            onRefresh();
        } catch (error) {
            alert("Erreur: " + (error.response?.data?.error || "Erreur inconnue"));
        }
    };

    const handleDelete = async (machine) => {
        if (!confirm("Supprimer " + machine.machine_type + " " + (machine.model || "") + " ?")) return;
        try {
            await axios.delete(API_URL + "/machines/" + machine.id);
            alert("Machine supprimee!");
            onRefresh();
        } catch (error) {
            alert("Erreur: " + (error.response?.data?.error || "Impossible de supprimer une machine avec des tickets"));
        }
    };

    const getStatusColor = (status) => {
        if (status === "operational") return "bg-green-100 text-green-800";
        if (status === "maintenance") return "bg-yellow-100 text-yellow-800";
        return "bg-red-100 text-red-800";
    };

    const getStatusLabel = (status) => {
        if (status === "operational") return "Operationnelle";
        if (status === "maintenance") return "En maintenance";
        return "Hors service";
    };

    if (!show) return null;

    // FIX: Check for null properties to prevent crashes
    const filteredMachines = machines.filter(m =>
        !searchQuery ||
        m.machine_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.model && m.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.serial_number && m.serial_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.location && m.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.manufacturer && m.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return React.createElement("div", {
        className: "fixed inset-0 bg-black/80 flex items-center justify-center z-[10000] p-4 backdrop-blur-sm",
        onClick: onClose
    },
        React.createElement("div", {
            className: "bg-white rounded-2xl shadow-2xl border border-gray-300 w-full max-w-5xl max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col",
            onClick: (e) => e.stopPropagation()
        },
            React.createElement("div", { className: "bg-gradient-to-r from-teal-700 to-cyan-700 text-white p-4 sm:p-5 flex justify-between items-center shadow-md" },
                React.createElement("div", { className: "flex items-center gap-3" },
                    React.createElement("div", { className: "bg-white/20 p-2 rounded-lg" },
                         React.createElement("i", { className: "fas fa-server text-xl sm:text-2xl" })
                    ),
                    React.createElement("div", {},
                        React.createElement("h2", { className: "text-lg sm:text-2xl font-bold tracking-tight" }, "Gestion du Parc Machines"),
                        React.createElement("p", { className: "text-xs sm:text-sm text-cyan-100 font-medium" }, "Inventaire et caractéristiques techniques")
                    )
                ),
                React.createElement("button", {
                    onClick: onClose,
                    className: "text-white hover:bg-white/20 rounded-xl p-2 transition-all active:scale-95",
                    'aria-label': "Fermer"
                },
                    React.createElement("i", { className: "fas fa-times text-xl" })
                )
            ),
            React.createElement("div", { className: "flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50", ref: scrollContainerRef },
                React.createElement("div", { className: "mb-6 flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100" },
                    currentUser?.role === "admin" ? React.createElement(React.Fragment, {},
                        React.createElement("button", {
                            onClick: () => setShowCreateForm(!showCreateForm),
                            className: "px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                        }, 
                            React.createElement("i", { className: showCreateForm ? "fas fa-minus" : "fas fa-plus" }),
                            showCreateForm ? "Fermer" : "Nouvelle Machine"
                        ),
                        React.createElement("button", {
                            onClick: () => window.openDataImport ? window.openDataImport('machines') : alert("Fonction non disponible"),
                            className: `px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2`
                        }, 
                            React.createElement("i", { className: "fas fa-file-import" }),
                            "Import CSV"
                        )
                    ) : null,
                    React.createElement("div", { className: "relative flex-1" },
                        React.createElement("i", { className: "fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" }),
                        React.createElement("input", {
                            type: "text",
                            placeholder: "Rechercher une machine (nom, modèle, série, fabricant...)",
                            value: searchQuery,
                            onChange: (e) => setSearchQuery(e.target.value),
                            className: "w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                        })
                    )
                ),

                showCreateForm ? React.createElement("form", {
                    onSubmit: handleCreate,
                    className: "mb-6 p-6 bg-white rounded-xl border border-blue-200 shadow-lg"
                },
                    React.createElement("h3", { className: "text-xl font-bold mb-4 text-blue-800" }, "Nouvelle Machine"),
                    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                        React.createElement("div", {},
                            React.createElement("label", { className: "block font-semibold mb-2" }, "Type *"),
                            React.createElement("input", {
                                type: "text",
                                value: newType,
                                onChange: (e) => setNewType(e.target.value),
                                className: "w-full px-4 py-2 border border-blue-300 rounded-lg focus:border-blue-600 focus:outline-none",
                                placeholder: placeholders.placeholder_machine_type
                            })
                        ),
                        React.createElement("div", {},
                            React.createElement("label", { className: "block font-semibold mb-2" }, "Modele"),
                            React.createElement("input", {
                                type: "text",
                                value: newModel,
                                onChange: (e) => setNewModel(e.target.value),
                                className: "w-full px-4 py-2 border border-blue-300 rounded-lg focus:border-blue-600 focus:outline-none",
                                placeholder: placeholders.placeholder_model
                            })
                        ),
                        React.createElement("div", {},
                            React.createElement("label", { className: "block font-semibold mb-2" }, "Numero de serie"),
                            React.createElement("input", {
                                type: "text",
                                value: newSerial,
                                onChange: (e) => setNewSerial(e.target.value),
                                className: "w-full px-4 py-2 border border-blue-300 rounded-lg focus:border-blue-600 focus:outline-none",
                                placeholder: placeholders.placeholder_serial_number
                            })
                        ),
                        React.createElement("div", {},
                            React.createElement("label", { className: "block font-semibold mb-2" }, "Emplacement"),
                            React.createElement("input", {
                                type: "text",
                                value: newLocation,
                                onChange: (e) => setNewLocation(e.target.value),
                                className: "w-full px-4 py-2 border border-blue-300 rounded-lg focus:border-blue-600 focus:outline-none",
                                placeholder: placeholders.placeholder_location
                            })
                        ),
                        React.createElement("div", {},
                            React.createElement("label", { className: "block font-semibold mb-2" }, "Fabricant"),
                            React.createElement("input", {
                                type: "text",
                                value: newManufacturer,
                                onChange: (e) => setNewManufacturer(e.target.value),
                                className: "w-full px-4 py-2 border border-blue-300 rounded-lg focus:border-blue-600 focus:outline-none",
                                placeholder: placeholders.placeholder_manufacturer
                            })
                        ),
                        React.createElement("div", {},
                            React.createElement("label", { className: "block font-semibold mb-2" }, "Annee"),
                            React.createElement("input", {
                                type: "number",
                                value: newYear,
                                onChange: (e) => setNewYear(e.target.value),
                                className: "w-full px-4 py-2 border border-blue-300 rounded-lg focus:border-blue-600 focus:outline-none",
                                placeholder: "Ex: 2018"
                            })
                        ),
                        React.createElement("div", { className: "md:col-span-2" },
                            React.createElement("label", { className: "block font-semibold mb-2" }, "Specs Techniques"),
                            React.createElement("textarea", {
                                value: newTechnicalSpecs,
                                onChange: (e) => setNewTechnicalSpecs(e.target.value),
                                className: "w-full px-4 py-2 border border-blue-300 rounded-lg focus:border-blue-600 focus:outline-none",
                                placeholder: "Ex: Puissance 40kW, 5 axes...",
                                rows: 3
                            })
                        )
                    ),
                    React.createElement("button", {
                        type: "submit",
                        className: "mt-4 px-6 py-3 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
                    }, "Creer la Machine")
                ) : null,

                editingMachine ? React.createElement("form", {
                    onSubmit: handleUpdate,
                    className: "mb-6 p-6 bg-white rounded-xl border border-blue-200 shadow-lg"
                },
                    React.createElement("h3", { className: "text-xl font-bold mb-4 text-blue-800" }, "Modifier Machine"),
                    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                        React.createElement("div", {},
                            React.createElement("label", { className: "block font-semibold mb-2" }, "Type"),
                            React.createElement("input", {
                                type: "text",
                                value: editType,
                                onChange: (e) => setEditType(e.target.value),
                                className: "w-full px-4 py-2 border border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            })
                        ),
                        React.createElement("div", {},
                            React.createElement("label", { className: "block font-semibold mb-2" }, "Modele"),
                            React.createElement("input", {
                                type: "text",
                                value: editModel,
                                onChange: (e) => setEditModel(e.target.value),
                                className: "w-full px-4 py-2 border border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            })
                        ),
                        React.createElement("div", {},
                            React.createElement("label", { className: "block font-semibold mb-2" }, "Numero de serie"),
                            React.createElement("input", {
                                type: "text",
                                value: editSerial,
                                onChange: (e) => setEditSerial(e.target.value),
                                className: "w-full px-4 py-2 border border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            })
                        ),
                        React.createElement("div", {},
                            React.createElement("label", { className: "block font-semibold mb-2" }, "Emplacement"),
                            React.createElement("input", {
                                type: "text",
                                value: editLocation,
                                onChange: (e) => setEditLocation(e.target.value),
                                className: "w-full px-4 py-2 border border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            })
                        ),
                        React.createElement("div", {},
                            React.createElement("label", { className: "block font-semibold mb-2" }, "Fabricant"),
                            React.createElement("input", {
                                type: "text",
                                value: editManufacturer,
                                onChange: (e) => setEditManufacturer(e.target.value),
                                className: "w-full px-4 py-2 border border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            })
                        ),
                        React.createElement("div", {},
                            React.createElement("label", { className: "block font-semibold mb-2" }, "Annee"),
                            React.createElement("input", {
                                type: "number",
                                value: editYear,
                                onChange: (e) => setEditYear(e.target.value),
                                className: "w-full px-4 py-2 border border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            })
                        ),
                        React.createElement("div", { className: "md:col-span-2" },
                            React.createElement("label", { className: "block font-semibold mb-2" }, "Specs Techniques"),
                            React.createElement("textarea", {
                                value: editTechnicalSpecs,
                                onChange: (e) => setEditTechnicalSpecs(e.target.value),
                                className: "w-full px-4 py-2 border border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none",
                                rows: 3
                            })
                        ),
                        React.createElement("div", {},
                            React.createElement("label", { className: "block font-semibold mb-2" }, "Statut"),
                            React.createElement("select", {
                                value: editStatus,
                                onChange: (e) => setEditStatus(e.target.value),
                                className: "w-full px-4 py-2 border border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            },
                                React.createElement("option", { value: "operational" }, "Operationnelle"),
                                React.createElement("option", { value: "maintenance" }, "En maintenance"),
                                React.createElement("option", { value: "out_of_service" }, "Hors service")
                            )
                        )
                    ),
                    React.createElement("div", { className: "flex gap-3 mt-4" },
                        React.createElement("button", {
                            type: "submit",
                            className: "px-6 py-3 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
                        }, "Enregistrer"),
                        React.createElement("button", {
                            type: "button",
                            onClick: () => setEditingMachine(null),
                            className: "px-6 py-3 bg-gray-400 text-white rounded-lg font-bold hover:bg-gray-500 transition-all"
                        }, "Annuler")
                    )
                ) : null,

                React.createElement("div", { className: "space-y-3" },
                    React.createElement("div", { className: "flex justify-between items-center mb-4" },
                        React.createElement("p", { className: "text-gray-600 font-medium" },
                            filteredMachines.length + " machine(s) trouvée(s)"
                        )
                    ),
                    filteredMachines.map(machine =>
                        React.createElement("div", {
                            key: machine.id,
                            className: "bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:border-teal-400 hover:shadow-md transition-all group"
                        },
                            React.createElement("div", { className: "flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4" },
                                React.createElement("div", { className: "flex-1" },
                                    React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2" },
                                        React.createElement("h4", { className: "font-bold text-lg text-gray-800 flex items-center gap-2" }, 
                                            machine.machine_type,
                                            machine.model ? React.createElement("span", { className: "text-gray-500 font-normal" }, " - " + machine.model) : null
                                        ),
                                        React.createElement("span", {
                                            className: "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide " + getStatusColor(machine.status)
                                        }, getStatusLabel(machine.status))
                                    ),
                                    
                                    React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-1 gap-x-4 mt-2" },
                                        React.createElement("p", { className: "text-sm text-gray-600 flex items-center gap-2" },
                                            React.createElement("i", { className: "fas fa-barcode text-gray-400 w-5 text-center" }),
                                            React.createElement("span", { className: "font-mono" }, machine.serial_number || "N/A")
                                        ),
                                        machine.location ? React.createElement("p", { className: "text-sm text-gray-600 flex items-center gap-2" },
                                            React.createElement("i", { className: "fas fa-map-marker-alt text-gray-400 w-5 text-center" }),
                                            machine.location
                                        ) : null,
                                        (machine.manufacturer || machine.year) ? React.createElement("p", { className: "text-sm text-gray-600 flex items-center gap-2" },
                                            React.createElement("i", { className: "fas fa-industry text-gray-400 w-5 text-center" }),
                                            [
                                                machine.manufacturer,
                                                machine.year ? `(${machine.year})` : null
                                            ].filter(Boolean).join(" ")
                                        ) : null
                                    ),
                                    
                                    machine.technical_specs ? React.createElement("div", { className: "mt-3 pl-3 border-l-2 border-gray-100" },
                                        React.createElement("p", { className: "text-xs text-gray-500 italic line-clamp-2" },
                                            machine.technical_specs
                                        )
                                    ) : null
                                ),
                                currentUser?.role === "admin" || currentUser?.role === "supervisor" ? React.createElement("div", { className: "flex gap-2 self-end sm:self-auto" },
                                    React.createElement("button", {
                                        onClick: () => handleEdit(machine),
                                        className: "px-3 sm:px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-bold hover:bg-blue-100 transition-all text-sm sm:text-base border border-blue-200"
                                    },
                                        React.createElement("i", { className: "fas fa-edit" }),
                                        React.createElement("span", { className: "ml-2 hidden sm:inline" }, "Modifier")
                                    ),
                                    currentUser?.role === "admin" ? React.createElement("button", {
                                        onClick: () => handleDelete(machine),
                                        className: "px-3 sm:px-4 py-2 bg-red-50 text-red-700 rounded-lg font-bold hover:bg-red-100 transition-all text-sm sm:text-base border border-red-200"
                                    },
                                        React.createElement("i", { className: "fas fa-trash" }),
                                        React.createElement("span", { className: "ml-2 hidden sm:inline" }, "Supprimer")
                                    ) : null
                                ) : null
                            )
                        )
                    )
                )
            )
        )
    );
};

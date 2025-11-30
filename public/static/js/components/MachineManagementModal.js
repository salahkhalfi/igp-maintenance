// Composant de gestion des machines (VERSION SIMPLIFIÉE ET ÉLÉGANTE)
const MachineManagementModal = ({ show, onClose, currentUser, machines, onRefresh }) => {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [showCreateForm, setShowCreateForm] = React.useState(false);
    const [editingMachine, setEditingMachine] = React.useState(null);

    // Formulaire création
    const [newType, setNewType] = React.useState("");
    const [newModel, setNewModel] = React.useState("");
    const [newSerial, setNewSerial] = React.useState("");
    const [newLocation, setNewLocation] = React.useState("");

    // Formulaire édition
    const [editType, setEditType] = React.useState("");
    const [editModel, setEditModel] = React.useState("");
    const [editSerial, setEditSerial] = React.useState("");
    const [editLocation, setEditLocation] = React.useState("");
    const [editStatus, setEditStatus] = React.useState("");

    // Référence pour le scroll
    const scrollContainerRef = React.useRef(null);

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

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newType || !newModel || !newSerial) {
            alert("Type, modele et numero de serie requis");
            return;
        }
        try {
            await axios.post(API_URL + "/machines", {
                machine_type: newType,
                model: newModel,
                serial_number: newSerial,
                location: newLocation
            });
            alert("Machine creee avec succes!");
            setNewType("");
            setNewModel("");
            setNewSerial("");
            setNewLocation("");
            setShowCreateForm(false);
            onRefresh();
        } catch (error) {
            alert("Erreur: " + (error.response?.data?.error || "Erreur inconnue"));
        }
    };

    const handleEdit = (machine) => {
        setEditingMachine(machine);
        setEditType(machine.machine_type);
        setEditModel(machine.model);
        setEditSerial(machine.serial_number);
        setEditLocation(machine.location || "");
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
                model: editModel,
                serial_number: editSerial,
                location: editLocation,
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
        if (!confirm("Supprimer " + machine.machine_type + " " + machine.model + " ?")) return;
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

    const filteredMachines = machines.filter(m =>
        !searchQuery ||
        m.machine_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.serial_number && m.serial_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.location && m.location.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return React.createElement("div", {
        className: "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[10000] p-4",
        onClick: onClose
    },
        React.createElement("div", {
            className: "bg-white rounded-2xl border border-gray-300 w-full max-w-5xl max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col",
            onClick: (e) => e.stopPropagation()
        },
            React.createElement("div", { className: "bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-3 sm:p-5 flex justify-between items-center" },
                React.createElement("div", { className: "flex items-center gap-2 sm:gap-3" },
                    React.createElement("i", { className: "fas fa-cogs text-xl sm:text-2xl" }),
                    React.createElement("h2", { className: "text-lg sm:text-2xl font-bold" }, "Gestion des Machines")
                ),
                React.createElement("button", {
                    onClick: onClose,
                    className: "text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 sm:p-2 min-w-[40px] min-h-[40px] flex items-center justify-center transition-all active:scale-95",
                    'aria-label': "Fermer"
                },
                    React.createElement("i", { className: "fas fa-times text-xl sm:text-2xl" })
                )
            ),
            React.createElement("div", { className: "flex-1 overflow-y-auto p-3 sm:p-6", ref: scrollContainerRef },
                React.createElement("div", { className: "mb-4 flex flex-col sm:flex-row gap-2 sm:gap-3" },
                    currentUser?.role === "admin" ? React.createElement("button", {
                        onClick: () => setShowCreateForm(!showCreateForm),
                        className: "px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm sm:text-base"
                    }, showCreateForm ? "Annuler" : "Nouvelle Machine") : null,
                    React.createElement("input", {
                        type: "text",
                        placeholder: "Rechercher...",
                        value: searchQuery,
                        onChange: (e) => setSearchQuery(e.target.value),
                        className: "flex-1 px-3 sm:px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none text-sm sm:text-base"
                    })
                ),

                showCreateForm ? React.createElement("form", {
                    onSubmit: handleCreate,
                    className: "mb-6 p-6 bg-gradient-to-br from-blue-50 to-gray-50 rounded-xl border-2 border-blue-200 shadow-lg"
                },
                    React.createElement("h3", { className: "text-xl font-bold mb-4 text-blue-800" }, "Nouvelle Machine"),
                    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                        React.createElement("div", {},
                            React.createElement("label", { className: "block font-semibold mb-2" }, "Type *"),
                            React.createElement("input", {
                                type: "text",
                                value: newType,
                                onChange: (e) => setNewType(e.target.value),
                                className: "w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-600 focus:outline-none",
                                placeholder: "Ex: Polisseuse, CNC, Four..."
                            })
                        ),
                        React.createElement("div", {},
                            React.createElement("label", { className: "block font-semibold mb-2" }, "Modele *"),
                            React.createElement("input", {
                                type: "text",
                                value: newModel,
                                onChange: (e) => setNewModel(e.target.value),
                                className: "w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-600 focus:outline-none",
                                placeholder: "Ex: Bavelloni, Double Edger..."
                            })
                        ),
                        React.createElement("div", {},
                            React.createElement("label", { className: "block font-semibold mb-2" }, "Numero de serie *"),
                            React.createElement("input", {
                                type: "text",
                                value: newSerial,
                                onChange: (e) => setNewSerial(e.target.value),
                                className: "w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-600 focus:outline-none",
                                placeholder: "Ex: PDE-001"
                            })
                        ),
                        React.createElement("div", {},
                            React.createElement("label", { className: "block font-semibold mb-2" }, "Emplacement"),
                            React.createElement("input", {
                                type: "text",
                                value: newLocation,
                                onChange: (e) => setNewLocation(e.target.value),
                                className: "w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-600 focus:outline-none",
                                placeholder: "Ex: Atelier Polissage"
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
                    className: "mb-6 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 shadow-lg"
                },
                    React.createElement("h3", { className: "text-xl font-bold mb-4 text-blue-800" }, "Modifier Machine"),
                    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                        React.createElement("div", {},
                            React.createElement("label", { className: "block font-semibold mb-2" }, "Type"),
                            React.createElement("input", {
                                type: "text",
                                value: editType,
                                onChange: (e) => setEditType(e.target.value),
                                className: "w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            })
                        ),
                        React.createElement("div", {},
                            React.createElement("label", { className: "block font-semibold mb-2" }, "Modele"),
                            React.createElement("input", {
                                type: "text",
                                value: editModel,
                                onChange: (e) => setEditModel(e.target.value),
                                className: "w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            })
                        ),
                        React.createElement("div", {},
                            React.createElement("label", { className: "block font-semibold mb-2" }, "Numero de serie"),
                            React.createElement("input", {
                                type: "text",
                                value: editSerial,
                                onChange: (e) => setEditSerial(e.target.value),
                                className: "w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            })
                        ),
                        React.createElement("div", {},
                            React.createElement("label", { className: "block font-semibold mb-2" }, "Emplacement"),
                            React.createElement("input", {
                                type: "text",
                                value: editLocation,
                                onChange: (e) => setEditLocation(e.target.value),
                                className: "w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            })
                        ),
                        React.createElement("div", {},
                            React.createElement("label", { className: "block font-semibold mb-2" }, "Statut"),
                            React.createElement("select", {
                                value: editStatus,
                                onChange: (e) => setEditStatus(e.target.value),
                                className: "w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
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
                    React.createElement("p", { className: "text-lg mb-4" },
                        filteredMachines.length + " machine(s)"
                    ),
                    filteredMachines.map(machine =>
                        React.createElement("div", {
                            key: machine.id,
                            className: "bg-white rounded-xl p-3 sm:p-4 shadow-md border-2 border-gray-200 hover:border-teal-400 hover:shadow-lg transition-all"
                        },
                            React.createElement("div", { className: "flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3" },
                                React.createElement("div", { className: "flex-1" },
                                    React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2" },
                                        React.createElement("h4", { className: "font-bold text-base sm:text-lg" }, machine.machine_type + " - " + machine.model),
                                        React.createElement("span", {
                                            className: "px-3 py-1 rounded-full text-xs font-semibold " + getStatusColor(machine.status)
                                        }, getStatusLabel(machine.status))
                                    ),
                                    React.createElement("p", { className: "text-sm text-gray-600" },
                                        React.createElement("i", { className: "fas fa-barcode mr-2" }),
                                        "Serie: " + (machine.serial_number || "N/A")
                                    ),
                                    machine.location ? React.createElement("p", { className: "text-sm text-gray-600" },
                                        React.createElement("i", { className: "fas fa-map-marker-alt mr-2" }),
                                        machine.location
                                    ) : null
                                ),
                                currentUser?.role === "admin" || currentUser?.role === "supervisor" ? React.createElement("div", { className: "flex gap-2 self-end sm:self-auto" },
                                    React.createElement("button", {
                                        onClick: () => handleEdit(machine),
                                        className: "px-3 sm:px-4 py-2 bg-igp-blue-light text-white rounded-lg font-bold hover:bg-igp-blue transition-all text-sm sm:text-base"
                                    },
                                        React.createElement("i", { className: "fas fa-edit" }),
                                        React.createElement("span", { className: "ml-2 hidden sm:inline" }, "Modifier")
                                    ),
                                    currentUser?.role === "admin" ? React.createElement("button", {
                                        onClick: () => handleDelete(machine),
                                        className: "px-3 sm:px-4 py-2 bg-igp-red text-white rounded-lg font-bold hover:bg-red-700 transition-all text-sm sm:text-base"
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

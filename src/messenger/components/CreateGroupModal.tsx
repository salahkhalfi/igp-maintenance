import React, { useState } from 'react';

const CreateGroupModal = ({ selectedUserIds, onClose, onCreate }: { selectedUserIds: number[], onClose: () => void, onCreate: (name: string) => void }) => {
    const [name, setName] = useState('');

    return (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-md glass-panel rounded-3xl overflow-hidden animate-slide-up border border-white/10 shadow-2xl">
                <div className="h-20 px-8 flex items-center justify-between border-b border-white/5">
                    <div className="text-white font-bold text-xl font-display">Nouveau Groupe</div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex items-center justify-center"><i className="fas fa-times"></i></button>
                </div>

                <div className="p-10 flex flex-col items-center">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center mb-8 shadow-inner group cursor-pointer hover:from-gray-800 hover:to-gray-900 transition-all relative overflow-hidden">
                        <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <i className="fas fa-camera text-gray-500 text-3xl group-hover:text-emerald-400 transition-colors z-10"></i>
                    </div>

                    <div className="w-full mb-3 relative group">
                        <input 
                            type="text" 
                            placeholder="Nom du groupe" 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-transparent text-white text-2xl font-bold text-center border-b-2 border-white/10 focus:border-emerald-500 py-3 focus:outline-none transition-colors placeholder-gray-700 font-display"
                            autoFocus
                        />
                    </div>
                    <div className="text-gray-500 text-xs font-bold tracking-widest w-full text-right mb-6 opacity-50">{name.length}/25</div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-8 flex gap-3 items-start text-left w-full">
                        <i className="fas fa-info-circle text-blue-400 mt-0.5 flex-shrink-0"></i>
                        <div>
                            <div className="text-blue-400 font-bold text-xs uppercase tracking-wide">Note importante</div>
                            <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                                Ce groupe sera <strong>public et visible par tous</strong> jusqu'à ce que vous y ajoutiez le premier participant.
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={() => onCreate(name)}
                        disabled={!name.trim()}
                        className="w-full glass-button-primary text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl text-base"
                    >
                        <i className="fas fa-check"></i> Créer le groupe
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;

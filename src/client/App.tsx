import React, { useState } from 'react'
import RoleDropdown from './components/RoleDropdown'

const App = () => {
  const [role, setRole] = useState('operator');

  return (
    <div className="fixed bottom-4 left-4 z-[9999] group">
        <div className="bg-white/90 backdrop-blur-md border border-blue-200 p-4 rounded-xl shadow-2xl transition-all hover:shadow-blue-500/20">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                    <h3 className="font-bold text-slate-800 text-sm">Modern Frontend Active</h3>
                    <p className="text-xs text-slate-500">Vite + React + TS Running</p>
                </div>
            </div>
            
            {/* Test Zone for Components */}
            <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Component Test: RoleDropdown</p>
                <div className="w-64">
                    <RoleDropdown 
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        currentUserRole="admin"
                        variant="blue"
                    />
                </div>
                <p className="text-xs text-slate-400 mt-2">Selected: {role}</p>
            </div>
        </div>
    </div>
  )
}

export default App
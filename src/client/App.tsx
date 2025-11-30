import React from 'react'

const App = () => {
  return (
    <div className="fixed bottom-4 left-4 z-[9999] bg-white/90 backdrop-blur-md border border-blue-200 p-4 rounded-xl shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <div>
            <h3 className="font-bold text-slate-800 text-sm">Modern Frontend Active</h3>
            <p className="text-xs text-slate-500">Vite + React + TS Running</p>
        </div>
      </div>
    </div>
  )
}

export default App
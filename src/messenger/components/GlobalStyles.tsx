import React from 'react';

const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        * {
            font-family: 'Inter', sans-serif;
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
            box-sizing: border-box;
        }

        h1, h2, h3, .font-display {
            font-family: 'Plus Jakarta Sans', sans-serif;
        }

        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            overscroll-behavior: none;
            background-color: #000000;
        }

        /* Glass Scrollbar - Ultra Thin */
        ::-webkit-scrollbar {
            width: 4px;
            height: 4px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .glass-panel {
            background: rgba(15, 15, 15, 0.6);
            backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .glass-sidebar {
            background: rgba(5, 5, 5, 0.65);
            backdrop-filter: blur(40px);
            border-right: 1px solid rgba(255, 255, 255, 0.04);
        }

        .glass-header {
            background: rgba(5, 5, 5, 0.65);
            backdrop-filter: blur(40px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .glass-input {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            color: #ffffff;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-input:focus {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(16, 185, 129, 0.5);
            box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }
        .glass-input::placeholder {
            color: rgba(255, 255, 255, 0.3);
        }

        .glass-button-primary {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-button-primary:hover {
            transform: translateY(-1px) scale(1.02);
            box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
        }

        .message-bubble-me {
            background: linear-gradient(135deg, #10b981 0%, #047857 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
            word-wrap: break-word;
            overflow-wrap: anywhere;
            max-width: 100%;
        }

        .message-bubble-them {
            background: rgba(255, 255, 255, 0.12);
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            word-wrap: break-word;
            overflow-wrap: anywhere;
            max-width: 100%;
        }

        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-in-right { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }

        .hover-trigger .hover-target { opacity: 0; transform: translateX(-10px); transition: all 0.3s ease; }
        .hover-trigger:hover .hover-target { opacity: 1; transform: translateX(0); }

        .bg-noise {
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
        }
    `}</style>
);

export default GlobalStyles;

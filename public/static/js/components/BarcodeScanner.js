const BarcodeScanner = ({ onScanSuccess, onClose }) => {
    // Pour éviter le rendu double en dev strict mode
    const scannerRef = React.useRef(null);

    React.useEffect(() => {
        // Configuration du scanner
        const scanner = new Html5QrcodeScanner(
            "reader", 
            { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true,
                // Prioritize 1D barcodes (although default scans both)
                formatsToSupport: [ 
                    Html5QrcodeSupportedFormats.QR_CODE,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.EAN_13
                ]
            },
            /* verbose= */ false
        );

        scanner.render(
            (decodedText) => {
                // Succès
                scanner.clear();
                onScanSuccess(decodedText);
            }, 
            (errorMessage) => {
                // Erreur de scan (fréquent tant qu'il cherche, on ignore)
            }
        );

        scannerRef.current = scanner;

        // Nettoyage au démontage du composant
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear html5-qrcode", error);
                });
            }
        };
    }, [onScanSuccess]);

    return React.createElement('div', {
        className: 'fixed inset-0 bg-black bg-opacity-90 z-[70] flex flex-col items-center justify-center p-4'
    },
        React.createElement('div', {
            className: 'bg-white rounded-xl p-4 w-full max-w-md relative'
        },
            React.createElement('button', {
                onClick: onClose,
                className: 'absolute top-2 right-2 text-gray-500 hover:text-gray-800 z-10 bg-gray-100 rounded-full p-2'
            },
                React.createElement('i', { className: 'fas fa-times text-xl' })
            ),
            React.createElement('h3', { className: 'text-lg font-bold mb-4 text-center' }, 'Scanner un code'),
            
            // Le scanner s'injecte ici
            React.createElement('div', { id: 'reader', className: 'w-full' }),
            
            React.createElement('p', { className: 'text-center text-sm text-gray-500 mt-4' },
                'Placez le code QR ou code-barres dans le cadre'
            )
        )
    );
};

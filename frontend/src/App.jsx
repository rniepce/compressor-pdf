import { useState, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import DropZone from './components/DropZone';
import ResultsPanel from './components/ResultsPanel';
import { compressPdf } from './api';

let nextId = 0;

export default function App() {
    const [view, setView] = useState('upload');          // 'upload' | 'results'
    const [files, setFiles] = useState([]);              // Array of file state objects
    const [compressionLevel, setCompressionLevel] = useState('3');

    const updateFile = useCallback((id, updates) => {
        setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
    }, []);

    const handleFilesSelected = useCallback(
        (fileList) => {
            setView('results');

            const pdfFiles = Array.from(fileList).filter(
                (f) => f.type === 'application/pdf'
            );

            pdfFiles.forEach((rawFile) => {
                const id = ++nextId;

                const fileEntry = {
                    id,
                    name: rawFile.name,
                    originalSize: rawFile.size,
                    status: 'processing',
                    compressedSize: null,
                    downloadUrl: null,
                    error: null,
                };

                setFiles((prev) => [...prev, fileEntry]);

                // Fire and forget — each file processes independently
                compressPdf(rawFile, compressionLevel)
                    .then(({ url, compressedSize }) => {
                        updateFile(id, { status: 'done', compressedSize, downloadUrl: url });
                    })
                    .catch((err) => {
                        updateFile(id, { status: 'error', error: err.message });
                    });
            });
        },
        [compressionLevel, updateFile]
    );

    const handleReset = useCallback(() => {
        // Revoke any object URLs to free memory
        files.forEach((f) => {
            if (f.downloadUrl) URL.revokeObjectURL(f.downloadUrl);
        });
        setFiles([]);
        setView('upload');
    }, [files]);

    return (
        <>
            <Header />

            <main className="main">
                <div className="card">
                    {view === 'upload' && (
                        <DropZone
                            onFilesSelected={handleFilesSelected}
                            compressionLevel={compressionLevel}
                            onLevelChange={setCompressionLevel}
                        />
                    )}

                    {view === 'results' && (
                        <ResultsPanel files={files} onReset={handleReset} />
                    )}
                </div>
            </main>

            <Footer />
        </>
    );
}

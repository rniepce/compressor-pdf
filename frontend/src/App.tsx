import { useState, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import DropZone from './components/DropZone';
import ResultsPanel from './components/ResultsPanel';
import { compressPdf } from './api';
import type { FileEntry, ViewType } from './types';

let nextId = 0;

export default function App(): React.JSX.Element {
    const [view, setView] = useState<ViewType>('upload');
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [compressionLevel, setCompressionLevel] = useState('3');

    const updateFile = useCallback((id: number, updates: Partial<FileEntry>) => {
        setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
    }, []);

    const handleFilesSelected = useCallback(
        (fileList: FileList) => {
            setView('results');

            const pdfFiles = Array.from(fileList).filter(
                (f) => f.type === 'application/pdf'
            );

            pdfFiles.forEach((rawFile) => {
                const id = ++nextId;

                const fileEntry: FileEntry = {
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
                    .catch((err: Error) => {
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

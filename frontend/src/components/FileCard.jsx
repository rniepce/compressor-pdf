import { useState, useEffect } from 'react';

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function FileCard({ file, compressionLevel }) {
    const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [savings, setSavings] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function processFile() {
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('compression_level', compressionLevel);

                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || 'Erro');
                }

                const blob = await response.blob();

                if (cancelled) return;

                const url = window.URL.createObjectURL(blob);
                const pct = ((file.size - blob.size) / file.size) * 100;

                setDownloadUrl(url);
                setSavings(pct);
                setStatus('success');
            } catch (err) {
                console.error(err);
                if (!cancelled) setStatus('error');
            }
        }

        processFile();

        return () => {
            cancelled = true;
        };
    }, [file, compressionLevel]);

    return (
        <div className="file-card">
            <div className="file-info">
                <span className="file-name">{file.name}</span>
                <span className="file-original-size">{formatBytes(file.size)}</span>
            </div>

            {status === 'processing' && (
                <div className="file-state state-processing">
                    <span className="status-text">Processando...</span>
                    <div className="file-spinner"></div>
                </div>
            )}

            {status === 'success' && (
                <div className="file-state state-success">
                    <span className={`savings-tag ${savings > 0 ? 'tag-success' : 'tag-neutral'}`}>
                        {savings > 0 ? `-${savings.toFixed(1)}%` : 'Original (0%)'}
                    </span>
                    <a
                        href={downloadUrl}
                        download={`compressed_${file.name}`}
                        className="btn-sm btn-success"
                    >
                        Baixar
                    </a>
                </div>
            )}

            {status === 'error' && (
                <div className="file-state">
                    <span className="error-msg">❌ Falha</span>
                </div>
            )}
        </div>
    );
}

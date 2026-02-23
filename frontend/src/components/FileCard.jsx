import { formatBytes } from '../utils';

export default function FileCard({ file }) {
    const { name, originalSize, status, compressedSize, downloadUrl, error } = file;

    const savings = status === 'done' && compressedSize < originalSize
        ? ((originalSize - compressedSize) / originalSize * 100).toFixed(1)
        : 0;

    return (
        <div className="file-card">
            <div className="file-card__info">
                <span className="file-card__name" title={name}>{name}</span>
                <span className="file-card__size">{formatBytes(originalSize)}</span>
            </div>

            {status === 'processing' && (
                <div className="file-card__state">
                    <span className="file-card__status">Processando…</span>
                    <div className="file-card__spinner" />
                </div>
            )}

            {status === 'done' && (
                <div className="file-card__state">
                    <span
                        className={`file-card__savings ${savings > 0 ? 'file-card__savings--success' : 'file-card__savings--neutral'
                            }`}
                    >
                        {savings > 0 ? `−${savings}%` : 'Original (0%)'}
                    </span>
                    <a className="btn-download" href={downloadUrl} download={`compressed_${name}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Baixar
                    </a>
                </div>
            )}

            {status === 'error' && (
                <div className="file-card__state">
                    <span className="file-card__error">❌ {error || 'Falha'}</span>
                </div>
            )}
        </div>
    );
}

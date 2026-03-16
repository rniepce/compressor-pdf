import { useRef, useState, useCallback } from 'react';

interface DropZoneProps {
    onFilesSelected: (files: FileList) => void;
    compressionLevel: string;
    onLevelChange: (level: string) => void;
}

export default function DropZone({ onFilesSelected, compressionLevel, onLevelChange }: DropZoneProps): React.JSX.Element {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragover, setDragover] = useState(false);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragover(false);
        if (e.dataTransfer.files.length) {
            onFilesSelected(e.dataTransfer.files);
        }
    }, [onFilesSelected]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragover(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setDragover(false);
    }, []);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length) {
            onFilesSelected(e.target.files);
        }
    }, [onFilesSelected]);

    return (
        <div
            className={`dropzone ${dragover ? 'dragover' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
        >
            {/* Upload icon */}
            <svg
                className="dropzone__icon"
                xmlns="http://www.w3.org/2000/svg"
                width="52"
                height="52"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
            </svg>

            <h3 className="dropzone__title">Arraste e solte seus PDFs aqui</h3>
            <p className="dropzone__subtitle">ou</p>

            <button
                className="btn-select"
                onClick={(e) => {
                    e.stopPropagation();
                    inputRef.current?.click();
                }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                </svg>
                Selecionar Arquivos
            </button>

            <input
                ref={inputRef}
                type="file"
                accept=".pdf"
                multiple
                hidden
                onChange={handleChange}
            />

            <div className="options" onClick={(e) => e.stopPropagation()}>
                <label className="options__label" htmlFor="compression-level">
                    Nível de Compressão
                </label>
                <select
                    id="compression-level"
                    className="options__select"
                    value={compressionLevel}
                    onChange={(e) => onLevelChange(e.target.value)}
                >
                    <option value="3">Padrão (Recomendado)</option>
                    <option value="1">Baixa Compressão (Melhor Qualidade)</option>
                    <option value="4">Alta Compressão (Menor Arquivo)</option>
                </select>
            </div>

            <p className="dropzone__hint">Tamanho máximo recomendado: 500 MB</p>
        </div>
    );
}

import { useState, useRef } from 'react';
import FileCard from './FileCard';

export default function UploadBox() {
    const [files, setFiles] = useState([]);
    const [compressionLevel, setCompressionLevel] = useState('3');
    const [dragover, setDragover] = useState(false);
    const fileInputRef = useRef(null);

    const showResults = files.length > 0;

    function handleFiles(fileList) {
        const pdfFiles = Array.from(fileList).filter(
            (f) => f.type === 'application/pdf'
        );
        if (pdfFiles.length > 0) {
            setFiles(pdfFiles);
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
        setDragover(true);
    }

    function handleDragLeave() {
        setDragover(false);
    }

    function handleDrop(e) {
        e.preventDefault();
        setDragover(false);
        if (e.dataTransfer.files.length) {
            handleFiles(e.dataTransfer.files);
        }
    }

    function handleInputChange(e) {
        if (e.target.files.length) {
            handleFiles(e.target.files);
        }
    }

    function handleReset() {
        setFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    if (showResults) {
        return (
            <div className="results-container">
                <h3>Arquivos Processados</h3>
                <div id="file-list">
                    {files.map((file, index) => (
                        <FileCard
                            key={`${file.name}-${index}`}
                            file={file}
                            compressionLevel={compressionLevel}
                        />
                    ))}
                </div>
                <div className="actions global-actions">
                    <button className="btn-secondary" onClick={handleReset}>
                        Comprimir Mais Arquivos
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="compressor-card">
            <div className="upload-section">
                <div
                    className={`upload-box ${dragover ? 'dragover' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="64"
                        height="64"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="upload-icon"
                    >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <h3>Arraste e solte seus PDFs aqui</h3>
                    <p>ou</p>
                    <button
                        className="btn-primary"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Selecionar Arquivos
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".pdf"
                        multiple
                        hidden
                        onChange={handleInputChange}
                    />
                    <div className="compression-options">
                        <label htmlFor="compression-level">Nível de Compressão:</label>
                        <select
                            id="compression-level"
                            value={compressionLevel}
                            onChange={(e) => setCompressionLevel(e.target.value)}
                        >
                            <option value="3">Padrão (Recomendado)</option>
                            <option value="1">Baixa Compressão (Melhor Qualidade)</option>
                            <option value="4">Alta Compressão (Menor Arquivo)</option>
                        </select>
                    </div>
                    <p className="file-info-hint">Tamanho máximo recomendado: 500MB</p>
                </div>
            </div>
        </div>
    );
}

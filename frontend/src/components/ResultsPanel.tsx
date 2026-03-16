import FileCard from './FileCard';
import type { FileEntry } from '../types';

interface ResultsPanelProps {
    files: FileEntry[];
    onReset: () => void;
}

export default function ResultsPanel({ files, onReset }: ResultsPanelProps): React.JSX.Element {
    return (
        <div className="results">
            <h3 className="results__title">Arquivos Processados</h3>

            <div className="file-list">
                {files.map((file) => (
                    <FileCard key={file.id} file={file} />
                ))}
            </div>

            <button className="btn-reset" onClick={onReset}>
                Comprimir Mais Arquivos
            </button>
        </div>
    );
}

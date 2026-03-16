export type FileStatus = 'processing' | 'done' | 'error';

export type ViewType = 'upload' | 'results';

export interface FileEntry {
    id: number;
    name: string;
    originalSize: number;
    status: FileStatus;
    compressedSize: number | null;
    downloadUrl: string | null;
    error: string | null;
}

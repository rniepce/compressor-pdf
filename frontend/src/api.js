/**
 * API helper for communicating with the FastAPI backend.
 * In development, Vite proxies /upload to localhost:8080.
 */

export async function compressPdf(file, compressionLevel = 3) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('compression_level', compressionLevel);

    const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Erro ao comprimir arquivo');
    }

    const blob = await response.blob();
    return {
        blob,
        url: URL.createObjectURL(blob),
        compressedSize: blob.size,
    };
}

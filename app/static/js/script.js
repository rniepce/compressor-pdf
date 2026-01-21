document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const uploadSection = document.getElementById('upload-section');
    const processSection = document.getElementById('process-section');
    const resultSection = document.getElementById('result-section');

    // Elements for stats
    const originalSizeEl = document.getElementById('original-size');
    const compressedSizeEl = document.getElementById('compressed-size');
    const compressionRatioEl = document.getElementById('compression-ratio');
    const downloadBtn = document.getElementById('download-btn');
    const resetBtn = document.getElementById('reset-btn');

    // Drag & Drop events
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (fileInput.files.length) {
            handleFile(fileInput.files[0]);
        }
    });

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    async function handleFile(file) {
        if (file.type !== 'application/pdf') {
            alert('Por favor, envie apenas arquivos PDF.');
            return;
        }

        // Show processing state
        uploadSection.classList.add('hidden');
        processSection.classList.remove('hidden');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const compressionLevel = document.getElementById('compression-level').value;
            formData.append('compression_level', compressionLevel);

            const uploadResponse = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(errorData.detail || 'Erro ao processar arquivo');
            }

            const blob = await uploadResponse.blob();
            const compressedUrl = window.URL.createObjectURL(blob);

            // Stats Calculation
            const originalSize = file.size;
            const compressedSize = blob.size;
            const savings = ((originalSize - compressedSize) / originalSize) * 100;

            // Update UI
            originalSizeEl.textContent = formatBytes(originalSize);
            compressedSizeEl.textContent = formatBytes(compressedSize);
            compressionRatioEl.textContent = `${savings.toFixed(1)}%`;

            // Set download link
            downloadBtn.href = compressedUrl;
            downloadBtn.download = `compressed_${file.name}`;

            // Show Results
            processSection.classList.add('hidden');
            resultSection.classList.remove('hidden');

        } catch (error) {
            console.error(error);
            alert('Ocorreu um erro ao comprimir o arquivo. Tente novamente.');
            resetInterface();
        }
    }

    resetBtn.addEventListener('click', resetInterface);

    function resetInterface() {
        fileInput.value = '';
        resultSection.classList.add('hidden');
        processSection.classList.add('hidden');
        uploadSection.classList.remove('hidden');
    }
});

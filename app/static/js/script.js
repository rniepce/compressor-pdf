document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const uploadSection = document.getElementById('upload-section');
    const resultsContainer = document.getElementById('results-container');
    const fileListElement = document.getElementById('file-list');
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
            handleFiles(e.dataTransfer.files);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (fileInput.files.length) {
            handleFiles(fileInput.files);
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

    function createFileCard(file) {
        const card = document.createElement('div');
        card.className = 'file-card';
        card.innerHTML = `
            <div class="file-info">
                <span class="file-name">${file.name}</span>
                <span class="file-original-size">${formatBytes(file.size)}</span>
            </div>
            <div class="file-status">
                <div class="file-spinner"></div>
                <span class="status-text">Processando...</span>
            </div>
            <div class="file-actions hidden">
                <a href="#" class="btn-sm btn-success" download>Baixar</a>
                <span class="savings-tag"></span>
            </div>
        `;
        return card;
    }

    async function handleFiles(files) {
        // Switch to Results View
        uploadSection.classList.add('hidden');
        resultsContainer.classList.remove('hidden');

        const compressionLevel = document.getElementById('compression-level').value;

        Array.from(files).forEach(async (file) => {
            if (file.type !== 'application/pdf') {
                return; // Skip non-PDFs
            }

            const card = createFileCard(file);
            fileListElement.appendChild(card);

            await processFile(file, card, compressionLevel);
        });
    }

    async function processFile(file, card, compressionLevel) {
        const statusDiv = card.querySelector('.file-status');
        const actionsDiv = card.querySelector('.file-actions');
        const statusText = card.querySelector('.status-text');
        const downloadBtn = card.querySelector('a');
        const savingsTag = card.querySelector('.savings-tag');

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('compression_level', compressionLevel);

            const uploadResponse = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(errorData.detail || 'Erro');
            }

            const blob = await uploadResponse.blob();
            const compressedUrl = window.URL.createObjectURL(blob);

            // Stats
            const originalSize = file.size;
            const compressedSize = blob.size;
            const savings = ((originalSize - compressedSize) / originalSize) * 100;

            // Update Card UI
            statusDiv.classList.add('hidden');
            actionsDiv.classList.remove('hidden');

            // Update download link
            downloadBtn.href = compressedUrl;
            downloadBtn.download = `compressed_${file.name}`;

            // Show savings
            if (savings > 0) {
                savingsTag.textContent = `-${savings.toFixed(1)}%`;
                savingsTag.classList.add('tag-success');
            } else {
                savingsTag.textContent = `0%`;
                savingsTag.classList.add('tag-neutral');
            }

        } catch (error) {
            console.error(error);
            statusDiv.innerHTML = `<span class="error-msg">❌ Erro</span>`;
        }
    }

    resetBtn.addEventListener('click', () => {
        fileInput.value = '';
        fileListElement.innerHTML = ''; // Clear list
        resultsContainer.classList.add('hidden');
        uploadSection.classList.remove('hidden');
    });
});

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const folderInput = document.getElementById('folderInput');
const selectFilesBtn = document.getElementById('selectFilesBtn');
const selectFolderBtn = document.getElementById('selectFolderBtn');
const uploadProgress = document.getElementById('uploadProgress');
const progressBar = uploadProgress.querySelector('.progress-bar');
const fileListPanel = document.getElementById('fileListPanel');
const fileList = document.getElementById('fileList');
const fileCount = document.getElementById('fileCount');
const clearFilesBtn = document.getElementById('clearFilesBtn');
const convertBtn = document.getElementById('convertBtn');
const resultsPanel = document.getElementById('resultsPanel');
const resultsGrid = document.getElementById('resultsGrid');
const resultsStats = document.getElementById('resultsStats');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingSub = document.getElementById('loadingSub');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const dpiSelect = document.getElementById('dpi');
const cropToggle = document.getElementById('crop');

let currentSessionId = null;
let selectedFiles = [];

const SUPPORTED_EXTENSIONS = ['.pdf', '.zip', '.rar', '.7z', '.tar', '.gz', '.tgz'];

selectFilesBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
});

selectFolderBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    folderInput.click();
});

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    
    const items = e.dataTransfer.items;
    const files = [];
    
    if (items) {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file') {
                const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
                if (entry) {
                    traverseEntry(entry, files);
                } else {
                    const file = item.getAsFile();
                    if (isSupportedFile(file.name)) {
                        files.push(file);
                    }
                }
            }
        }
    } else {
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
            const file = e.dataTransfer.files[i];
            if (isSupportedFile(file.name)) {
                files.push(file);
            }
        }
    }
    
    if (files.length > 0) {
        addFiles(files);
    }
});

function traverseEntry(entry, files) {
    if (entry.isFile) {
        entry.file((file) => {
            if (isSupportedFile(file.name)) {
                files.push(file);
                if (files.length === 1) {
                    addFiles(files);
                } else {
                    updateFileList();
                }
            }
        });
    } else if (entry.isDirectory) {
        const reader = entry.createReader();
        reader.readEntries((entries) => {
            entries.forEach((e) => traverseEntry(e, files));
        });
    }
}

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        addFiles(Array.from(e.target.files));
    }
});

folderInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        const files = Array.from(e.target.files).filter(f => isSupportedFile(f.name));
        if (files.length > 0) {
            addFiles(files);
        }
    }
});

function isSupportedFile(filename) {
    const ext = '.' + filename.split('.').pop().toLowerCase();
    return SUPPORTED_EXTENSIONS.includes(ext);
}

function addFiles(files) {
    files.forEach(file => {
        const exists = selectedFiles.some(f => f.name === file.name && f.size === file.size);
        if (!exists) {
            selectedFiles.push(file);
        }
    });
    updateFileList();
}

function updateFileList() {
    if (selectedFiles.length === 0) {
        fileListPanel.style.display = 'none';
        return;
    }
    
    fileListPanel.style.display = 'block';
    fileCount.textContent = selectedFiles.length;
    
    fileList.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-item';
        
        const ext = file.name.split('.').pop().toLowerCase();
        const icon = getFileIcon(ext);
        
        item.innerHTML = `
            <div class="file-icon">${icon}</div>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
            </div>
            <button class="file-remove" data-index="${index}">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
        `;
        
        fileList.appendChild(item);
    });
    
    fileList.querySelectorAll('.file-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            selectedFiles.splice(index, 1);
            updateFileList();
        });
    });
}

function getFileIcon(ext) {
    if (ext === 'pdf') {
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 4C4 2.89543 4.89543 2 6 2H14L20 8V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            <path d="M14 2V8H20" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            <path d="M8 13H16M8 17H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>`;
    }
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M4 4C4 2.89543 4.89543 2 6 2H14L20 8V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M14 2V8H20" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M9 14L12 11L15 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 11V17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

clearFilesBtn.addEventListener('click', () => {
    selectedFiles = [];
    updateFileList();
    fileInput.value = '';
    folderInput.value = '';
});

convertBtn.addEventListener('click', () => {
    if (selectedFiles.length > 0) {
        uploadFiles(selectedFiles);
    }
});

async function uploadFiles(files) {
    const formData = new FormData();
    
    files.forEach(file => {
        formData.append('files', file);
    });
    
    formData.append('dpi', dpiSelect.value);
    formData.append('crop', cropToggle.checked);
    
    loadingOverlay.classList.add('active');
    loadingSub.textContent = `Processing ${files.length} file(s)...`;
    
    uploadProgress.classList.add('active');
    progressBar.style.width = '0%';
    
    try {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                progressBar.style.width = percentComplete + '%';
            }
        });
        
        const response = await new Promise((resolve, reject) => {
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        resolve(JSON.parse(xhr.responseText));
                    } catch (e) {
                        reject(new Error('Invalid JSON response'));
                    }
                } else {
                    try {
                        const errorData = JSON.parse(xhr.responseText);
                        reject(new Error(errorData.error || 'Upload failed'));
                    } catch (e) {
                        reject(new Error('Upload failed'));
                    }
                }
            };
            xhr.onerror = () => reject(new Error('Network error'));
            xhr.onabort = () => reject(new Error('Upload cancelled'));
            
            xhr.open('POST', '/convert');
            xhr.send(formData);
        });
        
        uploadProgress.classList.remove('active');
        loadingOverlay.classList.remove('active');
        
        if (response.success) {
            currentSessionId = response.session_id;
            displayResults(response.files, response.total_pdfs);
            showNotification(`Converted ${response.total_pdfs} PDF(s), ${response.total_pages} page(s)`, 'success');
            selectedFiles = [];
            updateFileList();
            fileInput.value = '';
            folderInput.value = '';
        } else {
            throw new Error(response.error || 'Conversion failed');
        }
        
    } catch (error) {
        uploadProgress.classList.remove('active');
        loadingOverlay.classList.remove('active');
        showNotification(error.message, 'error');
    }
}

function displayResults(files, totalPdfs) {
    resultsGrid.innerHTML = '';
    resultsPanel.style.display = 'block';
    
    resultsStats.innerHTML = `
        <div class="stat-item">
            <span class="stat-value">${totalPdfs}</span>
            <span class="stat-label">PDF${totalPdfs > 1 ? 's' : ''}</span>
        </div>
        <div class="stat-item">
            <span class="stat-value">${files.length}</span>
            <span class="stat-label">Image${files.length > 1 ? 's' : ''}</span>
        </div>
    `;
    
    files.forEach((file, index) => {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.style.animationDelay = `${index * 0.05}s`;
        
        const sourceLabel = file.source ? `<div class="result-source">From: ${file.source}</div>` : '';
        
        card.innerHTML = `
            <div class="result-preview">
                <img src="/preview/${currentSessionId}/${file.name}" alt="${file.name}" loading="lazy">
            </div>
            <div class="result-info">
                <div class="result-name" title="${file.name}">${file.name}</div>
                ${sourceLabel}
                <div class="result-actions">
                    <button class="btn-action" onclick="previewImage('${currentSessionId}', '${file.name}')">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M2 8C2 8 4 3 8 3C12 3 14 8 14 8C14 8 12 13 8 13C4 13 2 8 2 8Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                        Preview
                    </button>
                    <button class="btn-action primary" onclick="downloadFile('${currentSessionId}', '${file.name}')">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 2V11M8 11L4 7M8 11L12 7M2 14H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Download
                    </button>
                </div>
            </div>
        `;
        
        resultsGrid.appendChild(card);
    });
    
    resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function previewImage(sessionId, filename) {
    const url = `/preview/${sessionId}/${filename}`;
    window.open(url, '_blank');
}

function downloadFile(sessionId, filename) {
    const url = `/download/${sessionId}/${filename}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

downloadAllBtn.addEventListener('click', () => {
    if (currentSessionId) {
        const url = `/download_all/${currentSessionId}`;
        const a = document.createElement('a');
        a.href = url;
        a.download = 'converted_images.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
});

function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 12px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #00f5d4 0%, #00b894 100%)' : 
                     type === 'error' ? 'linear-gradient(135deg, #e056fd 0%, #be2edd 100%)' : 
                     'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
        color: white;
        font-weight: 500;
        z-index: 1001;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);
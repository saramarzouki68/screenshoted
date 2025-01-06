document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('screenshotForm');
    const preview = document.getElementById('preview');
    const previewImage = document.getElementById('previewImage');
    const loading = document.getElementById('loading');
    const downloadBtn = document.getElementById('downloadBtn');
    const showImageBtn = document.getElementById('showImageBtn');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const lightbox = document.getElementById('screenshotLightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxClose = document.querySelector('.lightbox-close');

    // Hide preview and lightbox initially
    preview.classList.add('d-none');
    imagePreviewContainer.classList.add('d-none');
    lightbox.style.display = 'none';

    // Show/Hide image preview
    showImageBtn.addEventListener('click', () => {
        imagePreviewContainer.classList.toggle('d-none');
        showImageBtn.textContent = imagePreviewContainer.classList.contains('d-none') 
            ? 'Show Image' 
            : 'Hide Image';
        
        // Show lightbox when showing image
        if (!imagePreviewContainer.classList.contains('d-none')) {
            lightbox.style.display = 'block';
            document.body.classList.add('lightbox-open');
        } else {
            lightbox.style.display = 'none';
            document.body.classList.remove('lightbox-open');
        }
    });

    // Close lightbox
    lightboxClose.addEventListener('click', () => {
        lightbox.style.display = 'none';
        imagePreviewContainer.classList.add('d-none');
        showImageBtn.textContent = 'Show Image';
        document.body.classList.remove('lightbox-open');
    });

    // Close lightbox when clicking outside
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.style.display = 'none';
            imagePreviewContainer.classList.add('d-none');
            showImageBtn.textContent = 'Show Image';
            document.body.classList.remove('lightbox-open');
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            loading.classList.remove('d-none');
            preview.classList.add('d-none');
            imagePreviewContainer.classList.add('d-none');
            showImageBtn.textContent = 'Show Image';

            const formData = new FormData(form);
            const url = formData.get('url');
            
            // Prepare viewport data
            const viewport = {
                width: 1920,
                height: 1080
            };

            const requestData = {
                url: url.startsWith('http') ? url : `https://${url.trim()}`,
                format: formData.get('format') || 'png',
                viewport: viewport,
                quality: parseInt(formData.get('quality')) || 80,
                fullPage: formData.get('fullPage') === 'on',
                deviceScaleFactor: 1
            };

            const response = await fetch('/api/screenshot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Screenshot generation failed');
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);

            previewImage.src = objectUrl;
            lightboxImage.src = objectUrl;

            downloadBtn.onclick = () => {
                const a = document.createElement('a');
                a.href = objectUrl;
                a.download = `screenshot.${requestData.format}`;
                a.click();
            };

            preview.classList.remove('d-none');
            imagePreviewContainer.classList.add('d-none');
            showImageBtn.textContent = 'Show Image';

        } catch (error) {
            console.error('Screenshot error:', error);
            alert(`Failed to generate screenshot: ${error.message}`);
        } finally {
            loading.classList.add('d-none');
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.style.display === 'block') {
            lightbox.style.display = 'none';
            imagePreviewContainer.classList.add('d-none');
            showImageBtn.textContent = 'Show Image';
            document.body.classList.remove('lightbox-open');
        }
    });
}); 
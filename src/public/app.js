document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('screenshotForm');
    const preview = document.getElementById('preview');
    const previewImage = document.getElementById('previewImage');
    const loading = document.getElementById('loading');
    const downloadBtn = document.getElementById('downloadBtn');
    const qualityInput = document.getElementById('quality');
    const qualityValue = document.querySelector('.quality-value');
    const showImageBtn = document.getElementById('showImageBtn');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const lightbox = document.getElementById('screenshotLightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxClose = document.querySelector('.lightbox-close');

    // Update quality value display
    qualityInput.addEventListener('input', (e) => {
        qualityValue.textContent = `${e.target.value}%`;
    });

    const viewportSizes = {
        desktop: { width: 1920, height: 1080, scale: 1 },
        tablet: { 
            width: 750,   // Updated tablet width to 750
            height: 2048, // Tablet height for full-page
            scale: 2 
        },
        mobile: { 
            width: 503,   // Mobile width
            height: 1334, // Mobile height for full-page
            scale: 3 
        }
    };

    showImageBtn.addEventListener('click', () => {
        imagePreviewContainer.classList.toggle('d-none');
        showImageBtn.textContent = imagePreviewContainer.classList.contains('d-none') 
            ? 'Show Image' 
            : 'Hide Image';
    });

    // Show image in lightbox
    showImageBtn.addEventListener('click', () => {
        const imageUrl = previewImage.src;
        if (imageUrl) {
            lightboxImage.src = imageUrl;
            lightbox.style.display = 'block';
            document.body.classList.add('lightbox-open');
            
            // Reset zoom when opening lightbox
            scale = 1;
            lightboxImage.style.transform = `scale(${scale})`;
        }
    });

    // Close lightbox
    lightboxClose.addEventListener('click', () => {
        lightbox.style.display = 'none';
        document.body.classList.remove('lightbox-open');
    });

    // Close lightbox when clicking outside the image
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.style.display = 'none';
            document.body.classList.remove('lightbox-open');
        }
    });

    // Add zoom functionality to lightbox
    let scale = 1;
    let isDragging = false;
    let startX, startY, scrollLeft, scrollTop;

    lightboxImage.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = lightboxImage.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate zoom
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.min(Math.max(0.5, scale + delta), 5); // Allow more zoom

        // Calculate offset to zoom towards mouse position
        const scaleChange = newScale - scale;
        const offsetX = (mouseX - rect.width / 2) * scaleChange;
        const offsetY = (mouseY - rect.height / 2) * scaleChange;

        scale = newScale;

        // Apply transform with high-quality scaling
        lightboxImage.style.transform = `scale3d(${scale}, ${scale}, 1)`;
        lightboxImage.style.transformOrigin = 'center center';
        
        // Adjust scroll position
        container.scrollLeft += offsetX;
        container.scrollTop += offsetY;
    });

    // Add drag functionality
    const container = lightboxImage.parentElement;

    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.pageX - container.offsetLeft;
        startY = e.pageY - container.offsetTop;
        scrollLeft = container.scrollLeft;
        scrollTop = container.scrollTop;
    });

    container.addEventListener('mouseleave', () => {
        isDragging = false;
    });

    container.addEventListener('mouseup', () => {
        isDragging = false;
    });

    container.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const y = e.pageY - container.offsetTop;
        const walkX = (x - startX) * 2;
        const walkY = (y - startY) * 2;
        container.scrollLeft = scrollLeft - walkX;
        container.scrollTop = scrollTop - walkY;
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.style.display === 'block') {
            lightbox.style.display = 'none';
            document.body.classList.remove('lightbox-open');
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            // Add validation
            form.classList.add('was-validated');
            if (!form.checkValidity()) {
                return;
            }

            // Get form data
            const formData = new FormData(form);
            const url = formData.get('url');
            const format = formData.get('format');
            const viewportType = formData.get('viewport');
            const viewport = viewportSizes[viewportType];
            const quality = parseInt(formData.get('quality'));
            const fullPage = formData.get('fullPage') === 'on';
            const blockAds = formData.get('blockAds') === 'on';
            const blockCookies = formData.get('blockCookies') === 'on';

            // Adjust viewport based on device and full page setting
            const adjustedViewport = {
                width: viewport.width,
                height: fullPage ? viewport.height : Math.min(viewport.height, window.innerHeight)
            };

            // Show loading state
            loading.classList.remove('d-none');
            preview.classList.add('d-none');
            imagePreviewContainer.classList.add('d-none');
            showImageBtn.textContent = 'Show Image';

            // Make the request
            const response = await fetch('/api/screenshot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url,
                    format,
                    viewport: adjustedViewport,
                    deviceScaleFactor: viewport.scale,
                    quality,
                    fullPage,
                    blockAds,
                    blockCookies
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Screenshot generation failed');
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);

            // Update both preview and lightbox images
            previewImage.src = objectUrl;
            lightboxImage.src = objectUrl;

            // Setup download button
            downloadBtn.onclick = () => {
                const a = document.createElement('a');
                a.href = objectUrl;
                a.download = `screenshot.${format}`;
                a.click();
            };

            preview.classList.remove('d-none');

        } catch (error) {
            console.error('Screenshot error:', error);
            alert(`Failed to generate screenshot: ${error.message}`);
        } finally {
            loading.classList.add('d-none');
        }
    });

    // Add image quality enhancement on load
    previewImage.addEventListener('load', () => {
        previewImage.style.imageRendering = 'crisp-edges';
    });

    lightboxImage.addEventListener('load', () => {
        lightboxImage.style.imageRendering = 'crisp-edges';
    });
}); 
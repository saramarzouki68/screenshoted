const puppeteer = require('puppeteer');
const sharp = require('sharp');

class ScreenshotService {
    constructor() {
        this.browserPromise = null;
    }

    async getBrowser() {
        try {
            if (!this.browserPromise) {
                this.browserPromise = puppeteer.launch({
                    headless: 'new',
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu',
                        '--disable-web-security',
                        '--disable-features=site-per-process',
                        '--disable-features=IsolateOrigins',
                    ],
                    ignoreHTTPSErrors: true,
                });
            }
            return this.browserPromise;
        } catch (error) {
            console.error('Browser launch error:', error);
            throw new Error('Failed to launch browser');
        }
    }

    async capture({
        url,
        format = 'png',
        viewport = { width: 1920, height: 1080 },
        fullPage = false,
        quality = 80,
        deviceScaleFactor = 1
    }) {
        let page = null;
        let browser = null;

        try {
            console.log('Starting capture with params:', {
                url,
                format,
                viewport,
                fullPage,
                quality,
                deviceScaleFactor
            });

            browser = await this.getBrowser();
            page = await browser.newPage();

            // Set high DPI viewport for better quality
            await page.setViewport({
                width: viewport.width,
                height: viewport.height,
                deviceScaleFactor: Math.max(deviceScaleFactor * 2, 4),
                isMobile: viewport.width <= 503, // Mobile detection at 503px
                hasTouch: viewport.width <= 750  // Update tablet touch detection to 750px
            });

            // Basic error handling
            page.on('error', err => console.error('Page error:', err));
            page.on('pageerror', err => console.error('Page error:', err));
            page.on('console', msg => console.log('Page console:', msg.text()));

            // Disable unnecessary features
            await page.setJavaScriptEnabled(true);
            await page.setCacheEnabled(false);

            console.log('Navigating to URL:', url);
            const response = await page.goto(url, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });

            if (!response) {
                throw new Error('Failed to get response from page');
            }

            console.log('Page loaded, taking screenshot');
            const screenshot = await page.screenshot({
                fullPage,
                type: format,
                quality: format === 'jpeg' ? Math.min(quality + 20, 100) : undefined,
                encoding: 'binary'
            });

            console.log('Processing screenshot');
            const optimizedImage = await sharp(screenshot)
                .resize(viewport.width * deviceScaleFactor, null, {
                    fit: fullPage ? 'contain' : 'inside',
                    withoutEnlargement: false,
                    kernel: sharp.kernel.lanczos3,
                    fastShrinkOnLoad: false
                })
                .sharpen({
                    sigma: 1,
                    m1: 0.5,
                    m2: 0.3,
                    x1: 2,
                    y2: 10,
                    y3: 20
                })
                [format === 'png' ? 'png' : 'jpeg']({
                    quality: format === 'png' ? 100 : Math.min(quality + 20, 100),
                    progressive: true,
                    force: true,
                    compressionLevel: format === 'png' ? 9 : undefined,
                    adaptiveFiltering: true,
                    palette: false
                })
                .toBuffer();

            console.log('Screenshot captured successfully');
            return optimizedImage;

        } catch (error) {
            console.error('Detailed capture error:', error);
            throw error;
        } finally {
            if (page) {
                await page.close().catch(console.error);
            }
        }
    }

    async cleanup() {
        if (this.browserPromise) {
            try {
                const browser = await this.browserPromise;
                await browser.close();
                this.browserPromise = null;
            } catch (error) {
                console.error('Error during cleanup:', error);
            }
        }
    }
}

module.exports = new ScreenshotService(); 
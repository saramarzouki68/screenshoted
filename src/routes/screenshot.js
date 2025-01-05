const express = require('express');
const { body, query, validationResult } = require('express-validator');
const screenshotService = require('../services/screenshotService');

const router = express.Router();

// Validation middleware
const validateScreenshotRequest = [
    body('url').isURL().withMessage('Invalid URL provided'),
    body('format').optional().isIn(['png', 'jpeg']).withMessage('Invalid format'),
    body('viewport').optional().isObject().withMessage('Invalid viewport settings'),
    body('quality').optional().isInt({ min: 1, max: 100 }).withMessage('Quality must be between 1 and 100'),
    body('delay').optional().isInt({ min: 0, max: 10000 }).withMessage('Delay must be between 0 and 10000ms'),
    body('deviceScaleFactor').optional().isFloat({ min: 1, max: 4 })
        .withMessage('Scale factor must be between 1 and 4'),
];

router.post('/', validateScreenshotRequest, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            url,
            format = 'png',
            viewport = { width: 1920, height: 1080 },
            fullPage = false,
            quality = 80,
            deviceScaleFactor = 1
        } = req.body;

        console.log('Processing screenshot request:', { url, format, viewport });

        const screenshot = await screenshotService.capture({
            url,
            format,
            viewport,
            fullPage,
            quality,
            deviceScaleFactor
        });

        console.log('Screenshot generated successfully');
        res.setHeader('Content-Type', `image/${format}`);
        res.setHeader('Cache-Control', 'no-store');
        res.send(screenshot);

    } catch (error) {
        console.error('Screenshot route error:', {
            message: error.message,
            stack: error.stack,
            url: req.body?.url
        });
        
        res.status(500).json({
            status: 'error',
            message: 'Screenshot generation failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 
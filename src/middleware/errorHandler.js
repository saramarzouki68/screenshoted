const errorHandler = (err, req, res, next) => {
    console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        url: req.body?.url
    });

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Send more detailed error response
    res.status(statusCode).json({
        status: 'error',
        message,
        details: process.env.NODE_ENV === 'development' ? {
            stack: err.stack,
            url: req.body?.url
        } : undefined
    });
};

module.exports = errorHandler; 
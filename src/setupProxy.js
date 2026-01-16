const path = require('path');

/**
 * Development proxy to serve Vercel serverless functions locally
 * This allows `npm start` to work with /api/* routes
 */
module.exports = function(app) {
  // Handle all /api/* routes
  app.use('/api', async (req, res, next) => {
    // Extract the function name from the URL
    const urlPath = req.path.replace(/^\//, '');
    const functionName = urlPath.split('/')[0] || 'index';

    // Path to the serverless function
    const functionPath = path.join(__dirname, '..', 'api', `${functionName}.js`);

    try {
      // Clear require cache to allow hot reloading
      delete require.cache[require.resolve(functionPath)];

      // Load the serverless function
      const handler = require(functionPath);

      // Parse JSON body if present
      if (req.headers['content-type']?.includes('application/json') && !req.body) {
        let body = '';
        req.on('data', chunk => body += chunk);
        await new Promise(resolve => req.on('end', resolve));
        try {
          req.body = JSON.parse(body);
        } catch (e) {
          req.body = {};
        }
      }

      // Call the handler
      await handler(req, res);
    } catch (error) {
      console.error(`Error loading API function ${functionName}:`, error.message);

      // Check if it's a module not found error
      if (error.code === 'MODULE_NOT_FOUND') {
        res.status(404).json({
          success: false,
          message: `API endpoint /${functionName} not found`
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          error: error.message
        });
      }
    }
  });
};

/**
 * Send a standardized success response
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = {}) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  };
  
  /**
   * Send a standardized error response
   */
  const sendError = (res, statusCode = 500, message = 'Internal Server Error') => {
    return res.status(statusCode).json({
      success: false,
      message
    });
  };
  
  /**
   * Global Express error handler middleware
   */
  const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Something went wrong'
    });
  };
  
  module.exports = { sendSuccess, sendError, errorHandler };
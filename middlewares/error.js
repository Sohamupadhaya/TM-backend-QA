const errorMiddleware = (err, req, res, next) => {
  const status = err.status || 500;
  const sanitizedError = {
    success: false,
    status,
    message: err.message || 'Something went wrong',
    stack: process.env.NODE_ENV === 'development' ? err.stack : {}
  };
  
  res.status(status).json(sanitizedError);
};

export default errorMiddleware;

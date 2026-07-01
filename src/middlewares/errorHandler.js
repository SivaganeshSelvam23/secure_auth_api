export const errorHandler = (error, req, res, next) => {
  console.log("Application error:", error);
  return res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
};

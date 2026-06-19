//Loads the Express package.
import express from "express";

//This creates the Express application.
const app = express();

//This allows Express to read JSON request bodies.
app.use(express.json());

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "secure auth api is running.",
  });
});

export default app;

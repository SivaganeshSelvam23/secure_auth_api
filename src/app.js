//Loads the Express package.
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
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

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

export default app;

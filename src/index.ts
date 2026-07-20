import express, { Express } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Import routes
import authRoutes from "./routes/auth";
import linksRoutes from "./routes/links";
import commissionsRoutes from "./routes/commissions";
import redirectRoutes from "./routes/redirect";

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Da-All-Seeing-Affiliate API is running" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/links", linksRoutes);
app.use("/api/commissions", commissionsRoutes);
app.use("/go", redirectRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUrl = process.env.MONGODB_URI || "mongodb://localhost:27017/affiliate-marketing";
    
    await mongoose.connect(mongoUrl);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`💰 Earnings Tracking: http://localhost:${PORT}/api/commissions/earnings`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;

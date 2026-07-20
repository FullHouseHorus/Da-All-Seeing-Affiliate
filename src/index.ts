import express, { Express } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Import routes
import authRoutes from "./routes/auth";
import linksRoutes from "./routes/links";
import commissionsRoutes from "./routes/commissions";
import redirectRoutes from "./routes/redirect";
import productsRoutes from "./routes/products";
import discountsRoutes from "./routes/discounts";
import socialRoutes from "./routes/social";

// Import scheduler
import { SocialMediaScheduler } from "./scheduler/socialMediaScheduler";

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
  const schedulerStatus = SocialMediaScheduler.getStatus();
  res.json({
    status: "ok",
    message: "Da-All-Seeing-Affiliate API is running",
    scheduler: schedulerStatus,
    timestamp: new Date(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/links", linksRoutes);
app.use("/api/commissions", commissionsRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/discounts", discountsRoutes);
app.use("/api/social", socialRoutes);
app.use("/go", redirectRoutes);

// Scheduler status
app.get("/scheduler/status", (req, res) => {
  res.json(SocialMediaScheduler.getStatus());
});

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

    // Initialize schedulers
    SocialMediaScheduler.initializeScheduler();

    app.listen(PORT, () => {
      console.log(`\n🚀 DA-ALL-SEEING-AFFILIATE - RUNNING 24/7\n`);
      console.log(`📊 API Base URL: http://localhost:${PORT}/api`);
      console.log(`💰 Affiliate Links: http://localhost:${PORT}/api/links`);
      console.log(`🎁 Discount Links: http://localhost:${PORT}/api/discounts`);
      console.log(`📋 Products: http://localhost:${PORT}/api/products`);
      console.log(`💳 Commission Tracking: http://localhost:${PORT}/api/commissions/earnings`);
      console.log(`📱 Social Media Auto-Post: http://localhost:${PORT}/api/social`);
      console.log(`\n📄 Schedule Status: http://localhost:${PORT}/scheduler/status`);
      console.log(`\n🌟 Active Hours: 4:00 AM - 11:59 PM (20 hours/day)");
      console.log(`😴 Maintenance: 12:00 AM - 3:59 AM\n`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;

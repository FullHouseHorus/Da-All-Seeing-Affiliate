import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.userId = (decoded as any).id;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

export const generateToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || "secret", {
    expiresIn: "7d",
  });
};

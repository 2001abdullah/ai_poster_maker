import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type AuthRequest = Request & { userId?: string };

export function requireAuth(secret: string) {
  return (request: AuthRequest, response: Response, next: NextFunction) => {
    const token = request.cookies?.poster_session;
    if (!token) return response.status(401).json({ error: "Authentication required" });
    try {
      const payload = jwt.verify(token, secret);
      if (typeof payload !== "object" || typeof payload.sub !== "string") return response.status(401).json({ error: "Invalid session" });
      request.userId = payload.sub;
      return next();
    } catch {
      return response.status(401).json({ error: "Session expired or invalid" });
    }
  };
}
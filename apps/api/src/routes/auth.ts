import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/user";
import { AuthRequest, requireAuth } from "../middleware/auth";

const registerSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.email().max(254), password: z.string().min(10).max(128) }).strict();
const loginSchema = z.object({ email: z.email().max(254), password: z.string().min(1).max(128) }).strict();

export function authRouter(secret: string, expiresIn: string, production: boolean) {
  const router = Router();
  const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Too many attempts. Try again later." } });
  const cookieOptions = { httpOnly: true, secure: production, sameSite: "lax" as const, path: "/", maxAge: 7 * 24 * 60 * 60 * 1000 };

  router.post("/register", authLimit, async (request, response, next) => {
    try {
      const input = registerSchema.safeParse(request.body);
      if (!input.success) return response.status(400).json({ error: "Invalid registration details", details: input.error.flatten() });
      const email = input.data.email.toLowerCase();
      if (await User.exists({ email })) return response.status(409).json({ error: "An account with this email already exists" });
      const passwordHash = await bcrypt.hash(input.data.password, 12);
      const user = await User.create({ name: input.data.name, email, passwordHash });
      const token = jwt.sign({}, secret, { subject: String(user._id), expiresIn: expiresIn as jwt.SignOptions["expiresIn"] });
      response.cookie("poster_session", token, cookieOptions);
      return response.status(201).json({ user: { id: String(user._id), name: user.name, email: user.email } });
    } catch (error) { return next(error); }
  });

  router.post("/login", authLimit, async (request, response, next) => {
    try {
      const input = loginSchema.safeParse(request.body);
      if (!input.success) return response.status(400).json({ error: "Invalid email or password" });
      const user = await User.findOne({ email: input.data.email.toLowerCase() }).select("+passwordHash");
      if (!user || !(await bcrypt.compare(input.data.password, user.passwordHash))) return response.status(401).json({ error: "Invalid email or password" });
      const token = jwt.sign({}, secret, { subject: String(user._id), expiresIn: expiresIn as jwt.SignOptions["expiresIn"] });
      response.cookie("poster_session", token, cookieOptions);
      return response.json({ user: { id: String(user._id), name: user.name, email: user.email } });
    } catch (error) { return next(error); }
  });

  router.post("/logout", (_request, response) => response.clearCookie("poster_session", { httpOnly: true, secure: production, sameSite: "lax", path: "/" }).status(204).end());
  router.get("/me", requireAuth(secret), async (request: AuthRequest, response, next) => {
    try {
      const user = await User.findById(request.userId).select("name email");
      if (!user) return response.status(401).json({ error: "Account not found" });
      return response.json({ user: { id: String(user._id), name: user.name, email: user.email } });
    } catch (error) { return next(error); }
  });
  return router;
}
// routes/api.js
import express from "express";
import authRoutes from "./authRoutes.js"; // 👈 Register/Login
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use("/", authRoutes); // 👈 handles /register and /login

router.get("/profile", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

export default router;

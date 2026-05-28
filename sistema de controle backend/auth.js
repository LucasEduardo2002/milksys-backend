import dotenv from "dotenv";
dotenv.config();
import express from "express";
import bcrypt from "bcrypt";
import { db } from "./db.js";

const router = express.Router();

const AUTH_USER = process.env.AUTH_USER ?? "admin";
const AUTH_PASSWORD = process.env.AUTH_PASSWORD ?? "admin123";

const getUserByUsername = async (username) => {
  const [rows] = await db.query(
    "SELECT id, username, password_hash, is_active FROM users WHERE username = ? LIMIT 1",
    [username]
  );

  return rows[0] ?? null;
};

const setSessionUser = (req, user) => {
  req.session.user = {
    userId: user.id ?? null,
    username: user.username,
  };
};

export const requireAuth = (req, res, next) => {
  if (req.session?.user?.username) {
    req.auth = req.session.user;
    return next();
  }

  return res.status(401).json({ message: "Não autenticado." });
};

router.post("/login", async (req, res) => {
  const username = String(req.body?.username ?? "").trim();
  const password = String(req.body?.password ?? "");

  if (!username || !password) {
    return res.status(400).json({ message: "Informe usuário e senha." });
  }

  try {
    const user = await getUserByUsername(username);

    if (user?.is_active) {
      const isValid = await bcrypt.compare(password, user.password_hash);

      if (isValid) {
        return req.session.regenerate((err) => {
          if (err) {
            console.error("Erro ao regenerar sessão:", err);
            return res.status(500).json({ message: "Não foi possível iniciar a sessão." });
          }

          setSessionUser(req, user);

          return res.json({
            user: {
              username: user.username,
            },
          });
        });
      }
    }
  } catch (err) {
    console.error("Erro ao autenticar via DB:", err);
  }

  if (username === AUTH_USER && password === AUTH_PASSWORD) {
    return req.session.regenerate((err) => {
      if (err) {
        console.error("Erro ao regenerar sessão do fallback:", err);
        return res.status(500).json({ message: "Não foi possível iniciar a sessão." });
      }

      setSessionUser(req, { username, id: null });

      return res.json({
        user: {
          username,
        },
      });
    });
  }

  return res.status(401).json({ message: "Credenciais inválidas." });
});

router.get("/me", (req, res) => {
  if (req.session?.user?.username) {
    return res.json({ user: { username: req.session.user.username } });
  }

  return res.status(401).json({ message: "Não autenticado." });
});

router.post("/logout", (req, res) => {
  if (!req.session) {
    return res.json({ message: "Logout realizado com sucesso." });
  }

  req.session.destroy((err) => {
    if (err) {
      console.error("Erro ao destruir sessão:", err);
      return res.status(500).json({ message: "Não foi possível encerrar a sessão." });
    }

    res.clearCookie(process.env.SESSION_COOKIE_NAME ?? "sid");
    return res.json({ message: "Logout realizado com sucesso." });
  });
});

export default router;
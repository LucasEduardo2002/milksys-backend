import express from "express";
import { db } from "../db.js";

const router = express.Router();

// Listar todos
router.get("/", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM produtores");
  res.json(rows);
});

// Criar novo

router.post("/", async (req, res) => {
  const { nome, cpfCnpj, telefone, localidade, tipo, status } = req.body;

  try {
    // 1. Verificar se o CPF/CNPJ já existe
    const [existingProdutor] = await db.query(
      "SELECT id FROM produtores WHERE cpfCnpj = ?",
      [cpfCnpj]
    );

    if (existingProdutor.length > 0) {
      // Se existir, retorne um erro 409 (Conflict) com uma mensagem
      return res.status(409).json({ message: "CPF/CNPJ já cadastrado." });
    }

    // 2. Se não existir, insira o novo produtor
    await db.query(
      "INSERT INTO produtores (nome, cpfCnpj, telefone, localidade, tipo, status) VALUES (?, ?, ?, ?, ?, ?)",
      [nome, cpfCnpj, telefone, localidade, tipo, status]
    );

    res.status(201).json({ message: "Produtor cadastrado!" });
  } catch (error) {
    console.error("Erro ao cadastrar produtor:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// Atualizar
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, cpfCnpj, telefone, localidade, tipo, status } = req.body;
  await db.query(
    "UPDATE produtores SET nome=?, cpfCnpj=?, telefone=?, localidade=?, tipo=?, status=? WHERE id=?",
    [nome, cpfCnpj, telefone, localidade, tipo, status, id]
  );
  res.json({ message: "Produtor atualizado!" });
});

// Deletar
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await db.query("DELETE FROM produtores WHERE id=?", [id]);
  res.json({ message: "Produtor deletado!" });
});

export default router;

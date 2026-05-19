import express from "express";
import { db } from "../db.js";

const router = express.Router();

// Listar todas as coletas
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM coletas ORDER BY data DESC, id DESC");
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar coletas:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// Rota para buscar coletas por data (para o Painel Recepção)
router.get("/por-data", async (req, res) => {
  try {
    const data = req.query.date || new Date().toISOString().split('T')[0];
    const [rows] = await db.query("SELECT * FROM coletas WHERE data = ? ORDER BY id DESC", [data]);
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar coletas por data:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// VVV CORREÇÃO DEFINITIVA DA ROTA DE CRIAÇÃO VVV
router.post("/", async (req, res) => {
  // Define um valor padrão '-' para todos os campos que podem não ser enviados
  const {
    nome, tanque, data, acidez,
    densidade = '-', gordura = '-', ESD = '-', EST = '-',
    proteina = '-', crioscopia = '-', lactose = '-', alizarol = '-',
    amido = '-', sacar = '-', observacoes = '-', analista = '-'
  } = req.body;
  let { leite_bom_qnt = 0 } = req.body;
  if (typeof leite_bom_qnt === 'string') {
    leite_bom_qnt = leite_bom_qnt.replace(/\./g, '').replace(',', '.');
  }
  if (!nome || !tanque || !data || !acidez) {
    return res.status(400).json({ message: "Nome, tanque, data e acidez são obrigatórios." });
  }

  try {
    await db.query(
      `INSERT INTO coletas (nome, tanque, data, acidez, densidade, gordura, ESD, EST, proteina, crioscopia, lactose, alizarol, amido, sacar, observacoes, analista, leite_bom_qnt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nome, tanque || '-', data, acidez, densidade, gordura, ESD, EST, proteina, crioscopia, lactose, alizarol, amido, sacar, observacoes, analista, leite_bom_qnt]
    );
    res.status(201).json({ message: "Coleta registrada!" });
  } catch (error) {
    console.error("Erro ao salvar coleta:", error);
    res.status(500).json({ message: "Erro ao salvar a coleta." });
  }
});

// Atualizar coleta 
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    nome, tanque, data, acidez, densidade, gordura,
    ESD, EST, proteina, crioscopia, lactose, alizarol,
    amido, sacar, observacoes, analista
  } = req.body;

  // --- TRATAMENTO DO MILHAR ---
  let { leite_bom_qnt } = req.body;
  if (typeof leite_bom_qnt === 'string') {
    // Remove todos os pontos e troca vírgula por ponto (caso o usuário use vírgula decimal)
    leite_bom_qnt = leite_bom_qnt.replace(/\./g, '').replace(',', '.');
  }
  // ----------------------------

  try {
    await db.query(
      "UPDATE coletas SET nome=?, tanque=?, data=?, acidez=?, densidade=?, gordura=?, ESD=?, EST=?, proteina=?, crioscopia=?, lactose=?, alizarol=?, amido=?, sacar=?, observacoes=?, analista=?, leite_bom_qnt=? WHERE id=?",
      [nome, tanque, data, acidez, densidade, gordura, ESD, EST, proteina, crioscopia, lactose, alizarol, amido, sacar, observacoes, analista, leite_bom_qnt, id]
    );
    res.json({ message: "Coleta atualizada!" });
  } catch (error) {
    console.error("Erro ao atualizar coleta:", error);
    res.status(500).json({ message: "Erro ao atualizar a coleta." });
  }
});
// Deletar coleta (sem alterações)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await db.query("DELETE FROM coletas WHERE id=?", [id]);
  res.json({ message: "Coleta deletada!" });
});
router.patch("/:id/:leite_bom_qnt", async (req, res) => {

  const { id } = req.params;
  const { leite_bom_qnt } = req.params;
  
  try {
    await db.query(
      "UPDATE coletas SET leite_bom_qnt = ? WHERE id = ?",
      [leite_bom_qnt, id]
    );
    res.json({ message: "Leite bom quantidade atualizado" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar." });
  }
});
export default router;
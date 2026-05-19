import express from "express";
import { db } from "../db.js";

const router = express.Router();

// Rota para buscar todos os registros do boletim, agrupados por data
router.get("/", async (req, res) => {
  try {
    // Ordena também pelo nome do produtor para consistência
    const [rows] = await db.query("SELECT * FROM boletim_leite ORDER BY data DESC, produtor_nome ASC");
    
    // Agrupar resultados por data
    const groupedByDate = rows.reduce((acc, record) => {
      const date = new Date(record.data).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(record);
      return acc;
    }, {});

    res.json(groupedByDate);
  } catch (error) {
    console.error("Erro ao buscar boletins:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// Rota para salvar um novo boletim diário (LÓGICA CORRIGIDA)
router.post("/", async (req, res) => {
  const { data, registros } = req.body;

  if (!data || !registros || !Array.isArray(registros)) {
    return res.status(400).json({ message: "Dados inválidos." });
  }

  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    for (const registro of registros) {
      // Apenas processa se houver alguma quantidade de leite
      if (Number(registro.leite_bom_qnt) > 0 || Number(registro.leite_acido_qnt) > 0) {
        
        // 1. Verifica se já existe um registro para este produtor nesta data
        const [rows] = await connection.query(
          "SELECT id FROM boletim_leite WHERE data = ? AND produtor_id = ?",
          [data, registro.id]
        );

        if (rows.length > 0) {
          // 2. Se existir, ATUALIZA (UPDATE) o registro existente
          await connection.query(
            `UPDATE boletim_leite 
             SET leite_bom_qnt = ?, leite_acido_qnt = ? 
             WHERE id = ?`,
            [registro.leite_bom_qnt, registro.leite_acido_qnt, rows[0].id]
          );
        } else {
          // 3. Se não existir, INSERE (INSERT) um novo registro
          await connection.query(
            `INSERT INTO boletim_leite (data, produtor_id, produtor_cpf, produtor_nome, leite_bom_qnt, leite_acido_qnt) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [data, registro.id, registro.cpfCnpj, registro.nome, registro.leite_bom_qnt, registro.leite_acido_qnt]
          );
        }
      }
    }

    await connection.commit();
    res.status(201).json({ message: "Boletim salvo com sucesso!" });
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao salvar boletim:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  } finally {
    connection.release();
  }
});

export default router;
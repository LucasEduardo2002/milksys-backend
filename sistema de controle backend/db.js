import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const dbRoot = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS
});

await dbRoot.query("CREATE DATABASE IF NOT EXISTS controle_leite");

// Agora conecta no banco já criado
export const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: "controle_leite"
});
import express from "express";
import cors from "cors";
import produtoresRoutes from "./routes/produtores.js";
import coletasRoutes from "./routes/coletas.js";
import boletimRoutes from "./routes/boletim.js";
import { initDB } from "./initdb.js";

const app = express();
app.use(cors());
app.use(express.json());

// Inicializa DB
await initDB();

app.use("/produtores", produtoresRoutes);
app.use("/coletas", coletasRoutes);
app.use("/boletim", boletimRoutes);

app.listen(3001, () => console.log(" Backend rodando em http://localhost:3001"));

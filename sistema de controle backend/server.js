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

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => console.log(` Backend rodando em http://${HOST}:${PORT}`));

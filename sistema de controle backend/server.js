import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import session from "express-session";
import authRoutes, { requireAuth } from "./auth.js";
import produtoresRoutes from "./routes/produtores.js";
import coletasRoutes from "./routes/coletas.js";
import boletimRoutes from "./routes/boletim.js";
import { initDB } from "./initdb.js";

const app = express();
app.set("trust proxy", process.env.TRUST_PROXY === "1" ? 1 : 0);

const allowedOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:4173";
app.use(
	cors({
		origin: allowedOrigin,
		credentials: true,
	})
);
app.use(express.json());

const hasSessionDbConfig = Boolean(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME);
let sessionStore;

if (hasSessionDbConfig) {
	const mysqlSessionModule = await import("express-mysql-session");
	const createMySQLStore = mysqlSessionModule.default ?? mysqlSessionModule;

	const MySQLStore = createMySQLStore(session);
	sessionStore = new MySQLStore({
		host: process.env.DB_HOST,
		port: Number(process.env.DB_PORT ?? 3306),
		user: process.env.DB_USER,
		password: process.env.DB_PASS,
		database: process.env.DB_NAME ?? "controle_leite",
		createDatabaseTable: true,
		schema: {
			tableName: process.env.SESSION_TABLE_NAME ?? "sessions",
		},
	});

	console.log("Store de sessão MySQL inicializado.");
}

if (!sessionStore) {
	throw new Error("Configuração de sessão indisponível: verifique os dados do MySQL.");
}

app.use(
	session({
		store: sessionStore,
		name: process.env.SESSION_COOKIE_NAME ?? "sid",
		secret: process.env.SESSION_SECRET ?? "change_this_secret",
		resave: false,
		saveUninitialized: false,
		rolling: true,
		proxy: process.env.TRUST_PROXY === "1",
		cookie: {
			httpOnly: true,
			secure: process.env.SESSION_COOKIE_SECURE === "true",
			sameSite: process.env.SESSION_SAME_SITE ?? "lax",
			maxAge: Number(process.env.SESSION_TTL_MS ?? 12 * 60 * 60 * 1000),
		},
	})
);

// Inicializa DB
await initDB();

app.use("/auth", authRoutes);
app.use("/produtores", requireAuth, produtoresRoutes);
app.use("/coletas", requireAuth, coletasRoutes);
app.use("/boletim", requireAuth, boletimRoutes);

// Rotas de debug removidas (limpeza após diagnóstico)

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => console.log(` Backend rodando em http://${HOST}:${PORT}`));

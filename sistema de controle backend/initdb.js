import { db } from "./db.js";

export async function initDB() {
  try {
    // Criar banco se não existir
    
    await db.query("CREATE DATABASE IF NOT EXISTS controle_leite");
    await db.query("USE controle_leite");

    // Criar tabela produtores
    await db.query(`
      CREATE TABLE IF NOT EXISTS produtores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        cpfCnpj VARCHAR(20) UNIQUE,
        telefone VARCHAR(20),
        localidade VARCHAR(100),
        tipo VARCHAR(25),
        status VARCHAR(10)
      )
    `);

    // Criar tabela coletas
    await db.query(`
      CREATE TABLE IF NOT EXISTS coletas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100)  NOT NULL,
        tanque VARCHAR(50),
        data DATE,
        acidez VARCHAR(50),
        leite_bom_qnt DECIMAL(12, 2) DEFAULT 0,
        densidade VARCHAR(50),
        gordura VARCHAR(50),
        ESD VARCHAR(50),
        EST VARCHAR(50),
        proteina VARCHAR(50),
        crioscopia VARCHAR(50),
        lactose VARCHAR(50),
        alizarol VARCHAR(50),
        amido VARCHAR(50),
        sacar VARCHAR(50),
        observacoes TEXT,
        analista VARCHAR(100),
        
        UNIQUE (nome, tanque, data)
      )
    `);

    // Garantir coluna `leite_bom_qnt` caso a tabela já exista sem ela
    const [colunas] = await db.query(
      "SELECT COUNT(*) AS total FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'coletas' AND column_name = 'leite_bom_qnt'"
    );
    if (colunas[0]?.total === 0) {
      await db.query("ALTER TABLE coletas ADD COLUMN leite_bom_qnt DECIMAL(12,2) DEFAULT 0");
    }
    // Tabela para os boletins de recepção de leite
    await db.query(`
      CREATE TABLE IF NOT EXISTS boletim_leite (
        id INT AUTO_INCREMENT PRIMARY KEY,
        data DATE NOT NULL,
        produtor_id INT,
        produtor_cpf VARCHAR(20),
        produtor_nome VARCHAR(100) NOT NULL,
        leite_bom_qnt DECIMAL(10, 2) DEFAULT 0,
        leite_acido_qnt DECIMAL(10, 2) DEFAULT 0,
        FOREIGN KEY (produtor_id) REFERENCES produtores(id) ON DELETE SET NULL
      )
    `);

    // Tabela de usuários para autenticação (sempre criada)
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Se a coluna `email` existir em instalações antigas, removê-la
    try {
      const [colCheck] = await db.query(
        "SELECT COUNT(*) AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'email'"
      );
      if (colCheck[0] && colCheck[0].c > 0) {
        await db.query("ALTER TABLE users DROP COLUMN email");
        console.log('Coluna `email` removida de `users`.');
      }
    } catch (err) {
      console.error('Erro ao verificar/remover coluna email:', err);
    }

    // Sempre garantir que exista pelo menos um usuário admin (seed independente)
    try {
      const [usersCount] = await db.query("SELECT COUNT(*) AS c FROM users");
      if (!usersCount[0] || usersCount[0].c === 0) {
        const bcrypt = await import('bcrypt');
        const adminUser = process.env.AUTH_USER ?? 'admin';
        const adminPass = process.env.AUTH_PASSWORD ?? 'admin123';
        const saltRounds = 12;
        const hash = await bcrypt.hash(adminPass, saltRounds);

        await db.query(
          `INSERT INTO users (username, password_hash, role, is_active) VALUES (?, ?, 'admin', 1)`,
          [adminUser, hash]
        );

        console.log(`Usuário admin '${adminUser}' criado (seed).`);
      }
    } catch (err) {
      console.error('Erro ao criar usuário admin seed:', err);
    }

    // Verificar se já existem dados nas tabelas (para não sobrescrever dados em produção)
    const [produtoresCount] = await db.query("SELECT COUNT(*) as count FROM produtores");
    const [coletasCount] = await db.query("SELECT COUNT(*) as count FROM coletas");
    
    const hasExistingData = produtoresCount[0]?.count > 0 || coletasCount[0]?.count > 0;
    
    // Só inserir seeds se as tabelas estão vazias (primeira inicialização)
    if (hasExistingData) {
      console.log("⚠️  Banco já contém dados. Seeds NÃO serão reinseridos (proteção contra sobrescrita).");
      return;
    }
   
    // Dados dos produtores para inserção (apenas se banco estiver vazio)
    const produtoresData = [
      [1,'Vivaldo','876.543.210-98','(84) 95555-1111','Currais Novos-RN','Pessoa Física','Ativo'],
      [2,'Viturino','543.210.987-65','(84) 95555-2222','Acari -RN','Pessoa Física','Ativo'],
      [3,'Heitor','210.987.654-32','(84) 95555-3333','São Vicente -RN','Pessoa Física','Ativo'],
      [4,'Moacir','987.654.321-09','(84) 95555-4444','Acari -RN','Pessoa Física','Ativo'],
      [5,'Benga','654.321.098-76','(84) 95555-5555','São Vicente -RN','Pessoa Física','Ativo'],
      [6,'Arian','321.098.765-43','(84) 95555-6666','Currais Novos-RN','Pessoa Física','Ativo'],
      [7,'Dona Maria','098.765.432-10','(84) 95555-7777','Cerro Corá-RN','Pessoa Física','Ativo'],
      [8,'Douglas','765.432.109-87','(84) 95555-4596','Tenente Laurentino -RN','Pessoa Física','Ativo'],
      [9,'Chicão','432.109.876-54','(84) 91525-4596','Acari -RN','Pessoa Física','Ativo'],
      [10,'Pedro','109.876.543-21','(84) 95555-4052','Jucurutu -RN','Pessoa Física','Ativo'],
      [11,'Alcindo Neto','890.123.456-78','(84) 95555-1896','Lagoa Nova-RN','Pessoa Física','Ativo'],
      [12,'Railton','567.890.123-45','(84) 93105-1056','Cerro Corá-RN','Pessoa Física','Ativo'],
      [13,'João de Biró','234.567.890-12','(84) 93105-1056','Tenente Laurentino -RN','Pessoa Física','Ativo'],
      [14,'Fabiano','901.234.567-89','(84) 97777-9012','Currais Novos-RN','Pessoa Física','Ativo'],
      [15,'Marcelo','123.456.789-01','(84) 97777-2109','Jucurutu -RN','Pessoa Física','Ativo'],
      [16,'Elias','456.789.012-34','(84) 97777-0987','Acari -RN','Pessoa Física','Ativo'],
      [17,'Cristina','789.012.345-67','(84) 98567-8901','Acari -RN','Pessoa Física','Ativo'],
      [18,'vagner','789.054.854-21', '(84) 98567-0221', 'Acari -RN', 'Pessoa Física', 'Ativo'],
      [19,'Alcindo','159.753.486-20', '(84) 98568-2457', 'Acari -RN', 'Pessoa Física', 'Ativo'],
    ];
    
    // Dados das coletas para inserção
    const coletasData = [
      ['Moacir', '07', '2025-07-29', '23', '-', '-', '-', '-', '-', '-', 'Coagulou', "-", "-", "-", 'kelvia'],
      ['Moacir', '08', '2025-07-29', '26', '-', '-', '-', '-', '-', '-', 'Coagulou', "-", "-", "-", 'kelvia'],
      ['Moacir', '09', '2025-07-29', '17', '1033.5', '1.49', '8.87', '12.39', '3.47', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '10', '2025-07-29', '18', '1032.4', '2.71', '8.86', '12.43', '3.48', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '11', '2025-07-29', '16', '1032.0', '3.77', '9.00', '12.82', '3.54', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '12', '2025-07-29', '18', '1033.5', '2.23', '9.02', '12.40', '3.53', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['João de Biró', "-", '2025-07-29', '17', '1032.9', '3.04', '9.02', '12.48', '3.54', '0.00', 'Normal', "-", "-", "-", 'Alderalicy'],
      ['Benga', "-", '2025-07-30', '17', '1027.8', '2.11', '7.57', '11.20', '3.00', '12.2', 'Normal', "-", "-", "-", 'kelvia'],
      ['Fabiano', "-", '2025-07-30', '16', '1031.3', '2.60', '8.57', '11.30', '3.37', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Arian', "-", '2025-07-30', '16', '1030.9', '3.95', '8.76', '12.10', '3.45', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Pedro', "-", '2025-07-30', '17', '1030.9', '3.21', '8.60', '12.12', '3.39', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Chicão', "-", '2025-07-30', '17', '1032.2', '3.06', '8.88', '12.14', '3.49', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '01', '2025-07-30', '15', '1029.8', '3.38', '8.14', '12.11', '3.21', '4.99', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '02', '2025-07-30', '16', '1030.0', '3.61', '8.47', '12.20', '3.34', '1.24', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '03', '2025-07-30', '17', '1030.4', '4.71', '8.80', '12.14', '3.48', '1.24', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '04', '2025-07-30', '15', '1027.9', '3.58', '7.93', '12.40', '3.14', '7.39', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '05', '2025-07-30', '18', '1031.6', '4.47', '8.93', '12.29', '3.52', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '06', '2025-07-30', '17', '1031.3', '4.58', '9.00', '12.30', '3.55', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '07', '2025-07-30', '18', '1030.8', '4.41', '8.83', '12.28', '3.48', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Heitor', '-', '2025-07-30', '18', '1032.7', '4.80', '9.40', '12.29', '3.70', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Vivaldo', '-', '2025-07-30', '16', '1035.3', '2,86', '9.11', '12.22', '3.57', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '02', '2025-07-28', '15', '1030.5', '3.74', '8.62', '12.21', '3.40', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '03', '2025-04-28', '17', '1032.1', '3.98', '9.07', '12.23', '3.57', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '04', '2025-07-28', '19', '-', '-', '-', '-', '-', '-', 'Coagulou', "-", "-", "-", 'kelvia'],
      ['Moacir', '05', '2025-07-28', '18', '1033.7', '4.46', '9.56', '13.10', '3.75', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '06', '2025-07-28', '17', '1031.8', '3.41', '8.87', '12.24', '3.49', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '07', '2025-07-28', '17', '1033.3', '5.32', '9.66', '15.60', '3.80', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '08', '2025-07-28', '15', '1031.3', '2.66', '8.58', '12.68', '3.37', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '09', '2025-07-28', '16', '1031.4', '3.99', '8.89', '12.53', '3.50', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '10', '2025-07-28', '15', '1027.2', '6.33', '8.38', '12.87', '3.34', '3.54', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '11', '2025-07-28', '15', '1031.1', '3.64', '8.74', '15.97', '3.44', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '12', '2025-07-28', '9', '1017.3', '4.69', '5.50', '11.88', '2.28', '3.30%', 'Normal', "-", "-", "-", 'kelvia'],
      ['Railton', "-", '2025-07-28', '17', '1031.4', '3.76', '8.84', '11.79', '3.48', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Benga', "-", '2025-07-29', '18', '1031.7', '3.96', '8.97', '11.50', '3.53', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Arian', "-", '2025-07-29', '15', '1030.8', '3.95', '8.74', '11.75', '3.45', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Heitor', "-", '2025-07-29', '18', '1032.0', '4.81', '9.24', '12.35', '3.64', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '01', '2025-07-29', '17', '1031.6', '3.96', '8.95', '11.80', '3.52', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '02', '2025-07-29', '18', '1031.6', '3.90', '9.18', '12.27', '3.61', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '03', '2025-07-29', '19', '-', '-', '-', '-', '-', '-', 'coagulou', "-", "-", "-", 'kelvia'],
      ['Moacir', '04', '2025-07-29', '15', '1031.3', '3.61', '8.78', '12.34', '3.44', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '05', '2025-07-29', '20', '-', '-', '-', '-', '-', '-', 'coagulou', "-", "-", "-", 'kelvia'],
      ['Moacir', '06', '2025-07-29', '18', '1030.3', '4.38', '8.71', '12.30', '3.58', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '10', '2025-07-27', '18', '1033.6', '3.67', '9.38', '13.57', '3.68', '0.00', 'Normal', "-", "-", "-", 'Alderalicy'],
      ['Moacir', "11", '2025-07-27', '18', '1032.1', '3.08', '9.00', '13.50', '3.65', '0.00', 'Normal', "-", "-", "-", 'Alderalicy'],
      ['Moacir', '12', '2025-07-27', '16', '1032.9', '3.15', '9.09', '12.67', '3.57', '0.00', 'Normal', "-", "-", "-", 'Alderalicy'],
      ['Heitor', "-", '2025-07-27', '17', '1033.8', '3.99', '9.48', '11.43', '3.37', '0.00', 'Normal', "-", "-", "-", 'Alderalicy'],
      ['Viturino', '01', '2025-07-28', '15', '1029.4', '3.95', '8.38', '11.42', '3.31', '2.37', 'Normal', "-", "-", "-", 'kelvia'],
      ['Pedro', "-", '2025-07-28', '18', '1032.1', '3.42', '8.94', '11.50', '3.31', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Arian', "-", '2025-07-28', '16', '1031.0', '4.10', '8.81', '11.53', '3.47', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Marcelo', "-", '2025-07-28', '18', '1032.6', '4.12', '9.23', '12.41', '3.63', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Chicão', "-", '2025-07-28', '16', '1031.6', '2.75', '8.67', '12.44', '3.41', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Viturino', '02', '2025-07-28', '16', '1031.2', '3.59', '8.76', '12.27', '3.45', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Vivaldo', "-", '2025-07-28', '15', '1031.2', '3.60', '8.77', '12.28', '3.45', '0.00', 'Normal', "-", "-", "-", 'klevia'],
      ['João de Biró', "-", '2025-07-28', '16', '1033.2', '3.07', '9.13', '12.29', '3.58', '0.00', 'Normal', "-", "-", "-", 'klevia'],
      ['Alcindo', "01", '2025-07-28', '17', '1031.6', '4.55', '9.06', '12.27', '3.57', '0.00', 'Normal', "-", "-", "-", 'klevia'],
      ['Alcindo', "02", '2025-07-28', '19', '1032.8', '4.26', '9.35', '12.98', '3.66', '0.00', 'Coagulou', "-", "-", "-", 'kelvia'],
      ['Alcindo', "03", '2025-07-28', '18', '1032.9', '4.13', '9.29', '12.28', '3.65', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Alcindo', "04", '2025-07-28', '17', '1031.8', '4.16', '9.04', '13.00', '3.56', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Alcindo', "05", '2025-07-28', '18', '1032.0', '4.32', '9.13', '13.11', '3.59', '0.00', 'Normal', "-", "-", "-", 'klevia'],
      ['Heitor', "-", '2025-07-28', '17', '1032.3', '4.69', '9.27', '12.27', '3.65', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Cristina', "-", '2025-07-28', '16', '1030.6', '3.36', '8.56', '12.11', '3.37', '0.12', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '01', '2025-07-28', '16', '1030.5', '3.74', '8.62', '12.12', '3.40', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '08', '2025-07-26', '16', '1032.2', '3.55', '9.00', '12.18', '3.54', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '09', '2025-07-26', '15', '1031.7', '2.10', '8.55', '12.10', '3.36', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '10', '2025-07-26', '15', '1032.7', '2.82', '8.96', '12.09', '3.52', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '11', '2025-07-26', '16', '1030.5', '3.97', '8.68', '12.00', '3.48', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Elias', "-", '2025-07-26', '17', '1034.8', '3.25', '9.58', '12.05', '3.75', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Heitor', "-", '2025-07-26', '17', '1034.2', '4.38', '9.68', '13.10', '3.80', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['João de Biró', "-", '2025-07-26', '17', '1033.1', '3.38', '9.55', '13.15', '3.85', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Benga', "-", '2025-07-27', '17', '1033.3', '3.82', '9.12', '13.12', '3.57', '0.00', 'Normal', "-", "-", "-", 'Alderalicy'],
      ['Arian', "-", '2025-07-27', '15', '1030.7', '3.66', '8.64', '12.63', '3.41', '0.00', 'Normal', "-", "-", "-", 'Alderalicy'],
      ['Chicão', "-", '2025-07-27', '15', '1031.0', '3.66', '8.74', '12.39', '3.44', '0.00', 'Normal', "-", "-", "-", 'Alderalicy'],
      ['Marcelo', "-", '2025-07-27', '16', '1032.2', '4.35', '9.53', '12.04', '3.59', '0.00', 'Normal', "-", "-", "-", 'Alderalicy'],
      ['Moacir', '01', '2025-07-27', '17', '1033.1', '2.75', '9.04', '12.69', '3.54', '0.00', 'Normal', "-", "-", "-", 'Alderalicy'],
      ['Moacir', '02', '2025-07-27', '16', '1033.0', '3.41', '9.17', '12.41', '3.60', '0.00', 'Normal', "-", "-", "-", 'Alderalicy'],
      ['Moacir', '03', '2025-07-27', '18', '1033.3', '4.30', '9.43', '10.55', '3.40', '0.00', 'Normal', "-", "-", "-", 'Alderalicy'],
      ['Moacir', '04', '2025-07-27', '18', '1032.3', '3.70', '9.05', '15.13', '3.56', '0.00', 'Normal', "-", "-", "-", 'Alderalicy'],
      ['Moacir', '05', '2025-07-27', '18', '1033.6', '3.62', '9.36', '12.17', '3.67', '0.00', 'Normal', "-", "-", "-", 'Alderalicy'],
      ['Moacir', '06', '2025-07-27', '18', '1032.9', '4.00', '9.27', '10.38', '3.64', '0.00', 'Normal', "-", "-", "-", 'Alderalicy'],
      ['Moacir', '07', '2025-07-27', '23', '-', '-', '-', '-', '-', '0.00', 'Coagulou', "-", "-", "Devolvido", 'Alderalicy'],
      ['Moacir', '08', '2025-07-27', '23', '-', '-', '-', '-', '-', '0.00', 'Coagulou', "-", "-", "Devolvido", 'Alderalicy'],
      ['Moacir', '09', '2025-07-27', '18', '1034.6', '5.62', '9.17', '12.06', '3.98', '0.00', 'Normal', "-", "-", "-", 'Alderalicy'],
      ['Moacir', '05', '2025-07-25', '18', '1032.4', '3.26', '8.99', '12.14', '3.53', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Heitor', "-", '2025-07-25', '18', '1031.9', '4.09', '9.36', '12.24', '3.56', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Vagner', "-", '2025-07-25', '17', '1033.0', '4.26', '9.30', '12.19', '3.68', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Arian', "-", '2025-07-26', '15', '1030.4', '3.88', '8.62', '12.30', '3.40', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Fabiano', "-", '2025-07-26', '18', '1033.3', '2.03', '8.94', '12.29', '3.50', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Chicão', "-", '2025-07-26', '38', '1038.4', '3.01', '8.67', '12.20', '3.41', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Pedro', "-", '2025-07-26', '15', '1032.1', '3.02', '9.78', '12.22', '3.44', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '01', '2025-07-26', '16', '1032.5', '3.27', '9.02', '12.23', '3.54', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '02', '2025-04-26', '18', '1032.4', '3.47', '9.02', '12.24', '3.54', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '03', '2025-07-26', '16', '1030.9', '3.84', '8.74', '12.13', '3.44', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '04', '2025-07-26', '18', '1032.7', '3.99', '9.22', '12.24', '3.62', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '05', '2025-07-26', '16', '1032.2', '3.65', '9.02', '12.13', '3.55', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '06', '2025-07-26', '16', '1030.3', '3.25', '8.47', '12.18', '3.34', '1.12%', 'Normal', "-", "-", "-", 'kelvia'],
      ['Moacir', '07', '2025-07-26', '18', '1032.5', '3.84', '9.14', '12.19', '3.59', '0.00', 'Normal', "-", "-", "-", 'kelvia'],
      ['Vivaldo', "-", '2025-07-24', '17', '1032.0', '3.46', '8.32', '12.23', '3.49', '0.00', "-", "-", "-", "-", 'kelvia'],
      ['Viturino', "-", '2025-07-23', '17', '1031.3', '3.88', '8.89', '12.24', '3.38', '0.00', "-", "-", "-", "-", 'kelvia'],
      ['Heitor', "-", '2025-07-23', '18', '1030.3', '4.88', '8.82', '12.24', '3.48', '0.00', "-", "-", "-", "-", 'kelvia'],
      ['Moacir', "01", '2025-07-23', '18', '1029.1', '3.66', '8.24', '12.25', '3.26', '3.87%', "-", "-", "-", "-", 'kelvia'],
      ['Moacir', "02", '2025-07-23', '17', '1029.8', '3.62', '8.32', '12.27', '3.24', '0.00', "-", "-", "-", "-", 'kelvia'],
      ['Benga', "-", '2025-07-24', '16', '1028.9', '5.23', '8.56', '12.21', '3.39', '1.08%', "-", "-", "-", "-", 'kelvia'],
      ['Arian', "-", '2025-07-24', '16', '1030.6', '3.74', '8.64', '12.19', '3.41', '0.00', "-", "-", "-", "-", 'kelvia'],
      ['Dona Maria', "-", '2025-07-24', '18', '1032.9', '2.63', '8.96', '12.18', '3.51', '0.00', "-", "-", "-", "-", 'kelvia'],
      ['Douglas', "-", '2025-07-24', '18', '1031.1', '3.61', '8.74', '12.21', '3.44', '0.00', "-", "-", "-", "-", 'kelvia'],
      ['Chicão', "-", '2025-07-24', '16', '1031.5', '2.54', '8.59', '12.31', '3.38', '0.00', "-", "-", "-", "-", 'kelvia'],
      ['Pedro', "-", '2025-07-24', '16', '1031.7', '3.39', '8.85', '12.35', '3.48', '0.00', "-", "-", "-", "-", 'kelvia'],
      ['Alcindo Neto', "-", '2025-07-24', '17', '1032.1', '3.40', '8.90', '12.40', '3.50', '0.00', "-", "-", "-", "-", 'kelvia'],
      ['Railton', "-", '2025-07-24', '18', '1031.2', '3.61', '8.76', '12.39', '3.45', '0.00', "-", "-", "-", "-", 'kelvia'],
      ['Heitor', "-", '2025-07-24', '18', '1031.4', '4.84', '9.09', '13.10', '3.58', '0.00', "-", "-", "-", "-", 'kelvia'],
      ['Moacir', '01', '2025-07-24', '17', '1035.0', '1.96', '9.34', '13.11', '3.65', '0.00', "-", "-", "-", "-", 'kelvia'],
      ['Moacir', '02', '2025-07-24', '18', '1033.0', '3.35', '9.15', '13.20', '3.59', '0.00', "-", "-", "-", "-", 'kelvia'],
      ['Moacir', '03', '2025-07-24', '19', '1028.9', '3.90', '8.26', '12.20', '3.27', '3.69%', "-", "-", "-", "-", 'kelvia'],
      ['Moacir', '04', '2025-07-24', '17', '1031.1', '3.59', '8.73', '12.16', '3.44', '0.00', "-", "-", "-", "-", 'kelvia'],
      ['Moacir', "05", '2025-07-24', '17', '1031.7', '4.07', '8.99', '12.13', '3.54', '0.00', "-", "-", "-", "-", 'kelvia'],
      ['João de Biró', "-", '2025-04-24', '16', '-', "-", "-", "-", "-", "-", "-", "-", "-", "-", 'kelvia'],
      ['Benga', "-", '2025-07-25', '18', '-', '-', '-', '-', '-', '-', '-', "-", "-", "-", 'kelvia'],
    ];

   
    for (const produtor of produtoresData) {
      
      await db.query(
        "REPLACE INTO produtores (id, nome, cpfCnpj, telefone, localidade, tipo, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        produtor
      );
    }

     // Inserir os dados na tabela coletas
    for (const coleta of coletasData) {
      await db.query(
        `INSERT IGNORE INTO coletas 
        (nome, tanque, data, acidez, densidade, gordura, ESD, EST, proteina, crioscopia, alizarol, amido, sacar, observacoes, analista) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        coleta
      );
    }
    
    console.log(" Banco e tabelas verificados/criados com sucesso!");
    console.log(" Dados iniciais de produtores inseridos com sucesso!");
    console.log("Dados iniciais de coletas inseridos com sucesso!");

    // Criar usuário admin inicial se ainda não existir
    try {
      const [usersCount] = await db.query("SELECT COUNT(*) AS c FROM users");
      if (!usersCount[0] || usersCount[0].c === 0) {
        const bcrypt = await import('bcrypt');
        const adminUser = process.env.AUTH_USER ?? 'admin';
        const adminPass = process.env.AUTH_PASSWORD ?? 'admin123';
        const saltRounds = 12;
        const hash = await bcrypt.hash(adminPass, saltRounds);

        await db.query(
          `INSERT INTO users (username, password_hash, role, is_active) VALUES (?, ?, 'admin', 1)`,
          [adminUser, hash]
        );

        console.log(`Usuário admin '${adminUser}' criado (seed).`);
      }
    } catch (err) {
      console.error('Erro ao criar usuário admin seed:', err);
    }

  } catch (error) {
    console.error(" Erro ao inicializar banco:", error);
  }
}

/**
 * FUNÇÃO AUXILIAR: Resetar seeds (uso manual quando necessário)
 * Execute esta função manualmente via Node/npm script se quiser reinicializar os dados de teste
 */
export async function resetSeeds() {
  try {
    await db.query("TRUNCATE TABLE coletas");
    await db.query("TRUNCATE TABLE produtores");
    await db.query("TRUNCATE TABLE boletim_leite");
    console.log("✅ Tabelas truncadas com sucesso!");
    
    // Aqui você poderia re-inserir os seeds se necessário
    // (copie o bloco de inserção de produtoresData e coletasData se quiser)
  } catch (error) {
    console.error("❌ Erro ao resetar seeds:", error);
  }
}
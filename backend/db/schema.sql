-- Car Wash Dashboard Database Schema

-- Create database if not exists (run separately)
-- CREATE DATABASE lava_jato;

-- Users table for authentication and role management
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'funcionario')),
    nome VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients table for customer information
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services table for car wash services
CREATE TABLE IF NOT EXISTS servicos (
    id SERIAL PRIMARY KEY,
    carro VARCHAR(255) NOT NULL,
    placa VARCHAR(20) NOT NULL,
    nome_cliente VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    servico VARCHAR(255) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'concluido' CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado')),
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    funcionario_id INTEGER REFERENCES users(id),
    aprovacao_exclusao BOOLEAN DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deletion requests table for admin approval
CREATE TABLE IF NOT EXISTS solicitacoes_exclusao (
    id SERIAL PRIMARY KEY,
    servico_id INTEGER REFERENCES servicos(id) ON DELETE CASCADE,
    funcionario_id INTEGER REFERENCES users(id),
    motivo TEXT,
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada')),
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    aprovada_por INTEGER REFERENCES users(id),
    data_aprovacao TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_servicos_data ON servicos(data);
CREATE INDEX IF NOT EXISTS idx_servicos_funcionario ON servicos(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes(telefone);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON solicitacoes_exclusao(status);

-- Insert default admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (email, password_hash, role, nome) 
VALUES ('admin@lavajato.com', '$2b$10$K8h5G9ZhJ6jYG0MqHmGz/eHO6.xrvI8Mj.ZC2XYAIqN6u8vQZ8N8C', 'admin', 'Administrador')
ON CONFLICT (email) DO NOTHING;

-- Insert sample employee user (password: func123)
-- Password hash for 'func123' using bcrypt
INSERT INTO users (email, password_hash, role, nome) 
VALUES ('funcionario@lavajato.com', '$2b$10$l4kT7qX9WmJ3pQ2MnK5z/eJR8.yrvI8Mj.ZC2XYAIqN6u8vQZ8N8D', 'funcionario', 'Funcionário Exemplo')
ON CONFLICT (email) DO NOTHING;

-- Insert sample clients
INSERT INTO clientes (nome, telefone) 
VALUES 
    ('João Silva', '(11) 99999-1234'),
    ('Maria Santos', '(11) 98888-5678'),
    ('Pedro Oliveira', '(11) 97777-9012')
ON CONFLICT DO NOTHING;

-- Insert sample services
INSERT INTO servicos (carro, placa, nome_cliente, telefone, servico, valor, funcionario_id, data)
VALUES 
    ('Honda Civic', 'ABC-1234', 'João Silva', '(11) 99999-1234', 'Lavagem Completa', 25.00, 2, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    ('Toyota Corolla', 'XYZ-5678', 'Maria Santos', '(11) 98888-5678', 'Lavagem Simples', 15.00, 2, CURRENT_TIMESTAMP - INTERVAL '1 hour'),
    ('Ford Focus', 'DEF-9012', 'Pedro Oliveira', '(11) 97777-9012', 'Enceramento', 40.00, 2, CURRENT_TIMESTAMP - INTERVAL '30 minutes');
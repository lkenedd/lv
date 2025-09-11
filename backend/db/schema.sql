-- Car Wash Dashboard Database Schema

-- Create database (run this manually)
-- CREATE DATABASE lavajato_db;

-- Users table for authentication and role management
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'funcionario')),
    nome VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clientes table for customer management
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    historico_servicos JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Servicos table for service management
CREATE TABLE servicos (
    id SERIAL PRIMARY KEY,
    carro VARCHAR(255) NOT NULL,
    placa VARCHAR(20) NOT NULL,
    nome_cliente VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    servico VARCHAR(255) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('em_andamento', 'finalizado')),
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    funcionario_id INTEGER REFERENCES users(id),
    aprovacao_exclusao VARCHAR(50) CHECK (aprovacao_exclusao IN ('pendente', 'aprovada', 'rejeitada')),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Solicitacoes exclusao table for deletion control
CREATE TABLE solicitacoes_exclusao (
    id SERIAL PRIMARY KEY,
    servico_id INTEGER REFERENCES servicos(id) ON DELETE CASCADE,
    funcionario_id INTEGER REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada')),
    motivo TEXT,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    aprovado_por INTEGER REFERENCES users(id),
    data_aprovacao TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_servicos_data ON servicos(data);
CREATE INDEX idx_servicos_funcionario ON servicos(funcionario_id);
CREATE INDEX idx_servicos_status ON servicos(status);
CREATE INDEX idx_clientes_telefone ON clientes(telefone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_solicitacoes_exclusao_status ON solicitacoes_exclusao(status);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_servicos_updated_at BEFORE UPDATE ON servicos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, role, nome) VALUES 
('admin@lavajato.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye4RERC.XeBBbqp3/L8m3q3be.Pb1fUJ2', 'admin', 'Administrador');

-- Insert sample employee user (password: func123)  
INSERT INTO users (email, password_hash, role, nome) VALUES 
('funcionario@lavajato.com', '$2a$10$wqP1WZT5V6Fv9Qx2Qx2Qx2QxZT5V6Fv9Qx2Qx2Qx2QxZT5V6Fv9Qx', 'funcionario', 'Funcionário Exemplo');

-- Insert sample clients
INSERT INTO clientes (nome, telefone) VALUES 
('João Silva', '(11) 99999-1234'),
('Maria Santos', '(11) 99999-5678'),
('Carlos Oliveira', '(11) 99999-9012');

-- Insert sample services
INSERT INTO servicos (carro, placa, nome_cliente, telefone, servico, valor, status, funcionario_id) VALUES 
('Civic 2020', 'ABC-1234', 'João Silva', '(11) 99999-1234', 'Lavagem Completa', 25.00, 'finalizado', 2),
('Corolla 2019', 'XYZ-5678', 'Maria Santos', '(11) 99999-5678', 'Lavagem + Cera', 35.00, 'em_andamento', 2),
('Onix 2021', 'DEF-9012', 'Carlos Oliveira', '(11) 99999-9012', 'Lavagem Simples', 20.00, 'finalizado', 2);
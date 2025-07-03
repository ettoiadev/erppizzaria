-- Criar tabela de conteúdo da página Sobre
CREATE TABLE IF NOT EXISTS about_content (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Garante que só existe uma linha
  hero JSONB NOT NULL DEFAULT '{
    "title": "Sobre a Pizza Delivery",
    "subtitle": "Tradição em sabor desde 2020",
    "image": "/placeholder.jpg"
  }'::jsonb,
  story JSONB NOT NULL DEFAULT '{
    "title": "Nossa História",
    "content": "A Pizza Delivery nasceu do sonho de levar a melhor pizza artesanal até você...",
    "image": "/placeholder.jpg"
  }'::jsonb,
  values JSONB NOT NULL DEFAULT '[
    {
      "title": "Qualidade",
      "description": "Ingredientes selecionados e processos rigorosos de qualidade",
      "icon": "🌟"
    },
    {
      "title": "Rapidez",
      "description": "Entrega rápida e eficiente para sua pizza chegar quentinha",
      "icon": "⚡"
    },
    {
      "title": "Atendimento",
      "description": "Equipe treinada para oferecer o melhor atendimento",
      "icon": "💝"
    }
  ]'::jsonb,
  team JSONB NOT NULL DEFAULT '[
    {
      "name": "João Silva",
      "role": "Chef de Cozinha",
      "image": "/placeholder-user.jpg"
    },
    {
      "name": "Maria Oliveira",
      "role": "Gerente",
      "image": "/placeholder-user.jpg"
    }
  ]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar função para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_about_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar o updated_at
DROP TRIGGER IF EXISTS update_about_content_updated_at ON about_content;
CREATE TRIGGER update_about_content_updated_at
  BEFORE UPDATE ON about_content
  FOR EACH ROW
  EXECUTE FUNCTION update_about_content_updated_at();

-- Inserir conteúdo padrão se não existir
INSERT INTO about_content (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING; 
-- Dados iniciais para teste

-- Inserir categorias
INSERT INTO categories (name, description, active, sort_order) VALUES
('Pizzas Tradicionais', 'Pizzas com sabores clássicos e tradicionais', true, 1),
('Pizzas Especiais', 'Pizzas com ingredientes especiais e gourmet', true, 2),
('Bebidas', 'Refrigerantes, sucos e bebidas em geral', true, 3),
('Sobremesas', 'Doces e sobremesas deliciosas', true, 4);

-- Inserir produtos de exemplo
INSERT INTO products (name, description, price, category_id, active, has_sizes, has_toppings, preparation_time, sort_order, sizes, toppings) 
SELECT 
    'Pizza Margherita',
    'Pizza clássica com molho de tomate, mussarela e manjericão',
    35.90,
    c.id,
    true,
    true,
    true,
    25,
    1,
    '[{"name": "Pequena", "price": 0}, {"name": "Média", "price": 5.00}, {"name": "Grande", "price": 10.00}]'::jsonb,
    '[{"name": "Queijo Extra", "price": 3.00}, {"name": "Azeitona", "price": 2.00}, {"name": "Orégano", "price": 0.50}]'::jsonb
FROM categories c WHERE c.name = 'Pizzas Tradicionais';

INSERT INTO products (name, description, price, category_id, active, has_sizes, has_toppings, preparation_time, sort_order, sizes, toppings) 
SELECT 
    'Pizza Calabresa',
    'Pizza com calabresa, cebola, molho de tomate e mussarela',
    38.90,
    c.id,
    true,
    true,
    true,
    25,
    2,
    '[{"name": "Pequena", "price": 0}, {"name": "Média", "price": 5.00}, {"name": "Grande", "price": 10.00}]'::jsonb,
    '[{"name": "Queijo Extra", "price": 3.00}, {"name": "Azeitona", "price": 2.00}, {"name": "Pimentão", "price": 2.50}]'::jsonb
FROM categories c WHERE c.name = 'Pizzas Tradicionais';

INSERT INTO products (name, description, price, category_id, active, has_sizes, has_toppings, preparation_time, sort_order, sizes, toppings) 
SELECT 
    'Pizza Quatro Queijos',
    'Pizza especial com mussarela, gorgonzola, parmesão e provolone',
    45.90,
    c.id,
    true,
    true,
    false,
    30,
    1,
    '[{"name": "Pequena", "price": 0}, {"name": "Média", "price": 5.00}, {"name": "Grande", "price": 10.00}]'::jsonb,
    '[]'::jsonb
FROM categories c WHERE c.name = 'Pizzas Especiais';

INSERT INTO products (name, description, price, category_id, active, has_sizes, has_toppings, preparation_time, sort_order) 
SELECT 
    'Coca-Cola 350ml',
    'Refrigerante Coca-Cola lata 350ml',
    4.50,
    c.id,
    true,
    false,
    false,
    2,
    1
FROM categories c WHERE c.name = 'Bebidas';

INSERT INTO products (name, description, price, category_id, active, has_sizes, has_toppings, preparation_time, sort_order) 
SELECT 
    'Pudim de Leite',
    'Pudim de leite condensado com calda de caramelo',
    8.90,
    c.id,
    true,
    false,
    false,
    5,
    1
FROM categories c WHERE c.name = 'Sobremesas';

-- Inserir cliente de exemplo
INSERT INTO customers (name, email, phone, customer_code) VALUES
('João Silva', 'joao.silva@email.com', '(11) 99999-9999', 'CUST001');

-- Inserir endereço do cliente
INSERT INTO customer_addresses (customer_id, street, number, complement, neighborhood, city, state, zip_code, is_default)
SELECT 
    c.id,
    'Rua das Flores',
    '123',
    'Apto 45',
    'Centro',
    'São Paulo',
    'SP',
    '01234-567',
    true
FROM customers c WHERE c.customer_code = 'CUST001';

-- Inserir configurações administrativas
INSERT INTO admin_settings (key, value, description) VALUES
('delivery_fee', '5.00', 'Taxa de entrega padrão'),
('min_order_value', '25.00', 'Valor mínimo do pedido'),
('max_delivery_distance', '10', 'Distância máxima para entrega em km'),
('restaurant_name', '"William Disk Pizza"', 'Nome do restaurante'),
('restaurant_phone', '"(11) 3333-4444"', 'Telefone do restaurante'),
('restaurant_address', '"Rua Principal, 456 - Centro, São Paulo - SP"', 'Endereço do restaurante'),
('opening_hours', '{"monday": "18:00-23:00", "tuesday": "18:00-23:00", "wednesday": "18:00-23:00", "thursday": "18:00-23:00", "friday": "18:00-00:00", "saturday": "18:00-00:00", "sunday": "18:00-23:00"}', 'Horários de funcionamento');

-- Inserir pedido de exemplo
INSERT INTO orders (customer_id, status, total_amount, delivery_fee, payment_method, delivery_address, notes)
SELECT 
    c.id,
    'pending',
    48.40,
    5.00,
    'dinheiro',
    '{"street": "Rua das Flores", "number": "123", "complement": "Apto 45", "neighborhood": "Centro", "city": "São Paulo", "state": "SP", "zip_code": "01234-567"}',
    'Sem cebola na pizza'
FROM customers c WHERE c.customer_code = 'CUST001';

-- Inserir itens do pedido
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, size_info, toppings_info)
SELECT 
    o.id,
    p.id,
    1,
    38.90,
    38.90,
    '{"name": "Média", "price": 5.00}',
    '[{"name": "Queijo Extra", "price": 3.00}]'
FROM orders o, products p 
WHERE p.name = 'Pizza Calabresa' 
AND o.status = 'pending'
LIMIT 1;

INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
SELECT 
    o.id,
    p.id,
    1,
    4.50,
    4.50
FROM orders o, products p 
WHERE p.name = 'Coca-Cola 350ml' 
AND o.status = 'pending'
LIMIT 1;
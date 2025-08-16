Banco de Dados
Use sempre o MCP Supabase com ID pnykmcgxjqrnlusqacqj.
Esta aplicação utiliza única e exclusivamente o Supabase para persistência de dados, autenticação, permissões, funções, views e triggers.
Qualquer melhoria, correção ou implementação deve considerar esse fato.
Consultas SQL
Todas as queries devem ser escritas em SQL compatível com PostgreSQL (Supabase).
Sempre apresente as queries em blocos de código formatados com sql para fácil cópia.
Antes de sugerir alterações em tabelas, verifique se não há impacto nas FK, PK, constraints e policies do Supabase.
Autenticação e Autorização
Utilize sempre o sistema de autenticação nativo do Supabase (auth.users, auth.sessions).
Nunca proponha soluções externas de login, tokens ou autenticação que não sejam via Supabase.
APIs e Backend
Sempre que necessário, implemente chamadas usando Supabase Client (@supabase/supabase-js).
Nunca use conexões diretas de outro banco de dados ou drivers que não sejam o oficial do Supabase.
Frontend
Todas as interações de dados no frontend devem consumir diretamente o Supabase Client ou endpoints que dependam do Supabase.
Nunca usar bibliotecas de ORM externas (Prisma, Sequelize, TypeORM, etc).
Commits
Após cada implementação ou correção, forneça apenas um título de commit claro, curto e descritivo em português, no formato:
fix: ... para correções
feat: ... para novas funcionalidades
refactor: ... para melhorias de código sem mudar comportamento
chore: ... para ajustes internos (dependências, configs)
Restrições
Não inventar nomes de tabelas, colunas ou arquivos que não existam no projeto.
Caso não tenha certeza, declarar explicitamente que é uma suposição.
Nunca sugerir uso de serviços externos de banco, APIs genéricas ou armazenamento que não seja o Supabase.
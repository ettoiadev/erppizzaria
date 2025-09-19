/**
 * Instruções para Backup do PostgreSQL via pgAdmin 4
 * Este arquivo contém instruções detalhadas para realizar backup e restauração
 * do banco de dados usando o pgAdmin 4.
 */

console.log(`
=============================================================
  INSTRUÇÕES PARA BACKUP DO POSTGRESQL VIA PGADMIN 4
=============================================================

REALIZAR BACKUP:
---------------
1. Abra o pgAdmin 4
2. No painel esquerdo, expanda "Servers"
3. Expanda seu servidor PostgreSQL
4. Clique com o botão direito no banco de dados "erp_pizzaria"
5. Selecione "Backup..."
6. Na janela de backup:
   - Em "Filename", escolha um local e nome para o arquivo de backup
   - Em "Format", selecione "Plain" para maior compatibilidade
   - Em "Encoding", mantenha o padrão (UTF8)
   - Em "Role name", mantenha o padrão
7. Na aba "Dump options":
   - Marque "Only data" se quiser apenas os dados
   - Marque "Only schema" se quiser apenas a estrutura
   - Ou deixe ambos desmarcados para backup completo
   - Marque "With CREATE DATABASE" para incluir o comando de criação do banco
   - Marque "Clean before restore" para limpar objetos antes da restauração
8. Clique em "Backup" para iniciar o processo

RESTAURAR BACKUP EM OUTRO COMPUTADOR:
------------------------------------
1. Instale o PostgreSQL e pgAdmin 4 no computador de destino
2. Abra o pgAdmin 4
3. Crie um novo banco de dados vazio chamado "erp_pizzaria"
   (Clique com botão direito em "Databases" > "Create" > "Database...")
4. Clique com o botão direito no novo banco de dados
5. Selecione "Restore..."
6. Na janela de restauração:
   - Em "Format", selecione "Plain"
   - Em "Filename", selecione o arquivo de backup
   - Em "Role name", mantenha o padrão
7. Na aba "Restore options":
   - Ajuste as opções conforme necessário
   - Recomendado manter as opções padrão
8. Clique em "Restore" para iniciar o processo

DICAS IMPORTANTES:
----------------
- Certifique-se de que o PostgreSQL esteja na mesma versão em ambos os computadores
- Verifique se o usuário tem permissões suficientes para restaurar o banco
- Caso ocorram erros, verifique os logs do pgAdmin para mais detalhes
- Para bancos grandes, o processo pode demorar alguns minutos

=============================================================
`);

// Exibir instruções para uso via linha de comando (alternativa)
console.log(`
ALTERNATIVA: BACKUP VIA LINHA DE COMANDO
----------------------------------------
Se você tiver o PostgreSQL instalado e configurado no PATH, pode usar:

1. Para backup:
   pg_dump -h localhost -U postgres -d erp_pizzaria -F p -f erp_pizzaria_backup.sql

2. Para restauração:
   psql -h localhost -U postgres -d erp_pizzaria -f erp_pizzaria_backup.sql

=============================================================
`);
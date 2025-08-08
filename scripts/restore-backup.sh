#!/bin/bash

# Script de Restauração de Backup - William Disk Pizza
# Uso: ./restore-backup.sh backup_20241201_020000.sql.gz

# Configurações
DB_NAME="williamdiskpizza"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"
BACKUP_DIR="/backups/database"
FILES_BACKUP_DIR="/backups/files"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERRO:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] AVISO:${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# Verificar argumentos
if [ $# -eq 0 ]; then
    echo "Uso: $0 <arquivo_backup> [--files]"
    echo ""
    echo "Exemplos:"
    echo "  $0 backup_20241201_020000.sql.gz"
    echo "  $0 backup_20241201_020000.sql.gz --files"
    echo ""
    echo "Backups disponíveis:"
    if [ -d "$BACKUP_DIR" ]; then
        ls -la "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -10
    else
        echo "Diretório de backup não encontrado: $BACKUP_DIR"
    fi
    exit 1
fi

BACKUP_FILE="$1"
RESTORE_FILES=false

# Verificar se é restauração de arquivos
if [ "$2" = "--files" ]; then
    RESTORE_FILES=true
    BACKUP_FILE="$1"
fi

# Verificar se arquivo existe
if [ "$RESTORE_FILES" = true ]; then
    if [ ! -f "$FILES_BACKUP_DIR/$BACKUP_FILE" ]; then
        error "Arquivo de backup não encontrado: $FILES_BACKUP_DIR/$BACKUP_FILE"
        echo ""
        echo "Backups de arquivos disponíveis:"
        ls -la "$FILES_BACKUP_DIR"/*.tar.gz 2>/dev/null | head -10
        exit 1
    fi
    BACKUP_PATH="$FILES_BACKUP_DIR/$BACKUP_FILE"
else
    if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        error "Arquivo de backup não encontrado: $BACKUP_DIR/$BACKUP_FILE"
        echo ""
        echo "Backups de banco disponíveis:"
        ls -la "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -10
        exit 1
    fi
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"
fi

# Verificar se PostgreSQL está rodando
if [ "$RESTORE_FILES" = false ]; then
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" &> /dev/null; then
        error "PostgreSQL não está rodando ou não acessível"
        exit 1
    fi
fi

# Confirmação do usuário
warning "ATENÇÃO: Esta operação irá sobrescrever dados existentes!"
echo ""
if [ "$RESTORE_FILES" = true ]; then
    echo "Arquivo a restaurar: $BACKUP_PATH"
    echo "Isso irá restaurar arquivos de upload para: /app/public/uploads"
else
    echo "Backup a restaurar: $BACKUP_PATH"
    echo "Isso irá restaurar o banco de dados: $DB_NAME"
fi
echo ""
read -p "Tem certeza que deseja continuar? (s/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    log "Restauração cancelada pelo usuário"
    exit 0
fi

# Fazer backup do estado atual antes da restauração
if [ "$RESTORE_FILES" = false ]; then
    log "Fazendo backup do estado atual antes da restauração..."
    CURRENT_BACKUP="$BACKUP_DIR/pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$CURRENT_BACKUP"; then
        log "Backup de segurança criado: $CURRENT_BACKUP"
    else
        warning "Não foi possível criar backup de segurança"
    fi
fi

# Restaurar backup
if [ "$RESTORE_FILES" = true ]; then
    log "Restaurando arquivos..."
    
    # Criar diretório de uploads se não existir
    mkdir -p /app/public/uploads
    
    # Fazer backup dos arquivos atuais
    CURRENT_FILES_BACKUP="/tmp/current_files_$(date +%Y%m%d_%H%M%S).tar.gz"
    if [ -d "/app/public/uploads" ] && [ "$(ls -A /app/public/uploads)" ]; then
        tar -czf "$CURRENT_FILES_BACKUP" -C /app/public/uploads . 2>/dev/null
        log "Backup dos arquivos atuais criado: $CURRENT_FILES_BACKUP"
    fi
    
    # Restaurar arquivos
    if tar -xzf "$BACKUP_PATH" -C /app/public/uploads; then
        log "✅ Arquivos restaurados com sucesso"
        
        # Mostrar estatísticas
        FILE_COUNT=$(find /app/public/uploads -type f | wc -l)
        TOTAL_SIZE=$(du -sh /app/public/uploads | cut -f1)
        log "Arquivos restaurados: $FILE_COUNT"
        log "Tamanho total: $TOTAL_SIZE"
        
    else
        error "❌ Falha ao restaurar arquivos"
        exit 1
    fi
    
else
    log "Restaurando banco de dados..."
    
    # Verificar se é arquivo comprimido
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        log "Descomprimindo e restaurando backup..."
        if gunzip -c "$BACKUP_PATH" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"; then
            log "✅ Banco de dados restaurado com sucesso"
        else
            error "❌ Falha ao restaurar banco de dados"
            exit 1
        fi
    else
        log "Restaurando backup não comprimido..."
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_PATH"; then
            log "✅ Banco de dados restaurado com sucesso"
        else
            error "❌ Falha ao restaurar banco de dados"
            exit 1
        fi
    fi
    
    # Verificar integridade da restauração
    log "Verificando integridade da restauração..."
    TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    log "Tabelas restauradas: $TABLE_COUNT"
fi

log "🎉 Restauração concluída com sucesso!"

# Informações adicionais
if [ "$RESTORE_FILES" = false ]; then
    echo ""
    info "Para verificar a restauração, você pode:"
    echo "  1. Acessar o admin: http://localhost:3000/admin"
    echo "  2. Verificar se os dados estão corretos"
    echo "  3. Testar funcionalidades principais"
fi

echo ""
info "Backup de segurança criado antes da restauração:"
if [ "$RESTORE_FILES" = true ]; then
    echo "  $CURRENT_FILES_BACKUP"
else
    echo "  $CURRENT_BACKUP"
fi

exit 0 
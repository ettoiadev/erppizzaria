#!/bin/bash

# Script de Backup Automático - William Disk Pizza
# Configurações
BACKUP_DIR="/backups/database"
DB_NAME="williamdiskpizza"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"
LOG_FILE="$BACKUP_DIR/backup_$DATE.log"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERRO:${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] AVISO:${NC} $1" | tee -a "$LOG_FILE"
}

# Verificar se pg_dump está disponível
if ! command -v pg_dump &> /dev/null; then
    error "pg_dump não encontrado. Instale o PostgreSQL client."
    exit 1
fi

# Criar diretório de backup se não existir
if [ ! -d "$BACKUP_DIR" ]; then
    log "Criando diretório de backup: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
fi

# Verificar se PostgreSQL está rodando
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" &> /dev/null; then
    error "PostgreSQL não está rodando ou não acessível"
    exit 1
fi

log "Iniciando backup do banco de dados: $DB_NAME"

# Fazer backup
log "Executando pg_dump..."
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE" 2>> "$LOG_FILE"; then
    log "Backup criado com sucesso: $BACKUP_FILE"
    
    # Verificar tamanho do backup
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Tamanho do backup: $BACKUP_SIZE"
    
    # Comprimir backup
    log "Comprimindo backup..."
    if gzip "$BACKUP_FILE"; then
        COMPRESSED_FILE="$BACKUP_FILE.gz"
        COMPRESSED_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
        log "Backup comprimido: $COMPRESSED_FILE ($COMPRESSED_SIZE)"
        
        # Remover arquivo não comprimido
        rm -f "$BACKUP_FILE"
    else
        error "Falha ao comprimir backup"
        exit 1
    fi
    
else
    error "Falha ao criar backup"
    exit 1
fi

# Manter apenas últimos 7 backups (uma semana)
log "Limpando backups antigos..."
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete 2>/dev/null

# Verificar espaço em disco
DISK_USAGE=$(df "$BACKUP_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    warning "Uso de disco alto: ${DISK_USAGE}%"
fi

# Estatísticas finais
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "*.sql.gz" | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

log "Backup concluído com sucesso!"
log "Estatísticas:"
log "  - Backups mantidos: $BACKUP_COUNT"
log "  - Tamanho total: $TOTAL_SIZE"
log "  - Arquivo criado: $COMPRESSED_FILE"

# Enviar notificação (opcional)
if command -v curl &> /dev/null && [ -n "$WEBHOOK_URL" ]; then
    curl -X POST -H "Content-Type: application/json" \
         -d "{\"text\":\"✅ Backup automático concluído: $COMPRESSED_FILE ($COMPRESSED_SIZE)\"}" \
         "$WEBHOOK_URL" &>/dev/null
fi

exit 0 
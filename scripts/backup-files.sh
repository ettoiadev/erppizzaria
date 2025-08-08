#!/bin/bash

# Script de Backup de Arquivos - William Disk Pizza
# Configurações
BACKUP_DIR="/backups/files"
UPLOADS_DIR="/app/public/uploads"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/files_$DATE.tar.gz"
LOG_FILE="$BACKUP_DIR/files_backup_$DATE.log"

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

# Verificar se diretório de uploads existe
if [ ! -d "$UPLOADS_DIR" ]; then
    error "Diretório de uploads não encontrado: $UPLOADS_DIR"
    exit 1
fi

# Criar diretório de backup se não existir
if [ ! -d "$BACKUP_DIR" ]; then
    log "Criando diretório de backup: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
fi

log "Iniciando backup de arquivos: $UPLOADS_DIR"

# Verificar se há arquivos para fazer backup
FILE_COUNT=$(find "$UPLOADS_DIR" -type f | wc -l)
if [ "$FILE_COUNT" -eq 0 ]; then
    warning "Nenhum arquivo encontrado para backup"
    exit 0
fi

log "Encontrados $FILE_COUNT arquivos para backup"

# Fazer backup dos arquivos
log "Criando arquivo tar.gz..."
if tar -czf "$BACKUP_FILE" -C "$UPLOADS_DIR" . 2>> "$LOG_FILE"; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Backup de arquivos criado com sucesso: $BACKUP_FILE ($BACKUP_SIZE)"
    
    # Verificar integridade do backup
    log "Verificando integridade do backup..."
    if tar -tzf "$BACKUP_FILE" > /dev/null 2>&1; then
        log "✅ Backup verificado com sucesso"
    else
        error "❌ Backup corrompido!"
        rm -f "$BACKUP_FILE"
        exit 1
    fi
    
else
    error "Falha ao criar backup de arquivos"
    exit 1
fi

# Manter apenas últimos 30 backups (um mês)
log "Limpando backups antigos..."
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete 2>/dev/null

# Verificar espaço em disco
DISK_USAGE=$(df "$BACKUP_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    warning "Uso de disco alto: ${DISK_USAGE}%"
fi

# Estatísticas finais
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "*.tar.gz" | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

log "Backup de arquivos concluído com sucesso!"
log "Estatísticas:"
log "  - Backups mantidos: $BACKUP_COUNT"
log "  - Tamanho total: $TOTAL_SIZE"
log "  - Arquivo criado: $BACKUP_FILE"

# Enviar notificação (opcional)
if command -v curl &> /dev/null && [ -n "$WEBHOOK_URL" ]; then
    curl -X POST -H "Content-Type: application/json" \
         -d "{\"text\":\"📁 Backup de arquivos concluído: $BACKUP_FILE ($BACKUP_SIZE)\"}" \
         "$WEBHOOK_URL" &>/dev/null
fi

exit 0 
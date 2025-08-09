#!/bin/bash

# Script para facilitar o deploy na Vercel

# Cores para o terminal
RESET="\033[0m"
BOLD="\033[1m"
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
CYAN="\033[36m"

echo -e "\n${BOLD}${CYAN}=== Deploy para Vercel ===${RESET}\n"

# Verificar se a Vercel CLI está instalada
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI não encontrada. Instalando...${RESET}"
    npm install -g vercel
fi

# Verificar se o usuário está logado na Vercel
echo -e "${BOLD}Verificando login na Vercel...${RESET}"
vercel whoami &> /dev/null

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Você não está logado na Vercel. Iniciando login...${RESET}"
    vercel login
fi

# Verificar se o arquivo .env.production.local existe
if [ ! -f ".env.production.local" ]; then
    echo -e "${RED}Arquivo .env.production.local não encontrado.${RESET}"
    echo -e "Execute o script ${CYAN}prepare-production.js${RESET} para configurar as variáveis de ambiente."
    exit 1
fi

# Perguntar se o usuário quer executar o script de verificação
echo -e "\n${BOLD}Deseja executar a verificação de prontidão para produção? (s/n)${RESET}"
read -r run_verification

if [[ $run_verification =~ ^[Ss]$ ]]; then
    echo -e "\n${BOLD}Executando verificação...${RESET}"
    node scripts/verify-production-readiness.js
    
    if [ $? -ne 0 ]; then
        echo -e "\n${RED}A verificação falhou. Corrija os problemas antes de continuar.${RESET}"
        echo -e "Deseja continuar mesmo assim? (s/n)"
        read -r continue_anyway
        
        if [[ ! $continue_anyway =~ ^[Ss]$ ]]; then
            echo -e "${YELLOW}Deploy cancelado.${RESET}"
            exit 1
        fi
    fi
fi

# Perguntar se o usuário quer fazer build local antes do deploy
echo -e "\n${BOLD}Deseja fazer o build local antes do deploy? (s/n)${RESET}"
read -r run_build

if [[ $run_build =~ ^[Ss]$ ]]; then
    echo -e "\n${BOLD}Executando build...${RESET}"
    npm run build
    
    if [ $? -ne 0 ]; then
        echo -e "\n${RED}O build falhou. Corrija os erros antes de continuar.${RESET}"
        exit 1
    fi
fi

# Perguntar se o usuário quer fazer deploy para produção ou preview
echo -e "\n${BOLD}Deseja fazer deploy para produção? (s/n)${RESET}"
echo -e "(Responder 'n' criará um ambiente de preview)"
read -r deploy_prod

if [[ $deploy_prod =~ ^[Ss]$ ]]; then
    echo -e "\n${BOLD}${YELLOW}ATENÇÃO: Você está prestes a fazer deploy para PRODUÇÃO.${RESET}"
    echo -e "${YELLOW}Isso atualizará o site em produção. Tem certeza? (s/n)${RESET}"
    read -r confirm_prod
    
    if [[ $confirm_prod =~ ^[Ss]$ ]]; then
        echo -e "\n${BOLD}Iniciando deploy para produção...${RESET}"
        vercel --prod
    else
        echo -e "${YELLOW}Deploy para produção cancelado.${RESET}"
        exit 1
    fi
else
    echo -e "\n${BOLD}Iniciando deploy para ambiente de preview...${RESET}"
    vercel
fi

echo -e "\n${BOLD}${GREEN}Deploy concluído!${RESET}"
import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { addCorsHeaders } from '@/lib/auth-utils'
import { frontendLogger } from '@/lib/frontend-logger'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return addCorsHeaders(NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 }))
    }

    // Validar tipo do arquivo
    if (!file.type.startsWith("image/")) {
      return addCorsHeaders(NextResponse.json({ error: "Apenas imagens são permitidas" }, { status: 400 }))
    }

    // Validar tamanho do arquivo (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return addCorsHeaders(NextResponse.json({ error: "Arquivo muito grande (máximo 5MB)" }, { status: 400 }))
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const extension = file.name.split(".").pop()
    const fileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`

    // Criar diretório de uploads se não existir
    const uploadDir = join(process.cwd(), "public", "uploads")
    
    try {
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
        frontendLogger.info("Diretório de uploads criado", { uploadDir })
      }
    } catch (error) {
      frontendLogger.error("Erro ao criar diretório:", error)
    }

    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const filePath = join(uploadDir, fileName)
      
      await writeFile(filePath, buffer)
      frontendLogger.info("Arquivo salvo com sucesso", { 
        fileName, 
        size: file.size, 
        type: file.type 
      })
    } catch (error: any) {
      frontendLogger.error('Erro ao salvar arquivo', 'api', {
        error: error.message,
        stack: error.stack,
        fileName,
        fileSize: file.size,
        fileType: file.type
      })
      return addCorsHeaders(NextResponse.json({ 
        error: "Erro ao salvar arquivo", 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, { status: 500 }))
    }

    // Retornar URL da imagem
    const imageUrl = `/uploads/${fileName}`
    frontendLogger.info("Upload concluído com sucesso", { imageUrl, fileName })
    
    return addCorsHeaders(NextResponse.json({ 
      url: imageUrl,
      fileName: fileName,
      size: file.size,
      type: file.type
    }))
  } catch (error: any) {
    frontendLogger.error('Erro no upload', 'api', {
      error: error.message,
      stack: error.stack
    })
    return addCorsHeaders(NextResponse.json({ 
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 }))
  }
}

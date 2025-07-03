import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    // Validar tipo do arquivo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Apenas imagens são permitidas" }, { status: 400 })
    }

    // Validar tamanho do arquivo (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Arquivo muito grande (máximo 5MB)" }, { status: 400 })
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
        console.log("Diretório de uploads criado:", uploadDir)
      }
    } catch (error) {
      console.error("Erro ao criar diretório:", error)
    }

    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const filePath = join(uploadDir, fileName)
      
      await writeFile(filePath, buffer)
      console.log("Arquivo salvo em:", filePath)
    } catch (error) {
      console.error("Erro ao salvar arquivo:", error)
      return NextResponse.json({ error: "Erro ao salvar arquivo", details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
    }

    // Retornar URL da imagem
    const imageUrl = `/uploads/${fileName}`
    console.log("URL da imagem gerada:", imageUrl)
    
    return NextResponse.json({ 
      url: imageUrl,
      fileName: fileName,
      size: file.size,
      type: file.type
    })
  } catch (error) {
    console.error("Erro no upload:", error)
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

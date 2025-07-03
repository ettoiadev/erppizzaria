"use client"



import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X } from "lucide-react"
import type { Category } from "@/types"

interface CategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
  onSave: (category: Partial<Category>) => void
}

export function CategoryModal({ open, onOpenChange, category, onSave }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
  })
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description,
        image: category.image,
      })
      setImagePreview(category.image)
      setUploadedImage(null)
    } else {
      setFormData({
        name: "",
        description: "",
        image: "",
      })
      setImagePreview("")
      setUploadedImage(null)
    }
  }, [category, open])

  const processImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        // Set canvas size to target dimensions
        canvas.width = 49
        canvas.height = 49

        // Calculate scaling and cropping
        const scale = Math.max(49 / img.width, 49 / img.height)
        const scaledWidth = img.width * scale
        const scaledHeight = img.height * scale

        // Calculate crop position (center crop)
        const cropX = (scaledWidth - 49) / 2
        const cropY = (scaledHeight - 49) / 2

        // Draw the image
        ctx?.drawImage(img, -cropX, -cropY, scaledWidth, scaledHeight)

        // Convert to blob and then to File
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const processedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              })
              resolve(processedFile)
            } else {
              reject(new Error("Failed to process image"))
            }
          },
          "image/jpeg",
          0.9,
        )
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    try {
      const processedFile = await processImage(file)
      setUploadedImage(processedFile)

      // Create preview URL
      const previewUrl = URL.createObjectURL(processedFile)
      setImagePreview(previewUrl)

      // Update form data with the processed image
      setFormData((prev) => ({ ...prev, image: previewUrl }))
    } catch (error) {
      console.error("Error processing image:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const removeImage = () => {
    setUploadedImage(null)
    setImagePreview("")
    setFormData((prev) => ({ ...prev, image: "" }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Categoria</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label>Upload de Imagem</Label>
            <div className="space-y-2">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Nenhuma imagem selecionada</p>
                </div>
              )}

              <div>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="category-image-upload"
                  disabled={isProcessing}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("category-image-upload")?.click()}
                  disabled={isProcessing}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isProcessing ? "Processando..." : imagePreview ? "Alterar Imagem" : "Fazer Upload"}
                </Button>
              </div>

              <p className="text-xs text-gray-500">
                Tamanho recomendado: 49x49 pixels
                <br />
                Imagens serão redimensionadas automaticamente
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{category ? "Salvar Alterações" : "Criar Categoria"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

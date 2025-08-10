"use client"



import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Save, Palette, Monitor, Sun, Moon, Upload, X, Plus, Trash2, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

// Interface for team member
interface TeamMember {
  id: string
  name: string
  role: string
  description: string
  image: File | null
  imageUrl?: string
}

interface AppearanceSettingsProps {
  settings: Record<string, any>
  onSave: (settings: Record<string, any>) => Promise<boolean>
  onMarkUnsaved?: () => void
}

// Add the image processing utility function at the top of the file, after the imports
const processImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        // Create canvas for resizing/cropping
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        // Set canvas size to target dimensions
        canvas.width = 660
        canvas.height = 660

        // Calculate dimensions for center cropping
        let sourceX = 0
        let sourceY = 0
        let sourceWidth = img.width
        let sourceHeight = img.height

        // Determine which dimension to use as the source
        if (img.width / img.height > 1) {
          // Image is wider than tall
          sourceWidth = img.height
          sourceX = (img.width - sourceWidth) / 2
        } else {
          // Image is taller than wide
          sourceHeight = img.width
          sourceY = (img.height - sourceHeight) / 2
        }

        // Draw the image on the canvas with center cropping
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight, // Source rectangle
          0,
          0,
          660,
          660, // Destination rectangle
        )

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas to Blob conversion failed"))
              return
            }
            // Create a new file from the blob
            const processedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            })
            resolve(processedFile)
          },
          "image/jpeg",
          0.9,
        )
      }
      img.onerror = () => reject(new Error("Image loading failed"))
      img.src = event.target?.result as string
    }
    reader.onerror = () => reject(new Error("File reading failed"))
    reader.readAsDataURL(file)
  })
}

export function AppearanceSettings({ settings: initialSettings, onSave, onMarkUnsaved }: AppearanceSettingsProps) {
  const [settings, setSettings] = useState({
    primaryColor: initialSettings.primaryColor || "#ef4444",
    secondaryColor: initialSettings.secondaryColor || "#f97316",
    theme: initialSettings.theme || "light",
    fontFamily: initialSettings.fontFamily || "Inter",
    fontSize: initialSettings.fontSize || "medium",
    borderRadius: initialSettings.borderRadius || "medium",
    showBranding: initialSettings.showBranding ?? true,
    customCSS: initialSettings.customCSS || "",
    aboutTitle: initialSettings.aboutTitle || "Nossa História",
    aboutSubtitle: initialSettings.aboutSubtitle || "Tradição e Sabor desde 2010",
    aboutDescription: initialSettings.aboutDescription || "Somos uma pizzaria familiar que nasceu do sonho de compartilhar o verdadeiro sabor da pizza italiana com nossa comunidade.",
    storyTitle: initialSettings.storyTitle || "Como Tudo Começou",
    storyContent: initialSettings.storyContent || "Em 2010, com muito amor pela culinária italiana e o sonho de criar algo especial, nasceu a Pizza Express...",
    valuesTitle: initialSettings.valuesTitle || "Nossos Valores",
    valuesSubtitle: initialSettings.valuesSubtitle || "Os princípios que nos guiam todos os dias",
    teamTitle: initialSettings.teamTitle || "Nossa Equipe",
    teamSubtitle: initialSettings.teamSubtitle || "As pessoas que fazem a magia acontecer",
    showTeamSection: initialSettings.showTeamSection ?? true,
    aboutHeroImage: null as File | null,
    aboutStoryImage: null as File | null,
  })

  // State for team members - garantir que seja sempre um array
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(
    Array.isArray(initialSettings.teamMembers) ? initialSettings.teamMembers : [
      {
        id: "1",
        name: "Marco Rossi",
        role: "Chef Pizzaiolo",
        description:
          "Com mais de 15 anos de experiência, Marco é o responsável por manter a tradição e qualidade de nossas pizzas.",
        image: null,
        imageUrl: "/placeholder.svg?height=300&width=300",
      },
      {
        id: "2",
        name: "Ana Silva",
        role: "Gerente Geral",
        description: "Ana cuida de toda a operação, garantindo que cada cliente tenha a melhor experiência possível.",
        image: null,
        imageUrl: "/placeholder.svg?height=300&width=300",
      },
      {
        id: "3",
        name: "Carlos Santos",
        role: "Coordenador de Delivery",
        description:
          "Carlos lidera nossa equipe de entrega, assegurando que sua pizza chegue quentinha e no tempo certo.",
        image: null,
        imageUrl: "/placeholder.svg?height=300&width=300",
      },
    ]
  )

  const [isLoading, setIsLoading] = useState(false)
  const [processingImageId, setProcessingImageId] = useState<string | null>(null)

  const handleInputChange = (field: string, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  // Handle team member field changes
  const handleTeamMemberChange = (id: string, field: string, value: string) => {
    setTeamMembers((prev) => prev.map((member) => (member.id === id ? { ...member, [field]: value } : member)))
  }

  // Handle team member image upload
  const handleTeamMemberImageUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProcessingImageId(id)
      try {
        const processedFile = await processImage(file)
        setTeamMembers((prev) =>
          prev.map((member) =>
            member.id === id
              ? {
                  ...member,
                  image: processedFile,
                  imageUrl: URL.createObjectURL(processedFile),
                }
              : member,
          ),
        )
      } catch (error) {
        console.error("Error processing image:", error)
      } finally {
        setProcessingImageId(null)
      }
    }
  }

  // Remove team member image
  const removeTeamMemberImage = (id: string) => {
    setTeamMembers((prev) =>
      prev.map((member) =>
        member.id === id
          ? {
              ...member,
              image: null,
              imageUrl: "/placeholder.svg?height=300&width=300",
            }
          : member,
      ),
    )
  }

  // Add new team member
  const addTeamMember = () => {
    const newId = (teamMembers.length + 1).toString()
    setTeamMembers((prev) => [
      ...prev,
      {
        id: newId,
        name: "",
        role: "",
        description: "",
        image: null,
        imageUrl: "/placeholder.svg?height=300&width=300",
      },
    ])
  }

  // Remove team member
  const removeTeamMember = (id: string) => {
    setTeamMembers((prev) => prev.filter((member) => member.id !== id))
  }

  // Handle about hero image upload
  const handleAboutHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsLoading(true)
      try {
        const processedFile = await processImage(file)
        setSettings((prev) => ({ ...prev, aboutHeroImage: processedFile }))
      } catch (error) {
        console.error("Error processing image:", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Handle about story image upload
  const handleAboutStoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsLoading(true)
      try {
        const processedFile = await processImage(file)
        setSettings((prev) => ({ ...prev, aboutStoryImage: processedFile }))
      } catch (error) {
        console.error("Error processing image:", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const removeAboutHeroImage = () => {
    setSettings((prev) => ({ ...prev, aboutHeroImage: null }))
  }

  const removeAboutStoryImage = () => {
    setSettings((prev) => ({ ...prev, aboutStoryImage: null }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Filtrar apenas as configurações que devem ser salvas (excluir files)
      const { aboutHeroImage, aboutStoryImage, ...settingsToSave } = settings
      
      // Incluir dados dos membros da equipe
      const finalSettings = {
        ...settingsToSave,
        teamMembers: teamMembers.map(({ image, ...member }) => member) // Remove File objects
      }
      
      console.log("Saving appearance settings:", finalSettings)
      await onSave(finalSettings)
    } catch (error) {
      console.error("Error saving appearance settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const colorPresets = [
    { name: "Vermelho (Padrão)", value: "#ef4444" },
    { name: "Azul", value: "#3b82f6" },
    { name: "Verde", value: "#10b981" },
    { name: "Roxo", value: "#8b5cf6" },
    { name: "Laranja", value: "#f97316" },
    { name: "Rosa", value: "#ec4899" },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Cores do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Cor Primária</Label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {colorPresets.map((color) => (
                <button
                  key={color.value}
                  className={`w-full h-12 rounded-lg border-2 transition-all ${
                    settings.primaryColor === color.value ? "border-gray-900 scale-105" : "border-gray-200"
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => handleInputChange("primaryColor", color.value)}
                  title={color.name}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                className="w-12 h-8 rounded border"
              />
              <span className="text-sm text-gray-600">Cor personalizada</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Cor Secundária</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.secondaryColor}
                onChange={(e) => handleInputChange("secondaryColor", e.target.value)}
                className="w-12 h-8 rounded border"
              />
              <span className="text-sm text-gray-600">{settings.secondaryColor}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tema e Aparência</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tema</Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-all ${
                  settings.theme === "light" ? "border-primary bg-primary/5" : "border-gray-200"
                }`}
                onClick={() => handleInputChange("theme", "light")}
              >
                <Sun className="w-6 h-6" />
                <span className="text-sm">Claro</span>
              </button>
              <button
                className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-all ${
                  settings.theme === "dark" ? "border-primary bg-primary/5" : "border-gray-200"
                }`}
                onClick={() => handleInputChange("theme", "dark")}
              >
                <Moon className="w-6 h-6" />
                <span className="text-sm">Escuro</span>
              </button>
              <button
                className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-all ${
                  settings.theme === "auto" ? "border-primary bg-primary/5" : "border-gray-200"
                }`}
                onClick={() => handleInputChange("theme", "auto")}
              >
                <Monitor className="w-6 h-6" />
                <span className="text-sm">Automático</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fontFamily">Família da Fonte</Label>
              <Select value={settings.fontFamily} onValueChange={(value) => handleInputChange("fontFamily", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter (Padrão)</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                  <SelectItem value="Open Sans">Open Sans</SelectItem>
                  <SelectItem value="Poppins">Poppins</SelectItem>
                  <SelectItem value="Montserrat">Montserrat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fontSize">Tamanho da Fonte</Label>
              <Select value={settings.fontSize} onValueChange={(value) => handleInputChange("fontSize", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequeno</SelectItem>
                  <SelectItem value="medium">Médio (Padrão)</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="borderRadius">Arredondamento dos Cantos</Label>
            <Select value={settings.borderRadius} onValueChange={(value) => handleInputChange("borderRadius", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                <SelectItem value="small">Pequeno</SelectItem>
                <SelectItem value="medium">Médio (Padrão)</SelectItem>
                <SelectItem value="large">Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personalização Avançada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="showBranding">Mostrar Marca Pizza Express</Label>
              <p className="text-sm text-gray-600">Exibe a marca Pizza Express no rodapé do site</p>
            </div>
            <Switch
              id="showBranding"
              checked={settings.showBranding}
              onCheckedChange={(checked) => handleInputChange("showBranding", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Conteúdo da Página "Sobre Nós"
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hero Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Seção Principal (Hero)</h3>

            <div className="space-y-2">
              <Label htmlFor="aboutTitle">Título Principal</Label>
              <Input
                id="aboutTitle"
                value={settings.aboutTitle}
                onChange={(e) => handleInputChange("aboutTitle", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aboutSubtitle">Subtítulo</Label>
              <Input
                id="aboutSubtitle"
                value={settings.aboutSubtitle}
                onChange={(e) => handleInputChange("aboutSubtitle", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aboutDescription">Descrição Principal</Label>
              <Textarea
                id="aboutDescription"
                value={settings.aboutDescription}
                onChange={(e) => handleInputChange("aboutDescription", e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aboutHeroImage">Imagem Principal</Label>
              <div className="space-y-3">
                {settings.aboutHeroImage && (
                  <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(settings.aboutHeroImage) || "/placeholder.svg"}
                      alt="Preview da imagem principal"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeAboutHeroImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      id="aboutHeroImage"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handleAboutHeroImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("aboutHeroImage")?.click()}
                      disabled={isLoading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {settings.aboutHeroImage ? "Alterar Imagem" : "Fazer Upload"}
                    </Button>
                    <p className="text-sm text-gray-600">JPG, PNG, WEBP até 5MB</p>
                  </div>
                  <p className="text-sm text-gray-500">
                    Tamanho recomendado: 660x660 pixels (imagens serão redimensionadas automaticamente)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Story Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Seção da História</h3>

            <div className="space-y-2">
              <Label htmlFor="storyTitle">Título da História</Label>
              <Input
                id="storyTitle"
                value={settings.storyTitle}
                onChange={(e) => handleInputChange("storyTitle", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storyContent">Conteúdo da História</Label>
              <Textarea
                id="storyContent"
                value={settings.storyContent}
                onChange={(e) => handleInputChange("storyContent", e.target.value)}
                rows={6}
                placeholder="Digite a história da sua pizzaria..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aboutStoryImage">Imagem da História</Label>
              <div className="space-y-3">
                {settings.aboutStoryImage && (
                  <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(settings.aboutStoryImage) || "/placeholder.svg"}
                      alt="Preview da imagem da história"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeAboutStoryImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      id="aboutStoryImage"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handleAboutStoryImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("aboutStoryImage")?.click()}
                      disabled={isLoading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {settings.aboutStoryImage ? "Alterar Imagem" : "Fazer Upload"}
                    </Button>
                    <p className="text-sm text-gray-600">JPG, PNG, WEBP até 5MB</p>
                  </div>
                  <p className="text-sm text-gray-500">
                    Tamanho recomendado: 660x660 pixels (imagens serão redimensionadas automaticamente)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Values Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Seção dos Valores</h3>

            <div className="space-y-2">
              <Label htmlFor="valuesTitle">Título dos Valores</Label>
              <Input
                id="valuesTitle"
                value={settings.valuesTitle}
                onChange={(e) => handleInputChange("valuesTitle", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valuesSubtitle">Subtítulo dos Valores</Label>
              <Input
                id="valuesSubtitle"
                value={settings.valuesSubtitle}
                onChange={(e) => handleInputChange("valuesSubtitle", e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Team Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Seção da Equipe
              </h3>
              <div className="flex items-center gap-2">
                <Label htmlFor="showTeamSection" className="text-sm">
                  Exibir seção
                </Label>
                <Switch
                  id="showTeamSection"
                  checked={settings.showTeamSection}
                  onCheckedChange={(checked) => handleInputChange("showTeamSection", checked)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamTitle">Título da Equipe</Label>
              <Input
                id="teamTitle"
                value={settings.teamTitle}
                onChange={(e) => handleInputChange("teamTitle", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamSubtitle">Subtítulo da Equipe</Label>
              <Input
                id="teamSubtitle"
                value={settings.teamSubtitle}
                onChange={(e) => handleInputChange("teamSubtitle", e.target.value)}
              />
            </div>

            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Membros da Equipe</h4>
                <Button onClick={addTeamMember} size="sm" variant="outline" className="flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  Adicionar Membro
                </Button>
              </div>

              {Array.isArray(teamMembers) && teamMembers.map((member, index) => (
                <Card key={member.id} className="overflow-hidden">
                  <CardHeader className="bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Membro {index + 1}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTeamMember(member.id)}
                        className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">Remover membro</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`member-${member.id}-name`}>Nome</Label>
                        <Input
                          id={`member-${member.id}-name`}
                          value={member.name}
                          onChange={(e) => handleTeamMemberChange(member.id, "name", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`member-${member.id}-role`}>Cargo</Label>
                        <Input
                          id={`member-${member.id}-role`}
                          value={member.role}
                          onChange={(e) => handleTeamMemberChange(member.id, "role", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`member-${member.id}-description`}>Descrição</Label>
                      <Textarea
                        id={`member-${member.id}-description`}
                        value={member.description}
                        onChange={(e) => handleTeamMemberChange(member.id, "description", e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`member-${member.id}-image`}>Foto</Label>
                      <div className="space-y-3">
                        <div className="relative w-32 h-32 bg-gray-100 rounded-full overflow-hidden mx-auto">
                          <img
                            src={member.imageUrl || "/placeholder.svg"}
                            alt={`Foto de ${member.name}`}
                            className="w-full h-full object-cover"
                          />
                          {member.image && (
                            <button
                              type="button"
                              onClick={() => removeTeamMemberImage(member.id)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-4">
                            <input
                              type="file"
                              id={`member-${member.id}-image`}
                              accept=".jpg,.jpeg,.png,.webp"
                              onChange={(e) => handleTeamMemberImageUpload(member.id, e)}
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById(`member-${member.id}-image`)?.click()}
                              disabled={processingImageId === member.id}
                              className="w-full max-w-xs"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              {processingImageId === member.id
                                ? "Processando..."
                                : member.image
                                  ? "Alterar Foto"
                                  : "Fazer Upload"}
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 text-center">
                            Tamanho recomendado: 660x660 pixels (imagens serão redimensionadas automaticamente)
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(!Array.isArray(teamMembers) || teamMembers.length === 0) && (
                <div className="text-center py-8 border rounded-lg bg-gray-50">
                  <p className="text-gray-500">Nenhum membro da equipe adicionado.</p>
                  <Button onClick={addTeamMember} variant="outline" className="mt-2">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Membro
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Salvando..." : "Salvar Aparência"}
        </Button>
      </div>
    </div>
  )
}

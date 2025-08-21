// Sistema de validação centralizado usando Zod
import { z } from 'zod'

// Schema para registro de usuário
export const userRegistrationSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .min(1, 'Email é obrigatório')
    .max(255, 'Email muito longo')
    .transform(val => val.toLowerCase().trim()),
  
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(128, 'Senha muito longa')
    .refine(
      (password) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        return (
          password.length >= minLength &&
          hasUpperCase &&
          hasLowerCase &&
          hasNumbers &&
          hasSpecialChar
        );
      },
      'A senha deve ter pelo menos 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais'
    ),
  
  full_name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .transform(val => val.trim())
    .refine(val => val.length >= 2, 'Nome é obrigatório'),
  
  phone: z.string()
    .optional()
    .transform(val => val ? val.replace(/\D/g, '') : undefined)
    .refine(
      (phone) => !phone || (phone.length >= 10 && phone.length <= 11),
      'Telefone deve ter 10 ou 11 dígitos'
    ),
  
  role: z.enum(['customer', 'admin', 'manager', 'kitchen', 'delivery'])
    .default('customer')
})

// Schema para login
export const userLoginSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .min(1, 'Email é obrigatório')
    .transform(val => val.toLowerCase().trim()),
  
  password: z.string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
})

// Schema para endereço
export const addressSchema = z.object({
  zipCode: z.string()
    .min(1, 'CEP é obrigatório')
    .regex(/^\d{5}-?\d{3}$/, 'CEP deve ter formato 00000-000')
    .transform(val => val.replace(/\D/g, '')),
  
  street: z.string()
    .min(1, 'Rua é obrigatória')
    .max(200, 'Nome da rua muito longo')
    .transform(val => val.trim()),
  
  neighborhood: z.string()
    .min(1, 'Bairro é obrigatório')
    .max(100, 'Nome do bairro muito longo')
    .transform(val => val.trim()),
  
  city: z.string()
    .min(1, 'Cidade é obrigatória')
    .max(100, 'Nome da cidade muito longo')
    .transform(val => val.trim()),
  
  state: z.string()
    .length(2, 'Estado deve ter 2 caracteres')
    .transform(val => val.toUpperCase()),
  
  number: z.string()
    .min(1, 'Número é obrigatório')
    .max(20, 'Número muito longo')
    .transform(val => val.trim()),
  
  complement: z.string()
    .max(100, 'Complemento muito longo')
    .optional()
    .transform(val => val?.trim() || undefined)
})

// Schema para produto
export const productSchema = z.object({
  name: z.string()
    .min(1, 'Nome do produto é obrigatório')
    .max(100, 'Nome muito longo')
    .transform(val => val.trim()),
  
  description: z.string()
    .max(500, 'Descrição muito longa')
    .optional()
    .transform(val => val?.trim() || undefined),
  
  price: z.number()
    .positive('Preço deve ser maior que 0')
    .max(9999.99, 'Preço muito alto')
    .refine(val => Number.isFinite(val), 'Preço inválido'),
  
  category_id: z.string()
    .uuid('ID da categoria deve ser um UUID válido'),
  
  image_url: z.string()
    .url('Deve ser uma URL válida')
    .optional(),
  
  active: z.boolean()
    .default(true),
  
  preparation_time: z.number()
    .int('Tempo de preparo deve ser um número inteiro')
    .min(1, 'Tempo de preparo deve ser pelo menos 1 minuto')
    .max(120, 'Tempo de preparo muito longo')
    .optional()
})

// Schema para categoria
export const categorySchema = z.object({
  name: z.string()
    .min(1, 'Nome da categoria é obrigatório')
    .max(50, 'Nome muito longo')
    .transform(val => val.trim()),
  
  description: z.string()
    .max(200, 'Descrição muito longa')
    .optional()
    .transform(val => val?.trim() || undefined),
  
  display_order: z.number()
    .int('Ordem deve ser um número inteiro')
    .min(0, 'Ordem deve ser positiva')
    .default(0)
})

// Schema para pedido
export const orderSchema = z.object({
  userId: z.string()
    .min(1, 'ID do usuário é obrigatório'),
  
  items: z.array(z.object({
    productId: z.string().uuid('ID do produto deve ser um UUID válido'),
    quantity: z.number().int().min(1, 'Quantidade deve ser maior que 0'),
    price: z.number().positive('Preço deve ser maior que 0'),
    notes: z.string().max(200, 'Observações muito longas').optional()
  })).min(1, 'Pedido deve ter pelo menos 1 item'),
  
  total: z.number()
    .positive('Total deve ser maior que 0'),
  
  deliveryAddress: z.object({
    street: z.string().min(1, 'Rua é obrigatória'),
    city: z.string().min(1, 'Cidade é obrigatória'),
    zipCode: z.string().min(1, 'CEP é obrigatório'),
    complement: z.string().optional()
  }).optional(),
  
  paymentMethod: z.enum(['credit_card', 'debit_card', 'pix', 'cash', 'mercadopago'])
    .optional(),
  
  couponCode: z.string().optional(),
  
  notes: z.string()
    .max(500, 'Observações muito longas')
    .optional()
    .transform(val => val?.trim() || undefined)
})

// Schema para cupom de desconto
export const couponSchema = z.object({
  userId: z.string({
    required_error: 'ID do usuário é obrigatório'
  })
    .min(1, 'ID do usuário é obrigatório'),
  
  couponCode: z.string({
    required_error: 'Código do cupom é obrigatório'
  })
    .min(1, 'Código do cupom é obrigatório')
    .transform(val => val.trim().toUpperCase().replace(/\s+/g, ''))
    .refine(val => val.length >= 3, 'Código deve ter pelo menos 3 caracteres')
    .refine(val => val.length <= 20, 'Código deve ter no máximo 20 caracteres')
    .refine(val => /^[A-Z0-9]+$/.test(val), 'Código deve conter apenas letras maiúsculas e números'),
  
  orderId: z.string().optional()
})

// Schema para entregador
export const driverSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .transform(val => val.trim()),
  
  email: z.string()
    .email('Email inválido')
    .min(1, 'Email é obrigatório')
    .max(255, 'Email muito longo')
    .transform(val => val.toLowerCase().trim()),
  
  phone: z.string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .max(15, 'Telefone muito longo')
    .transform(val => val.replace(/\D/g, ''))
    .refine(val => val.length >= 10, 'Telefone deve ter pelo menos 10 dígitos'),
  
  vehicleType: z.enum(['motorcycle', 'bicycle', 'scooter', 'car'])
    .default('motorcycle'),
  
  vehiclePlate: z.string()
    .max(10, 'Placa muito longa')
    .optional()
    .transform(val => val?.trim().toUpperCase()),
  
  currentLocation: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional()
})

// Schema para favoritos
export const favoriteSchema = z.object({
  userId: z.string()
    .min(1, 'ID do usuário é obrigatório'),
  
  productId: z.string()
    .uuid('ID do produto deve ser um UUID válido')
})

// Schema para notificações
export const notificationSchema = z.object({
  userId: z.string()
    .min(1, 'ID do usuário é obrigatório'),
  
  title: z.string()
    .min(1, 'Título é obrigatório')
    .max(100, 'Título muito longo')
    .transform(val => val.trim()),
  
  message: z.string()
    .min(1, 'Mensagem é obrigatória')
    .max(500, 'Mensagem muito longa')
    .transform(val => val.trim()),
  
  type: z.enum(['order', 'promotion', 'system', 'delivery'])
    .default('system'),
  
  data: z.record(z.any()).optional()
})

// Schema para atualização de perfil
export const profileUpdateSchema = z.object({
  full_name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .transform(val => val.trim())
    .optional(),
  
  phone: z.string()
    .transform(val => val ? val.replace(/\D/g, '') : undefined)
    .refine(
      (phone) => !phone || (phone.length >= 10 && phone.length <= 11),
      'Telefone deve ter 10 ou 11 dígitos'
    )
    .optional(),
  
  avatar_url: z.string()
    .url('URL do avatar inválida')
    .optional()
})

// Schema para alteração de senha
export const passwordChangeSchema = z.object({
  current_password: z.string()
    .min(1, 'Senha atual é obrigatória'),
  
  new_password: z.string()
    .min(6, 'Nova senha deve ter pelo menos 6 caracteres')
    .max(128, 'Nova senha muito longa')
    .refine(
      (password) => {
        return /(?=.*[a-z])(?=.*[A-Z])/.test(password) || /(?=.*\d)/.test(password)
      },
      'Nova senha deve conter pelo menos uma letra maiúscula e minúscula, ou um número'
    ),
  
  confirm_password: z.string()
    .min(1, 'Confirmação de senha é obrigatória')
}).refine(
  (data) => data.new_password === data.confirm_password,
  {
    message: 'Senhas não coincidem',
    path: ['confirm_password']
  }
)

// Schema para configurações de pagamento
export const paymentSettingsSchema = z.object({
  mercadopago_access_token: z.string()
    .min(1, 'Token do Mercado Pago é obrigatório')
    .refine(
      (token) => token.startsWith('TEST-') || token.startsWith('APP_USR-'),
      'Token deve começar com TEST- ou APP_USR-'
    )
    .optional(),
  
  paypal_client_id: z.string()
    .min(1, 'Client ID do PayPal é obrigatório')
    .optional(),
  
  enable_cash_payment: z.boolean()
    .default(true),
  
  enable_card_payment: z.boolean()
    .default(true),
  
  enable_pix_payment: z.boolean()
    .default(true)
})

// Tipos TypeScript derivados dos schemas
export type UserRegistration = z.infer<typeof userRegistrationSchema>
export type UserLogin = z.infer<typeof userLoginSchema>
export type Address = z.infer<typeof addressSchema>
export type Product = z.infer<typeof productSchema>
export type Category = z.infer<typeof categorySchema>
export type Order = z.infer<typeof orderSchema>
export type Coupon = z.infer<typeof couponSchema>
export type Driver = z.infer<typeof driverSchema>
export type Favorite = z.infer<typeof favoriteSchema>
export type Notification = z.infer<typeof notificationSchema>
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>
export type PasswordChange = z.infer<typeof passwordChangeSchema>
export type PaymentSettings = z.infer<typeof paymentSettingsSchema>

// Função utilitária para validar dados
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: Array<{ field: string; message: string }>
} {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }
    }
    throw error
  }
}

// Função para validar dados de forma assíncrona
export async function validateDataAsync<T>(schema: z.ZodSchema<T>, data: unknown): Promise<{
  success: boolean
  data?: T
  errors?: Array<{ field: string; message: string }>
}> {
  try {
    const validatedData = await schema.parseAsync(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }
    }
    throw error
  }
}
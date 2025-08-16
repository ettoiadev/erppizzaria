import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
})

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().optional()
})

export const productSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  price: z.number().positive('Preço deve ser positivo'),
  category_id: z.string().uuid('ID da categoria inválido'),
  image_url: z.string().url().optional(),
  active: z.boolean().default(true)
})

export const categorySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  active: z.boolean().default(true)
})

export const orderSchema = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().positive(),
    notes: z.string().optional()
  })).min(1, 'Pedido deve ter pelo menos 1 item'),
  delivery_address: z.string().optional()
})

export type LoginData = z.infer<typeof loginSchema>
export type RegisterData = z.infer<typeof registerSchema>
export type ProductData = z.infer<typeof productSchema>
export type CategoryData = z.infer<typeof categorySchema>
export type OrderData = z.infer<typeof orderSchema>
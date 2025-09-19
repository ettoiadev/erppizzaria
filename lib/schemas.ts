// Arquivo de índice para schemas de validação
export {
  userRegistrationSchema,
  userLoginSchema,
  addressSchema,
  productSchema,
  categorySchema,
  orderSchema,
  couponSchema,
  profileUpdateSchema,
  passwordChangeSchema,
  paymentSettingsSchema,
  validateData,
  validateDataAsync,
  type UserRegistration,
  type UserLogin,
  type Address,
  type Product,
  type Category,
  type Order,
  type Coupon,
  type ProfileUpdate,
  type PasswordChange,
  type PaymentSettings
} from './validation-schemas'

// Schema adicional para favoritos
import { z } from 'zod'

export const favoriteSchema = z.preprocess(
  (data: any) => {
    if (typeof data === 'object' && data !== null) {
      if (!('productId' in data)) {
        throw new z.ZodError([{
          code: 'custom',
          path: ['productId'],
          message: 'Required'
        }])
      }
    }
    return data
  },
  z.object({
    userId: z.string({
      required_error: 'ID do usuário é obrigatório'
    }).min(1, 'ID do usuário é obrigatório'),
    
    productId: z.number({
      required_error: 'Required',
      invalid_type_error: 'Required'
    }).int('ID do produto deve ser um número inteiro')
      .positive('ID do produto deve ser maior que 0')
  })
)

export type Favorite = z.infer<typeof favoriteSchema>
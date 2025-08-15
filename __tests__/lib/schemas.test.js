import {
  productSchema,
  orderSchema,
  favoriteSchema,
  couponSchema
} from '@/lib/schemas'

describe('Validation Schemas', () => {
  describe('productSchema', () => {
    it('deve validar produto válido', () => {
      const validProduct = {
        name: 'Pizza Margherita',
        description: 'Pizza tradicional com molho de tomate, mussarela e manjericão',
        price: 25.90,
        category_id: 1,
        active: true,
        image_url: 'https://example.com/pizza.jpg'
      }

      const result = productSchema.safeParse(validProduct)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validProduct)
      }
    })

    it('deve rejeitar produto com nome vazio', () => {
      const invalidProduct = {
        name: '',
        description: 'Descrição válida',
        price: 25.90,
        category_id: 1,
        active: true
      }

      const result = productSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name')
        expect(result.error.issues[0].message).toContain('obrigatório')
      }
    })

    it('deve rejeitar produto com preço negativo', () => {
      const invalidProduct = {
        name: 'Pizza Teste',
        description: 'Descrição válida',
        price: -10.00,
        category_id: 1,
        active: true
      }

      const result = productSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('price')
        expect(result.error.issues[0].message).toContain('maior que 0')
      }
    })

    it('deve rejeitar produto com category_id inválido', () => {
      const invalidProduct = {
        name: 'Pizza Teste',
        description: 'Descrição válida',
        price: 25.90,
        category_id: 0,
        active: true
      }

      const result = productSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('category_id')
        expect(result.error.issues[0].message).toContain('maior que 0')
      }
    })

    it('deve aceitar campos opcionais ausentes', () => {
      const minimalProduct = {
        name: 'Pizza Simples',
        price: 20.00,
        category_id: 1
      }

      const result = productSchema.safeParse(minimalProduct)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.active).toBe(true) // valor padrão
        expect(result.data.description).toBeUndefined()
        expect(result.data.image_url).toBeUndefined()
      }
    })

    it('deve rejeitar URL de imagem inválida', () => {
      const invalidProduct = {
        name: 'Pizza Teste',
        price: 25.90,
        category_id: 1,
        image_url: 'not-a-valid-url'
      }

      const result = productSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('image_url')
        expect(result.error.issues[0].message).toContain('URL válida')
      }
    })
  })

  describe('orderSchema', () => {
    it('deve validar pedido válido', () => {
      const validOrder = {
        userId: 'user-123',
        items: [
          {
            productId: 1,
            quantity: 2,
            price: 25.90
          },
          {
            productId: 2,
            quantity: 1,
            price: 29.90
          }
        ],
        total: 81.70,
        deliveryAddress: {
          street: 'Rua das Flores, 123',
          city: 'São Paulo',
          zipCode: '01234-567',
          complement: 'Apto 45'
        },
        paymentMethod: 'credit_card',
        couponCode: 'DESCONTO10'
      }

      const result = orderSchema.safeParse(validOrder)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.items).toHaveLength(2)
        expect(result.data.total).toBe(81.70)
      }
    })

    it('deve rejeitar pedido com userId vazio', () => {
      const invalidOrder = {
        userId: '',
        items: [
          {
            productId: 1,
            quantity: 1,
            price: 25.90
          }
        ],
        total: 25.90
      }

      const result = orderSchema.safeParse(invalidOrder)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('userId')
        expect(result.error.issues[0].message).toContain('obrigatório')
      }
    })

    it('deve rejeitar pedido com array de itens vazio', () => {
      const invalidOrder = {
        userId: 'user-123',
        items: [],
        total: 0
      }

      const result = orderSchema.safeParse(invalidOrder)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('items')
        expect(result.error.issues[0].message).toContain('pelo menos 1')
      }
    })

    it('deve rejeitar item com quantidade zero ou negativa', () => {
      const invalidOrder = {
        userId: 'user-123',
        items: [
          {
            productId: 1,
            quantity: 0,
            price: 25.90
          }
        ],
        total: 25.90
      }

      const result = orderSchema.safeParse(invalidOrder)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('quantity')
        expect(result.error.issues[0].message).toContain('maior que 0')
      }
    })

    it('deve rejeitar total negativo', () => {
      const invalidOrder = {
        userId: 'user-123',
        items: [
          {
            productId: 1,
            quantity: 1,
            price: 25.90
          }
        ],
        total: -10.00
      }

      const result = orderSchema.safeParse(invalidOrder)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('total')
        expect(result.error.issues[0].message).toContain('maior que 0')
      }
    })

    it('deve validar endereço de entrega completo', () => {
      const orderWithAddress = {
        userId: 'user-123',
        items: [
          {
            productId: 1,
            quantity: 1,
            price: 25.90
          }
        ],
        total: 25.90,
        deliveryAddress: {
          street: 'Rua das Flores, 123',
          city: 'São Paulo',
          zipCode: '01234-567'
        }
      }

      const result = orderSchema.safeParse(orderWithAddress)
      expect(result.success).toBe(true)
    })

    it('deve rejeitar endereço com campos obrigatórios ausentes', () => {
      const invalidOrder = {
        userId: 'user-123',
        items: [
          {
            productId: 1,
            quantity: 1,
            price: 25.90
          }
        ],
        total: 25.90,
        deliveryAddress: {
          street: 'Rua das Flores, 123'
          // city e zipCode ausentes
        }
      }

      const result = orderSchema.safeParse(invalidOrder)
      expect(result.success).toBe(false)
      if (!result.success) {
        const paths = result.error.issues.map(issue => issue.path.join('.'))
        expect(paths).toContain('deliveryAddress.city')
        expect(paths).toContain('deliveryAddress.zipCode')
      }
    })
  })

  describe('favoriteSchema', () => {
    it('deve validar favorito válido', () => {
      const validFavorite = {
        userId: 'user-123',
        productId: 1
      }

      const result = favoriteSchema.safeParse(validFavorite)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.userId).toBe('user-123')
        expect(result.data.productId).toBe(1)
      }
    })

    it('deve rejeitar favorito com userId vazio', () => {
      const invalidFavorite = {
        userId: '',
        productId: 1
      }

      const result = favoriteSchema.safeParse(invalidFavorite)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('userId')
        expect(result.error.issues[0].message).toContain('obrigatório')
      }
    })

    it('deve rejeitar favorito com productId inválido', () => {
      const invalidFavorite = {
        userId: 'user-123',
        productId: 0
      }

      const result = favoriteSchema.safeParse(invalidFavorite)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('productId')
        expect(result.error.issues[0].message).toContain('maior que 0')
      }
    })

    it('deve rejeitar favorito com campos ausentes', () => {
      const invalidFavorite = {
        userId: 'user-123'
        // productId ausente
      }

      const result = favoriteSchema.safeParse(invalidFavorite)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('productId')
        expect(result.error.issues[0].message).toContain('Required')
      }
    })
  })

  describe('couponSchema', () => {
    it('deve validar cupom válido', () => {
      const validCoupon = {
        userId: 'user-123',
        couponCode: 'DESCONTO10'
      }

      const result = couponSchema.safeParse(validCoupon)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.userId).toBe('user-123')
        expect(result.data.couponCode).toBe('DESCONTO10')
      }
    })

    it('deve rejeitar cupom com userId vazio', () => {
      const invalidCoupon = {
        userId: '',
        couponCode: 'DESCONTO10'
      }

      const result = couponSchema.safeParse(invalidCoupon)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('userId')
        expect(result.error.issues[0].message).toContain('obrigatório')
      }
    })

    it('deve rejeitar cupom com código vazio', () => {
      const invalidCoupon = {
        userId: 'user-123',
        couponCode: ''
      }

      const result = couponSchema.safeParse(invalidCoupon)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('couponCode')
        expect(result.error.issues[0].message).toContain('obrigatório')
      }
    })

    it('deve normalizar código do cupom para maiúsculas', () => {
      const couponWithLowercase = {
        userId: 'user-123',
        couponCode: 'desconto10'
      }

      const result = couponSchema.safeParse(couponWithLowercase)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.couponCode).toBe('DESCONTO10')
      }
    })

    it('deve remover espaços em branco do código do cupom', () => {
      const couponWithSpaces = {
        userId: 'user-123',
        couponCode: '  DESCONTO10  '
      }

      const result = couponSchema.safeParse(couponWithSpaces)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.couponCode).toBe('DESCONTO10')
      }
    })

    it('deve rejeitar cupom com código muito curto', () => {
      const invalidCoupon = {
        userId: 'user-123',
        couponCode: 'AB'
      }

      const result = couponSchema.safeParse(invalidCoupon)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('couponCode')
        expect(result.error.issues[0].message).toContain('pelo menos 3')
      }
    })

    it('deve rejeitar cupom com código muito longo', () => {
      const invalidCoupon = {
        userId: 'user-123',
        couponCode: 'CODIGO_MUITO_LONGO_PARA_SER_VALIDO_123456789'
      }

      const result = couponSchema.safeParse(invalidCoupon)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('couponCode')
        expect(result.error.issues[0].message).toContain('máximo 20')
      }
    })
  })

  describe('Schema Integration', () => {
    it('deve validar dados complexos aninhados', () => {
      const complexOrder = {
        userId: 'user-123',
        items: [
          {
            productId: 1,
            quantity: 2,
            price: 25.90,
            customizations: {
              size: 'large',
              extras: ['cheese', 'pepperoni']
            }
          }
        ],
        total: 51.80,
        deliveryAddress: {
          street: 'Rua das Flores, 123',
          city: 'São Paulo',
          zipCode: '01234-567',
          complement: 'Apto 45',
          neighborhood: 'Centro'
        },
        paymentMethod: 'credit_card',
        notes: 'Sem cebola, por favor'
      }

      const result = orderSchema.safeParse(complexOrder)
      expect(result.success).toBe(true)
    })

    it('deve acumular múltiplos erros de validação', () => {
      const invalidData = {
        userId: '',
        items: [],
        total: -10,
        deliveryAddress: {
          street: '',
          city: '',
          zipCode: 'invalid-zip'
        }
      }

      const result = orderSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(1)
        const paths = result.error.issues.map(issue => issue.path.join('.'))
        expect(paths).toContain('userId')
        expect(paths).toContain('items')
        expect(paths).toContain('total')
      }
    })
  })
})
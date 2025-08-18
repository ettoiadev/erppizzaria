// Teste simples para validação
const { validateInput, authValidationSchema } = require('./lib/input-validation.ts')

const testData = {
  email: "teste",
  password: "123", 
  full_name: ""
}

console.log('Testando validação...')
try {
  const result = validateInput(testData, authValidationSchema)
  console.log('Resultado:', result)
} catch (error) {
  console.error('Erro:', error)
}
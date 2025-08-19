const bcrypt = require('bcryptjs');

// Hash do banco de dados
const hashFromDB = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

// Senha que estamos testando
const password = '123456';

console.log('Testando senha:', password);
console.log('Hash do banco:', hashFromDB);

// Verificar se a senha corresponde ao hash
const isValid = bcrypt.compareSync(password, hashFromDB);
console.log('Senha válida:', isValid);

// Vamos também testar outras senhas comuns
const commonPasswords = ['admin', 'password', '123456789', 'admin123', 'pizzaria'];

console.log('\nTestando outras senhas comuns:');
commonPasswords.forEach(pwd => {
  const valid = bcrypt.compareSync(pwd, hashFromDB);
  console.log(`${pwd}: ${valid}`);
});

// Gerar um novo hash para '123456' para comparação
const newHash = bcrypt.hashSync('123456', 10);
console.log('\nNovo hash para 123456:', newHash);
console.log('Novo hash válido:', bcrypt.compareSync('123456', newHash));
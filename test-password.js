const bcrypt = require('bcryptjs');

async function testPassword() {
  const password = 'admin123';
  const hash = '$2b$10$pOr7vzOa3jNUDSLS4MCUVeZb4pg3mvvUSK1PknTG9Q/8VmkFn.1FG';
  
  console.log('Testando senha:', password);
  console.log('Hash do banco:', hash);
  
  const isValid = await bcrypt.compare(password, hash);
  console.log('Senha válida?', isValid);
  
  // Criar novo hash para comparar
  const newHash = await bcrypt.hash(password, 10);
  console.log('Novo hash gerado:', newHash);
  
  const isNewValid = await bcrypt.compare(password, newHash);
  console.log('Novo hash válido?', isNewValid);
}

testPassword().catch(console.error); 
const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'password123';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password:', password);
  console.log('Hash:', hash);
  
  // Test the hash
  const isValid = await bcrypt.compare(password, hash);
  console.log('Hash validation:', isValid);
  
  // Test against the hash from the SQL script
  const oldHash = '$2a$10$rQj9kR9H5/rJNr1c.X8wQuGKCzXvXqnQgKYo7mGRs1PQJRjN8YXqO';
  const isOldHashValid = await bcrypt.compare(password, oldHash);
  console.log('Old hash validation:', isOldHashValid);
}

generateHash().catch(console.error);

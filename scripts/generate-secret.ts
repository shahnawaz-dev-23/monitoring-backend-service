import { randomBytes } from 'crypto';

// Generate a random 32-byte hex string (64 characters in hex)
const secret = randomBytes(32).toString('hex');
console.log('Generated JWT_SECRET:');
console.log(secret);
console.log('\nAdd this to your .env file as:');
console.log(`JWT_SECRET=${secret}`); 
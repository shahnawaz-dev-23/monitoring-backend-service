import { jwtVerify } from 'jose';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjJ9.GfBjC8AQFKHhuuujp2I4BYXw1cgcLpVwZSDzdeXytoQ';
const secret = '7f45a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9';

async function verifyToken() {
  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    console.log('Token verified successfully!');
    console.log('Payload:', payload);
  } catch (error) {
    console.error('Token verification failed:', error);
  }
}

verifyToken(); 
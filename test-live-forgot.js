const fetch = require('node-fetch');

async function testLiveForgot() {
  try {
    const res = await fetch('https://attendance-backend-h7if.onrender.com/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'omkarmore5178@gmail.com' }),
    });
    const data = await res.json();
    console.log('Live Render Response:', data);
  } catch (err) {
    console.error('Error testing live server:', err);
  }
}

testLiveForgot();

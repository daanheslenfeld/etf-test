// Test registration endpoint
const testData = {
  firstName: "Test",
  lastName: "User",
  email: "test@example.com",
  password: "testpassword123",
  street: "Test Street",
  houseNumber: "123",
  postalCode: "1234AB",
  city: "Amsterdam",
  phone: "0612345678",
  birthDate: "1990-01-01"
};

fetch('https://etf-test.vercel.app/api/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
.then(res => res.json())
.then(data => {
  console.log('\n=== REGISTRATION TEST RESULT ===');
  console.log(JSON.stringify(data, null, 2));
  console.log('\nSuccess:', data.success);
  console.log('Message:', data.message);
})
.catch(err => {
  console.error('\n=== ERROR ===');
  console.error(err.message);
});

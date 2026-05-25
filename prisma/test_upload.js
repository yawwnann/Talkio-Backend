require('dotenv').config({ override: true });
const http = require('http');
const fs = require('fs');
const path = require('path');

const loginData = JSON.stringify({ email: 'fiolita@gmail.com', password: 'password123' });
const loginReq = http.request({ hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) } }, (res) => {
  let body = '';
  res.on('data', (c) => body += c);
  res.on('end', () => {
    console.log('LOGIN response status:', res.statusCode);
    const login = JSON.parse(body);
    if (login.status !== 'success') { console.error('LOGIN FAILED:', login.message); process.exit(1); }
    const token = login.data.token;
    const userId = login.data.user.id;
    console.log('User ID:', userId);

    http.get({ hostname: 'localhost', port: 3000, path: '/api/children', headers: { 'Authorization': 'Bearer ' + token } }, (r2) => {
      let b2 = '';
      r2.on('data', (c) => {
        b2 += c;
        console.log('CHILDREN chunk received, total length so far:', b2.length);
      });
      r2.on('end', () => {
        console.log('CHILDREN status:', r2.statusCode);
        console.log('CHILDREN raw body:', b2.substring(0, 500));
        try {
          const children = JSON.parse(b2);
          console.log('CHILDREN parsed:', JSON.stringify(children).substring(0, 300));
          if (!children.data || children.data.length === 0) {
            console.error('NO CHILDREN FOUND - creating one...');
            // Create a child
            const childData = JSON.stringify({ name: 'Test Child', dateOfBirth: '2024-01-15', gender: 'MALE' });
            const crReq = http.request({ hostname: 'localhost', port: 3000, path: '/api/children', method: 'POST', headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(childData) } }, (r4) => {
              let b4 = '';
              r4.on('data', (c) => b4 += c);
              r4.on('end', () => {
                const cr = JSON.parse(b4);
                if (cr.status === 'success') {
                  console.log('CHILD CREATED:', cr.data.id);
                  // Now test upload
                  testUpload(token, cr.data.id);
                } else {
                  console.error('CHILD CREATE FAILED:', cr.message);
                }
              });
            });
            crReq.write(childData);
            crReq.end();
          } else {
            testUpload(token, children.data[0].id);
          }
        } catch(e) {
          console.error('PARSE ERROR:', e.message);
        }
      });
    });
  });
});
loginReq.write(loginData);
loginReq.end();

function testUpload(token, childId) {
  console.log('Testing upload for child:', childId);
  const testFilePath = path.join(__dirname, 'test_upload.png');
  const testBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  fs.writeFileSync(testFilePath, testBuffer);

  const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
  const bodyParts = [];
  bodyParts.push('--' + boundary);
  bodyParts.push('Content-Disposition: form-data; name="childId"');
  bodyParts.push('');
  bodyParts.push(childId);
  bodyParts.push('--' + boundary);
  bodyParts.push('Content-Disposition: form-data; name="notes"');
  bodyParts.push('');
  bodyParts.push('Test upload from API - Cloudinary integration test');
  bodyParts.push('--' + boundary);
  bodyParts.push('Content-Disposition: form-data; name="file"; filename="test.png"');
  bodyParts.push('Content-Type: image/png');
  bodyParts.push('');
  bodyParts.push(testBuffer.toString('binary'));
  bodyParts.push('--' + boundary + '--');
  const bodyStr = bodyParts.join('\r\n');

  const uploadReq = http.request({ hostname: 'localhost', port: 3000, path: '/api/progress/upload', method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'multipart/form-data; boundary=' + boundary, 'Content-Length': Buffer.byteLength(bodyStr, 'binary') } }, (r3) => {
    let b3 = '';
    r3.on('data', (c) => b3 += c);
    r3.on('end', () => {
      console.log('UPLOAD status:', r3.statusCode);
      try {
        const result = JSON.parse(b3);
        if (result.status === 'success') {
          console.log('UPLOAD TEST SUCCESS');
          console.log('File URL:', result.data.fileUrl);
          console.log('File Type:', result.data.fileType);
          console.log('Cloudinary ID:', result.data.cloudinaryPublicId);
        } else {
          console.error('UPLOAD FAILED:', result.message);
        }
      } catch(e) {
        console.error('UPLOAD PARSE ERROR:', e.message);
        console.error('Raw:', b3);
      }
      fs.unlinkSync(testFilePath);
    });
  });
  uploadReq.write(bodyStr, 'binary');
  uploadReq.end();
}

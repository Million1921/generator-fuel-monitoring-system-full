const http = require('http');

http.get('http://localhost:3000/dashboard/analytics', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    if (res.statusCode >= 500) {
        // extract the error message from Next.js error overlay if present
        const match = data.match(/<title>([^<]+)<\/title>/);
        console.log("Title:", match ? match[1] : 'No title');
        
        // try to find the error text
        const errorMatch = data.match(/<div.*?class="[^"]*error[^"]*".*?>(.*?)<\/div>/is);
        if (errorMatch) {
            console.log("Error details:", errorMatch[1].substring(0, 500));
        } else {
            console.log("Response snippet:", data.substring(0, 1000));
        }
    } else {
        console.log("Success response");
    }
  });
}).on('error', (err) => {
  console.log('Error: ', err.message);
});

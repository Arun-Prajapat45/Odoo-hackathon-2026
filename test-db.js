const { execSync } = require('child_process');
const payload = JSON.stringify({ query: "INSERT INTO role (name, description) VALUES ('TestRole2', 'Test') RETURNING id;" });
const res = execSync(`curl -s -X POST -H "Content-Type: application/json" -d '${payload.replace(/'/g, "'\\''")}' https://paced-nearest-prelaunch.ngrok-free.dev/query`, { encoding: 'utf-8' });
console.log(res);

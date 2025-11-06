const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/hash-password.js <password>');
  process.exit(1);
}

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    process.exit(1);
  }
  console.log('\nハッシュ化されたパスワード:');
  console.log(hash);
  console.log('\n.env.local に以下を設定してください:');
  console.log(`ADMIN_PASSWORD=${hash}\n`);
});


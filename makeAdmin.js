const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to DB');
  const user = await User.findOneAndUpdate(
    { email: '124102030@nitkkr.ac.in' },
    { role: 'admin' },
    { new: true }
  );
  console.log('User upgraded:', user.email, user.role);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});

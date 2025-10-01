/**
 * Seed script to create an Institute and an Admin user.
 * Run with: npm run seed
 */
import 'dotenv/config';
import { connect } from 'mongoose';
import { UserSchema } from '../src/users/user.schema';
import { InstituteSchema } from '../src/institutes/institute.schema';
import * as bcrypt from 'bcryptjs';

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/seena_dev';
  await connect(uri);
  const mongoose = (await import('mongoose')).default;
  const Institute = mongoose.model('Institute', InstituteSchema);
  const User = mongoose.model('User', UserSchema);

  // Ensure institute exists
  let institute = await Institute.findOne({ code: 'SEENA' });
  if (!institute) {
    console.log('🌱 Creating institute SEENA');
    institute = await Institute.create({
      name: 'Seena School',
      code: 'SEENA',
      contactEmail: 'admin@seena.test',
    });
  } else {
    console.log('✅ Institute exists:', institute.name);
  }

  // Ensure admin user exists
  const admin = await User.findOne({ email: 'admin@seena.test' });
  if (!admin) {
    console.log('🌱 Creating admin user');
    const hash = await bcrypt.hash('password123', 10);
    await User.create({
      name: 'Admin User',
      email: 'admin@seena.test',
      password: hash,
      role: 'admin',
      isActive: true,
      institute: institute._id, // ✅ always safe now
    });
  } else {
    console.log('✅ Admin user already exists');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import mongoose from 'mongoose';
import { Institution } from '../models/Institution';
import { Student } from '../models/Student';
import { User } from '../models/User';

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const insts = await Institution.find({}).lean();
  console.log('--- INSTITUTIONS ---');
  for (const i of insts) {
    console.log(i.code, i.name, 'Docs count:', i.documents?.length);
    i.documents?.forEach((d, idx) => console.log(`  Doc ${idx + 1}: ${d.title} (${d.originalFileName}) -> ${d.url}`));
  }
  const students = await Student.find({}).lean();
  console.log('\n--- STUDENTS (Total: ' + students.length + ') ---');
  for (const s of students) {
    console.log(s.registerNumber, s.fullName, s.apaarId);
  }
  const users = await User.find({}).select('email role').lean();
  console.log('\n--- USERS (Total: ' + users.length + ') ---');
  for (const u of users) {
    console.log(u.email, '(' + u.role + ')');
  }
  await mongoose.disconnect();
  process.exit(0);
}
verify().catch(e => { console.error(e); process.exit(1); });

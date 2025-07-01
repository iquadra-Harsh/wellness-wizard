#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🏃‍♀️ FitTracker Local Setup Script');
console.log('=====================================\n');

// Check if .env exists
if (!fs.existsSync('.env')) {
  console.log('📋 Creating .env file from template...');
  if (fs.existsSync('.env.example')) {
    fs.copyFileSync('.env.example', '.env');
    console.log('✅ .env file created! Please edit it with your database credentials.');
  } else {
    console.log('❌ .env.example not found. Please create .env manually.');
  }
} else {
  console.log('✅ .env file already exists.');
}

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully.');
  } catch (error) {
    console.log('❌ Failed to install dependencies. Please run "npm install" manually.');
    process.exit(1);
  }
} else {
  console.log('✅ Dependencies already installed.');
}

// Check database connection and push schema
console.log('🗃️ Setting up database schema...');
try {
  execSync('npm run db:push', { stdio: 'inherit' });
  console.log('✅ Database schema created successfully.');
} catch (error) {
  console.log('⚠️ Database setup failed. Please ensure:');
  console.log('   1. PostgreSQL is running');
  console.log('   2. Database credentials in .env are correct');
  console.log('   3. Database exists in PostgreSQL');
}

console.log('\n🎉 Setup complete!');
console.log('\nNext steps:');
console.log('1. Edit .env file with your PostgreSQL credentials');
console.log('2. Make sure PostgreSQL is running');
console.log('3. Add your OpenAI API key to .env (for AI insights)');
console.log('4. Run: npm run dev');
console.log('5. Open: http://localhost:5000\n');

console.log('💡 Need help? Check LOCAL_SETUP.md for detailed instructions.');
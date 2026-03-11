#!/usr/bin/env node

/**
 * Generate secure secrets for production environment
 * Run: node scripts/generateSecrets.js
 */

import crypto from 'crypto';

console.log('\n🔐 Generating Secure Secrets for Production\n');
console.log('Copy these values to your Render.com environment variables:\n');
console.log('─'.repeat(70));

console.log('\nJWT_SECRET:');
console.log(crypto.randomBytes(64).toString('hex'));

console.log('\nJWT_REFRESH_SECRET:');
console.log(crypto.randomBytes(64).toString('hex'));

console.log('\n' + '─'.repeat(70));
console.log('\n⚠️  IMPORTANT: Keep these secrets safe and never commit them to git!\n');

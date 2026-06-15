#!/usr/bin/env node

/**
 * Build Orchestrator — YAM-MEDIA 360
 * 
 * Builds backend and frontend in parallel with optimizations
 * Usage: node build.js [--prod] [--backend-only] [--frontend-only]
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const isProd = args.includes('--prod');
const backendOnly = args.includes('--backend-only');
const frontendOnly = args.includes('--frontend-only');

const backendDir = path.join(__dirname, 'backend');
const frontendDir = path.join(__dirname, 'frontend');

console.log('🔨 YAM-MEDIA 360 Build Orchestrator\n');
console.log(`📦 Mode: ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`⚡ Parallel builds: ${!backendOnly && !frontendOnly ? 'YES' : 'NO'}\n`);

let backendDone = false;
let frontendDone = false;
let backendError = false;
let frontendError = false;

const startBackend = () => {
  if (backendOnly || (!frontendOnly && true)) {
    console.log('📚 Backend: Starting TypeScript compilation...');
    const script = isProd ? 'build:prod' : 'build';
    const backend = spawn('npm', ['run', script], {
      cwd: backendDir,
      stdio: 'inherit',
      shell: true,
    });

    backend.on('close', (code) => {
      backendDone = true;
      if (code !== 0) {
        backendError = true;
        console.error('\n❌ Backend build failed');
      } else {
        console.log('\n✅ Backend built successfully');
      }
      checkCompletion();
    });
  } else {
    backendDone = true;
  }
};

const startFrontend = () => {
  if (frontendOnly || (!backendOnly && true)) {
    console.log('🎨 Frontend: Starting Next.js build...');
    const frontend = spawn('npm', ['run', 'build'], {
      cwd: frontendDir,
      stdio: 'inherit',
      shell: true,
    });

    frontend.on('close', (code) => {
      frontendDone = true;
      if (code !== 0) {
        frontendError = true;
        console.error('\n❌ Frontend build failed');
      } else {
        console.log('\n✅ Frontend built successfully');
      }
      checkCompletion();
    });
  } else {
    frontendDone = true;
  }
};

const checkCompletion = () => {
  if (backendDone && frontendDone) {
    const backendSize = getDirectorySize(path.join(backendDir, 'dist'));
    const frontendSize = getDirectorySize(path.join(frontendDir, '.next'));
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Build Summary');
    console.log('='.repeat(50));
    console.log(`Backend size:  ${formatBytes(backendSize)}`);
    console.log(`Frontend size: ${formatBytes(frontendSize)}`);
    console.log(`Total size:    ${formatBytes(backendSize + frontendSize)}`);
    console.log('='.repeat(50));
    
    if (backendError || frontendError) {
      console.log('\n❌ Build failed');
      process.exit(1);
    } else {
      console.log('\n✅ All builds completed successfully!');
      console.log('\n🚀 Next steps:');
      console.log(`   Backend:  npm start (from ${backendDir})`);
      console.log(`   Frontend: npm start (from ${frontendDir})`);
      process.exit(0);
    }
  }
};

const getDirectorySize = (dir) => {
  if (!fs.existsSync(dir)) return 0;
  let size = 0;
  const walk = (filepath) => {
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      fs.readdirSync(filepath).forEach(file => walk(path.join(filepath, file)));
    } else {
      size += stats.size;
    }
  };
  walk(dir);
  return size;
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Start builds in parallel
startBackend();
startFrontend();

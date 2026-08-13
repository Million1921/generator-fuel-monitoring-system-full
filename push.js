const { execSync } = require('child_process');

const gitPaths = [
  'C:\\Users\\MILLION.TESFAHUN\\Downloads\\flutter_windows_3.44.8-stable\\flutter\\bin\\mingit\\cmd\\git.exe',
  'C:\\Program Files\\Git\\bin\\git.exe',
  'C:\\Program Files (x86)\\Git\\bin\\git.exe',
];

let gitExe = null;
const fs = require('fs');
for (const p of gitPaths) {
  if (fs.existsSync(p)) {
    gitExe = p;
    break;
  }
}

if (!gitExe) {
  console.error('Git not found at any known path!');
  process.exit(1);
}

const cwd = 'F:\\generator-fuel-monitoring-system-full';
const run = (cmd) => {
  console.log('>', cmd);
  const result = execSync(`"${gitExe}" ${cmd}`, { cwd, encoding: 'utf8' });
  console.log(result);
  return result;
};

try {
  run('add -A');
  run('commit -m "fix: add missing roles to user update API validation schema"');
  run('push origin main');
  console.log('Successfully pushed!');
} catch (e) {
  console.error(e.stdout || e.message);
}

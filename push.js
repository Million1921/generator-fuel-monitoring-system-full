const { execSync } = require('child_process');
const gitExe = 'C:\\Users\\MILLION.TESFAHUN\\Downloads\\flutter_windows_3.44.8-stable\\flutter\\bin\\mingit\\cmd\\git.exe';
const cwd = 'F:\\generator-fuel-monitoring-system-full';

const run = (cmd) => {
  console.log('>', cmd);
  try {
    const result = execSync(`"${gitExe}" ${cmd}`, { cwd, encoding: 'utf8', timeout: 60000 });
    console.log(result);
    return result;
  } catch (e) {
    // If nothing to commit, that's fine — just continue to push
    const out = e.stdout || e.stderr || '';
    if (out.includes('nothing to commit')) {
      console.log('Nothing new to commit, continuing to push...');
      return '';
    }
    throw e;
  }
};

try {
  run('add -A');
  run('commit -m "fix: update API role validation to include new roles"');
  run('push origin main');
  console.log('Successfully pushed!');
} catch (e) {
  console.error(e.stdout || e.stderr || e.message);
}

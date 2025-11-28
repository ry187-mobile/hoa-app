const { exec } = require('child_process');

function log(msg) { console.log(msg); }

if (process.platform === 'win32') {
  log('Attempting to close Blessed Sapphire Admin (Windows)');
  exec('taskkill /IM "Blessed Sapphire Admin.exe" /F', (err, stdout, stderr) => {
    if (err) {
      log('taskkill returned error (process may not be running): ' + err.message);
    } else {
      log('taskkill output: ' + (stdout || stderr));
    }
    process.exit(0);
  });
} else {
  log('Attempting to close Blessed Sapphire Admin (non-windows)');
  exec('pkill -f "Blessed Sapphire Admin"', (err, stdout, stderr) => {
    if (err) {
      log('pkill returned error (process may not be running): ' + err.message);
    } else {
      log('pkill output: ' + (stdout || stderr));
    }
    process.exit(0);
  });
}

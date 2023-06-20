import { argParser } from './lib/cli';

if (process.argv[0].endsWith('node')) process.argv.splice(0, 1);
process.argv.splice(0, 1);
if (process.argv[0] === 'help') {
  console.log(argParser.helpString(process.argv[1]));
} else {
  const cmds = argParser.parse(process.argv);
  cmds.forEach((cmd) => cmd.execute());
}

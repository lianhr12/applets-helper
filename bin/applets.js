#! /usr/bin/env node

const program = require('commander');
const path = require('path');
const ROOT = path.resolve(__dirname, '../');


const {version, description} = require('../package.json');

program
    .version(version)
    .description(description)
    .usage('[options] [value]')
    .option('-C, --config <filePath>', 'Initialize the global configuration of the applet, filePath is the json configuration file path')
    .option('-W, --wechat <cmd>', 'WeChat applet released, Optional preview and upload version')
    .option('-A, --alipay <cmd>', 'Alipay applet released, Optional preview and upload version')
    .parse(process.argv);

program.on('--help', function(){
    console.log('');
    console.log('Examples:');
    console.log('  $ applets --wechat preview');
    console.log('  $ applets -W preview');
});

const cwdPath = process.cwd();
program.parse(process.argv);
const options = program.options.map((option) => option.long.replace('--', '')).filter((option) => option !== 'version' && option !== 'help');

try {
    let handlesPath = `${ROOT}/lib`;
    options.forEach((option) => {
        if (program[option]) {
            require(`${handlesPath}/${option}`)({
                cwdPath,
                oValue: program[option]
            });
        }
    });
}catch (e) {
    console.error(`Exception while processing command! \r\n${e.stack || e}\r\n`);
    program.help();
}
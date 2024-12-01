const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

function executeRubyCode(code, input) {
    return new Promise((resolve, reject) => {
        const codeFile = 'code.rb';

        fs.writeFileSync(codeFile, code);

        const codePath = path.resolve(codeFile).replace(/\\/g, '/');
        const dockerImage = 'ruby-runner';

        const command = `docker run --rm -i -v "${codePath}:/app/code.rb" ${dockerImage} ruby /app/code.rb`;

        const docker = exec(command, (error, stdout, stderr) => {
            fs.unlinkSync(codeFile);

            if (error) {
                resolve(`Error: ${error.message}`); // Resolve with the error message
            } else if (stderr) {
                resolve(stderr.trim()); // Resolve with trimmed stderr output
            } else {
                resolve(stdout.trim()); // Resolve with stdout output
            }
        });

        if (input) {
            docker.stdin.write(input);
        }
        docker.stdin.end();
    });
}

module.exports = { executeRubyCode };
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const languageConfig = {
  javascript: { extension: '.js', command: 'node' },
  python: { extension: '.py', command: 'python' },
  c: { extension: '.c', command: 'gcc', output: './tempCode.out' },
  cpp: { extension: '.cpp', command: 'g++', output: './tempCode.out' },
  java: { extension: '.java', command: 'javac', output: 'Main' }
};

// Implementation influenced by ChatGPT
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { code, input, language } = req.body;

    if (!code || !language || !languageConfig[language]) {
      return res.status(400).json({ error: 'Valid code and language are required' });
    }

    const { extension, command, output } = languageConfig[language];
    const fileName = language === 'java' ? 'Main' : 'tempCode';
    const filePath = path.join(process.cwd(), `${fileName}${extension}`);
    fs.writeFileSync(filePath, code);

    try {
      if (language === 'c' || language === 'cpp') {
        // Compile C/C++ with -o for output
        const compileProcess = spawn(command, [filePath, '-o', output]);

        let compileErrorOutput = '';
        compileProcess.stderr.on('data', (data) => {
          compileErrorOutput += data.toString();
        });

        compileProcess.on('close', (compileCode) => {
          if (compileCode !== 0) {
            fs.unlinkSync(filePath); // Clean up file after compilation error
            return res.status(500).json({ error: `Compilation failed: ${compileErrorOutput.trim()}` });
          }
          executeFile(res, `./${output}`, input, [], filePath, language);
        });

      } else if (language === 'java') {
        // Compile Java without -o flag
        const compileProcess = spawn(command, [filePath]);

        let compileErrorOutput = '';
        compileProcess.stderr.on('data', (data) => {
          compileErrorOutput += data.toString();
        });

        compileProcess.on('close', (compileCode) => {
          if (compileCode !== 0) {
            fs.unlinkSync(filePath); // Clean up file after compilation error
            return res.status(500).json({ error: `Compilation failed: ${compileErrorOutput.trim()}` });
          }
          // Execute compiled Java file (Main class)
          executeFile(res, 'java', input, [output], filePath, language);
        });

      } else {
        // For interpreted languages, run directly
        executeFile(res, command, input, [filePath], filePath, language);
      }
    } catch (error) {
      fs.unlinkSync(filePath); // Clean up file on error
      return res.status(500).json({ error: `Execution error: ${error.message}` });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

function executeFile(res, command, input, args = [], filePath, language) {
  const child = spawn(command, args);
  let output = '';
  let errorOutput = '';

  if (input) {
    child.stdin.write(input);
    child.stdin.end();
  }

  child.stdout.on('data', (data) => {
    output += data.toString();
  });

  child.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  child.on('close', (code) => {
    // Clean up the temporary files
    fs.unlinkSync(filePath);
    if (language === 'c' || language === 'cpp') {
      fs.unlinkSync('./tempCode.out');
    } else if (language === 'java') {
      fs.unlinkSync('./Main.class');
    }

    if (errorOutput) {
      // Trim error message for readability
      const trimmedError = errorOutput
        .split('\n')
        .filter(line => 
          !line.includes('at ') &&
          !line.includes(filePath) &&
          !line.includes('node:internal') &&
          !line.includes('Node.js')
        )
        .join('\n')
        .trim();

      return res.status(200).json({ error: trimmedError });
    }
    res.status(200).json({ output: output.trim() });
  });
}

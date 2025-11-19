const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

exports.runCode = async (language, code, input) => {
  const id = Date.now();
  const folder = path.join(__dirname, "../temp", id.toString());
  
  fs.mkdirSync(folder);

  let file, cmd;

  if (language === "python") {
    file = `${folder}/solution.py`;
    fs.writeFileSync(file, code);
    cmd = `python ${file}`;
  }

  if (language === "cpp") {
    file = `${folder}/solution.cpp`;
    fs.writeFileSync(file, code);
    cmd = `g++ ${file} -o ${folder}/a.out && ${folder}/a.out`;
  }

  if (language === "javascript") {
    file = `${folder}/solution.js`;
    fs.writeFileSync(file, code);
    cmd = `node ${file}`;
  }

  if (language === "c") {
    file = `${folder}/solution.c`;
    fs.writeFileSync(file, code);
    cmd = `gcc ${file} -o ${folder}/a.out && ${folder}/a.out`;
  }

  if (language === "java") {
    file = `${folder}/Main.java`;
    fs.writeFileSync(file, code);
    cmd = `javac ${file} && java -cp ${folder} Main`;
  }

  return new Promise((resolve) => {
    const process = exec(cmd, { timeout: 5000 }, (err, stdout, stderr) => {
      resolve({
        stdout: stdout,
        stderr: stderr || (err ? err.message : "")
      });
    });

    if (input) {
      process.stdin.write(input);
      process.stdin.end();
    }
  });
};

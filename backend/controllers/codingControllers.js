const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

async function runCode(language, code, input) {
  const baseDir = path.join(os.tmpdir(), "proctor-code");
  try { fs.mkdirSync(baseDir, { recursive: true }); } catch {}
  const id = `${Date.now()}-${Math.floor(Math.random()*100000)}`;
  const folder = path.join(baseDir, id);
  fs.mkdirSync(folder, { recursive: true });

  let file;
  let cmd;

  if (language === "python") {
    file = path.join(folder, "solution.py");
    fs.writeFileSync(file, code);
    const py = process.platform === "win32" ? "python" : "python3";
    cmd = `${py} "${file}"`;
  } else if (language === "cpp") {
    file = path.join(folder, "solution.cpp");
    fs.writeFileSync(file, code);
    const out = path.join(folder, process.platform === "win32" ? "a.exe" : "a.out");
    cmd = `g++ "${file}" -o "${out}" && "${out}"`;
  } else if (language === "javascript") {
    file = path.join(folder, "solution.js");
    fs.writeFileSync(file, code);
    cmd = `node "${file}"`;
  } else {
    return { stdout: "", stderr: `Unsupported language: ${language}` };
  }

  return new Promise((resolve) => {
    const child = exec(cmd, { timeout: 7000 }, (err, stdout, stderr) => {
      resolve({ stdout, stderr: stderr || (err ? err.message : "") });
      try { fs.rmSync(folder, { recursive: true, force: true }); } catch {}
    });
    if (input && typeof input === "string") {
      try { child.stdin.write(input); child.stdin.end(); } catch {}
    }
  });
}

exports.runCode = async (req, res) => {
  const { language, code, input } = req.body;

  const output = await runCode(language, code, input);

  res.json(output);
};

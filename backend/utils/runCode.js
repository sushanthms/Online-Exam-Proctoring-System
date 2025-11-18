import { VM } from "vm2";

export function runUserCode(code, input) {
  const vm = new VM({
    timeout: 2000,
    sandbox: { input }
  });

  try {
    // user must write a function solve(input)
    const wrapped = `
      ${code}
      solve(input);
    `;

    const output = vm.run(wrapped);
    return { success: true, output: String(output) };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

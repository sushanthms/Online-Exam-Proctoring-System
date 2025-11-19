const { runCode } = require("../utils/codeRunner");

exports.runCode = async (req, res) => {
  const { language, code, input } = req.body;

  const output = await runCode(language, code, input);

  res.json(output);
};

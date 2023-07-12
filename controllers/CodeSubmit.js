const codeSubmit = async (req, res, CodeSubmission, spawn) => {
  try{
    const Usercode=req.body.code;
    const { language,input } = req.body;

  // Execute the code in a child process
  const childProcess = spawn('docker', ['run', '--rm', 'sandbox-image', Usercode, language]);

  let output = '';
  let error = '';

  // Capture the standard output
  childProcess.stdout.on('data', (data) => {
    output += data.toString();
  });

  // Capture the standard error
  childProcess.stderr.on('data', (data) => {
    error += data.toString();
  });

  // Handle process exit
  childProcess.on('exit', async (code) => {
    if (code === 0) {
      // Execution succeeded
      console.log(output);
      const result = JSON.parse(output).output;
      // console.log(result);
      const submission = new CodeSubmission({ code:Usercode, language:language,executionResult:result });
      await submission.save();
      res.json({ result, error: null,submissionId: submission._id  });
    } else {
      // Execution failed
      res.json({ result: null, error,submissionId: submission._id });
    }
  });

  // Handle process error
  // childProcess.on('error', (err) => {
  //   res.status(500).json({ error: err.message });
  // });
  }
  catch (error) {
    // Handle any errors
    console.error("error occuring: ",error);
    res.status(500).json({ error: error });
  }
}

module.exports = codeSubmit;
const codeSubmit = async (req, res,CodeSubmission, spawn, io, socketId,userId) => {
  try {
    const Usercode = req.body.code;
    const { language, input } = req.body;
    

    // Emit a notification to the client that code execution has started
    io.to(socketId).emit('notification', { socketId: socketId, message: "Code execution starts" });
    
    // Execute the code in a child process
    const childProcess = spawn('docker', ['run', '--rm', 'sandbox-image', Usercode, language, input]);

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
        if (output.toLowerCase().includes('error')) {
          // Emit a notification to the client about syntax error
          io.to(socketId).emit('notification', { socketId: socketId, message: "Code execution Failed due to SYNTAX ERROR" });
          const submission = new CodeSubmission({ code: Usercode, language: language, executionResult: 'Syntax Error',userId:userId });
          res.json({ result: null, error: output, submissionId: submission._id });
        } else {
          const result = JSON.parse(output).output;
          const submission = new CodeSubmission({ code: Usercode, language: language, executionResult: result, userId:userId });
          await submission.save();
          res.json({ result, error: null, submissionId: submission._id });

          // // Emit a notification to the client that code execution is completed
          io.to(socketId).emit('notification', { socketId: socketId, message: "Code execution completed" });
          io.to(socketId).emit('executionResult', { socketId: socketId,result });
        }
      } else {
        // Execution failed
        // Emit a notification to the client about the execution error
        io.to(socketId).emit('notification', 'Code Execution Error');
        res.json({ result: null, error });
      }
    });

    // Handle process error
    childProcess.on('error', (err) => {
      res.status(500).json({ error: err });
    });
  } catch (error) {
    // Handle any errors
    console.error(error);
    res.status(500).json({ error: error });
  }
};

module.exports = codeSubmit;

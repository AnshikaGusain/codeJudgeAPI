const getSubmission=async (req,res,CodeSubmission)=>{
    try {
        const submissionId = req.params.id;
    
        // Retrieve the submission from the database
        const submission = await CodeSubmission.findById(submissionId);
    
        if (!submission) {
          return res.status(404).json({ error: 'Submission not found' });
        }
    
        res.status(200).json(submission);
      } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
      }
}

module.exports=getSubmission;
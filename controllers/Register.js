const Register=async(req,res,User)=>{
    try {
        const { username, password } = req.body;
        const existingUser = await User.findOne({ username });
    
        if (existingUser) {
          return res.status(400).json({ error: 'Username already exists' });
        }
    
        const newUser = new User({ username, password });
        await newUser.save();
    
        res.status(201).json({ message: 'User registered successfully' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
}

module.exports=Register;
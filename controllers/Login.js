const Login=async(req,res,User,bcrypt,jwt)=>{
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
    
        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
    
        const isMatch = await bcrypt.compare(password, user.password);
    
        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
    
        const token = jwt.sign({ userId: user._id}, process.env.JWT_SECRET, { expiresIn: '1h' });
    
        res.status(200).json({ message: 'Login successful', token });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred' });
      }
}

module.exports=Login;
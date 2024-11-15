const jwt = require('jsonwebtoken');
require('dotenv').config();

function userAuth(req, res, next) {
  const token = req.headers.token;
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication token missing' });
  }

  try {
    const decodedData = jwt.verify(token, process.env.JWT_USER_SECRET);
    req.userId = decodedData.id;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Authentication failed' });
  }
}
module.exports={
    userAuth
}
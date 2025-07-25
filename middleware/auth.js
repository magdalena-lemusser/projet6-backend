const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    console.log('Authorization header:', req.headers.authorization);
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, 'RANDOM_WEB_SECRET');
    const userId = decodedToken.userId;
    req.auth = {
      userId: userId
    };
    next();
  } catch (error) {
    res.status(401).json({ error });
  }
};

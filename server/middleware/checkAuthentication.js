const checkAuthentication = (req, res, next) => {
  if (!req.session.user_id) {
    return res.status(401).send({ error: 'You must be logged in.' });
  }
  next();
};

module.exports = checkAuthentication;

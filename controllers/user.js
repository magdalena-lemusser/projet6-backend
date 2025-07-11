const bcrypt = require('bcrypt');
const User = require('../models/Users');

exports.signup = (req, res, next) => {
  bcrypt
    .hash(req.body.password, 10) //pour crypter le MDP! le 10 c'est le nombre de tours de l'algorithme de HASHAGE (however tf you spell it)
    .then((hash) => {
      const user = new User({
        email: req.body.email,
        password: hash
      });
      user
        .save()
        .then(() => res.status(201).json({ message: 'utilisateur créé !' }))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(500).json({ error })); //erreur 500 = serveur
};

exports.login = (req, res, next) => {};

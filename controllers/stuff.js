const Thing = require('../models/Thing');
const fs = require('fs');

//change this to match front: common.js and BookForm.jsx
exports.createThing = (req, res, next) => {
  const thingObject = JSON.parse(req.body.book);
  delete thingObject._id;
  delete thingObject._userId;
  const thing = new Thing({
    ...thingObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });

  thing
    .save()
    .then(() => {
      res.status(201).json({ message: 'Livre enregistré !' });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.getOneThing = (req, res, next) => {
  Thing.findOne({
    _id: req.params.id
  })
    .then((thing) => {
      res.status(200).json(thing);
    })
    .catch((error) => {
      res.status(404).json({
        error: error
      });
    });
};

exports.rateBook = async (req, res) => {
  try {
    const bookId = req.params.id;
    const { userId, rating } = req.body;

    const book = await Thing.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Livre inexistant' });
    }

    // Prevent duplicate rating by the same user
    const alreadyRated = book.ratings.find((r) => r.userId === userId);
    if (alreadyRated) {
      return res.status(400).json({ message: 'Vous avez déjà noté ce livre' });
    }

    // Add new rating
    book.ratings.push({ userId, grade: rating });

    // Recalculate average rating
    const total = book.ratings.reduce((acc, cur) => acc + cur.grade, 0);
    book.averageRating = total / book.ratings.length;

    await book.save();
    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBestRatedBooks = async (req, res) => {
  console.log('🎯 /bestrating route was hit');
  try {
    // Step 1: Fetch books with averageRating >= 4, sorted by averageRating descending
    const bestRatedBooks = await Thing.find({
      averageRating: { $gte: 4 }
    }).sort({ averageRating: -1 });

    // Step 2: Return them
    res.status(200).json(bestRatedBooks);
  } catch (error) {
    console.error('Error fetching best rated books:', error);
    res
      .status(500)
      .json({ error: 'Server error while fetching best rated books' });
  }
};

exports.modifyThing = (req, res, next) => {
  const thingObject = req.file
    ? {
        ...JSON.parse(req.body.thing),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
      }
    : { ...req.body }; //s'il y a une image ? traite la : sinon - traite l'objet entrant

  delete thingObject._userId; //mesure de securite
  Thing.findOne({ _id: req.params.id })
    .then((thing) => {
      if (thing.userId != req.auth.userId) {
        res.status(401).json({ message: 'Not authorized' });
      } else {
        Thing.updateOne(
          { _id: req.params.id },
          { ...thingObject, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: 'Objet modifié!' }))
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.deleteThing = (req, res, next) => {
  Thing.findOne({ _id: req.params.id })
    .then((thing) => {
      if (thing.userId != req.auth.userId) {
        res.status(401).json({ message: 'Not authorized' });
      } else {
        const filename = thing.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          Thing.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: 'Objet supprimé !' });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.getAllStuff = (req, res, next) => {
  Thing.find()
    .then((things) => {
      res.status(200).json(things);
    })
    .catch((error) => {
      res.status(400).json({
        error: error
      });
    });
};

const Thing = require('../models/Thing');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

exports.createThing = async (req, res, next) => {
  const thingObject = JSON.parse(req.body.book);
  delete thingObject._id;
  delete thingObject._userId;

  const filePath = `images/${req.file.filename}`;
  const fullPath = path.join(__dirname, '..', filePath);

  try {
    // Check file size (in bytes)
    const stats = fs.statSync(fullPath); //checks the file's metadata
    const fileSizeInKB = stats.size / 1024; //divides by 1024 to go from bytes to KB

    if (fileSizeInKB > 1024) {
      const compressedFilename = `compressed_${req.file.filename}`;
      const compressedPath = path.join(
        __dirname,
        '..',
        'images',
        compressedFilename
      );

      await sharp(fullPath)
        .resize({ width: 800 }) // Optional: resize to width
        .jpeg({ quality: 70 }) // Compress to JPEG, 70% quality
        .toFile(compressedPath);

      // Delete the original uncompressed image
      fs.unlinkSync(fullPath);

      // Update image URL
      req.file.filename = compressedFilename;
    }

    const thing = new Thing({
      ...thingObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });

    await thing.save();
    res.status(201).json({ message: 'Livre enregistré !' });
  } catch (error) {
    res.status(400).json({ error });
  }
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

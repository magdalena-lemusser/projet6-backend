const Book = require('../models/Book');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

exports.createBook = async (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;

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

    const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });

    await book.save();
    res.status(201).json({ message: 'Livre enregistré !' });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      res.status(200).json(book);
    })
    .catch((error) => {
      res.status(404).json({ error });
    });
};

exports.rateBook = async (req, res) => {
  try {
    const bookId = req.params.id;
    const { userId, rating } = req.body;

    const book = await Book.findById(bookId);
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
    const bestRatedBooks = await Book.find({
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

exports.modifyBook = (req, res, next) => {
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
      }
    : { ...req.body }; //s'il y a une image ? traite la : sinon - traite l'objet entrant

  delete bookObject._userId; //mesure de securite
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: 'Non-authorisé' });
      } else {
        Book.updateOne(
          { _id: req.params.id },
          { ...bookObject, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: 'livre modifié!' }))
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: 'Not authorized' });
      } else {
        const filename = book.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: 'Livre supprimé !' });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) => {
      res.status(400).json({
        error: error
      });
    });
};

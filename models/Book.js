const mongoose = require('mongoose');

const ratingSchema = mongoose.Schema({
  userId: { type: String, required: true },
  grade: { type: Number, required: true }
});

const bookSchema = mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  year: { type: Number, required: true },
  genre: { type: String, required: true },
  imageUrl: { type: String, required: true }, //cause my controller already created a custom image URL
  ratings: { type: [ratingSchema], default: [] },
  averageRating: { type: Number, required: true }
});

module.exports = mongoose.model('Book', bookSchema); //the first param is the NAME of the model we export, MongoDB will transform it into "books"

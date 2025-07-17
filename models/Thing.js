const mongoose = require('mongoose');

//change this to match front: common.js and BookForm.jsx
const thingSchema = mongoose.Schema({
  title: { type: String, required: true },
  auteur: { type: String, required: true },
  année: { type: Number, required: true },
  genre: { type: String, required: true }
  //comment inclure la note?
  //comment inclure l'image?
});

module.exports = mongoose.model('Thing', thingSchema); //the first param is the NAME of the model we export, the second one is the schema, or template

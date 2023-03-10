import mongoose from 'mongoose';
const Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/translate');

const wordModel = new Schema({
  prefix: {
    type: String,
    idnex: true,
    required: true,
    background: true
  },
  language: {
    type: String,
    idnex: true,
    required: true,
    background: true
  },
  key: {
    type: String,
    idnex: true,
    required: true,
    background: true
  },
  value: {
    type: Array,
    idnex: true,
    sparse: true,
    background: true
  },
  using: {
    type: Number
  }
});

export const WordModel = mongoose.model('translate', wordModel);

import mongoose from 'mongoose';
const Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/translate');

// const ObjectId = Schema.ObjectId;
const wordDraftModel = new Schema({
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
    type: String,
    idnex: true,
    sparse: true,
    background: true
  }
});

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
    type: String,
    idnex: true,
    sparse: true,
    background: true
  }
});

export const WordDraftModel = mongoose.model('translateDraft', wordDraftModel);
export const WordModel = mongoose.model('translate', wordModel);

import mongoose from 'mongoose';
const Schema = mongoose.Schema;

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
    sparse: true,
    background: true
  }
});

const scopeModel = new Schema({
  value: {
    type: String,
    idnex: true,
    required: true,
    background: true
  },
});

export const WordModel = mongoose.model('translate_online', wordModel);
export const WordDraftModel = mongoose.model('translate_draft', wordModel);

export const ScopeModel = mongoose.model('scope', scopeModel);

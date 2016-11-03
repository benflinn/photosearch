// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var searchSchema = new Schema({
  term: String,
  created_at: Date
});

// the schema is useless so far
// we need to create a model using it
var Search = mongoose.model('Search', searchSchema);

// make this available to our users in our Node applications
module.exports = Search;


//also needs a function to keep a list of only TEN! i'll add this later.

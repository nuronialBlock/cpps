const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: matchSlug,
      message: 'Invalid Slug - Small letters, digits and hyphens only'
    }
  },
  body: {
    type: String
  },
  createdBy: {
    type: String
    // required: true enforced by system
  },
  lastUpdatedBy: {
    type: String
    // required: true enforced by system
  }
}, {
  timestamps: true
});

function matchSlug(val) {
  const re = new RegExp('[a-z0-9-]+');
  return re.test(val);
}

noteSchema.pre('save', function(next, req) {
  const doc = this;
  if (!doc.createdBy) doc.createdBy = req.session.email;
  doc.lastUpdatedBy = req.session.email;
  next();
});

mongoose.model('Notebook', noteSchema);

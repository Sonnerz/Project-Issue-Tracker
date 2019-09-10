const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  project_title: {
    'type': String
  },
  issues: [
    {
      "issue_title": {
        'type': String
      },
      "issue_text": {
        'type': String
      },
      "created_by": {
        'type': String
      },
      "assigned_to": {
        'type': String
      },
      "status_text": {
        'type': String
      },
      "created_on": {
        'type': Date,
        'default': new Date()
      },
      "updated_on": {
        'type': Date,
        'default': new Date()
      },
      "open": {
        "type": Boolean
      }
    }
  ]
});


module.exports = mongoose.model('Project', projectSchema)
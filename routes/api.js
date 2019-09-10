/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectID;
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Project = require('../models/project');

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

mongoose.connect(CONNECTION_STRING, { useNewUrlParser: true, useFindAndModify: false });

mongoose.connection.on('error', console.error.bind(console, 'connection error: '));
mongoose.connection.once('open', function () {
  console.log("We're connected! " + mongoose.connection.readyState);
});


module.exports = function (app) {

  app.route('/api/issues/:project')
  
    // GET 
    .get(getProject, async function (req, res){
      var project = req.params.project; //get project from url
      // if there are NO query params {}
      if(!isEmpty(req.query)) {    
        if (req.query.hasOwnProperty("open")){
          if(req.query.open == "true") {
            req.query.open = true
          } else {
            req.query.open = false
          }
        };

        req.query.hasOwnProperty("created_on") ? req.query.created_on = new Date(req.query.created_on) : null;
        req.query.hasOwnProperty("updated_on") ? req.query.updated_on = new Date(req.query.updated_on) : null;

        // loop through params to create condition
        let cond = Object.entries(req.query).map(el => {
          return {$eq: [`$$item.${el[0]}`, el[1] ]};
        });       

        Project.aggregate(
              [
                {
                  $match: {
                    'project_title': project
                  }
                }, {
                  $project: {
                    issue: {
                      $filter: {
                        input: '$issues', 
                        as: 'item', 
                        cond: { $and: cond}
                      }
                    }
                  }
                }
              ]
          ).exec((err, issues) => {
              if (err) return res.json({ "error": "That project does not exist" });
              return res.json(issues[0].issue);
          })
      } else {
        // res.project returned from getProject()
          return res.json(res.project);        
      }        
    })

  
    // POST NEW ISSUE
    .post(function (req, res, done){
      var project = req.params.project;
      const issue_title = req.body.issue_title;
      const issue_text = req.body.issue_text;
      const created_by = req.body.created_by.toLowerCase();
      const assigned_to = req.body.assigned_to.toLowerCase();
      const status_text = req.body.status_text;

      if(issue_title == "" || issue_text == "" || created_by == "") {
         res.json({ "Error": "missing inputs" });
      } else {         
        // Find project and add NEW issue
        Project.findOne({ "project_title": project }, function (err, doc) {
          if (!doc) {
            res.json({ "Error": "That project does not exist" });
          } else {
            doc.issues.push({
              "issue_title": issue_title,
              "issue_text": issue_text,
              "created_by": created_by,
              "assigned_to": assigned_to,
              "status_text": status_text,
              "created_on": new Date(),
              "updated_on": new Date(),
              "open": true
            });
            doc.save(function (err, data) {
              if (err) return done(err);
              return done(null, res.json(data));
            });
          }
        }); 
      }
    
    }) 
      
    
    // PUT UPDATE ISSUE
    .put(getIssue, async function(req, res){
      // res.issue returned from getIssue()
        if(!res.issue == undefined) {
           res.send("_id error")
        } else {
          let issue_id = res.issue._id;
          let checkFieldsForEdit = req.body.issue_title || req.body.issue_text || req.body.created_by || req.body.assigned_to || req.body.status_text || req.body.open;
        
          if(issue_id && checkFieldsForEdit) {
              Project.findOneAndUpdate(
                {'issues._id': issue_id},
                {$set:
                   {
                    'issues.$.issue_title': req.body.issue_title || res.issue.issue_title,
                    'issues.$.issue_text': req.body.issue_text || res.issue.issue_text,
                    'issues.$.created_by': req.body.created_by || res.issue.created_by,
                    'issues.$.assigned_to': req.body.assigned_to || res.issue.assigned_to,
                    'issues.$.status_text': req.body.status_text || res.issue.status_text,
                    'issues.$.updated_on': new Date(),
                    'issues.$.open': req.body.open || res.issue.open                                
                   }
                }, 
              function(err, data)  {
                if(err) res.send("could not update " + issue_id );
                res.json({"message":"successfully updated"})
              })
          } else {
            res.json({"message":"no updated field sent"})
          }
        }          
    })
  
  
    // DELETE Delete issue  
    .delete(getIssue, async function (req, res){
      var project = req.params.project;      
      const issue_id = req.body._id;   
      if(!res.issue) {
        res.send({"message": "could not delete " + issue_id})
      } else {           
      Project.updateOne(
        {"project_title": project},
        { $pull: { "issues": { 
          _id: issue_id
        }}},
        function (err, data) {
          if (data) {
            return res.send({"message": "deleted " + issue_id});       
          } else {
            return res.send({"message": "could not delete " + issue_id});  
            return res.status(404).end(); // justs so the server doesn't hang and keep the frontend waiting forever
          }
        });
      }
    
    });
  
  
    // POST - ADD NEW PROJECT
    app.post('/newproject', function (req, res) {
      const projecttitle = req.body.projecttitle;
      const new_proj = new Project({
        project_title: projecttitle
      });
      new_proj.save(function (err, data) {
        res.json({
          "project_title": data.project_title,
          "_id": data._id
        });
      });
    });
  
  
    // GET - ALL PROJECTS
    app.get('/api/getallprojects', function (req, res) {
      Project.find({}, function (err, data) {
        if (data) {
          let projList = [];
          for (let d of data) {
            projList.push({"title" :d.project_title, "issues": d.issues.length})
          }
          res.json(projList)
        } else {
          res.send("There are no projects");
        }
      });
    });
  
    // middleware to get specific project issue. Instead of repeating code in every route
    // next just moves onto next function in most cases (req,res) in each route
    // get project from url, get list of issues in project. Send back issue as res.issue, matching sent issue _id
    async function getIssue(req, res, next) {
        let project;
        try {
          project = await Project.findOne({'project_title':req.params.project})
          if (project == null) {
              return res.status(404).json({ message: "Cannot find project" }) // 404 is cannot find something
          } else {
              for (let i of project.issues) {
                if (i._id == req.body._id) {                
                  // variable on the response object so that we can use  'res.issue'  in every route
                  res.issue = i;
                }    
              }
          }          
        } catch (error) {
          return res.status(500).json({ message: error.message })
        }
      // next moves us on to next function
      next()    
    }
  
    
    // middleware to get Project. Instead of repeating code in every route
    // next just moves onto next function in most cases (req,res) in each route
    // get project from req.params.project. Send back project as res.project.
    async function getProject(req, res, next) {
        let project;
        try {
          await Project.findOne({project_title:req.params.project}, function(err, project) {
            if (project == null) {
              //return res.status(404).json({ error: "Cannot find project" }) // 404 is cannot find something
              return res.json({ error: "Cannot find project named, " +req.params.project  }) 
            } else {
              res.project = project;
            }            
          });
        } catch (error) {
          return res.status(500).json({ error: error.message })
        }
      // next moves us on to next function
      next()    
    }
  
  
    // check that an object is empty/not empty
    function isEmpty(obj) {
      for(var key in obj) {
        if(obj.hasOwnProperty(key))
          return false;
      }
        return true;
    }
    
};


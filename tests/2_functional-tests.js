/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  
    suite('POST /api/issues/{project} => object with issue data', function() {
     
      test('Every field filled in', function(done) {
       chai.request(server)
        .post('/api/issues/test')
        .send({
          issue_title: 'Title',
          issue_text: 'text',
          created_by: 'Functional Test - Every field filled in',
          assigned_to: 'Chai and Mocha',
          status_text: 'In QA'
        })
        .end(function(err, res){
          expect(err).to.be.null;
          assert.equal(res.status, 200);
          assert.property(res.body.issues[0], 'issue_title');
          assert.property(res.body.issues[0], 'issue_text');
          assert.property(res.body.issues[0], 'created_on');
          assert.property(res.body.issues[0], 'updated_on');
          assert.property(res.body.issues[0], 'created_by');
          assert.property(res.body.issues[0], 'assigned_to');
          assert.property(res.body.issues[0], 'open');
          assert.property(res.body.issues[0], 'status_text');
          assert.property(res.body.issues[0], '_id');
          done();
        });
      });
               
      test('Required fields filled in', function(done) {
        chai.request(server)
        .post('/api/issues/test')
        .send({
          issue_title: 'Title',
          issue_text: 'Text1',
          created_by: 'Functional Test - Required fields filled in',
          assigned_to: 'Chai and Mocha',
          status_text: 'In QA'
        })
        .end(function(err, res){
          expect(err).to.be.null;
          assert.equal(res.status, 200);
          assert.isNull(err, 'there was no error');
          assert.exists(res.body.issues[0].issue_title, 'issue_title is neither `null` nor `undefined`');
          assert.exists(res.body.issues[0].issue_text, 'issue_text is neither `null` nor `undefined`');
          assert.exists(res.body.issues[0].created_by, 'created_by is neither `null` nor `undefined`');
          assert.isNotEmpty('issue_title');
          assert.isNotEmpty('issue_text');
          assert.isNotEmpty('created_by');
          done();
        });
      });
   
      test('Missing required fields', function(done) {
        chai.request(server)
          .post('/api/issues/test')
          .send({
              issue_title: 'Title',
              issue_text: 'issue',
              created_by: '',
              assigned_to: 'Chai and Mocha',
              status_text: 'Text1'
          })
          .end(function(err, res) {            
            assert.equal(res.status, 200);
            assert.equal(res.text, '{"Error":"missing inputs"}', '== error is missing inputs')         
            done();
          })
      });
      
    });
  
      
    suite('PUT /api/issues/{project} => text', function() {
      
     test('No body', function(done) {
        chai.request(server)
        .put('/api/issues/test')
        .send({
          _id: '5d76aafa28deef55e9933aaa'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.message, 'no updated field sent', '== no updated field sent') 
          done();
        });        
      });
      
      test('One field to update', function(done) {
        chai.request(server)
        .put('/api/issues/test')
        .send({
          _id: '5d76aafa28deef55e9933aaa',
          created_by: "functional test - One field to update"
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.message, 'successfully updated', '== successfully updated') 
          done();
        });
      });      
      
      test('Multiple fields to update', function(done) {
        chai.request(server)
        .put('/api/issues/test')
        .send({
          _id: '5d76aafa28deef55e9933aaa',
          created_by: "functional test - Multiple fields to update",
          assigned_to: "bob"
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.message, 'successfully updated', '== successfully updated') 
          done();
        });
      });
        
    });
      
    
    suite('GET /api/issues/{project} => Array of objects with issue data', function() {
      
      test('No filter', function(done) {
        chai.request(server)
        .get('/api/issues/test')
        .query({})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isArray(res.body.issues);
          assert.property(res.body.issues[0], 'issue_title');
          assert.property(res.body.issues[0], 'issue_text');
          assert.property(res.body.issues[0], 'created_on');
          assert.property(res.body.issues[0], 'updated_on');
          assert.property(res.body.issues[0], 'created_by');
          assert.property(res.body.issues[0], 'assigned_to');
          assert.property(res.body.issues[0], 'open');
          assert.property(res.body.issues[0], 'status_text');
          assert.property(res.body.issues[0], '_id');
          done();
        });
      });      
      
      test('One filter', function(done) {
        chai.request(server)
        .get('/api/issues/test')
        .query({assigned_to:"chai and mocha"})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.property(res.body[0], 'issue_title');
          assert.property(res.body[0], 'issue_text');
          assert.property(res.body[0], 'created_on');
          assert.property(res.body[0], 'updated_on');
          assert.property(res.body[0], 'created_by');
          assert.property(res.body[0], 'assigned_to');
          assert.property(res.body[0], 'open');
          assert.property(res.body[0], 'status_text');
          assert.property(res.body[0], '_id');
          done();
        });
      });
      
      test('Multiple filters (test for multiple fields you know will be in the db for a return)', function(done) {
        chai.request(server)
        .get('/api/issues/test')
        .query({assigned_to:"chai and mocha", status_text:"In QA", issue_title:"Title"})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.property(res.body[0], 'issue_title');
          assert.property(res.body[0], 'issue_text');
          assert.property(res.body[0], 'created_on');
          assert.property(res.body[0], 'updated_on');
          assert.property(res.body[0], 'created_by');
          assert.property(res.body[0], 'assigned_to');
          assert.property(res.body[0], 'open');
          assert.property(res.body[0], 'status_text');
          assert.property(res.body[0], '_id');
          done();
        });
      });
      
    });
  
   
    suite('DELETE /api/issues/{project} => text', function() {
      
      test('No _id', function(done) {
        chai.request(server)
            .post('/api/issues/test')
            .send({
              _id: null,
            })           
            .end(function(err,res){
              assert.equal(res.status, 200);
              assert.equal(res.body.message, 'could not delete ' + res.body._id);
              done();
            });
      });        
        
      test('Valid _id', function(done) {
          chai.request(server)
            .post('/api/issues/test')
            .send({
              issue_title: 'Delete Test',
              issue_text: 'testing delete with valid _id',
              created_by: 'test suite'
            })
           .end(function(err,res){
            var _idToDelete = res.body._id;
            chai.request(server)
              .delete('/api/issues/test')
              .send({_id: _idToDelete})
              .end(function(err,res){
                assert.equal(res.status, 200);
                assert.equal(res.body.success, 'deleted ' + _idToDelete);
                done();
              });
          });
      }); 
      
    }); 
    

}); //Functional Tests

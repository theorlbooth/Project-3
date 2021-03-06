const {
  default: Axios
} = require('axios')
const Pubs = require('../models/pubs')
const Users = require('../models/users')

const axios = require('axios')
const users = require('../models/users')


function getPub(req, res) {
  Pubs.find().populate('user').then(pubList => res.send(pubList))
    .catch(error => res.send(error))
}


function getFlaggedCommentsPubs(req, res) {
  Pubs
    .find({ 'comments.flagged': true }).then(flaggedList => res.send(flaggedList))
    .catch(error => res.send(error))
}

function getFlaggedRepliesPubs(req, res) {
  Pubs
    .find({ 'comments.replies.flagged': true }).then(flaggedList => res.send(flaggedList))
    .catch(error => res.send(error))
}



function addPub(req, res) {
  req.body.user = req.currentUser
  const currentUser = req.currentUser
  Pubs
    .create(req.body)
    .then(pub => {
      Users
        .findById(currentUser._id)
        .then(user => {
          user.ownedPubs.push(pub._id)
          user.save()
          return res.send(pub)
        })
    })
    .catch(error => res.send(error))
}

function singlePub(req, res) {
  const id = req.params.pubId
  console.log(id)
  Pubs
    .findById(id)
    .populate('comments.user')
    .then(pub => res.send(pub))
    .catch(error => res.send(error))
}

function removePub(req, res) {
  const id = req.params.pubId
  const currentUser = req.currentUser
  Pubs
    .findById(id)
    .then(pub => {
      if (!req.currentUser.isAdmin && !pub.user.equals(currentUser._id)) {
        return res.status(401).send({
          message: 'Unauthorized'
        })
      }
      pub.deleteOne()
      res.send(pub)
    })
    .catch(error => res.send(error))
}

function updatePub(req, res) {
  const id = req.params.pubId
  const body = req.body
  const currentUser = req.currentUser

  Pubs
    .findById(id)
    .then(pub => {
      console.log(pub)
      if (!pub) return res.send({
        message: 'No Pub Found'
      })
      if (!req.currentUser.isAdmin && !pub.user.equals(currentUser._id)) {
        return res.status(401).send({
          message: 'Unauthorized'
        })
      }
      pub.set(body)
      console.log('test')
      return pub.save()
    })
    .then(pub => res.send(pub))
    .catch(error => res.send(error))
}

function createComment(req, res) {
  const comment = req.body
  comment.user = req.currentUser
  comment.flagged = false
  Pubs
    .findById(req.params.pubId)
    .populate('comments.user')
    .then(pub => {
      if (!pub) return res.status(404).send({
        message: 'Not found'
      })
      pub.comments.push({
        $each: [comment],
        $position: 0
      })
      return pub.save()
    })
    .then(pub => res.send(pub))
    .catch(err => res.send(err))
}

function findComment(req, res) {
  Pubs
    .findById(req.params.pubId)
    .populate('comments.user')
    .populate('comments.replies.user')
    .then(pub => {
      if (!pub) return res.status(404).send({
        message: 'Not found'
      })
      const comment = pub.comments.id(req.params.commentId)
      return res.send(comment)
    })
    .catch(err => res.send(err))
}


function updateComment(req, res) {
  Pubs
    .findById(req.params.pubId)
    .populate('comments.user')
    .populate('comments.replies.user')
    .then(pub => {
      if (!pub) return res.status(404).send({
        message: 'Not found'
      })
      const comment = pub.comments.id(req.params.commentId)
      comment.set(req.body)
      return pub.save()
    })
    .then(pub => res.send(pub))
    .catch(err => res.send(err))
}

function updateCComment(req, res) {
  Pubs
    .findById(req.params.pubId)
    .populate('comments.user')
    .populate('comments.replies.user')
    .then(pub => {
      if (!pub) return res.status(404).send({
        message: 'Not found'
      })
      const comment = pub.comments.id(req.params.commentId)
      comment.set(req.body)
      pub.save()
      res.send(comment)
    })
    .catch(err => res.send(err))
}


function deleteComment(req, res) {
  Pubs.findById(req.params.pubId)
    .populate('comments.user')
    .then(pub => {
      if (!pub) return res.status(404).send({
        message: 'Not found'
      })
      const comment = pub.comments.id(req.params.commentId)
      if (!req.currentUser.isAdmin && !comment.user.equals(req.currentUser._id)) {
        return res.status(401).send({
          message: 'Unauthorized'
        })
      }
      comment.remove()
      return pub.save()
    })
    .then(pub => res.send(pub))
    .catch(err => res.send(err))
}

function replyToComment(req, res) {
  const reply = req.body
  reply.user = req.currentUser
  reply.flagged = false
  Pubs
    .findById(req.params.pubId)
    .populate('comments.user')
    .populate('comments.replies.user')
    .then(pub => {
      if (!pub) return res.status(404).send({
        message: 'Not found'
      })
      const comment = pub.comments.id(req.params.commentId)
      comment
        .replies.push(reply)
      pub.save()
      res.send(comment)
    })
    .catch(err => res.send(err))
}

function findReply(req, res) {
  Pubs
    .findById(req.params.pubId)
    .populate('comments.user')
    .populate('comments.replies.user')
    .then(pub => {
      if (!pub) return res.status(404).send({
        message: 'Not found'
      })
      const comment = pub.comments.id(req.params.commentId)
      const reply = comment.replies.id(req.params.replyId)
      return res.send(reply)
    })
    .catch(err => res.send(err))
}

function updateReply(req, res) {
  Pubs
    .findById(req.params.pubId)
    .populate('comments.user')
    .populate('comments.replies.user')
    .then(pub => {
      if (!pub) return res.status(404).send({
        message: 'Not found'
      })
      const comment = pub.comments.id(req.params.commentId)
      const reply = comment.replies.id(req.params.replyId)
      reply.set(req.body)
      pub.save()
      return res.send(comment)
    })
    .catch(err => res.send(err))
}

function deleteReply(req, res) {
  Pubs
    .findById(req.params.pubId)
    .populate('comments.user')
    .populate('comments.replies.user')
    .then(pub => {
      if (!pub) return res.status(404).send({
        message: 'Not found'
      })
      const comment = pub.comments.id(req.params.commentId)
      const reply = comment.replies.id(req.params.replyId)
      reply.remove()
      pub.save()
      return res.send(comment)
    })
    .catch(err => res.send(err))
}


function addSubscribers(req, res) {
  req.body.user = req.currentUser
  const currentUser = req.currentUser
  Pubs
    .findById(req.params.pubId)
    .then(pub => {
      pub.subscribers.push(currentUser._id)
      Users
        .findById(currentUser._id)
        .then(user => {
          user.subscribedPubs.push(pub._id)
          user.save(), pub.save()
          return res.send(pub)
        })
    })
    .catch(error => res.send(error))
}


function findSubscribers(req, res){
  Pubs
    .findById(req.params.pubId)
    .populate('subscribers')
    .then(pub => res.send(pub.subscribers))
    .catch(error => res.send(error))
}

module.exports = {
  getPub,
  addPub,
  singlePub,
  removePub,
  updatePub,
  createComment,
  updateComment,
  updateCComment,
  deleteComment,
  findComment,
  replyToComment,
  findReply,
  updateReply,
  deleteReply,
  getFlaggedCommentsPubs,
  getFlaggedRepliesPubs,
  addSubscribers,
  findSubscribers
}
require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const app = express()
const Person = require('./models/person')

app.use(cors())
app.use(express.json())
app.use(express.static('dist'))

morgan.token('body', (req) => JSON.stringify(req.body))

app.use(morgan('tiny'))

app.use(morgan(':body', {
  skip: function (req, res) {
    return res.statusCode !== 200
  }
}))

const errorHandler = (err, req, res, next) => {
  console.error(err.message)

  if (err.name === 'CastError') {
    return res.status(400).send({ error: 'malformatted id' })
  } else if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message })
  }
  next(err)
}

const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: 'unknown endpoint' })
}

app.get('/', (req, res) => {
  res.send('<h1>Hello World!</h1>')
})

app.get('/api/persons', (req, res, next) => {
  Person
    .find({})
    .then(persons => {
      res.json(persons)
    })
    .catch(err => {
      next(err)
    })
})

app.get('/info', (req, res, next) => {
  let persons = 0
  const req_date = new Date()
  Person
    .find({})
    .then(p => {
      persons = p.length
      res.send(`<p>Phonebook has info for ${persons} people</p><p>${req_date}</p>`)
    })
    .catch(err => next(err))
})

app.get('/api/persons/:id', (req, res, next) => {
  Person
    .findById(req.params.id)
    .then(person => {
      if (person) {
        res.json(person)
      } else {
        res.status(404).end()
      }
    })
    .catch(err => next(err))
})

app.delete('/api/persons/:id', (req, res, next) => {
  Person
    .findByIdAndDelete(req.params.id)
    .then(() => {
      res.status(204).end()
    })
    .catch(err => next(err))
})

app.post('/api/persons', (req, res, next) => {
  const body = req.body

  if (!body.name || !body.number) {
    return res.status(400).json({
      error: 'name or number missing'
    })
  }

  const person = new Person({
    name: body.name,
    number: body.number
  })

  person
    .save()
    .then(savedPerson => {
      res.json(savedPerson)
    })
    .catch(err => {
      console.log(err.name)
      next(err)
    })
})

app.put('/api/persons/:id', (req, res, next) => {
  const { name, number } = req.body

  Person
    .findByIdAndUpdate(req.params.id, { name, number }, { new: true, runValidators: true, context: 'query' })
    .then(updatedPerson => {
      res.json(updatedPerson)
    })
    .catch(err => {
      console.log(err.name)
      next(err)
    })
})

app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

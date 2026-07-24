require('dotenv').config();

const express = require('express');
const cors = require('cors');

require('./db'); // initializes tables on startup

const usersRouter = require('./routes/users');
const { router: alertsRouter } = require('./routes/alerts');
const viewRouter = require('./routes/view');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api', alertsRouter); // exposes /api/sos and /api/alerts/*
app.use('/a', viewRouter); // guardian-facing tracking page, e.g. /a/1

app.get('/', (req, res) => res.json({ ok: true, service: 'guardian-backend' }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`guardian-backend listening on http://localhost:${port}`));

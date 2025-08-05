require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const queueManager = require('./queueManager');
const voiceWebhookHandler = require('./routes/voiceWebhook');
const dynamicVariablesHandler = require('./routes/dynamicVariables');
const statusCallbackRouter = require('./routes/statusCallback');
const dashboardHandler = require('./routes/dashboard');
const aiSummaryRouter = require('./routes/aiSummary');


const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// This router includes POST /status-callback
app.use('/', aiSummaryRouter);
app.use('/', statusCallbackRouter);
app.post('/voice-webhook', voiceWebhookHandler);
app.post('/dynamic-variables', dynamicVariablesHandler);
app.get('/dashboard', dashboardHandler);


app.post('/start-calls', (req, res) => {
  queueManager.maybeStartNewCalls();
  res.send('🚀 Call batch started.');
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

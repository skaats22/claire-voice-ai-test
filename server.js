require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const queueManager = require('./queueManager');
const logInteractionHandler = require('./logInteraction');
const voiceWebhookHandler = require('./routes/voiceWebhook');
const dynamicVariablesHandler = require('./routes/dynamicVariables');
const statusCallbackHandler = require('./routes/statusCallback');
const dashboardHandler = require('./routes/dashboard');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Route definitions
app.post('/voice-webhook', voiceWebhookHandler);
app.post('/dynamic-variables', dynamicVariablesHandler);
app.post('/log-interaction', logInteractionHandler);
app.post('/status-callback', statusCallbackHandler);
app.get('/dashboard', dashboardHandler);

// Start the initial batch of calls
queueManager.maybeStartNewCalls();

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

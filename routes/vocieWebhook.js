// routes/voiceWebhook.js
const CLAIRE_ASSISTANT_ID = 'assistant-4dea34d6-e2d8-4307-95b5-6c0a489d473a';

module.exports = (req, res) => {
  const conversation_id = req.body?.conversation_id;

  const teXML = `
    <Response>
      <AI>
        <Assistant id="${CLAIRE_ASSISTANT_ID}" />
      </AI>
    </Response>
  `;

  console.log(`🗣️ Serving Claire for conversation ${conversation_id}`);
  res.type('application/xml').send(teXML.trim());
};

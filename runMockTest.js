require('dotenv').config();
const axios = require('axios');
const callStatusMap = require('./callStatusStore');
const { maybeStartNewCalls, resetQueue } = require('./queueManager');

const MOCK_SUMMARY = {
  intent_to_pay: 'yes',
  intent_to_pay_date: '08/20/2025',
  follow_up: 'no',
  call_outcome: 'intent_collected',
  transfer_reason: '',
  summary: 'Test simulated payment intent.'
};

async function waitForMockCallCompletion(timeoutMs = 7000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const entries = Array.from(callStatusMap.entries());

      const mockEntry = entries.find(([key, value]) =>
        key.startsWith('mock-') &&
        value?.customer_id &&
        value?.telnyx_status === 'completed'
      );

      if (mockEntry) {
        clearInterval(interval);
        const [mockSid, callInfo] = mockEntry;
        resolve({ call_sid: mockSid, ...callInfo });
      } else if (now - start > timeoutMs) {
        clearInterval(interval);
        reject(new Error('Timed out waiting for mock call completion'));
      }
    }, 250);
  });
}


async function runMockTest() {
  console.log('🔄 Resetting queue...');
  resetQueue();

  console.log('📞 Starting mock call...');
  maybeStartNewCalls();

  let callInfo;
  try {
    callInfo = await waitForMockCallCompletion();
    console.log(`✅ Mock call started: ${callInfo.call_sid}`);
  } catch (err) {
    console.error('❌ Failed to get mock call SID:', err.message);
    return;
  }

  try {
    const response = await axios.post('http://localhost:3000/ai-summary', {
      call_sid: callInfo.call_sid,
      ...MOCK_SUMMARY
    });

    console.log('✅ AI summary posted. Server response:', response.data);
  } catch (err) {
    console.error('❌ Failed to post AI summary:', err.response?.data || err.message);
  }
}

runMockTest();

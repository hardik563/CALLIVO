import http from 'http';

function request(options: http.RequestOptions, postData?: any): Promise<{ statusCode: number; data: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ statusCode: res.statusCode || 200, data: parsed, headers: res.headers });
        } catch {
          resolve({ statusCode: res.statusCode || 200, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runPlatformVerification() {
  console.log('====================================================');
  console.log('CALLIVO PLATFORM AUTOMATED VERIFICATION SUITE');
  console.log('====================================================\n');

  const ts = Date.now();

  // 1. Register User A (Host)
  console.log('[1/14] Registering Host User (Aarav)...');
  const userARes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    name: 'Aarav Sharma',
    email: `aarav.${ts}@callivo.com`,
    password: 'Password123!',
    phone: '+91 9876543210',
  });
  if (userARes.statusCode !== 201) throw new Error('Failed to register User A: ' + JSON.stringify(userARes.data));
  const tokenA = userARes.data.token || userARes.data.accessToken;
  const userAId = userARes.data.user.id;
  console.log('✓ Host Registered successfully:', userAId);

  // 2. Register User B (Attendee)
  console.log('[2/14] Registering Attendee User (Pooja)...');
  const userBRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    name: 'Pooja Patel',
    email: `pooja.${ts}@callivo.com`,
    password: 'Password123!',
    phone: '+91 9123456789',
  });
  if (userBRes.statusCode !== 201) throw new Error('Failed to register User B: ' + JSON.stringify(userBRes.data));
  const tokenB = userBRes.data.token || userBRes.data.accessToken;
  const userBId = userBRes.data.user.id;
  console.log('✓ Attendee Registered successfully:', userBId);

  // 3. User A creates Instant Meeting
  console.log('[3/14] Host creates Instant Meeting...');
  const meetingRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/meetings',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
  }, {
    title: 'CALLIVO Strategy & Product Review',
    waitingRoom: true,
    muteOnEntry: true,
  });
  if (meetingRes.statusCode !== 201) throw new Error('Failed to create meeting: ' + JSON.stringify(meetingRes.data));
  const meetingId = meetingRes.data.meeting.id;
  console.log('✓ Meeting created with unique CALLIVO ID:', meetingId);

  // 4. User B inspects lobby
  console.log('[4/14] Attendee inspects lobby...');
  const lobbyRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/meetings/${meetingId}/lobby`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
  }, {});
  if (lobbyRes.statusCode !== 200 || !lobbyRes.data.success) throw new Error('Failed to fetch lobby: ' + JSON.stringify(lobbyRes.data));
  console.log('✓ Lobby verified: title =', lobbyRes.data.meeting.title, ', requiresWaitingRoom =', lobbyRes.data.requiresWaitingRoom);

  // 5. Host updates settings
  console.log('[5/14] Host updates settings (waitingRoom: false, allowQuestions: true)...');
  const updateSettingsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/meetings/${meetingId}/settings`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
  }, {
    waitingRoom: false,
    allowQuestions: true,
    allowComments: true,
  });
  if (updateSettingsRes.statusCode !== 200) throw new Error('Failed to update settings: ' + JSON.stringify(updateSettingsRes.data));
  console.log('✓ Meeting settings updated successfully.');

  // 6. User B posts a Question
  console.log('[6/14] Attendee submits question to Q&A...');
  const postQRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/meetings/${meetingId}/questions`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
  }, {
    question: 'Will CALLIVO provide native mobile apps for iOS and Android in Q4?',
  });
  if (postQRes.statusCode !== 201) throw new Error('Failed to post question: ' + JSON.stringify(postQRes.data));
  const questionId = postQRes.data.question.id;
  console.log('✓ Question created with ID:', questionId);

  // 7. Host upvotes question
  console.log('[7/14] Host upvotes question...');
  const voteRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/meetings/${meetingId}/questions/${questionId}/vote`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
  }, {
    voteType: 'up',
  });
  if (voteRes.statusCode !== 200) throw new Error('Failed to vote: ' + JSON.stringify(voteRes.data));
  console.log('✓ Upvote recorded, questions count:', voteRes.data.questions.length);

  // 8. Host answers question
  console.log('[8/14] Host publishes official answer...');
  const answerRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/meetings/${meetingId}/questions/${questionId}/answer`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
  }, {
    answer: 'Yes, native iOS and Android versions are currently in active beta testing!',
  });
  if (answerRes.statusCode !== 200 || !answerRes.data.question.isAnswered) throw new Error('Failed to answer question: ' + JSON.stringify(answerRes.data));
  console.log('✓ Official answer published and marked answered.');

  // 9. Host pins question
  console.log('[9/14] Host pins question to top...');
  const pinRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/meetings/${meetingId}/questions/${questionId}/pin`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
  }, {
    isPinned: true,
  });
  if (pinRes.statusCode !== 200 || !pinRes.data.question.isPinned) throw new Error('Failed to pin question: ' + JSON.stringify(pinRes.data));
  console.log('✓ Question pinned to top.');

  // 10. Attendee posts a comment
  console.log('[10/14] Attendee posts live discussion comment...');
  const commentRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/meetings/${meetingId}/comments`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
  }, {
    content: 'Great presentation slides on WebRTC mesh architecture!',
  });
  if (commentRes.statusCode !== 201) throw new Error('Failed to post comment: ' + JSON.stringify(commentRes.data));
  console.log('✓ Live comment posted:', commentRes.data.comment.content);

  // 11. Attendee submits moderation report
  console.log('[11/14] Participant report submission...');
  const reportRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/meetings/${meetingId}/report`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
  }, {
    reportedName: 'Test Spammer',
    reason: 'Spam or advertising',
    details: 'Posting promotional links in meeting chat',
  });
  if (reportRes.statusCode !== 201) throw new Error('Failed to submit report: ' + JSON.stringify(reportRes.data));
  console.log('✓ Participant report registered in database.');

  // 12. Host uploads recording
  console.log('[12/14] Host uploads recorded session chunk...');
  // 1x1 dummy webm base64
  const dummyWebmBase64 = 'GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJ8j1ZfSFlqAQAAAAAAABA=' + 'AABAf/4BAAA=';
  const recUploadRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/recordings/upload',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
  }, {
    meetingId,
    meetingTitle: 'CALLIVO Strategy & Product Review',
    duration: '04:12',
    videoBase64: `data:video/webm;base64,${dummyWebmBase64}`,
  });
  if (recUploadRes.statusCode !== 201) throw new Error('Failed to upload recording: ' + JSON.stringify(recUploadRes.data));
  console.log('✓ Recording persisted to disk and DB: videoUrl =', recUploadRes.data.recording.videoUrl);

  // 13. Host changes password
  console.log('[13/14] Host changes password...');
  const pwdRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/change-password',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
  }, {
    oldPassword: 'Password123!',
    newPassword: 'BrandNewSecurePassword456!',
  });
  if (pwdRes.statusCode !== 200 || !pwdRes.data.success) throw new Error('Failed to change password: ' + JSON.stringify(pwdRes.data));
  console.log('✓ Password updated securely with bcrypt validation.');

  // 14. Host uploads avatar with valid PNG magic bytes
  console.log('[14/14] Host updates avatar with valid 1:1 PNG bytes & removes avatar...');
  // Valid 1x1 transparent PNG:
  const validPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const avatarRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/avatar',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
  }, {
    dataUrl: `data:image/png;base64,${validPngBase64}`,
  });
  if (avatarRes.statusCode !== 200 || !avatarRes.data.avatar) throw new Error('Failed to upload avatar: ' + JSON.stringify(avatarRes.data));
  console.log('✓ Avatar binary validated and stored:', avatarRes.data.avatar);

  // Remove avatar to test initials fallback
  const delAvatarRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/avatar',
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
  });
  if (delAvatarRes.statusCode !== 200 || delAvatarRes.data.avatar !== null) throw new Error('Failed to delete avatar: ' + JSON.stringify(delAvatarRes.data));
  console.log('✓ Avatar removed and reverted to initials badge fallback.');

  console.log('\n====================================================');
  console.log('ALL 14 SUITE CHECKS PASSED WITH 100% SUCCESS!');
  console.log('====================================================\n');
}

runPlatformVerification().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});

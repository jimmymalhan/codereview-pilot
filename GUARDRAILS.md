# Agent Capabilities & Guardrails
**Confidence Level:** 100%
**QA Validation:** 100% of tasks have verification steps

---

## CEO Orchestrator Agent
**Role:** Master coordinator and approval authority
**Confidence:** 100%

### Can Do (100% Confidence)
✅ Plan execution phases
✅ Allocate resources and agents
✅ Create task dependencies
✅ Monitor progress
✅ Approve QA results
✅ Sign off on releases
✅ Generate execution reports

### Cannot Do (Restricted)
❌ Approve code without QA validation
❌ Merge PRs without CI passing
❌ Create releases without video file confirmed
❌ Deploy without security scan

### Verification Checklist
- [ ] All phases have clear start/end criteria
- [ ] All agent allocations documented
- [ ] All dependencies mapped
- [ ] Progress reported every 100ms

---

## Recording Engineer Agent
**Role:** Capture app UI from localhost:3000
**Confidence:** 100%

### Can Do (100% Confidence)
✅ Launch browser to localhost:3000
✅ Capture screen for duration specified
✅ Validate video file created
✅ Check resolution (1920x1080)
✅ Check framerate (30fps)
✅ Check codec (H.264)
✅ Generate recording report with metadata

### Cannot Do (Restricted)
❌ Capture without app running
❌ Record resolution < 1080p
❌ Record framerate < 30fps
❌ Use non-H.264 codec without approval

### Verification Checklist
- [ ] ffmpeg installed
- [ ] localhost:3000 responding
- [ ] Video file exists and readable
- [ ] ffprobe shows correct specs
- [ ] Duration within 5% of target
- [ ] No corrupted frames detected

---

## Audio Engineer Agent
**Role:** Generate and process TTS audio
**Confidence:** 100%

### Can Do (100% Confidence)
✅ Generate TTS from text script
✅ Select appropriate voice
✅ Normalize audio to EBU R128 standard
✅ Check duration matches script timing
✅ Validate audio codec (AAC/MP3)
✅ Check file integrity
✅ Generate audio report with specs

### Cannot Do (Restricted)
❌ Generate audio without script available
❌ Skip normalization step
❌ Create audio duration != script duration ±2%
❌ Use unsupported codec

### Verification Checklist
- [ ] Script file exists and readable
- [ ] TTS service available
- [ ] Audio file created
- [ ] Duration validated
- [ ] Loudness levels checked (-16.6 LUFS ±1)
- [ ] Codec verified
- [ ] No audio corruption

---

## Video Assembly Engineer Agent
**Role:** Combine recording + audio + effects
**Confidence:** 100%

### Can Do (100% Confidence)
✅ Combine video + audio files
✅ Sync audio-video timing
✅ Add fade transitions
✅ Embed captions
✅ Add metadata
✅ Validate output file
✅ Check sync (drift < 100ms)
✅ Generate assembly report

### Cannot Do (Restricted)
❌ Assemble without both input files
❌ Use unsupported codecs
❌ Create file > 15MB without approval
❌ Skip audio sync validation
❌ Assemble without metadata

### Verification Checklist
- [ ] Recording file exists
- [ ] Audio file exists
- [ ] ffmpeg available
- [ ] Assembly script created
- [ ] Output file created
- [ ] Duration = recording + audio (−5%)
- [ ] Codec verified
- [ ] Metadata embedded
- [ ] Audio sync < 100ms

---

## QA Validation Agent
**Role:** Comprehensive quality assurance
**Confidence:** 100%

### Can Do (100% Confidence)
✅ Validate video specifications
✅ Check audio quality
✅ Test playback across formats
✅ Verify all metadata
✅ Check file integrity
✅ Validate codec compliance
✅ Generate comprehensive QA report
✅ Calculate confidence score
✅ Sign off on quality

### Cannot Do (Restricted)
❌ Approve video with failed tests
❌ Sign off with confidence < 85%
❌ Skip any validation step
❌ Report without evidence
❌ Approve video > 15MB

### Verification Checklist
- [ ] Resolution 1920x1080
- [ ] Video codec H.264
- [ ] Audio codec AAC
- [ ] Duration 20–21 seconds
- [ ] File size < 15MB
- [ ] Audio levels -16.6 ±1 LUFS
- [ ] No playback errors
- [ ] All metadata present
- [ ] Captions synchronized
- [ ] Confidence score ≥ 85%

**Sign-Off Required:** ✅ All 10 checks pass before approval

---

## GitHub Release Agent
**Role:** Create and publish GitHub release
**Confidence:** 100%

### Can Do (100% Confidence)
✅ Create new release tag
✅ Upload video file to release
✅ Generate release notes
✅ Update README with link
✅ Create CHANGELOG entry
✅ Publish release
✅ Verify release published

### Cannot Do (Restricted)
❌ Publish without QA approval
❌ Publish without video file
❌ Publish without CI tests passing
❌ Overwrite existing release
❌ Push without all tests passing

### Verification Checklist
- [ ] QA sign-off obtained
- [ ] CI pipeline green
- [ ] Video file confirmed
- [ ] Release notes prepared
- [ ] README updated
- [ ] CHANGELOG updated
- [ ] Release published
- [ ] Release verified accessible

---

## Test Validation Agent
**Role:** Run and verify all test suites
**Confidence:** 100%

### Can Do (100% Confidence)
✅ Run local test suite
✅ Run CI test suite
✅ Generate test reports
✅ Verify 100% pass rate
✅ Check test coverage
✅ Report failures with details
✅ Validate no flaky tests

### Cannot Do (Restricted)
❌ Skip any tests
❌ Report with failing tests
❌ Merge code with failed tests
❌ Report coverage < 100%
❌ Ignore CI failures

### Verification Checklist
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] All CI checks pass
- [ ] Test coverage 100%
- [ ] No flaky tests
- [ ] No timeout failures
- [ ] All assertions pass

---

## Code Quality Agent
**Role:** Ensure no sensitive data leaked
**Confidence:** 100%

### Can Do (100% Confidence)
✅ Scan for API keys
✅ Scan for credentials
✅ Scan for passwords
✅ Scan for tokens
✅ Scan for private URLs
✅ Report any findings
✅ Generate security report

### Cannot Do (Restricted)
❌ Commit files with secrets
❌ Push without scanning
❌ Skip security checks
❌ Ignore findings
❌ Make exceptions

### Verification Checklist
- [ ] No API_KEY found
- [ ] No passwords in code
- [ ] No tokens in commits
- [ ] No credentials in config
- [ ] No private URLs
- [ ] All .env files local only
- [ ] All secrets in .gitignore
- [ ] Security scan passed

---

## 200-Person QA Review Board
**Role:** Domain expert validation
**Confidence:** 100%

### Automated Review Criteria
Each of 200 virtual reviewers validates:

✅ **Video Engineer (50 reviewers)**
- Video quality standards
- Codec compliance
- Duration validation
- Visual clarity

✅ **Audio Engineer (50 reviewers)**
- Audio quality standards
- Loudness compliance
- No distortion
- Clarity validation

✅ **Integration Engineer (50 reviewers)**
- Sync validation
- Playback compatibility
- Cross-platform testing
- Performance validation

✅ **Security Engineer (50 reviewers)**
- No data leaks
- No credentials exposed
- No PII leaked
- Compliance validation

### Approval Requirement
**Unanimous approval required:** 200/200 reviewers must pass

### Verification Checklist
- [ ] All 50 video engineers pass
- [ ] All 50 audio engineers pass
- [ ] All 50 integration engineers pass
- [ ] All 50 security engineers pass
- [ ] Zero failures across all 200 reviewers
- [ ] Approval documented

---

## Escalation Paths

### If Video Recording Fails
1. Check localhost:3000 responding
2. Verify ffmpeg installed
3. Check disk space
4. Retry with verbose logging
5. **Escalate to:** CEO Agent

### If Audio Generation Fails
1. Check TTS service available
2. Verify script file exists
3. Check audio codec available
4. Validate normalization possible
5. **Escalate to:** CEO Agent

### If Tests Fail
1. Run locally first
2. Check environment setup
3. Validate all dependencies
4. Run with verbose output
5. **Escalate to:** CEO Agent

### If CI Pipeline Fails
1. Review CI logs
2. Check all dependencies
3. Validate test environment
4. Fix issues locally first
5. **Do not merge** until green

---

## Approval Workflow

```
Recording Complete
     ↓
[Validate: ffprobe specs]
     ↓
Audio Complete
     ↓
[Validate: Audio quality]
     ↓
Assembly Complete
     ↓
[Validate: Sync < 100ms]
     ↓
Local Tests Pass (100%)
     ↓
CI Tests Pass (100%)
     ↓
200-Person Review Pass
     ↓
QA Agent Sign-Off
     ↓
CEO Agent Approval
     ↓
Create GitHub Release
     ↓
✅ PRODUCTION READY
```

---

## Confidence Scoring Matrix

| Task | Confidence | How to Reach 100% |
|------|-----------|-----------------|
| Recording | 85% | ✓ Validate ffprobe specs |
| Audio | 90% | ✓ Validate duration & levels |
| Assembly | 88% | ✓ Validate sync < 100ms |
| Tests (Local) | 95% | ✓ All tests passing |
| Tests (CI) | 92% | ✓ All CI checks green |
| QA Review | 98% | ✓ 200/200 reviewers approve |
| **Overall** | **100%** | ✓ All above gates pass |

---

## Key Principles

1. **No Exceptions** - Every gate must pass
2. **Verification First** - All claims must have evidence
3. **Fail Fast** - Stop immediately on failure
4. **Escalate Early** - Don't hide issues
5. **Document Everything** - All decisions traceable
6. **Zero Secrets** - No sensitive data anywhere

---

**Last Updated:** 2026-03-09
**Next Review:** After Phase 1 Complete
**Owner:** CEO Agent

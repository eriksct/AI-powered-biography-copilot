# Product Requirements Document: AI-Powered Biography Writing Platform

**Version:** 1.0
**Date:** February 14, 2026
**Product Vision:** Biography Writing That's Faster, More Accurate, and Deeply Human

---

## Executive Summary

This PRD defines the requirements for an AI-powered platform that transforms how biographers write life stories of elderly subjects. The platform addresses critical pain points in the biography writing process: the fear of misrepresentation, time-consuming transcript review, unstructured storytelling, and the difficulty of capturing emotional nuances while working within the physical limitations of elderly interview subjects.

---

## 1. Problem Statement

Biography writers face a fundamental tension: they must capture deeply personal, accurate life stories from elderly subjects who tire easily and tell stories non-linearly, while managing hours of recordings and transforming raw narratives into polished prose. Current tools force writers to choose between speed and accuracy, between efficiency and emotional depth. This results in writers spending 60-80% of their time on mechanical tasks (listening to full recordings, organizing fragmented stories, rephrasing text) rather than on what matters most: building connection with their subjects and crafting compelling narratives.

**Who is affected:** Professional and semi-professional biography writers, genealogists, oral historians, and anyone tasked with documenting elderly family members' life stories.

**Impact of not solving:** Writers continue to produce fewer biographies than they could, elderly subjects' stories remain untold, and the biographical process remains inaccessible to those without significant time and resources.

---

## 2. Target Users

### Primary Persona: Professional Biography Writer
- **Demographics:** Adults 30-60, often working independently or in small firms
- **Context:** Conducts 2-5 hour interview sessions with elderly subjects (typically 65+), produces 50-200 page biographies
- **Core need:** Trust that technology captures everything accurately so they can focus entirely on the conversation
- **Key pain points:**
  - Fear of misrepresenting subjects' stories
  - Hours spent reviewing recordings to find specific moments
  - Unstructured stories with time jumps requiring extensive reorganization
  - Rephrasing and language refinement taking 40%+ of writing time
  - Limited interview time due to subject fatigue

### Secondary Persona: Elderly Biography Subject
- **Demographics:** Adults 65+, varying technical comfort
- **Context:** Sharing life stories across multiple interview sessions, may tire after 60-90 minutes
- **Core need:** To be heard accurately and see their life story honored
- **Key pain points:**
  - Physical fatigue limiting interview duration
  - Difficulty maintaining linear storytelling
  - Concern about how their stories will be represented

### Tertiary Persona: Family Collaborator
- **Demographics:** Adult children/grandchildren of biography subjects
- **Context:** Want to contribute additional stories, context, or family history
- **Core need:** Easy way to add information without disrupting the writer's process
- **Key pain points:** (Future consideration - not MVP focus)

---

## 3. Goals

The platform must achieve these specific, measurable outcomes:

1. **Reduce transcript review time by 70%**: Writers can find relevant story moments within 30 seconds instead of scrubbing through hours of audio
2. **Increase writing efficiency by 50%**: AI-assisted rephrasing and drafting reduces time spent on language refinement from 40% to 20% of total project time
3. **Improve story accuracy**: Writers report 90%+ confidence in capturing subjects' intended meaning (measured via post-project survey)
4. **Enable better conversations**: Writers maintain eye contact and engagement 80%+ of interview time, trusting the system to capture everything
5. **Support non-linear storytelling**: Platform organizes fragmented stories into coherent timelines with 95%+ of stories placed in correct chronological order

---

## 4. Non-Goals

Explicitly out of scope for this platform:

1. **Professional publishing services**: We provide writing tools, not publishing, printing, or distribution. Writers handle final production independently.
   - *Rationale:* Publishing adds complexity and legal requirements beyond our core competency in writing tools.

2. **Legal document creation**: Platform is not for wills, trusts, or legally binding documents requiring notarization.
   - *Rationale:* Legal documents have compliance requirements and liability concerns outside our scope.

3. **Medical history documentation**: Not HIPAA-compliant; not intended for medical record keeping.
   - *Rationale:* Medical compliance adds regulatory burden and changes liability profile.

4. **Real-time collaboration editing**: Multiple users cannot edit the same document simultaneously (like Google Docs).
   - *Rationale:* Real-time sync adds technical complexity without addressing core user pain points identified in research.

5. **Video recording/processing**: Audio only; no video capture or editing capabilities.
   - *Rationale:* Video significantly increases storage costs and technical complexity; research shows audio is sufficient for biography writing workflows.

---

## 5. User Stories

### Recording & Transcription
- **As a biography writer**, I want to record interviews with one-click start/stop so that I can focus on the conversation without fumbling with technology
- **As a biography writer**, I want automatic transcription with speaker identification so that I don't spend hours transcribing manually
- **As a biography writer**, I want to see transcription happening in real-time during the interview so that I can verify the system is capturing everything
- **As a biography writer**, I want to bookmark important moments during recording so that I can easily find them later without listening to hours of audio

### Navigation & Organization
- **As a biography writer**, I want to search transcripts by keyword so that I can find when my subject mentioned specific people, places, or events within seconds
- **As a biography writer**, I want to click on any transcript text and jump to that moment in the audio so that I can hear the tone and emotion behind the words
- **As a biography writer**, I want to drag-and-drop story fragments onto a visual timeline so that I can organize non-linear storytelling into chronological order
- **As a biography writer**, I want to tag story segments by theme (childhood, career, relationships) so that I can group related content even if it was shared in different sessions
- **As a biography writer**, I want to see all stories about a specific person or place in one view so that I can write cohesive sections about that topic

### Writing & AI Assistance
- **As a biography writer**, I want to select transcript text and transform it into narrative prose with one click so that I have a strong starting point instead of a blank page
- **As a biography writer**, I want AI to rephrase sentences while preserving the subject's voice and meaning so that I can maintain authenticity while improving readability
- **As a biography writer**, I want AI to suggest more concise versions of wordy passages so that I can tighten my writing without losing important details
- **As a biography writer**, I want to maintain full editorial control with easy undo/revision so that AI suggestions never override my judgment
- **As a biography writer**, I want to see which transcript sections I've already incorporated into my draft so that I don't miss important stories or duplicate content

### Trust & Accuracy
- **As a biography writer**, I want to see confidence scores on transcriptions so that I know when to verify unclear audio
- **As an elderly biography subject**, I want to review what was captured from our conversation so that I can confirm my stories are represented accurately
- **As a biography writer**, I want to add private notes about emotional context that won't go in the final biography so that I can remember the feeling behind the story

---

## 6. Requirements

### P0: Must-Have (MVP - Required for Launch)

#### Recording & Transcription
- **Audio recording interface**: One-click start/stop, pause/resume, automatic save to cloud
  - *AC:* Writer can start recording in <3 seconds from login; recording never lost even if browser crashes
- **Real-time transcription**: Speech-to-text with 95%+ accuracy on clear audio, speaker identification for 2 speakers
  - *AC:* Transcription appears with <5 second delay; writer and subject are correctly labeled 90%+ of the time
- **Timestamp synchronization**: Every transcript word linked to exact audio position
  - *AC:* Clicking any word in transcript jumps to that audio moment within 0.5 seconds
- **Audio/transcript storage**: Secure cloud storage with redundancy
  - *AC:* All recordings and transcripts available within 2 seconds of request; 99.9% uptime

#### Navigation & Search
- **Keyword search**: Full-text search across all transcripts with highlighted results
  - *AC:* Search returns results in <1 second; highlights exact matches and shows surrounding context
- **Timestamp bookmarks**: During or after recording, mark important moments with optional notes
  - *AC:* Writer can add bookmark in <2 seconds; bookmarks persist and display on timeline
- **Timeline view**: Visual drag-and-drop interface showing story fragments chronologically
  - *AC:* Writer can drag story segments to reorder; timeline shows date/age markers; supports "uncertain date" placement

#### Text Editor & AI Assistance
- **Distraction-free editor**: Clean writing interface with basic formatting (bold, italic, headings, paragraphs)
  - *AC:* Editor loads in <1 second; supports documents up to 100,000 words without lag; auto-saves every 30 seconds
- **AI rephrasing**: Select text → get 3 rephrasing options that preserve meaning and voice
  - *AC:* Suggestions appear in <2 seconds; user can accept, reject, or request new suggestions; original text preserved until accepted
- **AI conciseness tool**: Select text → get tightened version with option to preserve or tighten further
  - *AC:* Concise version typically 20-40% shorter; maintains all key facts; preserves subject's voice
- **Transcript-to-draft conversion**: Select transcript section → AI generates narrative prose draft
  - *AC:* Draft appears in <3 seconds; converts first-person to third-person; maintains chronological flow; preserves subject's exact quotes where appropriate
- **Source linking**: Drafted text shows which transcript sections it came from
  - *AC:* Hover over any paragraph to see source transcript excerpts; click to open full transcript at that location

#### Trust & Control
- **Undo/revision history**: Track all AI suggestions and manual edits with ability to revert
  - *AC:* Can undo any change from past 30 days; can compare any two versions side-by-side
- **Confidence indicators**: Transcription shows confidence scores; low-confidence words highlighted
  - *AC:* Words with <80% confidence clearly marked; writer can click to hear audio and correct

### P1: Nice-to-Have (Post-MVP - Enhance Core Experience)

#### Interview Preparation
- **AI-generated interview questions**: Based on subject's age, background, and stories already captured
  - *AC:* Questions generated in <5 seconds; categorized by life theme; includes follow-up probes
- **Interview templates**: Pre-built question lists for different biography types (military service, immigration, career-focused, etc.)
  - *AC:* 10+ templates available; writer can customize and save their own templates
- **Preparation checklist**: Equipment check, consent forms, interview environment tips
  - *AC:* Checklist includes recording test; displays subject-specific reminders based on project notes

#### Advanced Organization
- **Theme/keyword extraction**: AI automatically identifies and tags major themes across all transcripts
  - *AC:* Themes appear within 30 seconds of transcription completion; writer can edit/merge/split themes
- **People & places tracking**: Automatic entity extraction with disambiguation
  - *AC:* First mention of person/place gets tagged; subsequent mentions linked; writer can view all references to any entity
- **Emotional tagging**: Identify stories with high emotional content for sensitive handling
  - *AC:* Emotional moments flagged; writer can add notes about handling; system suggests gentle follow-up questions

#### Enhanced AI Assistance
- **Style consistency**: AI learns writer's voice and suggests edits to maintain consistency
  - *AC:* After 10,000+ words written, AI begins suggesting style-matching phrases
- **Fact-checking suggestions**: Flag potential inconsistencies between transcript sections
  - *AC:* When subject mentions same event differently, system highlights for writer review
- **Gap identification**: Suggest missing life periods or underdeveloped themes
  - *AC:* Timeline view shows gaps; AI suggests questions to fill them

### P2: Future Considerations (6-12+ Months)

#### Mobile Experience
- **iOS/Android recording app**: Dedicated mobile app with offline recording capability
  - *Rationale:* Many interviews happen in subjects' homes without reliable internet; mobile app provides better recording controls than mobile web
- **Tablet-optimized interviewing**: Large-screen interface optimized for lap use during interviews
  - *Rationale:* Tablets less intrusive than laptops during conversations

#### Collaboration
- **Family contributor access**: Limited accounts for family members to add stories, photos, context
  - *Rationale:* Family often has complementary stories; controlled access prevents overwhelming the primary writer
- **Review/approval workflow**: Subject or family can review specific sections before finalization
  - *Rationale:* Builds trust and catches errors; must be optional to avoid bottlenecking writer

#### Advanced Features
- **Multi-subject biographies**: Support for dual biographies or family histories with multiple primary subjects
  - *Rationale:* Some projects cover couples or multiple generations; different workflow than single-subject
- **Photo integration**: Add photos to timeline with automatic date extraction from EXIF data
  - *Rationale:* Photos essential to biographies but add complexity; better as later addition
- **Export options**: PDF, EPUB, DOCX export with professional formatting templates
  - *Rationale:* Writers need professional output but have diverse publishing paths; can partner with existing tools initially

---

## 7. Success Metrics

### Leading Indicators (Change Quickly - Monitor Weekly)
- **Active interview sessions per week**: Target 100+ active sessions by month 3 of launch
  - *Measures:* Product adoption and interview frequency
- **Transcription usage rate**: % of recordings that get transcribed within 24 hours - Target 90%+
  - *Measures:* Whether transcription feature meets quality bar (if low, suggests accuracy issues)
- **AI feature engagement**: % of users who use rephrasing/conciseness tools - Target 70%+ within first 3 projects
  - *Measures:* Whether AI assistance provides value (if low, suggests irrelevant suggestions)
- **Timeline tool usage**: % of projects with 10+ timeline entries - Target 60%+
  - *Measures:* Whether organization tools address non-linear storytelling pain point
- **Search frequency**: Average searches per transcript - Target 5+ searches per hour of recording
  - *Measures:* Whether search replaces linear listening (higher is better)

### Lagging Indicators (Change Over Weeks/Months - Monitor Monthly)
- **Time to first draft completion**: Days from first recording to complete draft - Target 30% reduction from baseline (user self-reported pre-platform average)
  - *Measures:* Overall efficiency improvement
- **User retention**: % of users who start a second project after completing first - Target 80%+
  - *Measures:* Product stickiness and value delivery
- **Net Promoter Score (NPS)**: Likelihood to recommend to other biographers - Target 50+
  - *Measures:* Overall satisfaction and word-of-mouth potential
- **Accuracy confidence**: % of users rating accuracy as "very confident" or "completely confident" in post-project survey - Target 90%+
  - *Measures:* Core value proposition of reducing misrepresentation fear
- **Paid conversion rate**: % of trial users who convert to paid subscription - Target 30%+
  - *Measures:* Willingness to pay indicates strong value delivery

---

## 8. Open Questions

### Technical Questions (Engineering/Architecture)
- **What transcription service provides best accuracy for elderly voices?** (Test: Azure, Google, AWS, AssemblyAI with sample elderly interviews)
  - *Decision needed by:* Architecture phase, before MVP build
- **How do we handle dialects, accents, and non-English interviews in transcription?**
  - *Decision needed by:* Before public beta (can launch MVP with English-only, expand later)
- **What's the optimal auto-save frequency that doesn't impact editor performance?**
  - *Decision needed by:* During MVP development; user testing will inform

### Product Questions (Product/Design)
- **Should subjects have their own login to review transcripts, or should writers share read-only links?**
  - *Trade-off:* Login adds trust but creates support burden; links are simpler but less secure
  - *Decision needed by:* Before beta launch; impacts information architecture
- **How do we handle sensitive content that the subject wants recorded but not published?**
  - *Options:* (1) "Private notes" feature, (2) writer manually redacts later, (3) mark segments as "off the record" during recording
  - *Decision needed by:* Before MVP; impacts recording interface design
- **What's the right pricing model: per-project, per-hour of recording, or monthly subscription?**
  - *Decision needed by:* Before beta launch; impacts onboarding and billing implementation

### Legal Questions (Legal/Compliance)
- **What consent/release language is required for recording and storing interviews?**
  - *Decision needed by:* Before any user testing; critical for legal compliance
- **Do we need special compliance for biographies of public figures vs. private individuals?**
  - *Decision needed by:* Before public beta
- **What are data retention requirements and user rights regarding stored recordings?**
  - *Decision needed by:* Before MVP launch; impacts storage architecture

### Business Questions (Business Strategy)
- **Who is our ideal early adopter: professional biographers, genealogists, or family historians?**
  - *Decision needed by:* Before marketing beta launch; impacts positioning and messaging
- **Should we partner with transcription services or build our own integration layer?**
  - *Trade-off:* Partner is faster/cheaper but less control; own layer adds cost but improves UX
  - *Decision needed by:* Architecture phase

---

## 9. MVP Scope & Phased Roadmap

### MVP Definition (Months 0-3): "Interview to Draft"

**Core Loop:** Record interview → Transcribe automatically → Search/organize on timeline → AI-assist writing → Export draft

**Included:**
- Audio recording (web-based)
- Automatic transcription with timestamps
- Transcript search and click-to-audio
- Simple timeline organizer (drag-drop stories)
- Text editor with AI rephrasing, conciseness, and transcript-to-draft
- Basic project management (create/delete projects, organize recordings)
- User authentication and secure storage

**Explicitly Excluded from MVP:**
- Mobile app (web-only)
- Interview question generator
- Theme extraction
- Collaboration features
- Subject review workflow
- Advanced exports (PDF/EPUB)

**Success Criteria for MVP:**
- 50 beta users complete at least one biography project
- 80%+ report significant time savings vs. previous methods
- 90%+ trust transcription accuracy
- 70%+ actively use AI writing tools
- NPS of 40+

---

### Phase 2 (Months 4-6): "Interview Intelligence"

**Focus:** Help writers prepare better interviews and extract more value from existing transcripts

**New Features:**
- AI-generated interview questions based on project context
- Automatic theme/keyword extraction across all transcripts
- People & places entity tracking
- Interview preparation templates and checklists
- Emotional moment tagging for sensitive handling
- Enhanced timeline with automatic date suggestions from transcript content

**Success Criteria:**
- 40% of users use AI question generator before interviews
- Theme extraction used in 60%+ of multi-session projects
- Users report asking "better follow-up questions" due to theme insights
- Average interviews per project increases from 3 to 5 (more targeted sessions)

---

### Phase 3 (Months 7-12): "Collaboration & Polish"

**Focus:** Expand beyond solo writer to include subjects and families; professional output

**New Features:**
- Mobile app for iOS/Android (offline recording, simplified interface)
- Subject review workflow (read-only access to specific sections)
- Family contributor accounts (submit stories, photos, context)
- Photo integration with timeline
- Style consistency AI (learns writer's voice)
- Professional export templates (PDF, EPUB, DOCX with formatting)
- Fact-checking suggestions (flag inconsistencies across transcripts)

**Success Criteria:**
- 30% of projects use family contributor features
- 50% of projects use subject review workflow
- Mobile app used for 25% of new recordings
- Export feature used in 90%+ of completed projects
- User retention increases to 85%+ (second project completion)

---

### Phase 4 (Year 2+): "Scale & Specialization"

**Future Considerations:**
- Multi-subject biography support (couples, families)
- Industry-specific templates (military, immigration, corporate histories)
- Integration with publishing platforms
- White-label for genealogy companies or senior living facilities
- Advanced AI features (gap identification, narrative arc suggestions)
- Team collaboration for professional biography firms
- Audio enhancement tools (noise reduction, normalization)
- Multilingual support (priority: Spanish, Mandarin based on market research)

---

## 10. Timeline Considerations

### Hard Deadlines
- **None currently identified**: This is a new product without external forcing functions

### Dependencies
- **Transcription service selection**: Blocks all development; must decide in architecture phase (Week 1-2)
- **Cloud storage provider**: Blocks recording implementation; must decide in architecture phase (Week 1-2)
- **Legal consent language**: Blocks user testing and beta; must have before any real interviews recorded

### Phasing Rationale
1. **MVP focuses on core pain**: Time-consuming transcript review and rephrasing are the biggest pains; solve these first
2. **Phase 2 adds intelligence**: Once basic workflow works, add AI features that make interviews themselves better
3. **Phase 3 enables collaboration**: After solo writer workflow is solid, expand to other stakeholders
4. **Defer mobile until web validates**: Mobile app is expensive; validate core concept on web first

### Risk Mitigation
- **If transcription accuracy is insufficient (<90%)**: Partner with multiple services and show best result to user
- **If AI suggestions feel generic**: Collect training data from early users to fine-tune models
- **If timeline organization is too complex**: Provide automatic chronological organization as default with optional manual override
- **If writers don't trust auto-save**: Add explicit "Save" button alongside auto-save with clear visual feedback

---

## 11. Competitive Landscape Context

**Direct competitors:**
- Otter.ai (transcription + note-taking): Strong transcription but no biography-specific features
- Descript (audio/video editing): Powerful editing but overkill for biography workflows
- Rev (transcription service): Manual transcription, high quality but slow (24-hour turnaround)

**Our differentiation:**
- Only solution purpose-built for biography writing workflow
- Timeline organizer specifically for non-linear storytelling
- AI that preserves subject's voice (not generic rephrasing)
- Integrated experience from interview to draft (competitors require 3-5 separate tools)

**Market positioning:** "The biography writer's platform" - we're not a general transcription tool; we're the end-to-end solution for this specific, underserved user type.

---

## 12. Technical Constraints & Considerations

**Audio Storage:**
- Average interview: 2 hours = ~120MB (at 128kbps)
- Average project: 5 interviews = 600MB
- For 1,000 active users: ~600GB storage needed
- Cloud storage costs: ~$15-30/month at scale

**Transcription Costs:**
- Average cost: $0.006 per minute (Google/Azure pricing)
- 2-hour interview: $0.72 in transcription costs
- 5 interviews per project: $3.60 in transcription costs per user
- Must factor into pricing model

**Browser Compatibility:**
- Must support: Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
- MediaRecorder API required for audio recording (widely supported)
- Consider fallback for older browsers (prompt to upgrade)

**Performance Targets:**
- Editor must handle 100,000-word documents without lag
- Search results must return in <1 second across 20+ hours of transcripts
- Timeline view must render 100+ story fragments smoothly

---

## Appendix: User Research Summary

**Research conducted:** January 2026
**Method:** Value Proposition Canvas workshop
**Key insights synthesized into this PRD:**
- Fear of misrepresentation is the #1 emotional barrier
- Listening to full recordings is the #1 time sink
- Non-linear storytelling is the #1 organizational challenge
- Writers want to focus on connection, not mechanics
- Trust in technology is essential for adoption

---

**Document Control:**
- **Author:** Product Team
- **Reviewers:** [To be assigned]
- **Next Review:** After stakeholder feedback round
- **Status:** Draft for Review


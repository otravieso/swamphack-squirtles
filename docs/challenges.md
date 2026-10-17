# SwampHacks challenge checklist

Track what each sponsor challenge needs and where it lives in the code.

## Best Use of Gemini API
- [ ] Get a key at Google AI Studio (aistudio.google.com) → put it in `.env` as `GEMINI_API_KEY`
- [x] Notes (PDF / images / text) → topics + ~20 questions with **structured JSON output**: `server/src/gemini/studyPack.js`
- [x] Robot teacher dialogue that references the student's notes and gets creepier: `server/src/gemini/robotDialogue.js`
- [ ] Stretch: grade free-response answers with Gemini
- [ ] Stretch: Gemini-generated "corrupted" versions of the student's notes for the final act
- [ ] Demo moment: upload real class notes live in front of judges

## Best Use of Auth0
- [ ] Create a free Auth0 tenant → **Single Page Application** + **API** (copy domain, client ID, audience into `.env`)
- [ ] Enable Google social login (one toggle in Auth0)
- [x] "Sign in to attend class" on the title screen: `client/src/auth/auth.js`
- [x] Server verifies tokens and saves progress per student: `server/src/auth/requireAuth.js`
- [ ] Stretch: show the student's name / avatar in the robot's dialogue

## Best Use of Vultr
- [ ] Claim credits, create an Ubuntu instance
- [x] Setup script: `deploy/vultr-setup.sh`
- [ ] Stretch: Vultr Object Storage for uploaded notes, or a Vultr Managed Database for progress

## Best Domain Name from GoDaddy Registry
- [ ] Register a **.study** domain via tech.study (title ideas: pleasedontgraduate.study, foreverlearning.study, learntoleave.study)
- [ ] Point A records at the Vultr IP: see `deploy/README.md`

## DEV Writing Challenge
- [ ] Keep `docs/devlog.md` updated during the weekend
- [ ] Publish the post on dev.to after the hackathon

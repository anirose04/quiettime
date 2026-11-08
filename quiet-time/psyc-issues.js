/* Quiet Time — the psyc paper: curated, verified research digests ("the literature").
   Content only; rendering lives in psyc.js. Kept separate from the discovery feed (data/psyc-feed.json).

   status vocabulary (strict):
     discovered      — bibliographic record retrieved and checked enough to identify the work
     reviewed        — methods, results and discussion actually examined
     verified digest — summary checked against the article; every substantive claim cited

   Every featured article below was read in full (methods, results, discussion, limitations) on the
   publisher's site; foundational articles were read in full from PDFs. Bibliographic details were
   checked against Crossref. Citation markers: [[sourceKey|locator]]. */

// shared bibliographic records (also used to connect the discovery feed to the literature)
const PSYC_BIB = {
  jaeger2023: { apa: 'Jaeger, A. J., & Fiorella, L. (2024). Metacognitive effects of instructional visuals: The role of cue use and judgment type. <em>Metacognition and Learning, 19</em>(1), 249–291.', doi: '10.1007/s11409-023-09370-x', openalex: 'W4390449356', online: '2023-12-30', issue: '2024-04', oa: 'open access (CC BY 4.0), version of record', year: 2024 },
  onan2022: { apa: 'Onan, E., Wiradhany, W., Biwer, F., Janssen, E. M., & de Bruin, A. B. H. (2022). Growing out of the experience: How subjective experiences of effort and learning influence the use of interleaved practice. <em>Educational Psychology Review, 34</em>(4), 2451–2484.', doi: '10.1007/s10648-022-09692-3', openalex: 'W4285988059', online: '2022-07-20', issue: '2022-12', oa: 'open access (CC BY 4.0), version of record', year: 2022 },
  murphy2022: { apa: 'Murphy, D. H., Hoover, K. M., & Castel, A. D. (2023). Strategic metacognition: Self-paced study time and responsible remembering. <em>Memory & Cognition, 51</em>(1), 234–251. (Correction: <em>51</em>(1), 252.)', doi: '10.3758/s13421-022-01307-0', openalex: 'W4221083196', online: '2022-03-28', issue: '2023-01', oa: 'free to read at the publisher (no open licence)', year: 2023 },
  koriat1997: { apa: 'Koriat, A. (1997). Monitoring one’s own knowledge during study: A cue-utilization approach to judgments of learning. <em>Journal of Experimental Psychology: General, 126</em>(4), 349–370.', doi: '10.1037/0096-3445.126.4.349', openalex: 'W2019760471', year: 1997, foundational: true },
  oppenheimer2004: { apa: 'Oppenheimer, D. M. (2004). Spontaneous discounting of availability in frequency judgment tasks. <em>Psychological Science, 15</em>(2), 100–105.', doi: '10.1111/j.0963-7214.2004.01502005.x', openalex: 'W2102827992', year: 2004, foundational: true },
  metcalfefinn2008: { apa: 'Metcalfe, J., & Finn, B. (2008). Evidence that judgments of learning are causally related to study choice. <em>Psychonomic Bulletin & Review, 15</em>(1), 174–179.', doi: '10.3758/PBR.15.1.174', openalex: 'W2156525945', year: 2008, foundational: true },
  kirkjohnson2019: { apa: 'Kirk-Johnson, A., Galla, B. M., & Fraundorf, S. H. (2019). Perceiving effort as poor learning: The misinterpreted-effort hypothesis of how experienced effort and perceived learning relate to study strategy choice. <em>Cognitive Psychology, 115</em>, 101237.', doi: '10.1016/j.cogpsych.2019.101237', openalex: 'W2970939575', year: 2019 },
  kna2014: { apa: 'Koriat, A., Nussinson, R., & Ackerman, R. (2014). Judgments of learning depend on how learners interpret study effort. <em>Journal of Experimental Psychology: Learning, Memory, and Cognition, 40</em>(6), 1624–1637.', doi: '10.1037/xlm0000009', openalex: 'W2096473415', year: 2014 },
  kornellbjork2008: { apa: 'Kornell, N., & Bjork, R. A. (2008). Learning concepts and categories: Is spacing the “enemy of induction”? <em>Psychological Science, 19</em>(6), 585–592.', doi: '10.1111/j.1467-9280.2008.02127.x', openalex: 'W2166200712', year: 2008 },
  koriatbjork2005: { apa: 'Koriat, A., & Bjork, R. A. (2005). Illusions of competence in monitoring one’s knowledge during study. <em>Journal of Experimental Psychology: Learning, Memory, and Cognition, 31</em>(2), 187–194.', doi: '10.1037/0278-7393.31.2.187', openalex: 'W2056938988', year: 2005 },
  finnmetcalfe2008: { apa: 'Finn, B., & Metcalfe, J. (2008). Judgments of learning are influenced by memory for past test. <em>Journal of Memory and Language, 58</em>(1), 19–34.', doi: '10.1016/j.jml.2007.03.006', openalex: 'W2128802273', year: 2008 }
};

const PSYC_ISSUES = [
  // ------------------------------------------------------------------ 001
  {
    id: 'cues', no: '001', theme: 'cue utilization and monitoring accuracy', featured: 'jaeger2023',
    title: 'when pictures mislead the monitor',
    kicker: 'four studies on instructional visuals, three kinds of judgment, and the cues students say they use',
    status: 'verified digest', verifiedOn: '2026-11-08',
    verification: 'Read in full on the publisher’s site (version of record, CC BY 4.0): introduction, all four studies’ methods and results, general discussion, limitations, reference list. Statistics below are copied from the text; figure-only values are not reported.',
    tags: { topic: ['metacomprehension', 'cue utilization', 'judgments of learning', 'calibration and resolution'], framework: ['cue-utilization approach'], method: ['between-subjects experiment', 'intra-individual correlations (Pearson, gamma)', 'coded self-reported cues'], authors: ['Jaeger', 'Fiorella'] },
    sources: {
      jf: { bib: 'jaeger2023', type: 'featured article' },
      koriat: { bib: 'koriat1997', type: 'foundational article (read in full)' }
    },
    question: [
      { text: 'Instructional visuals are meant to support comprehension of science text, but their effect on <em>metacomprehension</em> — how well students judge their own understanding — is less clear. Jaeger and Fiorella start from prior work suggesting that many students do not glean valid cues from provided visuals, which would lower monitoring accuracy [[jf|abstract; introduction]].' },
      { text: 'Their second question is about the judgment prompt itself. Standard metacomprehension studies ask for test-performance predictions; the authors argue that prompts to judge one’s ability to <em>explain</em> or <em>draw</em> the material might draw on different cues, and that drawing judgments in particular — not previously studied — might lean on provided images. If students read surface features of an image as evidence of understanding, drawing judgments should be <em>less</em> accurate when visuals are present [[jf|“Types of JOLs”; “The Present Studies”]].' }
    ],
    study: {
      intro: 'Undergraduates read 4 expository texts (biology in Studies 1a–b, chemistry in 2–3), made judgments after each text, then took comprehension tests. Image presence was manipulated between subjects; the images were conceptual and redundant with the text by design, so that comprehension would not differ [[jf|Study 1a, Images]].',
      table: {
        head: ['study', 'final N (image / text-only)', 'setting', 'judgments', 'criterion and extras'],
        rows: [
          ['1a', '163 (92 / 71)', 'online; 35% excluded, incl. 54 who took < 20 min', 'explain, test, draw (1–10 or 0–5, rescaled to proportions)', '8-item multiple-choice inference test per text'],
          ['1b', '47 (22 / 25)', 'online', 'explain, test, draw', 'no comprehension test; open-ended cue reports coded representation-based vs heuristic (Krippendorff’s α .82–.91)'],
          ['2', '48 (22 / 26)', 'collected as in-person testing resumed, with limited recruitment; excluded students with ≥ 2 college chemistry courses', 'explain, test, draw', '7-item inference tests + cue reports in one design'],
          ['3', '115 (60 / 55)', 'laboratory; a priori power analysis (N = 125 for a medium effect in ANCOVA)', 'test and draw only, order counterbalanced', 'inference tests + a drawing test matched to the draw judgment']
        ],
        cite: '[[jf|Methods of Studies 1a, 1b, 2, 3]]'
      },
      notes: [
        '<strong>relative accuracy</strong> was the intra-individual Pearson correlation (and Goodman–Kruskal gamma) between each judgment type and test performance across a student’s four texts; <strong>absolute accuracy</strong> was |judgment − performance|, lower = better [[jf|Study 1a, Results]].',
        'in Studies 1a and 2, draw judgments were scored against the multiple-choice inference test; only Study 3 added a drawing test, to match criterion to judgment [[jf|Study 3, introduction]].'
      ]
    },
    found: [
      { text: '<strong>Comprehension was unaffected by images</strong> (Study 1a: <em>t</em>(161) = 0.07, <em>p</em> = .95, <em>d</em> = 0.01) — the multimedia effect did not appear, which the authors attribute to redundant images that students may not process actively [[jf|Study 1a, Results; Discussion]].' },
      { text: '<strong>Study 1a:</strong> images lowered relative accuracy for <em>draw</em> judgments (Pearson: <em>t</em>(147) = 3.10, <em>p</em> = .002, <em>d</em> = 0.51; gamma: <em>t</em>(147) = 3.02, <em>p</em> = .003, <em>d</em> = 0.50), not for test judgments (<em>t</em>(139) = 1.59, <em>p</em> = .12); explain was marginal (<em>t</em>(156) = 1.87, <em>p</em> = .06). Absolute accuracy did not differ (all <em>t</em>s &lt; 1) [[jf|Study 1a, Relative and Absolute Accuracy]].' },
      { text: '<strong>Study 1b (cue reports):</strong> for draw judgments, the image group more often reported heuristic cues (prior knowledge, interest, beliefs) and the text-only group representation-based cues, χ²(1) = 7.57, <em>p</em> = .006. About 38% mentioned visual cues for drawing judgments; with images these were memories of the provided image (7 of 9), without images, the ability to form a mental image (8 of 9) [[jf|Study 1b, Results]].', flag: 'reported as χ²(1) = 68.10 for those 18 responses — a value that cannot occur with N = 18 (χ² with 1 df cannot exceed N), so likely a typographical error in the article.' },
      { text: '<strong>Study 2 (chemistry, all measures together):</strong> the draw-accuracy effect was only marginal (Pearson <em>t</em>(45) = 1.93, <em>p</em> = .06, <em>d</em> = 0.56), but images now worsened <em>absolute</em> draw accuracy (<em>t</em>(46) = 2.14, <em>p</em> &lt; .04, <em>d</em> = 0.61). Reported cue type no longer differed by condition (χ²(1) = 0.02, <em>p</em> = .90); students reporting representation-based cues had higher draw relative accuracy (main effect <em>F</em>(1, 43) = 5.42, <em>p</em> = .025, η<sub>p</sub>² = .07; interaction <em>F</em> &lt; 1) [[jf|Study 2, Results]].' },
      { text: '<strong>Study 3 (larger, in lab, matched drawing test):</strong> images lowered relative accuracy for <em>test</em> judgments (<em>F</em>(1, 102) = 5.73, <em>p</em> = .019, η<sub>p</sub>² = .05) but did not affect draw relative accuracy (<em>F</em>(1, 111) = 1.65, <em>p</em> = .20). Cue type interacted with image condition (<em>F</em>(1, 100) = 4.73, <em>p</em> = .03): without images, representation-based reporters monitored better (<em>t</em>(50) = 3.30, <em>p</em> = .002, <em>d</em> = 0.95); with images, cue type made no difference (<em>t</em>(51) = 0.135, <em>p</em> = .89) [[jf|Study 3, Results]].' },
      { kind: 'authors’ interpretation', text: 'The authors summarise that visuals harmed relative metacomprehension accuracy across studies, while acknowledging that <em>which</em> judgment showed it varied, and that the draw effect from Studies 1a and 2 did not replicate in Study 3 (draw relative accuracy there: about .22 text-only vs .08 with images, versus .20–.30 vs −.15 to .02 earlier). They propose that images may produce a false sense of fluency that students misattribute to comprehension — a hypothesis these studies did not directly test [[jf|General Discussion; Limitations]].' }
    ],
    matters: [
      { text: 'The paper explicitly frames poor monitoring as the use of inappropriate cues, citing Koriat’s (1997) cue-utilization approach, and distinguishes representation-based cues (experience of trying to understand the text) from heuristic cues (beliefs, interest, familiarity, surface features) [[jf|Study 1a, Discussion]]. Its new contribution is to show that both a feature of the materials (images) and the wording of the judgment can change which cues inform the judgment — and that a cue report predicting accuracy in one condition (text-only) can stop predicting it in another (with images).' },
      { text: 'What remains unresolved is the mechanism. The authors themselves note three gaps: self-reports may not capture the cues people actually use (especially visual ones); making several judgments per text may change each judgment’s sensitivity; and the visuals did not follow multimedia design principles (contiguity, coherence), so better-designed images could behave differently [[jf|Limitations and Future Directions]]. The within-paper pattern is a partial replication, not a robust one; I did not verify independent replications.' }
    ],
    questions: [
      {
        q: 'In Study 3, students who reported representation-based cues monitored their test performance more accurately — but only in the text-only condition. What does the design permit you to conclude?',
        options: [
          'Basing judgments on representation-based cues causes more accurate monitoring when there are no images.',
          'The association between reported cue type and monitoring accuracy depended on image condition; because cue type was measured rather than manipulated, the causal direction is not established.',
          'Images reduced how often students used representation-based cues, which lowered accuracy.',
          'Images lowered comprehension, and lower comprehension explains the lower monitoring accuracy.'
        ],
        answer: 1,
        explain: 'Cue type was coded from open-ended reports after the fact, so the cue-type effects are correlational; only image condition was randomly assigned [[jf|Study 3, Method and Results]]. Option 3 fails because reported cue frequencies did not differ by condition in Studies 2 and 3 [[jf|Studies 2–3, Self-Reported Cue Use]]; option 4 fails because image presence did not affect comprehension [[jf|Study 1a, Results]].'
      },
      {
        q: 'The authors weigh two accounts of why images hurt monitoring: images make heuristic cues more salient, or images create a misattributed sense of fluency. Which observed pattern speaks against the pure salience account?',
        options: [
          'Image-condition students gave higher draw judgments than text-only students in Study 1a.',
          'Images lowered absolute accuracy for draw judgments in Study 2.',
          'Image-condition students reported representation-based cues about as often as text-only students (Studies 2–3), yet those reports no longer predicted accuracy.',
          'Students mentioned visual cues mainly for drawing judgments.'
        ],
        answer: 2,
        explain: 'The authors reason that if images simply made heuristic cues more salient, heuristic reports should rise in image conditions — which happened only in Study 1b. Instead, representation-based reports were as frequent but uncoupled from accuracy, which they suggest fits misattributed fluency (students may report comprehension-based cues while responding to a feeling of fluency) [[jf|General Discussion]]. Judgment magnitude and absolute error do not discriminate the two accounts.'
      },
      {
        q: 'Why did Study 3 add a drawing test?',
        options: [
          'Because in Studies 1a and 2, draw-judgment accuracy was computed against a multiple-choice inference test, mixing a judgment about drawing with a criterion that measures something else.',
          'To check whether drawing during study improves comprehension.',
          'Because the inference tests in Studies 1a and 2 were unreliable.',
          'To replace the explain judgment.'
        ],
        answer: 0,
        explain: 'The authors note that the earlier draw-accuracy scores used inference-test performance, and that drawing and inference tests may tap different knowledge (structure and spatial relations versus function), so Study 3 matched criterion to judgment [[jf|Study 3, introduction]]. Students did not draw during study, and the explain judgment was dropped because no explanation test was included — not as a replacement [[jf|Study 3, Judgments]].'
      }
    ],
    connection: {
      relation: 'foundational theoretical precursor — explicitly cited',
      bib: 'koriat1997',
      text: 'Koriat (1997) proposed that judgments of learning are inferential, based on <strong>intrinsic</strong> cues (item properties), <strong>extrinsic</strong> cues (study conditions, e.g., repetitions) and <strong>mnemonic</strong> cues (internal experiences such as ease of processing), rather than direct readouts of trace strength [[koriat|pp. 349–351]]. Across four paired-associate experiments, item difficulty affected JOLs about as much as recall, whereas extrinsic factors were discounted: in Experiment 1 a second study presentation raised recall by 30% but JOLs by only 16% [[koriat|Exp. 1, p. 354]], and presentation duration (2–8 s) raised recall by 10% but JOLs by 4% [[koriat|Exp. 4, p. 362]]. Practice impaired calibration (growing underconfidence) while improving resolution — in Experiment 2 the JOL–recall gamma rose from .66 to .89 over four presentations [[koriat|Exp. 2, p. 358]] — which Koriat attributed to a shift from intrinsic toward mnemonic cues. A telling analysis: another participant’s JOLs predicted a learner’s recall about equally well across presentations (.63, .59, .62, .58), while the learner’s own JOLs improved [[koriat|Exp. 2, p. 359]]. Jaeger and Fiorella cite this framework for the claim that poor monitoring reflects inappropriate cues; their “representation-based” vs “heuristic” distinction comes from the metacomprehension literature rather than mapping one-to-one onto Koriat’s three classes.'
    },
    keep: [
      { id: 'cues-paper', kind: 'paper', text: 'Jaeger & Fiorella (2024): instructional visuals harmed relative metacomprehension accuracy, but which judgment type showed the harm varied across four studies.', cite: ['jf'] },
      { id: 'cues-finding', kind: 'finding', text: 'Study 3: representation-based cue reports predicted better test-judgment accuracy without images (d = 0.95) but not with images (d = 0.04).', cite: ['jf'] },
      { id: 'cues-method', kind: 'methodological insight', text: 'Match the criterion to the judgment: draw judgments scored against a multiple-choice test confound judgment type with criterion type.', cite: ['jf'] },
      { id: 'cues-distinction', kind: 'theoretical distinction', text: 'Koriat (1997): intrinsic, extrinsic and mnemonic cues for JOLs; extrinsic factors (repetition, study time) are discounted relative to their effect on recall.', cite: ['koriat'] },
      { id: 'cues-connection', kind: 'connection', text: 'Koriat (1997) → Jaeger & Fiorella (2024): cue utilization as the explanation for poor monitoring; images and prompt wording change which cues are used.', cite: ['koriat', 'jf'] }
    ]
  },

  // ------------------------------------------------------------------ 002
  {
    id: 'effort', no: '002', theme: 'interpreting cognitive experience', featured: 'onan2022',
    title: 'when effort feels like failing',
    kicker: 'a preregistered study of how students read their own effort — and why a mirror of their experiences didn’t change their minds',
    status: 'verified digest', verifiedOn: '2026-11-08',
    verification: 'Read in full on the publisher’s site (version of record, CC BY 4.0): introduction, method, quantitative and qualitative results, discussion, limitations, reference list.',
    tags: { topic: ['effort as a metacognitive cue', 'interleaved practice', 'strategy choice', 'self-regulated learning'], framework: ['misinterpreted-effort hypothesis', 'cue utilization'], method: ['preregistered mixed-methods experiment', 'linear mixed models', 'mediation', 'template analysis'], authors: ['Onan', 'Wiradhany', 'Biwer', 'Janssen', 'de Bruin'] },
    sources: {
      onan: { bib: 'onan2022', type: 'featured article' },
      opp: { bib: 'oppenheimer2004', type: 'foundational article (read in full)' },
      kj: { bib: 'kirkjohnson2019', type: 'precursor (as summarised by Onan et al.; not read in full)' },
      kna: { bib: 'kna2014', type: 'related article (cited by Onan et al.; not read in full)' }
    },
    question: [
      { text: 'Interleaved practice usually beats blocked practice for learning categories, yet most students judge blocking more effective. Onan and colleagues build on the <strong>misinterpreted-effort hypothesis</strong> (Kirk-Johnson et al., 2019): interleaving feels more effortful, and students read that effort as poor learning [[onan|“Strategy Decisions in Category Learning”]].' },
      { text: 'Their open question is temporal: how do felt effort and perceived learning change as students keep using each strategy, and do those changes drive later choices? They also test an intervention — a <strong>visual feedback prompt (VFP)</strong> that plots students’ own effort and learning ratings over time and asks them to reflect — hypothesising it would increase choice of interleaving if experiences shifted in the expected direction [[onan|“The Present Study”, RQ1–3]].' }
    ],
    study: {
      intro: 'A preregistered (osf.io/u6es8) 2 (strategy: blocked vs interleaved, within) × 2 (VFP vs control, between) mixed design [[onan|Method, Open Science Practices; Design]].',
      table: {
        head: ['element', 'details'],
        rows: [
          ['participants', '150 undergraduates via Prolific (77 female; M age 22.6); power analysis required ≥ 76, more were collected for the structural models'],
          ['materials', 'phase I: paintings by 12 artists (the Kornell & Bjork, 2008, set) in a fixed B-I-I-B-B-I-I-B-B-I-I-B unit sequence, artist-to-unit assignment counterbalanced; phase II: 6 new artists (Painting-91)'],
          ['ratings after each unit', 'perceived effort (adapted Paas 9-point item); perceived learning (“how likely … to recognize the paintings”, 9-point)'],
          ['strategy choices', 'habitual strategy (before phase I); hypothetical preference (after phase I); actual choice for the new artists (after the VFP or control)'],
          ['outcomes', 'classification tests I (24 items) and II (18 items); efficacy beliefs (6-point) pre and post'],
          ['analysis', 'linear mixed models (lme4); mediation using each participant’s slopes of effort and learning over units; template analysis of open responses']
        ],
        cite: '[[onan|Method]]'
      },
      notes: ['online, single ~45-minute session, no stakes attached to choices [[onan|Procedure; Limitations]].']
    },
    found: [
      { text: '<strong>Interleaving effect replicated:</strong> Test I classification was better for interleaved (M = 5.95) than blocked artists (M = 3.11), <em>t</em>(149) = 9.35, <em>p</em> &lt; .001, <em>d</em> = 0.76 [[onan|Results, Classification Performance]].' },
      { text: '<strong>Experiences diverged, then converged:</strong> effort was higher for interleaving (<em>F</em>(1, 289) = 380.39) and perceived learning higher for blocking (<em>F</em>(1, 332) = 495.16), but strategy × time interactions showed effort <em>falling</em> (<em>F</em>(1, 1498) = 135.22) and perceived learning <em>rising</em> (<em>F</em>(1, 1498) = 260.81) over units for interleaving only; all <em>p</em>s &lt; .001 [[onan|Results, Study Experiences]]. Overall, effort and perceived learning were negatively related, <em>B</em> = −0.60, <em>SE</em> = 0.02 [[onan|Global Associations]].' },
      { text: '<strong>Mediation (interleaving model):</strong> steeper declines in effort predicted choosing interleaving (total <em>B</em> = −3.64, 95% CI [−5.72, −1.74]); the indirect path through rising perceived learning was −4.84, 95% CI [−8.08, −3.03], and the direct path vanished (<em>B</em> = 0.35, 95% CI [−2.15, 2.89]). For choosing blocking, neither path was reliable [[onan|Strategy Decisions Across Time]].' },
      { text: '<strong>Choices shifted, but the VFP did not help:</strong> interleaving rose from 13% (habit) to 34% (after phase I) to 40% (actual choice), Cochran’s <em>Q</em> χ²(2) = 43.53, <em>p</em> &lt; .001; the rise after phase I was reliable (McNemar χ²(1) = 18.48, <em>p</em> &lt; .001), the further rise after the VFP was not at the Bonferroni-corrected α of .016 (<em>p</em> = .022), and VFP and control groups did not differ, χ²(1) = 2.15, <em>p</em> = .142 [[onan|Strategy Decisions and the Impact of the VFP]].' },
      { text: '<strong>Beliefs polarised by choice:</strong> students who chose blocking came to rate interleaving <em>less</em> effective (3.59 → 2.80), while those who chose interleaving reversed their initial preference (interleaving 3.75 → 4.70; blocking 4.50 → 3.58) [[onan|Learning Strategy Belief Changes]]. Choosers of interleaving also scored higher on Test II (12.85 vs 10.04, <em>d</em> = 0.61) — a self-selected comparison [[onan|Classification Performance]].' },
      { kind: 'qualitative finding', text: 'Open responses showed two ways of reading effort: <em>misinterpretation</em> (“I think blocking is a more effective strategy as it takes less mental effort”) and <em>embracing</em> it as the price of learning, especially once the benefit of interleaving became noticeable later in the session [[onan|Qualitative Results, Effort Monitoring]].' }
    ],
    matters: [
      { text: 'The results fit the misinterpreted-effort account the authors build on (Kirk-Johnson et al., 2019) and the broader claim, cited by the authors, that judgments of learning depend on how learners interpret study effort (Koriat, Nussinson, & Ackerman, 2014) [[onan|introduction; reference list]] [[kj]] [[kna]]. The new contribution is temporal: the same strategy is experienced differently over a session, and it is the <em>change</em> in experience that tracks choice.' },
      { text: 'Limits the authors name: low-stakes, single-session choices; painting categories, where interleaving is known to be especially effective; possible demand effects from repeated choice questions; and no delayed transfer test [[onan|Limitations and Future Studies]]. Two further cautions: the mediation uses observed slopes, so “effort → perceived learning → choice” is a modelled ordering, not a manipulated one; and the null VFP result means showing students their own trajectories was not sufficient here.' }
    ],
    questions: [
      {
        q: 'What does the mediation result license?',
        options: [
          'Falling effort causes higher perceived learning, which in turn causes students to choose interleaving.',
          'Changes in perceived learning statistically accounted for the association between changes in effort and choosing interleaving; because neither experience was manipulated, the causal ordering is an assumption of the model.',
          'The visual feedback prompt worked by raising perceived learning.',
          'Effort plays no role in strategy choice once perceived learning is known.'
        ],
        answer: 1,
        explain: 'The predictors were each participant’s observed slopes of effort and perceived learning [[onan|Associations Between Perceived Effort, Perceived Learning, and Strategy Decisions]]; full mediation (direct <em>B</em> = 0.35, CI including 0) is a statistical decomposition, not evidence of causal order. The VFP did not change choices [[onan|Impact of the VFP]], and “no role” overreads a null direct path — effort’s association runs through perceived learning in the model.'
      },
      {
        q: 'Students who chose interleaving for the new artists scored higher on Test II (d = 0.61). What most limits reading this as an effect of the strategy?',
        options: [
          'Test II had fewer items than Test I.',
          'Students selected their own strategy, so anything that predicts both choosing interleaving and learning well (e.g., how well they learned in phase I) could produce the difference.',
          'The Painting-91 artists were easier than the phase I artists.',
          'Interleaving is known not to help with painting styles.'
        ],
        answer: 1,
        explain: 'Strategy in phase II was chosen, not assigned [[onan|Learning Strategy Decision; Classification Performance]], so the comparison is confounded by self-selection; the randomised, within-person interleaving effect is the phase I result (<em>d</em> = 0.76). Painting styles are, if anything, a domain where interleaving is especially effective [[onan|Limitations]].'
      },
      {
        q: 'Which finding most directly challenges the idea that showing students their own experience trajectories is enough to change strategy choices?',
        options: [
          'Perceived effort for interleaving decreased over units.',
          'Choices of interleaving rose after phase I.',
          'VFP and control groups chose interleaving at similar rates, and choices did not reliably increase after the prompt.',
          'Blocked-choosers rated interleaving less effective after the study.'
        ],
        answer: 2,
        explain: 'The VFP comparison is the manipulated test of that idea: χ²(1) = 2.15, <em>p</em> = .142, and no reliable increase after the prompt at the corrected α [[onan|Impact of the VFP]]. The authors note the VFP did raise students’ confidence in their choices, per the qualitative data [[onan|Discussion]].'
      }
    ],
    connection: {
      relation: 'conceptual parallel — not cited by Onan et al.; no claim of direct influence',
      bib: 'oppenheimer2004',
      text: 'Both papers show that a judgment depends on how people interpret a cognitive experience, not only on the experience itself. Oppenheimer (2004) found that people <em>discount</em> availability when a salient alternative cause is present. Stanford students judged famous surnames (e.g., Bush, Nixon) as more frequent than matched, actually rarer non-famous names only 33.7% of the time, χ²(1, N = 350) = 33.32, <em>p</em> &lt; .001 [[opp|Exp. 1, p. 102]]; they underestimated the frequency of their own surname (mean score 1.8 vs −0.2 for yoked controls) [[opp|Exp. 2, p. 103]]; and after writing their initials for a “numerology” item, they underestimated those letters’ frequency, while birthday-prompted controls overestimated theirs (115.2 vs −51.8) [[opp|Exp. 3, p. 104]]. Note that two degrees of freedom in Experiment 2 do not match the stated samples — <em>t</em>(79) for a one-sample test on 81 own-name scores, and <em>t</em>(58) for the comparison of 81 own-name with 60 yoked control responses — which the article does not explain [[opp|Exp. 2, p. 103]]. Read together: in Oppenheimer’s tasks an attribution leads people to <em>discount</em> a fluency-like cue; in Onan et al.’s students, effort is taken at face value as a sign of poor learning until experience suggests another interpretation.'
    },
    keep: [
      { id: 'effort-paper', kind: 'paper', text: 'Onan et al. (2022): over one session, interleaving’s effort fell and its perceived learning rose; changes in perceived learning mediated choosing interleaving; a visual feedback prompt did not change choices.', cite: ['onan'] },
      { id: 'effort-finding', kind: 'finding', text: 'Interleaving choices: 13% habit → 34% after experience → 40% actual; the visual feedback prompt added nothing reliable (χ²(1) = 2.15, p = .142).', cite: ['onan'] },
      { id: 'effort-method', kind: 'methodological insight', text: 'Mediation on observed experience slopes decomposes associations; it does not establish that effort changes cause perceived-learning changes.', cite: ['onan'] },
      { id: 'effort-distinction', kind: 'theoretical distinction', text: 'Misinterpreted effort (effort = poor learning) vs embraced effort (effort = the price of learning) as two interpretations of the same experience.', cite: ['onan', 'kj'] },
      { id: 'effort-connection', kind: 'connection', text: 'Oppenheimer (2004) ↔ Onan et al. (2022): judgments depend on the attributed meaning of a cognitive experience (a conceptual parallel, not a citation link).', cite: ['opp', 'onan'] }
    ]
  },

  // ------------------------------------------------------------------ 003
  {
    id: 'control', no: '003', theme: 'monitoring and the allocation of study time', featured: 'murphy2022',
    title: 'what you judge is what you study',
    kicker: 'self-paced study, children’s food allergies, and a judgment of importance that redirected control',
    status: 'verified digest', verifiedOn: '2026-11-08',
    verification: 'Read in full on the publisher’s site (version of record; free to read): introduction, Experiments 1a–2b, general discussion, reference list; correction notice noted. Statistics copied from the text.',
    tags: { topic: ['study-time allocation', 'metacognitive control', 'value-directed remembering', 'reactivity of judgments'], framework: ['agenda-based regulation', 'monitoring → control (Nelson & Narens)'], method: ['within- and between-subjects experiments', 'self-paced study', 'mixed ANOVA'], authors: ['Murphy', 'Hoover', 'Castel'] },
    sources: {
      mhc: { bib: 'murphy2022', type: 'featured article' },
      mf: { bib: 'metcalfefinn2008', type: 'foundational article (read in full)' },
      kb: { bib: 'koriatbjork2005', type: 'paradigm source (cited by Metcalfe & Finn; not read in full)' },
      fm: { bib: 'finnmetcalfe2008', type: 'paradigm source (cited by Metcalfe & Finn; not read in full)' }
    },
    question: [
      { text: '“Responsible remembering” is the idea that people prioritise information whose forgetting would have serious consequences. Earlier work showed that judging importance improves memory for important information; this paper asks <em>how</em> — through metacognitive control, specifically the allocation of self-paced study time [[mhc|introduction; “The current study”]].' },
      { text: 'Theoretical frame: monitoring informs control (Nelson & Narens, 1990), and in agenda-based regulation learners build goal-directed agendas from monitoring. The authors predicted that, left alone, people would follow screen order (“serial remembering”), but that experiencing forgetting, or judging importance, would redirect study toward a child’s allergies [[mhc|introduction; General discussion]].' }
    ],
    study: {
      intro: 'Participants imagined babysitting. Each of 24 children (6 lists × 4) came with 2 foods liked, 2 disliked and 2 they were allergic to; cued recall counted an item only if paired with the right child <em>and</em> category [[mhc|Exp. 1a, Procedure]].',
      table: {
        head: ['experiment', 'N', 'manipulation', 'what was self-paced'],
        rows: [
          ['1a', '27 (lab)', 'no judgments', '20 s per child; one category visible at a time'],
          ['1b', '28 (lab)', 'no judgments', '6 clicks × 5 s per child; one food visible at a time'],
          ['2a', '90 (online)', 'global JOLs (n = 45) or judgments of importance, JOIs (n = 45), per category before each list', 'as in 1a'],
          ['2b', '88 (online)', 'item-level JOLs (n = 44) or JOIs (n = 44) after each child', 'as in 1a']
        ],
        cite: '[[mhc|Methods, Exps. 1a–2b]]'
      },
      notes: ['sensitivity analyses rather than a priori power were reported (e.g., Exp. 1a could detect η<sub>p</sub>² ≥ .04); online exclusions were participants who admitted cheating [[mhc|Participants, Exps. 1a–2b]].']
    },
    found: [
      { text: '<strong>Without judgments, study followed screen position, not importance.</strong> Exp. 1a: likes were studied longest (7.01 s vs 5.46 dislikes, 5.52 allergies; <em>F</em>(2, 52) = 5.15, <em>p</em> = .009, η<sub>p</sub>² = .17) and recalled best (.34 vs .17 and .17; <em>F</em>(2, 52) = 24.22, <em>p</em> &lt; .001, η<sub>p</sub>² = .48), with no change over lists [[mhc|Exp. 1a, Results]]. In Exp. 1b, with one food visible at a time, study time was similar across categories (<em>F</em>(1.52, 40.98) = 1.35, <em>p</em> = .267), yet likes were still recalled best (.35 vs allergies .26, dislikes .17) [[mhc|Exp. 1b, Results]].' },
      { text: '<strong>Global JOIs redirected study time and memory.</strong> Exp. 2a: preference × judgment type for study time, <em>F</em>(1.43, 125.55) = 9.73, <em>p</em> &lt; .001, η<sub>p</sub>² = .11 — JOI participants studied allergies more than likes and dislikes and more than JOL participants did; across both groups, allergy study time grew over lists. Recall showed the same interaction (<em>F</em>(1.67, 146.88) = 15.27, η<sub>p</sub>² = .15): JOI participants recalled allergies better than other foods and better than JOL participants (<em>p</em><sub>holm</sub> = .001) [[mhc|Exp. 2a, Results]].' },
      { text: '<strong>JOLs helped a little, not as much.</strong> JOL participants studied and recalled allergies more than dislikes but not more than likes, and their JOLs declined across lists (JOI M = 68.78 vs JOL M = 27.17) [[mhc|Exp. 2a, Results]].', flag: 'the abstract says JOL participants “did not strategically study” the allergies; the results show partial prioritisation (allergies > dislikes). The digest follows the results.' },
      { text: '<strong>Item-level judgments (Exp. 2b):</strong> JOIs again shifted study time toward allergies (interaction <em>F</em>(1.26, 108.72) = 9.73, <em>p</em> = .001, η<sub>p</sub>² = .10; increasing across lists) and JOI participants recalled allergies better than other foods — but <em>not</em> better than JOL participants recalled allergies (<em>p</em><sub>holm</sub> &gt; .999) [[mhc|Exp. 2b, Results]].' }
    ],
    matters: [
      { text: 'The study extends the monitoring → control chain by showing that <em>what</em> is monitored matters: judging importance, not likelihood of remembering, updated learners’ agendas and moved study time [[mhc|General discussion]]. The authors cite Metcalfe and Finn (2008) among evidence that monitoring judgments inform control, and invoke Koriat’s (1997) cue-utilization framework to suggest that without JOIs learners rely on extrinsic cues such as screen position rather than importance [[mhc|introduction; General discussion]] — an interpretation, not something the design isolates.' },
      { text: 'Open questions the authors raise: whether the benefit is reactivity via strengthened cues or richer encoding (the experiments do not discriminate), and whether hypothetical stakes with young adults generalise to real caregiving [[mhc|General discussion]]. A design point: food category was confounded with screen position (likes listed first); the authors rely on earlier work in which counterbalancing moved the advantage to whichever category came first [[mhc|Exp. 1a, Discussion]].' }
    ],
    questions: [
      {
        q: 'Which result shows most directly that judging importance changed metacognitive <em>control</em>, rather than only memory?',
        options: [
          'JOI participants recalled allergies better than likes and dislikes.',
          'JOI participants allocated more self-paced study time to allergies, increasingly across lists.',
          'JOIs were higher than JOLs overall.',
          'Recall improved across lists in Exp. 1b.'
        ],
        answer: 1,
        explain: 'Control is operationalised as the learner’s allocation of self-paced study time; the judgment × preference interaction on study time (Exps. 2a and 2b) is the control effect [[mhc|Exps. 2a–2b, Results]]. Recall differences could arise from encoding effects of the judgment itself (the authors discuss richness-of-encoding and cue-strengthening accounts) [[mhc|General discussion]].'
      },
      {
        q: 'Which claim goes beyond the evidence from Exp. 2b?',
        options: [
          'Item-level JOIs led participants to spend more time studying allergies than item-level JOLs did.',
          'With item-level JOIs, allergies were recalled better than likes and dislikes.',
          'Item-level JOIs improved memory for allergies relative to item-level JOLs.',
          'Allergy study time increased across lists for JOI participants.'
        ],
        answer: 2,
        explain: 'In Exp. 2b, JOI and JOL participants recalled allergies similarly (<em>p</em><sub>holm</sub> &gt; .999), unlike Exp. 2a [[mhc|Exp. 2b, Results]]. The other three statements match the reported study-time and within-group recall effects.'
      },
      {
        q: 'Why can Exp. 1 alone not separate “participants thought likes mattered most” from serial remembering?',
        options: [
          'Because study time was self-paced.',
          'Because category was confounded with screen position — likes were always listed first — so a first-position advantage and a preference for likes predict the same pattern.',
          'Because recall was scored leniently.',
          'Because there were too few lists.'
        ],
        answer: 1,
        explain: 'The authors attribute the likes advantage to serial remembering and point to earlier work in which counterbalancing category order moved the advantage to whichever category came first, and in which allergies were rated most important [[mhc|Exp. 1a, Discussion]]. Within this paper, position and category are not separable.'
      }
    ],
    connection: {
      relation: 'foundational causal test of monitoring → control — cited by Murphy et al.',
      bib: 'metcalfefinn2008',
      text: 'Metcalfe and Finn (2008) asked whether JOLs actually drive study choice or are epiphenomenal, by dissociating JOLs from memory [[mf|p. 174]]. In Experiment 1 (N = 22), pairs studied 1 then 3 times versus 3 then 1 time reached equal Trial 2 recall (.72 vs .69, <em>t</em> &lt; 1), but immediate JOLs were lower for 1–3 pairs (.70 vs .78), and people chose to restudy more of them (.51 vs .38, <em>t</em>(21) = 4.33, <em>p</em> &lt; .001) [[mf|Exp. 1, p. 175]]. In Experiment 2 (N = 50), delayed JOLs removed the JOL difference (.60 vs .61) — and the choice difference with it (.43 vs .44), whereas immediate JOLs reproduced both [[mf|Exp. 2, p. 177]]. Experiment 3 (N = 24) used Koriat and Bjork’s (2005) forward/backward pairs: recall differed sharply, JOLs and choices did not (measure × direction interaction for recall vs choice <em>F</em>(1, 23) = 23.64; none for JOL vs choice, <em>F</em> &lt; 1) [[mf|Exp. 3, p. 178]]. Murphy et al. cite this paper among the evidence that monitoring informs control; their contribution is to vary the <em>kind</em> of judgment (importance vs likelihood) rather than to bias a single judgment type.'
    },
    keep: [
      { id: 'control-paper', kind: 'paper', text: 'Murphy, Hoover & Castel (2023): judgments of importance, but not of learning, redirected self-paced study time toward children’s allergies.', cite: ['mhc'] },
      { id: 'control-finding', kind: 'finding', text: 'Exp. 2b: item-level JOIs increased study of allergies, but allergy recall did not exceed the JOL group’s (p_holm > .999).', cite: ['mhc'] },
      { id: 'control-method', kind: 'methodological insight', text: 'Measure control directly (self-paced study time) to separate effects of a judgment on control from its effects on encoding.', cite: ['mhc'] },
      { id: 'control-distinction', kind: 'theoretical distinction', text: 'Metcalfe & Finn (2008): biasing JOLs while holding memory constant shows JOLs causally drive study choice.', cite: ['mf'] },
      { id: 'control-connection', kind: 'connection', text: 'Metcalfe & Finn (2008) → Murphy et al. (2023): from “JOLs drive choice” to “which judgment you make changes what you choose to study”.', cite: ['mf', 'mhc'] }
    ]
  }
];

/* Quiet Time — data garden lessons, units 2–9. Loaded after garden-lessons.js and adds to its lists.
   Original lessons; unit order follows MIT OpenCourseWare (linked as "go deeper"). */
Object.assign(OCW, {
  t907: { label: '9.07 · hypothesis testing summary', url: 'https://ocw.mit.edu/courses/9-07-statistics-for-brain-and-cognitive-science-fall-2016/resources/mit9_07f16_hypothesistest/' },
  a907: { label: '9.07 · analysis of variance', url: 'https://ocw.mit.edu/courses/9-07-statistics-for-brain-and-cognitive-science-fall-2016/resources/mit9_07f16_lec14/' },
  c963: { label: '9.63 · laboratory in visual cognition (design)', url: 'https://ocw.mit.edu/courses/9-63-laboratory-in-visual-cognition-fall-2009/' },
  r15071: { label: '15.071 · linear regression', url: 'https://ocw.mit.edu/courses/15-071-the-analytics-edge-spring-2017/pages/linear-regression/' },
  l15071: { label: '15.071 · logistic regression', url: 'https://ocw.mit.edu/courses/15-071-the-analytics-edge-spring-2017/pages/logistic-regression/' },
  reg18650: { label: '18.650 · regression', url: 'https://ocw.mit.edu/courses/18-650-statistics-for-applications-fall-2016/resources/lecture-7-regression/' },
  pca18650: { label: '18.650 · principal component analysis', url: 'https://ocw.mit.edu/courses/18-650-statistics-for-applications-fall-2016/resources/lecture-9-principal-component-analysis-pca/' }
});

Object.assign(GARDEN_DATA, {
  manylabs: {
    short: 'Many Labs 1', license: 'CC0', url: 'https://osf.io/wx7ck/',
    cite: 'Klein, R. A., et al. (2014). Investigating variation in replicability: A “Many Labs” replication project. <em>Social Psychology, 45</em>(3), 142–152. Data: Journal of Open Psychology Data, doi:10.5334/jopd.ad. (Subset: anchoring 1, sunk cost and gain/loss framing, with site and demographics.)'
  },
  amatus: {
    short: 'AMATUS', license: 'CC BY 4.0', url: 'https://osf.io/gszpb/',
    cite: 'The AMATUS dataset: Arithmetic performance, mathematics anxiety and attitudes in primary school teachers and university students. <em>Journal of Open Psychology Data, 12</em>(1), doi:10.5334/jopd.115. Data on OSF (osf.io/gszpb). (Subset: group, sex, age range, scale scores and arithmetic performance.)'
  },
  allison: {
    short: 'Allison et al. 2012', license: 'figures quoted from the abstract', url: 'https://pubmed.ncbi.nlm.nih.gov/22265366/',
    cite: 'Allison, C., Auyeung, B., & Baron-Cohen, S. (2012). Toward brief “red flags” for autism screening. <em>Journal of the American Academy of Child & Adolescent Psychiatry, 51</em>(2), 202–212. (AQ-10 adult at a cut-point of 6: sensitivity 0.88, specificity 0.91, PPV 0.85; 449 autistic adults and 838 controls.)'
  },
  ashwood: {
    short: 'Ashwood et al. 2016', license: 'figures quoted from the abstract', url: 'https://pubmed.ncbi.nlm.nih.gov/27353452/',
    cite: 'Ashwood, K. L., et al. (2016). Predicting the diagnosis of autism in adults using the Autism-Spectrum Quotient (AQ) questionnaire. <em>Psychological Medicine, 46</em>(12), 2595–2604. (Full AQ in 476 adults referred to a diagnostic service: 73% diagnosed; sensitivity 0.77, specificity 0.29, PPV 0.76.)'
  },
  brugha: {
    short: 'Brugha et al. 2011', license: 'figure quoted from the abstract', url: 'https://pubmed.ncbi.nlm.nih.gov/21536975/',
    cite: 'Brugha, T. S., et al. (2011). Epidemiology of autism spectrum disorders in adults in the community in England. <em>Archives of General Psychiatry, 68</em>(5), 459–465. (Weighted prevalence 9.8 per 1,000 adults, 95% CI 3.0–16.5.)'
  }
});

const isGG = v => `(inherits(${v}, "ggplot") || inherits(${v}, "ggplot2::ggplot"))`;

GARDEN_LESSONS.push(
  // ---------------- unit 2 · chance ----------------
  {
    id: 'u2-bayes', unit: 2, plant: 'tulip', title: 'a positive screen',
    question: 'if an adult screens positive on the AQ-10, how likely is it that they are autistic?',
    data: [], cite: ['allison', 'brugha'], deeper: [OCW.c1805, OCW.c907],
    steps: [
      { text: `<p>three published numbers. Allison et al. (2012) report that at a cut-off of 6, the adult AQ-10 caught <strong>88%</strong> of autistic adults (sensitivity) and correctly cleared <strong>91%</strong> of non-autistic adults (specificity). Brugha et al. (2011) estimated that about <strong>9.8 in 1,000</strong> adults in England are autistic (the base rate, or prevalence).</p><p>store them. fill in the specificity.</p>`,
        code: `prevalence <- 9.8 / 1000\nsensitivity <- 0.88\nspecificity <- ___`, solution: `prevalence <- 9.8 / 1000\nsensitivity <- 0.88\nspecificity <- 0.91`, check: `isTRUE(all.equal(specificity, 0.91)) && isTRUE(all.equal(prevalence, 0.0098))`, hint: 'specificity is 0.91' },
      { text: `<p>the clearest way to think about this is <strong>natural frequencies</strong>: imagine 10,000 adults. how many are autistic, how many of those screen positive (true positives), and how many non-autistic people screen positive anyway (false positives)?</p>`,
        code: `n <- 10000\nautistic <- n * prevalence\nnot_autistic <- n - autistic\ntrue_pos <- autistic * sensitivity\nfalse_pos <- not_autistic * (1 - ___)\nc(autistic = autistic, true_pos = true_pos, false_pos = false_pos)`, solution: `n <- 10000\nautistic <- n * prevalence\nnot_autistic <- n - autistic\ntrue_pos <- autistic * sensitivity\nfalse_pos <- not_autistic * (1 - specificity)\nc(autistic = autistic, true_pos = true_pos, false_pos = false_pos)`, check: `isTRUE(all.equal(false_pos, (10000 - 98) * 0.09))`, hint: 'false positives come from 1 − specificity', success: 'about 86 true positives — and about 891 false positives.' },
      { text: `<p>the <strong>positive predictive value</strong> (PPV) is the share of positive screens that are real: true positives over all positives. this is Bayes' theorem, counted out by hand.</p>`,
        code: `ppv <- true_pos / (true_pos + ___)\nppv`, solution: `ppv <- true_pos / (true_pos + false_pos)\nppv`, check: `isTRUE(all.equal(ppv, 86.24 / (86.24 + 891.18)))`, hint: 'add the false positives', success: 'under 9%. in the general population, most positive screens would be false alarms.' },
      { text: `<p>but Allison et al. report a PPV of <strong>0.85</strong>. same test — so why so different? their study had 449 autistic adults and 838 controls, so the "base rate" inside the study was far higher than in the population. recompute the PPV using the study's own base rate.</p>`,
        code: `study_prev <- 449 / (449 + 838)\nppv_study <- (study_prev * sensitivity) /\n  (study_prev * sensitivity + (1 - study_prev) * (1 - specificity))\nppv_study`, check: `isTRUE(all.equal(ppv_study, (449/1287 * 0.88) / (449/1287 * 0.88 + 838/1287 * 0.09)))`, success: 'about 0.84 — close to the published 0.85. the test did not change; the base rate did.' },
      { text: `<p><strong>reading this like a researcher.</strong> sensitivity and specificity describe the test; PPV depends on who is being tested. that is why Allison et al. frame the AQ-10 as a "red flag" to support referral decisions, not a diagnosis — and why the setting where a screener is used matters so much. the next seed shows what happens in a specialist clinic.</p>` }
    ],
    note: 'explain to a friend why a positive AQ-10 screen means something different in the general population than in a research study.'
  },
  {
    id: 'u2-sim', unit: 2, plant: 'clover', title: 'simulating screening',
    question: 'can we check Bayes’ theorem by simulating thousands of people — and what happens in a specialist clinic?',
    data: [], cite: ['allison', 'brugha', 'ashwood'], deeper: [OCW.s1805, OCW.c1805],
    steps: [
      { text: `<p><code>rbinom()</code> flips weighted coins: <code>rbinom(10, size = 1, prob = 0.5)</code> gives ten 0/1 results with a 50% chance of 1. <code>set.seed()</code> makes the random numbers repeatable.</p>`,
        code: `set.seed(1)\nflips <- rbinom(10, size = 1, prob = 0.5)\nflips`, check: `length(flips) == 10 && all(flips %in% c(0, 1))` },
      { text: `<p>simulate 100,000 adults: each is autistic with probability 0.0098; autistic people screen positive with probability 0.88, others with probability 1 − 0.91.</p>`,
        code: `set.seed(2)\nn <- 100000\nautistic <- rbinom(n, 1, 0.0098)\nscreen_pos <- ifelse(autistic == 1, rbinom(n, 1, 0.88), rbinom(n, 1, 1 - ___))\ntable(autistic, screen_pos)`, solution: `set.seed(2)\nn <- 100000\nautistic <- rbinom(n, 1, 0.0098)\nscreen_pos <- ifelse(autistic == 1, rbinom(n, 1, 0.88), rbinom(n, 1, 1 - 0.91))\ntable(autistic, screen_pos)`, check: `length(screen_pos) == 100000 && abs(mean(screen_pos[autistic == 0]) - 0.09) < 0.01`, hint: 'specificity is 0.91' },
      { text: `<p>among the simulated people who screened positive, what share are autistic?</p>`,
        code: `sim_ppv <- mean(autistic[screen_pos == ___])\nsim_ppv`, solution: `sim_ppv <- mean(autistic[screen_pos == 1])\nsim_ppv`, check: `isTRUE(all.equal(sim_ppv, mean(autistic[screen_pos == 1]))) && sim_ppv < 0.15`, hint: 'positive screens are coded 1', success: 'the simulation lands near the 8–9% you calculated by hand.' },
      { text: `<p>write a <strong>function</strong> so you can try any setting. functions take inputs and return the last value they compute.</p>`,
        code: `ppv_at <- function(prev, sens, spec) {\n  (prev * sens) / (prev * sens + (1 - prev) * (1 - spec))\n}\nppv_at(0.0098, 0.88, 0.91)`, check: `exists("ppv_at") && abs(ppv_at(0.0098, 0.88, 0.91) - 0.0882) < 0.001` },
      { text: `<p>Ashwood et al. (2016) studied 476 adults referred to a specialist service: <strong>73%</strong> were diagnosed autistic. there, the (full-length) AQ had sensitivity 0.77 and specificity only 0.29. what PPV does the formula predict?</p>`,
        code: `clinic_ppv <- ppv_at(___, 0.77, 0.29)\nclinic_ppv`, solution: `clinic_ppv <- ppv_at(0.73, 0.77, 0.29)\nclinic_ppv`, check: `abs(clinic_ppv - ppv_at(0.73, 0.77, 0.29)) < 1e-9`, hint: 'the clinic base rate is 0.73', success: 'about 0.75 — near the 0.76 they report. a high PPV here mostly reflects the high base rate, not a sharp test.' },
      { text: `<p><strong>why specificity collapsed.</strong> Ashwood et al. found that generalised anxiety disorder may "mimic" autism and inflate AQ scores, producing false positives — and 64% of people who scored below the cut-off were in fact autistic. self-report trait questionnaires behave differently in clinics than in research samples. (note: they used the full 50-item AQ, not the AQ-10.)</p>` }
    ],
    note: 'what did the clinic numbers teach you about screening tools, base rates, and anxiety?'
  },
  {
    id: 'u2-chance', unit: 2, plant: 'bluebell', title: 'scores by chance',
    question: 'if someone answered the AQ-10 at random, how often would they be flagged — and do real scores look like that?',
    data: ['aq10.csv'], cite: ['aq10'], deeper: [OCW.c1805, OCW.c907],
    steps: [
      { text: `<p>a <strong>null model</strong>: pretend each of the 10 answers is a fair coin flip. then the score follows a <strong>binomial distribution</strong>. <code>dbinom(7, 10, 0.5)</code> is the chance of exactly 7.</p>`,
        code: `dbinom(7, size = 10, prob = 0.5)`, check: null },
      { text: `<p><code>pbinom(6, 10, 0.5)</code> is the chance of 6 <em>or less</em>, so one minus it is the chance of 7 or more — being flagged by this app.</p>`,
        code: `p_flag_random <- 1 - pbinom(___, size = 10, prob = 0.5)\np_flag_random`, solution: `p_flag_random <- 1 - pbinom(6, size = 10, prob = 0.5)\np_flag_random`, check: `isTRUE(all.equal(p_flag_random, 1 - pbinom(6, 10, 0.5)))`, hint: '"7 or more" is 1 minus "6 or less"' },
      { text: `<p>now the real data: what share of app users scored 7 or more?</p>`,
        code: `aq <- read.csv("aq10.csv")\nobserved <- mean(aq$score >= 7, na.rm = TRUE)\nobserved`, check: `isTRUE(all.equal(observed, mean(read.csv("aq10.csv")$score >= 7)))` },
      { text: `<p>compare the real distribution with the coin-flip model. bars are real people; the line is what random answering would predict. (base R graphics: <code>hist()</code> then <code>points()</code> on top.)</p>`,
        code: `hist(aq$score, breaks = -0.5:10.5, col = "#d0b9e8", border = "white",\n     main = "AQ-10 scores vs. coin flips", xlab = "score")\npoints(0:10, dbinom(0:10, 10, 0.5) * nrow(aq), type = "b", pch = 19, col = "#3d4f43")`, check: null },
      { text: `<p><strong>reading this like a researcher.</strong> real answers are not coin flips: items are correlated (people who answer one item in the autistic-like direction tend to answer others the same way), and app users chose to take a screener. a null model is useful precisely because the data <em>depart</em> from it — the same logic sits under every p-value in unit 4.</p>` }
    ],
    note: 'how did real scores differ from the coin-flip model, and why might that be?'
  },

  // ---------------- unit 3 · estimates ----------------
  {
    id: 'u3-ci', unit: 3, plant: 'daisy', title: 'how sure is an average?',
    question: 'how much maths anxiety do university students report — and how precisely do we know it?',
    data: ['amatus_lite.csv'], cite: ['amatus'], deeper: [OCW.c1805, OCW.c907],
    setup: `am <- read.csv("amatus_lite.csv")`,
    steps: [
      { text: `<p>AMATUS measured maths anxiety with the <strong>AMAS</strong> (nine items, total 9–45; higher means more anxious) in German university students and in German and Belgian primary-school teachers. start with the students.</p>`,
        code: `students <- am[am$group == "student", ]\nnrow(students)\nsummary(students$math_anxiety)`, check: `nrow(students) == 848` },
      { text: `<p>the <strong>standard error</strong> of a mean is the standard deviation divided by the square root of the sample size. it describes how much the mean would wobble from sample to sample.</p>`,
        code: `m <- mean(students$math_anxiety)\ns <- sd(students$math_anxiety)\nn <- nrow(students)\nse <- s / sqrt(___)\nc(mean = m, sd = s, se = se)`, solution: `m <- mean(students$math_anxiety)\ns <- sd(students$math_anxiety)\nn <- nrow(students)\nse <- s / sqrt(n)\nc(mean = m, sd = s, se = se)`, check: `isTRUE(all.equal(se, sd(students$math_anxiety) / sqrt(848)))`, hint: 'divide by the square root of n' },
      { text: `<p>a 95% <strong>confidence interval</strong> is the mean plus or minus a critical value times the standard error. for a mean, the critical value comes from the t distribution: <code>qt(0.975, df = n - 1)</code>.</p>`,
        code: `t_crit <- qt(0.975, df = n - 1)\nci <- c(m - t_crit * se, m + ___ * se)\nci`, solution: `t_crit <- qt(0.975, df = n - 1)\nci <- c(m - t_crit * se, m + t_crit * se)\nci`, check: `isTRUE(all.equal(ci, as.numeric(t.test(students$math_anxiety)$conf.int)))`, hint: 'the upper bound uses t_crit too' },
      { text: `<p>R's <code>t.test()</code> does the same calculation in one line. check it matches yours.</p>`,
        code: `t.test(students$math_anxiety)$conf.int`, check: null, success: 'same interval. now you know what the function is doing.' },
      { text: `<p><strong>what a 95% interval means.</strong> if we repeated this survey many times and built an interval each time, about 95% of those intervals would contain the true population mean. it is a statement about the procedure — not a 95% chance that this particular interval is right. and it only covers sampling error: it says nothing about whether these students represent students elsewhere.</p>` }
    ],
    note: 'report the students’ average maths anxiety with its 95% CI, in one sentence as you would in a paper.'
  },
  {
    id: 'u3-boot', unit: 3, plant: 'lavender', title: 'the bootstrap',
    question: 'how can we put an interval around a median, where there is no simple formula?',
    data: ['amatus_lite.csv'], cite: ['amatus'], deeper: [OCW.c1805, OCW.s1805],
    setup: `am <- read.csv("amatus_lite.csv")\nstudents <- am[am$group == "student", ]`,
    steps: [
      { text: `<p><code>arith</code> is the number of speeded arithmetic problems solved correctly (in order). some people have no score (<code>NA</code>), so drop them first.</p>`,
        code: `arith <- students$arith[!is.na(students$arith)]\nlength(arith)\nmedian(arith)`, check: `exists("arith") && !anyNA(arith) && length(arith) > 500` },
      { text: `<p>the <strong>bootstrap</strong> treats the sample as a stand-in for the population and resamples it <em>with replacement</em>. one resample: </p>`,
        code: `one <- sample(arith, replace = TRUE)\nmedian(one)`, check: `length(one) == length(arith)` },
      { text: `<p>do that 2,000 times with <code>replicate()</code> and keep each median.</p>`,
        code: `set.seed(2026)\nboots <- replicate(2000, median(sample(arith, replace = ___)))\nhist(boots, col = "#a9cfea", border = "white", main = "2,000 bootstrap medians", xlab = "median")`, solution: `set.seed(2026)\nboots <- replicate(2000, median(sample(arith, replace = TRUE)))\nhist(boots, col = "#a9cfea", border = "white", main = "2,000 bootstrap medians", xlab = "median")`, check: `length(boots) == 2000`, hint: 'resampling is with replacement: TRUE' },
      { text: `<p>the middle 95% of the bootstrap medians is a <strong>percentile bootstrap interval</strong>.</p>`,
        code: `boot_ci <- quantile(boots, c(0.025, ___))\nboot_ci`, solution: `boot_ci <- quantile(boots, c(0.025, 0.975))\nboot_ci`, check: `isTRUE(all.equal(unname(boot_ci), unname(quantile(boots, c(0.025, 0.975)))))`, hint: 'the upper cut is 0.975' },
      { text: `<p><strong>why this matters.</strong> the bootstrap lets you put uncertainty around almost any statistic — medians, correlations, differences in proportions — using simulation instead of a formula. medians of whole-number scores move in steps, which is why the histogram looks lumpy.</p>` }
    ],
    note: 'in your own words, what is the bootstrap doing, and when would you reach for it?'
  },
  {
    id: 'u3-groups', unit: 3, plant: 'poppy', title: 'students and teachers',
    question: 'do future and current primary-school teachers report different maths anxiety from university students?',
    data: ['amatus_lite.csv'], packages: ['dplyr', 'ggplot2'], cite: ['amatus'], deeper: [OCW.c907, OCW.u15071],
    setup: `library(dplyr)\nlibrary(ggplot2)\nam <- read.csv("amatus_lite.csv")`,
    steps: [
      { text: `<p>summarise each group with a mean and an approximate 95% interval (mean ± 1.96 standard errors).</p>`,
        code: `by_group <- am |>\n  group_by(group) |>\n  summarise(mean = mean(math_anxiety), se = sd(math_anxiety) / sqrt(n()), n = n()) |>\n  mutate(lower = mean - 1.96 * se, upper = mean + ___ * se)\nby_group`, solution: `by_group <- am |>\n  group_by(group) |>\n  summarise(mean = mean(math_anxiety), se = sd(math_anxiety) / sqrt(n()), n = n()) |>\n  mutate(lower = mean - 1.96 * se, upper = mean + 1.96 * se)\nby_group`, check: `nrow(by_group) == 2 && all(by_group$upper > by_group$lower)`, hint: '1.96 again' },
      { text: `<p>a point with its interval is often clearer than a bar chart.</p>`,
        code: `p <- ggplot(by_group, aes(x = group, y = mean, ymin = lower, ymax = upper)) +\n  geom_pointrange(colour = "#b0607a", size = 1)\np`, check: isGG('p') },
      { text: `<p>for the <em>difference</em> between groups, use a two-sample t-test's confidence interval. the formula syntax <code>outcome ~ group</code> reads "outcome by group".</p>`,
        code: `diff_test <- t.test(math_anxiety ~ group, data = am)\ndiff_test$estimate\ndiff_test$conf.int`, check: `inherits(diff_test, "htest")` },
      { text: `<p><strong>reading this like a researcher.</strong> the interval for the difference is the useful number, not whether two separate intervals overlap. and "teacher" here bundles many differences — age, training, country, career choice — so this comparison describes groups; it does not show that teaching causes anything.</p>` }
    ],
    note: 'summarise the student–teacher difference with its confidence interval, and name one reason the groups might differ other than being a teacher.'
  },

  // ---------------- unit 4 · tests ----------------
  {
    id: 'u4-anchor', unit: 4, plant: 'sunflower', title: 'does anchoring replicate?',
    question: 'does a number you were just shown pull your estimate towards it — across 36 labs?',
    data: ['manylabs_lite.csv'], packages: ['dplyr'], cite: ['manylabs'], deeper: [OCW.t907, OCW.c1805],
    setup: `library(dplyr)\nml <- read.csv("manylabs_lite.csv")`,
    steps: [
      { text: `<p>Many Labs 1 ran 13 classic effects in 36 samples (6,344 people). in one, people were randomly told the distance from San Francisco to New York is either "longer than 1,500 miles" (<strong>low</strong> anchor) or "shorter than 6,000 miles" (<strong>high</strong> anchor), then asked to estimate it. (people who answered in kilometres are left out here.)</p>`,
        code: `anch <- filter(ml, !is.na(distance))\nanch |>\n  group_by(anchor) |>\n  summarise(mean = mean(distance), median = median(distance), n = n())`, check: `exists("anch") && nrow(anch) == 5362` },
      { text: `<p>a <strong>t-test</strong> asks how surprising a difference this large would be if the anchor made no difference at all (the null hypothesis).</p>`,
        code: `anchor_test <- t.test(distance ~ anchor, data = anch)\nanchor_test`, check: `inherits(anchor_test, "htest")`, success: 'the p-value is tiny: a difference this large would be extraordinarily unlikely if anchors did nothing.' },
      { text: `<p>p-values say "is there a difference?"; <strong>effect sizes</strong> say "how big?". Cohen's d divides the mean difference by the pooled standard deviation.</p>`,
        code: `hi <- anch$distance[anch$anchor == "high"]\nlo <- anch$distance[anch$anchor == "low"]\nsd_pooled <- sqrt(((length(hi) - 1) * var(hi) + (length(lo) - 1) * var(lo)) /\n                  (length(hi) + length(lo) - 2))\nd <- (mean(hi) - mean(lo)) / ___\nd`, solution: `hi <- anch$distance[anch$anchor == "high"]\nlo <- anch$distance[anch$anchor == "low"]\nsd_pooled <- sqrt(((length(hi) - 1) * var(hi) + (length(lo) - 1) * var(lo)) /\n                  (length(hi) + length(lo) - 2))\nd <- (mean(hi) - mean(lo)) / sd_pooled\nd`, check: `isTRUE(all.equal(d, (mean(hi) - mean(lo)) / sd_pooled))`, hint: 'divide by sd_pooled' },
      { text: `<p><strong>what the project found.</strong> across the 13 effects, 10 replicated consistently; imagined contact showed weak support; flag priming and currency priming did not replicate. lab-versus-online and US-versus-international mostly did not predict effect sizes (Klein et al., 2014). anchoring was one of the robust ones.</p>` }
    ],
    note: 'report the anchoring result as you would in a results section: means, test, p-value and effect size.'
  },
  {
    id: 'u4-sites', unit: 4, plant: 'fern', title: 'one effect, many labs',
    question: 'does the anchoring effect show up in every sample, and do sunk costs and framing replicate too?',
    data: ['manylabs_lite.csv'], packages: ['dplyr', 'ggplot2'], cite: ['manylabs'], deeper: [OCW.t907],
    setup: `library(dplyr)\nlibrary(ggplot2)\nml <- read.csv("manylabs_lite.csv")\nanch <- filter(ml, !is.na(distance))`,
    steps: [
      { text: `<p>compute the anchoring effect (high minus low) separately for each site.</p>`,
        code: `by_site <- anch |>\n  group_by(site) |>\n  summarise(effect = mean(distance[anchor == "high"]) - mean(distance[anchor == "low"]),\n            n = n()) |>\n  arrange(effect)\nby_site`, check: `is.data.frame(by_site) && nrow(by_site) >= 20 && "effect" %in% names(by_site)` },
      { text: `<p>in what share of sites did the high anchor produce larger estimates?</p>`,
        code: `share_pos <- mean(by_site$effect > ___, na.rm = TRUE)\nshare_pos`, solution: `share_pos <- mean(by_site$effect > 0, na.rm = TRUE)\nshare_pos`, check: `isTRUE(all.equal(share_pos, mean(by_site$effect > 0, na.rm = TRUE)))`, hint: 'a positive effect is above 0' },
      { text: `<p>plot each site's effect. <code>reorder()</code> sorts the sites by size.</p>`,
        code: `p <- ggplot(by_site, aes(x = reorder(site, effect), y = effect)) +\n  geom_col(fill = "#8fb07a") +\n  coord_flip() +\n  labs(x = NULL, y = "high minus low anchor (miles)")\np`, check: isGG('p') },
      { text: `<p>two more classics. <strong>sunk cost</strong>: people imagine a freezing game they either paid for or got free (1 = stay home, 9 = go). <strong>framing</strong>: the same disease choice described as lives saved (gain) or lives lost (loss); <code>chose_sure</code> = 1 if they picked the certain option.</p>`,
        code: `t.test(go_to_game ~ ticket, data = ml)\nframe_tab <- table(ml$frame, ml$chose_sure)\nframe_tab\nprop.test(frame_tab)`, check: `all(dim(frame_tab) == c(2, 2))`, success: 'both replicate: paying makes people likelier to go, and the gain frame makes the sure option far more popular.' },
      { text: `<p><strong>reading this like a researcher.</strong> site effects vary — partly real differences, mostly sampling noise in smaller samples. that is why a single small study can mislead, and why pooled multi-site evidence is so valuable. (in unit 10+ we would model this properly with multilevel models.)</p>` }
    ],
    note: 'what did looking site by site add beyond the overall test?'
  },
  {
    id: 'u4-power', unit: 4, plant: 'clover', title: 'power',
    question: 'how many participants does a study need to reliably detect a small effect?',
    data: [], cite: ['manylabs'], deeper: [OCW.t907, OCW.s1805],
    steps: [
      { text: `<p><strong>power</strong> is the chance a study detects an effect that really exists. simulate one small study: two groups of 20, with a true difference of 0.3 standard deviations.</p>`,
        code: `set.seed(1)\na <- rnorm(20, mean = 0)\nb <- rnorm(20, mean = 0.3)\nt.test(a, b)$p.value`, check: null },
      { text: `<p>wrap it in a function and run it 1,000 times. power is the share of runs with p &lt; .05.</p>`,
        code: `sim_p <- function(n, d) t.test(rnorm(n), rnorm(n, mean = d))$p.value\nset.seed(2)\npower_20 <- mean(replicate(1000, sim_p(20, 0.3)) < ___)\npower_20`, solution: `sim_p <- function(n, d) t.test(rnorm(n), rnorm(n, mean = d))$p.value\nset.seed(2)\npower_20 <- mean(replicate(1000, sim_p(20, 0.3)) < 0.05)\npower_20`, check: `exists("power_20") && power_20 > 0 && power_20 < 0.4`, hint: 'the usual threshold is 0.05', success: 'roughly 15%: most studies this size would miss a real, small effect.' },
      { text: `<p>try 175 per group.</p>`,
        code: `set.seed(3)\npower_175 <- mean(replicate(1000, sim_p(175, 0.3)) < 0.05)\npower_175`, check: `power_175 > 0.7` },
      { text: `<p>R can solve for the sample size directly.</p>`,
        code: `need <- power.t.test(delta = 0.3, sd = 1, power = 0.8)$n\nneed`, check: `need > 170 && need < 180` },
      { text: `<p><strong>why this matters for replication.</strong> underpowered studies miss real effects, and the significant ones they do find tend to overestimate effect sizes. pooling thousands of participants across labs, as Many Labs did, is one answer; planning power before collecting data is another.</p>` }
    ],
    note: 'how many people per group would you plan for a study expecting d = 0.3, and why?'
  },

  // ---------------- unit 5 · design ----------------
  {
    id: 'u5-random', unit: 5, plant: 'daisy', title: 'random assignment at work',
    question: 'did random assignment in Many Labs produce comparable groups?',
    data: ['manylabs_lite.csv'], packages: ['dplyr'], cite: ['manylabs'], deeper: [OCW.c963],
    setup: `library(dplyr)\nml <- read.csv("manylabs_lite.csv")`,
    steps: [
      { text: `<p>an experiment's power to show cause comes from <strong>random assignment</strong>: if chance decides who gets which condition, the groups should be alike on everything — measured or not — apart from the manipulation. check sex balance across anchor conditions.</p>`,
        code: `assigned <- filter(ml, !is.na(anchor), !is.na(sex))\nround(prop.table(table(assigned$anchor, assigned$sex), margin = ___), 3)`, solution: `assigned <- filter(ml, !is.na(anchor), !is.na(sex))\nround(prop.table(table(assigned$anchor, assigned$sex), margin = 1), 3)`, check: `exists("assigned") && nrow(assigned) > 5000`, hint: 'proportions within each anchor group: margin 1' },
      { text: `<p>and age.</p>`,
        code: `assigned |>\n  group_by(anchor) |>\n  summarise(mean_age = mean(age, na.rm = TRUE), n = n())`, check: null },
      { text: `<p>a chi-squared test compares the sex split between conditions. a large p-value is what we hope for here.</p>`,
        code: `bal_p <- chisq.test(table(assigned$anchor, assigned$sex))$p.value\nbal_p`, check: `is.numeric(bal_p) && length(bal_p) == 1` },
      { text: `<p><strong>reading this like a researcher.</strong> balance checks are sanity checks, not proof: with many variables, a few will differ by chance. the real guarantee comes from the assignment procedure itself — which is why methods sections describe exactly how randomisation was done.</p>` }
    ],
    note: 'why does random assignment let us read the anchoring difference as caused by the anchor?'
  },
  {
    id: 'u5-order', unit: 5, plant: 'bluebell', title: 'order effects',
    question: 'did the anchoring effect change depending on when in the session people met it?',
    data: ['manylabs_lite.csv'], packages: ['dplyr'], cite: ['manylabs'], deeper: [OCW.c963],
    setup: `library(dplyr)\nml <- read.csv("manylabs_lite.csv")`,
    steps: [
      { text: `<p>people in Many Labs did many short tasks, in a randomised order. <code>anchor_position</code> records where the anchoring task fell. randomising order is a form of <strong>counterbalancing</strong>: any fatigue or practice effects get spread evenly across conditions.</p>`,
        code: `anch <- filter(ml, !is.na(distance)) |>\n  mutate(when = ifelse(anchor_position <= 6, "early", "late"))\ncount(anch, when)`, check: `exists("anch") && all(c("early", "late") %in% anch$when)` },
      { text: `<p>mean estimates by when × anchor.</p>`,
        code: `order_fx <- anch |>\n  group_by(when, anchor) |>\n  summarise(mean = mean(distance), n = n(), .groups = "drop")\norder_fx`, check: `nrow(order_fx) == 4` },
      { text: `<p>an <strong>interaction</strong> term asks whether the anchor effect differs by position. in R, <code>a * b</code> includes both main effects and their interaction.</p>`,
        code: `fit <- lm(distance ~ anchor * ___, data = anch)\nsummary(fit)$coefficients`, solution: `fit <- lm(distance ~ anchor * when, data = anch)\nsummary(fit)$coefficients`, check: `inherits(fit, "lm") && any(grepl(":", names(coef(fit))))`, hint: 'interact with when' },
      { text: `<p><strong>reading the output.</strong> the <code>anchorlow:whenlate</code> row is the interaction: how much the low-vs-high gap changes when the task came late. whatever it shows, counterbalancing means any order effect cannot masquerade as an anchoring effect, because each anchor condition met each position equally often.</p>` }
    ],
    note: 'what is counterbalancing for, and what did you find about task position?'
  },
  {
    id: 'u5-within', unit: 5, plant: 'tulip', title: 'within vs between',
    question: 'why do Stroop-style experiments test each person in every condition?',
    data: [], cite: [], deeper: [OCW.c963],
    steps: [
      { text: `<p>in a <strong>within-subjects</strong> design, each person does every condition (in the Stroop task, both congruent and incongruent colour words). in a <strong>between-subjects</strong> design, different people do different conditions. these numbers are <em>simulated</em> to show the principle: 30 people, each with their own typical reaction time, slowed by 40 ms on incongruent trials.</p>`,
        code: `set.seed(9)\nn <- 30\nperson <- rnorm(n, mean = 600, sd = 100)\ncongruent <- person + rnorm(n, 0, 30)\nincongruent <- person + 40 + rnorm(n, 0, 30)\nround(head(cbind(congruent, incongruent)))`, check: `length(incongruent) == 30` },
      { text: `<p>a <strong>paired</strong> t-test compares each person with themselves.</p>`,
        code: `p_within <- t.test(incongruent, congruent, paired = ___)$p.value\np_within`, solution: `p_within <- t.test(incongruent, congruent, paired = TRUE)$p.value\np_within`, check: `isTRUE(all.equal(p_within, t.test(incongruent, congruent, paired = TRUE)$p.value))`, hint: 'paired = TRUE' },
      { text: `<p>now analyse the same numbers as if they came from two separate groups of people.</p>`,
        code: `p_between <- t.test(incongruent, congruent)$p.value\nc(within = p_within, between = p_between)`, check: `p_within < p_between`, success: 'the paired analysis is far more sensitive: big differences between people cancel out when each person is their own comparison.' },
      { text: `<p><strong>the trade-off.</strong> within-subjects designs gain power but risk order, practice and fatigue effects — so researchers counterbalance or randomise the order of conditions (MIT 9.63's lectures on design cover exactly this). and a design that is great for detecting an average effect can still be poor at ranking individuals, as Hedge et al.'s (2018) "reliability paradox" showed for the Stroop and flanker tasks.</p>` }
    ],
    note: 'when would you choose a within-subjects design, and what would you do about order effects?'
  },

  // ---------------- unit 6 · lines ----------------
  {
    id: 'u6-line', unit: 6, plant: 'sunflower', title: 'a line through the cloud',
    question: 'do people with more maths anxiety solve fewer arithmetic problems?',
    data: ['amatus_lite.csv'], packages: ['dplyr', 'ggplot2'], cite: ['amatus'], deeper: [OCW.r15071, OCW.reg18650, OCW.c907],
    setup: `library(dplyr)\nlibrary(ggplot2)\nam <- read.csv("amatus_lite.csv")\nar <- filter(am, !is.na(arith))`,
    steps: [
      { text: `<p>look first. each point is a person.</p>`,
        code: `p <- ggplot(ar, aes(x = math_anxiety, y = arith)) +\n  geom_point(alpha = 0.3, colour = "#3d4f43") +\n  geom_smooth(method = "lm", colour = "#b0607a")\np`, check: isGG('p') },
      { text: `<p>the correlation summarises the straight-line relationship (−1 to 1).</p>`,
        code: `r <- cor(ar$math_anxiety, ar$arith)\nr`, check: `isTRUE(all.equal(r, cor(ar$math_anxiety, ar$arith)))` },
      { text: `<p><code>lm()</code> fits a <strong>linear regression</strong>: <code>outcome ~ predictor</code>.</p>`,
        code: `fit <- lm(arith ~ ___, data = ar)\nsummary(fit)`, solution: `fit <- lm(arith ~ math_anxiety, data = ar)\nsummary(fit)`, check: `inherits(fit, "lm") && "math_anxiety" %in% names(coef(fit))`, hint: 'the predictor is math_anxiety' },
      { text: `<p>pull out the slope: the expected change in arithmetic score for each one-point increase in maths anxiety.</p>`,
        code: `slope <- coef(fit)["math_anxiety"]\nr2 <- summary(fit)$r.squared\nc(slope = unname(slope), r_squared = r2)`, check: `isTRUE(all.equal(unname(slope), unname(coef(lm(arith ~ math_anxiety, data = ar))[2])))` },
      { text: `<p><strong>reading this like a researcher.</strong> the slope is negative, and R² tells you how much of the variation in arithmetic the line accounts for — not much. the direction is also open: anxiety could hurt performance, or weaker performance could breed anxiety — these cross-sectional data cannot tell the two apart.</p>` }
    ],
    note: 'write one sentence reporting the slope and R², and one sentence on why it does not settle cause.'
  },
  {
    id: 'u6-more', unit: 6, plant: 'lavender', title: 'more than one predictor',
    question: 'does maths anxiety still predict arithmetic once test anxiety and liking maths are taken into account?',
    data: ['amatus_lite.csv'], packages: ['dplyr'], cite: ['amatus'], deeper: [OCW.r15071, OCW.reg18650],
    setup: `library(dplyr)\nam <- read.csv("amatus_lite.csv")\nar <- filter(am, !is.na(arith), !is.na(liking_math))\nfit <- lm(arith ~ math_anxiety, data = ar)`,
    steps: [
      { text: `<p><strong>multiple regression</strong> estimates each predictor's association while holding the others constant.</p>`,
        code: `fit2 <- lm(arith ~ math_anxiety + test_anxiety + liking_math + ___, data = ar)\nsummary(fit2)$coefficients`, solution: `fit2 <- lm(arith ~ math_anxiety + test_anxiety + liking_math + sex, data = ar)\nsummary(fit2)$coefficients`, check: `inherits(fit2, "lm") && length(coef(fit2)) == 5`, hint: 'add sex as the fourth predictor' },
      { text: `<p>predictors are on different scales, so standardise everything with <code>scale()</code> to compare their sizes.</p>`,
        code: `fit_z <- lm(scale(arith) ~ scale(math_anxiety) + scale(test_anxiety) + scale(liking_math), data = ar)\nround(coef(fit_z), 2)`, check: `inherits(fit_z, "lm")` },
      { text: `<p>how much more variance do the extra predictors explain?</p>`,
        code: `c(simple = summary(fit)$r.squared, multiple = summary(fit2)$r.squared)`, check: null },
      { text: `<p>check how strongly the two anxiety measures overlap.</p>`,
        code: `cor(ar$math_anxiety, ar$test_anxiety)`, check: null, success: 'they are correlated, so each one’s coefficient reflects only what it adds beyond the other — a key idea behind “controlling for”.' },
      { text: `<p><strong>reading this like a researcher.</strong> "holding constant" is statistical, not experimental: it adjusts for the variables you measured, and only as well as you measured them. unit 9 returns to what controlling can and cannot do.</p>` }
    ],
    note: 'what happened to the maths-anxiety coefficient when other predictors were added, and how would you explain that?'
  },
  {
    id: 'u6-anova', unit: 6, plant: 'poppy', title: 'ANOVA is regression',
    question: 'do German students, German teachers and Belgian teachers differ in maths anxiety?',
    data: ['amatus_lite.csv'], packages: ['dplyr'], cite: ['amatus'], deeper: [OCW.a907, OCW.r15071],
    setup: `library(dplyr)\nam <- read.csv("amatus_lite.csv")`,
    steps: [
      { text: `<p>three groups, one outcome.</p>`,
        code: `am |>\n  group_by(sample) |>\n  summarise(mean = mean(math_anxiety), sd = sd(math_anxiety), n = n())`, check: null },
      { text: `<p>one-way <strong>analysis of variance</strong> asks whether the group means differ more than chance would produce.</p>`,
        code: `aov_fit <- aov(math_anxiety ~ ___, data = am)\nsummary(aov_fit)`, solution: `aov_fit <- aov(math_anxiety ~ sample, data = am)\nsummary(aov_fit)`, check: `inherits(aov_fit, "aov")`, hint: 'group by sample' },
      { text: `<p>which pairs differ? Tukey's HSD adjusts for making several comparisons.</p>`,
        code: `tk <- TukeyHSD(aov_fit)\ntk`, check: `inherits(tk, "TukeyHSD")` },
      { text: `<p>the same F test from a regression with a categorical predictor:</p>`,
        code: `anova(lm(math_anxiety ~ sample, data = am))`, check: null, success: 'identical F and p: ANOVA is a linear model with group indicators.' },
      { text: `<p><strong>the big idea.</strong> t-tests, ANOVA and regression are one family — the general linear model. MIT 9.07 teaches ANOVA in exactly this spirit, right after regression.</p>` }
    ],
    note: 'which groups differed, and what does it mean that ANOVA and regression gave the same F?'
  },

  // ---------------- unit 7 · yes or no ----------------
  {
    id: 'u7-frame', unit: 7, plant: 'bluebell', title: 'modelling a choice',
    question: 'how much does the gain frame change the odds of choosing the sure option?',
    data: ['manylabs_lite.csv'], packages: ['dplyr'], cite: ['manylabs'], deeper: [OCW.l15071, OCW.reg18650],
    setup: `library(dplyr)\nml <- read.csv("manylabs_lite.csv")\nfr <- filter(ml, !is.na(chose_sure))`,
    steps: [
      { text: `<p>for yes/no outcomes we model the <em>probability</em> of "yes". start with the raw proportions.</p>`,
        code: `fr |>\n  group_by(frame) |>\n  summarise(p_sure = mean(chose_sure), n = n())`, check: null },
      { text: `<p><strong>logistic regression</strong> models the log-odds of "yes" as a straight line. in R: <code>glm(..., family = binomial)</code>.</p>`,
        code: `logit_fit <- glm(chose_sure ~ frame, data = fr, family = ___)\nsummary(logit_fit)$coefficients`, solution: `logit_fit <- glm(chose_sure ~ frame, data = fr, family = binomial)\nsummary(logit_fit)$coefficients`, check: `inherits(logit_fit, "glm") && logit_fit$family$family == "binomial"`, hint: 'family = binomial' },
      { text: `<p>coefficients are in log-odds. <code>exp()</code> turns them into <strong>odds ratios</strong>. "gain" is the reference group (alphabetically first), so the <code>frameloss</code> odds ratio compares loss to gain.</p>`,
        code: `odds_ratios <- exp(coef(logit_fit))\nodds_ratios`, check: `isTRUE(all.equal(odds_ratios, exp(coef(logit_fit))))` },
      { text: `<p>turn the model back into probabilities, which are easier to talk about.</p>`,
        code: `probs <- predict(logit_fit, newdata = data.frame(frame = c("gain", "loss")), type = "___")\nprobs`, solution: `probs <- predict(logit_fit, newdata = data.frame(frame = c("gain", "loss")), type = "response")\nprobs`, check: `isTRUE(all.equal(as.numeric(probs), as.numeric(tapply(fr$chose_sure, fr$frame, mean)[c("gain", "loss")])))`, hint: 'type = "response" gives probabilities', success: 'with one categorical predictor, the model reproduces the raw proportions exactly.' },
      { text: `<p><strong>why bother, then?</strong> because logistic regression extends: add more predictors, interactions, or continuous variables — which the next seed does.</p>` }
    ],
    note: 'report the framing effect as an odds ratio and as two probabilities. which would you put in an abstract?'
  },
  {
    id: 'u7-family', unit: 7, plant: 'tulip', title: 'scores and families',
    question: 'are app users who report an autistic family member more likely to score higher on the AQ-10?',
    data: ['aq10.csv'], cite: ['aq10'], deeper: [OCW.l15071],
    setup: `aq <- read.csv("aq10.csv")\naq$family <- as.integer(aq$family_autism == "yes")`,
    steps: [
      { text: `<p><code>family_autism</code> records whether the person reported an immediate family member with autism.</p>`,
        code: `table(aq$family_autism)\ntapply(aq$score, aq$family_autism, mean)`, check: null },
      { text: `<p>model the probability of reporting an autistic family member from AQ-10 score and gender.</p>`,
        code: `fam_fit <- glm(family ~ score + ___, data = aq, family = binomial)\nsummary(fam_fit)$coefficients`, solution: `fam_fit <- glm(family ~ score + gender, data = aq, family = binomial)\nsummary(fam_fit)$coefficients`, check: `inherits(fam_fit, "glm") && all(c("score", "genderm") %in% names(coef(fam_fit)))`, hint: 'add gender' },
      { text: `<p>odds ratios: the <code>score</code> one is the change in odds for each extra point.</p>`,
        code: `round(exp(coef(fam_fit)), 2)`, check: null },
      { text: `<p>predicted probabilities for women scoring 2 and 8.</p>`,
        code: `fam_probs <- predict(fam_fit, newdata = data.frame(score = c(2, 8), gender = "f"), type = "response")\nfam_probs`, check: `length(fam_probs) == 2 && fam_probs[2] > fam_probs[1]` },
      { text: `<p><strong>two cautions.</strong> first, these are self-selected app users and self-reports, so this is an association in this sample only. second — why didn't we model <code>screen_positive</code>? because it is defined as score ≥ 7, so score predicts it perfectly ("complete separation"), and logistic regression breaks down. always ask how an outcome was made before modelling it.</p>` }
    ],
    note: 'describe the association you found and one reason it might not generalise.'
  },

  // ---------------- unit 8 · structure ----------------
  {
    id: 'u8-alpha', unit: 8, plant: 'fern', title: 'reliability',
    question: 'do the STICSA’s cognitive and somatic items hang together well enough to sum into scores?',
    data: ['smarvus_lite.csv'], cite: ['smarvus'], deeper: [OCW.c907],
    setup: `sm <- read.csv("smarvus_lite.csv")\ncog_items <- c(3, 4, 5, 9, 10, 11, 13, 16, 17, 19)\nsom_items <- c(1, 2, 6, 7, 8, 12, 14, 15, 18, 20, 21)`,
    steps: [
      { text: `<p>keep complete responses to the 10 cognitive items.</p>`,
        code: `cog <- sm[, paste0("sticsa_", cog_items)]\ncog <- cog[complete.cases(cog), ]\nnrow(cog)`, check: `exists("cog") && ncol(cog) == 10 && !anyNA(cog)` },
      { text: `<p><strong>Cronbach's alpha</strong> compares the variance of individual items with the variance of their total. write it as a function: k/(k−1) × (1 − sum of item variances / variance of the total).</p>`,
        code: `alpha <- function(items) {\n  k <- ncol(items)\n  item_vars <- apply(items, 2, var)\n  total_var <- var(rowSums(items))\n  (k / (k - 1)) * (1 - sum(item_vars) / ___)\n}\nalpha(cog)`, solution: `alpha <- function(items) {\n  k <- ncol(items)\n  item_vars <- apply(items, 2, var)\n  total_var <- var(rowSums(items))\n  (k / (k - 1)) * (1 - sum(item_vars) / total_var)\n}\nalpha(cog)`, check: `isTRUE(all.equal(alpha(cog), (10 / 9) * (1 - sum(apply(cog, 2, var)) / var(rowSums(cog)))))`, hint: 'divide by total_var' },
      { text: `<p>now the somatic items.</p>`,
        code: `som <- sm[, paste0("sticsa_", som_items)]\nsom <- som[complete.cases(som), ]\nc(cognitive = alpha(cog), somatic = alpha(som))`, check: `exists("som") && ncol(som) == 11` },
      { text: `<p><strong>item–total correlations</strong> show which items fit the scale best.</p>`,
        code: `round(cor(cog, rowSums(cog)), 2)`, check: null },
      { text: `<p><strong>reading this like a researcher.</strong> high alpha means items covary — it does not prove they measure one thing, or the right thing (validity). and reliability is a property of scores in a sample, not of a questionnaire forever. Hedge et al. (2018) showed a twist: tasks with robust group effects, like the Stroop, can still have poor reliability for individual differences.</p>` }
    ],
    note: 'report both alphas and say what they do and do not tell you.'
  },
  {
    id: 'u8-pca', unit: 8, plant: 'daisy', title: 'finding structure',
    question: 'if we hadn’t been told, would the 21 anxiety items sort themselves into cognitive and somatic groups?',
    data: ['smarvus_lite.csv'], cite: ['smarvus'], deeper: [OCW.pca18650],
    setup: `sm <- read.csv("smarvus_lite.csv")\ncog_items <- c(3, 4, 5, 9, 10, 11, 13, 16, 17, 19)\nitems <- na.omit(sm[, paste0("sticsa_", 1:21)])`,
    steps: [
      { text: `<p>start with the <strong>correlation matrix</strong>: every item with every other.</p>`,
        code: `r_mat <- cor(items)\nround(r_mat[1:5, 1:5], 2)`, check: `all(dim(r_mat) == c(21, 21))` },
      { text: `<p><strong>principal component analysis</strong> finds the directions that capture the most shared variation. <code>scale. = TRUE</code> standardises the items first.</p>`,
        code: `pca <- prcomp(items, scale. = ___)\nsummary(pca)$importance[2, 1:5]`, solution: `pca <- prcomp(items, scale. = TRUE)\nsummary(pca)$importance[2, 1:5]`, check: `inherits(pca, "prcomp") && isTRUE(all.equal(unname(pca$scale), unname(apply(items, 2, sd))))`, hint: 'scale. = TRUE' },
      { text: `<p>a <strong>scree plot</strong> shows each component's eigenvalue; look for the elbow.</p>`,
        code: `plot(pca$sdev^2, type = "b", pch = 19, col = "#6f8fca",\n     xlab = "component", ylab = "eigenvalue", main = "scree plot")`, check: null },
      { text: `<p>do the cognitive and somatic items load differently on the second component?</p>`,
        code: `loadings <- data.frame(item = 1:21, pc1 = pca$rotation[, 1], pc2 = pca$rotation[, 2])\nloadings$type <- ifelse(loadings$item %in% cog_items, "cognitive", "somatic")\naggregate(cbind(pc1, pc2) ~ type, data = loadings, FUN = mean)`, check: `exists("loadings") && nrow(loadings) == 21` },
      { text: `<p><strong>reading the result.</strong> the first component is a general anxiety dimension (all items load the same way). the second tends to pull cognitive and somatic items apart — the structure the scale's authors built in. (the sign of a component is arbitrary.) PCA summarises variance; <em>factor analysis</em>, coming in a later unit, models latent constructs and is what scale developers usually report.</p>` }
    ],
    note: 'did the items sort into the two kinds of anxiety? describe what PC1 and PC2 seem to capture.'
  },

  // ---------------- unit 9 · cause ----------------
  {
    id: 'u9-rct', unit: 9, plant: 'sunflower', title: 'experiments and causal effects',
    question: 'what is the causal effect of a high anchor, and why can a simple difference in means estimate it?',
    data: ['manylabs_lite.csv'], packages: ['dplyr'], cite: ['manylabs'], deeper: [OCW.c14310],
    setup: `library(dplyr)\nml <- read.csv("manylabs_lite.csv")\nanch <- filter(ml, !is.na(distance), !is.na(sex))`,
    steps: [
      { text: `<p>econometrics frames causation with <strong>potential outcomes</strong>: each person has an estimate they <em>would</em> give under a high anchor and one under a low anchor, but we only ever see one. random assignment makes the two groups comparable, so the difference in their means estimates the <strong>average treatment effect</strong> (ATE).</p>`,
        code: `ate <- mean(anch$distance[anch$anchor == "high"]) - mean(anch$distance[anch$anchor == "___"])\nate`, solution: `ate <- mean(anch$distance[anch$anchor == "high"]) - mean(anch$distance[anch$anchor == "low"])\nate`, check: `isTRUE(all.equal(ate, mean(anch$distance[anch$anchor == "high"]) - mean(anch$distance[anch$anchor == "low"])))`, hint: 'compare with "low"' },
      { text: `<p>the same number from a regression on a treatment indicator (1 = high anchor).</p>`,
        code: `anch$high <- as.integer(anch$anchor == "high")\nfit <- lm(distance ~ high, data = anch)\ncoef(fit)`, check: `isTRUE(all.equal(unname(coef(fit)["high"]), ate))` },
      { text: `<p>add covariates. with randomisation, they should barely move the estimate — but they can shrink its standard error.</p>`,
        code: `fit_cov <- lm(distance ~ high + sex + setting + country, data = anch)\nrbind(simple = coef(summary(fit))["high", 1:2],\n      with_covariates = coef(summary(fit_cov))["high", 1:2])`, check: `inherits(fit_cov, "lm")` },
      { text: `<p><strong>why this works.</strong> randomisation breaks the link between treatment and everything else about people, so no covariate can explain the difference away. MIT 14.310x builds from here to randomised trials in policy, and to what to do when you cannot randomise.</p>` }
    ],
    note: 'explain in two sentences why random assignment lets a difference in means be read as a causal effect.'
  },
  {
    id: 'u9-confound', unit: 9, plant: 'poppy', title: 'when you can’t randomise',
    question: 'students with ADHD report more statistics test anxiety — how much of that gap is about general anxiety?',
    data: ['smarvus_lite.csv'], packages: ['dplyr'], cite: ['smarvus'], deeper: [OCW.c14310, OCW.reg18650],
    setup: `library(dplyr)\nsm <- read.csv("smarvus_lite.csv")\nsm$anxiety <- rowMeans(sm[, paste0("sticsa_", 1:21)])\nd <- sm |>\n  filter(learning_diff %in% c("ADHD", "none"), !is.na(stars_test), !is.na(anxiety)) |>\n  mutate(adhd = as.integer(learning_diff == "ADHD"))`,
    steps: [
      { text: `<p>nobody is randomly assigned ADHD, so this is <strong>observational</strong> data. start with the raw gap.</p>`,
        code: `naive <- lm(stars_test ~ adhd, data = d)\ncoef(naive)`, check: `inherits(naive, "lm")` },
      { text: `<p>now adjust for general trait anxiety.</p>`,
        code: `adjusted <- lm(stars_test ~ adhd + ___, data = d)\ncoef(adjusted)`, solution: `adjusted <- lm(stars_test ~ adhd + anxiety, data = d)\ncoef(adjusted)`, check: `inherits(adjusted, "lm") && "anxiety" %in% names(coef(adjusted))`, hint: 'add anxiety' },
      { text: `<p>side by side:</p>`,
        code: `c(naive = unname(coef(naive)["adhd"]), adjusted = unname(coef(adjusted)["adhd"]))`, check: null },
      { text: `<p>the <strong>omitted variable bias</strong> formula explains the change exactly: naive = adjusted + (anxiety's coefficient) × (how much ADHD predicts anxiety).</p>`,
        code: `b_anx <- coef(adjusted)["anxiety"]\ndelta <- coef(lm(anxiety ~ adhd, data = d))["adhd"]\novb_check <- unname(coef(adjusted)["adhd"] + b_anx * delta)\nc(rebuilt = ovb_check, naive = unname(coef(naive)["adhd"]))`, check: `isTRUE(all.equal(ovb_check, unname(coef(naive)["adhd"])))`, success: 'exactly equal — an algebraic identity of least squares.' },
      { text: `<p><strong>the hard part is not the algebra.</strong> should you control for anxiety at all? if ADHD <em>leads to</em> more general anxiety, anxiety is a <strong>mediator</strong> and adjusting for it hides part of ADHD's real association; if something else drives both, it is a <strong>confounder</strong> worth adjusting for. the data alone cannot tell you which — that needs theory and design. this is why econometrics invests in natural experiments, instruments and discontinuities.</p>` }
    ],
    note: 'is general anxiety a confounder or a mediator here? argue it briefly either way.'
  }
);

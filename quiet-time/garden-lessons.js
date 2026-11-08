/* Quiet Time — data garden lessons. Original lessons; the unit order follows MIT OpenCourseWare
   courses (18.05, 9.07, 9.63, 15.071, 18.650, 14.310x), which are linked as "go deeper" reading.
   Each step's `check` is R code that should be TRUE once the learner's code has run. */
const OCW = {
  r1805: { label: '18.05 · R tutorials', url: 'https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/pages/r-and-rstudio/' },
  c1805: { label: '18.05 · class readings', url: 'https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/pages/classes-reading-and-in-class-materials/' },
  s1805: { label: '18.05 · R studios', url: 'https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/pages/studio-resources/' },
  u15071: { label: '15.071 · the analytics edge (unit 1: intro to R)', url: 'https://ocw.mit.edu/courses/15-071-the-analytics-edge-spring-2017/pages/unit-index/' },
  c907: { label: '9.07 · statistics for brain & cognitive science', url: 'https://ocw.mit.edu/courses/9-07-statistics-for-brain-and-cognitive-science-fall-2016/' },
  c14310: { label: '14.310x · data analysis for social scientists', url: 'https://ocw.mit.edu/courses/14-310x-data-analysis-for-social-scientists-spring-2023/' }
};

const GARDEN_DATA = {
  aq10: {
    short: 'AQ-10 adult autism screening', license: 'CC BY 4.0', url: 'https://doi.org/10.24432/C5F019',
    cite: 'Thabtah, F. (2017). <em>Autism Screening Adult</em> [dataset]. UCI Machine Learning Repository.'
  },
  smarvus: {
    short: 'SMARVUS', license: 'CC BY 4.0', url: 'https://doi.org/10.5334/jopd.80',
    cite: 'Terry, J., et al. (2023). Data from an international multi-centre study of statistics and mathematics anxieties and related variables in university students (the SMARVUS dataset). <em>Journal of Open Psychology Data, 11</em>(1), 8. (Subset: demographics, STARS subscale means and STICSA trait anxiety items.)'
  }
};

const GARDEN_UNITS = [
  { id: 0, title: 'seedlings · R from scratch', blurb: 'variables, data frames, and your first real dataset. follows the R tutorials in MIT 18.05.' },
  { id: 1, title: 'seeing data · describe & visualise', blurb: 'counting, scoring scales, group summaries and ggplot2 charts. MIT 18.05 and 15.071.' },
  { id: 2, title: 'chance · probability, simulation & Bayes', blurb: 'why a positive screen is not a diagnosis. MIT 18.05 and 9.07.' },
  { id: 3, title: 'estimates · confidence intervals', blurb: 'how sure can we be about an average? MIT 18.05 and 9.07.' },
  { id: 4, title: 'tests · hypothesis tests, power & effect sizes', blurb: 'do classic findings replicate across many labs? MIT 9.07 and 18.05.' },
  { id: 5, title: 'design · experiments', blurb: 'controls, random assignment, within- vs between-subjects. MIT 9.63.' },
  { id: 6, title: 'lines · regression & ANOVA', blurb: 'does math anxiety predict performance? MIT 9.07, 15.071 and 18.650.' },
  { id: 7, title: 'yes or no · logistic regression', blurb: 'modelling who screens positive. MIT 15.071 and 18.650.' },
  { id: 8, title: 'structure · correlation, reliability & PCA', blurb: 'how measures hang together. MIT 18.650.' },
  { id: 9, title: 'cause · econometrics & causal inference', blurb: 'experiments, regression for policy questions, and telling cause from correlation. MIT 14.310x.' }
];

const GARDEN_LESSONS = [
  // ---------------- unit 0 ----------------
  {
    id: 'u0-hello', unit: 0, plant: 'clover', title: 'hello, R',
    question: 'how does R store a score, and how do we check it against a cutoff?',
    data: [], cite: ['aq10'], deeper: [OCW.r1805, OCW.u15071],
    steps: [
      { text: `<p>R is a language for working with data. you type code in the box and press <strong>run</strong> (or ⌘/ctrl + enter). R prints the answer underneath.</p><p>start simple: R is a calculator. run this.</p>`,
        code: `2 + 3`, check: null, success: 'R answered 5. you just ran your first line of R.' },
      { text: `<p>the <strong>AQ-10</strong> is a ten-question autism screening questionnaire. each answer in the "autistic-like" direction scores 1, so scores run from 0 to 10.</p><p>we store values in <strong>variables</strong> with the arrow <code>&lt;-</code>. say someone scored 6. replace <code>___</code> with 6 and run.</p>`,
        code: `my_score <- ___\nmy_score`, solution: `my_score <- 6\nmy_score`, check: `identical(as.numeric(my_score), 6)`, hint: 'it should read my_score <- 6' },
      { text: `<p>the screening app that collected our data flagged people who scored <strong>7 or more</strong>. comparisons like <code>&gt;=</code> ("greater than or equal to") give <code>TRUE</code> or <code>FALSE</code>.</p><p>fill in the comparison operator.</p>`,
        code: `is_flagged <- my_score ___ 7\nis_flagged`, solution: `is_flagged <- my_score >= 7\nis_flagged`, check: `identical(is_flagged, FALSE)`, hint: 'the operator for "greater than or equal to" is >=' },
      { text: `<p>a <strong>vector</strong> holds several values at once, made with <code>c()</code>. here are five people's scores. functions like <code>mean()</code> work on the whole vector. find the average.</p>`,
        code: `scores <- c(3, 7, 9, 5, 6)\navg <- ___(scores)\navg`, solution: `scores <- c(3, 7, 9, 5, 6)\navg <- mean(scores)\navg`, check: `isTRUE(all.equal(avg, 6))`, hint: 'the function for an average is mean()' },
      { text: `<p>a neat trick: R treats <code>TRUE</code> as 1 and <code>FALSE</code> as 0. so adding up a comparison <em>counts</em> how many are true. how many of these five people would be flagged?</p>`,
        code: `scores >= 7\nn_flagged <- ___(scores >= 7)\nn_flagged`, solution: `scores >= 7\nn_flagged <- sum(scores >= 7)\nn_flagged`, check: `n_flagged == 2`, hint: 'adding things up is sum()', success: 'two of five. counting with sum() will come up again and again.' }
    ],
    note: 'what is one question you would like to ask of a real autism screening dataset?'
  },
  {
    id: 'u0-meet', unit: 0, plant: 'fern', title: 'meet the data',
    question: 'who took the AQ-10, and does anything in the data look strange?',
    data: ['aq10.csv'], cite: ['aq10'], deeper: [OCW.r1805, OCW.u15071],
    steps: [
      { text: `<p>our data: 704 adults who used an autism screening app (Thabtah, 2017). each row is a person; each column is something about them.</p><p><code>read.csv()</code> loads a spreadsheet file into a <strong>data frame</strong>. <code>head()</code> shows the first rows. run it.</p>`,
        code: `aq <- read.csv("aq10.csv")\nhead(aq)`, check: `exists("aq") && nrow(aq) == 704`, success: 'there it is: A1 to A10 are the ten questions (1 = autistic-like answer), then age, gender and more.' },
      { text: `<p>how many people are in the data? <code>nrow()</code> counts rows.</p>`,
        code: `n_people <- ___(aq)\nn_people`, solution: `n_people <- nrow(aq)\nn_people`, check: `n_people == 704`, hint: 'rows → nrow()' },
      { text: `<p><code>names()</code> lists the columns. notice <code>score</code> (the total, 0–10) and <code>screen_positive</code>.</p><p><strong>important:</strong> <code>screen_positive</code> is simply "scored 7 or more" — it is <em>not</em> an autism diagnosis. (we checked: it matches the score cutoff for every single row.) keeping a screen and a diagnosis apart is a big deal in research.</p>`,
        code: `names(aq)`, check: null },
      { text: `<p>pull out one column with <code>$</code>, like <code>aq$age</code>. some people left their age blank, which R records as <code>NA</code> (missing). <code>na.rm = TRUE</code> tells <code>mean()</code> to skip the blanks.</p><p>what is the average age?</p>`,
        code: `avg_age <- mean(aq$___, na.rm = TRUE)\navg_age`, solution: `avg_age <- mean(aq$age, na.rm = TRUE)\navg_age`, check: `isTRUE(all.equal(avg_age, mean(aq$age, na.rm = TRUE)))`, hint: 'the column is called age' },
      { text: `<p>researchers always look at their data before trusting an average. <code>summary()</code> gives the minimum, quartiles and maximum. then find the oldest age with <code>max()</code>.</p>`,
        code: `summary(aq$age)\nmax_age <- ___(aq$age, na.rm = TRUE)\nmax_age`, solution: `summary(aq$age)\nmax_age <- max(aq$age, na.rm = TRUE)\nmax_age`, check: `max_age == 383`, hint: 'the largest value: max()', success: 'someone is 383 years old! almost certainly a typo — and it is pulling the average up. next seed: cleaning it.' }
    ],
    note: 'why can one impossible value change a result like the average age? what would you do about it?'
  },
  {
    id: 'u0-clean', unit: 0, plant: 'daisy', title: 'cleaning & filtering',
    question: 'how do we find and fix a bad value, and look at just one group?',
    data: ['aq10.csv'], cite: ['aq10'], deeper: [OCW.r1805],
    setup: `aq <- read.csv("aq10.csv")`,
    steps: [
      { text: `<p>square brackets pick rows and columns: <code>aq[rows, columns]</code>. leaving a side empty means "all". so <code>aq[aq$age &gt; 100 &amp; !is.na(aq$age), ]</code> means "rows where age is over 100 (and not missing), all columns".</p><p>how many ages are over 100?</p>`,
        code: `aq[aq$age > 100 & !is.na(aq$age), ]\nn_weird <- sum(aq$age > ___, na.rm = TRUE)\nn_weird`, solution: `aq[aq$age > 100 & !is.na(aq$age), ]\nn_weird <- sum(aq$age > 100, na.rm = TRUE)\nn_weird`, check: `n_weird == 1`, hint: 'put 100 in the blank' },
      { text: `<p>we can't know their real age, so the honest fix is to mark it missing. <code>which()</code> finds the positions, and we assign <code>NA</code> to them.</p>`,
        code: `aq$age[which(aq$age > 100)] <- ___\nsummary(aq$age)`, solution: `aq$age[which(aq$age > 100)] <- NA\nsummary(aq$age)`, check: `max(aq$age, na.rm = TRUE) < 100 && sum(is.na(aq$age)) == 3`, hint: 'missing values are written NA', success: 'now there are 3 missing ages (2 blank + 1 impossible), and the maximum makes sense.' },
      { text: `<p>recalculate the average age on the cleaned data.</p>`,
        code: `avg_age_clean <- mean(aq$age, na.rm = TRUE)\navg_age_clean`, check: `isTRUE(all.equal(avg_age_clean, mean(aq$age, na.rm = TRUE))) && avg_age_clean < 35`, success: 'a little lower than before — one typo was nudging the whole average.' },
      { text: `<p>now just the women. the <code>gender</code> column uses <code>"f"</code> and <code>"m"</code> (this dataset only recorded two options). <code>==</code> tests equality.</p>`,
        code: `women <- aq[aq$gender == "___", ]\nnrow(women)`, solution: `women <- aq[aq$gender == "f", ]\nnrow(women)`, check: `nrow(women) == 337`, hint: 'women are coded "f"' },
      { text: `<p>make <code>men</code> the same way, then compare average ages.</p>`,
        code: `men <- aq[aq$gender == "m", ]\nage_gap <- mean(men$age, na.rm = TRUE) - mean(women$age, na.rm = TRUE)\nage_gap`, check: `isTRUE(all.equal(age_gap, mean(aq$age[aq$gender == "m"], na.rm = TRUE) - mean(aq$age[aq$gender == "f"], na.rm = TRUE)))`, success: 'the groups are close in age — useful to know before comparing their scores.' }
    ],
    note: 'what did cleaning change, and why is it important to report data cleaning in a paper?'
  },
  {
    id: 'u0-flagged', unit: 0, plant: 'tulip', title: 'who gets flagged?',
    question: 'do women and men screen positive on the AQ-10 at different rates, and which questions differ most?',
    data: ['aq10.csv'], cite: ['aq10'], deeper: [OCW.r1805, OCW.c1805],
    setup: `aq <- read.csv("aq10.csv")\naq$age[which(aq$age > 100)] <- NA`,
    steps: [
      { text: `<p><code>table()</code> counts how many rows fall in each category.</p>`,
        code: `table(aq$gender)`, check: null },
      { text: `<p>give <code>table()</code> two columns and it cross-tabulates them. count screen results by gender.</p>`,
        code: `flag_table <- table(aq$gender, aq$___)\nflag_table`, solution: `flag_table <- table(aq$gender, aq$screen_positive)\nflag_table`, check: `all(dim(flag_table) == c(2, 2))`, hint: 'the column is screen_positive' },
      { text: `<p>counts are hard to compare when groups differ in size. <code>prop.table()</code> turns counts into proportions; <code>margin = 1</code> means "within each row", so each gender adds up to 1.</p>`,
        code: `flag_props <- prop.table(flag_table, margin = ___)\nround(flag_props, 2)`, solution: `flag_props <- prop.table(flag_table, margin = 1)\nround(flag_props, 2)`, check: `isTRUE(all.equal(as.numeric(rowSums(flag_props)), c(1, 1)))`, hint: 'rows are margin 1' },
      { text: `<p>another way: the mean of a TRUE/FALSE vector is the proportion TRUE. the women's line is done; write the men's.</p>`,
        code: `pct_women <- mean(aq$screen_positive[aq$gender == "f"] == "yes")\npct_men <- mean(aq$screen_positive[aq$gender == "___"] == "yes")\nc(women = pct_women, men = pct_men)`, solution: `pct_women <- mean(aq$screen_positive[aq$gender == "f"] == "yes")\npct_men <- mean(aq$screen_positive[aq$gender == "m"] == "yes")\nc(women = pct_women, men = pct_men)`, check: `isTRUE(all.equal(pct_women, mean(aq$screen_positive[aq$gender == "f"] == "yes"))) && isTRUE(all.equal(pct_men, mean(aq$screen_positive[aq$gender == "m"] == "yes")))`, hint: 'men are coded "m"' },
      { text: `<p>now go item by item. <code>colMeans()</code> averages each column — here, the share of people giving the autistic-like answer to each question. which questions differ most between women and men?</p>`,
        code: `items <- paste0("A", 1:10)\nitem_gap <- colMeans(aq[aq$gender == "f", items]) - colMeans(aq[aq$gender == "m", items])\nsort(round(item_gap, 2))`, check: `length(item_gap) == 10 && all(names(item_gap) == paste0("A", 1:10))`, success: 'positive numbers: women answered that item in the autistic-like direction more often; negative: men did.' },
      { text: `<p><strong>reading this like a researcher.</strong> these are people who chose to use a screening app, so they are not a random sample of anyone. a positive screen is not a diagnosis. and many autism measures were developed mostly with male participants; researchers debate whether they capture how autism often shows up in women (for example, camouflaging). differences here are a starting point for questions, not conclusions. later units add the tools to ask "is this difference bigger than chance?" (unit 4) and "how often is a positive screen right?" (unit 2).</p>` }
    ],
    note: 'write your finding: what share of women and men screened positive, and one reason to be careful interpreting it.'
  },

  // ---------------- unit 1 ----------------
  {
    id: 'u1-who', unit: 1, plant: 'bluebell', title: 'who answered?',
    question: 'who is in a 12,000-student survey of statistics anxiety, and who is missing?',
    data: ['smarvus_lite.csv'], packages: ['dplyr'], cite: ['smarvus'], deeper: [OCW.u15071, OCW.r1805],
    steps: [
      { text: `<p>SMARVUS surveyed university students in 35 countries about statistics anxiety, maths anxiety and more (Terry et al., 2023). our copy keeps 10,900 students: demographics, three statistics-anxiety scores (STARS) and 21 trait-anxiety questions (STICSA).</p>`,
        code: `sm <- read.csv("smarvus_lite.csv")\nnrow(sm)\nnames(sm)`, check: `exists("sm") && nrow(sm) == 10900` },
      { text: `<p>meet <strong>dplyr</strong>, the tidyverse's toolkit for data frames — what most psych labs use. <code>count()</code> tallies a column. count students by gender.</p>`,
        code: `library(dplyr)\ngender_counts <- count(sm, ___)\ngender_counts`, solution: `library(dplyr)\ngender_counts <- count(sm, gender)\ngender_counts`, check: `is.data.frame(gender_counts) && "gender" %in% names(gender_counts) && nrow(gender_counts) == 4`, hint: 'the column is gender' },
      { text: `<p>the pipe <code>|&gt;</code> passes data from one step to the next, so you can read code top to bottom: "take sm, then count countries, then sort by n, largest first".</p>`,
        code: `country_counts <- sm |>\n  count(country) |>\n  arrange(desc(___))\nhead(country_counts, 10)`, solution: `country_counts <- sm |>\n  count(country) |>\n  arrange(desc(n))\nhead(country_counts, 10)`, check: `country_counts$country[1] == "England"`, hint: 'count() names its column n' },
      { text: `<p><code>mutate()</code> adds a new column. turn counts of majors into percentages.</p>`,
        code: `major_share <- sm |>\n  count(major) |>\n  mutate(pct = round(100 * n / ___(n), 1))\nmajor_share`, solution: `major_share <- sm |>\n  count(major) |>\n  mutate(pct = round(100 * n / sum(n), 1))\nmajor_share`, check: `"pct" %in% names(major_share) && abs(sum(major_share$pct) - 100) < 1`, hint: 'divide by the total: sum(n)' },
      { text: `<p><strong>reading this like a researcher.</strong> most students here study psychology and most are women — great for questions about psych students, riskier for "all students". this is the generalisability question every methods section has to answer.</p>` }
    ],
    note: 'who is this sample, and who might its findings not apply to?'
  },
  {
    id: 'u1-score', unit: 1, plant: 'lavender', title: 'scoring a scale',
    question: 'how do we turn 21 questionnaire items into a trait-anxiety score?',
    data: ['smarvus_lite.csv'], packages: ['dplyr'], cite: ['smarvus'], deeper: [OCW.c1805],
    setup: `library(dplyr)\nsm <- read.csv("smarvus_lite.csv")`,
    steps: [
      { text: `<p>the <strong>STICSA</strong> trait scale (Ree et al., 2008) asks how much 21 statements describe you generally, from 1 (not at all) to 4 (very much so). it has two parts: <strong>cognitive</strong> anxiety (worry, racing thoughts) and <strong>somatic</strong> anxiety (body signs like a fast heartbeat). in our data the answers are columns <code>sticsa_1</code> to <code>sticsa_21</code>.</p>` },
      { text: `<p><code>paste0()</code> glues text together, so <code>paste0("sticsa_", 1:21)</code> makes all 21 column names. use them to pull out the items.</p>`,
        code: `items <- sm[, paste0("sticsa_", 1:___)]\nncol(items)`, solution: `items <- sm[, paste0("sticsa_", 1:21)]\nncol(items)`, check: `ncol(items) == 21`, hint: 'there are 21 items' },
      { text: `<p>a scale score is usually the mean of its items. <code>rowMeans()</code> averages across each row (each person). people who skipped an item get <code>NA</code> — a choice you would report in a paper.</p>`,
        code: `sm$anxiety <- ___(items)\nsummary(sm$anxiety)`, solution: `sm$anxiety <- rowMeans(items)\nsummary(sm$anxiety)`, check: `isTRUE(all.equal(sm$anxiety, rowMeans(sm[, paste0("sticsa_", 1:21)])))`, hint: 'averaging across rows: rowMeans()' },
      { text: `<p>now the two subscales. the cognitive item numbers are filled in for you; the remaining items are somatic. write the somatic line.</p>`,
        code: `cog_items <- c(3, 4, 5, 9, 10, 11, 13, 16, 17, 19)\nsom_items <- c(1, 2, 6, 7, 8, 12, 14, 15, 18, 20, 21)\nsm$cognitive <- rowMeans(sm[, paste0("sticsa_", cog_items)])\nsm$somatic <- ___\nsummary(sm[, c("cognitive", "somatic")])`, solution: `cog_items <- c(3, 4, 5, 9, 10, 11, 13, 16, 17, 19)\nsom_items <- c(1, 2, 6, 7, 8, 12, 14, 15, 18, 20, 21)\nsm$cognitive <- rowMeans(sm[, paste0("sticsa_", cog_items)])\nsm$somatic <- rowMeans(sm[, paste0("sticsa_", som_items)])\nsummary(sm[, c("cognitive", "somatic")])`, check: `isTRUE(all.equal(sm$somatic, rowMeans(sm[, paste0("sticsa_", c(1, 2, 6, 7, 8, 12, 14, 15, 18, 20, 21))]))) && isTRUE(all.equal(sm$cognitive, rowMeans(sm[, paste0("sticsa_", c(3, 4, 5, 9, 10, 11, 13, 16, 17, 19))])))`, hint: 'copy the cognitive line and swap in som_items' },
      { text: `<p>do the two kinds of anxiety go together? <code>cor()</code> gives the correlation (−1 to 1). <code>use = "complete.obs"</code> skips missing values.</p>`,
        code: `r_cs <- cor(sm$cognitive, sm$somatic, use = "complete.obs")\nr_cs`, check: `isTRUE(all.equal(r_cs, cor(sm$cognitive, sm$somatic, use = "complete.obs")))`, success: 'strongly related but not identical — exactly why the scale reports two subscales. unit 8 digs into how items hang together.' }
    ],
    note: 'in your own words: what is a scale score, and why might researchers report cognitive and somatic anxiety separately?'
  },
  {
    id: 'u1-see', unit: 1, plant: 'poppy', title: 'seeing distributions',
    question: 'what does trait anxiety look like across students, and does it differ by gender?',
    data: ['smarvus_lite.csv'], packages: ['dplyr', 'ggplot2'], cite: ['smarvus'], deeper: [OCW.u15071, OCW.s1805],
    setup: `library(dplyr)\nlibrary(ggplot2)\nsm <- read.csv("smarvus_lite.csv")\nsm$anxiety <- rowMeans(sm[, paste0("sticsa_", 1:21)])`,
    steps: [
      { text: `<p><strong>ggplot2</strong> builds charts in layers: data + <code>aes()</code> (which columns go on which axis) + a <code>geom</code> (the kind of mark). this one is a histogram of trait anxiety. (a warning about removed rows just means people with missing scores were left out.)</p>`,
        code: `p <- ggplot(sm, aes(x = anxiety)) +\n  geom_histogram(bins = 30, fill = "#8fb07a")\np`, check: `inherits(p, "ggplot") || inherits(p, "ggplot2::ggplot")`, success: 'most students sit at the lower end with a long tail of higher anxiety — a right-skewed distribution.' },
      { text: `<p><code>group_by()</code> + <code>summarise()</code> gives one row per group. add the standard deviation (how spread out scores are) with <code>sd()</code>.</p>`,
        code: `by_gender <- sm |>\n  filter(!is.na(gender), !is.na(anxiety)) |>\n  group_by(gender) |>\n  summarise(mean_anx = mean(anxiety),\n            sd_anx = ___(anxiety),\n            n = n())\nby_gender`, solution: `by_gender <- sm |>\n  filter(!is.na(gender), !is.na(anxiety)) |>\n  group_by(gender) |>\n  summarise(mean_anx = mean(anxiety),\n            sd_anx = sd(anxiety),\n            n = n())\nby_gender`, check: `nrow(by_gender) == 3 && all(c("mean_anx", "sd_anx", "n") %in% names(by_gender))`, hint: 'standard deviation: sd()' },
      { text: `<p>a boxplot shows each group's median, middle half and spread. fill in the geom.</p>`,
        code: `p2 <- ggplot(filter(sm, !is.na(gender)), aes(x = gender, y = anxiety)) +\n  geom____(fill = "#d98ba0")\np2`, solution: `p2 <- ggplot(filter(sm, !is.na(gender)), aes(x = gender, y = anxiety)) +\n  geom_boxplot(fill = "#d98ba0")\np2`, check: `inherits(p2, "ggplot") || inherits(p2, "ggplot2::ggplot")`, hint: 'geom_boxplot' },
      { text: `<p>how big is the women–men gap? dividing a difference by the spread gives a <strong>standardised difference</strong> — a rough cousin of Cohen's d, which you'll compute properly in unit 4.</p>`,
        code: `w <- by_gender$mean_anx[by_gender$gender == "woman"]\nm <- by_gender$mean_anx[by_gender$gender == "man"]\nstd_diff <- (w - m) / sd(sm$anxiety, na.rm = TRUE)\nstd_diff`, check: `is.numeric(std_diff) && length(std_diff) == 1 && !is.na(std_diff)`, success: 'by convention around 0.2 is "small" and 0.5 "medium" — but conventions are only a rough guide.' },
      { text: `<p><strong>describe before you infer.</strong> so far this is description: what this sample looks like. whether a gap would show up again in a new sample is a question for confidence intervals (unit 3) and hypothesis tests (unit 4). also notice how few students reported another gender — any average for that group is very uncertain.</p>` }
    ],
    note: 'describe the shape of trait anxiety in this sample, and the gender difference, in two or three sentences as you would in a results section.'
  },
  {
    id: 'u1-adhd', unit: 1, plant: 'sunflower', title: 'ADHD and anxiety',
    question: 'do students with an ADHD diagnosis report more trait anxiety and statistics test anxiety, and does it look different for women?',
    data: ['smarvus_lite.csv'], packages: ['dplyr', 'ggplot2'], cite: ['smarvus'], deeper: [OCW.u15071, OCW.c907],
    setup: `library(dplyr)\nlibrary(ggplot2)\nsm <- read.csv("smarvus_lite.csv")\nsm$anxiety <- rowMeans(sm[, paste0("sticsa_", 1:21)])`,
    steps: [
      { text: `<p>students were asked whether they had been diagnosed with a specific learning difference. we simplified the answers into <code>learning_diff</code>: none, ADHD, dyslexia or other.</p>`,
        code: `count(sm, learning_diff)`, check: null },
      { text: `<p><code>%in%</code> keeps rows matching any value in a list. compare students with ADHD to students reporting no learning difference, on trait anxiety and on <code>stars_test</code> (anxiety about statistics tests, 1–5).</p>`,
        code: `adhd <- sm |>\n  filter(learning_diff %in% c("ADHD", "___")) |>\n  group_by(learning_diff) |>\n  summarise(anxiety = mean(anxiety, na.rm = TRUE),\n            stats_test = mean(stars_test, na.rm = TRUE),\n            n = n())\nadhd`, solution: `adhd <- sm |>\n  filter(learning_diff %in% c("ADHD", "none")) |>\n  group_by(learning_diff) |>\n  summarise(anxiety = mean(anxiety, na.rm = TRUE),\n            stats_test = mean(stars_test, na.rm = TRUE),\n            n = n())\nadhd`, check: `nrow(adhd) == 2 && all(c("ADHD", "none") %in% adhd$learning_diff)`, hint: 'the comparison group is "none"' },
      { text: `<p>a violin plot shows the whole shape of each group, with a slim boxplot inside.</p>`,
        code: `p3 <- sm |>\n  filter(learning_diff %in% c("ADHD", "none")) |>\n  ggplot(aes(x = learning_diff, y = stars_test)) +\n  geom_violin(fill = "#a99bd1") +\n  geom_boxplot(width = 0.15)\np3`, check: `inherits(p3, "ggplot") || inherits(p3, "ggplot2::ggplot")` },
      { text: `<p>split by gender too. group by both columns.</p>`,
        code: `adhd_gender <- sm |>\n  filter(learning_diff %in% c("ADHD", "none"), gender %in% c("woman", "man")) |>\n  group_by(gender, ___) |>\n  summarise(anxiety = mean(anxiety, na.rm = TRUE), n = n(), .groups = "drop")\nadhd_gender`, solution: `adhd_gender <- sm |>\n  filter(learning_diff %in% c("ADHD", "none"), gender %in% c("woman", "man")) |>\n  group_by(gender, learning_diff) |>\n  summarise(anxiety = mean(anxiety, na.rm = TRUE), n = n(), .groups = "drop")\nadhd_gender`, check: `nrow(adhd_gender) == 4`, hint: 'the second grouping column is learning_diff' },
      { text: `<p><strong>reading this like a researcher.</strong> look at the <code>n</code> column: some groups are small, so their averages wobble. diagnoses are self-reported, and many people with ADHD — especially women, who research suggests are often diagnosed later — would not have a diagnosis yet. and a difference in averages does not tell us ADHD <em>causes</em> anxiety. these are the threads later units pull on: uncertainty (unit 3), testing (unit 4) and causation (unit 9).</p>` }
    ],
    note: 'what did you find for ADHD and anxiety, and what would you want to know before believing it?'
  }
];

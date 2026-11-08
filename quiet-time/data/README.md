# data garden datasets

Small copies of open research datasets used by the data garden lessons. Each keeps its original licence; please cite the source if you reuse it.

## aq10.csv — AQ-10 adult autism screening
- Source: Thabtah, F. (2017). *Autism Screening Adult* [Dataset]. UCI Machine Learning Repository. https://doi.org/10.24432/C5F019
- Licence: CC BY 4.0
- Changes: converted from ARFF to CSV; `?` written as `NA`; `age_desc` (always "18 and more") dropped; columns renamed (`A1`–`A10`, `jaundice`, `family_autism`, `country`, `score`). The original `Class/ASD` column is renamed `screen_positive` because it equals `score >= 7` in every row — it is a screening result, not a diagnosis. One impossible age (383) is left in on purpose; a lesson cleans it.

## smarvus_lite.csv — SMARVUS subset
- Source: Terry, J., et al. (2023). Data from an international multi-centre study of statistics and mathematics anxieties and related variables in university students (the SMARVUS dataset). *Journal of Open Psychology Data, 11*(1), 8. https://doi.org/10.5334/jopd.80 · data: https://osf.io/mhg94 (file `LATEST_VERSION_smarvus_complete_130426.csv`)
- Licence: CC BY 4.0
- Changes: kept students who did not ask for their data to be excluded (`attention_amnesty` not "No") and who answered at least one STICSA item (10,900 rows); new sequential `id`; gender recoded to woman / man / another gender; `learning_diff` simplified from `spld` (none, ADHD, dyslexia, other; "undiagnosed ADHD" counted as other); `stars_test`, `stars_interp`, `stars_help` are means of the STARS (Q7.1) subscale items, `NA` if any item was missing; `sticsa_1`–`sticsa_21` are the STICSA trait items (Q9.1_1–21, scored 1–4). Cognitive items: 3, 4, 5, 9, 10, 11, 13, 16, 17, 19; somatic: 1, 2, 6, 7, 8, 12, 14, 15, 18, 20, 21.

## manylabs_lite.csv — Many Labs 1 subset
- Source: Klein, R. A., et al. (2014). Investigating variation in replicability: A “Many Labs” replication project. *Social Psychology, 45*(3), 142–152. Data paper: *Journal of Open Psychology Data*, https://doi.org/10.5334/jopd.ad · data: https://osf.io/wx7ck (file `Tab.delimited.Cleaned.dataset.WITH.variable.values.dat` in `Datasets.zip`)
- Licence: CC0 1.0
- Changes: one row per participant (6,344); `site` = `referrer`; `country` = US / international; `setting` = lab / online; `age` kept if 16–90. Anchoring 1 (San Francisco–New York distance): `anchor` low (1,500 miles) / high (6,000 miles) from `anch1group`, `distance` = `anchoring1` in miles, `anchor_position` = `anchorinorder`; anchor fields are `NA` for people with no anchoring response (the original codes them as group 0). Sunk cost: `ticket` paid / free, `go_to_game` = `sunkDV` (1–9). Gain/loss framing: `frame` gain / loss, `chose_sure` = 1 if the certain programme was chosen, `frame_position` = `diseaseforder`.

## amatus_lite.csv — AMATUS subset
- Source: *The AMATUS dataset: Arithmetic performance, mathematics anxiety and attitudes in primary school teachers and university students*. Journal of Open Psychology Data, 12(1), https://doi.org/10.5334/jopd.115 · data: https://osf.io/gszpb (file `AMATUS_dataset.csv`)
- Licence: CC BY 4.0
- Changes: new sequential `id`; `group` = student / teacher from `sample`; scale totals renamed (`math_anxiety` = AMAS total 9–45, `amas_learning`, `amas_testing`, `gad` = GAD-7 score, `test_anxiety` = short TAI, `neuroticism` = BFI-K N, `stereotype` = FSMAS stereotype endorsement, teachers only); `arith` = `sum_arith_perf`. Item-level responses dropped.

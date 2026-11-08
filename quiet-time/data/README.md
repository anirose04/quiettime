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

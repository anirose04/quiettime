/* Quiet Time — the history paper: curated issues.
   Content only; rendering lives in history.js.
   Citation markers in text: [[sourceKey]] or [[sourceKey|locator]]. Every key must exist in that issue's `sources`.
   Excerpts were checked word for word against the cited Project Gutenberg transcription (and, where noted, a scan
   of an early printing). `verified` notes record what was checked and when. */
const HISTORY_ISSUES = [
  {
    id: 'rights', no: 1, title: 'who gets to claim rights?', period: '1789–1798 · the revolutionary decade',
    kicker: 'a reply to Burke, a letter to Talleyrand, and a question about who counts',
    sources: {
      sep: { type: 'scholarly reference', cite: 'Tomaselli, Sylvana. “Mary Wollstonecraft.” <em>The Stanford Encyclopedia of Philosophy</em>, first published 16 April 2008; substantive revision 22 February 2025.', url: 'https://plato.stanford.edu/entries/wollstonecraft/' },
      vindGut: { type: 'primary text (transcription)', cite: 'Wollstonecraft, Mary. <em>A Vindication of the Rights of Woman</em> (first published 1792). Project Gutenberg eBook #3420, released 2002, updated 2021. The transcription does not name the printed edition it was made from.', url: 'https://www.gutenberg.org/ebooks/3420' },
      vind1792: { type: 'primary text (early printing)', cite: 'Wollstonecraft, Mary. <em>A Vindication of the Rights of Woman: with Strictures on Political and Moral Subjects</em>. Boston: Peter Edes for Thomas and Andrews, 1792. Scan via the Internet Archive.', url: 'https://archive.org/details/vindicationofrig00wol' }
    },
    story: [
      { text: 'In 1790 Edmund Burke published <em>Reflections on the Revolution in France</em>, prompted partly by a 1789 address that the minister Richard Price gave to the Revolution Society, which commemorated Britain’s revolution of 1688 [[sep|§1]]. Mary Wollstonecraft, egged on by her publisher Joseph Johnson, answered fast. <em>A Vindication of the Rights of Men</em> (1790) was almost certainly the first of the many replies Burke provoked; it appeared anonymously at the end of November, and the second edition, out by mid-December, carried her name and established her as a political writer [[sep|§1]].' },
      { text: 'In September 1791 she began a second <em>Vindication</em>, this time of the rights of woman [[sep|§1]]. Part of its target was in Paris. Charles Maurice de Talleyrand-Périgord, who visited London in February 1792 on behalf of the revolutionary Constituent Assembly, had proposed a new national curriculum that would confine girls to domestic education [[sep|§1, §3]]. Printings of 1792 open with a dedication to him that quotes his own words back at him: he had called the exclusion of half the human race from government a “political phenomenon” impossible to explain “according to abstract principles” [[vind1792|dedication, p. ix]] [[vindGut|dedication]].' },
      { kind: 'scholarly interpretation', text: 'Tomaselli reads the book as more than a complaint about unfairness. For Wollstonecraft, she argues, shutting women out of the new education was “a contradiction within the revolutionary project itself”: if half the population stayed in the old habits of despotism, the moral renewal the Revolution promised could never be complete [[sep|§3]].' }
    ],
    bookshelf: {
      work: 'A Vindication of the Rights of Woman', author: 'Mary Wollstonecraft', written: 'begun September 1791; published 1792', genre: 'political treatise (non-fiction)',
      excerpt: 'Consider, I address you as a legislator, whether, when men contend for their freedom, and to be allowed to judge for themselves, respecting their own happiness, it be not inconsistent and unjust to subjugate women, even though you firmly believe that you are acting in the manner best calculated to promote their happiness? Who made man the exclusive judge, if woman partake with him the gift of reason?',
      locator: 'Dedication “To M. Talleyrand Perigord, late Bishop of Autun”', cite: ['vindGut', 'vind1792'],
      verified: 'checked word for word against Project Gutenberg #3420; the same sentences appear on p. ix of the 1792 Boston printing (old spelling with the long s, slightly different commas).',
      about: 'The dedication is addressed to Talleyrand as “a legislator.” Wollstonecraft takes the Revolution’s own claim — that people should judge their own happiness — and asks why it stops at men. The phrase “the gift of reason” matters: in this passage her case rests on women sharing reason with men, so the same test of rights must apply to both [[vindGut|dedication]].'
    },
    questions: [
      {
        q: 'Why did Wollstonecraft address a book about women’s education to a French politician?',
        options: [
          'He had proposed a national education plan for revolutionary France that kept girls to domestic education, which she treated as a test of the Revolution’s own principles.',
          'He had attacked her reply to Burke in print, and the dedication was her rebuttal.',
          'He was, like Burke, a well-known opponent of the Revolution.',
          'He had invited her to help draft France’s new curriculum for girls.'
        ],
        answer: 0,
        explain: 'Talleyrand’s plan proposed to consign girls to domestic education alone; the dedication opens by mentioning his pamphlet “on National Education” [[sep|§3]] [[vindGut|dedication]]. He was no opponent of the Revolution: Tomaselli describes him travelling to London in February 1792 on behalf of the Constituent Assembly [[sep|§1]]. Nothing in the sources suggests he reviewed her work or invited her to advise him.'
      },
      {
        q: 'In the excerpt, what work is the question “Who made man the exclusive judge” doing?',
        options: [
          'Conceding that men should decide what makes women happy, but asking them to decide more generously.',
          'Turning the revolutionaries’ claim that people should judge their own happiness against the exclusion of women.',
          'Arguing that only women who have been educated in reason should be given rights.'
        ],
        answer: 1,
        explain: 'The sentence sets men who “contend for their freedom, and to be allowed to judge for themselves” beside the subjugation of women — even by someone who “firmly believe[s]” he is promoting their happiness. Good intentions do not license it. A few lines earlier she makes the general point: if “the abstract rights of man will bear discussion and explanation, those of woman, by a parity of reasoning, will not shrink from the same test” [[vindGut|dedication]]. The third option is tempting because reason is central, but she says woman already “partake[s] with him the gift of reason.”'
      }
    ],
    connection: {
      title: 'the memoir that buried the argument',
      text: 'Wollstonecraft married William Godwin in March 1797, and on 30 August their daughter was born — Mary Wollstonecraft Godwin, the future author of <em>Frankenstein</em> [[sep|§1]]. Wollstonecraft died that same year [[sep]]. In 1798 Godwin published a frank memoir of her life that revealed, among other things, her earlier relationship with Gilbert Imlay; Tomaselli writes that it “cast a deep shadow over her reputation,” and that for most of the nineteenth century she was derided more for her life than read for her ideas. Her ideas were rarely assessed on their own terms until the second half of the twentieth century — though Tomaselli adds that recent research shows her works were never entirely ignored [[sep|§5]].'
    },
    keep: [
      { id: 'rights-quote', kind: 'quotation', text: '“Who made man the exclusive judge, if woman partake with him the gift of reason?”', explain: 'Wollstonecraft’s challenge to Talleyrand: if men may judge their own happiness, on what grounds are women excluded?', related: 'Mary Wollstonecraft, A Vindication of the Rights of Woman (1792), dedication', cite: ['vindGut', 'vind1792'] },
      { id: 'rights-burke', kind: 'discovery', text: 'A Vindication of the Rights of Men (1790) was almost certainly the first reply to Burke’s Reflections — published anonymously, then under her name in a second edition weeks later.', explain: 'The second edition established Wollstonecraft as a political writer.', related: 'Wollstonecraft; Edmund Burke', cite: ['sep'] },
      { id: 'rights-memoir', kind: 'discovery', text: 'Godwin’s frank 1798 memoir of Wollstonecraft did lasting damage to her reputation through most of the nineteenth century.', explain: 'Readers were distracted by her biography; close engagement with her ideas came mainly in the second half of the twentieth century.', related: 'William Godwin, Memoirs of the Author of a Vindication of the Rights of Woman (1798)', cite: ['sep'] }
    ]
  },

  {
    id: 'machines', no: 2, title: 'a world changed by machines', period: '1811–1849 · machine-breaking and its memory',
    kicker: 'frame-breakers, a poet’s first speech, and a novel that looked back',
    sources: {
      tna: { type: 'archive', cite: 'The National Archives (UK). “The proclamation of Ned Ludd.” Record story (document dated 23 December 1811).', url: 'https://www.nationalarchives.gov.uk/explore-the-collection/stories/the-proclamation-of-ned-ludd/' },
      hansard: { type: 'primary record', cite: '“Frame Work Bill.” House of Lords debate, 27 February 1812. <em>Hansard</em>, HL Deb vol 21, cc964–79 (Lord Byron’s speech from c966).', url: 'https://api.parliament.uk/historic-hansard/lords/1812/feb/27/frame-work-bill' },
      vw: { type: 'scholarly article', cite: 'Diniejko, Andrzej. “<em>Shirley</em> as a Condition-of-England Novel.” <em>The Victorian Web</em>.', url: 'https://victorianweb.org/authors/bronte/cbronte/diniejko.html' },
      shirleyGut: { type: 'primary text (transcription)', cite: 'Brontë, Charlotte. <em>Shirley</em> (first published 1849). Project Gutenberg eBook #30486, released 2009.', url: 'https://www.gutenberg.org/ebooks/30486' },
      chm: { type: 'museum', cite: 'Computer History Museum. “Ada Lovelace.” <em>The Babbage Engine</em>.', url: 'https://www.computerhistory.org/babbage/adalovelace/' },
      sketch: { type: 'primary text (transcription)', cite: 'Menabrea, L. F. “Sketch of the Analytical Engine Invented by Charles Babbage,” translated with notes by Ada Augusta, Countess of Lovelace (1843), Note A. Transcription at Fourmilab.', url: 'https://www.fourmilab.ch/babbage/sketch.html' }
    },
    story: [
      { text: 'The Luddite disturbances began in Nottinghamshire in 1811 and spread in 1812 to the West Riding of Yorkshire and Lancashire, then to Leicestershire and Derbyshire [[tna]]. They were aimed at employers using new machines to replace skilled workers and drive down wages. Luddites petitioned, protested and wrote to officials, as well as destroying machinery — the part popular memory kept [[tna]]. Their leader, “Ned Ludd,” was legendary: an imaginary figurehead [[tna]].' },
      { text: 'On 27 February 1812 the House of Lords debated a bill that would make frame-breaking a capital offence. Lord Byron, rising to speak there for the first time, opposed it. He did not excuse the violence, but insisted that “nothing but absolute want could have driven a large, and once honest and industrious, body of the people” to it [[hansard|c966]]. The government’s response was severe: troops were sent, machine-breaking was made a capital crime, and at a Special Commission in York in January 1813 seventeen men were hanged [[tna]].' },
      { text: 'Thirty-seven years later Charlotte Brontë published <em>Shirley</em> (1849) [[vw]], set in the Yorkshire of “eighteen-hundred-eleven-twelve” [[shirleyGut|ch. I]]. In Yorkshire, as Diniejko explains, the anger belonged to the croppers, skilled cloth finishers who feared the new shearing frame would put them out of work [[vw]].' }
    ],
    bookshelf: {
      work: 'Shirley', author: 'Charlotte Brontë', written: 'published 1849; set in 1811–12', genre: 'novel (fiction)',
      excerpt: 'At this crisis certain inventions in machinery were introduced into the staple manufactures of the north, which, greatly reducing the number of hands necessary to be employed, threw thousands out of work, and left them without legitimate means of sustaining life. A bad harvest supervened. Distress reached its climax.',
      locator: 'Chapter II, “The Wagons”', cite: ['shirleyGut'],
      verified: 'checked word for word against Project Gutenberg #30486.',
      about: 'This is a narrator in a novel explaining the past, not a witness to it. The sentences just before blame the “Orders in Council” for cutting off the Yorkshire woollen trade’s markets, so the narrator offers an economic explanation of the unrest [[shirleyGut|ch. II]]. Diniejko reads the novel as sympathetic to workers worried about losing their livelihoods [[vw]].'
    },
    questions: [
      {
        q: 'Which order is right?',
        options: [
          'Byron’s speech in the Lords → the York hangings → Lovelace’s notes on the Analytical Engine → Shirley is published',
          'The York hangings → Byron’s speech in the Lords → Shirley is published → Lovelace’s notes on the Analytical Engine',
          'Byron’s speech in the Lords → Shirley is published → the York hangings → Lovelace’s notes on the Analytical Engine',
          'Byron’s speech in the Lords → the York hangings → Shirley is published → Lovelace’s notes on the Analytical Engine'
        ],
        answer: 0,
        explain: 'Byron spoke on 27 February 1812 [[hansard]]; the York Special Commission hanged seventeen men in January 1813 [[tna]]; Lovelace published her translation and notes in 1843 [[chm]]; and <em>Shirley</em> appeared in 1849 [[vw]] — so Brontë looked back at the frame-breakers six years after Lovelace’s notes were in print.'
      },
      {
        q: 'A historian wants evidence of what Yorkshire workers thought in 1812. Why is the Shirley passage weaker evidence for that than the Ned Ludd proclamation?',
        options: [
          'It is fiction published in 1849, decades after the events, and its narrator openly looks back from the “present years.”',
          'Brontë sided with the mill owners, so the passage is pro-employer propaganda.',
          'It describes Nottinghamshire stocking frames rather than the Yorkshire wool trade.'
        ],
        answer: 0,
        explain: 'The proclamation is dated 23 December 1811 and was issued in Ned Ludd’s name, from inside the movement [[tna]]. <em>Shirley</em> is a novel of 1849 [[vw]] whose first chapter announces “we are going back to the beginning of this century” from the “present years” [[shirleyGut|ch. I]]. That makes it good evidence of how a mid-Victorian novelist represented 1812, and weaker evidence of 1812 itself. It is not pro-employer — Diniejko reads it as sympathetic to the workers [[vw]] — and the passage concerns the Yorkshire woollen trade [[shirleyGut|ch. II]].'
      }
    ],
    connection: {
      title: 'the poet’s daughter and the loom',
      text: 'Ada Lovelace (1815–1852), born Augusta Ada Byron, was Lord Byron’s only legitimate child [[chm]]. In 1843 she published a translation of an Italian engineer’s article on Charles Babbage’s Analytical Engine, adding extensive notes of her own [[chm]]. In Note A she explained what made the Engine new — it borrowed the punched cards Jacquard devised for weaving complicated patterns — and wrote that “the Analytical Engine weaves algebraical patterns just as the Jacquard-loom weaves flowers and leaves” [[sketch|Note A]]. This is a family connection and a shared image, not a claim that one influenced the other: the father defended workers displaced by textile machinery; the daughter described a computing machine in the language of a loom.'
    },
    keep: [
      { id: 'machines-byron', kind: 'quotation', text: '“nothing but absolute want could have driven a large, and once honest and industrious, body of the people, into the commission of excesses so hazardous to themselves, their families and the community.”', explain: 'Lord Byron’s first speech in the House of Lords, opposing the bill to make frame-breaking a capital offence.', related: 'Lord Byron, House of Lords, 27 February 1812', cite: ['hansard'] },
      { id: 'machines-ludd', kind: 'discovery', text: '“Ned Ludd” was an imaginary figurehead, and at a Special Commission in York in January 1813, seventeen men were hanged.', explain: 'Machine-breaking was made a capital crime in response to the Luddite disturbances of 1811–12.', related: 'the Luddites', cite: ['tna'] },
      { id: 'machines-lovelace', kind: 'quotation', text: '“the Analytical Engine weaves algebraical patterns just as the Jacquard-loom weaves flowers and leaves.”', explain: 'Ada Lovelace, Byron’s daughter, describing Babbage’s Engine through the punched-card loom.', related: 'Ada Lovelace, Note A (1843)', cite: ['sketch', 'chm'] }
    ]
  },

  {
    id: 'story', no: 3, title: 'who gets to tell the story?', period: '1789 to now · autobiography, abolition and evidence',
    kicker: 'a book sold by subscription, a baptism record, and a question historians still argue about',
    sources: {
      eqGut: { type: 'primary text (transcription)', cite: 'Equiano, Olaudah. <em>The Interesting Narrative of the Life of Olaudah Equiano, or Gustavus Vassa, the African. Written by Himself</em> (first published London, 1789). Project Gutenberg eBook #15399, released 2005. Its title page reads “Printed for and sold by the Author”; the eBook does not say which of the nine editions it transcribes.', url: 'https://www.gutenberg.org/ebooks/15399' },
      carey: { type: 'scholarly biography', cite: 'Carey, Brycchan. “Olaudah Equiano: An Illustrated Biography.” brycchancarey.com, text 2000–2005.', url: 'https://brycchancarey.com/equiano/biog.htm' },
      shill: { type: 'scholarly publisher resource', cite: 'Shillington, Kevin. “The Debate: Gustavus Vassa.” Student resource for <em>History of Africa</em>, 4th ed. (Bloomsbury, 2019). Summarises Carretta, “Olaudah Equiano or Gustavus Vassa? New Light on an Eighteenth-Century Question of Identity,” <em>Slavery and Abolition</em> 20, no. 3 (1999): 96–105; Lovejoy, “Autobiography and Memory,” <em>Slavery and Abolition</em> 27, no. 3 (2006): 317–47; and Carretta, <em>Equiano, the African</em> (2005).', url: 'https://res.cloudinary.com/bloomsbury-online-resources/raw/upload/RGP/S/shillington-history-of-africa-4e/student-zone/debates/Gustavus%20Vassa%20(Ch11).pdf' },
      lovejoy: { type: 'scholarly article', cite: 'Lovejoy, Paul E. “Construction of Identity: Olaudah Equiano or Gustavus Vassa?” <em>Historically Speaking</em> 7, no. 3 (2006): 8–9.', url: 'https://muse.jhu.edu/article/423519' },
      blackburn: { type: 'review', cite: 'Blackburn, Robin. “The True Story of Equiano.” <em>The Nation</em>, 2 November 2005 (review of Carretta, <em>Equiano, the African</em>).', url: 'https://www.thenation.com/article/archive/true-story-equiano/' },
      sep: { type: 'scholarly reference', cite: 'Tomaselli, Sylvana. “Mary Wollstonecraft.” <em>The Stanford Encyclopedia of Philosophy</em>, substantive revision 22 February 2025.', url: 'https://plato.stanford.edu/entries/wollstonecraft/' },
      ecda: { type: 'university digital archive', cite: 'Early Caribbean Digital Archive, Northeastern University. Record for Equiano, <em>The Interesting Narrative</em> (1794 edition).', url: 'https://ecda.northeastern.edu/?p=1146' }
    },
    story: [
      { text: 'In the spring of 1789 a former slave published his own life story, and he published it himself. Olaudah Equiano — known for most of his life as Gustavus Vassa — sold <em>The Interesting Narrative</em> by subscription, collecting money in advance from a list that began with the Prince of Wales and included eight dukes [[carey]]. It appeared at the height of the campaign against the slave trade, one of more than a hundred books on slavery that year [[carey]], and its dedication asked Parliament to remember its readers “on that important day when the question of Abolition is to be discussed” [[eqGut|dedication]]. It went through nine editions by 1794 [[carey]].' },
      { text: 'The book opens with a childhood in “Eboe” (Igboland) and a kidnapping at about the age of eleven [[carey]]. Its truth was attacked early: in April 1792 two London newspapers claimed he had been born in the Danish West Indies, a charge Shillington calls groundless [[shill]].' },
      { kind: 'open scholarly question', text: 'The modern question is different. In 1999 Vincent Carretta drew attention to a baptism record of 9 February 1759 for “Gustavus Vassa a Black born in Carolina,” and a ship’s muster roll of 17 May 1773 giving a seaman’s birthplace as South Carolina [[shill]]. Paul Lovejoy disputes Carretta’s conclusion [[lovejoy]], arguing that the linguistic, geographical and cultural detail in the <em>Narrative</em> “leaves little doubt that he was born in Africa” [[shill]]. Logbooks and registers confirm almost every other step of the story, as Robin Blackburn notes [[blackburn]], and Carretta himself cautions that “reasonable doubt is not the same as conclusive proof” [[shill]]. The question remains open.' }
    ],
    bookshelf: {
      work: 'The Interesting Narrative of the Life of Olaudah Equiano, or Gustavus Vassa, the African', author: 'Olaudah Equiano (Gustavus Vassa)', written: 'dedication dated 24 March 1789; first published 1789', genre: 'autobiography (non-fiction)',
      excerpt: 'I am sensible I ought to entreat your pardon for addressing to you a work so wholly devoid of literary merit; but, as the production of an unlettered African, who is actuated by the hope of becoming an instrument towards the relief of his suffering countrymen, I trust that <em>such a man</em>, pleading in <em>such a cause</em>, will be acquitted of boldness and presumption.',
      locator: 'Dedication “To the Lords Spiritual and Temporal, and the Commons of the Parliament of Great Britain”', cite: ['eqGut'],
      verified: 'checked word for word against Project Gutenberg #15399 (italics as in the transcription).',
      about: 'The apology is modest, but it also tells Parliament who is speaking and why it should listen. Carey stresses that Equiano wrote the book himself and published it himself [[carey]], so “unlettered” is a rhetorical pose, not a description of how the book was made. The identity debate gives the phrase a further edge: scholars who doubt the African birth ask why the name Olaudah Equiano first appears in print in 1789, when an African persona would strengthen the book’s case — and others reply that few former slaves used their African names in everyday life [[shill]].'
    },
    questions: [
      {
        q: 'The dedication calls the book the production of “an unlettered African.” What is the most defensible reading?',
        options: [
          'A modest apology that also rests his authority on African identity and experience, at a moment when that authority mattered to the abolition debate.',
          'Evidence that Equiano could not read or write and dictated the book to someone else.',
          'A sign that his publisher wrote the book and Equiano only lent his name to it.',
          'A later addition by an editor after Equiano’s death.'
        ],
        answer: 0,
        explain: 'Carey notes that Equiano “had written it himself” and published it himself by subscription [[carey]]; the dedication is dated 24 March 1789, in his lifetime [[eqGut|dedication]]. The book appeared at the height of the campaign against the slave trade [[carey]], which is why speaking “as” an African carried weight — and why the identity debate matters [[shill]].'
      },
      {
        q: 'Carretta’s baptism record says “born in Carolina.” Which reason does Shillington give for thinking it may not settle the question?',
        options: [
          'The record was forged by the pro-slavery newspapers of 1792.',
          'A young boy newly arrived in England, with little English, had little control over what his godparents entered as his birthplace.',
          'Baptism records of the 1750s never recorded birthplaces at all.',
          'The 1773 muster roll gives an African birthplace, contradicting it.'
        ],
        answer: 1,
        explain: 'Shillington points out that the young Vassa had little control or understanding of what his godparents recorded, and that Lovejoy cites contemporaries who said he spoke almost no English when he arrived [[shill]]. The 1792 newspapers claimed a different birthplace altogether, the Danish West Indies [[shill]]; and the 1773 muster roll actually points the same way as the baptism record, to South Carolina [[shill]].'
      }
    ],
    connection: {
      title: 'a review from Wollstonecraft',
      text: 'One of the book’s first reviewers was Mary Wollstonecraft — the author of issue no. 1. In the May 1789 <em>Analytical Review</em> she was, in the Early Caribbean Digital Archive’s summary, unimpressed with the narrative overall but praised several aspects of it [[ecda]]. The two writers’ lives ended close together: Equiano died in March 1797, ten years before the slave trade was abolished in British ships [[carey]], and Wollstonecraft later that same year [[sep]]. Reviewers in 1789 were mixed more widely too: a June notice in the <em>Monthly Review</em> was divided, and the <em>Gentleman’s Magazine</em> ironically called the book “uninteresting” [[ecda]].'
    },
    keep: [
      { id: 'story-dedication', kind: 'quotation', text: '“I trust that such a man, pleading in such a cause, will be acquitted of boldness and presumption.”', explain: 'Equiano’s dedication to Parliament, dated 24 March 1789, in the year the abolition of the slave trade was being debated.', related: 'Olaudah Equiano, The Interesting Narrative (1789), dedication', cite: ['eqGut'] },
      { id: 'story-doubt', kind: 'quotation', text: '“reasonable doubt is not the same as conclusive proof.”', explain: 'Vincent Carretta, who found the baptism and muster records, cautioning against treating them as settling Equiano’s birthplace.', related: 'Vincent Carretta, Equiano, the African (2005), as quoted by Shillington', cite: ['shill'] },
      { id: 'story-subscribers', kind: 'discovery', text: 'Equiano published his book himself by subscription; the list of advance buyers began with the Prince of Wales and included eight dukes.', explain: 'He then promoted it on tours across England, Scotland, Wales and Ireland; it ran to nine editions by 1794.', related: 'Olaudah Equiano (Gustavus Vassa)', cite: ['carey'] }
    ]
  }
];

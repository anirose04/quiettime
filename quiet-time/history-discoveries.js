/* Quiet Time — the history paper: the bundled discovery collection. Content only; rendering lives in history.js.

   Every story carries a period text. `excerpt.text` must match `excerpt.textUrl` word for word; run
   node scripts/history-check.mjs --verify-excerpts after adding one. A " … " marks a deliberate cut.

   context says what the surrounding facts were checked against:
     scholarly — a peer-reviewed article or scholarly encyclopedia read for this story
     reference — a reference work or archive read for this story (say so; it is not primary research)
     text      — chiefly the period text itself, which is evidence of what the writer said, not that it is true
   Stories with `issue` draw on an earlier, fully sourced issue in history-issues.js.

   links: [targetId, relation, why]. Relations:
     same    — the same event, person or document, from another side
     linked  — a documented connection between the two
     debate  — scholars disagree, and the other story is part of it
     idea    — a shared idea, with no claim that one influenced the other
     cousin  — thematic similarity only; says so to the reader
   Inline citations use double square brackets around a source key, a pipe and a locator. */
const HISTORY_SOURCES = {
  pepys: { type: 'period text', cite: 'Pepys, Samuel. <em>The Diary of Samuel Pepys</em>, ed. Henry B. Wheatley, trans. of the shorthand by Mynors Bright. Project Gutenberg eBook #4200.', url: 'https://www.gutenberg.org/ebooks/4200' },
  britFire: { type: 'reference work', cite: '“Great Fire of London.” <em>Encyclopaedia Britannica</em>.', url: 'https://www.britannica.com/event/Great-Fire-of-London' },
  seneca: { type: 'period text', cite: 'Seneca. <em>Moral Letters to Lucilius</em>, Letter 56, trans. Richard Mott Gummere. Wikisource.', url: 'https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_56' },
  britSeneca: { type: 'reference work', cite: '“Seneca.” <em>Encyclopaedia Britannica</em>.', url: 'https://www.britannica.com/biography/Lucius-Annaeus-Seneca-Roman-philosopher-and-statesman' },
  johns: { type: 'period text', cite: '<em>The Oldest Code of Laws in the World: The Code of Laws Promulgated by Hammurabi</em>, trans. C. H. W. Johns. Project Gutenberg eBook #17150.', url: 'https://www.gutenberg.org/ebooks/17150' },
  king: { type: 'period text', cite: '<em>The Code of Hammurabi</em>, trans. L. W. King. The Avalon Project, Yale Law School.', url: 'https://avalon.law.yale.edu/ancient/hamcode.asp' },
  britHam: { type: 'reference work', cite: '“Code of Hammurabi.” <em>Encyclopaedia Britannica</em>.', url: 'https://www.britannica.com/topic/Code-of-Hammurabi' },
  babur: { type: 'period text', cite: 'Bābur. <em>The Bābur-nāma in English (Memoirs of Bābur)</em>, trans. Annette Susannah Beveridge. Project Gutenberg eBook #44608.', url: 'https://www.gutenberg.org/ebooks/44608' },
  britBabur: { type: 'reference work', cite: '“Babur.” <em>Encyclopaedia Britannica</em>.', url: 'https://www.britannica.com/biography/Babur' },
  bernal: { type: 'period text', cite: 'Díaz del Castillo, Bernal. <em>The Memoirs of the Conquistador Bernal Diaz del Castillo</em>, vol. 1, trans. John Ingram Lockhart. Project Gutenberg eBook #32474.', url: 'https://www.gutenberg.org/ebooks/32474' },
  britTlat: { type: 'reference work', cite: '“Tlatelolco.” <em>Encyclopaedia Britannica</em>.', url: 'https://www.britannica.com/place/Tlatelolco' },
  park: { type: 'period text', cite: 'Park, Mungo. <em>Travels in the Interior of Africa</em>, vol. 1. Project Gutenberg eBook #5266.', url: 'https://www.gutenberg.org/ebooks/5266' },
  britPark: { type: 'reference work', cite: '“Mungo Park.” <em>Encyclopaedia Britannica</em>.', url: 'https://www.britannica.com/biography/Mungo-Park' },
  zitkala: { type: 'period text', cite: 'Zitkala-Ša. <em>American Indian Stories</em> (1921). Project Gutenberg eBook #10376.', url: 'https://www.gutenberg.org/ebooks/10376' },
  npsZitkala: { type: 'archive or museum', cite: '“Zitkála-Šá.” US National Park Service.', url: 'https://www.nps.gov/people/zitkala-sa.htm' },
  herodotus: { type: 'period text', cite: 'Herodotus. <em>The History of Herodotus</em>, vol. 1, trans. G. C. Macaulay. Project Gutenberg eBook #2707.', url: 'https://www.gutenberg.org/ebooks/2707' },
  montagu: { type: 'period text', cite: 'Montagu, Lady Mary Wortley. <em>Letters of the Right Honourable Lady M—y W—y M—e</em>. Project Gutenberg eBook #17520.', url: 'https://www.gutenberg.org/ebooks/17520' },
  riedel: { type: 'scholarly article', cite: 'Riedel, S. (2005). Edward Jenner and the history of smallpox and vaccination. <em>Baylor University Medical Center Proceedings, 18</em>(1), 21–25.', url: 'https://doi.org/10.1080/08998280.2005.11928028' },
  thucydides: { type: 'period text', cite: 'Thucydides. <em>The History of the Peloponnesian War</em>, trans. Richard Crawley. Project Gutenberg eBook #7142.', url: 'https://www.gutenberg.org/ebooks/7142' },
  shapiro: { type: 'scholarly article', cite: 'Shapiro, B., Rambaut, A., & Gilbert, M. T. P. (2006). No proof that typhoid caused the Plague of Athens (a reply to Papagrigorakis et al.). <em>International Journal of Infectious Diseases, 10</em>(4), 334–335.', url: 'https://doi.org/10.1016/j.ijid.2006.02.006' },
  hooke: { type: 'period text', cite: 'Hooke, Robert. <em>Micrographia</em> (1665). Project Gutenberg eBook #15491.', url: 'https://www.gutenberg.org/ebooks/15491' },
  britHooke: { type: 'reference work', cite: '“Robert Hooke.” <em>Encyclopaedia Britannica</em>.', url: 'https://www.britannica.com/biography/Robert-Hooke' },
  galileo: { type: 'period text', cite: 'Galilei, Galileo. <em>The Sidereal Messenger</em>, trans. Edward Stafford Carlos. Project Gutenberg eBook #46036.', url: 'https://www.gutenberg.org/ebooks/46036' },
  sepGalileo: { type: 'scholarly encyclopedia', cite: 'Machamer, Peter, and David Marshall Miller. “Galileo Galilei.” <em>The Stanford Encyclopedia of Philosophy</em>.', url: 'https://plato.stanford.edu/entries/galileo/' },
  snow: { type: 'period text', cite: 'Snow, John. <em>On the Mode of Communication of Cholera</em>, 2nd ed. (1855). Project Gutenberg eBook #72894.', url: 'https://www.gutenberg.org/ebooks/72894' },
  shiode: { type: 'scholarly article', cite: 'Shiode, N., Shiode, S., Rod-Thatcher, E., Rana, S., & Vinten-Johansen, P. (2015). The mortality rates and the space-time patterns of John Snow’s cholera epidemic map. <em>International Journal of Health Geographics, 14</em>, 21.', url: 'https://doi.org/10.1186/s12942-015-0011-y' },
  mackay: { type: 'period text', cite: 'Mackay, Charles. <em>Memoirs of Extraordinary Popular Delusions and the Madness of Crowds</em>. Project Gutenberg eBook #24518.', url: 'https://www.gutenberg.org/ebooks/24518' },
  britTulip: { type: 'reference work', cite: 'Ashburn, Doug. “Tulip Mania.” <em>Britannica Money</em>.', url: 'https://www.britannica.com/money/Tulip-Mania' },
  mcclure: { type: 'scholarly article', cite: 'McClure, J. E., & Thomas, D. C. (2017). Explaining the timing of tulipmania’s boom and bust: Historical context, sequestered capital and market signals. <em>Financial History Review, 24</em>(2), 121–141. (Abstract read.)', url: 'https://doi.org/10.1017/s0968565017000154' },
  faxian: { type: 'period text', cite: 'Faxian (Fâ-Hien). <em>A Record of Buddhistic Kingdoms</em>, trans. James Legge. Project Gutenberg eBook #2124.', url: 'https://www.gutenberg.org/ebooks/2124' },
  britFaxian: { type: 'reference work', cite: '“Faxian.” <em>Encyclopaedia Britannica</em>.', url: 'https://www.britannica.com/biography/Faxian' },
  rousseau: { type: 'period text', cite: 'Rousseau, Jean-Jacques. <em>The Confessions of Jean Jacques Rousseau</em>, Book VI. Project Gutenberg eBook #3913.', url: 'https://www.gutenberg.org/ebooks/3913' },
  britCake: { type: 'reference work', cite: 'Cunningham, John M. “Did Marie-Antoinette Really Say ‘Let Them Eat Cake’?” <em>Encyclopaedia Britannica</em>.', url: 'https://www.britannica.com/story/did-marie-antoinette-really-say-let-them-eat-cake' },
  procopius: { type: 'period text', cite: 'Procopius. <em>History of the Wars, Books I and II</em>, trans. H. B. Dewing. Project Gutenberg eBook #16764.', url: 'https://www.gutenberg.org/ebooks/16764' },
  harbeck: { type: 'scholarly article', cite: 'Harbeck, M., Seifert, L., Hänsch, S., Wagner, D. M., Birdsell, D., Parise, K. L., Wiechmann, I., Grupe, G., et al. (2013). <em>Yersinia pestis</em> DNA from skeletal remains from the 6th century AD reveals insights into Justinianic Plague. <em>PLoS Pathogens, 9</em>(5), e1003349. (Abstract read.)', url: 'https://doi.org/10.1371/journal.ppat.1003349' },
  mordechai: { type: 'scholarly article', cite: 'Mordechai, L., Eisenberg, M., Newfield, T. P., Izdebski, A., Kay, J. E., & Poinar, H. (2019). The Justinianic Plague: An inconsequential pandemic? <em>Proceedings of the National Academy of Sciences, 116</em>(51), 25546–25554. (Abstract read.)', url: 'https://doi.org/10.1073/pnas.1903797116' },
  meier: { type: 'scholarly article', cite: 'Meier, M. (2020). The ‘Justinianic Plague’: An “inconsequential pandemic”? A reply. <em>Medizinhistorisches Journal, 55</em>(2), 172–. (Listing only; not read.)', url: 'https://doi.org/10.25162/mhj-2020-0006' },
  polo: { type: 'period text', cite: 'Polo, Marco. <em>The Travels of Marco Polo</em>, vol. 1, trans. Sir Henry Yule. Project Gutenberg eBook #10636.', url: 'https://www.gutenberg.org/ebooks/10636' },
  britPolo: { type: 'reference work', cite: '“Marco Polo.” <em>Encyclopaedia Britannica</em>.', url: 'https://www.britannica.com/biography/Marco-Polo' },
  vogelReview: { type: 'scholarly review', cite: 'Review of Hans Ulrich Vogel, <em>Marco Polo Was in China: New Evidence from Currencies, Salts and Revenues</em>. <em>Reviews in History</em>, no. 1667 (2014).', url: 'https://reviews.history.ac.uk/review/1667' },
  wells: { type: 'period text', cite: 'Wells, Ida B. <em>Southern Horrors: Lynch Law in All Its Phases</em> (1892). Project Gutenberg eBook #14975.', url: 'https://www.gutenberg.org/ebooks/14975' },
  britWells: { type: 'reference work', cite: '“Ida B. Wells.” <em>Encyclopaedia Britannica</em>.', url: 'https://www.britannica.com/biography/Ida-B-Wells' },
  jacobs: { type: 'period text', cite: 'Jacobs, Harriet. <em>Incidents in the Life of a Slave Girl, Written by Herself</em> (1861). Project Gutenberg eBook #11030.', url: 'https://www.gutenberg.org/ebooks/11030' },
  docJacobs: { type: 'university archive', cite: 'Summary of <em>Incidents in the Life of a Slave Girl</em>. Documenting the American South, University of North Carolina at Chapel Hill.', url: 'https://docsouth.unc.edu/fpn/jacobs/summary.html' },
  lascasas: { type: 'period text', cite: 'Las Casas, Bartolomé de. <em>A Brief Account of the Destruction of the Indies</em>. Project Gutenberg eBook #20321.', url: 'https://www.gutenberg.org/ebooks/20321' },
  britCasas: { type: 'reference work', cite: '“Bartolomé de Las Casas.” <em>Encyclopaedia Britannica</em>.', url: 'https://www.britannica.com/biography/Bartolome-de-Las-Casas' },
  seacole: { type: 'period text', cite: 'Seacole, Mary. <em>Wonderful Adventures of Mrs. Seacole in Many Lands</em>. Project Gutenberg eBook #23031.', url: 'https://www.gutenberg.org/ebooks/23031' },
  britSeacole: { type: 'reference work', cite: '“Mary Seacole.” <em>Encyclopaedia Britannica</em>.', url: 'https://www.britannica.com/biography/Mary-Seacole' },
  prince: { type: 'period text', cite: 'Prince, Mary. <em>The History of Mary Prince, a West Indian Slave, Related by Herself</em> (1831). Project Gutenberg eBook #17851.', url: 'https://www.gutenberg.org/ebooks/17851' },
  docPrince: { type: 'university archive', cite: 'Summary of <em>The History of Mary Prince</em>. Documenting the American South, University of North Carolina at Chapel Hill.', url: 'https://docsouth.unc.edu/neh/prince/summary.html' }
};
const G = n => `https://www.gutenberg.org/cache/epub/${n}/pg${n}.txt`;

const HISTORY_DISCOVERIES = [
// ------------------------------------------------------------------ everyday life
{ id: 'pepys-cheese', cat: 'everyday', when: 'london, 1666', context: 'reference', main: 'pepys',
  head: 'as london burned, samuel pepys buried his parmesan',
  card: 'On 4 September 1666, with the Great Fire closing in, the naval administrator Samuel Pepys and his neighbour Sir William Penn dug a pit in the garden for their wine. Pepys added his parmesan. It’s one of history’s great diary moments: a catastrophe that destroyed some 13,000 houses, recorded by a man deciding, with a shovel in his hand, what he could not bear to lose.',
  story: [
    'The Great Fire began on Sunday 2 September 1666 in the house of the king’s baker in Pudding Lane, and went on to destroy most of the City’s civic buildings, old St Paul’s, 87 parish churches and about 13,000 houses [[britFire]].',
    'Pepys’s diary is one reason it feels so close. By the Tuesday, carts and goods fill the streets, and his colleagues are improvising. Sir William Batten buries his wine. Pepys uses the same pit for office papers he can’t otherwise save, and then in the evening comes the immortal line below [[pepys|4 September 1666]].',
    'What makes the moment work is the order of priorities: the office papers, the wine, the cheese. He doesn’t tell us it’s funny, and he may not have thought so. Cheese like that was evidently worth a hole in the ground to him.'
  ],
  excerpt: { text: 'And in the evening Sir W. Pen and I did dig another, and put our wine in it; and I my Parmazan cheese, as well as my wine and some other things.', work: 'The Diary of Samuel Pepys', by: 'Samuel Pepys', written: '4 September 1666', locator: 'diary entry, 4 September 1666', source: 'pepys', textUrl: G(4200) },
  links: [['seneca-bathhouse', 'cousin', 'Another writer who lets daily irritation and appetite into the record, sixteen centuries earlier.'], ['babur-melon', 'idea', 'Food as the thing a powerful man can’t stop thinking about, at the worst possible time.'], ['hooke-flea', 'cousin', 'The same London, a year earlier: a book Pepys’s contemporaries could buy, showing a flea enormous.']] },

{ id: 'seneca-bathhouse', cat: 'everyday', when: 'rome, 1st century', context: 'reference', main: 'seneca',
  head: 'a stoic philosopher lived above a gym, and complained about the grunting',
  card: 'Seneca, Rome’s leading intellectual, set out to prove in a letter that a wise person can ignore noise. So he described his lodgings over a bathhouse: weightlifters grunting, the slap of the masseur, a pickpocket being caught. The racket, he insists, means no more to him than falling water. Then, in the very last lines, he admits he’s moving out.',
  story: [
    'Seneca was Rome’s leading intellectual figure in the mid-first century CE, and his <em>Moral Letters to Lucilius</em> are 124 essays on how to live [[britSeneca]]. Letter 56 is meant to teach that real quiet comes from within. Its accidental gift is one of the best descriptions of Roman everyday noise anywhere.',
    'He catalogues it with suspicious relish: the weight-trainer’s wheezing, the rubdown’s slap, varying “according as the hand is laid on flat or hollow”, someone shouting the score, a pickpocket’s arrest [[seneca|§§1–2]]. “I assure you that this racket means no more to me than the sound of waves or falling water,” he says [[seneca|§3]].',
    'Then the ending. Isn’t it simpler just to avoid the uproar, you ask? “I admit this. Accordingly, I shall change from my present quarters.” He had merely wished to test himself, he explains [[seneca|§15]]. I find this hugely reassuring.'
  ],
  excerpt: { text: 'I have lodgings right over a bathing establishment. So picture to yourself the assortment of sounds, which are strong enough to make me hate my very powers of hearing! When your strenuous gentleman, for example, is exercising himself by flourishing leaden weights; when he is working hard, or else pretends to be working hard, I can hear him grunt;', work: 'Moral Letters to Lucilius, Letter 56', by: 'Seneca', translator: 'Richard Mott Gummere', written: 'c. 1st century CE', locator: 'Letter 56, §1', source: 'seneca', textUrl: 'https://en.wikisource.org/w/api.php?action=parse&page=Moral_letters_to_Lucilius/Letter_56&prop=text&format=json' },
  links: [['pepys-cheese', 'cousin', 'Another private voice that makes a distant city suddenly audible.'], ['tavern-laws', 'cousin', 'Everyday urban life, far older, seen through a law code rather than a letter.']] },

{ id: 'tavern-laws', cat: 'everyday', when: 'babylon, c. 1750 bce', context: 'reference', main: 'johns',
  head: 'nearly 4,000 years ago, the law had opinions about the woman who ran the bar',
  card: 'The Code of Hammurabi, with its 282 case laws, is famous for an eye for an eye. Less famous are its rules for wine merchants, who the wording makes clear were women. Overcharging could get one thrown in the water. Failing to report rioters in her house could mean death. Read closely, these harsh lines show a world of drinking houses, price disputes and plotting in back rooms.',
  story: [
    'Hammurabi’s code was collected near the end of his reign (1792–1750 BCE) and carved on a diorite stela set up in Babylon’s temple of Marduk. Its 282 case laws cover prices, trade, marriage, assault, slavery and debt [[britHam]].',
    'Sections 108–111 turn to drink. They’re surprisingly vivid: a seller who takes silver and undercuts the price of corn, “rioters” gathered in her house, and a rule forbidding certain religious women from entering a wine shop at all [[johns|§§108–110]].',
    'Translation matters here. C. H. W. Johns calls her a “wine merchant”, while L. W. King’s version says “tavern-keeper (feminine)” and describes “conspirators” rather than rioters [[king|§§108–109]]. Either way, the grammar’s gender is doing historical work: it tells us who was expected to be behind the counter.',
    'A caution, too: a law tells you what rulers wanted or feared, not necessarily what happened on any given evening. We shouldn’t assume women were routinely drowned over bar tabs.'
  ],
  excerpt: { text: 'If a wine merchant has collected a riotous assembly in her house and has not seized those rioters and driven them to the palace, that wine merchant shall be put to death.', work: 'The Code of Hammurabi', by: 'attributed to King Hammurabi of Babylon', translator: 'C. H. W. Johns', written: 'c. 18th century BCE', locator: 'section 109', source: 'johns', textUrl: G(17150) },
  links: [['seneca-bathhouse', 'cousin', 'A drinking and bathing culture 1,800 years later, seen from the room upstairs.'], ['paper-money', 'cousin', 'A very different state trying to control prices and money.']] },

{ id: 'babur-melon', cat: 'everyday', when: 'india, 1520s', context: 'reference', main: 'babur',
  head: 'the emperor who conquered northern india cried over a melon',
  card: 'Babur, descendant of Timur and Genghis Khan, founded the Mughal dynasty. He also wrote one of the most personal memoirs any ruler has left us. In India, homesick for Central Asia, he quotes a letter he wrote about how impossible it was to forget “the permitted flavours of melons and grapes”. When someone brought him a melon, he reported, cutting and eating it left him “all tears”.',
  story: [
    'Babur (1483–1530) was born in Fergana, in today’s Uzbekistan, and became emperor and founder of the Mughal dynasty of northern India. Britannica’s description of him as “a poet and diarist of genius” alongside “a soldier of distinction” is a fair warning about what you’ll find in the memoir [[britBabur]].',
    'Melons run all the way through. Early on, he is boasting about the ones from Akhsī, which he says outclassed Bukhārā’s famous fruit when he compared them at a party [[babur|Fol. 5]]. Decades later, in a letter from India, the same fruit undoes him [[babur|near Fol. 359b]].',
    'It’s funny, until you notice what surrounds it. In that passage he is talking about having “repented and vowed to sin no more”, and the “permitted” flavours are the pleasures left to him. A conqueror is writing home to say that he’s lost something, and a melon is how it comes out.'
  ],
  excerpt: { text: 'How should he banish from his mind the permitted flavours of melons and grapes? Taking this opportunity, a melon was brought to me; to cut and eat it affected me strangely; I was all tears!', work: 'The Bābur-nāma', by: 'Babur', translator: 'Annette Susannah Beveridge', written: 'early 16th century', locator: 'a letter quoted in the memoir, before Fol. 359b', source: 'babur', textUrl: G(44608) },
  links: [['pepys-cheese', 'idea', 'Another person whose diary reveals that food can matter wildly at a moment of crisis.'], ['faxian-desert', 'cousin', 'Another traveller across Asia, a thousand years earlier, also a long way from home.'], ['paper-money', 'cousin', 'Babur’s ancestor Genghis Khan’s line ran the empire that Marco Polo described.']] },

{ id: 'aztec-market', cat: 'everyday', when: 'mexico, 1519', context: 'reference', main: 'bernal',
  head: 'the soldiers who invaded tenochtitlan stopped to gawp at the market',
  card: 'Bernal Díaz, a soldier with Cortés, tried to list what was on sale in the great Mexica market and gave up: “I should not so easily get to the end.” Paper, scented salves, tobacco tubes, salt, flint knives, and an edible lake scum he compared to cheese. There were even judges and constables inspecting the goods. It is an invader’s view, but a startled one.',
  story: [
    'Spanish reports said the market at Tlatelolco, in the Aztec capital, drew 60,000 buyers and sellers on its main day, with huge canoe traffic moving goods across the lake [[britTlat]]. Those are the conquerors’ figures, so treat them as an impression of scale rather than a count.',
    'Bernal Díaz’s catalogue is what’s most striking. He’s a soldier in an invading army, and what he notices is commerce and regulation: “courts of justice” with three judges and constables to inspect the wares [[bernal|market chapter]].',
    'He’s in no way a neutral witness. This same book comes from the army that went on to destroy the city it admires. But it is hard to read this passage and keep hold of any idea that the Spanish were bringing organised economic life to a place that lacked it.'
  ],
  excerpt: { text: 'If I had to enumerate everything singly, I should not so easily get to the end. And yet I have not mentioned the paper, which in this country is called amatl; the tubes filled with liquid amber and tobacco; the various sweet-scented salves, and similar things; nor the various seeds which were exposed for sale in the porticoes of this market, nor the medicinal herbs.', work: 'The Memoirs of the Conquistador Bernal Diaz del Castillo', by: 'Bernal Díaz del Castillo', translator: 'John Ingram Lockhart', written: 'describing 1519', locator: 'vol. 1, on the great market', source: 'bernal', textUrl: G(32474) },
  links: [['las-casas', 'same', 'The same conquest as seen by a Spaniard who thought it was a catastrophe and said so.'], ['paper-money', 'idea', 'Another European astonished by the workings of an economy far from home.'], ['tavern-laws', 'cousin', 'Another old society’s attempt to police what happened at the point of sale.']] },

{ id: 'pity-white-man', cat: 'everyday', when: 'west africa, 1796', context: 'reference', main: 'park',
  head: 'african women took in a lost explorer, and made up a song about him',
  card: 'In 1796 the Scottish explorer Mungo Park, exhausted near the Niger, was taken in by a woman who fed him, while others spun cotton late into the night. They sang as they worked, making up a song about him on the spot. Its chorus: “Let us pity the white man, no mother has he.” The explorer narrative is his. For a moment, though, he’s the one being described.',
  story: [
    'Park set out from the Gambia River in 1795 with backing from the African Association, hoping to trace the Niger. He was imprisoned for four months, escaped in July 1796 with little more than a horse and a compass, and reached the Niger at Ségou that month [[britPark]].',
    'The passage comes from that stretch of the trip. A woman takes him in, and her household resumes spinning. They “lightened their labour by songs, one of which was composed extempore, for I was myself the subject of it” [[park|vol. 1]].',
    'We have this only through Park, “literally translated”, in a book written for British readers. So we can’t hear these women except through him. But the scene turns the usual gaze around. The explorer who came to describe Africa is here a poor, faint man without family, an object of practical sympathy. He admits he couldn’t sleep for feeling it.'
  ],
  excerpt: { text: '“The winds roared, and the rains fell. The poor white man, faint and weary, came and sat under our tree. He has no mother to bring him milk, no wife to grind his corn. Chorus.—Let us pity the white man, no mother has he,”', work: 'Travels in the Interior of Africa', by: 'Mungo Park, recording a song by women he does not name', written: 'describing 1796', locator: 'vol. 1', source: 'park', textUrl: G(5266) },
  links: [['faxian-desert', 'cousin', 'Another traveller writing down what he depended on in a dangerous crossing.'], ['equiano-birthplace', 'cousin', 'West Africa and Britain, in the same decade, with the narrator from the other side.'], ['mother-seacole', 'idea', 'Another story about who cares for strangers, and who gets written down doing it.']] },

{ id: 'zitkala-hair', cat: 'everyday', when: 'indiana, 1880s', context: 'reference', main: 'zitkala',
  head: 'an eight-year-old’s first day at boarding school, in her own words',
  card: 'Zitkala-Ša, a Yankton Dakota girl, was eight when missionaries took her to a school in Indiana. Decades later she recalled the first day: eating by the bell, a friend’s warning that they would cut their long hair. Among her people, only captives, mourners and cowards had short hair. “We have to submit, because they are strong,” said her friend. “No, I will not submit!” she answered.',
  story: [
    'Zitkala-Ša, “Red Bird”, was born on the Yankton reservation in South Dakota in 1876. Quaker missionaries took her and other children to White’s Indiana Manual Labor Institute when she was eight, against her mother’s wishes, and gave her the name Gertrude Simmons. She later wrote both of her joy in reading, writing and the violin, and of her conflict about the experience [[npsZitkala]].',
    'The account in <em>American Indian Stories</em> is told through small things: moccasins on the floor, a blanket stripped from her shoulders, the shock of a dining room that runs on a bell [[zitkala|School Days]].',
    'What gives the haircut its force is what it meant. It wasn’t about looks, but about capture and shame [[zitkala|School Days]]. This is memoir, shaped by an adult writer and activist years later. But that’s also why it matters: a child taken into a system built to change her grew up to describe that system in English, on her own terms.'
  ],
  excerpt: { text: 'Our mothers had taught us that only unskilled warriors who were captured had their hair shingled by the enemy. Among our people, short hair was worn by mourners, and shingled hair by cowards! We discussed our fate some moments, and when Judéwin said, "We have to submit, because they are strong," I rebelled. "No, I will not submit! I will struggle first!" I answered.', work: 'American Indian Stories', by: 'Zitkala-Ša', written: 'published 1921; describing the 1880s', locator: '“The School Days of an Indian Girl”', source: 'zitkala', textUrl: G(10376) },
  links: [['garret', 'idea', 'Another first-person account written by someone a whole system meant to silence.'], ['equiano-birthplace', 'idea', 'Another life story written across a cultural line, and read as evidence ever since.']] },

// ------------------------------------------------------------------ ideas and science
{ id: 'bekos', cat: 'ideas', when: 'egypt, as told c. 5th century bce', context: 'text', main: 'herodotus',
  head: 'a pharaoh raised two babies in silence to discover the first language',
  card: 'Herodotus reports that the Egyptian king Psammetichos gave two newborns to a shepherd, with orders that nobody speak near them, to hear what they would say first. After two years, both said “bekos”. It turned out to be Phrygian for bread, so the Egyptians conceded the Phrygians were older. It has a setup, an outcome and a flawed inference, and it may never have happened.',
  story: [
    'The setup is unnervingly modern. Two newborn children, raised by a shepherd, fed on goats’ milk, with no one to speak a word in their presence. The king wants to know what word they’ll produce once they’ve “ceased from wailings without sense” [[herodotus|Book 2, §2]].',
    'After two years they beg the shepherd, saying “bekos”. Psammetichos makes inquiries and finds that the Phrygians use the word for bread. And so, says Herodotus, the Egyptians accepted that the Phrygians were an older people than themselves [[herodotus|Book 2, §2]].',
    'You can’t know how much of this is true, and Herodotus himself is careful to say where he got it: “from the priests” at Memphis. He even adds that the Greeks tell “idle tales” of a nastier version, with women whose tongues had been cut out [[herodotus|Book 2, §§2–3]].',
    'As an anecdote it is a lovely lesson in bad inference. Two children hear a shepherd and goats, and “bekos” sounds suspiciously like an imitation of a bleat, but that’s my own suspicion rather than Herodotus’s. It tells us more about the question than the answer. People have been asking how language begins for a very long time.'
  ],
  excerpt: { text: 'after a space of two years had gone by, during which the shepherd went on acting so, at length, when he opened the door and entered, both the children fell before him in entreaty and uttered the word bekos, stretching forth their hands.', work: 'The History of Herodotus', by: 'Herodotus', translator: 'G. C. Macaulay', written: 'c. 5th century BCE', locator: 'Book 2, §2', source: 'herodotus', textUrl: G(2707) },
  links: [['never-twice', 'cousin', 'Another Greek writer watching carefully, and drawing a far better inference.'], ['jupiter-moons', 'idea', 'From a story about an experiment to a real observation, carefully logged night after night.']] },

{ id: 'ingrafting', cat: 'ideas', when: 'ottoman istanbul, 1717', context: 'scholarly', main: 'montagu',
  head: 'england learned about smallpox inoculation from a letter about old women in turkey',
  card: 'In 1717 Lady Mary Wortley Montagu, scarred by smallpox herself, wrote home from Istanbul about “ingrafting”: parties of neighbours, old women with nutshells of pox matter, needles in veins. Decades before Jenner, she had her son inoculated in Ottoman territory, and in 1721 had her daughter inoculated in London, in front of court physicians. A key medical practice reached England through women’s networks in a Muslim empire.',
  story: [
    'Lady Mary had smallpox in 1715, which disfigured her, and her 20-year-old brother died of it. When her husband became ambassador, she saw how the procedure was done in Istanbul, and wrote to a friend about it [[riedel|Variolation]].',
    'Her letter reads like reportage. “A set of old women” make it their business, every autumn. People form parties for it, “commonly fifteen or sixteen together” [[montagu|letter on the small-pox]].',
    'She then acted on it. The embassy surgeon, Charles Maitland, inoculated her five-year-old son in March 1718. In April 1721, back in London, her four-year-old daughter was inoculated before physicians of the royal court, and that August a trial followed on six Newgate prisoners [[riedel|Variolation]].',
    'Variolation was risky, and it isn’t the same thing as Jenner’s vaccine. But this is a case where a practical medical idea moved through people official history usually skips: Ottoman women, a British aristocrat, and the bodies of prisoners.'
  ],
  excerpt: { text: 'The small-pox, so fatal, and so general amongst us, is here entirely harmless, by the invention of ingrafting, which is the term they give it. There is a set of old women, who make it their business to perform the operation, every autumn, in the month of September, when the great heat is abated.', work: 'Letters of Lady Mary Wortley Montagu', by: 'Lady Mary Wortley Montagu', written: 'c. 1717', locator: 'letter on smallpox from the Ottoman Empire', source: 'montagu', textUrl: G(17520) },
  links: [['pump-handle', 'cousin', 'Another moment in public health where the record is messier than the legend.'], ['mother-seacole', 'idea', 'Another woman’s medical knowledge, crossing cultures and doubted by official institutions.'], ['never-twice', 'idea', 'Twenty-one centuries earlier, Thucydides noticed the thing inoculation relies on: that survivors could be safe.']] },

{ id: 'never-twice', cat: 'ideas', when: 'athens, 430 bce', context: 'scholarly', main: 'thucydides',
  head: 'in a plague 2,400 years ago, thucydides noticed something like immunity',
  card: 'Describing the plague that hit Athens during its war with Sparta, Thucydides made a striking observation: those who recovered tended the sick, for “the same man was never attacked twice—never at least fatally.” He also saw the survivors’ giddy hope that they’d be safe from everything else. What disease it was remains unsettled, and a 2006 DNA claim for typhoid was promptly challenged. His eye for detail outlasts the dispute.',
  story: [
    'Thucydides’ account of the Athenian plague, in Book 2 of his history, is among the most famous disease descriptions from the ancient world. In this passage he is interested in behaviour as well as symptoms. Fear keeps people from caring for the dying, and those who’ve recovered show the most compassion, because “these knew what it was from experience, and had now no fear for themselves” [[thucydides|Book 2]].',
    'He then adds a wonderful psychological note: survivors half hoped they were now “safe from any disease whatsoever” [[thucydides|Book 2]]. He is describing an accurate observation next to an overconfident belief about it.',
    'As for what the disease was, Shapiro, Rambaut and Gilbert describe its cause as a hotly debated topic. They were writing in reply to a DNA study that had implicated typhoid, and their title gives away their view: “No proof” [[shapiro|p. 334]]. I would treat any confident diagnosis with caution.'
  ],
  excerpt: { text: 'Yet it was with those who had recovered from the disease that the sick and the dying found most compassion. These knew what it was from experience, and had now no fear for themselves; for the same man was never attacked twice—never at least fatally.', work: 'The History of the Peloponnesian War', by: 'Thucydides', translator: 'Richard Crawley', written: 'late 5th century BCE, describing 430 BCE', locator: 'Book 2', source: 'thucydides', textUrl: G(7142) },
  links: [['justinian-plague', 'cousin', 'Another plague, another classic description, and a much sharper modern fight about what it did.'], ['ingrafting', 'idea', 'The practice that puts this observation to work.'], ['bekos', 'cousin', 'A Greek historian only a generation earlier, with a much looser attitude to evidence.']] },

{ id: 'hooke-flea', cat: 'ideas', when: 'london, 1665', context: 'reference', main: 'hooke',
  head: 'robert hooke looked at a flea and found it beautiful',
  card: 'Robert Hooke’s Micrographia of 1665 gave readers cork cells, a gnat and, famously, an enormous flea. His entry begins not with disgust but with admiration: “The strength and beauty of this small creature, had it no other relation at all to man, would deserve a description.” It’s a rather wry line about an insect everyone in Restoration London knew far too well. The microscope changed what counted as worth looking at.',
  story: [
    '<em>Micrographia</em> appeared in 1665. Britannica notes drawings of cork’s cellular structure and a female gnat among its plates [[britHooke]]. Hooke was also a working astronomer, and one of the first to build a Gregorian reflecting telescope [[britHooke]].',
    'The flea’s observation opens by nodding at the joke: it has one rather well-known “relation to man”, but set that aside. Then he studies how its legs fold within one another, like a spring ready to release, as “the curious contrivance of its leggs and joints” [[hooke|Observ. LIII]].',
    'That’s a tiny piece of a large change. With a lens, a creature you’d once have just crushed becomes a piece of engineering, and a respectable object for a scientific book.'
  ],
  excerpt: { text: 'The strength and beauty of this small creature, had it no other relation at all to man, would deserve a description.', work: 'Micrographia', by: 'Robert Hooke', written: '1665', locator: 'Observ. LIII, “Of a Flea”', source: 'hooke', textUrl: G(15491) },
  links: [['jupiter-moons', 'idea', 'The same decades-long adventure with lenses, pointed at the sky rather than a flea.'], ['pepys-cheese', 'cousin', 'The London of the very next year, on fire.']] },

{ id: 'jupiter-moons', cat: 'ideas', when: 'padua, 1610', context: 'scholarly', main: 'galileo',
  head: 'galileo thought they were stars, then kept checking',
  card: 'On 7 January 1610, Galileo saw “three little stars” near Jupiter. He assumed they were fixed stars, but they sat oddly in a line, and they made him “somewhat wonder”. So he kept looking, night after night. They were moons. He then named them after the Medici, a move that helped win him a job in Florence. Science and career management, on the very same pages.',
  story: [
    'Galileo heard about the newly invented spyglass in 1609, built an improved one, and turned it upward. <em>Sidereus nuncius</em>, or <em>Starry Messenger</em>, appeared in March 1610 and launched him onto the world stage [[sepGalileo]].',
    'The charm of the book is that you can watch the idea change. On the first night he believes these are fixed stars, but something bothers him about the arrangement [[galileo|7 January]]. So the book becomes a log of positions, with little diagrams, night after night, into February [[galileo|observations]].',
    'It’s also a careful piece of self-promotion. He dedicates the moons to the ruling family of Tuscany, praising their “surpassing virtues”, and calling them “Medicean” stars helped secure his post as Chief Mathematician and Philosopher to the Grand Duke [[sepGalileo]] [[galileo|dedication]].'
  ],
  excerpt: { text: 'I noticed a circumstance which I had never been able to notice before, owing to want of power in my other telescope, namely, that three little stars, small but very bright, were near the planet; and although I believed them to belong to the number of the fixed stars, yet they made me somewhat wonder,', work: 'The Sidereal Messenger', by: 'Galileo Galilei', translator: 'Edward Stafford Carlos', written: '1610', locator: 'observations of 7 January 1610', source: 'galileo', textUrl: G(46036) },
  links: [['hooke-flea', 'idea', 'A generation later, lenses point down instead of up, and a similar wonder results.'], ['bekos', 'idea', 'An older attempt to answer a question by arranging an observation.']] },

{ id: 'pump-handle', cat: 'ideas', when: 'london, 1854', context: 'scholarly', main: 'snow',
  head: 'john snow did get the pump handle removed. it probably didn’t end the outbreak',
  card: 'It’s a founding legend of epidemiology. John Snow traces cholera to the Broad Street pump, the handle comes off, and the epidemic stops. Snow’s own account is plainer: “the handle of the pump was removed on the following day.” But deaths were already falling by 8 September, as Snow himself noted, and a 2015 analysis agrees that the peak had passed. His reasoning held up better than the story’s ending.',
  story: [
    'Snow met the Board of Guardians of St James’s parish on the evening of Thursday 7 September 1854 to argue that cases clustered among people who drank from the Broad Street well. The handle came off the next day [[snow|Broad Street section]].',
    'A dramatic ending would be nice. But Shiode and colleagues, mapping deaths in detail, write that removing the handle “did not immediately stop the outbreak”, while the epidemic’s peak had already subsided by then. And they note Snow himself observed that the daily number of fatal attacks was already much diminished by that date [[shiode|Results]].',
    'None of this makes Snow wrong. His case about water was a real achievement. It just means the removal of the handle wasn’t the moment a city was saved. Legends prefer a lever.'
  ],
  excerpt: { text: 'I had an interview with the Board of Guardians of St. James’s parish, on the evening of Thursday, 7th September, and represented the above circumstances to them. In consequence of what I said, the handle of the pump was removed on the following day.', work: 'On the Mode of Communication of Cholera', by: 'John Snow', written: '2nd edition, 1855', locator: 'on the Broad Street outbreak', source: 'snow', textUrl: G(72894) },
  links: [['ingrafting', 'cousin', 'Another public-health story with a tidier legend than record.'], ['let-them-eat', 'idea', 'History loves a single, memorable moment, whether or not it deserves one.'], ['mother-seacole', 'cousin', 'Mary Seacole also knew cholera first-hand, from an epidemic in Panama.']] },

{ id: 'tulip-sailor', cat: 'ideas', when: 'holland, 1630s, as told in 1841', context: 'reference', main: 'mackay',
  head: 'the sailor who ate a priceless tulip bulb with his herring',
  card: 'The best story from the Dutch tulip craze: a sailor mistakes a rare bulb for an onion and eats it with his breakfast herring. It comes from Charles Mackay’s popular 1841 book, and he credits an earlier traveller’s account. Today it’s how many people first hear of the bubble. It’s irresistible, but it’s an anecdote about the 1630s, printed long after, and worth enjoying as exactly that.',
  story: [
    'Britannica’s summary of the conventional account is what you’ve probably heard: rising bulb prices, speculation during 1633–37, trade in bulbs that never left the ground, and a crash in early 1637 that ruined ordinary families [[britTulip]].',
    'Mackay’s version gives this its comic set pieces. He attributes the sailor story to “Blainville’s Travels” [[mackay|The Tulipomania]]. So what we’re reading is a story in a popular Victorian book, about what a traveller reported, about a sailor in the previous century.',
    'Economists are still arguing about what the episode even was. McClure and Thomas, for instance, offer an explanation for the timing, tied to bulbs being planted out of sight in late 1636 [[mcclure|abstract]]. Anne Goldgar’s 2007 book <em>Tulipmania</em> is another place to look, but I haven’t read it, so I won’t summarise it.'
  ],
  excerpt: { text: 'The sailor had, it appears, a great partiality for onions, and seeing a bulb very like an onion lying upon the counter of this liberal trader, and thinking it, no doubt, very much out of its place among silks and velvets, he slily seized an opportunity and slipped it into his pocket, as a relish for his herring.', work: 'Memoirs of Extraordinary Popular Delusions and the Madness of Crowds', by: 'Charles Mackay', written: '1841, about the 1630s', locator: '“The Tulipomania”', source: 'mackay', textUrl: G(24518) },
  links: [['let-them-eat', 'idea', 'Another perfectly shaped anecdote that travels better than its evidence.'], ['paper-money', 'cousin', 'Another moment when the value of something depends on what everyone believes.']] },

{ id: 'faxian-desert', cat: 'ideas', when: 'china to india, c. 400', context: 'reference', main: 'faxian',
  head: 'a monk walked from china to india, navigating by dead men’s bones',
  card: 'Around 400 CE, the Chinese monk Faxian set off for India because China’s copies of the Buddhist monastic rules were incomplete. His guide to crossing the desert is chilling: no bird above, no animal below, “the only mark and indication being the dry bones of the dead.” A library problem sent him across Asia, and his account now preserves details about Indian Buddhism that are found nowhere else.',
  story: [
    'Faxian’s reason for going is what I love about this. He had been living in Chang’an, and “deploring the mutilated and imperfect state” of the books of monastic discipline, he set out to find better copies [[faxian|ch. 1]].',
    'His <em>Record of Buddhist Kingdoms</em> survives as a major source. According to Britannica, his fairly detailed descriptions make it possible to envision Buddhist India before later conquests, and he translated many of the texts he brought back [[britFaxian]].',
    'Pilgrim accounts aren’t neutral travel writing; he wants to see holy sites, and he sees them. But the desert passage is as plain as a warning sign, and a useful corrective to imagining ancient Asia as a set of separate worlds. People crossed all this, at a terrifying cost, for a more accurate text.'
  ],
  excerpt: { text: 'There is not a bird to be seen in the air above, nor an animal on the ground below. Though you look all round most earnestly to find where you can cross, you know not where to make your choice, the only mark and indication being the dry bones of the dead', work: 'A Record of Buddhistic Kingdoms', by: 'Faxian', translator: 'James Legge', written: 'early 5th century CE', locator: 'chapter 1', source: 'faxian', textUrl: G(2124) },
  links: [['paper-money', 'cousin', 'Another traveller’s account of Asia that has had to prove itself to historians.'], ['babur-melon', 'cousin', 'Another long way from home, with a different ache.'], ['pity-white-man', 'cousin', 'A very different traveller’s account of depending on people and places he didn’t know.']] },

// ------------------------------------------------------------------ power and politics
{ id: 'let-them-eat', cat: 'power', when: 'france, 1760s', context: 'reference', main: 'rousseau',
  head: 'marie antoinette almost certainly never said it. rousseau wrote it down when she was a child',
  card: '“Let them eat cake” appears in Rousseau’s Confessions, attributed to “a great princess”, in a book written about 1767. Marie Antoinette was still a child then, so she’s unlikely to be who he meant. Similar stories have been found elsewhere, including a 16th-century German one. The line was likely already old. It stuck to her because it fit what people wanted to believe.',
  story: [
    'In Book VI of the <em>Confessions</em>, Rousseau wants bread to go with his wine, decides that “a fine gentleman, with a sword at his side” can’t walk into a baker’s, and remembers the “thoughtless saying of a great princess” [[rousseau|Book VI]]. It’s an aside about his own awkwardness, not an attack on anyone.',
    'He wrote it about 1767, according to Britannica, when Marie Antoinette was a child. Similar tales exist in other places, such as a German noblewoman in the 16th century wondering why the hungry poor don’t eat a sweet bread [[britCake]].',
    'Translations disguise a bit of the story. This English version says “pastry”, where the French printed phrase is “Qu’ils mangent de la brioche” [[britCake]]. And it’s been suggested that revolutionaries pinned it on her as propaganda, though Britannica’s phrasing, “has sometimes been supposed”, rightly leaves that open [[britCake]].'
  ],
  excerpt: { text: 'At length I recollected the thoughtless saying of a great princess, who, on being informed that the country people had no bread, replied, "Then let them eat pastry!"', work: 'The Confessions', by: 'Jean-Jacques Rousseau', written: 'c. 1767', locator: 'Book VI', source: 'rousseau', textUrl: G(3913) },
  links: [['tulip-sailor', 'idea', 'Another anecdote almost too perfectly built to be left alone.'], ['wollstonecraft-reply', 'cousin', 'France’s Revolution seen by someone arguing about it at the time.'], ['pump-handle', 'idea', 'Another neat ending that history has improved.']] },

{ id: 'justinian-plague', cat: 'power', when: 'byzantium, 541', context: 'scholarly', main: 'procopius',
  head: 'did the plague of justinian change the world? scholars are genuinely fighting about it',
  card: 'Procopius wrote that a plague nearly wiped out “the whole human race”. Ancient DNA has since confirmed that plague bacteria were involved. But in 2019 Lee Mordechai and colleagues argued that coinage, papyri, inscriptions, pollen and burials show continuity, not catastrophe, so the pandemic may have been far less consequential than claimed. A reply soon followed. It’s a useful fight: an awful disease and a contested historical effect are separate questions.',
  story: [
    'Procopius, who wrote with evident care about the disease, gives the plague of the 540s its apocalyptic reputation [[procopius|Book II]]. Debate about what caused it was largely settled when two independent ancient DNA labs confirmed <em>Yersinia pestis</em> in sixth-century skeletons [[harbeck|abstract]].',
    'The bigger question is what it did. Mordechai and colleagues test the claim that it killed tens of millions and helped to end antiquity. They examine written sources, legislation, coinage, papyri, inscriptions, pollen, DNA and mortuary archaeology, and argue that none supports a maximalist reading, while taken together they suggest continuity [[mordechai|abstract]].',
    'Others disagree. Mischa Meier published a reply in 2020, though I’ve only seen its listing, so I can’t tell you its argument [[meier]]. I read the abstracts of the two papers here, not the full articles, so treat this as a map of the argument rather than a verdict. An ancient writer’s “whole human race” is evidence of terror, not a mortality statistic.'
  ],
  excerpt: { text: 'During these times there was a pestilence, by which the whole human race came near to being annihilated.', work: 'History of the Wars', by: 'Procopius', translator: 'H. B. Dewing', written: '6th century CE', locator: 'Book II, on the pestilence of 540s', source: 'procopius', textUrl: G(16764) },
  links: [['never-twice', 'cousin', 'An earlier plague, a similar classic account, and its own modern DNA argument.'], ['pump-handle', 'idea', 'Another disease story where the effect turns out to be harder to pin down than the legend.']] },

{ id: 'paper-money', cat: 'power', when: 'yuan china, 1270s–90s', context: 'scholarly', main: 'polo',
  head: 'marco polo thought chinese paper money was basically alchemy',
  card: 'Marco Polo couldn’t get over it. The Great Khan, he reported, made money out of the inner bark of mulberry trees, in sheets cut to fixed sizes, “such that you might say he hath the Secret of Alchemy in perfection”. Skeptics have long questioned whether Polo even reached China. Yet Hans Ulrich Vogel has argued that details like these, on currency, salt and revenue, are supported by Chinese sources.',
  story: [
    'Polo dictated his book while a prisoner in Genoa, to the romance writer Rustichello of Pisa, which should warn you it’s not exactly a sober government report [[britPolo]].',
    'But this chapter is careful. He describes the bark, the blackish sheets, the graded sizes and values, and he’s aware of how it sounds: “you never would be satisfied that I was keeping within truth and reason!” [[polo|Book 2, ch. 24]].',
    'Critics have pointed to his silences. As a review in <em>Reviews in History</em> summarises, Frances Wood noted inconsistencies, no mention of the Great Wall, and his absence from official Chinese documents. Hans Ulrich Vogel’s book answers with exactly this kind of detail, claiming that many of Polo’s descriptions of currencies, salts and revenues are supported by Chinese sources [[vogelReview]]. The reviewer found him successful, but that’s one review of one book, not the last word.'
  ],
  excerpt: { text: 'What they take is a certain fine white bast or skin which lies between the wood of the tree and the thick outer bark, and this they make into something resembling sheets of paper, but black. When these sheets have been prepared they are cut up into pieces of different sizes.', work: 'The Travels of Marco Polo', by: 'Marco Polo, as told to Rustichello', translator: 'Sir Henry Yule', written: 'c. 1298', locator: 'Book 2, ch. 24', source: 'polo', textUrl: G(10636) },
  links: [['faxian-desert', 'cousin', 'An earlier traveller across Asia whose account is prized for the same reason: detail you can’t find elsewhere.'], ['aztec-market', 'idea', 'Another European amazed by an economy he hadn’t imagined.'], ['tulip-sailor', 'cousin', 'Another reminder that value is partly an agreement.']] },

{ id: 'wells-figures', cat: 'power', when: 'memphis, 1892', context: 'reference', main: 'wells',
  head: 'ida b. wells used the white press’s own numbers to take apart a lie',
  card: 'After a mob lynched her friend Thomas Moss and his two business associates in 1892, Ida B. Wells wrote an editorial so threatening to Memphis’s white elite that she was warned not to return, and her paper was sold off. So she kept working, in Southern Horrors, using figures compiled by the Chicago Tribune to take apart the excuse used to justify lynching. It’s data journalism done at genuine personal risk.',
  story: [
    'Wells was a teacher turned journalist and part owner of the <em>Memphis Free Speech</em>. In 1892 her friend Thomas Moss and his associates, Calvin McDowell and William Henry Stewart, were killed by a white mob [[britWells]].',
    'The pamphlet’s preface tells what followed. She was in New York when letters and telegrams warned her that bodily harm awaited her return. Creditors sold the office and its outfit [[wells|opening pages]].',
    'What she does next is what makes this remarkable. The stated excuse for lynching was defending white women. She sets that claim against the record: 728 Black Americans lynched in eight years, on “all manner of accusations”, including a boy hanged for being drunk and “sassy”, using “statistics compiled by the Chicago Tribune” [[wells|Southern Horrors]]. Using the other side’s figures was a smart move, and it’s a technique you’ll still recognise today.'
  ],
  excerpt: { text: 'Creditors took possession of the office and sold the outfit, and the Free Speech was as if it had never been.', work: 'Southern Horrors: Lynch Law in All Its Phases', by: 'Ida B. Wells', written: '1892', locator: 'on the loss of her newspaper', source: 'wells', textUrl: G(14975) },
  links: [['garret', 'linked', 'Another Black American woman’s published testimony against a violent system, a generation earlier.'], ['mary-prince', 'idea', 'A first-person witness also writing for readers who didn’t want to know.'], ['las-casas', 'idea', 'Another writer gathering atrocities into a document aimed at those with power.']] },

{ id: 'garret', cat: 'power', when: 'north carolina, 1830s', context: 'reference', main: 'jacobs',
  head: 'harriet jacobs hid in a space nine feet long and three feet high',
  card: 'To escape a man who enslaved and pursued her, Harriet Jacobs hid in a crawlspace in her grandmother’s house: nine feet long, seven wide, three feet high at its peak, with no light or air. Her 1861 book appeared under a false name. Surviving correspondence with her editor, Lydia Maria Child, shows that it’s entirely her work, with only minor editing.',
  story: [
    'Jacobs published <em>Incidents in the Life of a Slave Girl</em> in 1861 as “Linda Brent”, with the white abolitionist Lydia Maria Child as editor [[docJacobs]].',
    'The measurements are the heart of the passage. Her uncle Phillip, a carpenter, made a concealed trap-door into the storeroom while she was waiting in a swamp [[jacobs|The Loophole of Retreat]].',
    'The authorship point matters, because it wasn’t obvious to readers for a long time. The University of North Carolina’s summary states that her surviving correspondence with Child validates the book as entirely Jacobs’s work, with only minor editing on Child’s part [[docJacobs]]. The letters are what settle it: the voice in the book is hers.'
  ],
  excerpt: { text: 'The garret was only nine feet long and seven wide. The highest part was three feet high, and sloped down abruptly to the loose board floor. There was no admission for either light or air.', work: 'Incidents in the Life of a Slave Girl', by: 'Harriet Jacobs (as “Linda Brent”)', written: '1861', locator: '“The Loophole of Retreat”', source: 'jacobs', textUrl: G(11030) },
  links: [['mary-prince', 'linked', 'Thirty years earlier in the same tradition, and with its own question about the editor’s hand.'], ['equiano-birthplace', 'debate', 'Another slave narrative whose evidence has been argued over, with very different results.'], ['zitkala-hair', 'idea', 'A first-person account from inside a system built to control a child or a woman.']] },

{ id: 'mary-prince', cat: 'power', when: 'west indies, published 1831', context: 'reference', main: 'prince',
  head: '“i have been a slave”: the voice england hadn’t been listening to',
  card: 'Mary Prince, born enslaved in Bermuda, told her story in London, and it was printed in 1831, with Thomas Pringle as editor. Pringle said the idea for it was hers. She wanted people in England to hear from a slave what a slave had felt. Its directness still lands: “I have felt what a slave feels, and I know what a slave knows.” Note, though, that it reached print through an editor.',
  story: [
    'The University of North Carolina’s summary calls it one of the earliest narratives meant to reveal the realities of slavery in the West Indies to an English public largely unaware of them. Pringle’s introduction says the idea “was first suggested by herself”, so that good people in England might hear from a slave [[docPrince]].',
    'It is “related by herself”, says the title page [[prince|title page]], and that phrasing is worth noticing. It’s her voice, delivered through someone else’s hand, in a book with a political aim, during the campaign against slavery. That doesn’t make it untrue. It means it has been shaped.',
    'What stands out in the text is what the sentence below does, as an argument. She isn’t asking readers to imagine anything. She’s telling them they don’t know, and that she does.'
  ],
  excerpt: { text: 'But the truth ought to be told of it; and what my eyes have seen I think it is my duty to relate; for few people in England know what slavery is. I have been a slave--I have felt what a slave feels, and I know what a slave knows;', work: 'The History of Mary Prince', by: 'Mary Prince', written: '1831', locator: 'Project Gutenberg #17851', source: 'prince', textUrl: G(17851) },
  links: [['garret', 'linked', 'The same tradition a generation later, with a similar question of who held the pen.'], ['equiano-birthplace', 'linked', 'An earlier and famous book in the same tradition.'], ['wells-figures', 'idea', 'Another woman’s testimony against an audience that would rather not hear.']] },

{ id: 'las-casas', cat: 'power', when: 'spain and the americas, 1542', context: 'reference', main: 'lascasas',
  head: 'a spanish priest wrote the most damning account of the conquest of the americas',
  card: 'In 1542, Bartolomé de Las Casas, a Dominican missionary, wrote an account of Spanish atrocities in the Americas, for the attention of the Spanish court. Its English translation describes “innocent Sheep” set upon by “Tygers, Wolves and Lions”. It’s furious, partisan and aimed at changing policy. Which means it’s both essential evidence of the horror and a text you have to read carefully.',
  story: [
    'Las Casas was an early Spanish historian and Dominican missionary. Britannica credits him as the first to expose the oppression of Indigenous peoples by Europeans in the Americas and to call for the abolition of slavery there. He wrote the <em>Brevísima relación</em> in 1542 while awaiting an audience with Charles V [[britCasas]].',
    'Britannica also notes the events he describes matter less to the book than their theological interpretation [[britCasas]]. So this isn’t a neutral chronicle. It’s a moral and religious argument to the powerful.',
    'Our translation, with its 17th-century spelling, adds another filter, and says on its title page that it reached English after passing through other languages [[lascasas|title page]]. And its picture of gentle sheep flattens the Indigenous peoples into innocent victims, without their own politics. Read it for what a Spaniard was prepared to say to Spain, and alongside the soldier’s view from Tenochtitlan.'
  ],
  excerpt: { text: 'The Spaniards first assaulted the innocent Sheep, so qualified by the Almighty, as is premention\'d, like most cruel Tygers, Wolves and Lions hunger-starv\'d, studying nothing, for the space of Forty Years, after their first landing, but the Massacre of these Wretches,', work: 'A Brief Account of the Destruction of the Indies', by: 'Bartolomé de Las Casas', written: '1542', locator: 'opening account', source: 'lascasas', textUrl: G(20321) },
  links: [['aztec-market', 'same', 'The same conquest as told by a soldier who took part.'], ['wells-figures', 'idea', 'Another writer assembling atrocity into a case, aimed at those with power to act.']] },

{ id: 'mother-seacole', cat: 'power', when: 'london and the crimea, 1854–55', context: 'reference', main: 'seacole',
  head: 'turned down to nurse in the crimea, mary seacole went anyway',
  card: 'Mary Seacole, a Jamaican businesswoman with hard-won medical experience, including in a Panama cholera epidemic, offered to go to the Crimean War. She was refused, in an interview with one of Florence Nightingale’s companions, and attributed it to racial prejudice. “I read in her face the fact, that had there been a vacancy, I should not have been chosen to fill it.” She went anyway, and officers greeted her there as “Mother Seacole”.',
  story: [
    'Seacole (1805–1881) was born in Kingston to a Scottish soldier and a free Black Jamaican “doctress” who ran a boardinghouse. She gained nursing experience in a Panama cholera epidemic and among yellow fever patients, many of them British soldiers [[britSeacole]].',
    'In London in 1854, reports of the breakdown in soldiers’ care were spreading. Her offers to serve were refused, and she attributed that to racial prejudice [[britSeacole]]. Her own memoir gives you the moment itself, in one of its best sentences [[seacole|on her applications]].',
    'So she went anyway, with help, as a businesswoman. Officers she’d met in Kingston greeted her in the Crimea as “our good old Mother Seacole” [[seacole|Mother Seacole]]. Bear in mind, she’s telling her own story. But her reading of that interview is one you can’t easily put down.'
  ],
  excerpt: { text: 'Once again I tried, and had an interview this time with one of Miss Nightingale\'s companions. She gave me the same reply, and I read in her face the fact, that had there been a vacancy, I should not have been chosen to fill it.', work: 'Wonderful Adventures of Mrs. Seacole in Many Lands', by: 'Mary Seacole', written: '1857', locator: 'on her applications to go to the Crimea', source: 'seacole', textUrl: G(23031) },
  links: [['ingrafting', 'idea', 'Another woman bringing medical knowledge across an imperial line.'], ['pump-handle', 'cousin', 'Cholera again: London, in the same year she was looking for a way to the Crimea.'], ['pity-white-man', 'idea', 'Another story about care for strangers, and who gets the credit.']] },

{ id: 'wollstonecraft-reply', cat: 'power', when: 'london and paris, 1790–92', context: 'scholarly', issue: 'rights', main: 'vindGut',
  head: 'mary wollstonecraft asked revolutionary france who made man the judge',
  card: 'When a French statesman proposed confining girls to domestic education, Mary Wollstonecraft dedicated a whole book to him. If men demand to judge their own happiness, she asked in 1792, isn’t it “inconsistent and unjust” to subjugate women? Her argument turned the Revolution’s own logic back on it: “Who made man the exclusive judge, if woman partake with him the gift of reason?”',
  story: [
    'In 1790 Wollstonecraft answered Edmund Burke almost certainly before anybody else, in the anonymous first edition of <em>A Vindication of the Rights of Men</em>; the second edition carried her name [[sep|§1]].',
    'Her next target was in Paris. Talleyrand, visiting London in February 1792 for the Constituent Assembly, had proposed a national curriculum that would confine girls to domestic education [[sep|§1, §3]]. The 1792 <em>Vindication of the Rights of Woman</em> opens with a dedication that quotes him back to himself [[vind1792|dedication, p. ix]].',
    'As Sylvana Tomaselli reads it, this is more than a complaint about unfairness: shutting women out was “a contradiction within the revolutionary project itself” [[sep|§3]]. The earlier issue is below if you want it in full.'
  ],
  links: [['equiano-birthplace', 'linked', 'She reviewed his book in the Analytical Review in May 1789.'], ['let-them-eat', 'cousin', 'France again, and a line about the people that’s stuck.'], ['luddites', 'cousin', 'The same British 1790s–1810s argument about who counts, a step closer to the factory.']] },

{ id: 'luddites', cat: 'power', when: 'england, 1811–13', context: 'scholarly', issue: 'machines', main: 'tna',
  head: 'the luddites weren’t against machines so much as what they were being used for',
  card: 'Luddites broke machines, but they also petitioned, protested and wrote to officials. They targeted employers using new machinery to replace skilled workers and cut wages. Their leader, Ned Ludd, was imaginary. In 1812 the poet Lord Byron rose in the House of Lords to oppose the death penalty for frame-breaking, insisting only “absolute want” had driven them. The government sent troops anyway, and seventeen men were hanged at York.',
  story: [
    'The disturbances began in Nottinghamshire in 1811 and spread across northern England in 1812. They were aimed at employers using new machines to replace skilled workers and drive down wages, and alongside the frame-breaking the Luddites petitioned and wrote to officials [[tna]].',
    'On 27 February 1812 Byron, speaking in the Lords for the first time, opposed the bill that made frame-breaking a capital offence, insisting that “nothing but absolute want could have driven a large, and once honest and industrious, body of the people” to it [[hansard|c966]].',
    'Charlotte Brontë’s <em>Shirley</em>, published in 1849 and set in those years, gives us the passage below [[vw]]. And the coda is delightful: Byron’s only legitimate child was Ada Lovelace, who wrote about Babbage’s Analytical Engine [[chm]]. The full issue is below.'
  ],
  links: [['wollstonecraft-reply', 'cousin', 'Britain’s preceding argument about rights, and who was entitled to them.'], ['wells-figures', 'idea', 'Another case of the powerful’s story about protest being answered by the record.'], ['jupiter-moons', 'cousin', 'Technology again, in a much happier mood.']] },

{ id: 'equiano-birthplace', cat: 'power', when: 'london, 1789', context: 'scholarly', issue: 'story', main: 'carey',
  head: 'where was olaudah equiano born? the question is still open',
  card: 'Olaudah Equiano published his life story in 1789, by subscription, with the Prince of Wales at the top of the list. It opens with a childhood in Igboland and a kidnapping at about eleven. In 1999 Vincent Carretta drew attention to a baptism record and a muster roll giving his birthplace as South Carolina. Paul Lovejoy disputes that conclusion. Nearly everything else checks out, which is what makes this so absorbing.',
  story: [
    'Equiano, also known as Gustavus Vassa, sold <em>The Interesting Narrative</em> by subscription at the height of the campaign against the slave trade [[carey]]. In 1792 two London newspapers claimed he was born in the Danish West Indies, a charge Shillington calls groundless [[shill]].',
    'The modern question is different. In 1999 Carretta pointed to a baptism record of 1759, “a Black born in Carolina”, and a 1773 muster roll giving South Carolina [[shill]]. Paul Lovejoy disputes the conclusion [[lovejoy]], arguing that the linguistic and cultural detail “leaves little doubt that he was born in Africa” [[shill]].',
    'Logbooks and registers confirm almost every other step of the story [[blackburn]], and Carretta himself cautions that “reasonable doubt is not the same as conclusive proof” [[shill]]. It’s an open question, and the longer issue below lays it out in full.'
  ],
  links: [['garret', 'debate', 'Another slave narrative whose authenticity was questioned, then settled in a very different way.'], ['mary-prince', 'linked', 'A later narrative in the same tradition, “related by herself”.'], ['wollstonecraft-reply', 'linked', 'She reviewed this book in 1789, unimpressed overall, though she praised parts of it.']] }
];

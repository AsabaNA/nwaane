// What the search box can point at besides people: pages and buttons.
// A button needs an entry here (page, English and French name, extra search words, how to find it on the page).
// The test suite opens every page for every role and fails if a listed button is not there, so this list cannot go stale unnoticed.
//   pg   menu key of the page it lives on (null = the app frame itself)     sel  CSS selector of the button, searched inside #m (or the page when frame)
//   pre  optional step run after the page opens (switch to a tab …)           r    optional roles that have it (otherwise whoever can open the page)
//   hint optional extra line shown on the glowing bubble                      opt  true = may legitimately be absent (not checked by the test)
const SXPAGES={
 dashboard:'home overview accueil tableau de bord statistics statistiques',
 register:'register enrol enroll new student inscrire inscription nouvel eleve add',
 reports:'report cards bulletins marks notes results resultats publish term trimestre',
 recpay:'record payment pay paiement recu receipt versement encaisser',
 fees:'fees frais scolarite owing arrears impaye balance solde',
 subjects:'subjects matieres coefficients assign teachers per class',
 classes:'classes students eleves lists listes rolls sections',
 staff:'staff teachers enseignants personnel users accounts comptes secretary',
 settings:'settings parametres school ecole logo signature backup',
 timetable:'timetable emploi du temps schedule exam examens planning generate',
 today:'today aujourd hui attendance gate presence arrivals lessons',
 hours:'hours heures pay paie payroll salary approve lock',
 billing:'billing facturation subscription abonnement invoice plan price',
 exams:'exams examens papers epreuves submission upload deadline print',
 workspace:'home accueil workspace',
 entermarks:'enter marks saisir notes grades sequence',
 mylist:'my student lists mes eleves liste',
 classlist:'class list head teacher titulaire',
 mytt:'my timetable emploi du temps',
 myhours:'my hours mes heures pay'};
const SXC=(pg,id,en,fr,kw,sel,o={})=>({pg,id,en,fr,kw,sel,...o});
const SXCONTROLS=[
 // ---- the app frame (always there)
 SXC(null,'fr_lang','Change language','Changer de langue','language langue english francais french anglais switch','.fr-lang'),
 SXC(null,'fr_out','Log out','Se déconnecter','logout sign out quit deconnexion quitter','.fr-user button[onclick^="bye"]'),
 SXC(null,'fr_col','Collapse or expand the side menu','Réduire ou agrandir le menu latéral','menu sidebar collapse expand reduire agrandir','.fr-colb'),
 // ---- dashboard
 SXC('dashboard','d_att','Things needing attention','Ce qui demande votre attention','attention alerts problems alertes a traiter unconfirmed','[onclick^="dashF(\'att\')"]'),
 SXC('dashboard','d_next','Lessons happening now and next','Cours en ce moment et à venir','now next lessons maintenant prochain','[onclick^="dashF(\'next\')"]'),
 SXC('dashboard','d_verify','Verify a report card','Vérifier un bulletin','verify authenticity check verifier authentique qr','a[href*="verify"]'),
 // ---- register a student
 // ---- report cards
 SXC('reports','rp_t1','Report cards, term 1','Bulletins, trimestre 1','term trimestre first premier','[onclick^="rcTerm(\'1\')"]'),
 SXC('reports','rp_t2','Report cards, term 2','Bulletins, trimestre 2','term trimestre second deuxieme','[onclick^="rcTerm(\'2\')"]'),
 SXC('reports','rp_t3','Report cards, term 3','Bulletins, trimestre 3','term trimestre third troisieme','[onclick^="rcTerm(\'3\')"]'),
 SXC('reports','rp_print','Print report cards','Imprimer les bulletins','print bulletins cards pdf imprimer sections classes duplex','[onclick^="rcPrintOpen(RCS"]'),
 // ---- fees
 SXC('fees','f_collect','Payments and receipts list','Liste des paiements','payments paiements collect encaisser receipts recus','.pgt [data-t="pay"]',{r:['principal'],doc:1}),
 SXC('fees','f_setup','Set the school fees','Définir les frais de scolarité','fee setup frais amount montant tranche installment prices','.pgt [data-t="setup"]',{r:['principal'],doc:1}),
 SXC('fees','f_owing','Students who still owe fees','Élèves qui doivent encore des frais','owing arrears debt unpaid impaye retard balance solde devoir','[onclick^="feStat(\'owing\')"]'),
 SXC('fees','f_paid','Students who have fully paid','Élèves ayant tout payé','paid solde complete fully','[onclick^="feStat(\'paid\')"]'),
 SXC('fees','f_partial','Students who paid part of the fees','Élèves ayant payé en partie','partial partly partiel installment tranche','[onclick^="feStat(\'partial\')"]'),
 SXC('fees','f_unpaid','Students who have not paid at all','Élèves n’ayant rien payé','unpaid not paid nothing rien impaye','[onclick^="feStat(\'unpaid\')"]'),
 SXC('fees','f_print','Print the fees list','Imprimer la liste des frais','print list liste imprimer owing arrears','[onclick^="fePrint"]'),
 // ---- record a payment
 SXC('fees','p_pay','Pay fees: record a payment','Payer les frais : enregistrer un paiement','pay fees record payment receipt encaisser paiement payer frais recu','.pgt .pay-btn',{r:['principal','secretary'],doc:1}),
 // ---- subjects
 SXC('subjects','s_add','Add a subject to a class','Ajouter une matière à une classe','add subject coefficient new matiere nouvelle','[onclick*="#sn"]'),
 SXC('subjects','s_edit','Edit a subject (name, coefficient)','Modifier une matière (nom, coefficient)','edit rename coefficient modifier matiere','[onclick^="sbEdit"]'),
 SXC('subjects','s_teacher','Assign a teacher to a subject','Attribuer un enseignant à une matière','teacher assign enseignant attribuer affecter sequence replace','[onclick^="tmAdd"]'),
 // ---- classes and students
 SXC('classes','c_printall','Print the lists of the whole school','Imprimer les listes de toute l’école','print whole school lists imprimer ecole entiere','[onclick^="clPrintAll"]'),
 SXC('classes','c_idall','Print student ID cards','Imprimer les cartes d’élève','id cards badges students photos cartes eleves badge','[onclick^="idOpen()"]'),
 SXC('classes','c_qrall','Print the QR codes of all classes','Imprimer les codes QR de toutes les classes','qr codes class scan attendance appel','a[href*="/api/qr/pdf"]',{r:['principal','secretary'],opt:true}),
 SXC('classes','c_add','Add a class','Ajouter une classe','add class new create classe nouvelle creer','[onclick*="#cp"]',{r:['principal']}),
 SXC('classes','c_register','Register a student','Inscrire un élève','register add new student enrol enroll inscrire eleve inscription','[onclick^="regOpen"]',{r:['principal','secretary']}),
 SXC('classes','c_import','Import students from a spreadsheet','Importer des élèves depuis un tableur','import excel csv upload spreadsheet tableur fichier','[onclick^="impOpen"]',{r:['principal','secretary']}),
 SXC('classes','c_menu','Print one class: list, ID badges, QR code','Imprimer une classe : liste, badges, code QR','class list badges qr print classe liste imprimer','[onclick^="kcMenu"]',{r:['principal'],hint:{en:'Open the ⋯ menu on the class',fr:'Ouvrez le menu ⋯ de la classe'}}),
 SXC('classes','c_sections','Set up sections (English, French, …)','Créer des sections (anglophone, francophone…)','sections anglophone francophone subsystem sous-systeme primary primaire','[onclick^="scAddOpen"]',{r:['principal'],opt:true}),
 // ---- staff
 SXC('staff','sf_badges','Print staff ID badges','Imprimer les badges du personnel','staff teachers badges id cards photo scan gate badge personnel enseignants','#tbbtn'),
 SXC('staff','sf_add','Add a staff member','Ajouter un membre du personnel','add teacher staff secretary new account create ajouter enseignant compte','[onclick*="#fh"]'),
 SXC('staff','sf_print','Print the staff list','Imprimer la liste du personnel','print staff list imprimer personnel','[onclick="print()"]'),
 // ---- settings
 SXC('settings','se_school','School information and settings','Informations et réglages de l’école','school name logo address ecole nom adresse year annee','[onclick^="stTab(\'school\')"]'),
 SXC('settings','se_cards','Report card settings','Réglages des bulletins','report card language template appreciation bulletin langue modele','[onclick^="stTab(\'cards\')"]'),
 SXC('settings','se_support','Support and contact','Assistance et contact','support help contact aide assistance','[onclick^="stTab(\'support\')"]'),
 SXC('settings','se_data','Download a full copy of your school data','Télécharger une copie complète des données de l’école','download backup export data zip csv excel photos telecharger sauvegarde donnees copie','#dtbtn',{pre:()=>typeof stTab=='function'&&stTab('school')}),
 SXC('settings','se_save','Save the settings','Enregistrer les réglages','save settings enregistrer parametres','[onclick^="ss()"]',{pre:()=>typeof stTab=='function'&&stTab('school')}),
 // ---- timetable
 SXC('timetable','t_see','See or change a timetable','Voir ou modifier un emploi du temps','see change edit view timetable classe teacher voir modifier','[onclick^="twTab(\'list\')"]',{r:['principal']}),
 SXC('timetable','t_new','Create a suggested timetable','Créer un emploi du temps suggéré','new generate suggested create automatic generer suggere nouveau','[onclick^="twTab(\'new\')"]',{r:['principal']}),
 SXC('timetable','t_day','School day: bell, periods and breaks','Journée d’école : sonnerie, périodes et pauses','school day bell periods breaks hours start end sonnerie pauses horaires','[onclick^="TW.calEdit=1"]',{r:['principal'],pre:()=>typeof twTab=='function'&&twTab('cal')}),
 SXC('timetable','t_off','Days off and holidays','Jours de congé et vacances','days off holidays vacation closed conge ferie vacances ferme','[onclick^="twOffAdd"]',{r:['principal'],pre:()=>typeof twTab=='function'&&twTab('cal')}),
 SXC('timetable','t_exam','Exam timetable','Planning des examens','exam timetable planning examens invigilators surveillants','[onclick^="twTab(\'exam\')"]',{r:['principal']}),
 SXC('timetable','t_print','Print timetables (a section, a class or a teacher)','Imprimer les emplois du temps (section, classe ou enseignant)','print timetables section class teacher imprimer emplois du temps','[onclick^="twTab(\'list\')"]',{r:['principal']}),
 SXC('timetable','t_exnew','Create a new exam timetable','Créer un nouveau planning d’examens','new exam timetable create planning examens creer','[onclick^="ettNew"]',{r:['principal'],pre:()=>typeof twTab=='function'&&twTab('exam')}),
 SXC('timetable','t_exgrp','Class groups for exams','Groupes de classes pour les examens','groups classes exam together groupes examens ensemble','[onclick^="ettGroups"]',{r:['principal'],pre:()=>typeof twTab=='function'&&twTab('exam')}),
 // ---- today / gate
 SXC('today','to_scan','Scan a teacher badge at the gate','Scanner le badge d’un enseignant à l’entrée','scan badge gate teacher arrival qr camera scanner entree arrivee','#tbscan'),
 SXC('today','to_gate','Teacher arrivals and departures','Arrivées et départs des enseignants','gate arrivals departures arrived left arrivee depart entree sortie','[onclick^="tdTab(\'gate\')"]'),
 SXC('today','to_lessons','Today’s lessons','Les cours d’aujourd’hui','lessons today cours aujourd hui confirm confirmer','[onclick^="tdTab(\'lessons\')"]'),
 SXC('today','to_spots','Spot checks: go and look','Contrôles à effectuer : allez voir','spot checks verify look control verifier','[onclick^="tdTab(\'spots\')"]'),
 // ---- hours and pay
 SXC('hours','h_approve','Approve and lock the month’s pay','Approuver et verrouiller la paie du mois','approve lock month pay payroll approuver verrouiller mois paie','[onclick^="happrove"]',{r:['principal'],opt:true}),
 SXC('hours','h_pdf','Pay sheet (PDF)','État de paie (PDF)','pay sheet pdf payroll salary paie etat salaire print imprimer','a[href*="/api/hours/pdf"]',{r:['principal']}),
 SXC('hours','h_bulk','Mark all unconfirmed lessons present or absent','Marquer tous les cours non confirmés présents ou absents','unconfirmed lessons absent present bulk non confirmes','[onclick^="hbulk"]',{r:['principal'],opt:true}),
 // ---- exams
 SXC('exams','e_add','Add an exam','Ajouter un examen','add new exam paper create ajouter nouvel examen epreuve','[onclick^="exEdit(0)"]'),
 SXC('exams','e_print','Print exam papers with separator sheets','Imprimer les épreuves avec feuilles de séparation','print exam papers separator sheets copies imprimer epreuves','[onclick^="prOpen"]',{r:['principal','secretary']}),
 SXC('exams','e_lead','Deadline for teachers to send papers','Date limite pour l’envoi des épreuves par les enseignants','deadline lead days teachers submit papers delai enseignants epreuves','[onclick^="exLead"]',{r:['principal']}),
 // ---- teachers
 SXC('mylist','ml_print','Print a class list','Imprimer une liste de classe','print class list imprimer liste classe','[onclick^="psPrint(\'class\')"]')];

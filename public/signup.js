// School sign-up wizard: School & admin -> Packages -> Review -> Verify email -> Done.
// Uses POST /api/signup, /api/auth/verify, /api/auth/resend, /api/auth/email and GET /api/prices (the live price table).
(()=>{
window.REFQ=(new URLSearchParams(location.search).get('ref')||'').trim().toUpperCase().slice(0,20);
const IC={school:'<path d="m3 9 9-5 9 5-9 5-9-5Z"/><path d="M7 11.5V16c0 1.2 2.2 2.5 5 2.5s5-1.3 5-2.5v-4.5"/><path d="M21 9v6"/>',
 apt:'<path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16"/><path d="M14 10h5a1 1 0 0 1 1 1v10"/><path d="M2 21h20M8 8h2M8 12h2M8 16h2"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',mailn:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
 shield:'<path d="M12 3 5 6v5c0 4.5 2.9 8 7 10 4.1-2 7-5.5 7-10V6l-7-3Z"/><circle cx="12" cy="10" r="2"/><path d="M8.5 16c.8-1.6 2-2.3 3.5-2.3s2.7.7 3.5 2.3"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
 eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',eyeoff:'<path d="M3 3l18 18"/><path d="M10.6 5.1A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.7C3.8 8.4 2 12 2 12s3.5 7 10 7c1.6 0 3-.4 4.3-1"/>',
 ck:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',ckc:'<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>',
 ar:'<path d="M5 12h14M13 6l6 6-6 6"/>',al:'<path d="M19 12H5M11 6l-6 6 6 6"/>',send:'<path d="m21 3-9 18-2-8-8-2 19-8Z"/><path d="M21 3 10 13"/>',
 calc:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
 gift:'<rect x="3" y="8" width="18" height="4"/><path d="M5 12v9h14v-9M12 8v13M12 8S10 3 7.5 4.5 8 8 12 8Zm0 0s2-5 4.5-3.5S16 8 12 8Z"/>',
 quiz:'<path d="M6 3h9l4 4v14H6V3Z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',award:'<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 7 5-3 5 3-1.5-7"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',key:'<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 7l3 3M14 9l2 2"/>',
 copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',pal:'<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2-.6-1.3.3-2.5 1.7-2.5H18a3 3 0 0 0 3-3C21 7 17 3 12 3Z"/><path d="M7.5 11h.01M10 7.5h.01M14.5 7.5h.01"/>',
 ua:'<circle cx="9" cy="8" r="4"/><path d="M2 21c.8-3.6 3.4-5.5 7-5.5M18 14v6M15 17h6"/>',ug:'<circle cx="9" cy="8" r="4"/><path d="M2 21c.8-3.6 3.4-5.5 7-5.5s6.2 1.9 7 5.5M18 7a3 3 0 0 1 0 6M22 21c-.4-2.2-1.5-3.8-3-4.6"/>',
 dn:'<path d="m6 9 6 6 6-6"/>',pen:'<path d="M4 20h4L19 9l-4-4L4 16v4ZM13 7l4 4"/>',doc:'<path d="M6 3h9l4 4v14H6V3Z"/><path d="M14 3v5h5M9 13h7M9 17h7"/>',bar:'<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
 roll:'<circle cx="9" cy="8" r="4"/><path d="M2 21c.8-3.6 3.4-5.5 7-5.5M16 15l2 2 4-4"/>',cash:'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',
 rec:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/>',filt:'<path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z"/>',up:'<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
 cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',qr:'<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 12h8"/>',
 badge:'<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="2.5"/><path d="M8 17c.7-1.7 2-2.5 4-2.5s3.3.8 4 2.5"/>',pay:'<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6v2m0 8v2"/>',
 lk:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',ulk:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>'};
const ic=(n,c='')=>`<svg class="ic ${c}" viewBox="0 0 24 24" aria-hidden="true">${IC[n]||''}</svg>`;
const E=(k)=>Object.assign(D.en,k),F=(k)=>Object.assign(D.fr,k);
E({sw_brand:'School Platform',sw_have:'Already registered?',sw_in:'Sign in',sw_s:['School & admin','Packages','Review','Verify email'],
 sw_h1:'Create your school account',sw_l1:'Takes about 3 minutes. No payment needed today.',sw_about:'About your school',sw_name:'Name of school',sw_sph:'e.g. Greenfield Secondary School',
 sw_mail:'School email address',sw_mailh:'We’ll send a 6-digit code here to confirm it. Use an email the school checks regularly.',sw_adm:'Super admin',
 sw_admb:'You are creating the main account for this school.',sw_admt:'This account has full control: it can add, change and remove every other account (teachers, bursar, office staff) and all school data. It is usually held by the principal or the owner.',
 sw_full:'Full name of super admin',sw_fullh:'Usually the principal or the owner of the school.',sw_pw:'Password',sw_pwc:'Confirm password',sw_show:'Show password',sw_hide:'Hide password',
 sw_pw0:'At least 8 characters, with a number',sw_pw1:'Weak · add more characters and a number',sw_pw2:'Fair · add a number or a capital letter',sw_pw3:'Good · at least 8 characters, with a number',sw_pw4:'Strong',sw_match:'Passwords match',sw_nomatch:'Passwords do not match',
 sw_toPk:'Continue to packages',sw_back:'Back',sw_h2:'Choose your packages',sw_l2:'Tap to select <b>one or more</b>. The more you combine, the lower the price of each. You can change this any time later.',
 sw_bund:'Bundle price:',sw_t1:'1 package · standard',sw_t2:'Any 2 · save [x]%',sw_t3:'All 3 · best price',sw_hn0:'Select at least one package',sw_hn1:'Add one more to save',sw_hn2:'Add the last one for the best price',sw_hn3:'You have the best price',
 sw_ps:'per student, per term',sw_pt:'per <b>teacher</b>, per term',sw_sv:'Bundle price · save [x] F',sw_if:'Price if you add it',sw_more:'See everything included',
 sw_a:'Report cards & attendance',sw_at:'Marks, report cards, class results, student roll call',sw_b:'School fees',sw_bt:'Fee plans, payments, receipts, who owes what',sw_c:'Teacher attendance',sw_ct:'Timetable, lesson check-in, hours and pay',
 sw_a1:'Teachers enter marks per subject; blanks are flagged',sw_a2:'Term & annual report cards in English, French or both',sw_a3:'Class lists, pass rates and charts',sw_a4:'Student roll call, your way',
 sw_b1:'Fee plan per class and term, with student discounts',sw_b2:'Receipts for thermal printers, with a check code',sw_b3:'Paid / part paid / unpaid lists to print',sw_b4:'Exports to Sage / Ciel',
 sw_c1:'Automatic timetable generator',sw_c2:'One-tap lesson check-in by class QR code',sw_c3:'Gate checks and teacher ID badges',sw_c4:'Monthly hours and pay sheet',
 sw_ad:['<p><b>Marks entry:</b> 2 sequences per term by default; a popup lists students left blank before submitting.</p><p><b>Report cards:</b> verification code on every card, your logo and colours, class statistics shown separately, bulk printing with separator sheets.</p><p><b>Publishing:</b> the principal publishes by class (with a missing-marks warning) or everything that’s ready.</p><p><b>Roll call:</b> off, every teacher every lesson, class head daily, or office staff daily.</p><p><b>Honour roll (optional):</b> set criteria; shown on the report card.</p>',
  '<p><b>Receipts:</b> each has a code anyone can check online.</p><p><b>Report card rule:</b> print for everyone, or hold cards for students who owe, with a “release” override.</p><p><b>Accounting:</b> Sage/Ciel exports of payments and fees owed.</p><p><b>Charts</b> and opening balances carried over from last year.</p>',
  '<p><b>Timetable:</b> day structure and breaks, teachers’ unavailable days; print per teacher and per class.</p><p><b>Presence:</b> check-in is verified against the school’s location and the lesson time, with a “what was taught” note. Gate check and spot checks.</p><p><b>Hours & pay:</b> replacements, exceptions to resolve, pay rates, locked monthly pay sheet.</p><p><b>Accounting:</b> Sage/Ciel export of teacher pay.</p>'],
 sw_free:'Free with every plan',sw_freet:'Student registration & bulk import, sections (Anglophone/Francophone), student ID badges, staff list, search, mobile app, AI assistant (optional), data download.',
 sw_ex:'Exams',sw_exn:'Needs A or B',sw_ext:'Teachers upload exam PDFs, the office prints them merged. Includes the exam timetable generator.',sw_tp:'Teacher report cards',sw_tpn:'Needs A + B + C',sw_tpt:'Only available when your school has all three packages.',sw_inc:'Included',
 sw_stu:'Students',sw_tea:'Teachers',sw_est:'estimated per term',sw_nopay:'not charged today',sw_np:['0 packages','1 package','[n] packages'],sw_review:'Review',
 sw_h3:'Check your details',sw_l3:'Make sure everything is right before we send the code.',sw_k1:'School',sw_k2:'School email (code will be sent here)',sw_k3:'Super admin · full control',sw_ed:'Edit',sw_chg:'Change',sw_pk:'Packages',
 sw_ln:'[p] F × [q] [u]',sw_us:'students',sw_ut:'teachers',sw_esttot:'Estimated per term',sw_based:'Based on [s] students and [t] teachers · billed later',sw_free1:'The first term is free.',
 sw_np1:'Nothing to pay now.',sw_np2:'You’ll be billed per term from inside your account. You can add or remove packages at any time.',
 sw_cons:'I agree to the Terms and Privacy Policy, and I confirm I am authorised to create this account for the school.',sw_sendc:'Send verification code',sw_wait:'Please wait…',
 sw_h4:'Check the school’s email',sw_sent:'We sent a 6-digit code to',sw_notsent:'We could not send the email to',sw_notsent2:'. Press “resend code”.',sw_exp:'Code expires in',sw_dg:'Didn’t get it? Check spam, or',sw_rs:'resend code',sw_resent:'A new code is on its way.',sw_wrong:'Wrong email? Change it',sw_newm:'Correct email address',sw_savem:'Send to this address',
 sw_ver:'Verify & create account',sw_h5:'Your school account is ready',sw_wel:'Welcome, [n]. Here is your school code.',sw_copy:'Copy',sw_copied:'Copied',
 sw_keep:'Keep this code safe — you need it every time you sign in.',sw_keept:'Everyone at your school (teachers, bursar, staff) uses it too, with their own username and password.',sw_you:'Your username',sw_cd:'School code',
 sw_n1:'Add logo & colours',sw_n1t:'Used on report cards and receipts',sw_n2:'Register students',sw_n2t:'One by one, or import from Excel',sw_n3:'Invite staff',sw_n3t:'Teachers, bursar, office',sw_dash:'Go to my dashboard',
 sw_ref:'Referral code',sw_refo:'optional',sw_refh:'Got a code from a referrer? Enter it for [x]% off your first year.',sw_refok:'Code applied: [x]% off your first year',sw_refbad:'This code is not valid.',sw_refchk:'Checking…',sw_disc:'Referral discount ([x]%, first year)',sw_k4:'Referral code',e_refcode:'This referral code is not valid.',e_refself:'You cannot use your own referral code.',sw_e_sc:'Enter the name of the school.',sw_e_em:'Enter a valid email address.',sw_e_nm:'Enter the full name of the super admin.',sw_e_pw:'The password needs at least 8 characters.',sw_e_pm:'The two passwords do not match.',sw_e_pk:'Select at least one package.',sw_e_cs:'Please confirm you agree before continuing.',sw_e_6:'Enter all 6 digits.'});
F({sw_brand:'Plateforme scolaire',sw_have:'Déjà inscrit ?',sw_in:'Se connecter',sw_s:['École & admin','Modules','Vérification','E-mail'],
 sw_h1:'Créez le compte de votre école',sw_l1:'Environ 3 minutes. Aucun paiement aujourd’hui.',sw_about:'À propos de votre école',sw_name:'Nom de l’école',sw_sph:'ex. Collège Les Cèdres',
 sw_mail:'Adresse e-mail de l’école',sw_mailh:'Nous y enverrons un code à 6 chiffres pour la confirmer. Utilisez une adresse que l’école consulte régulièrement.',sw_adm:'Super administrateur',
 sw_admb:'Vous créez le compte principal de cette école.',sw_admt:'Ce compte a le contrôle total : il peut ajouter, modifier et supprimer tous les autres comptes (enseignants, économe, secrétariat) et toutes les données de l’école. Il est en général tenu par le chef d’établissement ou le propriétaire.',
 sw_full:'Nom complet du super administrateur',sw_fullh:'En général le chef d’établissement ou le propriétaire de l’école.',sw_pw:'Mot de passe',sw_pwc:'Confirmer le mot de passe',sw_show:'Afficher le mot de passe',sw_hide:'Masquer le mot de passe',
 sw_pw0:'Au moins 8 caractères, avec un chiffre',sw_pw1:'Faible · ajoutez des caractères et un chiffre',sw_pw2:'Moyen · ajoutez un chiffre ou une majuscule',sw_pw3:'Bon · au moins 8 caractères, avec un chiffre',sw_pw4:'Fort',sw_match:'Les mots de passe correspondent',sw_nomatch:'Les mots de passe ne correspondent pas',
 sw_toPk:'Continuer vers les modules',sw_back:'Retour',sw_h2:'Choisissez vos modules',sw_l2:'Touchez pour en sélectionner <b>un ou plusieurs</b>. Plus vous en combinez, plus le prix de chacun baisse. Vous pourrez changer plus tard.',
 sw_bund:'Prix groupé :',sw_t1:'1 module · tarif standard',sw_t2:'2 au choix · −[x] %',sw_t3:'Les 3 · meilleur prix',sw_hn0:'Sélectionnez au moins un module',sw_hn1:'Ajoutez-en un pour économiser',sw_hn2:'Ajoutez le dernier pour le meilleur prix',sw_hn3:'Vous avez le meilleur prix',
 sw_ps:'par élève, par trimestre',sw_pt:'par <b>enseignant</b>, par trimestre',sw_sv:'Prix groupé · −[x] F',sw_if:'Prix si vous l’ajoutez',sw_more:'Voir tout ce qui est inclus',
 sw_a:'Bulletins & présences',sw_at:'Notes, bulletins, résultats de classe, appel des élèves',sw_b:'Frais de scolarité',sw_bt:'Plans de frais, paiements, reçus, qui doit quoi',sw_c:'Présence des enseignants',sw_ct:'Emploi du temps, pointage des cours, heures et paie',
 sw_a1:'Les enseignants saisissent les notes par matière ; les vides sont signalés',sw_a2:'Bulletins trimestriels et annuels en français, anglais ou les deux',sw_a3:'Listes de classe, taux de réussite et graphiques',sw_a4:'Appel des élèves, à votre façon',
 sw_b1:'Plan de frais par classe et trimestre, avec remises',sw_b2:'Reçus pour imprimantes thermiques, avec code de contrôle',sw_b3:'Listes payé / partiel / impayé à imprimer',sw_b4:'Exports vers Sage / Ciel',
 sw_c1:'Générateur d’emploi du temps automatique',sw_c2:'Pointage d’un geste par QR code de classe',sw_c3:'Contrôles à la porte et badges enseignants',sw_c4:'Fiche mensuelle des heures et de la paie',
 sw_ad:['<p><b>Saisie des notes :</b> 2 séquences par trimestre par défaut ; une fenêtre liste les élèves sans note avant l’envoi.</p><p><b>Bulletins :</b> code de vérification sur chaque bulletin, votre logo et vos couleurs, statistiques de classe à part, impression groupée avec feuilles de séparation.</p><p><b>Publication :</b> le chef d’établissement publie par classe (avec alerte de notes manquantes) ou tout ce qui est prêt.</p><p><b>Appel :</b> désactivé, chaque enseignant à chaque cours, chef de classe chaque jour, ou secrétariat chaque jour.</p><p><b>Tableau d’honneur (option) :</b> critères au choix ; affiché sur le bulletin.</p>',
  '<p><b>Reçus :</b> chacun porte un code vérifiable en ligne.</p><p><b>Règle des bulletins :</b> imprimer pour tous, ou retenir les bulletins des élèves qui doivent, avec une option « libérer ».</p><p><b>Comptabilité :</b> exports Sage/Ciel des paiements et des frais dus.</p><p><b>Graphiques</b> et soldes d’ouverture repris de l’an dernier.</p>',
  '<p><b>Emploi du temps :</b> structure de la journée et pauses, jours d’indisponibilité ; impression par enseignant et par classe.</p><p><b>Présence :</b> le pointage est vérifié selon le lieu de l’école et l’heure du cours, avec une note « ce qui a été enseigné ». Contrôle à la porte et contrôles inopinés.</p><p><b>Heures & paie :</b> remplacements, exceptions à régler, taux de paie, fiche mensuelle verrouillée.</p><p><b>Comptabilité :</b> export Sage/Ciel de la paie des enseignants.</p>'],
 sw_free:'Inclus avec chaque offre',sw_freet:'Inscription des élèves et import en masse, sections (anglophone/francophone), badges élèves, liste du personnel, recherche, application mobile, assistant IA (optionnel), téléchargement des données.',
 sw_ex:'Examens',sw_exn:'Nécessite A ou B',sw_ext:'Les enseignants déposent les sujets en PDF, le secrétariat les imprime regroupés. Inclut le générateur d’horaires d’examen.',sw_tp:'Bulletins des enseignants',sw_tpn:'Nécessite A + B + C',sw_tpt:'Disponible uniquement si votre école a les trois modules.',sw_inc:'Inclus',
 sw_stu:'Élèves',sw_tea:'Enseignants',sw_est:'estimé par trimestre',sw_nopay:'rien à payer aujourd’hui',sw_np:['0 module','1 module','[n] modules'],sw_review:'Vérifier',
 sw_h3:'Vérifiez vos informations',sw_l3:'Assurez-vous que tout est correct avant l’envoi du code.',sw_k1:'École',sw_k2:'E-mail de l’école (le code y sera envoyé)',sw_k3:'Super administrateur · contrôle total',sw_ed:'Modifier',sw_chg:'Changer',sw_pk:'Modules',
 sw_ln:'[p] F × [q] [u]',sw_us:'élèves',sw_ut:'enseignants',sw_esttot:'Estimation par trimestre',sw_based:'Pour [s] élèves et [t] enseignants · facturé plus tard',sw_free1:'Le premier trimestre est gratuit.',
 sw_np1:'Rien à payer maintenant.',sw_np2:'Vous serez facturé par trimestre depuis votre compte. Vous pouvez ajouter ou retirer des modules à tout moment.',
 sw_cons:'J’accepte les Conditions d’utilisation et la Politique de confidentialité, et je confirme être autorisé à créer ce compte pour l’école.',sw_sendc:'Envoyer le code de vérification',sw_wait:'Patientez…',
 sw_h4:'Consultez l’e-mail de l’école',sw_sent:'Nous avons envoyé un code à 6 chiffres à',sw_notsent:'Impossible d’envoyer l’e-mail à',sw_notsent2:'. Appuyez sur « renvoyer le code ».',sw_exp:'Le code expire dans',sw_dg:'Rien reçu ? Vérifiez les spams, ou',sw_rs:'renvoyer le code',sw_resent:'Un nouveau code est en route.',sw_wrong:'Mauvais e-mail ? Le changer',sw_newm:'Adresse e-mail corrigée',sw_savem:'Envoyer à cette adresse',
 sw_ver:'Vérifier et créer le compte',sw_h5:'Le compte de votre école est prêt',sw_wel:'Bienvenue, [n]. Voici le code de votre école.',sw_copy:'Copier',sw_copied:'Copié',
 sw_keep:'Gardez ce code : il faut le saisir à chaque connexion.',sw_keept:'Tout le personnel de l’école (enseignants, économe, secrétariat) l’utilise aussi, avec son propre identifiant et mot de passe.',sw_you:'Votre identifiant',sw_cd:'Code de l’école',
 sw_n1:'Ajouter logo et couleurs',sw_n1t:'Utilisés sur les bulletins et les reçus',sw_n2:'Inscrire des élèves',sw_n2t:'Un par un, ou import depuis Excel',sw_n3:'Inviter le personnel',sw_n3t:'Enseignants, économe, secrétariat',sw_dash:'Aller à mon tableau de bord',
 sw_ref:'Code de parrainage',sw_refo:'facultatif',sw_refh:'Un code de parrain ? Saisissez-le pour [x] % de remise la première année.',sw_refok:'Code appliqué : [x] % de remise la première année',sw_refbad:'Ce code n’est pas valide.',sw_refchk:'Vérification…',sw_disc:'Remise de parrainage ([x] %, première année)',sw_k4:'Code de parrainage',e_refcode:'Ce code de parrainage n’est pas valide.',e_refself:'Vous ne pouvez pas utiliser votre propre code de parrainage.',sw_e_sc:'Saisissez le nom de l’école.',sw_e_em:'Saisissez une adresse e-mail valide.',sw_e_nm:'Saisissez le nom complet du super administrateur.',sw_e_pw:'Le mot de passe doit contenir au moins 8 caractères.',sw_e_pm:'Les deux mots de passe ne correspondent pas.',sw_e_pk:'Sélectionnez au moins un module.',sw_e_cs:'Veuillez confirmer votre accord pour continuer.',sw_e_6:'Saisissez les 6 chiffres.'});
const MK=['reports','fees','tracking'],LT=['A','B','C'],LI=[['pen','doc','bar','roll'],['cash','rec','filt','up'],['cal','qr','badge','pay']];
const DEF={reports_solo:100,reports_pair:75,reports_bundle:75,fees_solo:100,fees_pair:75,fees_bundle:75,tracking_solo:300,tracking_pair:200,tracking_bundle:200};
let PR=DEF,SU=null,tmr=0;
const w=(k,o={})=>{let s=t(k);for(const x in o)s=s.split('['+x+']').join(o[x]);return s};
const fmt=n=>Math.round(n).toLocaleString('fr-FR').replace(/[  ]/g,' ');
const sfx=n=>n>=3?'bundle':n==2?'pair':'solo',pr=(i,n)=>PR[MK[i]+'_'+sfx(n)]??PR[MK[i]+'_solo'];
const nsel=()=>SU.sel.filter(Boolean).length;
const strength=p=>{let s=0;if(p.length>=8)s++;if(/\d/.test(p)&&p.length>=8)s++;if(/[a-z]/.test(p)&&/[A-Z]/.test(p)||/[^A-Za-z0-9]/.test(p))s++;if(p.length>=12)s++;return p.length>=8?Math.max(s,1):Math.min(s,1)};
function field(id,ic1,label,type,val,sup,ac=''){return `<div class="sw-f sw-full" id=f_${id}>${ic(ic1,'li')}<input class=i id=${id} type=${type} value="${esc(val)}" placeholder=" " autocomplete="${ac}" spellcheck=false><label for=${id}>${label}</label>${sup?`<div class=sw-sup>${sup}</div>`:''}</div>`}
function build(){
 const st=SU,V=st.v,steps=D[L].sw_s,cur=Math.min(st.i,3);
 const pk=[0,1,2].map(i=>`<article class="sw-pkg" tabindex=0 role=checkbox aria-checked=false data-k=${i}><div class=sw-top><div class=sw-let>${LT[i]}</div><div class=sw-chk>${ic('ck','s')}</div></div>
  <h3>${t('sw_'+'abc'[i])}</h3><div class=sw-tag>${t('sw_'+'abc'[i]+'t')}</div><div class=sw-price><div class=sw-amt><span class=p></span> <small>FCFA</small><span class=sw-old></span></div><div class=sw-unit>${t(i==2?'sw_pt':'sw_ps')}</div><span class=sw-save hidden></span></div>
  <ul class=sw-feats>${LI[i].map((n,j)=>`<li>${ic(n)}${t('sw_'+'abc'[i]+(j+1))}</li>`).join('')}</ul><div class=sw-more><details><summary>${t('sw_more')} ${ic('dn','s')}</summary><div class=bd>${D[L].sw_ad[i]}</div></details></div></article>`).join('');
 out(`<div class=sw><div class=sw-lang role=group aria-label=Language>${['en','fr'].map(l=>`<button type=button class="${L==l?'on':''}" aria-pressed="${L==l}" onclick="if(L!='${l}')sw()">${l.toUpperCase()}</button>`).join('')}</div><div class=sw-app>
 <div class=sw-brand><div class=sw-logo>${ic('school','f')}</div><h1>${t('sw_brand')}</h1><span class=m>${t('sw_have')} <a href=# onclick="login('');return false">${t('sw_in')}</a></span></div>
 <nav class=sw-stepper aria-label=Progress>${steps.map((s,k)=>`<div class="sw-st ${k==cur&&st.i<4?'on':''} ${k<st.i?'done':''}" ${k==cur&&st.i<4?'aria-current=step':''}><span class=n>${k<st.i?ic('ck','xs'):k+1}</span><span class=l>${s}</span></div>`).join('')}</nav>
 <main class=sw-card>
 <section class="sw-step${st.i==0?' show':''}" data-s=0><h2>${t('sw_h1')}</h2><p class=lead>${t('sw_l1')}</p><div class=sw-g2>
  <div class="sw-sec sw-full">${ic('apt','s')}${t('sw_about')}</div>
  ${field('sc','apt',t('sw_name'),'text',V.school,'','organization')}
  ${field('em','mail',t('sw_mail'),'email',V.email,t('sw_mailh'),'email')}
  <div class="sw-sec sw-full" style="margin-top:12px">${ic('shield','s')}${t('sw_adm')}</div>
  <div class="sw-bn sw-full">${ic('shield')}<div><b>${t('sw_admb')}</b>${t('sw_admt')}</div></div>
  ${field('nm','user',t('sw_full'),'text',V.name,t('sw_fullh'),'name')}
  <div class=sw-f id=f_p>${ic('lock','li')}<input class=i id=p type=password value="${esc(V.pw)}" placeholder=" " autocomplete=new-password><label for=p>${t('sw_pw')}</label><button type=button class=tr id=eye aria-label="${t('sw_show')}">${ic('eye','s')}</button><div class=sw-meter id=mt><i></i><i></i><i></i><i></i></div><div class=sw-sup id=pwh></div></div>
  <div class=sw-f id=f_p2>${ic('lock','li')}<input class=i id=p2 type=password value="${esc(V.pw2)}" placeholder=" " autocomplete=new-password><label for=p2>${t('sw_pwc')}</label><span class=tr id=ckm hidden>${ic('ckc','s')}</span><div class=sw-sup id=pmh></div></div>
  <div class="sw-sec sw-full" style="margin-top:12px">${ic('gift','s')}${t('sw_ref')} <span class=m style="font-weight:400">(${t('sw_refo')})</span></div>
  <div class=sw-f id=f_rf>${ic('gift','li')}<input class=i id=rf type=text value="${esc(V.ref)}" placeholder=" " autocomplete=off autocapitalize=characters spellcheck=false><label for=rf>${t('sw_ref')}</label><span class=tr id=rfk hidden>${ic('ckc','s')}</span><div class=sw-sup id=rfh></div></div>
 </div><div class=sw-err id=e0 role=alert></div><div class=sw-act><span></span><button type=button class="sw-btn fill" id=n0>${t('sw_toPk')} ${ic('ar','s')}</button></div></section>
 <section class="sw-step${st.i==1?' show':''}" data-s=1><h2>${t('sw_h2')}</h2><p class=lead>${t('sw_l2')}</p>
  <div class=sw-bundle>${ic('gift')}<span style="font-weight:600;font-size:14px">${t('sw_bund')}</span><div class=sw-tiers><span class=sw-tier data-n=1>${t('sw_t1')}</span><span class=sw-tier data-n=2 id=t2></span><span class=sw-tier data-n=3>${t('sw_t3')}</span></div><span class=m id=bh style="margin-left:auto"></span></div>
  <div class=sw-pkgs>${pk}</div>
  <div class=sw-ex><div class="sw-x un"><h4>${ic('gift','s')}${t('sw_free')}</h4>${t('sw_freet')}</div><div class=sw-x id=xe><h4>${ic('quiz','s')}${t('sw_ex')} <span class=sw-chip></span></h4>${t('sw_ext')}</div><div class=sw-x id=xt><h4>${ic('award','s')}${t('sw_tp')} <span class=sw-chip></span></h4>${t('sw_tpt')}</div></div>
  <div class=sw-est>${ic('calc')}<label class=g>${t('sw_stu')} <input id=nS type=number min=0 max=100000 value="${st.ns}"></label><label class=g>${t('sw_tea')} <input id=nT type=number min=0 max=10000 value="${st.nt}"></label><div class=tot><b id=tot></b><span>${t('sw_est')} · <span id=sc2></span> · ${t('sw_nopay')}</span></div></div>
  <div class=sw-err id=e1 role=alert></div><div class=sw-act><button type=button class="sw-btn text" data-go=0>${ic('al','s')} ${t('sw_back')}</button><button type=button class="sw-btn fill" id=n1>${t('sw_review')} ${ic('ar','s')}</button></div></section>
 <section class="sw-step${st.i==2?' show':''}" data-s=2><h2>${t('sw_h3')}</h2><p class=lead>${t('sw_l3')}</p><div class=sw-rv>
  <div class=sw-row>${ic('apt')}<div><div class=k>${t('sw_k1')}</div><span id=r1></span></div><button type=button class="sw-btn text ed" data-go=0>${t('sw_ed')}</button></div>
  <div class=sw-row>${ic('mail')}<div><div class=k>${t('sw_k2')}</div><span id=r2></span></div><button type=button class="sw-btn text ed" data-go=0>${t('sw_ed')}</button></div>
  <div class=sw-row>${ic('shield')}<div><div class=k>${t('sw_k3')}</div><span id=r3></span></div><button type=button class="sw-btn text ed" data-go=0>${t('sw_ed')}</button></div>
  <div class=sw-row id=rrf hidden>${ic('gift')}<div><div class=k>${t('sw_k4')}</div><span id=r4></span></div><button type=button class="sw-btn text ed" data-go=0>${t('sw_ed')}</button></div>
  <div class=sw-row style="display:block"><div style="display:flex;align-items:center;gap:16px;margin-bottom:8px">${ic('doc')}<div class=k style="font-size:14px">${t('sw_pk')}</div><button type=button class="sw-btn text ed" data-go=1 style="margin-left:auto">${t('sw_chg')}</button></div><table class=sw-lines id=ln></table></div>
  <div class="sw-bn info">${ic('info')}<div><b>${t('sw_np1')}</b>${t('sw_free1')} ${t('sw_np2')}</div></div>
  <label class=sw-cons><input type=checkbox id=cs ${V.cons?'checked':''}><span>${t('sw_cons')}</span></label></div>
  <div class=sw-err id=e2 role=alert></div><div class=sw-act><button type=button class="sw-btn text" data-go=1>${ic('al','s')} ${t('sw_back')}</button><button type=button class="sw-btn fill" id=n2>${t('sw_sendc')} ${ic('send','s')}</button></div></section>
 <section class="sw-step${st.i==3?' show':''}" data-s=3><div class=sw-otpw><div class=sw-big>${ic('mail')}</div><h2>${t('sw_h4')}</h2>
  <p class=m id=sm></p><div class=sw-otp id=otp>${[0,1,2,3,4,5].map(k=>`<input inputmode=numeric maxlength=1 autocomplete="${k?'off':'one-time-code'}" aria-label="${k+1}/6" value="${esc((st.otp||'')[k]||'')}">`).join('')}</div>
  <p class=m>${t('sw_exp')} <b id=cdn>10:00</b> · ${t('sw_dg')} <a href=# id=rs>${t('sw_rs')}</a></p><p class=m style="margin-top:6px"><a href=# id=wr>${t('sw_wrong')}</a></p>
  <div id=nm2 hidden style="margin-top:14px;text-align:left"><div class=sw-f>${ic('mail','li')}<input class=i id=em2 type=email placeholder=" " value="${esc(V.email)}"><label for=em2>${t('sw_newm')}</label></div><button type=button class="sw-btn tonal" id=sv style="margin-top:12px">${t('sw_savem')}</button></div>
  <div class=sw-err id=e3 role=alert></div><div class=sw-act style="justify-content:center"><button type=button class="sw-btn fill" id=n3 style="min-width:260px">${t('sw_ver')}</button></div></div></section>
 <section class="sw-step${st.i==4?' show':''}" data-s=4><div class=sw-otpw style="max-width:640px"><div class=sw-big style="background:var(--okc);color:var(--ok)">${ic('ckc')}</div><h2>${t('sw_h5')}</h2><p class=m>${w('sw_wel',{n:esc(V.name)})}</p>
  <div class=sw-code><b id=scode>${esc(st.code||'')}</b><button type=button class="sw-btn tonal" id=cp style="height:40px;padding:0 14px">${ic('copy','s')} ${t('sw_copy')}</button></div>
  <div class=sw-cred><span>${t('sw_you')}: <b>${esc(st.user||'')}</b></span></div>
  <div class=sw-bn style="text-align:left">${ic('key')}<div><b>${t('sw_keep')}</b>${t('sw_keept')}</div></div>
  <div class=sw-next><div>${ic('pal')}<br><b>${t('sw_n1')}</b><br><span class=m>${t('sw_n1t')}</span></div><div>${ic('ug')}<br><b>${t('sw_n2')}</b><br><span class=m>${t('sw_n2t')}</span></div><div>${ic('ua')}<br><b>${t('sw_n3')}</b><br><span class=m>${t('sw_n3t')}</span></div></div>
  <div class=sw-act style="justify-content:center"><button type=button class="sw-btn fill" id=n4>${t('sw_dash')} ${ic('ar','s')}</button></div></div></section>
 </main></div></div>`);
 wire();paint()}
function val(id){const e=$('#'+id);return e?e.value:''}
function keep(){const V=SU.v,g=(id,k)=>{const e=$('#'+id);if(e)V[k]=e.value};g('sc','school');g('em','email');g('nm','name');g('p','pw');g('p2','pw2');g('rf','ref');const c=$('#cs');if(c)V.cons=c.checked}
function show(i){keep();SU.i=i;build();scrollTo(0,0)}
function paint(){
 const st=SU,n=nsel(),tier=Math.max(n,1),s=+val('nS')||0,tc=+val('nT')||0;
 document.querySelectorAll('.sw-pkg').forEach(c=>{const i=+c.dataset.k,on=st.sel[i],at=on?tier:Math.min(n+1,3),shown=on?pr(i,tier):pr(i,at),base=pr(i,1);
  c.classList.toggle('sel',!!on);c.setAttribute('aria-checked',!!on);c.querySelector('.p').textContent=shown;
  const o=c.querySelector('.sw-old'),sv=c.querySelector('.sw-save');
  if(shown<base){o.textContent=base;sv.hidden=false;sv.textContent=on?w('sw_sv',{x:base-shown}):t('sw_if')}else{o.textContent='';sv.hidden=true}});
 const pct=Math.round(Math.min(...[0,1,2].map(i=>100-100*pr(i,2)/pr(i,1))));
 const t2=$('#t2');if(t2){t2.textContent=w('sw_t2',{x:pct});document.querySelectorAll('.sw-tier').forEach(x=>x.classList.toggle('on',+x.dataset.n==n));
  $('#bh').textContent=n==0?t('sw_hn0'):n==1?t('sw_hn1')+' '+pct+'%':n==2?t('sw_hn2'):t('sw_hn3')}
 let tot=0,rows='';[0,1,2].forEach(i=>{if(!st.sel[i])return;const q=i==2?tc:s,u=pr(i,tier),sub=q*u;tot+=sub;
  rows+=`<tr><td>${LT[i]} · ${t('sw_'+'abc'[i])}<br><span class=m>${w('sw_ln',{p:u,q:fmt(q),u:t(i==2?'sw_ut':'sw_us')})}</span></td><td>${fmt(sub)} FCFA</td></tr>`});
 const rp=st.refPct||0,disc=Math.round(tot*rp/100);if(rp)rows+=`<tr><td>${w('sw_disc',{x:rp})}</td><td style="color:var(--ok)">− ${fmt(disc)} FCFA</td></tr>`;tot-=disc;
 rows+=`<tr class=total><td>${t('sw_esttot')}<br><span class=m style="font-size:13px;font-weight:400">${w('sw_based',{s:fmt(s),t:fmt(tc)})}</span></td><td>${fmt(tot)} FCFA</td></tr>`;
 const set=(id,h)=>{const e=$('#'+id);if(e)e.innerHTML=h};
 set('ln',rows);set('tot',fmt(tot)+' FCFA');
 const sc2=$('#sc2');if(sc2)sc2.textContent=(n==1?D[L].sw_np[1]:D[L].sw_np[2].replace('[n]',n));
 const ab=st.sel[0]||st.sel[1],all=n==3,chip=(el,on,txt)=>{if(!el)return;el.classList.toggle('un',on);el.classList.toggle('lock',!on);el.querySelector('.sw-chip').innerHTML=(on?ic('ulk','xs'):ic('lk','xs'))+(on?t('sw_inc'):txt)};
 chip($('#xe'),ab,t('sw_exn'));chip($('#xt'),all,t('sw_tpn'));
 const b=$('#n1');if(b)b.disabled=n==0;
 refui();if($('#r1')){$('#rrf').hidden=!st.refPct;$('#r4').textContent=(st.v.ref||'').trim().toUpperCase();$('#r1').textContent=st.v.school;$('#r2').textContent=st.v.email;$('#r3').textContent=st.v.name}
 if($('#sm')){const h=st.hint||st.v.email;$('#sm').innerHTML=st.sent===false?`${t('sw_notsent')} <b>${esc(h)}</b>${t('sw_notsent2')}`:`${t('sw_sent')} <b style="color:var(--on)">${esc(h)}</b>`}
 pw()}
function pw(){const p=val('p'),p2=val('p2'),m=$('#mt');if(!m)return;const sc=p?strength(p):0;
 [...m.children].forEach((x,k)=>x.classList.toggle('on',k<sc));m.classList.toggle('w',sc<3);
 const h=$('#pwh');h.className='sw-sup';h.textContent=p?t('sw_pw'+(sc<=1?1:sc==2?2:sc==3?3:4)):t('sw_pw0');if(sc>=3)h.classList.add('ok');
 const ok=!!p2&&p==p2;$('#ckm').hidden=!ok;const mh=$('#pmh');mh.className='sw-sup'+(ok?' ok':p2?' er':'');mh.textContent=ok?t('sw_match'):p2?t('sw_nomatch'):''}
let rft=0;
function refui(){const h=$('#rfh');if(!h)return;const st=SU,c=(st.v.ref||'').trim(),k=$('#rfk');h.className='sw-sup';
 if(!c){h.textContent=w('sw_refh',{x:10});if(k)k.hidden=true;return}
 if(st.refPct){h.textContent=w('sw_refok',{x:st.refPct});h.classList.add('ok');k.hidden=false;k.classList.add('ok');return}
 k.hidden=true;h.textContent=st.refBad?t('sw_refbad'):t('sw_refchk');if(st.refBad)h.classList.add('er')}
async function refcheck(){const st=SU,c=(st.v.ref||'').trim();st.refPct=0;st.refBad=false;if(!c){refui();paint();return}
 const my=c;const r=await api('ref/check?code='+encodeURIComponent(c));if((SU.v.ref||'').trim()!=my)return;
 if(r.ok&&r.d.pct)st.refPct=r.d.pct;else st.refBad=true;refui();paint()}
const EM=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function err(i,m,f){const e=$('#e'+i);if(e)e.textContent=m||'';document.querySelectorAll('.sw-f.bad').forEach(x=>x.classList.remove('bad'));if(f&&$('#f_'+f))$('#f_'+f).classList.add('bad');const x=$('#'+f);if(x)x.focus()}
async function next0(){keep();const V=SU.v;
 if((V.ref||'').trim()&&!SU.refPct){await refcheck();if(!SU.refPct)return err(0,t('e_refcode'),'rf')}
 if(!V.school.trim())return err(0,t('sw_e_sc'),'sc');if(!EM.test(V.email.trim()))return err(0,t('sw_e_em'),'em');if(!V.name.trim())return err(0,t('sw_e_nm'),'nm');
 if(V.pw.length<8)return err(0,t('sw_e_pw'),'p');if(V.pw!=V.pw2)return err(0,t('sw_e_pm'),'p2');show(1)}
async function send(){keep();const V=SU.v,b=$('#n2');if(!V.cons)return err(2,t('sw_e_cs'));
 if(SU.ticket)return show(3);       // account already created (user came back to this screen): go straight to the code
 b.disabled=true;b.innerHTML=t('sw_wait');
 const r=await api('signup',{school:V.school.trim(),name:V.name.trim(),email:V.email.trim(),password:V.pw,lang:L,modules:MK.filter((m,i)=>SU.sel[i]).join(','),ref:SU.refPct?V.ref.trim():''});
 if(!r.ok){b.disabled=false;b.innerHTML=t('sw_sendc')+' '+ic('send','s');return err(2,em(r.s,r.d.error))}
 Object.assign(SU,{ticket:r.d.ticket,hint:r.d.hint,sent:r.d.sent,user:r.d.username,exp:Date.now()+6e5});SU.i=3;build();clock();const f=document.querySelector('#otp input');if(f)f.focus()}
function clock(){clearInterval(tmr);const tick=()=>{const e=$('#cdn');if(!e){clearInterval(tmr);return}const s=Math.max(0,Math.round((SU.exp-Date.now())/1e3));e.textContent=String(s/60|0).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};tick();tmr=setInterval(tick,1000)}
const otpv=()=>[...document.querySelectorAll('#otp input')].map(x=>x.value).join('');
async function verify(){const c=otpv();if(!/^\d{6}$/.test(c))return err(3,t('sw_e_6'));const b=$('#n3');b.disabled=true;
 const r=await api('auth/verify',{ticket:SU.ticket,code:c});
 if(!r.ok){b.disabled=false;if(r.s==410){SU=null;return login(t('e_expired'),1)}return err(3,em(r.s,r.d.error))}
 SU.code=r.d.code;SU.i=4;clearInterval(tmr);build();scrollTo(0,0)}
function wire(){
 const on=(s,ev,f)=>{const e=$(s);if(e)e.addEventListener(ev,f)};
 on('#n0','click',next0);on('#n1','click',()=>show(2));on('#n2','click',send);on('#n3','click',verify);
 on('#n4','click',()=>home(SU.code));
 document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>show(+b.dataset.go)));
 ['sc','em','nm','p','p2'].forEach(id=>on('#'+id,'input',()=>{pw();err(0,'')}));
 on('#rf','input',()=>{keep();SU.refPct=0;SU.refBad=false;refui();clearTimeout(rft);rft=setTimeout(refcheck,450)});
 document.querySelectorAll('.sw-step[data-s="0"] input').forEach(x=>x.addEventListener('keydown',e=>{if(e.key=='Enter')next0()}));
 on('#eye','click',()=>{const p=$('#p'),h=p.type=='password';p.type=h?'text':'password';$('#p2').type=p.type;$('#eye').innerHTML=ic(h?'eyeoff':'eye','s');$('#eye').setAttribute('aria-label',t(h?'sw_hide':'sw_show'))});
 document.querySelectorAll('.sw-pkg').forEach(c=>{const tog=()=>{SU.sel[+c.dataset.k]=!SU.sel[+c.dataset.k];err(1,'');paint()};
  c.addEventListener('click',e=>{if(e.target.closest('details'))return;tog()});c.addEventListener('keydown',e=>{if((e.key==' '||e.key=='Enter')&&e.target==c){e.preventDefault();tog()}})});
 ['nS','nT'].forEach(id=>on('#'+id,'input',()=>{SU[id=='nS'?'ns':'nt']=Math.max(0,Math.min(+$('#'+id).value||0,1e5));paint()}));
 const o=[...document.querySelectorAll('#otp input')];
 o.forEach((x,k)=>{x.addEventListener('input',()=>{x.value=x.value.replace(/\D/g,'').slice(-1);SU.otp=otpv();if(x.value&&o[k+1])o[k+1].focus();if(otpv().length==6&&$('#n3'))verify()});
  x.addEventListener('keydown',e=>{if(e.key=='Backspace'&&!x.value&&o[k-1]){o[k-1].focus();o[k-1].value=''}if(e.key=='Enter')verify()});
  x.addEventListener('paste',e=>{const d=(e.clipboardData.getData('text')||'').replace(/\D/g,'').slice(0,6);if(!d)return;e.preventDefault();o.forEach((y,j)=>y.value=d[j]||'');SU.otp=d;(o[Math.min(d.length,5)]).focus();if(d.length==6)verify()})});
 on('#rs','click',async e=>{e.preventDefault();const r=await api('auth/resend',{ticket:SU.ticket,lang:L});if(r.s==410){SU=null;return login(t('e_expired'),1)}
  if(r.ok){SU.sent=true;SU.exp=Date.now()+6e5;err(3,'');const el=$('#e3');el.style.color='var(--ok)';el.textContent=t('sw_resent');setTimeout(()=>{if(el){el.textContent='';el.style.color=''}},4000)}else err(3,em(r.s,r.d.error))});
 on('#wr','click',e=>{e.preventDefault();const n=$('#nm2');n.hidden=!n.hidden;if(!n.hidden)$('#em2').focus()});
 on('#sv','click',async()=>{const m=$('#em2').value.trim();if(!EM.test(m))return err(3,t('sw_e_em'));
  const r=await api('auth/email',{ticket:SU.ticket,email:m,lang:L});if(!r.ok)return err(3,em(r.s,r.d.error));SU.v.email=m;Object.assign(SU,{hint:r.d.hint,sent:true,exp:Date.now()+6e5});$('#nm2').hidden=true;err(3,'');paint()});
 on('#cp','click',async()=>{try{await navigator.clipboard.writeText(SU.code)}catch{}const b=$('#cp');b.innerHTML=ic('ck','s')+' '+t('sw_copied');setTimeout(()=>{if($('#cp'))$('#cp').innerHTML=ic('copy','s')+' '+t('sw_copy')},2000)});
 if(SU.i==3)clock()}
window.suWizard=async function(){if(!SU)SU={i:0,sel:[true,false,false],ns:600,nt:40,v:{school:'',email:'',name:'',pw:'',pw2:'',cons:false,ref:window.REFQ||''}};
 build();if(SU.v.ref&&SU.refPct==null)refcheck();try{const r=await fetch('/api/prices');if(r.ok){PR={...DEF,...await r.json()};if($('.sw'))paint()}}catch{}
 const f=$('#sc');if(f&&matchMedia('(hover:hover)').matches&&SU.i==0)f.focus()};
})();

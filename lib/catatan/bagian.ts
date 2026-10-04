import type { Bagian } from "./tipe";

/**
 * The eight parts of "How to Learn and Grow at the institute", written once for both the
 * card shelf on the programme page and the full-read page.
 *
 * The Indonesian is the committee's own summary of the recording; the English and
 * the Arabic are set from it, not from a machine. Where the Ustadz attributed a
 * saying to a named scholar, the attribution is carried across all three languages
 * word for word — that is the one thing in these notes that must not drift.
 *
 * Arabic wording of verses and hadiths follows the standard text of the source, not
 * the automatic transcript, which misheard most of them.
 */
export const BAGIAN: Bagian[] = [
  {
    no: "01",
    id: "muqaddimah",
    kicker: { id: "Muqaddimah", en: "Introduction", ar: "المقدمة" },
    judul: {
      id: "Wahyu itu berat dan ilmu adalah amanah",
      en: "Revelation is heavy, and knowledge is a trust",
      ar: "الوحي ثقيل والعلم أمانة",
    },
    ringkas: { id: "Muqaddimah", en: "Introduction", ar: "المقدمة" },
    poin: [
      {
        id: "Allah menyifati wahyu dengan ثقيل (berat), bukan لين atau يسير. Hal ini selayaknya membuat pihak yang mengemban amanah ini untuk terus berbenah diri dan belajar.",
        en: "Allah calls revelation thaqil, not layyin or yasir. Whoever carries that trust should keep correcting himself and keep learning.",
        ar: "وصف الله الوحي بأنه ثقيل، لا ليّن ولا يسير. فحقيق بمن حمل هذه الأمانة أن يواصل إصلاح نفسه وطلب العلم.",
      },
      {
        id: "Belajar di the institute terlihat gratis, namun hakikatnya ada harga yang harus dibayar dan dipertanggungjawabkan terhadap Allah lalu pihak yang membiayai.",
        en: "Studying at the institute looks free; in truth there is a price to be paid, and an account to be given — to Allah first, then to those who funded it.",
        ar: "الدراسة في المعهد تبدو مجانية، وفي الحقيقة لها ثمن يُدفع وحساب يُؤدَّى: لله أولًا، ثم لمن تحمّل النفقة.",
      },
    ],
    penutup: {
      jenis: "dalil",
      arab: "إِنَّا سَنُلْقِي عَلَيْكَ قَوْلًا ثَقِيلًا",
      terjemah: {
        id: "“Sesungguhnya Kami akan menurunkan kepadamu perkataan yang berat.”",
        en: "“Indeed, We will cast upon you a heavy word.”",
        ar: "”إنا سنلقي عليك قولًا ثقيلًا“",
      },
      sumber: { id: "QS. Al-Muzzammil: 5", en: "Al-Muzzammil: 5", ar: "سورة المزمل: ٥" },
    },
    isi: [
      {
        jenis: "p",
        teks: {
          id: "Ustadz membuka dengan menegaskan kedekatan almamater: beliau dan para hadirin belajar di alamat yang sama, hanya berbeda dimensi waktu. Tujuan sesi ini pun bukan sekadar mengisi kajian, melainkan membawa satu masalah untuk dipikirkan bersama.",
          en: "The Ustadz opened by noting how close the alma mater is: he and the audience studied at the same address, only in a different slice of time. The aim of the session was not to fill a slot, but to bring a problem to think through together.",
          ar: "افتتح الأستاذ بالتذكير بقرب المعهد منه: فقد درس هو والحاضرون في العنوان نفسه، وإنما اختلف الزمان. ولم يكن مقصد اللقاء مجرد ملء وقت، بل طرح مسألة يُفكَّر فيها معًا.",
        },
      },
      {
        jenis: "h3",
        teks: {
          id: "1. Menuntut Ilmu Itu Berat",
          en: "1. Seeking knowledge is heavy",
          ar: "١. طلب العلم ثقيل",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Allah menyifati wahyu dengan kata ثقيل (berat), bukan لين, سهل, atau يسير — bukan ringan.",
          en: "Allah describes revelation as thaqil (heavy) — not layyin, sahl or yasir; never light.",
          ar: "وصف الله الوحي بأنه ثقيل، لا ليّن ولا سهل ولا يسير؛ ليس خفيفًا.",
        },
      },
      {
        jenis: "dalil",
        arab: "إِنَّا سَنُلْقِي عَلَيْكَ قَوْلًا ثَقِيلًا",
        terjemah: {
          id: "“Sesungguhnya Kami akan menurunkan kepadamu perkataan yang berat.”",
          en: "“Indeed, We will cast upon you a heavy word.”",
          ar: "”إنا سنلقي عليك قولًا ثقيلًا“",
        },
        sumber: { id: "QS. Al-Muzzammil: 5", en: "Al-Muzzammil: 5", ar: "سورة المزمل: ٥" },
      },
      {
        jenis: "p",
        teks: {
          id: "Sifat ini muncul setiap kali Allah berbicara tentang Al-Qur’an, Sunnah, ilmu, dan dakwah. Proses turunnya wahyu dapat ditelaah dalam Kitab بدء الوحي, kitab pertama dalam Shahih Al-Bukhari.",
          en: "This quality appears whenever Allah speaks of the Qur’an, the Sunnah, knowledge and da’wah. The descent of revelation can be studied in Kitab بدء الوحي, the first book of Sahih al-Bukhari.",
          ar: "وهذا الوصف يتكرر كلما تحدّث الله عن العلم والدعوة والقرآن والسنة. ونزول الوحي يُدرس في كتاب بدء الوحي، وهو أول كتاب في صحيح البخاري.",
        },
      },
      {
        jenis: "h3",
        teks: {
          id: "2. Mempelajari Wahyu Seharusnya Menjadi Sebab Hidup Berubah",
          en: "2. Studying Revelation Should Be a Cause for a Life to Change",
          ar: "٢. الوحي ينبغي أن يغيّر الحياة",
        },
      },
      {
        jenis: "dalil",
        arab: "اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ، خَلَقَ الْإِنْسَانَ مِنْ عَلَقٍ، اقْرَأْ وَرَبُّكَ الْأَكْرَمُ",
        terjemah: {
          id: "“Bacalah dengan nama Rabbmu yang menciptakan. Dia menciptakan manusia dari segumpal darah. Bacalah, dan Rabbmulah Yang Maha Mulia.”",
          en: "“Read in the name of your Lord who created. He created man from a clinging clot. Read, and your Lord is the Most Generous.”",
          ar: "”اقرأ باسم ربك الذي خلق، خلق الإنسان من علق، اقرأ وربك الأكرم“",
        },
        sumber: { id: "QS. Al-‘Alaq: 1–3", en: "Al-‘Alaq: 1–3", ar: "سورة العلق: ١–٣" },
      },
      {
        jenis: "p",
        teks: {
          id: "Nabi ﷺ pulang dalam keadaan pucat, meminta diselimuti — زملوني زملوني — lalu Khadijah radhiyallahu ‘anha mengantar beliau kepada Waraqah bin Naufal. Lima ayat itu mengubah hidup beliau secara total; iman masuk ke dalam hati.",
          en: "The Prophet ﷺ came home pale and asked to be covered — زملوني زملوني — and Khadijah, may Allah be pleased with her, took him to Waraqah ibn Nawfal. Those five verses changed his life entirely; faith entered the heart.",
          ar: "رجع النبي ﷺ وقد تغيّر لونه، فقال: ”زمّلوني زمّلوني“، ثم انطلقت به خديجة رضي الله عنها إلى ورقة بن نوفل. فهذه الآيات الخمس غيّرت حياته كلها؛ ودخل الإيمان القلب.",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Perubahan itu tidak langsung berupa “sukses”. Dahulu beliau disanjung, lalu mulai dicela — terutama setelah turun perintah dakwah terbuka: يا أيها المدثر قم فأنذر. Adapun kita, ayat yang sama sering berhenti pada hafalan dan terjemahan — sementara kita masih bersantai. Jika tidak ada perubahan pada karakter, sifat, dan sikap, berarti ada yang salah dan harus segera diperbaiki.",
          en: "The change did not arrive as “success”. He had been praised; then he was reviled — above all after the command to preach openly: يا أيها المدثر قم فأنذر. For us the same verses often stop at memorisation and translation — while we are still taking our ease. If character, disposition and conduct have not changed, something is wrong and must be put right now.",
          ar: "ولم يكن التغيّر نجاحًا ظاهرًا؛ فقد كان يُمدح ثم صار يُذَم، ولا سيما بعد الأمر بالجهر بالدعوة: ”يا أيها المدثر قم فأنذر“. أما نحن فكثيرًا ما تقف الآيات نفسها عند الحفظ والترجمة — ونحن لا نزال في دَعَة. فإن لم تتغيّر الأخلاق والطباع والمواقف فثمّ خلل يجب إصلاحه.",
        },
      },
      {
        jenis: "h3",
        teks: {
          id: "3. Ilmu Akan Dimintai Pertanggungjawaban",
          en: "3. Knowledge will be asked about",
          ar: "٣. العلم مسؤول عنه",
        },
      },
      {
        jenis: "dalil",
        arab: "وَعَنْ عِلْمِهِ فِيمَا فَعَلَ",
        terjemah: {
          id: "“…dan tentang ilmunya, apa yang ia amalkan dengannya.”",
          en: "“…and about his knowledge, what he did with it.”",
          ar: "”وعن علمه فيما فعل“",
        },
        sumber: {
          id: "Potongan hadits riwayat At-Tirmidzi no. 2417",
          en: "Part of a hadith narrated by At-Tirmidhi no. 2417",
          ar: "جزء من حديث رواه الترمذي رقم ٢٤١٧",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Pertanyaan ini lebih berat bagi penuntut ilmu daripada orang awam. Orang awam tidak mempelajari khilaf, Alfiyah Ibnu Malik, Qawa‘id Fiqhiyyah, Raudhatun Nazhir, atau Bidayatul Mujtahid; mahasiswa the institute mempelajari semuanya. Masuk institut berarti memperkuat قولًا ثقيلًا dalam hidup, dan cara berpikir harus berubah: Nabi ﷺ tidak bisa tidur setelah menerima wahyu, sementara sebagian kita tertidur di kelas saat mempelajarinya. Dan bukan hanya ilmunya: biaya masuk mahasiswa the institute sampai ia lulus bukan nominal yang kecil — bisa dikatakan sangat besar — dan itu ditanggung Kerajaan Arab Saudi. Semuanya akan ditanya pada hari kiamat.",
          en: "The question weighs more on a student of knowledge than on a layman. A layman does not study juristic disagreement, the Alfiyya of Ibn Malik, the Qawa‘id Fiqhiyyah, Rawdat an-Nazir or Bidayat al-Mujtahid; a the institute student studies all of it. Entering the institute means taking on more of that heavy word, and the way one thinks has to change: the Prophet ﷺ could not sleep after revelation came, while some of us sleep in the class where it is taught. And not the knowledge alone: what it costs to carry a the institute student from entry to graduation is no small sum — it can fairly be called very large — and the Kingdom of Saudi Arabia bears it. All of it will be asked about.",
          ar: "وهذا السؤال على طالب العلم أثقل منه على العامي؛ فالعامي لا يدرس الخلاف ولا ألفية ابن مالك ولا القواعد الفقهية ولا روضة الناظر ولا بداية المجتهد، وطالب المعهد يدرس ذلك كله. والالتحاق بالمعهد زيادة في القول الثقيل، فلا بد أن تتغيّر طريقة التفكير: النبي ﷺ لم يستطع النوم بعد نزول الوحي، وبعضنا ينام في حلقة درسه. وليس العلم وحده: فما يُنفق على طالب المعهد من دخوله إلى تخرجه ليس بالمبلغ اليسير — بل يصح أن يُقال إنه كبير جدًا — وتتحمّله المملكة العربية السعودية. وسيُسأل عن ذلك كله يوم القيامة.",
        },
      },
      {
        jenis: "h3",
        teks: {
          id: "4. Peta Indonesia: Fardhu Kifayah Rasa Fardhu ‘Ain",
          en: "4. The map of Indonesia: fard kifayah that feels like fard ‘ayn",
          ar: "٤. خريطة إندونيسيا: فرض كفاية بطعم فرض العين",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Indonesia berpenduduk ± 280 juta jiwa dengan umat Islam ± 87%. Mengurus umat Islam saja belum cukup, apalagi belasan persen sisanya yang juga harus didakwahi. Karena kebutuhan belum tertutupi, semua takhashshush yang dipelajari naik dari fardhu kifayah menjadi seperti fardhu ‘ain.",
          en: "Indonesia has about 280 million people, roughly 87% Muslim. Serving the Muslims alone is not yet enough, let alone the remaining tenth or more who must also be called. Because the need is unmet, every specialisation studied here rises from fard kifayah to something close to fard ‘ayn.",
          ar: "سكان إندونيسيا نحو ٢٨٠ مليون نسمة، والمسلمون نحو ٨٧٪. ورعاية المسلمين وحدها لم تكتمل بعد، فكيف بمن بقي ممن يجب دعوتهم؟ ولمّا كانت الحاجة غير مسدودة ارتفع كل تخصص من فرض الكفاية إلى ما يشبه فرض العين.",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Kondisi berbeda di Riyadh: lulusan syariah kesulitan mendapat pekerjaan karena kebutuhan sudah terpenuhi, dan kajian ulama besar hanya dihadiri puluhan orang. Mufti saat itu, Syaikh Abdul Aziz Alu Syaikh, dapat ditemui seusai shalat di masjid beliau yang jamaahnya hanya sekitar dua shaf. Dakwah hijrah memang naik, tetapi Indonesia terlalu luas untuk dinilai hanya dari media sosial.",
          en: "Riyadh is another matter: Shari’ah graduates struggle to find work because the need is already covered, and the lessons of great scholars are attended by dozens. The Mufti at the time, Shaykh ‘Abd al-‘Aziz Al ash-Shaykh, could be met after prayer in his mosque, whose congregation filled about two rows. The turn towards practice is real, but Indonesia is far too large to be judged from social media.",
          ar: "والحال في الرياض غير ذلك: خريجو الشريعة يجدون صعوبة في العمل لأن الحاجة سُدّت، ودروس كبار العلماء يحضرها العشرات. والمفتي حينها الشيخ عبد العزيز آل الشيخ يمكن لقاؤه بعد الصلاة في مسجده الذي لا يتجاوز جمعه صفّين. ونعم، ازدادت الصحوة، لكن إندونيسيا أوسع من أن تُقاس بوسائل التواصل.",
        },
      },
      {
        jenis: "h3",
        teks: {
          id: "5. Yaqazhah dan Cara Berpikir dari Hari Akhir",
          en: "5. Awakening, and thinking from the last day backwards",
          ar: "٥. اليقظة والتفكير من اليوم الآخر",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Ibnul Qayyim rahimahullah dalam Madarijus Salikin menjadikan yaqazhah (sadar) sebagai tahapan pertama: sadar siapa diri kita dan apa identitas kita, sadar tanggung jawab (mas’uliyyah) ke depan, lalu tetapkan apa yang harus dikerjakan hari ini.",
          en: "Ibn al-Qayyim, may Allah have mercy on him, in Madarijus Salikin, makes yaqazhah — awakening — the first station: know who you are and what your identity is, know the responsibility ahead, then decide what must be done today.",
          ar: "جعل ابن القيم في مدارج السالكين اليقظة أول المنازل: أن تعرف من أنت وما هويتك، وأن تعرف مسؤوليتك القادمة، ثم تحدّد ما يجب عمله اليوم.",
        },
      },
      {
        jenis: "dalil",
        arab: "يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَلْتَنْظُرْ نَفْسٌ مَا قَدَّمَتْ لِغَدٍ",
        terjemah: {
          id: "“Wahai orang-orang yang beriman, bertakwalah kepada Allah, dan hendaklah setiap jiwa memperhatikan apa yang telah ia persiapkan untuk hari esok.”",
          en: "“O you who believe, fear Allah, and let every soul look to what it has put forth for tomorrow.”",
          ar: "”يا أيها الذين آمنوا اتقوا الله ولتنظر نفس ما قدمت لغد“",
        },
        sumber: { id: "QS. Al-Hasyr: 18", en: "Al-Hashr: 18", ar: "سورة الحشر: ١٨" },
      },
      {
        jenis: "p",
        teks: {
          id: "Kerangka berpikir iman kepada hari akhir: tentukan dahulu apa yang ingin dipersembahkan di hadapan Maliki Yaumiddin, lalu persiapkan dari sekarang — bukan mengerjakan apa saja di dunia lalu baru memikirkan akhirat, dan bukan pula “pokoknya saya hanya mau belajar ini” tanpa arah. Marilah menjadi dewasa: antum bukan anak-anak, dan antum dipercaya membawa risalah ini.",
          en: "This is what belief in the last day does to planning: decide first what you want to present before the King of the Day of Judgement, then prepare for it from now — not doing whatever comes and thinking about the hereafter afterwards, and not “I only want to study this” with no direction either. Let us be grown: you are not children, and you are trusted with this message.",
          ar: "وهذا أثر الإيمان باليوم الآخر في التخطيط: حدّد أولًا ما تريد أن تقدّمه بين يدي مالك يوم الدين، ثم استعدّ له من الآن — لا أن تعمل ما اتفق ثم تفكر في الآخرة، ولا أن تقول ”لا أريد إلا هذا“ بلا وجهة. فلنكن كبارًا: لستم صغارًا، وقد اؤتمنتم على هذه الرسالة.",
        },
      },
    ],
  },

  {
    no: "02",
    id: "pertanyaan-1",
    kicker: { id: "Pertanyaan 1", en: "Question 1", ar: "السؤال الأول" },
    judul: {
      id: "Skill di luar ilmu agama: dakwah di atas tiga bashirah",
      en: "Skills beyond the religious sciences: da’wah upon three basirah",
      ar: "مهارات وراء العلم الشرعي: الدعوة على ثلاث بصائر",
    },
    ringkas: {
      id: "Skill pendukung di luar ilmu agama",
      en: "Skills beyond the religious sciences",
      ar: "المهارات خارج العلم الشرعي",
    },
    poin: [
      {
        id: "Ilmu yang sahih · memahami kondisi mad‘u · cara penyampaian yang tepat.",
        en: "Sound knowledge · understanding the audience · the right way to deliver.",
        ar: "علم صحيح · فهم حال المدعو · حسن الأداء.",
      },
      {
        id: "Berdakwah adalah kerja kolektif. Bangun tiga pondasi untuk waktu kita: sendiri, bersama teman, belajar ke guru.",
        en: "Da’wah is collective work. Build three foundations for your time: alone, with peers, learning from a teacher.",
        ar: "الدعوة عمل جماعي. فابنِ لوقتك ثلاثة أسس: وحدك، ومع إخوانك، وتعلّمًا على شيخ.",
      },
    ],
    penutup: {
      jenis: "dalil",
      arab: "قُلْ هَٰذِهِ سَبِيلِي أَدْعُو إِلَى اللَّهِ ۚ عَلَىٰ بَصِيرَةٍ",
      terjemah: {
        id: "“Katakanlah: Inilah jalanku. Aku mengajak kepada Allah di atas bashirah.”",
        en: "“Say: This is my way. I call to Allah upon clear insight.”",
        ar: "”قل هذه سبيلي أدعو إلى الله على بصيرة“",
      },
      sumber: { id: "QS. Yusuf: 108", en: "Yusuf: 108", ar: "سورة يوسف: ١٠٨" },
    },
    isi: [
      {
        jenis: "tanya",
        teks: {
          id: "Pertanyaan: selain belajar ilmu agama di kampus, adakah skill lain yang harus dibarengi agar kami dapat membawa risalah dakwah dengan lebih baik?",
          en: "The question: besides the religious sciences on campus, what other skills should go alongside them so that we can carry the message better?",
          ar: "السؤال: إلى جانب العلم الشرعي في المعهد، ما المهارات التي ينبغي أن تصاحبه لنحمل الرسالة على وجه أحسن؟",
        },
      },
      {
        jenis: "h3",
        teks: { id: "Jawaban Ustadz", en: "The Ustadz’s answer", ar: "جواب الأستاذ" },
      },
      {
        jenis: "dalil",
        arab: "قُلْ هَٰذِهِ سَبِيلِي أَدْعُو إِلَى اللَّهِ ۚ عَلَىٰ بَصِيرَةٍ أَنَا وَمَنِ اتَّبَعَنِي",
        terjemah: {
          id: "“Katakanlah: Inilah jalanku. Aku dan orang-orang yang mengikutiku mengajak kepada Allah di atas bashirah.”",
          en: "“Say: This is my way. I call to Allah upon clear insight — I and those who follow me.”",
          ar: "”قل هذه سبيلي أدعو إلى الله على بصيرة أنا ومن اتبعني“",
        },
        sumber: { id: "QS. Yusuf: 108", en: "Yusuf: 108", ar: "سورة يوسف: ١٠٨" },
      },
      {
        jenis: "p",
        teks: {
          id: "Menurut Syaikh Ibnul ‘Utsaimin rahimahullah, bashirah dalam dakwah terbagi menjadi tiga.",
          en: "According to Shaykh Ibn al-‘Uthaymin, may Allah have mercy on him, basirah in da’wah is of three kinds.",
          ar: "قال الشيخ ابن عثيمين: البصيرة في الدعوة ثلاث.",
        },
      },
      {
        jenis: "h3",
        teks: {
          id: "a. Bashirah terhadap ilmu yang disampaikan",
          en: "a. Insight into the knowledge conveyed",
          ar: "أ. البصيرة بما يُدعى إليه",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Isi dakwah harus valid, baik dari sisi keabsahan nash (shihhatun nushush) maupun ketepatan pemahaman terhadapnya (shihhatu fahmin nushush). Nash bisa sahih, tetapi pemahaman kita salah. Kaidahnya: “tsabbitil ‘arsya tsummanqusy” — tegakkan singgasana dahulu, lalu diukir. Saat menukil pendapat mazhab, pastikan itu pendapat mu‘tamad dan ketahui rujukannya.",
          en: "The content must be sound, both in the authenticity of the texts and in the accuracy of one’s understanding of them. A text can be authentic while the understanding of it is wrong. The maxim: “thabbit al-‘arsh thummanqush” — set the throne up first, then carve it. When quoting a school’s position, make sure it is the relied-upon one and know where it comes from.",
          ar: "لا بد أن يكون المضمون صحيحًا: صحة النصوص وصحة فهم النصوص. فقد يصحّ النص ويخطئ الفهم. والقاعدة: ”ثبّت العرش ثم انقش“. وإذا نقلتَ قول مذهب فتأكّد أنه المعتمد واعرف مرجعه.",
        },
      },
      {
        jenis: "h3",
        teks: {
          id: "b. Bashirah terhadap kondisi mad‘u",
          en: "b. Insight into the audience’s condition",
          ar: "ب. البصيرة بحال المخاطَبين",
        },
      },
      {
        jenis: "dalil",
        arab: "وَمَا أَرْسَلْنَا مِنْ رَسُولٍ إِلَّا بِلِسَانِ قَوْمِهِ لِيُبَيِّنَ لَهُمْ",
        terjemah: {
          id: "“Tidaklah Kami mengutus seorang rasul pun melainkan dengan bahasa kaumnya, agar ia dapat memberi penjelasan kepada mereka.”",
          en: "“We sent no messenger except in the tongue of his people, so that he might make things clear to them.”",
          ar: "”وما أرسلنا من رسول إلا بلسان قومه ليبيّن لهم“",
        },
        sumber: { id: "QS. Ibrahim: 4", en: "Ibrahim: 4", ar: "سورة إبراهيم: ٤" },
      },
      {
        jenis: "p",
        teks: {
          id: "Fasih berbahasa Indonesia tidak otomatis membuat kita mampu berdakwah kepada orang Indonesia. Dai perlu belajar sejarah, sosiologi, antropologi, adat, karakter, dan sifat masyarakat — dan materi ini tidak diajarkan secara utuh di fakultas mana pun di institut, sehingga harus dicari di luar kampus. Karakter masyarakat berbeda-beda: Jawa dan Sumatera berbeda, Jakarta dan desa berbeda; dai yang berhasil di kota belum pasti berhasil di desa.",
          en: "Fluency in Indonesian does not by itself make a person able to preach to Indonesians. A preacher needs history, sociology, anthropology, custom, the character and temperament of a people — and none of that is taught whole in any faculty at the institute, so it must be sought outside. Societies differ: Java is not Sumatra, Jakarta is not a village; a preacher who succeeds in the city will not necessarily succeed in a village.",
          ar: "وإتقان اللغة الإندونيسية لا يجعل صاحبه قادرًا على دعوة الإندونيسيين. فالداعية يحتاج إلى التاريخ وعلم الاجتماع والأنثروبولوجيا والعادات وطبائع الناس — وهذا لا يُدرَّس كاملًا في أي كلية بالمعهد، فليُطلب خارجه. والطباع تختلف: جاوة غير سومطرة، وجاكرتا غير القرية؛ وما نجح في المدينة قد لا ينجح في الريف.",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Keberhasilan dakwah Nabi ﷺ juga didukung pemahaman beliau terhadap kaumnya. Kaidahnya: “ahlu Makkah adra bisyi‘abiha” — penduduk Makkah paling tahu jalan-jalannya. Catatan untuk alumni pondok: mayoritas hadirin mondok sejak SD atau SMP, sehingga justru kurang memahami kehidupan nyata di kota asalnya sendiri. Ke depan, peta dakwah mengarah ke global citizen; bahasa Inggris hanya satu variabel, dai juga perlu memahami bagaimana dunia berjalan dan siapa yang memengaruhinya.",
          en: "Part of the Prophet’s success in da’wah was his knowledge of his own people. The maxim: “ahl Makkah adra bishi‘abiha” — the people of Makkah know its paths best. A note for boarding-school alumni: most of the audience left home at primary or junior-secondary age and so understand their own home city least of all. Looking ahead, the map runs towards the global citizen; English is only one variable, and a preacher also needs to understand how the world moves and who moves it.",
          ar: "ومن أسباب نجاح دعوة النبي ﷺ معرفته بقومه. والقاعدة: ”أهل مكة أدرى بشعابها“. وملاحظة لخريجي المعاهد الداخلية: أكثر الحاضرين سكنوا الأقسام الداخلية منذ الابتدائية أو المتوسطة، فهم أقل الناس معرفة بواقع مدنهم. والخريطة القادمة تتجه إلى المواطن العالمي؛ والإنجليزية متغيّر واحد فقط، ويحتاج الداعية أيضًا أن يفهم كيف يسير العالم ومن يؤثر فيه.",
        },
      },
      {
        jenis: "h3",
        teks: {
          id: "c. Bashirah dalam cara penyampaian",
          en: "c. Insight into the manner of delivery",
          ar: "ج. البصيرة في كيفية الدعوة",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Setelah memahami kondisi mad‘u, dai harus tahu cara menyampaikan yang tepat, dan hal itu harus dipelajari. Public speaking penting, tetapi hanya satu dari banyak variabel. IPK tinggi tidak bermanfaat bagi umat jika ilmu tidak dapat disampaikan: siapkan ilmu dengan serius, dan siapkan juga cara mentransfernya dengan serius.",
          en: "Once the audience is understood, the preacher must know how to deliver — and that has to be learned. Public speaking matters, but it is one variable among many. A high GPA serves the ummah nothing if the knowledge cannot be conveyed: prepare the knowledge seriously, and prepare the transfer of it just as seriously.",
          ar: "وبعد فهم حال المدعو لا بد أن يعرف الداعية كيف يوصل، وهذا يُتعلَّم. والخطابة مهمة لكنها متغيّر من متغيرات. والمعدل المرتفع لا ينفع الأمة إذا لم يصل العلم: فأعدّ العلم بجدّ، وأعدّ وسيلة نقله بجدّ كذلك.",
        },
      },
      {
        jenis: "h3",
        teks: { id: "Lima nasihat pendukung", en: "Five supporting counsels", ar: "خمس وصايا" },
      },
      {
        jenis: "ul",
        butir: [
          {
            id: "Jangan berdakwah sendirian. Jadilah individu yang komunal dengan tiga waktu yang seimbang sebagaimana dijelaskan Syaikh Al-‘Ushaimi hafizhahullah: belajar sendiri, belajar bersama teman, dan merapat kepada guru. Siapa yang memiliki tiga waktu ini akan solid dalam jangka panjang.",
            en: "Never preach alone. Be a communal individual with three balanced times, as Shaykh Al-‘Usaymi sets them out: studying alone, studying with peers, and drawing close to a teacher. Whoever has all three stays solid over the long run.",
            ar: "لا تدعُ وحدك. كن فردًا جماعيًا بثلاثة أوقات متوازنة: وقت تدرس فيه وحدك، ووقت مع إخوانك، ووقت قريبًا من شيخك. ومن جمعها ثبت على المدى الطويل.",
          },
          {
            id: "Ambil ilmu sesuai keunggulan guru. Masyayikh dimaksimalkan untuk bashirah pertama; untuk bashirah kedua, dekatilah asatidzah yang berdakwah di Indonesia — dan jika ingin berdakwah di kota tertentu, dekati guru yang memahami peta kota itu.",
            en: "Take from each teacher what he is strongest in. Maximise the shaykhs for the first basirah; for the second, draw close to the teachers working in Indonesia — and if you mean to preach in a particular city, find the teacher who knows that city’s map.",
            ar: "خذ من كل شيخ ما برع فيه. فاستفد من المشايخ في البصيرة الأولى، وللثانية اقترب من المشايخ العاملين في إندونيسيا — وإن أردت الدعوة في مدينة بعينها فالزم من يعرف خريطتها.",
          },
          {
            id: "Lanjutkan estafet, jangan mulai dari nol: ابدأ من حيث انتهى الناس. Sebagian hal memang harus dirintis dari bawah; sebagian lain cukup melanjutkan apa yang sudah dilakukan para senior.",
            en: "Continue the relay; do not start from zero: ابدأ من حيث انتهى الناس. Some things must indeed be built from the ground up; others need only carry on what those ahead of you have already done.",
            ar: "واصل السباق ولا تبدأ من الصفر: ”ابدأ من حيث انتهى الناس“. فبعض الأمور لا بد من تأسيسها، وبعضها يكفي أن تواصل ما فعله من سبقك.",
          },
          {
            id: "Hati-hati dengan media sosial. Konten hari ini dapat “dikorek habis” 10–15 tahun lagi ketika seseorang sudah menjadi tokoh; kepekaan seperti ini kebanyakan ada di level senior, bukan di level mahasiswa, secerdas apa pun ia.",
            en: "Be careful on social media. What is posted today can be dug up in ten or fifteen years, once a person has become someone; that sense mostly belongs to the senior level, not the student level, however bright the student.",
            ar: "واحذر وسائل التواصل. فما يُنشر اليوم يُستخرج بعد عشر أو خمس عشرة سنة حين يصير صاحبه معروفًا؛ وهذه الفطنة عند الكبار لا عند الطلاب مهما بلغ ذكاؤهم.",
          },
          {
            id: "Perbaiki akhlak dan adab. Indonesia menjadi negeri dengan populasi muslim terbesar bukan karena perang atau perdebatan, melainkan karena akhlak; sejarawan sepakat tentang hal itu, dan yang diperselisihkan hanya waktu masuknya Islam.",
            en: "Refine character and manners. Indonesia became the largest Muslim nation not through war or debate but through character; historians agree on that, and dispute only when Islam arrived.",
            ar: "وأصلح خُلقك وأدبك. فإندونيسيا صارت أكبر بلد مسلم لا بحرب ولا بجدال بل بالأخلاق؛ اتفق المؤرخون على ذلك، وإنما اختلفوا في زمن دخول الإسلام.",
          },
        ],
      },
      {
        jenis: "dalil",
        arab: "الْبَرَكَةُ مَعَ أَكَابِرِكُمْ",
        terjemah: {
          id: "“Keberkahan itu bersama orang-orang senior di antara kalian.”",
          en: "“Blessing is with your elders.”",
          ar: "”البركة مع أكابركم“",
        },
        sumber: {
          id: "HR. Ibnu Hibban no. 559",
          en: "Narrated by Ibn Hibban no. 559",
          ar: "رواه ابن حبان رقم ٥٥٩",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Semua ini dikerjakan tanpa mengabaikan pelajaran kampus. Kaidahnya: al-jam‘u aula minat tarjih in amkana — menggabungkan keduanya lebih utama daripada memilih salah satu, selama memungkinkan.",
          en: "All of this is done without neglecting the campus syllabus. The maxim: al-jam‘u awla min at-tarjih in amkana — combining the two is better than preferring one, whenever it is possible.",
          ar: "وكل ذلك من غير إهمال لدروس المعهد. والقاعدة: الجمع أولى من الترجيح إن أمكن.",
        },
      },
    ],
  },

  {
    no: "03",
    id: "pertanyaan-3",
    kicker: { id: "Pertanyaan 3", en: "Question 3", ar: "السؤال الثالث" },
    judul: {
      id: "Idarah, iqtishad, lughah, syariah, dan i’dad",
      en: "Idarah, iqtisad, lughah, shari’ah and i’dad",
      ar: "الإدارة والاقتصاد واللغة والشريعة والإعداد",
    },
    ringkas: {
      id: "Peran mahasiswa Idarah & Iqtishad",
      en: "The role of Idarah & Iqtisad",
      ar: "دور طلاب الإدارة والاقتصاد",
    },
    poin: [
      {
        id: "Masing-masing fakultas punya PR yang harus dipenuhi setiap thalabahnya. Banyak hal perlu dipelajari dan dilatih agar maksimal di bidangnya.",
        en: "Every faculty sets its own homework for its students. There is much to learn and to practise before anyone is at their best in a field.",
        ar: "لكل كلية واجبها على طلابها. وثَمَّ كثير يُتعلَّم ويُتمرَّن عليه قبل أن يبلغ المرء تمامه في تخصصه.",
      },
      {
        id: "Perlunya ta’awun antarbidang. Masing-masing punya porsinya dalam dakwah.",
        en: "The fields need one another. Each has its own share in the work of da’wah.",
        ar: "ولا بد من التعاون بين التخصصات. فلكل واحد نصيبه في الدعوة.",
      },
    ],
    penutup: {
      jenis: "dalil",
      arab: "قُلْ كُلٌّ يَعْمَلُ عَلَىٰ شَاكِلَتِهِ",
      terjemah: {
        id: "“Katakanlah: Setiap orang berbuat menurut keadaannya masing-masing.”",
        en: "“Say: Each works according to his own manner.”",
        ar: "”قل كل يعمل على شاكلته“",
      },
      sumber: { id: "QS. Al-Isra’: 84", en: "Al-Isra’: 84", ar: "سورة الإسراء: ٨٤" },
    },
    isi: [
      {
        jenis: "tanya",
        teks: {
          id: "Pertanyaan: jurusan kami (Idari) dikabarkan akan ditutup. Bagaimana kami memposisikan diri dan mengambil peran dalam dakwah? Ustadz mengawali dengan kaidah الحكم على الشيء فرع عن تصوره — menghukumi sesuatu bergantung pada pemahaman terhadap gambaran utuhnya — dan karena beliau tidak memiliki gambaran utuh tentang Fakultas Idarah, nasihat berikut bersifat umum.",
          en: "The question: our faculty (Idari) is said to be closing. How do we place ourselves and take a role in da’wah? The Ustadz began with the maxim الحكم على الشيء فرع عن تصوره — judging a thing is a branch of conceiving it — and said he had no full picture of the Idarah faculty, so the advice that follows is general.",
          ar: "السؤال: يُقال إن كليتنا (الإدارية) ستُغلق، فكيف نضع أنفسنا ونأخذ دورنا في الدعوة؟ فبدأ الأستاذ بقاعدة ”الحكم على الشيء فرع عن تصوره“، وذكر أنه لا يملك تصورًا كاملًا عن كلية الإدارة، فالنصيحة عامة.",
        },
      },
      {
        jenis: "h3",
        teks: { id: "Jawaban Ustadz", en: "The Ustadz’s answer", ar: "جواب الأستاذ" },
      },
      {
        jenis: "h3",
        teks: {
          id: "a. Idarah adalah kebutuhan dakwah",
          en: "a. Idarah is a need of da’wah",
          ar: "أ. الإدارة حاجة دعوية",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Semua fakultas adalah fardhu kifayah rasa fardhu ‘ain, termasuk idarah dan lughah. Jika Jami‘ah Imam hanya berisi ulama spesialis ilmu syar‘i, the institute tidak akan pernah ada di Indonesia. the institute lahir dari kerja sama dua negara, dan kerja sama itu tidak mungkin terjadi tanpa idarah yang solid di kedua pihak — saat akad maupun dalam pelaksanaannya hingga hari ini. Hal yang sama berlaku untuk pondok dan sekolah.",
          en: "Every faculty is fard kifayah that feels like fard ‘ayn, idarah and lughah included. Had Imam University held only specialists in the religious sciences, the institute would never have existed in Indonesia. the institute came out of a partnership between two states, and no such partnership happens without solid administration on both sides — at the signing and in the running of it ever since. The same holds for every school and boarding school.",
          ar: "وكل الكليات فرض كفاية بطعم فرض العين، ومنها الإدارة واللغة. ولو لم يكن في جامعة الإمام إلا المتخصصون في الشرعي لما قام المعهد في إندونيسيا. فالمعهد ثمرة شراكة بين دولتين، ولا تقوم شراكة كهذه بلا إدارة متينة من الطرفين — عند العقد وفي التسيير إلى اليوم. وكذلك المدارس والمعاهد.",
        },
      },
      {
        jenis: "h3",
        teks: { id: "b. Keunggulan pembeda", en: "b. The distinguishing edge", ar: "ب. الميزة الفارقة" },
      },
      {
        jenis: "p",
        teks: {
          id: "Ahli manajemen yang memiliki iman solid, akidah kuat, dan literasi bahasa Arab (mampu membaca kitab klasik) hampir tidak memiliki pesaing. Tambahkan literasi bahasa Inggris, karena banyak rujukan manajemen modern berbahasa Inggris. Pertanyaannya: apakah kalian benar-benar ahli? Jika materi di ma‘had kurang, carilah di luar — temui para ahli dan senior, lakukan wawancara nonformal dengan semangat mahasiswa.",
          en: "A management specialist with firm faith, sound creed and Arabic literacy — able to read the classical books — has almost no competitor. Add English, since much of modern management literature is in it. The question is whether you are genuinely expert. If the institute’s syllabus falls short, go outside for it: meet the practitioners and the seniors, interview them informally, with a student’s appetite.",
          ar: "ومن جمع الإدارة إلى إيمان راسخ وعقيدة صحيحة وقدرة على قراءة كتب التراث فلا يكاد يجد منافسًا. وزد الإنجليزية، فأكثر مراجع الإدارة الحديثة بها. والسؤال: هل أنتم متخصصون حقًا؟ فإن قصرت مواد المعهد فاطلبها خارجه: القَ أهل الخبرة والكبار، وحاورهم حوارًا غير رسمي بهمّة الطالب.",
        },
      },
      {
        jenis: "h3",
        teks: {
          id: "c. Gali warisan peradaban Islam",
          en: "c. Dig into the Muslim civilisational inheritance",
          ar: "ج. انبش تراث الحضارة الإسلامية",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Temukan formula idarah era Khulafaur Rasyidin dan Umawiyyah, termasuk kebangkitan di Andalusia ketika Syam mulai rapuh. Peradaban Barat tidak lepas dari fondasi Andalusia. Peradaban Islam runtuh bukan karena sistem atau idarahnya lemah, melainkan karena SDM-nya terfitnah dunia dan saling berselisih (tanazu‘), seperti pada era Muluk ath-Thawa’if hingga Granada jatuh.",
          en: "Look for the administrative formula of the Rightly-Guided and Umayyad eras, and the revival in Andalusia as Syria weakened. Western civilisation is not free of Andalusian foundations. Muslim civilisation fell not because its systems or administration were weak but because its people were tried by the world and fell into discord — the age of the party kings, down to the fall of Granada.",
          ar: "ابحث عن صيغة الإدارة في عهد الخلفاء الراشدين وبني أمية، وفي نهضة الأندلس حين وهن الشام. والحضارة الغربية ليست بعيدة عن أسس أندلسية. وما سقطت الحضارة الإسلامية لضعف نظامها أو إدارتها، بل لأن رجالها فُتنوا بالدنيا وتنازعوا — كعصر ملوك الطوائف حتى سقوط غرناطة.",
        },
      },
      {
        jenis: "h3",
        teks: {
          id: "d. Tidak ada kasta antarfakultas",
          en: "d. There is no caste between faculties",
          ar: "د. لا طبقية بين الكليات",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Jangan minder terhadap mahasiswa syariah — semua pihak saling membutuhkan, dan lulusan syariah tidak dapat membangun pondok tanpa manajemen yang baik. Setiap orang bekerja sesuai keahliannya: lughah fokus pada lughah, idarah pada idarah, syariah pada syariah. Sebagian mahasiswa punya potensi besar tetapi terkungkung kerangka berpikir yang sempit; jika kuncinya terbuka, hasilnya luar biasa.",
          en: "Do not feel small before the Shari’ah students — every side needs the others, and a Shari’ah graduate cannot build an institute without good management. Each works to his own capacity: lughah on lughah, idarah on idarah, shari’ah on shari’ah. Some students have great potential penned in by a narrow frame of thinking; unlock it and the result is remarkable.",
          ar: "ولا تستصغر نفسك أمام طلاب الشريعة — فالكل محتاج إلى الكل، وخريج الشريعة لا يبني معهدًا بلا إدارة جيدة. وكل يعمل بحسب تخصصه: اللغة للغة، والإدارة للإدارة، والشريعة للشريعة. وبعض الطلاب لديهم طاقات كبيرة حبستها عقلية ضيقة؛ فإذا فُتح القفل كانت النتيجة عجيبة.",
        },
      },
      {
        jenis: "h3",
        teks: {
          id: "e. PR Bidang Lughah",
          en: "e. The Lughah Faculty’s Homework",
          ar: "هـ. واجب كلية اللغة",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Kegagalan melahirkan ulama, menurut masyayikh, berakar pada lemahnya bahasa Arab — bahasa adalah pintu peradaban. Ada stigma bahwa belajar bahasa Arab harus di pondok berasrama; padahal di Jabodetabek banyak orang fasih berbahasa Inggris dengan belajar pulang-pergi sejak TK dan SD. Kuncinya ada pada kekuatan kurikulum dan guru yang ahli.",
          en: "The failure to produce scholars, the shaykhs say, is rooted in weak Arabic — language is the door to a civilisation. There is a notion that Arabic can only be learned in a residential school; yet across greater Jakarta many are fluent in English having studied as day pupils since kindergarten. The key is the strength of the curriculum and expert teachers.",
          ar: "ويرى المشايخ أن التقصير في تخريج العلماء أصله ضعف العربية — واللغة باب الحضارة. وشاع أن العربية لا تُتعلَّم إلا في القسم الداخلي؛ مع أن كثيرين في جاكرتا الكبرى أتقنوا الإنجليزية وهم يذهبون ويعودون منذ الروضة والابتدائية. والمدار على قوة المنهج وكفاءة المعلم.",
        },
      },
      {
        jenis: "h3",
        teks: {
          id: "Tambahan: nasihat untuk mahasiswa Iqtishad",
          en: "Addendum: advice for the Iqtisad students",
          ar: "زيادة: نصيحة لطلاب الاقتصاد",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Syaikh Zaid Abdul Karim Zaid, dosen Ustadz saat S2, berpesan: عليكم بالتخصص — era hari ini adalah era spesialisasi; tidak ada lagi ulama mutafannin seperti Imam Asy-Syafi‘i, Imam Ahmad, atau Syaikhul Islam. Mayoritas orang hanya mampu ahli dalam satu bidang. Ustadz menambahkan bahwa menjadi generalis yang ahli juga bermanfaat, karena mayoritas pemimpin dunia adalah generalis — syaratnya memiliki malakah dari ta’shil yang kuat sehingga tidak mudah dibohongi. Fase awal keduanya sama: kuasai mukhtasharat fikih, ushul fikih, mushthalah, akidah, dan qawa‘id lughawiyyah.",
          en: "Shaykh Zayd ‘Abd al-Karim Zayd, the Ustadz’s postgraduate lecturer, counselled: عليكم بالتخصص — this is the age of specialisation; there are no polymath scholars left as there were in Ash-Shafi‘i, Ahmad or Ibn Taymiyyah. Most people can master one field only. The Ustadz added that a capable generalist is useful too, since most of the world’s leaders are generalists — on condition of a faculty built on strong grounding, so that he is not easily deceived. The first phase is the same either way: master the fiqh primers, usul al-fiqh, hadith terminology, creed and the rules of the language.",
          ar: "وأوصى الشيخ زيد عبد الكريم زيد، أستاذ الأستاذ في الماجستير: ”عليكم بالتخصص“ — فهذا عصر التخصص؛ ولم يبقَ عالم متفنن كالشافعي وأحمد وشيخ الإسلام. وأكثر الناس لا يتقن إلا فنًا واحدًا. وزاد الأستاذ أن الموسوعي المتقن نافع أيضًا، فأكثر قادة العالم كذلك — بشرط ملكة من تأصيل قوي فلا يُخدع. والمرحلة الأولى واحدة: إتقان مختصرات الفقه وأصوله والمصطلح والعقيدة والقواعد اللغوية.",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Kisah dari Syaikh Zaid Abdul Karim Zaid: di Arab Saudi terdapat ribuan doktor dan magister, tetapi tidak ada satu pun spesialis bab akad; untuk akad perusahaan besar dan kesepakatan negara, didatangkan seorang spesialis dari Syam. Masalah kita adalah mempelajari keahlian setengah-setengah. Nawazil paling berkembang ada di bab buyu‘, dan untuk masuk ke sana harus menguasai fikih klasik bab buyu‘ serta ushul fikih yang kuat agar mampu melakukan takhrij fiqhi.",
          en: "A story from Shaykh Zayd ‘Abd al-Karim Zayd: Saudi Arabia has thousands of doctorates and masters, and not one specialist in the chapter of contracts; for major corporate contracts and state agreements a specialist is brought in from Syria. Our problem is half-learned expertise. The contemporary questions are growing fastest in the chapter of sales, and to enter it one must master the classical fiqh of sales and a strong usul, to be able to derive rulings properly.",
          ar: "وحكى الشيخ زيد عبد الكريم زيد: في السعودية آلاف الدكاترة والماجستير، وليس فيهم متخصص في باب العقود؛ فإذا أرادوا عقود الشركات الكبرى واتفاقيات الدول استقدموا متخصصًا من الشام. ومشكلتنا تعلّم التخصص نصفَ تعلّم. وأكثر النوازل نموًا في باب البيوع، ولدخوله لا بد من إتقان فقه البيوع الكلاسيكي وأصول قوية حتى يمكن التخريج الفقهي.",
        },
      },
    ],
  },

  {
    no: "04",
    id: "pertanyaan-4",
    kicker: { id: "Pertanyaan 4", en: "Question 4", ar: "السؤال الرابع" },
    judul: {
      id: "Antara kampus dan kegiatan luar: jangan ifrath, jangan tafrith",
      en: "Between campus and the world outside: neither excess nor neglect",
      ar: "بين المعهد وما خارجه: لا إفراط ولا تفريط",
    },
    ringkas: {
      id: "Kesibukan di luar kampus",
      en: "Activity outside campus",
      ar: "الانشغال خارج المعهد",
    },
    poin: [
      {
        id: "Masyaikh justru mendukung thalabah untuk belajar masyarakat; yang perlu diperbaiki adalah ketika hal ini membuat taqshir dalam thalabul ilmi.",
        en: "The shaykhs do support students learning about society; what needs correcting is when it brings negligence into seeking knowledge.",
        ar: "المشايخ يؤيدون تعلّم الطالب أحوال المجتمع؛ وإنما يُصلَح الأمر إذا أورث تقصيرًا في طلب العلم.",
      },
      {
        id: "Solusinya bukan berhenti total, tetapi mengurangi porsi sampai kembali i‘tidal.",
        en: "The remedy is not to stop entirely but to cut the portion back to balance.",
        ar: "والعلاج ليس الترك بالكلية بل تقليل الحصة حتى يعود الاعتدال.",
      },
    ],
    penutup: {
      jenis: "dalil",
      arab: "الْعِبْرَةُ بِالْغَالِبِ لَا بِالنَّادِرِ",
      terjemah: {
        id: "“Yang menjadi patokan adalah keadaan yang dominan, bukan yang jarang.”",
        en: "“What counts is the predominant state, not the rare one.”",
        ar: "”العبرة بالغالب لا بالنادر“",
      },
      sumber: { id: "Kaidah fiqhiyyah", en: "A legal maxim", ar: "قاعدة فقهية" },
    },
    isi: [
      {
        jenis: "tanya",
        teks: {
          id: "Pertanyaan: sebagian mahasiswa aktif di luar kampus untuk menambah skill, sehingga kadang terganggu di kelas, mengantuk, atau izin beberapa hari. Apakah itu termasuk tidak menunaikan amanah? Ada yang berkata, “Kalau begitu, kamu zalim kepada pemberi beasiswa; lebih baik keluar, banyak yang ingin duduk di kursimu.”",
          en: "The question: some students are busy outside campus building skills, and it costs them in class — drowsiness, a few days away. Is that a failure of the trust? Some say: “Then you are wronging the one who funds you; better to leave, plenty would take your seat.”",
          ar: "السؤال: بعض الطلاب ينشغلون خارج المعهد لاكتساب المهارات، فيتأثر حضورهم: نعاس، أو غياب أيام. أفهذا إخلال بالأمانة؟ وقد قيل: ”إذن أنت ظالم لمن مَوّلك؛ فالأولى أن تخرج، وكثيرون يودّون مقعدك.“",
        },
      },
      {
        jenis: "h3",
        teks: { id: "Jawaban Ustadz", en: "The Ustadz’s answer", ar: "جواب الأستاذ" },
      },
      {
        jenis: "h3",
        teks: {
          id: "a. Mencari ilmu di luar kampus itu penting",
          en: "a. Seeking knowledge outside campus matters",
          ar: "أ. طلب العلم خارج المعهد مهم",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Tidak semua unsur bashirah diajarkan di kampus. Setahu Ustadz, masyayikh justru mendukung mahasiswa belajar bermasyarakat dan mengembangkan diri. Yang menjadi masalah hanyalah jika hal itu menyebabkan kelalaian (taqshir) di kampus.",
          en: "Not every element of basirah is taught on campus. As far as the Ustadz knows, the shaykhs in fact encourage students to learn to live among people and to develop themselves. The only problem is when it causes negligence on campus.",
          ar: "ليست كل عناصر البصيرة تُدرَّس في المعهد. وفيما يعلم الأستاذ فإن المشايخ يشجعون الطالب على مخالطة الناس وتنمية نفسه. وإنما تقع المشكلة إذا أدى ذلك إلى تقصير في المعهد.",
        },
      },
      {
        jenis: "h3",
        teks: {
          id: "b. Hindari ifrath dan tafrith",
          en: "b. Avoid both excess and neglect",
          ar: "ب. اجتنب الإفراط والتفريط",
        },
      },
      {
        jenis: "dalil",
        arab: "مَا أَمَرَ اللَّهُ بِأَمْرٍ إِلَّا وَلِلشَّيْطَانِ فِيهِ نَزْغَتَانِ: إِمَّا إِلَى تَفْرِيطٍ وَإِضَاعَةٍ، وَإِمَّا إِلَى إِفْرَاطٍ وَغُلُوٍّ",
        terjemah: {
          id: "“Tidaklah Allah memerintahkan sesuatu kecuali setan memiliki dua bisikan padanya: menuju sikap meremehkan dan menyia-nyiakan, atau menuju sikap berlebihan dan melampaui batas.”",
          en: "“Allah commands nothing but that Shaytan has two promptings towards it: either to neglect and waste, or to excess and exaggeration.”",
          ar: "”ما أمر الله بأمر إلا وللشيطان فيه نزغتان: إما إلى تفريط وإضاعة، وإما إلى إفراط وغلو“",
        },
        sumber: {
          id: "Ibnul Qayyim, Madarijus Salikin",
          en: "Ibn al-Qayyim, Madarijus Salikin",
          ar: "ابن القيم، مدارج السالكين",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Jika berlebihan di luar, solusinya bukan berhenti total tetapi mengurangi porsi kesibukan di luar kampus hingga kembali seimbang (i‘tidal). Tidak mempelajari bashirah dalam dakwah secara utuh adalah tafrith; terlalu sibuk di luar kampus hingga lalai di kampus adalah ifrath.",
          en: "If the outside has grown too large, the remedy is not to stop it entirely but to cut the portion of outside activity back until it balances. Failing to learn the basirah of da’wah whole is tafrit; being so busy outside campus that campus is neglected is ifrat.",
          ar: "فإن زاد الخارج عن حده فليس العلاج تركه بالكلية بل تقليل الحصة حتى يعود الاعتدال. وترك تعلّم البصيرة كاملة تفريط؛ والانشغال خارجًا حتى يُهمل المعهد إفراط.",
        },
      },
      {
        jenis: "h3",
        teks: {
          id: "c. Ukurannya adalah yang dominan",
          en: "c. The measure is what predominates",
          ar: "ج. الميزان هو الغالب",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Nilai buruk di satu atau dua mata kuliah tidak menggugurkan amanah selama secara umum ia menunaikan amanah di kampus. Alumni yang dibanggakan pada haflah takharruj kemungkinan besar tidak semuanya bernilai sempurna; dahulu nilai mumtaz sangat sulit didapat, dan banyak senior cerdas yang hanya meraih jayyid jiddan. Ibnul Qayyim rahimahullah dalam kitab Al-Wabil ash-Shayyib mengatakan orang saleh adalah orang yang kebaikannya lebih banyak daripada dosanya — manusia tidak bisa sempurna.",
          en: "A poor grade in one or two subjects does not void the trust, so long as the person is generally faithful to it on campus. The alumni named with pride at graduation were surely not all straight distinctions; mumtaz used to be very hard to come by, and many bright seniors finished with jayyid jiddan. Ibn al-Qayyim, in Al-Wabil as-Sayyib, calls the righteous the one whose good outweighs his sin — a human being cannot be flawless.",
          ar: "ودرجة ضعيفة في مادة أو مادتين لا تُسقط الأمانة ما دام في الجملة حريصًا عليها. والخريجون الذين يُفتخر بهم في حفل التخرج ليسوا كلهم ممتازين؛ وقد كان الامتياز عزيزًا، وكثير من النجباء تخرجوا بجيد جدًا. وقال ابن القيم في الوابل الصيب: الصالح من غلبت حسناته سيئاته — والإنسان لا يكمل.",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Muqarrar di kelas pun sering tidak selesai; waktu memang terbatas, sehingga menambah hal prinsip dari luar itu baik. Jika tidak mampu, لا يكلف الله نفسًا إلا وسعها.",
          en: "Even the set syllabus is often not finished; time is limited, so adding what is essential from outside is good. And if one cannot, لا يكلف الله نفسًا إلا وسعها.",
          ar: "وحتى المقرر كثيرًا ما لا يُتمّ؛ فالوقت محدود، وزيادة الأصول من خارجه حسن. فإن لم يستطع فـ”لا يكلف الله نفسًا إلا وسعها“.",
        },
      },
      {
        jenis: "h3",
        teks: {
          id: "d. Tidak bisa digeneralisasi",
          en: "d. It cannot be generalised",
          ar: "د. لا يصح التعميم",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Kondisi setiap orang berbeda: potensi, kecerdasan, tabungan, keluarga, dan jumlah anak. Yang berpotensi besar, maksimalkan; yang tidak mampu, bertakwalah sesuai kemampuan. Kita tidak dituntut tampil sempurna di mana pun — kita dituntut membawa risalah dengan amanah.",
          en: "Circumstances differ: capacity, intelligence, savings, family, children. Whoever has the capacity should use it to the full; whoever cannot should fear Allah as much as he is able. We are not asked to be flawless everywhere — we are asked to carry the message faithfully.",
          ar: "وأحوال الناس تختلف: الطاقة والذكاء والمال والأسرة والولد. فمن قوي فليستفرغ وسعه، ومن عجز فليتق الله ما استطاع. ولسنا مطالبين بالكمال في كل موضع — وإنما بحمل الرسالة بأمانة.",
        },
      },
    ],
  },

  {
    no: "05",
    id: "pertanyaan-5",
    kicker: { id: "Pertanyaan 5", en: "Question 5", ar: "السؤال الخامس" },
    judul: {
      id: "Dakwah muslimah: mulai dari diri, baru baca peta",
      en: "Sisters’ da’wah: begin with yourself, then read the map",
      ar: "دعوة المسلمة: ابدأ بنفسك ثم اقرأ الخريطة",
    },
    ringkas: {
      id: "Dakwah muslimah & keraguan diri",
      en: "Sisters’ da’wah & self-doubt",
      ar: "دعوة المسلمة والشك في النفس",
    },
    poin: [
      {
        id: "Jangan mengeneralisir, rincikanlah. Kenali dulu kelebihan, kekurangan, dan penyakit hati sendiri.",
        en: "Avoid generalising. Know your own strengths, weaknesses and diseases of the heart first.",
        ar: "اجتنب التعميم. واعرف أولًا قوتك وضعفك وأمراض قلبك.",
      },
    ],
    penutup: {
      jenis: "dalil",
      arab: "ابْدَأْ بِنَفْسِكَ",
      terjemah: {
        id: "“Mulailah dari dirimu sendiri.”",
        en: "“Begin with yourself.”",
        ar: "”ابدأ بنفسك“",
      },
      sumber: { id: "HR. Muslim no. 997", en: "Muslim no. 997", ar: "رواه مسلم ٩٩٧" },
    },
    isi: [
      {
        jenis: "tanya",
        teks: {
          id: "Pertanyaan: sebagai perempuan, bagaimana memahami peta dakwah Indonesia dan mempersiapkan peran di dalamnya? Dan bagaimana menyikapi keraguan terhadap kapasitas diri, misalnya ketika pulang kampung diminta mengajar fikih atau akidah?",
          en: "The question: as a woman, how does one read the map of da’wah in Indonesia and prepare a place in it? And what does one do with doubt about one’s own capacity — when, back home, you are asked to teach fiqh or creed?",
          ar: "السؤال: كيف تقرأ المرأة خريطة الدعوة في إندونيسيا وتُعدّ دورها فيها؟ وكيف تتعامل مع الشك في قدرتها، كأن يُطلب منها عند رجوعها إلى بلدها أن تعلّم الفقه أو العقيدة؟",
        },
      },
      {
        jenis: "h3",
        teks: { id: "Jawaban Ustadz", en: "The Ustadz’s answer", ar: "جواب الأستاذ" },
      },
      {
        jenis: "h3",
        teks: { id: "a. Hindari generalisasi", en: "a. Avoid generalisations", ar: "أ. اجتنب التعميم" },
      },
      {
        jenis: "dalil",
        arab: "إِيَّاكَ وَالتَّعْمِيمَاتِ، عَلَيْكَ بِالتَّفْصِيلِ",
        terjemah: {
          id: "“Jangan mengeneralisir, tapi rincikanlah.”",
          en: "“Beware of generalisations; be detailed.”",
          ar: "”إياك والتعميمات، عليك بالتفصيل“",
        },
        sumber: {
          id: "Nasihat Syaikh Masyhur Hasan Alu Salman hafizhahullah",
          en: "Advice of Shaykh Mashhur Hasan Al Salman, may Allah preserve him",
          ar: "وصية الشيخ مشهور حسن آل سلمان",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Kelebihan belajar ta’shil adalah terbentuknya cara berpikir yang tidak menggeneralisasi. Setiap pendapat mu‘tamad memiliki syarat, batasan, dan penghalang yang sering tidak tercantum dalam buku perbandingan mazhab yang ringkas.",
          en: "What grounding gives is a mind that does not generalise. Every relied-upon position has its conditions, its limits and its impediments, and the short comparative-fiqh books usually leave them out.",
          ar: "وثمرة التأصيل عقل لا يعمّم. فلكل قول معتمد شروطه وقيوده وموانعه، وكتب المقارنة المختصرة تغفلها غالبًا.",
        },
      },
      {
        jenis: "h3",
        teks: {
          id: "b. Mulailah dari diri sendiri",
          en: "b. Begin with yourself",
          ar: "ب. ابدأ بنفسك",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Sebelum membaca peta Indonesia, kenali diri sendiri: kelebihan, kekurangan, dan penyakit hati — kita sendiri adalah bagian dari masyarakat Indonesia. Kekurangan penuntut ilmu adalah minimnya muhasabatun nafs, sehingga bertahun-tahun tidak mengenal dirinya. Syaikh Shalih Al-‘Ushaimi hafizhahullah menyebut kurangnya tazkiyatun nufus sebagai salah satu pekerjaan rumah thullabul ‘ilm, dan salah satu buahnya adalah mengenal diri.",
          en: "Before reading the map of Indonesia, know yourself: your strengths, your weaknesses, the diseases of your heart — you are part of Indonesian society too. The shortcoming of students of knowledge is how little they take account of themselves, so that years pass without their knowing who they are. Shaykh Salih Al-‘Usaymi names the shortage of purification of the soul as one of the outstanding tasks of students, and one of its fruits is self-knowledge.",
          ar: "وقبل قراءة خريطة إندونيسيا اعرف نفسك: قوتك وضعفك وأمراض قلبك — فأنت جزء من هذا المجتمع. وضعف طلاب العلم في قلة محاسبة النفس، فتمضي السنون وهو لا يعرف نفسه. وذكر الشيخ صالح العصيمي أن قلة تزكية النفوس من واجبات طلبة العلم المؤجلة، ومن ثمراتها معرفة النفس.",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Indonesia terlalu luas untuk digarap seluruhnya; kita harus memilih “kotak” perjuangan sesuai potensi, kekuatan, dan realita diri. Bersikaplah realistis: bagi akhwat yang berencana menikah lalu memiliki anak, peta dakwahnya dapat berubah menjadi mendidik anak-anaknya sendiri. Perbanyak doa, bertakwa semaksimal mungkin, jaga kebersamaan dengan teman agar saling menutupi kekurangan, dan dekati guru agar mendapat jawaban yang lebih personal dan tajam.",
          en: "Indonesia is far too large to be worked whole; you have to choose the square you will fight in, according to your capacity, your strength and your real situation. Be realistic: for a sister who plans to marry and have children, the map may well become the raising of her own children. Pray much, fear Allah as far as you can, keep close to friends so that you cover one another’s gaps, and draw near to a teacher for answers that are personal and sharp.",
          ar: "وإندونيسيا أوسع من أن تُستوعب كلها؛ فاختر مربعك بحسب طاقتك وقوتك وواقعك. وكن واقعيًا: فالأخت التي تنوي الزواج والولد قد تصير خريطتها تربية أولادها. وأكثر الدعاء، واتق الله ما استطعت، والزم صحبةً يسدّ بعضكم نقص بعض، واقترب من شيخ يجيبك جوابًا خاصًا دقيقًا.",
        },
      },
      {
        jenis: "h3",
        teks: {
          id: "c. Menyikapi keraguan diri",
          en: "c. What to do with self-doubt",
          ar: "ج. التعامل مع الشك في النفس",
        },
      },
      {
        jenis: "dalil",
        arab: "مَا أَفْتَيْتُ حَتَّى شَهِدَ لِي سَبْعُونَ أَنِّي أَهْلٌ لِذَلِكَ",
        terjemah: {
          id: "“Aku tidak berfatwa hingga tujuh puluh (ulama) bersaksi bahwa aku layak untuk itu.”",
          en: "“I did not give a fatwa until seventy testified that I was fit for it.”",
          ar: "”ما أفتيت حتى شهد لي سبعون أني أهل لذلك“",
        },
        sumber: {
          id: "Imam Malik — diriwayatkan Abu Nu‘aim dalam Hilyah al-Auliya’",
          en: "Imam Malik — narrated by Abu Nu‘aym in Hilyat al-Awliya’",
          ar: "الإمام مالك — رواه أبو نعيم في حلية الأولياء",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Keraguan diri itu wajar, dan semoga menjadi tanda rasa takut kepada Allah; solusi terbaiknya adalah memiliki lingkungan, guru, dan senior. Kebutuhan umat terhadap dai dan daiyah sangat besar, dan mahasiswa the institute memang disiapkan untuk itu. Agar selamat dunia dan akhirat dibutuhkan dua sisi: sisi ilmiah, yaitu tiga bashirah; dan sisi mental serta hati, karena fitnah dakwah itu banyak dan tanpa kesiapan mental seseorang akan jatuh.",
          en: "Self-doubt is natural, and may it be a sign of fear of Allah; the best remedy is a circle, a teacher and seniors. The ummah’s need for preachers, men and women, is enormous, and the institute students are prepared for exactly that. To be safe in both worlds two sides are needed: the scholarly side, which is the three basirah; and the side of the heart and temperament, because the trials of da’wah are many and without that readiness a person falls.",
          ar: "والشك في النفس طبيعي، ولعله من خشية الله؛ وأنفع علاجه صحبةٌ وشيخٌ وكبار. وحاجة الأمة إلى الدعاة والداعيات عظيمة، وطلاب المعهد إنما أُعدّوا لذلك. وللسلامة في الدارين جانبان: علميّ وهو البصائر الثلاث، ونفسيّ قلبيّ، فإن فتن الدعوة كثيرة، ومن لم يستعدّ سقط.",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Hikmah diutusnya Nabi ﷺ pada usia 40 tahun: kematangan dan pengalaman hidup sangat penting dalam dakwah, bukan hanya kecerdasan dan hafalan. Kaidahnya الحكم يدور مع علته وجودًا وعدمًا — hukum berputar bersama sebabnya; yang menentukan adalah kesiapan jiwa, bukan jenjang: ada yang siap sejak mustawa awal, ada yang belum siap meski sudah pascasarjana. Ustadz Ibrahim Said rahimahullah, seorang dai senior, duduk satu kelas di Syariah dari mustawa awal hingga selesai bersama mahasiswa yang jauh lebih muda — dan itu hanya mungkin bagi orang yang telah bersih dari ego dan keinginan tampil — نحسبه كذلك والله حسيبه، ولا نزكي على الله أحدًا.",
          en: "There is wisdom in the Prophet ﷺ being sent at forty: maturity and lived experience matter in da’wah, not intelligence and memorisation alone. The maxim runs الحكم يدور مع علته وجودًا وعدمًا — a ruling turns with its cause: what decides is readiness of soul, not year of study — some are ready from the first level, some are not ready with a master’s degree. Ustadz Ibrahim Said, may Allah have mercy on him, a senior preacher, sat in the Shari’ah class from the first level to the last among students far younger than him — possible only for someone already clear of ego and the wish to be seen — نحسبه كذلك والله حسيبه، ولا نزكي على الله أحدًا.",
          ar: "ومن حكمة بعثة النبي ﷺ على رأس الأربعين: أن النضج وتجربة الحياة مهمان في الدعوة، لا الذكاء والحفظ فحسب. والقاعدة: الحكم يدور مع علته وجودًا وعدمًا؛ فالمدار على استعداد النفس لا على المستوى الدراسي: فمنهم من يستعد من المستوى الأول، ومنهم من لا يستعد بعد الماجستير. وقد جلس الأستاذ إبراهيم سعيد رحمه الله — وهو داعية كبير — في الشريعة من المستوى الأول إلى آخره مع طلاب أصغر منه بكثير، ولا يقدر على ذلك إلا من تخلّص من الأنا وحب الظهور.",
        },
      },
      {
        jenis: "dalil",
        arab: "وَلَكِنَّكَ تَعَلَّمْتَ الْعِلْمَ لِيُقَالَ عَالِمٌ، وَقَرَأْتَ الْقُرْآنَ لِيُقَالَ هُوَ قَارِئٌ، فَقَدْ قِيلَ",
        terjemah: {
          id: "“Akan tetapi engkau belajar ilmu agar disebut alim, dan membaca Al-Qur’an agar disebut qari’. Dan itu telah dikatakan (tentangmu).”",
          en: "“Rather you learned knowledge so it would be said ‘a scholar’, and read the Qur’an so it would be said ‘a reciter’. And it has been said.”",
          ar: "”ولكنك تعلمت العلم ليقال عالم، وقرأت القرآن ليقال هو قارئ، فقد قيل“",
        },
        sumber: { id: "HR. Muslim no. 1905", en: "Muslim no. 1905", ar: "رواه مسلم ١٩٠٥" },
      },
      {
        jenis: "p",
        teks: {
          id: "“Faqad qil” berarti ia berhasil populer di dunia — hadits ini berbicara tentang orang yang terlihat sukses di dunia, bukan yang gagal, dan itulah peringatannya bagi yang merasa cukup dengan kapasitas ilmiah. Syaikh Shalih Al-‘Ushaimi hafizhahullah menegaskan bahwa ilmu tentang hati dan tazkiyatun nufus adalah disiplin tersendiri, dengan kitab dan talaqqi seperti fikih dan ushul, dan ilmu ini tidak diajarkan di ma‘had. Setelah menguasai teorinya, tantangan berikutnya adalah tahqiqul manath — menerapkannya pada kondisi nyata diri — dan untuk itu dibutuhkan guru yang jauh lebih senior, bukan senior yang hanya berbeda satu sampai tiga tahun. Menurut sebagian salaf yang dinukil Imam Asy-Syathibi rahimahullah, cinta popularitas adalah sifat buruk terakhir yang keluar dari hati orang saleh.",
          en: "“Fa-qad qil” means he did become famous — the hadith speaks of the one who looks successful in this world, not of the failed, and that is its warning to anyone content with scholarly capacity alone. Shaykh Salih Al-‘Usaymi holds that the science of the heart and the purification of the soul is a discipline in its own right, with its books and its transmission like fiqh and usul — and it is not taught at the institute. Once the theory is held, the next difficulty is applying it to one’s own actual state, and for that a far more senior teacher is needed, not one who is merely one to three years ahead. Some of the early generations, as Imam Ash-Shatibi, may Allah have mercy on him, quotes, held that love of fame is the last bad trait to leave the heart of a righteous man.",
          ar: "و”فقد قيل“ معناها أنه نال الشهرة فعلًا — فالحديث في الناجح لا في الفاشل، وهذا وجه التحذير لمن اكتفى بالأهلية العلمية. وقرر الشيخ صالح العصيمي أن علم القلوب وتزكية النفوس فنٌّ مستقل له كتبه وتلقّيه كالفقه والأصول، وهو لا يُدرَّس في المعهد. وبعد إتقان نظريته تأتي صعوبة تحقيق المناط — تنزيله على حال النفس — ولذلك يُحتاج إلى شيخ أكبر بكثير، لا إلى من يسبقك بسنة أو ثلاث. ونقل الشاطبي عن بعض السلف أن حب الشهرة آخر ما يخرج من قلوب الصالحين.",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Sikap yang seimbang: melarang total untuk mengajar tidak tepat karena masyarakat membutuhkan, sedangkan mengajar tanpa batas juga berbahaya. Mahasiswa mustawa lanjut yang fikihnya baik secara umum boleh mengajar secara bertahap, terbatas, dan dengan porsi yang jelas. Setiap orang berbeda; orang berpotensi besar — misalnya ahli riset — bisa jadi diarahkan untuk tidak mengisi kajian dulu agar fokus pada hal yang lebih besar. Kuncinya adalah visi ke depan: kita mau menjadi apa?",
          en: "The balanced position: forbidding teaching outright is wrong, because people need it, while teaching without limit is dangerous. An advanced student whose fiqh is generally sound may teach gradually, within limits, in a clearly defined portion. People differ; someone with unusual potential — a researcher, say — might be steered away from public teaching for now so as to focus on something larger. The key is the view ahead: what do we intend to become?",
          ar: "والموقف المعتدل: المنع المطلق من التعليم خطأ لأن الناس محتاجون، والتعليم بلا حدّ خطر. فطالب المستويات العليا الجيد في الفقه جملةً يعلّم تدرّجًا وبقدر محدود وحصة واضحة. والناس يختلفون؛ فصاحب الطاقة الكبيرة — كالباحث — قد يُصرف عن الدروس العامة الآن ليتفرغ لما هو أكبر. والمدار على الرؤية: ماذا نريد أن نكون؟",
        },
      },
    ],
  },

  {
    no: "06",
    id: "pertanyaan-6",
    kicker: { id: "Pertanyaan 6", en: "Question 6", ar: "السؤال السادس" },
    judul: {
      id: "Medan paling strategis: tahun-tahun paling awal",
      en: "The most strategic field: the earliest years",
      ar: "أهم الميادين: السنوات الأولى",
    },
    ringkas: {
      id: "Bidang prioritas bagi akhwat",
      en: "Priority fields for sisters",
      ar: "أولويات الميدان للأخوات",
    },
    poin: [
      {
        id: "TK dan SD kelas awal — wilayah perempuan, dan fondasi karakter dibentuk di sana, bukan saat kuliah.",
        en: "Kindergarten and early primary — a woman’s domain, and where character is founded, not at university.",
        ar: "الروضة والصفوف الأولى — ميدان المرأة، وفيه يُبنى الخُلق، لا في الجامعة.",
      },
      {
        id: "Berbicara dakwah dengan data valid: Al-Qur’an, Sunnah, sejarah, dan riset — bukan asumsi.",
        en: "Speak of da’wah on sound data: Qur’an, Sunnah, history and research — not assumptions.",
        ar: "وتكلّم في الدعوة ببيانات صحيحة: القرآن والسنة والتاريخ والبحث — لا بالظنون.",
      },
    ],
    penutup: {
      jenis: "kutip",
      teks: {
        id: "“Fondasi tidak menjadi rendah karena diremehkan.”",
        en: "“A foundation is not made low by being belittled.”",
        ar: "”الأساس لا يصير وضيعًا لأن الناس استهانوا به.“",
      },
    },
    isi: [
      {
        jenis: "tanya",
        teks: {
          id: "Pertanyaan: ada banyak bidang yang bisa menjadi ruang dakwah bagi perempuan. Bagaimana menentukan fokus belajar agar ilmu benar-benar bermanfaat, dan adakah bidang yang perlu diprioritaskan mengingat perempuan adalah المدرسة الأولى?",
          en: "The question: there are many fields open to a woman in da’wah. How does one choose a focus so that the knowledge is genuinely useful, and is there a field to prioritise, given that a woman is المدرسة الأولى, the first school?",
          ar: "السؤال: ميادين كثيرة مفتوحة للمرأة في الدعوة، فكيف تختار تخصصها ليكون علمها نافعًا حقًا؟ وهل ثَمَّ ميدان يُقدَّم، والمرأة مدرسة الأجيال الأولى؟",
        },
      },
      {
        jenis: "h3",
        teks: { id: "Jawaban Ustadz", en: "The Ustadz’s answer", ar: "جواب الأستاذ" },
      },
      {
        jenis: "p",
        teks: {
          id: "Yang paling strategis adalah pendidikan usia dini, yaitu TK dan SD kelas awal — wilayah ini adalah domain perempuan.",
          en: "The most strategic is early childhood education — kindergarten and the early primary years. That domain belongs to women.",
          ar: "أهمها التعليم في الطفولة المبكرة، أي الروضة والصفوف الابتدائية الأولى — وهذا ميدان النساء.",
        },
      },
      {
        jenis: "h3",
        teks: {
          id: "a. Mengapa pendidikan usia dini sangat penting",
          en: "a. Why the earliest years matter so much",
          ar: "أ. لماذا التعليم المبكر بالغ الأهمية",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Pentingnya diakui bahkan oleh orang yang tidak beriman. Salah satu penyebab ketertinggalan kita adalah terlambat start, bahkan salah start — dan masalahnya, mayoritas kita menganggapnya tidak penting: lulusan the institute yang mengajar TK sering dianggap tidak bergengsi. Seorang peraih Nobel ekonomi meneliti korelasi pendidikan usia dini dengan kondisi ekonomi makro suatu negara; negara yang bermasalah secara ekonomi sering berakar pada TK dan SD yang tidak solid.",
          en: "Its importance is granted even by those who do not believe. Part of why we lag is a late start, or a wrong one — and the trouble is that most of us think it unimportant: a the institute graduate teaching kindergarten is often thought to have come down in the world. A Nobel laureate in economics studied the correlation between early childhood education and a country’s macroeconomic condition; economies in trouble often trace back to weak kindergartens and primary schools.",
          ar: "وأهميته يقرّ بها حتى غير المؤمنين. ومن أسباب تأخرنا تأخر البداية، بل الخطأ فيها — والمشكلة أن أكثرنا يستصغره: فخريج المعهد إذا علّم في الروضة عُدَّ نازلًا. وقد بحث أحد الحاصلين على نوبل في الاقتصاد العلاقة بين التعليم المبكر وحال الاقتصاد الكلي للدولة؛ فكثير من الاقتصادات المتعثرة يعود تعثرها إلى ضعف الروضة والابتدائية.",
        },
      },
      {
        jenis: "h3",
        teks: {
          id: "c. Fondasi karakter dan kesehatan mental",
          en: "c. The foundation of character and of mental health",
          ar: "ج. أساس الخُلق والصحة النفسية",
        },
      },
      {
        jenis: "p",
        teks: {
          id: "Pendidikan usia dini adalah fondasi, dan fondasi tidak menjadi rendah karena diremehkan. Banyak masalah hati dan mental health hari ini, jika ditelusuri, bersumber dari kondisi masa kecil. Bayangkan jika sejak TK kita dididik dengan konsep Nabi ﷺ, yaitu iman sebelum Al-Qur’an — hasilnya akan luar biasa. Karakter bangsa bergantung pada karakter masyarakat, dan karakter dibentuk sejak kecil, bukan saat kuliah: bandingkan karakter mahasiswa semester awal dan semester akhir di the institute, mayoritas tidak berubah padahal setiap hari berinteraksi dengan ayat dan hadits.",
          en: "Early education is the foundation, and a foundation is not made low by being belittled. Trace many of today’s troubles of the heart and of mental health and they run back to childhood. Imagine being taught from kindergarten on the Prophet’s own sequence — faith before the Qur’an; the result would be extraordinary. A nation’s character rests on its society’s character, and character is formed young, not at university: compare a first-semester and a final-semester student at the institute, and most are unchanged, though they handle verses and hadiths every day.",
          ar: "التعليم المبكر أساس، والأساس لا يصير وضيعًا لأن الناس استهانوا به. وكثير من أمراض القلوب والصحة النفسية اليوم إذا تُتبّعت رجعت إلى الطفولة. وتخيّل لو رُبّينا من الروضة على منهج النبي ﷺ: الإيمان قبل القرآن — لكانت النتيجة عظيمة. وخُلُق الأمة تابع لخُلُق مجتمعها، والخُلُق يُبنى صغيرًا لا في الجامعة: قارن بين طالب المستوى الأول والأخير في المعهد تجد أكثرهم لم يتغير، وهو يعالج الآيات والأحاديث كل يوم.",
        },
      },
      {
        jenis: "dalil",
        arab: "سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ، أَسْتَغْفِرُكَ وَأَتُوبُ إِلَيْكَ",
        terjemah: {
          id: "“Mahasuci Engkau ya Allah dan segala puji bagi-Mu. Aku bersaksi bahwa tidak ada sesembahan yang berhak disembah selain Engkau. Aku memohon ampun dan bertaubat kepada-Mu.”",
          en: "“Glory be to You, O Allah, and praise. I bear witness that there is no god but You. I seek Your forgiveness and turn to You.”",
          ar: "”سبحانك اللهم وبحمدك، أشهد أن لا إله إلا أنت، أستغفرك وأتوب إليك“",
        },
        sumber: {
          id: "Kaffaratul majlis, penutup kajian",
          en: "The expiation of the gathering, closing the lecture",
          ar: "كفارة المجلس، خُتم بها اللقاء",
        },
      },
    ],
  },
];

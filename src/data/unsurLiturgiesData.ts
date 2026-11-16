import { UnsurLiturgyModel } from '../types/church';

export const INITIAL_UNSUR_LITURGIES: UnsurLiturgyModel[] = [
  // ================= PERPRI (4 MODEL: A, B, C, D) =================
  {
    id: 'lit-perpri-a',
    unsur: 'PERPRI',
    modelCode: 'Model A',
    title: 'Tata Ibadah Persekutuan Kaum Pria (Bentuk Klasik)',
    subtitle: 'Ibadah Rutin Mingguan / Rumah Tangga PERPRI',
    theme: 'Imam dalam Keluarga, Teladan dalam Pekerjaan',
    occasionHint: 'Cocok untuk ibadah rutin mingguan PERPRI di rumah anggota atau gedung gereja.',
    steps: [
      {
        id: 'perpri-a-1',
        order: 1,
        section: 'Persiapan & Panggilan Beribadah',
        instruction: 'Kaum pria menyiapkan hati dalam saat teduh, kemudian berdiri menyanyikan pujian pembuka.',
        leaderText:
          'Saudara-saudara kekasih dalam Kristus, marilah kita mengarahkan hati kepada Tuhan yang memanggil kaum pria menjadi tiang doa dan teladan iman di tengah keluarga serta jemaat.',
        congregationText: 'Amin. Terpujilah Tuhan sumber kekuatan kami.',
        hymnRef: {
          book: 'NR',
          number: 1,
          title: 'Haleluya, Pujilah Tuhan',
          versesToSing: 'Bait 1 & 2',
        },
      },
      {
        id: 'perpri-a-2',
        order: 2,
        section: 'Votum dan Salam',
        instruction: 'Peserta tetap berdiri.',
        leaderText:
          'Ibadah Persekutuan Kaum Pria GPI Getsemani Sorong ini berlangsung dalam nama Bapa, Putra, dan Roh Kudus. Damai sejahtera Kristus menyertai saudara sekalian.',
        congregationText: 'Dan menyertai saudara juga. Amin.',
      },
      {
        id: 'perpri-a-3',
        order: 3,
        section: 'Doa Pembukaan & Pengakuan Komitmen',
        instruction: 'Peserta duduk kembali.',
        leaderText:
          'Ya Bapa di sorga, kuduskanlah hati dan pikiran kami dari kesibukan pekerjaan sepanjang minggu ini. Mampukan kami mendengarkan suara-Mu dengan rendah hati.',
        congregationText: 'Dengarkanlah doa kami, ya Tuhan.',
      },
      {
        id: 'perpri-a-4',
        order: 4,
        section: 'Pembacaan Alkitab & Renungan Firman',
        instruction: 'Pembacaan Firman (mis. Yosua 24:15) dilanjutkan renungan oleh Pelayan Firman.',
        leaderText:
          '"Tetapi aku dan seisi rumahku, kami akan beribadah kepada TUHAN!" (Yosua 24:15b). Berbahagialah setiap orang yang mendengarkan dan melakukan Firman Tuhan.',
        congregationText: 'Amin.',
        hymnRef: {
          book: 'KJ',
          number: 64,
          title: 'Bila Kulihat Bintang Gemerlapan',
          versesToSing: 'Bait 1 & Refrein',
        },
      },
      {
        id: 'perpri-a-5',
        order: 5,
        section: 'Persembahan Syukur PERPRI',
        instruction: 'Kantong persembahan diedarkan sambil menyanyi.',
        leaderText:
          'Marilah kita menyatakan syukur atas berkat pekerjaan dan kesehatan dari Tuhan melalui persembahan kita.',
        hymnRef: {
          book: 'NKB',
          number: 3,
          title: 'Terpujilah Allah',
          versesToSing: 'Bait 1 & 2',
        },
      },
      {
        id: 'perpri-a-6',
        order: 6,
        section: 'Doa Syafaat, Nyanyian Pengutusan & Berkat',
        instruction: 'Peserta berdiri menerima berkat pengutusan.',
        leaderText:
          'Kiranya kasih karunia Tuhan Yesus Kristus, kasih Allah Bapa, dan persekutuan Roh Kudus menyertai saudara sekalian dalam keluarga dan karya kerja esok hari.',
        congregationText: 'Amin, amin, amin.',
      },
    ],
  },
  {
    id: 'lit-perpri-b',
    unsur: 'PERPRI',
    modelCode: 'Model B',
    title: 'Tata Ibadah Dialogal & Penelaahan Alkitab',
    subtitle: 'Ibadah Diskusi Firman & Sharing Iman PERPRI',
    theme: 'Bersama Menjadi Laki-Laki yang Takut Akan Tuhan',
    occasionHint: 'Cocok untuk ibadah PA kelompok kecil, tukar pikiran, dan diskusi tema kekeluargaan.',
    steps: [
      {
        id: 'perpri-b-1',
        order: 1,
        section: 'Ajakan Pujian Pembuka',
        instruction: 'Dipimpin oleh salah seorang anggota PERPRI.',
        leaderText:
          'Besi menajamkan besi, demikianlah seorang sahabat menajamkan sesamanya. Mari kita awali persekutuan belajar Firman malam ini dengan pujian.',
        hymnRef: {
          book: 'KJ',
          number: 3,
          title: 'Kami Puji dengan Riang',
          versesToSing: 'Bait 1 & 2',
        },
      },
      {
        id: 'perpri-b-2',
        order: 2,
        section: 'Pembacaan Mazmur Berbalasan (Mazmur 1:1-3)',
        instruction: 'Pemimpin dan peserta membaca secara responsoris.',
        leaderText:
          'Berbahagialah orang yang tidak berjalan menurut nasihat orang fasik, yang tidak berdiri di jalan orang berdosa, dan yang tidak duduk dalam kumpulan pencemooh,',
        congregationText:
          'tetapi yang kesukaannya ialah Taurat TUHAN, dan yang merenungkan Taurat itu siang dan malam.',
      },
      {
        id: 'perpri-b-3',
        order: 3,
        section: 'Doa Mohon Hikmat & Pembacaan Teks PA',
        leaderText:
          'Tuhan Yesus, bukalah mata rohani kami agar Firman-Mu menerangi keputusan kami sebagai suami, ayah, dan warga gereja.',
      },
      {
        id: 'perpri-b-4',
        order: 4,
        section: 'Diskusi & Sharing Pergumulan Kaum Bapak',
        instruction: 'Fasilitator memandu 2–3 pertanyaan reflektif dari teks bacaan dan berbagi pengalaman iman.',
        leaderText:
          'Bagaimana teks Firman hari ini menolong kita menghadapi tantangan tanggung jawab di rumah tangga dan tempat kerja?',
        congregationText: '(Sesi berbagi kesaksian dan diskusi terbuka peserta PERPRI)',
      },
      {
        id: 'perpri-b-5',
        order: 5,
        section: 'Persembahan & Doa Saling Menopang',
        leaderText:
          'Mari kita bawa persembahan syukur dan menyebutkan pokok doa pribadi/keluarga sebelum didoakan bersama.',
        hymnRef: {
          book: 'NKB',
          number: 188,
          title: 'Tiap Langkahku',
          versesToSing: 'Bait 1 & Refrein',
        },
      },
      {
        id: 'perpri-b-6',
        order: 6,
        section: 'Pengutusan & Berkat',
        instruction: 'Peserta berdiri saling berjabat tangan.',
        leaderText:
          'Pergilah dengan damai sejahtera, berdirilah teguh, bersikaplah sebagai laki-laki dan tetaplah kuat; lakukanlah segala pekerjaanmu dalam kasih.',
        congregationText: 'Amin.',
      },
    ],
  },
  {
    id: 'lit-perpri-c',
    unsur: 'PERPRI',
    modelCode: 'Model C',
    title: 'Tata Ibadah Syukur & Kerja Bakti / Pelayanan Diakonia',
    subtitle: 'Ibadah Singkat Sebelum/Sesudah Aksi Pelayanan PERPRI',
    theme: 'Melayani Tuhan dengan Tangan yang Bekerja',
    occasionHint: 'Digunakan sebelum kerja bakti gereja, aksi pembangunan, atau kunjungan kasih PERPRI.',
    steps: [
      {
        id: 'perpri-c-1',
        order: 1,
        section: 'Pujian Sukacita Melayani',
        instruction: 'Seluruh peserta berkumpul melingkar di lokasi pelayanan.',
        leaderText:
          'Apapun juga yang kamu perbuat, perbuatlah dengan segenap hatimu seperti untuk Tuhan dan bukan untuk manusia (Kolose 3:23).',
        hymnRef: {
          book: 'PKJ',
          number: 2,
          title: 'Mulia, Mulia Nama-Nya',
          versesToSing: 'Bait 1',
        },
      },
      {
        id: 'perpri-c-2',
        order: 2,
        section: 'Doa Penyerahan Tenaga & Pekerjaan',
        leaderText:
          'Tuhan, kami menyerahkan tenaga, waktu, dan kebersamaan PERPRI hari ini. Jauhkanlah dari kecelakaan kerja dan jadikanlah karya kami berkat bagi jemaat Getsemani Sorong.',
        congregationText: 'Jadilah kehendak-Mu, ya Tuhan. Amin.',
      },
      {
        id: 'perpri-c-3',
        order: 3,
        section: 'Renungan Singkat (5–7 Menit)',
        instruction: 'Disampaikan singkat oleh Ketua PERPRI atau Majelis pendamping.',
        leaderText:
          'Nehemia membangun tembok Yerusalem bukan dengan keluhan, melainkan dengan doa dan tangan yang bekerja bahu-membahu.',
      },
      {
        id: 'perpri-c-4',
        order: 4,
        section: 'Doa Berkat & Pengutusan Aksi',
        leaderText:
          'TUHAN memberkati pekerjaan tangan saudara sekalian dan menjaga keluar masuk saudara sekarang dan selamanya.',
        congregationText: 'Amin.',
      },
    ],
  },
  {
    id: 'lit-perpri-d',
    unsur: 'PERPRI',
    modelCode: 'Model D',
    title: 'Tata Ibadah Jam Doa & Penguatan Iman',
    subtitle: 'Ibadah Kontemplatif & Doa Syafaat Berantai PERPRI',
    theme: 'Menyerahkan Beban Hidup di Taman Getsemani',
    occasionHint: 'Cocok untuk ibadah malam pergumulan, jam doa bulanan, atau doa penguatan bagi saudara yang berbeban.',
    steps: [
      {
        id: 'perpri-d-1',
        order: 1,
        section: 'Saat Teduh & Nyanyian Penyerahan',
        instruction: 'Suasana tenang, peserta duduk dengan sikap doa.',
        leaderText:
          '"Marilah kepada-Ku, semua yang letih lesu dan berbeban berat, Aku akan memberi kelegaan kepadamu." (Matius 11:28)',
        hymnRef: {
          book: 'DSL',
          number: 1,
          title: 'Di Dalam Taman Getsemani',
          versesToSing: 'Bait 1 & 2',
        },
      },
      {
        id: 'perpri-d-2',
        order: 2,
        section: 'Pembacaan Firman Penguatan',
        leaderText:
          'Membaca Filipi 4:6-7: Janganlah hendaknya kamu kuatir tentang apapun juga, tetapi nyatakanlah dalam segala hal keinginanmu kepada Allah dalam doa dan permohonan dengan ucapan syukur.',
        congregationText: 'Damai sejahtera Allah memelihara hati dan pikiran kami.',
      },
      {
        id: 'perpri-d-3',
        order: 3,
        section: 'Doa Syafaat Berantai (4 Pokok Doa)',
        instruction: 'Empat perwakilan mendoakan berturut-turut: (1) Keluarga & Anak-anak, (2) Pekerjaan & Usaha, (3) Saudara yang Sakit/Bergumul, (4) Pelayanan GPI Getsemani Sorong.',
        leaderText:
          'Marilah kita bersatu hati mengangkat doa-doa syafaat ini ke hadirat Bapa di sorga.',
        hymnRef: {
          book: 'DSL',
          number: 173,
          title: 'Jangan Takut, Aku Besertamu',
          versesToSing: 'Bait 1',
        },
      },
      {
        id: 'perpri-d-4',
        order: 4,
        section: 'Doa Bapa Kami & Berkat Penutup',
        instruction: 'Peserta berdiri bergandengan tangan atau dalam sikap hormat.',
        leaderText:
          'Allah sumber segala pengharapan memenuhi saudara dengan segala sukacita dan damai sejahtera dalam iman.',
        congregationText: 'Amin, amin, amin.',
      },
    ],
  },

  // ================= PERWATA (3 MODEL: A, B, C) =================
  {
    id: 'lit-perwata-a',
    unsur: 'PERWATA',
    modelCode: 'Model A',
    title: 'Tata Ibadah Persekutuan Kaum Wanita (Bentuk Klasik)',
    subtitle: 'Ibadah Rutin Mingguan PERWATA',
    theme: 'Wanita yang Takut Akan TUHAN Dipuji dan Diberkati',
    occasionHint: 'Digunakan untuk ibadah rutin PERWATA setiap minggu di Sektor Filadelfia & Petra.',
    steps: [
      {
        id: 'perwata-a-1',
        order: 1,
        section: 'Panggilan Beribadah & Pujian',
        instruction: 'Ibu-ibu berdiri menyanyikan nyanyian pembuka.',
        leaderText:
          'Bersyukurlah kepada TUHAN, sebab Ia baik! Kasih setia-Nya menyertai kaum wanita dan rumah tangga kita dari hari ke hari.',
        hymnRef: {
          book: 'PKJ',
          number: 14,
          title: 'Kunyanyikan Kasih Setia Tuhan',
          versesToSing: 'Bait 1',
        },
      },
      {
        id: 'perwata-a-2',
        order: 2,
        section: 'Votum, Salam & Doa Pembukaan',
        leaderText:
          'Pertolongan kita adalah dalam nama TUHAN yang menjadikan langit dan bumi. Kasih dan damai sejahtera dari Tuhan Yesus menyertai ibu-ibu sekalian.',
        congregationText: 'Dan menyertai saudara juga. Amin.',
      },
      {
        id: 'perwata-a-3',
        order: 3,
        section: 'Pembacaan Firman & Khotbah',
        instruction: 'Pembacaan Amsal 31:10-30 dan perenungan Firman.',
        leaderText:
          'Kemolekan adalah bohong dan kecantikan adalah sia-sia, tetapi isteri yang takut akan TUHAN dipuji-puji.',
        hymnRef: {
          book: 'NKB',
          number: 188,
          title: 'Tiap Langkahku',
          versesToSing: 'Bait 1 & Refrein',
        },
      },
      {
        id: 'perwata-a-4',
        order: 4,
        section: 'Persembahan Syukur & Doa Syafaat',
        leaderText:
          'Mari kita bawa persembahan syukur serta berdoa bagi anak-anak, suami, warga sakit, dan pelayanan gereja.',
        hymnRef: {
          book: 'KJ',
          number: 1,
          title: 'Haleluya, Pujilah',
          versesToSing: 'Bait 1 & Refrein',
        },
      },
      {
        id: 'perwata-a-5',
        order: 5,
        section: 'Berkat Pengutusan',
        instruction: 'Peserta berdiri.',
        leaderText:
          'Kiranya Tuhan memberkati rumah tanggamu dan menjaga langkahmu dalam sukacita Roh Kudus.',
        congregationText: 'Amin.',
      },
    ],
  },
  {
    id: 'lit-perwata-b',
    unsur: 'PERWATA',
    modelCode: 'Model B',
    title: 'Tata Ibadah PA & Kesaksian Ibu-Ibu',
    subtitle: 'Ibadah Penelaahan Alkitab & Berbagi Kasih',
    theme: 'Perempuan Pembawa Damai di Tengah Keluarga',
    occasionHint: 'Cocok untuk ibadah gabungan PERWATA atau pertemuan diskusi keluarga Kristen.',
    steps: [
      {
        id: 'perwata-b-1',
        order: 1,
        section: 'Pujian Pembuka & Doa',
        leaderText:
          'Mari kita membuka hati menerima pengajaran Firman Tuhan sebagai ibu dan sahabat sepelayanan.',
        hymnRef: {
          book: 'KJ',
          number: 3,
          title: 'Kami Puji dengan Riang',
          versesToSing: 'Bait 1',
        },
      },
      {
        id: 'perwata-b-2',
        order: 2,
        section: 'Pembacaan Teks & Diskusi Terbimbing',
        instruction: 'Membaca Lukas 10:38-42 (Maria dan Marta), lalu berdiskusi menjaga keseimbangan pelayanan dan doa.',
        leaderText:
          'Bagaimana kita memilih "bagian yang terbaik" di tengah kesibukan rumah tangga sehari-hari?',
        congregationText: '(Kesaksian singkat 2–3 anggota PERWATA)',
      },
      {
        id: 'perwata-b-3',
        order: 3,
        section: 'Doa Saling Menguatkan & Berkat',
        leaderText:
          'Damai sejahtera Kristus memerintah dalam hatimu sekarang dan selamanya.',
        congregationText: 'Amin.',
      },
    ],
  },
  {
    id: 'lit-perwata-c',
    unsur: 'PERWATA',
    modelCode: 'Model C',
    title: 'Tata Ibadah Syukur HUT & Kunjungan Kasih',
    subtitle: 'Ibadah Kunjungan Keluarga / HUT Anggota PERWATA',
    theme: 'Kasih Setia Tuhan Tak Berkesudahan',
    occasionHint: 'Digunakan saat kunjungan ulang tahun anggota, ibu melahirkan, atau pemulihan sakit.',
    steps: [
      {
        id: 'perwata-c-1',
        order: 1,
        section: 'Ucapan Syukur & Pujian Pembuka',
        leaderText:
          'Segala pujian dan syukur kami naikkan kepada Tuhan atas pertambahan usia dan pemeliharaan-Nya bagi keluarga ini.',
        hymnRef: {
          book: 'KJ',
          number: 64,
          title: 'Bila Kulihat Bintang Gemerlapan',
          versesToSing: 'Bait 1 & Refrein',
        },
      },
      {
        id: 'perwata-c-2',
        order: 2,
        section: 'Nas Penguatan & Renungan Singkat',
        leaderText:
          '"Sebab Aku ini mengetahui rancangan-rancangan apa yang ada pada-Ku mengenai kamu, demikianlah firman TUHAN, yaitu rancangan damai sejahtera." (Yeremia 29:11)',
      },
      {
        id: 'perwata-c-3',
        order: 3,
        section: 'Doa Khusus bagi Keluarga & Berkat',
        leaderText:
          'Tuhan memberkati tuan rumah dan seluruh anggota PERWATA dengan sukacita dan kesehatan.',
        congregationText: 'Amin.',
      },
    ],
  },

  // ================= PP (3 MODEL: A, B, C) =================
  {
    id: 'lit-pp-a',
    unsur: 'PP',
    modelCode: 'Model A',
    title: 'Tata Ibadah Pemuda Kontemporer & Pujian',
    subtitle: 'Ibadah Rutin Persekutuan Pemuda (PP)',
    theme: 'Muda, Kudus, dan Berdampak Bagi Kristus',
    occasionHint: 'Ibadah mingguan PP di ruang ibadah atau rumah anggota dengan suasana dinamis.',
    steps: [
      {
        id: 'pp-a-1',
        order: 1,
        section: 'Call to Worship & Praise',
        instruction: 'Pemuda berdiri memuji Tuhan dengan penuh semangat.',
        leaderText:
          'Jangan seorang pun menganggap engkau rendah karena engkau muda, jadilah teladan bagi orang-orang percaya (1 Timotius 4:12).',
        hymnRef: {
          book: 'PKJ',
          number: 2,
          title: 'Mulia, Mulia Nama-Nya',
          versesToSing: 'Bait 1',
        },
      },
      {
        id: 'pp-a-2',
        order: 2,
        section: 'Doa Pembukaan & Pengakuan Dosa Anak Muda',
        leaderText:
          'Tuhan Yesus, ampunilah kelalaian kami dalam pergaulan, media sosial, studi, dan pekerjaan. Perbarui semangat melayani kami.',
        congregationText: 'Bentuklah hidup kami sesuai rencana-Mu, ya Tuhan.',
      },
      {
        id: 'pp-a-3',
        order: 3,
        section: 'Firman Tuhan & Sharing Muda-Mudi',
        leaderText:
          'Pembacaan Alkitab dilanjutkan renungan relevan tentang panggilan pemuda Kristen di Tanah Papua.',
        hymnRef: {
          book: 'NKB',
          number: 188,
          title: 'Tiap Langkahku',
          versesToSing: 'Bait 1 & Refrein',
        },
      },
      {
        id: 'pp-a-4',
        order: 4,
        section: 'Persembahan, Doa Syafaat & Berkat',
        leaderText:
          'Kiranya kasih Kristus menyertai studi, pekerjaan, cita-cita, dan masa depan pemuda GPI Getsemani Sorong.',
        congregationText: 'Amin.',
      },
    ],
  },
  {
    id: 'lit-pp-b',
    unsur: 'PP',
    modelCode: 'Model B',
    title: 'Tata Ibadah Diskusi & Bedah Topik Pemuda',
    subtitle: 'Ibadah Kreatif / Forum Pemuda',
    theme: 'Iman dan Pergaulan di Era Digital',
    occasionHint: 'Cocok untuk ibadah diskusi tematik, bedah film rohani, atau dialog pemuda.',
    steps: [
      {
        id: 'pp-b-1',
        order: 1,
        section: 'Ice Breaking & Pujian Pembuka',
        leaderText:
          'Mari saling menyapa dan menaikkan pujian penyatuan hati sebelum diskusi Firman.',
        hymnRef: {
          book: 'KJ',
          number: 3,
          title: 'Kami Puji dengan Riang',
          versesToSing: 'Bait 1',
        },
      },
      {
        id: 'pp-b-2',
        order: 2,
        section: 'Pemantik Firman & Diskusi Kelompok',
        instruction: 'Peserta dibagi 2–3 kelompok kecil untuk membahas studi kasus kehidupan pemuda.',
        leaderText:
          'Baca Roma 12:1-2: Bagaimana cara pemuda Kristen tidak menjadi serupa dengan dunia ini namun tetap relevan?',
      },
      {
        id: 'pp-b-3',
        order: 3,
        section: 'Rangkuman, Doa Komitmen & Berkat',
        leaderText:
          'Roh Kudus menuntun setiap langkah dan keputusan pemuda Getsemani.',
        congregationText: 'Amin.',
      },
    ],
  },
  {
    id: 'lit-pp-c',
    unsur: 'PP',
    modelCode: 'Model C',
    title: 'Tata Ibadah Malam Doa & Pemulihan Pemuda',
    subtitle: 'Ibadah Kontemplatif / Acoustic Night PP',
    theme: 'Damai di Tengah Kebimbangan Masa Muda',
    occasionHint: 'Cocok untuk ibadah malam minggu akhir bulan atau retret singkat pemuda.',
    steps: [
      {
        id: 'pp-c-1',
        order: 1,
        section: 'Saat Teduh & Nyanyian Pengharapan',
        leaderText:
          'Di hadapan Tuhan tidak ada topeng; mari datang apa adanya membawa kerinduan dan pergumulanmu.',
        hymnRef: {
          book: 'DSL',
          number: 1,
          title: 'Di Dalam Taman Getsemani',
          versesToSing: 'Bait 1 & 2',
        },
      },
      {
        id: 'pp-c-2',
        order: 2,
        section: 'Refleksi Firman & Doa Bersama',
        leaderText:
          'Doa syafaat untuk masa depan pemuda, kesatuan hati, dan pelayanan gereja.',
        hymnRef: {
          book: 'DSL',
          number: 173,
          title: 'Jangan Takut, Aku Besertamu',
          versesToSing: 'Bait 1',
        },
      },
      {
        id: 'pp-c-3',
        order: 3,
        section: 'Berkat Penutup',
        leaderText:
          'Pulanglah dalam damai sejahtera Kristus yang melampaui segala akal.',
        congregationText: 'Amin.',
      },
    ],
  },

  // ================= PAR (3 MODEL: A, B, C) =================
  {
    id: 'lit-par-a',
    unsur: 'PAR',
    modelCode: 'Model A',
    title: 'Tata Ibadah Sekolah Minggu Kelas Kecil',
    subtitle: 'Liturgi Ceria Anak Indria & Pratama (PAR)',
    theme: 'Yesus Sahabat Anak-Anak',
    occasionHint: 'Liturgi sederhana, ceria, dan mudah diikuti adik-adik usia dini hingga SD awal.',
    steps: [
      {
        id: 'par-a-1',
        order: 1,
        section: 'Salam Ceria & Nyanyian Pembuka',
        instruction: 'Guru Sekolah Minggu mengajak anak-anak bertepuk tangan dan menyanyi bersama.',
        leaderText:
          'Selamat pagi adik-adik kekasih Tuhan Yesus! Siapa yang senang datang beribadah hari ini?',
        congregationText: 'Saya senang! Haleluya!',
        hymnRef: {
          book: 'KJ',
          number: 3,
          title: 'Kami Puji dengan Riang',
          versesToSing: 'Bait 1 (dengan gerakan ceria)',
        },
      },
      {
        id: 'par-a-2',
        order: 2,
        section: 'Doa Pembukaan Singkat',
        instruction: 'Semua anak melipat tangan dan menutup mata.',
        leaderText:
          'Tuhan Yesus yang baik, terima kasih untuk hari yang indah. Berkati kami belajar Firman Tuhan. Amin.',
        congregationText: 'Amin.',
      },
      {
        id: 'par-a-3',
        order: 3,
        section: 'Cerita Alkitab & Ayat Hafalan',
        instruction: 'Kakak Pengasuh bercerita dengan gambar/alat peraga dan mengajak mengulang ayat hafalan.',
        leaderText:
          '"Biarkanlah anak-anak itu datang kepada-Ku." (Markus 10:14)',
      },
      {
        id: 'par-a-4',
        order: 4,
        section: 'Persembahan Anak & Doa Penutup',
        leaderText:
          'Tuhan Yesus memberkati adik-adik semua agar rajin belajar, hormat orang tua, dan mengasihi teman.',
        congregationText: 'Amin!',
      },
    ],
  },
  {
    id: 'lit-par-b',
    unsur: 'PAR',
    modelCode: 'Model B',
    title: 'Tata Ibadah Anak Tanggung & Remaja (Madya/Remaja)',
    subtitle: 'Liturgi Pembinaan Remaja PAR',
    theme: 'Bertumbuh dalam Hikmat dan Kasih Tuhan',
    occasionHint: 'Untuk kelas Anak Madya & Tunas Remaja GPI Getsemani Sorong.',
    steps: [
      {
        id: 'par-b-1',
        order: 1,
        section: 'Pujian Pembuka & Votum',
        leaderText:
          'Pertolongan kita datang dari TUHAN yang mengasihi generasi muda gereja-Nya.',
        hymnRef: {
          book: 'PKJ',
          number: 2,
          title: 'Mulia, Mulia Nama-Nya',
          versesToSing: 'Bait 1',
        },
      },
      {
        id: 'par-b-2',
        order: 2,
        section: 'Pembacaan Alkitab & Tanya Jawab',
        leaderText:
          'Pembacaan Injil dilanjutkan tanya jawab interaktif bersama Kakak Pembina PAR.',
        hymnRef: {
          book: 'NR',
          number: 77,
          title: 'Ku Percaya Allah Bapa',
          versesToSing: 'Bait 1',
        },
      },
      {
        id: 'par-b-3',
        order: 3,
        section: 'Persembahan, Doa Syafaat & Berkat',
        leaderText:
          'Tuhan menjaga adik-adik remaja di sekolah, rumah, dan pergaulan sehari-hari.',
        congregationText: 'Amin.',
      },
    ],
  },
  {
    id: 'lit-par-c',
    unsur: 'PAR',
    modelCode: 'Model C',
    title: 'Tata Ibadah Kreatif / Outdoor & Hari Anak',
    subtitle: 'Liturgi Ibadah Gabungan PAR & Aktivitas Kreatif',
    theme: 'Bersukacita Menjaga Alam Ciptaan Tuhan di Tanah Papua',
    occasionHint: 'Cocok untuk ibadah padang, Hari Anak GPI Papua, atau ibadah kreatif bulanan.',
    steps: [
      {
        id: 'par-c-1',
        order: 1,
        section: 'Pujian Alam Ciptaan Tuhan',
        leaderText:
          'Lihatlah langit, laut, dan pepohonan indah di Sorong — semuanya ciptaan Tuhan yang harus kita syukuri dan jaga.',
        hymnRef: {
          book: 'KJ',
          number: 64,
          title: 'Bila Kulihat Bintang Gemerlapan',
          versesToSing: 'Bait 1 & Refrein',
        },
      },
      {
        id: 'par-c-2',
        order: 2,
        section: 'Doa, Cerita Alkitab & Permainan Edukatif',
        leaderText:
          'Penyampaian pesan Firman melalui permainan tim dan kuis Alkitab.',
      },
      {
        id: 'par-c-3',
        order: 3,
        section: 'Doa Berkat & Pengutusan',
        leaderText:
          'Jadilah anak-anak Tuhan yang membawa sukacita di mana pun berada.',
        congregationText: 'Amin.',
      },
    ],
  },

  // ================= LANSIA (2 MODEL: A, B) =================
  {
    id: 'lit-lansia-a',
    unsur: 'LANSIA',
    modelCode: 'Model A',
    title: 'Tata Ibadah Bulanan Persekutuan Lansia',
    subtitle: 'Liturgi Ramah Lansia (Alur Tenang & Jelas)',
    theme: 'Sampai Masa Putih Rambutmu Aku Menggendong Kamu (Yesaya 46:4)',
    occasionHint: 'Ibadah persekutuan Lansia di gedung gereja atau aula. Gunakan tombol A+ untuk memperbesar huruf.',
    steps: [
      {
        id: 'lansia-a-1',
        order: 1,
        section: 'Persiapan & Nyanyian Pembuka',
        instruction: 'Opa dan Oma duduk dengan nyaman (tidak wajib berdiri bila kondisi tidak memungkinkan).',
        leaderText:
          'Segala kemuliaan bagi Tuhan yang memelihara orang tua kami dengan kasih setia sampai hari ini.',
        hymnRef: {
          book: 'NR',
          number: 1,
          title: 'Haleluya, Pujilah Tuhan',
          versesToSing: 'Bait 1 & 2',
        },
      },
      {
        id: 'lansia-a-2',
        order: 2,
        section: 'Votum, Salam & Doa Syukur Usia Lanjut',
        leaderText:
          'Tuhan Yesus hadir di tengah Opa dan Oma sekalian, memberi keteduhan, penghiburan, dan damai sejahtera.',
        congregationText: 'Terpujilah Tuhan. Amin.',
      },
      {
        id: 'lansia-a-3',
        order: 3,
        section: 'Pembacaan Firman Penguatan & Renungan',
        leaderText:
          '"Sampai masa tuamu Aku tetap Dia dan sampai masa putih rambutmu Aku menggendong kamu." (Yesaya 46:4)',
        hymnRef: {
          book: 'NKB',
          number: 188,
          title: 'Tiap Langkahku',
          versesToSing: 'Bait 1 & Refrein',
        },
      },
      {
        id: 'lansia-a-4',
        order: 4,
        section: 'Doa Kesehatan, Anak Cucu & Berkat',
        leaderText:
          'TUHAN memberkati Opa dan Oma dengan kesehatan, sukacita, serta damai sejahtera bersama anak dan cucu.',
        congregationText: 'Amin, amin, amin.',
      },
    ],
  },
  {
    id: 'lit-lansia-b',
    unsur: 'LANSIA',
    modelCode: 'Model B',
    title: 'Tata Ibadah Kunjungan Pastoral Lansia di Rumah',
    subtitle: 'Liturgi Singkat Pelayanan Rumah / Pemulihan',
    theme: 'Tuhan Adalah Gembalaku (Mazmur 23)',
    occasionHint: 'Digunakan Majelis dan pengurus Lansia saat mengunjungi orang tua yang terbatas hadir ke gereja.',
    steps: [
      {
        id: 'lansia-b-1',
        order: 1,
        section: 'Salam Pastoral & Nyanyian Penghiburan',
        leaderText:
          'Damai sejahtera Kristus bagi rumah ini. Kami datang membawa salam kasih dari seluruh jemaat GPI Getsemani Sorong.',
        hymnRef: {
          book: 'DSL',
          number: 173,
          title: 'Jangan Takut, Aku Besertamu',
          versesToSing: 'Bait 1',
        },
      },
      {
        id: 'lansia-b-2',
        order: 2,
        section: 'Pembacaan Mazmur 23 & Doa Penguatan',
        leaderText:
          'TUHAN adalah gembalaku, takkan kekurangan aku. Ia membaringkan aku di padang yang berumput hijau, Ia membimbing aku ke air yang tenang.',
        congregationText: 'Amin.',
      },
      {
        id: 'lansia-b-3',
        order: 3,
        section: 'Doa Khusus & Berkat',
        leaderText:
          'Kiranya damai sejahtera Tuhan menjaga hati, tubuh, dan jiwa saudara kekasih sekarang dan selamanya.',
        congregationText: 'Amin.',
      },
    ],
  },
];

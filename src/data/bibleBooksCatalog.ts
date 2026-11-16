export interface BibleBookMeta {
  bookId: number;
  id: string;
  name: string;
  abbr: string;
  testament: 'PL' | 'PB';
  chaptersCount: number;
}

export const BIBLE_BOOK_CATALOG: BibleBookMeta[] = [
  // Perjanjian Lama (39 Kitab)
  { bookId: 1, id: 'kejadian', name: 'Kejadian', abbr: 'Kej', testament: 'PL', chaptersCount: 50 },
  { bookId: 2, id: 'keluaran', name: 'Keluaran', abbr: 'Kel', testament: 'PL', chaptersCount: 40 },
  { bookId: 3, id: 'imamat', name: 'Imamat', abbr: 'Im', testament: 'PL', chaptersCount: 27 },
  { bookId: 4, id: 'bilangan', name: 'Bilangan', abbr: 'Bil', testament: 'PL', chaptersCount: 36 },
  { bookId: 5, id: 'ulangan', name: 'Ulangan', abbr: 'Ul', testament: 'PL', chaptersCount: 34 },
  { bookId: 6, id: 'yosua', name: 'Yosua', abbr: 'Yos', testament: 'PL', chaptersCount: 24 },
  { bookId: 7, id: 'hakim-hakim', name: 'Hakim-hakim', abbr: 'Hak', testament: 'PL', chaptersCount: 21 },
  { bookId: 8, id: 'rut', name: 'Rut', abbr: 'Rut', testament: 'PL', chaptersCount: 4 },
  { bookId: 9, id: '1-samuel', name: '1 Samuel', abbr: '1Sam', testament: 'PL', chaptersCount: 31 },
  { bookId: 10, id: '2-samuel', name: '2 Samuel', abbr: '2Sam', testament: 'PL', chaptersCount: 24 },
  { bookId: 11, id: '1-raja-raja', name: '1 Raja-raja', abbr: '1Raj', testament: 'PL', chaptersCount: 22 },
  { bookId: 12, id: '2-raja-raja', name: '2 Raja-raja', abbr: '2Raj', testament: 'PL', chaptersCount: 25 },
  { bookId: 13, id: '1-tawarikh', name: '1 Tawarikh', abbr: '1Taw', testament: 'PL', chaptersCount: 29 },
  { bookId: 14, id: '2-tawarikh', name: '2 Tawarikh', abbr: '2Taw', testament: 'PL', chaptersCount: 36 },
  { bookId: 15, id: 'ezra', name: 'Ezra', abbr: 'Ezr', testament: 'PL', chaptersCount: 10 },
  { bookId: 16, id: 'nehemia', name: 'Nehemia', abbr: 'Neh', testament: 'PL', chaptersCount: 13 },
  { bookId: 17, id: 'ester', name: 'Ester', abbr: 'Est', testament: 'PL', chaptersCount: 10 },
  { bookId: 18, id: 'ayub', name: 'Ayub', abbr: 'Ayb', testament: 'PL', chaptersCount: 42 },
  { bookId: 19, id: 'mazmur', name: 'Mazmur', abbr: 'Mzm', testament: 'PL', chaptersCount: 150 },
  { bookId: 20, id: 'amsal', name: 'Amsal', abbr: 'Ams', testament: 'PL', chaptersCount: 31 },
  { bookId: 21, id: 'pengkhotbah', name: 'Pengkhotbah', abbr: 'Pkh', testament: 'PL', chaptersCount: 12 },
  { bookId: 22, id: 'kidung-agung', name: 'Kidung Agung', abbr: 'Kid', testament: 'PL', chaptersCount: 8 },
  { bookId: 23, id: 'yesaya', name: 'Yesaya', abbr: 'Yes', testament: 'PL', chaptersCount: 66 },
  { bookId: 24, id: 'yeremia', name: 'Yeremia', abbr: 'Yer', testament: 'PL', chaptersCount: 52 },
  { bookId: 25, id: 'ratapan', name: 'Ratapan', abbr: 'Rat', testament: 'PL', chaptersCount: 5 },
  { bookId: 26, id: 'yehezkiel', name: 'Yehezkiel', abbr: 'Yeh', testament: 'PL', chaptersCount: 48 },
  { bookId: 27, id: 'daniel', name: 'Daniel', abbr: 'Dan', testament: 'PL', chaptersCount: 12 },
  { bookId: 28, id: 'hosea', name: 'Hosea', abbr: 'Hos', testament: 'PL', chaptersCount: 14 },
  { bookId: 29, id: 'yoel', name: 'Yoel', abbr: 'Yl', testament: 'PL', chaptersCount: 3 },
  { bookId: 30, id: 'amos', name: 'Amos', abbr: 'Am', testament: 'PL', chaptersCount: 9 },
  { bookId: 31, id: 'obaja', name: 'Obaja', abbr: 'Ob', testament: 'PL', chaptersCount: 1 },
  { bookId: 32, id: 'yunus', name: 'Yunus', abbr: 'Yun', testament: 'PL', chaptersCount: 4 },
  { bookId: 33, id: 'mikha', name: 'Mikha', abbr: 'Mi', testament: 'PL', chaptersCount: 7 },
  { bookId: 34, id: 'nahum', name: 'Nahum', abbr: 'Nah', testament: 'PL', chaptersCount: 3 },
  { bookId: 35, id: 'habakuk', name: 'Habakuk', abbr: 'Hab', testament: 'PL', chaptersCount: 3 },
  { bookId: 36, id: 'zefanya', name: 'Zefanya', abbr: 'Zef', testament: 'PL', chaptersCount: 3 },
  { bookId: 37, id: 'hagai', name: 'Hagai', abbr: 'Hag', testament: 'PL', chaptersCount: 2 },
  { bookId: 38, id: 'zakharia', name: 'Zakharia', abbr: 'Za', testament: 'PL', chaptersCount: 14 },
  { bookId: 39, id: 'maleakhi', name: 'Maleakhi', abbr: 'Mal', testament: 'PL', chaptersCount: 4 },

  // Perjanjian Baru (27 Kitab)
  { bookId: 40, id: 'matius', name: 'Matius', abbr: 'Mat', testament: 'PB', chaptersCount: 28 },
  { bookId: 41, id: 'markus', name: 'Markus', abbr: 'Mrk', testament: 'PB', chaptersCount: 16 },
  { bookId: 42, id: 'lukas', name: 'Lukas', abbr: 'Luk', testament: 'PB', chaptersCount: 24 },
  { bookId: 43, id: 'yohanes', name: 'Yohanes', abbr: 'Yoh', testament: 'PB', chaptersCount: 21 },
  { bookId: 44, id: 'kisah-para-rasul', name: 'Kisah Para Rasul', abbr: 'Kis', testament: 'PB', chaptersCount: 28 },
  { bookId: 45, id: 'roma', name: 'Roma', abbr: 'Rm', testament: 'PB', chaptersCount: 16 },
  { bookId: 46, id: '1-korintus', name: '1 Korintus', abbr: '1Kor', testament: 'PB', chaptersCount: 16 },
  { bookId: 47, id: '2-korintus', name: '2 Korintus', abbr: '2Kor', testament: 'PB', chaptersCount: 13 },
  { bookId: 48, id: 'galatia', name: 'Galatia', abbr: 'Gal', testament: 'PB', chaptersCount: 6 },
  { bookId: 49, id: 'efesus', name: 'Efesus', abbr: 'Ef', testament: 'PB', chaptersCount: 6 },
  { bookId: 50, id: 'filipi', name: 'Filipi', abbr: 'Flp', testament: 'PB', chaptersCount: 4 },
  { bookId: 51, id: 'kolose', name: 'Kolose', abbr: 'Kol', testament: 'PB', chaptersCount: 4 },
  { bookId: 52, id: '1-tesalonika', name: '1 Tesalonika', abbr: '1Tes', testament: 'PB', chaptersCount: 5 },
  { bookId: 53, id: '2-tesalonika', name: '2 Tesalonika', abbr: '2Tes', testament: 'PB', chaptersCount: 3 },
  { bookId: 54, id: '1-timotius', name: '1 Timotius', abbr: '1Tim', testament: 'PB', chaptersCount: 6 },
  { bookId: 55, id: '2-timotius', name: '2 Timotius', abbr: '2Tim', testament: 'PB', chaptersCount: 4 },
  { bookId: 56, id: 'titus', name: 'Titus', abbr: 'Tit', testament: 'PB', chaptersCount: 3 },
  { bookId: 57, id: 'filemon', name: 'Filemon', abbr: 'Flm', testament: 'PB', chaptersCount: 1 },
  { bookId: 58, id: 'ibrani', name: 'Ibrani', abbr: 'Ibr', testament: 'PB', chaptersCount: 13 },
  { bookId: 59, id: 'yakobus', name: 'Yakobus', abbr: 'Yak', testament: 'PB', chaptersCount: 5 },
  { bookId: 60, id: '1-petrus', name: '1 Petrus', abbr: '1Ptr', testament: 'PB', chaptersCount: 5 },
  { bookId: 61, id: '2-petrus', name: '2 Petrus', abbr: '2Ptr', testament: 'PB', chaptersCount: 3 },
  { bookId: 62, id: '1-yohanes', name: '1 Yohanes', abbr: '1Yoh', testament: 'PB', chaptersCount: 5 },
  { bookId: 63, id: '2-yohanes', name: '2 Yohanes', abbr: '2Yoh', testament: 'PB', chaptersCount: 1 },
  { bookId: 64, id: '3-yohanes', name: '3 Yohanes', abbr: '3Yoh', testament: 'PB', chaptersCount: 1 },
  { bookId: 65, id: 'yudas', name: 'Yudas', abbr: 'Yud', testament: 'PB', chaptersCount: 1 },
  { bookId: 66, id: 'wahyu', name: 'Wahyu', abbr: 'Why', testament: 'PB', chaptersCount: 22 },
];

export const TOTAL_CANONICAL_BOOKS = BIBLE_BOOK_CATALOG.length; // 66
export const TOTAL_CANONICAL_CHAPTERS = BIBLE_BOOK_CATALOG.reduce(
  (sum, b) => sum + b.chaptersCount,
  0
); // 1189

export function findBibleBookMeta(bookIdOrSlugOrName: number | string): BibleBookMeta | undefined {
  if (typeof bookIdOrSlugOrName === 'number') {
    return BIBLE_BOOK_CATALOG.find((b) => b.bookId === bookIdOrSlugOrName);
  }
  const normalized = bookIdOrSlugOrName.trim().toLowerCase();
  const numeric = Number(normalized);
  if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= 66) {
    return BIBLE_BOOK_CATALOG.find((b) => b.bookId === numeric);
  }
  return BIBLE_BOOK_CATALOG.find(
    (b) =>
      b.id === normalized ||
      b.name.toLowerCase() === normalized ||
      b.abbr.toLowerCase() === normalized
  );
}

/**
 * Fixed group data, managed in code by the webmaster.
 *
 * Values that are still `undefined` are not shown on the site; the build lists
 * them as a warning. They come from docs/huidige-site/inhoud.md (§2 and §7).
 */
type Maybe = string | undefined;

export const site = {
  name: 'Scouts Don Bosco Vosselaar',
  shortName: 'Scouts Vosselaar',
  slogan: 'Scouting? DAS Goesting!',
  groupNumber: 'A4108G',
  federation: 'Scouts en Gidsen Vlaanderen',
  gouw: 'Gouw Kempen',
  district: 'District Noorderkempen',
  email: 'info@scoutsvosselaar.be',
  address: {
    street: undefined as Maybe,
    postalCode: '2350',
    city: 'Vosselaar',
  },
} as const;

/** Lidgeld and registration (page /inschrijven/). */
export const membership = {
  fee: 50,
  /** With UiTPAS and a right to the reduced rate. */
  reducedFee: 15,
  /** For members who join after `lateFrom`. */
  lateFee: 30,
  lateFrom: '1 maart',
  bankAccount: undefined as Maybe,
  paymentReference: undefined as Maybe,
  /** External registration form or document. */
  registrationUrl: undefined as Maybe,
  /** Instructions for the medical form in the Scouts en Gidsen Vlaanderen administration. */
  medicalInstructionsUrl: undefined as Maybe,
};

/** Renting the premises (page /verhuur/). */
export const rental = {
  maxPeople: 50,
  email: undefined as Maybe,
  phone: undefined as Maybe,
  calendarUrl: undefined as Maybe,
  kampasUrl: 'https://www.kampas.be',
};

/** Other addresses and documents. */
export const extra = {
  smoutebollenbakEmail: undefined as Maybe,
  /** Privacy statement as a file in public/docs/. */
  privacyPdf: undefined as Maybe,
};

export interface NavItem {
  label: string;
  href: string;
}

/** Main menu, in this order. */
export const navigation: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Kalender', href: '/kalender/' },
  { label: 'Takken', href: '/takken/' },
  { label: 'Leiding', href: '/leiding/' },
  { label: "Foto's", href: '/fotos/' },
  { label: "'t Voske", href: '/voske/' },
  { label: 'Inschrijven', href: '/inschrijven/' },
  { label: 'Praktisch', href: '/praktisch/' },
  { label: 'Verhuur', href: '/verhuur/' },
  { label: 'Onze groep', href: '/onze-groep/' },
];

/** Shortcuts that stay visible on small screens. */
export const quickLinks: NavItem[] = [
  { label: 'Kalender', href: '/kalender/' },
  { label: 'Inschrijven', href: '/inschrijven/' },
];

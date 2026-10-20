/**
 * Fixed group data, managed in code.
 * TODO(fase 3): adres, rekeningnummer en verhuurgegevens aanvullen uit docs/huidige-site/inhoud.md.
 */
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
    street: 'TODO',
    postalCode: '2350',
    city: 'Vosselaar',
  },
  bankAccount: 'TODO',
} as const;

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

/**
 * Sveltia CMS configuration. Built at build time and passed to the admin page
 * as JSON, so it may only contain plain data.
 *
 * Labels and hints are Dutch: they are what the leiding sees.
 */
import type { CmsConfig, Collection, EntryCollection, Field, RelationField } from '@sveltia/cms';
import type { Deployment } from '../../deployment.config';

const MB = 1024 * 1024;

const PUBLIC_HINT = 'Wordt publiek getoond op de site. Enkel invullen met toestemming.';
const IMAGE_RIGHTS_HINT = "Enkel foto's van leden die toestemming gaven voor beeldmateriaal.";
const SAVE_NOTE = 'Na het opslaan duurt het enkele minuten voor de wijziging online staat.';

/** Uploads go next to Astro's other assets so `astro:assets` can optimize them. */
const mediaFolders = (collection: string) => ({
  media_folder: `/src/assets/uploads/${collection}`,
  // Starts with `..`, so the CMS stores a path relative to the entry file
  // (src/content/<collection>/), which is what Astro's `image()` expects.
  public_folder: `../../assets/uploads/${collection}`,
});

const string = (name: string, label: string, extra: Partial<Field> = {}): Field =>
  ({ name, label, widget: 'string', ...extra }) as Field;

const optionalString = (name: string, label: string, extra: Partial<Field> = {}): Field =>
  string(name, label, { required: false, ...extra });

const url = (name: string, label: string, hint?: string): Field => ({
  name,
  label,
  widget: 'string',
  type: 'url',
  required: false,
  hint,
  pattern: ['^https?://', 'Een link begint met https://'],
});

const bool = (name: string, label: string, hint?: string): Field => ({
  name,
  label,
  widget: 'boolean',
  default: false,
  required: false,
  hint,
});

const image = (name: string, label: string, hint = IMAGE_RIGHTS_HINT, required = false): Field => ({
  name,
  label,
  widget: 'image',
  required,
  hint,
  choose_url: false,
});

const images = (name: string, label: string, max: number): Field => ({
  name,
  label,
  widget: 'image',
  multiple: true,
  max,
  required: false,
  choose_url: false,
  hint: `Maximaal ${max} foto's. ${IMAGE_RIGHTS_HINT}`,
});

/** Brussels wall-clock time, stored without offset, whatever the editor's time zone. */
const dateTime = (name: string, label: string, required = true, hint?: string): Field => ({
  name,
  label,
  widget: 'datetime',
  type: 'datetime-local',
  format: 'YYYY-MM-DDTHH:mm',
  input_timezone: 'Europe/Brussels',
  step: 300,
  required,
  hint,
});

const date = (name: string, label: string, hint?: string): Field => ({
  name,
  label,
  widget: 'datetime',
  type: 'date',
  format: 'YYYY-MM-DD',
  default: '{{now}}',
  hint,
});

const sectionsRelation = (hint: string): RelationField => ({
  name: 'sections',
  label: 'Takken',
  widget: 'relation',
  collection: 'sections',
  value_field: '{{slug}}',
  display_fields: ['name'],
  search_fields: ['name'],
  sort_by: { field: 'order' },
  multiple: true,
  required: false,
  hint,
});

const leadersRelation = (name: string, label: string, hint?: string): RelationField => ({
  name,
  label,
  widget: 'relation',
  collection: 'leaders',
  value_field: '{{slug}}',
  display_fields: ['{{firstName}} {{lastName}} ({{totem}})'],
  search_fields: ['firstName', 'lastName', 'totem'],
  sort_by: { field: 'firstName' },
  multiple: true,
  required: false,
  hint,
});

const richText = (name: string, label: string, withImages: boolean, hint?: string): Field => ({
  name,
  label,
  widget: 'richtext',
  buttons: ['bold', 'italic', 'link', 'heading-two', 'heading-three', 'bulleted-list', 'numbered-list', 'quote'],
  editor_components: withImages ? ['image'] : [],
  modes: ['rich_text'],
  hint,
});

const datedSlug = (dateField: string) =>
  ({ template: `{{fields.${dateField} | date('YYYY-MM-DD')}}-{{slug}}`, editable: false }) as const;

const posts: EntryCollection = {
  name: 'posts',
  label: 'Berichten',
  label_singular: 'Bericht',
  icon: 'campaign',
  description: `Nieuws en uitnodigingen op de homepagina. ${SAVE_NOTE}`,
  folder: 'src/content/posts',
  extension: 'md',
  format: 'yaml-frontmatter',
  slug: datedSlug('date'),
  ...mediaFolders('posts'),
  summary: '{{title}} ({{date}})',
  sortable_fields: { fields: ['title', 'date'], default: { field: 'date', direction: 'descending' } },
  view_filters: [
    { label: 'Concepten', field: 'draft', eq: true },
    { label: 'Vastgepind', field: 'pinned', eq: true },
  ],
  fields: [
    string('title', 'Titel'),
    date('date', 'Datum', 'Bepaalt de volgorde op de site. Nieuwste bovenaan.'),
    {
      name: 'excerpt',
      label: 'Korte samenvatting',
      widget: 'text',
      maxlength: 200,
      hint: 'Een of twee zinnen voor het overzicht op de homepagina.',
    },
    image('coverImage', 'Coverfoto', `Wordt bovenaan en bij het delen getoond. ${IMAGE_RIGHTS_HINT}`),
    richText('body', 'Tekst', true),
    images('gallery', "Foto's", 12),
    url('videoUrl', 'YouTube-video', 'Plak de link naar een YouTube-video (optioneel).'),
    url('buttonUrl', 'Link van de knop', 'Bv. een Google Form om in te schrijven of een Facebook-evenement.'),
    optionalString('buttonLabel', 'Tekst op de knop', { hint: 'Bv. "Inschrijven".' }),
    sectionsRelation('Voor welke takken is dit bericht? Leeg laten als het voor iedereen is.'),
    bool('pinned', 'Vastpinnen', 'Bovenaan de homepagina tonen. Is er meer dan een bericht vastgepind, dan staat enkel het nieuwste bovenaan.'),
    bool('draft', 'Concept', 'Een concept staat niet op de site. Zet dit uit om te publiceren.'),
  ],
};

const events: EntryCollection = {
  name: 'events',
  label: 'Evenementen',
  label_singular: 'Evenement',
  icon: 'event',
  description: `De kalender. Wekelijkse vergaderingen staan bij de tak, niet hier. ${SAVE_NOTE}`,
  folder: 'src/content/events',
  extension: 'md',
  format: 'yaml-frontmatter',
  slug: datedSlug('start'),
  ...mediaFolders('events'),
  summary: '{{title}} ({{start}})',
  sortable_fields: { fields: ['title', 'start'], default: { field: 'start', direction: 'descending' } },
  view_filters: [
    { label: 'Komend', field: 'start', gte: '{{now}}' },
    { label: 'Voorbij', field: 'start', lt: '{{now}}' },
  ],
  fields: [
    string('title', 'Titel'),
    dateTime('start', 'Begin', true, 'Belgische tijd.'),
    dateTime('end', 'Einde', false, 'Optioneel.'),
    bool('allDay', 'Hele dag', 'Aanzetten als het evenement geen vast uur heeft. Het uur van Begin wordt dan genegeerd.'),
    optionalString('location', 'Locatie', { hint: 'Adres of plaats. "Verrassing" mag ook.' }),
    sectionsRelation('Voor welke takken? Leeg laten als het voor de hele groep is.'),
    bool('forLeaders', 'Voor de leiding', 'Aanzetten voor activiteiten van of met de leiding.'),
    optionalString('price', 'Prijs', { hint: 'Bv. "€35". Leeg laten als het gratis is.' }),
    image('image', 'Afbeelding'),
    url('linkUrl', 'Link', 'Bv. een Google Form om in te schrijven.'),
    optionalString('linkLabel', 'Tekst op de knop', { hint: 'Bv. "Inschrijven".' }),
    bool('cancelled', 'Geannuleerd', 'Het evenement blijft zichtbaar, maar wordt duidelijk als geannuleerd getoond.'),
    { ...richText('body', 'Beschrijving', false), required: false },
  ],
};

const scoutYears: EntryCollection = {
  name: 'scout-years',
  label: 'Werkjaren',
  label_singular: 'Werkjaar',
  icon: 'groups',
  description:
    'De leiding per tak, de groepsleiding en de groepsfoto\'s per werkjaar. Nieuw werkjaar: dupliceer het vorige, pas het label en de datums aan, wijzig de indeling, maak de groepsfoto\'s leeg en kies het nieuwe werkjaar bij Instellingen.',
  folder: 'src/content/scout-years',
  extension: 'json',
  format: 'json',
  identifier_field: 'label',
  slug: { template: '{{label}}', editable: false },
  ...mediaFolders('scout-years'),
  summary: '{{label}}',
  sortable_fields: { fields: ['label'], default: { field: 'label', direction: 'descending' } },
  fields: [
    string('label', 'Werkjaar', {
      hint: 'Bv. "2026-2027".',
      pattern: ['^\\d{4}-\\d{4}$', 'Schrijf het werkjaar als 2026-2027.'],
    }),
    date('startDate', 'Begint op'),
    date('endDate', 'Eindigt op'),
    leadersRelation('groupLeaders', 'Groepsleiding'),
    {
      name: 'sectionTeams',
      label: 'Leiding per tak',
      label_singular: 'tak',
      widget: 'list',
      required: false,
      summary: '{{fields.section}}',
      hint: 'Voeg per tak een blok toe. Iemand mag in meer dan een tak staan.',
      fields: [
        {
          name: 'section',
          label: 'Tak',
          widget: 'relation',
          collection: 'sections',
          value_field: '{{slug}}',
          display_fields: ['name'],
          sort_by: { field: 'order' },
        },
        leadersRelation('leaders', 'Leiding'),
        leadersRelation('sectionLeads', 'Takleiding', 'De takleiders (meestal 2 tot 4). Zet hen ook bij Leiding.'),
      ],
    },
    images('groupPhotos', "Groepsfoto's", 10),
  ],
};

const leaders: EntryCollection = {
  name: 'leaders',
  label: 'Leiding',
  label_singular: 'Leider',
  icon: 'person',
  description:
    'Iedereen die ooit leiding was of is. Een persoon blijft bestaan over de werkjaren heen. In welke tak iemand staat, kies je bij Werkjaren.',
  folder: 'src/content/leaders',
  extension: 'json',
  format: 'json',
  identifier_field: 'firstName',
  slug: { template: '{{firstName}}-{{lastName}}', editable: false },
  ...mediaFolders('leaders'),
  summary: "{{firstName}} {{lastName}} ({{totem | default('geen totem')}})",
  sortable_fields: { fields: ['firstName', 'lastName', 'totem'], default: { field: 'firstName' } },
  fields: [
    string('firstName', 'Voornaam'),
    string('lastName', 'Achternaam'),
    optionalString('totem', 'Totem'),
    optionalString('voortotem', 'Voortotem'),
    image('photo', 'Foto', `${PUBLIC_HINT} Liefst een portret.`),
    optionalString('birthday', 'Verjaardag', {
      hint: `Dag en maand, bv. 24/03. ${PUBLIC_HINT}`,
      pattern: ['^\\d{1,2}/\\d{1,2}$', 'Schrijf de verjaardag als dag/maand, bv. 24/03.'],
    }),
    optionalString('email', 'E-mail', { type: 'email', hint: PUBLIC_HINT }),
    optionalString('phone', 'Gsm', { hint: PUBLIC_HINT }),
    { name: 'bio', label: 'Over mij', widget: 'text', required: false, maxlength: 300, hint: 'Optioneel, max 300 tekens.' },
  ],
};

const albums: EntryCollection = {
  name: 'albums',
  label: 'Fotoalbums',
  label_singular: 'Fotoalbum',
  icon: 'photo_library',
  description: `Een cover en een link naar het volledige album elders. ${SAVE_NOTE}`,
  folder: 'src/content/albums',
  extension: 'json',
  format: 'json',
  slug: { template: '{{year}}-{{slug}}', editable: false },
  ...mediaFolders('albums'),
  summary: '{{title}} ({{date}})',
  sortable_fields: { fields: ['title', 'date'], default: { field: 'date', direction: 'descending' } },
  fields: [
    string('title', 'Titel', { hint: 'Bv. "Kamp Welpen 2026".' }),
    date('date', 'Datum'),
    sectionsRelation('Optioneel.'),
    image('coverImage', 'Coverfoto', IMAGE_RIGHTS_HINT, true),
    {
      ...url('albumUrl', 'Link naar het album', "Zet je foto's in een gedeeld album (bv. Google Foto's) en plak hier de link."),
      required: true,
    },
  ],
};

const voskes: EntryCollection = {
  name: 'voskes',
  label: "'t Voske",
  label_singular: "Editie van 't Voske",
  icon: 'menu_book',
  description: `Het ledenblad als PDF. De nieuwste editie staat bovenaan de pagina. ${SAVE_NOTE}`,
  folder: 'src/content/voskes',
  extension: 'json',
  format: 'json',
  slug: { template: '{{slug}}', editable: false },
  ...mediaFolders('voskes'),
  summary: '{{title}} ({{date}})',
  sortable_fields: { fields: ['title', 'date'], default: { field: 'date', direction: 'descending' } },
  fields: [
    string('title', 'Titel', { hint: "Bv. \"'t Voske 2026\"." }),
    date('date', 'Datum'),
    {
      name: 'pdf',
      label: 'PDF',
      widget: 'file',
      accept: 'application/pdf',
      choose_url: false,
      media_folder: '/public/voske',
      public_folder: '/voske',
      media_libraries: { default: { config: { max_file_size: 20 * MB } } },
      hint: 'Maximaal 20 MB.',
    },
    image('cover', 'Voorpagina', 'Een afbeelding van de voorpagina (optioneel).'),
  ],
};

const sections: EntryCollection = {
  name: 'sections',
  label: 'Takken',
  label_singular: 'Tak',
  icon: 'diversity_3',
  description: 'De vaste info per tak. Takken toevoegen of verwijderen gebeurt door de webmaster.',
  folder: 'src/content/sections',
  extension: 'json',
  format: 'json',
  identifier_field: 'name',
  create: false,
  delete: false,
  duplicate: false,
  ...mediaFolders('sections'),
  sortable_fields: { fields: ['order', 'name'], default: { field: 'order' } },
  fields: [
    string('name', 'Naam'),
    string('ageRange', 'Leeftijd', { hint: 'Bv. "6 en 7 jaar".' }),
    { name: 'shortDescription', label: 'Korte beschrijving', widget: 'text', maxlength: 400, hint: 'Voor het overzicht van de takken.' },
    richText('who', 'Wie?', false),
    richText('what', 'Wat?', false),
    richText('camp', 'Kamp?', false),
    string('meetingTime', 'Vergadermoment', { hint: 'Bv. "Zondag 14u tot 16u30".' }),
    optionalString('email', 'Takmail', { type: 'email' }),
    string('leaderLabel', 'Naam voor de leiding', { default: 'Leiding', hint: 'Bv. "Begeleiding" bij de Jin.' }),
    { name: 'color', label: 'Kleur', widget: 'color', allowInput: true },
    image('image', 'Afbeelding'),
    { name: 'order', label: 'Volgorde', widget: 'number', value_type: 'int', hint: 'Kleinste getal eerst.' },
  ],
};

const settings: Collection = {
  name: 'settings',
  label: 'Instellingen',
  icon: 'settings',
  description: 'Algemene instellingen van de site.',
  files: [
    {
      name: 'site',
      label: 'Instellingen',
      file: 'src/content/settings/site.json',
      format: 'json',
      fields: [
        {
          name: 'currentYear',
          label: 'Actief werkjaar',
          widget: 'relation',
          collection: 'scout-years',
          value_field: '{{slug}}',
          display_fields: ['label'],
          sort_by: { field: 'label', direction: 'descending' },
          hint: 'Het werkjaar waarvan de site de leiding en groepsfoto\'s toont.',
        },
      ],
    },
  ],
};

export function buildCmsConfig(deployment: Deployment): CmsConfig {
  const base = deployment.basePath.replace(/\/$/, '');
  const hasOAuth = deployment.cmsAuthUrl !== '';

  return {
    load_config_file: false,
    backend: {
      name: 'github',
      repo: deployment.repo,
      branch: deployment.branch,
      ...(hasOAuth ? { base_url: deployment.cmsAuthUrl, auth_methods: ['oauth'] } : { auth_methods: ['token'] }),
      commit_messages: {
        create: '{{collection}} "{{slug}}" aangemaakt',
        update: '{{collection}} "{{slug}}" bijgewerkt',
        delete: '{{collection}} "{{slug}}" verwijderd',
        uploadMedia: 'Bestand "{{path}}" geüpload',
        deleteMedia: 'Bestand "{{path}}" verwijderd',
      },
    },
    publish_mode: 'simple',
    app_title: 'Scouts Vosselaar: beheer',
    site_url: `${deployment.siteUrl}${base}/`,
    logo: { src: `${base}/favicon.svg` },
    logout_redirect_url: `${base}/`,
    media_folder: 'src/assets/uploads',
    public_folder: '/src/assets/uploads',
    media_libraries: {
      default: {
        config: {
          max_file_size: 25 * MB,
          slugify_filename: true,
          // Re-encoding drops EXIF data (including GPS) from photos.
          transformations: { raster_image: { format: 'webp', quality: 80, width: 2000 } },
        },
      },
    },
    slug: { encoding: 'ascii', clean_accents: true, timezone: 'local' },
    output: { omit_empty_optional_fields: true, json: { indent_size: 2 } },
    editor: { preview: false },
    collections: [posts, events, scoutYears, leaders, albums, voskes, sections, settings],
  };
}

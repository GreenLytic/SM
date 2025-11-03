export const REGIONS_CACAO = [
  'Agnéby-Tiassa',
  'Bélier',
  'Gbêkê',
  'Gôh',
  'Grands-Ponts',
  'Guémon',
  'Haut-Sassandra',
  'Lôh-Djiboua',
  'Marahoué',
  'Nawa',
  'San-Pédro',
  'Sud-Comoé',
  'Tonkpi'
] as const;

export type CacaoRegion = typeof REGIONS_CACAO[number];
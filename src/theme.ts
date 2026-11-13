/**
 * Mirrors the ProctorAide web palette: dark teal chrome, white content,
 * light gray panels, teal buttons, and cream role accents.
 */
export const colors = {
  header: '#0b3b3d',
  headerDeep: '#09302d',
  teal: '#164f48',
  tealDeep: '#103f39',
  tealText: '#1c6b5e',
  tealSoft: '#e7f2ef',
  accent: '#2d8a7b',
  accentSoft: '#8fd6c7',
  cream: '#f4e9c7',
  creamText: '#3b4527',

  page: '#f6f8f7',
  white: '#ffffff',
  ink: '#102b28',
  inkSoft: '#2f4a45',
  rowTitle: '#1e3834',
  body: '#6b7f7b',
  bodySoft: '#7b8f8a',
  muted: '#93a5a1',
  faint: '#9baba7',
  tableHead: '#f4f7f5',

  border: '#e2ebe7',
  borderSoft: '#eef3f1',
  field: '#d7e2de',
  fieldPlaceholder: '#9aaba7',

  danger: '#b4453a',
  dangerSoft: '#fdecea',
  dangerBorder: '#f4d1cc',
  dangerDot: '#c25a4f',

  amber: '#8a6a1f',
  amberSoft: '#fbf4e1',
  amberBorder: '#efe0b6',
  amberDot: '#c9a03f',

  green: '#1b7a52',
  greenSoft: '#e8f5ee',
  greenBorder: '#c4e6d5',
  greenDot: '#2f9e6b',
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  section: 28,
} as const;

export const shadow = {
  card: {
    shadowColor: '#09302d',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
} as const;

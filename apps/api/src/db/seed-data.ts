export type SeedNote = {
  title: string;
  category: string;
  snippet: string;
  content: string;
  published: 0 | 1;
  color: string;
  tags: string[];
};

// Development-only sample seed data.
// Use migrations (not this file) for production schema/data changes.
export const DEV_SEED_USER = {
  id: 'dev_user_1',
  name: 'Developer',
  email: 'dev@vicoo.local'
} as const;

export const DEV_SEED_NOTES: SeedNote[] = [
  {
    title: 'Welcome to Vicoo',
    category: 'idea',
    snippet: 'Your visual coordinator for knowledge management',
    content: '# Welcome to Vicoo\n\nThis is your new knowledge workspace. Start creating notes and exploring the galaxy view!',
    published: 1,
    color: '#FFD166',
    tags: ['welcome', 'intro']
  },
  {
    title: 'React Best Practices',
    category: 'code',
    snippet: 'Key patterns for React development',
    content: '# React Best Practices\n\n- Use functional components with hooks\n- Keep state local when possible\n- Memoize expensive computations',
    published: 1,
    color: '#118AB2',
    tags: ['react', 'javascript', 'frontend']
  },
  {
    title: 'Design System Ideas',
    category: 'design',
    snippet: 'Neubrutalism-lite design concepts',
    content: '# Design System\n\n## Colors\n- Primary: #FFD166\n- Secondary: #0df259\n- Accent: #EF476F',
    published: 0,
    color: '#EF476F',
    tags: ['design', 'ui', 'ideas']
  },
  {
    title: 'Project Planning Meeting',
    category: 'meeting',
    snippet: 'Q1 planning discussion notes',
    content: '# Q1 Planning\n\n- Define MVP scope\n- Set milestone dates\n- Assign team responsibilities',
    published: 1,
    color: '#0df259',
    tags: ['meeting', 'planning']
  }
];

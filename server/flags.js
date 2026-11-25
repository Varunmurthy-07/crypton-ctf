// Single source of truth for all 15 flags (SERVER ONLY - never import this in the client).
// Every flag body is a technical phrase describing the vulnerability class.
export const FLAGS = [
  { id: 1, key: 'recon-comment', name: 'Source Recon', category: 'Recon', points: 50, flag: 'RITCTF{HTML_COMMENT_RECONNAISSANCE}' },
  { id: 2, key: 'robots-disallow', name: 'Robots Are Friendly', category: 'Recon', points: 50, flag: 'RITCTF{ROBOTS_TXT_INFORMATION_DISCLOSURE}' },
  { id: 3, key: 'auth-bypass', name: 'Admin Bypass', category: 'SQL Injection', points: 100, flag: 'RITCTF{SQL_AUTHENTICATION_BYPASS}' },
  { id: 4, key: 'cookie-role', name: 'Cookie Forgery', category: 'Broken Access Control', points: 75, flag: 'RITCTF{COOKIE_ROLE_FORGERY}' },
  { id: 5, key: 'idor-profile', name: 'Profile Hopping', category: 'Broken Access Control', points: 75, flag: 'RITCTF{INSECURE_DIRECT_OBJECT_REFERENCE}' },
  { id: 6, key: 'error-sqli', name: 'Error Based SQLi', category: 'SQL Injection', points: 100, flag: 'RITCTF{ERROR_BASED_SQL_INJECTION}' },
  { id: 7, key: 'union-sqli', name: 'Union Based SQLi', category: 'SQL Injection', points: 125, flag: 'RITCTF{UNION_BASED_SQL_INJECTION}' },
  { id: 8, key: 'boolean-sqli', name: 'Boolean Blind SQLi', category: 'SQL Injection', points: 150, flag: 'RITCTF{BOOLEAN_BLIND_SQL_INJECTION}' },
  { id: 9, key: 'stored-xss', name: 'Stored XSS', category: 'XSS', points: 100, flag: 'RITCTF{STORED_CROSS_SITE_SCRIPTING}' },
  { id: 10, key: 'reflected-xss', name: 'Reflected XSS', category: 'XSS', points: 100, flag: 'RITCTF{REFLECTED_CROSS_SITE_SCRIPTING}' },
  { id: 11, key: 'lfi-source', name: 'Local File Inclusion', category: 'File Attacks', points: 125, flag: 'RITCTF{LOCAL_FILE_INCLUSION}' },
  { id: 12, key: 'traversal-download', name: 'Download Traversal', category: 'File Attacks', points: 100, flag: 'RITCTF{PATH_TRAVERSAL_FILE_DOWNLOAD}' },
  { id: 13, key: 'cmd-injection', name: 'Command Injection', category: 'RCE', points: 150, flag: 'RITCTF{OPERATING_SYSTEM_COMMAND_INJECTION}' },
  { id: 14, key: 'upload-webshell', name: 'Upload + Template RCE', category: 'RCE', points: 175, flag: 'RITCTF{UNRESTRICTED_UPLOAD_TEMPLATE_RCE}' },
  { id: 15, key: 'final-chain', name: 'The Final Chain', category: 'Chaining', points: 200, flag: 'RITCTF{BACKUP_DISCLOSURE_SQL_CHAIN}' }
]

export const TOTAL_POINTS = FLAGS.reduce((sum, f) => sum + f.points, 0)

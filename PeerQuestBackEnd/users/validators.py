import unicodedata
from itertools import product

# Expanded profanity filter (for demonstration; for production, use a maintained library or service)
PROFANITY_LIST = [
    'nigger', 'nigga', 'badword1', 'badword2', 'badword3',
    'fuck', 'shit', 'bitch', 'cunt', 'asshole', 'dick', 'pussy', 'fag', 'faggot', 'slut', 'whore',
    'bastard', 'damn', 'cock', 'dildo', 'dyke', 'spic', 'kike', 'chink', 'gook', 'coon', 'wetback',
    'tranny', 'twat', 'wank', 'wanker', 'jerkoff', 'jackoff', 'motherfucker', 'arse', 'bollocks',
    'bugger', 'crap', 'cum', 'cumming', 'cocksucker', 'douche', 'douchebag', 'fucker', 'fucking',
    'homo', 'jizz', 'niglet', 'prick', 'queer', 'retard', 'shithead', 'skank', 'spastic', 'tard',
    'tits', 'tit', 'titties', 'wop', 'wuss', 'rape', 'rapist', 'molest', 'molester', 'pedo', 'pedophile',
    'porn', 'porno', 'pornography', 'sodomize', 'sodomise', 'sodomist', 'sodomite', 'suck', 'sucker',
    'whore', 'whorebag', 'whoreface', 'whorehouse', 'whorehopper', 'whorehound', 'whorelet', 'whoremaster',
    'whoremonger', 'whorepipe', 'whorester', 'whoreweed', 'whorey', 'wigger', 'zipperhead', 'bimbo',
    'biatch', 'bollok', 'boner', 'boob', 'boobs', 'bullshit', 'butt', 'clit', 'clitoris', 'cockhead',
    'cooch', 'coochie', 'coonass', 'crap', 'cumdumpster', 'cuntface', 'cuntlicker', 'cuntmuncher',
    'cunts', 'dickbag', 'dickface', 'dickhead', 'dickhole', 'dildo', 'dipshit', 'douche', 'douchebag',
    'dumbass', 'dumass', 'fagbag', 'fagfag', 'fagface', 'faggit', 'faggot', 'faggy', 'fagot', 'fagott',
    'fatass', 'fuckass', 'fuckbag', 'fuckboy', 'fuckbrain', 'fuckbutt', 'fucked', 'fucker', 'fuckers',
    'fuckface', 'fuckhead', 'fuckhole', 'fucking', 'fucknut', 'fuckoff', 'fucks', 'fuckstick', 'fucktard',
    'fuckup', 'gayass', 'gayfuck', 'gaylord', 'gaytard', 'goddamn', 'goddamnit', 'gook', 'handjob',
    'hardon', 'heeb', 'hell', 'hoe', 'homo', 'homobanger', 'homodumbshit', 'honkey', 'humping', 'jackass',
    'jap', 'jerk', 'jerkoff', 'jigaboo', 'jizz', 'jungle bunny', 'kike', 'kooch', 'kunt', 'kyke', 'lesbo',
    'lezzie', 'mcfagget', 'mick', 'minge', 'mothafucka', 'mothafuckin', 'motherfucker', 'motherfucking',
    'muff', 'muffdiver', 'negro', 'nigaboo', 'nigga', 'niggah', 'niggas', 'niggaz', 'nigger', 'niggers',
    'niglet', 'nutsack', 'paki', 'panooch', 'pecker', 'peckerhead', 'penis', 'piss', 'pissed', 'pissflaps',
    'polesmoker', 'poon', 'poonani', 'poontang', 'porch monkey', 'porchmonkey', 'prick', 'punani', 'pussy',
    'pussies', 'pussylicking', 'puto', 'queef', 'queer', 'queerbait', 'queerhole', 'renob', 'rimjob',
    'ruski', 'sand nigger', 'sandnigger', 'schlong', 'scrote', 'shit', 'shitass', 'shitbag', 'shitbagger',
    'shitbrains', 'shitbreath', 'shitcanned', 'shitdick', 'shitface', 'shitfaced', 'shithead', 'shithole',
    'shithouse', 'shitspitter', 'shitter', 'shitty', 'shiz', 'skank', 'skeet', 'skullfuck', 'slut', 'slutbag',
    'slutface', 'sluts', 'smegma', 'spic', 'spick', 'splooge', 'spook', 'suckass', 'tard', 'testicle',
    'thundercunt', 'tit', 'titfuck', 'tits', 'titties', 'twat', 'twatlips', 'twats', 'twatwaffle', 'vag',
    'vagina', 'vulva', 'wank', 'wankjob', 'wanker', 'wankstain', 'wetback', 'whore', 'whorebag', 'whoreface',
    'whorehouse', 'whorehopper', 'whorehound', 'whorelet', 'whoremaster', 'whoremonger', 'whorepipe',
    'whorester', 'whoreweed', 'whorey', 'wigger', 'wop', 'yid', 'zipperhead'
]

# Enhanced leet speak mapping for more comprehensive filtering
LEET_MAP = {
    # Number substitutions
    '0': 'o', '1': 'i', '2': 'z', '3': 'e', '4': 'a', '5': 's', '6': 'g', '7': 't', '8': 'b', '9': 'g',
    
    # Symbol substitutions
    '@': 'a', '$': 's', '!': 'i', '|': 'i', '+': 't', '?': 'q', '(': 'c', ')': 'c',
    '*': 'a', '%': 'o', '^': 'a', '&': 'a', '#': 'h', '~': 'n', '=': 'e',
    
    # Letter substitutions (common leet speak) - enhanced to catch more substitutions
    'q': 'g', 'x': 'k', 'z': 's', 'ph': 'f', 'ck': 'k', 'kk': 'ck',
    'vv': 'w', 'ii': 'u', 'rn': 'm', '|_|': 'u', '|-|': 'h', '|3': 'b',
    '|)': 'd', '(_)': 'u', '[]': 'o', '/\\': 'a', '\\/': 'v', '><': 'x',
    
    # Common visual substitutions and obfuscations
    'qq': 'gg',  # double q to double g
    'qg': 'gg',  # mixed q and g
    'gq': 'gg',  # mixed g and q
    'qu': 'gu',  # qu combination to gu
    'kw': 'qu',  # kw to qu
    'ks': 'x',   # ks to x
    'w': 'vv',   # w to double v
    'n': 'rn',   # n to rn (common visual trick)
    'm': 'nn',   # m to nn
}

# Additional patterns that should be normalized - enhanced for better detection
SUBSTITUTION_PATTERNS = {
    # Multi-character substitutions that need to be checked first
    'qu': 'g',     # qu -> g substitution (common way to hide 'g' words)
    'qg': 'gg',    # qg -> gg substitution
    'gq': 'gg',    # gq -> gg substitution
    'kw': 'qu',    # kw -> qu substitution
    'ks': 'x',     # ks -> x substitution
    'ph': 'f',     # ph -> f substitution
    'uff': 'ough', # uff -> ough substitution
    'vv': 'w',     # vv -> w substitution
    'rn': 'm',     # rn -> m substitution (visual trick)
    'nn': 'm',     # nn -> m substitution
    'ii': 'u',     # ii -> u substitution
    'oo': 'o',     # oo -> o (reduce double letters)
    'qq': 'g',     # qq -> g substitution
    'xx': 'x',     # xx -> x (reduce double letters)
    'zz': 's',     # zz -> s substitution
}

def levenshtein(s1, s2):
    if len(s1) < len(s2):
        return levenshtein(s2, s1)
    if len(s2) == 0:
        return len(s1)
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]

def normalize_username(value):
    """
    Normalize username by converting leet speak and other substitutions
    to detect hidden profanity and inappropriate content.
    Enhanced to better catch 'q' for 'g' substitutions and other obfuscations.
    """
    # Always treat input as string, handle None and non-string
    try:
        if value is None:
            value = ""
        value = str(value)
    except Exception:
        value = ""

    if not value:
        return ""

    # First normalize unicode
    import unicodedata
    value = unicodedata.normalize('NFKC', value)
    value = ''.join(c for c in value if not unicodedata.combining(c))
    value = value.encode('ascii', 'ignore').decode('ascii')
    value = value.lower()

    # Apply substitution patterns (multi-character replacements first)
    # Do this multiple times to catch nested patterns
    for _ in range(3):
        for pattern, replacement in SUBSTITUTION_PATTERNS.items():
            value = value.replace(pattern, replacement)
    
    # Apply leet speak transformations multiple times to catch nested substitutions
    for _ in range(4):  # Increased passes to catch more complex substitutions
        # Apply character substitutions
        for leet_char, normal_char in LEET_MAP.items():
            value = value.replace(leet_char, normal_char)
    
    # Additional specific checks for common obfuscations
    # Handle specific 'q' for 'g' patterns that might be missed
    value = value.replace('q', 'g')  # Direct q -> g replacement
    
    # Handle repetitive characters that might be used for obfuscation
    import re
    # Replace multiple consecutive identical characters with single character
    value = re.sub(r'(.)\1+', r'\1', value)
    
    return value

def validate_username_content(username):
    """
    Validate username content for inappropriate material.
    Returns (is_valid, error_message)
    """
    if not username:
        return False, "Username is required"
    
    # Basic length and character checks
    if len(username) < 3:
        return False, "Username must be at least 3 characters long"
    
    if len(username) > 20:
        return False, "Username must be 20 characters or less"
    
    # Check for allowed characters only (alphanumeric and underscore)
    import re
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return False, "Username can only contain letters, numbers, and underscores"
    
    # Normalize username to detect hidden profanity
    normalized = normalize_username(username)
    
    # Check against profanity list
    for word in PROFANITY_LIST:
        if word in normalized:
            return False, "Username contains inappropriate content"
    
    # Additional checks for common problematic patterns
    problematic_patterns = [
        'admin', 'moderator', 'mod', 'staff', 'support', 'help', 'bot', 'system',
        'root', 'null', 'undefined', 'test', 'demo', 'guest', 'anonymous', 'anon',
        'api', 'www', 'mail', 'email', 'ftp', 'http', 'https', 'ssl', 'tls'
    ]
    
    for pattern in problematic_patterns:
        if pattern in normalized:
            return False, f"Username cannot contain reserved word '{pattern}'"
    
    # Check for excessive repeating characters
    import re
    if re.search(r'(.)\1{3,}', username):  # 4 or more repeating characters
        return False, "Username cannot have more than 3 repeating characters in a row"
    
    # Check for numbers only
    if username.isdigit():
        return False, "Username cannot be numbers only"
    
    return True, ""

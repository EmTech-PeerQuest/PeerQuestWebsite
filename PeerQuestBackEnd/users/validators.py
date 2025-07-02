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

LEET_MAP = {
    '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '9': 'g',
    '@': 'a', '$': 's', '!': 'i', '|': 'i', '+': 't', '?': 'q', '(': 'c', ')': 'c',
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
    value = unicodedata.normalize('NFKC', value)
    value = ''.join(c for c in value if not unicodedata.combining(c))
    value = value.encode('ascii', 'ignore').decode('ascii')
    for _ in range(2):
        value = value.translate(str.maketrans(LEET_MAP))
    return value

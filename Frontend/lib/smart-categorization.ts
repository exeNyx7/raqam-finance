export const KEYWORD_MAP: Record<string, string> = {
    // Food & Dining
    'uber eats': 'Food',
    'doordash': 'Food',
    'grubhub': 'Food',
    'mcdonald': 'Food',
    'starbucks': 'Food',
    'coffee': 'Food',
    'burger': 'Food',
    'pizza': 'Food',
    'restaurant': 'Food',
    'cafe': 'Food',
    'bistro': 'Food',
    'grocery': 'Groceries',
    'market': 'Groceries',
    'walmart': 'Groceries',
    'target': 'Shopping',
    'whole foods': 'Groceries',
    'trader joe': 'Groceries',

    // Transport
    'uber': 'Transport',
    'lyft': 'Transport',
    'taxi': 'Transport',
    'shell': 'Transport',
    'bp ': 'Transport',
    'chevron': 'Transport',
    'exxon': 'Transport',
    'gas': 'Transport',
    'parking': 'Transport',
    'metro': 'Transport',
    'train': 'Transport',
    'bus': 'Transport',

    // Utilities
    'electric': 'Utilities',
    'water': 'Utilities',
    'gas co': 'Utilities',
    'internet': 'Utilities',
    'comcast': 'Utilities',
    'xfinity': 'Utilities',
    'verizon': 'Utilities',
    't-mobile': 'Utilities',
    'at&t': 'Utilities',

    // Entertainment
    'netflix': 'Entertainment',
    'spotify': 'Entertainment',
    'hulu': 'Entertainment',
    'disney': 'Entertainment',
    'cinema': 'Entertainment',
    'movie': 'Entertainment',
    'theatre': 'Entertainment',
    'steam': 'Entertainment',
    'playstation': 'Entertainment',
    'xbox': 'Entertainment',
    'nintendo': 'Entertainment',
    'prime video': 'Entertainment',

    // Hosting/Tech (User specific)
    'aws': 'Services',
    'google cloud': 'Services',
    'azure': 'Services',
    'vercel': 'Services',
    'digitalocean': 'Services',
    'heroku': 'Services',
    'github': 'Services',

    // Rent/Housing
    'rent': 'Housing',
    'mortgage': 'Housing',
    'apartment': 'Housing',
}

export function predictCategory(description: string, availableCategories: string[]): string {
    const desc = description.toLowerCase()

    // Check keyword map
    for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
        if (desc.includes(keyword)) {
            // Verify category exists in user's available categories
            // If strict matching is needed. For now, we return the map's category 
            // and fallback to first available or 'Uncategorized' if strictly enforced.
            // But usually we want to suggest it even if not in list (it might add it? No, backend validation).
            // So checking against available is good.
            const match = availableCategories.find(c => c.toLowerCase() === category.toLowerCase())
            if (match) return match
        }
    }

    return "Uncategorized"
}

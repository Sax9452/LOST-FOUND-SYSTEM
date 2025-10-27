const { pool } = require('../config/database');

/**
 * Find potential matches for a given item
 * @desc Find items of opposite type that match based on category, date range, location, and text similarity
 * @param {Object} item - The item to find matches for
 * @param {number} item.id - Item ID
 * @param {string} item.type - Item type ('lost' or 'found')
 * @param {string} item.name - Item name
 * @param {string} item.description - Item description
 * @param {string} item.category - Item category
 * @param {string} item.date - Date when item was lost/found
 * @param {string} item.location - Location where item was lost/found
 * @returns {Promise<Array<Object>>} Array of matching items with scores (0-18)
 * @throws {Error} If database query fails
 * 
 * @example
 * const matches = await findMatches({
 *   id: 1,
 *   type: 'lost',
 *   name: 'iPhone 13',
 *   description: 'Black iPhone 13 Pro',
 *   category: 'electronics',
 *   date: '2024-01-15',
 *   location: 'Library'
 * });
 */
exports.findMatches = async (item) => {
  try {
    // Opposite type (if lost, find found items and vice versa)
    const oppositeType = item.type === 'lost' ? 'found' : 'lost';

    // Date range (within 30 days)
    const dateStart = new Date(item.date);
    dateStart.setDate(dateStart.getDate() - 30);
    const dateEnd = new Date(item.date);
    dateEnd.setDate(dateEnd.getDate() + 30);

    // Build query to find potential matches
    const query = `
      SELECT i.*, 
             u.id as owner_id,
             u.username as owner_username,
             u.email as owner_email,
             u.phone as owner_phone
      FROM items i
      JOIN users u ON i.owner_id = u.id
      WHERE i.id != $1
        AND i.type = $2
        AND i.status = 'active'
        AND i.category = $3
        AND i.date BETWEEN $4 AND $5
      ORDER BY i.created_at DESC
      LIMIT 20
    `;

    const result = await pool.query(query, [
      item.id,
      oppositeType,
      item.category,
      dateStart.toISOString().split('T')[0],
      dateEnd.toISOString().split('T')[0]
    ]);

    let matches = result.rows;

    // Score matches based on similarity
    matches = matches.map(match => {
      let score = 0;

      // Text similarity (name + description)
      const itemText = `${item.name} ${item.description}`.toLowerCase();
      const matchText = `${match.name} ${match.description}`.toLowerCase();
      const similarity = calculateTextSimilarity(itemText, matchText);
      score += Math.floor(similarity * 10); // 0-10 points

      // Bonus for same location (case-insensitive)
      if (item.location && match.location &&
          item.location.toLowerCase() === match.location.toLowerCase()) {
        score += 5;
      } else if (item.location && match.location &&
          item.location.toLowerCase().includes(match.location.toLowerCase())) {
        score += 3; // Partial location match
      }

      // Bonus for date proximity
      const daysDiff = Math.abs(
        (new Date(item.date) - new Date(match.date)) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff <= 7) {
        score += 3;
      } else if (daysDiff <= 14) {
        score += 2;
      } else if (daysDiff <= 21) {
        score += 1;
      }

      // Transform owner data to object
      return {
        id: match.id,
        type: match.type,
        name: match.name,
        description: match.description,
        category: match.category,
        date: match.date,
        location: match.location,
        images: match.images,
        status: match.status,
        created_at: match.created_at,
        owner: {
          id: match.owner_id,
          username: match.owner_username,
          email: match.owner_email,
          phone: match.owner_phone
        },
        matchScore: score
      };
    });

    // Filter matches with score > 0 and sort by score
    matches = matches
      .filter(match => match.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10); // Return top 10 matches

    return matches;
  } catch (error) {
    console.error('Error finding matches:', error);
    return [];
  }
};

/**
 * Calculate text similarity between two strings using Jaccard similarity
 * Enhanced to handle spacing differences (e.g., "iPhone13Pro" vs "iPhone 13 Pro")
 */
function calculateTextSimilarity(str1, str2) {
  // Normalize: lowercase, remove extra spaces
  const normalize = (str) => str.toLowerCase().trim().replace(/\s+/g, ' ');
  
  const normalized1 = normalize(str1);
  const normalized2 = normalize(str2);
  
  // Method 1: Word-based similarity (original)
  const words1 = normalized1.split(/\s+/).filter(w => w.length > 2);
  const words2 = normalized2.split(/\s+/).filter(w => w.length > 2);

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  let intersection = 0;
  set1.forEach(word => {
    if (set2.has(word)) {
      intersection++;
    }
  });

  const wordSimilarity = set1.size + set2.size - intersection > 0 
    ? intersection / (set1.size + set2.size - intersection) 
    : 0;

  // Method 2: Character-based similarity (no spaces)
  // "iPhone 13 Pro" -> "iphone13pro"
  const noSpace1 = normalized1.replace(/\s+/g, '');
  const noSpace2 = normalized2.replace(/\s+/g, '');
  
  // Calculate character similarity using longest common subsequence
  const charSimilarity = calculateCharacterSimilarity(noSpace1, noSpace2);
  
  // Combine both methods (70% word-based, 30% character-based)
  return wordSimilarity * 0.7 + charSimilarity * 0.3;
}

/**
 * Calculate character-level similarity (simple approach)
 */
function calculateCharacterSimilarity(str1, str2) {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0;
  
  // Use simple character overlap
  const chars1 = new Set(str1.split(''));
  const chars2 = new Set(str2.split(''));
  
  let intersection = 0;
  chars1.forEach(char => {
    if (chars2.has(char)) {
      intersection++;
    }
  });
  
  const union = chars1.size + chars2.size - intersection;
  
  // Also check if one string contains the other
  const containmentBonus = str1.includes(str2) || str2.includes(str1) ? 0.2 : 0;
  
  return (union > 0 ? intersection / union : 0) + containmentBonus;
}



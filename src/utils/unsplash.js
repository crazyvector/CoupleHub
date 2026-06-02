const UNSPLASH_ACCESS_KEY = 'zJz_Ipu9ttJ9EI3QbUMub-XJHWvLb7f-cMeHkLCbKW0';

export async function fetchInteriorIdeas(category, page = 1, extraKeywords = "") {
  try {
    const query = `${category} interior decor ${extraKeywords}`.trim();
    const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=30&orientation=portrait&content_filter=high&client_id=${UNSPLASH_ACCESS_KEY}`);
    
    if (!response.ok) {
      if (response.status === 403 || response.status === 429) {
        throw new Error("RATE_LIMIT");
      }
      throw new Error(`Unsplash error: ${response.status}`);
    }

    const data = await response.json();
    
    // Map la formatul nostru intern
    return data.results.map(img => ({
      id: img.id,
      title: img.alt_description ? (img.alt_description.charAt(0).toUpperCase() + img.alt_description.slice(1)) : `Idee ${category}`,
      category: category,
      imageUrl: img.urls.regular, // url-ul pentru poză
      link: img.links.html // pentru a deschide pe unsplash dacă vrem
    }));

  } catch (error) {
    console.error("Eroare la Unsplash:", error);
    throw error; // Aruncăm eroare ca să știe componenta să treacă pe planul B (mock)
  }
}

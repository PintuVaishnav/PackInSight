import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const ecosystem = searchParams.get('ecosystem') || 'npm';
  
  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }
  
  try {
    let suggestions: Array<{ name: string; description?: string; version?: string }> = [];
    
    if (ecosystem === 'npm') {
      const response = await fetch(
        `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=10`
      );
      const data = await response.json();
      suggestions = data.objects.map((obj: any) => ({
        name: obj.package.name,
        description: obj.package.description?.substring(0, 100),
        version: obj.package.version
      }));
    } else if (ecosystem === 'python') {
      // Use PyPI JSON API for better results
      const response = await fetch(
        `https://pypi.org/pypi/${encodeURIComponent(query)}/json`
      );
      
      if (response.ok) {
        const data = await response.json();
        suggestions.push({
          name: data.info.name,
          description: data.info.summary?.substring(0, 100),
          version: data.info.version
        });
      }
      
      // Add common variations
      const variations = [
        query,
        `${query}2`,
        `${query}3`,
        `python-${query}`,
        `${query}-python`,
      ];
      
      for (const variant of variations.slice(0, 5)) {
        if (!suggestions.find(s => s.name === variant)) {
          suggestions.push({ name: variant });
        }
      }
      
      suggestions = suggestions.slice(0, 10);
    } else if (ecosystem === 'docker') {
      // Search Docker Hub
      const response = await fetch(
        `https://hub.docker.com/v2/search/repositories/?query=${encodeURIComponent(query)}&page_size=10`
      );
      
      if (response.ok) {
        const data = await response.json();
        suggestions = data.results.map((result: any) => ({
          name: result.repo_name,
          description: result.short_description?.substring(0, 100),
          version: 'latest'
        }));
      }
    }
    
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json([]);
  }
}
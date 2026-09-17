import { SerpApiClient } from '../src/lib/serpapi-client';
import { MemoryCache } from '../src/lib/cache';
import * as fs from 'fs';
import * as path from 'path';

// Load .env file
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

async function main() {
  const client = new SerpApiClient({
    apiKey: process.env.SERPAPI_API_KEY!,
    cache: new MemoryCache(),
    fixtureMode: false,
  });

  // Test with boAt Airdopes 141 official image
  const testImageUrl = 'https://m.media-amazon.com/images/I/61XQ3pZVzSL._SX679_.jpg';
  
  console.log('Testing Google Lens with real image...');
  console.log('Image URL:', testImageUrl);
  
  // Try with google_lens but with the 'url' parameter and gl/hl
  // Try google_lens with specific parameters - let's see if there's a different field
  const params = {
    engine: 'google_lens' as const,
    url: testImageUrl,
    gl: 'in',
    hl: 'en',
  };

  const result = await client.search(params);
  
  console.log('\n=== LIVE GOOGLE LENS RESPONSE ===');
  console.log('Status:', result.search_metadata?.status);
  console.log('Time:', result.search_metadata?.total_time_taken);
  console.log('Error:', result.error);
  console.log('Full response keys:', Object.keys(result));
  console.log('search_information:', JSON.stringify(result.search_information, null, 2));
  console.log('Full response length:', JSON.stringify(result).length);
  
  // Check raw HTML for visual matches
  if (result.search_metadata?.raw_html_file) {
    console.log('\nRaw HTML file available at:', result.search_metadata.raw_html_file);
    
    // Fetch and inspect raw HTML
    console.log('\nFetching raw HTML...');
    const htmlResponse = await fetch(result.search_metadata.raw_html_file);
    const html = await htmlResponse.text();
    console.log('HTML length:', html.length);
    
    // Search for visual match indicators in HTML
    if (html.includes('visual match') || html.includes('Visual match') || html.includes('exact match') || html.includes('Exact match')) {
      console.log('Found visual/exact match text in HTML!');
    } else {
      console.log('No visual/exact match text found in HTML');
    }
    
    // Look for image results in HTML
    const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
    if (imgMatches) {
      console.log('Image tags found:', imgMatches.length);
      imgMatches.slice(0, 5).forEach(m => console.log('  ', m.substring(0, 200)));
    }
  }
  
  if (result.lens_results) {
    console.log('\n--- Lens Results ---');
    console.log('exact_matches count:', result.lens_results.exact_matches?.length ?? 0);
    console.log('visual_matches count:', result.lens_results.visual_matches?.length ?? 0);
    console.log('text_results count:', result.lens_results.text_results?.length ?? 0);
    console.log('knowledge_graph:', result.lens_results.knowledge_graph ? 'present' : 'absent');
    
    if (result.lens_results.exact_matches?.length) {
      console.log('\nExact Matches:');
      result.lens_results.exact_matches.forEach((m, i) => {
        console.log(`  ${i+1}. source: ${m.source}, title: ${m.title}, link: ${m.link}`);
      });
    }
    
    if (result.lens_results.visual_matches?.length) {
      console.log('\nVisual Matches:');
      result.lens_results.visual_matches.forEach((m, i) => {
        console.log(`  ${i+1}. source: ${m.source}, title: ${m.title}, link: ${m.link}`);
      });
    }
    
    if (result.lens_results.text_results?.length) {
      console.log('\nText Results:');
      result.lens_results.text_results.forEach((m, i) => {
        console.log(`  ${i+1}. text: ${m.text}, source: ${m.source}, link: ${m.link}`);
      });
    }
    
    if (result.lens_results.knowledge_graph) {
      console.log('\nKnowledge Graph:');
      console.log('  title:', result.lens_results.knowledge_graph.title);
      console.log('  description:', result.lens_results.knowledge_graph.description);
      console.log('  image_url:', result.lens_results.knowledge_graph.image_url);
    }
  } else {
    console.log('No lens_results in response');
  }
  
  console.log('\nCredits used:', client.getCreditUsage());
}

main().catch(console.error);
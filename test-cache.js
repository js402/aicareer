#!/usr/bin/env node

/**
 * Simple test script to verify CV caching functionality
 * This simulates the API calls that would be made by the frontend
 */

const testCVContent = `
John Doe
Senior Software Engineer

EXPERIENCE:
- 5 years of full-stack development
- Expert in React, Node.js, TypeScript
- Led team of 4 developers

SKILLS:
- JavaScript/TypeScript
- React, Next.js
- Node.js, Express
- PostgreSQL, MongoDB
`;

async function testCache() {
    const baseUrl = 'http://localhost:3000';

    console.log('🧪 Testing CV Cache Functionality\n');

    // Note: This test requires a valid user ID from Supabase
    // In a real scenario, you'd get this from authentication
    const mockUserId = '00000000-0000-0000-0000-000000000000';

    console.log('📝 Test 1: First analysis (should be cache MISS)');
    try {
        const response1 = await fetch(`${baseUrl}/api/analyze-cv`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cvContent: testCVContent,
                userId: mockUserId
            })
        });

        const result1 = await response1.json();

        if (response1.ok) {
            console.log('✅ First request successful');
            console.log(`   - From cache: ${result1.fromCache}`);
            console.log(`   - Analysis length: ${result1.analysis?.length || 0} chars`);

            if (result1.fromCache) {
                console.log('⚠️  WARNING: First request returned cached result (unexpected)');
            }
        } else {
            console.log('❌ First request failed:', result1.error);
            console.log('   Details:', result1.details);
        }
    } catch (error) {
        console.log('❌ First request error:', error.message);
    }

    console.log('\n📝 Test 2: Second analysis (should be cache HIT)');
    try {
        const response2 = await fetch(`${baseUrl}/api/analyze-cv`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cvContent: testCVContent,
                userId: mockUserId
            })
        });

        const result2 = await response2.json();

        if (response2.ok) {
            console.log('✅ Second request successful');
            console.log(`   - From cache: ${result2.fromCache}`);
            console.log(`   - Cached at: ${result2.cachedAt || 'N/A'}`);

            if (!result2.fromCache) {
                console.log('⚠️  WARNING: Second request did NOT use cache (unexpected)');
            } else {
                console.log('🎉 Cache is working correctly!');
            }
        } else {
            console.log('❌ Second request failed:', result2.error);
        }
    } catch (error) {
        console.log('❌ Second request error:', error.message);
    }

    console.log('\n✨ Test complete\n');
}

testCache();

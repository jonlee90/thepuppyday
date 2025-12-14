/**
 * Test script to verify services API endpoints
 * Run with: node scripts/test-services-api.mjs
 *
 * Prerequisites: Development server must be running (npm run dev)
 */

const BASE_URL = 'http://localhost:3000';

async function testServicesAPI() {
  console.log('Testing Services API endpoints...\n');
  console.log('Base URL:', BASE_URL);
  console.log('Make sure development server is running!\n');

  try {
    // Test 1: GET /api/admin/services (List all services)
    console.log('1. Testing GET /api/admin/services');
    const listResponse = await fetch(`${BASE_URL}/api/admin/services`, {
      credentials: 'include',
    });

    console.log('   Status:', listResponse.status, listResponse.statusText);

    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log('   SUCCESS: Found', listData.services?.length || 0, 'services');
      if (listData.services && listData.services.length > 0) {
        const firstService = listData.services[0];
        console.log('   First service:', {
          id: firstService.id,
          name: firstService.name,
          pricesCount: firstService.prices?.length || 0
        });
      }
    } else {
      const errorData = await listResponse.json();
      console.log('   ERROR:', errorData);
    }

    // Test 2: POST /api/admin/services (Create new service)
    console.log('\n2. Testing POST /api/admin/services');
    const createPayload = {
      name: 'API Test Service',
      description: 'Created via API test script',
      duration_minutes: 90,
      image_url: 'https://example.com/test-image.jpg',
      is_active: true,
      prices: {
        small: 45.00,
        medium: 60.00,
        large: 75.00,
        xlarge: 90.00
      }
    };

    const createResponse = await fetch(`${BASE_URL}/api/admin/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(createPayload),
    });

    console.log('   Status:', createResponse.status, createResponse.statusText);

    let createdServiceId = null;
    if (createResponse.ok) {
      const createData = await createResponse.json();
      createdServiceId = createData.service?.id;
      console.log('   SUCCESS: Created service with ID:', createdServiceId);
      console.log('   Service:', {
        name: createData.service?.name,
        pricesCount: createData.service?.prices?.length || 0
      });
    } else {
      const errorData = await createResponse.json();
      console.log('   ERROR:', errorData);
    }

    if (createdServiceId) {
      // Test 3: GET /api/admin/services/[id] (Get single service)
      console.log('\n3. Testing GET /api/admin/services/' + createdServiceId);
      const getResponse = await fetch(`${BASE_URL}/api/admin/services/${createdServiceId}`, {
        credentials: 'include',
      });

      console.log('   Status:', getResponse.status, getResponse.statusText);

      if (getResponse.ok) {
        const getData = await getResponse.json();
        console.log('   SUCCESS: Retrieved service');
        console.log('   Service:', {
          name: getData.service?.name,
          image_url: getData.service?.image_url,
          pricesCount: getData.service?.prices?.length || 0
        });
      } else {
        const errorData = await getResponse.json();
        console.log('   ERROR:', errorData);
      }

      // Test 4: PATCH /api/admin/services/[id] (Update service)
      console.log('\n4. Testing PATCH /api/admin/services/' + createdServiceId);
      const updatePayload = {
        name: 'Updated API Test Service',
        description: 'Updated via API test',
        image_url: 'https://example.com/updated-image.jpg',
        prices: {
          small: 50.00,
          medium: 65.00,
          large: 80.00,
          xlarge: 95.00
        }
      };

      const updateResponse = await fetch(`${BASE_URL}/api/admin/services/${createdServiceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatePayload),
      });

      console.log('   Status:', updateResponse.status, updateResponse.statusText);

      if (updateResponse.ok) {
        const updateData = await updateResponse.json();
        console.log('   SUCCESS: Updated service');
        console.log('   Service:', {
          name: updateData.service?.name,
          image_url: updateData.service?.image_url,
          pricesCount: updateData.service?.prices?.length || 0
        });

        // Verify prices were updated
        const smallPrice = updateData.service?.prices?.find(p => p.size === 'small');
        console.log('   Small price:', smallPrice?.price, '(expected: 50.00)');
      } else {
        const errorData = await updateResponse.json();
        console.log('   ERROR:', errorData);
      }

      // Test 5: DELETE /api/admin/services/[id]
      console.log('\n5. Testing DELETE /api/admin/services/' + createdServiceId);
      const deleteResponse = await fetch(`${BASE_URL}/api/admin/services/${createdServiceId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      console.log('   Status:', deleteResponse.status, deleteResponse.statusText);

      if (deleteResponse.ok) {
        const deleteData = await deleteResponse.json();
        console.log('   SUCCESS: Deleted service');
      } else {
        const errorData = await deleteResponse.json();
        console.log('   ERROR:', errorData);
      }

      // Test 6: Verify deletion
      console.log('\n6. Verifying deletion');
      const verifyResponse = await fetch(`${BASE_URL}/api/admin/services/${createdServiceId}`, {
        credentials: 'include',
      });

      console.log('   Status:', verifyResponse.status, verifyResponse.statusText);
      if (verifyResponse.status === 404) {
        console.log('   SUCCESS: Service no longer exists');
      } else {
        console.log('   WARNING: Service may still exist');
      }
    }

    console.log('\n=== ALL TESTS COMPLETED ===\n');

  } catch (error) {
    console.error('Error running tests:', error.message);
    console.error('\nMake sure the development server is running (npm run dev)');
  }
}

testServicesAPI();

// Script to test concurrency of atomic booking function
console.log('🧪 Testing atomic booking concurrency...');

// This is a conceptual test script that would be run against the actual database
console.log('\n📋 Concurrency Test Plan:');
console.log('======================');

console.log('\n1. Create a test car in the database');
console.log('   INSERT INTO cars (id, title, make, model, year, seats, fuel_type, transmission, price_per_day, status, booking_status)');
console.log('   VALUES (\'test-car-1\', \'Test Car\', \'Toyota\', \'Camry\', 2023, 5, \'petrol\', \'automatic\', 2500, \'published\', \'available\');');

console.log('\n2. Run concurrent booking attempts');
console.log('   Simultaneously call book_car_atomic(\'test-car-1\') from multiple connections');

console.log('\n3. Expected Results:');
console.log('   • One call should succeed with {"success": true}');
console.log('   • All other calls should fail with {"success": false, "message": "Car is already booked"}');

console.log('\n4. Verification SQL:');
console.log('   SELECT id, title, booking_status, booked_by, booked_at FROM cars WHERE id = \'test-car-1\';');
console.log('   SELECT action, description, user_id, metadata FROM audit_logs WHERE action = \'car_booked\' ORDER BY timestamp DESC LIMIT 5;');

console.log('\n✅ Concurrency test plan created');
console.log('Implement this test with actual database connections to verify atomicity');
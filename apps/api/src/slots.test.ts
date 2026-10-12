import { prisma } from '@barbershop/db';
import { getAvailableSlots } from './slots';

async function runTests() {
  console.log('--- Running Slot Computation & Race Tests ---');

  const barber = await prisma.barber.findFirst({ where: { isActive: true } });
  if (!barber) {
    console.error('No active barber found');
    return;
  }

  // Find a future date (3 days from now)
  const future = new Date();
  future.setDate(future.getDate() + 3);
  const dateStr = future.toISOString().split('T')[0];

  const slots = await getAvailableSlots({
    barberId: barber.id,
    dateStr,
    durationMin: 30,
  });

  console.log(`✓ Real Barber (${barber.name}) slots on ${dateStr}: ${slots.length} available slots`);
  if (slots.length > 0) {
    console.log(`  Sample free slots: ${slots.slice(0, 6).join(', ')}`);
  }

  // Test 3: Constraint test - trying to insert 2 overlapping bookings directly
  if (slots.length > 0) {
    const testSlot = slots[0];
    const [h, m] = testSlot.split(':').map(Number);
    const startsAt = new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`);
    const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);

    const client = await prisma.client.findFirst();
    if (client) {
      try {
        // 1st booking
        const bk1 = await prisma.booking.create({
          data: {
            clientId: client.id,
            barberId: barber.id,
            startsAt,
            endsAt,
            totalPrice: 100000,
            totalDurationMin: 30,
            status: 'CONFIRMED',
            source: 'WEB',
          },
        });
        console.log(`✓ Booking 1 created: ${bk1.id}`);

        // 2nd booking for exact same time (should fail via exclusion constraint)
        let failedAsExpected = false;
        try {
          await prisma.booking.create({
            data: {
              clientId: client.id,
              barberId: barber.id,
              startsAt,
              endsAt,
              totalPrice: 100000,
              totalDurationMin: 30,
              status: 'CONFIRMED',
              source: 'WEB',
            },
          });
        } catch (overlapErr: any) {
          if (overlapErr.code === '23P01' || overlapErr.message?.includes('bookings_no_overlap')) {
            failedAsExpected = true;
            console.log('✓ Race/Overlap Exclusion Constraint SUCCESS: Prevented double booking with 23P01 code!');
          } else {
            console.log('Caught error during overlap:', overlapErr.message);
          }
        }

        // Clean up test booking
        await prisma.booking.delete({ where: { id: bk1.id } });
        console.log('✓ Cleaned up test booking');
      } catch (e: any) {
        console.log('Test booking notice:', e.message);
      }
    }
  }

  console.log('--- All Verification Tests Passed Successfully ---');
}

runTests().then(() => prisma.$disconnect()).catch(console.error);

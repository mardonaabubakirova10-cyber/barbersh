import { prisma } from './index';

async function applyExclusionConstraint() {
  console.log('Applying btree_gist and exclusion constraint...');
  try {
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS btree_gist;`);
    console.log('✓ Extension btree_gist ready');

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'bookings_no_overlap'
        ) THEN
          ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap 
          EXCLUDE USING gist (
            barber_id WITH =,
            tsrange(starts_at, ends_at) WITH &&
          ) WHERE (status != 'CANCELLED');
        END IF;
      END $$;
    `);
    console.log('✓ bookings_no_overlap constraint ready');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

applyExclusionConstraint();

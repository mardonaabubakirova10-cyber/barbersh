import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем наполнение базы данных начальными данными...');

  // 1. Очистка таблиц (для идемпотентности)
  await prisma.review.deleteMany();
  await prisma.bookingService.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.break.deleteMany();
  await prisma.workingHours.deleteMany();
  await prisma.timeOff.deleteMany();
  await prisma.barberService.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.service.deleteMany();
  await prisma.barber.deleteMany();
  await prisma.client.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.adminUser.deleteMany();

  // 2. Услуги
  const servicesData = [
    {
      id: 'srv-1',
      name: 'Мужская стрижка',
      category: 'Стрижки',
      description: 'Мытьё головы премиальным шампунем, индивидуальный подбор стрижки, укладка стайлингом.',
      price: 150000,
      durationMin: 45,
      sortOrder: 1,
    },
    {
      id: 'srv-2',
      name: 'Стрижка бороды и усов',
      category: 'Борода',
      description: 'Моделирование формы опасной бритвой / шейвером, распаривание горячим полотенцем, уход маслом.',
      price: 100000,
      durationMin: 35,
      sortOrder: 2,
    },
    {
      id: 'srv-3',
      name: 'Комплекс «Стрижка + Борода»',
      category: 'Комплексы',
      description: 'Полный комплекс преображения: стрижка волос, оформление бороды, скрабирование и укладка.',
      price: 220000,
      durationMin: 70,
      sortOrder: 3,
    },
    {
      id: 'srv-4',
      name: 'Королевское бритьё',
      category: 'Бритьё',
      description: 'Традиционное ритуальное бритьё опасной бритвой с распариванием эфирными маслами.',
      price: 120000,
      durationMin: 40,
      sortOrder: 4,
    },
    {
      id: 'srv-5',
      name: 'Детская стрижка (до 12 лет)',
      category: 'Стрижки',
      description: 'Бережная и стильная стрижка для юных джентльменов.',
      price: 110000,
      durationMin: 35,
      sortOrder: 5,
    },
    {
      id: 'srv-6',
      name: 'Камуфляж седины',
      category: 'Уход',
      description: 'Естественное тонирование седины без эффекта окрашенных волос.',
      price: 110000,
      durationMin: 30,
      sortOrder: 6,
    }
  ];

  for (const s of servicesData) {
    await prisma.service.create({ data: s });
  }
  console.log(`✓ Создано ${servicesData.length} услуг.`);

  // 3. Барберы
  const barbersData = [
    {
      id: 'brb-1',
      name: 'Алексей «Blade» Громов',
      role: 'Top Barber & Основатель',
      bio: '10 лет в барберинге. Обучался в Лондоне. Виртуоз классического фейда.',
      experienceYears: 10,
      photoUrl: '/barber_alexey_1791204366235.jpg',
      sortOrder: 1,
    },
    {
      id: 'brb-2',
      name: 'Дмитрий Соколов',
      role: 'Senior Barber',
      bio: 'Специалист по удлинённым мужским стрижкам, гранжу и классике.',
      experienceYears: 6,
      photoUrl: '/barber_blond.jpg',
      sortOrder: 2,
    },
    {
      id: 'brb-3',
      name: 'Кенджи «Razor» Ли',
      role: 'Pro Barber & Стилист',
      bio: 'Мастер безупречных геометрических срезов и современных текстур.',
      experienceYears: 5,
      photoUrl: '/barber_brunet.jpg',
      sortOrder: 3,
    }
  ];

  for (const b of barbersData) {
    const createdBarber = await prisma.barber.create({ data: b });

    // Связываем барбера со всеми услугами
    for (const s of servicesData) {
      await prisma.barberService.create({
        data: {
          barberId: createdBarber.id,
          serviceId: s.id,
          isEnabled: true,
        }
      });
    }

    // Добавляем график работы Пн-Вс с 10:00 до 21:00
    for (let weekday = 0; weekday <= 6; weekday++) {
      await prisma.workingHours.create({
        data: {
          barberId: createdBarber.id,
          weekday,
          startTime: '10:00',
          endTime: '21:00',
        }
      });
      // Перерыв 14:00 - 15:00
      await prisma.break.create({
        data: {
          barberId: createdBarber.id,
          weekday,
          startTime: '14:00',
          endTime: '15:00',
        }
      });
    }
  }
  console.log(`✓ Создано ${barbersData.length} барберов с графиком работы и услугами.`);

  // 4. Настройки барбершопа
  const settingsData = [
    { key: 'shop_name', value: 'Brutal & Blade' },
    { key: 'phone', value: '+998 90 123 45 67' },
    { key: 'address', value: 'г. Ташкент, ул. Шота Руставели, 45' },
    { key: 'working_hours_str', value: 'Ежедневно: 10:00 – 21:00' },
    { key: 'slot_step_minutes', value: '30' },
    { key: 'booking_window_days', value: '14' },
    { key: 'currency', value: 'UZS' },
  ];

  for (const set of settingsData) {
    await prisma.setting.create({ data: set });
  }
  console.log(`✓ Создано ${settingsData.length} системных настроек.`);

  console.log('✅ Seed успешно завершен!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

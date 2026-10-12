import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BLACK BARBER TASHKENT — Премиальный мужской барбершоп в Ташкенте',
  description: 'Классические и трендовые мужские стрижки, моделирование бороды, королевское бритье. Премиальный сервис в центре Ташкента.',
  keywords: ['барбершоп ташкент', 'мужские стрижки ташкент', 'бритье опасной бритвой', 'оформление бороды', 'black barber'],
  openGraph: {
    title: 'BLACK BARBER TASHKENT — Премиальный мужской барбершоп',
    description: 'Культура мужского стиля и традиций бритья в Ташкенте.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        {children}
      </body>
    </html>
  );
}

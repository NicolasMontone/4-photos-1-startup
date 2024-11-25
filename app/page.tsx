import { FourPhotosOneStartup } from '@/components/four-photos-one-startup'

export const metadata = {
  title: '4 photos 1 startup',
  description: 'a game to guess the startup from 4 photos',
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 py-12">
      <FourPhotosOneStartup />
    </main>
  )
}

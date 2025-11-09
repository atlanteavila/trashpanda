import { HeaderContent } from '@/components/HeaderContent'
import { auth } from '@/lib/auth'

export async function Header() {
  const session = await auth()

  return <HeaderContent user={session?.user} />
}

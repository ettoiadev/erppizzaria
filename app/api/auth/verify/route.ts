import { NextRequest, NextResponse } from "next/server"
import { withAuth } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    return NextResponse.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.email.split("@")[0], // Placeholder, será melhorado
        role: user.role,
        phone: null
      }
    })
  })
}
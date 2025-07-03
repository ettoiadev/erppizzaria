// Rota super simples para teste
export async function GET() {
  return Response.json({ message: "GET working" })
}

export async function POST() {
  return Response.json({ message: "POST working" })
} 
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugLoginPage() {
  const [email, setEmail] = useState("admin@williamdiskpizza.com")
  const [password, setPassword] = useState("admin123")
  const [result, setResult] = useState("")
  const [loading, setLoading] = useState(false)

  const testGet = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/login", {
        method: "GET",
      })
      const data = await response.json()
      setResult(`GET Response: ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      setResult(`GET Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testPost = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })
      
      const data = await response.json()
      setResult(`POST Response (${response.status}): ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      setResult(`POST Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Debug Login API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Button onClick={testGet} disabled={loading} className="w-full">
              Test GET (Debug)
            </Button>
            <Button onClick={testPost} disabled={loading} className="w-full">
              Test POST (Login)
            </Button>
          </div>
          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
              <pre>{result}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 
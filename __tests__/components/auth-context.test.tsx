import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/auth-context'

// Mock do fetch
global.fetch = jest.fn()

// Mock do window.location
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/login' // Simula página de login para evitar checkAuth automático
  },
  writable: true
})

// Componente de teste para usar o hook
function TestComponent() {
  const { user, loading, login, logout } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Garantir que estamos em página de login
    Object.defineProperty(window, 'location', {
      value: { pathname: '/login' },
      writable: true
    })
  })

  it('should provide auth context', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
    })

    // Aguardar o estado inicial ser definido
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })
    
    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
  })

  it('should handle successful login', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'customer'
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        user: mockUser,
        accessToken: 'token',
        expiresIn: 900
      })
    })

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
    })

    const loginButton = screen.getByText('Login')
    
    await act(async () => {
      loginButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
    })
  })

  it('should handle logout', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    })

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
    })

    const logoutButton = screen.getByText('Logout')
    
    await act(async () => {
      logoutButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    })
  })
})
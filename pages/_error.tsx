import { NextPageContext } from 'next'
import { NextResponse } from 'next/server'

interface ErrorProps {
  statusCode?: number
  hasGetInitialPropsRun?: boolean
  err?: Error
}

function Error({ statusCode, hasGetInitialPropsRun, err }: ErrorProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">
              {statusCode || 'Erro'}
            </h1>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              {statusCode === 404
                ? 'Página não encontrada'
                : statusCode === 500
                ? 'Erro interno do servidor'
                : 'Ocorreu um erro inesperado'}
            </h2>
            <p className="text-gray-600 mb-8">
              {statusCode === 404
                ? 'A página que você está procurando não existe.'
                : 'Desculpe, algo deu errado. Tente novamente mais tarde.'}
            </p>
            <div className="space-y-4">
              <button
                onClick={() => window.history.back()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Voltar
              </button>
              <a
                href="/"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Ir para a página inicial
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error
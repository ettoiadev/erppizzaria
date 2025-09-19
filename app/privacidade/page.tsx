import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Política de Privacidade</h1>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Informações que Coletamos</h2>
              <p className="text-gray-600 leading-relaxed">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
                dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
                ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
                fugiat nulla pariatur.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Informações pessoais fornecidas voluntariamente</li>
                <li>Dados de navegação e uso do serviço</li>
                <li>Informações de localização para entrega</li>
                <li>Dados de pagamento e transações</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Como Utilizamos suas Informações</h2>
              <p className="text-gray-600 leading-relaxed">
                Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est
                laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque
                laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae
                vitae dicta sunt explicabo.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni
                dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia
                dolor sit amet.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">3. Compartilhamento de Informações</h2>
              <p className="text-gray-600 leading-relaxed">
                Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut
                aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse
                quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 font-medium mb-2">
                  Não compartilhamos suas informações pessoais com terceiros, exceto:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                  <li>Quando necessário para processar pedidos</li>
                  <li>Para cumprir obrigações legais</li>
                  <li>Com seu consentimento explícito</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Segurança dos Dados</h2>
              <p className="text-gray-600 leading-relaxed">
                Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
                placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem
                quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae
                sint et molestiae non recusandae.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">5. Cookies e Tecnologias Similares</h2>
              <p className="text-gray-600 leading-relaxed">
                Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias
                consequatur aut perferendis doloribus asperiores repellat. Et harum quidem rerum facilis est et expedita
                distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <p className="text-blue-800">
                  <strong>Importante:</strong> Utilizamos cookies essenciais para o funcionamento do site e cookies
                  analíticos para melhorar sua experiência. Você pode gerenciar suas preferências de cookies a qualquer
                  momento.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">6. Seus Direitos</h2>
              <p className="text-gray-600 leading-relaxed">
                Facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et
                aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
                molestiae non recusandae. Você tem os seguintes direitos em relação aos seus dados pessoais:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Direito de acesso aos seus dados</li>
                <li>Direito de retificação de informações incorretas</li>
                <li>Direito de exclusão de dados</li>
                <li>Direito de portabilidade dos dados</li>
                <li>Direito de oposição ao processamento</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">7. Retenção de Dados</h2>
              <p className="text-gray-600 leading-relaxed">
                Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir as finalidades descritas
                nesta política, ou conforme exigido por lei. Quando os dados não forem mais necessários, eles serão
                excluídos ou anonimizados de forma segura.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">8. Alterações nesta Política</h2>
              <p className="text-gray-600 leading-relaxed">
                Podemos atualizar esta Política de Privacidade periodicamente. Quando fizermos alterações
                significativas, notificaremos você por email ou através de um aviso em nosso site. Recomendamos que você
                revise esta política regularmente para se manter informado sobre como protegemos suas informações.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">9. Contato</h2>
              <p className="text-gray-600 leading-relaxed">
                Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos seus dados pessoais,
                entre em contato conosco:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> <span className="text-primary">privacidade@pizzaexpress.com</span>
                </p>
                <p className="text-gray-700">
                  <strong>Telefone:</strong> <span className="text-primary">(11) 99999-9999</span>
                </p>
                <p className="text-gray-700">
                  <strong>Endereço:</strong> Rua das Pizzas, 123 - Centro, São Paulo/SP
                </p>
              </div>
            </section>

            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-500">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

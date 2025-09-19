import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Termos de Uso</h1>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Aceitação dos Termos</h2>
              <p className="text-gray-600 leading-relaxed">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
                dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
                ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
                fugiat nulla pariatur.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Uso do Serviço</h2>
              <p className="text-gray-600 leading-relaxed">
                Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est
                laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque
                laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae
                vitae dicta sunt explicabo.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni
                dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia
                dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore
                et dolore magnam aliquam quaerat voluptatem.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">3. Responsabilidades do Usuário</h2>
              <p className="text-gray-600 leading-relaxed">
                Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut
                aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse
                quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>At vero eos et accusamus et iusto odio dignissimos ducimus</li>
                <li>Qui blanditiis praesentium voluptatum deleniti atque corrupti</li>
                <li>Quos dolores et quas molestias excepturi sint occaecati</li>
                <li>Cupiditate non provident, similique sunt in culpa</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Política de Pedidos e Pagamentos</h2>
              <p className="text-gray-600 leading-relaxed">
                Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime
                placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem
                quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae
                sint et molestiae non recusandae.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">5. Limitação de Responsabilidade</h2>
              <p className="text-gray-600 leading-relaxed">
                Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias
                consequatur aut perferendis doloribus asperiores repellat. Et harum quidem rerum facilis est et expedita
                distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id
                quod maxime placeat.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">6. Modificações dos Termos</h2>
              <p className="text-gray-600 leading-relaxed">
                Facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et
                aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
                molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">7. Contato</h2>
              <p className="text-gray-600 leading-relaxed">
                Para dúvidas sobre estes Termos de Uso, entre em contato conosco através do email:
                <span className="font-medium text-primary"> contato@pizzaexpress.com</span> ou pelo telefone
                <span className="font-medium text-primary"> (11) 99999-9999</span>.
              </p>
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

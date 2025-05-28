export default function Dashboard() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Bem-vindo ao painel principal</p>
      </div>

      {/* Conteúdo do dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{/* Cards do dashboard aqui */}</div>
    </div>
  )
}

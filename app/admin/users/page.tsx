import { Button, Card, CardContent, Typography } from "@mui/material"
import Link from "next/link"

const UsersPage = () => {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <Typography variant="h4" component="h1">
          Gerenciar Usuários
        </Typography>
        <Link href="/admin/users/new" passHref>
          <Button variant="contained" color="primary">
            Novo Usuário
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            Usuários do Sistema
          </Typography>
          {/* Implement user list here */}
          <Typography variant="body1">
            Lista de usuários do sistema aqui. (Implementar a lógica para buscar e exibir os usuários)
          </Typography>
        </CardContent>
      </Card>
    </div>
  )
}

export default UsersPage

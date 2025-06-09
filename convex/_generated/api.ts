// Mock API para compatibilidade
export const api = {
  agents: {
    createAgent: "agents:createAgent",
    updateAgent: "agents:updateAgent",
    deleteAgent: "agents:deleteAgent",
    getAgents: "agents:getAgents",
    getAgent: "agents:getAgent",
  },
  users: {
    getUsers: "users:getUsers",
    getUser: "users:getUser",
    updateUser: "users:updateUser",
  },
  whatsapp: {
    getConnections: "whatsapp:getConnections",
    createConnection: "whatsapp:createConnection",
    updateConnection: "whatsapp:updateConnection",
  },
}

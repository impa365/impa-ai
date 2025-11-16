"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/dashboard"
import { WebhooksManager } from "@/components/webhooks-manager"
import { TriggersBuilder } from "@/components/triggers-builder"
import { ExecutionLogs } from "@/components/execution-logs"
import { Integration } from "@/components/integration"

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard")

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-auto">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "webhooks" && <WebhooksManager />}
        {activeTab === "triggers" && <TriggersBuilder />}
        {activeTab === "logs" && <ExecutionLogs />}
        {activeTab === "integration" && <Integration />}
      </main>
    </div>
  )
}

"use client"

import { Palette, BarChart3 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

const SettingsPage = () => {
  const [open, setOpen] = useState(false)

  return (
    <div className="container relative">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage your store settings.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Palette className="mr-2 h-4 w-4" />
                Custom Theme
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Custom Theme</DialogTitle>
                <DialogDescription>Make changes to your theme here. Click save when you're done.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input id="name" value="shadcn" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="username" className="text-right">
                    Username
                  </Label>
                  <Input id="username" value="@shadcn" className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button>
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
        </div>
      </div>
      <div className="grid gap-6">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Profile</h3>
          <p className="text-sm text-muted-foreground">This is your public profile.</p>
        </div>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value="shadcn" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input id="username" value="@shadcn" className="col-span-3" />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold tracking-tight">Email</h3>
          <p className="text-sm text-muted-foreground">This is your email address.</p>
        </div>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input id="email" value="shadcn@example.com" className="col-span-3" type="email" />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold tracking-tight">Bio</h3>
          <p className="text-sm text-muted-foreground">Write a short bio about yourself.</p>
        </div>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bio" className="text-right">
              Bio
            </Label>
            <Textarea id="bio" className="col-span-3" />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold tracking-tight">Notifications</h3>
          <p className="text-sm text-muted-foreground">Enable notifications to stay up to date.</p>
        </div>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email-notifications" className="text-right">
              Email Notifications
            </Label>
            <Switch id="email-notifications" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="push-notifications" className="text-right">
              Push Notifications
            </Label>
            <Switch id="push-notifications" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage

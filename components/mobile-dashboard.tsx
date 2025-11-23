"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { 
  Home, 
  Users, 
  FlaskConical, 
  CheckCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  Plus,
  ChevronRight
} from "lucide-react"
import { offlineDB, type Household, type Participant, type Sample } from "@/lib/offline-first-db"

export default function MobileDashboard() {
  const [households, setHouseholds] = useState<Household[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [samples, setSamples] = useState<Sample[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    try {
      if (!loading) setRefreshing(true)
      await offlineDB.init()
      
      const [householdsData, participantsData, samplesData] = await Promise.all([
        offlineDB.getAll<Household>('households'),
        offlineDB.getAll<Participant>('participants'),
        offlineDB.getAll<Sample>('samples')
      ])
      
      setHouseholds(householdsData)
      setParticipants(participantsData)
      setSamples(samplesData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const stats = [
    {
      title: "Households",
      value: households.length,
      icon: Home,
      color: "bg-blue-500",
      lightColor: "bg-blue-50 dark:bg-blue-950",
      textColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Participants",
      value: participants.length,
      icon: Users,
      color: "bg-green-500",
      lightColor: "bg-green-50 dark:bg-green-950",
      textColor: "text-green-600 dark:text-green-400"
    },
    {
      title: "Samples",
      value: samples.length,
      icon: FlaskConical,
      color: "bg-purple-500",
      lightColor: "bg-purple-50 dark:bg-purple-950",
      textColor: "text-purple-600 dark:text-purple-400"
    }
  ]

  const quickActions = [
    { label: "Register Household", icon: Home, path: "households" },
    { label: "Add Participant", icon: Users, path: "participants" },
    { label: "Collect Sample", icon: FlaskConical, path: "samples" }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 pb-24">
      <div className="space-y-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Dashboard</h2>
            <p className="text-sm text-muted-foreground">Field Data Collection</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData()}
            disabled={refreshing}
            className="gap-2 rounded-full"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

      {/* Stats Cards - Mobile Optimized */}
      <div className="grid grid-cols-1 gap-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`${stat.lightColor} border-0 shadow-sm`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`${stat.color} p-3 rounded-xl`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">
                          {stat.title}
                        </p>
                        <p className={`text-3xl font-bold ${stat.textColor}`}>
                          {stat.value}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card className="border-2 hover:border-primary transition-colors cursor-pointer touch-manipulation">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{action.label}</p>
                        <p className="text-xs text-muted-foreground">
                          Start collecting data
                        </p>
                      </div>
                      <Plus className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Today's Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Today's Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b last:border-0">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Data Synced</p>
                <p className="text-xs text-muted-foreground">All records up to date</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">Just now</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b last:border-0">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Collection Progress</p>
                <p className="text-xs text-muted-foreground">
                  {households.length} households recorded
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-lg">
                <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Pending Samples</p>
                <p className="text-xs text-muted-foreground">
                  {samples.filter(s => s.status === 'pending').length} awaiting processing
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {households.length === 0 && participants.length === 0 && samples.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="bg-muted/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Ready to Start</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Begin your field work by registering a household or collecting samples
          </p>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Register First Household
          </Button>
        </motion.div>
      )}
      </div>
    </div>
  )
}

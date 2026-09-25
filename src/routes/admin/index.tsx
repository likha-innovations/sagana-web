import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield } from 'lucide-react'

export const AdminPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full text-center border-dashed">
        <CardHeader className="flex flex-col items-center gap-2">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Shield className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Admin Portal</CardTitle>
          <CardDescription>
            This portal view is reserved and currently blank as specified.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded">
            Route: /admin
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

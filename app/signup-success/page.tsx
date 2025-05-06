import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

export default function SignupSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Account Created!</CardTitle>
          <CardDescription className="text-center">
            We&apos;ve sent a confirmation email to your inbox. Please check your email and follow the instructions to
            verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-gray-500">
          <p>If you don&apos;t see the email, please check your spam folder or request a new verification email.</p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Link href="/login" className="w-full">
            <Button className="w-full">Go to Login</Button>
          </Link>
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full">
              Back to Home
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

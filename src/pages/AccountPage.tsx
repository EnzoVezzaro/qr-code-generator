import React from 'react';
import { useAuth } from '../context/AuthContext'; // Assuming AuthContext provides user info
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Import Card components

const AccountPage: React.FC = () => {
  const { user } = useAuth(); // Assuming user object has email, name, and role

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-xl">Authentication Required</CardTitle>
            <CardDescription>Please log in to view your account information.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">User not logged in.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6"> {/* Use space-y for vertical spacing */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold">Account Settings</h1> {/* Larger title */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Account Information</CardTitle> {/* Card title */}
          <CardDescription>View your account details.</CardDescription> {/* Card description */}
        </CardHeader>
        <CardContent className="space-y-4"> {/* Space out content within the card */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground">Email:</label> {/* Muted foreground for labels */}
            <p className="mt-1 text-lg text-gray-900">{user.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground">Name:</label> {/* Muted foreground for labels */}
            <p className="mt-1 text-lg text-gray-900">{(user.name as string) || 'N/A'}</p> {/* Access name from user_metadata */}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground">Role:</label> {/* Muted foreground for labels */}
            <p className="mt-1 text-lg text-gray-900">{user.role || 'N/A'}</p> {/* Assuming user object might not have role */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountPage;

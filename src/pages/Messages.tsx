
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Construction } from 'lucide-react';

const Messages = () => {
  return (
    <div className="min-h-screen bg-background p-8 flex items-center justify-center">
      <Card className="max-w-md w-full border-0 shadow-lg">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
            <Construction className="w-6 h-6 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground">
            The messaging feature is currently under maintenance. Please check back later.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Messages;

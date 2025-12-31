import { Card, CardContent } from '@/components/ui/card';

const Settings = () => (
  <div className="space-y-6">
    <div>
      <h1 className="font-display text-3xl font-bold">Site Settings</h1>
      <p className="text-muted-foreground">Configure your restaurant website</p>
    </div>
    <Card><CardContent className="py-12 text-center text-muted-foreground">Advanced settings coming soon. Contact info is configured in the database.</CardContent></Card>
  </div>
);

export default Settings;

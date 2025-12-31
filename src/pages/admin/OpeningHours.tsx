import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface OpeningHour {
  id: string;
  day_of_week: number;
  day_name: string;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean | null;
}

const OpeningHours = () => {
  const [hours, setHours] = useState<OpeningHour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchHours();
  }, []);

  const fetchHours = async () => {
    const { data, error } = await supabase
      .from('opening_hours')
      .select('*')
      .order('day_of_week', { ascending: true });

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch opening hours', variant: 'destructive' });
    } else {
      setHours(data || []);
    }
    setIsLoading(false);
  };

  const updateHour = (id: string, field: string, value: string | boolean) => {
    setHours(hours.map(h => h.id === id ? { ...h, [field]: value } : h));
  };

  const saveHours = async () => {
    setIsSaving(true);

    for (const hour of hours) {
      const { error } = await supabase
        .from('opening_hours')
        .update({
          open_time: hour.open_time,
          close_time: hour.close_time,
          is_closed: hour.is_closed,
        })
        .eq('id', hour.id);

      if (error) {
        toast({ title: 'Error', description: `Failed to update ${hour.day_name}`, variant: 'destructive' });
        setIsSaving(false);
        return;
      }
    }

    toast({ title: 'Success', description: 'Opening hours updated successfully' });
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Opening Hours</h1>
          <p className="text-muted-foreground">Configure your restaurant's operating hours</p>
        </div>
        <Button onClick={saveHours} disabled={isSaving} className="bg-primary text-primary-foreground">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Weekly Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hours.map((hour, index) => (
              <motion.div
                key={hour.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border ${
                  hour.is_closed ? 'bg-muted/50' : 'bg-background'
                }`}
              >
                <div className="w-32 font-medium text-foreground">{hour.day_name}</div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!hour.is_closed}
                    onCheckedChange={(checked) => updateHour(hour.id, 'is_closed', !checked)}
                  />
                  <Label className="text-sm text-muted-foreground">
                    {hour.is_closed ? 'Closed' : 'Open'}
                  </Label>
                </div>

                {!hour.is_closed && (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={hour.open_time || ''}
                      onChange={(e) => updateHour(hour.id, 'open_time', e.target.value)}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={hour.close_time || ''}
                      onChange={(e) => updateHour(hour.id, 'close_time', e.target.value)}
                      className="w-32"
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OpeningHours;

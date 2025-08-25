"use client";

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type WeatherAlert = {
  sender_name: string;
  event: string;
  start: number;
  end: number;
  description: string;
  tags: string[];
};

type WeatherAlertsProps = {
  lat: number;
  lon: number;
  cityName: string;
};

export default function WeatherAlerts({ lat, lon, cityName }: WeatherAlertsProps) {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAlerts, setExpandedAlerts] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/weather/alerts?lat=${lat}&lon=${lon}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch alerts');
        }
        
        setAlerts(data.alerts || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [lat, lon]);

  const toggleAlert = (index: number) => {
    setExpandedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAlertSeverity = (event: string) => {
    const severityMap: { [key: string]: 'destructive' | 'secondary' | 'outline' } = {
      'tornado': 'destructive',
      'hurricane': 'destructive',
      'severe thunderstorm': 'destructive',
      'flood': 'destructive',
      'winter storm': 'secondary',
      'heat': 'secondary',
      'wind': 'outline',
    };
    
    const lowerEvent = event.toLowerCase();
    for (const [key, severity] of Object.entries(severityMap)) {
      if (lowerEvent.includes(key)) {
        return severity;
      }
    }
    return 'outline';
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          <span className="text-sm text-muted-foreground">Checking weather alerts...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
        <div className="flex items-center gap-2">
          <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
          <span className="text-sm text-yellow-800 dark:text-yellow-200">
            Unable to fetch weather alerts: {error}
          </span>
        </div>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className="p-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <div className="flex items-center gap-2">
          <span className="text-green-600 dark:text-green-400">✅</span>
          <span className="text-sm text-green-800 dark:text-green-200">
            No active weather alerts for {cityName}
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
            ⚠️ Weather Alerts ({alerts.length})
          </h3>
          <Badge variant="destructive">{cityName}</Badge>
        </div>
        
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Collapsible key={index}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-3 h-auto border rounded-lg hover:bg-accent"
                  onClick={() => toggleAlert(index)}
                >
                  <div className="flex items-center gap-2 text-left">
                    <Badge variant={getAlertSeverity(alert.event)}>
                      {alert.event}
                    </Badge>
                    <span className="text-sm font-medium">{alert.sender_name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(alert.start)}
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 p-3 bg-muted rounded-lg">
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Valid:</strong> {formatDateTime(alert.start)} - {formatDateTime(alert.end)}
                  </div>
                  {alert.tags && alert.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {alert.tags.map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="mt-3">
                    <strong>Description:</strong>
                    <p className="mt-1 text-sm leading-relaxed">{alert.description}</p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>
    </Card>
  );
}
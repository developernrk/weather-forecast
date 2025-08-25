import CitySearch from '@/components/weather/CitySearch';
import { Card } from '@/components/ui/card';
import { listFavoriteCities, getCurrentWeatherForCity, getForecastForCity } from '@/lib/weather';
import { ClientWeatherGrid } from '@/components/weather/ClientWeatherGrid';

export default async function Page() {
  const cities = await listFavoriteCities();

  // Add a demo city if no cities are configured
    const citiesToProcess = cities.length > 0 ? cities : [
        { id: 'demo', name: 'Hyderabad', country: 'IN', lat: 17.3850, lon: 78.4867 }
    ];

  const weatherByCityPromise = Promise.all(
    citiesToProcess.map(async (c) => {
      try {
        const [current, forecast] = await Promise.allSettled([
          getCurrentWeatherForCity(c.name, c.country ?? undefined),
          getForecastForCity(c.name, c.country ?? undefined),
        ]);

        return {
          city: c,
          current: current.status === 'fulfilled' ? current.value : null,
          forecast: forecast.status === 'fulfilled' ? forecast.value : null,
          hasError: current.status === 'rejected' || forecast.status === 'rejected'
        };
      } catch (e) {
        console.error(`Failed to fetch weather for ${c.name}:`, e);
        return { city: c, current: null, forecast: null, hasError: true };
      }
    })
  );

  const weatherByCity = await weatherByCityPromise;
  const hasUserCities = cities.length > 0;

  return (
    <div className="">
      <div className="container mx-auto p-6 space-y-8">
        <header className="space-y-2 animate-in fade-in-50 slide-in-from-top-2 duration-500">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400">
            Weather Monitor
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Track real-time conditions and a 5‑day outlook. Search and save cities for quick access.
          </p>
        </header>

        {/* Search & Add */}
        <Card className="border-none p-4 transition-shadow animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
          <CitySearch />
        </Card>



        {/* Demo Banner - Show if displaying demo city */}
        {!hasUserCities && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 animate-in fade-in-50 slide-in-from-bottom-3 duration-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-600 dark:text-blue-400 text-lg">🌤️</span>
              <h3 className="font-semibold text-blue-800 dark:text-blue-200">Demo Mode</h3>
            </div>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              Welcome to Weather Dashboard! We're showing London as a demo. Use the search above to add your favorite cities.
            </p>
          </div>
        )}

        {/* Weather Grid */}
        <ClientWeatherGrid initialWeatherData={weatherByCity} />
      </div>
    </div>
  );
}

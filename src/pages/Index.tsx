import { Helmet } from 'react-helmet-async';

import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Zap, Sparkles, Home, Boxes, PackageOpen } from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const Index = () => {


  const { user } = useCurrentUser();

  // if (user) {
  //   return <Navigate to="/inventory" replace />;
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <Helmet>
        <title>Stock Yo Space - Smart Home Inventory Tracker</title>
        <meta name="description" content="Decentralized, private-first inventory management for your home. Track pantry, freezer, and household items with real-time sync." />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.stockyospace.com/" />
        <meta property="og:title" content="Stock Yo Space - Smart Inventory" />
        <meta property="og:description" content="Secure, offline-first home inventory tracking powered by Nostr." />
        <meta property="og:image" content="https://www.stockyospace.com/pwa-512x512.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary" />
        <meta property="twitter:url" content="https://www.stockyospace.com/" />
        <meta property="twitter:title" content="Stock Yo Space" />
        <meta property="twitter:description" content="Secure, offline-first home inventory tracking powered by Nostr." />
        <meta property="twitter:image" content="https://www.stockyospace.com/pwa-512x512.png" />

        {/* LD-JSON (AEO - Answer Engine Optimization) */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Stock Yo Space",
            "operatingSystem": "Web",
            "applicationCategory": "ProductivityApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "A decentralized, privacy-focused home inventory tracker that works offline and syncs via Nostr relays.",
            "featureList": "Inventory Tracking, Shopping List, Offline Mode, E2E Encryption",
            "author": {
              "@type": "Organization",
              "name": "Murdawk Media",
              "url": "https://murdawkmedia.com"
            }
          })}
        </script>
      </Helmet>

      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="relative max-w-7xl mx-auto px-4 py-12 sm:py-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-block p-4 bg-gradient-to-br from-primary to-indigo-600 rounded-2xl shadow-xl mb-6">
            <Home className="h-12 w-12 text-white" />
          </div>

          <h1 className="text-6xl sm:text-7xl font-bold bg-gradient-to-r from-slate-900 via-primary to-indigo-600 bg-clip-text text-transparent mb-6">
            Stock Yo Space
          </h1>

          <p className="text-2xl sm:text-3xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-10 font-light">
            Know what you have. Know what you need. Keep your home perfectly stocked.
          </p>

          {/* Most Important Action */}
          <div className="mb-16">
            {user ? (
              <div className="space-y-4">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full px-8 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all scale-110 hover:scale-115 bg-gradient-to-r from-primary to-indigo-600"
                >
                  <Link to="/inventory">
                    Go to Dashboard
                    <Package className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <p className="text-sm text-slate-500">
                  Welcome back! You are logged in.
                </p>
              </div>
            ) : (
              <>
                <LoginArea className="mx-auto scale-125" />
                <p className="text-sm text-slate-500 mt-4">
                  Login or create account to start managing your household inventory
                </p>
              </>
            )}
          </div>
        </div>

        {/* Value Propositions */}
        <div className="grid lg:grid-cols-3 gap-8 mb-20">
          <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mb-3">
                <Boxes className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl">Complete Home Tracker</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <p>✓ Kitchen, pantry, bathroom, garage, and more</p>
                <p>✓ Baby supplies, food, household essentials</p>
                <p>✓ Future: Furniture, automotive, and assets</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center mb-3">
                <PackageOpen className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl">Smart Shopping</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <p>✓ Automatic shopping list generation</p>
                <p>✓ Real-time sync across all devices</p>
                <p>✓ Categories with priority-based sorting</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-3">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl">Always in Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <p>✓ Powered by Nostr for instant updates</p>
                <p>✓ Decentralized and secure by design</p>
                <p>✓ Private - your data stays yours</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Use Cases */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-900 dark:text-white">
            One Tracker for Your Complete Household
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500/10 to-teal-600/10">
              <CardHeader>
                <CardTitle className="text-lg">Kitchen & Pantry</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <p>• Spices, oils, condiments</p>
                  <p>• Cereal, pasta, canned goods</p>
                  <p>• Coffee, tea, beverages</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500/10 to-indigo-600/10">
              <CardHeader>
                <CardTitle className="text-lg">Nursery & Kids</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <p>• Diapers, wipes, formula</p>
                  <p>• Baby food, rash cream</p>
                  <p>• Toys, school supplies</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500/10 to-orange-600/10">
              <CardHeader>
                <CardTitle className="text-lg">Freezer & Fridge</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <p>• Meats, vegetables</p>
                  <p>• Dairy, leftovers</p>
                  <p>• Ice cream, frozen meals</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500/10 to-pink-600/10">
              <CardHeader>
                <CardTitle className="text-lg">Household & More</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <p>• Paper towels, cleaning supplies</p>
                  <p>• Pet food, medicine</p>
                  <p>• Future: Furniture, auto parts</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How It Works */}
        <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-2xl mb-2">
              <Sparkles className="h-6 w-6 inline mr-2 text-primary" />
              How It Works
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Three simple steps to total home inventory control
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-white font-bold text-xl">1</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Add Your Items</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Create your inventory. Set categories, quantities, and minimum thresholds.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-white font-bold text-xl">2</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Track & Tally</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Use quick + and - buttons when you use or restock items. Easy one-tap logging.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-white font-bold text-xl">3</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Shop Smarter</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Items auto-add to shopping list when low. Check off as you shop.
                </p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <LoginArea className="mx-auto" />
            </div>

            <div className="mt-8 text-xs text-slate-500 text-center opacity-75">
              Privacy-first design using Nostr protocol. Your data belongs to you.
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Built with ❤️ for organized homes everywhere
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Powered by Nostr • Real-time sync • Open source
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Stepper } from '@/components/Stepper'
import { ReviewSheet } from '@/components/ReviewSheet'
import { LivePricingSidebar } from '@/components/LivePricingSidebar'
import { CompletedUnitsGallery } from '@/components/CompletedUnitsGallery'
import { StickyActions } from '@/components/Layout/StickyActions'
import { 
  loadConfiguration, 
  saveConfiguration, 
  validateStep,
  parseQueryToConfig,
  configToQuery,
  isDemoMode,
  clearConfiguration
} from '@/lib/configurationStore'
import { calculatePricing } from '@/lib/configurationStore'
import { getChassis, getBodies, getOptions, getIncentives } from '@/api/routes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Home, RotateCcw } from 'lucide-react'

export function ConfiguratorReview() {
  const navigate = useNavigate()
  const location = useLocation()
  const [configuration, setConfiguration] = useState(() => {
    // Deep-merge URL params onto saved config so we don't lose nested values
    const base = loadConfiguration()
    const params = new URLSearchParams(location.search)
    if (params.toString()) {
      const parsed = parseQueryToConfig(params)
      return {
        ...base,
        ...parsed,
        chassis: { ...(base.chassis || {}), ...(parsed.chassis || {}) },
        pricing: { ...(base.pricing || {}), ...(parsed.pricing || {}) },
        financing: { ...(base.financing || {}), ...(parsed.financing || {}) },
        bodySpecs: { ...(base.bodySpecs || {}), ...(parsed.bodySpecs || {}) },
        bodyAccessories: parsed.bodyAccessories?.length ? parsed.bodyAccessories : (base.bodyAccessories || []),
      }
    }
    return base
  })

  // Always position view at top on step entry
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  const [orderSubmitted, setOrderSubmitted] = useState(false)

  // Redirect to first incomplete step instead of jumping to step 1 always
  useEffect(() => {
    if (isDemoMode()) return
    const cfg = configuration
    if (!cfg.bodyType) {
      navigate('/configurator/chassis-selection')
      return
    }
    if (cfg.bodyType !== 'Chassis Only' && !cfg.bodyManufacturer) {
      navigate('/configurator/body-type?' + configToQuery(cfg))
      return
    }
    if (!cfg.chassis?.series) {
      navigate('/configurator/chassis-options?' + configToQuery(cfg))
      return
    }
    if (cfg.bodyType !== 'Chassis Only' && !cfg.upfitter) {
      navigate('/configurator/upfitter?' + configToQuery(cfg))
      return
    }
    if (!cfg.pricing?.total || cfg.pricing.total === 0) {
      navigate('/configurator/pricing?' + configToQuery(cfg))
      return
    }
  }, [configuration, navigate])

  // Update URL when configuration changes
  useEffect(() => {
    const query = configToQuery(configuration)
    const newUrl = `${location.pathname}?${query}`
    window.history.replaceState(null, '', newUrl)
  }, [configuration, location.pathname])

  // Ensure pricing snapshot exists and mirrors current configuration
  useEffect(() => {
    const ensurePricing = async () => {
      try {
        const [chassisData, bodiesData, optionsData] = await Promise.all([
          getChassis(),
          getBodies(),
          getOptions()
        ])
        // Base prices
        const base = calculatePricing(configuration, chassisData, bodiesData, optionsData)

        // Incentives identical to Step 6
        const filters = {
          powertrain: configuration.chassis?.powertrain?.includes('diesel') ? 'diesel' : 
                     configuration.chassis?.powertrain?.includes('ev') ? 'ev' : 'gas',
          series: configuration.chassis?.series,
          bodyType: configuration.bodyType,
          units: configuration.units || 1,
          state: 'MI'
        }
        const incentivesData = await getIncentives(filters)
        const selectedIds = configuration.pricing?.incentives || []
        const totalIncentives = selectedIds.reduce((sum, id) => {
          const inc = incentivesData.incentives.find(i => i.id === id)
          return sum + (inc?.amount || 0)
        }, 0)

        const freight = 1500
        const subtotal = base.chassisMSRP + base.bodyPrice + base.optionsPrice + base.laborPrice + freight
        const taxes = Math.round((subtotal - totalIncentives) * 0.0875)
        const total = subtotal - totalIncentives + taxes

        const latest = {
          ...base,
          subtotal,
          taxes,
          total,
          freight,
          totalIncentives,
          incentives: selectedIds
        }

        const needsUpdate = !configuration.pricing || configuration.pricing.total !== latest.total
        if (needsUpdate) {
          const updated = { ...configuration, pricing: latest }
          saveConfiguration(updated)
          setConfiguration(updated)
        }
      } catch (e) {
        console.error('Error ensuring pricing on review:', e)
      }
    }
    if (configuration.chassis?.series) {
      ensurePricing()
    }
  }, [configuration.chassis?.series, configuration.bodyType, configuration.bodySpecs, configuration.bodyAccessories, configuration.pricing?.incentives, configuration.units])

  const handleBack = () => {
    if (!orderSubmitted) {
      navigate('/configurator/pricing?' + configToQuery(configuration))
    }
  }

  const handleStartNew = () => {
    clearConfiguration()
    navigate('/configure')
  }

  const handleReturnHome = () => {
    navigate('/')
  }

  // Mark step as completed
  useEffect(() => {
    if (!configuration.completedSteps?.includes(7)) {
      const updated = {
        ...configuration,
        completedSteps: [...new Set([...configuration.completedSteps, 7])]
      }
      saveConfiguration(updated)
      setConfiguration(updated)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Stepper currentStep={7} completedSteps={configuration.completedSteps} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <Card>
              <CardHeader>
                <CardTitle>Step 7: Review & Submit</CardTitle>
                <CardDescription>
                  Review your complete configuration and submit your order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReviewSheet configuration={configuration} />
              </CardContent>
            </Card>

            {/* Completed Units Gallery */}
            <CompletedUnitsGallery
              selectedChassis={configuration.chassis?.series}
              selectedBodyType={configuration.bodyType}
              className="mt-8"
              title="Your Final Build"
            />
          </div>

          {/* Live Pricing Sidebar */}
          <LivePricingSidebar configuration={configuration} />
        </div>

        {/* Additional Actions after order submission */}
        {orderSubmitted && (
          <Card className="mt-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleStartNew} variant="outline" className="flex-1">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Start New Configuration
                </Button>
                <Button onClick={handleReturnHome} variant="outline" className="flex-1">
                  <Home className="w-4 h-4 mr-2" />
                  Return to Marketplace
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {!orderSubmitted && (
        <StickyActions
          onBack={handleBack}
          showContinue={false}
        />
      )}
    </div>
  )
}
